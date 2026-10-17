// Reel 02 · Stock check — "एक ही अंतर, दो फ़ैसले" (same gap, opposite verdict).
// Every style is computed from t inside seek(t): no CSS animation, no timers,
// no state between frames (DIRECTION §10.2). 128 BPM, 16 bars of 1.875 s.
(function () {
  const K = window.Kit, { M, E } = K;
  const C = K.clock(128, 16);
  const D = 30;
  const at = (bar, beat = 1) => C.at(bar, beat);
  const BEAT = C.beat;
  const HIT1 = at(1, 4), HIT2 = at(10, 4), HIT3 = at(15, 1);
  const stage = document.getElementById('stage');
  const el = (tag, cls, parent = stage, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  };
  const show = K.show;
  const e01 = M.e, tw = M.tw;
  stage.style.visibility = 'hidden';   // nothing paints until the fonts are proven (DIRECTION › Lessons)

  // measured voice (the sound director's beat map); estimates until it exists
  const S = window.SCRIPT;
  // A word's start in reel time. Accepts several spellings (speech-to-text may hear `नोटिस` as `notice`);
  // a word time earlier than its line's start is taken as relative to the line.
  const plain = (w) => w.toLowerCase().replace(/[\u093C\u0964,?.!]/g, '');
  const word = (id, ws, fb) => {
    const l = S && S.lines && S.lines.find((x) => x.id === id);
    if (!l || !l.words) return fb;
    const want = [].concat(ws).map(plain);
    const x = l.words.find((q) => want.includes(plain(q.w)));
    if (!x) return fb;
    return x.t0 < l.start - 0.01 ? l.start + x.t0 : x.t0;
  };

  // ───────────────────────── layout (DIRECTION §5.3) ─────────────────────────
  const AX = 540, TITLE1 = 300, TITLE2 = 394;
  const PXL = 348 / 460;                    // ±460 L across x 192–888
  const xL = (l) => AX + l * PXL;
  const AXIS = { hook: 800, rule: 640, bare: 800 };
  const WIN = { a: 520, b: 780, bottom: 1248 };

  // ───────────────────────── layers (bottom → top) ─────────────────────────
  const L = {
    inst: el('div', 'layer'),
    rod: el('div', 'layer'),
    phone: el('div', 'layer'),
    viewer: el('div', 'layer'),
    text: el('div', 'layer'),
    end: el('div', 'layer'),
  };

  // ───────────────────────── the instrument ─────────────────────────
  const inst = el('div', 'inst', L.inst);
  inst.style.perspective = '1400px';
  inst.style.perspectiveOrigin = `${AX}px 0px`;
  const hair = el('div', 'hair', inst);
  const seg = (l0, l1, cls, label) => {
    const s = el('div', `seg ${cls || ''}`, inst, label ? `<div class="sl">${label}</div>` : '');
    s.style.left = `${xL(l0)}px`; s.style.width = `${(l1 - l0) * PXL}px`;
    return s;
  };
  const segE = seg(-450, -400, 'evap', '50');     // the evaporation allowance: shortage side only
  const segL = seg(-400, 0, '', '400');
  const segR = seg(0, 400, '', '400');
  const ghost50 = el('div', 'ghostseg', inst, '<div class="sl">50</div>');
  ghost50.style.width = `${50 * PXL}px`;
  const ticks = [];
  for (let l = -450; l <= 450; l += 50) {
    const k = el('div', 'tk', inst);
    const end = l === -450 || l === 400;
    k.style.left = `${xL(l) - 1}px`; k.style.top = l === 0 ? '-48px' : '28px'; k.style.height = l === 0 ? '96px' : end ? '20px' : '10px';
    ticks.push(k);
  }
  const gold = el('div', 'gold', inst);
  gold.style.left = `${xL(400)}px`; gold.style.width = `${30 * PXL}px`;
  const lblL = el('div', 'lbl', inst, '−450<span class="w">कम</span>');
  const lblLw = lblL.querySelector('.w');
  lblL.style.left = '192px';
  const lblR = el('div', 'lbl', inst, '<span class="w">ज़्यादा</span>+400');
  const lblRw = lblR.querySelector('.w');
  lblR.style.right = '204px';                      // ends at x 876 (883 at the rule beat's 2% drift), not centred on its tick
  const zero = el('div', 'zero', inst, '0');
  zero.style.left = `${AX}px`;
  const arm = el('div', 'arm', inst);
  arm.style.transformStyle = 'preserve-3d';
  const pin = el('div', 'pin', arm, '<div class="disc"></div><div class="stem"></div>');
  pin.style.left = `${xL(-430) - 192}px`;          // after the arm turns 180° about x 540 it stands at +430
  const tag = el('div', 'tag', L.rod, '');   // the band depends on the tank: 4% of 10,000
  const TAG_POSTER = '<span class="w">वेरिएशन</span> · <span class="w">टंकी</span> 10,000 L', TAG_ROD = '10,000 L';

  // ───────────────────────── the dip rod (flat line drawing) ─────────────────────────
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'rodsvg'); svg.setAttribute('width', '1080'); svg.setAttribute('height', '1920');
  L.rod.appendChild(svg);
  const sv = (tagName, attrs, parent = svg) => { const n = document.createElementNS(NS, tagName); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
  const TANK = { x: 330, y: 980, w: 420, h: 236 };
  const FUEL_Y = 1080;
  const fuel = sv('rect', { x: TANK.x + 2, y: FUEL_Y, width: TANK.w - 4, height: TANK.y + TANK.h - FUEL_Y - 2, fill: '#e7e5e4' });
  const gRod = sv('g', {});
  const ROD_S = 0.62, WET_SCREEN = TANK.y + TANK.h - 2 - FUEL_Y;   // 134 px of the rod stand in fuel
  const rodBody = sv('rect', { x: -348, y: -8, width: 696, height: 16, rx: 8, fill: '#ffffff', stroke: '#18181b', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, gRod);
  const rodWet = sv('rect', { x: -347, y: -7, width: WET_SCREEN / ROD_S, height: 14, rx: 7, fill: '#a8a29e' }, gRod);
  const rodLine = sv('line', { x1: -348, y1: 0, x2: 348, y2: 0, stroke: '#18181b', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, gRod);
  const rodTicks = sv('g', {}, gRod);
  for (let l = -450; l <= 450; l += 50) sv('line', { x1: xL(l) - AX, y1: 9, x2: xL(l) - AX, y2: l % 100 === 0 ? 22 : 16, stroke: '#18181b', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, rodTicks);
  const tank = sv('rect', { x: TANK.x, y: TANK.y, width: TANK.w, height: TANK.h, rx: 28, fill: 'none', stroke: '#18181b', 'stroke-width': 2, pathLength: 1, 'stroke-dasharray': '1 1' });
  const dipLbl = el('div', 'rl', L.rod, '<span class="w">डिप</span> 131');
  const stake = el('div', 'stake', L.rod, '<span class="v">+430 L</span><span class="u"></span>');
  stake.style.top = '548px';

  // ───────────────────────── the phone and its two worlds ─────────────────────────
  const av = document.createElement('div');
  K.mark(av, { size: 28, color: '#18181b' }).draw(1);    // the app's header: black mark on a grey disc
  const ph = K.chat.phone(L.phone, { title: 'सहायता', subtitle: 'MDG टीम', avatar: av });
  K.chat.dateChip(ph.wall, 'आज', 18);
  const bubA = K.chat.albumBubble(ph.wall, { left: 10, top: 56, tile: [146, 150], caption: '📊 DSR · 8 सितंबर — स्टॉक वेरिएशन सीमा में है।' });
  const bubB = K.chat.albumBubble(ph.wall, { left: 10, top: 56, tile: [146, 150], caption: '📊 DSR · 8 सितंबर — स्टॉक वेरिएशन सीमा से बाहर है, कृपया देखें।' });
  const tap = K.view.tap(L.phone);
  const PH = { s: 1.65, y: 540 };            // bezel 414 × 1.65 = 683 px; 693 at the 1.5% drift — inside the centred width
  const phX = (s) => AX - 207 * s;

  // ───────────────────────── cards ─────────────────────────
  const HIDE = K.card.DSR_HIDE;
  const HIDE_X = [...HIDE, '.action', '.conseq'];   // the advice reads "adjust the stock to fit"; the box says "are stopped"
  const mountIn = (parent, name, hide) => {
    const host = el('div', '', parent);
    host.style.position = 'absolute'; host.style.left = '0'; host.style.top = '0';
    return K.card.mount(host, window.CARDS[name], { hide });
  };
  const tA0 = mountIn(bubA.tiles[0], 'var-short', HIDE), tA1 = mountIn(bubA.tiles[1], 'sales', HIDE);
  const tB0 = mountIn(bubB.tiles[0], 'var-excess', HIDE_X), tB1 = mountIn(bubB.tiles[1], 'sales', HIDE);
  const cw = el('div', 'cardwrap', L.viewer);
  const FW = 1112;
  const fl = K.flip(cw, { w: FW, h: 1335 });
  const vS = mountIn(fl.front, 'var-short', HIDE);
  const vX = mountIn(fl.back, 'var-excess', HIDE_X);

  // ───────────────────────── reel type ─────────────────────────
  function line(text, cls, top, parent = L.text) {
    const ln = K.kin.line(parent, text, { cls: `rt ${cls}` });
    ln.el.style.top = `${top}px`;
    ln.parts.forEach((p) => { if (!/[ऀ-ॿ]/.test(p.textContent)) p.classList.add('lat'); });
    return ln;
  }
  const T = {
    h1a: line('−430 L: सीमा में।', 'rt-68', TITLE1),
    h1b: line('+430 L: सीमा से बाहर।', 'rt-68', TITLE2),
    p2a: line('इंस्पेक्शन के दिन', 'rt-72', TITLE1),
    p2b: line('पता चले —', 'rt-72', TITLE2),
    p3: line('तो देर हो चुकी।', 'rt-72', TITLE1),
    t4a: line('अब DSR में —', 'rt-72', TITLE1),
    t4b: line('स्टॉक वेरिएशन', 'rt-72', TITLE2),
    b6a: line('कमी पर सीमा:', 'rt-72', TITLE1),
    r7: line('तेल उड़ सकता है —', 'rt-72', TITLE1),
    r8: line('हवा से आ नहीं सकता।', 'rt-72', TITLE1),
    m9a: line('ज़्यादा पर सीमा:', 'rt-72', TITLE1),
    m9b: line('सिर्फ़ 400 L', 'rt-72', TITLE2),
    m10a: line('+430 L — सीमा से', 'rt-72', TITLE1),
    m10b: line('30 L ज़्यादा।', 'rt-72', TITLE2),
    s11a: line('आपके फ़ोन पर दिखे।', 'rt-72', TITLE1),
    y12a: line('नोटिस बनने से पहले', 'rt-72', TITLE1),
    y12b: line('पता चले।', 'rt-72', TITLE2),
  };
  const sum = el('div', 'sum', L.text, '<span class="n4">400</span><span class="op o1">+</span><span class="n5">50</span><span class="op o2">=</span><span class="n45">450</span>');
  const sumP = { n4: sum.querySelector('.n4'), o1: sum.querySelector('.o1'), n5: sum.querySelector('.n5'), o2: sum.querySelector('.o2'), n45: sum.querySelector('.n45') };
  const g400 = el('div', 'ghost', L.text, '400');
  const g50 = el('div', 'ghost', L.text, '50');
  const chip = el('div', 'chip', L.text, '<span>−430 L<span class="dot">·</span>20 L <span class="w">अंदर</span></span>');
  const veil = el('div', 'veil', L.text);            // dims the card behind the punched-in +30
  const big30 = el('div', 'ghost big30', L.text, '+30 L');

  // ───────────────────────── end card (the lockup arrives at its coordinates) ─────────────────────────
  const EC = K.endcard(L.end);
  // bars 12–13: the two answers his DSR can carry, side by side under the payoff (artwork)
  const pay = el('div', 'layer', L.end);
  const PAY = { s: 0.4, top: 600, cx: [420, 660], rot: [-4, 4] };   // two cards fanned, 445 px each, x 198–883
  const payBox = () => { const b = el('div', '', pay); b.style.cssText = 'position:absolute;left:0;top:0;'; return b; };
  const payL = payBox(), payR = payBox();
  const pS = mountIn(payL, 'var-short', HIDE), pX = mountIn(payR, 'var-excess', HIDE_X);
  // each answer carries its reading from the hook: the same 430 L, two sides
  const payLbl = (cx, text) => { const d = el('div', 'paylbl', pay, text); d.style.left = `${cx - 165}px`; return d; };
  const plL = payLbl(PAY.cx[0] - 30, '−430 L'), plR = payLbl(PAY.cx[1] + 30, '+430 L');
  const bandBar = el('div', 'seg', L.end);          // the bare band that becomes the end card's gold rule
  K.safezone(stage);

  // ───────────────────────── geometry, measured once ─────────────────────────
  let G = null;
  function measure() {
    const r = (h, s) => h.rect(s);
    const backT = fl.back.style.transform;
    fl.back.style.transform = 'none';            // the back face is pre-rotated 180°: measure it flat, or x comes back mirrored
    const g = {
      sS: vS.size(), sX: vX.size(),
      verdS: r(vS, '.verdict'), tabS: r(vS, '.vtable'), bandS: r(vS, '.vtable tr:nth-child(2)'), varS: r(vS, '.vtable tr:nth-child(1)'),
      verdX: r(vX, '.verdict'), tabX: r(vX, '.vtable'), bandX: r(vX, '.vtable tr:nth-child(2)'), varX: r(vX, '.vtable tr:nth-child(1)'),
      notX: r(vX, '.vtable tr:nth-child(3) .vt-v'),
      t400: vS.textRect('.calc-en', '400'), t50: vS.textRect('.calc-en', '50'),
      vkS: r(vS, '.verdict .vk-text'), calcS: r(vS, '.calc-en'),
      calcFont: parseFloat(getComputedStyle(vS.q('.calc-en')).fontSize),
    };
    fl.back.style.transform = backT;
    return g;
  }
  const W = FW;
  function cams() {
    const g = G;
    const fr = (rr, o) => K.view.frameRect(rr, o);
    const Hs = g.sS.h;
    const fitS = 696 / W;
    return {
      fitA: { x: W / 2, y: Hs / 2, s: fitS, ax: AX, ay: WIN.a + (Hs * fitS) / 2 },
      verdA: fr(g.vkS, { w: 560, ay: 884 }),
      bandA: { x: W / 2, y: g.calcS.y + g.calcS.h / 2, s: 0.9, ax: AX, ay: 884 },   // centred: the values stay in frame
      valsA: { ...fr(g.tabS, { w: 680, ay: 860 }), x: W / 2 },
      // the whole card width is in view in bars 7–11: 0.6 × 1,112 = 667 px, 687 px at the 3% push (≤ 696)
      ruleA: { x: W / 2, y: (g.varS.y + g.bandS.y + g.bandS.h) / 2, s: 0.6, ax: AX, ay: 1012 },
      bandX: { x: W / 2, y: g.bandX.y + g.bandX.h / 2, s: 0.6, ax: AX, ay: 1012 },
      varX: { x: W / 2, y: (g.varX.y + g.bandX.y + g.bandX.h) / 2, s: 0.6, ax: AX, ay: 1012 },
      tabX: { x: W / 2, y: g.tabX.y + g.tabX.h / 2, s: 0.6, ax: AX, ay: 1012 },
      verdX: { x: W / 2, y: g.verdX.y + g.verdX.h / 2, s: 0.6, ax: AX, ay: 1012 },
    };
  }
  function camCard(t) {
    const g = G, c = G.C;
    const keys = [
      [7.5, g.flipA], [8.1, c.fitA, E.expoInOut], [8.44, c.fitA], [8.9, c.verdA, E.quartInOut], [9.375, c.verdA],
      [9.75, c.bandA, E.quartInOut], [10.55, c.bandA], [10.9, c.valsA, E.quartInOut], [11.25, c.valsA], [11.75, c.ruleA, E.quartInOut],
      [15.94, c.ruleA], [16.4, c.bandX, E.quartInOut], [16.875, c.bandX], [17.3, c.varX, E.quartInOut], [17.95, c.varX],
      [HIT2 - 0.2, c.tabX, E.quartInOut], [18.85, c.tabX], [19.25, c.verdX, E.quartInOut], [19.69, c.verdX], [20.3, g.flipB, E.expoInOut],
    ];
    const cam = K.view.keys(t, keys);
    // a 3% push through the long holds (11.75–15.0 and 16.4–18.28), so the frame never freezes; it eases off
    // while the camera itself moves, and keeps the card centred on the axis for the flip
    const push = 0.03 * (E.sineInOut(M.p(t, 11.75, 3.25)) * (1 - E.sineInOut(M.p(t, 15.0, 1.2))) + E.sineInOut(M.p(t, 16.4, 1.88)) * (1 - e01(t, 18.75, 0.5)));
    cam.s *= 1 + push;
    return cam;
  }

  // A number lifted from the card flies to a screen point, growing from its card size.
  function flyGhost(gEl, t, t0, dur, from, to, s0, s1) {
    const q = E.expoInOut(M.p(t, t0, dur));
    const arc = -Math.sin(Math.PI * q) * 40;
    gEl.style.transform = `translate3d(${M.lerp(from[0], to[0], q)}px, ${M.lerp(from[1], to[1], q) + arc}px, 0) scale(${M.lerp(s0, s1, q)})`;
    const k = M.clamp(q * 1.4);   // a lifted white chip that becomes reel type as it arrives
    gEl.style.background = `rgba(255,255,255,${(1 - k).toFixed(3)})`;
    gEl.style.boxShadow = k < 1 ? `0 ${10 * (1 - k)}px ${24 * (1 - k)}px rgba(0,0,0,${(0.3 * (1 - k)).toFixed(3)})` : 'none';
  }

  const KIN = { origin: '50% 100%' };          // centred lines grow from their centre
  const play = (ln, t, a, b, o = {}) => K.kin.play(ln, t, a, b, { ...KIN, ...o });

  // ───────────────────────── seek ─────────────────────────
  function seek(t) {
    const g = G;

    // ---------------- instrument ----------------
    const instOn = t < 2.62 || (t >= 11.25 && t < 20.1);
    show(L.inst, instOn ? 1 : 0);
    if (instOn) {
      const phaseHook = t < 2.62, phaseRule = t >= 11.25 && t < 20.1, phaseBare = t >= 21.2;
      let axis = AXIS.hook, z = 1, zx = xL(415), zy = AXIS.hook;
      if (phaseHook) {
        // a slow push on the poster, then the macro into the overshoot and back out as the scale turns into the rod
        const push = tw(t, 0, 1.4, 1, 1.02, E.sineInOut);
        const mac = e01(t, 1.6, 0.5, E.quartInOut) - e01(t, 2.15, 0.45, E.quartInOut);
        z = push * (1 + 2.2 * mac);
      } else if (phaseRule) {
        axis = AXIS.rule;
        z = 1 + 0.02 * E.sineInOut(M.p(t, 11.3, 8.4));      // the instrument drifts too
        zx = AX; zy = AXIS.rule;
      }
      else axis = AXIS.bare;
      inst.style.transformOrigin = '0 0';
      inst.style.transform = `translate(${zx}px, ${zy}px) scale(${z}) translate(${-zx}px, ${-zy}px) translateY(${axis}px)`;
      // what is up in each phase
      const fadeHook = phaseHook ? 1 - e01(t, 2.25, 0.3) : 1;          // band, labels and pin leave as the scale turns
      const ruleIn = phaseRule ? e01(t, 11.3, 0.4) : 1;
      const ruleOut = phaseRule ? 1 - e01(t, 19.69, 0.35, E.quartIn) : 1;
      const bareIn = phaseBare ? e01(t, 21.25, 0.5) * (1 - e01(t, at(14, 1), 0.35)) : 1;
      const o = phaseHook ? fadeHook : phaseRule ? ruleIn * ruleOut : 0;     // bare: the band is bandBar (end layer)
      show(hair, phaseHook ? (t < 2.6 ? 1 : 0) : phaseBare ? bareIn : o);
      ticks.forEach((k) => show(k, phaseBare ? 0 : phaseHook ? (t < 2.6 ? 1 : 0) : o));
      // the macro is about the gold overshoot: the furniture labels step out of it (they would grow past x 888)
      // labels: numbers only on the poster (the words would make 9 Hindi words); in the rule beat the words come
      // too, and leave after the +30 so bar 11's line keeps the cap (critic, QA gate 2)
      const lo = phaseHook ? o * (1 - e01(t, 1.58, 0.18)) : o * (1 - e01(t, 18.62, 0.2));
      show(lblL, phaseBare ? 0 : lo); show(lblR, phaseBare ? 0 : lo); show(zero, phaseBare ? 0 : lo * 0.9);
      lblLw.style.display = lblRw.style.display = phaseHook ? 'none' : '';
      // the band: one grey run in the hook; drawn out of its parts in the rule beat
      const drawL = phaseRule ? e01(t, 11.4, 0.4) : 1, drawE = phaseRule ? e01(t, 11.62, 0.3) : 1, drawR = phaseRule ? e01(t, 11.5, 0.4) : 1;
      segL.style.transformOrigin = '100% 50%'; segL.style.transform = `scaleX(${drawL})`;
      segR.style.transformOrigin = '0 50%'; segR.style.transform = `scaleX(${drawR})`;
      show(segL, o); show(segR, o);
      [segL, segR, segE].forEach((s) => show(s.querySelector('.sl'), phaseRule ? 1 : 0));
      // the 50 L part goes to the excess side and is refused (12.19–13.6)
      let ex = 0, ey = 0, fillA = 1;
      if (phaseRule) {
        const go = E.expoInOut(M.p(t, 12.19, 0.55)), back = E.expoInOut(M.p(t, 13.1, 0.5));
        ex = (go - back) * (850 - xL(-450));                              // to x 850: 7 px short of the +400 end, never joined
        ey = -38 * Math.sin(Math.PI * (go < 1 ? go : back));              // a low arc there and back
        fillA = 1 - (e01(t, 12.62, 0.18) - e01(t, 13.05, 0.15));          // outlined while it waits: refused
      }
      // the 50 L part itself never leaves (the pin at −430 stays inside); a dashed copy of it tries the excess end
      segE.style.transformOrigin = '100% 50%';
      segE.style.transform = `scaleX(${drawE})`;
      segE.style.opacity = String(o);
      segE.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      segE.style.background = phaseRule ? '#d6d3d1' : '#e7e5e4';
      ghost50.style.left = `${xL(-450)}px`;
      ghost50.style.transform = `translate(${ex}px, ${ey}px)`;
      const trip = phaseRule ? e01(t, 12.12, 0.12) * (1 - e01(t, 13.5, 0.15)) : 0;
      show(ghost50, trip * o);
      ghost50.style.borderColor = fillA < 0.99 ? '#a8a29e' : '#78716c';
      // the pin: lifted, turned over the zero tick, landed
      let deg = 0, lift = 0, pinO = o;
      if (phaseHook) {
        lift = e01(t, at(1, 2), 0.3) * (1 - e01(t, HIT1 - 0.12, 0.12, E.quartIn));
        deg = 180 * E.quartInOut(M.p(t, at(1, 2) + 0.12, HIT1 - at(1, 2) - 0.12));
      } else if (phaseRule) {
        pinO = o * e01(t, 11.55, 0.25);                                   // the re-formed instrument shows the shortage card's −430
        lift = e01(t, 14.53, 0.3) * (1 - e01(t, 15.82, 0.12, E.quartIn));
        deg = 180 * E.quartInOut(M.p(t, 15.0, 0.94));
      }
      if (phaseBare) pinO = 0;
      arm.style.transform = deg < 1e-3 ? 'none' : `rotateY(${deg.toFixed(3)}deg)`;
      // the pin rides the arm's arc but always faces the lens, so it never goes edge-on and vanishes
      pin.style.transform = `translateY(${(-18 * lift).toFixed(2)}px) rotateY(${(-deg).toFixed(3)}deg)`;
      show(arm, pinO);
      // the gold overshoot: the 30 L past the +400 edge
      const gIn = phaseHook ? e01(t, HIT1, 0.22, E.expoOut) : phaseRule ? e01(t, 15.94, 0.22, E.expoOut) : 0;
      gold.style.transform = `scaleX(${gIn})`;
      show(gold, gIn > 0 ? o : 0);
    }
    // the tank tag sits above the zero tick on the poster
    {
      const tg0 = t < 2.0 ? 1 - e01(t, 1.75, 0.2) : 0;
      const ride = e01(t, 3.95, 0.45, E.expoInOut);
      if (t < 2.0) {
        if (tag.innerHTML !== TAG_POSTER) tag.innerHTML = TAG_POSTER;
        tag.style.font = '700 40px/1.1 var(--f-latin)';
        tag.style.transform = `translate(${AX}px, ${AXIS.hook - 205}px)`;
        tag.style.color = '#78716c';
        show(tag, tg0);
      } else if (t >= 3.9 && t < 5.0) {
        // it rides to the rod's wet line: what that dip gives (its right edge at x 500, left of the rod)
        if (tag.innerHTML !== TAG_ROD) tag.innerHTML = TAG_ROD;
        tag.style.font = '800 54px/1.1 var(--f-latin)';
        tag.style.color = '#18181b';
        // it slides in from the left at the wet line's height: it never crosses the stake or the rod
        const rx = E.expoOut(M.p(t, 3.95, 0.45));
        tag.style.transform = `translate(${M.lerp(192 + g.tagW54 / 2 - 60, 500 - g.tagW54 / 2, rx)}px, 906px)`;
        show(tag, e01(t, 3.9, 0.15) * (1 - e01(t, 4.69, 0.25)));
      } else show(tag, 0);
    }

    // ---------------- the dip rod (bars 2–4) ----------------
    const rodOn = t >= 2.55 && t < 6.25;
    show(L.rod, rodOn || t < 2.0 ? 1 : 0);
    // a slow 3% push on the rod and tank while they are up, so the scene never holds still
    const rodPush = t >= 2.55 && t < 4.69 ? 1 + 0.03 * E.sineInOut(M.p(t, 2.55, 2.14)) : 1;
    L.rod.style.transformOrigin = '540px 1000px';
    L.rod.style.transform = rodPush === 1 ? 'none' : `scale(${rodPush.toFixed(5)})`;
    show(svg, rodOn ? 1 : 0);
    if (rodOn) {
      const turn = E.quartInOut(M.p(t, 2.55, 0.65));                       // horizontal → vertical
      const flat = E.quartInOut(M.p(t, 4.69, 0.6));                        // vertical → flat, under the bubble's edge
      const rise = E.expoOut(M.p(t, 3.75, 0.45));
      const B = g.bubA;
      let cx = M.lerp(AX, AX, turn), cy = M.lerp(AXIS.hook, 998, turn) - 140 * rise;
      let rot = -90 * turn, s = M.lerp(1, ROD_S, turn);
      if (flat > 0) {
        rot = -90 * (1 - flat);
        s = M.lerp(ROD_S, B.w / 696, flat);
        cx = M.lerp(AX, B.cx, flat);
        cy = M.lerp(998 - 140, B.top, flat);
      }
      gRod.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${rot.toFixed(3)}) scale(${s.toFixed(4)})`);
      const bodyO = e01(t, 2.95, 0.3) * (1 - e01(t, 4.69, 0.3));
      rodBody.setAttribute('opacity', bodyO.toFixed(3));
      rodWet.setAttribute('opacity', (bodyO * e01(t, 3.85, 0.3)).toFixed(3));
      rodTicks.setAttribute('opacity', (1 - e01(t, 4.69, 0.25)).toFixed(3));
      rodTicks.setAttribute('transform', `translate(0 ${(20 * (1 - turn)).toFixed(2)})`);
      rodLine.setAttribute('opacity', (1 - e01(t, 5.95, 0.25)).toFixed(3));
      const tankDraw = E.quartOut(M.p(t, 2.95, 0.5));
      tank.setAttribute('stroke-dashoffset', (1 - tankDraw).toFixed(4));
      const tankO = 1 - e01(t, 4.69, 0.3);
      tank.setAttribute('opacity', tankO.toFixed(3));
      fuel.setAttribute('opacity', (e01(t, 3.2, 0.3) * tankO).toFixed(3));
      // the wet line reads a height; 10,000 L is what that dip gives
      dipLbl.style.transform = `translate(580px, ${910 - 4}px)`;
      show(dipLbl, e01(t, 4.02, 0.3) * (1 - e01(t, 4.69, 0.25)));
      // the stake: +430 with the beat's gold underline
      const st = e01(t, 2.3, 0.35) * (1 - e01(t, 4.69, 0.25));
      show(stake, st);
      const u = stake.querySelector('.u');
      u.style.width = `${stake.querySelector('.v').offsetWidth}px`;
      u.style.transform = `scaleX(${e01(t, 2.45, 0.3)})`;
    } else { show(dipLbl, 0); show(stake, 0); }

    // ---------------- the phone ----------------
    const phA = t >= 5.25 && t < 7.9, phB = t >= 19.69 && t < 20.95;
    show(L.phone, phA || phB ? 1 : 0);
    if (phA || phB) {
      // in from below, out downward: the phone is an object that moves, never one that dissolves
      const rise = phA ? E.expoOut(M.p(t, 5.25, 0.55)) : E.expoOut(M.p(t, 19.69, 0.5));
      const leave = phA ? E.expoIn(M.p(t, 7.55, 0.32)) : E.expoIn(M.p(t, 20.6, 0.3));
      const drift = phA ? tw(t, 5.8, 1.6, 1, 1.015, E.sineInOut) : tw(t, 20.2, 0.4, 1, 1.01, E.sineInOut);
      const s = PH.s * drift;
      ph.root.style.transformOrigin = '0 0';
      ph.root.style.transform = `translate(${phX(s)}px, ${PH.y + (1 - rise) * 720 + leave * 1400}px) scale(${s})`;
      show(ph.root, 1);
      show(bubA.root, phA ? 1 : 0); show(bubB.root, phB ? 1 : 0);
      if (phA) K.view.unfold(bubA.root, M.p(t, 5.72, 0.5));
      else bubB.root.style.transform = 'none';
      // the card lands in bubble B's left tile; until then that tile is empty
      show(bubB.tiles[0], phB && t >= 20.28 ? 1 : 0);
      show(bubA.tiles[0], phA && t < 7.55 ? 1 : 0);
      tap.at(t, at(4, 4), g.tapA[0], g.tapA[1]);
    }

    // ---------------- the viewer (bars 5–11) ----------------
    const viewOn = t >= 7.5 && t < 20.32;
    show(L.viewer, viewOn ? 1 : 0);
    if (viewOn) {
      const c = camCard(t);
      K.view.apply(cw, c);
      // the window: FLIP from the tile, the upper band (bars 5–6), the lower band once the instrument is up (7–11)
      let clip;
      if (t < 8.1) clip = K.view.flipClip(t, 7.5, 0.6, g.tileA, [0, WIN.a, 1080, WIN.bottom]);
      else if (t < 19.69) {
        const top = M.lerp(WIN.a, WIN.b, E.quartInOut(M.p(t, 11.25, 0.5)));
        clip = `inset(${top.toFixed(1)}px 0 ${1920 - WIN.bottom}px 0)`;
      } else {
        const q = E.expoInOut(M.p(t, 19.69, 0.6));
        const [l, tp, r, b] = g.tileB;
        clip = `inset(${M.lerp(WIN.b, tp, q)}px ${M.lerp(0, 1080 - r, q)}px ${M.lerp(1920 - WIN.bottom, 1920 - b, q)}px ${M.lerp(0, l, q)}px round ${M.lerp(0, 9, q)}px)`;
      }
      L.viewer.style.clipPath = clip;
      // the mirror flip: one continuous turn about x 540 (the card is centred on the axis)
      fl.set(180 * E.quartInOut(M.p(t, 15.0, 0.94)));
    }

    // ---------------- reel type ----------------
    // bar 1: the hook pair, frame 0 already set; the verdict that is live is the black one
    {
      const live = e01(t, HIT1, 0.2);
      T.h1a.el.style.color = `rgb(${M.lerp(24, 87, live)},${M.lerp(24, 83, live)},${M.lerp(27, 78, live)})`;
      T.h1b.el.style.color = `rgb(${M.lerp(87, 24, live)},${M.lerp(83, 24, live)},${M.lerp(78, 27, live)})`;
      play(T.h1a, t, -1, at(2, 1) - 0.02);
      play(T.h1b, t, -1, at(2, 1) + 0.03);
    }
    // locked to the measured voice (AUDIO.md › beat map)
    const toT = word('L2', 'तो', 4.205);
    play(T.p2a, t, 2.08, toT - 0.16);      // after the hook pair has left its slots; voice इंस्पेक्शन 2.485
    play(T.p2b, t, 2.2, toT - 0.14);
    play(T.p3, t, toT - 0.04, at(4, 1) - 0.02);
    play(T.t4a, t, word('L3', 'अब', 5.72), 9.2);
    play(T.t4b, t, word('L3', ['स्टॉक', 'stock'], 6.995) - 0.05, 9.22);
    play(T.b6a, t, 9.4, 11.2);
    play(T.r7, t, word('L4', 'तेल', 11.35), 13.05);
    play(T.r8, t, Math.max(13.15, word('L4', 'हवा', 13.15) - 0.1), 14.78);   // gone before bar 9's line arrives
    play(T.m9a, t, word('L5', 'ज्यादा', 15.1) - 0.05, 16.8);
    play(T.m9b, t, 15.3, 16.82);
    play(T.m10a, t, 16.9, 18.95);
    play(T.m10b, t, HIT2, 18.97);
    const notisT = word('L6', ['नोटिस', 'notice'], 20.975);
    play(T.s11a, t, 19.05, notisT - 0.4);      // fully out before the payoff's first word arrives
    const yIn = notisT - 0.02;             // the payoff lands on its spoken word
    play(T.y12a, t, yIn, at(14, 1));
    play(T.y12b, t, Math.max(yIn + 0.3, word('L6', 'पता', 21.9) - 0.05), at(14, 1) + 0.02);

    // bar 6: the band's two parts lift out of the card and become the title's second line
    {
      const sumOn = t >= 9.84 && t < 11.75;
      show(sum, sumOn ? 1 : 0);
      if (!sumOn) { show(g400, 0); show(g50, 0); }
      if (sumOn) {
        const cS = (tt) => camCard(tt);
        const lift = (gEl, r, t0, slot) => {
          const cc = cS(t0);
          const [fx, fy] = K.view.toScreen(cc, r.x, r.y);
          const s0 = (g.calcFont * cc.s) / 72;
          const to = [slot.x, slot.y];
          flyGhost(gEl, t, t0, 0.42, [fx, fy - 6], to, s0, 1);
          show(gEl, t >= t0 && t < t0 + 0.42 ? 1 : 0);
        };
        lift(g400, g.t400, at(6, 2), g.slot.n4);
        lift(g50, g.t50, at(6, 3), g.slot.n5);
        show(sumP.n4, t >= at(6, 2) + 0.42 ? 1 : 0);
        show(sumP.o1, e01(t, at(6, 2) + 0.3, 0.2));
        show(sumP.n5, t >= at(6, 3) + 0.42 ? 1 : 0);
        show(sumP.o2, e01(t, at(6, 4), 0.2));
        sumP.n45.style.clipPath = `inset(-20% ${(1 - e01(t, at(6, 4) + 0.05, 0.3)) * 100}% -20% 0)`;
        show(sumP.n45, t >= at(6, 4) + 0.05 ? 1 : 0);
        // 11.25: the parts drop into the instrument as its labels
        const drop = E.expoInOut(M.p(t, 11.25, 0.45));
        sum.style.transform = `translateY(${drop * 40}px)`;
        sum.style.opacity = String(1 - drop);
      }
    }
    // bar 6 beat 4: the gap, on the axis under the table
    {
      const cOn = t >= 10.62 && t < 11.75;
      show(chip, cOn ? e01(t, 10.62, 0.25) * (1 - e01(t, 11.5, 0.22)) : 0);
      chip.style.top = '1112px';
      chip.style.transform = `translateY(${(1 - e01(t, 10.62, 0.35)) * 24}px)`;
    }

    // bar 10 beat 4: the +30 lifts out of its cell and sits on the axis, big
    {
      const on = t >= HIT2 - 0.06 && t < 19.35;
      show(big30, on ? 1 - e01(t, 19.1, 0.22) : 0);
      show(veil, on ? 0.72 * e01(t, HIT2 - 0.06, 0.2) * (1 - e01(t, 19.1, 0.22)) : 0);
      if (on) {
        const cc = camCard(HIT2 - 0.06);
        const [fx, fy] = K.view.toScreen(cc, g.notX.x + g.notX.w * 0.55, g.notX.y + g.notX.h * 0.25);
        // a lifted cell: it keeps its white chip, so it never sits on the card's own text
        const q = E.expoOut(M.p(t, HIT2 - 0.06, 0.36)), w = big30.offsetWidth;
        big30.style.transform = `translate3d(${M.lerp(fx - w * 0.1, AX - w / 2, q)}px, ${M.lerp(fy, 912, q)}px, 0) scale(${M.lerp(0.17, 1, q)})`;
      }
    }

    // ---------------- strongest moment and end card ----------------
    const endOn = t >= 21.2;
    show(L.end, endOn ? 1 : 0);
    if (endOn) {
      // a 1.5% push on the lockup and end card while they build (24.9–27.4); static from 27.5 at 1.015
      // (683 × 1.015 = 693 px: the number stays inside the 696 px width)
      const breath = 1 + 0.015 * E.sineInOut(M.p(t, 24.9, 2.5));     // a steady push that settles by 27.4
      L.end.style.transformOrigin = '540px 768px';
      L.end.style.transform = Math.abs(breath - 1) < 1e-5 ? 'none' : `scale(${breath.toFixed(5)})`;
      // bars 12–13: both answers, under the payoff; they leave as the lockup comes
      // bars 12–13: the two answers fanned; bar 14: they fold into the app's tile (the reports are what it carries)
      const fold = E.expoIn(M.p(t, at(14, 1), 0.42));
      const pd = 1 + 0.025 * E.sineInOut(M.p(t, 21.3, 3));
      const tileC = [AX, g.tileC];
      [[payL, 0, 0], [payR, 0.12, 1]].forEach(([b, dl, i]) => {
        const q = E.expoOut(M.p(t, 21.25 + dl, 0.55));
        const w = PAY.s * W, h = PAY.s * g.payHs[i];
        const cx = M.lerp(PAY.cx[i], tileC[0], fold), cy = M.lerp(PAY.top + h / 2 + (1 - q) * 60, tileC[1], fold);
        const sc = pd * M.lerp(1, 0.18, fold);
        b.style.transformOrigin = '0 0';
        b.style.transform = `translate(${cx - (w * sc) / 2}px, ${cy - (h * sc) / 2}px) rotate(${PAY.rot[i] * (1 - fold)}deg) scale(${sc})`;
        show(b, q * (1 - E.quartIn(M.p(t, at(14, 1) + 0.28, 0.14))));
      });
      [[plL, 0.3], [plR, 0.42]].forEach(([d, dl]) => {
        const q = e01(t, 21.25 + dl, 0.45);
        d.style.top = `${PAY.top + PAY.s * Math.max(...g.payHs) + 34}px`;
        d.style.transform = `translateY(${(1 - q) * 20}px)`;
        show(d, q * (1 - e01(t, at(14, 1), 0.2)));
      });
      show(pay, t < at(14, 1) + 0.3 ? 1 : 0);
      // the bare band sits under the title zone, then rises and flattens into the end card's gold rule (bar 14)
      const r = E.expoInOut(M.p(t, at(14, 1), at(14, 2) - at(14, 1)));
      const b0 = { l: xL(-450), w: 850 * PXL, y: 540, h: 24 };
      const rule = g.rule;
      bandBar.style.left = `${M.lerp(b0.l, rule.x, r)}px`;
      bandBar.style.width = `${M.lerp(b0.w, rule.w, r)}px`;
      bandBar.style.top = `${M.lerp(b0.y, rule.y, r)}px`;
      bandBar.style.height = `${M.lerp(b0.h, rule.h, r)}px`;
      bandBar.style.borderRadius = `${M.lerp(0, 5, r)}px`;
      bandBar.style.background = `rgb(${M.lerp(231, 245, r)},${M.lerp(229, 165, r)},${M.lerp(228, 36, r)})`;
      show(bandBar, t < at(14, 2) + 0.02 ? e01(t, 21.4, 0.45) : 0);
      show(EC.rule, t >= at(14, 2) ? 1 : 0);
      EC.rule.style.transform = 'none';
      // the lockup at the end card's own places: no travel later
      const tL = at(14, 1) + 0.3;                        // the folded answers become the tile
      const tq = e01(t, tL, 0.45);
      EC.tile.style.transform = `scale(${M.lerp(0.7, 1, tq)})`;
      show(EC.tile, tq);
      EC.mark.draw(M.p(t, tL, 0.75));
      EC.mark.svg.style.opacity = t >= tL ? '1' : '0';
      const rise = (x, t0) => { const p = e01(t, t0, 0.42); x.style.transform = `translateY(${(1 - p) * 26}px)`; show(x, p); };
      rise(EC.name, at(14, 2) + 0.2);
      rise(EC.namehi, at(14, 3) + 0.1);
      // bar 15: the call writes in above the rule, where the hook lines sat
      rise(EC.label, at(14, 4) + 0.1);              // the label leads the number in, before the hit
      const nw = e01(t, HIT3 + 0.05, 0.6, E.quartOut);
      EC.num.style.clipPath = `inset(-20% ${(1 - nw) * 100}% -20% 0)`;
      show(EC.num, t >= HIT3 + 0.05 ? 1 : 0);
      rise(EC.sub, HIT3 + 0.4);
      rise(EC.url, HIT3 + 0.55);
      rise(EC.play, HIT3 + 0.7);
      rise(EC.logo, HIT3 + 0.85);
      rise(EC.tag, HIT3 + 0.9);
    }
  }

  // ───────────────────────── init ─────────────────────────
  window.READY = (async () => {
    await K.fontsReady();
    // the instrument's numbers, proven (prompt › Direction)
    const near = (a, b) => Math.abs(a - b) < 0.6;
    if (!near(xL(-450), 200) || !near(xL(400), 843) || !near(xL(430) + 12, 877.4) || xL(430) + 12 > 888) throw new Error('instrument geometry off');
    G = measure();
    { tag.style.font = '800 54px/1.1 var(--f-latin)'; const sp = document.createElement('span'); sp.textContent = TAG_ROD; sp.style.font = tag.style.font; sp.style.position = 'absolute'; sp.style.whiteSpace = 'nowrap'; stage.appendChild(sp); G.tagW54 = sp.offsetWidth; sp.remove(); }
    // tiles: cover-fit each card in its album tile, top-aligned (stock check left, sales right)
    [[tA0, bubA.tiles[0]], [tA1, bubA.tiles[1]], [tB0, bubB.tiles[0]], [tB1, bubB.tiles[1]]].forEach(([h]) => {
      const { w, h: hh } = h.size();
      const s = Math.max(146 / w, 150 / hh);
      h.host.style.transformOrigin = '0 0';
      h.host.style.transform = `translate(${(146 - w * s) / 2}px, 0) scale(${s})`;
    });
    [pS, pX].forEach((h) => { h.host.style.transformOrigin = '0 0'; h.host.style.transform = `scale(${PAY.s})`; });
    G.payHs = [pS.size().h, pX.size().h];
    { const r = EC.tile.getBoundingClientRect(); G.tileC = r.top + r.height / 2; }
    stage.style.visibility = 'visible';
    // card text must be clean (DIRECTION §4) and carry what the reel names
    K.card.assertClean(vS, ['4% of tank stock (400 L)', '(50 L)', '450', '-430', 'स्टॉक सही है', 'नियम 5.1.11']);
    K.card.assertClean(vX, ['+430', '+30', '4% of tank stock (400 L)', 'वाष्पन छूट सिर्फ़ कमी पर मिलती है', 'स्टॉक मान्य सीमा से भी ज़्यादा है', 'बिक्री व सप्लाई तुरंत रुक सकती है']);
    K.card.assertClean(tA1, ['3,708', '10,000', '25,960']);
    // the title slots the lifted parts fly to
    show(sum, 1);
    const sr = (x) => { const r = x.getBoundingClientRect(); return { x: r.left, y: r.top + r.height * 0.5 - 36 }; };
    G.slot = { n4: sr(sumP.n4), n5: sr(sumP.n5) };
    show(sum, 0);
    // the end card's rule, where the band lands
    { const r = EC.rule.getBoundingClientRect(); G.rule = { x: r.left, y: r.top, w: r.width, h: r.height }; }
    // the phone at rest: bubble A's edge (the rod lays flat along it), its tiles; then bubble B's
    G.bubA = { cx: AX, top: 900, w: 640 }; G.tapA = [AX, 960]; G.tileA = [0, 0, 1080, 1920]; G.tileB = [0, 0, 1080, 1920];
    G.flipA = { x: W / 2, y: 300, s: 0.1, ax: AX, ay: 960 }; G.flipB = G.flipA;
    G.C = cams();
    seek(6.9);
    {
      const r = bubA.root.getBoundingClientRect();
      G.bubA = { cx: r.left + r.width / 2, top: r.top, w: r.width };
      const tr = bubA.tiles[0].getBoundingClientRect();
      G.tileA = [tr.left, tr.top, tr.right, tr.bottom];
      G.tapA = [tr.left + tr.width / 2, tr.top + tr.height / 2];
    }
    seek(20.4);
    { const tr = bubB.tiles[0].getBoundingClientRect(); G.tileB = [tr.left, tr.top, tr.right, tr.bottom]; }
    // the card framed exactly as the tile shows it (cover-fit, top-aligned): the FLIP's start and end
    const tileCam = (rect, h) => {
      const sz = h.size();
      const fit = Math.max(146 / sz.w, 150 / sz.h);
      const k = (rect[2] - rect[0]) / 146;
      return { x: W / 2, y: (150 / fit) / 2, s: fit * k, ax: (rect[0] + rect[2]) / 2, ay: (rect[1] + rect[3]) / 2 };
    };
    G.flipA = tileCam(G.tileA, vS);
    G.flipB = tileCam(G.tileB, vX);
    seek(0);
    return true;
  })();

  window.SCENE = {
    bpm: 128, duration: D, seek,
    hits: [HIT1, HIT2, HIT3],
    hero: [0, at(4, 3) + 0.2, at(6, 4) + 0.3, HIT2 + 0.25, at(14, 4) + 0.2, 29.0],
    safeSel: ['.lbl', '.tag', '.rl', '.stake', '.sum', '.chip', '.ghost', '.paylbl'],
    wordSel: ['.lbl .w', '.tag .w', '.rl .w', '.chip .w'],      // the instrument's labels count toward the 7-word cap
  };
})();
