import path from 'node:path';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

import { DECLARED } from '../src/beats/catalog';
import { videoTutorial } from '../src/beats/project';

/**
 * Renders every video that is described as data, bundling ONCE.
 *
 *   npm run render:declared
 *   npm run render:declared -- --only gen-dod-clock,gen-water-dip
 *
 * `npm run render` exists and renders everything, which at sixty-six videos is
 * most of an hour spent re-exporting files that have not changed. This renders
 * only the declared ones.
 *
 * The single bundle is the point. Calling `npx remotion render` once per
 * composition re-bundles the whole project every time — about twenty seconds
 * each, so fifty-two of them is seventeen minutes of doing the same work over
 * and over before any frame is drawn. `render-all.mts` already knew this; this
 * is the same trick applied to a subset.
 */

const onlyArg = process.argv.indexOf('--only');
const ONLY =
  onlyArg > -1 && process.argv[onlyArg + 1]
    ? new Set(process.argv[onlyArg + 1].split(',').map((s) => s.trim()))
    : null;

async function main() {
  const jobs = DECLARED.filter((v) => !ONLY || ONLY.has(v.id)).flatMap((v) =>
    (v.family === 'social' ? (['hi', 'en'] as const) : (['hi'] as const)).map((lang) => {
      const t = videoTutorial(v, lang);
      return { compositionId: t.compositionId, id: t.id };
    }),
  );

  if (!jobs.length) throw new Error('Nothing to render — check --only.');

  console.log(`Bundling once for ${jobs.length} compositions…`);
  const serveUrl = await bundle({ entryPoint: path.resolve(process.cwd(), 'src/index.ts') });

  const started = Date.now();
  let done = 0;
  for (const j of jobs) {
    const outputLocation = path.resolve(process.cwd(), 'out', `${j.id}.mp4`);
    const composition = await selectComposition({ serveUrl, id: j.compositionId, inputProps: {} });
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps: {},
      onProgress: ({ progress }) => {
        process.stdout.write(`\r  ${j.id} ${Math.round(progress * 100)}%      `);
      },
    });
    done += 1;
    const mins = (Date.now() - started) / 60000;
    process.stdout.write(
      `\r  ${String(done).padStart(2)}/${jobs.length}  ${j.id.padEnd(30)} ` +
        `${mins.toFixed(1)} min elapsed\n`,
    );
  }
  console.log(`\nRendered ${done} videos in ${((Date.now() - started) / 60000).toFixed(1)} min.`);
}

await main();
