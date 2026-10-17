/**
 * Like kit/audio/music.mjs but for a named plan file and a named output (reel 02 builds its bed from two generations).
 *   node marketing/reels/02-stock-check/build/gen-music.mjs build/music-plan.groove.json audio/bed-groove-1.mp3
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { elevenEnv, seconds } from '../../kit/audio/lib.mjs';

const dir = path.resolve(import.meta.dirname, '..');
const [planFile, outFile] = process.argv.slice(2);
if (!planFile || !outFile) throw new Error('usage: gen-music.mjs <plan.json relative to the reel> <out.mp3 relative to build/>');
const e = elevenEnv();
const plan = JSON.parse(readFileSync(path.join(dir, planFile), 'utf8'));
const wanted = plan.sections.reduce((n, s) => n + s.duration_ms, 0) / 1000;
console.log(`${planFile}: ${plan.sections.length} sections, ${wanted.toFixed(3)} s requested…`);
const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', {
  method: 'POST',
  headers: { 'xi-api-key': e.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model_id: 'music_v1', composition_plan: plan }),
});
if (!res.ok) throw new Error(`music ${res.status}: ${(await res.text()).slice(0, 400)}`);
const out = path.join(dir, 'build', outFile);
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log(`→ ${outFile}  ${seconds(out).toFixed(3)} s (requested ${wanted.toFixed(3)})`);
