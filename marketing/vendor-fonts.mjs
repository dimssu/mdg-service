/**
 * Vendors the brand's web fonts into `pamphlet/fonts/` and writes the
 * `pamphlet/fonts.css` that points at them.
 *
 *   node marketing/vendor-fonts.mjs          # download anything missing
 *   node marketing/vendor-fonts.mjs --force  # re-download everything
 *
 * WHY VENDOR AT ALL. The pamphlet is printed, and a PDF whose fonts came off a
 * CDN at build time is a PDF that renders differently the day the machine is
 * offline or Google reshuffles a URL. Worse, the failure is silent: Devanagari
 * with no Devanagari font does not error, it prints tofu boxes, and nobody
 * notices until a dealer is holding the sheet. Vendored files make the build
 * reproducible and offline-safe.
 *
 * Only the `latin`, `latin-ext` and `devanagari` subsets are kept. The Google
 * stylesheet also ships Cyrillic, Greek and Vietnamese cuts of every weight,
 * which this document can never reach — keeping them would quadruple the
 * directory for glyphs no dealer will ever see.
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(HERE, 'pamphlet', 'fonts');
const CSS_OUT = path.join(HERE, 'pamphlet', 'fonts.css');
const FORCE = process.argv.includes('--force');

/** Chrome's UA, so Google serves woff2 rather than a legacy format. */
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const GOOGLE_CSS =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700' +
  '&family=Noto+Sans+Devanagari:wght@400;500;600;700' +
  '&family=Space+Grotesk:wght@400;500;600;700' +
  '&family=Tiro+Devanagari+Hindi' +
  '&display=swap';

/** The only subsets this document can reach. */
const KEEP = new Set(['latin', 'latin-ext', 'devanagari']);

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Splits the Google stylesheet into `{ subset, block }` pairs.
 *
 * Google labels each `@font-face` with a comment naming its subset on the line
 * above it, and that comment is the ONLY thing distinguishing the latin cut of
 * Inter 600 from its Cyrillic cut — the family, style and weight are identical.
 * So the comment is parsed as data, not skipped as noise.
 */
function parseFaces(css) {
  const out = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css)) !== null) out.push({ subset: m[1], block: m[2] });
  return out;
}

function fieldOf(block, name) {
  const m = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  return m ? m[1].trim().replace(/^'|'$/g, '') : '';
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  await mkdir(FONT_DIR, { recursive: true });

  console.log('Fetching the font stylesheet…');
  const res = await fetch(GOOGLE_CSS, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`font stylesheet: ${res.status} ${res.statusText}`);
  const css = await res.text();

  const faces = parseFaces(css).filter((f) => KEEP.has(f.subset));
  if (faces.length === 0) {
    throw new Error(
      'No usable @font-face blocks found. Google may have changed the stylesheet ' +
        'format — check that each face is still preceded by a /* subset */ comment.',
    );
  }

  const rewritten = [];
  let made = 0;
  let skipped = 0;

  for (const { subset, block } of faces) {
    const family = fieldOf(block, 'font-family');
    const weight = fieldOf(block, 'font-weight') || '400';
    const url = (block.match(/url\((https:[^)]+)\)/) || [])[1];
    if (!url) continue;

    const file = `${slug(family)}-${weight}-${subset}.woff2`;
    const abs = path.join(FONT_DIR, file);

    if (FORCE || !(await exists(abs))) {
      process.stdout.write(`  ↓ ${file} … `);
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(`${file}: ${r.status} ${r.statusText}`);
      await writeFile(abs, Buffer.from(await r.arrayBuffer()));
      made++;
      console.log('ok');
    } else {
      skipped++;
    }

    rewritten.push(block.replace(/url\(https:[^)]+\)/, `url(./fonts/${file})`));
  }

  const header = [
    '/*',
    ' * Vendored brand fonts for the printed pamphlet.',
    ' *',
    ' * GENERATED — do not edit. Rebuild with `node marketing/vendor-fonts.mjs`.',
    ' * Only the latin, latin-ext and devanagari subsets are kept; see that script',
    ' * for why the other subsets are dropped and why the files are vendored at all.',
    ' */',
    '',
  ].join('\n');

  await writeFile(CSS_OUT, `${header}${rewritten.join('\n')}\n`, 'utf8');

  console.log(
    `\nDone. ${made} downloaded, ${skipped} already present, ` +
      `${rewritten.length} faces in fonts.css.`,
  );
}

await main();
