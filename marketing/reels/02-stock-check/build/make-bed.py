#!/usr/bin/env python3
"""Builds the two music files for reel 02 (44.1 kHz stereo float, deterministic):

  audio/bed-final.wav    30.000 s. The groove, bars 4-16, with the silent beat cut in. Goes through the mix's sidechain duck.
  audio/synth-intro.wav   8.5 s.   The bars 1-3 drone, low pulse and F-natural plucks, and the bar-4 strum. NOT ducked: in bars 1-3 the
                                   voice is nearly continuous, so a ducked pulse and pluck would be inaudible. The mix plays it as an
                                   effect at 0 dB, so the amplitudes below are the real pre-master amplitudes.

Two ElevenLabs generations are re-cut onto the 128 BPM grid (beat 0.46875 s, bar 1.875 s):
  bed-minor-1.mp3   a steady D drone (D3 D4 D5, no third in it)       -> bars 1-3, the worried opening
  bed-groove-1.mp3  D-major groove: Groove(6 bars) Hold(2) Payoff(3) Sting(2). Its 0 s is laid at 5.625 s (bar 4's downbeat).
                    It lands 26 ms late on every section line, so it is advanced by 26 ms.
Everything else is synthesised and sits exactly on the grid: the low pulse and the dry high plucks of bars 1-3 (F natural over the
D drone = D minor) and the plucked D-major strum on bar 4's downbeat (F sharp = the turn).
The groove is gated to silence for the beat 17.8125-18.28125 (the beat before the +30 lands).
"""
import numpy as np, subprocess, os, sys
from dsp import *

BEAT, BAR = 60/128, 4*60/128
N = int(round(30.0*SR))
SHIFT = 0.026                    # groove lead (s)
TURN = 3*BAR                     # 5.625
S0, S1 = 9*BAR + 2*BEAT, 9*BAR + 3*BEAT      # 17.8125 .. 18.28125, bar 10 beat 3
assert abs(S0-17.8125) < 1e-9 and abs(S1-18.28125) < 1e-9
db = lambda x: 10**(x/20)

groove = np.zeros((N + 2*SR, 2)); syn = np.zeros((int(8.5*SR), 2))
def put(dest, sig, t, gain=1.0):
    i = int(round(t*SR)); s = sig if sig.ndim == 2 else np.stack([sig, sig], 1)
    s = s*gain; j = min(len(dest), i+len(s)); dest[i:j] += s[:j-i]
rms_db = lambda x: 20*np.log10(np.sqrt(np.mean(x**2))+1e-12)

# ---------- synth-intro: the drone (bars 1-3), leaving as the turn arrives --------------------------------------
DRONE_RMS_DB = -41.0                                   # pre-master; about 15 dB under the voice once the mix is normalised
# notch the drone's 5th and 10th partials (735 and 1470 Hz = F sharp): a tanpura on D should carry no third at all, so the F natural plucks
# above it read as D minor and not as a muddle of both thirds
subprocess.run(['ffmpeg','-v','error','-y','-i',A('bed-minor-1.mp3'),'-af','bandreject=f=735:t=q:w=30,bandreject=f=1470:t=q:w=30,bandreject=f=368:t=q:w=30','-ar',str(SR),'-ac','2','-c:a','pcm_f32le',A('bed-minor-notched.wav')],check=True)
drone = read(A('bed-minor-notched.wav'), 2)[:int(6.0*SR)].copy()
t = np.arange(len(drone))/SR
drone *= np.minimum(1, t/0.06)[:, None]                                                    # 60 ms fade-in: no click at frame 0
drone *= np.where(t < TURN-0.03, 1.0, np.cos(0.5*np.pi*np.clip((t-(TURN-0.03))/0.08, 0, 1))**2)[:, None]   # out across 5.595-5.675
drone *= db(DRONE_RMS_DB - rms_db(drone[:int(TURN*SR)]))
put(syn, drone, 0.0)

