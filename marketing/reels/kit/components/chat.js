// The live Dealer Kavach chat, drawn from the real tokens (DIRECTION §5.4,
// mdg-client/src/index.css, captures 01–04). Built in logical CSS px — the
// phone is 390×811 like the captures — and scaled as one object.
// No timestamps by default (a time beside a report reads as a delivery hour).
(function (K) {
  const SVG = (inner, vb = '0 0 24 24', extra = '') =>
    `<svg viewBox="${vb}" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}>${inner}</svg>`;
  const ICON = {
    back: SVG('<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>'),
    dots: SVG('<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>'),
    clip: SVG('<path d="M21.4 11.1l-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8"/>'),
    cam: SVG('<path d="M14.5 4h-5L7.5 6.5H4.8A1.8 1.8 0 0 0 3 8.3v9.9A1.8 1.8 0 0 0 4.8 20h14.4a1.8 1.8 0 0 0 1.8-1.8V8.3a1.8 1.8 0 0 0-1.8-1.8h-2.7z"/><circle cx="12" cy="13" r="3.4"/>'),
    mic: SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>', '0 0 24 24', 'stroke="#fff"'),
  };
  // The app's wallpaper doodle: an 84 px tile of small outline shapes at 4.5% ink.
  const DOODLE =
    "url(\"data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84' fill='none' stroke='rgba(17,27,33,0.045)' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>` +
        `<circle cx='14' cy='14' r='6'/><path d='M50 8l8 8M58 8l-8 8'/><path d='M8 52c4-4 8 4 12 0s8 4 12 0'/>` +
        `<path d='M60 46l8 13H52z'/><rect x='38' y='62' width='12' height='12' rx='3'/><path d='M70 74a8 8 0 0 1 8-8'/></svg>`,
    ) +
    '")';

  const css = `
  .ph { position:absolute; width:414px; height:860px; border-radius:58px; background:#0c0c0d; padding:12px;
        box-shadow: 0 34px 38px -24px rgba(24,24,27,.45), 0 0 0 1.5px #2a2a2c inset; transform-origin: 50% 50%; }
  .ph-scr { position:relative; width:390px; height:836px; border-radius:46px; overflow:hidden; background:#f3f2f0; }
  .ph-cam { position:absolute; top:10px; left:50%; width:12px; height:12px; margin-left:-6px; border-radius:50%; background:#0c0c0d; z-index:5; }
  .ph-status { height:30px; background:#fff; }
  .ch-bar { height:56px; background:#fff; border-bottom:1px solid #e9edef; display:flex; align-items:center; padding:0 6px 0 4px; gap:6px; }
  .ch-ic { width:24px; height:24px; color:#54656f; flex:none; }
  .ch-back { margin:0 2px 0 6px; color:#111b21; }
  .ch-av { width:40px; height:40px; border-radius:50%; background:#e7e5e4; display:flex; align-items:center; justify-content:center; flex:none; overflow:hidden; }
  .ch-title { flex:1; min-width:0; line-height:1.15; }
  .ch-t1 { font: 500 17px/1.2 var(--f-deva); color:#111b21; }
  .ch-t2 { font: 400 13px/1.2 var(--f-deva); color:#667781; }
  .ch-wall { position:absolute; left:0; right:0; top:86px; bottom:0; background-color:#f3f2f0; background-image:${DOODLE}; background-size:84px 84px; }
  .ch-date { position:absolute; left:50%; transform:translateX(-50%); background:#fff; color:#54656f; font: 500 12.5px/1 var(--f-deva);
             padding:6px 12px; border-radius:8px; box-shadow:0 1px .5px rgba(11,20,26,.13); }
  .bub { position:absolute; background:#fff; border-radius:8px; box-shadow:0 1px .5px rgba(11,20,26,.13); padding:3px; }
  .bub.tail::before { content:''; position:absolute; top:0; left:-8px; width:8px; height:10px; background:#fff;
             clip-path: polygon(100% 0, 0 0, 100% 100%); }
  .bub-album { display:flex; gap:3px; }
  .bub-tile { position:relative; overflow:hidden; border-radius:6px; background:#f4ede0; }
  .bub-cap { font: 400 15px/1.35 var(--f-deva); color:#111b21; padding:5px 6px 6px 6px; }
  .comp { position:absolute; left:8px; right:8px; bottom:12px; height:48px; display:flex; gap:6px; }
  .comp-pill { flex:1; background:#fff; border-radius:24px; display:flex; align-items:center; padding:0 14px 0 18px; gap:14px;
               box-shadow:0 1px .5px rgba(11,20,26,.08); }
  .comp-ph { flex:1; font: 400 16px/1 var(--f-deva); color:#8696a0; }
  .comp-ic { width:22px; height:22px; color:#54656f; }
  .comp-mic { width:48px; height:48px; border-radius:50%; background:#18181b; display:flex; align-items:center; justify-content:center; flex:none; }
  .comp-mic > div { width:24px; height:24px; }
  `;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  K.chat = {
    css,
    ICON,
    /** A phone holding the support thread. Returns refs; position/scale it with K.tf on .root. */
    phone(parent, { title = 'सहायता', subtitle = 'MDG टीम', avatar } = {}) {
      if (!document.getElementById('kit-chat-css')) {
        const s = el('style'); s.id = 'kit-chat-css'; s.textContent = css; document.head.appendChild(s);
      }
      const root = el('div', 'ph');
      const scr = el('div', 'ph-scr');
      root.appendChild(scr);
      scr.appendChild(el('div', 'ph-cam'));
      scr.appendChild(el('div', 'ph-status'));
      const bar = el('div', 'ch-bar');
      bar.appendChild(el('div', 'ch-ic ch-back', ICON.back));
      const av = el('div', 'ch-av');
      if (avatar) av.appendChild(avatar);
      bar.appendChild(av);
      const tt = el('div', 'ch-title');
      tt.appendChild(el('div', 'ch-t1', title));
      tt.appendChild(el('div', 'ch-t2', subtitle));
      bar.appendChild(tt);
      bar.appendChild(el('div', 'ch-ic', ICON.dots));
      scr.appendChild(bar);
      const wall = el('div', 'ch-wall');
      scr.appendChild(wall);
      const comp = el('div', 'comp');
      const pill = el('div', 'comp-pill');
      pill.appendChild(el('div', 'comp-ph', 'मैसेज'));
      pill.appendChild(el('div', 'comp-ic', ICON.clip));
      pill.appendChild(el('div', 'comp-ic', ICON.cam));
      comp.appendChild(pill);
      const mic = el('div', 'comp-mic');
      mic.appendChild(el('div', '', ICON.mic));
      comp.appendChild(mic);
      wall.appendChild(comp);
      parent.appendChild(root);
      return { root, screen: scr, wall, bar, avatar: av, composer: comp };
    },
    dateChip(wall, text, top) {
      const c = el('div', 'ch-date', text);
      c.style.top = `${top}px`;
      wall.appendChild(c);
      return c;
    },
    /**
     * A two-picture album bubble, as a DSR arrives: stock check left, sales right.
     * tiles: [{ w, h }] logical px. Returns { root, tiles: [div, div], caption }.
     */
    /**
     * One picture in a bubble (reel 03: the Credit & DOD card), the caption under it as the app draws it.
     * tile: [w, h] logical px. Returns { root, tile, caption }.
     */
    photoBubble(wall, { left = 8, top = 60, tile = [306, 300], caption = '' } = {}) {
      const b = el('div', 'bub tail');
      b.style.left = `${left}px`;
      b.style.top = `${top}px`;
      const t = el('div', 'bub-tile');
      t.style.width = `${tile[0]}px`;
      t.style.height = `${tile[1]}px`;
      b.appendChild(t);
      const cap = el('div', 'bub-cap', caption);
      cap.style.width = `${tile[0]}px`;
      b.appendChild(cap);
      wall.appendChild(b);
      return { root: b, tile: t, caption: cap };
    },
    albumBubble(wall, { left = 8, top = 60, tile = [146, 150], caption = '' } = {}) {
      const b = el('div', 'bub tail');
      b.style.left = `${left}px`;
      b.style.top = `${top}px`;
      const album = el('div', 'bub-album');
      const tiles = [0, 1].map(() => {
        const t = el('div', 'bub-tile');
        t.style.width = `${tile[0]}px`;
        t.style.height = `${tile[1]}px`;
        album.appendChild(t);
        return t;
      });
      b.appendChild(album);
      const cap = el('div', 'bub-cap', caption);
      cap.style.width = `${tile[0] * 2 + 3}px`;
      b.appendChild(cap);
      wall.appendChild(b);
      return { root: b, tiles, caption: cap };
    },
  };
})((window.Kit = window.Kit || {}));
