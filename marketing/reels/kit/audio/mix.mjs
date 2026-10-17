/**
 * Mixes a reel's soundtrack: voice lines + music bed + effects, loudness-normalised.
 *
 *   node marketing/reels/kit/audio/mix.mjs marketing/reels/01-dsr
 *
 * Reads build/script.json (voice lines: start + the declicked <id>.wav) and
 * build/mix.json:
 *   { "duration": 30,
 *     "bed":  { "file": "audio/bed-1.mp3", "offset": 0, "gainDb": -14,
 *               "silences": [[12.5, 13.0]], "fadeOut": 0.6 },
 *     "sfx":  [ { "file": "audio/tick.wav", "at": 9.2, "gainDb": -12 }, … ] }
 * Paths are relative to build/, or repo-relative when they start with "marketing/".
 *
 * Optional "master": { "limit": 0.34 } adds a look-ahead peak limiter before loudnorm (reel 02).
 *
 * Bed: gain, a 2.5 kHz pocket for the voice (−4 dB), silences (30 ms ramps),
 * sidechain-ducked under the voice, faded out at the end. Effects: 5 ms in /
 * 80 ms out, placed with adelay. Everything summed with amix normalize=0, then
 * two-pass loudnorm to −16 LUFS / −2 dBTP → build/audio/mix.wav (48 kHz stereo).
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { REPO, readScript, reelDirFromArg } from './lib.mjs';

const dir = reelDirFromArg();
const build = path.join(dir, 'build');
const script = readScript(dir);
const mix = JSON.parse(readFileSync(path.join(build, 'mix.json'), 'utf8'));
const D = mix.duration ?? 30;
const resolve = (f) => (f.startsWith('marketing/') ? path.join(REPO, f) : path.join(build, f));

const inputs = [];
const add = (f) => { const p = resolve(f); if (!existsSync(p)) throw new Error(`missing ${p}`); inputs.push(p); return inputs.length - 1; };
const ms = (s) => Math.max(0, Math.round(s * 1000));
const parts = [];

// Voice
const vLabels = [];
for (const l of script.lines) {
  const i = add(`audio/${l.id}.wav`);
  parts.push(`[${i}:a]aresample=48000,aformat=channel_layouts=mono,adelay=${ms(l.start)}[v${i}]`);
  vLabels.push(`[v${i}]`);
}
parts.push(`${vLabels.join('')}amix=inputs=${vLabels.length}:normalize=0,apad=whole_dur=${D},atrim=0:${D},aformat=channel_layouts=stereo,asplit=2[voice][key]`);

// Bed
const b = mix.bed;
const bi = add(b.file);
const sil = (b.silences ?? []).map(([a, z]) =>
  `*(clip((${a}-t)/0.03,0,1)+clip((t-${z})/0.03,0,1))`).join('');
const fadeOut = b.fadeOut ?? 0.6;
parts.push(`[${bi}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=start=${b.offset ?? 0},asetpts=PTS-STARTPTS,apad=whole_dur=${D},atrim=0:${D},` +
  `volume=${b.gainDb ?? -14}dB,equalizer=f=2500:t=q:w=1:g=-4` +
  (sil ? `,volume='1${sil}':eval=frame` : '') +
  `,afade=t=out:st=${(D - fadeOut).toFixed(3)}:d=${fadeOut}[bedpre]`);
const dk = b.duck ?? {};   // optional per-reel override of the duck, e.g. "duck": { "threshold": 0.012 } (defaults are the films' 0.03 / 8 / 15 / 350)
parts.push(`[bedpre][key]sidechaincompress=threshold=${dk.threshold ?? 0.03}:ratio=${dk.ratio ?? 8}:attack=${dk.attack ?? 15}:release=${dk.release ?? 350}[bed]`);

// Effects
const sLabels = [];
for (const s of mix.sfx ?? []) {
  const i = add(s.file);
  parts.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.005,areverse,afade=t=in:d=0.08,areverse,volume=${s.gainDb ?? -10}dB,adelay=${ms(s.at)}:all=1[s${i}]`);
  sLabels.push(`[s${i}]`);
}
const all = ['[bed]', '[voice]', ...sLabels];
// Optional master peak limiter (mix.json "master": { "limit": 0.34 }, a linear ceiling). Speech has a high crest factor: without it
// the pre-normalisation true peak is too hot for a linear +6 dB gain, loudnorm falls back to its dynamic mode and rides the gain.
const lim = mix.master?.limit;
parts.push(`${all.join('')}amix=inputs=${all.length}:normalize=0,atrim=0:${D}${lim ? `,alimiter=limit=${lim}:attack=${mix.master.attack ?? 5}:release=${mix.master.release ?? 60}:level=disabled:latency=1` : ''}[mix]`);

const pre = path.join(build, 'audio', 'mix-pre.wav');
const args = ['-hide_banner', '-loglevel', 'error', '-y'];
for (const p of inputs) args.push('-i', p);
execFileSync('ffmpeg', [...args, '-filter_complex', parts.join(';'), '-map', '[mix]', '-c:a', 'pcm_s24le', pre]);

// Two-pass loudnorm
let stats;
try {
  const err = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${pre}" -af loudnorm=I=-16:TP=-2:LRA=11:print_format=json -f null - 2>&1`]).toString();
  stats = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1));
} catch (e) { throw new Error('loudnorm pass 1 failed: ' + e.message); }
const out = path.join(build, 'audio', 'mix.wav');
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', pre, '-af',
  `loudnorm=I=-16:TP=-2:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true,aresample=48000`,
  '-c:a', 'pcm_s24le', out]);
console.log(`→ ${out}\n  pass 1: I ${stats.input_i} LUFS, TP ${stats.input_tp} dBTP`);
