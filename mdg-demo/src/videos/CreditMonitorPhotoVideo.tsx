import * as React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import {
  AudioTrack,
  Caption,
  EXPLAINER_BG,
  ExplainerHeader,
  ProgressBar,
  Stage,
} from '../components/explainerChrome';
import type { TutorialProps } from '../lib/calc';
import { CARD_BY_STATE, type CardState, stepToFocus } from '../lib/creditCard';
import { activeScene } from '../lib/scene';
import { TUTORIAL_BY_ID } from '../narration';
import { CreditCard } from '../screens/CreditCard';
import { colors, FONT_FAMILY, VIDEO } from '../theme';

/**
 * CreditMonitorPhoto (Variant B) — the SAME narration + voiceover as Variant A,
 * but drawn over the dealer's actual uploaded screenshots with a highlight box
 * marking the row being narrated.
 *
 * ── Add your two photos ──────────────────────────────────────────────────────
 *   public/credit-card/due.jpg       ← the "amount due" sample (DOD limit)
 *   public/credit-card/advance.jpg   ← the credit/advance sample (CREDIT limit)
 * (.png works too — change the ext in PHOTO below.) Until they're added, this
 * composition gracefully falls back to the clean recreation so it still renders.
 *
 * ── Calibrating the highlight boxes ─────────────────────────────────────────
 * The boxes are positioned as fractions of the image, measured from the table's
 * grid lines in the real photos. If the card template changes, re-measure and
 * update ROW_BANDS[state] / H_SPAN below.
 */

const TUT = TUTORIAL_BY_ID['credit-monitor'];

const PHOTO: Record<CardState, string> = {
  due: staticFile('credit-card/due.jpg'),
  advance: staticFile('credit-card/advance.jpg'),
};

/**
 * Highlight rectangles measured from the real photos (fractions of the image),
 * so each ring lands exactly on its row. Rows are NOT equal height — the wrapped
 * Hindi makes DUE AMOUNT / AVAILABLE LIMIT taller — so each band is [top, bottom]
 * detected from the table grid lines.
 */
const ROW_BANDS: Record<CardState, Record<string, [number, number]>> = {
  due: {
    'due-amount': [0.1829, 0.354],
    'due-date': [0.354, 0.4425],
    'current-limit': [0.4425, 0.528],
    'availed-limit': [0.528, 0.6136],
    'available-limit': [0.6136, 0.7404],
    'form-of-limit': [0.7404, 0.826],
    'prepared-at': [0.826, 0.9351],
  },
  advance: {
    'due-amount': [0.2181, 0.3209],
    'due-date': [0.3209, 0.4174],
    'current-limit': [0.4174, 0.514],
    'availed-limit': [0.514, 0.6106],
    'available-limit': [0.6106, 0.7072],
    'form-of-limit': [0.7072, 0.8037],
    'prepared-at': [0.8037, 0.947],
  },
};
/** Table content horizontal span (fraction of image width), per photo. */
const H_SPAN: Record<CardState, { left: number; right: number }> = {
  due: { left: 0.022, right: 0.96 },
  advance: { left: 0.035, right: 0.96 },
};

function rowRect(state: CardState, key: string) {
  const band = ROW_BANDS[state][key];
  if (!band) return null;
  const [top, bottom] = band;
  const padY = (bottom - top) * 0.08; // hug the row, just inside the grid lines
  const span = H_SPAN[state];
  return {
    left: span.left,
    width: span.right - span.left,
    top: top + padY,
    height: bottom - top - padY * 2,
  };
}

function PhotoWithMark({
  state,
  activeKey,
  local,
  onFail,
}: {
  state: CardState;
  activeKey: string | null;
  local: number;
  onFail: () => void;
}) {
  const rect = activeKey ? rowRect(state, activeKey) : null;
  const pulse = (Math.sin(local / 7) + 1) / 2;
  const appear = interpolate(local, [2, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 960,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(24,24,27,0.22)',
        border: `2px solid ${colors.border}`,
        lineHeight: 0,
      }}
    >
      <Img src={PHOTO[state]} onError={onFail} style={{ width: '100%', height: 'auto' }} />
      {rect ? (
        <div
          style={{
            position: 'absolute',
            left: `${rect.left * 100}%`,
            top: `${rect.top * 100}%`,
            width: `${rect.width * 100}%`,
            height: `${rect.height * 100}%`,
            borderRadius: 10,
            border: `5px solid ${colors.brand}`,
            boxShadow: `0 0 0 ${4 + pulse * 10}px rgba(24,24,27,${0.12 + pulse * 0.14})`,
            background: `rgba(245,158,11,${0.06 + pulse * 0.06})`,
            opacity: appear,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
}

export function CreditMonitorPhotoVideo({ sceneFrames, hasAudio }: TutorialProps) {
  const frame = useCurrentFrame();
  const [failed, setFailed] = React.useState(false);
  const frames =
    sceneFrames.length === TUT.scenes.length
      ? sceneFrames
      : TUT.scenes.map((s) => Math.round(s.estSeconds * VIDEO.fps));

  const { index, local, length } = activeScene(frame, frames);
  const scene = TUT.scenes[index];
  const { state, activeKey } = stepToFocus(scene.step);

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY, background: EXPLAINER_BG }}>
      <div style={{ paddingTop: 46 }}>
        <ProgressBar
          index={index}
          count={TUT.scenes.length}
          progress={length ? local / length : 0}
        />
      </div>
      <ExplainerHeader title={TUT.title} subtitle={TUT.subtitle} badge="MDG · आपका कार्ड" />

      <Stage>
        {failed ? (
          <>
            <CreditCard
              data={CARD_BY_STATE[state]}
              activeKey={activeKey}
              local={local}
              scale={0.92}
            />
            <div
              style={{
                marginTop: 20,
                fontSize: 24,
                fontWeight: 600,
                color: colors.textSubtle,
                textAlign: 'center',
              }}
            >
              फोटो जोड़ें → public/credit-card/{state}.jpg
            </div>
          </>
        ) : (
          <PhotoWithMark
            state={state}
            activeKey={activeKey}
            local={local}
            onFail={() => setFailed(true)}
          />
        )}
      </Stage>

      <Caption text={scene.text} local={local} />

      <AudioTrack tutorial={TUT} frames={frames} hasAudio={hasAudio} />
    </AbsoluteFill>
  );
}
