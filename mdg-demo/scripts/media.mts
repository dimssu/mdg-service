import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * Moves the video library between this laptop and S3.
 *
 *   npm run media:push          # everything: published media + the build inputs
 *   npm run media:push -- --published-only
 *   npm run media:pull          # restore onto a fresh machine
 *   npm run media:push -- --dry-run
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * Two separate problems, one bucket.
 *
 * THE FIRST is that the published media was committed to git. 125 MB for twelve
 * videos, in a repository whose whole .git is 170 MB. The library is going to
 * roughly seventy videos, which is about half a gigabyte that every clone, every
 * CI checkout and every deploy would carry forever — and git keeps it forever
 * even after a later delete, because history is not a working tree. So the
 * encoded renditions move out to S3 and the site points at them.
 *
 * THE SECOND is worse and quieter. The *inputs* — the rendered masters in
 * `out/`, the ElevenLabs voiceovers in `public/audio/`, the generated B-roll
 * photographs in `public/broll/` — are correctly gitignored, because they are
 * big and generated. But "generated" is doing a lot of work in that sentence.
 * A voiceover costs money to regenerate and only comes back identical because
 * the same text hits the same model. A B-roll photograph does NOT come back
 * identical: image generation is not deterministic, so re-running `npm run
 * broll` gives you a *different photograph of a different forecourt*, and the
 * film quietly stops looking like itself. Right now the only copy of the entire
 * film's visual identity is one laptop's filesystem. That is a backup problem
 * wearing a build-artefact costume.
 *
 * ── THE LAYOUT ─────────────────────────────────────────────────────────────
 *
 *   guide/media/<id>/<rung>.<hash>.mp4     PUBLIC. What the guide site serves.
 *   guide/masters/<id>.mp4                 private. Rendered masters.
 *   guide/audio/<id>/<scene>.mp3           private. The voiceovers.
 *   guide/broll/<id>.png                   private. The film's photographs.
 *
 * Only `guide/media/` is reachable without credentials, and only by exact key.
 * The bucket policy allows `s3:GetObject` on exactly
 * `arn:aws:s3:::mdg-chat/guide/media/*` and nothing else, so listing is refused
 * and every other prefix in the bucket (chat attachments, shift slips, the
 * papers dealers send, the knowledge base) stays exactly as private as it was.
 *
 * MIND THE STAR. The policy was first written against `guide/*`, which reads
 * like "the guide's files" and actually means every one of the four directories
 * below it — so the masters, the voiceovers and the B-roll were all anonymously
 * downloadable by exact key, while this comment claimed they were not. Nothing
 * sensitive was in them, but a resource ARN one path segment too short is the
 * cheapest possible way to publish something you did not mean to. If this policy
 * is ever edited, re-run the anonymous check below rather than reading it.
 *
 *   for u in guide/media/<a real file> guide/masters/login.mp4 \
 *            guide/audio/login/intro.mp3 assist/kb/<any>/chunks.json; do
 *     curl -s -o /dev/null -w "$u -> %{http_code}\n" \
 *       "https://mdg-chat.s3.ap-south-1.amazonaws.com/$u"
 *   done
 *
 * Expected: the first 200, everything after it 403. Run it with no AWS
 * environment variables set, or you are testing your own credentials rather
 * than the policy.
 *
 * The masters, audio and B-roll live under the same `guide/` prefix but outside
 * the public one, so they are only reachable with the account's credentials.
 * Nothing links to them; they are a restore path.
 *
 * ── CACHING ────────────────────────────────────────────────────────────────
 *
 * Published media is uploaded `public, max-age=31536000, immutable`, which is
 * only safe because `build-guide-media.mts` names every file after a hash of its
 * own bytes. A re-render writes a NEW name, so a year-long cache can never serve
 * a stale video — it can only serve a video that is still correct. The masters
 * and inputs get no such header; they are never fetched by a browser.
 *
 * ── CREDENTIALS ────────────────────────────────────────────────────────────
 *
 * Read from the environment first. Failing that, from `../mdg-backend/.env`,
 * which is where this account's keys already live. Copying a secret into a
 * second .env file so that a video script can have its own is a worse outcome
 * than reaching across for the one that exists.
 */

const ROOT = path.resolve(process.cwd());
const BUCKET = process.env.GUIDE_S3_BUCKET || 'mdg-chat';
const REGION = process.env.GUIDE_S3_REGION || 'ap-south-1';
const PREFIX = process.env.GUIDE_S3_PREFIX || 'guide';

const DRY = process.argv.includes('--dry-run');
const PUBLISHED_ONLY = process.argv.includes('--published-only');
const MODE = process.argv.includes('--pull') ? 'pull' : 'push';

