#!/usr/bin/env python3
"""Renders reel 02's synthesised effects and the phone-safe hits into audio/. Deterministic.
usage: python3 make-sfx.py"""
import numpy as np, subprocess, os
from dsp import *

# hairline ticks: three pitches so a cascade never sounds like a machine
for i, f in enumerate((2750, 3300, 3950), 1):
    save(f'hairline{i}.wav', hairline(f, seed=20+i), peak=0.5)      # hairline = the quietest thing in the reel
save('tock.wav', tock())
# the three camera moves >= 0.4 s
save('whoosh-flip.wav',   whoosh(0.60, peak_at=0.40, seed=31))            # 7.5 s   FLIP of the tile into the card window
save('whoosh-mirror.wav', whoosh(0.94, peak_at=0.52, f_hi=3100, seed=41))  # 15.0 s  the mirror turn, 15.00-15.94 (edge-on at ~15.47)
save('whoosh-shrink.wav', whoosh(0.50, peak_at=0.38, seed=51))            # 19.69 s the card shrinks into the phone
save('riser.wav', riser(3.75, f_end=6000))                                            # 20.625 -> 24.375 (two bars, ends on bar 14's downbeat)

# the metal slide: ElevenLabs take 1, trimmed to its rise-plateau-fall, band-limited, normalised
s = read(A('sfx-slide1.mp3'), 1)
k = int(0.01*SR); env = np.sqrt(np.convolve(s**2, np.ones(k)/k, mode='same'))
db = 20*np.log10(env+1e-9)
i0 = int(np.argmax(db > db.max()-24)); i1 = len(s) - int(np.argmax(db[::-1] > db.max()-30))
s = s[i0:i1]
s = onepole_lp(highpass(s, 350), 7500)
s = fade(s, fin=0.01, fout=0.07)
print(f'slide trimmed from {i0/SR:.3f} s to {i1/SR:.3f} s of the take')
save('slide.wav', s)

# phone-safe copies of the organic hits (same recipe as reel 01: the originals are almost pure 20-120 Hz)
REPO = os.path.abspath(os.path.join(HERE, '../../../..'))
SND = os.path.join(REPO, 'marketing/films/short/sound')
for name, boost, mix_db in (('subhit', 24, -9), ('brandhit', 20, -9)):
    fc = (f"[0:a]asplit=2[a][b];[b]volume={boost}dB,asoftclip=type=tanh,highpass=f=110,highpass=f=110,"
          f"volume={mix_db}dB[h];[a][h]amix=inputs=2:normalize=0,alimiter=limit=0.89[o]")
    subprocess.run(['ffmpeg','-v','error','-y','-i',os.path.join(SND, name + '.mp3'),'-filter_complex',fc,'-map','[o]',
                    '-ar',str(SR),'-ac','1','-c:a','pcm_s16le',A(name + '-phone.wav')], check=True)
    print('->', name + '-phone.wav')

# short-tailed copies of the two hits that sit on top of the voice (hit 1 under "फैसला", hit 3 under "डीलर कवच"):
# keep the strike and the first shimmer, fade the rest so the hit does not mask the word that follows it.
import wave
def trim_fade(src, dst, keep_from, keep_to):
    x = read(A(src), 1); n = int(keep_to*SR); x = x[:n].copy()
    k0 = int(keep_from*SR); ramp = np.cos(0.5*np.pi*np.linspace(0, 1, n-k0))**2; x[k0:] *= ramp
    save(dst, x, peak=0.89)
trim_fade('subhit-phone.wav', 'hit1-short.wav', 0.16, 0.50)
trim_fade('brandhit-phone.wav', 'hit3-short.wav', 0.30, 0.90)
