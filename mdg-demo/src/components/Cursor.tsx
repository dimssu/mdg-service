import * as React from 'react';
import { Easing, interpolate } from 'remotion';

import { colors } from '../theme';

import { HandTap } from './icons';

export interface Point {
  x: number;
  y: number;
}

/**
 * A hand cursor that glides from `from` to `to` at the start of a scene and taps
 * at `pressAt` (a local frame), with a ripple. Coordinates are in the phone's
 * content space. The fingertip of the hand aligns exactly to the point.
 */
export function Cursor({
  from,
  to,
  local,
  moveFrames = 14,
  pressAt = null,
  size = 108,
  visible = true,
}: {
  from: Point;
  to: Point;
  local: number;
  moveFrames?: number;
  pressAt?: number | null;
  size?: number;
  visible?: boolean;
}) {
  if (!visible) return null;

  const t = interpolate(local, [0, moveFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;

  const pressT =
    pressAt == null
      ? 0
      : interpolate(local, [pressAt - 4, pressAt, pressAt + 7], [0, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const scale = 1 - 0.14 * pressT;

  const showRipple = pressAt != null && local >= pressAt && local <= pressAt + 20;
  const rippleT =
    pressAt == null
      ? 0
      : interpolate(local, [pressAt, pressAt + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // Fingertip position within the HandTap viewBox (approx 11,4 of 24).
  const tipX = (11 / 24) * size;
  const tipY = (4 / 24) * size;

  return (
    <>
      {showRipple ? (
        <div
          style={{
            position: 'absolute',
            left: x - 44,
            top: y - 44,
            width: 88,
            height: 88,
            borderRadius: 999,
            border: `3px solid ${colors.brand}`,
            opacity: (1 - rippleT) * 0.55,
            transform: `scale(${0.35 + rippleT * 1.15})`,
            zIndex: 60,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: x - tipX,
          top: y - tipY,
          transform: `scale(${scale})`,
          transformOrigin: `${tipX}px ${tipY}px`,
          filter: 'drop-shadow(0 8px 12px rgba(15,23,42,0.28))',
          zIndex: 61,
        }}
      >
        <HandTap size={size} color={colors.text} />
      </div>
    </>
  );
}
