import path from 'node:path';
import { mkdir } from 'node:fs/promises';

import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

/**
 * Renders one still per scene of a composition, bundling ONCE.
 *
 *   npm run stills -- MarketingHi
 *   npm run stills -- MarketingEn out/en-stills
 *
 * Why this exists: `npx remotion still` re-bundles on every invocation, so
 * checking a fifteen-scene film costs fifteen bundles. Bundling once and looping
 * turns a ten-minute check into a one-minute one, which is the difference
 * between iterating on the artwork and not bothering.
 *
 * Frames are picked at 45% into each scene rather than at its start, so a still
 * shows the scene after its entrance animation has settled — the state a viewer
 * actually spends the scene looking at.
 */

const compositionId = process.argv[2] ?? 'MarketingHi';
const outDir = path.resolve(process.cwd(), process.argv[3] ?? `out/stills-${compositionId}`);

async function main() {
  await mkdir(outDir, { recursive: true });

  console.log('Bundling…');
  const serveUrl = await bundle({ entryPoint: path.resolve(process.cwd(), 'src/index.ts') });

  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps: {} });
  const sceneFrames = (composition.props as { sceneFrames?: number[] }).sceneFrames ?? [];

  if (sceneFrames.length === 0) {
    throw new Error(
      `${compositionId} reported no sceneFrames. calculateMetadata must run before ` +
        'this script can know where the scenes begin.',
    );
  }

  console.log(
    `${compositionId}: ${sceneFrames.length} scenes, ` +
      `${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)\n`,
  );

  let offset = 0;
  for (let i = 0; i < sceneFrames.length; i++) {
    const frame = Math.min(
      composition.durationInFrames - 1,
      offset + Math.round(sceneFrames[i] * 0.45),
    );
    const output = path.join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
    process.stdout.write(`  ${String(i + 1).padStart(2, '0')} · frame ${frame} … `);
    await renderStill({ composition, serveUrl, output, frame, overwrite: true });
    console.log('ok');
    offset += sceneFrames[i];
  }

  console.log(`\nDone. ${sceneFrames.length} stills in ${path.relative(process.cwd(), outDir)}/`);
}

await main();
