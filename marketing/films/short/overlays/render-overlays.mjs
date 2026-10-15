/**
 * The short's word overlays — big Hindi words in the upper third, laid over
 * live-action shots by the edit. One 1080x1920 PNG per overlay, transparent
 * everywhere except the words, their shadow and a soft dark wash behind them.
 *
 *   node films/short/overlays/render-overlays.mjs          # all of them
 *   ONLY=O1,O8 node films/short/overlays/render-overlays.mjs
 *
 * The words and their times come from films/short/cut-sheet.json, so an edit
 * there is picked up by re-running this. Writes O1.png … O11.png and
 * overlays.json (file, t0, t1, words, and where the block sits) next to itself.
 *
 * LOOK — the cards' own type and colours: Tiro Devanagari Hindi, cream
 * (#FFF3E2, the ink panels' caption colour) and gold (#E9A23B, the amber).
 * Over footage that can be a sunlit forecourt or a night room, the type
 * carries a soft dark shadow, and the block sits on a dark radial wash that
 * fades to nothing at its own edges — never a box. Tiro has one weight, so
 * the big lines get a hairline stroke in their own colour to hold up on a phone.
 * Tiro sets the danda (।) a full space clear of its word; it is pulled back.
 *
 * PLACE — the block is centred at y 400 (higher for O5 and O6, see CENTRE), inside the upper third (0–640). The
 * bottom 30% (from y 1344) stays empty: the website puts its captions and a
 * sound button there. The script refuses to write an overlay that reaches it.
 *
 * Hindi lines are never cut or drawn on here; each PNG is a whole, still
 * block of words, and the edit only cuts it in and out.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const HERE = path.resolve(import.meta.dirname);
const SHEET = path.join(HERE, '..', 'cut-sheet.json');
const W = 1080, H = 1920;
const CREAM = '#FFF3E2', GOLD = '#E9A23B';
const BIG = 124;          // the size a big line is set at when it fits
const SMALL = 68;         // O1's lead-in
const MAXW = 940;         // 70 px clear at each side
const MIN_ONE_LINE = 104; // below this a single long line is broken in two instead of shrunk
const CENTRE_Y = 400;     // middle of the block
/* two shots put his head where the words would go — S59 (hands at his temples,
   head top at y≈290 through 3.40–4.63) and S66 (head down at the table, head top
   at y≈320 through 5.80–7.02) — so those two blocks sit higher, clear of it */
const CENTRE = { O5: 190, O6: 205 };
const FLOOR = Math.round(H * 0.70); // nothing below this line

/* which lines are gold; everything else is big and cream */
const LOOK = {
  O1: [{ small: true, color: GOLD }, {}, {}],
  O11: [{ color: GOLD }],
};

const PAGE = `<!doctype html><html lang="hi"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;background:transparent}
  #f{position:relative;width:${W}px;height:${H}px;overflow:hidden}
  #scrim{position:absolute;pointer-events:none;
    background:radial-gradient(closest-side, rgba(14,6,3,.56) 0%, rgba(14,6,3,.48) 40%, rgba(14,6,3,.24) 70%, rgba(14,6,3,0) 100%)}
  #blk{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;text-align:center}
  .ln{font-family:'Tiro Devanagari Hindi','Kohinoor Devanagari',serif;letter-spacing:0;white-space:nowrap;line-height:1.3;
    text-shadow:0 0 5px rgba(10,4,2,.50),0 2px 2px rgba(10,4,2,.60),0 4px 14px rgba(10,4,2,.55),0 0 38px rgba(10,4,2,.40)}
  /* Tiro sets the danda well clear of its word; pull it back so 'पर।' does not read as 'पर ।' */
  .dnd{margin-left:-.13em}
  .ln.big{-webkit-text-stroke:1.4px currentColor;paint-order:stroke fill}
  .ln.small{line-height:1.25;margin-bottom:4px}
</style></head><body><div id="f"><div id="scrim"></div><div id="blk"></div></div></body></html>`;

