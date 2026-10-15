/**
 * The Veo call, shared by `animate.mjs` (one shot) and `build.mjs` (the film).
 *
 * Probed 14 Sep 2026: `veo-3.1-generate-001`, `veo-3.1-fast-generate-001` and
 * `veo-3.1-lite-generate-001` exist. Veo 3.0 and 2.0 are 404 — 3.1 replaced
 * them, so every older model name in a tutorial looks like a permissions
 * problem and is not one. Imagen is 404 across the whole account; the stills
 * come from `gemini-2.5-flash-image`.
 *
 * Two settings are not negotiable:
 *   · `generateAudio: false` — the film carries a recorded Hindi voice, and a
 *     soundtrack invented per clip would fight it. It is also half the price.
 *   · durations of 4, 6 or 8 seconds — Veo takes nothing else, which is why the
 *     voice is recorded first and the pictures cut to it.
 *
 * A call that succeeds has already spent money: `predictLongRunning` starts the
 * job on the spot and there is no dry run.
 */

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const LOCATION = 'us-central1';

export const MODELS = {
  best: 'veo-3.1-generate-001',
  fast: 'veo-3.1-fast-generate-001',
  lite: 'veo-3.1-lite-generate-001',
};

/** Veo accepts only these lengths. */
export const VEO_LENGTHS = [4, 6, 8];
export const clipFor = (s) => VEO_LENGTHS.find((n) => n >= s) ?? 8;

export function loadKey() {
  const f = process.env.VERTEX_SA_KEY_FILE || `${process.env.HOME}/mdg-assist-key.json`;
  return JSON.parse(readFileSync(f, 'utf8'));
}

const b64url = (v) =>
  Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

export async function accessToken(key) {
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

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

/**
 * Renders one clip and returns its bytes.
 *
 * `motion` must describe only what MOVES. Handing it the text that drew the
 * still reads as an instruction to stage the scene again, and the clip drifts
 * off a frame that has already been approved.
 */
export async function renderClip({ token, project, model, stillPath, motion, seconds }) {
  const url = base(project, model);

  let started;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${url}:predictLongRunning`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [
          {
            prompt: motion,
            image: {
              bytesBase64Encoded: readFileSync(stillPath).toString('base64'),
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
    const body = await res.json();
    if (body.name) {
      started = body;
      break;
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 5) {
      throw new Error(`could not start: ${JSON.stringify(body).slice(0, 300)}`);
    }
    await sleep(attempt * 15);
  }

  for (let i = 0; i < 80; i++) {
    await sleep(10);
    const r = await fetch(`${url}:fetchPredictOperation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName: started.name }),
    });
    const op = await r.json();
    if (op.error) throw new Error(`Veo failed: ${JSON.stringify(op.error).slice(0, 300)}`);
    if (!op.done) continue;
    const vid = op.response?.videos?.[0] ?? op.response?.generatedSamples?.[0]?.video;
    if (!vid?.bytesBase64Encoded) {
      throw new Error(`finished with no video: ${JSON.stringify(op.response).slice(0, 300)}`);
    }
    return Buffer.from(vid.bytesBase64Encoded, 'base64');
  }
  throw new Error('gave up waiting after 13 minutes');
}
