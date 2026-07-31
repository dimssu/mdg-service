import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { AlertTriangle } from './icons';
import { admin } from './tokens';
import { AdminBadge, AdminCard } from './ui';

/**
 * What a plain admin sees on the Run history tab when a capture fails: the run
 * row, then one plain-language sentence for what went wrong and one for what to
 * do about it. No stack traces, no failure screenshot — those are super-admin
 * only (`CreditDodFailurePanel.tsx`), and the whole point of the copy in
 * `mdg-admin/src/lib/creditDodFailure.ts` is that the admin can act without them.
 */
export interface RunFailureProps {
  /** What went wrong, in one sentence. */
  title?: string;
  /** What to do next. */
  hint?: string;
  /** When the run failed — the row above the notice. */
  at?: string;
}

export function RunFailure({
  title = 'Wrong username or password',
  hint = "Update the dealer's SDMS credentials on the Info tab, then run again.",
  at = '30 Jul 2026, 10:12 AM',
}: RunFailureProps) {
  return (
    <AdminCard style={{ fontFamily: FONT_FAMILY, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: `1px solid ${admin.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>Credit &amp; DOD monitoring</div>
          <div style={{ fontSize: 13, color: admin.textMuted, marginTop: 2 }}>
            Started {at} · took 41s
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <AdminBadge intent="danger">FAILED</AdminBadge>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: 14,
            borderRadius: 8,
            border: `1px solid ${admin.danger}`,
            background: admin.dangerSoft,
          }}
        >
          <AlertTriangle size={18} color={admin.danger} style={{ marginTop: 1, flex: 'none' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: admin.danger }}>{title}</div>
            <div style={{ fontSize: 14, color: admin.text, marginTop: 5 }}>{hint}</div>
          </div>
        </div>
      </div>
    </AdminCard>
  );
}
