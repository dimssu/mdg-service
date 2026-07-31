import * as React from 'react';

import { BROWSER_CONTENT } from '../../components/BrowserFrame';
import { FONT_FAMILY } from '../../theme';

import {
  ActivityPulse,
  Building,
  ChevronDown,
  Database,
  LayoutDashboard,
  MessageSquare,
  Plug,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  type AdminIconProps,
} from './icons';
import { admin } from './tokens';
import { AdminInput } from './ui';

/**
 * The admin portal's chrome — the 240px sidebar, the slim top bar and the
 * scrolling main area — sized to sit inside `BROWSER_CONTENT` (1440×620).
 *
 * Mirrors `mdg-admin/src/components/layout/AppShell.tsx` at desktop width: the
 * mobile tab bar and the account dropdown are deliberately absent because the
 * tutorial only ever shows an admin at a laptop.
 */

const SIDEBAR_W = 216;
const TOPBAR_H = 48;

export type AdminNavKey =
  | 'Inbox'
  | 'Overview'
  | 'Dealers'
  | 'Kavach'
  | 'Data Vault'
  | 'Services'
  | 'Runs'
  | 'Activity';

interface NavEntry {
  key: AdminNavKey;
  icon: (p: AdminIconProps) => React.ReactElement;
  /** Unread/pending count pill, as the real sidebar shows on Inbox. */
  badge?: number;
}

/** The visible set, in `navItems.ts` order (super-admin entries included). */
const NAV: NavEntry[] = [
  { key: 'Inbox', icon: MessageSquare, badge: 3 },
  { key: 'Overview', icon: LayoutDashboard },
  { key: 'Dealers', icon: Building },
  { key: 'Kavach', icon: ShieldCheck },
  { key: 'Data Vault', icon: Database },
  { key: 'Services', icon: Plug },
  { key: 'Runs', icon: ActivityPulse },
  { key: 'Activity', icon: ScrollText },
];

function NavRow({ entry, active }: { entry: NavEntry; active: boolean }) {
  const Icon = entry.icon;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        height: 36,
        padding: '0 11px',
        borderRadius: 8,
        background: active ? admin.brandSoft : 'transparent',
        color: active ? admin.brand : admin.textMuted,
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <Icon size={17} color={active ? admin.brand : admin.textMuted} />
      <span style={{ flex: 1 }}>{entry.key}</span>
      {entry.badge ? (
        <span
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 999,
            background: admin.brand,
            color: admin.textInverse,
            fontSize: 11,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {entry.badge}
        </span>
      ) : null}
    </div>
  );
}

export interface AdminShellProps {
  /** Which sidebar entry is highlighted. */
  nav: AdminNavKey;
  children: React.ReactNode;
  /**
   * Pixels the main area is scrolled by. The portal's content column scrolls
   * under a fixed sidebar + top bar, so a scene that has to reach the report
   * detail pans this instead of shrinking the page.
   */
  scrollY?: number;
}

export function AdminShell({ nav, children, scrollY = 0 }: AdminShellProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: BROWSER_CONTENT.width,
        height: BROWSER_CONTENT.height,
        display: 'flex',
        background: admin.bg,
        fontFamily: FONT_FAMILY,
        color: admin.text,
        overflow: 'hidden',
      }}
    >
      {/* sidebar */}
      <div
        style={{
          width: SIDEBAR_W,
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          background: admin.surface,
          borderRight: `1px solid ${admin.border}`,
        }}
      >
        <div
          style={{
            height: 56,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 16px',
            borderBottom: `1px solid ${admin.border}`,
          }}
        >
          <Shield size={20} color={admin.brand} />
          <span style={{ fontSize: 15.5, fontWeight: 600 }}>Dealer Kavach</span>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '10px 8px',
          }}
        >
          {NAV.map((entry) => (
            <NavRow key={entry.key} entry={entry} active={entry.key === nav} />
          ))}
        </div>
        <div
          style={{
            flex: 'none',
            padding: 12,
            borderTop: `1px solid ${admin.border}`,
            fontSize: 12,
            color: admin.textSubtle,
          }}
        >
          v0.1.0
        </div>
      </div>

      {/* main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: TOPBAR_H,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
            background: admin.surface,
            borderBottom: `1px solid ${admin.border}`,
          }}
        >
          <AdminInput
            width={300}
            placeholder="Search (coming soon)"
            muted
            leftIcon={<Search size={15} color={admin.textSubtle} />}
          />
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: admin.brandSoft,
                color: admin.brand,
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              RS
            </span>
            <span>Rahul Sharma</span>
            <ChevronDown size={14} color={admin.textMuted} />
          </div>
        </div>

        {/* scrolling content slot */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: -scrollY,
              width: BROWSER_CONTENT.width - SIDEBAR_W,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
