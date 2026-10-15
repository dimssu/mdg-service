/**
 * Packages a finished film for mdgservices.in/film: an HLS ladder (so a phone
 * on 2G starts at once and a desktop gets 1080p), Hindi captions built from
 * the script's own timings (the page starts MUTED, so captions carry the first
 * seconds), chapter marks, a line-by-line timeline (so the analytics can say
 * which spoken line viewers leave on), and a poster. Then uploads it to the
 * public films bucket under a content-hashed folder: every file in a version is
 * immutable, and a re-cut is a new folder, never a stale cache.
 *
 *   node films/web/package.mjs kavach        # the full film
 *   node films/web/package.mjs kavach-short  # the 35-second short
 *   ... --no-upload   build locally only
 *
 * Needs ffmpeg, and the MDG S3 keys from mdg-backend/.env (S3_ACCESS_KEY_ID /
 * S3_SECRET_ACCESS_KEY) for the upload. The bucket is `mdg-films`, ap-south-1:
 * public read by bucket policy, CORS for mdgservices.in only.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FILMS = path.resolve(import.meta.dirname, '..');
const ROOT = path.resolve(FILMS, '..');
const BUCKET = 'mdg-films';
const REGION = 'ap-south-1';
export const MEDIA_BASE = `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
const GAP = 0.35;   // the cutter's breath after every line (films/cut.mjs)

/* What each film is made from. `video` is the finished cut; `script` and
   `voice` give every line's start and length exactly as the cutter laid them. */
const SOURCES = {
  kavach: {
    video: 'films/mdg-kavach-v2.mp4', script: 'films/kavach.json', voice: 'voice-kavach/voice.json',
    title: 'डीलर कवच — पूरी फ़िल्म', poster: 0.6,
    /* chapter starts: the film's own acts, plus the founder's problems
       chapter and the hand-over line inside the opening act */
    chapters: [['K001', 'शुरुआत'], ['K010', 'डीलर की असली चुनौतियाँ'], ['K003', 'आपकी परछाई'], ['K201', 'रोज़ की निगरानी'],
      ['K301', 'रिकॉर्ड का मिलान'], ['K401', 'पंप असेसमेंट पॉइंट सिस्टम'], ['K501', 'चौबीसों घंटे साथ'], ['K601', 'फ़ीस'],
      ['K701', 'प्रीमियम सेवाएँ'], ['K801', 'आपका डेटा, आपका'], ['K901', 'जुड़िए']],
  },
  'kavach-short': {
    video: 'films/mdg-kavach-short.mp4', script: 'films/kavach-short.json', voice: 'voice-kavach-short/voice.json',
    title: 'डीलर कवच — 40 सेकंड में', poster: 0.2, chapters: [],
  },
};

/* 9:16 ladder. Card-heavy footage compresses well, so these are generous for
   the cards and right for the live action. The page caps phones at 720p. */
const LADDER = [
  { h: 1920, w: 1080, v: 2500, a: 64 },
  { h: 1280, w: 720, v: 1300, a: 64 },
  { h: 960, w: 540, v: 750, a: 64 },
  { h: 640, w: 360, v: 400, a: 48 },
  { h: 426, w: 240, v: 180, a: 48 },
];
const SEG = 4;      // seconds per segment
const FPS = 24;

const id = process.argv[2];
const src = SOURCES[id];
if (!src) throw new Error(`usage: node films/web/package.mjs <${Object.keys(SOURCES).join('|')}> [--no-upload]`);
const upload = !process.argv.includes('--no-upload');

const video = path.join(ROOT, src.video);
const hash = await new Promise((res) => {
  const h = createHash('sha1');
  createReadStream(video).on('data', (d) => h.update(d)).on('end', () => res(h.digest('hex').slice(0, 10)));
});
const ver = `v-${hash}`;
const OUT = path.join(ROOT, '.work', 'web', id, ver);
mkdirSync(OUT, { recursive: true });
const probe = (f) => Number(String(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f])).trim());
const duration = Math.round(probe(video) * 1000) / 1000;
console.log(`${id}: ${duration}s → ${ver}`);

