/**
 * Renders ONE segment exactly as the cutter would, to try a window before it
 * goes into an edit map. Nothing in the films changes.
 *
 *   node films/trial.mjs clip:S08-alwayson 6.99 out.mp4 [from] [to]
 *   node films/trial.mjs clip:S09-mdg-turn 3.97 out.mp4 still=0.3 push=1.05
 */
import path from 'node:path';
import { renderSegment, resolve } from './cut.mjs';

const [ref, slot, out, ...rest] = process.argv.slice(2);
if (!out) throw new Error('usage: node films/trial.mjs <ref> <slot seconds> <out.mp4> [from] [to] [still=t] [push=z]');
const opt = {};
const pos = [];
for (const a of rest) {
  const m = a.match(/^(still|push|from|to)=(.+)$/);
  if (m) opt[m[1]] = Number(m[2]); else pos.push(Number(a));
}
if (pos[0] != null) opt.from = pos[0];
if (pos[1] != null) opt.to = pos[1];
const r = renderSegment({ ref, src: resolve(ref), slot: Number(slot), out: path.resolve(out), ...opt });
console.log(`  ${ref} → ${out}  window ${opt.from ?? 0}–${opt.to ?? 'end'}  stretch ${r.stretch.toFixed(2)}x`);
