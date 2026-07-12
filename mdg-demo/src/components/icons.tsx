import * as React from 'react';

type IconProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
};

/** Minimal inline-SVG icons matching the lucide icons the app uses. */
function base(size: number, strokeWidth: number, color: string, style?: React.CSSProperties) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
  };
}

export const Plus = ({ size = 20, strokeWidth = 2, color = 'currentColor', style }: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Minus = ({ size = 20, strokeWidth = 2, color = 'currentColor', style }: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M5 12h14" />
  </svg>
);

export const UserPlus = ({
  size = 20,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

export const ChevronLeft = ({
  size = 20,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const X = ({ size = 20, strokeWidth = 1.75, color = 'currentColor', style }: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const Check = ({
  size = 16,
  strokeWidth = 2.5,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const Search = ({
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const Trophy = ({
  size = 28,
  strokeWidth = 1.5,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export const MessageCircle = ({
  size = 18,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

export const Undo = ({ size = 16, strokeWidth = 2, color = 'currentColor', style }: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

export const Camera = ({
  size = 20,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M14.5 4h-5L8 6H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-4l-1.5-2Z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);

export const Trash = ({
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M4 6h16" />
    <path d="M9 6V4h6v2" />
    <path d="M6 6l1 14h10l1-14" />
  </svg>
);

export const CloudCheck = ({
  size = 14,
  strokeWidth = 2,
  color = 'currentColor',
  style,
}: IconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M20 12a4 4 0 0 0-4-4 5.5 5.5 0 0 0-10.5 1.5A3.5 3.5 0 0 0 6 18h13" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

/** A pointing-hand cursor for tap demonstrations. */
export const HandTap = ({ size = 96, color = '#0f172a', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path
      d="M9 11.5V5.5a1.5 1.5 0 0 1 3 0v5"
      fill="#ffffff"
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 10.5V9a1.5 1.5 0 0 1 3 0v1.5M15 10.5V9.5a1.5 1.5 0 0 1 3 0V15a5 5 0 0 1-5 5h-1.2a5 5 0 0 1-3.6-1.5l-3-3.1a1.5 1.5 0 0 1 2.1-2.1L9 15"
      fill="#ffffff"
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