// ── timeline, chapters, captions ────────────────────────────────────────────
const script = JSON.parse(readFileSync(path.join(ROOT, src.script), 'utf8')).beats;
const voice = JSON.parse(readFileSync(path.join(ROOT, src.voice), 'utf8'));
let t = 0;
const lines = script.map((b) => {
  const speech = voice[b.id].seconds;
  const line = { id: b.id, t: round(t), end: round(t + speech), hi: b.hi };
  t += speech + GAP;
  return line;
});
const chapters = src.chapters.map(([bid, title]) => ({ t: lines.find((l) => l.id === bid).t, title }));
writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify({ film: id, duration, lines, chapters }));
writeFileSync(path.join(OUT, 'chapters.json'), JSON.stringify(chapters));
writeFileSync(path.join(OUT, 'captions.hi.vtt'), vtt(lines));

// ── poster ──────────────────────────────────────────────────────────────────
// 720p: it is the first picture a phone shows, at ~2.6x its CSS size, so a
// 540p poster looked soft before the film had even started (~70 kB at -q:v 5)
execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(src.poster), '-i', video, '-frames:v', '1', '-vf', 'scale=720:1280:flags=lanczos', '-q:v', '5', path.join(OUT, 'poster.jpg')]);

// ── HLS ladder ──────────────────────────────────────────────────────────────
if (!existsSync(path.join(OUT, 'master.m3u8'))) {
  const args = ['-v', 'error', '-stats', '-y', '-i', video];
  const split = `[0:v]split=${LADDER.length}${LADDER.map((_, i) => `[s${i}]`).join('')}`;
  const scales = LADDER.map((r, i) => `[s${i}]scale=${r.w}:${r.h}:flags=lanczos[o${i}]`).join(';');
  args.push('-filter_complex', `${split};${scales}`);
  LADDER.forEach((r, i) => {
    args.push('-map', `[o${i}]`, '-map', '0:a:0');
    args.push(`-c:v:${i}`, 'libx264', `-profile:v:${i}`, i < 2 ? 'high' : 'main', `-b:v:${i}`, `${r.v}k`,
      `-maxrate:v:${i}`, `${Math.round(r.v * 1.1)}k`, `-bufsize:v:${i}`, `${Math.round(r.v * 1.5)}k`,
      `-c:a:${i}`, 'aac', `-b:a:${i}`, `${r.a}k`, `-ac:a:${i}`, '1');
  });
  args.push('-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-g', String(SEG * FPS), '-keyint_min', String(SEG * FPS), '-sc_threshold', '0',
    '-ar', '48000',
    '-f', 'hls', '-hls_time', String(SEG), '-hls_playlist_type', 'vod', '-hls_flags', 'independent_segments',
    '-hls_segment_filename', path.join(OUT, 'r%v', 's%04d.ts'),
    '-master_pl_name', 'master.m3u8',
    '-var_stream_map', LADDER.map((_, i) => `v:${i},a:${i}`).join(' '),
    path.join(OUT, 'r%v', 'index.m3u8'));
  for (let i = 0; i < LADDER.length; i++) mkdirSync(path.join(OUT, `r${i}`), { recursive: true });
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
}
// the browser's own player starts on the first variant: hd/sd/lite playlists
execFileSync('node', [path.join(import.meta.dirname, 'masters.mjs'), OUT], { stdio: 'inherit' });
/* A plain mp4 for the rare browser with neither native HLS nor MSE, and for
   "download / forward on WhatsApp": the 540p rung, fast-start. */
if (!existsSync(path.join(OUT, 'film-540.mp4'))) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', 'scale=540:960', '-c:v', 'libx264', '-preset', 'medium',
    '-b:v', '750k', '-maxrate', '900k', '-bufsize', '1500k', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-movflags', '+faststart',
    path.join(OUT, 'film-540.mp4')], { stdio: 'inherit' });
}
writeFileSync(path.join(OUT, 'film.json'), JSON.stringify({
  film: id, title: src.title, version: ver, duration, base: `${MEDIA_BASE}/${id}/${ver}`,
  hls: 'master.m3u8', playlists: { hd: 'hd.m3u8', sd: 'sd.m3u8', lite: 'lite.m3u8' }, mp4: 'film-540.mp4', poster: 'poster.jpg', captions: 'captions.hi.vtt', chapters, ladder: LADDER.map((r) => r.h),
}, null, 1));
console.log(`built ${OUT}`);

