/**
 * Watches every finished segment of both films and checks it against the
 * founder's reference photo of the dealer. WATCHES ONLY — nothing here
 * generates anything; all generation goes through Google Flow in the browser.
 *
 *   node films/verify.mjs            # every segment
 *   ONLY=T09,E06 node films/verify.mjs
 *
 * It reads the segments the cutter actually wrote (.work/<film>/v-<beat>.mp4),
 * so the verdict is on the repaired picture that reaches the viewer — after
 * the watermark, livery and sign repairs — not on the raw clip.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadKey, accessToken } from '../veo.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const REF = path.join(ROOT, 'refs', 'dealer.webp');
const MODEL = 'gemini-2.5-pro';

const SCHEMA = {
  type: 'object',
  properties: {
    dealer_present: { type: 'boolean', description: 'a middle-aged man who could be the dealer appears in the shot' },
    same_person: { type: 'string', enum: ['yes', 'no', 'unsure', 'not_applicable'] },
    why_person: { type: 'string' },
    text_or_logo: { type: 'array', items: { type: 'string' } },
    watermark: { type: 'boolean' },
    liquid_spill: { type: 'boolean' },
    spill_detail: { type: 'string' },
  },
  required: ['dealer_present', 'same_person', 'why_person', 'text_or_logo', 'watermark', 'liquid_spill'],
};

const PROMPT = `The FIRST attachment is a reference photo of one specific man: the petrol pump
dealer who is the hero of a marketing film. The SECOND attachment is one shot
from that film.

1. Is a middle-aged man who could be this dealer in the shot? If yes, is he the
   SAME PERSON as the reference photo? Judge the face — shape, moustache, hair,
   build — not just the clothes, which are deliberately the same in every shot.
   "yes" only if you would stake money on it; "no" if he is clearly a different
   man; "unsure" if the face is too small or too turned away to tell. Use
   "not_applicable" if no such man is present.
2. List any readable text, lettering, logo, brand mark, sign or number plate
   visible anywhere in the shot. Blurred shapes that cannot be read do not count.
3. Is there any watermark, such as the word "Veo" or a small four-pointed star,
   anywhere in the frame, especially near the corners?
4. Is any liquid — fuel or otherwise — spraying, pouring, dripping or lying
   spilled on the ground? A dry floor with a hose lying on it is NOT a spill.

Be literal and precise. Say only what you actually see.`;

async function ask(tok, project, refB64, segB64) {
  const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${MODEL}:generateContent`;
  for (let a = 1; ; a++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'image/webp', data: refB64 } },
          { inlineData: { mimeType: 'video/mp4', data: segB64 } },
          { text: PROMPT }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json',
          responseSchema: SCHEMA, maxOutputTokens: 2000 },
      }),
    });
    if (r.ok) {
      const b = await r.json();
      return JSON.parse(b.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '{}');
    }
    if ((r.status === 429 || r.status >= 500) && a < 4) { await new Promise((s) => setTimeout(s, a * 12000)); continue; }
    throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  }
}

async function main() {
  const key = loadKey(); const tok = await accessToken(key);
  const refB64 = readFileSync(REF).toString('base64');
  const only = (process.env.ONLY || '').split(',').filter(Boolean);
  const jobs = [];
  for (const slug of ['teaser', 'explainer']) {
    const { beats } = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.json`), 'utf8'));
    const { map } = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.edit.json`), 'utf8'));
    for (const b of beats) {
      if (only.length && !only.includes(b.id)) continue;
      const refs = [].concat(map[b.id]).map((e) => (typeof e === 'string' ? e : e.ref));
      if (refs.every((r) => r.startsWith('gfx:'))) continue;           // cards have no dealer
      refs.forEach((ref, i) => {
        if (ref.startsWith('gfx:')) return;
        const seg = path.join(ROOT, '.work', slug, `v-${b.id}${refs.length > 1 ? `-${i + 1}` : ''}.mp4`);
        if (existsSync(seg)) jobs.push({ slug, id: b.id, ref, seg });
      });
    }
  }
  console.log(`\n  ${jobs.length} footage segments\n`);
  const out = {}; let next = 0, done = 0;
  async function worker() {
    while (next < jobs.length) {
      const j = jobs[next++];
      try {
        const v = await ask(tok, key.project_id, refB64, readFileSync(j.seg).toString('base64'));
        out[`${j.slug}/${j.id}`] = { ref: j.ref, ...v };
        const flags = [v.watermark && 'MARK', v.liquid_spill && 'SPILL', v.text_or_logo?.length && `TEXT:${v.text_or_logo.length}`].filter(Boolean).join(' ');
        console.log(`  ${String(++done).padStart(2)}/${jobs.length} ${j.slug.slice(0,4)}/${j.id.padEnd(4)} ${j.ref.padEnd(22)} ` +
          `person=${String(v.same_person).padEnd(14)} ${flags}`);
      } catch (e) {
        out[`${j.slug}/${j.id}`] = { ref: j.ref, error: e.message };
        console.log(`  ${String(++done).padStart(2)}/${jobs.length} ${j.slug.slice(0,4)}/${j.id.padEnd(4)} ! ${e.message.slice(0, 60)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));
  writeFileSync(path.join(ROOT, 'films', 'verify.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`\n  → marketing/films/verify.json\n`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
