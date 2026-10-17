// Shared by the render scripts: open a reel page in Chrome and prove it is ready.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const REPO = path.resolve(import.meta.dirname, '../../../..');
const require = createRequire(path.join(REPO, 'package.json'));
export const { chromium } = require('playwright');

export function reelDir(arg) {
  if (!arg) throw new Error('usage: node marketing/reels/kit/render/<script>.mjs <reel folder> [options]');
  const dir = path.resolve(arg);
  if (!existsSync(path.join(dir, 'build', 'index.html'))) throw new Error(`${dir}/build/index.html not found`);
  return dir;
}

export function opt(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return dflt;
  const v = process.argv[i + 1];
  return typeof dflt === 'number' ? Number(v) : v;
}
export const flag = (name) => process.argv.includes(`--${name}`);

export async function launch() {
  return chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-gpu-vsync', '--force-color-profile=srgb', '--hide-scrollbars'] });
}

/** Open the reel at 1080×1920 and wait until fonts are proven and the scene has mounted. */
export async function openReel(browser, dir, { safe = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const url = pathToFileURL(path.join(dir, 'build', 'index.html')).href + (safe ? '?safe=1' : '');
  await page.goto(url, { waitUntil: 'load' });
  const ready = await page.evaluate(async () => {
    try { await window.READY; return { ok: true, d: window.SCENE.duration }; } catch (e) { return { ok: false, err: String(e && e.message || e) }; }
  });
  if (!ready.ok) throw new Error(`scene not ready: ${ready.err}\n${errors.join('\n')}`);
  if (errors.length) throw new Error(`page errors:\n${errors.join('\n')}`);
  await page.evaluate(() => window.SCENE.seek(0));
  return page;
}

/** Seek and capture one JPEG (CDP, fast path). */
export async function shoot(page, cdp, t, quality = 92) {
  await page.evaluate((tt) => window.SCENE.seek(tt), t);
  // An explicit clip: without it Chrome captures the window, which headless can make shorter than 1920.
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg', quality, optimizeForSpeed: true, captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 },
  });
  return Buffer.from(data, 'base64');
}
