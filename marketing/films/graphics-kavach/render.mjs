/**
 * Renders the Kavach film's panels — one HTML file per panel in panels/ —
 * into clips, frame by frame, exactly as long as the plan needs them.
 *
 *   node films/graphics-kavach/render.mjs            # everything missing or changed
 *   ONLY=D03,I07 node films/graphics-kavach/render.mjs
 *   node films/graphics-kavach/render.mjs --stills   # one frame per panel at 70% of
 *                                                    # its clock, for a contact sheet
 *
 * Same method as films/graphics/render.mjs: every CSS animation is paused and
 * seeked to the frame's instant, so a clip is exact and repeatable. The
 * difference is the clock: a panel sets its own --T (a ten-second sheet needs
 * a ten-second clock), and its length is read from films/kavach.plan.json and
 * films/kavach-short.plan.json — the longest time any line holds it, plus a margin.
 *
 * A clip is re-rendered only when its HTML (or the kit) is newer than it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const HERE = path.resolve(import.meta.dirname);
const FILMS = path.resolve(HERE, '..');
const PANELS = path.join(HERE, 'panels');
const OUT = path.join(HERE, 'clips');
const STILLS = path.join(HERE, 'stills');
const FPS = 24;
const MARGIN = 0.4;
const PAGES = 3;
/* one browser's own process encodes every screenshot, and at four pages it
   was the bottleneck (one core pegged, the rest idle) — so three browsers of
   three pages each. Frames are JPEG at q94: a PNG of a 1080x1920 page takes
   several times longer to encode, and x264 at crf 16 cannot tell the two apart */
const BROWSERS = 3;
/* each run keeps its frames in its own folder: a second run (ONLY=… while
   the full render is going) used to delete the first run's frames when it
   finished, and the first run's ffmpeg then failed on an empty folder */
const FRAMES = path.join(HERE, `.frames-${process.pid}`);

const ff = (a) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a], { stdio: 'pipe' });

/* Both films draw on these panels: the long film (kavach.plan.json) and the
   short (kavach-short.plan.json, same structure, whose own cards are QC1…QE1).
   A panel is rendered as long as the longest hold either film asks of it. */
const PLANS = ['kavach.plan.json', 'kavach-short.plan.json'];

function need() {
  const len = new Map();
  for (const name of PLANS) {
    const planFile = path.join(FILMS, name);
    if (!existsSync(planFile)) continue;
    const plan = JSON.parse(readFileSync(planFile, 'utf8'));
    for (const b of Object.values(plan.beats)) {
      for (const s of b.segments) {
        if (!/^[DPIQ]/.test(s.asset)) continue;
        /* a card that starts at the end of one line and runs on into the next
           (I95a, QC1) is two segments with from/to; it is rendered to the furthest `to` */
        len.set(s.asset, Math.max(len.get(s.asset) ?? 0, s.to ?? s.seconds));
      }
    }
  }
  return len;
}

/* A value only the founder can give (the toll-free number) sits in the plan as
   a placeholder. It must never reach a frame, so any panel whose plan content
   or HTML still carries it is refused, and the run ends non-zero. */
const PLACEHOLDER = 'FOUNDER TO SUPPLY';
function placeholders() {
  const hits = new Set();
  const planFile = path.join(FILMS, 'kavach.plan.json');
  if (existsSync(planFile)) {
    const { assets = {} } = JSON.parse(readFileSync(planFile, 'utf8'));
    for (const [id, a] of Object.entries(assets)) {
      if (JSON.stringify(a.content ?? {}).includes(PLACEHOLDER)) hits.add(id);
    }
  }
  for (const f of readdirSync(PANELS).filter((n) => n.endsWith('.html'))) {
    if (readFileSync(path.join(PANELS, f), 'utf8').includes(PLACEHOLDER)) hits.add(f.slice(0, -5));
  }
  return hits;
}

async function renderOne(page, id, seconds, stillsOnly) {
  const file = path.join(PANELS, `${id}.html`);
  await page.goto(`file://${file}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const T = await page.evaluate(() => {
    const el = document.querySelector('.panel');
    const v = getComputedStyle(el).getPropertyValue('--T').trim() || '8s';
    return parseFloat(v) * (v.endsWith('ms') ? 1 : 1000);
  });
  const el = page.locator('.panel').first();
  const seek = (ms) => page.evaluate((m) => {
    for (const a of document.getAnimations()) { try { a.currentTime = m; } catch {} }
  }, ms);

  if (stillsOnly) {
    await seek(Math.min(seconds * 1000 * 0.7, T - 1));
    await el.screenshot({ path: path.join(STILLS, `${id}.jpg`), type: 'jpeg', quality: 80 });
    return;
  }
  const dur = seconds + MARGIN;
  const n = Math.ceil(dur * FPS);
  const dir = path.join(FRAMES, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const clip = await el.boundingBox();
  for (let i = 0; i < n; i++) {
    await seek(Math.min((i / FPS) * 1000, T - 1));
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 94, clip });
  }
  ff(['-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      path.join(OUT, `${id}.mp4`)]);
  rmSync(dir, { recursive: true, force: true });
  console.log(`  + ${id.padEnd(5)} ${dur.toFixed(2)}s  ${n} frames`);
}

async function main() {
  const stillsOnly = process.argv.includes('--stills');
  const only = (process.env.ONLY || '').split(',').filter(Boolean);
  const len = need();
  const kitTime = Math.max(...['kit-base.css', 'kit-doc.css', 'kit.js'].map((f) => statSync(path.join(HERE, f)).mtimeMs));
  const files = readdirSync(PANELS).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
  const blocked = placeholders();
  const jobs = files.filter((id) => {
    if (blocked.has(id)) return false;
    if (only.length) return only.includes(id);
    if (!len.has(id)) { console.log(`  · ${id} is not used by the plan — skipped`); return false; }
    if (stillsOnly) return true;
    const out = path.join(OUT, `${id}.mp4`);
    if (!existsSync(out)) return true;
    const t = statSync(out).mtimeMs;
    return t < statSync(path.join(PANELS, `${id}.html`)).mtimeMs || t < kitTime;
  });
  const missing = [...len.keys()].filter((id) => !files.includes(id));
  if (missing.length) console.log(`  ! no panel yet for: ${missing.join(', ')}`);
  mkdirSync(stillsOnly ? STILLS : OUT, { recursive: true });

  /* Playwright's bundled browser is not installed on this machine; the
     installed Chrome renders identically and needs no download. */
  const launch = () => chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
  const browsers = await Promise.all(Array.from({ length: BROWSERS }, launch));
  let next = 0;
  await Promise.all(browsers.flatMap((browser) => Array.from({ length: PAGES }, async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    while (next < jobs.length) {
      const id = jobs[next++];
      try { await renderOne(page, id, len.get(id) ?? 6, stillsOnly); }
      catch (e) { console.log(`  ! ${id}: ${e.message.split('\n')[0]}`); }
    }
  })));
  await Promise.all(browsers.map((b) => b.close()));
  rmSync(FRAMES, { recursive: true, force: true });
  console.log(`\n  ${jobs.length} panel(s) → films/graphics-kavach/${stillsOnly ? 'stills' : 'clips'}/\n`);
  if (blocked.size) {
    console.log(`  ! REFUSED ${[...blocked].join(', ')}: still carries "${PLACEHOLDER}" — the founder has to supply it first\n`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
