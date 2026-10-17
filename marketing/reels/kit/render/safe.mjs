/**
 * The safe-box test by measurement (DIRECTION §5.3): walks every visible text
 * box of the reel's own type every 0.1 s and lists each one that leaves the
 * hard-safe box (x 72–888, y 288–1248).
 *
 *   node marketing/reels/kit/render/safe.mjs marketing/reels/01-dsr [--step 0.1]
 *
 * Checks `.rt` and `.ec-c` lines plus whatever the scene adds in
 * window.SCENE.safeSel (its focal numbers). Edges: L R T B. A word caught
 * once or twice is usually mid-entry or mid-exit; a run of hits at rest is a
 * fault. Exits non-zero if any box is out for 0.5 s or more.
 */
import { reelDir, opt, launch, openReel } from './common.mjs';

const dir = reelDir(process.argv[2]);
const STEP = opt('step', 0.1);
const browser = await launch();
const page = await openReel(browser, dir);
const hits = await page.evaluate((step) => {
  const BOX = { l: 72, r: 888, t: 288, b: 1248 };
  const sel = ['.rt', '.ec-c', ...(window.SCENE.safeSel || [])].join(', ');
  const visible = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const c = getComputedStyle(e);
      if (c.visibility === 'hidden' || c.display === 'none' || parseFloat(c.opacity) < 0.5) return false;
    }
    return true;
  };
  const out = {};
  for (let t = 0; t < window.SCENE.duration - 1e-3; t += step) {
    window.SCENE.seek(t);
    for (const host of document.querySelectorAll(sel)) {
      const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) {
        const s = n.textContent.trim();
        if (!s || !visible(n.parentElement)) continue;
        // a text box carries empty space above the tallest matra and below the descenders: trim 0.1 em off
        // each so the test is about ink (the clock's box sat at y 279 with its digits' tops at ~308)
        const inset = 0.1 * parseFloat(getComputedStyle(n.parentElement).fontSize);
        const rg = document.createRange();
        rg.selectNodeContents(n);
        for (const r0 of rg.getClientRects()) {
          const r = { left: r0.left, right: r0.right, width: r0.width, top: r0.top + inset, bottom: r0.bottom - inset };
          if (r.width < 1 || r.right < 0 || r.left > 1080 || r.bottom < 0 || r.top > 1920) continue;   // off-frame, in flight
          const bad = [];
          if (r.left < BOX.l - 1) bad.push(`L${Math.round(r.left)}`);
          if (r.right > BOX.r + 1) bad.push(`R${Math.round(r.right)}`);
          if (r.top < BOX.t - 1) bad.push(`T${Math.round(r.top)}`);
          if (r.bottom > BOX.b + 1) bad.push(`B${Math.round(r.bottom)}`);
          if (bad.length) (out[`${s.slice(0, 24)} ${bad.map((x) => x[0]).join('')}`] ||= []).push(`${t.toFixed(1)}:${bad.join('/')}`);
        }
      }
    }
  }
  return out;
}, STEP);
await browser.close();
let fail = false;
for (const [k, v] of Object.entries(hits)) {
  const long = v.length * STEP >= 0.5 - 1e-9;
  if (long) fail = true;
  console.log(`${long ? '✗' : '·'} ${k.padEnd(32)} ${String(v.length).padStart(3)} × ${v[0]} … ${v[v.length - 1]}`);
}
console.log(fail ? 'SAFE BOX FAILED: a line sits outside the hard-safe box at rest.' : 'Safe box passed (only words in motion touch the edge).');
if (fail) process.exitCode = 1;
