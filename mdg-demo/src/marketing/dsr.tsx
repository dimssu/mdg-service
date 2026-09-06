import * as React from 'react';

import { brand, FONT_SANS, SHADOW_LIFT } from './brand';
import { fade } from './kit';

/**
 * The DSR register, drawn twice: the picture the dealer receives, and the book
 * he copies it into.
 *
 * This is the emotional centre of the film, so the two must be recognisably the
 * SAME TABLE. The columns are the real ones from the card a dealer already gets
 * every morning (`mdg-backend/src/services/dsr-report/cards.ts`) — DATE,
 * OPENING STOCK, RECEIPT, TOTAL STOCK, the metre readings, TESTING, SALES,
 * CUMULATIVE SALES — trimmed to what stays legible at phone size. A dealer
 * should look at this and think "that is my register", not "that is a diagram
 * of my register".
 *
 * The figures are illustrative and internally consistent:
 *   opening 12,480 + receipt 6,000 = total 18,480
 *   18,480 − closing 14,246 = 4,234 sold, of which 12 L is testing → 4,222 net.
 * They are not any real outlet's numbers, and no outlet code appears anywhere.
 */

export const DSR_COLUMNS = [
  { key: 'date', label: 'DATE', sub: 'दिनांक', w: 78, align: 'left' as const },
  { key: 'opening', label: 'OPENING', sub: 'STOCK', w: 82, align: 'right' as const },
  { key: 'receipt', label: 'RECEIPT', w: 74, align: 'right' as const },
  { key: 'total', label: 'TOTAL', sub: 'STOCK', w: 78, align: 'right' as const },
  { key: 'dip', label: 'DIP', w: 62, align: 'right' as const },
  { key: 'stock', label: 'STOCK', sub: 'IN TANK', w: 78, align: 'right' as const },
  { key: 'testing', label: 'TESTING', w: 66, align: 'right' as const },
  { key: 'sales', label: 'SALES', w: 78, align: 'right' as const },
];

export interface DsrRow {
  date: string;
  opening: string;
  receipt: string;
  total: string;
  dip: string;
  stock: string;
  testing: string;
  sales: string;
}

export const DSR_ROWS: DsrRow[] = [
  {
    date: '19-08',
    opening: '9,120',
    receipt: '9,000',
    total: '18,120',
    dip: '141',
    stock: '12,480',
    testing: '10',
    sales: '5,630',
  },
  {
    date: '20-08',
    opening: '12,480',
    receipt: '6,000',
    total: '18,480',
    dip: '160',
    stock: '14,246',
    testing: '12',
    sales: '4,222',
  },
];

const TABLE_W = DSR_COLUMNS.reduce((a, c) => a + c.w, 0);

/**
 * Fixed row heights.
 *
 * They are pinned rather than left to the content because the table is drawn at
 * a `scale()`, and a transform does not resize the layout box — the wrapper has
 * to know the table's height in advance or a scaled table overlaps whatever sits
 * below it. Pinning also keeps the picture and the register exactly the same
 * height, which is the one thing this drawing must never get wrong.
 */
const HEAD_H = 52;
const ROW_H = 46;

/**
 * The table itself.
 *
 * `revealRows` fades the data in row by row so the register can be shown filling
 * itself; pass a large number to show the finished sheet. `tone` swaps the
 * header colour: navy for the picture that arrives, gold for the register page
 * it is copied into, which is the only visual difference between the two — the
 * columns and the figures are deliberately identical.
 */
export function DsrTable({
  tone = 'navy',
  rows = DSR_ROWS,
  revealRows = 99,
  local = 999,
  scale = 1,
}: {
  tone?: 'navy' | 'gold';
  rows?: DsrRow[];
  revealRows?: number;
  local?: number;
  scale?: number;
}) {
  const head = tone === 'navy' ? brand.navy700 : brand.gold600;
  const figure = tone === 'navy' ? brand.ink : brand.gold600;
  const tableH = HEAD_H + rows.length * ROW_H;

  return (
    <div style={{ width: TABLE_W * scale, height: tableH * scale }}>
      <div
        style={{
          width: TABLE_W,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontFamily: FONT_SANS,
        }}
      >
        <div
          style={{
            display: 'flex',
            height: HEAD_H,
            background: head,
            borderRadius: '10px 10px 0 0',
          }}
        >
          {DSR_COLUMNS.map((c) => (
            <div
              key={c.key}
              style={{
                width: c.w,
                padding: '9px 7px',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.08,
                textAlign: c.align,
              }}
            >
              {c.label}
              {c.sub ? (
                <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.78 }}>{c.sub}</div>
              ) : null}
            </div>
          ))}
        </div>

        {rows.map((r, i) => {
          /* Each row fades in 9 frames after the one above it, so the sheet
             writes itself top-down at reading speed rather than appearing whole. */
          const shown = i < revealRows ? fade(local, i * 9, i * 9 + 11) : 0;
          return (
            <div
              key={r.date}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: ROW_H,
                background: i % 2 ? brand.paperWarm : '#FFFFFF',
                borderBottom: `1px solid ${brand.hairline}`,
              }}
            >
              {DSR_COLUMNS.map((c) => (
                <div
                  key={c.key}
                  style={{
                    width: c.w,
                    padding: '0 7px',
                    fontSize: 18,
                    fontWeight: c.key === 'date' ? 600 : 500,
                    color: c.key === 'date' ? brand.inkMuted : figure,
                    textAlign: c.align,
                    fontVariantNumeric: 'tabular-nums',
                    opacity: shown,
                  }}
                >
                  {r[c.key as keyof DsrRow]}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The picture as it arrives — a chat bubble carrying the sheet.
 *
 * Drawn as a generic message card rather than any particular messaging app's
 * chrome: the same picture reaches the dealer in the app and on WhatsApp, and
 * putting one company's green bubble on screen would both narrow the claim and
 * borrow someone else's brand.
 */
export function ArrivingSheet({ local, lang }: { local: number; lang: 'hi' | 'en' }) {
  const inFrame = fade(local, 0, 12);
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 28,
        padding: 30,
        boxShadow: SHADOW_LIFT,
        opacity: inFrame,
        transform: `translateY(${(1 - inFrame) * 22}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 22,
          fontFamily: FONT_SANS,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: brand.ok,
            flexShrink: 0,
          }}
        />
        <div style={{ fontSize: 28, fontWeight: 700, color: brand.ink }}>DAILY SALES REPORT</div>
      </div>
      <DsrTable tone="navy" local={local} revealRows={99} scale={1.38} />

      {/* The claim the sheet is making, said once underneath it. The narration
          for this beat describes the picture's FORMAT; this strip carries the
          other half — that it arrives already worked out — so the payoff is
          complete for a viewer watching with the sound off. */}
      <div
        style={{
          marginTop: 26,
          borderRadius: 18,
          background: brand.gold400,
          color: brand.navy950,
          textAlign: 'center',
          padding: '20px 24px',
          fontSize: 36,
          fontWeight: 700,
          opacity: fade(local, 22, 38),
        }}
      >
        {lang === 'hi' ? 'पहले से भरा हुआ' : 'Already filled in'}
      </div>
    </div>
  );
}
