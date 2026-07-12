import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { type CalculateMetadataFunction, staticFile } from 'remotion';

import { type Tutorial } from '../narration';
import { VIDEO } from '../theme';

import { audioPath } from './audio';

export interface TutorialProps {
  tutorialId: string;
  /** Per-scene length in frames — filled in by calculateMetadata. */
  sceneFrames: number[];
  /** Whether each scene has a generated voiceover file (gates <Audio>). */
  hasAudio: boolean[];
  /** Remotion requires composition props to be an index-signature record. */
  [key: string]: unknown;
}

/** Extra hold after the voice ends so the last frame of a step settles. */
const TAIL_SECONDS = 0.5;

/**
 * Sizes the composition to the generated voiceover: each scene is exactly as long
 * as its `.mp3` (plus a short tail). Before any audio exists, it falls back to the
 * scene's `estSeconds`, so the tutorial still previews and renders end-to-end.
 */
export function makeCalculateMetadata(
  tutorial: Tutorial,
): CalculateMetadataFunction<TutorialProps> {
  return async () => {
    const fps = VIDEO.fps;
    const sceneFrames: number[] = [];
    const hasAudio: boolean[] = [];

    for (const scene of tutorial.scenes) {
      let seconds = scene.estSeconds;
      let found = false;
      try {
        const dur = await getAudioDurationInSeconds(staticFile(audioPath(tutorial.id, scene.id)));
        if (Number.isFinite(dur) && dur > 0) {
          seconds = dur;
          found = true;
        }
      } catch {
        // No audio for this scene yet — keep the estimate.
      }
      hasAudio.push(found);
      sceneFrames.push(Math.max(1, Math.round((seconds + TAIL_SECONDS) * fps)));
    }

    return {
      durationInFrames: sceneFrames.reduce((a, b) => a + b, 0),
      fps,
      props: { tutorialId: tutorial.id, sceneFrames, hasAudio },
    };
  };
}
