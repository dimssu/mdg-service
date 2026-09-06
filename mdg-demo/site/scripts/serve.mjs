/*
 * Local preview of dist/. Mirrors the three Vercel behaviours the site actually
 * depends on — cleanUrls (/login → login.html), byte-range requests, without
 * which a <video> won't seek, and the response headers — so what you test here
 * is what ships.
 *
 *   node scripts/build.mjs && node scripts/serve.mjs
 */
import { createReadStream, readFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;

/**
 * The production response headers, READ OUT OF vercel.json rather than copied.
 *
 * The preview used to send no Content-Security-Policy at all while production
 * pinned `media-src` and `img-src` to 'self'. That gap is invisible in exactly
 * the case it matters most: point a video at a CDN, watch it play perfectly on
 * localhost, and discover on the live site that the browser refused to load it.
 * A copied string would drift the same way within a release, so this parses the
 * real file — one source of truth, and a preview that fails where production
 * fails.
 */
function productionHeaders() {
  const cfg = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const out = {};
  for (const rule of cfg.headers ?? []) {
    // Only the catch-all rule: the /media/(.*) rule sets a one-year immutable
    // cache that would make a preview serve yesterday's edit for a year.
    if (rule.source !== '/(.*)') continue;
    for (const h of rule.headers ?? []) out[h.key.toLowerCase()] = h.value;
  }
  return out;
}

const SECURITY_HEADERS = productionHeaders();

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolve(pathname) {
  const clean = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  for (const candidate of [
    path.join(DIST, clean),
    path.join(DIST, `${clean}.html`),
    path.join(DIST, clean, 'index.html'),
  ]) {
    if (!candidate.startsWith(DIST)) continue;
    try {
      const s = await stat(candidate);
      if (s.isFile()) return { file: candidate, size: s.size };
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const found = await resolve(pathname === '/' ? '/index.html' : pathname);

  if (!found) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404');
    return;
  }

  const type = TYPES[path.extname(found.file)] ?? 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? Number(m[1]) : 0;
    const end = m?.[2] ? Number(m[2]) : found.size - 1;
    res.writeHead(206, {
      ...SECURITY_HEADERS,
      'content-type': type,
      'content-range': `bytes ${start}-${end}/${found.size}`,
      'accept-ranges': 'bytes',
      'content-length': end - start + 1,
    });
    createReadStream(found.file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'content-type': type,
    'content-length': found.size,
    'accept-ranges': 'bytes',
  });
  createReadStream(found.file).pipe(res);
}).listen(PORT, () => {
  console.log(`guide preview → http://localhost:${PORT}`);
  console.log(`  sending production headers: ${Object.keys(SECURITY_HEADERS).join(', ')}`);
});
