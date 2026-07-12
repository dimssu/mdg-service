import * as React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import { audioPath } from '../lib/audio';
import type { TutorialProps } from '../lib/calc';
import { activeScene, sceneOffsets } from '../lib/scene';
import { TUTORIAL_BY_ID } from '../narration';
import { colors, FONT_FAMILY, VIDEO } from '../theme';

/**
 * PointsSystem — a concept explainer (not an app walkthrough). It teaches, in
 * simple Hindi, WHY points differ per work and HOW the four-factor formula works:
 *   points = (time ÷ ~5.4 min) × skill × effort × responsibility
 * skill/effort/responsibility are entered 0–100 and scaled to a multiplier. Each
 * scene draws an animated diagram stage instead of a mock phone screen.
 */

const TUT = TUTORIAL_BY_ID['points-system'];

const CAPTION_TOP = 1600;
const STAGE_TOP = 360;
const STAGE_BOTTOM = 1540;

const FACTORS = {
  time: { label: 'समय', accent: '#2563eb', soft: '#eff6ff', max: 2.2 },
  skill: { label: 'हुनर', accent: '#7c3aed', soft: '#f5f3ff', max: 2.2 },
  effort: { label: 'मेहनत', accent: '#d97706', soft: '#fffbeb', max: 1.5 },
  resp: { label: 'ज़िम्मेदारी', accent: '#0f766e', soft: '#f0fdfa', max: 1.8 },
} as const;
type FactorKey = keyof typeof FACTORS;

const skillMult = (v: number) => 1 + 1.2 * (v / 100);
const effortMult = (v: number) => 1 + 0.5 * (v / 100);
const respMult = (v: number) => 1 + 0.8 * (v / 100);
const fmtMult = (m: number) => `×${m.toFixed(1)}`;

/* ────────────────────────────── small animation helpers ─────────────────────────────── */

function useEnter(local: number, delay = 0) {
  const { fps } = useVideoConfig();
  const s = spring({ frame: local - delay, fps, config: { damping: 200 }, durationInFrames: 18 });
  return { opacity: s, y: interpolate(s, [0, 1], [24, 0]) };
}

