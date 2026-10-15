/**
 * Finishes the short after films/cut.mjs has laid picture + voice:
 *   - the on-screen Hindi lines (short/overlays/*.png, timed by overlays.json),
 *     each fading in over 0.12 s and out over 0.10 s;
 *   - the music bed (short/sound/bed.mp3), ducked under the narration by a
 *     sidechain, cut to true silence for the beat before the shadow, its own
 *     sting landing on the end card;
 *   - the sound effects on their frames (cut-sheet.json → sound.sfx);
 *   - loudness to −16 LUFS, true peak −2 dB, two-pass, like the full film.
 *
 *   node films/short/finish.mjs [films/mdg-kavach-short-draft.mp4] → films/mdg-kavach-short.mp4
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const FILMS = path.resolve(import.meta.dirname, '..');
const SHORT = import.meta.dirname;
const src = path.resolve(process.argv[2] ?? path.join(FILMS, 'mdg-kavach-short-draft.mp4'));
const out = path.join(FILMS, 'mdg-kavach-short.mp4');
const sheet = JSON.parse(readFileSync(path.join(SHORT, 'cut-sheet.json'), 'utf8'));
const ov = JSON.parse(readFileSync(path.join(SHORT, 'overlays', 'overlays.json'), 'utf8'));
const overlays = Array.isArray(ov) ? ov : ov.overlays;
const dur = Number(String(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src])).trim());

/* sound effects: file and gain (dB) per kind */
const FX = {
  'low sub-hit': ['subhit', -4], whoosh: ['whoosh', -10], 'paper thump': ['thump', -8], 'deep brand hit': ['brandhit', -10],
  'UI tick': ['tick', -12], stamp: ['stamp', -6], 'soft pop': ['pop', -10], sting: ['sting', -3],
};
const fx = sheet.sound.sfx.map((s) => {
  const key = Object.keys(FX).find((k) => s.what.startsWith(k));
  return key ? { t: s.t, file: path.join(SHORT, 'sound', `${FX[key][0]}.mp3`), gain: FX[key][1] } : null;
}).filter(Boolean);
const silence = sheet.lines.find((l) => l.silence_after)?.silence_after;   // [11.71, 12.75]
const quietFrom = sheet.shots.find((s) => s.t0 >= 11.7 && /S05/.test(s.src))?.t0 ?? silence[0];   // the cut onto the shadow

const inputs = ['-i', src, '-i', path.join(SHORT, 'sound', 'bed.mp3')];
/* images loop at 24 fps like the film (the default 25 made the fades miss) */
for (const o of overlays) inputs.push('-framerate', '24', '-loop', '1', '-t', String(dur), '-i', path.join(SHORT, 'overlays', o.file));
for (const f of fx) inputs.push('-i', f.file);

const v = [];
let last = '0:v';
/* on and off on whole frames: the cutter rounds every cut to a frame, so an
   overlay that ends at its nominal second can leak one frame onto the next
   shot. T1 is the cut frame itself; the overlay shows on frames before it.
   No fade-in at 0: frame 0 is the thumbnail and must carry the words. */
/* the cutter's own cut frames: each part is round(slot × 24) frames and the
   last part of a line takes what is left of it, so cuts drift from the
   nominal seconds by a frame here and there (9.50 not 9.46, 30.125 not 30.17).
   An overlay boundary within 2.5 frames of a real cut snaps to that cut. */
