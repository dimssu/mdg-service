import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { admin } from './tokens';

/**
 * The DSR sheet — one product's day-by-day ledger, the table the dealer used to
 * keep by hand and the thing the generated report is really about.
 *
 * Mirrors the ledger panel of `mdg-backend/src/services/dsr-report/render.ts`
 * (and the Excel export's DSR sheet): the same columns, in the same order, with
 * the same superscript "M" beside a hand-entered receipt.
 *
 * The numbers are one real outlet's week, kept verbatim so an admin watching
 * recognises their own sheet rather than a made-up one. RECEIPT is the only
 * column here that nobody measures — every other figure comes off a tank dip or
 * a pump totaliser — which is exactly what the tutorial is about.
 */

export interface DsrRow {
  date: string;
  dip: number;
  waterDip: number;
  opening: number;
  receipt: number;
  total: number;
  pump1: number;
  pump2: number;
  testing: number;
  /** `null` on the newest day — a day's sales close only when the NEXT day's reading lands. */
  sales: number | null;
  cumulative: number | null;
  /** True when this row's receipt was entered by hand (draws the "M"). */
  manual?: boolean;
}

/** The day the tutorial corrects: the tanker arrived, IRAS never heard about it. */
export const CORRECTED_DATE = '13-Aug';
/** Litres the tanker actually decanted into TANK -2 that day. */
export const CORRECTED_LITRES = 3933;

const BASE: DsrRow[] = [
  { date: '10-Aug', dip: 66, waterDip: 0, opening: 3336, receipt: 0, total: 3336, pump1: 977902, pump2: 611831, testing: 10, sales: 1233, cumulative: 11506 },
  { date: '11-Aug', dip: 48, waterDip: 0, opening: 2121, receipt: 0, total: 2121, pump1: 978578, pump2: 612399, testing: 10, sales: 1018, cumulative: 12525 },
  { date: '12-Aug', dip: 31, waterDip: 0, opening: 1144, receipt: 0, total: 1144, pump1: 979107, pump2: 612898, testing: 10, sales: 660, cumulative: 13185 },
  { date: '13-Aug', dip: 82, waterDip: 0, opening: 4442, receipt: 0, total: 4442, pump1: 979441, pump2: 613234, testing: 10, sales: 1162, cumulative: 14347 },
  { date: '14-Aug', dip: 66, waterDip: 0, opening: 3297, receipt: 0, total: 3297, pump1: 980176, pump2: 613671, testing: 10, sales: 1160, cumulative: 15508 },
  { date: '15-Aug', dip: 48, waterDip: 0, opening: 2166, receipt: 0, total: 2166, pump1: 980867, pump2: 614151, testing: 10, sales: 1072, cumulative: 16579 },
  { date: '16-Aug', dip: 31, waterDip: 0, opening: 1129, receipt: 0, total: 1129, pump1: 981500, pump2: 614599, testing: 10, sales: null, cumulative: null },
];

/**
 * The sheet before and after the correction.
 *
 * Only two cells move: RECEIPT and TOTAL STOCK on the corrected day. That is the
 * whole point — sales and the running cumulative are a function of meter
 * readings and testing alone, so a receipt can never disturb them, which is why
 * a finalised day is allowed to take this one edit at all.
 */
export function dsrRows(corrected: boolean): DsrRow[] {
  if (!corrected) return BASE;
  return BASE.map((r) =>
    r.date === CORRECTED_DATE
      ? {
          ...r,
          receipt: CORRECTED_LITRES,
          total: r.opening + CORRECTED_LITRES,
          manual: true,
        }
      : r,
  );
}

const COLUMNS = [
  'DATE',
  'DIP',
  'WATER DIP',
  'OPENING STOCK',
  'RECEIPT',
  'TOTAL STOCK',
  'PUMP 1',
  'PUMP 2',
  'TESTING',
  'SALES',
  'CUMULATIVE',
  'REMARKS',
] as const;

/** Which column the scene is talking about — tinted down the whole table. */
export type DsrColumn = (typeof COLUMNS)[number];

