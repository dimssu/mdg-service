import * as React from 'react';

import type { CardData } from '../lib/creditCard';
import { FONT_FAMILY } from '../theme';

/**
 * A clean, animated recreation of the daily "CREDIT & DOD MONITORING" card the
 * dealer receives — the same three-column layout (English label · value · Hindi
 * meaning) inside the MDG "Dealer's कवच" brand frame. `activeKey` rings one row
 * and dims the rest so the video can point at exactly the field being narrated.
 */

export const CARD = {
  width: 960,
  brandH: 44,
  headerH: 132,
  rowH: 128,
  labelW: 300,
  valueW: 300,
} as const;

/** Brand / document palette (warmer than the app theme, to read as a printout). */
const c = {
  maroon: '#7f1d1d',
  maroonSoft: '#fef2f2',
  red: '#b91c1c',
  gold: '#f59e0b',
  goldSoft: '#fffaf0',
  cream: '#fffdf5',
  ink: '#1c1917',
  grid: '#e7d9bf',
  frame: '#7f1d1d',
} as const;

function BrandBand({ top }: { top?: boolean }) {
  const marks = Array.from({ length: 6 });
  return (
    <div
      style={{
        height: CARD.brandH,
        background: `linear-gradient(90deg, ${c.gold}, #fbbf24 50%, ${c.gold})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        overflow: 'hidden',
        borderTop: top ? undefined : `2px solid ${c.maroon}`,
        borderBottom: top ? `2px solid ${c.maroon}` : undefined,
      }}
    >
      {marks.map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: c.maroon,
            whiteSpace: 'nowrap',
            letterSpacing: '0.01em',
          }}
        >
          #Dealer&apos;s कवच · @MDG Services#
        </span>
      ))}
    </div>
  );
}

function Header({ code }: { code: string }) {
  return (
    <div
      style={{
        height: CARD.headerH,
        background: `linear-gradient(180deg, ${c.maroon}, #991b1b)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 28px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 24,
          width: 74,
          height: 74,
          borderRadius: 16,
          background: '#ffffff',
          color: c.maroon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        }}
      >
        MDG
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 46,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '0.01em',
            lineHeight: 1.05,
          }}
        >
          CREDIT &amp; DOD MONITORING
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: c.gold, marginTop: 4 }}>
          रोज़ का उधार-हिसाब
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 24,
          background: c.gold,
          color: c.maroon,
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        {code}
      </div>
    </div>
  );
}

/** The pulsing ring drawn over the active row. */
function RowRing({ top, local }: { top: number; local: number }) {
  const pulse = (Math.sin(local / 7) + 1) / 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: -6,
        top: top - 6,
        width: CARD.width + 12,
        height: CARD.rowH + 12,
        borderRadius: 16,
        border: `4px solid ${c.gold}`,
        boxShadow: `0 0 0 ${3 + pulse * 9}px rgba(245,158,11,${0.1 + pulse * 0.16})`,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    />
  );
}

export function CreditCard({
  data,
  activeKey,
  local,
  scale = 1,
}: {
  data: CardData;
  activeKey: string | null;
  local: number;
  scale?: number;
}) {
  const activeIndex = activeKey ? data.rows.findIndex((r) => r.key === activeKey) : -1;
  const ringTop = CARD.brandH + CARD.headerH + Math.max(0, activeIndex) * CARD.rowH;

  return (
    <div
      style={{
        width: CARD.width,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        background: c.cream,
        border: `6px solid ${c.frame}`,
        boxShadow: '0 24px 60px rgba(24,24,27,0.18)',
        fontFamily: FONT_FAMILY,
      }}
    >
      <BrandBand top />
      <Header code={data.code} />

      {data.rows.map((row, i) => {
        const dim = activeIndex >= 0 && i !== activeIndex;
        const isEmpty = row.value.trim() === '';
        return (
          <div
            key={row.key}
            style={{
              display: 'flex',
              height: CARD.rowH,
              borderTop: i === 0 ? undefined : `1.5px solid ${c.grid}`,
              opacity: dim ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Label */}
            <div
              style={{
                width: CARD.labelW,
                background: c.maroonSoft,
                borderRight: `1.5px solid ${c.grid}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                fontSize: 27,
                fontWeight: 800,
                color: c.maroon,
                letterSpacing: '0.01em',
              }}
            >
              {row.label}
            </div>
            {/* Value */}
            <div
              style={{
                width: CARD.valueW,
                borderRight: `1.5px solid ${c.grid}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '0 22px',
                fontSize: 38,
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                color: row.credit ? c.red : c.ink,
              }}
            >
              {isEmpty ? <span style={{ color: '#d6d3d1' }}>—</span> : row.value}
            </div>
            {/* Hindi meaning */}
            <div
              style={{
                flex: 1,
                background: c.goldSoft,
                display: 'flex',
                alignItems: 'center',
                padding: '0 22px',
                fontSize: 25,
                fontWeight: 600,
                lineHeight: 1.25,
                color: c.maroon,
              }}
            >
              {row.hindi}
            </div>
          </div>
        );
      })}

      <BrandBand />

      {activeIndex >= 0 ? <RowRing top={ringTop} local={local} /> : null}
    </div>
  );
}
