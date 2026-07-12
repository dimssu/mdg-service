import * as React from 'react';

import { Cursor } from '../components/Cursor';
import { Highlight } from '../components/Highlight';
import type { TutorialProps } from '../lib/calc';
import { DRAFT_FULL, DRAFT_FULL_TOTAL, ROSTER, type DraftLine } from '../lib/demoData';
import { TUTORIAL_BY_ID } from '../narration';
import { FinalizeSheet } from '../screens/FinalizeSheet';
import { StaffScreen } from '../screens/StaffScreen';

import { TutorialShell, type PhoneRenderArgs } from './TutorialShell';

/**
 * The step the old videos never had: work sits in a pending submission until the
 * dealer finalises it with a photo of the paper register. Until then the
 * leaderboard has not moved at all — which is the single most important thing for
 * a dealer to understand about the new flow.
 */

const PANEL = { x: 16, y: 132, w: 358, h: 300 };
const SUBMIT_BTN = { x: 195, y: 404 };
const SUBMIT_RECT = { x: 28, y: 378, w: 334, h: 52 };
const TRASH = { x: 348, y: 236 };
const TRASH_RECT = { x: 30, y: 218, w: 330, h: 34 };
const PHOTO_BTN = { x: 195, y: 620 };
const PHOTO_RECT = { x: 28, y: 594, w: 334, h: 54 };
const FIN_SUBMIT = { x: 195, y: 759 };
const FIN_RECT = { x: 28, y: 732, w: 334, h: 54 };

function pressInfo(local: number, length: number) {
  const pressAt = Math.max(8, length - 18);
  return { pressAt, pressed: local >= pressAt && local <= pressAt + 8 };
}

/** The roster after the draft is committed — every warrior's points go up. */
function bumped() {
  const add = new Map<string, number>();
  for (const l of DRAFT_FULL) {
    add.set(l.warriorId, (add.get(l.warriorId) ?? 0) + l.points);
  }
  return ROSTER.map((w) => ({
    ...w,
    points: Math.round((w.points + (add.get(w.id) ?? 0)) * 100) / 100,
  })).sort((a, b) => b.points - a.points);
}

/** The draft with the last line struck off, for the "remove a mistake" beat. */
const DRAFT_TRIMMED: DraftLine[] = DRAFT_FULL.slice(0, -1);

function renderPhone({ step, local, length }: PhoneRenderArgs): React.ReactNode {
  switch (step) {
    case 'draftFull':
      return (
        <>
          <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_FULL} />
          <Highlight {...PANEL} radius={18} local={local} />
        </>
      );

    // A wrong line can be pulled out right up until the moment of submission.
    case 'draftRemove': {
      const { pressAt } = pressInfo(local, length);
      const lines = local >= pressAt ? DRAFT_TRIMMED : DRAFT_FULL;
      return (
        <>
          <StaffScreen variant="list" warriors={ROSTER} draft={lines} />
          <Highlight {...TRASH_RECT} radius={10} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 620 }} to={TRASH} local={local} pressAt={pressAt} />
        </>
      );
    }

    case 'draftSubmitPressed': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <StaffScreen
            variant="list"
            warriors={ROSTER}
            draft={DRAFT_FULL}
            finalSubmitPressed={pressed}
          />
          <Highlight {...SUBMIT_RECT} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 660 }} to={SUBMIT_BTN} local={local} pressAt={pressAt} />
        </>
      );
    }

    /* ── the hardcopy photo gate ── */

    case 'finalizeEmpty':
      return (
        <>
          <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_FULL} />
          <FinalizeSheet totalPoints={DRAFT_FULL_TOTAL} />
        </>
      );

    case 'finalizePhotoTap': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_FULL} />
          <FinalizeSheet
            totalPoints={DRAFT_FULL_TOTAL}
            photoTaken={local >= pressAt}
            photoPressed={pressed}
          />
          <Highlight {...PHOTO_RECT} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 720 }} to={PHOTO_BTN} local={local} pressAt={pressAt} />
        </>
      );
    }

    // Photo in place → the submit button comes alive.
    case 'finalizePhoto':
      return (
        <>
          <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_FULL} />
          <FinalizeSheet totalPoints={DRAFT_FULL_TOTAL} photoTaken />
          <Highlight {...FIN_RECT} local={local} />
        </>
      );

    case 'finalizeSubmitPressed': {
      const { pressAt, pressed } = pressInfo(local, length);
      return (
        <>
          <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_FULL} />
          <FinalizeSheet
            totalPoints={DRAFT_FULL_TOTAL}
            photoTaken
            submitPressed={pressed}
            submitting={local >= pressAt}
          />
          <Highlight {...FIN_RECT} local={local} visible={local < pressAt + 6} />
          <Cursor from={{ x: 300, y: 780 }} to={FIN_SUBMIT} local={local} pressAt={pressAt} />
        </>
      );
    }

    // Committed: the leaderboard finally moves and the pending panel is gone.
    case 'submitted':
      return (
        <StaffScreen
          variant="list"
          warriors={bumped()}
          toast={{ text: `${DRAFT_FULL_TOTAL} पॉइंट जमा हो गए` }}
        />
      );

    default:
      return <StaffScreen variant="list" warriors={ROSTER} draft={DRAFT_FULL} />;
  }
}

export function SubmitPointsVideo({ sceneFrames, hasAudio }: TutorialProps) {
  return (
    <TutorialShell
      tutorial={TUTORIAL_BY_ID['submit-points']}
      sceneFrames={sceneFrames}
      hasAudio={hasAudio}
      renderPhone={renderPhone}
    />
  );
}
