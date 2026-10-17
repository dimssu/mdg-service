/**
 * Records a reel's Hindi voice, one take per line, declicks and measures it.
 *
 *   node marketing/reels/kit/audio/voice.mjs marketing/reels/01-dsr            # record missing or changed lines
 *   node marketing/reels/kit/audio/voice.mjs marketing/reels/01-dsr --force    # record every line again
 *   node marketing/reels/kit/audio/voice.mjs marketing/reels/01-dsr --only L3  # one line
 *
 * Reads build/script.json → lines[] { id, start, screen, tts }. Writes
 * build/audio/<id>.mp3 (the raw take), build/audio/<id>.wav (declicked, exact
 * length) and back into script.json: seconds, hash. A line is re-recorded only
 * when its tts text changed, so editing one line bills one line.
 *
 * Settings are the films' (DIRECTION §9): eleven_multilingual_v2, stability
 * 0.45, similarity 0.8, style 0, speaker boost, neighbours as previous/next text.
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { elevenEnv, sha, seconds, samples44k, ff, readScript, writeScript, reelDirFromArg } from './lib.mjs';

const dir = reelDirFromArg();
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const e = elevenEnv();
const script = readScript(dir);
const audio = path.join(dir, 'build', 'audio');
mkdirSync(audio, { recursive: true });

for (const bad of ['…', '—', '–']) {
  for (const l of script.lines) {
    if (l.tts.includes(bad)) throw new Error(`${l.id}: TTS text contains "${bad}" — use only , । ? (DIRECTION §3)`);
  }
}

async function speak(text, prev, next) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${e.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': e.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: e.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
        ...(prev ? { previous_text: prev } : {}),
        ...(next ? { next_text: next } : {}),
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

/** 107 of 127 film takes ended on a click ~60 ms before EOF: trim trailing near-silence, keep the exact length. */
function declick(mp3, wav) {
  const n = samples44k(mp3);
  ff(['-i', mp3, '-af',
    `aresample=44100,areverse,silenceremove=start_periods=1:start_duration=0.08:start_threshold=-55dB:start_silence=0.05,areverse,afade=t=in:d=0.01,apad=whole_len=${n},atrim=end_sample=${n}`,
    '-ac', '1', '-c:a', 'pcm_s16le', wav]);
}


/**
 * Where the speech really is inside a take. ElevenLabs puts ~1 s of silence after a line that has a next_text
 * neighbour, and declick() pads the file back to its full length — so `seconds` is the FILE, not the voice.
 * The picture must lock to onset/end (seconds from the line's start), not to `seconds`.
 */
function speechSpan(wav) {
  const total = seconds(wav);
  let log = '';
  try {
    execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=noise=-42dB:d=0.04', '-f', 'null', '-'],
      { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
  } catch (e) { log = String(e.stderr || ''); }
  if (!log) {
    log = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', wav, '-af', 'silencedetect=noise=-42dB:d=0.04', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
  }
  const starts = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  let onset = 0;
  if (starts.length && starts[0] < 0.02 && ends.length) onset = ends[0];
  let end = total;
  if (starts.length) {
    const lastStart = starts[starts.length - 1];
    const closed = ends.length >= starts.length && ends[ends.length - 1] < total - 0.03;
    if (!closed) end = lastStart;
  }
  return { onset: Number(onset.toFixed(3)), end: Number(end.toFixed(3)) };
}

const lines = script.lines;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (ONLY && l.id !== ONLY) continue;
  const mp3 = path.join(audio, `${l.id}.mp3`);
  const wav = path.join(audio, `${l.id}.wav`);
  const h = sha(l.tts);
  if (!FORCE && l.hash === h && existsSync(mp3) && existsSync(wav)) {
    console.log(`= ${l.id} unchanged (${l.seconds?.toFixed(2)} s)`);
    continue;
  }
  process.stdout.write(`↓ ${l.id} ${l.tts} … `);
  const buf = await speak(l.tts, lines[i - 1]?.tts, lines[i + 1]?.tts);
  writeFileSync(mp3, buf);
  declick(mp3, wav);
  l.hash = h;
  l.seconds = Number(seconds(wav).toFixed(3));
  l.chars = l.tts.length;
  console.log(`${l.seconds.toFixed(2)} s`);
}

script.voiceChars = lines.reduce((n, l) => n + l.tts.length, 0);
for (const l of lines) {
  const sp = speechSpan(path.join(audio, `${l.id}.wav`));
  l.onset = sp.onset;   // first voiced sample, seconds after l.start
  l.end = sp.end;       // last voiced sample, seconds after l.start
}
writeScript(dir, script);
console.log(`\n${script.voiceChars} characters of voice (ceiling 240).`);
console.log('line   start → speech (onset … end)   [file length, padded with silence]');
for (const l of lines) {
  console.log(`${l.id}  ${l.start.toFixed(2)} → ${(l.start + l.onset).toFixed(2)} … ${(l.start + l.end).toFixed(2)}   [${(l.seconds ?? 0).toFixed(2)} s file]`);
}
