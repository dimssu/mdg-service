/**
 * Two rules the eye misses on a contact sheet, measured (DIRECTION §5.2, §6):
 * the longest stretch the frame holds still before the end card, and the most
 * Hindi words of the reel's own type on screen at once.
 *
 *   node marketing/reels/kit/render/motion.mjs marketing/reels/02-stock-check [--step 0.1] [--fuzz 4] [--px 2000] [--end 27.4]
 *
 * "Still" = fewer than --px pixels change (at --fuzz % tolerance) between frames
 * --step apart. Words count every visible run in `.rt` plus SCENE.wordSel (e.g.
 * the instrument's labels). Fails on a still run ≥ 0.5 s before --end, or > 7 words.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { reelDir, opt, launch, openReel, shoot } from './common.mjs';

const dir = reelDir(process.argv[2]);
const STEP = opt('step', 0.1), FUZZ = opt('fuzz', 4), PX = opt('px', 2000), END = opt('end', 27.4);
const tmp = path.join(dir, 'out', `.motion-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const browser = await launch();
const page = await openReel(browser, dir);
const cdp = await page.context().newCDPSession(page);
const D = await page.evaluate(() => window.SCENE.duration);
let prev = null, run = 0, worst = { s: 0, t: 0 }, most = { n: 0, t: 0 };
const over = [], stills = [];
for (let i = 0; i * STEP < D - 1e-3; i++) {
  const t = +(i * STEP).toFixed(3);
  const f = path.join(tmp, `f${i}.jpg`);
  writeFileSync(f, await shoot(page, cdp, t, 80));
  const n = await page.evaluate(() => {
    const sel = ['.rt', ...(window.SCENE.wordSel || [])].join(', ');
    const vis = (e) => { for (; e && e !== document.body; e = e.parentElement) { const c = getComputedStyle(e); if (c.visibility === 'hidden' || c.display === 'none' || parseFloat(c.opacity) < 0.5) return false; } return true; };
    let k = 0;
    for (const host of document.querySelectorAll(sel)) {
      const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let x; (x = w.nextNode());) if (vis(x.parentElement)) k += x.textContent.split(/\s+/).filter((s) => /[ऀ-ॿ]/.test(s)).length;
    }
    return k;
  });
  if (n > most.n) most = { n, t };
  if (n > 7) over.push(`${t}:${n}`);
  if (prev) {
    const ae = parseFloat(execFileSync('bash', ['-c', `magick compare -metric AE -fuzz ${FUZZ}% "${prev}" "${f}" null: 2>&1 || true`]).toString());
    if (ae < PX && t < END) { run += STEP; if (run > worst.s) worst = { s: run, t }; } else run = 0;
  }
  prev = f;
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
console.log(`longest still run before ${END} s: ${worst.s.toFixed(1)} s (ending ${worst.t} s) · most Hindi words at once: ${most.n} (at ${most.t} s)`);
if (over.length) console.log(`over the 7-word cap: ${over.join(' ')}`);
const fail = worst.s >= 0.5 - 1e-9 || over.length;
console.log(fail ? 'MOTION/WORDS FAILED' : 'Motion and word cap passed.');
if (fail) process.exitCode = 1;
