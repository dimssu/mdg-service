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
  CORRECTED_DATE,
  DEALER_TABS_TODAY,
  DealerHeader,
  DSR_PRODUCTS,
  DsrLedger,
  DsrReceiptsDialog,
  DsrSaveToast,
  DsrTab,
  dsrRows,
} from '../screens/admin';
import { colors, FONT_FAMILY } from '../theme';

/**
 * AdminDsrReceipts — how to correct a Receipt by hand, and what that changes.
 *
 * Deliberately half explainer, half walkthrough. An admin cannot use this
 * feature safely knowing only which buttons to press: the receipt is the one
 * figure on the DSR that nobody measures, and changing a past one invalidates
 * every report after it. So scenes 1–3 make the case, the middle drives the
 * portal, and the last three state the rules that keep the correction honest.
 *
 * Ring highlights are drawn by the mocked screens themselves (`RingOverlay`),
 * not by measured coordinates, so a layout change in `screens/admin` cannot
 * leave a pulse hovering over empty background.
 */

const TUT = TUTORIAL_BY_ID['admin-dsr-receipts'];

/** The browser is 1440 wide; the stage is 1920 minus padding and needs headroom. */
const FRAME_SCALE = 0.9;

/**
 * Frame the `save` scene cuts from "clicking Save" to "the dialog has closed and
 * the toast is up". A fixed count, not a fraction of the scene: the scene is
 * sized to its voiceover and is never shorter than ten seconds, so three is
 * always a beat rather than a flash.
 */
const SAVE_BEAT = 90;

const ACCENT = {
  measured: { fg: '#15803d', bg: '#f0fdf4', line: '#bbf7d0' },
  typed: { fg: '#2563eb', bg: '#eff6ff', line: '#bfdbfe' },
  wrong: { fg: '#b91c1c', bg: '#fef2f2', line: '#fecaca' },
  warn: { fg: '#d97706', bg: '#fffbeb', line: '#fde68a' },
} as const;

type Accent = (typeof ACCENT)[keyof typeof ACCENT];

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
      <div style={{ padding: 20 }}>{children}</div>
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
  return (
    <div
      style={{
        ...reveal(local, index),
        background: accent.bg,
        border: `3px solid ${accent.line}`,
        borderRadius: 18,
        padding: '18px 30px',
        textAlign: 'center',
        minWidth: 340,
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.06em', color: accent.fg }}>
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 54,
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
        <div style={{ fontSize: 20, fontWeight: 600, color: colors.textMuted, marginTop: 6 }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}

const ROW = { display: 'flex', alignItems: 'center', gap: 26, justifyContent: 'center' } as const;

/** A numbered rule card for the closing scenes. */
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
        ...reveal(local, index),
        width: 420,
        background: colors.surface,
        border: `2px solid ${accent.line}`,
        borderRadius: 18,
        padding: '18px 22px',
        boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: accent.bg,
          color: accent.fg,
          fontSize: 22,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 25, fontWeight: 800, color: colors.text, marginTop: 10 }}>
        {head}
      </div>
      <div style={{ fontSize: 21, color: colors.textMuted, marginTop: 6, lineHeight: 1.5 }}>
        {body}
      </div>
    </div>
  );
}

/* ─────────────────────────────── portal scenes ───────────────────────────── */

interface PortalProps {
  local: number;
  url?: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  scrollY?: number;
}

function Portal({ local, url, children, overlay, scrollY }: PortalProps) {
  return (
    <BrowserFrame
      url={url ?? 'admin.mdgservices.in/dealers/5e01?tab=data-vault&vault=dsr'}
      scale={FRAME_SCALE}
    >
      <AdminShell nav="Dealers" scrollY={scrollY}>
        <DealerHeader activeTab="Data Vault" tabs={DEALER_TABS_TODAY} />
        {children}
      </AdminShell>
      {overlay}
    </BrowserFrame>
  );
}

