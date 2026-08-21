import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { Database, FileText, Pencil } from './icons';
import { RingOverlay } from './Ring';
import { admin } from './tokens';
import { AdminBadge, AdminButton, AdminCard } from './ui';

/**
 * The shift-data editor as an outlet with NO portal automation sees it.
 *
 * 16E is the case these mock the: onboarded without an IndianOil account, its
 * DSR kept in a macro workbook. The real screen offers "Collect this day" as its
 * only action when a day is empty — a guaranteed dead end for such a dealer — so
 * the thing worth teaching is the door that replaces it, and the three tables
 * behind it that have to be filled in from the dealer's own sheet.
 *
 * Every export is pure and props-driven, as the rest of `screens/admin` is: the
 * video owns the timeline, these own the pixels.
 */

/* ─────────────────────────────── the vault rail ─────────────────────────── */

const VAULT_ITEMS = ['IRAS Shift Data', 'Daily Sales Report', 'Inspection Reports'] as const;
type VaultItem = (typeof VAULT_ITEMS)[number];

/** The Data Vault's dataset strip, with one item active. */
export function VaultRail({
  active = 'IRAS Shift Data',
  ringOn,
  local,
}: {
  active?: VaultItem;
  /** Pulse the ring around this item, to point at where to click next. */
  ringOn?: VaultItem;
  local?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        paddingBottom: 8,
        borderBottom: `1px solid ${admin.border}`,
        fontFamily: FONT_FAMILY,
      }}
    >
      {VAULT_ITEMS.map((d) => {
        const on = d === active;
        const pill = (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 36,
              padding: '0 12px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              background: on ? admin.brandSoft : 'transparent',
              color: on ? admin.brand : admin.textMuted,
            }}
          >
            {d === 'Daily Sales Report' ? (
              <FileText size={16} color={on ? admin.brand : admin.textMuted} />
            ) : (
              <Database size={16} color={on ? admin.brand : admin.textMuted} />
            )}
            {d}
          </div>
        );
        return ringOn === d && local !== undefined ? (
          <div key={d} style={{ position: 'relative' }}>
            {pill}
            <RingOverlay local={local} radius={10} />
          </div>
        ) : (
          <React.Fragment key={d}>{pill}</React.Fragment>
        );
      })}
    </div>
  );
}

/* ────────────────────────────── the empty day ───────────────────────────── */

/**
 * A day with nothing in it.
 *
 * `canCollect` is the whole point of this screen. For a dealer whose portal
 * collection is running, the empty state offers to collect; for one with no
 * portal account it must not, because that button cannot finish — so the only
 * way in is to open the day and type it.
 */
export function EmptyDay({
  canCollect = false,
  ringLocal,
  pressed,
}: {
  canCollect?: boolean;
  ringLocal?: number;
  pressed?: boolean;
}) {
  return (
    <AdminCard style={{ padding: 0 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          padding: '54px 40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 56,
            height: 56,
            borderRadius: 14,
            background: admin.surface2,
          }}
        >
          <Database size={26} color={admin.textSubtle} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: admin.text }}>
          {canCollect
            ? 'Nothing has been collected for this day'
            : 'This outlet’s figures are entered by hand'}
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: admin.textMuted,
            maxWidth: 640,
          }}
        >
          {canCollect
            ? 'There are no portal rows to correct yet. Collect the day first — it takes about a minute.'
            : 'This dealer has no portal collection running, so nothing will arrive on its own. Open the day and type the shift in: the meter readings, each tank’s dip and stock, and any tanker that came.'}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {canCollect ? <AdminButton variant="secondary">Collect this day</AdminButton> : null}
          <div style={{ position: 'relative' }}>
            <AdminButton
              variant={canCollect ? 'secondary' : 'primary'}
              pressed={pressed}
              leftIcon={<Pencil size={15} color={canCollect ? admin.text : admin.textInverse} />}
            >
              Start this day by hand
            </AdminButton>
            {ringLocal !== undefined ? <RingOverlay local={ringLocal} radius={10} /> : null}
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

/* ──────────────────────────────── the tables ────────────────────────────── */

export type GridCode = 'TOT' | 'STK' | 'REC';

interface GridSpec {
  code: GridCode;
  title: string;
  addLabel: string;
  columns: string[];
  /** Rows as they appear once typed, in the order they are added. */
  rows: string[][];
}

/**
 * One shift at a two-tank outlet, as it would be typed in.
 *
 * The numbers are 16E's own: diesel in tank 3 on nozzles 2, 4 and 5; petrol in
 * tank 1 on nozzles 1, 3 and 6. Using the real layout keeps the video honest for
 * the one dealer it exists for.
 */
