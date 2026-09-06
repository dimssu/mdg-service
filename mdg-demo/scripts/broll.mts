import 'dotenv/config';
import { createSign } from 'node:crypto';
import { createHash } from 'node:crypto';
import { constants , readFileSync } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { BROLL, brollPath } from '../src/marketing/broll';

/**
 * Generates the marketing film's B-roll photographs with Vertex AI.
 *
 *   npm run broll                 # render any shot that is missing
 *   npm run broll -- --force      # re-render everything
 *   npm run broll -- --only gate-arrival,pump-night
 *
 * Prompts live in `src/marketing/broll.ts`; this file only moves bytes. Adding a
 * scene costs one image rather than fourteen — the same contract as
 * `npm run voice`, including how that contract decides what is stale.
 *
 * ── THE CACHE IS KEYED ON THE PROMPT ───────────────────────────────────────
 *
 * It used to skip whenever the PNG existed, which meant rewriting a shot's
 * prompt changed nothing at all: the old photograph stayed and the new
 * description was never sent. Silent, and the failure looks exactly like
 * success.
 *
 * It matters more here than it does for the voiceover, because these images are
 * NOT REPRODUCIBLE. Re-running a prompt returns a different photograph of a
 * different forecourt, not the same one again — so "just regenerate it" is not
 * a repair, and a shot that silently stopped matching its prompt cannot be
 * quietly fixed later. `prompts.json` beside the images records the sha256 of
 * the full text sent for each one, house style included, and a shot regenerates
 * only when that text has actually moved.
 *
 * As with the voice: an existing image with no recorded hash is adopted and its
 * hash written, so this costs nothing today and protects the next edit.
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

/** The hash of the exact text sent to the model, house style included. */
function hashPrompt(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 32);
}

/** `public/broll/prompts.json` — shot id -> hash of the prompt that drew it. */
type PromptManifest = Record<string, string>;

async function readPrompts(dir: string): Promise<PromptManifest> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path.join(dir, 'prompts.json'), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as PromptManifest;
  } catch {
    return {};
  }
}

async function writePrompts(dir: string, m: PromptManifest): Promise<void> {
  const sorted = Object.fromEntries(Object.entries(m).sort(([a], [b]) => (a < b ? -1 : 1)));
  await writeFile(path.join(dir, 'prompts.json'), JSON.stringify(sorted, null, 2) + '\n');
}

async function main() {
  const key = loadKey();
  const token = await accessToken(key);
  const dir = path.join(PUBLIC, 'broll');
  await mkdir(dir, { recursive: true });

  console.log(`Model: ${MODEL}  ·  ${LOCATION}  ·  project ${key.project_id}\n`);

  const prompts = await readPrompts(dir);
  let promptsDirty = false;

  let made = 0;
  let skipped = 0;
  let restated = 0;
  let adopted = 0;
  let failed = 0;

  for (const s of BROLL) {
    if (ONLY && !ONLY.has(s.id)) continue;
    const abs = path.join(PUBLIC, brollPath(s.id));
    const want = hashPrompt(s.prompt);
    const have = prompts[s.id];

    if (!FORCE && (await exists(abs))) {
      if (have === want) {
        skipped++;
        console.log(`  · skip  ${s.id}`);
        continue;
      }
      if (have === undefined) {
        prompts[s.id] = want;
        promptsDirty = true;
        adopted++;
        console.log(`  · adopt ${s.id}  (existing image, prompt recorded)`);
        continue;
      }
      restated++;
      console.log(`  ↻ ${s.id}  (prompt changed — redrawing)`);
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
        prompts[s.id] = want;
        promptsDirty = true;
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
    // After each shot that actually cost something: an interrupted run must not
    // redraw what it already paid for, and a redrawn photograph is a DIFFERENT
    // photograph, so losing the record is not a wasted call, it is a changed film.
    if (promptsDirty) {
      await writePrompts(dir, prompts);
      promptsDirty = false;
    }
  }

  // And once at the end, because the adopt and skip branches `continue` straight
  // past the write above — which is exactly how the first version of this
  // silently recorded nothing at all on a run where every image already existed.
  if (promptsDirty) await writePrompts(dir, prompts);

  console.log(
    `\nDone. ${made} generated (${restated} because the prompt changed), ` +
      `${skipped} unchanged, ${adopted} existing images adopted, ${failed} failed.`,
  );
  if (failed > 0) process.exit(1);
}

await main();
