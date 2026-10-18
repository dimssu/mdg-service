#!/usr/bin/env python3
"""For every cue in mix.json: the effect's own peak and rms (final scale, effect alone, over the 0.4 s after its first landing) against the voice
and the ducked bed over the same window. Flags effects within 8 dB of the voice rms while it speaks. Run stems.py first."""
import json, os, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); A = lambda f: os.path.join(HERE, f); SR = 48000
def load(p, ch=2):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ar',str(SR),'-ac',str(ch),'-f','f32le','-'],capture_output=True,check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64); return x.reshape(-1, ch) if ch > 1 else x
mix = json.load(open(A('mix.json')))
pre, fin = load(A('audio/mix-pre.wav')), load(A('audio/mix.wav'))
G = np.sqrt(np.mean(fin**2))/np.sqrt(np.mean(pre**2))
v = load(A('audio/stem-voice.wav'))*G; b = load(A('audio/stem-bed.wav'))*G
db = lambda x: 20*np.log10(np.sqrt(np.mean(x**2))+1e-9); pkdb = lambda x: 20*np.log10(np.abs(x).max()+1e-9)
print(f'final gain {20*np.log10(G):+.2f} dB.   at (s)  effect                   own pk  own rms | voice pk  voice rms | bed rms | voice-own(rms)')
for c in mix['sfx']:
    f = load(A(c['file']), 2); g = 10**(c['gainDb']/20)*G
    land = 0.11 if c.get('kind') == 'clack' else 0.0
    a = int((c['at']+land)*SR); k = int(0.4*SR if c.get('kind') != 'clack' else 0.12*SR)
    own = f[:k]*g
    vv, bb = v[a:a+k], b[a:a+k]
    vo = db(vv)
    flag = '  <-- within 8 dB of the voice' if vo > -45 and (vo-db(own)) < 8 else ''
    print(f"  {c['at']:8.3f}  {os.path.basename(c['file']):22s} {pkdb(own):7.1f} {db(own):8.1f} | {pkdb(vv):8.1f} {vo:9.1f} | {db(bb):7.1f} | {vo-db(own) if vo>-90 else float('nan'):6.1f}{flag}")
