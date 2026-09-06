import 'dotenv/config';
import { createSign } from 'node:crypto';
import { constants , readFileSync } from 'node:fs';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { BROLL, brollPath } from '../src/marketing/broll';

/**
 * Generates the marketing film's B-roll photographs with Vertex AI.
 *
 *   npm run broll                 # render any shot that is missing
 *   npm run broll -- --force      # re-render everything
 *   npm run broll -- --only gate-arrival,pump-night
 *
 * Prompts live in `src/marketing/broll.ts`; this file only moves bytes. Existing
 * files are skipped, so adding a scene costs one image rather than fourteen —
 * the same contract as `npm run voice`.
 *
 * ── AUTH ──────────────────────────────────────────────────────────────────
 * Vertex does not take an API key, and the AI-Studio-style key that looks like
 * it would bills a different meter that the Cloud credit does not cover. So this
 * mints a real OAuth token from the same service-account key the assistant uses
 * (`mdg-backend/src/assist/llm/googleAuth.ts`). The JWT is signed with node's
 * own crypto rather than a library, because this project has no need of one.
 *
 * ── MODEL ─────────────────────────────────────────────────────────────────
 * `gemini-2.5-flash-image` at `locations/global`. Probed 2026-08-28: Imagen and
 * Veo publisher models are BOTH 404 on this project in every region tried, so
 * there is no generated video and no Imagen fallback. That is fine — the motion
 * in the film comes from camera moves over these stills, which is what B-roll
 * under a caption wants anyway. If Veo is ever enabled, it lands here.
 */

const KEY_FILE = process.env.VERTEX_SA_KEY_FILE || `${process.env.HOME}/mdg-assist-key.json`;
const MODEL = process.env.BROLL_MODEL || 'gemini-2.5-flash-image';
const LOCATION = process.env.BROLL_LOCATION || 'global';

const FORCE = process.argv.includes('--force');
const onlyArg = process.argv.indexOf('--only');
const ONLY =
  onlyArg >= 0 && process.argv[onlyArg + 1]
    ? new Set(process.argv[onlyArg + 1].split(',').map((s) => s.trim()))
    : null;

const PUBLIC = path.resolve(process.cwd(), 'public');

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
}

function loadKey(): ServiceAccountKey {
  try {
    return JSON.parse(readFileSync(KEY_FILE, 'utf8')) as ServiceAccountKey;
  } catch {
    throw new Error(
      `Could not read the service-account key at ${KEY_FILE}.\n` +
        '  Set VERTEX_SA_KEY_FILE, or put the key where the assistant keeps it.\n' +
        '  It needs roles/aiplatform.user on the Vertex project.',
    );
  }
}

function b64url(value: string | object): string {
  return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString(
    'base64url',
  );
}

async function accessToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'RS256', typ: 'JWT' });
  const claims = b64url({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: key.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  signer.end();
  const assertion = `${header}.${claims}.${signer.sign(key.private_key).toString('base64url')}`;

  const res = await fetch(key.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = (await res.json()) as { access_token?: string; error_description?: string };
  if (!body.access_token) {
    throw new Error(`token exchange failed: ${body.error_description ?? JSON.stringify(body)}`);
  }
  return body.access_token;
}

/** The `global` endpoint drops the region prefix from the host but keeps it in the path. */
function endpoint(project: string): string {
  const host =
    LOCATION === 'global'
      ? 'https://aiplatform.googleapis.com'
      : `https://${LOCATION}-aiplatform.googleapis.com`;
  return `${host}/v1/projects/${project}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function generate(token: string, project: string, prompt: string): Promise<Buffer> {
  const res = await fetch(endpoint(project), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '9:16' },
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
    /* 429 is the normal state of this project, not an exception: it runs on
       default per-minute Vertex quotas and a run of fourteen images will trip
       them. Mark it so the caller backs off instead of giving up on the shot. */
    (err as Error & { retryable?: boolean }).retryable = res.status === 429 || res.status >= 500;
    throw err;
  }

  const json = JSON.parse(text) as {
    candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[];
  };
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) {
    /* A refusal comes back as a normal 200 with only a text part, so this is the
       branch a blocked prompt lands in. Say so, rather than "undefined". */
    throw new Error('the model returned no image — the prompt was probably refused');
  }
  return Buffer.from(part.inlineData.data, 'base64');
}

async function main() {
  const key = loadKey();
  const token = await accessToken(key);
  const dir = path.join(PUBLIC, 'broll');
  await mkdir(dir, { recursive: true });

  console.log(`Model: ${MODEL}  ·  ${LOCATION}  ·  project ${key.project_id}\n`);

  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (const s of BROLL) {
    if (ONLY && !ONLY.has(s.id)) continue;
    const abs = path.join(PUBLIC, brollPath(s.id));
    if (!FORCE && (await exists(abs))) {
      skipped++;
      console.log(`  · skip  ${s.id}`);
      continue;
    }
    process.stdout.write(`  ▸ ${s.id} … `);
    let saved = false;
    /* Four attempts with a growing wait. The quota window is per MINUTE, so the
       backoff has to be measured in tens of seconds to be worth anything — a
       one-second retry just spends another unit of a budget that is already
       empty. */
    for (let attempt = 0; attempt < 4 && !saved; attempt++) {
      try {
        const buf = await generate(token, key.project_id, s.prompt);
        await writeFile(abs, buf);
        saved = true;
        made++;
        console.log(`ok (${Math.round(buf.length / 1024)} KB)`);
      } catch (err) {
        const e = err as Error & { retryable?: boolean };
        if (e.retryable && attempt < 3) {
          const wait = 20_000 * (attempt + 1);
          process.stdout.write(`quota, waiting ${wait / 1000}s … `);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        failed++;
        console.log('FAILED');
        console.error('    ', e.message);
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nDone. ${made} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

await main();
