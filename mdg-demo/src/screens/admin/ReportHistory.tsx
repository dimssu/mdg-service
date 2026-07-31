import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { CheckCircle, ChevronDown, ChevronRight } from './icons';
import { admin, SAMPLE } from './tokens';
import { AdminBadge, AdminCard } from './ui';

/**
 * Report history — the sheet an admin actually works from. Opening a row
 * reveals the whole report (the video injects `ReportDetail` as `children`), so
 * generate → review → share never leaves this one card.
 *
 * Mirrors `SnapshotHistoryCard` in
 * `mdg-admin/src/pages/dealers/DealerCreditDodTab.tsx` (desktop table variant).
 */

export interface ReportHistoryRow {
  id: string;
  capturedAt: string;
  /** Set on a back-dated report — renders the "As of …" badge. */
  asOf?: string;
  dueAmount: string;
  dueDate: string;
  state: 'due' | 'advance' | 'clear';
  reconciles: boolean;
  shared: boolean;
}

/** Three plausible days of reports for the sample dealer, newest first. */
export const SAMPLE_REPORT_ROWS: ReportHistoryRow[] = [
  {
    id: 'r1',
    capturedAt: SAMPLE.capturedAt,
    dueAmount: SAMPLE.dueAmount,
    dueDate: SAMPLE.dueDate,
    state: 'due',
    reconciles: true,
    shared: false,
  },
  {
    id: 'r2',
    capturedAt: '29 Jul 2026, 6:05 AM',
    dueAmount: '₹7,41,208.40',
    dueDate: '15-07-2026',
    state: 'due',
    reconciles: true,
    shared: true,
  },
  {
    id: 'r3',
    capturedAt: '28 Jul 2026, 6:05 AM',
    dueAmount: '₹6,18,442.00',
    dueDate: '14-07-2026',
    state: 'due',
    reconciles: true,
    shared: true,
  },
];

const GRID = '34px 1fr 160px 126px 96px 104px 126px';
const STATE_INTENT = {
  due: 'warning',
  advance: 'success',
  clear: 'neutral',
} as const;

function HeadCell({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: admin.textSubtle,
        textAlign: align,
      }}
    >
      {children}
    </div>
  );
}

export interface ReportHistoryProps {
  /** Open the newest row and show `children` beneath it. */
  expanded?: boolean;
  /** Flip the newest row's Shared cell — the state after the share confirm. */
  shared?: boolean;
  rows?: ReportHistoryRow[];
  /** The expanded body — the video passes `<ReportDetail />`. */
  children?: React.ReactNode;
}

export function ReportHistory({
  expanded,
  shared,
  rows = SAMPLE_REPORT_ROWS,
  children,
}: ReportHistoryProps) {
  const resolved = rows.map((r, i) =>
    i === 0 && shared !== undefined ? { ...r, shared } : r,
  );
  const unshared = resolved.filter((r) => !r.shared).length;

  return (
    <AdminCard style={{ fontFamily: FONT_FAMILY, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '10px 16px',
          borderBottom: `1px solid ${admin.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Report history</div>
          <div style={{ fontSize: 13.5, color: admin.textMuted, marginTop: 2 }}>
            Open a row to review the card and share it with the dealer.
          </div>
        </div>
        {unshared > 0 ? (
          <div style={{ marginLeft: 'auto' }}>
            <AdminBadge intent="info">
              {unshared} not shared yet
            </AdminBadge>
          </div>
        ) : null}
      </div>

      {/* table head */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          alignItems: 'center',
          gap: 10,
          padding: '7px 16px',
          background: admin.surface2,
          borderBottom: `1px solid ${admin.border}`,
        }}
      >
        <HeadCell />
        <HeadCell>Captured at</HeadCell>
        <HeadCell align="right">Due amount</HeadCell>
        <HeadCell>Due date</HeadCell>
        <HeadCell>State</HeadCell>
        <HeadCell>Reconciles</HeadCell>
        <HeadCell>Shared</HeadCell>
      </div>

      {resolved.map((row, i) => {
        const isOpen = !!expanded && i === 0;
        return (
          <React.Fragment key={row.id}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                alignItems: 'center',
                gap: 10,
                padding: '7px 16px',
                borderBottom: `1px solid ${admin.border}`,
                background: isOpen ? admin.surface2 : admin.surface,
                fontSize: 13.5,
              }}
            >
              <div style={{ color: admin.textMuted, display: 'flex' }}>
                {isOpen ? (
                  <ChevronDown size={16} color={admin.textMuted} />
                ) : (
                  <ChevronRight size={16} color={admin.textMuted} />
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: admin.textMuted,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{row.capturedAt}</span>
                {row.asOf ? <AdminBadge intent="info">As of {row.asOf}</AdminBadge> : null}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 600 }}>{row.dueAmount}</div>
              <div style={{ color: admin.textMuted }}>{row.dueDate}</div>
              <div>
                <AdminBadge intent={STATE_INTENT[row.state]}>{row.state}</AdminBadge>
              </div>
              <div style={{ display: 'flex' }}>
                <CheckCircle
                  size={16}
                  color={row.reconciles ? admin.success : admin.danger}
                />
              </div>
              <div style={{ display: 'flex' }}>
                {row.shared ? (
                  <CheckCircle size={16} color={admin.success} />
                ) : (
                  <AdminBadge intent="info">Not shared</AdminBadge>
                )}
              </div>
            </div>

            {isOpen ? (
              <div
                style={{
                  padding: 14,
                  background: admin.surface2,
                  borderBottom: `1px solid ${admin.border}`,
                }}
              >
                {children}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </AdminCard>
  );
}
