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
  name: 'tiny' | 'low' | 'high';
  /**
   * The constrained side, in pixels: the width of a portrait master, the height
   * of a landscape one. The other side follows the master's own aspect, so a rung
   * costs about the same number of pixels either way round.
   */
  short: number;
  crf: number;
  maxrate: string;
  audioKbps: number;
  /** H.264 profile. Baseline decodes on literally anything still in the field. */
  profile: string;
}

/**
 * The ladder the player adapts across, cheapest first.
 *
 * `tiny` exists so automatic switching has somewhere to fall on a genuinely bad
 * connection: at ~62 kbps it streams over 2G, and while the phone UI inside the
 * frame goes soft, the burned-in caption — the actual information channel, with
 * the narration carrying the rest — stays readable. It is an emergency floor the
 * player drops to on its own, never something a viewer is asked to choose.
 *
 * The rungs are written as one number rather than a pair because the library is no
 * longer all one shape: the dealer tutorials are 1080x1920 phone screens, the admin
 * ones are 1920x1080 desktop screens. `short` + the master's aspect reproduces the
 * dealer ladder exactly (240x426, 360x640, 720x1280) and gives the admin videos its
 * mirror (426x240, 640x360, 1280x720).
 */
const RENDITIONS: Rendition[] = [
  {
    name: 'tiny',
    short: 240,
    crf: 32,
    maxrate: '130k',
    audioKbps: 24,
    profile: 'baseline',
  },
  {
    name: 'low',
    short: 360,
    crf: 30,
    maxrate: '260k',
    audioKbps: 32,
    profile: 'main',
  },
  {
    name: 'high',
    short: 720,
    crf: 26,
    maxrate: '900k',
    audioKbps: 64,
    profile: 'main',
  },
];

type Orientation = 'portrait' | 'landscape';

interface Frame {
  width: number;
  height: number;
  orientation: Orientation;
}

/** h.264 needs even dimensions; nearest-even is also what ffmpeg's `-2` picks. */
const even = (n: number) => Math.round(n / 2) * 2;

/**
 * The size of a rung for a given master.
 *
 * Portrait pins the width and lets the height follow; landscape does the reverse.
 * Nothing here ever changes the aspect — the numbers are *derived* from the master,
 * which is what keeps a 16:9 admin screen from arriving squashed into a 9:16 box.
 */
function sizeFor(frame: Frame, r: Rendition): { width: number; height: number } {
  return frame.orientation === 'landscape'
    ? { width: even((r.short * frame.width) / frame.height), height: r.short }
    : { width: r.short, height: even((r.short * frame.height) / frame.width) };
}

async function probeDuration(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  const n = Number.parseFloat(stdout.trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * The master's own frame size, which decides the whole shape of its output.
 *
 * Asked rather than assumed: the library used to be portrait-only, and the first
 * time that stopped being true a hardcoded 9:16 ladder would have squashed a
 * desktop screen into a phone without saying a word about it.
 */
async function probeFrame(file: string): Promise<Frame> {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-of',
    'csv=p=0:s=x',
    file,
  ]);
  const [w, h] = stdout.trim().split('x').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error(`Could not read the frame size of ${file}`);
  }
  return { width: w, height: h, orientation: w > h ? 'landscape' : 'portrait' };
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
      const dur = await probeDuration(path.join(ROOT, 'public', 'audio', t.id, `${scene.id}.mp3`));
      if (dur > 0) seconds = dur;
    } catch {
      // No voiceover for this scene — fall back to the estimate, exactly as the
      // renderer does, so the offsets still match the video that was rendered.
    }
    cursor += seconds + TAIL_SECONDS;
  }

  return offsets;
}