/** A directory that is synced, and how. */
interface Sync {
  name: string;
  /** Local path, relative to mdg-demo/. */
  local: string;
  /** Key prefix under `guide/`. */
  remote: string;
  /**
   * Whether a browser fetches this directly. Public objects get the immutable
   * cache header; private ones get nothing, because nothing should be asking.
   */
  published: boolean;
  /** Skip silently when the directory is not there (a fresh clone has no out/). */
  optional?: boolean;
}

const SYNCS: Sync[] = [
  { name: 'published renditions', local: 'site/public/media', remote: 'media', published: true },
  { name: 'rendered masters', local: 'out', remote: 'masters', published: false, optional: true },
  { name: 'voiceovers', local: 'public/audio', remote: 'audio', published: false, optional: true },
  { name: 'B-roll photographs', local: 'public/broll', remote: 'broll', published: false, optional: true },
];

/** Parse KEY=VALUE out of a .env without pulling in a dependency for it. */
async function readEnvFile(file: string): Promise<Record<string, string>> {
  try {
    const text = await readFile(file, 'utf8');
    const out: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!m) continue;
      out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
    return out;
  } catch {
    return {};
  }
}

async function credentials(): Promise<Record<string, string>> {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: REGION,
    };
  }
  const backendEnv = path.resolve(ROOT, '..', 'mdg-backend', '.env');
  const env = await readEnvFile(backendEnv);
  if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error(
      'No AWS credentials.\n' +
        '  Either export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY,\n' +
        `  or make sure ${backendEnv} carries S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.`,
    );
  }
  return {
    AWS_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION: env.S3_REGION || REGION,
  };
}

/**
 * `aws s3 sync` with the flags this job needs.
 *
 * `--size-only` and not the default mtime+size comparison: every published file
 * is named after a hash of its contents, so a name that already exists on the
 * far side is byte-identical by construction. Comparing timestamps would
 * re-upload the whole library after any checkout that touched mtimes.
 *
 * NO `--delete`. A rendition that disappears locally is far more likely to be a
 * half-finished re-render than a deliberate retirement, and deleting the live
 * copy would break links already circulating on WhatsApp. Retiring a video is a
 * deliberate `aws s3 rm`, not a side effect of running a sync.
 */
async function sync(s: Sync, creds: Record<string, string>): Promise<void> {
  const local = path.resolve(ROOT, s.local);
  const remote = `s3://${BUCKET}/${PREFIX}/${s.remote}/`;

  const args = ['s3', 'sync', '--size-only', '--no-progress'];
  if (MODE === 'push') {
    args.push(local, remote);
    if (s.published) {
      args.push('--cache-control', 'public, max-age=31536000, immutable');
    }
    // `out/` holds stills (s*.png) beside the masters; only the videos belong.
    if (s.remote === 'masters') args.push('--exclude', '*', '--include', '*.mp4');
  } else {
    args.push(remote, local);
  }
  if (DRY) args.push('--dryrun');

  const label = `${s.name.padEnd(22)} ${MODE === 'push' ? '→' : '←'} ${PREFIX}/${s.remote}/`;
  try {
    const { stdout } = await run('aws', args, {
      env: { ...process.env, ...creds },
      maxBuffer: 64 * 1024 * 1024,
    });
    const lines = stdout.trim().split('\n').filter(Boolean);
    console.log(`  ${label}  ${lines.length} file(s)`);
    for (const line of lines.slice(0, 5)) console.log(`      ${line}`);
    if (lines.length > 5) console.log(`      … and ${lines.length - 5} more`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (s.optional && /does not exist|No such file/i.test(msg)) {
      console.log(`  ${label}  skipped (no local directory)`);
      return;
    }
    throw new Error(`${s.name}: ${msg}`);
  }
}

async function main(): Promise<void> {
  const creds = await credentials();
  const jobs = PUBLISHED_ONLY ? SYNCS.filter((s) => s.published) : SYNCS;

  console.log(
    `\n${MODE === 'push' ? 'Pushing' : 'Pulling'} guide media ` +
      `${MODE === 'push' ? 'to' : 'from'} s3://${BUCKET}/${PREFIX}/` +
      `${DRY ? '   (DRY RUN — nothing is written)' : ''}\n`,
  );

  for (const s of jobs) await sync(s, creds);

  const base = `https://${BUCKET}.s3.${creds.AWS_DEFAULT_REGION}.amazonaws.com/${PREFIX}/media`;
  console.log(
    `\nDone.\n\n` +
      `  Public media base:  ${base}\n` +
      `  Point the site at it:  GUIDE_MEDIA_BASE=${base} node scripts/build.mjs\n` +
      `  Masters, voiceovers and B-roll are under the same prefix but are NOT public.\n`,
  );
}

await main();
