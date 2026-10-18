#!/usr/bin/env python3
"""Writes build/mix.json (what kit/audio/mix.mjs reads) and the `music`, `cues` and `board` blocks of script.json / script.js.
Every time is a grid time from Kit.clock(120, 15) (beat 0.5 s, bar 2.0 s) unless a comment says it follows a measured word.
A clack cue is placed at the picture's FLIP START; the first flap lands 0.11 s later (a flip takes 0.14 s), then one more every 0.03 s.
usage: python3 cues.py"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
BEAT, BAR = 0.5, 2.0
at = lambda bar, beat=1: round((bar-1)*BAR + (beat-1)*BEAT, 5)

BED_GAIN_DB = float(os.environ.get('BED_GAIN_DB', -8))
RISER_DB = float(os.environ.get('RISER_DB', -15))

cues = []
def cue(t, f, g, what, kind='sfx'): cues.append({'at': round(t, 5), 'file': f, 'gainDb': g, 'what': what, 'kind': kind})

cue(0.0, 'audio/synth-intro.wav', 0, 'BED INSTRUMENTS (music, not events, not ducked): D drone, low pulse (0 2 4 5), dry high plucks (1.0 F5, 2.0 A4, 4.0 D5, 5.0 A5), D-major strum + hand-drum on 6.000', 'music')
# --- the board: one clack SAMPLE per row change; digit rows quieter than word rows ------------------------------
board = [
  (0.50,  'clack-riffle', -14, 'amount + date',   'riffle',               'every flap flips once to another blank (11 flaps)'),
  (1.50,  'clack-settle', -17, 'amount + date',   'dashes',               'the flaps settle on dashes (under hit 1)'),
  (3.00,  'clack-zero',   -15, 'amount',          '0',                    'the last digit clacks to 0 (on "शून्य")'),
  (3.60,  'clack-minus',  -17, 'amount',          '−',                    'the 0 flap turns to − (on "नीचे")'),
  (4.65,  'clack-3din',   -12, 'date',            '3 + दिन',              'the date row: 3 + दिन (on "गिनती")'),
  (9.00,  'clack-amount', -14, 'amount',          '₹4,86,120',            'the amount, digit by digit (under hit 2 and "इतना")'),
  (10.32, 'clack-date',   -12, 'date',            '26 + अगस्त',           'the date row: 26 + अगस्त (on "तारीख")'),
  (12.50, 'clack-days1',  -12, 'days',            '3 दिन बाक़ी',          'days row flap 1 (on "दिन")'),
  (13.25, 'clack-days2',  -12, 'days',            '2 दिन बाक़ी',          'days row flap 2 (on "यह")'),
  (14.10, 'clack-days3',  -12, 'days',            'कल आख़िरी दिन',        'days row flap 3 (voice-free)'),
  (15.00, 'clack-days4',  -12, 'days',            'आज ही जमा करना है',    'days row flap 4 (voice-free)'),
  (22.40, 'clack-rowset', -15, 'amount + date',   '₹4,86,120 · 26 अगस्त', 'the board\'s rows set (just after "में")'),
  (26.00, 'clack-fold1',  -18, 'amount',          'fold',                 'the amount row folds flat into the rule (the picture folds on bar 14\'s downbeat)'),
  (26.12, 'clack-fold2',  -18, 'date',            'fold',                 'the date row folds flat into the rule, 0.12 s after the amount row'),
]
for t, f, g, row, to, what in board:
    cue(t, f'audio/{f}.wav', g, f'CLACK [{row} -> {to}]: {what}', 'clack')
cue(2.00,  'audio/tanker.wav',        -16, 'tanker passing: tyre rumble 2.0-2.9, swelling as it crosses the frame, gone before 2.95 (it never stops)', 'tanker')
cue(8.00,  'audio/whoosh-flip.wav',   -17, 'whoosh: the FLIP (8.0-8.42), gone before the silent beat', 'whoosh')
cue(20.00, 'audio/whoosh-shrink.wav', -21, 'whoosh: the card shrinks into the bubble (20.0-20.5), under "इंडियन ऑयल"', 'whoosh')
cue(22.00, 'audio/whoosh-rise.wav',   -21, 'whoosh: the board rises out of the bubble (22.0-22.56), under "नजर"', 'whoosh')
cue(23.00, 'audio/riser.wav', RISER_DB, 'riser 23.0 -> 26.0, ends on bar 14\'s downbeat', 'riser')
cue(1.50,  'audio/hit1.wav', -13, 'HIT 1 of 3: the flaps settle on dashes (in the comma gap, before "कब")', 'hit')
cue(9.00,  'audio/hit2.wav', -9,  'HIT 2 of 3: the amount lands; "इतना" starts on it', 'hit')
cue(28.00, 'audio/hit3.wav', -13, 'HIT 3 of 3: the end card settles (the bed\'s own sting lands here too); between "बात" and "कीजिए"', 'hit')
cues.sort(key=lambda c: c['at'])

music = {
  'take': 1, 'bpm': 120, 'beat': BEAT, 'bar': BAR,
  'bed': 'audio/bed-final.wav',
  'note': 'bars 1-3: synthesised (drone, low pulse, dry high plucks, D minor); bars 4-15: ElevenLabs groove (bed-groove-1) advanced 34 ms and laid at 6.0; synth D-major strum on 6.0; see AUDIO.md',
  'sections': [
    {'name': 'Tense (sparse: low pulse, dry high pluck)', 'bars': '1-3', 'from': 0, 'to': at(4)},
    {'name': 'The turn (groove, D major, warm)', 'bars': '4-9', 'from': at(4), 'to': at(10)},
    {'name': 'Hold (the data moment)', 'bars': '10-11', 'from': at(10), 'to': at(12)},
    {'name': 'Build (riser 23.0 -> 26.0)', 'bars': '12-13', 'from': at(12), 'to': at(14)},
    {'name': 'Peak (strongest moment)', 'bars': '14', 'from': at(14), 'to': at(15)},
    {'name': 'Sting and settle (end card at rest)', 'bars': '15', 'from': at(15), 'to': 30.0},
  ],
  'turn': at(4), 'silence': [8.5, 9.0], 'hits': [1.5, 9.0, 28.0], 'riser': [23.0, at(14)], 'peak': at(14), 'sting': at(15),
}

mix = {'duration': 30,
       'bed': {'file': 'audio/bed-final.wav', 'offset': 0, 'gainDb': BED_GAIN_DB, 'silences': [], 'fadeOut': 0.6,
               'duck': {'threshold': float(os.environ.get('DUCK_THRESHOLD', 0.010)), 'ratio': float(os.environ.get('DUCK_RATIO', 8)), 'attack': 15, 'release': float(os.environ.get('DUCK_RELEASE', 350))},
               'note': 'the silent beat 8.5-9.0 is cut into bed-final.wav itself (make-bed.py), so the 30 ms gate ramps of mix.mjs do not soften the 9.0 re-entry'},
       'master': {'limit': float(os.environ.get('MASTER_LIMIT', 0.30)), 'attack': 5, 'release': 60,
                  'note': 'look-ahead peak limiter before loudnorm (kit mix.mjs option, see reel 02 AUDIO.md): keeps loudnorm in linear mode'},
       'sfx': cues}
json.dump(mix, open(os.path.join(HERE, 'mix.json'), 'w'), ensure_ascii=False, indent=2); open(os.path.join(HERE, 'mix.json'), 'a').write('\n')

s = json.load(open(os.path.join(HERE, 'script.json')))
s['music'] = music; s['cues'] = cues
s['board'] = [{'flip': t, 'lands': round(t+0.11, 3), 'row': row, 'to': to, 'sound': f, 'gainDb': g, 'what': what} for t, f, g, row, to, what in board]
json.dump(s, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=2); open(os.path.join(HERE, 'script.json'), 'a').write('\n')
open(os.path.join(HERE, 'script.js'), 'w').write('// GENERATED from script.json by kit/audio — do not edit.\nwindow.SCRIPT = ' + json.dumps(s, ensure_ascii=False, indent=2) + ';\n')
for c in cues: print(f"{c['at']:8.3f}  {c['file'].replace('audio/',''):20s} {c['gainDb']:6.1f}  {c['what']}")
print(len(cues), 'cues')
