import * as React from 'react';

import { BROWSER_CONTENT } from '../../components/BrowserFrame';
import { FONT_FAMILY } from '../../theme';

import { CORRECTED_LITRES } from './DsrLedger';
import { Truck } from './icons';
import { admin } from './tokens';
import { AdminButton, AdminInput } from './ui';

/**
 * The Receipts editor — the one place in the DSR where a figure is typed rather
 * than read off a meter.
 *
 * Mirrors `mdg-admin/src/pages/dsr/DsrReceiptsDialog.tsx`: a business date, one
 * block per configured product showing what IRAS reports beside the box the
 * admin types into, and the standing rule that a blank box means "keep using
 * IRAS". The bottom list is the paper trail of everything entered by hand so far.
 */

export interface ProductRow {
  labelEn: string;
  tankLabel: string;
  /** What IRAS reports for this product on this date. */
  irasLitres: number;
  /** What the admin has typed, if anything. */
  entered?: string;
  invoiceNo?: string;
  note?: string;
  /** Draw the box as focused — the scene is typing into it. */
  focused?: boolean;
}

export interface DsrReceiptsDialogProps {
  businessDate?: string;
  products: ProductRow[];
  /** "Save receipts" drawn mid-click. */
  savePressed?: boolean;
  /** Show the "entered by hand so far" trail. */
  showHistory?: boolean;
}

function ProductBlock({ p }: { p: ProductRow }) {
  const empty = !p.entered;
  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        border: `1px solid ${admin.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: admin.text }}>
          {p.labelEn}{' '}
          <span style={{ fontWeight: 400, color: admin.textSubtle }}>{p.tankLabel}</span>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: admin.textSubtle }}>
          IRAS reports{' '}
          <b style={{ color: admin.text, fontVariantNumeric: 'tabular-nums' }}>
            {p.irasLitres.toLocaleString('en-IN')} L
          </b>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>Receipt (litres)</div>
          <AdminInput
            width={150}
            value={p.entered}
            placeholder={String(p.irasLitres)}
            focused={p.focused}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>
            Invoice / DSN (optional)
          </div>
          <AdminInput value={p.invoiceNo} placeholder="" />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>Reason (optional)</div>
        <AdminInput
          value={p.note}
          placeholder="e.g. tanker decanted, not entered in IRAS"
        />
      </div>

      <div style={{ fontSize: 12.5, color: admin.textSubtle }}>
        {empty
          ? 'Leave blank to keep using the IRAS figure.'
          : `Entered manually · replaces the IRAS figure of ${p.irasLitres.toLocaleString('en-IN')} L`}
      </div>
    </div>
  );
}

export function DsrReceiptsDialog({
  businessDate = '13-08-2026',
  products,
  savePressed,
  showHistory,
}: DsrReceiptsDialogProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: BROWSER_CONTENT.width,
        height: BROWSER_CONTENT.height,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_FAMILY,
        color: admin.text,
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: 760,
          borderRadius: 12,
          background: admin.surface,
          border: `1px solid ${admin.border}`,
          boxShadow: '0 16px 40px rgba(15,23,42,0.18)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 18px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={17} color={admin.text} />
            <span style={{ fontSize: 16.5, fontWeight: 600 }}>Receipts</span>
          </div>
          <div style={{ fontSize: 13.5, color: admin.textMuted, marginTop: 4 }}>
            Enter the litres decanted for a day. What you enter replaces the figure IRAS
            reports.
          </div>
        </div>

        <div style={{ padding: '0 18px 14px', display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>Business date</div>
            <AdminInput width={176} value={businessDate} />
          </div>

          {products.map((p) => (
            <ProductBlock key={p.labelEn} p={p} />
          ))}

          {showHistory ? (
            <div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: admin.textSubtle,
                  marginBottom: 5,
                }}
              >
                Entered by hand so far
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: admin.textMuted }}>
                <Truck size={13} color={admin.textMuted} />
                <b style={{ color: admin.text }}>13 Aug 2026</b>
                <span>MS</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {CORRECTED_LITRES.toLocaleString('en-IN')} L
                </span>
                <span style={{ color: admin.textSubtle }}>(IRAS: 0 L)</span>
                <span style={{ color: admin.textSubtle }}>· tanker decanted, not in IRAS</span>
              </div>
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 18px',
            borderTop: `1px solid ${admin.border}`,
            background: admin.surface2,
          }}
        >
          <AdminButton variant="secondary">Cancel</AdminButton>
          <AdminButton pressed={savePressed}>Save receipts</AdminButton>
        </div>
      </div>
    </div>
  );
}

/** The two products the sample outlet is configured with. */
export const DSR_PRODUCTS = {
  blank: (): ProductRow[] => [
    { labelEn: 'HIGH SPEED DIESEL', tankLabel: 'TANK -1', irasLitres: 0 },
    { labelEn: 'MOTOR SPIRIT', tankLabel: 'TANK -2', irasLitres: 0 },
  ],
  typing: (): ProductRow[] => [
    { labelEn: 'HIGH SPEED DIESEL', tankLabel: 'TANK -1', irasLitres: 0 },
    {
      labelEn: 'MOTOR SPIRIT',
      tankLabel: 'TANK -2',
      irasLitres: 0,
      entered: String(CORRECTED_LITRES),
      invoiceNo: 'INV-4471',
      note: 'tanker decanted, not entered in IRAS',
      focused: true,
    },
  ],
};
