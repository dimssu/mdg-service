/**
 * Watches every dealer clip, used or spare, and writes down second by second
 * what the man actually DOES — hands, head, gaze, mouth, body — and whether
 * each movement has a reason. WATCHES ONLY; nothing here generates anything.
 *
 *   node films/motion.mjs              # every dealer clip in clips/
 *   ONLY=S08-alwayson,P06 node films/motion.mjs
 *   FINAL=1 node films/motion.mjs      # the finished segments the cutter wrote,
 *                                      # i.e. exactly the seconds a viewer sees
 *
 * The complaint this answers: in some shots the dealer moves at random —
 * gestures at nothing, turns for no reason, talks with no sound. Veo invents
 * motion to fill the seconds, and a viewer reads every gesture as meaning
 * something. So each movement is judged against the line spoken over it,
 * and the clip's cleanest window is named, so the cutter can start there.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { loadKey, accessToken } from '../veo.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const MODEL = 'gemini-2.5-pro';

const SCHEMA = {
  type: 'object',
  properties: {
    dealer_in_shot: { type: 'boolean' },
    setting: { type: 'string' },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from: { type: 'number' }, to: { type: 'number' },
          action: { type: 'string', description: 'exactly what his hands, head, eyes, mouth and body do' },
          reason_visible: { type: 'boolean', description: 'is there a visible reason in the scene for this movement' },
          reads_as: { type: 'string', enum: ['natural', 'odd', 'random', 'glitch'] },
        },
        required: ['from', 'to', 'action', 'reason_visible', 'reads_as'],
      },
    },
    mouth_talking: { type: 'boolean', description: 'his lips move as if he is speaking' },
    camera: { type: 'string' },
    problems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from: { type: 'number' }, to: { type: 'number' },
          what: { type: 'string' },
          severity: { type: 'string', enum: ['minor', 'noticeable', 'fatal'] },
        },
        required: ['from', 'to', 'what', 'severity'],
      },
    },
    calm_windows: {
      type: 'array',
      description: 'stretches where every movement is natural and motivated',
      items: { type: 'object', properties: { from: { type: 'number' }, to: { type: 'number' }, what: { type: 'string' } }, required: ['from', 'to', 'what'] },
    },
    fits_lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: { beat: { type: 'string' }, fits: { type: 'string', enum: ['yes', 'partly', 'no'] }, why: { type: 'string' } },
        required: ['beat', 'fits', 'why'],
      },
    },
  },
  required: ['dealer_in_shot', 'setting', 'timeline', 'mouth_talking', 'camera', 'problems', 'calm_windows', 'fits_lines'],
};

function prompt(uses) {
  const lines = uses.length
    ? uses.map((u) => `  ${u.beat} (${u.secs.toFixed(1)}s from the clip's start): "${u.line}"`).join('\n')
    : '  (not used yet — a spare shot)';
  return `This is one shot from a Hindi marketing film for petrol pump dealers in India.
The hero is a middle-aged pump dealer. The film has NO sound on this shot except
a narrator; the man himself never speaks on camera.

Watch it second by second and describe exactly what the man does — hands, head,
where he looks, his mouth, his body — with timestamps. For every movement, say
whether there is a visible reason for it in the scene (he picks up the phone
because it buzzed; he looks up because someone walked in) and whether it reads
as natural, odd, random, or a generation glitch (a hand that changes shape, an
object that appears, a jerk).

The complaint being checked: "in some clips the dealer makes random movements
that make no sense". Be strict. A viewer reads every gesture as meaning
something. Gesturing at nothing, talking to nobody, mouthing words, a head that
turns for no reason, fidgeting that repeats, a smile that switches on and off,
hands that wander — all count as problems.

This shot plays under these narrator lines (the shot always starts at 0s):
${lines}

Say whether what he does fits each line. Then name the calm windows — the
stretches where every movement is natural and motivated.`;
}

async function ask(tok, project, b64, text) {
  const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${MODEL}:generateContent`;
  for (let a = 1; ; a++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'video/mp4', data: b64 } }, { text }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: SCHEMA, maxOutputTokens: 8000 },
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

/* The finished segments, one per footage beat, as the cutter wrote them — the
   verdict that matters is on the seconds that actually play, after windows and
   stretches, not on the raw clip. */
