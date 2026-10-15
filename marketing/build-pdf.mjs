/**
 * Prints the pamphlet HTML to press-ready A4 PDFs.
 *
 *   node marketing/build-pdf.mjs           # both languages
 *   node marketing/build-pdf.mjs hi        # just one
 *
 * Uses the Chrome already installed on the machine in headless mode. There is
 * no puppeteer here and deliberately so: this is a two-file build run by hand
 * before a print shop visit, and a browser-automation dependency in the root
 * package.json would be carried by every developer who never touches marketing.
 *
 * Page geometry lives in `pamphlet/style.css` under `@page`, not here — Chrome
 * takes the size and margins from the stylesheet, and splitting that decision
 * across two files is how a pamphlet ends up 3mm off on the second side.
 */
import { access, mkdir, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'pamphlet');
const OUT = path.join(HERE, 'out');

/** Where Chrome lives, most likely first. */
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

const SHEETS = {
  hi: { file: 'pamphlet.hi.html', out: 'dealer-kavach-pamphlet-hindi.pdf' },
  en: { file: 'pamphlet.en.html', out: 'dealer-kavach-pamphlet-english.pdf' },
};

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findChrome() {
  for (const c of CHROME_CANDIDATES) if (await exists(c)) return c;
  throw new Error(
    'Could not find Chrome. Install Google Chrome, or add its path to ' +
      'CHROME_CANDIDATES in marketing/build-pdf.mjs.',
  );
}

/**
 * Fails loudly if the fonts were never vendored.
 *
 * Without this the build still "succeeds" and quietly prints every Devanagari
 * line as empty boxes, because a missing @font-face is not an error in CSS.
 * Better to stop here with the one command that fixes it.
 */
async function assertFonts() {
  if (!(await exists(path.join(SRC, 'fonts.css')))) {
    throw new Error('Fonts are not vendored yet. Run: node marketing/vendor-fonts.mjs');
  }
  const files = await readdir(path.join(SRC, 'fonts')).catch(() => []);
  const deva = files.filter((f) => f.includes('devanagari')).length;
  if (deva === 0) {
    throw new Error(
      'No Devanagari font files in marketing/pamphlet/fonts — the Hindi sheet ' +
        'would print as empty boxes. Run: node marketing/vendor-fonts.mjs --force',
    );
  }
}

async function printSheet(chrome, lang) {
  const sheet = SHEETS[lang];
  const src = path.join(SRC, sheet.file);
  if (!(await exists(src))) throw new Error(`Missing ${path.relative(HERE, src)}`);

  const out = path.join(OUT, sheet.out);
  process.stdout.write(`  ▸ ${lang} → out/${sheet.out} … `);

  await run(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      /* The sheet loads its own woff2 files off disk; without this Chrome
         treats each one as a cross-origin request from a file:// page and
         drops it, taking the Devanagari with it. */
      '--allow-file-access-from-files',
      '--no-pdf-header-footer',
      /* Backgrounds ARE the design here — the navy bands, the gold rules and
         the service tiles are all painted. Chrome omits backgrounds when
         printing unless asked. */
      '--print-to-pdf-no-header',
      /* Gives webfonts and layout time to settle before the snapshot; a print
         from a half-loaded page is the classic silent failure. */
      '--virtual-time-budget=8000',
      `--print-to-pdf=${out}`,
      pathToFileURL(src).href,
    ],
    { maxBuffer: 1024 * 1024 * 32 },
  );

  if (!(await exists(out))) throw new Error(`Chrome produced no file for ${lang}`);
  console.log('ok');
  return out;
}

async function main() {
  const only = process.argv.slice(2).filter((a) => a in SHEETS);
  const langs = only.length ? only : Object.keys(SHEETS);

  await assertFonts();
  await mkdir(OUT, { recursive: true });
  const chrome = await findChrome();
  console.log(`Chrome: ${chrome}\n`);

  for (const lang of langs) await printSheet(chrome, lang);

  console.log(`\nDone. PDFs are in marketing/out/.`);
}

await main();
