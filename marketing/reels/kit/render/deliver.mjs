/**
 * Makes the deliverables from a rendered master and checks them (qa).
 *
 *   node marketing/reels/kit/render/deliver.mjs marketing/reels/01-dsr --tag v1
 *
 * From out/<tag>.mp4: out/<tag>-whatsapp.mp4 (720×1280, 30 fps — blended with
 * tmix, never frame-dropped — two-pass to fit well under 16 MB, peak-limited),
 * out/<tag>-poster.jpg (frame 0), and copies the 60-up sheet to out/<tag>-sheet.jpg.
 * Then measures every file: duration, loudness, true peak, size.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, copyFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { reelDir, opt } from './common.mjs';

const dir = reelDir(process.argv[2]);
const TAG = opt('tag', 'v1');
const outDir = path.join(dir, 'out');
const master = path.join(outDir, `${TAG}.mp4`);
if (!existsSync(master)) throw new Error(`${master} not found — render it first`);
const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const probe = (f, entries) => String(execFileSync('ffprobe', ['-v', 'error', ...entries, '-of', 'default=noprint_wrappers=1:nokey=1', f])).trim();

const fps = probe(master, ['-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate']);
const [num, den] = fps.split('/').map(Number);
const srcFps = num / den;
const blend = srcFps > 31 ? `tmix=frames=${Math.round(srcFps / 30)},fps=30,` : 'fps=30,';
const wa = path.join(outDir, `${TAG}-whatsapp.mp4`);
const vf = `${blend}scale=720:1280:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`;
const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
const passlog = path.join(outDir, `.pass-${process.pid}`);
ff(['-i', master, '-vf', vf, ...COLOR, '-c:v', 'libx264', '-preset', 'slow', '-b:v', '2800k', '-pass', '1', '-passlogfile', passlog, '-an', '-f', 'mp4', '/dev/null']);
ff(['-i', master, '-vf', vf, ...COLOR, '-c:v', 'libx264', '-preset', 'slow', '-b:v', '2800k', '-pass', '2', '-passlogfile', passlog,
  '-af', 'alimiter=limit=0.6:level=false', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', wa]);
for (const s of ['-0.log', '-0.log.mbtree']) rmSync(passlog + s, { force: true });

const poster = path.join(outDir, `${TAG}-poster.jpg`);
ff(['-i', master, '-frames:v', '1', '-q:v', '2', poster]);
const sheet = path.join(outDir, `stills-${TAG}`, 'sheet-60.jpg');
if (existsSync(sheet)) copyFileSync(sheet, path.join(outDir, `${TAG}-sheet.jpg`));

function loudness(f) {
  const txt = execFileSync('bash', ['-c', `ffmpeg -hide_banner -nostats -i "${f}" -af ebur128=peak=true -f null - 2>&1 | tail -14`]).toString();
  const I = (txt.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1];
  const TP = (txt.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1];
  return { I: Number(I), TP: Number(TP) };
}
const report = [];
for (const f of [master, wa]) {
  const dur = Number(probe(f, ['-show_entries', 'format=duration']));
  const hasAudio = probe(f, ['-select_streams', 'a', '-show_entries', 'stream=index']) !== '';
  const L = hasAudio ? loudness(f) : { I: NaN, TP: NaN };
  const mb = statSync(f).size / 1e6;
  report.push({ file: path.basename(f), dur, I: L.I, TP: L.TP, mb });
}
console.table(report);
const errs = [];
for (const r of report) {
  if (Math.abs(r.dur - 30) > 0.06) errs.push(`${r.file}: duration ${r.dur}`);
  if (!Number.isNaN(r.I) && Math.abs(r.I + 16) > 1.2) errs.push(`${r.file}: loudness ${r.I} LUFS`);
  if (!Number.isNaN(r.TP) && r.TP > -1.0) errs.push(`${r.file}: true peak ${r.TP} dBTP`);
}
if (report[1].mb >= 16) errs.push(`whatsapp copy ${report[1].mb.toFixed(1)} MB ≥ 16 MB`);
console.log(errs.length ? `QA FAILED:\n  ${errs.join('\n  ')}` : 'QA passed: 30.0 s, loudness and peak in range, WhatsApp copy under 16 MB.');
if (errs.length) process.exitCode = 1;
