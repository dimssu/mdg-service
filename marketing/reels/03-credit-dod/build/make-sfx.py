#!/usr/bin/env python3
"""Renders reel 03's effects into audio/. Deterministic (seeded), except the tanker, which is two ElevenLabs takes shaped here.
  * the board's clacks: one SAMPLE per row change = a short rattle, one flap landing per changing flap, 30 ms apart (the board's own
    stagger). Sample 0 = the row's flip start (a flip takes 0.14 s; the first landing is at 0.11 s). Not a tick: a noise burst on
    a wooden 'thock' with a smaller rebound, three different pitches, jitter on every landing.
  * three whooshes (the FLIP, the shrink, the board rising), a riser into bar 14, a tanker (rumble + air-brake hiss),
    and the three hits (phone-safe copies of the films' sub-hit and brand-hit, with short tails).
usage: python3 make-sfx.py"""
import os, subprocess
import numpy as np
from dsp import *

# ------------------------------------------------------------------ clacks
D8 = ['digit']*8                      # ₹4,86,120 minus the ₹ flap: 6 digits + 2 commas
save('clack-riffle.wav', rattle(['digit']*9 + ['digit', 'digit', 'word'], seed=11), peak=0.89)   # 0.5 s: every flap flips once (the picture forces all 9 + 3 = 12)
save('clack-settle.wav', rattle(['digit']*6 + ['digit', 'digit', 'word'], seed=12, amp_lo=0.55), peak=0.89)   # 1.5 s: they settle on dashes (6 digit flaps + the date's 3; ₹ and the commas stay)
save('clack-zero.wav',   rattle(['digit']*6, seed=21), peak=0.89)                            # 3.0 s: the dashes clear and the last digit goes to 0 (6 flaps)
save('clack-minus.wav',  rattle(['digit', 'digit'], seed=22, f_jit=0.0), peak=0.89)           # 3.6 s: − on the sign's place after ₹, the 0 clears (2 flaps)
save('clack-3din.wav',   rattle(['digit', 'digit', 'word'], seed=31), peak=0.89)              # 4.65 s: the date row: dashes → (blank) 3 दिन (3 flaps)
save('clack-amount.wav', rattle(D8, seed=41), peak=0.89)                                      # 9.0 s: ₹4,86,120 digit by digit (under hit 2)
save('clack-date.wav',   rattle(['digit', 'digit', 'word'], seed=51), peak=0.89)              # 10.32 s: 26 + अगस्त
# the days row: one wide flap each, wider = a little lower. Same pace, same level: no crescendo.
for i, (sc, sd) in enumerate(((1.00, 61), (0.98, 62), (0.95, 63), (0.90, 64)), 1):
    y = rattle(['word'], seed=sd, f_jit=0.0, f_base=sc)
    save(f'clack-days{i}.wav', y, peak=0.89)
# 22.4 s: both rows set together (the amount row's 9 flaps + the date's 3, both from 22.4), clustered, not one event per flap
a = rattle(['digit']*9, seed=71); b = rattle(['digit', 'digit', 'word'], seed=72)
n = max(len(a), len(b)); y = np.zeros(n); y[:len(a)] += a; y[:len(b)] += 0.8*b
save('clack-rowset.wav', y, peak=0.89)
# 26.0 / 26.12 s: a row folds flat into the rule — softer, lower, a quick flat 'frrt'
save('clack-fold1.wav', rattle(['fold']*8, seed=81, L0=0.09, stagger=0.012, jitter=0.002, tail=0.06), peak=0.89)
save('clack-fold2.wav', rattle(['fold']*5, seed=82, L0=0.09, stagger=0.012, jitter=0.002, tail=0.06), peak=0.89)

