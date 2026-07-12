import path from 'node:path';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

import { TUTORIALS } from '../src/narration';

/**
 * Renders every tutorial to out/<id>.mp4. Each composition sizes itself to its
 * generated voiceover (run `npm run voice` first for real narration; otherwise
 * the estimated timings are used). First run downloads a headless browser.
 */
async function main() {
  const entryPoint = path.resolve(process.cwd(), 'src/index.ts');
  console.log('Bundling…');
  const serveUrl = await bundle({ entryPoint });

  for (const t of TUTORIALS) {
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
