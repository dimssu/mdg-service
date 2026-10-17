/**
 * Quick look while building: a few frames at chosen times.
 *
 *   node marketing/reels/kit/render/still.mjs marketing/reels/01-dsr 0 7.4 13.05 [--safe] [--scale 0.5]
 *
 * Writes out/look/t<time>.jpg (half size by default, so a contact read is cheap).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { reelDir, launch, openReel, flag, opt } from './common.mjs';

const dir = reelDir(process.argv[2]);
// times are the bare numbers — not the value that follows an --option
const argv = process.argv.slice(3);
const times = argv.filter((a, i) => /^\d/.test(a) && !(i > 0 && argv[i - 1].startsWith('--'))).map(Number);
const scale = opt('scale', 0.5);
const out = path.join(dir, 'out', 'look');
mkdirSync(out, { recursive: true });
const browser = await launch();
const page = await openReel(browser, dir, { safe: flag('safe') });
for (const t of times) {
  await page.evaluate((tt) => window.SCENE.seek(tt), t);
  const buf = await page.screenshot({ type: 'jpeg', quality: 85, scale: 'css', clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  const f = path.join(out, `t${t.toFixed(2).padStart(5, '0')}.jpg`);
  if (scale !== 1) {
    writeFileSync(f + '.tmp.jpg', buf);
    const { execFileSync } = await import('node:child_process');
    execFileSync('magick', [f + '.tmp.jpg', '-resize', `${Math.round(scale * 100)}%`, f]);
    (await import('node:fs')).unlinkSync(f + '.tmp.jpg');
  } else writeFileSync(f, buf);
  console.log(`→ ${path.relative(process.cwd(), f)}`);
}
await browser.close();
