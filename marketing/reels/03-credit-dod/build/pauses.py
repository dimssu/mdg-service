#!/usr/bin/env python3
"""List the internal quiet stretches (>=120 ms below -45 dB, 5 ms frames) of each voice take.
usage: python3 pauses.py audio/L1.wav [...]"""
import sys, subprocess, numpy as np
SR=44100
for p in sys.argv[1:]:
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    x=np.frombuffer(raw,dtype=np.float32)
    f=int(0.005*SR); n=len(x)//f
    db=20*np.log10(np.sqrt((x[:n*f].reshape(n,f)**2).mean(1))+1e-9)
    q=db<-45
    runs=[];i=0
    while i<n:
        if q[i]:
            j=i
            while j<n and q[j]: j+=1
            if (j-i)*0.005>=0.12: runs.append((i*0.005,j*0.005,db[i:j].max()))
            i=j
        else: i+=1
    print(p, 'len %.3f'%(len(x)/SR), ' | '.join('%.3f-%.3f (%.0f ms, max %.0f dB)'%(a,b,(b-a)*1000,m) for a,b,m in runs))
