// One virtual camera per world: maps a world point to a screen anchor at a scale.
// cam(el, { x, y, s, rot }) — the world point (x, y) lands on the anchor
// (default the hero point 540, 768 — DIRECTION §5.3) at scale s.
(function (K) {
  K.cam = function (el, { x, y, s = 1, rot = 0, ax = 540, ay = 768 }) {
    el.style.transformOrigin = '0 0';
    el.style.transform = `translate(${ax}px, ${ay}px) rotate(${rot}deg) scale(${s}) translate(${-x}px, ${-y}px)`;
  };
  /** Set a transform from parts, in one place, so every component composes the same way. */
  K.tf = function (el, { x = 0, y = 0, s = 1, sx, sy, r = 0, rx = 0, ry = 0, z = 0, o } = {}) {
    const scale = sx != null || sy != null ? `scale(${sx ?? s}, ${sy ?? s})` : `scale(${s})`;
    el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) ${scale}`;
    if (o != null) K.show(el, o);
  };
  /** Opacity + visibility in one call (an invisible element costs nothing to paint). */
  K.show = function (el, o) {
    el.style.opacity = String(o);
    el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
  };
})((window.Kit = window.Kit || {}));
