import type { Lang } from '../marketing/film';
import type { Scene, Tutorial } from '../narration';

import { type Beat, type Video, pick } from './types';

/**
 * Turns a declared `Video` into the `Tutorial` the rest of the pipeline already
 * understands.
 *
 * ── WHY A PROJECTION AND NOT A NEW PIPELINE ────────────────────────────────
 *
 * `Scene` and `Tutorial` do not change by one character, because everything
 * reads them: `makeCalculateMetadata`, `generate-voice.mts`, `render-all.mts`,
 * `stills.mts`, `TUTORIAL_BY_ID`, and — through `videos.json` — the guide site's
 * chapter list, which keys its labels on scene ids. Widening that type would
 * mean touching every one of those, and the guide site is deployed separately.
 *
 * The trick is already in the repository and already proved: `filmTutorial(film,
 * lang)` projects the bilingual marketing film down to a single-language
 * Tutorial, which is what lets `npm run voice` record both cuts and
 * `calculateMetadata` size each to its own voiceover without either knowing the
 * film exists. This is the same move, widened.
 */

/**
 * Speaking rate, characters per second, MEASURED — not guessed.
 *
 * ffprobe over every shipped voiceover against the exact narration string that
 * produced it: 154 Hindi clips give a median of 10.40 chars/sec (p10 9.12, p90
 * 11.79) and 15 English clips 13.44 (p10 12.26, p90 16.78). The English sample
 * is small because only the marketing film has an English cut.
 *
 * The difference is not that English is spoken faster; it is that a Latin
 * character carries less than a Devanagari one, so the same second of speech
 * costs more characters.
 */
const CHARS_PER_SECOND: Record<Lang, number> = { hi: 10.4, en: 13.4 };

/**
 * How long a beat is BEFORE its voiceover exists.
 *
 * This value governs the Studio preview and nothing else — `calculateMetadata`
 * replaces it with the mp3's real duration the moment one exists, which is why
 * the videos already breathe the way their narrator does.
 *
 * It is derived rather than typed because a hand-guessed `estSeconds` is
 * reliably wrong (the shipped ones are off by a median of about a quarter) and
 * because seventy videos is roughly eight hundred numbers nobody should have to
 * invent. `Beat.seconds` remains for the rare beat that must hold longer than
 * its own sentence — a recap a viewer is meant to photograph, say.
 */
export function estimateSeconds(text: string, lang: Lang): number {
  return Math.max(2, Math.ceil(text.length / CHARS_PER_SECOND[lang]));
}

/** One beat, as the old pipeline sees it. */
function toScene(b: Beat, lang: Lang): Scene {
  const text = pick(b.say, lang);
  return {
    id: b.id,
    // `step` used to be an author's second name for the same thing. The drawing
    // now travels with the beat, so the block's kind IS the step — it keeps the
    // Studio's timeline legible and removes a field that could disagree with
    // itself.
    step: b.block.kind,
    text,
    estSeconds: b.seconds ?? estimateSeconds(text, lang),
  };
}

/**
 * Project a declared video into a Tutorial.
 *
 * A bilingual video yields one Tutorial per language, with distinct ids — so the
 * two cuts get separate audio folders, separate compositions, and separate
 * durations, because a sentence is not the same length in two languages.
 */
export function videoTutorial(v: Video, lang: Lang = 'hi'): Tutorial {
  const bilingual = v.family === 'social';
  return {
    id: bilingual ? `${v.id}-${lang}` : v.id,
    compositionId: bilingual ? `${v.compositionId}${lang === 'hi' ? 'Hi' : 'En'}` : v.compositionId,
    title: pick(v.title, lang),
    subtitle: pick(v.subtitle, lang),
    scenes: v.beats.map((b) => toScene(b as Beat, lang)),
    // The English cut asks for the second ElevenLabs voice, falling back to the
    // Hindi one when that variable is unset — which is existing, deliberate
    // behaviour in generate-voice.mts, not a new rule.
    voiceEnv: lang === 'en' ? 'ELEVENLABS_VOICE_ID_EN' : undefined,
  };
}

/** Every Tutorial a declared video produces: one, or two for a bilingual one. */
export function tutorialsFor(v: Video): Tutorial[] {
  return v.family === 'social'
    ? [videoTutorial(v, 'hi'), videoTutorial(v, 'en')]
    : [videoTutorial(v, 'hi')];
}
