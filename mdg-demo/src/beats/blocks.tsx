import * as React from 'react';

import type { Lang } from '../marketing/film';

import { FAMILY, PHOTOGRAPHS, toneOf } from './families';
import { BANDS } from './layout';
import { countProgress, densityScale, enterDirection, rise, stagger } from './motion';
import {
  type BeatArgs,
  type Bi,
  type CommonBlock,
  type PhotoBlock,
  type Side,
  pick,
} from './types';

/**
 * The block renderers.
 *
 * Every one takes `BeatArgs` and its own data, and NOTHING else — no children,
 * no style prop, no access to the current frame. A block that could read
 * `useCurrentFrame()` could desync from the beat it belongs to; a block that
 * accepted `style` would let one video quietly stop looking like the others,
 * which is the whole failure this system exists to prevent.
 *
 * They are grouped in one file on purpose while there are nine of them. Twelve
 * files of forty lines each is a directory you have to hold in your head to
 * read; one file you can scroll is not. It splits when a block outgrows a
 * screenful, and `document`, `appScreen` and `portalScreen` will each do that
 * because they carry registries.
 */

type Args = BeatArgs & { lang: Lang };

/* ── shared bits ─────────────────────────────────────────────────────────── */

function Rise({
  a,
  delay = 0,
  children,
  style,
}: {
  a: Args;
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const emphasis = 'normal';
  const r = rise(a.local, delay, emphasis);
  // Alternating entrance direction by beat index. `marketing/chrome.tsx` already
  // does this for its camera moves and says why: two consecutive shots moving
  // the same way read as one long shot, and the cut between them disappears.
  const dir = enterDirection(a.index);
  return (
    <div style={{ opacity: r.opacity, transform: `translateY(${r.y * dir}px)`, ...style }}>
      {children}
    </div>
  );
}

/** The white card the social family floats on its photograph. */
function Sheet({
  a,
  children,
  pad = 34,
  style,
}: {
  a: Args;
  children: React.ReactNode;
  pad?: number;
  style?: React.CSSProperties;
}) {
  const f = FAMILY[a.family];
  // A card floating on a photograph needs a heavy shadow to separate itself from
  // it. A card on paper does not — there it reads as a bruise, and a hairline
  // does the same job for nothing.
  const onPhoto = PHOTOGRAPHS && f.broll;
  return (
    <div
      style={{
        borderRadius: onPhoto ? 28 : 22,
        padding: pad,
        background: f.surface,
        color: f.ink,
        border: onPhoto ? 'none' : `1px solid ${f.hairline}`,
        boxShadow: onPhoto
          ? '0 2px 4px rgba(16,17,51,.06), 0 24px 48px -20px rgba(16,17,51,.28)'
          : '0 1px 2px rgba(15,23,42,.04)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const Stack = ({ gap = 18, children }: { gap?: number; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, width: '100%' }}>{children}</div>
);

/* ── title ───────────────────────────────────────────────────────────────── */

/**
 * What replaced the header bar.
 *
 * The old chrome spent every frame of a three-minute video telling you its
 * title. This says the same thing once, at four times the size, for two seconds
 * — which is both better typography and the only form that survives being
 * re-posted as a clip with no page around it. It is also the frame the guide
 * site cuts its poster from.
 */
export function TitleBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'title' }> }) {
  const f = FAMILY[a.family];
  const big = a.family === 'admin' ? 64 : 82;
  return (
    <Stack gap={16}>
      {b.eyebrow ? (
        <Rise a={a}>
          <div
            style={{
              fontFamily: f.body,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: a.family === 'social' ? f.accentInk : f.inkFaint,
            }}
          >
            {pick(b.eyebrow, a.lang)}
          </div>
        </Rise>
      ) : null}
      <Rise a={a} delay={4}>
        <div
          style={{
            fontFamily: f.display,
            fontSize: big,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: f.ink,
          }}
        >
          {pick(b.headline, a.lang)}
        </div>
      </Rise>
      {b.sub ? (
        <Rise a={a} delay={9}>
          <div style={{ fontFamily: f.body, fontSize: 34, lineHeight: 1.35, color: f.inkSoft }}>
            {pick(b.sub, a.lang)}
          </div>
        </Rise>
      ) : null}
      <Rise a={a} delay={12}>
        <div
          style={{
            height: 6,
            width: 120,
            borderRadius: 999,
            background: f.accent,
          }}
        />
      </Rise>
    </Stack>
  );
}

/* ── chapter ─────────────────────────────────────────────────────────────── */

export function ChapterBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'chapter' }> }) {
  const f = FAMILY[a.family];
  return (
    <Rise a={a}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div
          style={{
            fontFamily: f.display,
            fontSize: 140,
            fontWeight: 700,
            lineHeight: 1,
            color: a.family === 'social' ? f.accentInk : toneOf(a.family, 'brand').fg,
          }}
        >
          {b.n}
        </div>
        <div style={{ fontFamily: f.display, fontSize: 54, fontWeight: 700, color: f.ink }}>
          {pick(b.label, a.lang)}
        </div>
      </div>
    </Rise>
  );
}

