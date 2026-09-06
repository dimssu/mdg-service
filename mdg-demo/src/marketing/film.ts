/**
 * The marketing film's bilingual scene model, and the bridge that turns it into
 * the `Tutorial` shape the rest of the pipeline already understands.
 *
 * Every other video in this project is single-language: one scene, one Hindi
 * string, one mp3. The marketing film ships in two cuts — Hindi and English —
 * over identical visuals, so a scene here carries BOTH narrations and both
 * estimated lengths. `filmTutorial('hi' | 'en')` projects one language out as a
 * normal `Tutorial`, which is what makes `npm run voice`, `calculateMetadata`
 * and `npm run render` work on it unchanged.
 *
 * The two cuts have different durations, because a sentence is not the same
 * length in both languages. That is fine and is the reason the timings are
 * per-language: each composition sizes itself to its own voiceover.
 */

import type { Scene, Tutorial } from '../narration';

export type Lang = 'hi' | 'en';

export interface FilmScene {
  /** Unique within the film. Also the audio file name, in both languages. */
  id: string;
  /** Which stage the video draws for this scene. */
  step: string;
  /** Hindi narration — spoken in the Hindi cut AND shown as its caption. */
  hi: string;
  /** English narration — spoken in the English cut AND shown as its caption. */
  en: string;
  /** Fallback seconds for the Hindi cut, used until its voiceover exists. */
  estSecondsHi: number;
  /** Fallback seconds for the English cut. */
  estSecondsEn: number;
  /**
   * Id of the photograph behind this scene, from `broll.ts`. Every scene has
   * one; a scene without would be the only still frame in the film and would
   * read as a mistake.
   */
  broll: string;
  /**
   * How strongly to darken that photograph, 0–1, default 1. Drop it on the
   * beats whose stage is small enough for the picture to carry the frame — the
   * hook and the closing promise — and leave it at 1 wherever a dense white
   * card sits on top and the photograph is only atmosphere.
   */
  brollWeight?: number;
}

export interface Film {
  /** Audio folder + composition id are both derived from this plus the language. */
  id: string;
  titleHi: string;
  titleEn: string;
  subtitleHi: string;
  subtitleEn: string;
  scenes: FilmScene[];
}

/** The caption a scene shows in a given cut. */
export function captionOf(scene: FilmScene, lang: Lang): string {
  return lang === 'hi' ? scene.hi : scene.en;
}

/**
 * Project one language out of the film as a `Tutorial`.
 *
 * The id carries the language (`marketing-hi`), so the two cuts never share an
 * audio folder — `public/audio/marketing-hi/hook.mp3` is a different recording
 * from `public/audio/marketing-en/hook.mp3` even though the scene is the same.
 */
export function filmTutorial(film: Film, lang: Lang): Tutorial {
  const scenes: Scene[] = film.scenes.map((s) => ({
    id: s.id,
    step: s.step,
    text: lang === 'hi' ? s.hi : s.en,
    estSeconds: lang === 'hi' ? s.estSecondsHi : s.estSecondsEn,
  }));

  return {
    id: `${film.id}-${lang}`,
    compositionId: lang === 'hi' ? 'MarketingHi' : 'MarketingEn',
    title: lang === 'hi' ? film.titleHi : film.titleEn,
    subtitle: lang === 'hi' ? film.subtitleHi : film.subtitleEn,
    scenes,
    /**
     * The English cut may use a different ElevenLabs voice. When
     * `ELEVENLABS_VOICE_ID_EN` is unset the generator falls back to the Hindi
     * voice, which is a multilingual model and speaks English in the same
     * Indian accent — usually what we want for this audience anyway.
     */
    voiceEnv: lang === 'en' ? 'ELEVENLABS_VOICE_ID_EN' : undefined,
  };
}
