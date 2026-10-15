/**
 * Builds the whole film: clips every shot to the length its own spoken line
 * turned out to be, then cuts picture and voice together.
 *
 *   node marketing/build.mjs               # render what is missing, then cut
 *   node marketing/build.mjs --cut-only    # just re-cut from existing clips
 *   node marketing/build.mjs --model best  # the expensive model
 *
 * ── HOW THE TIMING WORKS ───────────────────────────────────────────────────
 * The voice was recorded first, so every beat has a real measured duration.
 * Each beat gets `spoken + GAP` of screen time. Veo will only render 4, 6 or 8
 * second clips, so each shot is rendered at the shortest length that covers its
 * slot and then TRIMMED back to the slot exactly. Rendering long and trimming
 * is the only way round a fixed-length generator; the alternative is a picture
 * that ends before the sentence does, which an audience always notices.
 *
 * A beat whose line runs past 8 seconds cannot be one shot, so it is split
 * across two and each covers half. Only the SDMS beat needs this today, but the
 * rule is general — shorten a line and the split disappears by itself.
 *
 * ── WHY IT RE-ENCODES RATHER THAN STREAM-COPIES ────────────────────────────
 * Concatenating these clips with `-c copy` produces non-monotonic timestamp
 * warnings and a file that plays but stutters at the joins. Everything is
 * normalised to one frame rate and re-encoded once at the end.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { MODELS, clipFor, loadKey, accessToken, renderClip } from './veo.mjs';

const ROOT = path.resolve(import.meta.dirname);
const SHOTS = path.join(ROOT, 'shots');
const CLIPS = path.join(ROOT, 'clips');
const VOICE = path.join(ROOT, 'voice');
const WORK = path.join(ROOT, '.work');

/** Breath between beats. Also what stops the cut feeling like a list. */
const GAP = 0.35;
const FPS = 24;
const CONCURRENCY = 3;

const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args]);
const probe = (f) =>
  Number(
    String(
      execFileSync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=nk=1:nw=1',
        f,
      ]),
    ).trim(),
  );

/** Which shots cover which beat, and how long each one is on screen. */
function shotlist() {
  const beats = JSON.parse(readFileSync(path.join(ROOT, 'script.json'), 'utf8')).beats;
  const voice = JSON.parse(readFileSync(path.join(VOICE, 'voice.json'), 'utf8'));
  const rows = [];

  /* Which shots belong to which beat is read off the shots themselves — each
     one names its beat — rather than inferred from its filename. Inferring it
     from the name is what broke this the first time: the pattern only matched
     the `P` cards, so every other beat matched itself twice, was listed as two
     shots, and each was rendered at half the length its line actually needed. */
  const byBeat = new Map();
  for (const f of readdirSync(SHOTS)) {
    if (!f.endsWith('.json') || f === 'prompts.json') continue;
    const shot = JSON.parse(readFileSync(path.join(SHOTS, f), 'utf8'));
    const beat = shot.beat ?? shot.id;
    if (!byBeat.has(beat)) byBeat.set(beat, []);
    byBeat.get(beat).push(shot.id);
  }

  for (const b of beats) {
    const ids = (byBeat.get(b.id) ?? [b.id]).sort();
    const each = (voice[b.id].seconds + GAP) / ids.length;
    for (const id of ids) rows.push({ id, beat: b.id, screen: each, render: clipFor(each) });
  }

  const orphans = [...byBeat.keys()].filter((k) => !beats.some((b) => b.id === k));
  if (orphans.length) console.log(`  ! shots with no beat: ${orphans.join(', ')}`);
  return { rows, voice, beats };
}

