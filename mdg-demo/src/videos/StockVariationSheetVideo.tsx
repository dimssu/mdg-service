import * as React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import {
  AudioTrack,
  CAPTION_TOP,
  EXPLAINER_BG,
  ExplainerHeader,
  ProgressBar,
} from '../components/explainerChrome';
import type { TutorialProps } from '../lib/calc';
import { activeScene } from '../lib/scene';
import {
  assertSheetIsConsistent,
  type Band,
  type Callout,
  type CalloutRow,
  FOCUS_BY_STEP,
  SHEET,
  TABLE,
} from '../lib/stockSheet';
import { TUTORIAL_BY_ID } from '../narration';
import { colors, FONT_FAMILY, VIDEO } from '../theme';

/**
 * "स्टॉक वेरिएशन शीट पढ़ना" — reading the OLD, hand-typed stock-variation sheet.
 *
 * ## Why this video is built differently from the other explainers
 *
 * Every other dealer tutorial redraws a phone screen, so it can simply show that
 * screen. This one teaches a document the dealer already holds, and that document
 * is a 970×745 LANDSCAPE sheet. Dropped whole into a portrait 1080×1920 frame it
 * renders about 1:1 with the original — which sounds fine until you remember the
 * dealer watches on a phone, where the frame itself shrinks to roughly a third.
 * Every row would be unreadable.
 *
 * Zooming into a row does not rescue it either: a row runs the full width of the
 * table (label on the far left, value on the far right), so the width is pinned
 * and there is no zoom to spend.
 *
 * So the stage is in two tiers:
 *
 *   - **the sheet itself**, whole, small, with everything except the row under
 *     discussion dimmed. This is the "you are here" map — it never has to be
 *     read, only recognised, so that the dealer can find the same line on the
 *     copy in their own chat.
 *   - **a callout**, big enough to read on a phone, which re-typesets that row's
 *     label and value and adds the plain-Hindi gloss the original sheet has no
 *     room for.
 *
 * The callout re-typesets rather than crops, which makes it a transcription of
 * the picture above it — see `src/lib/stockSheet.ts`, which owns both the
 * measured row positions and the figures, and asserts the one sum the sheet
 * states twice.
 */

const TUT = TUTORIAL_BY_ID['stock-variation-sheet'];
const SHEET_SRC = staticFile('stock-variation/sheet.jpg');

/* Stage geometry (portrait 1080×1920). Header and caption come from the shared
 * explainer chrome; the two tiers divide what is left. */
const SHEET_TOP = 306;
const SHEET_W = 852;
const SHEET_H = Math.round((SHEET_W * SHEET.height) / SHEET.width); // 654
const CALLOUT_TOP = SHEET_TOP + SHEET_H + 34; // 994
const CALLOUT_H = 1560 - CALLOUT_TOP; // to the caption

/** Product colours lifted off the sheet itself, so the callout reads as its row. */
const PRODUCT = {
  hsd: { band: '#3b78dc', ink: '#ffffff', soft: '#e8f0fd' },
  ms: { band: '#f9ca9c', ink: '#3f2a12', soft: '#fdf1e6' },
} as const;

