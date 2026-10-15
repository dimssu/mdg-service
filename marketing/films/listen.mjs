/**
 * Listens to every recorded line and says where the voice departs from the
 * script: a word dropped or swapped, an acronym read as a word, an English
 * term said wrongly, a line that sounds rushed or flat. LISTENS ONLY; nothing
 * here generates anything.
 *
 *   node films/listen.mjs kavach            # every line
 *   ONLY=K201,K602 node films/listen.mjs kavach
 *
 * Lines go up a chapter at a time, each as its own labelled clip, because a
 * verdict on one long file comes back with timestamps that drift.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadKey, accessToken } from '../veo.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const MODEL = 'gemini-2.5-pro';
const slug = process.argv[2];
const film = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.json`), 'utf8'));
const only = (process.env.ONLY || '').split(',').filter(Boolean);

const SCHEMA = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          heard: { type: 'string', description: 'exactly what the voice says, in Devanagari' },
          matches_script: { type: 'boolean' },
          problems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                word: { type: 'string' },
                what: { type: 'string' },
                severity: { type: 'string', enum: ['minor', 'noticeable', 'serious'] },
              },
              required: ['word', 'what', 'severity'],
            },
          },
          delivery: { type: 'string', enum: ['natural', 'rushed', 'flat', 'odd'] },
        },
        required: ['id', 'heard', 'matches_script', 'problems', 'delivery'],
      },
    },
  },
  required: ['lines'],
};

const INTRO = `These are narrator lines for a Hindi explainer film aimed at petrol pump
dealers in India. Each clip is labelled with its line id and the exact script.
For every clip, write down exactly what the voice says, then list any word that
is dropped, added, swapped or mispronounced. Pay special attention to:
acronyms spelled letter by letter (डी-एस-आर = D-S-R, एस-डी-एम-एस = S-D-M-S,
आई-आर-ए-एस = I-R-A-S, डी-ओ-डी, जी-एस-टी, सी-सी-टी-वी, एम-डी-जी, ओ-टी-पी, ओ-टी-वी) —
each must be read as separate letters; numbers (तैंतालीस, चार हज़ार सात सौ,
सत्तर प्रतिशत, तीन हज़ार रुपये, अठारह प्रतिशत, दो हज़ार इक्कीस, सत्रह सौ);
English business words (वेरिएशन, इनवॉइस, डेंसिटी, वैलिडिटी, कंप्लायंस,
इनग्रेस, रिप्रेज़ेंटेटिव, रिकंसिलिएशन). Be strict but fair: a natural
Hindi pronunciation of an English word is fine. Also say whether the delivery
is natural, rushed, flat or odd.`;

async function ask(tok, project, parts) {
  const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${MODEL}:generateContent`;
  for (let a = 1; ; a++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: SCHEMA, maxOutputTokens: 16000 },
      }),
    });
    if (r.ok) {
      const b = await r.json();
      return JSON.parse(b.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '{}');
    }
    if ((r.status === 429 || r.status >= 500) && a < 4) { await new Promise((s) => setTimeout(s, a * 12000)); continue; }
    throw new Error(`${r.status} ${(await r.text()).slice(0, 160)}`);
  }
}

async function main() {
  const beats = film.beats.filter((b) => !only.length || only.includes(b.id));
  const byAct = {};
  for (const b of beats) (byAct[b.act] ??= []).push(b);
  const groups = Object.values(byAct);
  const key = loadKey(); const tok = await accessToken(key);
  const out = {};
  let next = 0;
  async function worker() {
    while (next < groups.length) {
      const g = groups[next++];
      const parts = [{ text: INTRO }];
      for (const b of g) {
        parts.push({ text: `\n--- ${b.id} — script: "${b.hi}"` });
        parts.push({ inlineData: { mimeType: 'audio/mpeg', data: readFileSync(path.join(ROOT, `voice-${slug}`, `${b.id}.mp3`)).toString('base64') } });
      }
      try {
        const v = await ask(tok, key.project_id, parts);
        for (const l of v.lines) out[l.id] = l;
        console.log(`  chapter ${g[0].act}: ${v.lines.length} lines checked`);
      } catch (e) {
        console.log(`  chapter ${g[0].act} ! ${e.message.slice(0, 100)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  writeFileSync(path.join(ROOT, 'films', `${slug}-listen.json`), JSON.stringify(out, null, 2) + '\n');
  for (const [id, l] of Object.entries(out).sort()) {
    const bad = l.problems.filter((p) => p.severity !== 'minor');
    if (!bad.length && l.delivery === 'natural') continue;
    console.log(`  ${id} [${l.delivery}] ${bad.map((p) => `${p.word}: ${p.what} (${p.severity})`).join(' | ')}`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
