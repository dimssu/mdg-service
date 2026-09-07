import { getAudioDurationInSeconds } from '@remotion/media-utils';
import * as React from 'react';
import {
  AbsoluteFill,
  Audio,
  type CalculateMetadataFunction,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

import { audioPath } from '../lib/audio';
import { activeScene, sceneOffsets } from '../lib/scene';
import { BRollLayer } from '../marketing/chrome';
import type { Lang } from '../marketing/film';

import { VIDEO_BY_ID } from './catalog';
import { FAMILY } from './families';
import { Fit } from './fit';
import { BANDS, stageBox } from './layout';
import { densityScale } from './motion';
import { videoTutorial } from './project';
import { BeatBody } from './render';
import { type Beat, type Video, pick } from './types';

/**
 * The driver: turns a declared `Video` into frames.
 *
 * It is deliberately thin. Which beat is on screen comes from `activeScene`,
 * which the twelve shipped videos already use; how long a beat is comes from
 * `calculateMetadata`, which already measures the mp3; what a beat looks like
 * comes from `BeatBody`. This file only decides where the bands sit and what
 * sits in them.
 */

/* ── the strip that replaced the header ──────────────────────────────────── */

/**
 * A progress bar and a small corner mark. That is all.
 *
 * What came out: the logo tile, the section badge, the 48px title and the 26px
 * subtitle — a block that spent every frame of a three-minute video saying what
 * a title card says better in two seconds.
 *
 * What stayed: the progress bar. It is wordless, it is the only signal of how
 * much is left, and it already sat above the header in all three chromes. Moving
 * it down beside the caption would put a moving element next to the text a
 * dealer is reading.
 *
 * The mark is the product name at 55–70% opacity and nothing else. On a clip
 * re-posted somewhere with no page around it, this and the end card are the only
 * things that say who made it.
 */
function Strip({
  family,
  index,
  count,
  progress,
}: {
  family: keyof typeof BANDS;
  index: number;
  count: number;
  progress: number;
}) {
  const b = BANDS[family];
  const f = FAMILY[family];
  const accent = f.accent;
  return (
    <div
      style={{
        position: 'absolute',
        top: b.stripTop,
        left: b.readLeft,
        width: b.readRight - b.readLeft,
        height: b.stripHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              background: f.hairline,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(i < index ? 1 : i === index ? progress : 0) * 100}%`,
                height: '100%',
                background: accent,
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          fontFamily: f.body,
          fontSize: family === 'admin' ? 20 : 26,
          fontWeight: 700,
          letterSpacing: '.04em',
          color: f.ink,
          opacity: f.markOpacity,
        }}
      >
        Dealer Kavach
      </div>
    </div>
  );
}

/* ── caption ─────────────────────────────────────────────────────────────── */

function Caption({
  family,
  text,
  local,
}: {
  family: keyof typeof BANDS;
  text: string;
  local: number;
}) {
  const b = BANDS[family];
  const f = FAMILY[family];
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(local, [0, 8], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: b.captionTop,
        left: b.readLeft,
        width: b.readRight - b.readLeft,
        height: b.captionBottom - b.captionTop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: 'center',
          fontFamily: f.body,
          fontSize: b.captionSize,
          lineHeight: 1.35,
          fontWeight: 600,
          color: f.captionInk,
          // A shadow only earns its place over a photograph. On paper it is
          // just a smudge under the text.
          textShadow: f.broll ? '0 2px 18px rgba(16,17,51,.5)' : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ── the composition ─────────────────────────────────────────────────────── */

export interface BeatVideoProps {
  /** Resolved through VIDEO_BY_ID — see the note there on why this is an id. */
  videoId: string;
  lang: Lang;
  sceneFrames: number[];
  hasAudio: boolean[];
  /** Remotion requires composition props to be an index-signature record. */
  [key: string]: unknown;
}

/**
 * Sizes a declared video to its own voiceover, and keeps its identity.
 *
 * `makeCalculateMetadata` in lib/calc.ts does the same measuring for the
 * hand-written videos, but it returns `props: { tutorialId, sceneFrames,
 * hasAudio }` — and Remotion REPLACES a composition's props with what
 * calculateMetadata returns rather than merging them. Reusing it here would
 * therefore strip `videoId` and `lang` on the way through and the composition
 * would not know which video it is. Hence a sibling that returns them back.
 *
 * The 0.5s tail matches TAIL_SECONDS in lib/calc.ts, which the guide site's
 * chapter timestamps also assume. The two are still separate constants with a
 * comment holding them together, which is a real if small trap: change one and
 * every chapter offset on the site drifts, cumulatively, by the difference.
 */
const TAIL_SECONDS = 0.5;

export function makeBeatMetadata(
  video: Video,
  lang: Lang,
): CalculateMetadataFunction<BeatVideoProps> {
  const tutorial = videoTutorial(video, lang);
  const fps = BANDS[video.family].fps;
  return async () => {
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
        // No voiceover for this beat yet — the estimate stands, and the beat
        // simply plays silent rather than the whole video refusing to preview.
      }
      hasAudio.push(found);
      sceneFrames.push(Math.max(1, Math.round((seconds + TAIL_SECONDS) * fps)));
    }
    return {
      durationInFrames: sceneFrames.reduce((a, n) => a + n, 0),
      fps,
      props: { videoId: video.id, lang, sceneFrames, hasAudio },
    };
  };
}

export function BeatVideo({ videoId, lang, sceneFrames, hasAudio }: BeatVideoProps) {
  const video = VIDEO_BY_ID[videoId];
  if (!video) throw new Error(`No declared video with id "${videoId}".`);
  const tutorial = videoTutorial(video, lang);
  const frame = useCurrentFrame();
  const b = BANDS[video.family];
  const f = FAMILY[video.family];

  const frames =
    sceneFrames.length === video.beats.length
      ? sceneFrames
      : tutorial.scenes.map((s) => Math.round((s.estSeconds + 0.5) * b.fps));

  const { index, local, length } = activeScene(frame, frames);
  const beat = video.beats[index] as Beat;
  const offsets = sceneOffsets(frames);

  /**
   * `hold` — the anti-slide-deck device.
   *
   * A beat marked `hold` draws the block of the most recent beat that was NOT
   * held, so a run of beats shares one stage and only the caption changes
   * underneath it. Without this, twelve beats are twelve unrelated cards however
   * good each card is; with it, a run reads as one continuous thought.
   *
   * `local` is measured from the START of the run rather than from this beat, so
   * the entrance animation plays once at the top and the stage then sits still
   * while the narration moves on. A stage that re-animated on every held beat
   * would be the very stutter `hold` exists to remove.
   */
  let rootIndex = index;
  while (rootIndex > 0 && (video.beats[rootIndex] as Beat).hold) rootIndex -= 1;
  const rootBeat = video.beats[rootIndex] as Beat;
  const runLocal = frame - offsets[rootIndex];
  const runLength = frames.slice(rootIndex, index + 1).reduce((a, n) => a + n, 0);

  const args = {
    local: runLocal,
    length: runLength,
    t: runLength > 0 ? Math.min(1, Math.max(0, runLocal / runLength)) : 0,
    index: rootIndex,
    family: video.family,
    lang,
    tone: 'neutral' as const,
  };

  const box = stageBox(video.family);
  // The stage's own content decides its density boost; a two-item beat gets
  // bigger type than a seven-item one without anyone choosing a number.
  const items =
    rootBeat.block.kind === 'list'
      ? rootBeat.block.items.length
      : rootBeat.block.kind === 'flow'
        ? rootBeat.block.steps.length
        : rootBeat.block.kind === 'recap'
          ? rootBeat.block.steps.length
          : 1;

  return (
    <AbsoluteFill style={{ background: f.bg }}>
      {/* The photograph, on the social family only. Its scrim and camera move
          are the marketing film's, unchanged — that layer is good and there is
          no reason to write a second one. */}
      {f.broll && rootBeat.broll ? (
        <BRollLayer
          id={rootBeat.broll}
          local={runLocal}
          length={runLength}
          index={rootIndex}
          weight={rootBeat.brollWeight ?? 1}
        />
      ) : null}

      <Strip
        family={video.family}
        index={index}
        count={video.beats.length}
        progress={length ? local / length : 0}
      />

      <div
        style={{
          position: 'absolute',
          top: b.stageTop,
          left: b.readLeft,
          width: box.w,
          height: box.h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Full-bleed blocks size themselves; everything else is fitted, so no
            beat can overflow its band no matter how much an author puts in it. */}
        {rootBeat.block.kind === 'photo' ? (
          <div style={{ width: '100%', height: '100%' }}>
            <BeatBody block={rootBeat.block} args={args} />
          </div>
        ) : (
          <Fit box={{ w: box.w, h: box.h }} into={box} max={1} boost={densityScale(items)}>
            <div
              style={{
                width: box.w,
                height: box.h,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <BeatBody block={rootBeat.block} args={args} />
            </div>
          </Fit>
        )}
      </div>

      <Caption family={video.family} text={pick(beat.say, lang)} local={local} />

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
    </AbsoluteFill>
  );
}
