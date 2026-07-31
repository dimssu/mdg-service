/*
 * Generates the whole guide site into dist/ — a dashboard plus one watch page per
 * video. No framework, no dependencies, no ffmpeg: it only stitches together copy
 * (content.mjs), measurements (data/videos.json) and the pre-encoded media in
 * public/, all of which are committed. That is what lets Vercel build this in a
 * couple of seconds with nothing installed.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AUDIENCES, DEFAULT_LANG, LANGS, UI, VIDEOS } from '../content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://guide.mdgservices.in';

/**
 * How each audience is introduced, and whether its videos carry a step number.
 *
 * Only the dealer path is numbered. "भाग 1…6" is a promise that the videos are a
 * course to be taken in order; the admin walkthroughs are reference material for a
 * different reader entirely, so they get a labelled section of their own and a
 * "टीम / Team" tag rather than a place in someone else's sequence.
 */
const SECTIONS = {
  dealer: { label: 'sectionDealer', note: 'sectionDealerNote', numbered: true },
  admin: { label: 'sectionAdmin', note: 'sectionAdminNote', numbered: false },
};

const audienceOf = (v) => (SECTIONS[v.audience] ? v.audience : 'dealer');

/**
 * Portrait unless the manifest says otherwise — the field arrived with the first
 * landscape (admin) video, so a row written before it is a phone-shaped dealer clip.
 */
const shapeOf = (m) => ({
  orientation: m.orientation ?? 'portrait',
  width: m.width ?? 1080,
  height: m.height ?? 1920,
});

/**
 * The intrinsic size of the generated thumbnail: build-guide-media cuts it at a
 * fixed 240px wide (`scale=240:-2`) and lets the height follow the master's aspect.
 * These go on the <img> so the row holds its shape before the file arrives.
 */
const THUMB_WIDTH = 240;
const thumbBox = (m) => {
  const s = shapeOf(m);
  return {
    width: THUMB_WIDTH,
    height: Math.round((THUMB_WIDTH * s.height) / s.width / 2) * 2,
  };
};

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clock = (sec) => {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

/** Both languages, one after the other — CSS reveals whichever is active. */
const bi = (tag, pick, cls = '') => {
  const c = cls ? ` class="${cls}"` : '';
  return LANGS.map((l) => `<${tag} lang="${l}"${c}>${esc(pick(l))}</${tag}>`).join('');
};

/**
 * Applied before first paint so a returning viewer never sees a flash of the
 * language they didn't choose. Hand-rolled instead of URLSearchParams to stay
 * safe on old Android WebViews.
 */
const LANG_BOOT =
  `(function(){var d=document.documentElement;d.className='';try{` +
  `var m=/[?&]lang=(hi|en)/.exec(location.search);` +
  `var l=m?m[1]:localStorage.getItem('dk_lang');` +
  `if(l!=='hi'&&l!=='en')l='${DEFAULT_LANG}';` +
  `d.setAttribute('data-lang',l);d.setAttribute('lang',l);` +
  `}catch(e){}})();`;

function page({ slug, title, description, ogImage, body, css, js, extra = '' }) {
  const canonical = slug ? `${ORIGIN}/${slug}` : ORIGIN;
  return `<!doctype html>
<html lang="${DEFAULT_LANG}" data-lang="${DEFAULT_LANG}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fafaf9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0c0a09" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ORIGIN}${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<script>${LANG_BOOT}</script>
<style>${css}</style>
</head>
<body>
<div class="wrap">
${body}
<footer>
  <div>${esc(UI[DEFAULT_LANG].footer)}</div>
</footer>
</div>
${extra}
<script>${js}</script>
</body>
</html>
`;
}

const header = () => `<header class="top">
  <a class="brand" href="/">
    <span class="mark" aria-hidden="true">DK</span>
    <span>${esc(UI.hi.brand)}</span>
  </a>
  <button class="lang" id="lang" type="button">
    ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].langSwitchLabel)}</span>`).join('')}
  </button>
