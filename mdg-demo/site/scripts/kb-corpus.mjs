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

/* "0 minutes" was the first version of this, for every video under sixty
   seconds — which is most of the explainers. Floor division is the wrong shape
   for a duration a person reads. */
const clock = (s) => {
  if (s < 90) return 'a minute';
  return `${Math.round(s / 60)} minutes`;
};

function pageFor(v, meta) {
  const url = `${ORIGIN}/${v.id}`;
  const mins = meta ? clock(meta.duration) : 'a few minutes';
  const chapters = meta
    ? meta.chapters
        .filter((c) => v.en.chapters[c.id] && v.hi.chapters[c.id])
        .map((c) => `${v.en.chapters[c.id]} / ${v.hi.chapters[c.id]}`)
        .join('; ')
    : '';

  /*
   * ONE short passage per video, and NOT a restatement of its subject.
   *
   * Measured three times, and each measurement moved the design.
   *
   *   five sections per video, 12 videos    93.2% -> 89.2%
   *   two sections per video, 62 videos     93.2% -> 87.8%
   *   one section, both cuts, 62 videos     93.2% -> 90.5%
   *   one section, cuts collapsed, no chapters      (this)
   *
   * Two separate causes, both about competition for the top eight slots. The
   * first is sheer count. The second is that the pages restated their subject:
   * a page about reading a stock variation sheet, full of sentences about stock
   * variation, competes head-on with the guideline clause that actually answers
   * "what is the permissible variation". A catalogue entry should win "is there
   * a video about X" and LOSE "what is the rule for X"; restating the content
   * made it win both, which is the wrong one to win.
   *
   * So: what it is called in both languages, its one-line subtitle, how long it
   * runs, and where to watch each cut. No description, no chapter list — those
   * chapter labels are domain phrases ("days to deposit", "these count as
   * holidays") and they compete for exactly the questions the guidelines should
   * answer.
   */
  const urls = Object.values(v.cuts ?? {}).length
    ? Object.entries(v.cuts)
        .map(([lang, id]) => `${lang === 'en' ? 'English' : 'Hindi'}: ${ORIGIN}/${id}`)
        .join(', ')
    : `${ORIGIN}/${v.id}`;

  return `## Video: "${v.en.title}" / "${v.hi.title}"

MDG Services publishes a free video called "${v.en.title}" — in Hindi,
"${v.hi.title}". ${v.en.subtitle}. It runs about ${mins} and anyone can watch it
with no login. ${urls}

हिंदी में इसका नाम "${v.hi.title}" है। ${v.hi.subtitle}। ${urls}
`;
}

/**
 * The two cuts of a bilingual video are ONE entry.
 *
 * They are the same video with the same title and the same subject; only the
 * recording's language differs. As two entries they doubled the number of
 * passages competing for every retrieval slot and added nothing an answer could
 * use — measured at 90.5% recall against a 93.2% baseline. Collapsed, the entry
 * names both cuts and gives both URLs, which is all the assistant needs to send
 * somebody to the right one.
 */
function collapseCuts(videos) {
  const byBase = new Map();
  for (const v of videos) {
    const base = v.id.replace(/-(hi|en)$/, '');
    const cut = /-en$/.test(v.id) ? 'en' : /-hi$/.test(v.id) ? 'hi' : null;
    const row = byBase.get(base);
    if (!row) {
      byBase.set(base, { ...v, cuts: cut ? { [cut]: v.id } : {} });
    } else {
      if (cut) row.cuts[cut] = v.id;
      // Prefer the Hindi cut's copy and id: that is the one dealers watch.
      if (cut === 'hi') {
        row.hi = v.hi;
        row.en = v.en;
        row.id = v.id;
      }
    }
  }
  return [...byBase.values()];
}

async function main() {
  const publishable = collapseCuts(
    VIDEOS.filter((v) => PUBLISHABLE.has(v.audience ?? 'dealer')),
  );
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
  const admin = VIDEOS.filter((v) => !PUBLISHABLE.has(v.audience ?? 'dealer')).length;
  console.log(
    `  ${admin} admin walkthroughs deliberately excluded — that assistant answers strangers`,
  );
  console.log('\nNext, in ~/Documents/PP/mdg-rag-ingest:');
  console.log('  add a `video-guide` entry to src/docs.ts if it is not there yet');
  console.log('  npm run all && npm run eval && npm run publish');
}

await main();
