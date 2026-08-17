import * as React from 'react';

import { admin } from './tokens';

/**
 * A pulsing ring drawn around a target rectangle in BROWSER_CONTENT
 * (1440×620) coordinates — the landscape twin of `components/Highlight.tsx`,
 * which is sized and coloured for the phone frame.
 *
 * Differences that matter: a wider halo (a desktop frame is scaled down, so the
 * phone's 3px glow disappears), the admin's blue brand instead of the client's
 * near-black, and an 8px default radius to match the portal's `rounded-md`.
 *
 * `local` is the scene-local frame number, passed in rather than read from
 * `useCurrentFrame()` so this stays a pure component the screens can compose.
 */
export interface RingProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Scene-local frame; drives the pulse. */
  local: number;
  radius?: number;
  visible?: boolean;
}

/**
 * The same pulse, but wrapping whatever it is dropped inside (the parent must be
 * `position: relative`) instead of being positioned by measured coordinates.
 *
 * Preferred for anything a mocked screen owns: a ring placed by hand-measured
 * pixels silently drifts off target the moment that screen's layout changes,
 * whereas this one moves with it. `Ring` stays for the few targets that live in
 * the shell rather than in a component the video can reach into.
 */
export function RingOverlay({
  local,
  radius = 10,
  inset = -5,
}: {
  local: number;
  radius?: number;
  /** Negative grows the ring outwards from the parent's box. */
  inset?: number;
}) {
  const pulse = (Math.sin(local / 7) + 1) / 2;
  return (
    <div
      style={{
        position: 'absolute',
        inset,
        borderRadius: radius,
        border: `2.5px solid ${admin.brand}`,
        boxShadow: `0 0 0 ${4 + pulse * 9}px rgba(37,99,235,${0.06 + pulse * 0.12})`,
        pointerEvents: 'none',
        zIndex: 70,
      }}
    />
  );
}

export function Ring({ x, y, w, h, local, radius = 8, visible = true }: RingProps) {
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
        borderRadius: radius + 6,
        border: `2.5px solid ${admin.brand}`,
        boxShadow: `0 0 0 ${4 + pulse * 9}px rgba(37,99,235,${0.06 + pulse * 0.12})`,
        zIndex: 70,
        pointerEvents: 'none',
      }}
    />
  );
}
