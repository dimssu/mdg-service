/**
 * A local drop box for the Flow browser tab. The page already holds signed
 * links to every image and clip it shows; a line of JavaScript in that tab
 * fetches each one and POSTs the bytes here, so a batch of forty files is one
 * step instead of forty clicks through Chrome's one-download-at-a-time guard.
 *
 *   node films/flow-kavach/receiver.mjs      # listens on 127.0.0.1:8765
 *
 * Only binds to localhost. Answers the Private Network Access preflight Chrome
 * sends when an https page talks to a local address.
 */
import { createServer } from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const INBOX = path.join(import.meta.dirname, 'inbox');
mkdirSync(INBOX, { recursive: true });
const cors = {
  'Access-Control-Allow-Origin': 'https://flow.google.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Private-Network': 'true',
};
createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url, 'http://x');
  const name = (url.searchParams.get('name') || '').replace(/[^\w.-]/g, '');
  if (req.method !== 'POST' || !name) { res.writeHead(400, cors); return res.end('bad'); }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    writeFileSync(path.join(INBOX, name), buf);
    console.log(`saved ${name} ${buf.length}`);
    res.writeHead(200, cors); res.end('ok');
  });
}).listen(8765, '127.0.0.1', () => console.log('receiver on 127.0.0.1:8765'));