function num(n: number | null): string {
  return n === null ? '' : String(n);
}

export interface DsrLedgerProps {
  rows: DsrRow[];
  /** Tint one column so the eye lands on it without a separate callout. */
  emphasise?: DsrColumn;
  /** Ring one row (by date). Used for the day being corrected. */
  focusDate?: string;
  /** Base font size; the diagram scenes render this much larger than the portal. */
  fontSize?: number;
  title?: string;
  titleHi?: string;
  tankLabel?: string;
}

export function DsrLedger({
  rows,
  emphasise,
  focusDate,
  fontSize = 12,
  title = 'MOTOR SPIRIT',
  titleHi = 'मोटर स्पिरीट',
  tankLabel = 'TANK -2',
}: DsrLedgerProps) {
  const cell: React.CSSProperties = {
    border: `1px solid ${admin.border}`,
    padding: `${Math.round(fontSize * 0.5)}px ${Math.round(fontSize * 0.62)}px`,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ fontFamily: FONT_FAMILY, color: admin.text }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: Math.round(fontSize * 0.7),
        }}
      >
        <span style={{ fontSize: fontSize * 1.4, fontWeight: 700 }}>{titleHi}</span>
        <span style={{ fontSize: fontSize * 1.4, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: fontSize * 1.05, fontWeight: 600, color: admin.textSubtle }}>
          {tankLabel}
        </span>
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize,
          background: admin.surface,
        }}
      >
        <thead>
          <tr>
            {COLUMNS.map((c) => {
              const hot = c === emphasise;
              return (
                <th
                  key={c}
                  style={{
                    ...cell,
                    textAlign: c === 'DATE' ? 'left' : 'right',
                    background: hot ? admin.brandSoft : admin.surface2,
                    color: hot ? admin.brand : admin.textMuted,
                    fontSize: fontSize * 0.82,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                  }}
                >
                  {c}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const focused = r.date === focusDate;
            const tint = (c: DsrColumn): React.CSSProperties =>
              c === emphasise ? { background: admin.brandSoft, fontWeight: 700 } : {};
            return (
              <tr
                key={r.date}
                style={{
                  outline: focused ? `2.5px solid ${admin.brand}` : undefined,
                  outlineOffset: -1,
                }}
              >
                <td style={{ ...cell, textAlign: 'left', fontWeight: 600, ...tint('DATE') }}>
                  {r.date}
                </td>
                <td style={{ ...cell, ...tint('DIP') }}>{r.dip}</td>
                <td style={{ ...cell, ...tint('WATER DIP') }}>{r.waterDip}</td>
                <td style={{ ...cell, ...tint('OPENING STOCK') }}>{r.opening}</td>
                <td style={{ ...cell, ...tint('RECEIPT') }}>
                  {r.receipt}
                  {r.manual ? (
                    <sup
                      style={{
                        color: admin.brand,
                        fontWeight: 800,
                        fontSize: fontSize * 0.7,
                        marginLeft: 2,
                      }}
                    >
                      M
                    </sup>
                  ) : null}
                </td>
                <td style={{ ...cell, ...tint('TOTAL STOCK') }}>{r.total}</td>
                <td style={{ ...cell, ...tint('PUMP 1') }}>{r.pump1}</td>
                <td style={{ ...cell, ...tint('PUMP 2') }}>{r.pump2}</td>
                <td style={{ ...cell, ...tint('TESTING') }}>{r.testing}</td>
                <td style={{ ...cell, ...tint('SALES') }}>{num(r.sales)}</td>
                <td style={{ ...cell, ...tint('CUMULATIVE') }}>{num(r.cumulative)}</td>
                <td style={{ ...cell, ...tint('REMARKS') }}>0</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.some((r) => r.manual) ? (
        <div style={{ marginTop: 6, fontSize: fontSize * 0.85, color: admin.textSubtle }}>
          <sup style={{ color: admin.brand, fontWeight: 800 }}>M</sup> receipt entered manually.
        </div>
      ) : null}
    </div>
  );
}
