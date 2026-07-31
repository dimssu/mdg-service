import path from 'node:path';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

import { TUTORIALS } from '../src/narration';

/**
 * Renders every tutorial to out/<id>.mp4. Each composition sizes itself to its
 * generated voiceover (run `npm run voice` first for real narration; otherwise
 * the estimated timings are used). First run downloads a headless browser.
 */
/**
 * Extra compositions that aren't 1:1 with a Tutorial.
 *
 * `CreditMonitorPhoto` used to live here — the marked-up-photo variant of the
 * credit-monitor explainer. It is retired, not deleted: its markup is measured
 * against a PHOTO of the old seven-row card, while the narration it shares now
 * describes the restructured card (hero / limit tiles / form-of-limit chips).
 * Rendering it would keep producing an artifact that contradicts its own
 * voiceover. Re-add it once `public/credit-card/*.jpg` is re-shot from the new
 * card and `ROW_BANDS` is re-measured.
 */
const EXTRA: { compositionId: string; id: string }[] = [];

async function main() {
  const entryPoint = path.resolve(process.cwd(), 'src/index.ts');
  console.log('Bundling…');
  const serveUrl = await bundle({ entryPoint });

  const jobs = [
    ...TUTORIALS.map((t) => ({ compositionId: t.compositionId, id: t.id })),
    ...EXTRA,
  ];

  for (const t of jobs) {
    const outputLocation = path.resolve(process.cwd(), 'out', `${t.id}.mp4`);
    console.log(`\nRendering ${t.compositionId} → out/${t.id}.mp4`);
    const composition = await selectComposition({
      serveUrl,
      id: t.compositionId,
      inputProps: {},
    });
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps: {},
      onProgress: ({ progress }) => {
        process.stdout.write(`\r  ${Math.round(progress * 100)}%   `);
      },
    });
    console.log('\r  done      ');
  }

  console.log('\nAll videos rendered to ./out');
}

await main();
