/**
 * Joins a film's recorded lines into one listen-through file, and writes the
 * script beside it with the second each line starts at — so a note like
 * "at 4:12 the price sounds rushed" finds its line without scrubbing.
 *
 *   node films/readthrough.mjs kavach
 *
 * Reads films/<slug>.json and voice-<slug>/voice.json; writes
 * voice-<slug>/<slug>-readthrough.mp3 and films/<slug>-script.md.
 * The gaps here are for listening only. The cut sets its own timing.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const slug = process.argv[2];
if (!slug) throw new Error('usage: node films/readthrough.mjs <slug>');

const film = JSON.parse(readFileSync(path.join(ROOT, 'films', `${slug}.json`), 'utf8'));
const voiceDir = path.join(ROOT, `voice-${slug}`);
const voice = JSON.parse(readFileSync(path.join(voiceDir, 'voice.json'), 'utf8'));

const BEAT_GAP = 0.35;    // a breath between lines
const CHAPTER_GAP = 1.2;  // a pause where a chapter card will sit

const tmp = path.join(voiceDir, '.readthrough');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const list = [];
const rows = [];
let t = 0;
film.beats.forEach((b, i) => {
  const next = film.beats[i + 1];
  const gap = !next ? 0.8 : next.act !== b.act ? CHAPTER_GAP : BEAT_GAP;
  const wav = path.join(tmp, `${b.id}.wav`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(voiceDir, `${b.id}.mp3`),
    '-af', `apad=pad_dur=${gap}`, '-ar', '44100', '-ac', '1', wav]);
  list.push(`file '${wav}'`);
  rows.push({ ...b, at: t });
  t += voice[b.id].seconds + gap;
});
writeFileSync(path.join(tmp, 'list.txt'), list.join('\n') + '\n');

const out = path.join(voiceDir, `${slug}-readthrough.mp3`);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'),
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-b:a', '128k', out]);
rmSync(tmp, { recursive: true, force: true });

const FLAG = {
  passwords: 'आपके ड्राफ़्ट में "SDMS और ES की ID एवं Password" था — यहाँ सिर्फ़ "सिस्टम से जुड़ जाती है" रखा है।',
  count: 'पहले की सामग्री में 45 काम गिने गए थे; आपके ड्राफ़्ट में 43 है — 43 रखा है।',
  hours: 'वेबसाइट पर "सुबह 9 से रात 9, रोज़" लिखा है; आपके ड्राफ़्ट में 24 घंटे है — 24 घंटे रखा है।',
  monthly: 'आपके ड्राफ़्ट में सिर्फ़ "₹3,000 + 18% GST" था; "महीना" मैंने जोड़ा है।',
  tollfree: 'टोल-फ़्री नंबर बोला नहीं गया; स्क्रीन पर दिखेगा — नंबर चाहिए।',
};

let md = `# ${film.film}\n\nपूरी आवाज़: ${mmss(t)} · ${film.beats.length} लाइनें · ${Object.keys(film.chapters).length} अध्याय\n\n`;
md += `✚ = आपके ड्राफ़्ट में नहीं था, मैंने जोड़ा · ⚑ = आपका फ़ैसला चाहिए\n`;
let act = null;
for (const r of rows) {
  if (r.act !== act) {
    act = r.act;
    md += `\n## ${act} · ${film.chapters[act]}\n\n`;
  }
  const mark = r.added ? ' ✚' : r.flag ? ' ⚑' : '';
  md += `- \`${mmss(r.at)}\` **${r.id}**${mark} ${r.hi}\n`;
  if (r.flag) md += `  - ⚑ ${FLAG[r.flag]}\n`;
}
writeFileSync(path.join(ROOT, 'films', `${slug}-script.md`), md);
console.log(`  ${mmss(t)} · ${rows.length} lines → ${path.relative(ROOT, out)} + films/${slug}-script.md`);
