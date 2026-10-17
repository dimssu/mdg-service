// Easing — every curve is a pure function of progress (0..1) or of seconds.
// DIRECTION §6: expo-out entrances, quart camera, critically damped springs only.
(function (K) {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const E = {
    linear: (x) => x,
    expoOut: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    expoIn: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    expoInOut: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    quartOut: (x) => 1 - Math.pow(1 - x, 4),
    quartIn: (x) => x * x * x * x,
    quartInOut: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
    cubicOut: (x) => 1 - Math.pow(1 - x, 3),
    sineInOut: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    /** Material 3 "emphasized" — for UI moves inside the phone. */
    emph: bezier(0.2, 0, 0, 1),
    /** Critically damped spring in seconds: 0 → 1, never overshoots. ω ≈ 14 settles in ~0.45 s. */
    spring: (sec, w = 14) => (sec <= 0 ? 0 : 1 - (1 + w * sec) * Math.exp(-w * sec)),
    bezier,
    clamp,
  };

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return sy(clamp(t));
    };
  }

  K.E = E;
})((window.Kit = window.Kit || {}));