async function renderAll(rows, model) {
  const key = loadKey();
  const token = await accessToken(key);
  mkdirSync(CLIPS, { recursive: true });

  /* A clip is only reusable if it is also LONG ENOUGH for its slot. The first
     two cards were rendered at a flat four seconds before the voice existed;
     their lines turned out to need six and eight. Skipping on existence alone
     silently leaves the picture short, and because every later beat then starts
     early, one stale clip drags the whole film out of sync with the words. */
  const todo = rows.filter((r) => {
    const f = path.join(CLIPS, `${r.id}.mp4`);
    if (!existsSync(f) || statSync(f).size < 50_000) return true;
    return probe(f) + 0.05 < r.screen;
  });
  if (!todo.length) {
    console.log('  all clips already rendered\n');
    return;
  }
  console.log(`  ${todo.length} clips to render on ${model}\n`);

  let next = 0;
  let done = 0;
  const failed = [];

  async function worker() {
    while (next < todo.length) {
      const r = todo[next++];
      const shot = JSON.parse(readFileSync(path.join(SHOTS, `${r.id}.json`), 'utf8'));
      try {
        const bytes = await renderClip({
          token,
          project: key.project_id,
          model,
          stillPath: path.join(SHOTS, `${r.id}.png`),
          motion: shot.motion,
          seconds: r.render,
        });
        writeFileSync(path.join(CLIPS, `${r.id}.mp4`), bytes);
        console.log(`  + ${String(++done).padStart(2)}/${todo.length}  ${r.id}  (${r.render}s)`);
      } catch (e) {
        failed.push(r.id);
        console.log(`  ! ${String(++done).padStart(2)}/${todo.length}  ${r.id}  ${e.message.slice(0, 90)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (failed.length) console.log(`\n  ${failed.length} failed: ${failed.join(', ')}`);
}

function cut(rows, beats) {
  mkdirSync(WORK, { recursive: true });

  /* Picture: trim each clip to its slot and normalise, so the joins are clean. */
  const segs = [];
  for (const r of rows) {
    const src = path.join(CLIPS, `${r.id}.mp4`);
    if (!existsSync(src)) {
      console.log(`  skipping ${r.id} — no clip`);
      continue;
    }
    const out = path.join(WORK, `v-${r.id}.mp4`);
    /* `tpad` holds the last frame if a clip somehow comes back short, then the
       trim cuts it back to the slot. Every segment is therefore EXACTLY its
       slot long, so picture and voice cannot drift apart no matter what Veo
       returned. A held frame for a fraction of a second is invisible; a film
       that slides out of sync with its own narration is not. */
    ff(['-i', src,
        '-vf', `tpad=stop_mode=clone:stop_duration=2,fps=${FPS}`,
        '-t', r.screen.toFixed(3),
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
        '-pix_fmt', 'yuv420p', '-an', out]);
    const got = probe(out);
    if (Math.abs(got - r.screen) > 0.08) {
      console.log(`  ! ${r.id} came out ${got.toFixed(2)}s, wanted ${r.screen.toFixed(2)}s`);
    }
    segs.push(out);
  }
  writeFileSync(path.join(WORK, 'v.txt'), segs.map((f) => `file '${f}'`).join('\n') + '\n');

  /* Voice: the same slots, so picture and words cannot drift apart. */
  ff(['-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`, '-t', String(GAP),
      '-q:a', '4', path.join(WORK, 'gap.mp3')]);
  const auds = [];
  for (const b of beats) {
    auds.push(path.join(VOICE, `${b.id}.mp3`));
    auds.push(path.join(WORK, 'gap.mp3'));
  }
  writeFileSync(path.join(WORK, 'a.txt'), auds.map((f) => `file '${f}'`).join('\n') + '\n');

  const vcat = path.join(WORK, 'video.mp4');
  const acat = path.join(WORK, 'audio.mp3');
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'v.txt'), '-c', 'copy', vcat]);
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'a.txt'),
      '-ar', '44100', '-ac', '1', '-b:a', '128k', acat]);

  /* CRF 16 — a visually lossless MASTER. It used to be 28, to squeeze under
     WhatsApp's 16 MB forwarding limit, which threw away 78% of the bitrate Veo
     delivered (7,158 kb/s in, 1,569 kb/s out) before the branding pass then
     re-encoded it twice more. The forwarding limit is met by a separate 720p
     derivative instead; there is no reason to damage the master to hit it. */
  const out = path.join(ROOT, 'mdg-film.mp4');
  ff(['-i', vcat, '-i', acat,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', out]);

  return { out, video: probe(vcat), audio: probe(acat), final: probe(out) };
}

async function main() {
  const args = process.argv.slice(2);
  const model = MODELS[args.includes('--model') ? args[args.indexOf('--model') + 1] : 'fast'];
  const { rows, beats } = shotlist();

  console.log(`\n  ${rows.length} shots · ${beats.length} beats\n`);
  if (!args.includes('--cut-only')) await renderAll(rows, model);

  console.log('\n  cutting…');
  const r = cut(rows, beats);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const mb = (statSync(r.out).size / 1e6).toFixed(1);
  console.log(`\n  picture ${mmss(r.video)} · voice ${mmss(r.audio)} · film ${mmss(r.final)} · ${mb} MB`);
  console.log(`  → marketing/mdg-film.mp4\n`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
