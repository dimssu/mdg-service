import * as React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

import type { TutorialProps } from '../lib/calc';
import { activeScene } from '../lib/scene';
import { FilmFrame, FilmVoiceover } from '../marketing/chrome';
import { captionOf, filmTutorial, type Lang } from '../marketing/film';
import { film } from '../marketing/script';
import { STAGES, StageMissing } from '../marketing/stages';

/**
 * The Dealer's कवच marketing film, in one language.
 *
 * Both cuts render this same component — the visuals are identical and only the
 * narration, the captions and the handful of words drawn inside a stage change.
 * That is deliberate: two separately built cuts drift, and the one that gets
 * fixed is always the one someone happened to be looking at.
 *
 * Timing is driven by the voiceover, exactly as in the tutorials: each scene is
 * as long as its own mp3 (see `src/lib/calc.ts`). Before any voice exists the
 * script's `estSecondsHi` / `estSecondsEn` stand in, so the film previews and
 * renders end to end from the first minute.
 *
 * The brand header is hidden on the first two scenes. The film's whole strategy
 * is to name a dealer's problem before it names a company — a logo sitting in
 * the corner during the hook quietly undoes that, because the viewer knows he
 * is being sold to before he has been given anything.
 */
export function MarketingVideo({ lang, sceneFrames, hasAudio }: TutorialProps & { lang: Lang }) {
  const frame = useCurrentFrame();
  const tutorialId = `${film.id}-${lang}`;

  const frames = sceneFrames.length
    ? sceneFrames
    : film.scenes.map((s) =>
        Math.round(((lang === 'hi' ? s.estSecondsHi : s.estSecondsEn) + 0.5) * 30),
      );

  const { index, local, length } = activeScene(frame, frames);
  const scene = film.scenes[index] ?? film.scenes[0];

  const Stage = STAGES[scene.step];

  return (
    <AbsoluteFill>
      <FilmFrame
        caption={captionOf(scene, lang)}
        captionLocal={local}
        index={index}
        count={frames.length}
        progress={length > 0 ? local / length : 0}
        lang={lang}
        showHeader={index >= 2}
        broll={scene.broll}
        brollWeight={scene.brollWeight}
        sceneLength={length}
      >
        {Stage ? <Stage local={local} lang={lang} /> : <StageMissing step={scene.step} />}
      </FilmFrame>

      <FilmVoiceover
        tutorialId={tutorialId}
        sceneIds={film.scenes.map((s) => s.id)}
        sceneFrames={frames}
        hasAudio={hasAudio.length ? hasAudio : film.scenes.map(() => false)}
      />
    </AbsoluteFill>
  );
}

export function MarketingHiVideo(props: TutorialProps) {
  return <MarketingVideo {...props} lang="hi" />;
}

export function MarketingEnVideo(props: TutorialProps) {
  return <MarketingVideo {...props} lang="en" />;
}

/** The two cuts, as `Tutorial`s the voice generator and renderer understand. */
export const MARKETING_HI = filmTutorial(film, 'hi');
export const MARKETING_EN = filmTutorial(film, 'en');
