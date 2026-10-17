#!/usr/bin/env python3
"""Evaluate a music bed against the 128 BPM / 16-bar grid (beat 0.46875 s, bar 1.875 s). numpy only.
usage: python3 analyze-bed.py audio/bed-1.mp3[:OFFSET] [more]   (OFFSET = where the file's 0 s sits on the reel timeline, default 0)
Prints per-bar energy and brightness, comb-fit tempo + beat phase per span, the F vs F# chroma around the turn,
and the biggest onsets near the planned section starts (5.625, 16.875, 18.75, 20.625, 26.25)."""
import subprocess, sys, numpy as np
SR = 22050; BEAT = 60/128; BAR = 4*BEAT
def load(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)
def level(x, w=0.002):
    k = int(w*SR); e = np.sqrt(np.convolve(x**2, np.ones(k)/k, mode='same')); return 20*np.log10(e+1e-9)
def attack(le, ms=4):
    k = int(ms/1000*SR); d = np.zeros_like(le); d[k:] = le[k:]-le[:-k]; return d
def comb(d, t0, t1, bpm_lo=124, bpm_hi=132):
    best = None
    for bpm in np.arange(bpm_lo, bpm_hi+0.001, 0.1):
        per = 60/bpm
        for ph in np.arange(0, per, 0.004):
            ts = np.arange(t0+ph, t1, per); idx = (ts*SR).astype(int)
            sc = np.mean([d[max(0,i-int(0.02*SR)):i+int(0.02*SR)].max() for i in idx])
            if best is None or sc > best[0]: best = (sc, bpm, ph)
    return best
CH = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
def chroma(x, t0, t1):
    seg = x[int(t0*SR):int(t1*SR)]; n = 8192; hop = 4096
    if len(seg) < n: seg = np.pad(seg, (0, n-len(seg)))
    fr = 1 + (len(seg)-n)//hop; idx = np.arange(n)[None,:] + hop*np.arange(fr)[:,None]
    S = np.abs(np.fft.rfft(seg[idx]*np.hanning(n), axis=1)); f = np.fft.rfftfreq(n, 1/SR); keep = (f>90)&(f<2200)
    pc = (np.round(69+12*np.log2(f[keep]/440.0)).astype(int))%12; out = np.zeros(12)
    for r in S:
        v = np.sqrt(r[keep]); c = np.bincount(pc, weights=v, minlength=12); out += c/(c.sum()+1e-12)
    return out/(out.sum()+1e-12)
for arg in sys.argv[1:]:
    p, _, off = arg.partition(':'); OFF = float(off or 0)
    x = load(p); dur = len(x)/SR; le = level(x); d = attack(le)
    print(f'\n=== {p}  {dur:.3f} s  (file 0 = reel {OFF})')
    print('bar  t0      rms dB  centroid Hz  >1k%   | chroma D F F# A')
    S_n = 2048
    for b in range(int(dur//BAR)+1):
        t0, t1 = b*BAR, min(dur, (b+1)*BAR)
        seg = x[int(t0*SR):int(t1*SR)]
        if len(seg) < 512: continue
        rms = 20*np.log10(np.sqrt(np.mean(seg**2))+1e-9)
        sp = np.abs(np.fft.rfft(seg[:len(seg)//S_n*S_n].reshape(-1,S_n)*np.hanning(S_n), axis=1)) if len(seg)>=S_n else np.abs(np.fft.rfft(np.pad(seg,(0,S_n-len(seg)))*np.hanning(S_n)))[None,:]
        fq = np.fft.rfftfreq(S_n, 1/SR); pw = (sp**2).sum(0)
        cen = (pw*fq).sum()/(pw.sum()+1e-12); hi = pw[fq>1000].sum()/(pw.sum()+1e-12)*100
        ch = chroma(x, t0, t1)
        print(f'{b+1:>3}  {t0:6.3f}  {rms:7.1f}  {cen:9.0f}  {hi:5.1f}  | {ch[2]:.2f} {ch[5]:.2f} {ch[6]:.2f} {ch[9]:.2f}')
    for name,(a,b) in {'1-10 s':(1,10),'8-11 s':(8,11),'14-20 s':(14,20)}.items():
        if b > dur: continue
        sc, bpm, ph = comb(d, a, b)
        per = 60/bpm; first = a+ph
        off = (first/BEAT) % 1
        ts = np.arange(a+ph+per/4, b, per); idx = (ts*SR).astype(int)
        offsc = np.mean([d[max(0,i-int(0.02*SR)):i+int(0.02*SR)].max() for i in idx])
        print(f'comb {name}: {bpm:.1f} BPM, first beat {first:.3f}s, phase vs 0.46875 grid {((first%BEAT) if (first%BEAT)<BEAT/2 else (first%BEAT)-BEAT)*1000:+.0f} ms, pulse {sc:.1f} dB vs off-beat {offsc:.1f} dB')
    for ts in [t-OFF for t in (5.625, 16.875, 18.75, 20.625, 24.375, 26.25) if t-OFF > 0.4]:
        a, b = int((ts-0.35)*SR), int((ts+0.35)*SR); i = a+np.argmax(d[a:b])
        print(f'  biggest attack within +-0.35 s of file {ts:6.3f} (reel {ts+OFF:6.3f}): at {i/SR:.3f} s ({(i/SR-ts)*1000:+.0f} ms), +{d[i]:.0f} dB')
    print('  energy per beat 4.5-7.5 s:', ' '.join(f'{np.mean(le[int(t*SR):int((t+BEAT)*SR)]):.0f}' for t in np.arange(4.5, 7.5, BEAT)))
