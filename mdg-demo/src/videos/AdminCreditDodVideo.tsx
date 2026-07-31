import * as React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { AudioTrack } from '../components/explainerChrome';
import { LandscapeShell, VIDEO_LANDSCAPE } from '../components/landscapeChrome';
import type { TutorialProps } from '../lib/calc';
import { activeScene } from '../lib/scene';
import { TUTORIAL_BY_ID } from '../narration';
import { colors, FONT_FAMILY } from '../theme';

/**
 * AdminCreditDod — the ADMIN concept explainer: what the Credit & DOD service
 * does and where the number comes from. Landscape, diagram-first, one bespoke
 * animated stage per scene (the same shape as PointsSystemVideo, but built on
 * the landscape chrome).
 *
 * Everything drawn here is the real mechanism, not a metaphor: the two SDMS
 * pages we read, the debit/credit ledger, the FIFO lots, the +3-working-days
 * roll, and the reconciliation check. An admin who has watched this can answer a
 * dealer's "why this number?" without opening the code.
 */

const TUT = TUTORIAL_BY_ID['admin-credit-dod'];

const ACCENT = {
  portal: { fg: '#2563eb', bg: '#eff6ff', line: '#bfdbfe' },
  ledger: { fg: '#7c3aed', bg: '#f5f3ff', line: '#ddd6fe' },
  due: { fg: '#b91c1c', bg: '#fef2f2', line: '#fecaca' },
  ok: { fg: '#15803d', bg: '#f0fdf4', line: '#bbf7d0' },
  warn: { fg: '#d97706', bg: '#fffbeb', line: '#fde68a' },
} as const;

type Accent = (typeof ACCENT)[keyof typeof ACCENT];

/**
 * Fade + rise, staggered by index, used by every stage so the whole video
 * breathes alike. Deliberately NOT a hook — `stageFor` is a plain switch, not a
 * component, so this has to be callable from anywhere.
 */
