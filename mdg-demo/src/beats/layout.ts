import { VIDEO_LANDSCAPE } from '../components/landscapeChrome';
import type { Lang } from '../marketing/film';
import { VIDEO } from '../theme';

/**
 * Where the bands sit, per family — and the one place the social safe area is
 * decided.
 *
 * ── THE BUG THIS FILE EXISTS TO FIX ────────────────────────────────────────
 *
 * `marketing/brand.ts` puts the film's caption band at `captionTop: 1600` on a
 * 1920-tall frame. That is the bottom 17% of the picture, and it is precisely
 * where Instagram Reels and YouTube Shorts draw their own furniture: the
 * caption, the account handle, the audio strip, and a column of round buttons
 * up the right-hand edge. So the burned-in Hindi caption of every social cut —
 * the whole information channel for a viewer watching with the sound off, which
 * on a public feed is most of them — sits underneath somebody else's UI.
 *
 * The tutorials do not have this problem, because nobody watches a tutorial in
 * a Reels feed; they watch it on the guide site, in a plain player, where the
 * frame is the frame. Same canvas, completely different obstruction — which is
 * exactly why the bands belong to the FAMILY rather than to the canvas.
 *
 * ── THE NUMBERS, AND WHERE THEY COME FROM ──────────────────────────────────
 *
 * Reels/Shorts is the chosen primary surface. Its obstructions on a 1080x1920
 * frame, taken conservatively:
 *   - roughly the top 190px can be covered by the status bar and the app's own
 *     header on the tallest handsets,
 *   - roughly the bottom 260px by the caption, handle and audio row,
 *   - roughly the right 150px by the action-button column.
 * Anything that must be READ therefore lives inside 190..1660 vertically and
 * 80..930 horizontally. The stage may bleed outside it — a photograph losing
 * its bottom edge behind a caption costs nothing — but type may not.
 *
 * This is a deliberate trade against WhatsApp Status, whose obstructed zones are
 * smaller and differently shaped. Optimising for Status would leave visible dead
 * space in a Reels feed, and Reels plus Shorts is where the reach is. A Status
 * repost of a Reels-safe cut merely has a little more margin than it needs,
 * which is the harmless direction to be wrong in.
 *
 * ── WHAT THE HEADER REMOVAL DID TO THESE ───────────────────────────────────
 *
 * All three families lose the logo-and-title header block and keep only a thin
 * strip carrying the progress bar and a small corner mark. That is 72px where
 * the portrait tutorials used to spend 250 and the landscape ones 168, and the
 * stage takes every pixel of the difference — the phone grows about 13% on a
 * side, the mocked browser goes from a hand-tuned 0.9 scale to roughly 1.2.
 */

export type Family = 'dealer' | 'admin' | 'social';

export interface Bands {
  width: number;
  height: number;
  fps: number;
  /** Never draw anything here — a platform's own chrome may cover it. */
  deadTop: number;
  /** The thin strip: progress bar and the corner mark. */
  stripTop: number;
  stripHeight: number;
  /** The picture. May bleed past the read-safe box; type inside it may not. */
  stageTop: number;
  stageBottom: number;
  /** The burned-in narration caption. */
  captionTop: number;
  captionBottom: number;
  /** Horizontal inset for anything that must be READ. */
  readLeft: number;
  readRight: number;
  /** Caption type size and its hard line budget. */
  captionSize: number;
  captionMaxLines: number;
}

const STRIP = 72;

/**
 * Dealer: portrait, watched on the guide site in a plain player. The whole frame
 * is ours, so the only dead zone is a couple of pixels of rounding.
 */
const dealer: Bands = {
  width: VIDEO.width,
  height: VIDEO.height,
  fps: VIDEO.fps,
  deadTop: 40,
  stripTop: 40,
  stripHeight: STRIP,
  stageTop: 112,
  stageBottom: 1600,
  captionTop: 1600,
  captionBottom: VIDEO.height,
  readLeft: 70,
  readRight: VIDEO.width - 70,
  captionSize: 40,
  captionMaxLines: 5,
};

/** Admin: landscape, watched on a desktop in the same plain player. */
const admin: Bands = {
  width: VIDEO_LANDSCAPE.width,
  height: VIDEO_LANDSCAPE.height,
  fps: VIDEO_LANDSCAPE.fps,
  deadTop: 24,
  stripTop: 24,
  stripHeight: STRIP - 16,
  stageTop: 80,
  stageBottom: 880,
  captionTop: 880,
  captionBottom: VIDEO_LANDSCAPE.height,
  readLeft: 120,
  readRight: VIDEO_LANDSCAPE.width - 120,
  captionSize: 32,
  captionMaxLines: 4,
};

/**
 * Social: portrait, watched inside somebody else's feed.
 *
 * The caption ends at 1660 rather than 1920 and starts at 1420 rather than 1600,
 * so it is a genuinely smaller band — two lines, not five. `brand.ts` already
 * wrote the script to a two-line limit for its own reasons, so this codifies a
 * rule the marketing film was already following rather than imposing a new one.
 */
const social: Bands = {
  width: VIDEO.width,
  height: VIDEO.height,
  fps: VIDEO.fps,
  deadTop: 190,
  stripTop: 190,
  stripHeight: 60,
  stageTop: 250,
  stageBottom: 1400,
  captionTop: 1420,
  captionBottom: 1660,
  readLeft: 80,
  readRight: 930,
  captionSize: 43,
  captionMaxLines: 2,
};

export const BANDS: Record<Family, Bands> = { dealer, admin, social };

/** The stage box a `<Fit>` gets to work with, after the read-safe inset. */
export function stageBox(f: Family): { w: number; h: number } {
  const b = BANDS[f];
  return { w: b.readRight - b.readLeft, h: b.stageBottom - b.stageTop };
}

/**
 * Average advance per character, as a fraction of the type size.
 *
 * CALIBRATED, not guessed. `brand.ts` states that the film's captions were
 * written to fit two lines of 44px Devanagari in its 940px-wide band, and its
 * fifteen Hindi captions run 47..82 characters with a median of 66. A 940px line
 * at 44px holding ~41 characters implies 0.52em per character — and the same
 * fifteen scenes in English run 53..98 for the same two lines, implying ~0.44em,
 * which is the expected difference: Devanagari matras are combining marks, so a
 * Devanagari string of N code points draws NARROWER per code point than Latin
 * does, but its clusters are wider, and the two effects do not cancel.
 *
 * One coefficient for both languages was the first version of this and it was
 * wrong by about 20% on English, which is the difference between a budget that
 * catches real overflow and one an author learns to ignore.
 */
const ADVANCE: Record<Lang, number> = { hi: 0.52, en: 0.44 };

/**
 * How many characters of narration fit in the caption band.
 *
 * Used by the lint, which wants an approximate budget and a clear failure, not a
 * typesetter. Expect it to be tight on social: that band is deliberately two
 * lines in a narrower column, and the shipped film's longest Hindi caption (82
 * characters, written for the wider band) does not fit it. That is a real
 * finding about the film, not a flaw in the arithmetic.
 */
export function captionBudget(f: Family, lang: Lang = 'hi'): number {
  const b = BANDS[f];
  const perLine = Math.floor((b.readRight - b.readLeft) / (b.captionSize * ADVANCE[lang]));
  return perLine * b.captionMaxLines;
}