# ---------- synth-intro: low pulse and dry high plucks (D minor) -----------------------------------------------
PL, TP_, ST = 0.090, 0.060, 0.120          # peak amplitudes: pluck, pulse, strum (whole chord)
TH = thump()
F5, A5, D5, A4 = 698.46, 880.00, 587.33, 440.00
b = lambda bar, beat: (bar-1)*BAR + (beat-1)*BEAT
pulse = [(b(1,1), 1.00), (b(2,1), 0.85), (b(2,3), 0.50), (b(3,1), 0.70)]
plucks = [(b(1,2), F5, 1.00), (b(1,3), A5, 1.00),             # the pin lifts, then the apex: F then A over the D drone (minor third, fifth)
          (b(2,2), D5, 0.60), (b(2,4), F5, 0.45),
          (b(3,3), A4, 0.50)]                                   # bar 3 thins; beat 4 (5.156) is left empty so the turn is a change
for tt, g in pulse: put(syn, TH, tt, TP_/0.5*g)
for k, (tt, f, g) in enumerate(plucks): put(syn, pluck(f, dur=1.1, t60=0.8, bright=0.9, seed=100+k), tt, PL/0.5*g)

# ---------- synth-intro: bar 4 downbeat, the D-major strum (F sharp) = the turn's accent ----------------------
chord = np.zeros((int(2.0*SR), 2))
for k, (f, g) in enumerate(((293.66, 0.9), (369.99, 1.0), (440.00, 0.9), (587.33, 0.8), (880.0, 0.45))):
    put(chord, pluck(f, dur=1.8, t60=1.1, bright=1.0, seed=200+k), 0.018*k, g)
chord *= ST/np.abs(chord).max()
put(syn, chord, TURN)
put(syn, thump(f_lo=75, f_hi=165, dur=0.25), TURN, TP_/0.5*1.3)
syn *= np.where(np.arange(len(syn))/SR > 7.9, np.cos(0.5*np.pi*np.clip((np.arange(len(syn))/SR-7.9)/0.5, 0, 1))**2, 1.0)[:, None]

# ---------- bed-final: the groove, bars 4-16 ---------------------------------------------------------------------
g = read(A('bed-groove-1.mp3'), 2)
g = g[int(round(SHIFT*SR)):]
bar_gain_db = {4:+2.3, 5:+2.4, 6:+1.3, 7:+1.7, 8:-0.5, 9:-1.7, 10:-3.7, 11:-4.4, 12:-3.0, 13:-1.6, 14:+1.2, 15:+2.0, 16:0.0}
tt = np.arange(len(g))/SR + TURN
gdb = np.zeros(len(g))
for bar in sorted(bar_gain_db):                  # held at each bar's value, 0.2 s ramp from the previous bar's value
    t0 = (bar-1)*BAR
    prev = bar_gain_db.get(bar-1, bar_gain_db[bar])
    r = np.clip((tt - t0)/0.20, 0, 1)
    gdb = np.where(tt >= t0, prev + (bar_gain_db[bar]-prev)*r, gdb)
g *= db(gdb)[:, None]
put(groove, g, TURN)
out = groove[:N]

# ---------- the silent beat ----------------------------------------------------------------------------------
tt = np.arange(N)/SR
gate = np.ones(N)
gate = np.where(tt >= S0-0.015, np.cos(0.5*np.pi*np.clip((tt-(S0-0.015))/0.008, 0, 1)), gate)   # out across 17.797-17.805
gate = np.where(tt >= S0-0.007, 0.0, gate)
gate = np.where(tt >= S1-0.0035, np.sin(0.5*np.pi*np.clip((tt-(S1-0.0035))/0.0015, 0, 1)), gate)   # back at 18.2778-18.2793 (the groove's own downbeat attack is 2-4 ms ahead of the grid)
out = out*gate[:, None]

def w(name, x):
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','pcm_f32le',A(name)], input=x.astype(np.float32).tobytes(), check=True)
    print(f'-> {name}  {len(x)/SR:.3f} s  peak {np.abs(x).max():.3f} ({20*np.log10(np.abs(x).max()):.1f} dBFS)')
w('bed-final.wav', out)
w('synth-intro.wav', syn)
rms = lambda x, a, z: 20*np.log10(np.sqrt(np.mean(x[int(a*SR):int(z*SR)]**2))+1e-9)
print('bed-final bar RMS (dB):', ' '.join(f'{k+1}:{rms(out, k*BAR, (k+1)*BAR):.1f}' for k in range(3, 16)))
print('synth-intro bar RMS (dB):', ' '.join(f'{k+1}:{rms(syn, k*BAR, (k+1)*BAR):.1f}' for k in range(4)))
print('drone RMS over bars 1-3: %.1f dB' % rms(syn, 0, TURN-0.2))
