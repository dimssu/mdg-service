// Type helpers: Hindi-safe kinetic lines, number formatting and counters.
// DIRECTION §5.2: animate by word or line (never split Devanagari into code
// points), masks padded so matras are never clipped, numbers en-IN, true minus.
(function (K) {
  const { M, E } = K;

  K.fmt = {
    /** en-IN grouping, whole numbers: 478310 → "4,78,310". */
    inr: (n) => Math.round(n).toLocaleString('en-IN'),
    /** signed with a true minus (U+2212). */
    signed: (n) => (n < 0 ? '−' : n > 0 ? '+' : '') + Math.abs(Math.round(n)).toLocaleString('en-IN'),
  };

  /** A counter value at t: from → to over [t0, t0+dur], eased, rounded. */
  K.count = (t, t0, dur, from, to, ease = E.expoOut) => Math.round(M.tw(t, t0, dur, from, to, ease));

  K.kin = {
    /**
     * Build a line of kinetic type. words: true splits on spaces (Devanagari
     * words stay whole); otherwise the line moves as one block. A '\n' in the
     * text forces the break, where an automatic wrap would split a phrase.
     * Returns { el, parts } — style el (font, size, position) as you like.
     */
    line(parent, text, { cls = '', words = true, tag = 'div' } = {}) {
      const el = document.createElement(tag);
      el.className = `kline-wrap ${cls}`;
      const parts = [];
      if (words) {
        text.split('\n').forEach((ln, j) => {
          if (j > 0) el.appendChild(document.createElement('br'));
          ln.split(' ').forEach((w, i, arr) => {
            const mask = document.createElement('span');
            mask.className = 'kword';
            const inner = document.createElement('span');
            inner.className = 'kin';
            inner.textContent = w;
            mask.appendChild(inner);
            el.appendChild(mask);
            if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
            parts.push(inner);
          });
        });
      } else {
        const mask = document.createElement('span');
        mask.className = 'kline';
        const inner = document.createElement('span');
        inner.className = 'kin';
        inner.textContent = text;
        mask.appendChild(inner);
        el.appendChild(mask);
        parts.push(inner);
      }
      parent.appendChild(el);
      return { el, parts };
    },
    /**
     * Drive a line at time t: words rise in from below their masks starting at
     * tIn (stagger s between words, each over dur), then leave upward at tOut.
     */
    play(line, t, tIn, tOut = Infinity, { dur = 0.42, stagger = 0.06, outDur = 0.2, outStagger = 0.012, drift = 0.02 } = {}) {
      // a held line never freezes (DIRECTION §6): it grows by `drift` over its first 3.5 s
      const span = Math.min(3.5, (tOut === Infinity ? 3.5 : tOut - tIn));
      const d = 1 + drift * E.sineInOut(M.p(t, tIn, Math.max(0.5, span)));
      line.el.style.transformOrigin = '0 100%';
      line.el.style.transform = `scale(${d.toFixed(4)})`;
      const n = line.parts.length;
      let any = false;
      line.parts.forEach((p, i) => {
        const a = E.expoOut(M.p(t, tIn + i * stagger, dur));
        const b = E.quartIn(M.p(t, tOut + i * outStagger, outDur));
        const y = (1 - a) * 115 - b * 115;
        p.style.transform = Math.abs(y) < 0.01 ? 'none' : `translateY(${y.toFixed(3)}%)`;
        // A word parked outside its mask still shows its tops (headline bar,
        // matras, a 7's bar) through the mask's padding: hide it while parked.
        const live = a > 0 && b < 1;
        p.style.visibility = live ? 'visible' : 'hidden';
        if (live) any = true;
      });
      K.show(line.el, any ? 1 : 0);
      return any;
    },
  };
})((window.Kit = window.Kit || {}));