/* ── claim ───────────────────────────────────────────────────────────────── */

/** A dot field. `StageLoad`'s 45-dot grid, generalised. */
function Dots({
  total,
  filled,
  fg,
  bg,
}: {
  total: number;
  filled: number;
  fg: string;
  bg: string;
}) {
  const cols = Math.ceil(Math.sqrt(total * 1.6));
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10,
        width: '100%',
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: '1',
            borderRadius: 999,
            background: i < filled ? fg : bg,
            opacity: i < filled ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

/** A bar with a bracket marking the allowed band. `StageVariation`, generalised. */
function Bar({
  value,
  limit,
  fg,
  ok,
  track,
}: {
  value: number;
  limit: number;
  fg: string;
  ok: string;
  track: string;
}) {
  const span = Math.max(value, limit) * 1.15 || 1;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', height: 46, borderRadius: 12, background: track }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${(limit / span) * 100}%`,
            borderRadius: 12,
            background: ok,
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 0,
            height: 26,
            width: `${(value / span) * 100}%`,
            borderRadius: 8,
            background: fg,
          }}
        />
      </div>
    </div>
  );
}

/** A month grid with one day marked. `StageDeadlines`, generalised. */
function Calendar({ mark, fg, bg }: { mark: number; fg: string; bg: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, width: '100%' }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: '1',
            borderRadius: 8,
            background: i === mark - 1 ? fg : bg,
            opacity: i === mark - 1 ? 1 : 0.45,
          }}
        />
      ))}
    </div>
  );
}

/**
 * ONE figure.
 *
 * Two figures is a `compare`, and a figure the narration does not also say out
 * loud is forbidden — a viewer with the sound off and a viewer with it on must
 * come away with the same fact, and a number that only exists on screen fails
 * the first of them.
 */
export function ClaimBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'claim' }> }) {
  const f = FAMILY[a.family];
  const t = toneOf(a.family, b.tone ?? 'brand');
  const p = countProgress(a.local);
  const numeric = typeof b.figure.value === 'number';
  const shown =
    numeric && b.figure.countUp
      ? Math.round((b.figure.value as number) * p).toLocaleString('en-IN')
      : numeric
        ? (b.figure.value as number).toLocaleString('en-IN')
        : String(b.figure.value);
  const v = b.vizProps ?? {};

  return (
    <Sheet a={a} pad={40}>
      <Stack gap={22}>
        <Rise a={a}>
          <div
            style={{
              fontFamily: f.display,
              fontSize: 132,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: t.fg,
            }}
          >
            {b.figure.prefix ?? ''}
            {shown}
            {b.figure.suffix ? (
              <span style={{ fontSize: 62, marginLeft: 8 }}>{b.figure.suffix}</span>
            ) : null}
          </div>
        </Rise>
        <Rise a={a} delay={6}>
          <div style={{ fontFamily: f.body, fontSize: 38, fontWeight: 600, color: f.ink }}>
            {pick(b.label, a.lang)}
          </div>
        </Rise>
        {b.viz && b.viz !== 'none' ? (
          <Rise a={a} delay={10}>
            {b.viz === 'dots' ? (
              <Dots
                total={v.total ?? 45}
                filled={Math.round((v.filled ?? 0) * p)}
                fg={t.fg}
                bg={t.bg}
              />
            ) : b.viz === 'bar' ? (
              <Bar
                value={(v.value ?? 0) * p}
                limit={v.limit ?? 1}
                fg={t.fg}
                ok={toneOf(a.family, 'good').fg}
                track={t.bg}
              />
            ) : (
              <Calendar mark={v.mark ?? 1} fg={t.fg} bg={t.bg} />
            )}
          </Rise>
        ) : null}
        {b.note ? (
          <Rise a={a} delay={14}>
            <div style={{ fontFamily: f.body, fontSize: 28, color: f.inkFaint }}>
              {pick(b.note, a.lang)}
            </div>
          </Rise>
        ) : null}
      </Stack>
    </Sheet>
  );
}

