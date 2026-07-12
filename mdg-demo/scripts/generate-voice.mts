import 'dotenv/config';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

import { audioPath } from '../src/lib/audio';
import { TUTORIALS } from '../src/narration';

/**
 * Generates the Hindi voiceover for every scene with ElevenLabs.
 *   npm run voice            # generate any missing clips
 *   npm run voice -- --force # re-generate everything
 *
 * Reads ELEVENLABS_* from `.env` (see .env.example). Each scene's `text` from
 * src/narration.ts is synthesised to public/audio/<tutorial>/<scene>.mp3.
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';
const FORCE = process.argv.includes('--force');

if (!API_KEY || !VOICE_ID) {
  console.error(
    '\n✗ Missing ElevenLabs config.\n' +
      '  1. cp .env.example .env\n' +
      '  2. set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID (a Hindi/Indian voice)\n' +
      '  3. npm run voice\n',
  );
  process.exit(1);
}

const KEY: string = API_KEY;
const VOICE: string = VOICE_ID;
const PUBLIC = path.resolve(process.cwd(), 'public');

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function synthesize(text: string): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=${OUTPUT_FORMAT}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': KEY,
      'Content-Type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  console.log(`Voice: ${VOICE}  ·  Model: ${MODEL_ID}  ·  Format: ${OUTPUT_FORMAT}\n`);
  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (const tutorial of TUTORIALS) {
    console.log(`\n── ${tutorial.id} (${tutorial.scenes.length} scenes) ──`);
    await mkdir(path.join(PUBLIC, 'audio', tutorial.id), { recursive: true });

    for (const scene of tutorial.scenes) {
      const rel = audioPath(tutorial.id, scene.id);
      const abs = path.join(PUBLIC, rel);
      if (!FORCE && (await exists(abs))) {
        skipped++;
        console.log(`  · skip  ${scene.id}`);
        continue;
      }
      process.stdout.write(`  ♪ ${scene.id} … `);
      try {
        const buf = await synthesize(scene.text);
        await writeFile(abs, buf);
        made++;
        console.log(`ok (${Math.round(buf.length / 1024)} KB)`);
      } catch (err) {
        failed++;
        console.log('FAILED');
        console.error('    ', (err as Error).message);
      }
      // Be gentle with the API.
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  console.log(`\nDone. ${made} generated, ${skipped} skipped, ${failed} failed.`);
  console.log('Next: npm run dev  (preview)  or  npm run render  (export MP4s).');
  if (failed > 0) process.exit(1);
}

await main();
