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

import { DEFAULT_LANG, LANGS, UI, VIDEOS } from '../content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://guide.mdgservices.in';

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
  return LANGS.map(
    (l) => `<${tag} lang="${l}"${c}>${esc(pick(l))}</${tag}>`,
  ).join('');
};

/**
 * Applied before first paint so a returning viewer never sees a flash of the
 * language they didn't choose. Hand-rolled instead of URLSearchParams to stay
 * safe on old Android WebViews.
 */
const LANG_BOOT =
  `(function(){try{var m=/[?&]lang=(hi|en)/.exec(location.search);` +
  `var l=m?m[1]:localStorage.getItem('dk_lang');` +
  `if(l!=='hi'&&l!=='en')l='${DEFAULT_LANG}';` +
  `var d=document.documentElement;d.setAttribute('data-lang',l);d.setAttribute('lang',l);` +
  `}catch(e){}})();`;

function page({ slug, title, description, ogImage, body, css, js }) {
  const canonical = slug ? `${ORIGIN}/${slug}` : ORIGIN;
  return `<!doctype html>
<html lang="${DEFAULT_LANG}" data-lang="${DEFAULT_LANG}">
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

function dashboard(videos, byId) {
  const totalLow = videos.reduce((a, v) => a + byId[v.id].sizes.low, 0);

  const cards = videos
    .map((v, i) => {
      const m = byId[v.id];
      return `<li>
  <a class="card" href="/${v.id}">
    <span class="thumb">
      <img src="${m.thumb}" alt="" width="240" height="426" loading="lazy" decoding="async">
    </span>
    <span class="card-body">
      <span class="eyebrow">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].step)} ${i + 1}</span>`).join('')}</span>
      ${bi('h2', (l) => v[l].title)}
      ${bi('p', (l) => v[l].subtitle)}
      <span class="card-foot">${clock(m.duration)} &middot; ${mb(m.sizes.low)}</span>
    </span>
    <span class="chev" aria-hidden="true">&rsaquo;</span>
  </a>
</li>`;
    })
    .join('\n');

  const body = `${header()}
<main>
  <div class="hero">
    ${bi('h1', (l) => `${UI[l].brand} ${UI[l].siteTitle}`)}
    ${bi('p', (l) => UI[l].tagline)}
    <div class="meta-row">
      <span class="pill">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].videoCount(videos.length))}</span>`).join('')}</span>
      <span class="pill accent">${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].hindiAudio)}</span>`).join('')}</span>
      <span class="pill">${mb(totalLow)}</span>
    </div>
  </div>
  <ul class="list">
${cards}
  </ul>
</main>`;

  return { body, title: `${UI.hi.brand} ${UI.hi.siteTitle} · Learn` };
}

function watch(v, i, videos, byId) {
  const m = byId[v.id];
  const prev = videos[i - 1];
  const next = videos[i + 1];

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

  const qBtn = (q) => `<button class="q" type="button" data-q="${q}">
  ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l][q === 'low' ? 'qualityLow' : 'qualityHigh'])}<small>${esc(UI[l][q === 'low' ? 'qualityLowHint' : 'qualityHighHint'])}</small></span>`).join('')}
</button>`;

  const body = `${header()}
<main>
  <a class="back" href="/">&lsaquo; ${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].back)}</span>`).join('')}</a>

  <div class="player">
    <video id="v" controls playsinline preload="none"
      poster="${m.poster}"
      data-low="${m.src.low}"
      data-high="${m.src.high}">
      <source src="${m.src.low}" type="video/mp4">
    </video>
  </div>
  ${bi('p', (l) => UI[l].playHint, 'hint')}

  ${bi('h1', (l) => v[l].title, 'title')}
  ${bi('p', (l) => v[l].subtitle, 'sub')}
  ${bi('p', (l) => v[l].description, 'desc')}

  <div class="panel">
    <h3>${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].quality)}</span>`).join('')}</h3>
    <div class="qbtns">
      ${qBtn('low')}
      ${qBtn('high')}
    </div>
    <p class="note" id="note" hidden>${LANGS.map((l) => `<span lang="${l}">${esc(UI[l].dataNote)}</span>`).join('')}</p>
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
</main>`;

  return { body, title: `${v.hi.title} · ${v.en.title}` };
}

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="8" fill="#18181b"/>
<path d="M13 10.5v11l9-5.5-9-5.5z" fill="#fff"/>
</svg>
`;

async function main() {
  const [rawCss, js, manifest] = await Promise.all([
    readFile(path.join(ROOT, 'src/styles.css'), 'utf8'),
    readFile(path.join(ROOT, 'src/app.js'), 'utf8'),
    readFile(path.join(ROOT, 'data/videos.json'), 'utf8').then(JSON.parse),
  ]);

  // Comments and indentation are the only safe things to strip without a real
  // parser, and compression flattens the rest anyway.
  const css = rawCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();

  const byId = Object.fromEntries(manifest.map((m) => [m.id, m]));
  const missing = VIDEOS.filter((v) => !byId[v.id]);
  if (missing.length) {
    throw new Error(
      `No media for: ${missing.map((v) => v.id).join(', ')}. Run \`npm run guide:media\` in mdg-demo first.`,
    );
  }

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });

  const dash = dashboard(VIDEOS, byId);
  await writeFile(
    path.join(DIST, 'index.html'),
    page({
      slug: '',
      title: dash.title,
      description: UI[DEFAULT_LANG].metaDescription,
      ogImage: byId[VIDEOS[0].id].og,
      body: dash.body,
      css,
      js,
    }),
  );

  for (let i = 0; i < VIDEOS.length; i++) {
    const v = VIDEOS[i];
    const w = watch(v, i, VIDEOS, byId);
    await writeFile(
      path.join(DIST, `${v.id}.html`),
      page({
        slug: v.id,
        title: w.title,
        description: v[DEFAULT_LANG].description,
        ogImage: byId[v.id].og,
        body: w.body,
        css,
        js,
      }),
    );
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
${['', ...VIDEOS.map((v) => v.id)]
  .map((s) => `  <url><loc>${ORIGIN}${s ? `/${s}` : '/'}</loc></url>`)
  .join('\n')}
</urlset>
`,
  );

  console.log(`Built ${VIDEOS.length + 1} pages → dist/`);
  console.log(`  inlined css ${(css.length / 1024).toFixed(1)} kB, js ${(js.length / 1024).toFixed(1)} kB`);
}

await main();