function reveal(local: number, index = 0, gap = 5): { opacity: number; transform: string } {
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
  const r = reveal(local, index);
  return (
    <div
      style={{
        ...r,
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
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 24,
        padding: '9px 0',
        borderBottom: `1px solid ${colors.border}`,
        fontSize: 22,
      }}
    >
      <span style={{ color: colors.textMuted }}>{label}</span>
      <span
        style={{
          fontWeight: strong ? 800 : 600,
          color: color ?? colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Arrow({ local, index = 0, label }: { local: number; index?: number; label?: string }) {
  const r = reveal(local, index);
  return (
    <div
      style={{
        ...r,
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

/** A dated purchase lot — the unit the FIFO engine reasons about. */
function Lot({
  date,
  amount,
  state,
  local,
  index,
}: {
  date: string;
  amount: string;
  state: 'open' | 'cleared' | 'due';
  local: number;
  index: number;
}) {
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: Math.max(0, local - (6 + index * 6)),
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  const tone =
    state === 'cleared' ? ACCENT.ok : state === 'due' ? ACCENT.due : ACCENT.ledger;
  return (
    <div
      style={{
        transform: `scale(${0.9 + pop * 0.1})`,
        opacity: pop,
        width: 232,
        background: tone.bg,
        border: `3px solid ${state === 'due' ? tone.fg : tone.line}`,
        borderRadius: 14,
        padding: '12px 14px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: tone.fg }}>{date}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: state === 'cleared' ? colors.textSubtle : colors.text,
          fontVariantNumeric: 'tabular-nums',
          textDecoration: state === 'cleared' ? 'line-through' : 'none',
        }}
      >
        {amount}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: tone.fg, marginTop: 2 }}>
        {state === 'cleared' ? 'चुक गया' : state === 'due' ? 'सबसे पुराना बचा' : 'बाक़ी'}
      </div>
    </div>
  );
}

function Big({
  eyebrow,
  value,
  note,
  accent,
  local,
  index = 0,
}: {
  eyebrow: string;
  value: string;
  note?: string;
  accent: Accent;
  local: number;
  index?: number;
}) {
  const r = reveal(local, index);
  return (
    <div
      style={{
        ...r,
        background: accent.bg,
        border: `3px solid ${accent.line}`,
        borderRadius: 18,
        padding: '20px 32px',
        textAlign: 'center',
        minWidth: 380,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.06em', color: accent.fg }}>
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 60,
          fontWeight: 800,
          color: accent.fg,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
          marginTop: 4,
        }}
      >
        {value}
      </div>
      {note ? (
        <div style={{ fontSize: 21, fontWeight: 600, color: colors.textMuted, marginTop: 6 }}>
          {note}
        </div>
      ) : null}
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
  const r = reveal(local, index);
  return (
    <div
      style={{
        ...r,
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

const ROW = { display: 'flex', alignItems: 'center', gap: 26, justifyContent: 'center' } as const;

/**
 * The stage is 1792×712 of usable canvas — far more than a diagram laid out at
 * comfortable reading sizes fills. Rather than inflate every font and box (and
 * re-tune them individually), each stage is composed at a natural size and then
 * scaled up as a whole. `STAGE_SCALE` overrides the default for the widest
 * stages, which would otherwise run past the edge.
 */
const DEFAULT_SCALE = 1.34;
const STAGE_SCALE: Record<string, number> = {
  'two-pages': 1.2,
  reconcile: 1.18,
  approval: 1.14,
  recap: 1.18,
  'due-date': 1.2,
  problem: 1.24,
};

function ScaledStage({ step, children }: { step: string; children: React.ReactNode }) {
  const scale = STAGE_SCALE[step] ?? DEFAULT_SCALE;
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
      {children}
    </div>
  );
}

function stageFor(step: string, local: number): React.ReactNode {
  switch (step) {
    case 'intro':
      return (
        <div style={{ ...ROW, gap: 34 }}>
          <Big
            eyebrow="DUE AMOUNT"
            value="₹8,03,960"
            note="कितना जमा करना है"
            accent={ACCENT.due}
            local={local}
          />
          <Big
            eyebrow="DUE DATE"
            value="16-07-2026"
            note="कब तक"
            accent={ACCENT.warn}
            local={local}
            index={1}
          />
        </div>
      );

    case 'problem':
      return (
        <div style={{ ...ROW, gap: 30 }}>
          <Panel title="डीलर के दो सवाल" accent={ACCENT.due} width={470} local={local}>
            <div style={{ fontSize: 26, fontWeight: 700, color: colors.text, lineHeight: 1.7 }}>
              1. कितना पैसा जमा करना है?
              <br />
              2. कब तक जमा करना है?
            </div>
          </Panel>
          <Arrow local={local} index={1} />
          <Panel title="SDMS पोर्टल" accent={ACCENT.portal} width={470} local={local} index={2}>
            <Row label="Current Credit Limit" value="₹60,00,000" />
            <Row label="Current Total Receivable" value="₹35,46,192" />
            <Row label="Payment Due Date" value="Not Available" color={ACCENT.due.fg} strong />
          </Panel>
        </div>
      );

    case 'login':
      return (
        <div style={{ ...ROW, gap: 22 }}>
          <Chip text="डीलर का SDMS लॉगिन" tone={ACCENT.portal} local={local} />
          <Arrow local={local} index={1} />
          <Chip text="कैप्चा — OCR ख़ुद पढ़ता है" tone={ACCENT.ledger} local={local} index={2} />
          <Arrow local={local} index={3} />
          <Chip text="≈ 1 मिनट" tone={ACCENT.warn} local={local} index={4} />
        </div>
      );

    case 'two-pages':
      return (
        <div style={{ ...ROW, gap: 30 }}>
          <Panel title="1 · CREDIT MONITORING" accent={ACCENT.portal} width={520} local={local}>
            <Row label="Risk category" value="3DD" />
            <Row label="Current Credit Limit" value="₹60,00,000" strong />
            <Row label="Current Total Receivable" value="₹35,46,192" strong />
          </Panel>
          <Panel
            title="2 · PAD STATEMENT"
            accent={ACCENT.ledger}
            width={520}
            local={local}
            index={2}
          >
            <Row label="02-07 · ख़रीद" value="+ ₹4,45,120" color={ACCENT.due.fg} />
            <Row label="03-07 · भुगतान" value="− ₹3,00,000" color={ACCENT.ok.fg} />
            <Row label="05-07 · ख़रीद" value="+ ₹8,12,440" color={ACCENT.due.fg} />
          </Panel>
        </div>
      );

    case 'ledger':
      return (
        <div style={{ ...ROW, gap: 30 }}>
          <Panel title="DEBIT · ख़रीद" accent={ACCENT.due} width={420} local={local}>
            <div style={{ fontSize: 30, fontWeight: 800, color: ACCENT.due.fg }}>बकाया बढ़ता है</div>
            <div style={{ fontSize: 22, color: colors.textMuted, marginTop: 8 }}>
              माल उठाया — पैसा देना बाक़ी
            </div>
          </Panel>
          <Panel title="CREDIT · भुगतान" accent={ACCENT.ok} width={420} local={local} index={2}>
            <div style={{ fontSize: 30, fontWeight: 800, color: ACCENT.ok.fg }}>बकाया घटता है</div>
            <div style={{ fontSize: 22, color: colors.textMuted, marginTop: 8 }}>
              पैसा जमा किया
            </div>
          </Panel>
        </div>
      );

    case 'fifo':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          <div style={{ ...ROW, gap: 18 }}>
            <Lot date="02-07" amount="₹4,45,120" state="cleared" local={local} index={0} />
            <Lot date="05-07" amount="₹8,12,440" state="open" local={local} index={1} />
            <Lot date="09-07" amount="₹6,20,000" state="open" local={local} index={2} />
          </div>
          <div
            style={{
              ...reveal(local, 4),
              fontSize: 26,
              fontWeight: 700,
              color: colors.textMuted,
            }}
          >
            भुगतान हमेशा सबसे पुराने लॉट से कटता है — पहले आया, पहले गया
          </div>
        </div>
      );

    case 'due-amount':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          <div style={{ ...ROW, gap: 18 }}>
            <Lot date="02-07" amount="₹4,45,120" state="cleared" local={local} index={0} />
            <Lot date="05-07" amount="₹8,03,960" state="due" local={local} index={1} />
            <Lot date="09-07" amount="₹6,20,000" state="open" local={local} index={2} />
          </div>
          <Big
            eyebrow="DUE AMOUNT"
            value="₹8,03,960.60"
            note="सिर्फ़ सबसे पुराना बचा हुआ लॉट — पूरा बकाया नहीं"
            accent={ACCENT.due}
            local={local}
            index={4}
          />
        </div>
      );

    case 'due-date':
      return (
        <div style={{ ...ROW, gap: 22 }}>
          <Chip text="लॉट की तारीख़ 13-07" tone={ACCENT.ledger} local={local} />
          <Arrow local={local} index={1} label="+3 दिन" />
          <Chip text="16-07" tone={ACCENT.portal} local={local} index={2} />
          <Arrow local={local} index={3} label="छुट्टी?" />
          <Panel accent={ACCENT.warn} width={430} local={local} index={4}>
            <div style={{ fontSize: 23, fontWeight: 700, color: colors.text, lineHeight: 1.6 }}>
              रविवार · दूसरा/चौथा शनिवार · बैंक छुट्टी
              <br />
              <span style={{ color: ACCENT.warn.fg }}>→ अगले काम वाले दिन खिसकती है</span>
            </div>
          </Panel>
        </div>
      );

    case 'reconcile':
      return (
        <div style={{ ...ROW, gap: 26 }}>
          <Panel title="हमारी गिनती (FIFO)" accent={ACCENT.ledger} width={430} local={local}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: colors.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ₹35,46,192.60
            </div>
          </Panel>
          <Chip text="=" tone={ACCENT.ok} local={local} index={1} />
          <Panel title="SDMS Total Receivable" accent={ACCENT.portal} width={430} local={local} index={2}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: colors.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ₹35,46,192.60
            </div>
          </Panel>
          <Chip text="✓ Reconciles" tone={ACCENT.ok} local={local} index={3} />
        </div>
      );

    case 'card':
      return (
        <div style={{ ...ROW, gap: 30 }}>
          <Panel title="CREDIT & DOD MONITORING · 5E01" accent={ACCENT.due} width={620} local={local}>
            <Row label="DUE AMOUNT" value="₹8,03,960.60" strong color={ACCENT.due.fg} />
            <Row label="DUE DATE" value="16-07-2026" strong />
            <Row label="CURRENT LIMIT" value="₹60,00,000.00" />
            <Row label="AVAILED LIMIT" value="₹35,46,192.60" />
            <Row label="AVAILABLE LIMIT" value="₹24,53,807.40" />
            <Row label="FORM OF LIMIT" value="DOD" />
          </Panel>
          <Panel accent={ACCENT.ok} width={400} local={local} index={2}>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.text, lineHeight: 1.7 }}>
              ऊपर — बकाया और तारीख़
              <br />
              बीच में — सीमा और खपत
              <br />
              नीचे — किस तरह की सीमा
            </div>
          </Panel>
        </div>
      );

    case 'approval':
      return (
        <div style={{ ...ROW, gap: 22 }}>
          <Chip text="रिपोर्ट बनी" tone={ACCENT.portal} local={local} />
          <Arrow local={local} index={1} />
          <Chip text="एडमिन ने देखी" tone={ACCENT.warn} local={local} index={2} />
          <Arrow local={local} index={3} />
          <Chip text="Share with dealer" tone={ACCENT.ok} local={local} index={4} />
          <Arrow local={local} index={5} />
          <Chip text="डीलर की चैट" tone={ACCENT.ok} local={local} index={6} />
        </div>
      );

    case 'recap':
    default:
      return (
        <div style={{ ...ROW, gap: 16, flexWrap: 'wrap', maxWidth: 1180 }}>
          <Chip text="1 · पोर्टल से खाता" tone={ACCENT.portal} local={local} />
          <Chip text="2 · FIFO से पुराना लॉट" tone={ACCENT.ledger} local={local} index={1} />
          <Chip text="3 · +3 काम के दिन" tone={ACCENT.warn} local={local} index={2} />
          <Chip text="4 · SDMS से मिलान" tone={ACCENT.ok} local={local} index={3} />
          <Chip text="5 · एडमिन की मंज़ूरी" tone={ACCENT.ok} local={local} index={4} />
        </div>
      );
  }
}

export function AdminCreditDodVideo({ sceneFrames, hasAudio }: TutorialProps) {
  const frame = useCurrentFrame();
  const frames =
    sceneFrames.length === TUT.scenes.length
      ? sceneFrames
      : TUT.scenes.map((s) => Math.round(s.estSeconds * VIDEO_LANDSCAPE.fps));

  const { index, local, length } = activeScene(frame, frames);
  const scene = TUT.scenes[index];

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <LandscapeShell
        title={TUT.title}
        subtitle={TUT.subtitle}
        index={index}
        count={TUT.scenes.length}
        progress={length ? local / length : 0}
        caption={scene.text}
        local={local}
      >
        <ScaledStage step={scene.step}>{stageFor(scene.step, local)}</ScaledStage>
      </LandscapeShell>
      <AudioTrack tutorial={TUT} frames={frames} hasAudio={hasAudio} />
    </AbsoluteFill>
  );
}
