import * as React from 'react';
import { interpolate } from 'remotion';

import { Cursor } from '../components/Cursor';
import { Highlight } from '../components/Highlight';
import type { TutorialProps } from '../lib/calc';
import { NEW_WARRIOR } from '../lib/demoData';
import { TUTORIAL_BY_ID } from '../narration';
import { StaffScreen } from '../screens/StaffScreen';

import { TutorialShell, type PhoneRenderArgs } from './TutorialShell';

const NAME = 'रमेश';

const EMPTY_CTA = { x: 195, y: 516 };
const EMPTY_CTA_BTN = { x: 118, y: 489, w: 154, h: 54 };
const NAME_HL = { x: 24, y: 146, w: 342, h: 50 };
const OPTIONAL_HL = { x: 24, y: 204, w: 342, h: 108 };
const SAVE = { x: 132, y: 347 };
const SAVE_BTN = { x: 24, y: 325, w: 232, h: 44 };

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

function renderPhone({ step, sceneId, local, length }: PhoneRenderArgs): React.ReactNode {
  switch (step) {
    case 'staffEmpty':
      return <StaffScreen variant="empty" />;

    case 'tapAdd': {
      const pressAt = Math.max(8, length - 18);
      const pressed = local >= pressAt && local <= pressAt + 8;
      return (
        <>
          <StaffScreen variant="empty" emptyCtaPressed={pressed} />
          <Highlight {...EMPTY_CTA_BTN} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 720 }} to={EMPTY_CTA} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'typeName': {
      const name = reveal(NAME, local, 8, Math.max(16, length - 20));
      return (
        <>
          <StaffScreen
            variant="empty"
            addFormOpen
            addForm={{ name, nameFocused: true, nameCaret: blink(local) }}
          />
          <Highlight {...NAME_HL} radius={12} local={local} />
        </>
      );
    }

    case 'optionalFields':
      return (
        <>
          <StaffScreen variant="empty" addFormOpen addForm={{ name: NAME }} />
          <Highlight {...OPTIONAL_HL} radius={14} local={local} />
        </>
      );

    case 'tapSave': {
      const pressAt = Math.max(8, length - 18);
      const pressed = local >= pressAt && local <= pressAt + 8;
      return (
        <>
          <StaffScreen variant="empty" addFormOpen addForm={{ name: NAME }} savePressed={pressed} />
          <Highlight {...SAVE_BTN} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 720 }} to={SAVE} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'staffWithOne':
    default:
      return (
        <StaffScreen
          variant="list"
          warriors={[NEW_WARRIOR]}
          toast={sceneId === 'added' ? { text: 'योद्धा जुड़ गया' } : undefined}
        />
      );
  }
}

export function AddWarriorVideo({ sceneFrames, hasAudio }: TutorialProps) {
  return (
    <TutorialShell
      tutorial={TUTORIAL_BY_ID['add-warrior']}
      sceneFrames={sceneFrames}
      hasAudio={hasAudio}
      renderPhone={renderPhone}
    />
  );
}
