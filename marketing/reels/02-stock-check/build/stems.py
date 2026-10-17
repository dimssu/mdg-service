#!/usr/bin/env python3
"""Renders the mix's three stems separately (voice, bed after the sidechain duck, effects) with exactly the filter graph of
kit/audio/mix.mjs, applies the same constant loudnorm gain, and prints per-window levels so the balance can be checked
without listening.  usage: python3 stems.py [window_seconds]"""
import json, os, subprocess, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
s = json.load(open(os.path.join(HERE, 'script.json'))); mix = json.load(open(os.path.join(HERE, 'mix.json')))
D = mix.get('duration', 30); ms = lambda t: max(0, round(t*1000))
inputs = []; parts = []
def add(f): inputs.append(os.path.join(HERE, f)); return len(inputs)-1
vl = []
for l in s['lines']:
    i = add(f"audio/{l['id']}.wav")
    parts.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=mono,adelay={ms(l['start'])}[v{i}]"); vl.append(f'[v{i}]')
parts.append(f"{''.join(vl)}amix=inputs={len(vl)}:normalize=0,apad=whole_dur={D},atrim=0:{D},aformat=channel_layouts=stereo,asplit=2[key][voiceout]")
b = mix['bed']; bi = add(b['file'])
parts.append(f"[{bi}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=start={b.get('offset',0)},asetpts=PTS-STARTPTS,apad=whole_dur={D},atrim=0:{D},volume={b['gainDb']}dB,equalizer=f=2500:t=q:w=1:g=-4,afade=t=out:st={D-b.get('fadeOut',0.6):.3f}:d={b.get('fadeOut',0.6)}[bedpre]")
dk = b.get("duck", {})
parts.append(f"[bedpre][key]sidechaincompress=threshold={dk.get('threshold',0.03)}:ratio={dk.get('ratio',8)}:attack={dk.get('attack',15)}:release={dk.get('release',350)}[bedout]")
sl = []
for c in mix['sfx']:
    i = add(c['file'])
    parts.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.005,areverse,afade=t=in:d=0.08,areverse,volume={c['gainDb']}dB,adelay={ms(c['at'])}:all=1[s{i}]"); sl.append(f'[s{i}]')
parts.append(f"{''.join(sl)}amix=inputs={len(sl)}:normalize=0,atrim=0:{D}[sfxout]")
args = ['ffmpeg','-hide_banner','-loglevel','error','-y']
for p in inputs: args += ['-i', p]
tmp = os.path.join(HERE, 'audio')
r = subprocess.run(args + ['-filter_complex', ';'.join(parts)] +
    ['-map','[voiceout]','-c:a','pcm_f32le',f'{tmp}/stem-voice.wav','-map','[bedout]','-c:a','pcm_f32le',f'{tmp}/stem-bed.wav','-map','[sfxout]','-c:a','pcm_f32le',f'{tmp}/stem-sfx.wav'], capture_output=True, text=True)
if r.returncode: sys.exit('ffmpeg failed: ' + r.stderr[-600:])
def load(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ar',str(SR),'-ac','2','-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
v, bd, fx = (load(f'{tmp}/stem-{n}.wav') for n in ('voice','bed','sfx'))
mixf = load(f'{tmp}/mix.wav')
def fit(a, n): return np.pad(a, ((0, max(0, n-len(a))), (0, 0)))[:n]
v, bd, fx = (fit(a, len(mixf)) for a in (v, bd, fx)); pre = v+bd+fx
n = min(len(mixf), len(pre)); gain = np.sqrt(np.mean(mixf[:n]**2))/np.sqrt(np.mean(pre[:n]**2))
print(f'loudnorm gain {20*np.log10(gain):+.2f} dB (constant); sum-of-stems vs mix.wav max abs diff {np.abs(mixf[:n]-gain*pre[:n]).max():.4f}')
w = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
def db(x): return 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print('window        voice    bed    sfx    (dBFS rms of each stem in the final scale)   voice-bed')
for t in np.arange(0, 30, w):
    a, z = int(t*SR), int((t+w)*SR); vv, bb, ff = db(v[a:z]*gain), db(bd[a:z]*gain), db(fx[a:z]*gain)
    print(f'{t:5.1f}-{t+w:5.1f}  {vv:7.1f} {bb:6.1f} {ff:6.1f}   {vv-bb if vv>-60 else float("nan"):6.1f}')
