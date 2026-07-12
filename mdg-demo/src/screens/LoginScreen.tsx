import * as React from 'react';

import { AppButton, TextField } from '../components/ui';
import { colors } from '../theme';

export interface LoginState {
  email?: string;
  password?: string;
  emailFocused?: boolean;
  passwordFocused?: boolean;
  emailCaret?: boolean;
  passwordCaret?: boolean;
  signInPressed?: boolean;
}

export function LoginScreen(state: LoginState) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 26px',
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: colors.brand,
            color: colors.textInverse,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          MDG
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: colors.text, marginTop: 14 }}>
          फिर से स्वागत है
        </div>
        <div style={{ fontSize: 14.5, color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
          MDG टीम से बात करने के लिए साइन इन करें।
        </div>
      </div>

      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 20,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>ईमेल</span>
          <TextField
            value={state.email}
            placeholder="you@dealership.com"
            focused={state.emailFocused}
            caret={state.emailCaret}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>पासवर्ड</span>
          <TextField
            value={state.password}
            placeholder="••••••••"
            type="password"
            focused={state.passwordFocused}
            caret={state.passwordCaret}
          />
        </div>
        <AppButton fullWidth pressed={state.signInPressed}>
          साइन इन करें
        </AppButton>
      </div>

      <div style={{ fontSize: 12.5, color: colors.textSubtle, textAlign: 'center', marginTop: 24 }}>
        एक्सेस चाहिए? अपने MDG अकाउंट मैनेजर से संपर्क करें।
      </div>
    </div>
  );
}
