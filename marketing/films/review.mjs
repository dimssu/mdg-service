/**
 * Has Gemini watch every clip in the two films and say which ones fail.
 *
 *   node films/review.mjs
 *
 * Two different questions are being asked of each clip, and they are not the
 * same question:
 *
 *   1. DOES IT LOOK REAL? Generated video fails in specific, findable ways —
 *      hands, faces, a reflection that does not track, an object that changes
 *      shape mid-shot, a gait that never quite lands. A viewer cannot always
 *      name what is wrong, but they stop believing the film.
 *   2. SHOULD IT BE LIVE ACTION AT ALL? Some beats are about a thing on a
 *      screen, or a fact, or a list. Staging those as a photographed person
 *      is the wrong instrument — a graphic or a product card says it faster
 *      and cannot look fake, because it is not pretending to be a photograph.
 *
 * The model is given the Hindi line the clip has to carry, because a shot that
 * would be fine anywhere else can still be wrong over a particular sentence.
 *
 * Proxies are sent, not masters: 720p is enough to catch a bad hand and keeps
 * the request inside the inline-data limit.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

import { loadKey, accessToken } from '../veo.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILMS = path.join(ROOT, 'films');
const PROXY = path.join(FILMS, '.review');
const MODEL = 'gemini-2.5-pro';
const CONCURRENCY = 3;

const ff = (a) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a], { stdio: 'pipe' });

const SCHEMA = {
  type: 'object',
  properties: {
    looks_real: { type: 'integer', description: '1 = obviously generated, 10 = indistinguishable from filmed' },
    artifacts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          what: { type: 'string' },
          when: { type: 'string', description: 'roughly when in the clip, e.g. "from 3s"' },
          severity: { type: 'string', enum: ['fatal', 'noticeable', 'minor'] },
        },
        required: ['what', 'when', 'severity'],
      },
    },
    better_as: { type: 'string', enum: ['live_action', 'graphic_or_ui', 'either'] },
    graphic_suggestion: { type: 'string' },
    verdict: { type: 'string', enum: ['keep', 'rerender', 'replace'] },
    why: { type: 'string' },
  },
  required: ['looks_real', 'artifacts', 'better_as', 'verdict', 'why'],
};

function prompt(rows) {
  const lines = rows.map((r) => `  · ${r.film} ${r.beat}: "${r.hi}"`).join('\n');
  return `You are a film editor reviewing one shot from a Hindi marketing film aimed at
Indian petrol pump dealers. The film must look photographed, like documentary
footage, not generated. Its audience is sceptical and middle-aged.

This clip carries the following spoken line(s):
${lines}

Watch the clip closely, several times, and answer two separate questions.

QUESTION 1 — DOES IT LOOK REAL?
Hunt for the specific ways generated video fails. Look hard at:
  · hands and fingers (count them, watch them grip and release)
  · faces, eyes, teeth, and whether an expression changes plausibly
  · anything held: does a phone, paper or cup keep the same shape and size
  · feet and gait: do steps land, or does a person glide or slide
  · reflections, shadows, and whether they track the object
  · background people: do they walk like people or drift
  · objects that appear, vanish, merge or morph
  · text, signage or screen content that warps, or is legible when it should not be
  · flicker, smearing, or a texture that crawls
Score looks_real 1-10 and list every artifact you actually SEE. Do not invent
artifacts to be helpful — an empty list is a valid and useful answer. Give
severity: "fatal" means a viewer will notice and disbelieve the film.

QUESTION 2 — SHOULD THIS BE LIVE ACTION AT ALL?
Some lines are better served by a designed graphic — a phone screen, a report
card, a simple animated element — than by a photographed person. A graphic
cannot look fake, because it is not pretending to be a photograph, and it can
show a number or a document directly. Live action is right when the line is
about a PERSON — his worry, his relief, his working day, the team behind the
service.
Set better_as to "graphic_or_ui" if a designed element would serve this line
better, and describe exactly what that graphic should show in
graphic_suggestion. Set "live_action" if a real human moment is the point.
Set "either" only if both genuinely work.

VERDICT: "keep" = usable as is. "rerender" = right idea, bad execution,
generate it again. "replace" = wrong instrument, build a graphic instead.

Be blunt. It is cheaper to re-render a clip than to ship a film nobody believes.`;
}

async function review(tok, project, file, rows) {
  const b64 = readFileSync(file).toString('base64');
  const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${MODEL}:generateContent`;
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'video/mp4', data: b64 } },
          { text: prompt(rows) },
        ] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          maxOutputTokens: 4096,
        },
      }),
    });
    if (r.ok) {
      const b = await r.json();
      const txt = b.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
      if (!txt) throw new Error(`empty answer: ${JSON.stringify(b).slice(0, 200)}`);
      return JSON.parse(txt);
    }
    const t = await r.text();
    if ((r.status === 429 || r.status >= 500) && attempt < 4) {
      await new Promise((s) => setTimeout(s, attempt * 12000));
      continue;
    }
    throw new Error(`${r.status} ${t.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
}

/** Every distinct source clip in either film, with the lines it has to carry. */
function inventory() {
  const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
  const byClip = new Map();
  for (const slug of ['teaser', 'explainer']) {
    const { beats } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.json`), 'utf8'));
    const { map } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.edit.json`), 'utf8'));
    for (const b of beats) {
      for (const ref of [].concat(map[b.id] ?? [])) {
        if (!byClip.has(ref)) byClip.set(ref, []);
        byClip.get(ref).push({ film: slug, beat: b.id, hi: b.hi });
      }
    }
  }
  if (ONLY.length) for (const k of [...byClip.keys()]) if (!ONLY.includes(k)) byClip.delete(k);
  return byClip;
}

function resolve(ref) {
  const [kind, name] = ref.split(':');
  return kind === 'clip'
    ? path.join(ROOT, 'clips', `${name}.mp4`)
    : path.join(FILMS, 'flow', 'clips', `${name}.mp4`);
}

async function main() {
  mkdirSync(PROXY, { recursive: true });
  const key = loadKey();
  const tok = await accessToken(key);
  const inv = [...inventory().entries()];
  console.log(`\n  ${inv.length} distinct clips to review on ${MODEL}\n`);

  const out = {};
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < inv.length) {
      const [ref, rows] = inv[next++];
      const src = resolve(ref);
      const proxy = path.join(PROXY, `${ref.replace(':', '-')}.mp4`);
      try {
        if (!existsSync(proxy)) {
          ff(['-i', src, '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'fast',
              '-crf', '28', '-an', proxy]);
        }
        const v = await review(tok, key.project_id, proxy, rows);
        out[ref] = { ...v, beats: rows.map((r) => `${r.film}/${r.beat}`) };
        console.log(`  ${String(++done).padStart(2)}/${inv.length}  ${ref.padEnd(26)} ` +
          `real ${String(v.looks_real).padStart(2)}/10  ${v.verdict.padEnd(8)} ${v.better_as}`);
      } catch (e) {
        out[ref] = { error: e.message };
        console.log(`  ${String(++done).padStart(2)}/${inv.length}  ${ref.padEnd(26)} ! ${e.message.slice(0, 70)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeFileSync(path.join(FILMS, 'review.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`\n  → marketing/films/review.json\n`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
