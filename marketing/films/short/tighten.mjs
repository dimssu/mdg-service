/**
 * Tightens the short's recorded lines: keeps every spoken segment exactly and
 * sets each pause between them to a chosen length (and the tail after the last
 * word), with 10 ms fades at every join so no cut clicks. The originals stay in
 * voice-kavach-short/orig/. Pauses are listed per line in order; a pause not
 * listed keeps a 0.35 s breath.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const DIR = path.resolve(import.meta.dirname, '..', '..', 'voice-kavach-short');
const PLAN = {
  Q01: { pauses: [0.6, 0.35], tail: 0.15 },
  Q02: { pauses: [0.45, 0.22, 0.35], tail: 0.15 },
  Q03: { pauses: [], tail: 0.65 },          // the half-second of silence before the shadow
  Q04: { pauses: [], tail: 0.15 },
  Q05: { pauses: [], tail: 0.15 },
  Q06: { pauses: [0.26, 0.35], tail: 0.15 },
  Q07: { pauses: [0.35], tail: 0.15 },
  Q08: { pauses: [0.2], tail: 0.15 },
  Q09: { pauses: [0.3, 0.7, 0.15, 0.16], tail: 0.5 },
  Q10: { pauses: [0.6], tail: 0.3 },
};
for (const [id, p] of Object.entries(PLAN)) {
  const src = path.join(DIR, 'orig', `${id}.mp3`);
  const dur = Number(String(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src])).trim());
  const log = String(execFileSync('ffmpeg', ['-hide_banner', '-i', src, '-af', 'silencedetect=n=-40dB:d=0.12', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString() + '');
  const det = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${src}" -af silencedetect=n=-40dB:d=0.12 -f null - 2>&1 | grep -o "silence_\\(start\\|end\\): [0-9.]*"`]).toString().trim().split('\n').map((l) => Number(l.split(': ')[1]));
  // speech segments between silences
  const segs = []; let at = 0;
  for (let i = 0; i < det.length; i += 2) { const s0 = det[i], s1 = det[i + 1] ?? dur; if (s0 - at > 0.05) segs.push([at, s0]); at = s1; }
  if (dur - at > 0.12) segs.push([at, dur]);   // speech running to the very end
  const speech = segs.filter(([a, b]) => b - a > 0.08);
  const parts = [];
  speech.forEach(([a, b], i) => {
    parts.push(`[0:a]atrim=${Math.max(0, a - 0.03).toFixed(3)}:${Math.min(dur, b + 0.04).toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${(b - a + 0.06).toFixed(3)}:d=0.01[s${i}]`);
    const gap = i < speech.length - 1 ? (p.pauses[i] ?? 0.35) : p.tail;
    parts.push(`anullsrc=r=44100:cl=mono,atrim=0:${gap.toFixed(3)}[g${i}]`);
  });
  const cat = speech.map((_, i) => `[s${i}][g${i}]`).join('') + `concat=n=${speech.length * 2}:v=0:a=1[out]`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-filter_complex', [...parts, cat].join(';'), '-map', '[out]', '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', path.join(DIR, `${id}.mp3`)]);
  const out = Number(String(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(DIR, `${id}.mp3`)])).trim());
  console.log(`${id}: ${speech.length} segments, ${dur.toFixed(2)}s → ${out.toFixed(2)}s`);
}