async function encode(src: string, dest: string, r: Rendition, frame: Frame): Promise<void> {
  const bufsize = `${Number.parseInt(r.maxrate, 10) * 2}k`;
  const { width, height } = sizeFor(frame, r);
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    src,
    // `force_original_aspect_ratio=decrease` + pad rather than a bare `scale=W:H`:
    // the target is already derived from this master's aspect, so the pad is a
    // no-op in practice — but it means a master of an unexpected shape gets bars
    // instead of a stretched picture, which is the failure you can actually see.
    '-vf',
    `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
    // Main profile + yuv420p: hardware-decodable on essentially every Android
    // phone still in the field. VP9/AV1 would be smaller but fall back to
    // software decode on cheap chipsets, which is exactly the device we care about.
    '-c:v',
    'libx264',
    '-profile:v',
    'main',
    '-level',
    '3.1',
    '-preset',
    'veryslow',
    '-crf',
    String(r.crf),
    '-maxrate',
    r.maxrate,
    '-bufsize',
    bufsize,
    '-g',
    '60',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-ac',
    '1',
    '-b:a',
    `${r.audioKbps}k`,
    // Puts the moov atom first so playback can start on the first bytes instead
    // of waiting for the whole file — the difference between "plays" and "spins"
    // on a slow connection.
    '-movflags',
    '+faststart',
    dest,
  ]);
}

/**
 * A frame from partway in, so the thumbnail shows the app rather than a title card.
 *
 * The thumb and poster are pinned by width and take whatever height the master's
 * aspect gives them (`-2`), so a landscape video simply produces a short, wide
 * still. Only og.jpg is a fixed 1200x630 — link previews demand that shape — and it
 * letterboxes onto the page background rather than cropping.
 */
/**
 * Not every ffmpeg build ships libwebp — Homebrew's current bottle does not, and
 * a missing encoder used to kill the whole publish halfway through, after the
 * mp4 rungs were already written. When it is absent we cut a PNG and hand it to
 * the standalone `cwebp` (which the same Homebrew `webp` formula provides), so
 * the OUTPUT is byte-comparable either way and the pipeline works on any box.
 */
let webpMode: 'ffmpeg' | 'cwebp' | null = null;

async function detectWebp(): Promise<'ffmpeg' | 'cwebp'> {
  if (webpMode) return webpMode;
  try {
    const { stdout } = await run('ffmpeg', ['-hide_banner', '-encoders']);
    if (/\blibwebp\b/.test(stdout)) {
      webpMode = 'ffmpeg';
      return webpMode;
    }
  } catch {
    /* fall through to cwebp */
  }
  try {
    await run('cwebp', ['-version']);
  } catch {
    throw new Error(
      'No WebP encoder available: this ffmpeg lacks libwebp and `cwebp` is not on PATH. ' +
        'Install it with `brew install webp` (macOS) or `apt install webp` (Debian).',
    );
  }
  webpMode = 'cwebp';
  return webpMode;
}

/** One still, scaled to `width`, written as WebP by whichever encoder we have. */
async function webpStill(
  src: string,
  ss: string,
  width: number,
  quality: number,
  dest: string,
): Promise<void> {
  const mode = await detectWebp();
  const scale = `scale=${width}:-2`;
  if (mode === 'ffmpeg') {
    await run('ffmpeg', [
      '-y', '-v', 'error', '-ss', ss, '-i', src,
      '-frames:v', '1', '-vf', scale,
      '-c:v', 'libwebp', '-quality', String(quality),
      dest,
    ]);
    return;
  }
  const tmp = `${dest}.png`;
  await run('ffmpeg', [
    '-y', '-v', 'error', '-ss', ss, '-i', src,
    '-frames:v', '1', '-vf', scale, tmp,
  ]);
  try {
    await run('cwebp', ['-quiet', '-q', String(quality), tmp, '-o', dest]);
  } finally {
    await rm(tmp, { force: true });
  }
}

async function stills(src: string, dir: string, at: number): Promise<void> {
  const ss = String(Math.max(0, at));
  await webpStill(src, ss, 240, 72, path.join(dir, 'thumb.webp'));
  await webpStill(src, ss, 540, 76, path.join(dir, 'poster.webp'));
  // Link previews (these get forwarded on WhatsApp) want a landscape JPEG.
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-ss',
    ss,
    '-i',
    src,
    '-frames:v',
    '1',
    '-vf',
    'scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:color=0xfafaf9',
    '-q:v',
    '6',
    path.join(dir, 'og.jpg'),
  ]);
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

/**
 * `--only a,b` restricts the re-encode to those tutorial ids. Every rendition
 * filename is content-hashed, so re-encoding an unchanged master still produces
 * new hashes and churns tens of megabytes of COMMITTED media for no reason.
 * Publishing one new video should touch one directory.
 *
 * Ids that are skipped keep their existing rows in `site/data/videos.json`
 * verbatim, so the manifest stays complete.
 */
function onlyIds(): Set<string> | null {
  const i = process.argv.indexOf('--only');
  if (i === -1) return null;
  const raw = process.argv[i + 1];
  if (!raw) throw new Error('--only needs a comma-separated list of tutorial ids');
  const ids = new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
  const known = new Set(TUTORIALS.map((t) => t.id));
  const unknown = [...ids].filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `--only: unknown tutorial id(s): ${unknown.join(', ')}. ` +
        `Known: ${[...known].join(', ')}`,
    );
  }
  return ids;
}

/** Existing manifest rows, so a partial run can carry the untouched ones over. */
async function existingManifest(): Promise<Map<string, unknown>> {
  try {
    const raw = await readFile(path.join(DATA, 'videos.json'), 'utf8');
    const rows = JSON.parse(raw) as { id: string }[];
    return new Map(rows.map((r) => [r.id, r]));
  } catch {
    return new Map();
  }
}

async function main() {
  await mkdir(MEDIA, { recursive: true });
  await mkdir(DATA, { recursive: true });

  const only = onlyIds();
  const previous = await existingManifest();
  const manifest: unknown[] = [];

  for (const t of TUTORIALS) {
    if (only && !only.has(t.id)) {
      const kept = previous.get(t.id);
      if (kept) {
        manifest.push(kept);
        console.log(`\n${t.id}  — skipped (--only), keeping existing manifest row`);
      } else {
        console.log(`\n${t.id}  — skipped (--only), no existing manifest row`);
      }
      continue;
    }
    const src = path.join(OUT, `${t.id}.mp4`);
    const dir = path.join(MEDIA, t.id);
    // Wipe first: the filenames are content-hashed, so a re-run would otherwise
    // pile new copies on top of the old ones.
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const duration = await probeDuration(src);
    const frame = await probeFrame(src);
    const chapters = await sceneOffsets(t);
    console.log(
      `\n${t.id}  (${duration.toFixed(1)}s, ${chapters.length} chapters, ` +
        `${frame.width}x${frame.height} ${frame.orientation})`,
    );

    const sizes: Record<string, number> = {};
    const src_: Record<string, string> = {};
    for (const r of RENDITIONS) {
      const dest = path.join(dir, `${r.name}.mp4`);
      await encode(src, dest, r, frame);
      const { size: bytes } = await stat(dest);
      sizes[r.name] = bytes;
      src_[r.name] = await fingerprint(dir, `${r.name}.mp4`, t.id);
      const { width, height } = sizeFor(frame, r);
      console.log(`  ${r.name.padEnd(5)} ${width}x${height}  ${(bytes / 1048576).toFixed(2)} MB`);
    }

    // Poster frame: a little way into the middle scene. Anchoring to a scene
    // start (rather than a raw percentage) lands on a settled, fully-composed
    // frame; the middle one is past the title card and into the actual UI.
    const mid = chapters[Math.floor(chapters.length / 2)];
    await stills(src, dir, Math.min((mid?.start ?? duration * 0.45) + 2, duration - 1));

    manifest.push({
      id: t.id,
      duration: Math.round(duration),
      // The site sizes its player and its thumbnails from these, so a landscape
      // video is never poured into a portrait box.
      orientation: frame.orientation,
      width: frame.width,
      height: frame.height,
      sizes,
      src: src_,
      poster: await fingerprint(dir, 'poster.webp', t.id),
      thumb: await fingerprint(dir, 'thumb.webp', t.id),
      og: await fingerprint(dir, 'og.jpg', t.id),
      chapters: chapters.map((c) => ({ id: c.id, start: c.start })),
    });
  }

  await writeFile(path.join(DATA, 'videos.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const total = manifest.reduce<number>(
    (a, v) => a + ((v as { sizes?: { low?: number } }).sizes?.low ?? 0),
    0,
  );
  console.log(`\nWrote site/data/videos.json`);
  console.log(`Whole library at data-saver quality: ${(total / 1048576).toFixed(1)} MB`);
}

await main();
