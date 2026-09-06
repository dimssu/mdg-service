import 'dotenv/config';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

import { audioPath } from '../src/lib/audio';
import { TUTORIALS } from '../src/narration';

/**
 * Generates the Hindi voiceover for every scene with ElevenLabs.
 *   npm run voice            # generate anything missing OR whose text changed
 *   npm run voice -- --force # re-generate everything
 *
 * Reads ELEVENLABS_* from `.env` (see .env.example). Each scene's `text` from
 * src/narration.ts is synthesised to public/audio/<tutorial>/<scene>.mp3.
 *
 * ── WHY THE CACHE IS KEYED ON THE TEXT, NOT ON THE FILE ────────────────────
 *
 * It used to skip whenever the mp3 existed. That is the same as caching a
 * translation by whether you have a piece of paper, and it fails in the one
 * direction nobody checks: edit a scene's Hindi, run `npm run voice`, and the
 * old clip is kept. The render then SPEAKS THE OLD SENTENCE while PRINTING THE
 * NEW ONE, and it is worse than a mismatch, because `calculateMetadata` sizes
 * the scene to the old mp3 — so the new caption also sits on screen for the old
 * sentence's duration. Nothing downstream catches it: not the renderer, not
 * guide:media, not the site build. It ships, and the only detector is a person
 * who speaks Hindi watching the whole video.
 *
 * At twelve videos that was a risk. At the seventy this library is heading for,
 * with something like eight hundred scenes, it is a certainty.
 *
 * So each tutorial keeps `public/audio/<id>/manifest.json`, mapping scene id to
 * the sha256 of the exact string that was sent to ElevenLabs. A clip is reused
 * only when the file exists AND its hash matches. Anything else re-records.
 *
 * The hash is computed INSIDE `synthesize()`, over its own argument, at the
 * moment of the call — deliberately not at the call site. If someone later adds
 * a normalisation step (trimming, expanding digits into Devanagari words for
 * better prosody), the hash follows the string that was actually spoken rather
 * than the one the author typed, and the bug cannot creep back in through the
 * gap between them.
 *
 * A tutorial with no manifest — every one of them, the first time this runs —
 * is not re-recorded from scratch. An existing mp3 with no recorded hash is
 * trusted once and its hash written, so this change costs nothing today and
 * starts protecting the next edit.
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

/**
 * The voice that reads one tutorial. Everything uses the default Hindi voice
 * unless the tutorial names an environment variable holding another one — which
 * only the English cut of the marketing film does. An override that is named but
 * unset falls back rather than failing, so the English cut still records (in the
 * multilingual Hindi voice) on a machine that has not set a second voice.
 */
function voiceFor(tutorial: { voiceEnv?: string }): string {
  if (!tutorial.voiceEnv) return VOICE;
  const override = process.env[tutorial.voiceEnv]?.trim();
  return override ? override : VOICE;
}

/** The hash of a narration string, as sent. See the note at the top of the file. */
function hashSpoken(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 32);
}

async function synthesize(
  text: string,
  voice: string,
): Promise<{ buf: Buffer; hash: string }> {
  // Over the argument, here, at the moment of the call — so a future
  // normalisation step cannot separate what was hashed from what was spoken.
  const hash = hashSpoken(text);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${OUTPUT_FORMAT}`;
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
  return { buf: Buffer.from(await res.arrayBuffer()), hash };
}

/** `public/audio/<tutorialId>/manifest.json` — scene id -> hash of its script. */
type VoiceManifest = Record<string, string>;

async function readManifest(dir: string): Promise<VoiceManifest> {
  try {
    const raw = await readFile(path.join(dir, 'manifest.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as VoiceManifest;
  } catch {
    // Missing, or unreadable, or hand-edited into nonsense. All three mean the
    // same thing here — we know nothing — and none of them is worth stopping a
    // recording session over.
    return {};
  }
}

async function writeManifest(dir: string, m: VoiceManifest): Promise<void> {
  const sorted = Object.fromEntries(Object.entries(m).sort(([a], [b]) => (a < b ? -1 : 1)));
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(sorted, null, 2) + '\n');
}

async function main() {
  console.log(`Voice: ${VOICE}  ·  Model: ${MODEL_ID}  ·  Format: ${OUTPUT_FORMAT}\n`);
  let made = 0;
  let skipped = 0;
  let restated = 0;
  let adopted = 0;
  let failed = 0;

  for (const tutorial of TUTORIALS) {
    const voice = voiceFor(tutorial);
    const voiceNote = voice === VOICE ? '' : `  · voice ${voice}`;
    console.log(`\n── ${tutorial.id} (${tutorial.scenes.length} scenes)${voiceNote} ──`);
    const dir = path.join(PUBLIC, 'audio', tutorial.id);
    await mkdir(dir, { recursive: true });
    const manifest = await readManifest(dir);
    let manifestDirty = false;

    for (const scene of tutorial.scenes) {
      const rel = audioPath(tutorial.id, scene.id);
      const abs = path.join(PUBLIC, rel);
      const want = hashSpoken(scene.text);
      const have = manifest[scene.id];

      if (!FORCE && (await exists(abs))) {
        if (have === want) {
          skipped++;
          console.log(`  · skip  ${scene.id}`);
          continue;
        }
        if (have === undefined) {
          // A clip recorded before this manifest existed. Trust it once and
          // write down what it says, so the NEXT edit is caught. Re-recording
          // every clip in the library to learn something we can simply record
          // would cost real money to change nothing.
          manifest[scene.id] = want;
          manifestDirty = true;
          adopted++;
          console.log(`  · adopt ${scene.id}  (existing clip, hash recorded)`);
          continue;
        }
        // The text moved. This is the case the whole mechanism exists for.
        restated++;
        console.log(`  ↻ ${scene.id}  (script changed — re-recording)`);
      }

      process.stdout.write(`  ♪ ${scene.id} … `);
      try {
        const { buf, hash } = await synthesize(scene.text, voice);
        await writeFile(abs, buf);
        manifest[scene.id] = hash;
        manifestDirty = true;
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

    // After every scene, so an interrupted run does not lose what it recorded
    // and then re-record it — which would bill twice for the same clip.
    if (manifestDirty) await writeManifest(dir, manifest);
  }

  console.log(
    `\nDone. ${made} generated (${restated} because the script changed), ` +
      `${skipped} unchanged, ${adopted} existing clips adopted, ${failed} failed.`,
  );
  console.log('Next: npm run dev  (preview)  or  npm run render  (export MP4s).');
  if (failed > 0) process.exit(1);
}

await main();
