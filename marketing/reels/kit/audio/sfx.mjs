/**
 * One organic sound effect from ElevenLabs (paper, stamp, a deep hit). UI ticks,
 * whooshes and risers come from synth.mjs instead — free and sample-accurate.
 *
 *   node marketing/reels/kit/audio/sfx.mjs marketing/reels/01-dsr paper "a single sheet of paper sliding fast off a wooden desk, short and dry" 0.8
 *
 * Writes build/audio/sfx-<name>.mp3. Explicit durations cost credits per second.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { elevenEnv, seconds, reelDirFromArg } from './lib.mjs';

const dir = reelDirFromArg();
const [, , , name, text, dur] = process.argv;
if (!name || !text || !dur) throw new Error('usage: sfx.mjs <reel> <name> "<prompt>" <seconds>');
const e = elevenEnv();
const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', {
  method: 'POST',
  headers: { 'xi-api-key': e.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, duration_seconds: Number(dur), prompt_influence: 0.6 }),
});
if (!res.ok) throw new Error(`sfx ${res.status}: ${(await res.text()).slice(0, 300)}`);
const out = path.join(dir, 'build', 'audio', `sfx-${name}.mp3`);
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log(`→ ${out}  ${seconds(out).toFixed(2)} s`);
