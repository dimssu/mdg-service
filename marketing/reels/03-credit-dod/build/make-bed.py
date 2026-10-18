#!/usr/bin/env python3
"""Builds the two music files for reel 03 (44.1 kHz stereo float, deterministic):

  audio/bed-final.wav    30.000 s. The groove (bars 4-15) laid at 6.000 s, the silent beat 8.5-9.0 cut into it. Goes through the mix's sidechain duck.
  audio/synth-intro.wav   8.0 s.   Bars 1-3: a quiet D drone, a low pulse, dry high plucks (F natural = D minor); and the bar-4 strum (F sharp =
                                   D major) + a hand-drum stroke on 6.000. NOT ducked: in bars 1-3 the voice is nearly continuous, so a ducked
                                   pulse and pluck would vanish. The mix plays it as an effect at 0 dB. Silent from 8.0 s on.

120 BPM: beat 0.5 s, bar 2.0 s, 15 bars. One ElevenLabs generation is used (bed-groove-1: Groove 12 s, Hold 4 s, Payoff 6 s, Sting 4 s); the three
"tense" generations of the opening were rejected (a decaying pluck, a swell from silence, a swell from silence), so bars 1-3 are synthesised.
The groove lags its section lines by a constant ~34 ms (measured); it is advanced by that. The silent beat is cut into the file, with a
8 ms fade out and a re-entry 3.5 ms before the grid (the groove's own downbeat attack).
"""
import numpy as np, subprocess, os, sys
from dsp import *

BEAT, BAR = 0.5, 2.0
N = int(round(30.0*SR))
SHIFT = float(os.environ.get('SHIFT', 0.034))      # groove lead (s), measured with check-grid.py
TURN = 3*BAR                                       # 6.0
S0, S1 = 8.5, 9.0                                  # the silent beat
db = lambda x: 10**(x/20)
rms_db = lambda x: 20*np.log10(np.sqrt(np.mean(x**2))+1e-12)

def put(dest, sig, t, gain=1.0):
    i = int(round(t*SR)); s = sig if sig.ndim == 2 else np.stack([sig, sig], 1)
    s = s*gain; j = min(len(dest), i+len(s)); dest[i:j] += s[:j-i]

syn = np.zeros((int(8.0*SR), 2)); groove = np.zeros((N + 2*SR, 2))

# ---------- synth-intro: the drone (bars 1-3), gone as the turn arrives --------------------------------------
DRONE_RMS_DB = float(os.environ.get('DRONE_DB', -39.5))      # pre-master; about 15 dB under the voice once normalised
dr = drone(6.1)
t = np.arange(len(dr))/SR
dr *= np.minimum(1, t/0.06)                                                               # 60 ms fade-in: no click at frame 0
dr *= np.where(t < TURN-0.03, 1.0, np.cos(0.5*np.pi*np.clip((t-(TURN-0.03))/0.08, 0, 1))**2)   # out across 5.97-6.05
dr *= db(DRONE_RMS_DB - rms_db(dr[:int((TURN-0.2)*SR)]))
put(syn, dr, 0.0)

# ---------- synth-intro: low pulse + dry high plucks (D minor) -------------------------------------------------
PL, TP_, ST = 0.110, 0.072, 0.120          # peak amplitudes: pluck, pulse, strum (whole chord)
TH = thump()
F5, A5, D5, A4 = 698.46, 880.00, 587.33, 440.00
pulse  = [(0.0, 1.00), (2.0, 0.85), (4.0, 0.75), (5.0, 0.45)]      # bar downbeats, and a last unsteady one on 5.0 (not 3.0 / 3.6: the clacks)
plucks = [(1.0, F5, 1.00), (2.0, A4, 0.50), (4.0, D5, 0.55), (5.0, A5, 0.45)]   # F over the D drone = the flat third. 5.5 is left empty: the turn is a change
for tt, g in pulse: put(syn, TH, tt, TP_/0.5*g)
for k, (tt, f, g) in enumerate(plucks): put(syn, pluck(f, dur=1.1, t60=0.8, bright=0.9, seed=100+k), tt, PL/0.5*g)

# ---------- bar 4 downbeat: the D-major strum (F sharp) + a hand-drum stroke = the turn's accent --------------
chord = np.zeros((int(2.0*SR), 2))
for k, (f, g) in enumerate(((293.66, 0.9), (369.99, 1.0), (440.00, 0.9), (587.33, 0.8), (880.0, 0.45))):
    put(chord, pluck(f, dur=1.8, t60=1.1, bright=1.0, seed=200+k), 0.018*k, g)
