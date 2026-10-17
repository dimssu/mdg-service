#!/usr/bin/env python3
"""Comb fit of a bed's attacks: best tempo (112-128 BPM) and beat phase over a time span, and how sharp the pulse is.
usage: python3 grid-fit.py audio/bed-1.mp3 8 26"""
import numpy as np, subprocess, sys
SR=22050
raw=subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
m=np.frombuffer(raw,dtype=np.float32)
t0=float(sys.argv[2]); t1=float(sys.argv[3])
w=int(0.003*SR); e=np.sqrt(np.convolve(m**2,np.ones(w)/w,mode='same')); le=20*np.log10(e+1e-9)
k=int(0.006*SR); d=np.zeros_like(le); d[k:]=np.maximum(0,le[k:]-le[:-k])
best=None
for bpm in np.arange(112,128.01,0.1):
    per=60/bpm
    for ph in np.arange(0,per,0.005):
        ts=np.arange(t0+ph,t1,per); idx=(ts*SR).astype(int)
        sc=np.mean([d[max(0,i-int(0.02*SR)):i+int(0.02*SR)].max() for i in idx])
        if best is None or sc>best[0]: best=(sc,bpm,ph)
sc,bpm,ph=best
# contrast: same comb shifted by a quarter beat
per=60/bpm; ts=np.arange(t0+ph+per/4,t1,per); idx=(ts*SR).astype(int)
off=np.mean([d[max(0,i-int(0.02*SR)):i+int(0.02*SR)].max() for i in idx])
first=t0+ph
print(f'{sys.argv[1]}: best comb {bpm:.1f} BPM, first beat after {t0:.0f}s at {first:.3f} s -> phase vs 0.5 s grid {first%0.5*1000:.0f} ms (or {(first%0.5-0.5)*1000:.0f}); on-beat attack {sc:.1f} dB vs quarter-beat-off {off:.1f} dB (contrast {sc-off:.1f} dB)')
