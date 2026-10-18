/**
 * Word-level timing for the recorded voice, from ElevenLabs speech-to-text (Scribe). Run after voice.mjs and tighten.py (reads the .wav that is actually mixed, not the raw .mp3):
 *   node marketing/reels/02-stock-check/build/words.mjs
 * Adds lines[].wordsRel = [{ w, t0, t1 }] (seconds after the line's start; place.py turns them into reel-time `words`) and
 * lines[].heard (the transcript), then rewrites script.json + script.js. Good to about ±50 ms.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { elevenEnv, readScript, writeScript } from '../../kit/audio/lib.mjs';

const dir = path.resolve(import.meta.dirname, '..');
const e = elevenEnv();
const script = readScript(dir);
for (const l of script.lines) {
  const fd = new FormData();
  fd.append('file', new Blob([readFileSync(path.join(dir, 'build', 'audio', `${l.id}.wav`))], { type: 'audio/wav' }), `${l.id}.wav`);
  fd.append('model_id', 'scribe_v1');
  fd.append('language_code', 'hin');
  fd.append('timestamps_granularity', 'word');
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': e.ELEVENLABS_API_KEY }, body: fd });
  if (!res.ok) throw new Error(`STT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  l.heard = j.text;
  l.wordsRel = (j.words || []).filter((w) => w.type === 'word')
    .map((w) => ({ w: w.text.replace(/[,।?]+$/, ''), t0: Number(w.start.toFixed(2)), t1: Number(w.end.toFixed(2)) }));
  console.log(l.id, `[start ${l.start}]`, l.wordsRel.map((w) => `${w.w} ${(l.start + w.t0).toFixed(2)}-${(l.start + w.t1).toFixed(2)}`).join('  '));
}
writeScript(dir, script);
