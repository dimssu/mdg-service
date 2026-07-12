/*
 * Local preview of dist/. Mirrors the two Vercel behaviours the site actually
 * depends on — cleanUrls (/login → login.html) and byte-range requests, without
 * which a <video> won't seek — so what you test here is what ships.
 *
 *   node scripts/build.mjs && node scripts/serve.mjs
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT) || 4321;

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
      'content-type': type,
      'content-range': `bytes ${start}-${end}/${found.size}`,
      'accept-ranges': 'bytes',
      'content-length': end - start + 1,
    });
    createReadStream(found.file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'content-type': type,
    'content-length': found.size,
    'accept-ranges': 'bytes',
  });
  createReadStream(found.file).pipe(res);
}).listen(PORT, () => {
  console.log(`guide preview → http://localhost:${PORT}`);
});
