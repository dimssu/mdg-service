/**
 * Watches one generated first frame or clip for the Kavach film and says
 * whether it can go in: is it the founder's man, is there text or a mark,
 * does anything melt, does he move for no reason, does it fit its line, and
 * which seconds are clean. WATCHES ONLY; nothing here generates anything.
 *
 *   node films/clipcheck.mjs S07 flow-kavach/S07.png     # a first frame
 *   node films/clipcheck.mjs S07 flow-kavach/S07.mp4     # the clip
 *
 * Writes the verdict into films/kavach.check.json under the asset id, keyed by
 * file, so a retake is judged beside the take it replaces.
 *
 * Two cautions carried over from the earlier films: Gemini's same-person call
 * is not proof (it once matched two different moustached men in cream shirts),
 * so a "same" still gets a look by eye; and its timestamps on the last second
 * are loose, so a late artifact is checked against the window actually used.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadKey, accessToken } from '../veo.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const MODEL = 'gemini-2.5-pro';
const [id, fileArg] = process.argv.slice(2);
if (!id || !fileArg) throw new Error('usage: node films/clipcheck.mjs <assetId> <file>');
const file = path.resolve(ROOT, fileArg);
const isVideo = /\.mp4$/i.test(file);

const plan = JSON.parse(readFileSync(path.join(ROOT, 'films', 'kavach.plan.json'), 'utf8'));
const beats = JSON.parse(readFileSync(path.join(ROOT, 'films', 'plan', 'beats.json'), 'utf8'));
/* lines added after plan/beats.json was written (the 30 Sep problems chapter, premium 6) come from the script itself */
const script = JSON.parse(readFileSync(path.join(ROOT, 'films', 'kavach.json'), 'utf8')).beats;
const asset = plan.assets[id];
if (!asset) throw new Error(`no asset ${id} in the plan`);
const uses = Object.entries(plan.beats).flatMap(([bid, b]) =>
  b.segments.filter((s) => s.asset === id).map((s) => ({ bid, ...s, hi: beats.find((x) => x.id === bid)?.hi ?? script.find((x) => x.id === bid)?.hi })));

const SCHEMA = {
  type: 'object',
  properties: {
    same_man: { type: 'string', enum: ['same', 'different', 'unsure', 'not_in_shot'] },
    face_notes: { type: 'string' },
    outfit_matches: { type: 'boolean', description: 'cream full-sleeve shirt rolled, navy trousers, black belt' },
    text_visible: { type: 'array', items: { type: 'string' }, description: 'any readable letters, numbers, signs or screen content' },
    marks_or_livery: { type: 'array', items: { type: 'string' }, description: 'logos, brand colours on canopy/dispenser/uniform, watermarks' },
    liquid_or_danger: { type: 'array', items: { type: 'string' } },
    glitches: {
      type: 'array',
      items: { type: 'object', properties: { t: { type: 'number' }, what: { type: 'string' } }, required: ['t', 'what'] },
      description: 'morphing hands/objects, extra fingers, things appearing/vanishing, sliding feet, melting faces',
    },
    random_motion: {
      type: 'array',
      items: { type: 'object', properties: { t: { type: 'number' }, what: { type: 'string' } }, required: ['t', 'what'] },
      description: 'gestures at nothing, talking/mouthing, turns with no reason, repeated fidgets',
    },
    matches_brief: { type: 'boolean' },
    fits_line: { type: 'string', enum: ['yes', 'partly', 'no'] },
    clean_from: { type: 'number' },
    clean_to: { type: 'number' },
    verdict: { type: 'string', enum: ['keep', 'keep_window', 'retake'] },
    retake_hint: { type: 'string', description: 'if retake: what to change in the prompt' },
  },
  required: ['same_man', 'face_notes', 'outfit_matches', 'text_visible', 'marks_or_livery', 'liquid_or_danger',
    'glitches', 'random_motion', 'matches_brief', 'fits_line', 'clean_from', 'clean_to', 'verdict', 'retake_hint'],
};