export const MANUAL_GRIDS: Record<GridCode, GridSpec> = {
  TOT: {
    code: 'TOT',
    title: 'Totaliser readings',
    addLabel: 'Add nozzle reading',
    columns: ['NOZZLE_NO', 'TOT_READING', 'TANK_NO', 'PRODCODE'],
    rows: [
      ['2', '150305', '3', 'HS'],
      ['4', '157076', '3', 'HS'],
      ['5', '13205.45', '3', 'HS'],
      ['1', '46697', '1', 'MS'],
      ['3', '42409', '1', 'MS'],
      ['6', '2638.46', '1', 'MS'],
    ],
  },
  STK: {
    code: 'STK',
    title: 'Tank stock',
    addLabel: 'Add tank stock row',
    columns: ['TANK_NO', 'PRODUCT_DIP', 'WATER_DIP', 'NET_QTY', 'PRODCODE'],
    rows: [
      ['3', '828', '0', '7917', 'HS'],
      ['1', '334', '0', '2223', 'MS'],
    ],
  },
  REC: {
    code: 'REC',
    title: 'Deliveries',
    addLabel: 'Add delivery',
    columns: ['TANK_NO', 'INVOICE_QUANTITY', 'PRODCODE'],
    rows: [['3', '12000', 'HS']],
  },
};

/**
 * One report's table. `filled` is how many rows have been typed so far, so a
 * scene can fill them in one at a time rather than cutting to a finished table.
 */
export function ManualGrid({
  code,
  filled,
  dim,
  ringLocal,
  addPressed,
}: {
  code: GridCode;
  filled: number;
  /** Greyed back, for the tables the current scene is not talking about. */
  dim?: boolean;
  ringLocal?: number;
  addPressed?: boolean;
}) {
  const spec = MANUAL_GRIDS[code];
  const shown = spec.rows.slice(0, Math.max(0, filled));
  return (
    <AdminCard style={{ padding: 11, opacity: dim ? 0.42 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: admin.text }}>{spec.title}</div>
        <AdminBadge intent={shown.length ? 'info' : 'neutral'}>
          {shown.length ? `${shown.length} row${shown.length === 1 ? '' : 's'}` : 'empty'}
        </AdminBadge>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <AdminButton size="sm" variant="secondary" pressed={addPressed}>
            {spec.addLabel}
          </AdminButton>
          {ringLocal !== undefined ? <RingOverlay local={ringLocal} radius={8} /> : null}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 3 }}>
        <Row cells={spec.columns} head />
        {shown.length === 0 ? (
          <div
            style={{
              padding: '11px 10px',
              textAlign: 'center',
              fontSize: 13.5,
              color: admin.textSubtle,
              border: `1px dashed ${admin.borderStrong}`,
              borderRadius: 8,
            }}
          >
            No rows yet
          </div>
        ) : (
          shown.map((r, i) => <Row key={i} cells={r} fresh={i === shown.length - 1} />)
        )}
      </div>
    </AdminCard>
  );
}

function Row({ cells, head, fresh }: { cells: string[]; head?: boolean; fresh?: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        gap: 4,
      }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            padding: '5px 9px',
            borderRadius: 6,
            fontSize: head ? 11 : 13.5,
            fontWeight: head ? 700 : 600,
            letterSpacing: head ? 0.3 : 0,
            textAlign: i === 0 ? 'left' : 'right',
            color: head ? admin.textSubtle : admin.text,
            background: head ? admin.surface2 : fresh ? admin.infoSoft : admin.surface,
            border: head ? '1px solid transparent' : `1px solid ${admin.border}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

/** All three tables, with a per-code fill count. */
export function ManualDayGrids({
  filled,
  focus,
  ringLocal,
  addPressed,
}: {
  filled: Record<GridCode, number>;
  /** Which table the scene is about; the others fade back. */
  focus?: GridCode;
  ringLocal?: number;
  addPressed?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gap: 9, fontFamily: FONT_FAMILY }}>
      {(['TOT', 'STK', 'REC'] as const).map((code) => (
        <ManualGrid
          key={code}
          code={code}
          filled={filled[code]}
          dim={focus !== undefined && focus !== code}
          ringLocal={focus === code ? ringLocal : undefined}
          addPressed={focus === code ? addPressed : undefined}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── review and apply ───────────────────────────── */

/** The confirm dialog: every pending row at once, plus the reason box. */
export function ReviewDialog({ pressed }: { pressed?: boolean }) {
  const counts: Array<[string, number]> = [
    ['Totaliser readings', MANUAL_GRIDS.TOT.rows.length],
    ['Tank stock', MANUAL_GRIDS.STK.rows.length],
    ['Deliveries', MANUAL_GRIDS.REC.rows.length],
  ];
  return (
    <AdminCard style={{ width: 680, padding: 20, fontFamily: FONT_FAMILY }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: admin.text }}>
        Review these changes
      </div>
      <div style={{ marginTop: 4, fontSize: 14, color: admin.textMuted }}>
        9 rows will be added to 2026-08-20.
      </div>

      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        {counts.map(([label, n]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: admin.surface2,
            }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 600, color: admin.text }}>{label}</div>
            <div style={{ flex: 1 }} />
            <AdminBadge intent="info">{`+${n}`}</AdminBadge>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: admin.textSubtle, marginBottom: 6 }}>
          REASON
        </div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${admin.borderStrong}`,
            fontSize: 14.5,
            color: admin.text,
            background: admin.surface,
          }}
        >
          Entered from the dealer’s own sheet
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
        <AdminButton variant="secondary">Cancel</AdminButton>
        <AdminButton pressed={pressed}>Apply</AdminButton>
      </div>
    </AdminCard>
  );
}
