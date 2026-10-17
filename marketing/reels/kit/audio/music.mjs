/**
 * Generates a reel's music bed from a composition plan (ElevenLabs music_v1).
 *
 *   node marketing/reels/kit/audio/music.mjs marketing/reels/01-dsr          # next take
 *   node marketing/reels/kit/audio/music.mjs marketing/reels/01-dsr --take 2 # overwrite take 2
 *
 * Reads build/music-plan.json — the proven v1 format:
 *   { positive_global_styles, negative_global_styles,
 *     sections: [{ section_name, duration_ms, lines: [], positive_local_styles, negative_local_styles }] }
 * Plan every section as whole bars; the account returns requested lengths within ~50 ms.
 * Writes build/audio/bed-<n>.mp3 and prints its measured length against the plan.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { elevenEnv, seconds, reelDirFromArg } from './lib.mjs';

const dir = reelDirFromArg();
const e = elevenEnv();
const plan = JSON.parse(readFileSync(path.join(dir, 'build', 'music-plan.json'), 'utf8'));
const audio = path.join(dir, 'build', 'audio');

let take = process.argv.includes('--take') ? Number(process.argv[process.argv.indexOf('--take') + 1]) : 1;
if (!process.argv.includes('--take')) while (existsSync(path.join(audio, `bed-${take}.mp3`))) take++;

const wanted = plan.sections.reduce((n, s) => n + s.duration_ms, 0) / 1000;
console.log(`Music take ${take}: ${plan.sections.length} sections, ${wanted.toFixed(2)} s requested…`);
const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', {
  method: 'POST',
  headers: { 'xi-api-key': e.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model_id: 'music_v1', composition_plan: plan }),
});
if (!res.ok) throw new Error(`music ${res.status}: ${(await res.text()).slice(0, 400)}`);
const out = path.join(audio, `bed-${take}.mp3`);
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log(`→ ${path.relative(process.cwd(), out)}  ${seconds(out).toFixed(3)} s (requested ${wanted.toFixed(3)})`);
