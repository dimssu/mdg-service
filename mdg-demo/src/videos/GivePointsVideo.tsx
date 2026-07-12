import * as React from 'react';

import { Cursor } from '../components/Cursor';
import { Highlight } from '../components/Highlight';
import type { TutorialProps } from '../lib/calc';
import {
  DRAFT_ONE,
  DRAFT_TWO,
  OTHER_NOTE,
  ROSTER,
  WORK_CATALOG,
  WORK_EACH,
  WORK_OTHER,
} from '../lib/demoData';
import { TUTORIAL_BY_ID } from '../narration';
import { GivePointsSheet } from '../screens/GivePointsSheet';
import { StaffScreen } from '../screens/StaffScreen';

import { TutorialShell, type PhoneRenderArgs } from './TutorialShell';

const GIVE = { x: 112, y: 93 };
const GIVE_BTN = { x: 16, y: 66, w: 192, h: 54 };
const PICK_WORKER = { x: 195, y: 208 };
const WORKER_ROW = { x: 16, y: 180, w: 358, h: 56 };
const SEARCH_BOX = { x: 28, y: 172, w: 334, h: 44 };
const PICK_WORK = { x: 195, y: 462 };
const WORK_ROW = { x: 16, y: 436, w: 358, h: 52 };
const FOOTER_BTN = { x: 195, y: 759 };
const FOOTER_RECT = { x: 28, y: 732, w: 334, h: 54 };
const NOTE_BOX = { x: 40, y: 396, w: 310, h: 62 };

const RAMESH = ROSTER[0].id;

function pressInfo(local: number, length: number) {
  const pressAt = Math.max(8, length - 18);
  return { pressAt, pressed: local >= pressAt && local <= pressAt + 8 };
}

/** Reveal the typed description a character at a time, so it reads as typing. */
function typed(local: number, length: number, text: string): string {
  const start = 10;
  const end = Math.max(start + 1, length - 22);
  const t = Math.min(1, Math.max(0, (local - start) / (end - start)));
  return text.slice(0, Math.round(t * text.length));
}

function Background() {
  return <StaffScreen variant="list" warriors={ROSTER} />;
}

const SHEET = {
  warriors: ROSTER,
  catalog: WORK_CATALOG,
};

function renderPhone({ step, local, length }: PhoneRenderArgs): React.ReactNode {
  switch (step) {
    case 'tapGive': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <StaffScreen variant="list" warriors={ROSTER} givePressed={pressed} />
          <Highlight {...GIVE_BTN} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 620 }} to={GIVE} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'sheetPickWorker': {
      const { pressAt } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet {...SHEET} step="worker" selectedWorkerIds={[]} selectedCodes={[]} />
          <Highlight {...WORKER_ROW} radius={18} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 720 }} to={PICK_WORKER} local={local} pressAt={pressAt} />
        </>
      );
    }

    // The search box — the shortcut past a 66-item list.
    case 'sheetSearch':
      return (
        <>
          <Background />
          <GivePointsSheet {...SHEET} step="work" selectedWorkerIds={[RAMESH]} selectedCodes={[]} />
          <Highlight {...SEARCH_BOX} radius={14} local={local} visible />
        </>
      );

    case 'sheetPickWork': {
      const { pressAt } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet
            {...SHEET}
            step="work"
            selectedWorkerIds={[RAMESH]}
            selectedCodes={[WORK_EACH.code]}
          />
          <Highlight {...WORK_ROW} radius={18} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 720 }} to={PICK_WORK} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'sheetConfirm':
      return (
        <>
          <Background />
          <GivePointsSheet
            {...SHEET}
            step="configure"
            selectedWorkerIds={[RAMESH]}
            selectedCodes={[WORK_EACH.code]}
          />
        </>
      );

    /* ── the catch-all work, and why it asks a question back ── */

    case 'sheetOtherEmpty':
      return (
        <>
          <Background />
          <GivePointsSheet
            {...SHEET}
            step="configure"
            selectedWorkerIds={[RAMESH]}
            selectedCodes={[WORK_OTHER.code]}
            noteText=""
          />
          <Highlight {...NOTE_BOX} radius={14} local={local} visible />
        </>
      );

    // Tapping "Add to submission" with the description empty → it refuses, in red.
    case 'sheetOtherError': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet
            {...SHEET}
            step="configure"
            selectedWorkerIds={[RAMESH]}
            selectedCodes={[WORK_OTHER.code]}
            noteText=""
            noteError={local >= pressAt}
            confirmPressed={pressed}
          />
          <Cursor from={{ x: 300, y: 640 }} to={FOOTER_BTN} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'sheetOtherFilled':
      return (
        <>
          <Background />
          <GivePointsSheet
            {...SHEET}
            step="configure"
            selectedWorkerIds={[RAMESH]}
            selectedCodes={[WORK_OTHER.code]}
            noteText={typed(local, length, OTHER_NOTE)}
            noteCaret={Math.floor(local / 8) % 2 === 0}
          />
          <Highlight {...NOTE_BOX} radius={14} local={local} visible />
        </>
      );

    case 'sheetAddPressed': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet
            {...SHEET}
            step="configure"
            selectedWorkerIds={[RAMESH]}
            selectedCodes={[WORK_EACH.code]}
            confirmPressed={pressed}
          />
          <Highlight {...FOOTER_RECT} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 760 }} to={FOOTER_BTN} local={local} pressAt={pressAt} />
        </>
      );
    }

    /* ── the work lands in the pending submission, not on the leaderboard ── */

    case 'draftOne':
      return <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_ONE} />;

    case 'draftTwo':
      return <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_TWO} />;

    case 'staffHome':
    default:
      return <StaffScreen variant="list" warriors={ROSTER} />;
  }
}

export function GivePointsVideo({ sceneFrames, hasAudio }: TutorialProps) {
  return (
    <TutorialShell
      tutorial={TUTORIAL_BY_ID['give-points']}
      sceneFrames={sceneFrames}
      hasAudio={hasAudio}
      renderPhone={renderPhone}
    />
  );
}
