import * as React from 'react';

/**
 * Scale a fixed-size thing to fit the space it is given.
 *
 * ── WHY THIS DELETES CONSTANTS RATHER THAN ADDING ONE ──────────────────────
 *
 * The videos are full of hand-tuned scale numbers: `DEFAULT_SCALE = 1.34` in the
 * landscape chrome, a per-video `STAGE_SCALE` map in each of four admin videos,
 * `FRAME_SCALE = 0.9` in three of them, and a `scale` in `TutorialFrame`
 * computed from the gap between a header and a caption. Every one of them was
 * arrived at by rendering, squinting, and adjusting.
 *
 * That is fine exactly once. It stops being fine the moment the layout moves —
 * and removing the header bar moves every one of them at the same time. Re-tuning
 * eight numbers by eye is an afternoon; doing it again on the next layout change
 * is another afternoon, forever.
 *
 * So nothing is tuned. A frame declares its own logical size — `PhoneFrame`
 * already exports `FRAME_W`/`FRAME_H`, the browser frame exports its own — the
 * band table says how much room there is, and the scale is the quotient. Header
 * removal then becomes a one-time change to two numbers in `layout.ts` instead of
 * a recurring tax on every geometry decision anyone ever makes again.
 *
 * What it works out to, against the real constants:
 *   portrait phone   418x872 into a 940x1488 stage -> 1.71 (was 1.548)
 *   landscape portal 1440x672 into a 1680x800 stage -> 1.19 (was 0.9)
 * The mocked admin portal gets about a third larger, which is the single biggest
 * legibility gain from dropping the header — and nobody had to squint at it.
 */

export interface FitProps {
  /** The logical size of the thing being drawn. */
  box: { w: number; h: number };
  /** The space available. */
  into: { w: number; h: number };
  /**
   * Never scale beyond this. A small diagram in a large stage blown up 4x looks
   * like a mistake rather than like emphasis; past a point, more size is not more
   * legibility, it is just a bigger picture of the same thing.
   */
  max?: number;
  /** Multiplied into the computed fit — this is where `densityScale` goes. */
  boost?: number;
  children: React.ReactNode;
}

/** The scale `<Fit>` would apply. Exported so a caller can reason about it. */
export function fitScale(
  box: { w: number; h: number },
  into: { w: number; h: number },
  max = 2.4,
  boost = 1,
): number {
  if (box.w <= 0 || box.h <= 0) return 1;
  return Math.min(max, Math.min(into.w / box.w, into.h / box.h) * boost);
}

/**
 * Centres `children` in `into`, scaled to fit `box`.
 *
 * The inner element keeps its LOGICAL size, so everything inside it — anchor
 * coordinates, font sizes, the ring a screen exports — is written at natural
 * scale and never has to know it is being resized. That is what makes a screen's
 * exported anchors survive a layout change: they are in the screen's own
 * coordinates, and only this wrapper knows about pixels on the canvas.
 */
export function Fit({ box, into, max = 2.4, boost = 1, children }: FitProps) {
  const scale = fitScale(box, into, max, boost);
  return (
    <div
      style={{
        width: into.w,
        height: into.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          width: box.w,
          height: box.h,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flex: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