const prompt = `You are checking one ${isVideo ? '8-second video clip' : 'still image (the first frame of a clip to be animated)'} for a Hindi
explainer film for Indian petrol pump dealers. The FIRST image attached is the reference photo of
the hero — the dealer. ${asset.dealer ? 'He should appear in this shot and must be the SAME man: same face shape, greying black hair, thick moustache, same age (about 50); cream full-sleeve shirt with sleeves rolled, navy trousers, black belt.' : 'He is NOT meant to be in this shot.'}

The brief for this shot:
  setting: ${asset.setting ?? ''}
  first frame: ${asset.frame ?? ''}
  motion: ${asset.motion ?? ''}

It plays under these narrator lines (the man never speaks on camera):
${uses.map((u) => `  ${u.bid} (${u.seconds}s${u.from != null ? ` from ${u.from}s` : ''}): "${u.hi}"`).join('\n') || '  (not placed yet)'}

IGNORE these two things, they are handled later: (1) a small translucent four-point sparkle in the
bottom-right corner — it is the generator's own mark and is painted out in the edit; (2) ${asset.dealer ? '' : 'faces — the dealer is not in this shot, so set same_man to not_in_shot and do not compare anyone to the reference photo; '}anything
unreadable at phone size (a blurred keypad shape, an out-of-focus paper) is fine — report only letters,
numbers or marks a viewer could actually READ or RECOGNISE.
Be strict — a viewer reads every gesture and every legible letter. Report: any readable text, numbers,
signs or screen content; any logo, brand colour band on a canopy or dispenser, uniform branding
or watermark (the canopy must be plain white); any liquid spilling or danger; any generation
glitch${isVideo ? ' with its second' : ''}; ${isVideo ? 'any movement with no visible reason, mouthing words, gesturing at nothing; ' : ''}whether it matches
the brief and fits the lines. ${isVideo ? 'Give the longest clean window in seconds.' : 'For a still, clean_from=0 and clean_to=0.'}
verdict: keep, keep_window (usable only inside the clean window), or retake — with a concrete hint.`;

async function ask() {
  const key = loadKey();
  const tok = await accessToken(key);
  const url = `https://aiplatform.googleapis.com/v1/projects/${key.project_id}/locations/global/publishers/google/models/${MODEL}:generateContent`;
  const media = readFileSync(file).toString('base64');
  const mime = isVideo ? 'video/mp4' : /\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg';
  for (let a = 1; ; a++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'image/webp', data: readFileSync(path.join(ROOT, 'refs', 'dealer.webp')).toString('base64') } },
          { inlineData: { mimeType: mime, data: media } },
          { text: prompt },
        ] }],
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

const v = await ask();
/* one verdict file per checked file, so several checks can run at once
   without overwriting each other */
writeFileSync(file.replace(/\.(mp4|jpe?g|png|webp)$/i, '.check.json'), JSON.stringify({ id, ...v }, null, 2) + '\n');

const bad = [
  ...v.text_visible.map((t) => `text: ${t}`),
  ...v.marks_or_livery.map((t) => `mark: ${t}`),
  ...v.liquid_or_danger.map((t) => `liquid: ${t}`),
  ...v.glitches.map((g) => `glitch@${g.t}s: ${g.what}`),
  ...v.random_motion.map((g) => `motion@${g.t}s: ${g.what}`),
];
console.log(`${id} ${path.basename(file)}  ${v.verdict.toUpperCase()}  man=${v.same_man} outfit=${v.outfit_matches} fits=${v.fits_line}` +
  (isVideo ? ` clean=${v.clean_from}-${v.clean_to}s` : '') +
  (bad.length ? `\n  ${bad.join('\n  ')}` : '') + (v.verdict !== 'keep' ? `\n  hint: ${v.retake_hint}` : ''));
