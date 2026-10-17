// Motion helpers — tweens, keyframes and the BPM clock. Everything is a pure
// function of t (seconds): no state, no timers (DIRECTION §10.2).
(function (K) {
  const E = K.E;
  const clamp = E.clamp;
  const lerp = (a, b, p) => a + (b - a) * p;

  const M = {
    clamp,
    lerp,
    /** 0..1 progress of t through [t0, t0+dur]. */
    p: (t, t0, dur) => (dur <= 0 ? (t >= t0 ? 1 : 0) : clamp((t - t0) / dur)),
    /** eased progress. */
    e: (t, t0, dur, ease = E.expoOut) => ease(M.p(t, t0, dur)),
    /** value from a to b over [t0, t0+dur] with ease. */
    tw: (t, t0, dur, a, b, ease = E.expoOut) => lerp(a, b, ease(M.p(t, t0, dur))),
    /** spring from a to b starting at t0 (critically damped). */
    sp: (t, t0, a, b, w = 14) => lerp(a, b, E.spring(t - t0, w)),
    /** in-hold-out envelope: 0 → 1 over [a, a+fin], 1 until b, → 0 over [b, b+fout]. */
    env: (t, a, fin, b, fout, easeIn = E.expoOut, easeOut = E.quartIn) =>
      t < a ? 0 : t < a + fin ? easeIn(M.p(t, a, fin)) : t < b ? 1 : t < b + fout ? 1 - easeOut(M.p(t, b, fout)) : 0,
    /**
     * Keyframes: kf(t, [[t0, v0], [t1, v1, ease], …]) — the ease on a key applies
     * to the segment arriving at it. Values may be numbers or equal-length arrays.
     */
    kf(t, keys) {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) {
        const [t1, v1, ease = E.expoOut] = keys[i];
        const [t0, v0] = keys[i - 1];
        if (t <= t1) {
          const q = ease(M.p(t, t0, t1 - t0));
          return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], q)) : lerp(v0, v1, q);
        }
      }
      return keys[keys.length - 1][1];
    },
    /** is t inside [a, b)? */
    in: (t, a, b) => t >= a && t < b,
  };

  /** BPM grid: clock(120).at(bar, beat) → seconds (bar and beat 1-based). */
  K.clock = (bpm, bars) => {
    const beat = 60 / bpm;
    return {
      bpm,
      beat,
      bar: beat * 4,
      duration: bars ? bars * beat * 4 : undefined,
      at: (bar, b = 1) => (bar - 1) * 4 * beat + (b - 1) * beat,
      beats: (n) => n * beat,
    };
  };

  K.M = M;
})((window.Kit = window.Kit || {}));
