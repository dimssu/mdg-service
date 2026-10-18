"""Small, deterministic synthesis helpers for reel 02 (numpy only). Everything is seeded: run twice, same samples."""
import numpy as np, subprocess, os, wave
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda f: os.path.join(HERE, 'audio', f)

def rng(seed): return np.random.default_rng(seed)

def onepole_lp(x, cutoff):
    """One-pole low-pass; cutoff may be a scalar or a per-sample array (Hz)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), x.shape)
    a = 1 - np.exp(-2*np.pi*c/SR)
    y = np.empty_like(x, dtype=np.float64); s = 0.0
    for i in range(len(x)):
        s += a[i]*(x[i]-s); y[i] = s
    return y

def highpass(x, cutoff):
    return x - onepole_lp(x, cutoff)

def fade(x, fin=0.0, fout=0.0):
    x = x.copy(); n = len(x)
    if fin > 0:
        k = min(n, int(fin*SR)); x[:k] *= np.sin(np.linspace(0, np.pi/2, k))
    if fout > 0:
        k = min(n, int(fout*SR)); x[-k:] *= np.cos(np.linspace(0, np.pi/2, k))
    return x

def pluck(f0, dur=1.6, t60=0.9, bright=1.0, seed=1, partials=14, B=2e-5):
    """A dry plucked-string note: harmonic partials with higher ones dying faster, a hair of inharmonicity,
    a 4 ms pick click. Peak-normalised to 0.5."""
    n = int(dur*SR); t = np.arange(n)/SR; y = np.zeros(n)
    r = rng(seed)
    for k in range(1, partials+1):
        fk = f0*k*np.sqrt(1 + B*k*k)
        if fk > 9000: break
        a = (1.0/k**1.15)*(bright if k > 3 else 1.0)
        tau = t60/6.9/(1 + 0.55*(k-1))            # amplitude time constant: 60 dB at t60 for the fundamental
        y += a*np.sin(2*np.pi*fk*t + r.uniform(0, 0.4))*np.exp(-t/tau)
    click = r.standard_normal(int(0.004*SR)); click = highpass(click, 1500)
    y[:len(click)] += 0.35*click*np.hanning(len(click))*np.max(np.abs(y))
    y *= np.minimum(1, t/0.0015)                    # 1.5 ms attack so it does not click
    return 0.5*y/np.max(np.abs(y))

def thump(f_lo=70, f_hi=150, dur=0.22):
    """Muted hand-drum stroke. Body sweeps f_hi -> f_lo; the 2nd and 3rd harmonics carry it on a phone speaker."""
    n = int(dur*SR); t = np.arange(n)/SR
    f = f_lo + (f_hi-f_lo)*np.exp(-t/0.025)
    ph = 2*np.pi*np.cumsum(f)/SR
    env = np.exp(-t/0.065)*np.minimum(1, t/0.0012)
    y = env*(np.sin(ph) + 0.55*np.sin(2*ph) + 0.28*np.sin(3*ph))
    k = r = rng(7).standard_normal(int(0.006*SR)); k = onepole_lp(k, 900)
    y[:len(k)] += 0.25*k*np.hanning(len(k))
    return 0.5*y/np.max(np.abs(y))

def hairline(freq=3100, dur=0.03, tau=0.0032, seed=3):
    """A hairline tick: a very short, thin, high 'tk'. Not a click, not a beep."""
    n = int(dur*SR); t = np.arange(n)/SR
    env = np.exp(-t/tau)*np.minimum(1, t/0.0006)
    y = env*(np.sin(2*np.pi*freq*t) + 0.45*np.sin(2*np.pi*freq*2.31*t) + 0.2*np.sin(2*np.pi*freq*0.5*t))
    y += 0.06*env*rng(seed).standard_normal(n)
    return 0.5*y/np.max(np.abs(y))

def tock(dur=0.18):
    """Soft wooden tock: a hollow block, three decaying modes, a soft 1.2 ms attack. Lowpassed so it never bites."""
    n = int(dur*SR); t = np.arange(n)/SR
    modes = [(455, 1.0, 0.040), (930, 0.55, 0.026), (1520, 0.28, 0.016), (2240, 0.10, 0.009)]
    y = sum(a*np.exp(-t/tau)*np.sin(2*np.pi*f*t + 0.3) for f, a, tau in modes)
    y *= np.minimum(1, t/0.0012)
    c = rng(11).standard_normal(int(0.003*SR)); c = onepole_lp(c, 2500)
    y[:len(c)] += 0.22*c*np.hanning(len(c))
    y = onepole_lp(y, 4200)
    return 0.6*y/np.max(np.abs(y))

def whoosh(length, peak_at=0.45, f_lo=200, f_hi=2700, seed=5, stereo=False):
    """Airy whoosh: noise through a low-pass that opens toward the middle of the move and closes again."""
    n = int(length*SR); x = np.arange(n)/n
    a = peak_at
    bell = np.where(x < a, np.sin(0.5*np.pi*x/a)**2, np.cos(0.5*np.pi*(x-a)/(1-a))**2)
    out = []
    for ch in range(2 if stereo else 1):
        z = rng(seed+ch).standard_normal(n)
        cut = f_lo*(f_hi/f_lo)**bell
        y = onepole_lp(onepole_lp(onepole_lp(z, cut), cut), cut*1.2)
        y = highpass(y, 70)
        out.append(y*bell**1.3)
    y = np.stack(out, 1) if stereo else out[0]
    return 0.6*y/np.max(np.abs(y))

def riser(length, f_start=200, f_end=7000, seed=9):
    """Stereo riser into a downbeat: swept noise plus a rising A (A3 -> A5, the dominant of D) so it resolves into D."""
    n = int(length*SR); t = np.arange(n)/SR; x = t/length
    env = x**2.2
    env = env*np.where(x > 0.985, (1-x)/0.015, 1.0)
    chans = []
    for ch in range(2):
        z = rng(seed+ch).standard_normal(n)
        cut = f_start*(f_end/f_start)**(x**1.6)
        y = onepole_lp(onepole_lp(z, cut), cut*1.3)
        y = highpass(y, 220)
        chans.append(y)
    fr = 220*(4**(x**1.8))                                     # 220 -> 880 Hz, exponential
    ph = 2*np.pi*np.cumsum(fr)/SR
    tone = 0.09*np.sin(ph) + 0.05*np.sin(2*ph + 0.5)
    y = np.stack([c/np.max(np.abs(c))*0.85 + tone for c in chans], 1)*env[:, None]
    return 0.6*y/np.max(np.abs(y))

def save(name, y, peak=0.89):
    y = np.asarray(y, dtype=np.float64); y = y*(peak/np.max(np.abs(y)))
    ch = 1 if y.ndim == 1 else y.shape[1]
    pcm = (np.clip(y, -1, 1)*32767).astype('<i2')
    with wave.open(A(name), 'wb') as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f'-> {name}  {len(y)/SR:.3f} s, {ch} ch')

def read(path, ch=None):
    cmd = ['ffmpeg','-v','error','-i',path,'-ar',str(SR),'-f','f32le']
    if ch: cmd += ['-ac', str(ch)]
    raw = subprocess.run(cmd+['-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    if ch and ch > 1: x = x.reshape(-1, ch)
    return x.astype(np.float64)


# ---------------------------------------------------------------------------------------------------------------------
# Reel 03 additions: the split-flap board's clack, a drone, a tanker, soft hits.
# ---------------------------------------------------------------------------------------------------------------------
def bandpass(x, lo, hi):
    return onepole_lp(highpass(x, lo), hi)

def flap_click(kind='digit', seed=1, f_scale=1.0):
    """One flap landing: a plastic card hitting its lower half. 'tk' (a band-limited noise burst, 2 ms) on top of a short wooden
    'thock' (three decaying modes) and a smaller rebound 15 ms later (the card settling). Never a pure tone: not a tick."""
    r = rng(seed)
    n = int(0.10*SR); t = np.arange(n)/SR
    f1, tau1, tauN, bright = {'digit': (520, 0.0085, 0.0016, 1.00),
                              'word':  (310, 0.0150, 0.0024, 0.80),
                              'fold':  (230, 0.0120, 0.0034, 0.55)}[kind]
    f1 *= f_scale
    body = np.exp(-t/tau1)*(np.sin(2*np.pi*f1*t + 0.3) + 0.55*np.sin(2*np.pi*f1*1.52*t + 1.1) + 0.28*np.sin(2*np.pi*f1*2.31*t + 0.6))
    nz = r.standard_normal(n); nz = bandpass(nz, 1500, 7000)*np.exp(-t/tauN)
    nz = nz/(np.abs(nz).max()+1e-12)
    y = 0.75*body/np.abs(body).max() + bright*0.9*nz
    y *= np.minimum(1, t/0.0004)
    # rebound: smaller, a hair later and higher
    d = int(0.015*SR); reb = np.zeros(n); reb[d:] = y[:n-d]*0.30
    out = y + reb
    return out/np.abs(out).max()

def rattle(kinds, seed=1, L0=0.11, stagger=0.03, jitter=0.004, lead_pad=0.0, tail=0.09, amp_lo=0.70, f_jit=0.06, f_base=1.0):
    """The sound of one board row changing: one flap landing per changing flap, `stagger` apart (the board's own 0.03 s), the first
    landing `L0` after the row starts to flip (a flip is 0.14 s). `kinds` = one entry per flap ('digit' | 'word' | 'fold').
    Sample 0 = the row's flip start, so a cue is placed at the picture's flip start."""
    r = rng(seed*977 + len(kinds))
    n = int((lead_pad + L0 + stagger*(len(kinds)-1) + tail + 0.12)*SR)
    y = np.zeros(n)
    for i, k in enumerate(kinds):
        c = flap_click(k, seed=seed*31 + i, f_scale=f_base*(1 + r.uniform(-f_jit, f_jit)))
        a = r.uniform(amp_lo, 1.0)
        t0 = lead_pad + L0 + stagger*i + r.uniform(-jitter, jitter)
        s = int(round(max(0, t0)*SR)); e = min(n, s + len(c))
        y[s:e] += a*c[:e-s]
    return y/np.abs(y).max()

def drone(length, f0=146.83, seed=5):
    """A quiet, dark, steady drone on D (no third in it): D2 A2 D3 A3 with a slow beat between two detuned copies, a little
    nonlinearity for a buzz (tanpura-like), then low-passed so it never gets bright. Peak-normalised to 0.5."""
    n = int(length*SR); t = np.arange(n)/SR; r = rng(seed)
    y = np.zeros(n)
    for f, a in ((f0/2, 0.55), (f0*0.75, 0.40), (f0, 1.0), (f0*1.5, 0.55), (f0*2, 0.40)):
        for det, ph in ((-0.17, 0.0), (0.17, 1.3)):
            y += a*np.sin(2*np.pi*(f+det)*t + ph + r.uniform(0, 0.5))
    y = np.tanh(1.6*y/np.abs(y).max())
    y = onepole_lp(onepole_lp(y, 900), 1100)
    y *= 1 + 0.06*np.sin(2*np.pi*0.31*t)                     # a very slow breath
    return 0.5*y/np.max(np.abs(y))
