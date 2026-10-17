#!/usr/bin/env python3
"""Evaluate a music bed against the 120 BPM / 15-bar grid. numpy only.
usage: python3 analyze-bed.py audio/bed-1.mp3 [more beds]
Prints per-bar energy, tempo + beat phase, downbeat phase, mode per section, the turn at 6.0 s and the sting at 26.0 s."""
import subprocess, sys, numpy as np

SR = 22050
def load(path):
    raw = subprocess.run(['ffmpeg','-v','error','-i',path,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

def stft_mag(x, n=2048, hop=256):
    w = np.hanning(n); frames = 1 + (len(x)-n)//hop
    idx = np.arange(n)[None,:] + hop*np.arange(frames)[:,None]
    return np.abs(np.fft.rfft(x[idx]*w, axis=1)), hop

def onset_env(x):
    S, hop = stft_mag(x)
    L = np.log1p(S*50)
    flux = np.maximum(0, np.diff(L, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    return flux, hop/SR

def tempo(env, fr, lo=0.3, hi=1.0):
    e = env - env.mean()
    ac = np.correlate(e, e, 'full')[len(e)-1:]
    lags = np.arange(len(ac))*fr
    m = (lags>=lo)&(lags<=hi)
    k = np.argmax(np.where(m, ac, -1e9))
    # parabolic refine
    if 0<k<len(ac)-1:
        a,b,c = ac[k-1],ac[k],ac[k+1]; d = (a-2*b+c)
        k = k + (0.5*(a-c)/d if d!=0 else 0)
    return 60.0/(k*fr), ac

def phase_fold(env, fr, period, t0=0.0, t1=None):
    t = np.arange(len(env))*fr
    m = (t>=t0) & (t<(t1 if t1 else 1e9))
    ph = np.mod(t[m], period)
    nb = int(round(period/0.01))
    bins = np.minimum((ph/period*nb).astype(int), nb-1)
    acc = np.bincount(bins, weights=env[m], minlength=nb)/np.maximum(np.bincount(bins, minlength=nb),1)
    return acc, period/nb


def onset_times(x, lo_ms=80):
    """High-passed amplitude envelope; time of each rising transient (sample-accurate-ish)."""
    k = 24
    lp = np.convolve(x, np.ones(k)/k, mode='same')
    y = np.abs(x - lp)
    w = int(0.004*SR)
    env = np.convolve(y, np.ones(w)/w, mode='same')
    d = int(0.006*SR)
    rise = np.maximum(0, env[d:] - env[:-d]); rise = np.concatenate([np.zeros(d), rise])
    # peaks in rise with min distance
    # local threshold: 3x the running 1-second median-ish level (mean of rise over 1 s) + floor
    hw=int(0.5*SR); loc=np.convolve(rise,np.ones(2*hw)/(2*hw),mode='same')
    thr = np.maximum(loc*2.5, np.percentile(rise,50)+1e-7)
    cand = np.where((rise[1:-1]>=rise[:-2])&(rise[1:-1]>rise[2:])&(rise[1:-1]>thr[1:-1]))[0]+1
    out=[]; last=-1e9
    for c in cand:
        t=c/SR
        if t-last < lo_ms/1000:
            if out and rise[c]>rise[int(out[-1]*SR)]: out[-1]=t; last=t
            continue
        out.append(t); last=t
    # onset time = a little before the rise peak (rise is measured over d samples)
    return np.array(out) - 0.003, rise

KMAJ = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
KMIN = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
def chroma(x, t0, t1):
    seg = x[int(t0*SR):int(t1*SR)]
    n = 8192; hop = 4096
    if len(seg) < n: seg = np.pad(seg,(0,n-len(seg)))
    frames = 1 + (len(seg)-n)//hop
    idx = np.arange(n)[None,:] + hop*np.arange(frames)[:,None]
    S = np.abs(np.fft.rfft(seg[idx]*np.hanning(n), axis=1))
    f = np.fft.rfftfreq(n, 1/SR)
    keep = (f>90)&(f<2200)
    pc = (np.round(69+12*np.log2(f[keep]/440.0)).astype(int))%12
    out = np.zeros(12); 
    for fr_ in S:
        v = np.sqrt(fr_[keep])             # compress so a drone cannot swamp the chroma
        c = np.bincount(pc, weights=v, minlength=12)
        out += c/(c.sum()+1e-12)
    return out/ (out.sum()+1e-12)
def key_of(ch):
    best=None
    for tonic in range(12):
        for nm, prof in (('major',KMAJ),('minor',KMIN)):
            r = np.corrcoef(ch, np.roll(prof,tonic))[0,1]
            if best is None or r>best[0]: best=(r,NAMES[tonic]+' '+nm)
    # also report D-major vs D-minor correlation explicitly
    rmaj = np.corrcoef(ch, np.roll(KMAJ,2))[0,1]; rmin = np.corrcoef(ch, np.roll(KMIN,2))[0,1]
    return best, rmaj, rmin

def report(path):
    x = load(path); dur = len(x)/SR
    print(f'\n=== {path}  {dur:.3f} s')
    # per-bar energy (2 s)
    print('bar  t0-t1     rms dB  centroid Hz  onsets/s')
    env, fr = onset_env(x)
    S,_ = stft_mag(x); freqs = np.fft.rfftfreq(2048,1/SR)
    nb = int(dur//2)
    for b in range(nb):
        t0,t1=b*2,(b+1)*2
        seg=x[int(t0*SR):int(t1*SR)]
        rms=20*np.log10(np.sqrt(np.mean(seg**2))+1e-9)
        sf = S[int(t0*SR/256):int(t1*SR/256)]
        cen=(sf*freqs).sum()/(sf.sum()+1e-9)
        e = env[int(t0/fr):int(t1/fr)]
        peaks = ((e[1:-1]>e[:-2])&(e[1:-1]>=e[2:])&(e[1:-1]>e.mean()+1.0*e.std())).sum()
        print(f'{b+1:>3}  {t0:>2}-{t1:<2}   {rms:7.1f}  {cen:9.0f}   {peaks/2:6.1f}')
    bpm, ac = tempo(env, fr)
    print(f'global tempo (autocorr, 0.3-1.0 s lag): {bpm:.2f} BPM')
    for name,(a,b) in {'0-6 s':(0,6),'6-18 s':(6,18),'18-26 s':(18,26)}.items():
        e = env[int(a/fr):int(b/fr)]
        bp,_ = tempo(e, fr)
        acc,res = phase_fold(env, fr, 0.5, a, b)
        k = int(np.argmax(acc)); strength = acc[k]/ (acc.mean()+1e-9)
        # smooth phase of max (circular mean around peak)
        print(f'  {name:8s}: tempo {bp:6.2f} BPM | beat-grid phase of strongest onset {k*res*1000:5.0f} ms (0 = on the beat), peak/mean {strength:.2f}')
        acc2,res2 = phase_fold(env, fr, 2.0, a, b)
        k2 = int(np.argmax(acc2))
        print(f'            bar-fold (2 s) strongest accent at {k2*res2:5.2f} s into the bar (0 = downbeat)')

    ot, rise = onset_times(x)
    print('  onset list 0-8 s:', ' '.join(f'{t:.2f}' for t in ot if t<8))
    print('  onset list 17.5-23 s:', ' '.join(f'{t:.2f}' for t in ot if 17.5<=t<23))
    for name,(a,b) in {'0-6 s':(0,6),'6-18 s':(6,18),'18-26 s':(18,26)}.items():
        sel = ot[(ot>=a)&(ot<b)]
        if len(sel)==0: continue
        res = np.mod(sel,0.5); res = np.where(res>0.25,res-0.5,res)
        # circular-mean phase
        ang = np.exp(2j*np.pi*sel/0.5); ph = np.angle(ang.mean())/(2*np.pi)*0.5
        on = (np.abs(res)<0.04).mean()
        print(f'  transients {name:8s}: n={len(sel):3d}  grid phase {ph*1000:+5.0f} ms (median {np.median(res)*1000:+5.0f})  within +-40ms of a beat: {on*100:.0f}%')
        res2 = np.mod(sel,2.0); on_down = (np.minimum(res2,2.0-res2)<0.06).sum()
        print(f'              on a downbeat (+-60 ms): {on_down} of {len(sel)}')
    # mode per section
    for name,(a,b) in {'bars 1-3 (0-6)':(0,6),'bars 4-9 (6-18)':(6,18),'bars 10-11 (18-22)':(18,22),'bars 12-13 (22-26)':(22,26),'bars 14-15 (26-30)':(26,dur)}.items():
        best, rmaj, rmin = key_of(chroma(x,a,b))
        print(f'  key {name:20s}: best {best[1]:10s} r={best[0]:.2f} | vs D major r={rmaj:.2f}  D minor r={rmin:.2f}')
    # the turn: short-term energy change near 6 s and the pitch-class (F vs F#) switch
    hop = 0.1
    def e_win(t0,t1):
        s=x[int(t0*SR):int(t1*SR)]; return 20*np.log10(np.sqrt(np.mean(s**2))+1e-9)
    print('  energy (0.5 s windows) 4.0-8.0:', ' '.join(f'{e_win(t,t+0.5):.0f}' for t in np.arange(4,8,0.5)))
    # F (minor 3rd of D) vs F# (major 3rd) before and after 6 s
    for (a,b) in ((3,6),(6,9)):
        ch = chroma(x,a,b); print(f'  chroma {a}-{b}s: F {ch[5]:.3f}  F# {ch[6]:.3f}  (min3/maj3 ratio {ch[5]/(ch[6]+1e-9):.2f})')
    # biggest onset jump in 5-7 s
    m=(np.arange(len(env))*fr>=5)&(np.arange(len(env))*fr<7)
    t_pk = (np.arange(len(env))*fr)[m][np.argmax(env[m])]
    print(f'  strongest onset between 5-7 s at {t_pk:.2f} s')
    # sting near 26 s
    m=(np.arange(len(env))*fr>=25)&(np.arange(len(env))*fr<27.5)
    t_pk = (np.arange(len(env))*fr)[m][np.argmax(env[m])]
    print(f'  strongest onset between 25-27.5 s at {t_pk:.2f} s')
    print('  energy 26-30 s per 0.5 s (dB):', ' '.join(f'{e_win(t,t+0.5):.0f}' for t in np.arange(26,min(30,dur-0.5),0.5)))
    print('  energy 18-26 s per 0.5 s (dB):', ' '.join(f'{e_win(t,t+0.5):.0f}' for t in np.arange(18,26,0.5)))

for p in sys.argv[1:]:
    report(p)
