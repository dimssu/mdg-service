import * as React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import {
  AudioTrack,
  Caption,
  EXPLAINER_BG,
  ExplainerHeader,
  ProgressBar,
  Stage,
} from '../components/explainerChrome';
import type { TutorialProps } from '../lib/calc';
import { CARD_BY_STATE, stepToFocus } from '../lib/creditCard';
import { activeScene } from '../lib/scene';
import { TUTORIAL_BY_ID } from '../narration';
import { CreditCard } from '../screens/CreditCard';
import { FONT_FAMILY, VIDEO } from '../theme';

/**
 * CreditMonitor (Variant A) — reads the "CREDIT & DOD MONITORING" card by drawing
 * a clean, animated recreation of it and ringing exactly the row being narrated.
 * The card is redrawn (not a screenshot), so every field is crisp and the
 * advance/credit state is shown on its own card. Same narration + voiceover as
 * the marked-up-photo variant (CreditMonitorPhoto).
 */

const TUT = TUTORIAL_BY_ID['credit-monitor'];

function StateBadge({ local }: { local: number }) {
  const o = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        opacity: o,
        marginBottom: 22,
        background: '#f0fdf4',
        border: '2px solid #86efac',
        borderRadius: 999,
        padding: '12px 30px',
        fontSize: 30,
        fontWeight: 700,
        color: '#166534',
      }}
    >
      स्थिति: एडवांस — कोई बकाया नहीं
    </div>
  );
}

export function CreditMonitorVideo({ sceneFrames, hasAudio }: TutorialProps) {
  const frame = useCurrentFrame();
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
      <ExplainerHeader title={TUT.title} subtitle={TUT.subtitle} />

      <Stage>
        {state === 'advance' ? <StateBadge local={local} /> : null}
        <CreditCard
          data={CARD_BY_STATE[state]}
          activeKey={activeKey}
          local={local}
          scale={state === 'advance' ? 0.92 : 1}
        />
      </Stage>

      <Caption text={scene.text} local={local} />

      <AudioTrack tutorial={TUT} frames={frames} hasAudio={hasAudio} />
    </AbsoluteFill>
  );
}