function finalJobs() {
  const jobs = [];
  for (const slug of ['teaser', 'explainer']) {
    const { beats } = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.json`), 'utf8'));
    const voice = JSON.parse(readFileSync(path.join(ROOT, `voice-${slug}`, 'voice.json'), 'utf8'));
    const { map } = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.edit.json`), 'utf8'));
    for (const b of beats) {
      const refs = [].concat(map[b.id] ?? []);
      refs.forEach((e, i) => {
        const ref = typeof e === 'string' ? e : e.ref;
        if (ref.startsWith('gfx:')) return;
        const id = `${b.id}${refs.length > 1 ? `-${i + 1}` : ''}`;
        jobs.push({ key: `${slug}/${id}`, ref, file: path.join(ROOT, '.work', slug, `v-${id}.mp4`),
          uses: [{ beat: b.id, line: b.hi, secs: (voice[b.id].seconds + 0.35) / refs.length }] });
      });
    }
  }
  return jobs;
}

async function main() {
  if (process.env.FINAL) return mainFinal();
  // which beats each clip covers, and for how long
  const uses = {};
  for (const slug of ['teaser', 'explainer']) {
    const { beats } = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.json`), 'utf8'));
    const voice = JSON.parse(readFileSync(path.join(ROOT, `voice-${slug}`, 'voice.json'), 'utf8'));
    const { map } = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.edit.json`), 'utf8'));
    for (const b of beats) {
      const refs = [].concat(map[b.id] ?? []);
      for (const ref of refs) {
        if (!ref.startsWith('clip:')) continue;
        (uses[ref.slice(5)] ??= []).push({ beat: b.id, line: b.hi ?? b.text ?? b.line, secs: (voice[b.id].seconds + 0.35) / refs.length });
      }
    }
  }
  const only = (process.env.ONLY || '').split(',').filter(Boolean);
  const names = readdirSync(path.join(ROOT, 'clips')).filter((f) => /^[PSC]\d/.test(f)).map((f) => f.replace(/\.mp4$/, ''))
    .filter((n) => !only.length || only.some((o) => n.startsWith(o)));

  const key = loadKey(); const tok = await accessToken(key);
  const outFile = path.join(ROOT, 'films', 'motion.json');
  let out = {};
  try { out = JSON.parse(readFileSync(outFile, 'utf8')); } catch {}
  let next = 0, done = 0;
  async function worker() {
    while (next < names.length) {
      const n = names[next++];
      try {
        const v = await ask(tok, key.project_id, readFileSync(path.join(ROOT, 'clips', `${n}.mp4`)).toString('base64'), prompt(uses[n] ?? []));
        out[n] = { uses: (uses[n] ?? []).map((u) => u.beat), ...v };
        const bad = v.problems.filter((p) => p.severity !== 'minor').length;
        console.log(`  ${String(++done).padStart(2)}/${names.length} ${n.padEnd(22)} used=${(uses[n] ?? []).map((u) => u.beat).join(',') || '-'}  problems=${v.problems.length} (${bad} serious)  talking=${v.mouth_talking}`);
      } catch (e) {
        out[n] = { error: e.message };
        console.log(`  ${String(++done).padStart(2)}/${names.length} ${n} ! ${e.message.slice(0, 80)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n');
  console.log(`\n  → marketing/films/motion.json\n`);
}
async function mainFinal() {
  const jobs = finalJobs();
  const key = loadKey(); const tok = await accessToken(key);
  const out = {}; let next = 0, done = 0;
  async function worker() {
    while (next < jobs.length) {
      const j = jobs[next++];
      try {
        const v = await ask(tok, key.project_id, readFileSync(j.file).toString('base64'), prompt(j.uses));
        out[j.key] = { ref: j.ref, ...v };
        const serious = v.problems.filter((p) => p.severity !== 'minor');
        console.log(`  ${String(++done).padStart(2)}/${jobs.length} ${j.key.padEnd(16)} ${j.ref.padEnd(26)} ` +
          `fits=${v.fits_lines.map((f) => f.fits).join(',').padEnd(6)} serious=${serious.length}` +
          (serious.length ? `  ← ${serious.map((p) => `${p.from}-${p.to}s ${p.what}`).join(' | ').slice(0, 150)}` : ''));
      } catch (e) {
        out[j.key] = { ref: j.ref, error: e.message };
        console.log(`  ${String(++done).padStart(2)}/${jobs.length} ${j.key} ! ${e.message.slice(0, 80)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  writeFileSync(path.join(ROOT, 'films', 'motion-final.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`\n  → marketing/films/motion-final.json\n`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