</header>`;

/**
 * The searchable text, emitted as JSON alongside the cards.
 *
 * BOTH languages go in every entry regardless of which one is on screen, so a
 * dealer reading Hindi who types "photo" still finds "हार्डकॉपी फोटो" — people
 * search in whatever language reaches their fingers first, which on an Android
 * keyboard is often not the one they are reading.
 *
 * Chapters are indexed too: with only six videos, the useful question is rarely
 * "which video?" but "where in it?", and a chapter hit can deep-link to the second.
 *
 * `keywords` exists because substring matching cannot bridge a vocabulary gap: the
 * login video is titled "Logging in to the app", so someone typing the obvious word
 * — "login" — found nothing at all. Aliases (including romanised Hindi, which is how
 * people type on an English keyboard) are the honest fix.
 */
function searchIndex(videos, byId) {
  return videos.map((v, i) => ({
    i,
    u: `/${v.id}`,
    t: LANGS.map((l) => v[l].title),
    s: LANGS.map((l) => v[l].subtitle),
    d: LANGS.map((l) => v[l].description),
    k: (v.keywords ?? []).join(' '),
    c: byId[v.id].chapters
      .filter((c) => v.hi.chapters[c.id] && v.en.chapters[c.id])
      .map((c) => [c.start, v.hi.chapters[c.id], v.en.chapters[c.id]]),
  }));
}

/**
 * One card. `i` is its position in the whole flat list — search addresses cards by
 * it — while `n` is its position inside its own section, which is what gets shown.
 */
function card(v, i, n, section, byId) {
  const m = byId[v.id];
  const shape = shapeOf(m);
  const wide = shape.orientation === 'landscape';
  const box = thumbBox(m);

  // Numbered for dealers, tagged for the team. Either way it is the same slot, so
  // the cards stay one visual family down the page.
  const eyebrow = section.numbered
    ? `<span class="eyebrow">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].step)} ${n + 1}</span>`).join('')}</span>`
    : `<span class="eyebrow tag">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].teamTag)}</span>`).join('')}</span>`;

  // The chapter deep-link is a sibling of the card, not a child: a link inside
  // a link is invalid, and the whole card is already one.
  return `<li class="item" data-i="${i}">
  <a class="card" href="/${v.id}">
    <span class="thumb${wide ? ' wide' : ''}">
      <img src="${m.thumb}" alt="" width="${box.width}" height="${box.height}" loading="lazy" decoding="async">
    </span>
    <span class="card-body">
      ${eyebrow}
      ${bi('h2', (l) => v[l].title)}
      ${bi('p', (l) => v[l].subtitle)}
      <span class="card-foot">${clock(m.duration)} &middot; ${mb(m.sizes.low)}</span>
    </span>
    <span class="chev" aria-hidden="true">&rsaquo;</span>
  </a>
  <div class="hits" hidden></div>
</li>`;
}

function dashboard(groups, videos, byId) {
  const totalLow = videos.reduce((a, v) => a + byId[v.id].sizes.low, 0);

  // One <ul>, with the section headings as list items inside it. Search reorders
  // cards by re-appending them, and it can only do that within a single parent —
  // two separate lists would mean results that can never rank against each other.
  let i = 0;
  const cards = groups
    .map(({ section, items }) => {
      const head = `<li class="sec">
  ${bi('h2', (l) => UI[l][section.label])}
  ${bi('p', (l) => UI[l][section.note])}
</li>`;
      return [head, ...items.map((v, n) => card(v, i++, n, section, byId))].join('\n');
    })
    .join('\n');

  const body = `${header()}
<main>
  <div class="hero">
    ${bi('h1', (l) => `${UI[l].brand} ${UI[l].siteTitle}`)}
    ${bi('p', (l) => UI[l].tagline)}
  </div>

  <div class="search js-only">
    <label class="sr" for="q">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].searchLabel)}</span>`).join('')}</label>
    <div class="search-box">
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input id="q" type="search" autocomplete="off" autocorrect="off" spellcheck="false"
        enterkeyhint="search" ${LANGS.map((l) => `data-ph-${l}="${esc(UI[l].searchPlaceholder)}"`).join(' ')}>
      <button id="qx" type="button" hidden>
        <span class="sr">${esc(UI.hi.searchClear)}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  </div>

  <div class="meta-row" id="meta">
    <span class="pill" id="count">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].videoCount(videos.length))}</span>`).join('')}</span>
    <span class="pill accent">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].hindiAudio)}</span>`).join('')}</span>
    <span class="pill" id="size">${mb(totalLow)}</span>
  </div>

  <ul class="list" id="list">
${cards}
  </ul>

  <div class="empty" id="empty" hidden>
    ${bi('h2', (l) => UI[l].searchNoneTitle)}
    ${bi('p', (l) => UI[l].searchNoneDesc)}
    <button class="showall" id="showall" type="button">
      ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].searchShowAll)}</span>`).join('')}
    </button>
  </div>