/* ── compare ─────────────────────────────────────────────────────────────── */

function SideCard({ a, s, delay }: { a: Args; s: Side; delay: number }) {
  const f = FAMILY[a.family];
  const t = toneOf(a.family, s.tone ?? 'neutral');
  return (
    <Rise a={a} delay={delay} style={{ flex: 1, minWidth: 0 }}>
      <Sheet a={a} pad={28} style={{ height: '100%' }}>
        <div
          style={{
            display: 'inline-block',
            borderRadius: 999,
            padding: '8px 18px',
            fontFamily: f.body,
            fontSize: 24,
            fontWeight: 700,
            background: t.bg,
            color: t.fg,
            marginBottom: 18,
          }}
        >
          {pick(s.head, a.lang)}
        </div>
        {s.figure ? (
          <div
            style={{
              fontFamily: f.display,
              fontSize: 66,
              fontWeight: 700,
              color: t.fg,
              marginBottom: 12,
            }}
          >
            {pick(s.figure, a.lang)}
          </div>
        ) : null}
        {(s.rows ?? []).map((r, i) => (
          <div
            key={i}
            style={{
              fontFamily: f.body,
              fontSize: 28,
              lineHeight: 1.4,
              color: f.inkSoft,
              paddingTop: i ? 10 : 0,
            }}
          >
            {pick(r, a.lang)}
          </div>
        ))}
        {s.note ? (
          <div style={{ fontFamily: f.body, fontSize: 24, color: f.inkFaint, marginTop: 14 }}>
            {pick(s.note, a.lang)}
          </div>
        ) : null}
      </Sheet>
    </Rise>
  );
}

/**
 * Two sides. Never three — at this width a third column drops the type under
 * 20px, which on a phone in daylight is not type any more.
 */
export function CompareBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'compare' }> }) {
  const f = FAMILY[a.family];
  // Landscape splits, portrait stacks. Derived from the canvas rather than
  // chosen, so an author cannot accidentally put two columns on a phone.
  const row = a.family === 'admin';
  return (
    <Stack gap={20}>
      <div
        style={{
          display: 'flex',
          flexDirection: row ? 'row' : 'column',
          gap: b.join === 'rails' ? 12 : 20,
          alignItems: 'stretch',
        }}
      >
        <SideCard a={a} s={b.left} delay={0} />
        {b.join === 'arrow' ? (
          <Rise a={a} delay={5}>
            <div
              style={{
                fontFamily: f.display,
                fontSize: 44,
                color: f.inkFaint,
                textAlign: 'center',
                padding: row ? '0 6px' : '2px 0',
              }}
            >
              {row ? '→' : '↓'}
            </div>
          </Rise>
        ) : null}
        <SideCard a={a} s={b.right} delay={8} />
      </div>
      {b.verdict ? (
        <Rise a={a} delay={16}>
          <div
            style={{
              fontFamily: f.body,
              fontSize: 32,
              fontWeight: 600,
              color: f.ink,
              textAlign: 'center',
            }}
          >
            {pick(b.verdict, a.lang)}
          </div>
        </Rise>
      ) : null}
    </Stack>
  );
}

/* ── list ────────────────────────────────────────────────────────────────── */

