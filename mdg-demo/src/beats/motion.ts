import { interpolate } from 'remotion';

import type { BeatArgs } from './types';

/**
 * Motion, expressed in FRACTIONS OF A BEAT rather than in frames.
 *
 * ── THE BUG THIS FIXES ─────────────────────────────────────────────────────
 *
 * The shipped videos animate on constants: `reveal(local, i, gap = 5)` staggers
 * items five frames apart, and `AdminDsrReceiptsVideo` has `SAVE_BEAT = 90`. Both
 * were tuned by eye against a beat that happened to be ten seconds long, and
 * both are wrong at three — a seven-item list staggered five frames apart needs
 * 35 frames plus its own entrance, which is more than a short beat has, so the
 * last item arrives after the narrator has finished talking about it, or never.
 *
 * Nothing catches that, because every beat is sized to its own voiceover and a
 * voiceover changes length whenever the words do. Editing a sentence to be
 * shorter silently truncates the animation underneath it.
 *
 * So: every helper takes the beat's own length and guarantees the animation is
 * FINISHED by a fixed fraction of it. A beat that comes back short because its
 * mp3 came back short simply moves faster.
 */

/** 0..1 across the beat. */
export function progress(a: BeatArgs): number {
  return a.length > 0 ? Math.min(1, Math.max(0, a.local / a.length)) : 0;
}

/**
 * Entrance distance and duration per emphasis rung.
 *
 * Three rungs and no free numbers: an author choosing "a bit more than 22px"
 * is how sixty videos stop looking like one series.
 */
const EMPHASIS = {
  calm: { rise: 14, frames: 10, count: 24 },
  normal: { rise: 22, frames: 12, count: 34 },
  punch: { rise: 34, frames: 16, count: 48 },
} as const;

export type Emphasis = keyof typeof EMPHASIS;

/**
 * When item `i` of `n` starts, in frames.
 *
 * The whole run is guaranteed to be complete by `finishBy` of the beat (60% by
 * default), so the last item is on screen while the narrator is still on the
 * sentence that introduces it — never after. The gap shrinks to fit rather than
 * the run overflowing.
 */
export function stagger(i: number, n: number, length: number, finishBy = 0.6): number {
  if (n <= 1) return 0;
  const window = Math.max(1, length * finishBy);
  const gap = Math.min(6, window / n);
  return Math.round(i * gap);
}

/** Opacity and offset for something entering at `delay` frames into the beat. */
export function rise(
  local: number,
  delay = 0,
  emphasis: Emphasis = 'normal',
): { opacity: number; y: number } {
  const e = EMPHASIS[emphasis];
  const t = local - delay;
  const opacity = interpolate(t, [0, e.frames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(t, [0, e.frames], [e.rise, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return { opacity, y };
}

/** A plain fade between two frame marks. */
export function fade(local: number, from: number, to: number): number {
  return interpolate(local, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * How far a count-up has got, 0..1.
 *
 * Eased, because a figure that lands on its final value and stops dead reads as
 * a glitch, while one that decelerates into it reads as arriving.
 */
export function countProgress(local: number, emphasis: Emphasis = 'normal'): number {
  const t = interpolate(local, [0, EMPHASIS[emphasis].count], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Which way this beat's content enters, alternating by beat index.
 *
 * `marketing/chrome.tsx` already does exactly this for its camera moves and
 * states the reason: two consecutive shots pushing the same way read as one long
 * shot and the cut between them disappears. The same is true of two consecutive
 * cards rising from below. Automatic, and not an author's decision, because the
 * point is the ALTERNATION rather than any particular direction.
 */
export function enterDirection(index: number): 1 | -1 {
  return index % 2 === 0 ? 1 : -1;
}

/**
 * Type scale from content density.
 *
 * A three-item beat should have bigger type than a seven-item one, and the three
 * hand-tuned `STAGE_SCALE` maps in the admin videos were mostly doing this by
 * eye. The rungs are theirs, kept rather than reinvented.
 */
export function densityScale(itemCount: number): number {
  if (itemCount <= 2) return 1.2;
  if (itemCount <= 3) return 1.1;
  if (itemCount <= 5) return 1.06;
  return 1;
}