function Rise({
  local,
  delay = 0,
  children,
  style,
}: {
  local: number;
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const e = useEnter(local, delay);
  return (
    <div style={{ opacity: e.opacity, transform: `translateY(${e.y}px)`, ...style }}>
      {children}
    </div>
  );
}

function countTo(local: number, target: number, from = 0, start = 6, end = 26) {
  return interpolate(local, [start, end], [from, target], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function fmtPts(n: number) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/* ────────────────────────────── shared UI pieces ─────────────────────────────── */

function ProgressBar({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 60px' }}>
      {Array.from({ length: count }).map((_, i) => {
        const fill = i < index ? 1 : i === index ? progress : 0;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background: colors.border,
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${fill * 100}%`, height: '100%', background: colors.brand }} />
          </div>
        );
      })}
    </div>
  );
}

function Header() {
  return (
    <div style={{ padding: '22px 60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: colors.brand,
            color: colors.textInverse,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          MDG
        </div>
        <span style={{ fontSize: 22, fontWeight: 600, color: colors.textMuted }}>MDG · समझें</span>
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, color: colors.text, letterSpacing: '-0.01em' }}>
        {TUT.title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 500, color: colors.textSubtle, marginTop: 6 }}>
        {TUT.subtitle}
      </div>
    </div>
  );
}

function Caption({ text, local }: { text: string; local: number }) {
  const opacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(local, [0, 8], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: CAPTION_TOP,
        width: VIDEO.width,
        height: VIDEO.height - CAPTION_TOP,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 70px',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          maxWidth: 920,
          textAlign: 'center',
          fontSize: 40,
          lineHeight: 1.4,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: STAGE_TOP,
        width: VIDEO.width,
        height: STAGE_BOTTOM - STAGE_TOP,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 70px',
      }}
    >
      {children}
    </div>
  );
}

function Pill({
  label,
  accent,
  soft,
  dim,
  big,
}: {
  label: string;
  accent: string;
  soft: string;
  dim?: boolean;
  big?: boolean;
}) {
  return (
    <div
      style={{
        background: dim ? colors.surface2 : soft,
        color: dim ? colors.textSubtle : accent,
        border: `2px solid ${dim ? colors.border : accent}`,
        borderRadius: 999,
        padding: big ? '16px 26px' : '12px 20px',
        fontSize: big ? 38 : 30,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        opacity: dim ? 0.5 : 1,
      }}
    >
      {label}
    </div>
  );
}

function Op({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span
      style={{
        fontSize: 34,
        fontWeight: 700,
        color: dim ? colors.textSubtle : colors.textMuted,
        opacity: dim ? 0.5 : 1,
      }}
    >
      {children}
    </span>
  );
}

/** The formula as a pill row. `highlight` emphasises one factor (dims the rest). */
function FormulaRow({ highlight, local }: { highlight?: FactorKey; local: number }) {
  const keys: FactorKey[] = ['time', 'skill', 'effort', 'resp'];
  return (
    <Rise local={local} delay={2}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          maxWidth: 940,
        }}
      >
        {keys.map((k, i) => (
          <React.Fragment key={k}>
            {i > 0 && <Op dim={!!highlight}>×</Op>}
            <Pill
              label={FACTORS[k].label}
              accent={FACTORS[k].accent}
              soft={FACTORS[k].soft}
              dim={!!highlight && highlight !== k}
            />
          </React.Fragment>
        ))}
        <Op>=</Op>
        <div
          style={{
            background: colors.brand,
            color: colors.textInverse,
            borderRadius: 999,
            padding: '12px 22px',
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          पॉइंट
        </div>
      </div>
    </Rise>
  );
}

/** 0–100 gauge with animated fill and the mapped multiplier. */
function Gauge({
  label,
  value,
  accent,
  soft,
  mult,
  local,
  delay = 0,
}: {
  label: string;
  value: number;
  accent: string;
  soft: string;
  mult: number;
  local: number;
  delay?: number;
}) {
  const grow = interpolate(local, [delay + 4, delay + 22], [0, value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shownMult = 1 + (mult - 1) * (grow / Math.max(value, 1));
  return (
    <Rise local={local} delay={delay} style={{ width: '100%', maxWidth: 820 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 700, color: colors.text }}>{label}</span>
        <span style={{ fontSize: 30, fontWeight: 700, color: accent }}>
          {Math.round(grow)} / 100 &nbsp;→&nbsp; {fmtMult(shownMult)}
        </span>
      </div>
      <div
        style={{
          height: 34,
          borderRadius: 999,
          background: soft,
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${grow}%`, height: '100%', background: accent, borderRadius: 999 }} />
      </div>
    </Rise>
  );
}

function ArrowUp({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20V5M12 5l-6 6M12 5l6 6"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ────────────────────────────── per-scene stages ─────────────────────────────── */

function TitleStage({ local }: { local: number }) {
  const keys: FactorKey[] = ['time', 'skill', 'effort', 'resp'];
  return (
    <Stage>
      <Rise local={local}>
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: 60,
            background: colors.brand,
            color: colors.textInverse,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 56,
          }}
        >
          <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>★</span>
          <span style={{ fontSize: 40, fontWeight: 700, marginTop: 8 }}>पॉइंट</span>
        </div>
      </Rise>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {keys.map((k, i) => (
          <Rise key={k} local={local} delay={10 + i * 5}>
            <Pill label={FACTORS[k].label} accent={FACTORS[k].accent} soft={FACTORS[k].soft} />
          </Rise>
        ))}
      </div>
    </Stage>
  );
}

function WorkCard({
  title,
  tag,
  tagColor,
  tagBg,
  accent,
}: {
  title: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  accent: string;
}) {
  return (
    <div
      style={{
        width: 380,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 24,
        padding: 30,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 28,
          margin: '0 auto 20px',
          background: accent,
          opacity: 0.14,
        }}
      />
      <div style={{ fontSize: 36, fontWeight: 700, color: colors.text, marginBottom: 16 }}>
        {title}
      </div>
      <div
        style={{
          display: 'inline-block',
          background: tagBg,
          color: tagColor,
          borderRadius: 999,
          padding: '8px 20px',
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        {tag}
      </div>
    </div>
  );
}

function ProblemStage({ local }: { local: number }) {
  return (
    <Stage>
      <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
        <Rise local={local} delay={2}>
          <WorkCard
            title="बिजली का काम"
            tag="मुश्किल"
            tagColor="#991b1b"
            tagBg="#fee2e2"
            accent="#7c3aed"
          />
        </Rise>
        <Rise local={local} delay={8}>
          <WorkCard
            title="गाड़ी पार्क कराना"
            tag="आसान"
            tagColor="#166534"
            tagBg="#dcfce7"
            accent="#2563eb"
          />
        </Rise>
      </div>
      <Rise local={local} delay={18} style={{ marginTop: 50 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: 999,
            padding: '16px 32px',
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 700, color: '#991b1b' }}>बराबर पॉइंट?</span>
          <span style={{ fontSize: 40, fontWeight: 800, color: colors.danger }}>✗</span>
        </div>
      </Rise>
    </Stage>
  );
}

function IdeaStage({ local }: { local: number }) {
  const pts = Math.round(countTo(local, 15, 2, 8, 30));
  return (
    <Stage>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <Rise local={local} delay={2}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: 999,
                background: colors.brandSoft,
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 60,
                fontWeight: 700,
              }}
            >
              र
            </div>
            <span style={{ fontSize: 30, fontWeight: 600, color: colors.textMuted }}>योद्धा</span>
          </div>
        </Rise>
        <Rise local={local} delay={8}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span
              style={{ fontSize: 30, fontWeight: 700, color: colors.textSubtle, marginBottom: 8 }}
            >
              मुश्किल काम
            </span>
            <Op>→</Op>
          </div>
        </Rise>
        <Rise local={local} delay={12}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <ArrowUp color={colors.success} size={54} />
            <div
              style={{
                background: colors.brand,
                color: colors.textInverse,
                borderRadius: 28,
                padding: '20px 34px',
                fontSize: 68,
                fontWeight: 800,
              }}
            >
              {pts}
            </div>
            <span style={{ fontSize: 30, fontWeight: 600, color: colors.success }}>
              ज़्यादा पॉइंट
            </span>
          </div>
        </Rise>
      </div>
    </Stage>
  );
}

function FormulaStage({
  local,
  highlight,
  note,
}: {
  local: number;
  highlight?: FactorKey;
  note?: React.ReactNode;
}) {
  return (
    <Stage>
      <FormulaRow highlight={highlight} local={local} />
      {note ? (
        <div style={{ marginTop: 64, width: '100%', display: 'flex', justifyContent: 'center' }}>
          {note}
        </div>
      ) : null}
    </Stage>
  );
}

function TimeNote({ local }: { local: number }) {
  const bars = [
    { label: '5 मिनट', w: 26 },
    { label: '30 मिनट', w: 100 },
  ];
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      {bars.map((b, i) => (
        <Rise key={b.label} local={local} delay={10 + i * 6} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ width: 220, fontSize: 32, fontWeight: 700, color: colors.text }}>
              {b.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 40,
                borderRadius: 12,
                background: '#eff6ff',
                border: '1px solid #dbeafe',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: `${b.w}%`, height: '100%', background: '#2563eb' }} />
            </div>
          </div>
        </Rise>
      ))}
      <Rise local={local} delay={24} style={{ textAlign: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 600, color: colors.textMuted }}>
          ज़्यादा मिनट = बड़ा काम
        </span>
      </Rise>
    </div>
  );
}

