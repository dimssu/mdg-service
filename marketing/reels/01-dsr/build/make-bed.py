#!/usr/bin/env python3
"""Builds audio/bed-final.wav (30.000 s, 44.1 kHz stereo float) from music take 2, and the phone-safe hits.

Why not use take 2 as it came: the model put its first big groove arrival at raw 8.81 s (planned 6.0) with a
near-silent gap before it, and its whole beat grid sits 0.314 s off the 0.5 s grid (strong beats on 8.814 + 0.5004 n,
tempo 119.9 BPM). So:
  1. DELAY  the take by 0.186 s -> its beats land on the 0.5 s grid (9.000, 9.500 ...) and its three section
     accents land on 18.0 / 22.0 / 26.0 (build, payoff, sting).
  2. TURN   at 6.0 the sparse opening (take 2, 0-6 s) is cut and a 3-second bit of the same groove
     (delayed take 10.0-12.97 s) is laid at 6.0-8.97, so the strong beat is ON bar 4's downbeat, the kick is on 7.0
     (the hard cut), and the real arrival (8.99) carries on from it without a gap.
  3. SHAPE  the build/payoff bar levels so energy rises 18-26 s (take 2's payoff was quieter than its build).
Everything is deterministic: run again, same file.
"""
import subprocess, numpy as np, sys, os
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda f: os.path.join(HERE, 'audio', f)

DELAY = 0.186          # seconds: first strong beat 8.814 -> 9.000
P_SRC = (9.995, 12.97) # delayed-take span used as the pre-roll (strong hit at 10.001, kicks 11.0 / 12.0)
P_AT = 5.995           # where the pre-roll starts in the final bed (strong hit lands on 6.0)
A_END = 5.995          # opening is cut here
XF = 0.02              # cross-fade at the 8.97 seam
GAINS = [(18.0, 20.0, -3.0), (20.0, 22.0, -2.0), (22.0, 24.0, +4.0), (24.0, 26.0, +3.5)]  # dB per bar
RAMP = 0.15

raw = subprocess.run(['ffmpeg','-v','error','-i',A('bed-2.mp3'),'-ac','2','-ar',str(SR),'-f','f32le','-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
N = int(30 * SR)
D = np.zeros((N + SR, 2), dtype=np.float32)
d0 = int(round(DELAY * SR))
n = min(len(x), len(D) - d0)
D[d0:d0 + n] = x[:n]

def seg(a, b): return D[int(round(a * SR)):int(round(b * SR))].copy()
def fade(s, fin=0.0, fout=0.0):
    s = s.copy()
    if fin > 0:
        k = int(fin * SR); s[:k] *= np.sin(np.linspace(0, np.pi / 2, k))[:, None]
    if fout > 0:
        k = int(fout * SR); s[-k:] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None]
    return s

out = np.zeros((N, 2), dtype=np.float32)
# opening
a = fade(seg(0, A_END), fout=0.02)
out[:len(a)] += a
# pre-roll P
p = fade(seg(*P_SRC), fin=0.004, fout=XF)
i0 = int(round(P_AT * SR)); out[i0:i0 + len(p)] += p
seam = P_AT + (P_SRC[1] - P_SRC[0])            # = 8.975
# the real groove from just before its arrival
g0 = seam - XF
g = fade(seg(g0, 30.0), fin=XF)
j0 = int(round(g0 * SR)); out[j0:j0 + len(g)] += g[:N - j0]

# bar levels
t = np.arange(N) / SR
gdb = np.zeros(N)
for (s, e, db) in GAINS:
    ramp_in = np.clip((t - s) / RAMP, 0, 1); ramp_out = np.clip((e - t) / RAMP, 0, 1)
    gdb += db * np.minimum(ramp_in, ramp_out)
out *= (10 ** (gdb / 20))[:, None].astype(np.float32)

# verification printout
def rms(a, b):
    s = out[int(a * SR):int(b * SR)]; return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-9)
print('bar RMS (dB):', ' '.join(f'{b + 1}:{rms(2 * b, 2 * b + 2):.1f}' for b in range(15)))
print('peak %.2f dBFS' % (20 * np.log10(np.abs(out).max())))

dst = A('bed-final.wav')
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','pcm_f32le',dst],
               input=out.tobytes(), check=True)
print('->', dst)

# phone-safe hits: the organic hits are almost pure sub-bass (20-120 Hz) and vanish on a phone speaker.
# Add a saturated copy high-passed at 110 Hz so the hit has body at 110-1000 Hz without touching the original.
REPO = os.path.abspath(os.path.join(HERE, '../../../..'))
SND = os.path.join(REPO, 'marketing/films/short/sound')
for name, boost, mix_db in (('subhit', 24, -9), ('brandhit', 20, -9)):
    fc = (f"[0:a]asplit=2[a][b];[b]volume={boost}dB,asoftclip=type=tanh,highpass=f=110,highpass=f=110,"
          f"volume={mix_db}dB[h];[a][h]amix=inputs=2:normalize=0,alimiter=limit=0.89[o]")
    subprocess.run(['ffmpeg','-v','error','-y','-i',os.path.join(SND, name + '.mp3'),'-filter_complex',fc,'-map','[o]',
                    '-ar',str(SR),'-ac','1','-c:a','pcm_s16le',A(name + '-phone.wav')], check=True)
    print('->', A(name + '-phone.wav'))