chord *= ST/np.abs(chord).max()
put(syn, chord, TURN)
put(syn, thump(f_lo=75, f_hi=165, dur=0.25), TURN, TP_/0.5*1.3)
ts = np.arange(len(syn))/SR
syn *= np.where(ts > 7.3, np.cos(0.5*np.pi*np.clip((ts-7.3)/0.6, 0, 1))**2, 1.0)[:, None]        # strum rings out by 7.9; the file is silent after (the FLIP whoosh and the silent beat are clear)

# ---------- bed-final: the groove, bars 4-15 ---------------------------------------------------------------------
g = read(A('bed-groove-1.mp3'), 2)
g = g[int(round(SHIFT*SR)):]
TARGET = {4: -18.5, 5: -19.7, 6: -19.7, 7: -18.9, 8: -18.9, 9: -18.9, 10: -20.5, 11: -20.7, 12: -20.0, 13: -18.5, 14: -15.5, 15: -22.5}   # bar RMS (dB) before the mix's gain; hold = calmer, build 12-13, peak 14
gdb = np.zeros(len(g)); tt = np.arange(len(g))/SR + TURN
meas = {}
for bar in TARGET:
    a, z = int((bar-1)*BAR-TURN)*SR, int(bar*BAR-TURN)*SR
    seg = g[a:z] if z <= len(g) else g[a:]
    meas[bar] = rms_db(seg)
gain = {b: TARGET[b]-meas[b] for b in TARGET}
for bar in sorted(gain):                       # held at each bar's value, 0.2 s ramp from the previous bar's value
    t0 = (bar-1)*BAR; prev = gain.get(bar-1, gain[bar])
    r = np.clip((tt - t0)/0.20, 0, 1)
    gdb = np.where(tt >= t0, prev + (gain[bar]-prev)*r, gdb)
# bar 14 is the peak, but the voice speaks over it from 26.28: the first 0.25 s carries the peak, then the bed sits 5.5 dB lower under "डीलर कवच"
sh = np.zeros(len(g)); tg = np.arange(len(g))/SR + TURN
sh = np.where((tg >= 26.25) & (tg < 28.0), -5.5*np.clip((tg-26.25)/0.25, 0, 1), sh)
sh = np.where(tg >= 27.80, -5.5*(1-np.clip((tg-27.80)/0.20, 0, 1)), sh)
gdb = gdb + sh
g = g*db(gdb)[:, None]
put(groove, g, TURN)
out = groove[:N]

# ---------- the silent beat -----------------------------------------------------------------------------------------
tt = np.arange(N)/SR
GATE_BACK = float(os.environ.get('GATE_BACK', 0.0))
gate = np.ones(N)
gate = np.where(tt >= S0-0.015, np.cos(0.5*np.pi*np.clip((tt-(S0-0.015))/0.008, 0, 1)), gate)   # out across 8.485-8.493
gate = np.where(tt >= S0-0.007, 0.0, gate)
gate = np.where(tt >= S1-GATE_BACK, np.sin(0.5*np.pi*np.clip((tt-(S1-GATE_BACK))/0.0015, 0, 1)), gate)
out = out*gate[:, None]

def w(name, x):
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','pcm_f32le',A(name)], input=x.astype(np.float32).tobytes(), check=True)
    print(f'-> {name}  {len(x)/SR:.3f} s  peak {np.abs(x).max():.3f} ({20*np.log10(np.abs(x).max()):.1f} dBFS)')
w('bed-final.wav', out)
w('synth-intro.wav', syn)
rms = lambda x, a, z: 20*np.log10(np.sqrt(np.mean(x[int(a*SR):int(z*SR)]**2))+1e-9)
print('bed-final bar RMS (dB):', ' '.join(f'{k+1}:{rms(out, k*BAR, (k+1)*BAR):.1f}' for k in range(3, 15)))
print('groove gain per bar (dB):', ' '.join(f'{b}:{gain[b]:+.1f}' for b in sorted(gain)))
print('synth-intro bar RMS (dB):', ' '.join(f'{k+1}:{rms(syn, k*BAR, (k+1)*BAR):.1f}' for k in range(4)))
print('drone RMS over bars 1-3: %.1f dB' % rms(syn, 0, TURN-0.2))
print('bed-final RMS in 8.494-8.995 (the silent beat): %.1f dB (digital zero = -240)' % rms(out, 8.494, 8.995))
