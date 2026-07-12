import * as React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';

import { colors, FONT_FAMILY, VIDEO } from '../theme';

import { FRAME_H, FRAME_W } from './PhoneFrame';

const HEADER_BOTTOM = 250;
const CAPTION_TOP = 1600;
const AVAIL_H = CAPTION_TOP - HEADER_BOTTOM;

const scale = Math.min((VIDEO.width - 170) / FRAME_W, AVAIL_H / FRAME_H);
const phoneW = FRAME_W * scale;
const phoneLeft = (VIDEO.width - phoneW) / 2;
const phoneTop = HEADER_BOTTOM + (AVAIL_H - FRAME_H * scale) / 2;

function ProgressBar({
  stepIndex,
  stepCount,
  stepProgress,
}: {
  stepIndex: number;
  stepCount: number;
  stepProgress: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 60px' }}>
      {Array.from({ length: stepCount }).map((_, i) => {
        const fill = i < stepIndex ? 1 : i === stepIndex ? stepProgress : 0;
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

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ padding: '22px 60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
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
        <span style={{ fontSize: 22, fontWeight: 600, color: colors.textMuted }}>MDG · सीखें</span>
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

function Caption({ text, local }: { text: string; local: number }) {
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
          maxWidth: 900,
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

/**
 * The full 1080×1920 tutorial layout: brand header + step progress on top, the
 * scaled phone in the middle, and the large Hindi caption at the bottom.
 */
export function TutorialFrame({
  title,
  subtitle,
  caption,
  captionLocal,
  stepIndex,
  stepCount,
  stepProgress,
  children,
}: {
  title: string;
  subtitle: string;
  caption: string;
  captionLocal: number;
  stepIndex: number;
  stepCount: number;
  stepProgress: number;
  children: React.ReactNode;
}) {
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        background: `radial-gradient(120% 80% at 50% 0%, #ffffff 0%, ${colors.bg} 45%, #eef0f4 100%)`,
      }}
    >
      <div style={{ paddingTop: 46 }}>
        <ProgressBar stepIndex={stepIndex} stepCount={stepCount} stepProgress={stepProgress} />
      </div>
      <Header title={title} subtitle={subtitle} />

      <div
        style={{
          position: 'absolute',
          left: phoneLeft,
          top: phoneTop,
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>

      <Caption text={caption} local={captionLocal} />
    </AbsoluteFill>
  );
}
