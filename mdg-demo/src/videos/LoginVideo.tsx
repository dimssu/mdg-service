import * as React from 'react';
import { interpolate } from 'remotion';

import { Cursor } from '../components/Cursor';
import { Highlight } from '../components/Highlight';
import type { TutorialProps } from '../lib/calc';
import { TUTORIAL_BY_ID } from '../narration';
import { ChatScreen } from '../screens/ChatScreen';
import { LoginScreen } from '../screens/LoginScreen';

import { TutorialShell, type PhoneRenderArgs } from './TutorialShell';

const EMAIL = 'raj@balajipetrol.in';
const PASSWORD = '••••••••';

// Tap target for the "साइन इन करें" button (phone content coords).
const SIGNIN = { x: 195, y: 533 };
const SIGNIN_BTN = { x: 40, y: 506, w: 310, h: 54 };

function reveal(full: string, local: number, startF: number, endF: number): string {
  const n = Math.floor(
    interpolate(local, [startF, endF], [0, full.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  return full.slice(0, Math.max(0, Math.min(full.length, n)));
}

function blink(local: number): boolean {
  return Math.floor(local / 8) % 2 === 0;
}

function renderLoginPhone({ step, local, length }: PhoneRenderArgs): React.ReactNode {
  switch (step) {
    case 'typeEmail': {
      const email = reveal(EMAIL, local, 8, length - 8);
      return <LoginScreen email={email} emailFocused emailCaret={blink(local)} />;
    }
    case 'typePassword': {
      const pw = reveal(PASSWORD, local, 8, length - 8);
      return (
        <LoginScreen email={EMAIL} password={pw} passwordFocused passwordCaret={blink(local)} />
      );
    }
    case 'tapSignIn': {
      const pressAt = Math.max(8, length - 20);
      const pressed = local >= pressAt && local <= pressAt + 8;
      return (
        <>
          <LoginScreen email={EMAIL} password={PASSWORD} signInPressed={pressed} />
          <Highlight {...SIGNIN_BTN} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 320, y: 720 }} to={SIGNIN} local={local} pressAt={pressAt} />
        </>
      );
    }
    case 'loggedIn': {
      const opacity = interpolate(local, [0, 12], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return (
        <div style={{ position: 'absolute', inset: 0, opacity }}>
          <ChatScreen />
        </div>
      );
    }
    case 'loginBlank':
    default:
      return <LoginScreen />;
  }
}

export function LoginVideo({ sceneFrames, hasAudio }: TutorialProps) {
  return (
    <TutorialShell
      tutorial={TUTORIAL_BY_ID.login}
      sceneFrames={sceneFrames}
      hasAudio={hasAudio}
      renderPhone={renderLoginPhone}
    />
  );
}
