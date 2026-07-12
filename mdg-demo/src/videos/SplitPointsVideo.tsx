import * as React from 'react';

import { Cursor } from '../components/Cursor';
import { Highlight } from '../components/Highlight';
import type { TutorialProps } from '../lib/calc';
import { DRAFT_SPLIT, ROSTER, WORK_CATALOG, WORK_SPLIT } from '../lib/demoData';
import { TUTORIAL_BY_ID } from '../narration';
import { GivePointsSheet } from '../screens/GivePointsSheet';
import { StaffScreen } from '../screens/StaffScreen';

import { TutorialShell, type PhoneRenderArgs } from './TutorialShell';

const GIVE = { x: 112, y: 93 };
const GIVE_BTN = { x: 16, y: 66, w: 192, h: 54 };
const PICK_WORKER = { x: 195, y: 208 };
const WORKER_ROW = { x: 16, y: 180, w: 358, h: 56 };
const FOOTER_BTN = { x: 195, y: 759 };
const FOOTER_RECT = { x: 28, y: 732, w: 334, h: 54 };
const SURESH_ROW = { x: 195, y: 292 };
const SURESH_RECT = { x: 16, y: 266, w: 358, h: 52 };
const VIKRAM_ROW = { x: 195, y: 350 };
const VIKRAM_RECT = { x: 16, y: 324, w: 358, h: 52 };
const WORKCARD_HL = { x: 16, y: 410, w: 358, h: 68 };

const RAMESH = ROSTER[0].id;
const SURESH = ROSTER[1].id;
const VIKRAM = ROSTER[2].id;
const SPLIT = WORK_SPLIT.code;

function pressInfo(local: number, length: number) {
  const pressAt = Math.max(8, length - 18);
  return { pressAt, pressed: local >= pressAt && local <= pressAt + 8 };
}

function Background() {
  return <StaffScreen variant="list" warriors={ROSTER} />;
}

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
          <GivePointsSheet
            step="worker"
            warriors={ROSTER}
            selectedWorkerIds={[]}
            catalog={WORK_CATALOG}
            selectedCodes={[]}
          />
          <Highlight {...WORKER_ROW} radius={18} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 720 }} to={PICK_WORKER} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'sheetPickSplitWork': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet
            step="work"
            warriors={ROSTER}
            selectedWorkerIds={[RAMESH]}
            catalog={WORK_CATALOG}
            selectedCodes={[SPLIT]}
            continuePressed={pressed}
          />
          <Highlight {...FOOTER_RECT} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 760 }} to={FOOTER_BTN} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'sheetAddCoworkers': {
      const { pressAt } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet
            step="configure"
            warriors={ROSTER}
            selectedWorkerIds={[RAMESH, SURESH]}
            catalog={WORK_CATALOG}
            selectedCodes={[SPLIT]}
          />
          <Highlight {...SURESH_RECT} radius={18} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 640 }} to={SURESH_ROW} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'sheetSplitTwo':
      return (
        <>
          <Background />
          <GivePointsSheet
            step="configure"
            warriors={ROSTER}
            selectedWorkerIds={[RAMESH, SURESH]}
            catalog={WORK_CATALOG}
            selectedCodes={[SPLIT]}
          />
          <Highlight {...WORKCARD_HL} radius={18} local={local} />
        </>
      );

    case 'sheetSplitThree': {
      const { pressAt } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet
            step="configure"
            warriors={ROSTER}
            selectedWorkerIds={[RAMESH, SURESH, VIKRAM]}
            catalog={WORK_CATALOG}
            selectedCodes={[SPLIT]}
          />
          <Highlight {...VIKRAM_RECT} radius={18} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 640 }} to={VIKRAM_ROW} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'sheetConfirmSplit': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <Background />
          <GivePointsSheet
            step="configure"
            warriors={ROSTER}
            selectedWorkerIds={[RAMESH, SURESH]}
            catalog={WORK_CATALOG}
            selectedCodes={[SPLIT]}
            confirmPressed={pressed}
          />
          <Highlight {...FOOTER_RECT} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 760 }} to={FOOTER_BTN} local={local} pressAt={pressAt} />
        </>
      );
    }

    // The split work lands in the pending submission as one line per warrior —
    // 40 points shared by two, so 20 each. The leaderboard has not moved yet.
    case 'draftSplit':
      return <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_SPLIT} />;

    case 'staffHome':
    default:
      return <StaffScreen variant="list" warriors={ROSTER} />;
  }
}

export function SplitPointsVideo({ sceneFrames, hasAudio }: TutorialProps) {
  return (
    <TutorialShell
      tutorial={TUTORIAL_BY_ID['split-points']}
      sceneFrames={sceneFrames}
      hasAudio={hasAudio}
      renderPhone={renderPhone}
    />
  );
}
