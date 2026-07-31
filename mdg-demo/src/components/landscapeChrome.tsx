import * as React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';

import { colors } from '../theme';

/**
 * Landscape (1920×1080) chrome for the ADMIN tutorials.
 *
 * The dealer tutorials are portrait because dealers watch on a phone and the
 * subject is a phone app. Admins work in a desktop browser, so a portrait frame
 * would either shrink the portal to unreadable or crop it. Rather than
 * parameterise `explainerChrome` (whose geometry constants are baked at module
 * scope and shared by the shipped dealer videos), this is its landscape sibling:
 * same visual language, same progress bar / header / caption rhythm, different
 * canvas.
 *
 * Layout, top to bottom:
 *   0..168     progress bar + header (title, subtitle, badge)
 *   168..880   stage — the diagram or the mocked browser
 *   880..1080  caption
 */
export const VIDEO_LANDSCAPE = { width: 1920, height: 1080, fps: 30 } as const;

export const L_STAGE_TOP = 168;
export const L_STAGE_BOTTOM = 880;
export const L_CAPTION_TOP = 880;

export const LANDSCAPE_BG = `radial-gradient(110% 90% at 50% 0%, #ffffff 0%, ${colors.bg} 45%, #eef0f4 100%)`;

export function LProgressBar({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 64px' }}>
      {Array.from({ length: count }).map((_, i) => {
        const fill = i < index ? 1 : i === index ? progress : 0;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
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

/**
 * One compact header line — landscape has far less vertical room than portrait,
 * so the logo, badge, title and subtitle share a single row instead of stacking.
 */
export function LHeader({
  title,
  subtitle,
  badge = 'MDG · एडमिन गाइड',
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div
      style={{
        padding: '18px 64px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          background: colors.brand,
          color: colors.textInverse,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          flex: 'none',
        }}
      >
        MDG
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: colors.text,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, color: colors.textSubtle, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
      <div
        style={{
          flex: 'none',
          fontSize: 19,
          fontWeight: 600,
          color: colors.textMuted,
          background: colors.surface2,
          border: `1px solid ${colors.border}`,
          borderRadius: 999,
          padding: '7px 18px',
        }}
      >
        {badge}
      </div>
    </div>
  );
}

export function LStage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: L_STAGE_TOP,
        width: VIDEO_LANDSCAPE.width,
        height: L_STAGE_BOTTOM - L_STAGE_TOP,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 64px',
      }}
    >
      {children}
    </div>
  );
}

export function LCaption({ text, local }: { text: string; local: number }) {
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(local, [0, 8], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: L_CAPTION_TOP,
        width: VIDEO_LANDSCAPE.width,
        height: VIDEO_LANDSCAPE.height - L_CAPTION_TOP,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 120px',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          maxWidth: 1500,
          textAlign: 'center',
          fontSize: 32,
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

/** The whole landscape frame minus the stage contents. */
export function LandscapeShell({
  title,
  subtitle,
  badge,
  index,
  count,
  progress,
  caption,
  local,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  index: number;
  count: number;
  progress: number;
  caption: string;
  local: number;
  children: React.ReactNode;
}) {
  return (
    <AbsoluteFill style={{ background: LANDSCAPE_BG }}>
      <div style={{ paddingTop: 34 }}>
        <LProgressBar index={index} count={count} progress={progress} />
      </div>
      <LHeader title={title} subtitle={subtitle} badge={badge} />
      <LStage>{children}</LStage>
      <LCaption text={caption} local={local} />
    </AbsoluteFill>
  );
}
