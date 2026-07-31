import * as React from 'react';

import { FONT_FAMILY } from '../../theme';

import { admin, SAMPLE } from './tokens';
import { AdminBadge } from './ui';

/**
 * The dealer drill-in header: breadcrumb, name, code, status chip, and the tab
 * strip from `DealerDetailPage.tsx`. The tab labels and their order are the
 * real ones — `Credit & DOD` sits ninth, between `Services provided` and
 * `Data Vault`, which is exactly where the video has to point.
 */

export const DEALER_TABS = [
  'Onboarding',
  'Info',
  'Team',
  'Services',
  'Kavach',
  'Warriors & points',
  'Work list',
  'Services provided',
  'Credit & DOD',
  'Data Vault',
  'Run history',
] as const;

export type DealerTab = (typeof DEALER_TABS)[number];

export interface DealerHeaderProps {
  activeTab: DealerTab;
  /** Dealer name / code — defaulted to the tutorial's sample dealer. */
  name?: string;
  code?: string;
}

export function DealerHeader({
  activeTab,
  name = SAMPLE.dealerName,
  code = SAMPLE.dealerCode,
}: DealerHeaderProps) {
  return (
    <div style={{ fontFamily: FONT_FAMILY, color: admin.text }}>
      <div style={{ fontSize: 12.5, color: admin.textSubtle, marginBottom: 4 }}>
        Dealers <span style={{ margin: '0 6px' }}>/</span> {name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em' }}>{name}</div>
          <div style={{ fontSize: 13, color: admin.textMuted, marginTop: 2 }}>
            {code} · {SAMPLE.dealerPhone} · Bhopal Road, Sehore
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <AdminBadge intent="success">ACTIVE</AdminBadge>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          marginTop: 12,
          borderBottom: `1px solid ${admin.border}`,
        }}
      >
        {DEALER_TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <div
              key={tab}
              style={{
                padding: '9px 10px',
                marginBottom: -1,
                whiteSpace: 'nowrap',
                fontSize: 13.5,
                fontWeight: 500,
                color: active ? admin.text : admin.textMuted,
                borderBottom: `2px solid ${active ? admin.brand : 'transparent'}`,
              }}
            >
              {tab}
            </div>
          );
        })}
      </div>
    </div>
  );
}
