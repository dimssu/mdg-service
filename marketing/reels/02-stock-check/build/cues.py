#!/usr/bin/env python3
"""Writes build/mix.json (what kit/audio/mix.mjs reads) and the `music` + `cues` blocks of script.json / script.js.
Every time is a grid time from Kit.clock(128, 16) unless a comment says it follows a measured word.
usage: python3 cues.py"""
import json, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
BEAT, BAR = 60/128, 4*60/128
at = lambda bar, beat=1: round((bar-1)*BAR + (beat-1)*BEAT, 5)

BED_GAIN_DB = float(os.environ.get('BED_GAIN_DB', -8))
RISER_DB = float(os.environ.get('RISER_DB', -19))

cues = []
def cue(t, f, g, what): cues.append({'at': round(t, 5), 'file': f, 'gainDb': g, 'what': what})

def cascade(t0, t1, n, centre_db, what, seed=0):
    """A hairline tick cascade that settles: dense first, each gap longer than the last, bell-shaped level, three pitches. Never a clock."""
    pitch = [1, 3, 2, 3, 1, 2, 3, 1, 2]
    for i in range(n):
        u = i/(n-1)
        t = t0 + (t1-t0)*u**1.7
        bell = math.sin(math.pi*(0.15+0.7*u))                      # soft at both ends
        cue(t, f'audio/hairline{pitch[(i+seed) % len(pitch)]}.wav', round(centre_db - 6*(1-bell), 1), f'{what} ({i+1}/{n})')

cue(0.0, 'audio/synth-intro.wav', 0, 'BED INSTRUMENTS (music, not events, not ducked): D drone, low pulse, F-natural plucks on the beat (0.47 0.94 2.34 3.28 4.69), D-major strum on 5.625')
# --- bar 1: HIT 1 -----------------------------------------------------------------------------------------
cascade(0.02, 0.30, 5, -12, 'hairline ticks: the poster scale settles (bar 1)', 0)
cue(at(1, 4), 'audio/hit1-short.wav', -14, 'HIT 1 of 3: the pin lands at +430, outside (short tail so "फैसला" is not masked)')
cue(at(1, 4), 'audio/tock.wav', -16, 'soft wooden tock: the pin lands (1.406)')
# --- bars 2-3: the scale turns into the dip rod ---------------------------------------------------------
cascade(2.46, 3.18, 9, -12, 'hairline ticks: the scale\'s ticks become the rod\'s graduations (bar 2, beats 2-4)', 2)
cue(3.22, 'audio/slide.wav', -18, 'metal slide: the dip rod rises (audible 3.22-3.80, peak 3.58)')
# --- bar 5: the FLIP ---------------------------------------------------------------------------------------
cue(at(5, 1)+0.04, 'audio/whoosh-flip.wav', -15, 'whoosh: FLIP of the tile into the card window (move starts 7.5; whoosh 7.54, peak 7.78, clear of the last syllable of line 3)')
# --- bar 7: the instrument re-forms ------------------------------------------------------------------------
cascade(at(7, 1)+0.05, at(7, 1)+0.60, 7, -12, 'hairline ticks: the instrument re-forms out of the parts (bar 7)', 1)
# --- bar 9: the mirror -------------------------------------------------------------------------------------
cue(at(9, 1), 'audio/whoosh-mirror.wav', -16, 'whoosh: the mirror turn, 15.00-15.94 (edge-on at ~15.47)')
cue(at(9, 3), 'audio/tock.wav', -16, 'soft wooden tock: the pin lands at +430 again (15.938)')
# --- bar 10 beat 4: HIT 2 (after the silent beat 17.8125-18.28125) -----------------------------------------
cue(at(10, 4), 'audio/subhit-phone.wav', -5, 'HIT 2 of 3: NOT WITHIN +30 lands, after the silent beat')
# --- bar 11: the card shrinks into the phone ---------------------------------------------------------------
cue(19.69, 'audio/whoosh-shrink.wav', -15, 'whoosh: the card shrinks into the phone (19.69, peak 19.88)')
# --- bar 12: the bare band returns; riser into bar 14 ------------------------------------------------------
cascade(21.10, 21.55, 5, -12, 'hairline ticks: the bare band returns (bar 12)', 3)
cue(at(12, 1), 'audio/riser.wav', RISER_DB, 'riser 20.625 -> 24.375, ends on bar 14\'s downbeat')
# --- bar 15: HIT 3 -----------------------------------------------------------------------------------------
cue(at(15, 1), 'audio/hit3-short.wav', -12, 'HIT 3 of 3: end card (the bed\'s own sting lands here too; short tail so "डीलर कवच" is not masked)')
cues.sort(key=lambda c: c['at'])

music = {
  'take': 1, 'bpm': 128, 'beat': round(BEAT, 5), 'bar': round(BAR, 5),
  'bed': 'audio/bed-final.wav',
  'note': 'bars 1-3: ElevenLabs D drone (bed-minor-1) + synth low pulse and F-natural plucks; bars 4-16: ElevenLabs groove (bed-groove-1) advanced 26 ms and laid at 5.625; synth D-major strum on 5.625; see AUDIO.md',
  'sections': [
    {'name': 'Worry', 'bars': '1-3', 'from': 0, 'to': at(4)},
    {'name': 'The turn (groove, D major)', 'bars': '4-9', 'from': at(4), 'to': at(10)},
    {'name': 'Hold', 'bars': '10-11', 'from': at(10), 'to': at(12)},
    {'name': 'Payoff (build, then peak on bar 14)', 'bars': '12-14', 'from': at(12), 'to': at(15)},
    {'name': 'Sting and settle', 'bars': '15-16', 'from': at(15), 'to': 30.0},
  ],
  'turn': at(4), 'silence': [at(10, 3), at(10, 4)], 'hit2': at(10, 4), 'riser': [at(12), at(14)], 'peak': at(14), 'sting': at(15),
}

mix = {'duration': 30,
       'bed': {'file': 'audio/bed-final.wav', 'offset': 0, 'gainDb': BED_GAIN_DB, 'silences': [], 'fadeOut': 0.6,
               'duck': {'threshold': float(os.environ.get('DUCK_THRESHOLD', 0.010)), 'ratio': 8, 'attack': 15, 'release': 350},
               'note': 'the silent beat 17.8125-18.28125 is cut into bed-final.wav itself (make-bed.py), so the 30 ms gate ramps of mix.mjs do not soften the +30 hit'},
       'master': {'limit': float(os.environ.get('MASTER_LIMIT', 0.30)), 'attack': 5, 'release': 60,
                  'note': 'look-ahead peak limiter before loudnorm (kit mix.mjs change, see AUDIO.md): keeps loudnorm in linear mode'},
       'sfx': cues}
json.dump(mix, open(os.path.join(HERE, 'mix.json'), 'w'), ensure_ascii=False, indent=2); open(os.path.join(HERE, 'mix.json'), 'a').write('\n')

s = json.load(open(os.path.join(HERE, 'script.json')))
s['music'] = music; s['cues'] = cues
json.dump(s, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=2); open(os.path.join(HERE, 'script.json'), 'a').write('\n')
open(os.path.join(HERE, 'script.js'), 'w').write('// GENERATED from script.json by kit/audio — do not edit.\nwindow.SCRIPT = ' + json.dumps(s, ensure_ascii=False, indent=2) + ';\n')
for c in cues: print(f"{c['at']:9.5f}  {c['file'].replace('audio/',''):20s} {c['gainDb']:6.1f}  {c['what']}")
print(len(cues), 'cues')
