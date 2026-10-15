/**
 * Screenshots each brand panel out of panels.html.
 *
 * The full-screen outro cards come out at film size; the phone cards come out
 * on a transparent background so they can sit over live footage. Devanagari is
 * rendered by a real browser here rather than by ffmpeg's text filter, which
 * cannot form conjuncts — the whole reason the captions were left off the first
 * cut.
 */
import { chromium } from 'playwright';
import path from 'node:path';

const here = path.resolve(import.meta.dirname);
const PANELS = ['outro-brand', 'outro-app', 'p-dsr', 'p-credit', 'p-supply', 'p-stock', 'p-dates'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 /* 2x, so a card downscales into frame crisp rather than being upscaled soft */ });
await page.goto('file://' + path.join(here, 'panels.html'));
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

for (const id of PANELS) {
  const el = await page.$('#' + id);
  await el.screenshot({ path: path.join(here, `${id}.png`), omitBackground: id.startsWith('p-') });
  console.log('  +', id);
}
await browser.close();