/** Fade/rise used by every tier when a scene starts. */
function entry(local: number, delay = 0) {
  const opacity = interpolate(local, [delay, delay + 9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(local, [delay, delay + 9], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return { opacity, transform: `translateY(${ty}px)` };
}

/**
 * The sheet with everything but the marked rows dimmed.
 *
 * The dim is drawn as one full-bleed veil with the marked bands punched out,
 * rather than as four rectangles around each band, so several marks (the two
 * product headings, say) can be lit at once without their veils overlapping and
 * darkening each other.
 */
function SheetMap({ marks, local, onFail }: { marks: Band[]; local: number; onFail: () => void }) {
  const pulse = (Math.sin(local / 8) + 1) / 2;
  const lit = interpolate(local, [4, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fractions of the sheet, 0..1 — the ring is positioned from these directly,
  // the veil's holes need the conversion below.
  const rects = marks.map((b) => ({
    left: TABLE.left / SHEET.width,
    width: (TABLE.right - TABLE.left) / SHEET.width,
    top: b.top / SHEET.height,
    height: (b.bottom - b.top) / SHEET.height,
  }));

  /**
   * `mask-position: X%` is proportional, not absolute: it lines the X% point of
   * the mask layer up with the X% point of the box, so a layer smaller than the
   * box lands at `(box − layer) × X%` rather than at `X%`. Feeding a row's plain
   * top fraction straight in therefore slides the hole off the row it belongs to
   * — badly for the short rows, by a whole row for the tall advisory block.
   * Solve `offset = (1 − size) × p` for `p` to place the hole exactly.
   */
  const maskPos = (offset: number, size: number) =>
    size >= 1 ? '0%' : `${(offset / (1 - size)) * 100}%`;

  const pct = (v: number) => `${v * 100}%`;

  return (
    <div
      style={{
        position: 'absolute',
        left: (VIDEO.width - SHEET_W) / 2,
        top: SHEET_TOP,
        width: SHEET_W,
        height: SHEET_H,
        borderRadius: 14,
        overflow: 'hidden',
        border: `2px solid ${colors.border}`,
        boxShadow: '0 20px 48px rgba(24,24,27,0.20)',
        lineHeight: 0,
      }}
    >
      <Img src={SHEET_SRC} onError={onFail} style={{ width: '100%', height: '100%' }} />

      {marks.length > 0 ? (
        <>
          {/* One veil, with a hole per marked band. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15,23,42,0.52)',
              opacity: lit,
              // Punching the holes with a mask keeps the veil a single layer, so
              // overlapping marks never darken each other.
              WebkitMaskImage: [
                'linear-gradient(#000 0 0)',
                ...rects.map(() => 'linear-gradient(#000 0 0)'),
              ].join(','),
              WebkitMaskComposite: 'xor',
              maskImage: [
                'linear-gradient(#000 0 0)',
                ...rects.map(() => 'linear-gradient(#000 0 0)'),
              ].join(','),
              maskComposite: 'exclude',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: [
                '0% 0%',
                ...rects.map((r) => `${maskPos(r.left, r.width)} ${maskPos(r.top, r.height)}`),
              ].join(','),
              maskPosition: [
                '0% 0%',
                ...rects.map((r) => `${maskPos(r.left, r.width)} ${maskPos(r.top, r.height)}`),
              ].join(','),
              WebkitMaskSize: [
                '100% 100%',
                ...rects.map((r) => `${pct(r.width)} ${pct(r.height)}`),
              ].join(','),
              maskSize: ['100% 100%', ...rects.map((r) => `${pct(r.width)} ${pct(r.height)}`)].join(
                ',',
              ),
            }}
          />
          {rects.map((r, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: pct(r.left),
                top: pct(r.top),
                width: pct(r.width),
                height: pct(r.height),
                border: `4px solid #f59e0b`,
                borderRadius: 6,
                boxShadow: `0 0 0 ${2 + pulse * 7}px rgba(245,158,11,${0.2 + pulse * 0.18})`,
                opacity: lit,
                pointerEvents: 'none',
              }}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}

/** One re-typeset row of the sheet, at a size that survives a phone screen. */
function Row({ row, tone }: { row: CalloutRow; tone: 'hsd' | 'ms' }) {
  const p = PRODUCT[tone];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '16px 22px',
        borderRadius: 14,
        background: row.active ? p.soft : colors.surface,
        border: `2px solid ${row.active ? p.band : colors.border}`,
        opacity: row.active ? 1 : 0.55,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 27,
            fontWeight: 700,
            color: colors.text,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
          }}
        >
          {row.label}
        </div>
        <div style={{ fontSize: 25, fontWeight: 500, color: colors.textSubtle, marginTop: 4 }}>
          {row.hi}
        </div>
      </div>
      <div
        style={{
          flex: 'none',
          fontSize: 54,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: row.alarm ? colors.danger : colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.value}
      </div>
    </div>
  );
}

/**
 * The shared `Caption` is fixed at 40px, which suits the app walkthroughs — their
 * lines are short because the screen is doing the explaining. Here the caption
 * carries the teaching, so the longest lines run past 200 characters and would
 * spill out of the bottom of the frame at a fixed size. Step the size down by
 * length instead: short captions keep the series' 40px, the longest settle at
 * 33px, which fits six lines inside the caption band with room to spare.
 */
function SheetCaption({ text, local }: { text: string; local: number }) {
  const fontSize = text.length > 190 ? 33 : text.length > 150 ? 36 : 40;
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
          ...entry(local),
          maxWidth: 920,
          textAlign: 'center',
          fontSize,
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

function CalloutCard({ callout, local }: { callout: Callout; local: number }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: 60,
    top: CALLOUT_TOP,
    width: VIDEO.width - 120,
    height: CALLOUT_H,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 14,
    ...entry(local, 3),
  };

  if (callout.kind === 'rows') {
    const p = PRODUCT[callout.product];
    return (
      <div style={style}>
        <div
          style={{
            alignSelf: 'flex-start',
            background: p.band,
            color: p.ink,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '0.01em',
            padding: '9px 20px',
            borderRadius: 999,
          }}
        >
          {callout.title}
        </div>
        {callout.rows.map((r) => (
          <Row key={r.label} row={r} tone={callout.product} />
        ))}
      </div>
    );
  }

  if (callout.kind === 'advice') {
    return (
      <div style={style}>
        <div
          style={{
            background: PRODUCT.hsd.band,
            color: PRODUCT.hsd.ink,
            borderRadius: 18,
            padding: '30px 34px',
          }}
        >
          <div style={{ fontSize: 25, fontWeight: 700, opacity: 0.85, marginBottom: 12 }}>
            क्या करना है
          </div>
          <div style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.45 }}>{callout.hi}</div>
        </div>
      </div>
    );
  }

  if (callout.kind === 'whole') {
    return (
      <div style={{ ...style, justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: colors.text,
            textAlign: 'center',
          }}
        >
          {callout.title}
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: colors.textMuted,
            textAlign: 'center',
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          {callout.hi}
        </div>
      </div>
    );
  }

  return (
    <div style={style}>
      <div
        style={{
          background: colors.surface,
          border: `2px solid ${colors.border}`,
          borderRadius: 18,
          padding: '26px 30px',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, color: colors.text, marginBottom: 16 }}>
          {callout.title}
        </div>
        {callout.lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              marginTop: i === 0 ? 0 : 12,
            }}
          >
            <div
              style={{
                flex: 'none',
                width: 12,
                height: 12,
                borderRadius: 999,
                background: colors.brand,
                marginTop: 12,
              }}
            />
            <div
              style={{ fontSize: 30, fontWeight: 600, color: colors.textMuted, lineHeight: 1.4 }}
            >
              {line}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockVariationSheetVideo({ sceneFrames, hasAudio }: TutorialProps) {
  assertSheetIsConsistent();

  const frame = useCurrentFrame();
  const [failed, setFailed] = React.useState(false);
  const frames =
    sceneFrames.length === TUT.scenes.length
      ? sceneFrames
      : TUT.scenes.map((s) => Math.round(s.estSeconds * VIDEO.fps));

  const { index, local, length } = activeScene(frame, frames);
  const scene = TUT.scenes[index];
  const focus = FOCUS_BY_STEP[scene.step];

  if (!focus) {
    throw new Error(`stock-variation-sheet: no focus defined for step "${scene.step}"`);
  }

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY, background: EXPLAINER_BG }}>
      <div style={{ paddingTop: 46 }}>
        <ProgressBar
          index={index}
          count={TUT.scenes.length}
          progress={length ? local / length : 0}
        />
      </div>
      <ExplainerHeader title={TUT.title} subtitle={TUT.subtitle} badge="MDG · समझें" />

      {failed ? (
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: SHEET_TOP,
            width: VIDEO.width - 120,
            height: SHEET_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: 30,
            fontWeight: 600,
            color: colors.textSubtle,
            border: `2px dashed ${colors.borderStrong}`,
            borderRadius: 14,
            padding: 40,
          }}
        >
          शीट की फ़ोटो नहीं मिली → public/stock-variation/sheet.jpg
        </div>
      ) : (
        <SheetMap marks={focus.marks} local={local} onFail={() => setFailed(true)} />
      )}

      <CalloutCard callout={focus.callout} local={local} />

      <SheetCaption text={scene.text} local={local} />

      <AudioTrack tutorial={TUT} frames={frames} hasAudio={hasAudio} />
    </AbsoluteFill>
  );
}
