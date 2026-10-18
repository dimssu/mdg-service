// Reel 03 · Credit & DOD — "कितना, कब तक" (one decision, two figures).
// Every style is computed from t inside seek(t): no CSS animation, no timers,
// no state between frames (DIRECTION §10.2). 120 BPM, 15 bars of 2 s.
(function () {
  const K = window.Kit, { M, E } = K;
  const C = K.clock(120, 15);
  const D = 30;
  const at = (bar, beat = 1) => C.at(bar, beat);
  const HIT1 = at(1, 4), HIT2 = at(5, 3), HIT3 = at(15, 1);
  const stage = document.getElementById('stage');
  const el = (tag, cls, parent = stage, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  };
  const show = K.show, e01 = M.e, tw = M.tw;
  stage.style.visibility = 'hidden';   // nothing paints until the fonts are proven (DIRECTION › Lessons)

  // measured voice (the sound director's beat map); estimates until it exists
  const S = window.SCRIPT;
  const plain = (w) => w.toLowerCase().replace(/[़।,?.!]/g, '');
  const word = (id, ws, fb) => {
    const l = S && S.lines && S.lines.find((x) => x.id === id);
    if (!l || !l.words) return fb;
    const want = [].concat(ws).map(plain);
    const x = l.words.find((q) => want.includes(plain(q.w)));
    if (!x) return fb;
    return x.t0 < l.start - 0.01 ? l.start + x.t0 : x.t0;
  };
  // the board's flips, locked to the clacks: script.json → board gives each flip's start (a clack lands 0.11 s in)
  const cue = (sound, fb) => { const b = S && S.board && S.board.find((x) => x.sound === sound); return b ? b.flip : fb; };
  const ST = 0.03;                                  // the board's stagger, the clacks' own spacing
  const F = { d3: cue('clack-days1', 12.5), d2: cue('clack-days2', 13.25), d1: cue('clack-days3', 14.1), d0: cue('clack-days4', 15.0) };
  const T_AMT = cue('clack-amount', 9.0), T_DATE = cue('clack-date', 10.32), T_SET = cue('clack-rowset', 22.4);
  // the board leaves so the next question lands on its own spoken word, after the last verdict has had ≥ 0.9 s
  const BOUT = Math.max(F.d0 + 0.9, word('L6', ['क्रेडिट'], 16.64) - 0.34);
  // a figure lifts off a card that is standing still: the camera is on the date by CAM_DATE, on the
  // date panel (whose framing holds the verdict too), and moves on only once the verdict has gone into its row
  const CAM_DATE = Math.min(10.3, Math.max(9.5, T_DATE - 0.27)), CAM_WIDE = Math.max(12.6, F.d3 + 0.1);
  const DUN = Math.min(12.15, F.d3 - 0.32);         // the days row unfolds (blank) before its first verdict goes in
  const FOLD_B = Math.min(12.0, DUN - 0.15);        // … as the date row folds away

  // ───────────────────────── layout (DIRECTION §5.3) ─────────────────────────
  const AX = 540, TITLE1 = 300, TITLE2 = 394;
  const FH = 136;                                   // flap height
  const WIN = { l: 192, r: 888, bottom: 1248 };

  // ───────────────────────── layers (bottom → top) ─────────────────────────
  const L = {
    road: el('div', 'layer'),
    phone: el('div', 'layer'),
    viewer: el('div', 'layer'),
    board: el('div', 'layer'),
    text: el('div', 'layer'),
    end: el('div', 'layer'),
  };

  // ───────────────────────── the tanker (bars 1–3) ─────────────────────────
  const road = el('div', 'road', L.road); road.style.top = '1100px';
  const NS = 'http://www.w3.org/2000/svg';
  const tk = document.createElementNS(NS, 'svg');
  tk.setAttribute('class', 'tanker'); tk.setAttribute('width', '480'); tk.setAttribute('height', '170'); tk.setAttribute('viewBox', '0 0 480 170');
  tk.innerHTML = `
    <g fill="none" stroke="#18181b" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <rect x="10" y="22" width="318" height="96" rx="48"/>
      <line x1="120" y1="22" x2="120" y2="118"/><line x1="218" y1="22" x2="218" y2="118"/>
      <path d="M338 118 V52 Q338 42 348 42 H404 Q416 42 422 54 L452 96 Q458 104 458 114 V130 H338"/>
      <path d="M352 56 H400 L424 92 H352 Z"/>
      <line x1="2" y1="130" x2="338" y2="130"/>
    </g>
    <g fill="#fafaf9" stroke="#18181b" stroke-width="3">
      <circle cx="70" cy="144" r="22"/><circle cx="122" cy="144" r="22"/><circle cx="270" cy="144" r="22"/><circle cx="410" cy="144" r="22"/>
    </g>`;
  L.road.appendChild(tk);

  // ───────────────────────── the board (Kit.flap) ─────────────────────────
  const board = K.flap.board(L.board);
  const digit = { w: 76, kind: 'char', fs: 110 }, comma = { w: 30, kind: 'char', fs: 110 };
  // ₹4,86,120 → ₹ 4 , 8 6 , 1 2 0 : 7 × 76 + 2 × 30 + 8 × 6 = 640 px
  const rowA = board.row({ cells: [digit, digit, comma, digit, digit, comma, digit, digit, digit], h: FH, stagger: ST });
  const rowB = board.row({ cells: [digit, digit, { w: 232, kind: 'word', fs: 60 }], h: FH, stagger: ST });     // '26' + 'अगस्त' · ' 3' + 'दिन'
  const rowD = board.row({ cells: [{ w: 560, kind: 'word', fs: 60 }], h: FH, stagger: ST });                    // the days verdict, one wide flap
  const BL = ' ', DASH = '–', MIN = '−';
  const amt = (s) => [...s];
  const AMOUNT = ['₹', '4', ',', '8', '6', ',', '1', '2', '0'];
  const BLANK_A = ['₹', BL, BL, BL, BL, BL, BL, BL, BL];
  const DASH_A = ['₹', DASH, BL, DASH, DASH, BL, DASH, DASH, DASH];
  const uline = el('div', 'uline', L.board);           // the beat's gold, under the row being named
  const rulebar = el('div', 'rulebar', L.end);         // the rows, flattened, on their way to the end card's rule
  const rbGold = el('div', 'rb-gold', rulebar);

  // ───────────────────────── the phone (one picture) ─────────────────────────
  const av = document.createElement('div');
  K.mark(av, { size: 28, color: '#18181b' }).draw(1);    // the app's header: black mark on a grey disc
  const ph = K.chat.phone(L.phone, { title: 'सहायता', subtitle: 'MDG टीम', avatar: av });
  K.chat.dateChip(ph.wall, 'आज', 18);
  // the backend's line is "… जमा करें (पोर्टल के अनुसार)।" — the one sanctioned edit: the clause is dropped (CATALOG § 03)
  const bub = K.chat.photoBubble(ph.wall, { left: 10, top: 56, tile: [306, 300], caption: '💳 ₹4,86,120.00 26 अगस्त तक जमा करें।' });
  const tap = K.view.tap(L.phone);
  const PH = { s: 1.65, y: 540 };            // bezel 414 × 1.65 = 683 px: inside the centred width
  const phX = (s) => AX - 207 * s;

  // ───────────────────────── the card ─────────────────────────
  const HIDE = ['.code', '.t2', '.foot-l'];   // never K.card.DSR_HIDE here: on this card .foot-r is the honest caveat
  const mountIn = (parent, name) => {
    const host = el('div', '', parent);
    host.style.position = 'absolute'; host.style.left = '0'; host.style.top = '0';
    return K.card.mount(host, window.CARDS[name], { hide: HIDE });
  };
  const tile = mountIn(bub.tile, 'due-3');
  const cw = el('div', 'cardwrap', L.viewer);
  const vc = mountIn(cw, 'due-3');
  const veil = el('div', 'layer', L.viewer);   // the window's own page behind the card (kept white)
  veil.style.background = 'transparent';

  // ───────────────────────── reel type ─────────────────────────
  function line(text, cls, top, parent = L.text) {
    const ln = K.kin.line(parent, text, { cls: `rt ${cls}` });
    ln.el.style.top = `${top}px`;
    ln.parts.forEach((p) => { if (!/[ऀ-ॿ]/.test(p.textContent)) p.classList.add('lat'); });
    return ln;
  }
  const T = {
    h1a: line('कितना जमा करना है?', 'rt-72', TITLE1),
    h1b: line('कब तक?', 'rt-72', TITLE2),
    p2a: line('खाता शून्य से', 'rt-72', TITLE1),
    p2b: line('नीचे गया —', 'rt-72', TITLE2),
    p3: line('गिनती शुरू।', 'rt-72', TITLE1),
    t4a: line('यह हिसाब —', 'rt-72', TITLE1),
    t4b: line('आपके फ़ोन पर', 'rt-72', TITLE2),
    b5a: line('इंडियन ऑयल को', 'rt-72', TITLE1),
    b5b: line('जमा करना है —', 'rt-72', TITLE2),
    b6: line('कब तक —', 'rt-72', TITLE1),
    b7: line('कितने दिन बाक़ी?', 'rt-72', TITLE1),
    b9: line('क्रेडिट कितना बचा?', 'rt-72', TITLE1),
    b11a: line('इंडियन ऑयल का', 'rt-72', TITLE1),
    b11b: line('हिसाब —', 'rt-72', TITLE2),
    y12a: line('कितना, कब तक —', 'rt-72', TITLE1),
    y12b: line('एक नज़र में।', 'rt-72', TITLE2),
  };
  const eq1 = el('div', 'eq', L.text, '₹25,00,000<span class="op">−</span>₹18,42,650');
  const eq2 = el('div', 'eq ans', L.text, '<span class="a"><span class="op">=</span>₹6,57,350</span><span class="u"></span>');
  eq1.style.top = '540px'; eq2.style.top = '616px';   // above the data window (top 760), the answer larger than its operands
  const gAmt = el('div', 'ghost num', L.text, '₹4,86,120');
  const gDate = el('div', 'ghost num', L.text, '26-08');
  const gDays = el('div', 'ghost hi', L.text, '3 दिन बाक़ी');

  // ───────────────────────── end card ─────────────────────────
  const EC = K.endcard(L.end);
  K.safezone(stage);

  // ───────────────────────── geometry, measured once ─────────────────────────
  let G = null;
  const W = 1080;   // the card frame (1,000 px card + 40 px frame), 1,085 tall
  function measure() {
    const r = (s) => vc.rect(s);
    return {
      size: vc.size(),
      hero: r('.hero'), amount: r('.hero-main .amount'), dpv: r('.dpanel .dp-v'), dph: r('.dpanel .dp-h'), dpanel: r('.dpanel'),
      tiles: r('.tiles'), bar: r('.bar-wrap'), barCap: r('.bar-cap span'),
      header: r('.header'), blockH: r('.block-h'), tile: r('.tile'), band: r('.band'), chips: r('.chips'), footR: r('.foot-r'),
      barFill: r('.bar-fill'), barCapR: r('.bar-cap-r'), eyebrowHi: r('.eyebrow-hi'), tH: r('.t-h'),
      amountFont: parseFloat(getComputedStyle(vc.q('.hero-main .amount')).fontSize),
      dpvFont: parseFloat(getComputedStyle(vc.q('.dpanel .dp-v')).fontSize),
      dphFont: parseFloat(getComputedStyle(vc.q('.dpanel .dp-h')).fontSize),
      // each figure's own ink on the card (the amount is red there), so its lifted copy starts in it
      ink: Object.fromEntries([['amount', '.hero-main .amount'], ['dpv', '.dpanel .dp-v'], ['dph', '.dpanel .dp-h']]
        .map(([k, q]) => [k, getComputedStyle(vc.q(q)).color.match(/\d+/g).slice(0, 3).map(Number)])),
    };
  }
  // Every framing is set by its window edges in card px, each chosen to fall between two lines of the card
  // (an edge through a line of text read as sloppy: QA gate 2), and is anchored at the window's top edge: the
  // hold's push grows the card downward, the top cut stays put, and the bottom cut, which moves up by the push,
  // is proven to stay in its gap. Each framing has its own window (WF: top, bottom). Between framings the
  // window closes (its lower edge rises to its upper one), the camera changes while it is shut, and it reopens
  // on the next framing: the camera never pans across the card (PROMPT › camera), and no half-cut line is
  // legible mid-move (QA gate 2, the recheck).
  const PUSH = 0.06, PUSH_D = 0.08;
  const WF = {};
  const SHUT = 0.2, OPEN = 0.25;
  const SW1 = CAM_DATE - OPEN, SW2 = CAM_WIDE + SHUT, SW3 = 16.75;          // the three changes of framing
  const SWITCHES = [[SW1, 'A', 'B'], [SW2, 'B', 'C'], [SW3, 'C', 'D']];
  function cams() {
    const g = G, bot = (r) => r.y + r.h, half = WIN.r - AX;
    const at0 = (x, top, s, winTop) => ({ x, y: top, s, ax: AX, ay: winTop });
    const T0 = bot(g.header) + 4;                                   // just under the header band, above DUE AMOUNT
    const gapCheck = (n, top, b0, lo, hi, p = PUSH) => {              // the bottom cut, before and after the push
      const b1 = top + (b0 - top) / (1 + p);
      if (!(b0 <= hi && b1 >= lo)) throw new Error(`framing ${n}: bottom cut ${b1.toFixed(1)}–${b0.toFixed(1)} leaves its gap ${lo}–${hi}`);
    };
    const TOP = 864;                 // 34 px under the board's lower row (≤ 830 with its push): the rows get air
    // A (bar 5): the hero and the tiles, cut above the bar; the right edge stops short of the date panel
    const bA = g.bar.y - 3, sA = (WIN.bottom - TOP) / (bA - T0); WF.A = [TOP, WIN.bottom];
    gapCheck('A', T0, bA, bot(g.tH), g.bar.y);
    // B (bars 6–7): the date panel and its verdict, cut above YOUR LIMIT; the left edge clear of the amount
    const bB = g.blockH.y - 4, sB = (WIN.bottom - TOP) / (bB - T0); WF.B = [TOP, WIN.bottom];
    gapCheck('B', T0, bB, bot(g.eyebrowHi), g.blockH.y);
    // C (bars 7–9, the countdown): the amount band alone at 1 : 1, seated under the board — the card's own
    // "3 दिन बाक़ी हैं" is never in view beside the board's later verdicts
    const sC = 1; WF.C = [TOP, TOP + (bB - T0) * sC];
    // D (bars 9–11): YOUR LIMIT to the chips, the whole bar with both its captions (74% / 26%), cut above the
    // footer; it pushes 8% (0.685 → 0.74), which keeps "26% बची है" (ends x 1006) inside the side edges
    const tD = g.blockH.y - 12, bD = g.footR.y - 6, sD = 0.685;
    WF.D = [760, 760 + (bD - tD) * sD];
    gapCheck('D', tD, bD, bot(g.chips), g.footR.y, PUSH_D);
    const cxD = g.band.x + g.band.w / 2;
    if (cxD + half / (sD * (1 + PUSH_D)) < g.barCapR.x + g.barCapR.w) throw new Error('framing D cuts "26% बची है"');
    return {
      A: at0(g.dpanel.x - 2 - half / sA, T0, sA, WF.A[0]),
      B: at0(g.dpanel.x - 20 + half / sB, T0, sB, WF.B[0]),
      C: at0(g.dpanel.x - 2 - half / sC, T0, sC, WF.C[0]),
      D: at0(cxD, tD, sD, WF.D[0]),
    };
  }
  // the window: the framing's own, closing before a change of framing and reopening after it
  function winAt(t) {
    let f = 'A', open = 1;
    for (const [ts, from, to] of SWITCHES) {
      if (t >= ts) { f = to; open = E.expoOut(M.p(t, ts, OPEN)); continue; }
      if (t >= ts - SHUT) { f = from; open = 1 - E.quartIn(M.p(t, ts - SHUT, SHUT)); }
      break;
    }
    const [top, bottom] = WF[f];
    return [top, top + (bottom - top) * open];
  }
  function camCard(t) {
    const g = G, c = G.C;
    const keys = [
      // the FLIP lands straight on the amount: its figure lifts off a card that has stopped moving (a card still
      // zooming under its own lifted copy printed "₹4,86,1200.00"); every later change happens behind the shut window
      [8.0, g.flipA], [8.5, c.A, E.expoInOut], [SW1, c.A], [SW1 + 1e-4, c.B], [SW2, c.B], [SW2 + 1e-4, c.C],
      [SW3, c.C], [SW3 + 1e-4, c.D], [19.9, c.D], [20.55, g.flipA, E.expoInOut],
    ];
    const cam = K.view.keys(t, keys);
    // a push through every hold, at a steady pace (an eased push slows to a stop and reads as a hold), easing
    // off while the window shuts; 6%: a close framing is mostly flat panels, and 3% moved too few pixels to read
    // as motion (motion.mjs)
    const hold = (a, b, d) => M.p(t, a, b - a) * (1 - e01(t, b, d));
    const push = PUSH * (hold(9.0, SW1 - SHUT, SHUT) + hold(SW1, SW2 - SHUT, SHUT) + hold(SW2, SW3 - SHUT, SHUT)) + PUSH_D * hold(SW3, 19.9, 0.4);
    cam.s *= 1 + push;
    return cam;
  }
  // a figure lifted from the card: it starts on the card as the camera frames it at t0, arcs up and slides
  // into its row from below, clipped at the row's lower edge (the slot) — so it never sits on the flaps —
  // and the row flips to it the moment it goes in. t0 is solved so that moment is `enter` (the clack).
  function liftPath(gEl, enter, dur, src, font, base, rowTop, c0) {
    const slot = rowTop + FH, top0 = gEl.offsetTop;
    const path = (t0) => {
      const cc = camCard(t0);
      const from = K.view.toScreen(cc, src.x, src.y);
      const to = [AX - gEl.offsetWidth / 2, rowTop + FH / 2 - gEl.offsetHeight / 2];
      let frac = 1;
      for (let i = 0; i <= 120; i++) {
        const q = E.expoInOut(i / 120);
        if (top0 + M.lerp(from[1], to[1], q) - Math.sin(Math.PI * q) * 36 <= slot) { frac = i / 120; break; }
      }
      return { t0, dur, from, to, s0: (font * cc.s) / base, s1: 1, slot, top0, frac, c0 };
    };
    let P = path(enter - 0.55 * dur);
    P = path(enter - P.frac * dur);                 // once more, from where the camera really is at that t0
    return P;
  }
  function flyGhost(gEl, t, P) {
    const q = E.expoInOut(M.p(t, P.t0, P.dur));
    const y = M.lerp(P.from[1], P.to[1], q) - Math.sin(Math.PI * q) * 36, s = M.lerp(P.s0, P.s1, q);
    gEl.style.transform = `translate3d(${M.lerp(P.from[0], P.to[0], q)}px, ${y}px, 0) scale(${s})`;
    const cut = Math.max(0, (P.slot - (P.top0 + y)) / s);      // the part already inside the board
    gEl.style.clipPath = `inset(${cut.toFixed(1)}px -60px -60px -60px)`;
    // a white slip peeled off the card: it keeps its backing all the way into the slot (a backing that
    // faded would print its figure over the card's), and its ink turns from the card's colour to the board's
    const lift = M.clamp(q * 5), ink = M.clamp(q * 2.5);
    gEl.style.background = '#fff';
    gEl.style.boxShadow = `0 ${(10 * lift).toFixed(1)}px ${(24 * lift).toFixed(1)}px rgba(0,0,0,${(0.22 * lift).toFixed(3)})`;
    gEl.style.color = `rgb(${P.c0.map((c, i) => Math.round(M.lerp(c, [24, 24, 27][i], ink))).join(',')})`;
  }
  const KIN = { origin: '50% 100%' };
  const play = (ln, t, a, b, o = {}) => K.kin.play(ln, t, a, b, { ...KIN, ...o });

  // the board's row positions: a row is centred on x 540 with its own top
  const placeRow = (r, top, o = {}) => {
    const { y = 0, s = 1, rx = 0, sy = 1, op = 1 } = o;
    r.el.style.transformOrigin = '0 0';
    r.el.style.transform = `translate(${AX}px, ${top + y}px) scale(${s}, ${s * sy}) rotateX(${rx}deg)`;
    show(r.el, op);
  };

  // ───────────────────────── seek ─────────────────────────
  function seek(t) {
    const g = G;
    // the three lifted figures (amount, date, the card's own verdict) and the moments they go into their rows
    const LA = liftPath(gAmt, T_AMT, 0.5, g.amount, g.amountFont, 72, 520, g.ink.amount);
    const LD = liftPath(gDate, T_DATE, 0.4, g.dpv, g.dpvFont, 72, 684, g.ink.dpv);
    const LV = liftPath(gDays, F.d3, 0.42, g.dph, g.dphFont, 60, 684, g.ink.dph);
    const B_IN = LD.t0 - 0.15;                                         // the date row unfolds, blank, to take its figure

    // ---------------- the road and the tanker (bars 1–3, out at the turn) ----------------
    const roadOn = t < 3.45;
    show(L.road, roadOn ? 1 : 0);
    const pain = tw(t, 2.8, 3.2, 1, 1.04, E.sineInOut);          // bars 2–3: a slow push on the whole pain picture
    L.road.style.transformOrigin = '540px 900px';
    L.road.style.transform = pain === 1 ? 'none' : `scale(${pain.toFixed(5)})`;
    if (roadOn) {
      // it drives straight through and is gone by 2.95, before the account moves (3.0): a truck that stopped under
      // the board read as "it caused the debit" and dated the purchase to the as-of day (CATALOG § 03)
      const pass = E.sineInOut(M.p(t, 2.0, 0.95));
      const x = M.lerp(-520, 1100, pass);
      tk.style.transform = `translate(${x.toFixed(1)}px, ${1100 - 166}px)`;
      road.style.transformOrigin = '100% 50%';            // the road retracts after the truck, never blinks out
      road.style.transform = `scaleX(${(1 - E.quartInOut(M.p(t, 2.9, 0.5))).toFixed(4)})`;
      show(road, 1);
    }

    // ---------------- the board ----------------
    // bars 1–3: two rows (amount, then date/days) under the questions; a 2% push from t = 0
    // bar 4: it folds down into the bubble's picture · bars 5–8: rows above the card window
    // bars 12–13: it rises out of the bubble · bar 14: its rows fold flat into the end card's rule
    // one clack per row change; where a cue covers both rows, the date row follows the amount row's last flap
    // the riffle starts 40 ms ahead of its clack (a picture that leads its sound by that little reads in sync),
    // so the poster frame is never held a full half second (motion.mjs: a still run must stay under 0.5 s)
    const RIF = cue('clack-riffle', 0.5) - 0.04, DSH = cue('clack-settle', HIT1);
    rowA.schedule([
      [-1, BLANK_A], [RIF, BLANK_A, { force: true }], [DSH, DASH_A],
      [cue('clack-zero', 3.0), ['₹', BL, BL, BL, BL, BL, BL, BL, '0']],
      [cue('clack-minus', 3.6), ['₹', MIN, BL, BL, BL, BL, BL, BL, BL]],   // the sign's own place (the dashes filled every digit's)
      [7.0, BLANK_A],                                                   // reset while the board is away (bars 4–5): no flip on screen
      [T_AMT, AMOUNT], [T_SET, AMOUNT, { force: true }],
    ]);
    rowB.schedule([
      [-1, [BL, BL, BL]], [RIF + 9 * ST, [BL, BL, BL], { force: true }], [DSH + 6 * ST, [DASH, DASH, DASH]],
      [cue('clack-3din', 4.65), [BL, '3', 'दिन']], [8.0, [BL, BL, BL]], [T_DATE, ['2', '6', 'अगस्त']],
      [T_SET, ['2', '6', 'अगस्त'], { force: true }],
    ]);
    rowD.schedule([[-1, [BL]], [F.d3, ['3 दिन बाक़ी']], [F.d2, ['2 दिन बाक़ी']], [F.d1, ['कल आख़िरी दिन']], [F.d0, ['आज ही जमा करना है']]]);
    [rowA, rowB, rowD].forEach((r) => r.seek(t));

    const boardOn = t < 6.75 || (t >= 8.25 && t < BOUT + 0.4) || (t >= 22.0 && t < 26.7);
    show(L.board, boardOn ? 1 : 0);
    if (boardOn) {
      let topA, topB, push = 1, fold = 0, syA = 1, syD = 1;
      if (t < 6.75) {
        // a steady push from frame 0 (an eased one starts too slowly to read), then the pain picture's own push
        // steady (linear) pushes: an eased one slows to a stop, and once the truck has gone bars 2–3 have nothing else moving
        push = (1 + 0.025 * M.p(t, 0, 1.6)) * (1 + 0.04 * M.p(t, 2.8, 3.2));   // 640 × 1.066 = 682 px at most
        topA = 572; topB = 752;
        // folds down into the bubble's picture, and is flat by 6.32, before the card unfolds there (6.35): a slower
        // fold left `₹−` lying on the card's ₹4,86,120.00 (read: the amount below zero)
        fold = E.quartInOut(M.p(t, 5.92, 0.4));
      } else if (t < BOUT + 0.4) {
        topA = 520; topB = 684;                                 // 28 px between the rows: room for the gold underline
        push = 1 + 0.04 * M.p(t, 8.25, 8.3) + 0.03 * E.sineInOut(M.p(t, F.d0, BOUT - F.d0));   // steady, and firmer while the last verdict holds (640 × 1.07 = 685 px)
        // in: the amount row unfolds down from its top edge; out: the rows fold up flat, one after the other
        syA = E.expoOut(M.p(t, 8.25, 0.35)) * (1 - E.quartIn(M.p(t, BOUT, 0.28)));
        syD = 1 - E.quartIn(M.p(t, BOUT + 0.08, 0.28));
      } else {
        topA = 570; topB = 742;                                 // 36 px between the rows: the gold's own band
        const rise = E.expoOut(M.p(t, 22.0, 0.55));            // out of the bubble: bar 4 reversed
        push = (M.lerp(0.8, 1, rise)) * (1 + 0.05 * M.p(t, 22.5, 3.6));   // a steady push (an eased one slows to a stop and reads as a hold); 5%: 3.5% left 24.9–25.4 still
        fold = 1 - rise;
      }
      // bar 4 / bar 12: the whole board heads to (or comes from) the bubble's picture, folding on its lower edge
      const T0 = g.tileA, tCy = (T0[1] + T0[3]) / 2;
      const dy = fold * (tCy - (topA + topB + FH) / 2);
      const rx = 90 * fold;
      // bar 14: the rows flatten one after the other
      const fA = e01(t, at(14, 1), 0.22, E.quartIn), fB = e01(t, cue('clack-fold2', 26.12), 0.22, E.quartIn);   // flat by ≈ 26.34, before the lockup tile
      // bars 1–3 push on the frame's centre (y 960), so the rows drift up as they grow, not only outward
      const cy = t < 6.75 ? (push - 1) * -1 : 0;
      placeRow(rowA, topA, { y: dy + cy * (960 - topA), s: push * (1 - 0.2 * fold), rx, sy: (1 - fA) * syA });
      const mid = t >= 8.25 && t < BOUT + 0.4;
      const showB = t < 6.75 || (t >= B_IN && t < FOLD_B + 0.3) || t >= 22.0;   // bars 5–6: only once the date is coming
      const bIn = mid ? E.expoOut(M.p(t, B_IN, 0.3)) : 1;                    // unfolds down, blank, to take its figure
      const bOut = mid ? E.quartIn(M.p(t, FOLD_B, 0.3)) : 0;                 // the date row folds away for the days
      placeRow(rowB, topB, { y: dy + cy * (960 - topB), s: push * (1 - 0.2 * fold), rx: rx + 90 * bOut, sy: (1 - fB) * bIn, op: showB ? 1 : 0 });
      const showD = t >= DUN && t < BOUT + 0.4;
      placeRow(rowD, topB, { s: push, rx: -90 * (1 - E.expoOut(M.p(t, DUN, 0.3))), sy: syD, op: showD ? 1 : 0 });
      // the gold underline: bar 3 under "3 दिन", bar 5 under the amount, bar 12 under the amount
      let uOn = 0, uY = 0, uW = 0;
      // under the bottom row: 10 px below its (pushed) lower edge; between two rows: centred in the gap
      const under = (top) => top + FH * push + 10, between = () => (topA + FH * push + topB) / 2 - 4;
      const T3 = cue('clack-3din', 4.65);
      if (t >= T3 && t < 6.0) { uOn = e01(t, T3 + 0.1, 0.25); uY = under(topB + cy * (960 - topB)) + 4; uW = rowB.width * push; }   // drifts with its row
      else if (t >= T_AMT && t < T_DATE - 0.25) { uOn = e01(t, T_AMT + 0.2, 0.25) * (1 - e01(t, T_DATE - 0.45, 0.2)); uY = t >= B_IN ? between() : under(topA); uW = rowA.width * push; }
      else if (t >= F.d0 && t < BOUT + 0.3) { uOn = e01(t, F.d0 + 0.12, 0.3) * (1 - e01(t, BOUT, 0.2)); uY = between(); uW = rowA.width * push; }   // the beat's gold under the amount the last verdict is about (under the verdict it read as a deadline sting)
      // the payoff: the gold names the amount, then (24.0) the date — the hold changes a fact halfway
      else if (t >= 22.6 && t < 24.0) { uOn = e01(t, 22.6, 0.3) * (1 - e01(t, 23.8, 0.2)); uY = between(); uW = rowA.width * push; }
      else if (t >= 24.0 && t < 26.0) { uOn = e01(t, 24.02, 0.3) * (1 - e01(t, 25.8, 0.2)); uY = under(topB); uW = rowB.width * push; }
      uline.style.left = `${AX - uW / 2}px`; uline.style.width = `${uW}px`; uline.style.top = `${uY}px`;
      uline.style.transform = `scaleX(${uOn})`;
      show(uline, uOn > 0 ? 1 : 0);
    }

    // ---------------- the phone ----------------
    const phA = t >= 5.9 && t < 8.45, phB = t >= 19.9 && t < 26.5;
    show(L.phone, phA || phB ? 1 : 0);
    if (phA || phB) {
      // in from below, out downward: the phone moves, never dissolves (parked below in bars 5–10)
      const rise = phA ? E.expoOut(M.p(t, 5.95, 0.5)) : E.expoOut(M.p(t, 19.95, 0.5));
      const leave = phA ? E.expoIn(M.p(t, 8.05, 0.35)) : E.expoIn(M.p(t, 26.0, 0.4));
      const drift = phA ? tw(t, 6.45, 1.6, 1, 1.01, E.sineInOut) : 1 + 0.02 * M.p(t, 20.45, 5.6);
      // bar 12: as the board rises out of the bubble, the phone shrinks and settles under it (the source stays in view)
      const settle = phB ? E.expoInOut(M.p(t, 22.0, 0.6)) : 0;
      const s = M.lerp(PH.s, 1.0, settle) * drift;
      const y = M.lerp(PH.y, 930, settle);
      ph.root.style.transformOrigin = '0 0';
      ph.root.style.transform = `translate(${phX(s)}px, ${y + (1 - rise) * 820 + leave * 1500}px) scale(${s})`;
      show(ph.root, 1);
      // the picture unfolds from the folded board (bar 4); in bar 12 it folds back up into the board
      const unfold = phA ? E.expoOut(M.p(t, 6.35, 0.45)) : 1;
      bub.tile.style.transformOrigin = '50% 0';
      bub.tile.style.transform = `perspective(900px) rotateX(${(-90 * (1 - unfold)).toFixed(2)}deg)`;
      show(bub.tile, (phA && t < 8.02) || (phB && t >= 20.53) ? 1 : 0);
      tap.at(t, at(4, 4), g.tapA[0], g.tapA[1]);
    }

    // ---------------- the card window (bars 5–11) ----------------
    const viewOn = t >= 8.0 && t < 20.55;
    show(L.viewer, viewOn ? 1 : 0);
    if (viewOn) {
      K.view.apply(cw, camCard(t));
      let clip;
      const [winTop, winBot] = winAt(t);
      const win = [WIN.l, winTop, WIN.r, winBot];
      const rad = Math.min(18, (winBot - winTop) / 2);
      if (t < 8.5) clip = K.view.flipClip(t, 8.0, 0.5, g.tileA, win, [9, 18]);
      else if (t < 19.95) clip = `inset(${winTop.toFixed(1)}px ${1080 - WIN.r}px ${(1920 - winBot).toFixed(1)}px ${WIN.l}px round ${rad.toFixed(1)}px)`;
      else {
        const q = E.expoInOut(M.p(t, 19.95, 0.6));
        const [l, tp, r, b] = g.tileA;
        clip = `inset(${M.lerp(winTop, tp, q)}px ${M.lerp(1080 - WIN.r, 1080 - r, q)}px ${M.lerp(1920 - winBot, 1920 - b, q)}px ${M.lerp(WIN.l, l, q)}px round ${M.lerp(18, 9, q)}px)`;
      }
      L.viewer.style.clipPath = clip;
    }

    // ---------------- lifted figures ----------------
    {
      // bar 5: the amount lifts out of the hero in the silent beat and goes into its row on hit 2 · bar 6: the
      // date, on "तारीख" · bar 7: the card's own verdict becomes the days row's first flap, on "दिन"
      for (const [gEl, P] of [[gAmt, LA], [gDate, LD], [gDays, LV]]) {
        const on = t >= P.t0 && t < P.t0 + P.dur;
        show(gEl, on ? 1 : 0);
        if (on) flyGhost(gEl, t, P);
      }
    }

    // ---------------- the data moment (bars 9–10) ----------------
    {
      // out by 19.85, before the phone rises (19.95): it wiped off across the phone's bezel
      const e1 = e01(t, 17.0, 0.45), e2 = e01(t, 17.8, 0.45), out = e01(t, 19.6, 0.25, E.quartIn);
      [[eq1, e1], [eq2, e2]].forEach(([x, q]) => {
        x.style.clipPath = `inset(-30% ${((1 - q) * 100).toFixed(2)}% -30% ${(out * 100).toFixed(2)}%)`;   // wipes on, wipes off (never fades over the rising phone)
        x.style.transform = `translateY(${(-out * 30).toFixed(2)}px) scale(${(1 + 0.02 * E.sineInOut(M.p(t, 17.0, 2.9))).toFixed(4)})`;
        x.style.transformOrigin = '50% 50%';
        show(x, t >= 16.95 && t < 19.86 ? 1 : 0);
      });
      eq2.querySelector('.u').style.transform = `scaleX(${e01(t, 18.2, 0.3)})`;
    }

    // ---------------- reel type ----------------
    play(T.h1a, t, -1, 2.08);
    play(T.h1b, t, -1, 2.1);
    const P2OUT = word('L2', ['तो'], 4.54) - 0.12;   // held longer, bars 2–3 had a 0.6 s still (motion.mjs)
    play(T.p2a, t, Math.max(2.15, word('L2', ['खाता'], 2.46) - 0.06), P2OUT);
    play(T.p2b, t, Math.max(2.4, word('L2', ['नीचे'], 3.72) - 0.06), P2OUT + 0.02);
    play(T.p3, t, Math.max(P2OUT + 0.1, word('L2', ['गिनती'], 4.75) - 0.06), 5.88);
    play(T.t4a, t, Math.max(5.95, word('L3', 'यह', 6.2) - 0.2), 7.95);   // the title zone is not left empty at the turn
    play(T.t4b, t, Math.max(6.3, word('L3', ['आपके'], 6.6) - 0.05), 7.97);
    play(T.b5a, t, 8.12, 9.95);    // says to whom: the Indian Oil account
    play(T.b5b, t, 8.24, 9.97);
    play(T.b6, t, 10.05, 11.95);
    play(T.b7, t, Math.max(12.05, word('L5', ['कितने'], 12.21) - 0.08), F.d0 - 0.3);
    play(T.b9, t, BOUT + 0.32, 19.6);   // after the last verdict has had its reading time; out with the sum
    const Y12 = word('L7', ['एक'], 21.7);                               // `एक नज़र में।` lands on its words
    play(T.b11a, t, 20.05, Y12 - 0.15);
    play(T.b11b, t, Math.max(20.2, word('L7', ['हिसाब'], 21.01) - 0.06), Y12 - 0.13);
    play(T.y12a, t, Y12 + 0.02, at(14, 1));
    play(T.y12b, t, Y12 + 0.16, at(14, 1) + 0.02);

    // ---------------- strongest moment and end card ----------------
    const endOn = t >= 25.9;
    show(L.end, endOn ? 1 : 0);
    if (endOn) {
      const breath = 1 + 0.015 * E.sineInOut(M.p(t, 26.0, 2.0));     // a steady push that settles by 28.0
      L.end.style.transformOrigin = '540px 768px';
      L.end.style.transform = Math.abs(breath - 1) < 1e-5 ? 'none' : `scale(${breath.toFixed(5)})`;
      // the flattened rows travel up into the end card's gold rule
      const q = E.expoInOut(M.p(t, at(14, 1) + 0.3, 0.5));
      const r0 = { x: AX - rowA.width / 2, y: 570 + FH, w: rowA.width, h: 10 }, rule = g.rule;
      rulebar.style.left = `${M.lerp(r0.x, rule.x, q)}px`;
      rulebar.style.top = `${M.lerp(r0.y, rule.y, q)}px`;
      rulebar.style.width = `${M.lerp(r0.w, rule.w, q)}px`;
      rulebar.style.height = `${M.lerp(r0.h, rule.h, q)}px`;
      rbGold.style.transform = `scaleX(${q.toFixed(4)})`;      // gold wipes out from the centre (a colour tween passed through brown)
      show(rulebar, t >= at(14, 1) + 0.25 && t < at(14, 1) + 0.82 ? 1 : 0);
      show(EC.rule, t >= at(14, 1) + 0.8 ? 1 : 0);
      EC.rule.style.transform = 'none';
      const tL = at(14, 1) + 0.22;                                    // as soon as the amount row is flat; the date row folds into it
      // opaque, scaled in from its centre: the rows' bar travels behind it (a fade let the bar show through)
      EC.tile.style.transform = `scale(${E.expoOut(M.p(t, tL, 0.45)).toFixed(4)})`;
      show(EC.tile, t >= tL ? 1 : 0);
      EC.mark.draw(M.p(t, tL, 0.7));
      EC.mark.svg.style.opacity = t >= tL ? '1' : '0';
      const rise = (x, t0, dur = 0.4) => { const p = e01(t, t0, dur); x.style.transform = `translateY(${(1 - p) * 24}px)`; show(x, p); };
      // the name rises as the voice says it ("डीलर" 26.28, "कवच" 26.68); the call on "हमसे"
      const tN = Math.max(26.34, word('L8', ['डीलर'], 26.28) + 0.06);   // once the date row is flat
      rise(EC.name, tN); rise(EC.namehi, tN + 0.2); rise(EC.url, 27.1); rise(EC.play, 27.2);
      rise(EC.label, Math.max(27.3, word('L8', ['हमसे'], 27.45) - 0.05), 0.35);
      const nw = e01(t, 27.5, 0.45, E.quartOut);
      EC.num.style.clipPath = `inset(-20% ${(1 - nw) * 100}% -20% 0)`;
      show(EC.num, t >= 27.5 ? 1 : 0);
      rise(EC.sub, 27.6, 0.35); rise(EC.logo, 27.6, 0.35); rise(EC.tag, 27.62, 0.35);
    }
  }

  // ───────────────────────── init ─────────────────────────
  window.READY = (async () => {
    await K.fontsReady();                       // proves ₹ too (Inter's latin-ext file)
    G = measure();
    // each lifted copy is set in its source's own type and text, so at lift-off it sits exactly on the card's
    // figure (a copy in the board's type overhung the card's ".00" and read "₹4,86,120)0")
    for (const [gEl, q, base] of [[gAmt, '.hero-main .amount', 72], [gDate, '.dpanel .dp-v', 72], [gDays, '.dpanel .dp-h', 60]]) {
      const src = vc.q(q), cs = getComputedStyle(src), fs = parseFloat(cs.fontSize);
      gEl.textContent = src.textContent.trim();
      Object.assign(gEl.style, {
        fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, fontSize: `${base}px`, fontVariantNumeric: cs.fontVariantNumeric,
        lineHeight: cs.lineHeight === 'normal' ? 'normal' : `${parseFloat(cs.lineHeight) / fs}`,
        letterSpacing: cs.letterSpacing === 'normal' ? 'normal' : `${parseFloat(cs.letterSpacing) / fs}em`,
      });
    }
    // the board's widths, proven (prompt › Direction): every centred row ≤ 674 px at rest
    for (const [n, r] of [['amount', rowA], ['date', rowB], ['days', rowD]]) if (r.width > 674) throw new Error(`board row ${n} is ${r.width} px`);
    if (rowA.width !== 640) throw new Error(`amount row ${rowA.width} px, expected 640`);
    // the picture in the bubble: cover-fit, top-aligned
    { const { w, h } = tile.size(); const s = Math.max(306 / w, 300 / h); tile.host.style.transformOrigin = '0 0'; tile.host.style.transform = `translate(${(306 - w * s) / 2}px, 0) scale(${s})`; }
    stage.style.visibility = 'visible';
    const EXPECT = ['₹4,86,120.00', '26-08-2026', '3 दिन बाक़ी हैं', '₹25,00,000.00', '₹18,42,650.00', '₹6,57,350.00', '74% इस्तेमाल हो चुकी है', 'इस समय तक का हिसाब'];
    K.card.assertClean(vc, EXPECT);
    eq2.querySelector('.u').style.width = `${eq2.querySelector('.a').offsetWidth}px`;   // the answer's gold is the answer's width
    K.card.assertClean(tile, EXPECT);
    { const r = EC.rule.getBoundingClientRect(); G.rule = { x: r.left, y: r.top, w: r.width, h: r.height }; }
    G.tileA = [0, 0, 1080, 1920]; G.tapA = [AX, 960]; G.flipA = { x: W / 2, y: 300, s: 0.1, ax: AX, ay: 960 };
    G.C = cams();
    seek(7.4);
    {
      const tr = bub.tile.getBoundingClientRect();
      G.tileA = [tr.left, tr.top, tr.right, tr.bottom];
      G.tapA = [tr.left + tr.width / 2, tr.top + tr.height / 2];
    }
    // the card framed exactly as the bubble shows it (cover-fit, top-aligned): the FLIP's start and end
    { const sz = vc.size(); const fit = Math.max(306 / sz.w, 300 / sz.h); const k = (G.tileA[2] - G.tileA[0]) / 306;
      G.flipA = { x: W / 2, y: (300 / fit) / 2, s: fit * k, ax: (G.tileA[0] + G.tileA[2]) / 2, ay: (G.tileA[1] + G.tileA[3]) / 2 }; }
    seek(0);
    return true;
  })();

  window.SCENE = {
    bpm: 120, duration: D, seek,
    hits: [HIT1, HIT2, HIT3],
    hero: [0, at(4, 4), at(5, 4), at(8, 3) + 0.2, at(10, 2), at(13, 1), 29.0],
    safeSel: ['.fl .h.t .g', '.eq', '.ghost'],
    wordSel: ['.fl.word'],
  };
})();
