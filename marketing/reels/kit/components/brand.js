// The MDG mark (the app's traced outline), the end card (DIRECTION §8) and
// the fonts proof.
(function (K) {
  const { M, E } = K;
  const NS = 'http://www.w3.org/2000/svg';

  /**
   * The real MDG mark (people in an open hand inside an open ring) — the app's
   * own traced outline (kit/brand/logo/mark-path.js, from BrandMark.tsx).
   * draw(p) reveals it with a sweep around the ring, starting at the ring's
   * open end, so it reads as the mark being drawn. Never recoloured gold.
   */
  K.mark = function (parent, { size = 120, color = '#111111' } = {}) {
    if (!K.MARK_PATH) throw new Error('load kit/brand/logo/mark-path.js before brand.js');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-11.5 0 1024 1024');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', K.MARK_PATH);
    path.setAttribute('fill', color);
    path.setAttribute('fill-rule', 'evenodd');
    // small marks grow their ink exactly as the app does (BrandMark inkGrowthFor): `grow` is in viewBox
    // units of the 1024 box, not pixels — scaling it by 1024/size turned a 30 px mark into a blob (v2a)
    const grow = size <= 36 ? 4 : size <= 64 ? 2 : 0;
    if (grow) { path.setAttribute('stroke', color); path.setAttribute('stroke-width', String(grow)); path.setAttribute('stroke-linejoin', 'round'); }
    svg.appendChild(path);
    parent.appendChild(svg);
    return {
      svg,
      draw(p) {
        const q = E.quartInOut(M.clamp(p));
        if (q >= 1) { svg.style.webkitMaskImage = svg.style.maskImage = 'none'; svg.style.opacity = '1'; return; }
        const deg = (q * 360).toFixed(2);
        const m = `conic-gradient(from 32deg, #000 0deg, #000 ${deg}deg, transparent ${deg}deg)`;
        svg.style.webkitMaskImage = m;
        svg.style.maskImage = m;
        svg.style.opacity = q > 0 ? '1' : '0';
      },
    };
  };

  /**
   * The series end card (DIRECTION §8): one action — call. Builds the parts at
   * their resting layout inside `parent` (a full-stage layer) and returns them;
   * the reel animates them in and must leave them static for the last ≥ 2 s.
   * logoSrc: path to logo-full.png relative to the reel's index.html.
   */
  // The logo PNG is read from mdg-landing (tracked there); PNGs are git-ignored under marketing/.
  K.endcard = function (parent, { logoSrc = '../../../../mdg-landing/public/logo-full.png' } = {}) {
    if (!document.getElementById('kit-endcard-css')) {
      const s = document.createElement('style');
      s.id = 'kit-endcard-css';
      s.textContent = `
      .ec { position:absolute; inset:0; }
      .ec > * { position:absolute; }
      /* one centre axis (DIRECTION §5.3): every line centred on x = 540 and no wider than 696 px, so it stays
         inside the hard-safe box (x 72–888) — the number included */
      .ec-c { left:0; width:1080px; text-align:center; white-space:nowrap; }
      .ec-label { top:296px; font: 700 44px/1.3 var(--f-deva); color:#57534e; }
      .ec-num { top:352px; font: 800 86px/1.05 var(--f-latin); letter-spacing:-0.035em; color:#18181b; font-variant-numeric: tabular-nums; }
      .ec-rule { left:0; right:0; margin:0 auto; top:450px; height:10px; width:683px; background:#f5a524; border-radius:5px; }
      .ec-sub { top:472px; font: 600 44px/1.35 var(--f-deva); color:#57534e; }
      .ec-tile { left:448px; top:590px; width:184px; height:184px; border-radius:42px; background:#fff;
                 box-shadow: 0 16px 30px -18px rgba(24,24,27,.40), 0 0 0 1.5px rgba(24,24,27,.07); display:flex; align-items:center; justify-content:center; }
      .ec-name { top:796px; font: 800 76px/1.05 var(--f-latin); letter-spacing:-0.03em; color:#18181b; }
      .ec-namehi { top:874px; font: 700 54px/1.3 var(--f-deva); color:#18181b; }
      .ec-url { top:986px; font: 700 64px/1.1 var(--f-latin); letter-spacing:-0.02em; color:#18181b; }
      .ec-play { top:1058px; font: 600 44px/1.35 var(--f-deva); color:#57534e; }
      .ec-foot { left:0; width:1080px; top:1150px; display:flex; align-items:center; justify-content:center; gap:28px; }
      .ec-logo { height:70px; width:auto; }
      .ec .lat { font-family: var(--f-latin); }
      .ec-tag { font: 600 40px/1.2 var(--f-latin); color:#57534e; white-space:nowrap; letter-spacing:-0.01em; }
      `;
      document.head.appendChild(s);
    }
    const root = document.createElement('div');
    root.className = 'ec';
    // centred lines carry their text in an inner span, so the scene can measure the words, not the full-width box
    const mk = (cls, html, tag = 'div') => {
      const e = document.createElement(tag); e.className = cls;
      if (html != null) e.innerHTML = cls.includes('ec-c') ? `<span class="t">${html}</span>` : html;
      root.appendChild(e); return e;
    };
    const foot = mk('ec-foot');
    const inFoot = (cls, html, tag = 'div') => { const e = document.createElement(tag); e.className = cls; if (html != null) e.innerHTML = html; foot.appendChild(e); return e; };
    const parts = {
      label: mk('ec-c ec-label hi', 'बात कीजिए'),
      num: mk('ec-c ec-num', '1800-891-3496'),
      rule: mk('ec-rule'),
      sub: mk('ec-c ec-sub hi', 'टोल-फ़्री · सुबह 9 से रात 9, हर दिन'),
      tile: mk('ec-tile'),
      name: mk('ec-c ec-name', 'Dealer Kavach'),
      namehi: mk('ec-c ec-namehi hi', 'डीलर कवच'),
      url: mk('ec-c ec-url', 'mdgservices.in'),
      play: mk('ec-c ec-play hi', '<span class="lat">Google Play</span> पर: <span class="lat">Dealer Kavach</span>'),
      foot,
      logo: inFoot('ec-logo', null, 'img'),
      tag: inFoot('ec-tag', 'Fueling Success'),
    };
    parts.logo.src = logoSrc;
    parts.mark = K.mark(parts.tile, { size: 140, color: '#111111' });
    parts.mark.draw(1);
    parent.appendChild(root);
    return { root, ...parts };
  };

  /**
   * Prove the brand faces are really loaded: measure a string in each face
   * against a fallback. document.fonts.check() lies (true for missing faces).
   */
  K.fontsReady = async function () {
    const faces = [
      ['800 72px "Noto Sans Devanagari"', 'डीलर कवच हिसाब 4,222'],
      ['600 40px "Noto Sans Devanagari"', 'रजिस्टर में कोई भी'],
      ['800 72px "Inter"', '1800-891-3496 Dealer Kavach'],
      ['500 30px "Inter"', 'OPENING STOCK RECEIPT'],
    ];
    await Promise.all(faces.map(([f, s]) => document.fonts.load(f, s)));
    await document.fonts.ready;
    const c = document.createElement('canvas').getContext('2d');
    const bad = [];
    for (const [f, s] of faces) {
      c.font = f; const w1 = c.measureText(s).width;
      c.font = f.replace(/"[^"]+"/, 'monospace'); const w2 = c.measureText(s).width;
      c.font = f.replace(/"[^"]+"/, 'serif'); const w3 = c.measureText(s).width;
      if (Math.abs(w1 - w2) < 0.5 || Math.abs(w1 - w3) < 0.5) bad.push(f);
    }
    if (bad.length) throw new Error('fonts missing: ' + bad.join(', '));
    return true;
  };
})((window.Kit = window.Kit || {}));
