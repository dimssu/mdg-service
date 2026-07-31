import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { CalendarClock, PlayCircle, RefreshCw } from './icons';
import { admin } from './tokens';
import { AdminButton, AdminCard, AdminInput } from './ui';

/**
 * The generate controls at the top of the Credit & DOD tab: the mode tabs
 * (today's incremental run vs a back-dated reconstruction), the primary action,
 * and the footer strip that carries the "never sent automatically" promise and
 * the per-hour quota.
 *
 * Mirrors `GenerateCard` in `mdg-admin/src/pages/dealers/DealerCreditDodTab.tsx`.
 */

export type GenerateMode = 'today' | 'backdated';

export interface GenerateCardProps {
  /** Which segmented tab is selected. */
  mode: GenerateMode;
  /** A run is in flight — the button reads "Generating…" and the footer changes. */
  busy?: boolean;
  /** Right-hand footer text, e.g. "2 of 3 generations left this hour". */
  quota?: string;
  /** The primary button drawn mid-click. */
  pressed?: boolean;
  /** The As-of date field's value, in the `dd-mm-yyyy` the input displays. */
  asOfDate?: string;
  /** Ring the As-of field as focused (the video types into it). */
  dateFocused?: boolean;
}

function ModeTab({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 32,
        padding: '0 12px',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 500,
        background: active ? admin.surface : 'transparent',
        color: active ? admin.text : admin.textMuted,
        boxShadow: active ? '0 1px 2px rgba(15,23,42,0.06)' : undefined,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

export function GenerateCard({
  mode,
  busy,
  quota = '2 of 3 generations left this hour',
  pressed,
  asOfDate = '',
  dateFocused,
}: GenerateCardProps) {
  const today = mode === 'today';
  return (
    <AdminCard style={{ fontFamily: FONT_FAMILY }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: admin.text }}>
              Generate a Credit &amp; DOD report
            </div>
            <div style={{ fontSize: 13.5, color: admin.textMuted, marginTop: 4 }}>
              Each report is a live login to the dealer&apos;s IndianOil SDMS account, so it takes
              about a minute.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', flex: 'none' }}>
            <AdminButton
              variant="secondary"
              size="sm"
              leftIcon={<PlayCircle size={15} color={admin.text} />}
            >
              How this works
            </AdminButton>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            gap: 4,
            padding: 4,
            borderRadius: 8,
            background: admin.surface2,
          }}
        >
          <ModeTab
            active={today}
            label="Today"
            icon={<RefreshCw size={15} color={today ? admin.text : admin.textMuted} />}
          />
          <ModeTab
            active={!today}
            label="Past date"
            icon={<CalendarClock size={15} color={!today ? admin.text : admin.textMuted} />}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ maxWidth: 470, fontSize: 13.5, color: admin.textMuted }}>
            {today
              ? 'Pulls everything new from the portal, updates the maintained ledger, and produces today’s card.'
              : 'Reconstruct the card as of any past date. This runs without touching the live ledger.'}
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            {today ? null : (
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: admin.text,
                    marginBottom: 5,
                  }}
                >
                  As-of date
                </div>
                <AdminInput
                  width={176}
                  value={asOfDate}
                  placeholder="dd-mm-yyyy"
                  focused={dateFocused}
                />
              </div>
            )}
            <AdminButton pressed={pressed} disabled={busy}>
              {busy ? 'Generating…' : today ? 'Generate now' : 'Generate'}
            </AdminButton>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderTop: `1px solid ${admin.border}`,
          fontSize: 12.5,
        }}
      >
        <span style={{ color: busy ? admin.textMuted : admin.textSubtle }}>
          {busy
            ? 'Generating… a live capture takes about a minute.'
            : 'Reports are never sent automatically — you review, then share.'}
        </span>
        <span style={{ marginLeft: 'auto', color: admin.textSubtle }}>{quota}</span>
      </div>
    </AdminCard>
  );
}
