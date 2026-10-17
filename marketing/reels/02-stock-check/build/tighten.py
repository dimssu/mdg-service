#!/usr/bin/env python3
"""Shortens the comma pauses of a few voice takes. ElevenLabs leaves a 0.35-0.84 s hole after some commas
(L1 0.84 s, L7 0.78 s) which would push the line past its bar. The cut is made INSIDE the quiet stretch
(everything cut is below -45 dB), centred, with an 8 ms cross-fade, so no word is touched.

Order: voice.mjs  ->  tighten.py  ->  words.mjs  ->  place.py
Keeps the untouched take as audio/<id>.raw.wav; re-running starts again from it (idempotent).
"""
import os, shutil, subprocess, numpy as np, sys
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda f: os.path.join(HERE, 'audio', f)

# line id -> {n-th internal quiet stretch (>= 120 ms below -45 dB) : length of pause to LEAVE, seconds}
PAUSES = {'L1': {0: 0.28}, 'L2': {0: 0.24}, 'L5': {0: 0.25}, 'L7': {0: 0.40}}
XF = 0.008

def read(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def runs(x):
    f = int(0.005*SR); n = len(x)//f
    db = 20*np.log10(np.sqrt((x[:n*f].reshape(n,f)**2).mean(1))+1e-9)
    q = db < -45; out = []; i = 0
    while i < n:
        if q[i]:
            j = i
            while j < n and q[j]: j += 1
            if (j-i)*0.005 >= 0.12: out.append((i*f, j*f))
            i = j
        else: i += 1
    return out, n*f

for lid, cuts in PAUSES.items():
    raw = A(f'{lid}.raw.wav')
    if not os.path.exists(raw): shutil.copy(A(f'{lid}.wav'), raw)
    x = read(raw)
    rs, total = runs(x)
    internal = [r for r in rs if r[1] < total - int(0.05*SR)]     # drop the trailing padding stretch
    pieces = []; cursor = 0; removed = 0.0
    for k in sorted(cuts):
        a, b = internal[k]
        keep = int(cuts[k]*SR); cut = (b-a) - keep
        if cut <= 0: continue
        c0 = a + (b-a-cut)//2
        pieces.append((cursor, c0)); cursor = c0 + cut; removed += cut/SR
        print(f'{lid}: quiet {a/SR:.3f}-{b/SR:.3f} ({(b-a)/SR*1000:.0f} ms) -> {keep/SR*1000:.0f} ms, cut {cut/SR*1000:.0f} ms at {c0/SR:.3f}')
    pieces.append((cursor, len(x)))
    out = x[pieces[0][0]:pieces[0][1]]
    xf = int(XF*SR); ramp = np.linspace(0, 1, xf, dtype=np.float32)
    for (s, e) in pieces[1:]:
        seg = x[s:e]
        out = np.concatenate([out[:-xf], out[-xf:]*(1-ramp) + seg[:xf]*ramp, seg[xf:]])
    # keep the file length convention of voice.mjs (padded file) by padding the removed time back as silence at the end
    pad = int(round(removed*SR)) - xf*(len(pieces)-1)
    out = np.concatenate([out, np.zeros(max(0, pad), dtype=np.float32)])
    pcm = (np.clip(out, -1, 1)*32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(SR),'-ac','1','-i','-','-c:a','pcm_s16le',A(f'{lid}.wav')], input=pcm, check=True)
print('done')
