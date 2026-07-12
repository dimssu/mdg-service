import * as React from 'react';

import { colors } from '../theme';

/** Bezel thickness around the screen. */
const BEZEL = 14;

/** The visible app screen (matches SCREEN in theme.ts). */
export const SCREEN_W = 390;
export const SCREEN_H = 844;
export const STATUS_H = 46;

/** Content area available to app screens (below the status bar). */
export const CONTENT_W = SCREEN_W;
export const CONTENT_H = SCREEN_H - STATUS_H;

/** Full device size including the bezel — used by TutorialFrame to scale it. */
export const FRAME_W = SCREEN_W + BEZEL * 2;
export const FRAME_H = SCREEN_H + BEZEL * 2;

function StatusBar() {
  return (
    <div
      style={{
        height: STATUS_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 26px',
        fontSize: 14,
        fontWeight: 600,
        color: colors.text,
        flexShrink: 0,
      }}
    >
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* signal */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          {[6, 9, 12, 15].map((h, i) => (
            <div
              key={i}
              style={{ width: 3, height: h, background: colors.text, borderRadius: 1 }}
            />
          ))}
        </div>
        {/* battery */}
        <div
          style={{
            width: 24,
            height: 12,
            border: `1.5px solid ${colors.text}`,
            borderRadius: 3,
            padding: 1.5,
          }}
        >
          <div style={{ width: '80%', height: '100%', background: colors.text, borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

/**
 * A realistic phone shell. Children are the app screen and render into the
 * content area (CONTENT_W × CONTENT_H) below the status bar.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: FRAME_W,
        height: FRAME_H,
        borderRadius: 58,
        background: '#0b0b0c',
        padding: BEZEL,
        boxShadow: '0 40px 90px rgba(15,23,42,0.28), 0 8px 24px rgba(15,23,42,0.14)',
      }}
    >
      <div
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 46,
          overflow: 'hidden',
          background: colors.bg,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <StatusBar />
        {/* content area — app screens + overlays (cursor, highlight) live here */}
        <div style={{ position: 'relative', width: CONTENT_W, height: CONTENT_H, flex: 1 }}>
          {children}
        </div>
        {/* home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 130,
            height: 5,
            borderRadius: 999,
            background: colors.text,
            opacity: 0.35,
          }}
        />
      </div>
    </div>
  );
}
