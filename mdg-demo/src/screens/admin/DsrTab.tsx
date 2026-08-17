import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { dsrRows, DsrLedger, CORRECTED_LITRES } from './DsrLedger';
import {
  CalendarClock,
  ChevronDown,
  CheckCircle,
  Database,
  Download,
  FileText,
  History,
  RefreshCw,
  Truck,
} from './icons';
import { RingOverlay } from './Ring';
import { admin } from './tokens';
import { AdminButton, AdminCard, AdminInput } from './ui';

/**
 * The dealer's "Daily Sales Report" tab — the toolbar an admin works from and
 * the generated report below it.
 *
 * Mirrors `mdg-admin/src/pages/dealers/DealerDsrTab.tsx` + `DsrReportPanel.tsx`:
 * business-date selector, generate-for-a-date, the Receipts editor, the
 * out-of-date notice, and the report card. The report body here draws the DSR
 * sheet directly rather than an <iframe>, because the sheet IS what the rendered
 * HTML shows and a video cannot show an iframe's contents any other way.
 */

const BUSINESS_DATE = 'Sat, 16 Aug 2026';

/**
 * The dealer's Data Vault rail — the horizontal dataset picker the DSR now
 * lives behind. Mirrors `DatasetRail` (orientation="horizontal") driven by
 * `pages/dealers/vault/datasets.ts`: the Daily Sales Report stopped being a tab
 * of its own and became a dataset here, so a tutorial that still pointed at a
 * "Daily Sales Report" tab would send an admin somewhere that does not exist.
 */
const VAULT_DATASETS = [
  'IRAS shift data',
  'PAD ledger',
  'Credit & DOD',
  'Daily Sales Report',
  'Inspection Reports',
] as const;

export function DsrVaultRail({ ringLocal }: { ringLocal?: number }) {
  return (
    <div style={{ fontFamily: FONT_FAMILY }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          paddingBottom: 8,
          borderBottom: `1px solid ${admin.border}`,
        }}
      >
        {VAULT_DATASETS.map((d) => {
          const active = d === 'Daily Sales Report';
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
                background: active ? admin.brandSoft : 'transparent',
                color: active ? admin.brand : admin.textMuted,
              }}
            >
              {d === 'Daily Sales Report' ? (
                <FileText size={16} color={active ? admin.brand : admin.textMuted} />
              ) : d === 'Inspection Reports' ? (
                <CheckCircle size={16} color={admin.textMuted} />
              ) : (
                <Database size={16} color={admin.textMuted} />
              )}
              {d}
            </div>
          );
          return active && ringLocal !== undefined ? (
            <div key={d} style={{ position: 'relative' }}>
              {pill}
              <RingOverlay local={ringLocal} />
            </div>
          ) : (
            <React.Fragment key={d}>{pill}</React.Fragment>
          );
        })}
      </div>
      <div style={{ fontSize: 13.5, color: admin.textMuted, marginTop: 10 }}>
        This dealer&apos;s generated Daily Sales Reports — stock variation and the sales
        ledger.
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: admin.text, marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/** A read-only `<select>` stand-in — the business-date picker. */
function DateSelect({ value }: { value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: 288,
        height: 36,
        padding: '0 12px',
        borderRadius: 8,
        background: admin.surface,
        border: `1px solid ${admin.border}`,
        fontSize: 14,
        color: admin.text,
      }}
    >
      <span style={{ flex: 1 }}>{value} · latest</span>
      <ChevronDown size={15} color={admin.textMuted} />
    </div>
  );
}

export interface DsrToolbarProps {
  /** The Receipts button drawn mid-click. */
  receiptsPressed?: boolean;
  /**
   * Scene-local frame — draws the pulse around the Receipts button. Passed in
   * rather than measured from outside so the ring moves with this layout.
   */
  ringLocal?: number;
}

export function DsrToolbar({ receiptsPressed, ringLocal }: DsrToolbarProps) {
  return (
    <AdminCard style={{ fontFamily: FONT_FAMILY }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 16,
          padding: 12,
        }}
      >
        <Field label="Business date">
          <DateSelect value={BUSINESS_DATE} />
        </Field>
        <Field label="Generate for a date">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AdminInput width={160} placeholder="dd-mm-yyyy" />
            <AdminButton
              variant="secondary"
              leftIcon={<CalendarClock size={15} color={admin.text} />}
            >
              Generate
            </AdminButton>
          </div>
        </Field>
        <div style={{ position: 'relative' }}>
          <AdminButton
            variant="secondary"
            pressed={receiptsPressed}
            leftIcon={<Truck size={15} color={admin.text} />}
          >
            Receipts
          </AdminButton>
          {ringLocal === undefined ? null : <RingOverlay local={ringLocal} />}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 12.5,
            color: admin.textSubtle,
            paddingBottom: 8,
          }}
        >
          Generated 16 Aug 2026, 6:40 AM
        </div>
      </div>
    </AdminCard>
  );
}

export interface DsrStaleBannerProps {
  /** The Regenerate button drawn mid-click / in flight. */
  pressed?: boolean;
  busy?: boolean;
  /** Scene-local frame — pulses around the whole banner. */
  ringLocal?: number;
  /** Pulse the Regenerate button instead of the banner. */
  ringButton?: boolean;
}

/**
 * "This report is out of date" — raised when a receipt for this day or an
 * earlier one changed. The figures shown are still the ones that went to the
 * dealer, so the report stays readable and this sits above it.
 */
