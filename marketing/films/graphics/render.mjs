/**
 * Turns the panels in graphics.html into clips.
 *
 *   node films/graphics/render.mjs
 *
 * ── WHY FRAME-BY-FRAME AND NOT A SCREEN RECORDING ──────────────────────────
 * Playwright can record a page to video, but it records wall-clock: whatever
 * the compositor managed to paint. A dropped frame becomes a stutter you cannot
 * fix afterwards. Instead each panel's CSS animations are PAUSED and the
 * renderer seeks the timeline itself — 1/24th of a second at a time — and takes
 * a screenshot at each stop. Every frame is therefore exactly where it should
 * be, and the same run twice produces the same clip.
 *
 * ── LENGTH COMES FROM THE VOICE, AS EVERYWHERE ELSE ────────────────────────
 * A graphic is rendered to the longest slot it has to cover across both films,
 * read from the measured voice and the edit maps, plus a little margin. Nothing
 * here guesses at a duration.
 *
 * Devanagari is rendered by Chromium, which is the whole point of doing this in
 * a browser: ffmpeg's text filter cannot form conjuncts and would break every
 * Hindi word on these cards.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const HERE = path.resolve(import.meta.dirname);
const ROOT = path.resolve(HERE, '..', '..');
const FILMS = path.join(ROOT, 'films');
const OUT = path.join(HERE, 'clips');
const FRAMES = path.join(HERE, '.frames');

const FPS = 24;
const GAP = 0.35;
const MARGIN = 0.4;          // a little tail so a trim never lands on the last frame
const TIMELINE = 8000;       // every animation in graphics.html runs on this clock

const ff = (a) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a], { stdio: 'pipe' });

/** How long each graphic has to be on screen, from the measured voice. */
function wanted() {
  const need = new Map();
  for (const slug of ['teaser', 'explainer']) {
    const { beats } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.json`), 'utf8'));
    const { map } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.edit.json`), 'utf8'));
    const voice = JSON.parse(readFileSync(path.join(ROOT, `voice-${slug}`, 'voice.json'), 'utf8'));
    for (const b of beats) {
      const refs = [].concat(map[b.id] ?? []);
      const slot = (voice[b.id].seconds + GAP) / refs.length;
      for (const r of refs) {
        if (!r.startsWith('gfx:')) continue;
        const id = r.slice(4);
        need.set(id, Math.max(need.get(id) ?? 0, slot));
      }
    }
  }
  return need;
}

async function main() {
  const need = wanted();
  /* ONLY=G-qa,G-onlyjob re-renders just those panels — the full set is eleven
     minutes and most edits touch two or three. */
  const only = (process.env.ONLY || '').split(',').filter(Boolean);
  if (only.length) for (const k of [...need.keys()]) if (!only.includes(k)) need.delete(k);
  if (!need.size) throw new Error('no gfx: references in either edit map');
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.goto(`file://${path.join(HERE, 'graphics.html')}`);
  await page.waitForLoadState('networkidle');
  /* Webfonts must be in before a single frame is taken, or the first frames
     render in a fallback face and the type visibly jumps mid-clip. */
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  console.log(`\n  ${need.size} graphics\n`);

  for (const [id, seconds] of [...need].sort()) {
    const el = page.locator(`#${id}`);
    if (!(await el.count())) {
      console.log(`  ! ${id} — no panel with that id in graphics.html`);
      continue;
    }
    const dur = seconds + MARGIN;
    const n = Math.ceil(dur * FPS);
    const dir = path.join(FRAMES, id);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });

    await el.scrollIntoViewIfNeeded();
    for (let i = 0; i < n; i++) {
      const t = (i / FPS) * 1000;
      /* Seek every animation on the page to the same instant. They all share
         the eight-second clock, so one number positions the whole panel. */
      await page.evaluate((ms) => {
        for (const a of document.getAnimations()) {
          try { a.currentTime = ms; } catch { /* a finished animation refuses */ }
        }
      }, Math.min(t, TIMELINE - 1));
      await el.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) });
    }

    const out = path.join(OUT, `${id}.mp4`);
    ff(['-framerate', String(FPS), '-i', path.join(dir, 'f%04d.png'),
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
        '-pix_fmt', 'yuv420p', '-r', String(FPS), out]);
    rmSync(dir, { recursive: true, force: true });
    console.log(`  + ${id.padEnd(14)} ${dur.toFixed(2)}s  ${n} frames`);
  }

  await browser.close();
  rmSync(FRAMES, { recursive: true, force: true });
  console.log(`\n  → marketing/films/graphics/clips/\n`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
