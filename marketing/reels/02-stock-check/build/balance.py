#!/usr/bin/env python3
"""One-line-per-line balance report from the stems of the current mix (run stems.py first). usage: python3 balance.py"""
import json, os, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
def load(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',os.path.join(HERE,p),'-ar',str(SR),'-ac','2','-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
v, b, s, pre, fin = (load(f'audio/{n}.wav') for n in ('stem-voice','stem-bed','stem-sfx','mix-pre','mix'))
n = len(fin); fit = lambda a: np.pad(a, ((0, max(0, n-len(a))), (0, 0)))[:n]; v, b, s = fit(v), fit(b), fit(s)
G = np.sqrt(np.mean(fin**2))/np.sqrt(np.mean(pre**2)); db = lambda x: 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
sc = json.load(open(os.path.join(HERE, 'script.json')))
out = []
for l in sc['lines']:
    a, z = int(l['speechStart']*SR), int(l['speechEnd']*SR)
    out.append(f"{l['id']} v-bed {db(v[a:z])-db(b[a:z]):5.1f}")
gap = lambda a, z: db(b[int(a*SR):int(z*SR)]*G)
print('  '.join(out), '| bed in gaps: bars5-6 %.1f  bars13-14 %.1f dBFS | voice speech avg %.1f dBFS' % (gap(8.0, 11.8), gap(23.0, 26.2), np.mean([db(v[int(l['speechStart']*SR):int(l['speechEnd']*SR)]*G) for l in sc['lines']])))
