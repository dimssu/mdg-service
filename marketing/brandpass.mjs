/**
 * Lays MDG's brand and its actual product over the cut film.
 *
 *   node marketing/brandpass.mjs        # reads mdg-film.mp4, writes mdg-film-branded.mp4
 *
 * Three things happen here and nothing else — the edit itself is already done
 * by `build.mjs`, and re-cutting to add branding would risk the voice sync that
 * file works hard to hold.
 *
 *   1. PHONE CARDS. On the Act 3 beats that promise something, the thing the
 *      dealer actually receives slides in beside him. This is the point the
 *      film was missing: it described a service without once showing it.
 *   2. THE MARK. A small logo, bottom centre, from the turn onwards. Not over
 *      Act 1 — branding a man's worst week with your own logo reads as
 *      gloating, and the mark means more when it arrives with the relief.
 *   3. THE OUTRO. Two cards appended after the last beat.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────────
 * No Play Store badge. The listing returns 404 — the app is in closed testing —
 * so a badge would point at nothing. The outro says the team installs it, which
 * is both true today and still true the day the listing goes live.
 *
 * No testimonial, no dealer's face, no "trusted by N pumps". There are no
 * testimonials and the published pump count is not supported by anything.
 *
 * Every figure on the phone cards is the company's own published illustrative
 * set — invented, internally consistent, from no real outlet.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const PANELS = path.join(ROOT, 'panels');
const WORK = path.join(ROOT, '.work');
const FILM = path.join(ROOT, 'mdg-film.mp4');
const OUT = path.join(ROOT, 'mdg-film-branded.mp4');

const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'pipe' });
const dur = (f) =>
  Number(
    String(
      execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nk=1:nw=1', f]),
    ).trim(),
  );

/* Where each card appears, in seconds from the start of the film. Timings come
   from the measured voice, so they land on the sentence that promises them. */
const CARDS = [
  { panel: 'p-credit', at:  82.4, hold: 3.1 },   // S01 "हर तारीख़ की ख़बर, तारीख़ आने से पहले"
  { panel: 'p-dsr',    at:  86.3, hold: 6.6 },   // S02 "डी-एस-आर रोज़ बनकर आपके फ़ोन पर"
  { panel: 'p-stock',  at:  93.5, hold: 5.9 },   // S03 "तेल कम है या ज़्यादा, हर सुबह साफ़-साफ़"
  { panel: 'p-supply', at: 103.2, hold: 3.8 },   // S05 "लोड क्यों रुका है"
];

/** From the turn onwards. Act 1 stays unbranded on purpose. */
const MARK_FROM = 91.0;
const FADE = 0.45;

function main() {
  if (!existsSync(FILM)) throw new Error('No mdg-film.mp4 — run build.mjs first.');
  mkdirSync(WORK, { recursive: true });
  const filmLen = dur(FILM);

  /* Inputs: the film, the brand mark, then one phone card per overlay. */
  /* `-loop 1` on every still. A bare `-i image.png` is a single frame at t=0,
     so a fade scheduled at 97 seconds never fires and the overlay stays fully
     transparent — the picture is composited correctly and is simply invisible,
     which looks exactly like the overlay never ran. Looping makes each still a
     continuous stream that the fades can actually act on. */
  const inputs = ['-i', FILM, '-loop', '1', '-i', path.join(PANELS, 'logo-full-white.png')];
  for (const c of CARDS) inputs.push('-loop', '1', '-i', path.join(PANELS, `${c.panel}.png`));

  const chain = [];

  /* The mark: scaled small, held at low opacity, faded in at the turn. */
  chain.push(
    `[1:v]scale=300:-1,format=rgba,` +
    `colorchannelmixer=aa=0.55[mark]`,
    `[0:v][mark]overlay=x=(W-w)/2:y=110:` +
    `enable='between(t,${MARK_FROM},${filmLen})'[v0]`,
  );

  /* Each phone card: scaled to two-thirds frame height, sliding up from the
     bottom edge and easing to rest, then held. A card that simply appears
     reads as a mistake; one that arrives reads as an answer. */
  let last = 'v0';
  CARDS.forEach((c, i) => {
    const idx = i + 2;
    const tag = `v${i + 1}`;
    const end = c.at + c.hold;
    const rise = 0.5;
    chain.push(
      `[${idx}:v]scale=-1:1020,format=rgba,` +
      `fade=t=in:st=${c.at.toFixed(2)}:d=${FADE}:alpha=1,` +
      `fade=t=out:st=${(end - FADE).toFixed(2)}:d=${FADE}:alpha=1[c${i}]`,
      /* Bottom-right, not centred. A full-height card over a chest-up shot
         covers the man's face, and his face is the performance — the card is
         evidence beside him, never a thing standing in front of him. */
      `[${last}][c${i}]overlay=` +
      `x=W-w-55:` +
      `y='if(lt(t,${(c.at + rise).toFixed(2)}),` +
      `H-(H-(H-h-150))*min(1,(t-${c.at.toFixed(2)})/${rise}),H-h-150)':` +
      `enable='between(t,${c.at.toFixed(2)},${end.toFixed(2)})'[${tag}]`,
    );
    last = tag;
  });

  console.log('  compositing cards and mark…');
  const body = path.join(WORK, 'branded-body.mp4');
  ff([...inputs,
    '-filter_complex', chain.join(';'),
    '-map', `[${last}]`, '-map', '0:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-shortest', body]);

  /* The outro: two still cards with a slow push, cross-faded, silent. */
  console.log('  building the outro…');
  const outroParts = [];
  for (const [n, secs] of [['outro-brand', 3.4], ['outro-app', 4.6]]) {
    const f = path.join(WORK, `${n}.mp4`);
    ff(['-loop', '1', '-i', path.join(PANELS, `${n}.png`), '-t', String(secs),
      '-vf', `scale=1188:-1,zoompan=z='min(zoom+0.0006,1.06)':d=${Math.round(secs * 24)}:` +
             `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=24,` +
             `fade=t=in:st=0:d=0.5`,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '24', f]);
    outroParts.push(f);
  }
  const outroLast = outroParts[outroParts.length - 1];
  ff(['-i', outroLast, '-vf', 'fade=t=out:st=3.6:d=1.0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
    path.join(WORK, 'outro-app-faded.mp4')]);
  outroParts[outroParts.length - 1] = path.join(WORK, 'outro-app-faded.mp4');

  /* Silence under the outro so the concat has an audio stream to join. */
  const outroLen = outroParts.reduce((s, f) => s + dur(f), 0);
  const silence = path.join(WORK, 'silence.m4a');
  ff(['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', outroLen.toFixed(2),
    '-c:a', 'aac', '-b:a', '128k', silence]);

  const outroCat = path.join(WORK, 'outro.mp4');
  ff(['-i', outroParts[0], '-i', outroParts[1], '-i', silence,
    '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]',
    '-map', '[v]', '-map', '2:a', '-shortest',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', outroCat]);

  console.log('  joining…');
  ff(['-i', body, '-i', outroCat,
    '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]',
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
    '-bsf:v', 'h264_metadata=sample_aspect_ratio=1/1', OUT]);

  const total = dur(OUT);
  console.log(`\n  film ${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, '0')}` +
    ` · ${(statSync(OUT).size / 1e6).toFixed(1)} MB` +
    ` · ${CARDS.length} product cards · outro ${outroLen.toFixed(1)}s`);
  console.log('  → marketing/mdg-film-branded.mp4\n');
}

main();
