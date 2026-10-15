/**
 * Turns an approved still into its clip with Veo on Vertex AI.
 *
 *   node marketing/animate.mjs P01-dod-deadline
 *   node marketing/animate.mjs P01-dod-deadline --model fast
 *
 * The still is the first frame, so the clip cannot drift away from a picture
 * that has already been approved — the man stays the man. `shoot.mjs` draws the
 * frame, this moves it, and the two are deliberately separate steps because the
 * drawing is cheap and this is not.
 *
 * ── WHICH MODELS ARE REAL ──────────────────────────────────────────────────
 * Probed 14 Sep 2026: `veo-3.1-generate-001`, `veo-3.1-fast-generate-001` and
 * `veo-3.1-lite-generate-001`. Veo 3.0 and 2.0 are 404 — 3.1 replaced them, so
 * every older name in a tutorial will look like a permissions problem and is
 * not one. Imagen is still 404 across the whole account; images come from
 * `gemini-2.5-flash-image`.
 *
 * ── A CALL THAT SUCCEEDS HAS ALREADY SPENT MONEY ───────────────────────────
 * `predictLongRunning` starts the job on the spot. There is no dry run, and a
 * probe that returns an operation name has already been charged for. Hence
 * `--yes`: nothing here generates unless it is asked for by name.
 *
 * ── NO AUDIO ───────────────────────────────────────────────────────────────
 * `generateAudio: false`, always. The film carries a recorded Hindi voice over
 * the whole cut; a per-clip soundtrack invented by the model would fight it,
 * and switching it off is cheaper.
 */

import { createSign } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const SHOTS = path.join(ROOT, 'shots');
const CLIPS = path.join(ROOT, 'clips');
const KEY_FILE = process.env.VERTEX_SA_KEY_FILE || `${process.env.HOME}/mdg-assist-key.json`;
const LOCATION = 'us-central1';

const MODELS = {
  best: 'veo-3.1-generate-001',
  fast: 'veo-3.1-fast-generate-001',
  lite: 'veo-3.1-lite-generate-001',
};

const b64url = (v) =>
  Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url({ alg: 'RS256', typ: 'JWT' });
  const c = b64url({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: key.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const s = createSign('RSA-SHA256');
  s.update(`${h}.${c}`);
  s.end();
  const assertion = `${h}.${c}.${s.sign(key.private_key).toString('base64url')}`;
  const r = await fetch(key.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const b = await r.json();
  if (!b.access_token) throw new Error(`token exchange failed: ${JSON.stringify(b)}`);
  return b.access_token;
}

const base = (project, model) =>
  `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${project}/locations/${LOCATION}/publishers/google/models/${model}`;

const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

async function main() {
  const args = process.argv.slice(2);
  const id = args.find((a) => !a.startsWith('--'));
  const tier = args.includes('--model') ? args[args.indexOf('--model') + 1] : 'best';
  const model = MODELS[tier] ?? tier;
  const seconds = args.includes('--seconds') ? Number(args[args.indexOf('--seconds') + 1]) : 4;

  if (!id) throw new Error('Name a shot, e.g. P01-dod-deadline');

  const still = path.join(SHOTS, `${id}.png`);
  if (!existsSync(still)) throw new Error(`No approved still at marketing/shots/${id}.png`);
  const shot = JSON.parse(readFileSync(path.join(SHOTS, `${id}.json`), 'utf8'));

  /* The motion note is deliberately NOT the shot's `action`. That text described
     a picture to be drawn and is already true of the first frame; repeating it
     here reads as an instruction to stage the whole thing again, and the clip
     drifts off the still. This says only what MOVES. */
  const motion =
    shot.motion ??
    'Almost nothing moves. Hold the composition exactly as it is. A slow, barely perceptible push in. He breathes; he blinks once. No cuts, no camera shake, no new people or vehicles entering frame. Nobody speaks.';

  const key = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
  const token = await accessToken(key);

  console.log(`${model} · ${seconds}s · ${key.project_id}`);
  console.log(`first frame: marketing/shots/${id}.png\n`);

  const start = await fetch(`${base(key.project_id, model)}:predictLongRunning`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [
        {
          prompt: motion,
          image: {
            bytesBase64Encoded: readFileSync(still).toString('base64'),
            mimeType: 'image/png',
          },
        },
      ],
      parameters: {
        aspectRatio: '9:16',
        durationSeconds: seconds,
        sampleCount: 1,
        generateAudio: false,
        resolution: '1080p',
      },
    }),
  });

  const started = await start.json();
  if (!started.name) throw new Error(`could not start: ${JSON.stringify(started).slice(0, 400)}`);
  console.log('running…');

  for (let i = 0; i < 60; i++) {
    await wait(10);
    const r = await fetch(`${base(key.project_id, model)}:fetchPredictOperation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName: started.name }),
    });
    const op = await r.json();
    if (op.error) throw new Error(`Veo failed: ${JSON.stringify(op.error).slice(0, 400)}`);
    if (!op.done) {
      if (i % 3 === 2) console.log(`  … ${(i + 1) * 10}s`);
      continue;
    }

    const vid = op.response?.videos?.[0] ?? op.response?.generatedSamples?.[0]?.video;
    const b64 = vid?.bytesBase64Encoded;
    if (!b64) throw new Error(`finished with no video: ${JSON.stringify(op.response).slice(0, 400)}`);

    const out = path.join(CLIPS, `${id}.mp4`);
    writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log(`\n  → marketing/clips/${id}.mp4`);
    return;
  }
  throw new Error('gave up waiting after 10 minutes');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
