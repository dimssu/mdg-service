// The card viewer, lifted from reel 01's scene (the second reel needs it):
// a camera over a mounted card, keyframed in card pixels; the FLIP of a bubble
// tile into the viewer window; the tap marker; the bubble unfold.
// Everything is a pure function of t (DIRECTION §10.2).
(function (K) {
  const { M, E } = K;

  K.view = {
    /**
     * Camera over a card: card point (x, y) lands on screen anchor (ax, ay) at
     * scale s; ox shifts it sideways (a swipe); sy squashes it (a stamp).
     */
    apply(wrap, c) {
      const sy = c.sy ?? 1;
      wrap.style.transformOrigin = '0 0';
      wrap.style.transform = `translate(${c.ax + (c.ox || 0)}px, ${c.ay}px) scale(${c.s}, ${c.s * sy}) translate(${-c.x}px, ${-c.y}px)`;
    },
    /** Where card point (px, py) is on screen under camera c. */
    toScreen: (c, px, py) => [c.ax + (px - c.x) * c.s + (c.ox || 0), c.ay + (py - c.y) * c.s],
    /** Interpolate a camera from keyframes [[t, {x,y,s,ax,ay}, ease?], …], field by field. */
    keys(t, keys, fields = ['x', 'y', 's', 'ax', 'ay']) {
      const c = {};
      for (const f of fields) c[f] = M.kf(t, keys.map(([tt, v, ez]) => [tt, v[f], ez]));
      return c;
    },
    /** A framing that centres card rect r on the anchor, sized so the rect is `w` px wide on screen. */
    frameRect: (r, { w = 696, ax = 540, ay = 768, maxS = 4 } = {}) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2, s: Math.min(maxS, w / r.w), ax, ay }),
    /**
     * FLIP of a tile into a window: a clip-path inset that grows from the tile's
     * screen rect [l, t, r, b] to the window rect over [t0, t0 + dur].
     * Returns 'none' once the window is reached.
     */
    flipClip(t, t0, dur, tile, win = [0, 0, 1080, 1920], radius = [9, 0]) {
      const q = E.expoInOut(M.p(t, t0, dur));
      if (q >= 1) return win[0] === 0 && win[1] === 0 && win[2] === 1080 && win[3] === 1920 ? 'none' : `inset(${win[1]}px ${1080 - win[2]}px ${1920 - win[3]}px ${win[0]}px)`;
      const [l, tp, r, b] = tile;
      return `inset(${M.lerp(tp, win[1], q)}px ${M.lerp(1080 - r, 1080 - win[2], q)}px ${M.lerp(1920 - b, 1920 - win[3], q)}px ${M.lerp(l, win[0], q)}px round ${M.lerp(radius[0], radius[1], q)}px)`;
    },
    /** The tap marker: a soft grey disc that grows and fades at (x, y) from t0. */
    tap(parent) {
      const e = document.createElement('div');
      e.style.cssText = 'position:absolute;left:0;top:0;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:rgba(24,24,27,.20);pointer-events:none;';
      parent.appendChild(e);
      return {
        el: e,
        at(t, t0, x, y, dur = 0.45) {
          const q = M.p(t, t0, dur);
          e.style.transform = `translate(${x}px, ${y}px) scale(${0.3 + 0.8 * E.expoOut(q)})`;
          K.show(e, t >= t0 && t < t0 + dur ? 0.9 * (1 - q) : 0);
        },
      };
    },
    /** A chat bubble unfolding down from its top edge (p 0 → 1). */
    unfold(el, p, persp = 900) {
      el.style.transformOrigin = '50% 0';
      el.style.transform = `perspective(${persp}px) rotateX(${-90 * (1 - E.expoOut(M.clamp(p)))}deg)`;
    },
  };

  /**
   * K.flip(parent, { w, h }) — a two-faced card for a mirror flip (reel 02).
   * A holder with its own perspective (origin at the faces' centre), a
   * preserve-3d child, two faces with backface-visibility hidden, the back
   * face pre-rotated 180°. Mount a card into .front / .back; drive with set(deg).
   * Faces are top-aligned in one w-wide box; a taller face runs past h at the foot.
   */
  K.flip = function (parent, { w, h, perspective = 1800 } = {}) {
    const holder = document.createElement('div');
    holder.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;perspective:${perspective}px;perspective-origin:${w / 2}px ${h / 2}px;`;
    const inner = document.createElement('div');
    inner.style.cssText = `position:absolute;inset:0;transform-style:preserve-3d;transform-origin:${w / 2}px ${h / 2}px;`;
    const face = (back) => {
      const f = document.createElement('div');
      f.style.cssText = `position:absolute;left:0;top:0;width:${w}px;backface-visibility:hidden;-webkit-backface-visibility:hidden;${back ? 'transform:rotateY(180deg);' : ''}`;
      inner.appendChild(f);
      return f;
    };
    holder.appendChild(inner);
    parent.appendChild(holder);
    const front = face(false), back = face(true);
    return {
      holder, inner, front, back,
      set(deg) { inner.style.transform = Math.abs(deg) < 1e-3 ? 'none' : `rotateY(${deg}deg)`; },
      /** Which face shows at deg (for the QA proof). */
      shows: (deg) => (Math.cos((deg * Math.PI) / 180) >= 0 ? 'front' : 'back'),
    };
  };
})((window.Kit = window.Kit || {}));
