import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { TUTORIALS, type Tutorial } from '../src/narration';

const run = promisify(execFile);

/**
 * Turns the rendered out/<id>.mp4 masters into everything the guide site
 * (site/) serves, and writes site/data/videos.json.
 *
 * The site is deployed as pure static files with no build-time ffmpeg, so this
 * runs locally and its output is committed. Re-run it after `npm run render`.
 *
 * The two renditions exist because the audience is fuel-pump dealers on low-end
 * Android over 2G/3G. "low" is the one that has to work on a bad day: the source
 * is synthetic UI (flat colour, mostly static), so 360x640 still renders the
 * Devanagari captions legibly at roughly 90 kbps.
 */

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'out');
const MEDIA = path.join(ROOT, 'site', 'public', 'media');
const DATA = path.join(ROOT, 'site', 'data');

/** Must match TAIL_SECONDS in src/lib/calc.ts, or the chapters drift. */
const TAIL_SECONDS = 0.5;

interface Rendition {
  name: 'low' | 'high';
  width: number;
  height: number;
  crf: number;
  maxrate: string;
  audioKbps: number;
}

const RENDITIONS: Rendition[] = [
  { name: 'low', width: 360, height: 640, crf: 30, maxrate: '260k', audioKbps: 32 },
  { name: 'high', width: 720, height: 1280, crf: 26, maxrate: '900k', audioKbps: 64 },
];

async function probeDuration(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  const n = Number.parseFloat(stdout.trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Rebuilds the scene timeline the same way calculateMetadata does — each scene
 * lasts exactly as long as its voiceover plus the tail — so a chapter timestamp
 * lands on the frame where that step actually starts.
 */
async function sceneOffsets(t: Tutorial): Promise<{ id: string; start: number }[]> {
  const offsets: { id: string; start: number }[] = [];
  let cursor = 0;

  for (const scene of t.scenes) {
    offsets.push({ id: scene.id, start: Math.round(cursor * 10) / 10 });
    let seconds = scene.estSeconds;
    try {
      const dur = await probeDuration(
        path.join(ROOT, 'public', 'audio', t.id, `${scene.id}.mp3`),
      );
      if (dur > 0) seconds = dur;
    } catch {
      // No voiceover for this scene — fall back to the estimate, exactly as the
      // renderer does, so the offsets still match the video that was rendered.
    }
    cursor += seconds + TAIL_SECONDS;
  }

  return offsets;
}

async function encode(src: string, dest: string, r: Rendition): Promise<void> {
  const bufsize = `${Number.parseInt(r.maxrate, 10) * 2}k`;
  await run('ffmpeg', [
    '-y', '-v', 'error',
    '-i', src,
    '-vf', `scale=${r.width}:${r.height}:flags=lanczos`,
    // Main profile + yuv420p: hardware-decodable on essentially every Android
    // phone still in the field. VP9/AV1 would be smaller but fall back to
    // software decode on cheap chipsets, which is exactly the device we care about.
    '-c:v', 'libx264',
    '-profile:v', 'main',
    '-level', '3.1',
    '-preset', 'veryslow',
    '-crf', String(r.crf),
    '-maxrate', r.maxrate,
    '-bufsize', bufsize,
    '-g', '60',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-ac', '1',
    '-b:a', `${r.audioKbps}k`,
    // Puts the moov atom first so playback can start on the first bytes instead
    // of waiting for the whole file — the difference between "plays" and "spins"
    // on a slow connection.
    '-movflags', '+faststart',
    dest,
  ]);
}

/** A frame from partway in, so the thumbnail shows the app rather than a title card. */
async function stills(src: string, dir: string, at: number): Promise<void> {
  const ss = String(Math.max(0, at));
  await run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', src,
    '-frames:v', '1', '-vf', 'scale=240:-2', '-c:v', 'libwebp', '-quality', '72',
    path.join(dir, 'thumb.webp')]);
  await run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', src,
    '-frames:v', '1', '-vf', 'scale=540:-2', '-c:v', 'libwebp', '-quality', '76',
    path.join(dir, 'poster.webp')]);
  // Link previews (these get forwarded on WhatsApp) want a landscape JPEG.
  await run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', src,
    '-frames:v', '1',
    '-vf', 'scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:color=0xfafaf9',
    '-q:v', '6',
    path.join(dir, 'og.jpg')]);
}

/**
 * Renames a file to include a hash of its own bytes and returns the public URL.
 *
 * That is what makes `Cache-Control: immutable` honest: a re-render produces a new
 * filename, so a viewer can never be served a stale video out of their cache, and
 * a video they already have never gets re-downloaded. Worth the ceremony on a
 * connection where re-fetching 2 MB is a real cost.
 */
async function fingerprint(dir: string, file: string, id: string): Promise<string> {
  const full = path.join(dir, file);
  const hash = createHash('sha256')
    .update(await readFile(full))
    .digest('hex')
    .slice(0, 8);
  const ext = path.extname(file);
  const hashed = `${path.basename(file, ext)}.${hash}${ext}`;
  await rename(full, path.join(dir, hashed));
  return `/media/${id}/${hashed}`;
}

async function main() {
  await mkdir(MEDIA, { recursive: true });
  await mkdir(DATA, { recursive: true });

  const manifest = [];

  for (const t of TUTORIALS) {
    const src = path.join(OUT, `${t.id}.mp4`);
    const dir = path.join(MEDIA, t.id);
    // Wipe first: the filenames are content-hashed, so a re-run would otherwise
    // pile new copies on top of the old ones.
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const duration = await probeDuration(src);
    const chapters = await sceneOffsets(t);
    console.log(`\n${t.id}  (${duration.toFixed(1)}s, ${chapters.length} chapters)`);

    const sizes: Record<string, number> = {};
    const src_: Record<string, string> = {};
    for (const r of RENDITIONS) {
      const dest = path.join(dir, `${r.name}.mp4`);
      await encode(src, dest, r);
      const { size: bytes } = await stat(dest);
      sizes[r.name] = bytes;
      src_[r.name] = await fingerprint(dir, `${r.name}.mp4`, t.id);
      console.log(`  ${r.name.padEnd(5)} ${r.width}x${r.height}  ${(bytes / 1048576).toFixed(2)} MB`);
    }

    // Poster frame: a little way into the middle scene. Anchoring to a scene
    // start (rather than a raw percentage) lands on a settled, fully-composed
    // frame; the middle one is past the title card and into the actual UI.
    const mid = chapters[Math.floor(chapters.length / 2)];
    await stills(src, dir, Math.min((mid?.start ?? duration * 0.45) + 2, duration - 1));

    manifest.push({
      id: t.id,
      duration: Math.round(duration),
      sizes,
      src: src_,
      poster: await fingerprint(dir, 'poster.webp', t.id),
      thumb: await fingerprint(dir, 'thumb.webp', t.id),
      og: await fingerprint(dir, 'og.jpg', t.id),
      chapters: chapters.map((c) => ({ id: c.id, start: c.start })),
    });
  }

  await writeFile(
    path.join(DATA, 'videos.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  const total = manifest.reduce((a, v) => a + v.sizes.low, 0);
  console.log(`\nWrote site/data/videos.json`);
  console.log(`Whole library at data-saver quality: ${(total / 1048576).toFixed(1)} MB`);
}

await main();
