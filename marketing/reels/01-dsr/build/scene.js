// Reel 01 · DSR — "काग़ज़ → तस्वीर → काग़ज़" (paper becomes picture becomes paper).
// Every style is computed from t inside seek(t): no CSS animation, no timers,
// no state between frames (DIRECTION §10.2). 120 BPM, 15 bars of 2 s.
(function () {
  const K = window.Kit, { M, E } = K;
  const C = K.clock(120, 15);
  const D = 30;
  const stage = document.getElementById('stage');
  const el = (tag, cls, parent = stage, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  };
  const tf = K.tf, show = K.show;
  const tw = M.tw, e01 = M.e, env = M.env;

  // ───────────────────────── layers (bottom → top) ─────────────────────────
  const L = {
    paper: el('div', 'layer'),
    hook: el('div', 'layer'),
    phone: el('div', 'layer'),
    viewer: el('div', 'layer'),
    ledger: el('div', 'layer'),
    text: el('div', 'layer'),
    lock: el('div', 'layer'),
    end: el('div', 'layer'),
  };
  L.viewer.id = 'viewer';
  stage.style.perspective = '1600px';
  // Nothing paints until the fonts are proven: a first paint in a fallback face
  // leaves stale fragments of the Devanagari headline bar (DIRECTION › Lessons).
  stage.style.visibility = 'hidden';

  // ───────────────────────── layout system (DIRECTION §5.3) ─────────────────────────
  // One centre axis for everything; a title zone at the top; the register on a
  // fixed grid — 4 columns of 204 px centred on the axis (x 132–948).
  const AX = 540;
  const TITLE1 = 300, TITLE2 = 404;
  // 4 × 180 = 720 wide, x 180–900, centred on the axis; at 52 px the SALES figure ends at x 880 (887 at the
  // hook's 2% drift) — inside the hard-safe box (DIRECTION §5.3), whose right 192 px are the Shorts buttons.
  const REG = { dateY: 796, headsY: 840, rowY: 918, rowH: 110, colW: 180, x0: 180 };   // row 3 ends at y 1248
  const ROW_CY = REG.rowY + REG.rowH / 2;            // 973: the line the whole reel keeps returning to
  const colX = (i) => REG.x0 + REG.colW * i;          // left edge of column i (i = 0…4)

  // ───────────────────────── the register (a full-bleed ruled page) ─────────────────────────
  const HEADS = ['OPENING<br>STOCK', 'RECEIPT', 'TOTAL<br>STOCK', 'SALES'];
  const cam = el('div', 'layer', L.paper);           // the paper camera (a slow drift)
  cam.style.transformOrigin = `${AX}px ${ROW_CY}px`;
  cam.style.transformStyle = 'preserve-3d';
  // the page: heads and the first line live in `top`; the blank lines below live in `below`
  const sheetTop = el('div', 'layer', cam);
  const sheetBelow = el('div', 'layer', cam);
  el('div', 'pg-date hi', sheetTop, 'दिनांक <b>20-08</b>').style.cssText = `left:${REG.x0}px;top:${REG.dateY}px`;
  const heads = el('div', 'heads', sheetTop);
  heads.style.cssText = `left:${REG.x0}px;top:${REG.headsY}px;width:${REG.colW * 4}px`;
  HEADS.forEach((h) => el('div', '', heads, h));
  const hline = (parent, y, cls = 'hrule') => { const r = el('div', cls, parent); r.style.top = `${y}px`; return r; };
  hline(sheetTop, REG.rowY, 'hrule strong');
  hline(sheetTop, REG.rowY + REG.rowH);
  for (let y = REG.rowY + 2 * REG.rowH; y < 1920; y += REG.rowH) hline(sheetBelow, y);
  // no column lines: the heads and the figures carry the columns (a full grid read as clutter in v2a)

  // three lines of attempts: the dealer re-does the same sum, line after line
  const rows = [0, 1, 2].map((k) => {
    const r = el('div', 'row', cam);
    r.style.cssText = `left:${REG.x0}px;top:${REG.rowY + REG.rowH * k}px;width:${REG.colW * 4}px;height:${REG.rowH}px`;
    const cells = [0, 1, 2, 3].map(() => {
      const c = el('div', 'cell', r);
      return { c, val: el('div', 'val', c), strike: el('div', 'strike', c) };
    });
    return { r, cells };
  });
  const row = rows[2].r;               // the latest attempt is the one that lifts off at the turn
  const cells = rows[0].cells;         // the first line is the one the copy beat fills, clean
  const underline = el('div', 'underline2', cam);
  underline.style.cssText = `left:${REG.x0}px;top:${REG.rowY + REG.rowH - 4}px;width:${REG.colW * 4}px`;
  const tickSvg = el('div', 'tick', cam,
    `<svg viewBox="0 0 86 86" width="56" height="56"><path d="M16 46 L36 64 L72 22" fill="none" stroke="#f5a524" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="stroke-dasharray:1 1"/></svg>`);
  tickSvg.style.cssText = `left:${colX(3) + REG.colW / 2 - 28}px;top:${REG.dateY - 6}px`;   // above SALES
  const tickPath = tickSvg.querySelector('path');

  // ───────────────────────── hook type ─────────────────────────
  const clock = el('div', 'rt rt-clock', L.hook);
  clock.style.top = '286px';   // centred on the axis via .rt
  clock.innerHTML = `<span class="kword"><span class="kin hi rat">रात</span></span> <span class="kword tm"><span class="kin tnum t0">11:30</span></span>`;
  const tMask = clock.querySelector('.tm');
  const rat = clock.querySelector('.rat');
  const tA = tMask.querySelector('.t0');
  const tB = el('span', 'kin tnum', tMask, '11:38');
  const tC = el('span', 'kin tnum', tMask, '11:47');
  tMask.style.position = 'relative';
  tMask.style.padding = '0.04em 0.04em'; tMask.style.margin = '-0.04em 0';   // Latin digits need no matra room: clip the roll tight
  [tB, tC].forEach((x) => { x.style.position = 'absolute'; x.style.left = '0.04em'; x.style.top = '0.04em'; });

  function hindiLine(parent, text, cls, top) {
    const ln = K.kin.line(parent, text, { cls: `rt ${cls}` });
    ln.el.style.top = `${top}px`;
    ln.parts.forEach((p) => { if (/^[\x00-\x7F]+$/.test(p.textContent)) p.classList.add('lat'); });
    return ln;
  }
  const hookB0 = hindiLine(L.hook, 'DSR का हिसाब फिर नहीं मिल रहा?', 'rt-72', 446);
  const hookB1 = hindiLine(L.hook, 'एक जगह गलती —', 'rt-80', 446);
  const hookB2 = hindiLine(L.hook, 'पूरा पन्ना दोबारा।', 'rt-80', 446);

  // ───────────────────────── phone + chat ─────────────────────────
  const av = document.createElement('div');
  K.mark(av, { size: 28, color: '#18181b' }).draw(1);   // the app's header: black mark on a grey disc
  const ph = K.chat.phone(L.phone, { title: 'सहायता', subtitle: 'MDG टीम', avatar: av });
  K.chat.dateChip(ph.wall, 'आज', 18);
  const bub = K.chat.albumBubble(ph.wall, { left: 10, top: 56, tile: [146, 150], caption: '📊 DSR · 21 अगस्त — स्टॉक वेरिएशन सीमा में है।' });
  bub.root.style.transformOrigin = '50% 50%';
  const tap = el('div', 'tap', L.phone);
  const PH = { x: 540 - 207, y: 540, s: 1.72 };     // phone root at rest (top-left of the 414×860 object)

  // ───────────────────────── cards ─────────────────────────
  const hide = K.card.DSR_HIDE;
  const mountIn = (parent, name) => {
    const host = el('div', '', parent);
    host.style.position = 'absolute'; host.style.left = '0'; host.style.top = '0';
    return K.card.mount(host, window.CARDS[name], { hide });
  };
  const tileVar = mountIn(bub.tiles[0], 'variation');
  const tileSales = mountIn(bub.tiles[1], 'sales');
  const vbg = el('div', 'layer', L.viewer); vbg.style.background = '#18181b';
  const win = el('div', 'layer', L.viewer);       // the card window, below the black type band
  const sWrap = el('div', 'cardwrap', win);
  const vWrap = el('div', 'cardwrap', win);
  const vSales = K.card.mount(el('div', '', sWrap), window.CARDS.sales, { hide, css: '.hidecell, .hidecell * { color: transparent !important; }' });
  vSales.host.style.position = 'absolute'; vSales.host.style.left = '0'; vSales.host.style.top = '0';
  const vVar = mountIn(vWrap, 'variation');
  const vdim = el('div', 'dim', L.viewer);

  // ───────────────────────── ledger (reel type) ─────────────────────────
  const LG_EDGE = 680;                                // the figures' right edge: the 278 px numeral column centred on x 540; operators hang left
  const LG_R = 1080 - LG_EDGE;
  const lgBox = el('div', 'ledger', L.ledger);
  lgBox.style.width = `${LG_EDGE}px`; lgBox.style.height = '1920px';
  const slot = (y, text, op, size) => {
    const d = el('div', 'lg', lgBox, (op ? `<span class="op">${op}</span>` : '') + `<span class="n">${text}</span>`);
    d.style.top = `${y}px`;
    if (size) d.style.fontSize = `${size}px`;
    return d;
  };
  const LG = {
    l1: slot(560, '12,480'),
    l2: slot(652, '6,000', '+'),
    l3: slot(766, '18,480'),
    l4: slot(858, '14,246', '−'),
    l5: slot(950, '12', '−'),
    l6: slot(1068, '4,222', null, 116),
  };
  const r1 = el('div', 'lg-rule', lgBox); r1.style.top = '746px'; r1.style.width = '280px';
  const r2 = el('div', 'lg-rule', lgBox); r2.style.top = '1044px'; r2.style.width = '320px';
  const lgGold = el('div', 'gold-bar', lgBox); lgGold.style.top = '1192px';
  const ghost = (text) => el('div', 'ghost', L.ledger, text);
  const G = { op: ghost('12,480'), rc: ghost('6,000'), tot: ghost('18,480'), test: ghost('12'), stock: ghost('14,246'), sale: ghost('4,222'), stock2: ghost('14,246') };
  const op2Gold = el('div', 'gold-bar', L.ledger);

  // ───────────────────────── reel type, bars 4–13 ─────────────────────────
  const T = {
    turn1: hindiLine(L.text, 'अब DSR —', 'rt-80', 300),
    turn2: hindiLine(L.text, 'आपके फ़ोन पर', 'rt-80', 404),
    p1a: hindiLine(L.text, 'कल की बिक्री', 'rt-80 on-black', 300),
    p1c: hindiLine(L.text, 'आज का स्टॉक', 'rt-80 on-black', 404),
    p1b: hindiLine(L.text, 'आपके रजिस्टर के\nखानों में', 'rt-72 on-black', 300),
    p2a: hindiLine(L.text, 'स्टॉक सीमा में है?', 'rt-80 on-black', 300),
    copy: hindiLine(L.text, 'रजिस्टर में\nकोई भी उतार ले', 'rt-72', TITLE1),
    team: hindiLine(L.text, 'MDG टीम\nदेखकर भेजती है', 'rt-72', TITLE1),
    pay1: hindiLine(L.text, 'हिसाब मिलाना नहीं —', 'rt-72', TITLE1),
    pay2: hindiLine(L.text, 'बस उतारना', 'rt-72', TITLE1 + 94),
  };
  const band = el('div', 'bandnum', L.text, '570<span class="op">+</span>196<span class="op">=</span>766');
  band.style.top = `${TITLE1}px`;
  const band2 = el('div', 'bandnum', L.text, '−180<span class="op">·</span><span class="hi" style="font:800 80px/1.2 var(--f-deva)">सीमा में</span>');
  band2.style.top = `${TITLE2 + 10}px`;

  // ───────────────────────── lockup + end card ─────────────────────────
  const lock = el('div', 'lockup', L.lock);      // centred on the axis, on the cleared page below the line
  lock.style.top = `${REG.rowY + REG.rowH + 96}px`;
  const lkMarkBox = el('div', '', lock);
  const lkMark = K.mark(lkMarkBox, { size: 116, color: '#18181b' });
  const lkText = el('div', '', lock);
  const lkName = el('div', 'lk-name', lkText, 'Dealer Kavach');
  const lkHi = el('div', 'lk-hi hi', lkText, 'डीलर कवच');
  const ecRuled = el('div', 'ruled', L.end);
  const EC = K.endcard(L.end);

  K.safezone(stage);

  // ───────────────────────── geometry (measured once, untransformed) ─────────────────────────
  let G0 = null;
  let tdSale = null, tdOp2 = null;
  function measure() {
    const S = vSales, V = vVar;
    const sz = S.size(), vz = V.size();
    const rows = S.qa('tbody tr');
    const c1 = rows[0].children, c2 = rows[1].children;
    const R = (x) => S.rect(x);
    const cellFont = parseFloat(getComputedStyle(c1[3]).fontSize);
    const valFont = parseFloat(getComputedStyle(cells[0].val).fontSize);
    return {
      W: sz.w, H: sz.h, VW: vz.w, VH: vz.h, cellFont, valFont,
      g1: R('.g-tile:nth-child(1)'), g2: R('.g-tile:nth-child(2)'),
      g1v: R('.g-tile:nth-child(1) .g-v'), g2v: R('.g-tile:nth-child(2) .g-v'),
      gFont: parseFloat(getComputedStyle(S.q('.g-v')).fontSize),
      op1: R(c1[3]), rc1: R(c1[4]), tot1: R(c1[5]), m1: R(c1[6]), test1: R(c1[10]), sale1: R(c1[11]), op2: R(c2[3]),
      verdict: V.rect('.verdict'), vt1: V.rect('.vtable tr:nth-child(1)'), vt2: V.rect('.vtable tr:nth-child(2)'),
      tile: [146, 150],
    };
  }

  // Card camera for the viewer: world point (x, y) at anchor (ax, ay), scale s, horizontal offset ox.
  const ctr = (r) => [r.x + r.w / 2, r.y + r.h / 2];
  function camSales(t) {
    const g = G0;
    const fit = { x: g.W / 2, y: g.H / 2, s: 1000 / g.W, ax: 540, ay: 900 };
    const sold = { x: g.g1.x + g.g1.w / 2, y: g.g1.y + g.g1.h / 2, s: 2.0, ax: 540, ay: 900 };
    const stock = { x: g.g2.x + g.g2.w / 2, y: g.g2.y + g.g2.h / 2, s: 2.0, ax: 540, ay: 900 };
    const triW = g.tot1.x + g.tot1.w - g.op1.x;
    const sRow = Math.min(3, 780 / triW);
    const tri = { x: g.op1.x + triW / 2, y: g.op1.y + g.op1.h / 2, s: sRow, ax: 540, ay: 900 };
    const tsW = g.sale1.x + g.sale1.w - g.test1.x;
    const ts = { x: g.test1.x + tsW / 2, y: g.test1.y + g.test1.h / 2, s: sRow, ax: 540, ay: 900 };
    const back = { x: g.W / 2, y: g.H / 2, s: 0.5, ax: 540, ay: 940 };
    const cellS = { x: (g.test1.x + g.sale1.x + g.sale1.w) / 2, y: g.sale1.y + g.sale1.h / 2, s: 2.6, ax: 540, ay: 900 };
    const bx0 = g.op2.x, bx1 = g.g2.x + g.g2.w, by0 = g.g2.y, by1 = g.op2.y + g.op2.h;
    const open2 = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, s: 816 / (bx1 - bx0), ax: 540, ay: 900 };
    const upTop = TITLE1 + 188 + 34, upBot = REG.dateY - 34;      // between the two-line title (ends ~488) and the date line, 34 px air each side
    const up = { x: g.W / 2, y: g.H / 2, s: Math.min(696 / g.W, (upBot - upTop) / g.H), ax: AX, ay: (upTop + upBot) / 2 };
    const stamp = { x: g.W / 2, y: g.H / 2, s: 0.4, ax: AX, ay: ROW_CY };
    const flipStart = G0.flipStart;
    const keys = [
      [8.3, flipStart], [8.9, fit, E.expoInOut], [8.95, fit], [9.5, sold, E.quartInOut], [9.76, sold], [10.1, stock, E.quartInOut],
      [10.3, stock], [10.75, tri, E.quartInOut], [11.0, tri], [11.4, ts, E.quartInOut], [11.6, ts],
      [12.0, back, E.quartInOut], [13.48, back], [13.78, cellS, E.expoOut], [13.85, cellS], [14.08, open2, E.quartInOut], [17.7, open2],
      [17.75, up], [20.5, up], [21.97, stamp, E.expoIn],
    ];
    const pick = (k) => M.kf(t, keys.map(([tt, v, ez]) => [tt, v[k], ez]));
    const c = { x: pick('x'), y: pick('y'), s: pick('s'), ax: pick('ax'), ay: pick('ay') };
    // the swipe: out to the right at 14.0–14.6, back in from the right at 18.0–18.6
    c.ox = t < 16 ? tw(t, 14.5, 0.45, 0, 1120, E.quartInOut) : tw(t, 17.8, 0.45, 1120, 0, E.quartInOut);
    // the stamp: the card flattens into the row's line on the hit
    c.sy = 1 - 0.97 * E.quartOut(M.p(t, 21.97, 0.12));
    return c;
  }
  function camVar(t) {
    const g = G0;
    const top = g.verdict.y - 20, bot = g.vt2.y + g.vt2.h + 20;
    const base = Math.min(1.0, 980 / g.VW);
    // a slow push the whole time the stock check is up, so nothing freezes
    const push = 1 + 0.07 * E.sineInOut(M.p(t, 14.9, 2.7));
    const c = { x: g.VW / 2, y: (top + bot) / 2 + 14 * (push - 1) / 0.07, s: base * push, ax: 540, ay: 900 };
    c.ox = t < 16 ? tw(t, 14.5, 0.45, -1120, 0, E.quartInOut) : tw(t, 17.8, 0.45, 0, -1120, E.quartInOut);
    return c;
  }
  const toScreen = (c, px, py) => [c.ax + (px - c.x) * c.s + (c.ox || 0), c.ay + (py - c.y) * c.s];
  const applyCam = (wrap, c) => {
    const sy = c.sy ?? 1;
    wrap.style.transformOrigin = '0 0';
    wrap.style.transform = `translate(${c.ax + (c.ox || 0)}px, ${c.ay}px) scale(${c.s}, ${c.s * sy}) translate(${-c.x}px, ${-c.y}px)`;
  };

  // A ghost number flies from a card cell (at its lift time) to a target, scaling from cell size to 84 px.
  function fly(gEl, t, t0, dur, from, to, s0, s1, show0 = t0, hideAt = Infinity, onCard = false, kAt = null) {
    const q = E.expoInOut(M.p(t, t0, dur));
    const lift = Math.sin(Math.PI * M.clamp((t - t0) / dur)) * -36;
    const x = M.lerp(from[0], to[0], q), y = M.lerp(from[1], to[1], q) + lift - gEl.offsetHeight / 2;
    const s = M.lerp(s0, s1, q);
    gEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    // onCard: stays a lifted cell (black on a white chip). kAt: turns into white type only once it is over the dark.
    const k = onCard ? 0 : kAt != null ? E.quartOut(M.p(t, kAt, 0.3)) : M.clamp(q * 1.6);
    gEl.style.background = `rgba(255,255,255,${(1 - k).toFixed(3)})`;
    gEl.style.boxShadow = k < 1 ? `0 ${10 * (1 - k)}px ${26 * (1 - k)}px rgba(0,0,0,${(0.35 * (1 - k)).toFixed(3)})` : 'none';
    const c = Math.round(M.lerp(24, 255, k));
    gEl.style.color = `rgb(${c},${c},${Math.round(M.lerp(27, 255, k))})`;
    show(gEl, t >= show0 && t < hideAt ? 1 : 0);
  }
  // Ghost text is 84 px; its box origin is left-middle. Centre it on a point.
  const gw = (gEl) => gEl.offsetWidth;

  // ───────────────────────── seek ─────────────────────────
  function seek(t) {
    const g = G0;

    // ---- paper (bars 1–4, then 10–15) ----
    const paperOn = t < 7.0 || t >= 17.85;
    show(L.paper, paperOn ? 1 : 0);
    if (paperOn) {
      // a slow push while he works; a slower one after the lock
      const drift = t < 7 ? tw(t, 0, 6, 1, 1.02, E.sineInOut) : t < 22.2 ? 1 : tw(t, 22.2, 3.1, 1, 1.015, E.sineInOut);
      cam.style.transform = `scale(${drift})`;
      const fall = t < 7 ? E.expoIn(M.p(t, 6.05, 0.7)) : 0;          // the page drops away at the turn
      const rise = t >= 17.85 ? e01(t, 17.9, 0.55) : 1;              // and comes back for the copy beat
      const endFade = t >= 25 ? 1 - e01(t, 25.2, 0.5, E.quartIn) : 1;
      const pageY = fall * 520 + (1 - rise) * 380;
      const clear = t < 7 ? e01(t, 6.0, 0.45, E.sineInOut) : 0;     // the page is gone by 6.45, before the lifted line crosses it
      const pageO = (t < 7 ? 1 - clear : rise) * endFade;
      tf(sheetTop, { y: pageY, o: pageO });
      // the blank lines clear away after the lock, leaving clean paper for the logo
      tf(sheetBelow, { y: pageY, o: pageO * (t < 22 ? 1 : 1 - e01(t, 22.15, 0.45)) });
      if (t < 7) {
        // three attempts at the same sum, each on its own line; every SALES figure is wrong and struck
        const plan = [
          { w: [0.5, 0.62, 1.0, 1.12], sale: '4,322', strike: 1.5 },
          { w: [2.36, 2.42, 2.48, 2.62], sale: '4,232', strike: 3.0 },
          { w: [3.86, 3.92, 3.98, 4.5], sale: '4,223', strike: 5.0 },
        ];
        const vals = ['12,480', '6,000', '18,480'];
        rows.forEach((R, k) => {
          const P = plan[k];
          R.cells.forEach((c, i) => {
            c.val.textContent = i < 3 ? vals[i] : P.sale;
            const w = e01(t, P.w[i], i < 3 && k > 0 ? 0.14 : 0.26, E.quartOut);
            c.val.style.clipPath = `inset(-20% ${(1 - w) * 100}% -20% 0)`;
            c.val.style.transform = '';
            show(c.val, w > 0 ? 1 : 0);
            const st = i === 3 ? e01(t, P.strike, 0.22, E.quartOut) : 0;
            c.strike.style.transform = `scaleX(${st})`;
            show(c.strike, st > 0 ? 1 : 0);
          });
          if (k < 2) {
            const gone = e01(t, 5.92, 0.3, E.sineInOut);      // the older lines go first, so nothing sits under the lift
            tf(R.r, { y: pageY + 30 * gone, o: pageO * (1 - gone) }); R.r.style.background = 'transparent'; R.r.style.boxShadow = 'none';
          }
        });
        // bar 4: the latest line lifts (6.0–6.5), narrows to the bubble and flips edge-on (6.35–7.0)
        const lift = e01(t, 6.0, 0.5);
        const flip = E.quartIn(M.p(t, 6.35, 0.65));
        const B = g.bub, rowCx = AX, rowCy = REG.rowY + REG.rowH * 2.5;
        const sx = M.lerp(1, B.w / (REG.colW * 4), E.quartInOut(M.p(t, 6.25, 0.75)));
        const dx = M.lerp(0, B.cx - rowCx, flip), dy = -24 * lift + (B.cy - rowCy) * E.quartInOut(M.p(t, 6.3, 0.7));
        row.style.transform = `translate3d(${dx}px, ${dy}px, ${30 * lift}px) rotateX(${90 * flip}deg) scale(${sx}, 1)`;   // the lift is the white and the shadow — no pop, it would push SALES past x 888
        row.style.background = `rgba(255,255,255,${lift})`;
        row.style.boxShadow = lift > 0 ? `0 ${30 * lift}px ${60 * lift}px -20px rgba(24,24,27,${0.28 * lift})` : 'none';
        show(row, 1);
        show(underline, 0); show(tickSvg, 0);
      } else {
        // the clean first line: the cells fly in from the card, one per beat
        show(rows[1].r, 0); show(rows[2].r, 0);
        const R0 = rows[0].r;
        tf(R0, { y: pageY, o: 1 });
        R0.style.background = 'transparent'; R0.style.boxShadow = 'none';
        const flights = [[18.08, g.op1], [18.58, g.rc1], [19.08, g.tot1], [19.58, g.sale1]];   // land on 18.5, 19.0, 19.5, 20.0 (the ticks)
        const texts = ['12,480', '6,000', '18,480', '4,222'];
        const valsOut = t >= 25 ? 1 - e01(t, 25.0, 0.4, E.quartIn) : 1;
        cells.forEach((c, i) => {
          const [t0, r] = flights[i];
          const cc = camSales(t0);
          const [fx, fy] = toScreen(cc, r.x + r.w / 2, r.y + r.h / 2);
          const tx = colX(i) + REG.colW / 2, ty = ROW_CY + pageY;
          const q = E.expoInOut(M.p(t, t0, 0.42));
          const s0 = (g.cellFont * cc.s) / g.valFont;
          c.val.textContent = texts[i];
          c.val.style.clipPath = 'none';
          const x = M.lerp(fx - tx, 0, q), y = M.lerp(fy - ty, 0, q) - Math.sin(Math.PI * q) * 40;
          c.val.style.transform = `translate(${x}px, ${y}px) scale(${M.lerp(s0, 1, q)})`;
          show(c.val, (t >= t0 ? 1 : 0) * valsOut);
          show(c.strike, 0);
        });
        // strongest moment: the line locks — underline on the hit, the gold tick above SALES
        const u = e01(t, 22.0, 0.2, E.quartOut);
        underline.style.transform = `translateY(${pageY}px) scaleX(${u})`;
        show(underline, t < 25.2 && u > 0 ? 1 : 0);
        tickPath.style.strokeDashoffset = String(1 - e01(t, 22.04, 0.3, E.quartOut));
        tf(tickSvg, { y: pageY, o: t >= 25 ? 1 - e01(t, 25.0, 0.3) : 1 });
      }
    }

    // ---- hook type (bars 1–3) ----
    show(L.hook, t < 6.6 ? 1 : 0);
    if (t < 6.6) {
      const out = e01(t, 6.0, 0.28, E.quartIn);
            const aOut = e01(t, 2.0, 0.18, E.quartIn); const bIn = e01(t, 2.1, 0.32); const bOut = e01(t, 4.0, 0.18, E.quartIn); const cIn = e01(t, 4.1, 0.32);
      const ty = (x, y) => { x.style.transform = Math.abs(y) < 0.01 ? 'none' : `translateY(${y.toFixed(3)}%)`; };
      ty(tA, -115 * aOut);
      ty(tB, 115 * (1 - bIn) - 115 * bOut);
      ty(tC, 115 * (1 - cIn) - 115 * out);
      ty(rat, -115 * out);
      // parked digits peek through the mask's padding: hide them outside their window
      tA.style.visibility = aOut < 1 ? 'visible' : 'hidden';
      tB.style.visibility = bIn > 0 && bOut < 1 ? 'visible' : 'hidden';
      tC.style.visibility = cIn > 0 && out < 1 ? 'visible' : 'hidden';
      rat.style.visibility = out < 1 ? 'visible' : 'hidden';
      const SWAP = { outDur: 0.18, outStagger: 0.01, stagger: 0.06 };
      K.kin.play(hookB0, t, -1, 2.45, SWAP);
      K.kin.play(hookB1, t, 2.62, 3.82, SWAP);   // voice: एक 2.80
      K.kin.play(hookB2, t, 3.95, 6.0, SWAP);    // voice: पूरा 4.02
    }

    // ---- phone (bars 4–5) ----
    const phoneOn = t >= 7.0 && t < 8.95;
    show(L.phone, phoneOn ? 1 : 0);
    if (phoneOn) {
      const s = PH.s * tw(t, 7.0, 1.6, 1, 1.03, E.sineInOut);
      ph.root.style.transformOrigin = '0 0';
      ph.root.style.transform = `translate(${540 - 207 * s}px, ${PH.y - (s - PH.s) * 300}px) scale(${s})`;
      show(ph.root, 1 - e01(t, 8.55, 0.3));
      const unfold = e01(t, 7.0, 0.6);
      bub.root.style.transform = `perspective(900px) rotateX(${-90 * (1 - unfold)}deg)`;
      const tq = M.p(t, 8.0, 0.45);
      const [tx, ty] = g.tapAt;
      tap.style.transform = `translate(${tx}px, ${ty}px) scale(${0.3 + 0.8 * E.expoOut(tq)})`;
      show(tap, t >= 8.0 && t < 8.45 ? 0.9 * (1 - tq) : 0);
    }

    // ---- viewer (bars 5–10) ----
    const viewOn = t >= 8.3 && t < 22.12;
    show(L.viewer, viewOn ? 1 : 0);
    if (viewOn) {
      const bgO = t < 17.8 ? e01(t, 8.3, 0.4) : 1 - e01(t, 17.95, 0.45);
      show(vbg, bgO);
      const cS = camSales(t);
      applyCam(sWrap, cS);
      const flipQ = E.expoInOut(M.p(t, 8.3, 0.6));
      const [tl, tt, tr, tb] = g.tileRect;
      L.viewer.style.clipPath = t < 8.9 ? `inset(${M.lerp(tt, 0, flipQ)}px ${M.lerp(1080 - tr, 0, flipQ)}px ${M.lerp(1920 - tb, 0, flipQ)}px ${M.lerp(tl, 0, flipQ)}px round ${M.lerp(9, 0, flipQ)}px)` : 'none';
      show(sWrap, t < 22.1 && !(t >= 14.95 && t < 17.8) ? 1 : 0);   // parked off-frame during the stock check
      const band = t < 17.7 ? 540 * e01(t, 8.9, 0.4, E.quartInOut) : 540 * (1 - e01(t, 17.72, 0.12));
      win.style.clipPath = band > 0.5 ? `inset(${band.toFixed(1)}px 0 0 0)` : 'none';
      // SOLD counts up 0 → 4,222 while the camera arrives
      tdSale.classList.toggle('hidecell', t >= 12.9 && t < 13.85);
      tdOp2.classList.toggle('hidecell', t >= 13.9 && t < 14.42);
      const sold = vSales.q('.g-tile:nth-child(1) .g-v');
      sold.firstChild.nodeValue = K.fmt.inr(K.count(t, 8.95, 0.81, 0, 4222));
      // the card recedes behind the ledger
      show(vdim, t < 14 ? 0.9 * (e01(t, 11.6, 0.4) - e01(t, 13.48, 0.28)) : 0);
      const cV = camVar(t);
      applyCam(vWrap, cV);
      show(vWrap, t >= 14.45 && t < 18.3 ? 1 : 0);
      // stock check: three planes lift apart, then close
      const lift = e01(t, 15.1, 0.5) - e01(t, 17.0, 0.5, E.quartInOut);
      const vq = (s) => vVar.q(s);
      vq('.verdict').style.transform = `scale(${1 + 0.04 * lift})`;
      vq('.verdict').style.boxShadow = `0 ${16 * lift}px ${30 * lift}px -10px rgba(0,0,0,${0.28 * lift})`;
      vVar.qa('.vtable tr:nth-child(1) td').forEach((td) => { td.style.transform = `translateY(${18 * lift}px)`; });
      vVar.qa('.vtable tr:nth-child(2) td').forEach((td) => { td.style.transform = `translateY(${42 * lift}px)`; });
      vVar.qa('.vtable tr:nth-child(3) td, .action, .since').forEach((x) => {
        x.style.transform = `translateY(${76 * lift}px)`;
        x.style.opacity = String(1 - 0.9 * lift);
      });
    }

    // ---- ledger (bars 6–7) ----
    const ledOn = t >= 10.4 && t < 14.7;
    show(L.ledger, ledOn ? 1 : 0);
    if (ledOn) {
      const out = e01(t, 13.22, 0.22, E.quartIn);
      const at = (d, y) => [1080 - LG_R - d.offsetWidth, y + 42];
      // ghosts lift from the card at their own moment and fly to their ledger slots
      const fromCell = (r, tLift) => toScreen(camSales(tLift), r.x + r.w * 0.5, r.y + r.h / 2);
      const s0c = (tLift) => (g.cellFont * camSales(tLift).s) / 84;
      const flyTo = (gEl, slotEl, r, tLift, dur, hideAt, kAt = 11.7) => {
        const [fx, fy] = fromCell(r, tLift);
        const w = gEl.offsetWidth;
        const n = slotEl.querySelector('.n');
        const tx = 1080 - LG_R - n.offsetWidth, ty = parseFloat(slotEl.style.top) + 42;
        fly(gEl, t, tLift, dur, [fx - (w * s0c(tLift)) / 2, fy], [tx, ty], s0c(tLift), 1, tLift, hideAt, false, kAt);
      };
      flyTo(G.op, LG.l1, g.op1, 10.8, 1.0, 13.6);
      flyTo(G.rc, LG.l2, g.rc1, 10.88, 1.0, 13.6);
      flyTo(G.tot, LG.l3, g.tot1, 10.96, 1.0, 13.6);
      flyTo(G.test, LG.l5, g.test1, 11.45, 1.0, 13.6, 11.8);
      // 14,246 from the glance tile STOCK IN TANK NOW (the card has receded by now)
      {
        const tL = 12.0, cc = camSales(tL);
        const [fx, fy] = toScreen(cc, g.g2v.x + g.g2v.w * 0.4, g.g2v.y + g.g2v.h / 2);
        const s0 = (g.gFont * cc.s) / 84;
        const n = LG.l4.querySelector('.n');
        fly(G.stock, t, tL, 0.45, [fx - (G.stock.offsetWidth * s0) / 2, fy], [1080 - LG_R - n.offsetWidth, parseFloat(LG.l4.style.top) + 42], s0, 1, tL, 13.6, false, 12.0);
      }
      // slots: operators and rules appear as their figures land; the landed ghost IS the figure
      [LG.l1, LG.l3, LG.l4, LG.l5].forEach((d) => show(d, 0));
      show(LG.l2.querySelector('.n'), 0);
      LG.l2.style.opacity = String(e01(t, 11.75, 0.2) * (1 - out)); LG.l2.style.visibility = 'visible';
      show(LG.l4, e01(t, 12.35, 0.15) * (1 - out)); LG.l4.querySelector('.n').style.visibility = 'hidden';
      show(LG.l5, e01(t, 12.4, 0.15) * (1 - out)); LG.l5.querySelector('.n').style.visibility = 'hidden';
      r1.style.transform = `scaleX(${e01(t, 11.85, 0.25)})`; show(r1, (t >= 11.85 ? 1 : 0) * (1 - out));
      r2.style.transform = `scaleX(${e01(t, 12.5, 0.3)})`; show(r2, (t >= 12.5 ? 1 : 0) * (1 - out));
      [G.op, G.rc, G.tot, G.test, G.stock].forEach((x) => { x.style.opacity = String(Math.min(Number(x.style.opacity), 1 - out)); });
      // 4,222 lands under the rule (the beat's gold), then flies into SALES on the card
      const land = e01(t, 13.0, 0.25);
      const tF = 13.5, cF = camSales(13.85);
      const [sx, sy] = toScreen(cF, g.sale1.x + g.sale1.w / 2, g.sale1.y + g.sale1.h / 2);
      const n6 = LG.l6.querySelector('.n');
      const startX = 1080 - LG_R - n6.offsetWidth, startY = 1068 + 58;
      const sEnd = (g.cellFont * cF.s) / 116;
      const q = E.expoInOut(M.p(t, tF, 0.35));
      LG.l6.style.transformOrigin = '100% 50%';
      show(LG.l6, t >= 13.0 && t < tF ? land : 0);
      LG.l6.style.transform = `scale(${1.12 - 0.12 * land})`;
      G.sale.style.fontSize = '116px';
      G.sale.style.transform = `translate3d(${M.lerp(startX, sx - (G.sale.offsetWidth * sEnd) / 2, q)}px, ${M.lerp(startY, sy, q) - Math.sin(Math.PI * q) * 30 - G.sale.offsetHeight / 2}px, 0) scale(${M.lerp(1, sEnd, q)})`;
      show(G.sale, t >= tF && t < 13.85 ? 1 : 0);
      {   // white type on black turns back into a cell as it lands on the card
        const qc = M.clamp(q * 2.5);   // black before it is over the card
        const c = Math.round(M.lerp(255, 24, qc));
        G.sale.style.color = `rgb(${c},${c},${Math.round(M.lerp(255, 27, qc))})`;
        G.sale.style.background = `rgba(255,255,255,${qc.toFixed(3)})`;
      }
      lgGold.style.right = 'auto'; lgGold.style.width = `${n6.offsetWidth}px`;
      lgGold.style.transform = `scaleX(${e01(t, 13.0, 0.25)})`;
      show(lgGold, t >= 13.0 && t < tF ? 1 : 0);
      lgGold.style.left = `${startX}px`;
      // 14,246: the stock in the tank now becomes today's opening
      {
        const tL = 14.08, cc = camSales(14.08);
        const [fx, fy] = toScreen(cc, g.g2v.x + g.g2v.w * 0.4, g.g2v.y + g.g2v.h / 2);
        const [ox, oy] = toScreen(cc, g.op2.x + g.op2.w / 2, g.op2.y + g.op2.h / 2);
        const s0 = (g.gFont * cc.s) / 84, s1 = (g.cellFont * cc.s) / 84;
        fly(G.stock2, t, tL, 0.34, [fx - (G.stock2.offsetWidth * s0) / 2, fy], [ox - (G.stock2.offsetWidth * s1) / 2, oy], s0, s1, tL, 14.42, true);
        const [gx, gy] = toScreen(cc, g.op2.x + 6, g.op2.y + g.op2.h - 2);
        op2Gold.style.left = '0px';
        op2Gold.style.width = `${(g.op2.w - 12) * cc.s}px`;
        op2Gold.style.transform = `translate(${gx}px, ${gy}px) scaleX(${e01(t, 14.42, 0.16)})`;
        show(op2Gold, t >= 14.42 && t < 14.7 ? 1 - e01(t, 14.55, 0.15) : 0);
      }
    }

    // ---- reel type, bars 4–13 ----
    K.kin.play(T.turn1, t, 6.05, 8.4);          // voice: अब 6.12
    K.kin.play(T.turn2, t, 6.85, 8.44);         // voice: आपके 6.96
    K.kin.play(T.p1a, t, 8.6, 10.6);            // voice: कल 8.60
    K.kin.play(T.p1c, t, 9.8, 10.62);           // voice: आज 9.84 … स्टॉक 10.32
    K.kin.play(T.p1b, t, 10.75, 12.4);          // voice: रजिस्टर 11.20 … में 12.20
    K.kin.play(T.p2a, t, 14.35, 15.95);         // voice: स्टॉक 14.42
    {
      const bandShow = (x, tIn) => {
        const bIn = e01(t, tIn, 0.42), bOut = e01(t, 17.55, 0.24, E.quartIn);
        const d = 1 + 0.02 * E.sineInOut(M.p(t, tIn, 1.5));
        x.style.transformOrigin = '0 100%';
        x.style.transform = `translateY(${(1 - bIn) * 40 - bOut * 40}px) scale(${d})`;
        x.style.clipPath = `inset(-30% ${(1 - bIn) * 100}% -30% 0)`;
        show(x, t >= tIn && t < 17.8 ? 1 - bOut : 0);
      };
      bandShow(band, 16.0);
      bandShow(band2, 16.35);                    // voice: साफ़ लिखा 16.36 — the comparison, in reel type
    }
    K.kin.play(T.copy, t, 18.05, 19.95);        // voice: कोई 18.10
    K.kin.play(T.team, t, 20.02, 21.9);         // voice: हमारी 20.10
    K.kin.play(T.pay1, t, 22.0, 24.6);           // on the hit
    K.kin.play(T.pay2, t, 22.08, 24.64);

    // ---- lockup (bars 12–13), handing over to the end card ----
    const lockOn = t >= 23.0 && t < 26.2;
    show(L.lock, lockOn ? 1 : 0);
    if (lockOn) {
      lkMark.draw(M.p(t, 23.0, 1.3));
      const held = 1 + 0.025 * E.sineInOut(M.p(t, 23.6, 1.7));
      lock.style.transformOrigin = '0 50%';
      lock.style.transform = `scale(${M.lerp(held, 1, E.expoInOut(M.p(t, 25.3, 0.9)))})`;
      const nIn = e01(t, 23.6, 0.5);
      lkText.style.transform = `translateY(${(1 - nIn) * 30}px)`;
      lkText.style.opacity = String(nIn);
      // 25.3–26.2: travel to the end card's places
      const q = E.expoInOut(M.p(t, 25.3, 0.9));
      const H = g.hand;
      const mv = (elm, a, b, center, byWidth) => {
        elm.style.transformOrigin = center ? '50% 50%' : '0 0';
        const k = M.lerp(1, byWidth ? b.w / a.w : b.h / a.h, q);
        const dx = center ? (b.x + b.w / 2) - (a.x + a.w / 2) : b.x - a.x;
        const dy = center ? (b.y + b.h / 2) - (a.y + a.h / 2) : b.y - a.y;
        elm.style.transform = `translate(${q * dx}px, ${q * dy}px) scale(${k})`;
      };
      mv(lkMarkBox, H.mark, H.tileMark, true);
      mv(lkName, H.name, H.ecName, true, true);   // same face at another size: the width ratio is exact
      mv(lkHi, H.hi, H.ecHi, true, true);
    }

    // ---- end card (bars 14–15): static from 27.5 s ----
    const endOn = t >= 25.3;
    show(L.end, endOn ? 1 : 0);
    if (endOn) {
      // the row's underline rises to become the gold rule
      const q = E.expoInOut(M.p(t, 25.3, 0.8));
      // the line's underline (centred, 720 wide) rises to sit under the number
      EC.rule.style.transform = `translateY(${M.lerp(REG.rowY + REG.rowH - 4 - EC.rule.offsetTop, 0, q)}px)`;
      EC.rule.style.background = `rgb(${M.lerp(24, 245, q)}, ${M.lerp(24, 165, q)}, ${M.lerp(27, 36, q)})`;
      EC.rule.style.width = `${M.lerp(REG.colW * 4, EC.num.querySelector('.t').offsetWidth, E.expoOut(M.p(t, 26.0, 0.7)))}px`;
      show(EC.rule, 1);
      const nw = e01(t, 25.85, 0.6, E.quartOut);
      EC.num.style.clipPath = `inset(-20% ${(1 - nw) * 100}% -20% 0)`;
      show(EC.num, t >= 25.85 ? 1 : 0);
      const rise = (x, t0) => { const p = e01(t, t0, 0.45); x.style.transform = `translateY(${(1 - p) * 26}px)`; show(x, p); };
      rise(EC.label, 25.9);
      rise(EC.sub, 26.4);
      rise(EC.url, 26.6);
      rise(EC.play, 26.75);
      rise(EC.logo, 26.9);
      rise(EC.tag, 26.95);
      show(ecRuled, e01(t, 25.4, 0.6));
      // the tile grows around the mark as the lockup lands; the name hands over at 26.2
      const tq = e01(t, 25.9, 0.5);
      EC.tile.style.transform = `scale(${M.lerp(0.6, 1, tq)})`;
      EC.tile.style.boxShadow = '';
      show(EC.tile, tq);
      show(EC.name, t >= 26.2 ? 1 : 0);
      show(EC.namehi, t >= 26.2 ? 1 : 0);
      EC.mark.svg.style.opacity = t >= 26.2 ? '1' : '0';
    }
  }

  // ───────────────────────── init ─────────────────────────
  window.READY = (async () => {
    await K.fontsReady();
    G0 = measure();
    { const rows = vSales.qa('tbody tr'); tdSale = rows[0].children[11]; tdOp2 = rows[1].children[3]; }
    window.__G0 = G0;   // for inspection while building
    const rr = (x) => { const r = x.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    G0.hand = { mark: rr(lkMarkBox), name: rr(lkName), hi: rr(lkHi), tileMark: rr(EC.mark.svg), ecName: rr(EC.name.querySelector('.t')), ecHi: rr(EC.namehi.querySelector('.t')) };
    // tiles: cover-fit each card in its album tile (stock check left, sales right), top-aligned
    [[tileVar, bub.tiles[0]], [tileSales, bub.tiles[1]]].forEach(([h, tileEl]) => {
      const { w, h: hh } = h.size();
      const s = Math.max(146 / w, 150 / hh);
      h.host.style.transformOrigin = '0 0';
      h.host.style.transform = `translate(${(146 - w * s) / 2}px, 0) scale(${s})`;
    });
    // fonts are proven: safe to paint (innerText below also needs it visible)
    stage.style.visibility = 'visible';
    // card text must be clean (DIRECTION §4) and carry the figures the reel names
    K.card.assertClean(vSales, ['4,222', '14,246', '6,000', '12,480', '18,480', '78,310']);
    K.card.assertClean(vVar, ['4% of tank stock (570 L)', '(196 L)', '766', 'स्टॉक सही है']);
    // where the sales tile sits on screen at the tap (phone at rest + its bubble)
    G0.tileRect = [0, 0, 1080, 1920]; G0.tapAt = [540, 960]; G0.bub = { cx: 480, cy: 925, w: 816 };
    seek(7.8);
    { const r = bub.root.getBoundingClientRect(); G0.bub = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width }; }
    G0.flipStart = { x: G0.W / 2, y: G0.H / 2, s: 0.1, ax: 540, ay: 960 };
    seek(8.3);
    const tr = bub.tiles[1].getBoundingClientRect();
    G0.tileRect = [tr.left, tr.top, tr.right, tr.bottom];
    G0.tapAt = [tr.left + tr.width / 2, tr.top + tr.height / 2];
    const sz = tileSales.size();
    const sTile = Math.max(146 / sz.w, 150 / sz.h) * (tr.width / 146);
    G0.flipStart = { x: sz.w / 2, y: (150 / Math.max(146 / sz.w, 150 / sz.h)) / 2, s: sTile, ax: G0.tapAt[0], ay: G0.tapAt[1] };
    seek(0);
    return true;
  })();

  window.SCENE = { bpm: 120, duration: D, seek, hits: [7.0, 13.0, 22.0, 26.0], hero: [0, 7.4, 9.8, 13.05, 16.6, 22.4, 29.0],
    safeSel: ['.bandnum', '.lg', '.ghost', '.cell .val', '.lockup'] };   // the focal numbers, for kit/render/safe.mjs
})();