// ── upload ──────────────────────────────────────────────────────────────────
if (upload) {
  const env = Object.fromEntries(readFileSync(path.join(ROOT, '..', 'mdg-backend', '.env'), 'utf8').split('\n')
    .map((l) => l.match(/^(S3_ACCESS_KEY_ID|S3_SECRET_ACCESS_KEY)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]));
  const aws = { ...process.env, AWS_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION: REGION };
  delete aws.AWS_PROFILE;
  const dest = `s3://${BUCKET}/${id}/${ver}/`;
  const IMM = 'public, max-age=31536000, immutable';
  const run = (a) => execFileSync('aws', a, { stdio: 'inherit', env: aws });
  run(['s3', 'sync', OUT, dest, '--only-show-errors', '--exclude', '*', '--include', '*.ts', '--content-type', 'video/mp2t', '--cache-control', IMM]);
  run(['s3', 'sync', OUT, dest, '--only-show-errors', '--exclude', '*', '--include', '*.m3u8', '--content-type', 'application/vnd.apple.mpegurl', '--cache-control', IMM]);
  run(['s3', 'cp', path.join(OUT, 'film-540.mp4'), dest, '--only-show-errors', '--content-type', 'video/mp4', '--cache-control', IMM]);
  run(['s3', 'cp', path.join(OUT, 'poster.jpg'), dest, '--only-show-errors', '--content-type', 'image/jpeg', '--cache-control', IMM]);
  run(['s3', 'cp', path.join(OUT, 'captions.hi.vtt'), dest, '--only-show-errors', '--content-type', 'text/vtt; charset=utf-8', '--cache-control', IMM]);
  for (const f of ['film.json', 'chapters.json', 'timeline.json']) {
    run(['s3', 'cp', path.join(OUT, f), dest, '--only-show-errors', '--content-type', 'application/json; charset=utf-8', '--cache-control', IMM]);
  }
  console.log(`uploaded → ${MEDIA_BASE}/${id}/${ver}/master.m3u8`);
}

function round(n) { return Math.round(n * 100) / 100; }

/* One cue per phrase: split a line at its own punctuation into pieces of at
   most ~42 characters, and share the line's spoken time between the pieces by
   length — the narrator's pace is even enough that this lands within a word. */
function vtt(ls) {
  const ts = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${x.toFixed(3).padStart(6, '0')}`;
  };
  const cues = [];
  for (const l of ls) {
    const parts = phrase(l.hi.replace(/\s+/g, ' ').trim());
    const total = parts.reduce((n, p) => n + p.length, 0);
    let at = l.t;
    for (const p of parts) {
      const d = (l.end - l.t) * (p.length / total);
      cues.push(`${ts(at)} --> ${ts(Math.min(at + d, l.end))}\n${p}`);
      at += d;
    }
  }
  return `WEBVTT\n\n${cues.map((c, i) => `${i + 1}\n${c}`).join('\n\n')}\n`;
}
function phrase(s) {
  if (s.length <= 42) return [s];
  const bits = s.split(/(?<=[,।?!—])\s+/);
  const out = [];
  let cur = '';
  for (const b of bits) {
    if (cur && (cur + ' ' + b).length > 42) { out.push(cur); cur = b; } else cur = cur ? `${cur} ${b}` : b;
  }
  if (cur) out.push(cur);
  // a single phrase still too long: break at the word nearest its middle
  return out.flatMap((p) => {
    if (p.length <= 50) return [p];
    const mid = p.lastIndexOf(' ', Math.floor(p.length / 2) + 6);
    return mid > 0 ? [p.slice(0, mid), p.slice(mid + 1)] : [p];
  });
}