/* runs in the page: set the words, size them, centre the block, fit the wash */
function lay({ lines, BIG, SMALL, MAXW, MIN_ONE_LINE, CENTRE_Y }) {
  const blk = document.getElementById('blk'), scrim = document.getElementById('scrim');
  blk.innerHTML = '';
  const make = (text, l, size) => {
    const d = document.createElement('div');
    d.className = 'ln ' + (l.small ? 'small' : 'big');
    for (const [i, part] of text.split('।').entries()) {
      if (i) { const s = document.createElement('span'); s.className = 'dnd'; s.textContent = '।'; d.appendChild(s); }
      d.appendChild(document.createTextNode(part));
    }
    d.style.color = l.color; d.style.fontSize = size + 'px';
    blk.appendChild(d); return d;
  };
  const widthAt = (text, size) => {
    const d = make(text, { color: '#fff' }, size), w = d.scrollWidth; d.remove(); return w;
  };
  let rows = lines.map((l) => ({ ...l }));
  const bigs = rows.filter((r) => !r.small);
  /* one long line: break it at the space nearest its middle rather than shrink it */
  if (bigs.length === 1 && rows.length === 1 && BIG * MAXW / widthAt(bigs[0].text, BIG) < MIN_ONE_LINE) {
    const words = bigs[0].text.split(' ');
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const d = Math.abs(widthAt(a, BIG) - widthAt(b, BIG));
      if (!best || d < best.d) best = { d, a, b };
    }
    rows = [{ ...bigs[0], text: best.a }, { ...bigs[0], text: best.b }];
  }
  /* every big line in a block is one size: the largest at which all fit */
  let size = BIG;
  for (const r of rows.filter((r) => !r.small)) size = Math.min(size, Math.floor(BIG * MAXW / widthAt(r.text, BIG)));
  for (const r of rows) make(r.text, r, r.small ? SMALL : size);
  const h = blk.offsetHeight;
  blk.style.top = Math.round(CENTRE_Y - h / 2) + 'px';
  /* the wash: the block's own box, grown well past it, fading to nothing at its edges */
  let L = 1e9, R = -1e9;
  for (const d of blk.children) { const r = d.getBoundingClientRect(); const x0 = (r.left + r.right) / 2 - d.scrollWidth / 2; L = Math.min(L, x0); R = Math.max(R, x0 + d.scrollWidth); }
  const top = CENTRE_Y - h / 2;
  const padX = 190, padY = 150;
  Object.assign(scrim.style, { left: (L - padX) + 'px', top: (top - padY) + 'px', width: (R - L + 2 * padX) + 'px', height: (h + 2 * padY) + 'px' });
  return { size, lines: rows.map((r) => r.text), box: [Math.round(L), Math.round(top), Math.round(R), Math.round(top + h)],
           wash: [Math.round(L - padX), Math.round(top - padY), Math.round(R + padX), Math.round(top + h + padY)] };
}

async function main() {
  const only = (process.env.ONLY || '').split(',').filter(Boolean);
  const sheet = JSON.parse(readFileSync(SHEET, 'utf8'));
  mkdirSync(HERE, { recursive: true });
  const launch = () => chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(PAGE, { waitUntil: 'networkidle' });
  /* make sure the Devanagari face itself is in, not a fallback */
  const ok = await page.evaluate(async () => {
    await document.fonts.load('100px "Tiro Devanagari Hindi"', 'मान लीजिए परछाई');
    await document.fonts.ready;
    return document.fonts.check('100px "Tiro Devanagari Hindi"', 'मान लीजिए परछाई');
  });
  if (!ok) throw new Error('Tiro Devanagari Hindi did not load — no network? Refusing to render with a fallback face.');

  const out = [];
  for (const o of sheet.overlays) {
    const look = LOOK[o.id] || [];
    const lines = o.text.map((text, i) => ({ text, color: CREAM, ...(look[i] || {}) }));
    const m = await page.evaluate(lay, { lines, BIG, SMALL, MAXW, MIN_ONE_LINE, CENTRE_Y: CENTRE[o.id] ?? CENTRE_Y });
    if (m.box[3] > FLOOR || m.wash[3] > FLOOR) throw new Error(`${o.id} reaches below y ${FLOOR}`);
    const file = `${o.id}.png`;
    if (!only.length || only.includes(o.id)) {
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#f').screenshot({ path: path.join(HERE, file), omitBackground: true });
      console.log(`  + ${file.padEnd(8)} ${String(o.t0).padStart(5)}–${String(o.t1).padEnd(5)} ${m.size}px  ${m.lines.join(' / ')}`);
    }
    out.push({ id: o.id, file, t0: o.t0, t1: o.t1, text: o.text, lines: m.lines,
      gold: lines.map((l) => l.color === GOLD), box: m.box });
  }
  await browser.close();
  writeFileSync(path.join(HERE, 'overlays.json'), JSON.stringify({
    note: "The short's word overlays (films/short/cut-sheet.json → overlays), one 1080x1920 transparent PNG each, made by render-overlays.mjs. t0/t1 are film seconds. 'box' is the words' block [x0,y0,x1,y1] in frame pixels; everything sits in the upper third and the bottom 30% (from y 1344) is empty for the website's captions and sound button. Lay each over its shot at full frame (overlay=0:0), cut in at t0 and out at t1.",
    size: [W, H],
    overlays: out,
  }, null, 1) + '\n');
  console.log(`\n  ${out.length} overlay(s) → films/short/overlays/  (+ overlays.json)\n`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
