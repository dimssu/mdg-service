import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { admin } from './tokens';

/**
 * The handful of admin-portal primitives the mocked screens share — a Card, a
 * Button and a Badge, matching `mdg-admin/src/components/ui/*` (8px radius,
 * `h-9` buttons, 22px pill badges) at the same pixel sizes so the mock reads as
 * a screenshot rather than a redraw.
 */

export type AdminIntent = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const INTENT_COLORS: Record<AdminIntent, { bg: string; fg: string }> = {
  success: { bg: admin.successSoft, fg: admin.success },
  warning: { bg: admin.warningSoft, fg: admin.warning },
  danger: { bg: admin.dangerSoft, fg: admin.danger },
  info: { bg: admin.infoSoft, fg: admin.info },
  neutral: { bg: admin.neutralSoft, fg: admin.neutral },
};

export function AdminBadge({
  intent = 'neutral',
  children,
  style,
}: {
  intent?: AdminIntent;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const c = INTENT_COLORS[intent];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        padding: '0 9px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12.5,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export type AdminButtonVariant = 'primary' | 'secondary';

export function AdminButton({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  pressed,
  disabled,
  style,
}: {
  children: React.ReactNode;
  variant?: AdminButtonVariant;
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  /** Darkened + nudged, to simulate the instant the cursor clicks. */
  pressed?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const height = size === 'md' ? 36 : 32;
  const palette: React.CSSProperties =
    variant === 'primary'
      ? {
          background: pressed ? admin.brandHover : admin.brand,
          color: admin.textInverse,
          border: '1px solid transparent',
        }
      : {
          background: pressed ? admin.surface2 : admin.surface,
          color: admin.text,
          border: `1px solid ${admin.borderStrong}`,
        };
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size === 'md' ? 8 : 6,
        height,
        padding: size === 'md' ? '0 16px' : '0 12px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        transform: pressed ? 'translateY(1px)' : undefined,
        ...palette,
        ...(disabled ? { opacity: 0.7 } : null),
        ...style,
      }}
    >
      {leftIcon}
      <span>{children}</span>
    </div>
  );
}

export function AdminCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: admin.surface,
        border: `1px solid ${admin.border}`,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
        fontFamily: FONT_FAMILY,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A read-only `<input>` stand-in (the As-of date field, the header search). */
export function AdminInput({
  value,
  placeholder,
  width,
  leftIcon,
  muted,
  focused,
}: {
  value?: string;
  placeholder?: string;
  width?: number;
  leftIcon?: React.ReactNode;
  /** The disabled "Search (coming soon)" look. */
  muted?: boolean;
  focused?: boolean;
}) {
  const empty = !value;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width,
        height: 36,
        padding: '0 12px',
        borderRadius: 8,
        background: muted ? admin.surface2 : admin.surface,
        border: `1px solid ${focused ? admin.brand : admin.border}`,
        boxShadow: focused ? `0 0 0 3px ${admin.brandSoft}` : undefined,
        fontSize: 14,
        color: empty ? admin.textSubtle : admin.text,
      }}
    >
      {leftIcon}
      <span>{empty ? placeholder : value}</span>
    </div>
  );
}
