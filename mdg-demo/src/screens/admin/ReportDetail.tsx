import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { CheckCircle, Download, FileText, Share, Tick } from './icons';
import { admin, cardBrand, SAMPLE } from './tokens';
import { AdminButton } from './ui';

/**
 * The expanded report: the rendered card, the figures behind it, the two trust
 * signals an admin is meant to check (does it reconcile, which lots make up the
 * amount), the source files, and the share action.
 *
 * Mirrors `mdg-admin/src/pages/dealers/CreditDodReportCard.tsx`, laid out in two
 * columns instead of one stack so the whole review fits a 1440×620 frame.
 *
 * `highlight` rings the one block the narration is on. The card image itself is
 * a deliberate stand-in — `screens/CreditCard.tsx` owns the full recreation, and
 * reproducing it here at 280px would only make it unreadable.
 */

export type ReportHighlight = 'none' | 'reconcile' | 'lots' | 'sources' | 'share';

export interface ReportDetailProps {
  highlight?: ReportHighlight;
  /** After the share confirm: the disabled "Shared" button + timestamp. */
  shared?: boolean;
  /** The Share button drawn mid-click. */
  pressed?: boolean;
}

/** The attention ring used for the block the narration is currently on. */
function ring(on: boolean): React.CSSProperties {
  return on
    ? { boxShadow: `0 0 0 2px ${admin.brand}, 0 0 0 6px ${admin.brandSoft}` }
    : {};
}

function MiniCard() {
  return (
    <div style={{ width: 280, flex: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          border: `1px solid ${admin.border}`,
          background: cardBrand.cream,
        }}
      >
        <div
          style={{
            height: 18,
            background: `linear-gradient(90deg, ${cardBrand.gold}, #fbbf24 50%, ${cardBrand.gold})`,
            borderBottom: `1.5px solid ${cardBrand.maroon}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8.5,
            fontWeight: 800,
            color: cardBrand.maroon,
            letterSpacing: '0.02em',
          }}
        >
          Dealer&apos;s Kavach · MDG Services
        </div>
        <div
          style={{
            background: `linear-gradient(180deg, ${cardBrand.maroon}, ${cardBrand.maroonDeep})`,
            color: '#ffffff',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: '#ffffff',
              color: cardBrand.maroon,
              fontSize: 9,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            MDG
          </div>
          <div style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.03em' }}>
              CREDIT &amp; DOD MONITORING
            </div>
            <div style={{ fontSize: 8.5, opacity: 0.85, marginTop: 1 }}>
              As on 30-07-2026
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>{SAMPLE.dealerCode}</div>
        </div>
        {[
          ['DUE AMOUNT', SAMPLE.dueAmount],
          ['DUE DATE', SAMPLE.dueDate],
          ['AVAILABLE LIMIT', SAMPLE.availableLimit],
        ].map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '7px 12px',
              borderTop: i === 0 ? undefined : `1px solid ${cardBrand.grid}`,
              fontSize: 10.5,
              color: cardBrand.ink,
            }}
          >
            <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{label}</span>
            <span style={{ fontWeight: 800, color: cardBrand.maroon }}>{value}</span>
          </div>
        ))}
        <div
          style={{
            height: 14,
            background: `linear-gradient(90deg, ${cardBrand.gold}, #fbbf24 50%, ${cardBrand.gold})`,
            borderTop: `1.5px solid ${cardBrand.maroon}`,
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: admin.textSubtle }}>Credit &amp; DOD card</div>
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        height: 22,
        padding: '0 10px',
        fontSize: 13,
      }}
    >
      <span style={{ color: admin.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function SourceFile({ label, hint }: { label: string; hint: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 10px',
        borderRadius: 8,
        border: `1px solid ${admin.border}`,
        background: admin.surface2,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <FileText size={14} color={admin.textMuted} />
          {label}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: admin.textMuted,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {hint}
        </div>
      </div>
      <AdminButton
        variant="secondary"
        size="sm"
        leftIcon={<Download size={14} color={admin.text} />}
      >
        Download
      </AdminButton>
    </div>
  );
}

export function ReportDetail({ highlight = 'none', shared, pressed }: ReportDetailProps) {
  return (
    <div style={{ display: 'flex', gap: 16, fontFamily: FONT_FAMILY, color: admin.text }}>
      <MiniCard />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            border: `1px solid ${admin.border}`,
            borderRadius: 8,
            background: admin.surface,
            padding: '4px 0',
          }}
        >
          <DefRow label="Due amount" value={SAMPLE.dueAmount} />
          <DefRow label="Due date" value={SAMPLE.dueDate} />
          <DefRow label="Current limit" value={SAMPLE.currentLimit} />
          <DefRow label="Availed limit" value={SAMPLE.availedLimit} />
          <DefRow label="Available limit" value={SAMPLE.availableLimit} />
          <DefRow label="Form of limit" value={SAMPLE.formOfLimit} />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 6,
            padding: '2px 6px',
            marginLeft: -6,
            borderRadius: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: admin.success,
            ...ring(highlight === 'reconcile'),
          }}
        >
          <CheckCircle size={14} color={admin.success} />
          Reconciles (SDMS receivable {SAMPLE.receivable})
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 32,
            padding: '0 12px',
            border: `1px solid ${admin.border}`,
            borderRadius: 8,
            background: admin.surface,
            ...ring(highlight === 'lots'),
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Why this amount? 1 unpaid purchase from 13 Jul 2026
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: admin.textMuted }}>
            Show all 4
          </span>
        </div>

        <div style={{ borderRadius: 8, ...ring(highlight === 'sources') }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: admin.textMuted,
              marginBottom: 5,
            }}
          >
            Source files
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SourceFile
              label="PAD statement"
              hint="Every transaction in the window, as a readable statement"
            />
            <SourceFile label="Card image" hint="The PNG the dealer receives" />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            alignSelf: 'flex-start',
            padding: 3,
            margin: -3,
            borderRadius: 10,
            ...ring(highlight === 'share'),
          }}
        >
          {shared ? (
            <>
              <AdminButton
                variant="secondary"
                disabled
                leftIcon={<Tick size={14} color={admin.text} />}
              >
                Shared
              </AdminButton>
              <span style={{ fontSize: 12, color: admin.textSubtle }}>
                30 Jul 2026, 10:14 AM
              </span>
            </>
          ) : (
            <AdminButton
              pressed={pressed}
              leftIcon={<Share size={14} color={admin.textInverse} />}
            >
              Share with dealer
            </AdminButton>
          )}
        </div>
      </div>
    </div>
  );
}
