"""
Follows one small mark through a clip and paints it out — for a maker's logo on
a laptop lid that drifts with the camera (S53), where a fixed delogo box would
have to be as big as the whole drift.

    python painttrack.py IN OUT X Y SIZE [AT]   # the mark's centre and width in frame AT (default 0);
                                                # it is followed both ways from there
    python painttrack.py IN OUT --plate X0 Y0 X1 Y1
        # replace a box in every frame with the same box from frame 0,
        # feathered on the sides that are not the frame edge (S19's sky:
        # a smoke plume Veo drew behind the tanker)

The mark is followed with its own look from frame 0 (normalised correlation on a
high-passed picture, searched near the last place), and inpainted with an
ellipse a little larger than it.

Needs OpenCV and ffmpeg (see unsparkle.py).
"""
import subprocess
import sys

import cv2
import numpy as np


def hp(g):
    g = g.astype(np.float32)
    return g - cv2.GaussianBlur(g, (0, 0), 6)


def read(src):
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    return frames, fps


def write(dst, frames, fps):
    h, w = frames[0].shape[:2]
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                            '-s', f'{w}x{h}', '-r', str(fps), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', dst],
                           stdin=subprocess.PIPE)
    for f in frames:
        enc.stdin.write(f.tobytes())
    enc.stdin.close()
    enc.wait()


def plate(frames, x0, y0, x1, y1):
    H, W = frames[0].shape[:2]
    src = frames[0][y0:y1, x0:x1].astype(np.float32)
    m = np.ones((y1 - y0, x1 - x0), np.float32)
    f = 16
    if x0 > 0: m[:, :f] = 0
    if y0 > 0: m[:f, :] = 0
    if x1 < W: m[:, -f:] = 0
    if y1 < H: m[-f:, :] = 0
    m = cv2.GaussianBlur(m, (0, 0), 8)
    if x0 == 0: m[:, :f] = m[:, f:f + 1]
    if y0 == 0: m[:f, :] = m[f:f + 1, :]
    if x1 == W: m[:, -f:] = m[:, -f - 1:-f]
    if y1 == H: m[-f:, :] = m[-f - 1:-f, :]
    m = m[..., None]
    out = [frames[0]]
    for fr in frames[1:]:
        fr = fr.copy()
        roi = fr[y0:y1, x0:x1].astype(np.float32)
        fr[y0:y1, x0:x1] = (src * m + roi * (1 - m)).astype(np.uint8)
        out.append(fr)
    return out


def track(frames, x, y, size, at=0):
    H, W = frames[0].shape[:2]
    r = size // 2 + 6
    grays = [hp(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)) for f in frames]
    t = grays[at][y - r:y + r + 1, x - r:x + r + 1].copy()
    pos = [None] * len(frames)
    pos[at] = (x, y)
    for step in (1, -1):
        cx, cy = x, y
        i = at + step
        while 0 <= i < len(frames):
            s = 26
            x0, y0 = max(cx - r - s, 0), max(cy - r - s, 0)
            win = grays[i][y0:min(cy + r + s + 1, H), x0:min(cx + r + s + 1, W)]
            if win.shape[0] > t.shape[0] and win.shape[1] > t.shape[1]:
                res = cv2.matchTemplate(win, t, cv2.TM_CCOEFF_NORMED)
                _, sc, _, loc = cv2.minMaxLoc(res)
                if sc > 0.3:
                    cx, cy = x0 + loc[0] + r, y0 + loc[1] + r
            pos[i] = (cx, cy)
            i += step
    out = []
    for fr, (px, py) in zip(frames, pos):
        mask = np.zeros((H, W), np.uint8)
        cv2.ellipse(mask, (int(px), int(py)), (int(size * 0.75), int(size * 0.75)), 0, 0, 360, 255, -1)
        out.append(cv2.inpaint(fr, mask, 4, cv2.INPAINT_TELEA))
    return out


def main():
    src, dst = sys.argv[1], sys.argv[2]
    frames, fps = read(src)
    if sys.argv[3] == '--plate':
        x0, y0, x1, y1 = map(int, sys.argv[4:8])
        frames = plate(frames, x0, y0, x1, y1)
    else:
        x, y, size = map(int, sys.argv[3:6])
        at = int(sys.argv[6]) if len(sys.argv) > 6 else 0
        frames = track(frames, x, y, size, at)
    write(dst, frames, fps)
    print(f'{src} -> {dst}: {len(frames)} frames')


if __name__ == '__main__':
    main()
