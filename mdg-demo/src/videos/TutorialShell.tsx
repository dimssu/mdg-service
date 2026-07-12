import * as React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { PhoneFrame } from '../components/PhoneFrame';
import { TutorialFrame } from '../components/TutorialFrame';
import { audioPath } from '../lib/audio';
import { activeScene, sceneOffsets } from '../lib/scene';
import type { Tutorial } from '../narration';
import { VIDEO } from '../theme';

export interface PhoneRenderArgs {
  step: string;
  sceneId: string;
  sceneIndex: number;
  /** Frame within the current scene. */
  local: number;
  /** Length of the current scene in frames. */
  length: number;
}

/**
 * Drives every tutorial: picks the active scene from the frame, draws the phone
 * for that scene's step (via `renderPhone`), shows the synced Hindi caption, and
 * plays each scene's voiceover in a Sequence.
 */
export function TutorialShell({
  tutorial,
  sceneFrames,
  hasAudio,
  renderPhone,
}: {
  tutorial: Tutorial;
  sceneFrames: number[];
  hasAudio: boolean[];
  renderPhone: (a: PhoneRenderArgs) => React.ReactNode;
}) {
  const frame = useCurrentFrame();
  // Fallback for the brief moment before calculateMetadata fills the props.
  const frames =
    sceneFrames.length === tutorial.scenes.length
      ? sceneFrames
      : tutorial.scenes.map((s) => Math.round(s.estSeconds * VIDEO.fps));

  const { index, local, length } = activeScene(frame, frames);
  const scene = tutorial.scenes[index];
  const offsets = sceneOffsets(frames);

  return (
    <>
      <TutorialFrame
        title={tutorial.title}
        subtitle={tutorial.subtitle}
        caption={scene.text}
        captionLocal={local}
        stepIndex={index}
        stepCount={tutorial.scenes.length}
        stepProgress={length ? local / length : 0}
      >
        <PhoneFrame>
          {renderPhone({
            step: scene.step,
            sceneId: scene.id,
            sceneIndex: index,
            local,
            length,
          })}
        </PhoneFrame>
      </TutorialFrame>

      {tutorial.scenes.map((s, i) =>
        hasAudio[i] ? (
          <Sequence
            key={s.id}
            from={offsets[i]}
            durationInFrames={frames[i]}
            name={`voice:${s.id}`}
          >
            <Audio src={staticFile(audioPath(tutorial.id, s.id))} />
          </Sequence>
        ) : null,
      )}
    </>
  );
}