const EXAMPLES = [
  { name: 'बिजली का काम', t: '20म', s: 85, e: 40, r: 80, pts: 15, accent: '#7c3aed' },
  { name: 'गाड़ी पार्क कराना', t: '2म', s: 5, e: 30, r: 15, pts: 0.5, accent: '#2563eb' },
];

function ExampleStage({ local }: { local: number }) {
  return (
    <Stage>
      {EXAMPLES.map((ex, i) => {
        const pts = countTo(local, ex.pts, 0, 8 + i * 3, 28 + i * 3);
        const chips = [
          { v: ex.t, c: FACTORS.time.accent, b: FACTORS.time.soft },
          { v: ex.s, c: FACTORS.skill.accent, b: FACTORS.skill.soft },
          { v: ex.e, c: FACTORS.effort.accent, b: FACTORS.effort.soft },
          { v: ex.r, c: FACTORS.resp.accent, b: FACTORS.resp.soft },
        ];
        return (
          <Rise
            key={ex.name}
            local={local}
            delay={2 + i * 6}
            style={{ width: '100%', maxWidth: 900, marginBottom: 30 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 24,
                padding: '24px 28px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 34, fontWeight: 700, color: colors.text, marginBottom: 16 }}
                >
                  {ex.name}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {chips.map((c, j) => (
                    <span
                      key={j}
                      style={{
                        background: c.b,
                        color: c.c,
                        border: `1.5px solid ${c.c}`,
                        borderRadius: 12,
                        padding: '8px 16px',
                        fontSize: 26,
                        fontWeight: 700,
                      }}
                    >
                      {c.v}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    background: colors.brand,
                    color: colors.textInverse,
                    borderRadius: 22,
                    padding: '14px 28px',
                    fontSize: 56,
                    fontWeight: 800,
                    minWidth: 130,
                    textAlign: 'center',
                  }}
                >
                  {fmtPts(pts)}
                </div>
                <span
                  style={{ fontSize: 24, fontWeight: 600, color: colors.textSubtle, marginTop: 8 }}
                >
                  पॉइंट
                </span>
              </div>
            </div>
          </Rise>
        );
      })}
    </Stage>
  );
}

/** The config card used by `configure` and `effect`. `respValue`/`pts` animate. */
function ConfigCard({ respValue, pts, bump }: { respValue: number; pts: number; bump?: boolean }) {
  const rows = [
    { key: 'time' as const, label: 'समय', text: '60 मिनट', v: 100 },
    { key: 'skill' as const, label: 'हुनर', text: '5', v: 5 },
    { key: 'effort' as const, label: 'मेहनत', text: '60', v: 60 },
    {
      key: 'resp' as const,
      label: 'ज़िम्मेदारी',
      text: String(Math.round(respValue)),
      v: respValue,
      live: true,
    },
  ];
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 860,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 28,
        padding: 34,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 26,
        }}
      >
        <span style={{ fontSize: 38, fontWeight: 700, color: colors.text }}>टॉयलेट की सफ़ाई</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div
            style={{
              background: bump ? '#f0fdf4' : colors.brandSoft,
              color: bump ? '#166534' : colors.text,
              border: `2px solid ${bump ? '#86efac' : 'transparent'}`,
              borderRadius: 18,
              padding: '10px 24px',
              fontSize: 52,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {bump ? <ArrowUp color="#16a34a" size={34} /> : null}
            {fmtPts(pts)}
          </div>
          <span style={{ fontSize: 24, fontWeight: 600, color: colors.textSubtle, marginTop: 6 }}>
            पॉइंट
          </span>
        </div>
      </div>
      {rows.map((r) => {
        const f = FACTORS[r.key];
        return (
          <div
            key={r.key}
            style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}
          >
            <span style={{ width: 210, fontSize: 30, fontWeight: 600, color: colors.textMuted }}>
              {f.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 26,
                borderRadius: 999,
                background: f.soft,
                border: `1px solid ${colors.border}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${r.v}%`,
                  height: '100%',
                  background: f.accent,
                  borderRadius: 999,
                }}
              />
            </div>
            <span
              style={{
                width: 130,
                textAlign: 'right',
                fontSize: 30,
                fontWeight: 700,
                color: r.live && bump ? '#16a34a' : colors.text,
              }}
            >
              {r.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ConfigureStage({ local }: { local: number }) {
  return (
    <Stage>
      <Rise
        local={local}
        delay={2}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <ConfigCard respValue={15} pts={17} />
      </Rise>
    </Stage>
  );
}

function EffectStage({ local }: { local: number }) {
  // Responsibility slides 15 → 60; points climb 17 → 23.
  const resp = interpolate(local, [10, 30], [15, 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pts = interpolate(local, [10, 30], [17, 23], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bumped = local > 14;
  return (
    <Stage>
      <Rise
        local={local}
        delay={2}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <ConfigCard respValue={resp} pts={pts} bump={bumped} />
      </Rise>
    </Stage>
  );
}

function NewWorkStage({ local }: { local: number }) {
  const fields = [
    { label: 'काम का नाम', text: 'नया काम…', filled: false },
    { label: 'समय (मिनट)', text: 'ज़रूरी', req: true },
    { label: 'हुनर (0–100)', text: 'ज़रूरी', req: true },
    { label: 'मेहनत (0–100)', text: 'ज़रूरी', req: true },
    { label: 'ज़िम्मेदारी (0–100)', text: 'ज़रूरी', req: true },
  ];
  return (
    <Stage>
      <Rise local={local} delay={2} style={{ width: '100%', maxWidth: 860 }}>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 28,
            padding: 34,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 999,
                background: colors.brand,
                color: colors.textInverse,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              +
            </div>
            <span style={{ fontSize: 36, fontWeight: 700, color: colors.text }}>
              नया काम जोड़ें
            </span>
          </div>
          {fields.map((f, i) => (
            <Rise key={f.label} local={local} delay={8 + i * 3} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span
                  style={{ width: 320, fontSize: 28, fontWeight: 600, color: colors.textMuted }}
                >
                  {f.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 14,
                    border: `1.5px solid ${f.req ? '#fca5a5' : colors.border}`,
                    background: f.req ? '#fef2f2' : colors.surface2,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 18px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: f.req ? '#b91c1c' : colors.textSubtle,
                    }}
                  >
                    {f.text}
                  </span>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </Rise>
    </Stage>
  );
}

function RecapStage({ local }: { local: number }) {
  const keys: FactorKey[] = ['time', 'skill', 'effort', 'resp'];
  return (
    <Stage>
      <div
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 48,
        }}
      >
        {keys.map((k, i) => (
          <Rise key={k} local={local} delay={2 + i * 4}>
            <Pill label={FACTORS[k].label} accent={FACTORS[k].accent} soft={FACTORS[k].soft} big />
          </Rise>
        ))}
      </div>
      <Rise local={local} delay={22}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: 999,
            padding: '18px 36px',
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 700, color: '#166534' }}>
            कभी भी बदल सकते हैं
          </span>
        </div>
      </Rise>
    </Stage>
  );
}

function stageFor(step: string, local: number): React.ReactNode {
  switch (step) {
    case 'title':
      return <TitleStage local={local} />;
    case 'problem':
      return <ProblemStage local={local} />;
    case 'idea':
      return <IdeaStage local={local} />;
    case 'formula':
      return <FormulaStage local={local} />;
    case 'time':
      return <FormulaStage local={local} highlight="time" note={<TimeNote local={local} />} />;
    case 'skill':
      return (
        <FormulaStage
          local={local}
          highlight="skill"
          note={
            <Gauge
              label="हुनर"
              value={85}
              accent={FACTORS.skill.accent}
              soft={FACTORS.skill.soft}
              mult={skillMult(85)}
              local={local}
              delay={10}
            />
          }
        />
      );
    case 'effort':
      return (
        <FormulaStage
          local={local}
          highlight="effort"
          note={
            <Gauge
              label="मेहनत"
              value={60}
              accent={FACTORS.effort.accent}
              soft={FACTORS.effort.soft}
              mult={effortMult(60)}
              local={local}
              delay={10}
            />
          }
        />
      );
    case 'resp':
      return (
        <FormulaStage
          local={local}
          highlight="resp"
          note={
            <Gauge
              label="ज़िम्मेदारी"
              value={80}
              accent={FACTORS.resp.accent}
              soft={FACTORS.resp.soft}
              mult={respMult(80)}
              local={local}
              delay={10}
            />
          }
        />
      );
    case 'example':
      return <ExampleStage local={local} />;
    case 'configure':
      return <ConfigureStage local={local} />;
    case 'effect':
      return <EffectStage local={local} />;
    case 'newwork':
      return <NewWorkStage local={local} />;
    case 'recap':
      return <RecapStage local={local} />;
    default:
      return <TitleStage local={local} />;
  }
}

export function PointsSystemVideo({ sceneFrames, hasAudio }: TutorialProps) {
  const frame = useCurrentFrame();
  const frames =
    sceneFrames.length === TUT.scenes.length
      ? sceneFrames
      : TUT.scenes.map((s) => Math.round(s.estSeconds * VIDEO.fps));

  const { index, local, length } = activeScene(frame, frames);
  const scene = TUT.scenes[index];
  const offsets = sceneOffsets(frames);

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        background: `radial-gradient(120% 80% at 50% 0%, #ffffff 0%, ${colors.bg} 45%, #eef0f4 100%)`,
      }}
    >
      <div style={{ paddingTop: 46 }}>
        <ProgressBar
          index={index}
          count={TUT.scenes.length}
          progress={length ? local / length : 0}
        />
      </div>
      <Header />

      {stageFor(scene.step, local)}

      <Caption text={scene.text} local={local} />

      {TUT.scenes.map((s, i) =>
        hasAudio[i] ? (
          <Sequence
            key={s.id}
            from={offsets[i]}
            durationInFrames={frames[i]}
            name={`voice:${s.id}`}
          >
            <Audio src={staticFile(audioPath(TUT.id, s.id))} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
}
