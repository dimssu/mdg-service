// Kit.flap — a split-flap (departure) board, built for reel 03 and meant to be quoted by reel 15.
// Every style is a pure function of t (DIRECTION §10.2): a row is a schedule of values, and seek(t)
// works out, per flap, which glyph is up and how far its flip has turned.
//
// One flap = four halves of one card, split at its middle:
//   top      — the NEW value's top half (uncovered as the old top falls away)
//   bottom   — the OLD value's bottom half (covered as the new bottom rises)
//   fall     — the OLD top half, turning 0 → −90° about the split line (first half of the flip)
//   rise     — the NEW bottom half, turning +90 → 0° about the split line (second half)
// so no half ever shows a mirrored glyph: a half is hidden past 90° (backface hidden too).
// Only `top` carries the counted copy of the glyph; the other three are marked [data-dup] so
// kit/render/motion.mjs does not count a word four times.
//
// Digits flip per character; a Hindi word or phrase lives in ONE wide flap and flips whole
// (DIRECTION §5.2 rule 2 — never split Devanagari into code points). Not for reel 13's odometer.
(function (K) {
  const { M, E } = K;
  const CSS = `
  .flb { position:absolute; left:0; top:0; }
  .flrow { position:absolute; left:0; top:0; transform-origin:50% 50%; }
  .fl { position:absolute; top:0; perspective:700px; }
  .fl > .h { position:absolute; left:0; width:100%; overflow:hidden; background:#18181b; color:#fff;
             backface-visibility:hidden; -webkit-backface-visibility:hidden; }
  .fl > .h.t { top:0; border-radius:10px 10px 0 0; }
  .fl > .h.b { border-radius:0 0 10px 10px; }
  .fl > .h > .g { position:absolute; left:0; width:100%; display:flex; align-items:center; justify-content:center;
                  white-space:nowrap; }
  .fl > .split { position:absolute; left:0; width:100%; height:2px; margin-top:-1px; background:rgba(255,255,255,.14); }
  .fl > .h > .shade { position:absolute; inset:0; background:#000; opacity:0; }
  /* the turning halves catch the light: a blank card turning over a blank card still reads as a flip */
  .fl > .h.mv { background:#34343a; }
  .fl.char .g { font: 800 var(--fs,110px)/1 var(--f-latin); letter-spacing:-0.02em; font-variant-numeric: tabular-nums; }
  .fl.word .g { font: 800 var(--fs,60px)/1.25 var(--f-deva); letter-spacing:0; }
  `;
  const el = (cls, parent, html) => { const e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };

  /** One flap: w × h, kind 'char' | 'word'. */
  function flap(parent, { w, h, kind = 'char', fs, x = 0 }) {
    const f = el(`fl ${kind}`, parent);
    f.style.cssText = `left:${x}px;width:${w}px;height:${h}px;perspective-origin:50% ${h / 2}px;${fs ? `--fs:${fs}px;` : ''}`;
    const half = (cls, dup) => {
      const hh = el(`h ${cls}`, f);
      hh.style.height = `${h / 2}px`;
      if (cls === 'b') hh.style.top = `${h / 2}px`;
      const g = el('g', hh);
      g.style.height = `${h}px`;
      g.style.top = cls === 'b' ? `${-h / 2}px` : '0px';
      if (dup) g.setAttribute('data-dup', '');
      const shade = el('shade', hh);
      return { hh, g, shade };
    };
    const top = half('t', false), bottom = half('b', true), fall = half('t', true), rise = half('b', true);
    fall.hh.classList.add('mv'); rise.hh.classList.add('mv');
    fall.hh.style.transformOrigin = `50% ${h / 2}px`;    // the split line (bottom edge of a top half)
    rise.hh.style.transformOrigin = '50% 0px';            // the split line (top edge of a bottom half)
    el('split', f).style.top = `${h / 2}px`;
    const set = (g, v) => { if (g.textContent !== v) g.textContent = v; };
    return {
      el: f, w, h,
      /** Draw the flap turning from `from` to `to`, q ∈ [0, 1] (0 = settled on from, 1 = settled on to). */
      draw(from, to, q, force = false) {
        if (q <= 0 || (from === to && !force)) {
          set(top.g, from); set(bottom.g, from);
          K.show(fall.hh, 0); K.show(rise.hh, 0);
          top.shade.style.opacity = '0'; bottom.shade.style.opacity = '0';
          return;
        }
        if (q >= 1) { this.draw(to, to, 0); return; }
        set(top.g, to); set(bottom.g, from); set(fall.g, from); set(rise.g, to);
        const a = M.clamp(q * 2), b = M.clamp(q * 2 - 1);   // first half: the old top falls; second: the new bottom rises
        fall.hh.style.transform = `rotateX(${(-90 * a).toFixed(2)}deg)`;
        K.show(fall.hh, a < 1 ? 1 : 0);
        fall.shade.style.opacity = (0.45 * a).toFixed(3);
        top.shade.style.opacity = (0.35 * (1 - a)).toFixed(3);     // the uncovered new top lightens as it is revealed
        rise.hh.style.transform = `rotateX(${(90 * (1 - b)).toFixed(2)}deg)`;
        K.show(rise.hh, b > 0 ? 1 : 0);
        rise.shade.style.opacity = (0.45 * (1 - b)).toFixed(3);
        bottom.shade.style.opacity = (0.3 * b).toFixed(3);         // the old bottom darkens as it is covered
      },
    };
  }

  /**
   * A row of flaps. cells: [{ w, kind, fs }]; gap px; h px. Laid out centred on x = 0 of the row
   * element (place the row with its own transform). schedule: [[t0, value, { force }]] — a value is a
   * string per cell for char rows ('₹4,86,120' → one char per cell, ' ' for blank) or an array of
   * strings for mixed rows. force flips every flap even where the glyph is unchanged (a riffle);
   * stagger overrides the row's own for that one change (a figure arriving can land faster).
   */
  function row(board, { cells, h = 136, gap = 6, flipDur = 0.14, stagger = 0.03 } = {}) {
    const r = el('flrow', board.el);
    const width = cells.reduce((s, c) => s + c.w, 0) + gap * (cells.length - 1);
    let x = -width / 2;
    const flaps = cells.map((c) => { const f = flap(r, { w: c.w, h, kind: c.kind || 'char', fs: c.fs, x }); x += c.w + gap; return f; });
    let sched = [];
    const split = (v) => (Array.isArray(v) ? v : [...v]).map((s) => (s === ' ' ? ' ' : s));
    return {
      el: r, width, height: h, flaps,
      schedule(list) { sched = list.slice().sort((a, b) => a[0] - b[0]); return this; },
      /** The value up at time t (the latest entry at or before t). */
      valueAt(t) { let v = null; for (const [t0, val] of sched) if (t0 <= t) v = val; return v; },
      seek(t) {
        if (!sched.length) return;
        let cur = split(sched[0][1]), prev = cur, t0 = -Infinity, force = false, st = stagger;
        for (const [ts, val, o] of sched) if (ts <= t) { prev = cur; cur = split(val); t0 = ts; force = !!(o && o.force); st = o && o.stagger != null ? o.stagger : stagger; }
        // stagger by index among the flaps that change
        let k = 0;
        flaps.forEach((f, i) => {
          const a = prev[i] ?? ' ', b = cur[i] ?? ' ';
          const changes = force || a !== b;
          if (!changes) { f.draw(b, b, 0); return; }
          const s0 = t0 + st * k++;
          const q = E.quartOut(M.p(t, s0, flipDur));
          // a forced flip turns the card even onto the same glyph (the riffle: blank onto blank)
          f.draw(a, b, q, force);
        });
      },
    };
  }

  K.flap = {
    board(parent) {
      if (!document.getElementById('kit-flap-css')) {
        const s = document.createElement('style'); s.id = 'kit-flap-css'; s.textContent = CSS; document.head.appendChild(s);
      }
      const b = { el: el('flb', parent) };
      b.row = (spec) => row(b, spec);
      return b;
    },
  };
})((window.Kit = window.Kit || {}));
