import * as React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';

import { brand, FONT_DISPLAY, FONT_SANS, SHADOW_LIFT } from './brand';

/**
 * The drawing kit the marketing scenes are built from.
 *
 * Everything here is deliberately small and dumb: a card, a chip, a tick, a
 * counter. The scenes compose them. Nothing in this file knows what the film is
 * about, which is what keeps a copy change from turning into a layout change.
 */

/* ── Motion helpers ──────────────────────────────────────────────────────── */

/** A spring that settles fast and does not wobble. The film's default entrance. */
export function useRise(local: number, delay = 0): { opacity: number; y: number } {
  const { fps } = useVideoConfig();
  const s = spring({
    frame: local - delay,
    fps,
    config: { damping: 200, mass: 0.6, stiffness: 110 },
  });
  return { opacity: s, y: (1 - s) * 26 };
}

/** Linear fade with clamped ends — for anything that must not overshoot. */
export function fade(local: number, from: number, to: number): number {
  return interpolate(local, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * A number that counts up to its value.
 *
 * Counters are the one place the film asks the viewer to read a figure, so the
 * count settles well before the narration reaches the next sentence rather than
 * running under it.
 */
export function CountUp({
  to,
  local,
  delay = 0,
  frames = 34,
  suffix = '',
  prefix = '',
}: {
  to: number;
  local: number;
  delay?: number;
  frames?: number;
  suffix?: string;
  prefix?: string;
}) {
  const t = interpolate(local - delay, [0, frames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  /* Ease-out: fast at the start, so the eye catches the movement, then slow
     enough at the end to read the final digits. */
  const eased = 1 - Math.pow(1 - t, 3);
  return (
    <>
      {prefix}
      {Math.round(to * eased).toLocaleString('en-IN')}
      {suffix}
    </>
  );
}

/* ── Surfaces ────────────────────────────────────────────────────────────── */

/** A sheet of light paper floating on the navy. The film's basic container. */
export function Card({
  children,
  style,
  local,
  delay = 0,
  tone = 'paper',
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  local?: number;
  delay?: number;
  tone?: 'paper' | 'gold' | 'outline';
}) {
  const rise = useRise(local ?? 999, delay);
  const anim =
    local === undefined ? {} : { opacity: rise.opacity, transform: `translateY(${rise.y}px)` };

  const tones: Record<string, React.CSSProperties> = {
    paper: { background: '#FFFFFF', color: brand.ink, boxShadow: SHADOW_LIFT },
    gold: {
      background: brand.gold400,
      color: brand.navy950,
      boxShadow: '0 24px 60px -22px rgba(245,165,36,.5)',
    },
    outline: {
      background: 'rgba(255,255,255,.04)',
      color: '#FFFFFF',
      border: `2px solid rgba(255,255,255,.16)`,
    },
  };

  return (
    <div style={{ borderRadius: 28, padding: 34, ...tones[tone], ...anim, ...style }}>
      {children}
    </div>
  );
}

/** A small labelled pill. Used for portal names and covered items. */
export function Chip({
  children,
  tone = 'navy',
  size = 26,
}: {
  children: React.ReactNode;
  tone?: 'navy' | 'gold' | 'ok' | 'risk' | 'ghost';
  size?: number;
}) {
  const tones: Record<string, React.CSSProperties> = {
    navy: { background: brand.navy50, color: brand.navy700 },
    gold: { background: brand.gold50, color: brand.gold600 },
    ok: { background: brand.okTint, color: brand.ok },
    risk: { background: brand.riskTint, color: brand.risk },
    ghost: {
      background: 'rgba(255,255,255,.08)',
      color: '#FFFFFF',
      border: '1px solid rgba(255,255,255,.16)',
    },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        padding: `${size * 0.36}px ${size * 0.72}px`,
        fontSize: size,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        fontFamily: FONT_SANS,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

/** The small uppercase label above a block, matching the site's `.eyebrow`. */
export function Eyebrow({
  children,
  color = brand.gold400,
  tracked = true,
}: {
  children: React.ReactNode;
  color?: string;
  /**
   * Whether to track the label out. TRUE only for Latin: the wide uppercase
   * eyebrow is a Latin device, and Devanagari conjuncts are single glyphs
   * sitting under one horizontal bar — spacing them prises the word apart.
   */
  tracked?: boolean;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT_SANS,
        fontSize: 21,
        fontWeight: 600,
        letterSpacing: tracked ? '0.22em' : '0.04em',
        textTransform: 'uppercase',
        color,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          transform: 'rotate(45deg)',
          background: brand.gold400,
          flexShrink: 0,
        }}
      />
      {children}
    </div>
  );
}

/** A display headline on the navy. */
export function Headline({
  children,
  size = 78,
  align = 'center',
  color = '#FFFFFF',
  style,
}: {
  children: React.ReactNode;
  size?: number;
  align?: React.CSSProperties['textAlign'];
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 1.08,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color,
        textAlign: align,
        textWrap: 'balance',
        /* The headline sits on a photograph on every scene now. The shadow is
           invisible over the scrim and saves the line over a bright sky. */
        textShadow: '0 2px 18px rgba(16,17,51,.55)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Gold({ children }: { children: React.ReactNode }) {
  return <span style={{ color: brand.gold400 }}>{children}</span>;
}

/* ── Marks ───────────────────────────────────────────────────────────────── */

/** A tick that draws itself. `t` is 0 → 1. */
export function Tick({
  size = 34,
  t = 1,
  color = brand.ok,
}: {
  size?: number;
  t?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.max(0, Math.min(1, t))}
      />
    </svg>
  );
}

export function Cross({ size = 34, color = brand.risk }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6 L18 18 M18 6 L6 18" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** A circular badge holding a tick or a cross. */
export function StatusDot({ ok, size = 46, t = 1 }: { ok: boolean; size?: number; t?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        background: ok ? brand.okTint : brand.riskTint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {ok ? <Tick size={size * 0.62} t={t} /> : <Cross size={size * 0.56} />}
    </div>
  );
}

/* ── Rows ────────────────────────────────────────────────────────────────── */

/** One worry / one handled item: a status dot and a line of text. */
export function StatusRow({
  ok,
  children,
  local,
  delay = 0,
  tickAt = 6,
  size = 32,
}: {
  ok: boolean;
  children: React.ReactNode;
  local: number;
  delay?: number;
  tickAt?: number;
  size?: number;
}) {
  const rise = useRise(local, delay);
  const t = fade(local, delay + tickAt, delay + tickAt + 10);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        opacity: rise.opacity,
        transform: `translateY(${rise.y}px)`,
      }}
    >
      <StatusDot ok={ok} size={size * 1.4} t={t} />
      <div
        style={{
          fontSize: size,
          fontWeight: 600,
          color: brand.ink,
          lineHeight: 1.25,
          textDecoration: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
