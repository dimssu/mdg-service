/**
 * Synthesised UI sounds — sample-accurate, free, no licence question
 * (DIRECTION §9). Writes 44.1 kHz mono WAVs into <reel>/build/audio/.
 *
 *   node marketing/reels/kit/audio/synth.mjs marketing/reels/01-dsr
 *
 * tick.wav      a soft clean UI tick (~40 ms)       — counters, a figure landing
 * tickhi.wav    a brighter tick for the key figure
 * whoosh.wav    a short airy whoosh (0.45 s)         — camera moves ≥ 0.4 s only
 * riser.wav     a 4 s noise + tone riser             — into the strongest bar
 * woodblock.wav a dry wood-block knock (~80 ms)      — the sparse pulse of the pain bars
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { reelDirFromArg } from './lib.mjs';

const SR = 44100;
const dir = reelDirFromArg();
const out = path.join(dir, 'build', 'audio');
mkdirSync(out, { recursive: true });

function wav(name, data) {
  const n = data.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * g)) * 32767), 44 + i * 2);
  writeFileSync(path.join(out, name), buf);
  console.log(`→ ${name}  ${(n / SR).toFixed(3)} s`);
}

// Deterministic noise (a reel must render the same twice).
let seed = 12345;
const noise = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

function tick(freq, len, decay) {
  const n = Math.round(len * SR), d = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t / decay) * Math.min(1, t / 0.0008);
    d[i] = env * (0.75 * Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 2.01 * t)) + env * 0.08 * noise();
  }
  return d;
}

function whoosh(len) {
  const n = Math.round(len * SR), d = new Float32Array(n);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const env = Math.sin(Math.PI * Math.pow(x, 0.7)) ** 2;
    const cut = 0.02 + 0.18 * Math.sin(Math.PI * x);       // filter opens and closes with the move
    lp += cut * (noise() - lp); lp2 += cut * (lp - lp2);
    d[i] = env * lp2;
  }
  return d;
}

function riser(len) {
  const n = Math.round(len * SR), d = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, x = i / n;
    const env = Math.pow(x, 2.2) * (x > 0.985 ? (1 - x) / 0.015 : 1);
    const f = 180 + 900 * Math.pow(x, 2);
    lp += (0.03 + 0.25 * x) * (noise() - lp);
    d[i] = env * (0.55 * lp + 0.25 * Math.sin(2 * Math.PI * f * t) + 0.12 * Math.sin(2 * Math.PI * f * 1.5 * t));
  }
  return d;
}

function woodblock() {
  const n = Math.round(0.09 * SR), d = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t / 0.018) * Math.min(1, t / 0.0005);
    d[i] = env * (Math.sin(2 * Math.PI * 820 * t) + 0.6 * Math.sin(2 * Math.PI * 1310 * t) + 0.2 * noise() * Math.exp(-t / 0.004));
  }
  return d;
}

wav('tick.wav', tick(1650, 0.045, 0.009));
wav('tickhi.wav', tick(2350, 0.06, 0.013));
wav('whoosh.wav', whoosh(0.45));
wav('riser.wav', riser(4.0));
wav('woodblock.wav', woodblock());
