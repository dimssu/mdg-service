import * as React from 'react';

import { colors } from '../theme';

/**
 * A desktop browser chrome for the admin walkthroughs — the landscape twin of
 * `PhoneFrame`. Admins use the portal in a browser, so the tutorial has to look
 * like a browser: without the window chrome and the URL, a mocked screen reads
 * as an illustration rather than "this is what you will see".
 *
 * The content area is a fixed logical size so every mocked admin screen can be
 * laid out against known pixels and scaled once by the caller.
 */
export const BROWSER_CONTENT = { width: 1440, height: 620 } as const;
const TITLEBAR_H = 52;
export const BROWSER_FRAME = {
  width: BROWSER_CONTENT.width,
  height: BROWSER_CONTENT.height + TITLEBAR_H,
} as const;

function Dot({ color }: { color: string }) {
  return <div style={{ width: 13, height: 13, borderRadius: 999, background: color }} />;
}

export function BrowserFrame({
  url = 'admin.mdgservices.in/dealers',
  children,
  scale = 1,
}: {
  url?: string;
  children: React.ReactNode;
  scale?: number;
}) {
  return (
    <div
      style={{
        width: BROWSER_FRAME.width,
        height: BROWSER_FRAME.height,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        borderRadius: 16,
        overflow: 'hidden',
        background: colors.surface,
        border: `1px solid ${colors.borderStrong}`,
        boxShadow: '0 30px 70px rgba(15,23,42,0.16)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: TITLEBAR_H,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 18px',
          background: colors.surface2,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <Dot color="#f87171" />
          <Dot color="#fbbf24" />
          <Dot color="#4ade80" />
        </div>
        <div
          style={{
            flex: 1,
            height: 30,
            borderRadius: 999,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontSize: 16,
            color: colors.textMuted,
            fontWeight: 500,
          }}
        >
          {url}
        </div>
      </div>
      <div
        style={{
          width: BROWSER_CONTENT.width,
          height: BROWSER_CONTENT.height,
          position: 'relative',
          overflow: 'hidden',
          background: colors.bg,
        }}
      >
        {children}
      </div>
    </div>
  );
}
