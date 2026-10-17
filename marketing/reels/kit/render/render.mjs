/**
 * Renders a reel to MP4: Chrome workers seek window.SCENE and capture frames,
 * sub-frames are blended into real motion blur, frames are piped to ffmpeg
 * (no JPEG folders — the disk is nearly full), segments are concatenated and
 * the mix is muxed.
 *
 *   node marketing/reels/kit/render/render.mjs marketing/reels/01-dsr --out out/draft.mp4                 # draft: 30 fps, no blur
 *   node marketing/reels/kit/render/render.mjs marketing/reels/01-dsr --fps 60 --sub 3 --out out/v1.mp4 --audio build/audio/mix.wav
 *   options: --from 0 --to 30 --workers 3 --q 92 --crf 17 --preset slow
 *
 * Shutter: the S sub-times of a frame are spread across half the frame
 * interval centred on the frame time (a 180° shutter), then tmix averages them.
 * Encode is H.264 High, explicitly bt709-tagged (untagged yuv420p shifts the gold).
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { reelDir, opt, launch, openReel, shoot } from './common.mjs';

const dir = reelDir(process.argv[2]);
const FPS = opt('fps', 30);
const S = opt('sub', 1);
const WORKERS = opt('workers', 3);
const Q = opt('q', 92);
const CRF = opt('crf', 17);
const PRESET = opt('preset', 'medium');
const OUT = path.resolve(dir, opt('out', 'out/draft.mp4'));
const AUDIO = opt('audio', null);
mkdirSync(path.dirname(OUT), { recursive: true });

const browser0 = await launch();
const probe = await openReel(browser0, dir);
const D = await probe.evaluate(() => window.SCENE.duration);
await browser0.close();
const T0 = opt('from', 0);
const T1 = Math.min(opt('to', D), D);
const F0 = Math.round(T0 * FPS);
const F1 = Math.round(T1 * FPS);
const total = F1 - F0;
console.log(`Rendering ${path.basename(dir)}: ${T0}–${T1} s, ${FPS} fps × ${S} sub-frames = ${total * S} captures, ${WORKERS} workers`);

const work = path.join(dir, 'out', `.render-${process.pid}`);
mkdirSync(work, { recursive: true });

const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
// setparams tags the frames themselves: libx264 takes primaries/transfer from the frame, and
// without it the file carried only the matrix (17 Oct) — the gold-shift trap DIRECTION §10.4 warns about.
const VF_TAIL = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv';

function encoder(segPath) {
  const vf = S > 1
    ? `tmix=frames=${S},select='eq(mod(n\\,${S})\\,${S - 1})',setpts=N/(${FPS}*TB),${VF_TAIL}`
    : `setpts=N/(${FPS}*TB),${VF_TAIL}`;
  return spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS * S), '-i', '-',
    '-vf', vf, '-r', String(FPS), ...COLOR,
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', PRESET, '-crf', String(CRF), '-g', String(FPS * 2),
    '-movflags', '+faststart', segPath], { stdio: ['pipe', 'inherit', 'inherit'] });
}

const write = (proc, buf) => new Promise((res, rej) => {
  if (!proc.stdin.write(buf)) proc.stdin.once('drain', res); else res();
  proc.stdin.once('error', rej);
});

const t0wall = Date.now();
let done = 0;
const chunk = Math.ceil(total / WORKERS);
const segs = [];
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const a = F0 + w * chunk;
  const b = Math.min(F1, a + chunk);
  if (a >= b) return;
  const seg = path.join(work, `seg-${String(w).padStart(2, '0')}.mp4`);
  segs[w] = seg;
  const browser = await launch();
  const page = await openReel(browser, dir);
  const cdp = await page.context().newCDPSession(page);
  const enc = encoder(seg);
  const finished = new Promise((res, rej) => enc.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  for (let k = a; k < b; k++) {
    for (let j = 0; j < S; j++) {
      const off = S > 1 ? ((j + 0.5) / S - 0.5) * (0.5 / FPS) : 0;
      const t = Math.min(Math.max(k / FPS + off, 0), D - 1e-4);
      await write(enc, await shoot(page, cdp, t, Q));
    }
    done++;
    if (w === 0 && done % 30 === 0) {
      const el = (Date.now() - t0wall) / 1000;
      process.stdout.write(`\r  ${done}/${total} frames · ${(el / done * 1000 / S).toFixed(0)} ms/capture · ETA ${((total - done) * el / done).toFixed(0)} s   `);
    }
  }
  enc.stdin.end();
  await finished;
  await browser.close();
}));
console.log(`\n  captured in ${((Date.now() - t0wall) / 1000).toFixed(0)} s`);

const list = path.join(work, 'list.txt');
writeFileSync(list, segs.filter(Boolean).map((s) => `file '${s}'`).join('\n') + '\n');
const silent = path.join(work, 'video.mp4');
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);

if (AUDIO) {
  const a = path.resolve(dir, AUDIO);
  if (!existsSync(a)) throw new Error(`audio ${a} not found`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-ss', String(T0), '-t', String(T1 - T0), '-i', a,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', OUT]);
} else {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-c', 'copy', '-movflags', '+faststart', OUT]);
}
rmSync(work, { recursive: true, force: true });
console.log(`→ ${path.relative(process.cwd(), OUT)}`);