</main>`;

  // The handful of strings the search has to build at runtime (counts vary, so
  // they can't be pre-rendered like the rest of the bilingual copy).
  const strings = Object.fromEntries(
    LANGS.map((l) => [
      l,
      {
        all: UI[l].videoCount(videos.length),
        one: UI[l].searchCount(1),
        many: UI[l].searchCount(2).replace('2', '{n}'),
        best: UI[l].searchBest,
        jump: UI[l].searchJump,
        ph: UI[l].searchPlaceholder,
      },
    ]),
  );

  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  const extra =
    `<script id="idx" type="application/json">${json(searchIndex(videos, byId))}</script>` +
    `<script id="str" type="application/json">${json(strings)}</script>`;

  return { body, title: `${UI.hi.brand} ${UI.hi.siteTitle} · Learn`, extra };
}

/**
 * `siblings` is the video's own section, not the whole library: paging out of the
 * dealer course and into an internal walkthrough would be a wrong turn, and paging
 * back the other way would drop an admin into part 1 of a dealer's guide.
 */
function watch(v, siblings, byId) {
  const m = byId[v.id];
  const shape = shapeOf(m);
  const i = siblings.indexOf(v);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];

  const chapters = m.chapters
    .filter((c) => v.hi.chapters[c.id] && v.en.chapters[c.id])
    .map(
      (c) => `<li>
  <a href="#t=${c.start}" data-t="${c.start}">
    <span class="t">${clock(c.start)}</span>
    <span>${LANGS.map((l) => `<span lang="${l}">${esc(v[l].chapters[c.id])}</span>`).join('')}</span>
  </a>
</li>`,
    )
    .join('\n');

  const body = `${header()}
<main>
  <a class="back" href="/">&lsaquo; ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].back)}</span>`).join('')}</a>

  <div class="player${shape.orientation === 'landscape' ? ' wide' : ''}" style="aspect-ratio:${shape.width}/${shape.height}">
    <video id="v" controls playsinline preload="none"
      poster="${m.poster}"
      data-tiny="${m.src.tiny}"
      data-low="${m.src.low}"
      data-high="${m.src.high}">
      <source src="${m.src.low}" type="video/mp4">
    </video>
  </div>
  ${bi('p', (l) => UI[l].playHint, 'hint')}

  ${bi('h1', (l) => v[l].title, 'title')}
  ${bi('p', (l) => v[l].subtitle, 'sub')}
  ${bi('p', (l) => v[l].description, 'desc')}

  <div class="panel share-panel" data-url="${ORIGIN}/${v.id}"
    ${LANGS.map((l) => `data-text-${l}="${esc(v[l].title)}"`).join(' ')}>
    <div class="share-row">
      <button class="share" id="share" type="button" hidden>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/></svg>
        ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].share)}</span>`).join('')}
      </button>
      <button class="copy" id="copy" type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].copyLink)}</span>`).join('')}
      </button>
    </div>
    <p class="url" id="url">${ORIGIN}/${v.id}</p>
  </div>

  <div class="panel">
    <h3>${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].chapters)}</span>`).join('')}</h3>
    <ul class="chapters">
