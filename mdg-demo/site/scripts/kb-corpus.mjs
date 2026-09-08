/*
 * Turns the video catalogue into a corpus the assistant can be taught.
 *
 *   node scripts/kb-corpus.mjs            # writes into the ingest tool's corpus/
 *   node scripts/kb-corpus.mjs --out DIR
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * The assistant on mdgservices.in answers out of a packed knowledge base built
 * on a laptop: markdown and PDFs are chunked, embedded against Vertex, and
 * uploaded to S3 as three files. It knows the Marketing Discipline Guidelines,
 * the display-board and first-aid rules, and what MDG Services does.
 *
 * It does not know that any of the videos exist. There is a page in the corpus
 * that mentions there is a video library, and it names no video and carries no
 * link — so "how do I read a stock variation sheet?" gets a prose answer when a
 * four-minute video answering exactly that has been sitting on the guide site
 * the whole time.
 *
 * This writes one markdown page per video so the pipeline can embed them. The
 * catalogue is the source: titles, descriptions, keywords and chapter labels are
 * already written and already bilingual, so nothing is authored twice and the
 * corpus cannot drift from what the site actually publishes.
 *
 * ── WHAT IT DELIBERATELY LEAVES OUT ────────────────────────────────────────
 *
 * ADMIN WALKTHROUGHS. That assistant answers strangers on a public website. The
 * admin videos are narrated tours of the internal ops portal, kept out of the
 * sitemap and out of search for exactly that reason, and embedding them would
 * hand a stranger's question a passage describing how the work is done — by a
 * route nobody would think to check. `dealer` and `public` only, and the filter
 * is by audience rather than by a list of ids so a new admin video cannot be
 * added into the corpus by forgetting.
 *
 * ── THE SHAPE OF A PAGE ────────────────────────────────────────────────────
 *
 * `flat` structure in the ingest tool means it splits on markdown headings and
 * then on paragraphs, so each heading below becomes roughly one retrievable
 * chunk. Every one of them repeats the video's title and URL, because a chunk is
 * retrieved ALONE — a chapter list that matched a question would otherwise be a
 * passage with no idea which video it belongs to.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VIDEOS } from '../content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://guide.mdgservices.in';

const outArg = process.argv.indexOf('--out');
const OUT =
  outArg > -1 && process.argv[outArg + 1]
    ? path.resolve(process.argv[outArg + 1])
    : path.resolve(
        process.env.HOME ?? '',
        'Documents/PP/mdg-rag-ingest/corpus/video-guide',
      );

/** Public-facing only. See the note above on why this is by audience. */
const PUBLISHABLE = new Set(['dealer', 'public']);

const clock = (s) => `${Math.floor(s / 60)} minute${Math.floor(s / 60) === 1 ? '' : 's'}`;

function pageFor(v, meta) {
  const url = `${ORIGIN}/${v.id}`;
  const mins = meta ? clock(meta.duration) : 'a few minutes';
  const chapters = meta
    ? meta.chapters
        .filter((c) => v.en.chapters[c.id] && v.hi.chapters[c.id])
        .map((c) => `- ${v.en.chapters[c.id]} — ${v.hi.chapters[c.id]}`)
        .join('\n')
    : '';

  /*
   * TWO sections per video, not five — and no keyword list.
   *
   * The first version wrote five sections each repeating the title and
   * description, plus a section that was nothing but the video's search
   * keywords. It measured badly, which is the only reason this is known: recall
   * over the existing eval set fell from 93.2% to 89.2% the moment it was added,
   * losing two questions about what MDG Services does and one about stock
   * variation.
   *
   * The cause is that retrieval takes the top 8 by dot product. A video page
   * about stock variation, split five ways with the words "stock variation" in
   * every part, puts five near-identical passages into that competition and
   * pushes the actual guideline clause out of it — and a video page cannot
   * answer "what is the permissible variation", it can only say that a video
   * exists.
   *
   * The keyword section was the worst of them: a bag of words with no sentence
   * in it, which matches everything in its domain and answers nothing.
   *
   * So: one section that says the video exists and what it teaches, one that
   * lists its parts, and nothing else. Both carry the URL, because a chunk is
   * retrieved alone and one that cannot name its own video is a passage the
   * assistant cannot act on.
   */
  return `## A video about ${v.en.title.toLowerCase()} — "${v.en.title}" / "${v.hi.title}"

MDG Services publishes a free video on this. In English it is called
"${v.en.title}"; in Hindi, "${v.hi.title}". It is narrated in Hindi, runs about
${mins}, and anyone can watch it at ${url} with no login.

${v.en.description}

इस विषय पर MDG Services का एक मुफ़्त वीडियो है — "${v.hi.title}"। ${v.hi.subtitle}।
${url} पर देखिए।

${v.hi.description}

## What is in "${v.en.title}", part by part

The video at ${url} covers these parts in order:

${chapters || '- (no chapter list)'}
`;
}

async function main() {
  const publishable = VIDEOS.filter((v) => PUBLISHABLE.has(v.audience ?? 'dealer'));
  const manifest = await import('../data/videos.json', { with: { type: 'json' } })
    .then((m) => m.default)
    .catch(() => []);
  const byId = Object.fromEntries(manifest.map((m) => [m.id, m]));

  // Rewritten from scratch each run: a video that has been retired must not
  // leave a page behind teaching the assistant to recommend a dead URL.
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const index = [
    '## The MDG video guide',
    '',
    `MDG Services publishes free video guides for petrol pump dealers at ${ORIGIN}`,
    'They are narrated in Hindi. Nothing has to be installed and there is no login.',
    '',
    `There are ${publishable.length} videos. They are:`,
    '',
    ...publishable.map((v) => `- ${v.en.title} (${v.hi.title}) — ${ORIGIN}/${v.id}`),
    '',
    '## MDG के वीडियो गाइड',
    '',
    `MDG Services पेट्रोल पंप डीलरों के लिए मुफ़्त वीडियो गाइड बनाती है — ${ORIGIN}`,
    'सारे वीडियो हिंदी में हैं। कुछ डाउनलोड करने की ज़रूरत नहीं, कोई लॉगिन नहीं।',
    '',
    ...publishable.map((v) => `- ${v.hi.title} — ${ORIGIN}/${v.id}`),
    '',
  ].join('\n');

  await writeFile(path.join(OUT, '00-the-video-guide.md'), index + '\n');

  let n = 0;
  for (const v of publishable) {
    n += 1;
    const name = `${String(n).padStart(2, '0')}-${v.id}.md`;
    await writeFile(path.join(OUT, name), pageFor(v, byId[v.id]));
  }

  const files = await readdir(OUT);
  console.log(`\nWrote ${files.length} pages to ${OUT}`);
  console.log(`  ${publishable.length} videos (dealer + public)`);
  console.log(
    `  ${VIDEOS.length - publishable.length} admin walkthroughs deliberately excluded — ` +
      'that assistant answers strangers',
  );
  console.log('\nNext, in ~/Documents/PP/mdg-rag-ingest:');
  console.log('  add a `video-guide` entry to src/docs.ts if it is not there yet');
  console.log('  npm run all && npm run eval && npm run publish');
}

await main();