export function DsrStaleBanner({
  pressed,
  busy,
  ringLocal,
  ringButton,
}: DsrStaleBannerProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        border: `1px solid ${admin.warning}`,
        background: admin.warningSoft,
        color: admin.warning,
        fontFamily: FONT_FAMILY,
      }}
    >
      {ringLocal !== undefined && !ringButton ? (
        <RingOverlay local={ringLocal} radius={10} inset={-6} />
      ) : null}
      <span style={{ marginTop: 2, flex: 'none' }}>
        <History size={16} color={admin.warning} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>This report is out of date</div>
        <div style={{ fontSize: 13.5, marginTop: 2 }}>
          The MS receipt for 2026-08-13 was changed, so this report&apos;s stock variation no
          longer matches its inputs.
        </div>
        <div style={{ fontSize: 12.5, marginTop: 2, opacity: 0.9 }}>
          Flagged 16 Aug 2026, 6:58 AM · 3 other reports affected (13 Aug 2026, 14 Aug 2026,
          15 Aug 2026)
        </div>
      </div>
      <div style={{ flex: 'none', position: 'relative' }}>
        <AdminButton
          size="sm"
          pressed={pressed}
          disabled={busy}
          leftIcon={<RefreshCw size={14} color={admin.textInverse} />}
        >
          {busy ? 'Rebuilding…' : 'Regenerate'}
        </AdminButton>
        {ringLocal !== undefined && ringButton ? <RingOverlay local={ringLocal} /> : null}
      </div>
    </div>
  );
}

/** The stock-variation headline that sits beside the sheet in the real report. */
function VariationStrip({ corrected }: { corrected: boolean }) {
  const items: { label: string; value: string; tone?: 'ok' | 'bad' }[] = [
    { label: 'Variation', value: corrected ? '−1,523 L' : '+2,410 L', tone: corrected ? 'ok' : 'bad' },
    { label: 'Permissible band', value: '± 1,180 L' },
    {
      label: 'Receipts since inspection',
      value: corrected ? '3,77,433 L' : '3,73,500 L',
    },
    { label: 'Testing since inspection', value: '1,150 L' },
  ];
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            flex: 1,
            borderRadius: 8,
            border: `1px solid ${admin.border}`,
            background: admin.surface2,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: admin.textSubtle }}>
            {it.label}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color:
                it.tone === 'ok' ? admin.success : it.tone === 'bad' ? admin.danger : admin.text,
            }}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface DsrReportCardProps {
  /** Draw the sheet with the corrected receipt (and its "M" marker). */
  corrected?: boolean;
}

export function DsrReportCard({ corrected = false }: DsrReportCardProps) {
  return (
    <AdminCard style={{ fontFamily: FONT_FAMILY, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderBottom: `1px solid ${admin.border}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Daily Sales Report</div>
          <div style={{ fontSize: 12.5, color: admin.textSubtle }}>
            {BUSINESS_DATE} · Outlet 15E
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <AdminButton
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} color={admin.text} />}
          >
            Download Excel
          </AdminButton>
          <AdminButton
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} color={admin.text} />}
          >
            Regenerate
          </AdminButton>
        </div>
      </div>
      <div style={{ padding: 14, display: 'grid', gap: 12 }}>
        <VariationStrip corrected={corrected} />
        <DsrLedger rows={dsrRows(corrected)} fontSize={12} />
      </div>
    </AdminCard>
  );
}

export interface DsrTabProps {
  corrected?: boolean;
  stale?: boolean;
  regenerating?: boolean;
  receiptsPressed?: boolean;
  regeneratePressed?: boolean;
  /** Scene-local frame; `ring` picks what it pulses around. */
  local?: number;
  ring?: 'dataset' | 'receipts' | 'stale' | 'regenerate';
}

/** The whole tab body, in the order the portal stacks it. */
export function DsrTab({
  corrected,
  stale,
  regenerating,
  receiptsPressed,
  regeneratePressed,
  local,
  ring,
}: DsrTabProps) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <DsrVaultRail ringLocal={ring === 'dataset' ? local : undefined} />
      <DsrToolbar
        receiptsPressed={receiptsPressed}
        ringLocal={ring === 'receipts' ? local : undefined}
      />
      {stale ? (
        <DsrStaleBanner
          pressed={regeneratePressed}
          busy={regenerating}
          ringLocal={ring === 'stale' || ring === 'regenerate' ? local : undefined}
          ringButton={ring === 'regenerate'}
        />
      ) : null}
      <DsrReportCard corrected={corrected} />
    </div>
  );
}

/**
 * The success toast the save raises. Deliberately states the consequence —
 * "N reports now need regenerating" — because nothing rebuilds on its own.
 */
export function DsrSaveToast() {
  return (
    <div
      style={{
        position: 'absolute',
        right: 20,
        bottom: 18,
        maxWidth: 430,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 10,
        background: admin.surface,
        border: `1px solid ${admin.border}`,
        boxShadow: '0 12px 30px rgba(15,23,42,0.18)',
        fontFamily: FONT_FAMILY,
        zIndex: 80,
      }}
    >
      <span
        style={{
          marginTop: 1,
          width: 20,
          height: 20,
          borderRadius: 999,
          flex: 'none',
          background: admin.successSoft,
          color: admin.success,
          fontSize: 13,
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✓
      </span>
      <div style={{ fontSize: 13.5, color: admin.text, lineHeight: 1.45 }}>
        Receipts saved. <b>4 reports</b> now need regenerating.
        <div style={{ fontSize: 12.5, color: admin.textSubtle, marginTop: 2 }}>
          MS · 13 Aug 2026 · {CORRECTED_LITRES.toLocaleString('en-IN')} L
        </div>
      </div>
    </div>
  );
}
