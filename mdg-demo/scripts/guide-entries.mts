import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DECLARED } from '../src/beats/catalog';
import type { Lang } from '../src/marketing/film';
import { videoTutorial } from '../src/beats/project';
import { type Beat, type Bi, pick } from '../src/beats/types';

/**
 * Writes the guide site's copy for every video that is described as data.
 *
 *   npm run guide:entries
 *
 * ── WHY THIS IS GENERATED ──────────────────────────────────────────────────
 *
 * The site's `content.mjs` wants, per video: a bilingual title, subtitle and
 * description, a keyword list, and a label for every chapter. At twenty-six
 * videos averaging nine beats that is well over four hundred strings — and every
 * one of them already exists inside the video definition, written by the person
 * who wrote the video. Copying them across by hand would be a day's typing whose
 * only lasting product is a second place for them to disagree.
 *
 * So they are projected out instead, and `content.mjs` spreads the result.
 * Editing a video's title changes the site's title, and the two cannot drift.
 *
 * ── WHERE A CHAPTER LABEL COMES FROM ───────────────────────────────────────
 *
 * NOT from the narration. That was the obvious idea and it is wrong: a beat's
 * `say` is a full spoken sentence, so truncating it turns a chapter called "open
 * the app" into "the first thing to do is open the MDG app on your". The guide
 * site's own notes record exactly that trap.
 *
 * Every block already carries a SHORT human phrase written for the screen — a
 * title's headline, a claim's label, a list's or flow's title, a wrong beat's
 * headline. That is a chapter name already; it just had not been asked for. Where
 * a block genuinely has no short phrase, the beat is left out of the chapter list
 * rather than given a bad name, and the site drops any chapter whose key it
 * cannot match anyway.
 */

/** The short human phrase a block already carries, if it has one. */
function labelOf(block: Beat['block']): Bi | undefined {
  switch (block.kind) {
    case 'title':
      return block.headline;
    case 'chapter':
      return block.label;
    case 'claim':
      return block.label;
    case 'list':
      return block.title;
    // A flow has no title of its own — it is a row of steps — so the first
    // step's name is the honest label for it. Better than a truncated sentence
    // and better than nothing.
    case 'flow':
      return block.steps[0]?.title ?? block.steps[0]?.figure;
    case 'compare':
      return block.verdict ?? block.left.head;
    case 'wrong':
      return block.headline;
    case 'photo':
      return block.headline;
    case 'recap':
      return { hi: 'दोहराइए', en: 'Recap' };
    default:
      return undefined;
  }
}

/**
 * The description, built from the video's own spine.
 *
 * Its subtitle, then the sentences of the beats that carry the argument — the
 * claims, comparisons and the cost — which is a fair prose summary of what the
 * video actually says, in the author's own words rather than a paraphrase of
 * them. Capped so a card does not turn into an essay.
 */
function descriptionOf(v: (typeof DECLARED)[number], lang: Lang): string {
  const beats = v.beats as Beat[];
  const spine = beats
    .filter((b) => ['claim', 'compare', 'flow', 'list', 'wrong'].includes(b.block.kind))
    .slice(0, 4)
    .map((b) => pick(b.say, lang));
  const closing =
    lang === 'hi'
      ? 'यह वीडियो पंप चलाने की बात है, ऐप की नहीं — किसी को भी भेज सकते हैं।'
      : 'This is about running a pump, not about the app. Made to be forwarded.';
  return [pick(v.subtitle, lang) + '.', ...spine, closing].join(' ');
}

/**
 * Keywords, from the words the video itself uses.
 *
 * Crude on purpose: the long words out of the title and the chapter labels, in
 * both languages, deduplicated. The site's search already covers titles,
 * subtitles, descriptions and chapter labels, so this list exists only to bridge
 * a vocabulary gap — and words the author chose are a better bridge than words
 * invented for a keyword field.
 */
function keywordsOf(v: (typeof DECLARED)[number]): string[] {
  const words = new Set<string>();
  const add = (s: string) => {
    for (const w of s.split(/[\s—,.।:'"()]+/)) {
      const t = w.trim().toLowerCase();
      if (t.length >= 4 && !/^\d+$/.test(t)) words.add(t);
    }
  };
  for (const lang of ['hi', 'en'] as const) {
    add(pick(v.title, lang));
    add(pick(v.subtitle, lang));
    for (const b of v.beats as Beat[]) {
      const l = labelOf(b.block);
      if (l) add(pick(l, lang));
    }
  }
  return [...words].slice(0, 40);
}

function entryFor(v: (typeof DECLARED)[number], lang: Lang) {
  const beats = v.beats as Beat[];
  const chapters: Record<string, string> = {};
  for (const b of beats) {
    const l = labelOf(b.block);
    if (l) chapters[b.id] = pick(l, lang);
  }
  return {
    title: pick(v.title, lang),
    subtitle: pick(v.subtitle, lang),
    description: descriptionOf(v, lang),
    chapters,
  };
}

async function main() {
  const rows = [];
  for (const v of DECLARED) {
    // A bilingual video is two site entries, because they are two files with two
    // durations and two chapter tracks — the language toggle on the site changes
    // the PAGE's language, not the voice on the recording.
    const langs: Lang[] = v.family === 'social' ? ['hi', 'en'] : ['hi'];
    for (const lang of langs) {
      const t = videoTutorial(v, lang);
      rows.push({
        id: t.id,
        audience: 'public',
        keywords: keywordsOf(v),
        hi: entryFor(v, 'hi'),
        en: entryFor(v, 'en'),
        // Which language the RECORDING is in, so the site can say so.
        narration: lang,
      });
    }
  }

  const out = path.resolve(process.cwd(), 'site/data/declared-videos.json');
  await writeFile(out, JSON.stringify(rows, null, 2) + '\n');
  console.log(`Wrote ${rows.length} entries to ${out}`);
  console.log(`  from ${DECLARED.length} declared videos`);
}

await main();
