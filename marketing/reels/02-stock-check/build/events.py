#!/usr/bin/env python3
"""For every cue in mix.json: the effect's own level (rms of the first 0.4 s of that effect alone, final scale) against the voice
level over the same window. Flags the ones that sit within 8 dB of the voice while he speaks (masking risk).
Needs stems.py to have run (it writes audio/stem-voice.wav and the loudnorm gain is read from mix.wav vs mix-pre.wav)."""
import json, os, subprocess, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); A = lambda f: os.path.join(HERE, f); SR = 48000
def load(p, ch=2):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ar',str(SR),'-ac',str(ch),'-f','f32le','-'],capture_output=True,check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64); return x.reshape(-1, ch) if ch > 1 else x
mix = json.load(open(A('mix.json')))
pre, fin = load(A('audio/mix-pre.wav')), load(A('audio/mix.wav'))
G = np.sqrt(np.mean(fin**2))/np.sqrt(np.mean(pre**2))
v = load(A('audio/stem-voice.wav'))*G
db = lambda x: 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print(f'final gain {20*np.log10(G):+.2f} dB.  at (s)   effect                 own rms  own peak  voice rms (same 0.4 s)  voice-own')
for c in mix['sfx']:
    if 'hairline' in c['file'] and c['gainDb'] < -13: continue
    f = load(A(c['file']), 2)
    k = int(0.4*SR); seg = f[:k]*10**(c['gainDb']/20)*G
    pk = 20*np.log10(np.abs(f).max()*10**(c['gainDb']/20)*G+1e-9)
    a = int(c['at']*SR); vv = v[a:a+k]
    own, vo = db(seg), db(vv)
    flag = '  <-- within 8 dB of the voice' if vo > -50 and (vo-own) < 8 else ''
    print(f"  {c['at']:8.3f}  {os.path.basename(c['file']):22s} {own:7.1f} {pk:8.1f}   {vo:7.1f}              {vo-own if vo>-90 else float('nan'):6.1f}{flag}")
