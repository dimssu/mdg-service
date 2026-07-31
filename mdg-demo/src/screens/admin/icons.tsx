import * as React from 'react';

/**
 * Inline-SVG stand-ins for the lucide icons the admin portal uses. The shared
 * `components/icons.tsx` covers the client app's set; these are the admin-only
 * ones (sidebar glyphs, table chevrons, the report actions).
 */
export interface AdminIconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
}

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

/* ---------------------------------------------------------------- sidebar */

export const MessageSquare = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const LayoutDashboard = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />
  </svg>
);

export const Building = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
    <path d="M2 22h20M10 6h4M10 10h4M10 14h4M10 22v-4h4v4" />
  </svg>
);

export const ShieldCheck = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Shield = ({
  size = 20,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const Database = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
  </svg>
);

export const Plug = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M12 22v-5M9 8V2M15 8V2" />
    <path d="M7 8h10v3a5 5 0 0 1-10 0z" />
  </svg>
);

export const ActivityPulse = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const ScrollText = ({
  size = 17,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M8 21h11a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
    <path d="M19 17V5a2 2 0 0 0-2-2H8" />
    <path d="M15 8h-5M15 12h-5" />
  </svg>
);

/* ------------------------------------------------------------------- ui */

export const Search = ({
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const ChevronDown = ({
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRight = ({
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const Tick = ({
  size = 14,
  strokeWidth = 2.25,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const CheckCircle = ({
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m8 12 2.6 2.6L16 9.4" />
  </svg>
);

export const AlertTriangle = ({
  size = 18,
  strokeWidth = 1.9,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="m10.29 3.86-8.18 14A2 2 0 0 0 3.83 21h16.34a2 2 0 0 0 1.72-3.14l-8.18-14a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4.5M12 17.2h.01" />
  </svg>
);

export const Download = ({
  size = 14,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5M12 15V3" />
  </svg>
);

export const FileText = ({
  size = 14,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

export const Share = ({
  size = 14,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

export const RefreshCw = ({
  size = 15,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const CalendarClock = ({
  size = 15,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <path d="M21 9.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <circle cx="18" cy="17" r="4" />
    <path d="M18 15.2V17l1.3.9" />
  </svg>
);

export const PlayCircle = ({
  size = 15,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
}: AdminIconProps) => (
  <svg {...base(size, strokeWidth, color, style)}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m10 8.5 6 3.5-6 3.5z" />
  </svg>
);