# ------------------------------------------------------------------ whooshes (camera moves >= 0.4 s only)
save('whoosh-flip.wav',   whoosh(0.42, peak_at=0.40, f_lo=220, f_hi=2300, seed=31))    # 8.0   the FLIP, must be gone before 8.5
save('whoosh-shrink.wav', whoosh(0.50, peak_at=0.38, f_lo=180, f_hi=1700, seed=51))    # 20.0  the card shrinks into the bubble (under "इंडियन ऑयल")
save('whoosh-rise.wav',   whoosh(0.56, peak_at=0.62, f_lo=180, f_hi=1700, seed=61))    # 22.0  the board rises out of the bubble (under "नजर")
save('riser.wav', riser(3.0, f_end=6000))                                                 # 23.0 -> 26.0, ends on bar 14's downbeat

# ------------------------------------------------------------------ the tanker: rumble (take 1), ElevenLabs, shaped here (take 3's hiss is no longer used)
r1 = read(A('sfx-tanker1.mp3'), 1)[int(0.05*SR):int(0.95*SR)]                  # 0.9 s of tyre rumble, steady
r1 = onepole_lp(onepole_lp(highpass(r1, 60), 900), 1000)
t = np.arange(len(r1))/SR
r1 *= np.sin(0.5*np.pi*np.clip(t/0.45, 0, 1))**2 * np.cos(0.5*np.pi*np.clip((t-0.55)/0.35, 0, 1))**2   # in over 0.45 s, out over the last 0.35 s
r1 *= 10**((-24 - 20*np.log10(np.sqrt(np.mean(r1**2))+1e-12))/20)
h = read(A('sfx-tanker3.mp3'), 1)[int(0.10*SR):int(0.72*SR)]                    # the hiss
h = onepole_lp(highpass(h, 900), 7500)
th = np.arange(len(h))/SR
h *= np.sin(0.5*np.pi*np.clip(th/0.14, 0, 1))**2 * np.cos(0.5*np.pi*np.clip((th-0.26)/0.36, 0, 1))**2
h *= 10**((-27 - 20*np.log10(np.sqrt(np.mean(h**2))+1e-12))/20)
tank = np.zeros(int(1.10*SR))
tank[:len(r1)] += r1                                                             # a pass-by: the truck drives straight through (2.0–2.95)
# no air-brake hiss: the truck no longer stops (a stop on the board's first clack read as cause and effect)
save('tanker.wav', tank, peak=0.89)

# ------------------------------------------------------------------ the three hits (phone-safe copies of the films' sub-hit / brand-hit)
REPO = os.path.abspath(os.path.join(HERE, '../../../..'))
SND = os.path.join(REPO, 'marketing/films/short/sound')
for name, boost, mix_db in (('subhit', 24, -9), ('brandhit', 20, -9)):
    fc = (f"[0:a]asplit=2[a][b];[b]volume={boost}dB,asoftclip=type=tanh,highpass=f=110,highpass=f=110,"
          f"volume={mix_db}dB[h];[a][h]amix=inputs=2:normalize=0,alimiter=limit=0.89[o]")
    subprocess.run(['ffmpeg','-v','error','-y','-i',os.path.join(SND, name + '.mp3'),'-filter_complex',fc,'-map','[o]',
                    '-ar',str(SR),'-ac','1','-c:a','pcm_s16le',A(name + '-phone.wav')], check=True)
def shaped(src, dst, hold, tau, keep):
    """strike at full level for `hold` s, then an exponential tail (time constant `tau`), cut at `keep` s with a short fade"""
    x = read(A(src), 1); x = x[:int(keep*SR)].copy(); t = np.arange(len(x))/SR
    x *= np.exp(-np.clip(t-hold, 0, None)/tau)
    x *= np.cos(0.5*np.pi*np.clip((t-(keep-0.05))/0.05, 0, 1))**2
    save(dst, x, peak=0.89)
shaped('subhit-phone.wav',   'hit1.wav', hold=0.05, tau=0.10, keep=0.50)   # 1.5 s: in the comma gap, gone by 0.35 s after
shaped('subhit-phone.wav',   'hit2.wav', hold=0.06, tau=0.14, keep=0.70)   # 9.0 s: the amount lands; "इतना" starts on it
shaped('brandhit-phone.wav', 'hit3.wav', hold=0.10, tau=0.28, keep=1.10)   # 28.0 s: the end card settles; "बात | कीजिए"
