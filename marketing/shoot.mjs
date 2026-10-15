/**
 * Draws one shot of the problem→solution film with Vertex AI.
 *
 *   node marketing/shoot.mjs P01-dod-deadline          # draw it
 *   node marketing/shoot.mjs P01-dod-deadline --force  # draw it again
 *   node marketing/shoot.mjs --all                     # anything missing
 *
 * A shot is one JSON file in `marketing/shots/`. The JSON is the deliverable —
 * it is what gets reviewed, and it is what a different generator would be fed
 * if this one is ever swapped out. This file only turns that JSON into bytes.
 *
 * ── THE SAME MAN, THE SAME PUMP ────────────────────────────────────────────
 * Every call carries both reference photographs ahead of the prompt: the dealer
 * first, the forecourt second. Without them a fresh face and a fresh pump come
 * back on every shot and the thirty cards never read as one film. The prompt
 * text refers to them by position, so their order here is not cosmetic.
 *
 * ── AUTH ───────────────────────────────────────────────────────────────────
 * Vertex takes an OAuth token, not an API key, and the AI-Studio-style key that
 * looks like it would bills a meter the Cloud credit does not cover. The JWT is
 * signed against the same service-account key the assistant uses.
 *
 * ── MODEL ──────────────────────────────────────────────────────────────────
 * `gemini-2.5-flash-image` at `locations/global`. Imagen and Veo are both 404
 * on this project in every region tried, so these are stills and the motion is
 * a camera move over them — which is what a card under a caption wants anyway.
 */

import { createHash, createSign } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const SHOTS = path.join(ROOT, 'shots');
const REFS = path.join(ROOT, 'refs');
const KEY_FILE = process.env.VERTEX_SA_KEY_FILE || `${process.env.HOME}/mdg-assist-key.json`;
const MODEL = process.env.SHOOT_MODEL || 'gemini-2.5-flash-image';
const LOCATION = process.env.SHOOT_LOCATION || 'global';

/* Repeated verbatim on every shot. The negatives are not stylistic: the film
   may not carry another company's mark, and the generator cannot spell
   Devanagari — every caption is laid over the picture afterwards instead. */
const HOUSE = `
PHOTOREAL DOCUMENTARY PHOTOGRAPH. Vertical 9:16. Shot on a 35mm lens, natural
light, shallow but not showy depth of field. Colour like real Indian daylight —
warm, slightly dusty, never graded orange-and-teal. Grain of a good digital
camera. This must look photographed, not rendered.

THE MAN: use the man in the FIRST reference image. Same face, same moustache,
same greying hair, same build, same cream full-sleeve shirt with the sleeves
rolled, same dark navy trousers, same black shoes, same wristwatch. He is the
same person in every shot of this film and must be recognisably him.

THE PLACE: use the fuel station in the SECOND reference image — the same white
canopy, the same white dispensers, the same office block with its glass front,
the same trees and the same road behind it. Same pump, every shot.

ABSOLUTELY NOT IN THE PICTURE: any text, letters, numbers, words, signage,
Devanagari, English lettering, logos, watermarks or captions of any kind. No oil
company branding, livery, colour scheme, uniform, badge or logo. No vehicle
number plates. No flags. No phone or computer screen contents — screens are dark
or blurred. No other photograph, poster or notice with writing on it.

The second reference image has a signboard over the office door and small
notices stuck to the office glass. DO NOT COPY THEM. In this picture that
signboard is blank painted metal and the glass is clear and bare. Every wall,
board, door and window in this film carries no writing at all.
`.trim();

function loadKey() {
  try {
    return JSON.parse(readFileSync(KEY_FILE, 'utf8'));
  } catch {
    throw new Error(
      `Could not read the service-account key at ${KEY_FILE}.\n` +
        '  Set VERTEX_SA_KEY_FILE, or put the key where the assistant keeps it.\n' +
        '  It needs roles/aiplatform.user on the Vertex project.',
    );
  }
}

