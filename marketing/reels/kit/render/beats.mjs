/**
 * QA gate 1 stills (DIRECTION §10.5): one still per beat at beat + 0.40 s (the
 * settled frame), plus beat + 0.05 s on the hit beats, safe-zone overlay on.
 * Lays them out as four sheets of fifteen (5×3, ~400×711 per tile) and a 60-up
 * deliverable sheet. Also times the heaviest frame (decides 60×3 vs 30×4).
 *
 *   node marketing/reels/kit/render/beats.mjs marketing/reels/01-dsr --tag v1 [--hits 7,22,26.5] [--at 4.2,9.6]
 *
 * Writes out/stills-<tag>/b<NN>.jpg, sheet-1..4.jpg, sheet-60.jpg and
 * hero-*.jpg (full size) for --hero times.
 */
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { reelDir, opt, launch, openReel, shoot } from './common.mjs';

const dir = reelDir(process.argv[2]);
const TAG = opt('tag', 'v1');
const SAFE = !process.argv.includes('--nosafe');
const out = path.join(dir, 'out', `stills-${TAG}`);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const browser = await launch();
const page = await openReel(browser, dir, { safe: SAFE });
const cdp = await page.context().newCDPSession(page);
const { bpm, duration, hits = [], hero = [] } = await page.evaluate(() => ({
  bpm: window.SCENE.bpm, duration: window.SCENE.duration, hits: window.SCENE.hits || [], hero: window.SCENE.hero || [],
}));
const beat = 60 / bpm;
const n = Math.round(duration / beat);
const extraAt = String(opt('at', '')).split(',').filter(Boolean).map(Number);

const label = (t) => t.toFixed(2).padStart(5, '0');
let heaviest = { t: 0, ms: 0 };
const files = [];
for (let i = 0; i < n; i++) {
  const t = i * beat + 0.4;
  const s0 = Date.now();
  const buf = await shoot(page, cdp, t, 88);
  const ms = Date.now() - s0;
  if (ms > heaviest.ms) heaviest = { t, ms };
  const f = path.join(out, `b${String(i + 1).padStart(2, '0')}-${label(t)}.jpg`);
  writeFileSync(f, buf);
  files.push(f);
}
for (const t of [...hits.map((h) => h + 0.05), ...extraAt]) {
  writeFileSync(path.join(out, `x-${label(t)}.jpg`), await shoot(page, cdp, t, 88));
}
// Hero frames at full size, overlay off.
const page2 = await openReel(browser, dir, { safe: false });
const cdp2 = await page2.context().newCDPSession(page2);
for (const t of hero) writeFileSync(path.join(out, `hero-${label(t)}.jpg`), await shoot(page2, cdp2, t, 92));
await browser.close();

// A real font file for the labels: ImageMagick without fontconfig fails on the default.
const LABEL_FONT = ['/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].find((f) => existsSync(f));
const montage = (list, tile, cols, dest, pt = 22) => execFileSync('magick', ['montage', ...list,
  '-tile', `${cols}x`, '-geometry', `${tile}+10+14`, '-background', '#222', '-fill', '#eee', '-pointsize', String(pt),
  ...(LABEL_FONT ? ['-font', LABEL_FONT, '-set', 'label', '%t'] : []), dest]);
for (let s = 0; s < Math.ceil(files.length / 15); s++) {
  montage(files.slice(s * 15, s * 15 + 15), '400x711', 5, path.join(out, `sheet-${s + 1}.jpg`));
}
montage(files, '180x320', 10, path.join(out, 'sheet-60.jpg'), 14);
console.log(`→ ${path.relative(process.cwd(), out)}: ${files.length} beat stills, ${hits.length} hit stills, ${hero.length} hero frames`);
console.log(`  heaviest frame: t=${heaviest.t.toFixed(2)} s, ${heaviest.ms} ms → final render ${heaviest.ms < 150 ? '60 fps × 3' : '30 fps × 4'}`);
