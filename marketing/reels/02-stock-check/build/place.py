#!/usr/bin/env python3
"""Measures the tightened voice takes and places them on the reel timeline.

Reads  build/script.json (lines[].wordsRel from words.mjs: Scribe word times in seconds after the line's start)
       and audio/<id>.wav (what the mix actually plays).
Does   1. file length, speech onset/end (ffmpeg silencedetect -42 dB, like kit voice.mjs);
       2. snaps each word's start to the steepest energy rise within [t0-0.10, t0+0.03] (Scribe lags the voice
          by up to ~0.06 s on line-initial words); keeps Scribe's time when there is no clear rise;
       3. sets each line's `start` from START below, and writes reel-time `words`, `speechStart`, `speechEnd`;
       4. rewrites script.json + script.js.
usage: python3 place.py            (apply the starts in START)
       python3 place.py --probe    (print file-relative refined word starts, change nothing)
"""
import json, os, re, subprocess, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); A = lambda f: os.path.join(HERE, 'audio', f)
SR = 44100
START = {'L1': 0.185, 'L2': 2.45, 'L3': 5.66, 'L4': 11.78, 'L5': 15.05, 'L6': 19.42, 'L7': 26.31}   # set from --probe, see AUDIO.md §2

def env_db(p, step=0.005):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32); f = int(step*SR); n = len(x)//f
    return 20*np.log10(np.sqrt((x[:n*f].reshape(n, f)**2).mean(1))+1e-9)

def span(p):
    total = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',p],capture_output=True,text=True).stdout)
    log = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',p,'-af','silencedetect=noise=-42dB:d=0.04','-f','null','-'],capture_output=True,text=True).stderr
    st = [max(0, float(m)) for m in re.findall(r'silence_start: (-?[\d.]+)', log)]
    en = [float(m) for m in re.findall(r'silence_end: ([\d.]+)', log)]
    onset = en[0] if (st and st[0] < 0.02 and en) else 0.0
    end = total
    if st:
        closed = len(en) >= len(st) and en[-1] < total-0.03
        if not closed: end = st[-1]
    return total, onset, end

def refine(e, t0, step=0.005):
    a, b = max(1, int((t0-0.10)/step)), min(len(e)-3, int((t0+0.03)/step))
    if b <= a: return t0, False
    rise = e[a+2:b+3] - e[a:b+1]            # 10 ms rise
    i = int(np.argmax(rise))
    if rise[i] < 9: return t0, False
    return (a+i+1)*step, True

s = json.load(open(os.path.join(HERE, 'script.json')))
probe = '--probe' in sys.argv
for l in s['lines']:
    if 'words' in l and 'wordsRel' not in l: l['wordsRel'] = l.pop('words')
    p = A(l['id']+'.wav'); e = env_db(p)
    total, onset, end = span(p)
    l['seconds'] = round(total, 3); l['onset'] = round(onset, 3); l['end'] = round(end, 3); l['chars'] = len(l['tts'])
    ref = []
    for w in l['wordsRel']:
        t0, snapped = refine(e, w['t0'])
        ref.append({'w': w['w'], 't0': round(t0, 3), 't1': round(min(w['t1'], end+0.03), 3), 'stt0': w['t0'], 'snap': snapped})
    l['_ref'] = ref
    if probe:
        print(f"{l['id']}  file {total:.3f}  speech {onset:.3f} .. {end:.3f}")
        print('   ' + '  '.join(f"{w['w']} {w['t0']:.2f}{'*' if w['snap'] else ''}(stt {w['stt0']:.2f})" for w in ref))
if probe: sys.exit(0)

for l in s['lines']:
    st = START[l['id']]; l['start'] = st
    l['words'] = [{'w': w['w'], 't0': round(st+w['t0'], 3), 't1': round(st+w['t1'], 3)} for w in l.pop('_ref')]
    l['speechStart'] = round(st+l['onset'], 3); l['speechEnd'] = round(st+l['end'], 3)
s['voiceChars'] = sum(len(l['tts']) for l in s['lines'])
s['wordsBasis'] = 'reel time (seconds from 0). onset/end are seconds after the line start; speechStart/speechEnd are reel time.'
json.dump(s, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=2); open(os.path.join(HERE, 'script.json'), 'a').write('\n')
open(os.path.join(HERE, 'script.js'), 'w').write('// GENERATED from script.json by kit/audio — do not edit.\nwindow.SCRIPT = ' + json.dumps(s, ensure_ascii=False, indent=2) + ';\n')
for l in s['lines']:
    print(f"{l['id']} start {l['start']:.3f}  speech {l['speechStart']:.3f} .. {l['speechEnd']:.3f}  ({l['chars']} chars, file {l['seconds']:.2f} s)")
    print('    ' + '  '.join(f"{w['w']} {w['t0']:.2f}" for w in l['words']))
print('voiceChars', s['voiceChars'])
