/**
 * Asks a different question from review.mjs.
 *
 *   node films/match.mjs            # every beat in both films
 *   ONLY=E01,T01 node films/match.mjs
 *
 * review.mjs asks "does this clip look real". That is a question about the
 * CLIP. This asks the question about the BEAT: does the picture say what the
 * voice is saying, and does it hold a viewer who is deciding whether to keep
 * watching. The same clip can pass one beat and fail another, because the same
 * picture under a different sentence means a different thing — which is exactly
 * how the explainer ended up opening on a still, empty forecourt under a line
 * about a business that never stops.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadKey, accessToken } from '../veo.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILMS = path.join(ROOT, 'films');
const PROXY = path.join(FILMS, '.review');
const MODEL = 'gemini-2.5-pro';
const CONCURRENCY = 3;
const GAP = 0.35;

const ff = (a) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a], { stdio: 'pipe' });

const SCHEMA = {
  type: 'object',
  properties: {
    says_the_line: { type: 'integer', description: '1 = the picture contradicts or ignores the words, 10 = the picture IS the sentence' },
    mismatch: { type: 'string', description: 'exactly what in the picture fails the line, or "" if none' },
    holds_attention: { type: 'integer', description: '1 = a viewer looks away, 10 = a viewer leans in' },
    fix_kind: { type: 'string', enum: ['keep', 'repair', 'reword', 'reshoot', 'cut'] },
    fix: { type: 'string', description: 'concrete: the new Hindi line, or the shot to generate, or which existing beat to swap with' },
  },
  required: ['says_the_line', 'mismatch', 'holds_attention', 'fix_kind', 'fix'],
};

function prompt({ hi, id, film, pos, total, prev, next }) {
  return `A Hindi marketing film for Indian petrol pump dealers. Photoreal documentary
style. The audience is a sceptical, busy pump owner aged 45-60 who has been sold
to before and will stop watching the moment he is bored.

This is beat ${pos} of ${total} in the ${film}.

  The line spoken OVER this clip:   "${hi}"
  The line before it:               ${prev ? `"${prev}"` : '(this is the first beat — it must hook)'}
  The line after it:                ${next ? `"${next}"` : '(this is the last beat)'}

Watch the clip while imagining that line spoken over it, and answer two things.

1. DOES THE PICTURE SAY THE LINE?
Not "is it a nice shot" and not "is it on topic" — does this specific picture
carry this specific sentence? A line about a business that NEVER STOPS needs
activity, not an empty forecourt. A line about being ALONE with a problem needs
one man, not a crowd. A line naming a DATE needs something dated. If the picture
is merely adjacent to the words, that is a low score, not a high one. If it
actively contradicts them, that is a 1 or 2. Say exactly what fails in mismatch.

2. DOES IT HOLD A VIEWER?
Would this beat make a sceptical man keep watching, or is it the moment he puts
the phone down? A static wide of nothing happening scores low however pretty it
is. ${pos === 1 ? 'THIS IS THE FIRST BEAT. Judge it hard. If it does not grab him in the first second, nothing later matters.' : ''}

Then give ONE concrete fix:
  keep    — it works
  repair  — same line, same clip, different in/out point or framing
  reword  — the picture is good, the LINE is wrong. Give the replacement Hindi.
  reshoot — the line is right, the PICTURE is wrong. Describe the shot to
            generate, in one or two sentences, as a video prompt.
  cut     — the beat earns nothing; say what it costs to lose it.

Be blunt and specific. Vague praise is worthless here.`;
}

async function ask(tok, project, file, ctx) {
  const b64 = readFileSync(file).toString('base64');
  const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${MODEL}:generateContent`;
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'video/mp4', data: b64 } }, { text: prompt(ctx) }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json',
          responseSchema: SCHEMA, maxOutputTokens: 3000 },
      }),
    });
    if (r.ok) {
      const b = await r.json();
      const t = b.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
      if (!t) throw new Error('empty');
      return JSON.parse(t);
    }
    const t = await r.text();
    if ((r.status === 429 || r.status >= 500) && attempt < 4) {
      await new Promise((s) => setTimeout(s, attempt * 12000)); continue;
    }
    throw new Error(`${r.status} ${t.slice(0, 140).replace(/\s+/g, ' ')}`);
  }
}

const resolve = (ref) => {
  const [kind, name] = ref.split(':');
  if (kind === 'clip') return path.join(ROOT, 'clips', `${name}.mp4`);
  if (kind === 'flow') return path.join(FILMS, 'flow', 'clips', `${name}.mp4`);
  return path.join(FILMS, 'graphics', 'clips', `${name}.mp4`);
};

async function main() {
  mkdirSync(PROXY, { recursive: true });
  const key = loadKey();
  const tok = await accessToken(key);
  const only = (process.env.ONLY || '').split(',').filter(Boolean);

  const jobs = [];
  for (const slug of ['teaser', 'explainer']) {
    const { beats } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.json`), 'utf8'));
    const { map } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.edit.json`), 'utf8'));
    beats.forEach((b, i) => {
      if (only.length && !only.includes(b.id)) return;
      const ref = [].concat(map[b.id])[0];
      jobs.push({ slug, id: b.id, ref, hi: b.hi, pos: i + 1, total: beats.length,
        prev: beats[i - 1]?.hi, next: beats[i + 1]?.hi });
    });
  }

  console.log(`\n  ${jobs.length} beats on ${MODEL}\n`);
  const out = {};
  let next = 0, done = 0;
  async function worker() {
    while (next < jobs.length) {
      const j = jobs[next++];
      const proxy = path.join(PROXY, `${j.ref.replace(':', '-')}.mp4`);
      try {
        if (!existsSync(proxy)) {
          ff(['-i', resolve(j.ref), '-vf', 'scale=720:1280', '-c:v', 'libx264',
              '-preset', 'fast', '-crf', '28', '-an', proxy]);
        }
        const v = await ask(tok, key.project_id, proxy, { ...j, film: j.slug });
        out[`${j.slug}/${j.id}`] = { ...v, ref: j.ref, hi: j.hi };
        console.log(`  ${String(++done).padStart(2)}/${jobs.length} ${j.slug.slice(0,4)}/${j.id.padEnd(4)} ` +
          `says ${String(v.says_the_line).padStart(2)}  holds ${String(v.holds_attention).padStart(2)}  ${v.fix_kind}`);
      } catch (e) {
        out[`${j.slug}/${j.id}`] = { error: e.message };
        console.log(`  ${String(++done).padStart(2)}/${jobs.length} ${j.slug.slice(0,4)}/${j.id.padEnd(4)} ! ${e.message.slice(0,60)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeFileSync(path.join(FILMS, 'match.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`\n  → marketing/films/match.json\n`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
