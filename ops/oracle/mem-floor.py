#!/usr/bin/env python3
"""Keep this box's memory use above Oracle's idle line, without ever hurting the apps.

Why: Oracle reclaims an Always Free Arm VM that, over 7 days, stays under 20% on
CPU (95th pct), network AND memory. Both backends together use ~12% of 12 GB, so
production alone would look "idle". Holding locked memory keeps the box's
memory utilisation near TARGET_PCT — one of the three is enough to not be idle.

How it stays safe:
  * Adaptive: every INTERVAL_S it re-reads /proc/meminfo and grows or shrinks
    its own blocks so (MemTotal - MemAvailable) sits at TARGET_PCT. When the apps
    use more, it gives memory back.
  * Never squeezes: it will not hold memory that would leave MemAvailable under
    MIN_FREE_MIB.
  * First to die: systemd gives it OOMScoreAdjust=1000, so if the kernel ever has
    to kill something it is this, never the API.
  * Locked (mlock) so the kernel cannot quietly swap it out and make the box look
    idle again.
"""
import ctypes
import mmap
import os
import signal
import sys
import time

TARGET_PCT = float(os.environ.get("TARGET_PCT", "35"))
MIN_FREE_MIB = int(os.environ.get("MIN_FREE_MIB", "4096"))
CHUNK_MIB = int(os.environ.get("CHUNK_MIB", "128"))
INTERVAL_S = int(os.environ.get("INTERVAL_S", "30"))
PAGE = mmap.PAGESIZE
libc = ctypes.CDLL("libc.so.6", use_errno=True)
libc.mlock.argtypes = [ctypes.c_void_p, ctypes.c_size_t]

chunks = []  # list of (mmap, locked)


def meminfo():
    d = {}
    with open("/proc/meminfo") as f:
        for line in f:
            k, v = line.split(":", 1)
            d[k] = int(v.split()[0]) // 1024  # MiB
    return d["MemTotal"], d["MemAvailable"]


def grab():
    size = CHUNK_MIB * 1024 * 1024
    m = mmap.mmap(-1, size, flags=mmap.MAP_PRIVATE | mmap.MAP_ANONYMOUS)
    for off in range(0, size, PAGE):  # touch every page so it is really resident
        m[off] = 1
    addr = ctypes.addressof(ctypes.c_char.from_buffer(m))
    locked = libc.mlock(ctypes.c_void_p(addr), ctypes.c_size_t(size)) == 0
    chunks.append((m, locked))


def give_back():
    m, _ = chunks.pop()
    m.close()  # munmap also unlocks


def log(msg):
    print(msg, flush=True)


def main():
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    last_count = None
    while True:
        total, avail = meminfo()
        held = len(chunks) * CHUNK_MIB
        target_used = total * TARGET_PCT / 100
        want = held + (target_used - (total - avail))      # MiB we should hold
        want = min(want, held + (avail - MIN_FREE_MIB))   # never eat into the floor
        want = max(0, int(want // CHUNK_MIB))
        while len(chunks) < want:
            grab()
        while len(chunks) > want:
            give_back()
        if len(chunks) != last_count:
            total, avail = meminfo()
            log(f"holding {len(chunks) * CHUNK_MIB} MiB "
                f"({sum(1 for _, l in chunks if l)}/{len(chunks)} blocks locked); "
                f"box memory used {100 * (total - avail) / total:.1f}%, free {avail} MiB")
            last_count = len(chunks)
        time.sleep(INTERVAL_S)


if __name__ == "__main__":
    main()