${chapters}
    </ul>
  </div>

  <div class="panel">
    <a class="dl" id="dl" href="${m.src.low}" download="${v.id}.mp4">
      <span aria-hidden="true">&darr;</span>
      ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].download)}</span>`).join('')}
    </a>
    ${bi('p', (l) => UI[l].downloadHint, 'dl-hint')}
  </div>

  <nav class="pager">
    ${prev ? `<a class="pv" href="/${prev.id}"><span aria-hidden="true">&lsaquo;</span><span>${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].prev)}</span>`).join('')}</span></a>` : '<span></span>'}
    ${next ? `<a class="nx" href="/${next.id}"><span>${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].next)}</span>`).join('')}</span><span aria-hidden="true">&rsaquo;</span></a>` : '<span></span>'}
  </nav>
</main>
<div class="toast" id="toast" hidden></div>`;

  // Strings the player raises at runtime — an automatic quality change, or the
  // result of a share. They can't be pre-rendered bilingually like static copy.
  const strings = Object.fromEntries(
    LANGS.map((l) => [
      l,
      {
        dropped: UI[l].autoDropped,
        raised: UI[l].autoRaised,
        slow: UI[l].dataNote,
        copied: UI[l].shareCopied,
        failed: UI[l].shareFailed,
        shareText: UI[l].shareText,
      },
    ]),
  );
  const extra = `<script id="str" type="application/json">${JSON.stringify(strings).replace(/</g, '\\u003c')}</script>`;

  return { body, title: `${v.hi.title} · ${v.en.title}`, extra };
}

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="8" fill="#18181b"/>
<path d="M13 10.5v11l9-5.5-9-5.5z" fill="#fff"/>
</svg>
`;

async function main() {
  // Each page gets only the script it actually runs. The search is ~9 kB of JS a
  // watch page would never execute, and on 2G that is not a rounding error.
  const [rawCss, rawSearchCss, shellJs, searchJs, playerJs, manifest] = await Promise.all([
    readFile(path.join(ROOT, 'src/styles.css'), 'utf8'),
    readFile(path.join(ROOT, 'src/search.css'), 'utf8'),
    readFile(path.join(ROOT, 'src/shell.js'), 'utf8'),
    readFile(path.join(ROOT, 'src/search.js'), 'utf8'),
    readFile(path.join(ROOT, 'src/player.js'), 'utf8'),
    readFile(path.join(ROOT, 'data/videos.json'), 'utf8').then(JSON.parse),
  ]);

  // Comments and indentation are the only safe things to strip without a real
  // parser, and compression flattens the rest anyway.
  const squeeze = (t) =>
    t
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  const css = squeeze(rawCss);
  const searchCss = squeeze(rawSearchCss);

  const byId = Object.fromEntries(manifest.map((m) => [m.id, m]));

  /*
   * A content entry with no manifest row has copy but no video. That is normally a
   * mistake, but it is also the honest state of a tutorial that has been written and
   * not yet rendered — so it is a warning, not a wall, and the rest of the site still
   * ships. GUIDE_STRICT=1 turns it back into a hard failure for a release build.
   */
  const missing = VIDEOS.filter((v) => !byId[v.id]);
  if (missing.length) {
    const message =
      `No media for: ${missing.map((v) => v.id).join(', ')}. ` +
      'Render the masters into mdg-demo/out/, then run `npm run guide:media` in mdg-demo: ' +
      'it probes each master, encodes a portrait or landscape ladder to match its shape, ' +
      'and rewrites site/data/videos.json.';
    if (process.env.GUIDE_STRICT) throw new Error(message);
    console.warn(`! ${message}\n! Skipping those pages for now (GUIDE_STRICT=1 to fail instead).`);
  }

  const published = VIDEOS.filter((v) => byId[v.id]);
  if (!published.length) throw new Error('No video has any media — nothing to build.');

  // Flat order = section order, and it is the order search addresses cards in.
  const groups = AUDIENCES.map((a) => ({
    section: SECTIONS[a],
    items: published.filter((v) => audienceOf(v) === a),
  })).filter((g) => g.items.length);
  const ordered = groups.flatMap((g) => g.items);

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });

  const dash = dashboard(groups, ordered, byId);
  await writeFile(
    path.join(DIST, 'index.html'),
    page({
      slug: '',
      title: dash.title,
      description: UI[DEFAULT_LANG].metaDescription,
      ogImage: byId[ordered[0].id].og,
      body: dash.body,
      css: css + '\n' + searchCss,
      js: shellJs + searchJs,
      extra: dash.extra,
    }),
  );

  for (const g of groups) {
    for (const v of g.items) {
      const w = watch(v, g.items, byId);
      await writeFile(
        path.join(DIST, `${v.id}.html`),
        page({
          slug: v.id,
          title: w.title,
          description: v[DEFAULT_LANG].description,
          ogImage: byId[v.id].og,
          body: w.body,
          css,
          js: shellJs + playerJs,
          extra: w.extra,
        }),
      );
    }
  }

  await writeFile(path.join(DIST, 'icon.svg'), ICON);
  await writeFile(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  );
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['', ...ordered.map((v) => v.id)]
  .map((s) => `  <url><loc>${ORIGIN}${s ? `/${s}` : '/'}</loc></url>`)
  .join('\n')}
</urlset>
`,
  );

  console.log(
    `Built ${ordered.length + 1} pages → dist/  (` +
      groups.map((g) => `${UI.en[g.section.label]}: ${g.items.length}`).join(', ') +
      ')',
  );
  const kb = (s) => (s.length / 1024).toFixed(1);
  console.log(`  css: dashboard ${kb(css + searchCss)} kB, watch ${kb(css)} kB`);
  console.log(`  js: dashboard ${kb(shellJs + searchJs)} kB, watch ${kb(shellJs + playerJs)} kB`);
}

await main();
