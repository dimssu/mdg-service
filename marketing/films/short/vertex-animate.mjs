/**
 * Animates an approved still with Veo on Vertex AI — the route for final takes:
 * no generator mark (Flow stamps one), 1080p, and it draws on the Cloud credit
 * rather than Flow credits. The still itself is made in Google Flow.
 *
 *   node films/short/vertex-animate.mjs <id> <still.png|jpg> <motion.txt> [--seconds 8] [--model fast|best|lite]
 *
 * Writes marketing/clips/<id>.mp4 (1080x1920, no audio), which films/cut.mjs
 * reads as `clip:<id>`. A call that starts has already been charged.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadKey, accessToken, renderClip, MODELS } from '../../veo.mjs';

const [id, still, motionFile] = process.argv.slice(2);
if (!id || !still || !motionFile) throw new Error('usage: vertex-animate.mjs <id> <still> <motion.txt> [--seconds 8] [--model fast]');
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const seconds = Number(arg('--seconds', '8'));
const model = MODELS[arg('--model', 'fast')];
const out = path.resolve(import.meta.dirname, '..', '..', 'clips', `${id}.mp4`);
if (existsSync(out) && !process.argv.includes('--force')) throw new Error(`${out} exists; --force to replace`);

/* Veo wants a PNG at 9:16; Flow's stills are 768x1376 JPEGs. */
const png = path.resolve(path.dirname(still), `${path.basename(still, path.extname(still))}.veo.png`);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', still, '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', png]);

const key = loadKey();
const token = await accessToken(key);
const motion = readFileSync(motionFile, 'utf8').trim();
const t0 = Date.now();
const bytes = await renderClip({ token, project: key.project_id, model, stillPath: png, motion, seconds });
writeFileSync(out, bytes);
console.log(`${id}: ${model}, ${seconds}s, ${((Date.now() - t0) / 1000).toFixed(0)}s → ${out}`);
