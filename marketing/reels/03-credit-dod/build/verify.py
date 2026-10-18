#!/usr/bin/env python3
"""Checks the finished track and the placement against the brief's hard rules. usage: python3 verify.py   (exit 1 on a failure)"""
import json, os, re, subprocess, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000; bad = []
def ok(cond, msg, detail=''):
    print(('PASS ' if cond else 'FAIL ') + msg + (f'  [{detail}]' if detail else '')); 
    if not cond: bad.append(msg)
s = json.load(open(os.path.join(HERE, 'script.json'))); mix = json.load(open(os.path.join(HERE, 'mix.json')))
L = {l['id']: l for l in s['lines']}
P = os.path.join(HERE, 'audio', 'mix.wav')
probe = subprocess.run(['ffprobe','-v','error','-show_entries','stream=sample_rate,channels,duration_ts','-of','csv=p=0',P],capture_output=True,text=True).stdout.strip()
ok(probe == '48000,2,1440000', 'mix.wav is 48 kHz stereo, exactly 1 440 000 frames = 30.000 s', probe)
err = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',P,'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', err)[-1])
j = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',P,'-af','loudnorm=I=-16:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
I2 = float(json.loads(j[j.rfind('{'):j.rfind('}')+1])['input_i'])
ok(abs((I+I2)/2+16) <= 0.1, 'integrated loudness -16 LUFS (+-0.1; ebur128 and loudnorm straddle -16)', f'ebur128 {I}, loudnorm {I2}')
ok(TP <= -2.0, 'true peak <= -2 dBTP', f'{TP} dBTP')
raw = subprocess.run(['ffmpeg','-v','error','-i',P,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2); m = np.abs(x).max(1)
sil = m[int(8.5*SR):int(9.0*SR)].max()
ok(sil == 0.0, 'silent beat 8.5-9.0 is digital zero (no bed, voice or effect)', f'max |x| = {sil}')
ok(m[int(9.0*SR):int(9.02*SR)].max() > 0.05, 'the bed, hit 2 and the voice come in on 9.0')
ok(L['L1']['speechEnd'] <= 2.5, 'L1 ends by 2.5 s', f"{L['L1']['speechEnd']}")
ok(L['L7']['speechEnd'] <= 22.5, 'L7 ends by 22.5 s', f"{L['L7']['speechEnd']}")
ok(L['L3']['speechEnd'] < 8.5 - 0.3, 'L3 ends well before the silent beat', f"{L['L3']['speechEnd']}")
ok(L['L8']['speechEnd'] <= 28.5, 'L8 ends within one beat of bar 15 (<= 28.5)', f"{L['L8']['speechEnd']}")
w4 = L['L4']['words'][0]
ok(w4['w'] == 'इतना' and abs(w4['t0'] - 9.0) <= 0.03, 'L4 first word इतना meets 9.0', f"{w4['t0']}")
ok(abs(L['L8']['start'] - 26.2) <= 0.1, 'L8 starts about 26.2', f"{L['L8']['start']}")
ok(sum(l['chars'] for l in s['lines']) == 218 and all(l['chars'] == len(l['tts']) for l in s['lines']), '218 characters of voice (Python len), ceiling 240')
ok(all(set(l['tts']) .isdisjoint('0123456789…—–') for l in s['lines']) and all('़' not in l['tts'] for l in s['lines']), 'TTS text: no digit, no nuqta, no … or —')
ok(all(re.fullmatch(r'[^\x00-\x7f]*[\u0900-\u097f\s,।?]+', l['tts']) for l in s['lines']), 'TTS text uses only Devanagari, spaces and , । ?')
hits = sorted(c['at'] for c in mix['sfx'] if c.get('kind') == 'hit')
ok(hits == [1.5, 9.0, 28.0], 'exactly three hits: 1.5, 9.0, 28.0', str(hits))
ts = sorted(c['at'] for c in mix['sfx'] if c.get('kind') == 'clack'); gaps = np.diff(ts)
ok(all(abs(a-b) > 0.04 for a, b in zip(gaps, gaps[1:])), 'no two consecutive clack gaps are equal (never an even spacing)', ' '.join(f'{g:.2f}' for g in gaps))
days = [c['at'] for c in mix['sfx'] if 'clack-days' in c['file']]; dg = np.diff(days)
ok(len(days) == 4 and len(set(np.round(dg, 3))) == 3, 'four days flips with three different gaps', f'{days} gaps {np.round(dg, 2).tolist()}')
for c in mix['sfx']:
    if c.get('kind') in ('whoosh',):
        d = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',os.path.join(HERE, c['file'])],capture_output=True,text=True).stdout)
        ok(d >= 0.4, f"whoosh at {c['at']} is a camera move >= 0.4 s", f'{d:.2f} s'); ok(c['at'] + d <= 8.5 or c['at'] >= 9.0, f"whoosh at {c['at']} is clear of the silent beat")
lines = sorted(s['lines'], key=lambda l: l['start'])
ok(all(a['speechEnd'] < b['speechStart'] for a, b in zip(lines, lines[1:])), 'no two lines overlap')
print('\n%d failure(s)' % len(bad)); sys.exit(1 if bad else 0)
