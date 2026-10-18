#!/usr/bin/env python3
"""Re-mixes with env overrides (BED_GAIN_DB, DUCK_THRESHOLD, DUCK_RATIO, DUCK_RELEASE) and prints how far the ducked bed sits under each line
and how loud it comes back in the voice-free gaps. usage: BED_GAIN_DB=-9 DUCK_RATIO=6 python3 tune.py"""
import json, os, subprocess, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
subprocess.run([sys.executable, 'cues.py'], cwd=HERE, check=True, capture_output=True)
subprocess.run(['node', '../../kit/audio/mix.mjs', '..'], cwd=HERE, check=True, capture_output=True)
subprocess.run([sys.executable, 'finish.py'], cwd=HERE, check=True, capture_output=True)
subprocess.run([sys.executable, 'stems.py'], cwd=HERE, check=True, capture_output=True)
def ld(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',os.path.join(HERE,p),'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
m = ld('audio/mix.wav'); n = len(m); fit = lambda a: np.pad(a, ((0, max(0, n-len(a))), (0, 0)))[:n]
v, b = fit(ld('audio/stem-voice.wav')), fit(ld('audio/stem-bed.wav'))
G = np.sqrt(np.mean(m**2))/np.sqrt(np.mean(fit(ld('audio/mix-pre.wav'))**2)); db = lambda x: 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
s = json.load(open(os.path.join(HERE, 'script.json')))
under = {l['id']: db(v[int(l['speechStart']*SR):int(l['speechEnd']*SR)]*G) - db(b[int(l['speechStart']*SR):int(l['speechEnd']*SR)]*G) for l in s['lines'] if l['id'] not in ('L1', 'L2')}
gap = lambda a, z: db(b[int(a*SR):int(z*SR)]*G)
vavg = np.mean([db(v[int(l['speechStart']*SR):int(l['speechEnd']*SR)]*G) for l in s['lines']])
print('env', {k: os.environ[k] for k in ('BED_GAIN_DB','DUCK_THRESHOLD','DUCK_RATIO','DUCK_RELEASE') if k in os.environ})
print('  voice-over-bed under each line:', ' '.join(f'{k}:{x:.1f}' for k, x in under.items()))
print('  bed in gaps (dBFS) 11.0-12.1: %.1f  14.0-16.3: %.1f  18.0-20.1: %.1f  23-26: %.1f   | voice avg %.1f' % (gap(11,12.1), gap(14,16.3), gap(18,20.1), gap(23,26), vavg))
