#!/usr/bin/env python3
"""How far each strong attack of a bed sits from the 0.5 s beat grid (ms; + = late).
usage: python3 check-grid.py audio/bed-final.wav [t_from t_to]"""
import numpy as np, subprocess, sys
SR = 44100; BEAT = 60/120
raw = subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
m = np.frombuffer(raw, dtype=np.float32)
a0 = float(sys.argv[2]) if len(sys.argv) > 2 else 5.5
a1 = float(sys.argv[3]) if len(sys.argv) > 3 else 26.0
w = int(0.002*SR); e = np.sqrt(np.convolve(m**2, np.ones(w)/w, mode='same')); le = 20*np.log10(e+1e-9)
k = int(0.004*SR); d = np.zeros_like(le); d[k:] = le[k:]-le[:-k]
offs = []; line = []
for n in range(int(np.ceil(a0/BEAT)), int(a1/BEAT)+1):
    c = n*BEAT
    a, b = int((c-0.06)*SR), int((c+0.06)*SR); i = a+np.argmax(d[a:b]); off = (i/SR-c)*1000
    offs.append(off); line.append(f'{c:6.2f}:{off:+4.0f}({d[i]:.0f})')
print(' '.join(line))
offs = np.array(offs); print(f'median {np.median(offs):+.0f} ms, mean {offs.mean():+.0f} ms, max |off| {np.abs(offs).max():.0f} ms, within 25 ms: {(np.abs(offs)<=25).mean()*100:.0f}%')
