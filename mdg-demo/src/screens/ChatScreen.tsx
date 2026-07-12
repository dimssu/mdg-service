import * as React from 'react';

import { colors } from '../theme';

/** The screen the dealer lands on after login (chat with the MDG team). */
export function ChatScreen() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: colors.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* header */}
      <div
        style={{
          height: 60,
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surface,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: colors.brand,
            color: colors.textInverse,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          MDG
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>MDG सपोर्ट</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: 999, background: colors.online }} />
            <span style={{ fontSize: 12, color: colors.online, fontWeight: 500 }}>ऑनलाइन</span>
          </div>
        </div>
      </div>

      {/* messages */}
      <div
        style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '78%',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px 16px 16px 4px',
            padding: '10px 14px',
            fontSize: 14.5,
            color: colors.text,
          }}
        >
          नमस्ते! MDG में आपका स्वागत है 🙏 हम आपकी कैसे मदद करें?
        </div>
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '78%',
            background: colors.brand,
            color: colors.textInverse,
            borderRadius: '16px 16px 4px 16px',
            padding: '10px 14px',
            fontSize: 14.5,
          }}
        >
          नमस्ते! मुझे एक जानकारी चाहिए थी।
        </div>
      </div>

      {/* composer */}
      <div
        style={{
          padding: 12,
          borderTop: `1px solid ${colors.border}`,
          background: colors.surface,
          display: 'flex',
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 44,
            borderRadius: 999,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontSize: 14,
            color: colors.textSubtle,
          }}
        >
          मैसेज लिखें…
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: colors.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.textInverse}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
