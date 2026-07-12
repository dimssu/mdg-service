import * as React from 'react';

import { colors } from '../theme';

import { Check } from './icons';

/** First character of the name — an avatar monogram (works for Hindi + Latin). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => Array.from(p)[0] ?? '')
    .join('');
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: colors.brandSoft,
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

export function PointsPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: colors.brandSoft,
        color: colors.text,
        borderRadius: 999,
        padding: '5px 11px',
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export function AppButton({
  children,
  variant = 'primary',
  fullWidth,
  leftIcon,
  pressed,
  size = 'lg',
  disabled,
  style,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  /** Slight scale + darken to simulate an active tap. */
  pressed?: boolean;
  size?: 'md' | 'lg';
  /** Greyed out and inert — e.g. final submit before the hardcopy photo exists. */
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const height = size === 'lg' ? 54 : 44;
  const palette: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: pressed ? colors.brandHover : colors.brand,
      color: colors.textInverse,
      border: 'none',
    },
    secondary: {
      background: pressed ? colors.surface2 : colors.surface,
      color: colors.text,
      border: `1px solid ${colors.borderStrong}`,
    },
    ghost: {
      background: pressed ? colors.surface2 : 'transparent',
      color: colors.text,
      border: 'none',
    },
  };
  return (
    <div
      style={{
        height,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 20px',
        fontSize: 16,
        fontWeight: 600,
        width: fullWidth ? '100%' : undefined,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        whiteSpace: 'nowrap',
        ...palette[variant],
        ...(disabled ? { opacity: 0.45 } : null),
        ...style,
      }}
    >
      {leftIcon}
      {children}
    </div>
  );
}

export function TextField({
  value,
  placeholder,
  focused,
  caret,
  type = 'text',
}: {
  value?: string;
  placeholder?: string;
  focused?: boolean;
  /** Show a blinking caret at the end (during typing). */
  caret?: boolean;
  type?: 'text' | 'password';
}) {
  const shown = value ?? '';
  const display = type === 'password' ? '•'.repeat(shown.length) : shown;
  const isEmpty = shown.length === 0;
  return (
    <div
      style={{
        height: 50,
        borderRadius: 12,
        border: `1px solid ${focused ? colors.text : colors.border}`,
        background: colors.surface,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        fontSize: 15.5,
        color: isEmpty ? colors.textSubtle : colors.text,
        boxShadow: focused ? `0 0 0 3px ${colors.brandSoft}` : 'none',
      }}
    >
      <span style={{ letterSpacing: type === 'password' ? 2 : 0 }}>
        {isEmpty ? placeholder : display}
      </span>
      {caret ? (
        <span
          style={{
            width: 2,
            height: 22,
            background: colors.text,
            marginLeft: 1,
            borderRadius: 1,
          }}
        />
      ) : null}
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{children}</span>;
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 20,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** The circular check used by the multi-select pickers. */
export function CheckCircle({ on, size = 24 }: { on: boolean; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        border: `1.5px solid ${on ? colors.brand : colors.borderStrong}`,
        background: on ? colors.brand : 'transparent',
        color: on ? colors.textInverse : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Check size={size * 0.6} color={on ? colors.textInverse : 'transparent'} />
    </div>
  );
}

/** Today / This-month segmented toggle from the staff header. */
export function SegmentToggle({
  options,
  activeIndex,
}: {
  options: string[];
  activeIndex: number;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: colors.surface2,
        borderRadius: 999,
        padding: 3,
      }}
    >
      {options.map((opt, i) => {
        const active = i === activeIndex;
        return (
          <div
            key={opt}
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              background: active ? colors.brand : 'transparent',
              color: active ? colors.textInverse : colors.textMuted,
            }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
}
