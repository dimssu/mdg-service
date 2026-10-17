// Mount a real report card (HTML string from kit/cards/build-cards.mts) as live
// DOM inside a Shadow root, so the camera can macro-zoom without pixels and
// parts can be lifted out. Fonts come from the main document: @font-face is
// ignored inside a shadow root. The card's html/body rules are rewritten to
// :host or the card loses its font stack and background.
(function (K) {
  function adaptCss(css) {
    return css
      .replace(/(^|[}\s,])html\s*,\s*body(?=\s*[{,])/g, '$1:host')
      .replace(/(^|[}\s])body(?=\s*\{)/g, '$1:host')
      .replace(/(^|[}\s])html(?=\s*\{)/g, '$1:host');
  }

  K.card = {
    /**
     * mount(host, html, { hide: [selectors], css: '' }) → card handle.
     * Hidden elements use display:none (never blanked text: DIRECTION §5.4).
     */
    mount(host, html, { hide = [], css = '' } = {}) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const style = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
      const root = host.attachShadow({ mode: 'open' });
      const st = document.createElement('style');
      st.textContent =
        adaptCss(style) +
        '\n:host{display:inline-block !important;padding:0 !important;margin:0 !important;}' +
        '\n*{animation:none !important;transition:none !important;}' +
        (hide.length ? `\n${hide.join(',')}{display:none !important;}` : '') +
        '\n' + css;
      root.appendChild(st);
      const frame = document.importNode(doc.getElementById('frame'), true);
      root.appendChild(frame);
      const h = {
        host,
        root,
        frame,
        q: (s) => root.querySelector(s),
        qa: (s) => [...root.querySelectorAll(s)],
        /** Size of the picture (the #frame, parchment margin included — what the PNG is). */
        size() {
          return { w: frame.offsetWidth, h: frame.offsetHeight };
        },
        /**
         * Rect of an element in card pixels (relative to #frame). Call while the
         * card is untransformed (at init), then keep the numbers.
         */
        rect(elOrSel) {
          const el = typeof elOrSel === 'string' ? root.querySelector(elOrSel) : elOrSel;
          if (!el) throw new Error(`card.rect: no ${elOrSel}`);
          const f = frame.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          const k = frame.offsetWidth / f.width;
          return { x: (r.left - f.left) * k, y: (r.top - f.top) * k, w: r.width * k, h: r.height * k };
        },
        /**
         * Rect, in card pixels, of the first occurrence of `sub` inside an element's
         * text (a Range over its text nodes) — for lifting part of one run, e.g.
         * `(400 L)` out of the band line. Call at init, untransformed.
         */
        textRect(elOrSel, sub) {
          const el = typeof elOrSel === 'string' ? root.querySelector(elOrSel) : elOrSel;
          if (!el) throw new Error(`card.textRect: no ${elOrSel}`);
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n; (n = walker.nextNode());) {
            const i = n.nodeValue.indexOf(sub);
            if (i < 0) continue;
            const rg = document.createRange();
            rg.setStart(n, i); rg.setEnd(n, i + sub.length);
            const f = frame.getBoundingClientRect(), r = rg.getBoundingClientRect();
            const k = frame.offsetWidth / f.width;
            return { x: (r.left - f.left) * k, y: (r.top - f.top) * k, w: r.width * k, h: r.height * k };
          }
          throw new Error(`card.textRect: "${sub}" not in ${elOrSel}`);
        },
        text() {
          return frame.innerText;
        },
      };
      return h;
    },
    /** Selectors every public reel hides on the DSR cards (DIRECTION §4, §5.4). */
    DSR_HIDE: ['.htitle .code', '.foot-r', '.ds-l'],
    /** Strings that must never be readable on a public card. */
    // reel 02 added: the excess card's advice ("adjust the stock to fit"), the fixtures' code, the date strip's label
    FORBIDDEN: [/portal/i, /पोर्टल/, /IRAS/, /हाथ से भरी/, /डिप बढ़ने/, /MDG दिशा-निर्देश/, /\b\d{1,2}:\d{2}\b/, /ठीक करें/, /decant/i, /X0X/, /CURRENT DATE AND TIME/],
    assertClean(handle, expect = []) {
      const txt = handle.text();
      const bad = K.card.FORBIDDEN.filter((re) => re.test(txt)).map(String);
      const missing = expect.filter((s) => !txt.includes(s));
      if (bad.length || missing.length) {
        throw new Error(`card text check failed — forbidden: ${bad.join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'}`);
      }
      return true;
    },
  };
})((window.Kit = window.Kit || {}));
