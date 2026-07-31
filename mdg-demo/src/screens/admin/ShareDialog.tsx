import * as React from 'react';

import { BROWSER_CONTENT } from '../../components/BrowserFrame';
import { FONT_FAMILY } from '../../theme';

import { admin } from './tokens';
import { AdminButton } from './ui';

/**
 * The share confirmation. Sharing is the one irreversible action on this screen
 * — it posts into the dealer's chat — so the portal asks first, and the video
 * dwells on this dialog rather than skipping past it.
 *
 * Mirrors the `Dialog` at the bottom of
 * `mdg-admin/src/pages/dealers/CreditDodReportCard.tsx` (size `sm`).
 */
export interface ShareDialogProps {
  /** The Share button drawn mid-click. */
  pressed?: boolean;
  /** Highlight the Cancel button instead (the "you can still back out" beat). */
  cancelPressed?: boolean;
}

export function ShareDialog({ pressed, cancelPressed }: ShareDialogProps) {
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
          width: 460,
          borderRadius: 12,
          background: admin.surface,
          border: `1px solid ${admin.border}`,
          boxShadow: '0 16px 40px rgba(15,23,42,0.16)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 18px 12px' }}>
          <div style={{ fontSize: 16.5, fontWeight: 600 }}>Share with dealer</div>
          <div style={{ fontSize: 13.5, color: admin.textMuted, marginTop: 5 }}>
            Share this Credit &amp; DOD card with the dealer&apos;s chat? This will message the
            dealer.
          </div>
          <div style={{ fontSize: 13.5, color: admin.textMuted, marginTop: 12 }}>
            The rendered card and its values will be posted to the dealer&apos;s chat.
          </div>
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
          <AdminButton variant="secondary" pressed={cancelPressed}>
            Cancel
          </AdminButton>
          <AdminButton pressed={pressed}>Share</AdminButton>
        </div>
      </div>
    </div>
  );
}
