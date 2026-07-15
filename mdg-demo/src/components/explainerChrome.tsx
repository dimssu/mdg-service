import * as React from 'react';
import { Audio, Sequence, interpolate, staticFile } from 'remotion';

import { audioPath } from '../lib/audio';
import { sceneOffsets } from '../lib/scene';
import type { Tutorial } from '../narration';
import { colors, VIDEO } from '../theme';

/**
 * Shared "concept explainer" chrome (progress bar · header · centred stage ·
 * bottom caption · per-scene voiceover) used by the CreditMonitor videos. It
 * mirrors the layout PointsSystemVideo established so the whole tutorial library
 * looks like one series.
 */

export const CAPTION_TOP = 1600;
export const STAGE_TOP = 340;
export const STAGE_BOTTOM = 1560;

export const EXPLAINER_BG = `radial-gradient(120% 80% at 50% 0%, #ffffff 0%, ${colors.bg} 45%, #eef0f4 100%)`;

export function ProgressBar({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 60px' }}>
      {Array.from({ length: count }).map((_, i) => {
        const fill = i < index ? 1 : i === index ? progress : 0;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background: colors.border,
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${fill * 100}%`, height: '100%', background: colors.brand }} />
          </div>
        );
      })}
    </div>
  );
}

export function ExplainerHeader({
  title,
  subtitle,
  badge = 'MDG · समझें',
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div style={{ padding: '22px 60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: colors.brand,
            color: colors.textInverse,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          MDG
        </div>
        <span style={{ fontSize: 22, fontWeight: 600, color: colors.textMuted }}>{badge}</span>
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, color: colors.text, letterSpacing: '-0.01em' }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 500, color: colors.textSubtle, marginTop: 6 }}>
        {subtitle}
      </div>
    </div>
  );
}

export function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: STAGE_TOP,
        width: VIDEO.width,
        height: STAGE_BOTTOM - STAGE_TOP,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
      }}
    >
      {children}
    </div>
  );
}

export function Caption({ text, local }: { text: string; local: number }) {
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(local, [0, 8], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: CAPTION_TOP,
        width: VIDEO.width,
        height: VIDEO.height - CAPTION_TOP,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 70px',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          maxWidth: 920,
          textAlign: 'center',
          fontSize: 40,
          lineHeight: 1.4,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/** Plays each scene's voiceover in its own Sequence (only where audio exists). */
export function AudioTrack({
  tutorial,
  frames,
  hasAudio,
}: {
  tutorial: Tutorial;
  frames: number[];
  hasAudio: boolean[];
}) {
  const offsets = sceneOffsets(frames);
  return (
    <>
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