/** Max seven — the marketing film's own written rule, kept. */
export function ListBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'list' }> }) {
  const f = FAMILY[a.family];
  const n = b.items.length;
  const scale = densityScale(n);
  const grid = (b.layout ?? (n >= 5 ? 'grid' : 'stack')) === 'grid';
  return (
    <Stack gap={20}>
      {b.title ? (
        <Rise a={a}>
          <div style={{ fontFamily: f.display, fontSize: 46, fontWeight: 700, color: f.ink }}>
            {pick(b.title, a.lang)}
          </div>
        </Rise>
      ) : null}
      <div
        style={{
          display: grid ? 'grid' : 'flex',
          gridTemplateColumns: grid ? 'repeat(2, minmax(0, 1fr))' : undefined,
          flexDirection: grid ? undefined : 'column',
          gap: 14,
        }}
      >
        {b.items.map((it, i) => {
          const t = toneOf(a.family, it.tone ?? (it.ok === false ? 'risk' : 'neutral'));
          const hero = b.hero === i;
          return (
            <Rise key={i} a={a} delay={stagger(i, n, a.length)}>
              <Sheet a={a} pad={22} style={hero ? { outline: `3px solid ${t.fg}` } : undefined}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      flex: 'none',
                      background: t.bg,
                      color: t.fg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: f.body,
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {it.ok === false ? '✕' : it.ok ? '✓' : i + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: f.body,
                        fontSize: 30 * scale,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: f.ink,
                      }}
                    >
                      {pick(it.text, a.lang)}
                    </div>
                    {it.sub ? (
                      <div
                        style={{
                          fontFamily: f.body,
                          fontSize: 24,
                          color: f.inkFaint,
                          marginTop: 4,
                        }}
                      >
                        {pick(it.sub, a.lang)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Sheet>
            </Rise>
          );
        })}
      </div>
    </Stack>
  );
}

/* ── flow ────────────────────────────────────────────────────────────────── */

/** Two to four nodes where the arrows mean "then". If they do not, it is a list. */
export function FlowBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'flow' }> }) {
  const f = FAMILY[a.family];
  const row = (b.direction ?? (a.family === 'admin' ? 'row' : 'column')) === 'row';
  const n = b.steps.length;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: row ? 'row' : 'column',
        gap: 12,
        alignItems: 'stretch',
        width: '100%',
      }}
    >
      {b.steps.map((s, i) => {
        const t = toneOf(a.family, s.tone ?? 'neutral');
        return (
          <React.Fragment key={i}>
            <Rise a={a} delay={stagger(i, n, a.length)} style={{ flex: 1, minWidth: 0 }}>
              <Sheet a={a} pad={24} style={{ height: '100%' }}>
                {s.figure ? (
                  <div
                    style={{
                      fontFamily: f.display,
                      fontSize: 54,
                      fontWeight: 700,
                      color: t.fg,
                      marginBottom: 8,
                    }}
                  >
                    {pick(s.figure, a.lang)}
                  </div>
                ) : null}
                {s.title ? (
                  <div
                    style={{
                      fontFamily: f.body,
                      fontSize: 30,
                      fontWeight: 700,
                      color: f.ink,
                    }}
                  >
                    {pick(s.title, a.lang)}
                  </div>
                ) : null}
                {s.body ? (
                  <div
                    style={{
                      fontFamily: f.body,
                      fontSize: 26,
                      lineHeight: 1.35,
                      color: f.inkSoft,
                      marginTop: 6,
                    }}
                  >
                    {pick(s.body, a.lang)}
                  </div>
                ) : null}
              </Sheet>
            </Rise>
            {i < n - 1 ? (
              <Rise a={a} delay={stagger(i, n, a.length) + 4}>
                <div
                  style={{
                    fontFamily: f.display,
                    fontSize: 38,
                    color: f.inkFaint,
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  {row ? '→' : '↓'}
                </div>
              </Rise>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── photo ───────────────────────────────────────────────────────────────── */

/**
 * The photograph carries the beat; one line sits on it.
 *
 * NEVER a number. A figure over a moving photograph, at this size, on a cheap
 * phone in daylight, is not readable — and a number nobody can read is worse
 * than no number, because it looks like information. A figure that needs a
 * photograph behind it is a `claim` with `brollWeight`, where the card gives it
 * a properly darkened field to sit on.
 */
export function PhotoBlockView({ a, b }: { a: Args; b: PhotoBlock }) {
  const f = FAMILY[a.family];
  const align = b.anchor === 'top' ? 'flex-start' : b.anchor === 'bottom' ? 'flex-end' : 'center';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: align,
        height: '100%',
        width: '100%',
        gap: 20,
      }}
    >
      {b.headline ? (
        <Rise a={a}>
          <div
            style={{
              fontFamily: f.display,
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: PHOTOGRAPHS ? '#FFFFFF' : f.ink,
              textShadow: PHOTOGRAPHS ? '0 2px 24px rgba(16,17,51,.55)' : undefined,
            }}
          >
            {pick(b.headline, a.lang)}
          </div>
        </Rise>
      ) : null}
      {b.chips?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {b.chips.map((c, i) => (
            <Rise key={i} a={a} delay={stagger(i, b.chips!.length, a.length) + 6}>
              <span
                style={{
                  display: 'inline-flex',
                  borderRadius: 999,
                  padding: '10px 22px',
                  fontFamily: f.body,
                  fontSize: 27,
                  fontWeight: 600,
                  background: PHOTOGRAPHS ? 'rgba(255,255,255,.10)' : f.surface,
                  border: `1px solid ${PHOTOGRAPHS ? 'rgba(255,255,255,.22)' : f.hairline}`,
                  color: PHOTOGRAPHS ? '#FFFFFF' : f.ink,
                }}
              >
                {pick(c, a.lang)}
              </span>
            </Rise>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── wrong ───────────────────────────────────────────────────────────────── */

/**
 * The cost of not doing it, in a different register.
 *
 * Exactly one per video and never the last content beat, because a video that
 * ends on the threat has told the viewer what to be afraid of and not what to
 * do. And never a real failure of ours — a video is not the place to publish
 * our own incident.
 */
export function WrongBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'wrong' }> }) {
  const f = FAMILY[a.family];
  const t = toneOf(a.family, 'risk');
  return (
    <Stack gap={18}>
      {b.headline ? (
        <Rise a={a}>
          <div
            style={{
              fontFamily: f.display,
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.15,
              color: t.fg,
            }}
          >
            {pick(b.headline, a.lang)}
          </div>
        </Rise>
      ) : null}
      <Rise a={a} delay={6}>
        <Sheet a={a} pad={30} style={{ borderTop: `6px solid ${t.fg}` }}>
          {b.body ? (
            <div style={{ fontFamily: f.body, fontSize: 30, lineHeight: 1.4, color: f.ink }}>
              {pick(b.body, a.lang)}
            </div>
          ) : null}
          {b.slots?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
              {b.slots.map((s, i) => (
                <span
                  key={i}
                  style={{
                    borderRadius: 12,
                    padding: '12px 18px',
                    fontFamily: f.body,
                    fontSize: 25,
                    fontWeight: 600,
                    color: s.missing ? t.fg : f.inkSoft,
                    background: s.missing ? t.bg : 'transparent',
                    border: s.missing ? `2px dashed ${t.fg}` : `2px solid ${f.hairline}`,
                  }}
                >
                  {pick(s.label, a.lang)}
                </span>
              ))}
            </div>
          ) : null}
          {b.cost ? (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontFamily: f.display, fontSize: 62, fontWeight: 700, color: t.fg }}>
                {pick(b.cost.figure, a.lang)}
              </div>
              <div style={{ fontFamily: f.body, fontSize: 26, color: f.inkFaint }}>
                {pick(b.cost.label, a.lang)}
              </div>
            </div>
          ) : null}
        </Sheet>
      </Rise>
    </Stack>
  );
}

/* ── recap ───────────────────────────────────────────────────────────────── */

/**
 * The frame a viewer is meant to photograph.
 *
 * Everything at once, no sequencing — the point is that it is one still that
 * carries the whole video, so it must be complete early rather than assembling
 * itself over the beat. Introduces nothing the video did not already show.
 */
export function RecapBlock({ a, b }: { a: Args; b: Extract<CommonBlock, { kind: 'recap' }> }) {
  const f = FAMILY[a.family];
  const t = toneOf(a.family, 'brand');
  const accent = a.family === 'social' ? f.accent : t.fg;
  return (
    <Stack gap={16}>
      {b.steps.map((s, i) => (
        <Rise key={i} a={a} delay={stagger(i, b.steps.length, a.length, 0.35)}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 46,
                height: 46,
                flex: 'none',
                borderRadius: 999,
                // Gold is a light ground and needs dark type on it; the other
                // families' brand colour is dark and needs light type. Reading
                // it off the accent rather than off the family name means a
                // palette change cannot leave this unreadable.
                background: accent,
                color: a.family === 'social' ? '#101133' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: f.display,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontFamily: f.body,
                fontSize: 34,
                fontWeight: 600,
                lineHeight: 1.3,
                color: f.ink,
              }}
            >
              {pick(s, a.lang)}
            </div>
          </div>
        </Rise>
      ))}
      {b.closing ? (
        <Rise a={a} delay={Math.round(a.length * 0.4)}>
          <div
            style={{
              fontFamily: f.display,
              fontSize: 38,
              fontWeight: 700,
              color: a.family === 'social' ? f.accentInk : f.ink,
              marginTop: 10,
            }}
          >
            {pick(b.closing, a.lang)}
          </div>
        </Rise>
      ) : null}
    </Stack>
  );
}

/** Everything a block might need to say it could not draw itself. */
export function MissingBlock({ a, what }: { a: Args; what: string }) {
  return (
    <div
      style={{
        fontFamily: FAMILY[a.family].body,
        fontSize: 30,
        color: toneOf(a.family, 'risk').fg,
        border: `3px dashed ${toneOf(a.family, 'risk').fg}`,
        borderRadius: 16,
        padding: 28,
      }}
    >
      {what}
    </div>
  );
}

export type { Bi };
