import * as React from 'react';

import { colors } from '../theme';

/**
 * A pulsing ring drawn around a target rectangle (phone content coords) to point
 * the eye at the button the cursor is about to tap.
 */
export function Highlight({
  x,
  y,
  w,
  h,
  local,
  radius = 999,
  visible = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  local: number;
  radius?: number;
  visible?: boolean;
}) {
  if (!visible) return null;
  const pulse = (Math.sin(local / 7) + 1) / 2; // 0..1
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 6,
        top: y - 6,
        width: w + 12,
        height: h + 12,
        borderRadius: radius,
        border: `2.5px solid ${colors.brand}`,
        boxShadow: `0 0 0 ${3 + pulse * 7}px rgba(24,24,27,${0.05 + pulse * 0.1})`,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  );
}
