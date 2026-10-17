#!/usr/bin/env python3
"""Crude F0 contour (autocorrelation, 40 ms frames) of the last 0.5 s of speech of each take: does the line end falling (statement) or rising (question)?
usage: python3 f0.py audio/L3.wav [...]"""
import sys, subprocess, numpy as np
SR = 22050
def f0(x, lo=70, hi=330):
    x = x - x.mean()
    if np.sqrt(np.mean(x**2)) < 0.01: return None
    ac = np.correlate(x, x, 'full')[len(x)-1:]; ac /= ac[0] + 1e-12
    a, b = int(SR/hi), int(SR/lo); k = a + np.argmax(ac[a:b])
    return SR/k if ac[k] > 0.35 else None
for p in sys.argv[1:]:
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    y = np.frombuffer(raw, dtype=np.float32)
    # speech end = last frame above -42 dB
    f = int(0.01*SR); n = len(y)//f; e = 20*np.log10(np.sqrt((y[:n*f].reshape(n, f)**2).mean(1))+1e-9)
    end = (np.where(e > -42)[0].max()+1)*f/SR
    out = []
    for t in np.arange(max(0, end-0.6), end-0.03, 0.05):
        v = f0(y[int(t*SR):int((t+0.04)*SR)]); out.append('%.0f' % v if v else '--')
    print(p.split('/')[-1], 'speech end %.2f' % end, ' last 0.6 s F0 (Hz, 50 ms steps):', ' '.join(out))
