/**
 * Records the film's Hindi voice, one file per beat, and measures it.
 *
 *   node marketing/voice.mjs           # record anything missing or changed
 *   node marketing/voice.mjs --force   # record everything again
 *   node marketing/voice.mjs --measure # just re-read the durations
 *
 * ── WHY THIS RUNS BEFORE THE PICTURES ──────────────────────────────────────
 * Hindi narration runs roughly a third longer than the same line in English,
 * and Veo only makes clips at fixed lengths. Guessing a card is "about four
 * seconds" and then finding the line takes five and a half means paying for the
 * clip twice. So the voice is laid first and every clip is cut to the length
 * its own line actually turned out to be.
 *
 * ── THE CACHE IS KEYED ON THE LINE ─────────────────────────────────────────
 * Same contract as the images: `voice.json` records the sha of the exact text
 * that produced each file, so editing a line re-records that beat and leaves
 * the other twenty-four alone. An existing file with no recorded hash is
 * adopted, which costs nothing today and protects the next edit.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);

/* One voice run per film. `--film teaser` reads films/teaser.json and records
   into voice-teaser/, so the three films never overwrite each other's takes or
   each other's measured durations. With no flag this is the original film. */
const FILM = process.argv.includes('--film')
  ? process.argv[process.argv.indexOf('--film') + 1]
  : null;
const OUT = path.join(ROOT, FILM ? `voice-${FILM}` : 'voice');
const SCRIPT = FILM ? path.join(ROOT, 'films', `${FILM}.json`) : path.join(ROOT, 'script.json');

/* The voice lives in the demo's env beside the rest of the film tooling. */
function env() {
  const txt = readFileSync(path.join(ROOT, '..', 'mdg-demo', '.env'), 'utf8');
  const out = {};
  for (const line of txt.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) out[k.trim()] = rest.join('=').trim();
  }
  return out;
}

const hash = (t) => createHash('sha256').update(t, 'utf8').digest('hex').slice(0, 32);

function seconds(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  return Number(String(out).trim());
}

/* Veo will only make these. A line is given the shortest clip it fits inside,
   plus a breath — a picture that ends before the sentence does is the one
   mistake an audience always notices. */
const VEO_LENGTHS = [4, 6, 8];
const clipFor = (s) => VEO_LENGTHS.find((n) => n >= s + 0.6) ?? 8;

/* The neighbouring lines go along as context, so a line spoken on its own still
   sounds like the middle of a paragraph rather than the start of a new take.
   They shape the delivery only; they are not spoken. */
async function speak(e, text, prev, next) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${e.ELEVENLABS_VOICE_ID}?output_format=${e.ELEVENLABS_OUTPUT_FORMAT}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': e.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: e.ELEVENLABS_MODEL_ID,
        ...(prev ? { previous_text: prev } : {}),
        ...(next ? { next_text: next } : {}),
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} — ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const force = process.argv.includes('--force');
  const measureOnly = process.argv.includes('--measure');
  const e = env();
  const { beats } = JSON.parse(readFileSync(SCRIPT, 'utf8'));
  mkdirSync(OUT, { recursive: true });

  const manifestPath = path.join(OUT, 'voice.json');
  let manifest = {};
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    /* first run */
  }

  const rows = [];
  for (const [i, b] of beats.entries()) {
    const mp3 = path.join(OUT, `${b.id}.mp3`);
    const want = hash(b.hi);

    if (!measureOnly && (force || !existsSync(mp3) || manifest[b.id]?.hash !== want)) {
      writeFileSync(mp3, await speak(e, b.hi, beats[i - 1]?.hi, beats[i + 1]?.hi));
      process.stdout.write(`  + ${b.id}\n`);
    }

    const dur = seconds(mp3);
    manifest[b.id] = { hash: want, seconds: Number(dur.toFixed(2)), clip: clipFor(dur) };
    rows.push({ id: b.id, act: b.act, seconds: dur, clip: clipFor(dur) });
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log('\n  beat                      spoken   clip');
  let spoken = 0;
  let cut = 0;
  let act = null;
  for (const r of rows) {
    if (r.act !== act) {
      act = r.act;
      console.log(`  ── act ${act} ──`);
    }
    console.log(`  ${r.id.padEnd(24)} ${r.seconds.toFixed(2).padStart(6)}s ${String(r.clip).padStart(5)}s`);
    spoken += r.seconds;
    cut += r.clip;
  }
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  console.log(`\n  spoken ${mmss(spoken)}   ·   film as cut ${mmss(cut)}   ·   ${rows.length} beats`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
