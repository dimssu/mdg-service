// Shared helpers for the reel audio scripts. Plain node, no dependencies.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const REPO = path.resolve(import.meta.dirname, '../../../..');

/** ElevenLabs settings live in mdg-demo/.env beside the rest of the film tooling. Never print them. */
export function elevenEnv() {
  const txt = readFileSync(path.join(REPO, 'mdg-demo', '.env'), 'utf8');
  const out = {};
  for (const line of txt.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) out[k.trim()] = rest.join('=').trim();
  }
  for (const k of ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID']) {
    if (!out[k]) throw new Error(`mdg-demo/.env has no ${k}`);
  }
  return out;
}

export const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 24);

export function seconds(file) {
  return Number(String(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file])).trim());
}

/** Number of samples at 44.1 kHz after decoding — the exact length the declick must keep. */
export function samples44k(file) {
  return Math.round(seconds(file) * 44100);
}

export const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

/** script.json is the source of truth for node; script.js mirrors it for the page (file:// cannot fetch JSON). */
export function readScript(reelDir) {
  return JSON.parse(readFileSync(path.join(reelDir, 'build', 'script.json'), 'utf8'));
}
export function writeScript(reelDir, data) {
  writeFileSync(path.join(reelDir, 'build', 'script.json'), JSON.stringify(data, null, 2) + '\n');
  writeFileSync(path.join(reelDir, 'build', 'script.js'),
    `// GENERATED from script.json by kit/audio — do not edit.\nwindow.SCRIPT = ${JSON.stringify(data, null, 2)};\n`);
}

export function reelDirFromArg() {
  const arg = process.argv[2];
  if (!arg) throw new Error('usage: node kit/audio/<script>.mjs <reel folder, e.g. marketing/reels/01-dsr>');
  const dir = path.resolve(arg);
  if (!existsSync(path.join(dir, 'build'))) throw new Error(`${dir}/build does not exist`);
  return dir;
}
