import * as React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { BrowserFrame } from '../components/BrowserFrame';
import { AudioTrack } from '../components/explainerChrome';
import { LandscapeShell, VIDEO_LANDSCAPE } from '../components/landscapeChrome';
import type { TutorialProps } from '../lib/calc';
import { activeScene } from '../lib/scene';
import { TUTORIAL_BY_ID } from '../narration';
import {
  AdminShell,
  admin,
  DEALER_TABS_TODAY,
  DealerHeader,
  DsrLedger,
  dsrRows,
  EmptyDay,
  GenerateCard,
  MANUAL_GRIDS,
  ManualDayGrids,
  ReviewDialog,
  VaultRail,
  type GridCode,
} from '../screens/admin';
import { colors, FONT_FAMILY } from '../theme';

/**
 * AdminManualShiftData — getting a DSR for an outlet with no portal automation.
 *
 * 16E was onboarded without an IndianOil account and keeps its DSR in a macro
 * workbook. Every other tutorial in this series can assume the day's figures
 * arrive on their own; here they never do, and the whole task is putting them in.
 *
 * Deliberately a WALKTHROUGH, not an explainer. Nothing in this flow is
 * dangerous — a wrong figure is simply edited — so the only real risk is a
 * forgotten nozzle or tank, which the video says twice rather than dressing up
 * as a rule.
 *
 * The tables fill row by row inside a scene rather than cutting to a finished
 * one, because "one line per nozzle, one per tank" is the thing being taught and
 * a finished table shows the result instead of the habit.
 */

const TUT = TUTORIAL_BY_ID['admin-manual-shift-data'];

/** The browser is 1440 wide; the stage is 1920 minus padding and needs headroom. */
const FRAME_SCALE = 0.9;

const ACCENT = {
  portal: { fg: '#15803d', bg: '#f0fdf4', line: '#bbf7d0' },
  typed: { fg: '#2563eb', bg: '#eff6ff', line: '#bfdbfe' },
  missing: { fg: '#b91c1c', bg: '#fef2f2', line: '#fecaca' },
  warn: { fg: '#d97706', bg: '#fffbeb', line: '#fde68a' },
} as const;