const b64url = (v) =>
  Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

async function accessToken(key) {
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
  const body = await res.json();
  if (!body.access_token) {
    throw new Error(`token exchange failed: ${body.error_description ?? JSON.stringify(body)}`);
  }
  return body.access_token;
}

const endpoint = (project) =>
  `${
    LOCATION === 'global'
      ? 'https://aiplatform.googleapis.com'
      : `https://${LOCATION}-aiplatform.googleapis.com`
  }/v1/projects/${project}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

function refPart(file) {
  const abs = path.join(REFS, file);
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
  return { inlineData: { mimeType: mime, data: readFileSync(abs).toString('base64') } };
}

/** The exact text sent to the model, house style included. */
function composePrompt(shot) {
  return [
    HOUSE,
    '',
    `THE MOMENT: ${shot.action}`,
    `TIME AND LIGHT: ${shot.lighting}`,
    `CAMERA: ${shot.camera}`,
    shot.detail ? `DETAIL THAT MATTERS: ${shot.detail}` : '',
    '',
    `FEELING: ${shot.feeling}`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function generate(token, project, prompt) {
  const res = await fetch(endpoint(project), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [refPart('dealer.webp'), refPart('forecourt.webp'), { text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '9:16' },
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} — ${text.slice(0, 300)}`);
    /* 429 is the normal state of this project rather than an exception — it runs
       on default per-minute Vertex quotas and a run of ten trips them. */
    err.retryable = res.status === 429 || res.status >= 500;
    throw err;
  }

  const json = JSON.parse(text);
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) {
    /* A refusal comes back as a normal 200 carrying only a text part, so this is
       the branch a blocked prompt lands in. Say so, rather than "undefined". */
    const said = json.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? '';
    throw new Error(`the model returned no image — probably refused. It said: ${said.slice(0, 200)}`);
  }
  return Buffer.from(part.inlineData.data, 'base64');
}

const hash = (t) => createHash('sha256').update(t, 'utf8').digest('hex').slice(0, 32);

function manifest() {
  const p = path.join(SHOTS, 'prompts.json');
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const all = args.includes('--all');
  const ids = all
    ? readdirSync(SHOTS)
        .filter((f) => f.endsWith('.json') && f !== 'prompts.json')
        .map((f) => f.replace(/\.json$/, ''))
    : args.filter((a) => !a.startsWith('--'));

  if (!ids.length) {
    console.error('Name a shot, or pass --all.');
    process.exit(1);
  }

  const key = loadKey();
  const token = await accessToken(key);
  mkdirSync(SHOTS, { recursive: true });
  const prompts = manifest();

  console.log(`${MODEL} · ${LOCATION} · project ${key.project_id}\n`);

  for (const id of ids) {
    const shot = JSON.parse(readFileSync(path.join(SHOTS, `${id}.json`), 'utf8'));
    const prompt = composePrompt(shot);
    const png = path.join(SHOTS, `${id}.png`);
    const want = hash(prompt);

    if (!force && existsSync(png) && prompts[id] === want) {
      console.log(`  = ${id}  (unchanged)`);
      continue;
    }

    for (let attempt = 1; ; attempt++) {
      try {
        writeFileSync(png, await generate(token, key.project_id, prompt));
        prompts[id] = want;
        console.log(`  + ${id}  →  marketing/shots/${id}.png`);
        break;
      } catch (e) {
        if (e.retryable && attempt < 4) {
          const wait = attempt * 20;
          console.log(`  … ${id} busy, waiting ${wait}s`);
          await new Promise((r) => setTimeout(r, wait * 1000));
          continue;
        }
        console.error(`  ! ${id}: ${e.message}`);
        break;
      }
    }
  }

  writeFileSync(
    path.join(SHOTS, 'prompts.json'),
    JSON.stringify(Object.fromEntries(Object.entries(prompts).sort()), null, 2) + '\n',
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