const edit = JSON.parse(readFileSync(path.join(FILMS, 'kavach-short.edit.json'), 'utf8')).map;
const voice = JSON.parse(readFileSync(path.join(FILMS, '..', 'voice-kavach-short', 'voice.json'), 'utf8'));
const beatIds = JSON.parse(readFileSync(path.join(FILMS, 'kavach-short.json'), 'utf8')).beats.map((b) => b.id);
const cuts = [];
let clock = 0;   // cut.mjs rounds each boundary from a running clock
beatIds.forEach((id, bi) => {
  const whole = voice[id].seconds + 0.35 + (bi === beatIds.length - 1 ? 2 : 0);
  let used = 0;
  edit[id].forEach((p, i, all) => {
    const slot = i === all.length - 1 ? whole - used : p.seconds;
    used += slot;
    clock += slot;
    cuts.push(Math.round(clock * 24) / 24);
  });
});
const snap = (t) => {
  const near = cuts.find((c) => Math.abs(c - t) <= 2.5 / 24);
  return near ?? Math.round(t * 24) / 24;
};
overlays.forEach((o, i) => {
  const n = 2 + i;
  const T0 = snap(o.t0), T1 = snap(o.t1);
  const fin = T0 > 0 ? `fade=t=in:st=${T0.toFixed(4)}:d=0.12:alpha=1,` : '';
  v.push(`[${n}:v]format=rgba,${fin}fade=t=out:st=${Math.max(T0, T1 - 0.1).toFixed(4)}:d=0.1:alpha=1[o${i}]`);
  v.push(`[${last}][o${i}]overlay=0:0:enable='gte(t,${T0.toFixed(4)})*lt(t,${T1.toFixed(4)})'[v${i}]`);
  last = `v${i}`;
});

const a = [];
/* bed: ~−17 dB under the voice, dipping another ~10 dB when he speaks; dead
   silent from the cut onto the shadow until the shadow line starts */
/* out in 10 ms at the cut onto the shadow (a hard chop clicked), back over
   half a second as the shadow line starts (it slammed in mid-phrase) */
const A = snap(quietFrom), B = silence[1];
a.push(`[1:a]aresample=48000,volume=-14dB,volume=eval=frame:volume='if(lt(t,${A}),1,if(lt(t,${A}+0.01),1-(t-${A})/0.01,if(lt(t,${B}),0,if(lt(t,${B}+0.5),(t-${B})/0.5,1))))',afade=t=out:st=${(dur - 0.6).toFixed(2)}:d=0.6[bedraw]`);
a.push(`[0:a]aresample=48000,asplit=2[vo][vkey]`);
a.push(`[bedraw][vkey]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350:makeup=1[bed]`);
const fxBase = 2 + overlays.length;
/* effect files start and stop on non-zero samples: a 5 ms fade-in and an
   80 ms fade-out (reverse, fade in, reverse) stop the clicks */
fx.forEach((f, i) => a.push(`[${fxBase + i}:a]aresample=48000,afade=t=in:d=0.005,areverse,afade=t=in:d=0.08,areverse,volume=${f.gain}dB,adelay=${Math.round(f.t * 1000)}:all=1[fx${i}]`));
a.push(`[vo][bed]${fx.map((_, i) => `[fx${i}]`).join('')}amix=inputs=${2 + fx.length}:normalize=0:duration=first[mix]`);

const graph = [...v, ...a].join(';');
const tmp = path.join(FILMS, '..', '.work', 'kavach-short-finish.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', `[${last}]`, '-map', '[mix]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '24',
  '-c:a', 'pcm_s16le', '-t', String(dur), tmp.replace('.mp4', '.mov')], { stdio: 'inherit' });

/* two-pass loudness on the finished mix */
const m = spawnSync('ffmpeg', ['-hide_banner', '-i', tmp.replace('.mp4', '.mov'), '-af', 'loudnorm=I=-16:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
let meas;
try { meas = JSON.parse(m.slice(m.lastIndexOf('{'))); } catch { meas = null; }
const ln = meas
  ? `loudnorm=I=-16:TP=-2:LRA=11:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true`
  : 'loudnorm=I=-16:TP=-2:LRA=11';
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp.replace('.mp4', '.mov'), '-c:v', 'copy', '-af', `${ln},aresample=48000`, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], { stdio: 'inherit' });
if (!existsSync(out)) throw new Error('no output');
console.log(`→ ${out} (${dur.toFixed(2)} s, ${overlays.length} overlays, ${fx.length} effects)`);