type Accent = (typeof ACCENT)[keyof typeof ACCENT];

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/** Fade + rise, staggered by index — the whole series breathes this way. */
function reveal(local: number, index = 0, gap = 5): React.CSSProperties {
  const start = 3 + index * gap;
  const opacity = interpolate(local, [start, start + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(local, [start, start + 12], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return { opacity, transform: `translateY(${y}px)` };
}

function Panel({
  title,
  accent,
  width,
  children,
  local,
  index = 0,
}: {
  title?: string;
  accent: Accent;
  width?: number;
  children: React.ReactNode;
  local: number;
  index?: number;
}) {
  return (
    <div
      style={{
        ...reveal(local, index),
        width,
        background: colors.surface,
        border: `2px solid ${accent.line}`,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(15,23,42,0.07)',
      }}
    >
      {title ? (
        <div
          style={{
            padding: '12px 20px',
            background: accent.bg,
            borderBottom: `2px solid ${accent.line}`,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: accent.fg,
          }}
        >
          {title}
        </div>
      ) : null}
      <div style={{ padding: 20, fontSize: 24, lineHeight: 1.65, color: colors.text }}>
        {children}
      </div>
    </div>
  );
}

function Chip({
  text,
  tone,
  local,
  index = 0,
}: {
  text: string;
  tone: Accent;
  local: number;
  index?: number;
}) {
  return (
    <div
      style={{
        ...reveal(local, index),
        background: tone.bg,
        border: `2px solid ${tone.line}`,
        color: tone.fg,
        borderRadius: 999,
        padding: '10px 22px',
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {text}
    </div>
  );
}

function Arrow({ local, index = 0, label }: { local: number; index?: number; label?: string }) {
  return (
    <div
      style={{
        ...reveal(local, index),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        color: colors.textSubtle,
        flex: 'none',
      }}
    >
      {label ? <span style={{ fontSize: 18, fontWeight: 600 }}>{label}</span> : null}
      <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
        <path
          d="M2 10h46m0 0l-8-7m8 7l-8 7"
          stroke={colors.borderStrong}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Rule({
  n,
  head,
  body,
  accent,
  local,
  index,
}: {
  n: number;
  head: string;
  body: string;
  accent: Accent;
  local: number;
  index: number;
}) {
  return (
    <div
      style={{
        ...reveal(local, index, 7),
        flex: 1,
        background: colors.surface,
        border: `2px solid ${accent.line}`,
        borderRadius: 18,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 40,
          height: 40,
          borderRadius: 999,
          background: accent.bg,
          color: accent.fg,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent.fg }}>{head}</div>
      <div style={{ fontSize: 22, lineHeight: 1.6, color: colors.textMuted }}>{body}</div>
    </div>
  );
}

/* ───────────────────────────── the browser stage ─────────────────────────── */

function Portal({
  local,
  children,
  overlay,
  vault = 'IRAS Shift Data',
  ringOn,
  scrollY,
}: {
  local: number;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  vault?: 'IRAS Shift Data' | 'Daily Sales Report';
  ringOn?: 'IRAS Shift Data' | 'Daily Sales Report';
  /**
   * How far the page is scrolled. Three tables do not fit one screen once the
   * first is full, and the real page scrolls — so each scene scrolls to the
   * table it is talking about rather than shrinking all three to fit.
   */
  scrollY?: number;
}) {
  return (
    <BrowserFrame
      url="admin.mdgservices.in/dealers/16e01?tab=data-vault&vault=iras&day=2026-08-20"
      scale={FRAME_SCALE}
    >
      <AdminShell nav="Dealers" scrollY={scrollY}>
        {/* The dealer this tutorial exists for, not the series' sample outlet. */}
        <DealerHeader
          activeTab="Data Vault"
          tabs={DEALER_TABS_TODAY}
          name="Shree Balaji Fuels"
          code="16E01"
        />
        <div style={{ display: 'grid', gap: 12 }}>
          <VaultRail active={vault} ringOn={ringOn} local={local} />
          {children}
        </div>
      </AdminShell>
      {overlay}
    </BrowserFrame>
  );
}

/**
 * How many rows of a table are showing at frame `local`.
 *
 * The rows land one at a time over the first two-thirds of the scene, so the
 * viewer sees the repetition — one line per nozzle — rather than a table that
 * was always full.
 */
function filledBy(local: number, total: number, start = 20, per = 22): number {
  return Math.min(total, Math.max(0, Math.floor((local - start) / per) + 1));
}

const NONE: Record<GridCode, number> = { TOT: 0, STK: 0, REC: 0 };
const ALL: Record<GridCode, number> = {
  TOT: MANUAL_GRIDS.TOT.rows.length,
  STK: MANUAL_GRIDS.STK.rows.length,
  REC: MANUAL_GRIDS.REC.rows.length,
};

/* ─────────────────────────────── the stages ──────────────────────────────── */

const STAGE_SCALE: Record<string, number> = {
  intro: 1.04,
  normal: 1.06,
  gap: 1.06,
  rules: 1.06,
  recap: 1.16,
};

function stageFor(step: string, local: number): React.ReactNode {
  switch (step) {
    /* ── why this exists ───────────────────────────────────────────────── */
    case 'intro':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          <div style={{ ...ROW, gap: 22 }}>
            <Panel title="बाक़ी डीलर" accent={ACCENT.portal} width={520} local={local}>
              IRAS पोर्टल से डेटा अपने आप आता है
            </Panel>
            <Panel title="16E जैसे डीलर" accent={ACCENT.missing} width={520} local={local} index={2}>
              पोर्टल है ही नहीं — कुछ अपने आप नहीं आता
            </Panel>
          </div>
          <Chip
            text="रिपोर्ट दोनों को एक जैसी चाहिए"
            tone={ACCENT.typed}
            local={local}
            index={4}
          />
        </div>
      );

    case 'normal':
      return (
        <div style={{ ...ROW, gap: 16, flexWrap: 'wrap', maxWidth: 1500 }}>
          <Chip text="पोर्टल" tone={ACCENT.portal} local={local} />
          <Arrow local={local} index={1} />
          <Chip text="पंप रीडिंग · टैंक डिप · टैंकर" tone={ACCENT.portal} local={local} index={2} />
          <Arrow local={local} index={3} />
          <Chip text="DSR रिपोर्ट" tone={ACCENT.typed} local={local} index={4} />
        </div>
      );

    case 'gap':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ ...ROW, gap: 16, flexWrap: 'wrap', maxWidth: 1500 }}>
            <Chip text="पोर्टल ✕" tone={ACCENT.missing} local={local} />
            <Arrow local={local} index={1} />
            <Chip text="दिन ख़ाली" tone={ACCENT.missing} local={local} index={2} />
            <Arrow local={local} index={3} />
            <Chip text="रिपोर्ट नहीं बनेगी" tone={ACCENT.missing} local={local} index={4} />
          </div>
          <div style={{ ...reveal(local, 6) }}>
            <Chip
              text="हल — वही दिन हम ख़ुद खोलेंगे और भर देंगे"
              tone={ACCENT.typed}
              local={local}
              index={6}
            />
          </div>
        </div>
      );

    /* ── the walkthrough ───────────────────────────────────────────────── */
    case 'nav':
      return (
        <Portal local={local} ringOn="IRAS Shift Data">
          <EmptyDay />
        </Portal>
      );

    case 'empty':
      return (
        <Portal local={local}>
          <EmptyDay ringLocal={local} />
        </Portal>
      );

    case 'opened':
      // The button goes down, then the day is open with three empty tables.
      return local < 40 ? (
        <Portal local={local}>
          <EmptyDay ringLocal={local} pressed />
        </Portal>
      ) : (
        <Portal local={local}>
          <ManualDayGrids filled={NONE} />
        </Portal>
      );

    case 'tot':
      return (
        <Portal local={local}>
          <ManualDayGrids
            filled={{ ...NONE, TOT: filledBy(local, ALL.TOT, 18, 18) }}
            focus="TOT"
            ringLocal={local}
          />
        </Portal>
      );

    case 'stk':
      return (
        <Portal local={local} scrollY={250}>
          <ManualDayGrids
            filled={{ ...NONE, TOT: ALL.TOT, STK: filledBy(local, ALL.STK, 20, 34) }}
            focus="STK"
            ringLocal={local}
          />
        </Portal>
      );

    case 'rec':
      return (
        <Portal local={local} scrollY={430}>
          <ManualDayGrids
            filled={{ TOT: ALL.TOT, STK: ALL.STK, REC: filledBy(local, ALL.REC, 24, 40) }}
            focus="REC"
            ringLocal={local}
          />
        </Portal>
      );

    case 'review':
      return (
        <Portal local={local} overlay={<ReviewOverlay local={local} />}>
          <ManualDayGrids filled={ALL} />
        </Portal>
      );

    case 'generate':
      return (
        <Portal local={local} vault="Daily Sales Report" ringOn="Daily Sales Report">
          <GenerateCard
            mode="backdated"
            asOfDate="20-08-2026"
            dateFocused={local < 55}
            pressed={local > 55}
          />
        </Portal>
      );

    case 'report':
      return (
        <div style={{ ...reveal(local), width: 1400 }}>
          <DsrLedger rows={dsrRows(false)} fontSize={17} />
        </div>
      );

    /* ── the two things to remember ────────────────────────────────────── */
    case 'rules':
      return (
        <div style={{ ...ROW, gap: 26, alignItems: 'stretch', maxWidth: 1300 }}>
          <Rule
            n={1}
            head="जो भरा, वही गिना"
            body="हाथ से भरा आँकड़ा बिल्कुल वैसा ही चलता है — गोल नहीं होता, बदला नहीं जाता।"
            accent={ACCENT.typed}
            local={local}
            index={0}
          />
          <Rule
            n={2}
            head="कोई नोज़ल, कोई टैंक न छूटे"
            body="हर नोज़ल की एक लाइन, हर टैंक की एक लाइन। एक छूटा तो उस दिन का हिसाब कम बैठेगा।"
            accent={ACCENT.warn}
            local={local}
            index={1}
          />
        </div>
      );

    case 'recap':
    default:
      return (
        <div style={{ ...ROW, gap: 14, flexWrap: 'wrap', maxWidth: 1240 }}>
          <Chip text="1 · दिन खोलिए" tone={ACCENT.typed} local={local} />
          <Chip text="2 · पंप" tone={ACCENT.typed} local={local} index={1} />
          <Chip text="3 · टैंक" tone={ACCENT.typed} local={local} index={2} />
          <Chip text="4 · टैंकर" tone={ACCENT.typed} local={local} index={3} />
          <Chip text="5 · Apply" tone={ACCENT.portal} local={local} index={4} />
          <Chip text="6 · Generate" tone={ACCENT.warn} local={local} index={5} />
        </div>
      );
  }
}

/** The review dialog, centred over the dimmed page as the real one is. */
function ReviewOverlay({ local }: { local: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(15,23,42,0.35)',
      }}
    >
      <div style={{ ...reveal(local) }}>
        <ReviewDialog pressed={local > 150} />
      </div>
    </div>
  );
}

export function AdminManualShiftDataVideo({ sceneFrames, hasAudio }: TutorialProps) {
  const frame = useCurrentFrame();
  const frames =
    sceneFrames.length === TUT.scenes.length
      ? sceneFrames
      : TUT.scenes.map((s) => Math.round(s.estSeconds * VIDEO_LANDSCAPE.fps));

  const { index, local, length } = activeScene(frame, frames);
  const scene = TUT.scenes[index];
  const scale = STAGE_SCALE[scene.step] ?? 1;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY, background: admin.bg }}>
      <LandscapeShell
        title={TUT.title}
        subtitle={TUT.subtitle}
        index={index}
        count={TUT.scenes.length}
        progress={length ? local / length : 0}
        caption={scene.text}
        local={local}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          {stageFor(scene.step, local)}
        </div>
      </LandscapeShell>
      <AudioTrack tutorial={TUT} frames={frames} hasAudio={hasAudio} />
    </AbsoluteFill>
  );
}