/* ─────────────────────────────── the stages ──────────────────────────────── */

/**
 * Each stage is composed at a natural reading size and scaled as a whole, so a
 * layout tweak never means re-tuning a dozen font sizes. The ledger stages sit
 * at 1 because the table is already near the stage's width.
 */
const STAGE_SCALE: Record<string, number> = {
  intro: 1,
  why: 1.06,
  impact: 1.1,
  rules: 1.06,
  safety: 1.1,
  recap: 1.2,
};

function stageFor(step: string, local: number): React.ReactNode {
  switch (step) {
    /* ── why the receipt is different ─────────────────────────────────── */
    case 'intro':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ ...reveal(local), width: 1290 }}>
            <DsrLedger rows={dsrRows(false)} emphasise="RECEIPT" fontSize={17} />
          </div>
          <div style={{ ...ROW, gap: 18 }}>
            <Chip text="डिप · रीडिंग · टेस्टिंग — मशीन से" tone={ACCENT.measured} local={local} index={2} />
            <Chip text="RECEIPT — इंसान की एंट्री से" tone={ACCENT.typed} local={local} index={3} />
          </div>
        </div>
      );

    case 'why':
      return (
        <div style={{ ...ROW, gap: 28 }}>
          <Big
            eyebrow="IRAS पोर्टल"
            value="0 L"
            note={`${CORRECTED_DATE} का receipt`}
            accent={ACCENT.wrong}
            local={local}
          />
          <Arrow local={local} index={1} label="पर असल में?" />
          <Big
            eyebrow="टैंकर से उतरा"
            value="3,933 L"
            note="एंट्री पोर्टल में हुई ही नहीं"
            accent={ACCENT.measured}
            local={local}
            index={2}
          />
        </div>
      );

    case 'impact':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ ...ROW, gap: 24 }}>
            <Panel title="ग़लत हो जाता है" accent={ACCENT.wrong} width={560} local={local}>
              <div style={{ fontSize: 25, fontWeight: 700, color: colors.text, lineHeight: 1.7 }}>
                • उसी दिन का <b>Total stock</b>
                <br />• उसके बाद की <b>हर</b> रिपोर्ट का <b>Variation</b>
              </div>
            </Panel>
            <Panel title="सुरक्षित रहता है" accent={ACCENT.measured} width={560} local={local} index={2}>
              <div style={{ fontSize: 25, fontWeight: 700, color: colors.text, lineHeight: 1.7 }}>
                • <b>Sales</b> — सिर्फ़ मीटर से बनती है
                <br />• <b>Cumulative</b> — sales का जोड़
              </div>
            </Panel>
          </div>
          <div
            style={{
              ...reveal(local, 4),
              fontSize: 24,
              fontWeight: 700,
              color: colors.textMuted,
            }}
          >
            Variation = पिछली जाँच से अब तक के सारे receipt का जोड़ — इसीलिए असर आगे तक जाता है
          </div>
        </div>
      );

    /* ── the portal ───────────────────────────────────────────────────── */
    case 'nav':
      return (
        <Portal local={local}>
          <DsrTab local={local} ring="dataset" />
        </Portal>
      );

    case 'open':
      return (
        <Portal local={local}>
          <DsrTab local={local} ring="receipts" />
        </Portal>
      );

    case 'dialog':
      return (
        <Portal
          local={local}
          overlay={<DsrReceiptsDialog products={DSR_PRODUCTS.blank()} />}
        >
          <DsrTab />
        </Portal>
      );

    case 'enter':
      return (
        <Portal
          local={local}
          overlay={<DsrReceiptsDialog products={DSR_PRODUCTS.typing()} />}
        >
          <DsrTab />
        </Portal>
      );

    case 'save':
      // Two beats in one scene, because that is what actually happens: the
      // click, then the dialog closing onto the toast. Showing the toast over
      // the open dialog would have covered the very button being pressed — the
      // real toast is bottom-right, and the real dialog closes on save.
      return local < SAVE_BEAT ? (
        <Portal
          local={local}
          overlay={<DsrReceiptsDialog products={DSR_PRODUCTS.typing()} savePressed />}
        >
          <DsrTab />
        </Portal>
      ) : (
        <Portal local={local} overlay={<DsrSaveToast />}>
          <DsrTab />
        </Portal>
      );

    case 'stale':
      return (
        <Portal local={local}>
          <DsrTab stale local={local} ring="stale" />
        </Portal>
      );

    case 'regenerate':
      return (
        <Portal local={local}>
          <DsrTab stale regenerating regeneratePressed local={local} ring="regenerate" />
        </Portal>
      );

    case 'after':
      // Scrolled just far enough to land the whole 7-day sheet AND the "M"
      // legend under it — the legend is what the narration ends on.
      return (
        <Portal local={local} scrollY={178}>
          <DsrTab corrected />
        </Portal>
      );

    /* ── the rules ────────────────────────────────────────────────────── */
    case 'rules':
      return (
        <div style={{ ...ROW, gap: 22, alignItems: 'stretch' }}>
          <Rule
            n={1}
            head="जगह लेता है, जुड़ता नहीं"
            body="हाथ से भरा आँकड़ा IRAS वाले को हटा देता है। बाद में पोर्टल में एंट्री हो भी जाए, तो दो बार नहीं गिना जाएगा।"
            accent={ACCENT.typed}
            local={local}
            index={0}
          />
          <Rule
            n={2}
            head="शून्य भी एक जवाब है"
            body="पोर्टल में ग़लती से एंट्री हो गई हो तो 0 भरिए — यह भी एक असली सुधार है, ख़ाली छोड़ना नहीं।"
            accent={ACCENT.warn}
            local={local}
            index={1}
          />
          <Rule
            n={3}
            head="ख़ाली = वापस IRAS"
            body="खाना ख़ाली कर देंगे तो सुधार हट जाता है और उस दिन फिर से पोर्टल का आँकड़ा चलने लगता है।"
            accent={ACCENT.measured}
            local={local}
            index={2}
          />
        </div>
      );

    case 'safety':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ ...ROW, gap: 24 }}>
            <Panel title="बंद दिन में बदलते हैं" accent={ACCENT.typed} width={520} local={local}>
              <div style={{ fontSize: 26, fontWeight: 700, color: colors.text, lineHeight: 1.7 }}>
                Receipt · Total stock
              </div>
            </Panel>
            <Panel title="जैसे थे वैसे ही रहते हैं" accent={ACCENT.measured} width={520} local={local} index={2}>
              <div style={{ fontSize: 26, fontWeight: 700, color: colors.text, lineHeight: 1.7 }}>
                Sales · Cumulative · Dip · Reading
              </div>
            </Panel>
          </div>
          <div style={{ ...reveal(local, 4) }}>
            <Chip
              text="हर बदलाव Activity log में — किसने, कब, कितना"
              tone={ACCENT.warn}
              local={local}
              index={4}
            />
          </div>
        </div>
      );

    case 'recap':
    default:
      return (
        <div style={{ ...ROW, gap: 14, flexWrap: 'wrap', maxWidth: 1180 }}>
          <Chip text="1 · Receipts खोलिए" tone={ACCENT.typed} local={local} />
          <Chip text="2 · तारीख़ चुनिए" tone={ACCENT.typed} local={local} index={1} />
          <Chip text="3 · असली लीटर भरिए" tone={ACCENT.measured} local={local} index={2} />
          <Chip text="4 · Save receipts" tone={ACCENT.measured} local={local} index={3} />
          <Chip text="5 · Regenerate" tone={ACCENT.warn} local={local} index={4} />
        </div>
      );
  }
}

export function AdminDsrReceiptsVideo({ sceneFrames, hasAudio }: TutorialProps) {
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
