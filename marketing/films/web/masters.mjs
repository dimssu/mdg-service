/**
 * Writes the three playlists the browser's OWN player is given, next to the
 * full master.m3u8 (which hls.js reads and orders itself). Safari, iOS and the
 * Android player start on the FIRST variant listed and only then adapt, and the
 * Android player will also climb to the top rung if it is listed. So the page
 * picks one of these by the viewer's network instead of handing over the lot:
 *
 *   hd.m3u8    720p first, every rung        (good network: start sharp)
 *   sd.m3u8    540p first, nothing above 720 (Chrome says "3g")
 *   lite.m3u8  360p first, nothing above 540 (2G or data saver)
 *
 * master.m3u8 itself is left exactly as uploaded: it is immutable and cached.
 *   node films/web/masters.mjs <dir-with-master.m3u8>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const lines = readFileSync(path.join(dir, 'master.m3u8'), 'utf8').split('\n').filter((l) => l.trim());
const head = lines.filter((l) => !l.startsWith('#EXT-X-STREAM-INF') && !l.endsWith('.m3u8'));
const vars = new Map();
for (let i = 0; i < lines.length; i++) if (lines[i].startsWith('#EXT-X-STREAM-INF')) vars.set(lines[i + 1].split('/')[0], [lines[i], lines[i + 1]]);
const PLAYLISTS = { hd: ['r1', 'r0', 'r2', 'r3', 'r4'], sd: ['r2', 'r1', 'r3', 'r4'], lite: ['r3', 'r2', 'r4'] };
for (const [name, order] of Object.entries(PLAYLISTS)) {
  const pick = order.map((r) => vars.get(r)).filter(Boolean);
  writeFileSync(path.join(dir, `${name}.m3u8`), [...head, ...pick.flatMap(([inf, uri]) => [inf, uri, ''])].join('\n'));
  console.log(`${name}.m3u8: ${pick.map((v) => v[1].split('/')[0]).join(' ')}`);
}
