import * as React from 'react';
import { interpolate } from 'remotion';

import { brand, FILM, FONT_DISPLAY, FONT_SANS, SHADOW_LIFT, STAGE_H } from './brand';
import { ArrivingSheet, DsrTable } from './dsr';
import type { Lang } from './film';
import {
  Card,
  Chip,
  CountUp,
  Eyebrow,
  fade,
  Gold,
  Headline,
  StatusDot,
  Tick,
  useRise,
} from './kit';

/**
 * One drawing per beat of the film, keyed by a scene's `step`.
 *
 * Nothing in here reads the script and nothing in the script reads this file
 * except through the step name, so rewriting a line never breaks a drawing and
 * redrawing a beat never invalidates a recorded voiceover.
 *
 * The film is watched on a phone, held at arm's length, often outdoors. That
 * sets the floor for everything here: no type under 24px, no weight under 500,
 * and no more than about seven things on screen at once. Anything that has to
 * be read in under six seconds is bigger than it looks in the Studio.
 */

const W = FILM.width - 128;

export interface StageProps {
  local: number;
  lang: Lang;
}

/* ══ 1 · gate — the hook ════════════════════════════════════════════════════ */

/**
 * The team at the gate and a file that is not ready.
 *
 * The three empty slots are the whole hook, so they arrive last and pulse. The
 * gate itself is line-art rather than a photograph: a stock photo of an
 * inspection would date the film and would show a real person's outlet.
 */
export function StageGate({ local, lang }: StageProps) {
  const gate = fade(local, 0, 10);
  const slots = [0, 1, 2];

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 34 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 26,
          opacity: gate,
          transform: `translateY(${(1 - gate) * 18}px)`,
        }}
      >
        <ClipboardGlyph />
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 58,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: lang === 'hi' ? 0 : '-0.02em',
          }}
        >
          {lang === 'hi' ? 'इंस्पेक्शन' : 'Inspection'}
        </div>
      </div>

      <Card local={local} delay={8} style={{ padding: 50 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: lang === 'hi' ? '0.03em' : '0.16em',
            textTransform: 'uppercase',
            color: brand.inkFaint,
            marginBottom: 26,
          }}
        >
          {lang === 'hi' ? 'आपकी फ़ाइल' : 'Your file'}
        </div>

        {slots.map((i) => {
          const t = fade(local, 16 + i * 6, 28 + i * 6);
          const pulse = 0.6 + 0.4 * Math.sin((local - 20) / 6);
          return (
            <div
              key={i}
              style={{
                height: 108,
                borderRadius: 16,
                border: `3px dashed ${brand.risk}`,
                background: brand.riskTint,
                marginBottom: i < 2 ? 22 : 0,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 32,
                gap: 22,
                opacity: t * (0.72 + 0.28 * pulse),
              }}
            >
              <div style={{ width: 34, height: 34, flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6 18 18M18 6 6 18"
                    stroke={brand.risk}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div style={{ fontSize: 38, fontWeight: 600, color: brand.risk }}>
                {lang === 'hi' ? 'ख़ाली' : 'Missing'}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function ClipboardGlyph() {
  return (
    <svg width="98" height="98" viewBox="0 0 24 24" fill="none">
      <rect
        x="4.5"
        y="4"
        width="15"
        height="17"
        rx="2.2"
        stroke={brand.gold400}
        strokeWidth="1.7"
      />
      <rect x="9" y="2.2" width="6" height="3.4" rx="1.2" fill={brand.gold400} />
      <path
        d="M8.4 11h7.2M8.4 15h4.6"
        stroke={brand.gold400}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ══ 2 · register — the nightly job ═════════════════════════════════════════ */

/**
 * The register being worked out by hand, with one figure struck through and
 * rewritten. The strike-through is the point of the drawing: the pain is not
 * writing the number, it is not trusting it.
 */
export function StageRegister({ local, lang }: StageProps) {
  const rise = useRise(local, 2);
  const strike = fade(local, 26, 40);
  const redo = fade(local, 42, 54);

  return (
    <div style={{ width: W, opacity: rise.opacity, transform: `translateY(${rise.y}px)` }}>
      <Card style={{ padding: 46 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 22,
          }}
        >
          <div
            style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 700, color: brand.ink }}
          >
            DAILY SALES REPORT
          </div>
          <Chip tone="risk" size={28}>
            {lang === 'hi' ? 'रात 10:40' : '10:40 pm'}
          </Chip>
        </div>

        <div style={{ display: 'flex', background: brand.navy700, borderRadius: '10px 10px 0 0' }}>
          {['DATE', 'OPENING', 'RECEIPT', 'TOTAL', 'DIP', 'STOCK', 'SALES'].map((h) => (
            <div
              key={h}
              style={{
                flex: 1,
                padding: '17px 9px',
                color: '#FFFFFF',
                fontSize: 23,
                fontWeight: 600,
                textAlign: 'right',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {[
          { d: '19-08', v: ['9,120', '9,000', '18,120', '141', '12,480', '5,630'] },
          { d: '20-08', v: ['12,480', '6,000', '18,480', '160', '14,246', '4,222'] },
        ].map((row, r) => (
          <div
            key={row.d}
            style={{
              display: 'flex',
              borderBottom: `1px solid ${brand.hairline}`,
              background: r % 2 ? brand.paperWarm : '#FFFFFF',
            }}
          >
            <div
              style={{
                flex: 1,
                padding: '24px 9px',
                fontSize: 28,
                fontWeight: 600,
                color: brand.inkMuted,
                textAlign: 'right',
              }}
            >
              {row.d}
            </div>
            {row.v.map((v, c) => {
              /* The last cell of the last row is the doubted one. */
              const doubted = r === 1 && c === 5;
              return (
                <div
                  key={c}
                  style={{
                    flex: 1,
                    padding: '24px 9px',
                    fontSize: 28,
                    fontWeight: 500,
                    color: doubted ? brand.risk : brand.ink,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    position: 'relative',
                    opacity: fade(local, 4 + (r * 6 + c) * 2, 12 + (r * 6 + c) * 2),
                  }}
                >
                  {v}
                  {doubted ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: '8%',
                        right: `${8 + (1 - strike) * 84}%`,
                        top: '50%',
                        height: 3,
                        background: brand.risk,
                        borderRadius: 2,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: redo,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: brand.risk,
              background: brand.riskTint,
              borderRadius: 999,
              padding: '16px 32px',
            }}
          >
            {lang === 'hi' ? 'फिर से जोड़ते हैं' : 'Add it again'}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ══ 3 · arrives — the picture lands ════════════════════════════════════════ */

export function StageArrives({ local, lang }: StageProps) {
  return (
    <div style={{ width: W - 30 }}>
      <ArrivingSheet local={local} lang={lang} />
    </div>
  );
}

/* ══ 4 · same-format — and anyone can copy it ═══════════════════════════════ */

/**
 * The picture and the register drawn with the same table, joined column to
 * column, with a tick landing beside each finished row.
 *
 * The two tables are deliberately identical markup — that sameness IS the
 * claim, so they must never be styled apart beyond the header colour.
 */
export function StageSameFormat({ local, lang }: StageProps) {
  const link = fade(local, 12, 30);

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card local={local} style={{ padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: brand.ok, marginBottom: 14 }}>
          {lang === 'hi' ? 'जो आपको मिलता है' : 'What reaches you'}
        </div>
        <DsrTable tone="navy" scale={1.28} />
      </Card>

      <div style={{ position: 'relative', height: 68 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${5 + i * 12.6}%`,
              top: 0,
              width: 3,
              height: 68 * link,
              background: brand.gold400,
              borderRadius: 2,
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      <Card
        local={local}
        delay={8}
        style={{
          padding: 24,
          background: brand.gold50,
          border: `3px dashed ${brand.gold300}`,
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: brand.gold600 }}>
            {lang === 'hi' ? 'आपका रजिस्टर' : 'Your register'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tick size={30} t={fade(local, 34, 46)} />
            <Tick size={30} t={fade(local, 42, 54)} />
          </div>
        </div>
        <DsrTable tone="gold" scale={1.28} />
      </Card>

      <div
        style={{
          textAlign: 'center',
          marginTop: 8,
          opacity: fade(local, 50, 62),
          fontFamily: FONT_DISPLAY,
          fontSize: 44,
          fontWeight: 700,
          color: brand.gold400,
          letterSpacing: lang === 'hi' ? 0 : '-0.02em',
        }}
      >
        {lang === 'hi' ? 'कोई भी उतार सकता है' : 'Anyone can copy it across'}
      </div>
    </div>
  );
}

/* ══ 6 · nine-reveal — the DSR is one of nine ═══════════════════════════════ */

export const NINE = [
  { no: '01', hi: 'SDMS का सारा काम', en: 'SDMS Compliance' },
  { no: '02', hi: 'रोज़ाना स्टॉक जाँच', en: 'MDG Compliance' },
  { no: '03', hi: 'इंस्पेक्शन की तैयारी', en: 'Inspection Compliance' },
  { no: '04', hi: 'काग़ज़ों के रिमाइंडर', en: 'Document Reminders' },
  { no: '05', hi: 'ऑटोमेशन सपोर्ट', en: 'Automation Support' },
  { no: '06', hi: 'वेब पोर्टल सपोर्ट', en: 'Web Portal Support' },
  { no: '07', hi: 'XTRA कैंपेन सपोर्ट', en: 'XTRA Campaign' },
  { no: '08', hi: 'DOD और स्टॉक', en: 'D.O.D & Stock' },
  { no: '09', hi: 'Prepare Pro Manager', en: 'Prepare Pro Manager' },
];

/**
 * The nine tiles.
 *
 * Tile 02 lights first and alone, because it is the one the film has spent
 * thirty seconds proving — the daily stock and DSR work. The other eight follow
 * fast. The DSR is NOT drawn as a tenth tile: it lives inside 02, and inventing
 * a tenth would overstate the offer by one whole service.
 */
export function StageNineReveal({ local, lang }: StageProps) {
  const HERO = 1;
  return (
    <div
      style={{
        width: W,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}
    >
      {NINE.map((s, i) => {
        const at = i === HERO ? 0 : 16 + i * 3.5;
        const t = fade(local, at, at + 11);
        const hero = i === HERO;
        return (
          <div
            key={s.no}
            style={{
              background: hero ? brand.gold400 : '#FFFFFF',
              borderRadius: 22,
              padding: '30px 24px',
              minHeight: 236,
              opacity: t,
              transform: `translateY(${(1 - t) * 14}px) scale(${hero ? 1 : 0.985})`,
              boxShadow: hero ? '0 20px 50px -18px rgba(245,165,36,.6)' : SHADOW_LIFT,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 27,
                fontWeight: 700,
                color: hero ? brand.navy900 : brand.gold400,
              }}
            >
              {s.no}
            </div>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 31,
                fontWeight: 700,
                lineHeight: 1.24,
                color: hero ? brand.navy950 : brand.ink,
              }}
            >
              {lang === 'hi' ? s.hi : s.en}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══ 7 · load — 45 items, 11 hours ══════════════════════════════════════════ */

/**
 * The size of the job and its price in the dealer's own time.
 *
 * The 45 dots are drawn as a field rather than counted off, because the feeling
 * being reached for is "more than I can hold in my head", which a tidy list
 * would undo. The eleven hours then lift OUT of that field and land on his
 * side — the film's only visual promise of something being handed back.
 */
export function StageLoad({ local, lang }: StageProps) {
  const dots = Math.round(45 * fade(local, 4, 32));
  const hours = fade(local, 34, 56);

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card local={local} style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 22 }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 114,
              fontWeight: 700,
              letterSpacing: '-0.05em',
              color: brand.navy700,
              lineHeight: 0.9,
            }}
          >
            <CountUp to={45} local={local} delay={4} frames={30} />
          </div>
          <div style={{ fontSize: 33, fontWeight: 600, color: brand.inkSoft, lineHeight: 1.3 }}>
            {lang === 'hi' ? 'काम, हर एक की अपनी तारीख़' : 'items, each on its own clock'}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
          {Array.from({ length: 45 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: i < dots ? brand.navy700 : brand.paperSunk,
                opacity: i < dots ? 1 : 0.6,
              }}
            />
          ))}
        </div>
      </Card>

      <Card
        tone="gold"
        style={{
          padding: '26px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          opacity: hours,
          transform: `translateY(${(1 - hours) * 20}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 78,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          11
        </div>
        <div style={{ fontSize: 35, fontWeight: 700, lineHeight: 1.3 }}>
          {lang === 'hi'
            ? 'घंटे हर हफ़्ते — अब वे घंटे आपके'
            : 'hours a week — those come back to you'}
        </div>
      </Card>
    </div>
  );
}

/* ══ 8 · records — the gate, answered ═══════════════════════════════════════ */

/**
 * The callback to the opening shot. Same file, every slot now full.
 *
 * The inspection bodies are named on their own folders because a dealer knows
 * these names and does not know ours; seeing them listed is what tells him the
 * film is about his actual life.
 */
export function StageRecords({ local, lang }: StageProps) {
  /* Exactly the five the narration names, in the order it names them. A sixth
     folder on screen is a label the viewer reads and never hears. */
  const folders = ['SDMS', 'Dhruva', 'MDT', 'QRC', 'AAC'];

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        {folders.map((f, i) => {
          const t = fade(local, 4 + i * 5, 16 + i * 5);
          return (
            <div
              key={f}
              style={{
                width: 300,
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '38px 22px',
                textAlign: 'center',
                opacity: t,
                transform: `translateY(${(1 - t) * 16}px)`,
                boxShadow: SHADOW_LIFT,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <StatusDot ok size={64} t={fade(local, 12 + i * 5, 24 + i * 5)} />
              </div>
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 34,
                  fontWeight: 700,
                  color: brand.ink,
                }}
              >
                {f}
              </div>
            </div>
          );
        })}
      </div>

      <Card
        tone="gold"
        style={{
          padding: '26px 32px',
          textAlign: 'center',
          opacity: fade(local, 40, 54),
        }}
      >
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.24 }}>
          {lang === 'hi'
            ? 'जो भी टीम आए, रिकॉर्ड तैयार'
            : 'Whichever team comes, the records are ready'}
        </div>
      </Card>
    </div>
  );
}

/* ══ 9 · variation — caught before it becomes a notice ══════════════════════ */

/**
 * A variation bar rising toward a red line marked "notice", and a gold bracket
 * catching it well short.
 *
 * The bar stops at roughly two thirds. It must never reach the line: the claim
 * is that trouble is caught early, and a bar that touches the line would draw
 * the opposite promise no matter what the narration says.
 */
export function StageVariation({ local, lang }: StageProps) {
  const grow = fade(local, 6, 34);
  const catchIt = fade(local, 32, 48);
  const BAR_MAX = 0.64;

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card local={local} style={{ padding: 34, position: 'relative' }}>
        <div style={{ height: 660, position: 'relative' }}>
          {/* the notice line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 4,
              background: brand.risk,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 14,
              fontSize: 34,
              fontWeight: 700,
              color: brand.risk,
              letterSpacing: '0.1em',
            }}
          >
            {lang === 'hi' ? 'नोटिस' : 'NOTICE'}
          </div>

          {/* the variation bar, growing from the floor */}
          <div
            style={{
              position: 'absolute',
              left: 150,
              bottom: 0,
              width: 260,
              height: 660 * BAR_MAX * grow,
              background: `linear-gradient(180deg, ${brand.gold400} 0%, ${brand.gold300} 100%)`,
              borderRadius: '12px 12px 0 0',
            }}
          />

          {/* the bracket that stops it */}
          <div
            style={{
              position: 'absolute',
              left: 116,
              bottom: 660 * BAR_MAX - 7,
              width: 328,
              height: 10,
              background: brand.ok,
              borderRadius: 4,
              opacity: catchIt,
              transform: `scaleX(${0.3 + 0.7 * catchIt})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 474,
              bottom: 660 * BAR_MAX - 30,
              fontSize: 36,
              fontWeight: 700,
              color: brand.ok,
              opacity: catchIt,
            }}
          >
            {lang === 'hi' ? 'यहीं पकड़ लिया' : 'caught here'}
          </div>

          <div
            style={{
              position: 'absolute',
              left: 60,
              bottom: -2,
              width: 128,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 600,
              color: brand.inkFaint,
              transform: 'translateY(30px)',
            }}
          />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        <Chip tone="ghost" size={28}>
          {lang === 'hi' ? 'स्टॉक' : 'Stock'}
        </Chip>
        <Chip tone="ghost" size={28}>
          {lang === 'hi' ? 'डेंसिटी' : 'Density'}
        </Chip>
        <Chip tone="ghost" size={28}>
          {lang === 'hi' ? 'हर दिन' : 'Every day'}
        </Chip>
      </div>
    </div>
  );
}

/* ══ 10 · deadlines — 22 dates on the wall ══════════════════════════════════ */

/**
 * The tracked dates going gold, and a reminder arriving several squares BEFORE
 * one of them.
 *
 * That gap is the entire promise. A bell drawn on top of the date would say
 * "we tell you on the day", which is the thing the dealer already has.
 */
export function StageDeadlines({ local, lang }: StageProps) {
  const marked = [3, 7, 12, 16, 21, 25, 30, 34];
  const alert = fade(local, 30, 44);

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card local={local} style={{ padding: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 9 }}>
          {Array.from({ length: 35 }).map((_, i) => {
            const idx = marked.indexOf(i);
            const on = idx >= 0 ? fade(local, 6 + idx * 3, 16 + idx * 3) : 0;
            /* The reminder sits three cells to the LEFT of the 5th marked date. */
            const isBell = i === marked[4] - 3;
            return (
              <div
                key={i}
                style={{
                  height: 84,
                  borderRadius: 13,
                  background: on > 0 ? brand.gold400 : brand.paperSunk,
                  opacity: on > 0 ? 0.3 + 0.7 * on : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  color: on > 0.5 ? brand.navy950 : brand.inkFaint,
                  position: 'relative',
                }}
              >
                {i + 1}
                {isBell ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -4,
                      borderRadius: 13,
                      border: `4px solid ${brand.ok}`,
                      opacity: alert,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        tone="gold"
        style={{
          padding: '24px 30px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          opacity: alert,
          transform: `translateY(${(1 - alert) * 18}px)`,
        }}
      >
        <BellGlyph />
        <div style={{ fontSize: 33, fontWeight: 700, lineHeight: 1.3 }}>
          {lang === 'hi'
            ? 'Fire NOC · Weights & Measures — तारीख़ से पहले ख़बर'
            : 'Fire NOC · Weights & Measures — told before the date'}
        </div>
      </Card>
    </div>
  );
}

function BellGlyph() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 3.2a5.6 5.6 0 0 0-5.6 5.6c0 4.2-1.5 5.6-1.5 5.6h14.2s-1.5-1.4-1.5-5.6A5.6 5.6 0 0 0 12 3.2Z"
        stroke={brand.navy950}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 17.6a2 2 0 0 0 3.6 0"
        stroke={brand.navy950}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ══ 11 · night — the Sunday-night fault ════════════════════════════════════ */

export function StageNight({ local, lang }: StageProps) {
  const rows = [
    {
      ok: false,
      hi: 'इतवार की रात ऑटोमेशन बंद। अब फ़ोन किसको करें?',
      en: 'Sunday night, automation is down. Now who do you call?',
      at: 2,
    },
    {
      ok: true,
      hi: 'उसी वक़्त पकड़ में आ जाता है — चालू होने तक पीछे',
      en: 'Caught the same moment, and chased until it runs again',
      at: 26,
    },
  ];

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          textAlign: 'center',
          fontFamily: FONT_DISPLAY,
          fontSize: 48,
          fontWeight: 700,
          color: brand.navy300,
          letterSpacing: '0.04em',
          opacity: fade(local, 0, 10),
        }}
      >
        8:40 pm · Sunday
      </div>

      {rows.map((r) => {
        const t = fade(local, r.at, r.at + 14);
        return (
          <Card
            key={r.en}
            style={{
              padding: '44px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              opacity: t,
              transform: `translateY(${(1 - t) * 18}px)`,
              background: r.ok ? '#FFFFFF' : brand.riskTint,
              boxShadow: r.ok ? SHADOW_LIFT : 'none',
            }}
          >
            <StatusDot ok={r.ok} size={72} t={fade(local, r.at + 8, r.at + 20)} />
            <div style={{ fontSize: 35, fontWeight: 600, lineHeight: 1.32, color: brand.ink }}>
              {lang === 'hi' ? r.hi : r.en}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ══ 12 · dod — yesterday, tallied by morning ═══════════════════════════════ */

/**
 * Two columns that line up. The tick lands between them rather than on either,
 * because the thing being promised is the agreement of the two, not either
 * figure on its own.
 */
export function StageDod({ local, lang }: StageProps) {
  /**
   * The two sides of a day's reconciliation: what the book says should be in
   * the tank, and what the tank actually holds.
   *
   * They carry the SAME figures because agreeing is the point. An earlier draft
   * labelled the left column "yesterday's DOD" and put litres under it — but
   * DOD is a payment position, not a volume, so that comparison could not be
   * true no matter how it was drawn. The three things the narration names are
   * chips above; the drawing illustrates the sentence that follows them.
   */
  const cols = [
    {
      label: lang === 'hi' ? 'किताब के हिसाब से' : 'What the book says',
      rows: ['18,480', '4,222', '14,246'],
    },
    {
      label: lang === 'hi' ? 'टैंक में असल' : 'What the tank holds',
      rows: ['18,480', '4,222', '14,246'],
    },
  ];
  const tally = fade(local, 30, 46);

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div
        style={{ display: 'flex', gap: 12, justifyContent: 'center', opacity: fade(local, 0, 10) }}
      >
        <Chip tone="ghost" size={27}>
          DOD
        </Chip>
        <Chip tone="ghost" size={27}>
          {lang === 'hi' ? 'स्टॉक' : 'Stock'}
        </Chip>
        <Chip tone="ghost" size={27}>
          {lang === 'hi' ? 'डिलीवरी' : 'Delivery'}
        </Chip>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {cols.map((c, ci) => (
          <React.Fragment key={c.label}>
            <Card local={local} delay={ci * 8} style={{ flex: 1, padding: 34 }}>
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 700,
                  color: brand.inkMuted,
                  marginBottom: 20,
                }}
              >
                {c.label}
              </div>
              {c.rows.map((r, ri) => (
                <div
                  key={ri}
                  style={{
                    fontSize: 46,
                    fontWeight: 600,
                    color: brand.ink,
                    fontVariantNumeric: 'tabular-nums',
                    padding: '14px 0',
                    borderBottom: ri < 2 ? `1px solid ${brand.hairline}` : 'none',
                    opacity: fade(local, 8 + ci * 8 + ri * 4, 20 + ci * 8 + ri * 4),
                  }}
                >
                  {r}
                </div>
              ))}
            </Card>
            {ci === 0 ? (
              <div style={{ flexShrink: 0, opacity: tally }}>
                <StatusDot ok size={84} t={tally} />
              </div>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <Card
        tone="gold"
        style={{ padding: '26px 32px', textAlign: 'center', opacity: fade(local, 42, 56) }}
      >
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 700, lineHeight: 1.24 }}>
          {lang === 'hi'
            ? 'कल का हिसाब सुबह तक मिला हुआ'
            : "Yesterday's account, tallied by morning"}
        </div>
      </Card>
    </div>
  );
}

/* ══ credit — what you owe, and by when ═════════════════════════════════════ */

/**
 * The Credit & DOD card as the dealer receives it.
 *
 * Two figures carry the whole thing — DUE AMOUNT and DUE DATE — so they get the
 * hero and everything else is a supporting tile. The days-left chip is what
 * turns a date into a decision, which is why it sits inside the hero rather than
 * under the tiles.
 *
 * The figures are illustrative and internally consistent, and match how the real
 * card is built (`mdg-backend/src/automation/sdms/report/creditCard.ts`):
 *   available = current − availed        →  25,00,000 − 18,42,650 = 6,57,350
 *   due ≤ availed  (it is the oldest open lot, not the whole balance)
 * No outlet code appears anywhere, and no real dealer's figures are used.
 */
export function StageCredit({ local, lang }: StageProps) {
  const CURRENT = 2500000;
  const AVAILED = 1842650;
  const AVAILABLE = CURRENT - AVAILED;
  const DUE = 486120;

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const tiles = [
    { hi: 'निर्धारित राशि', en: 'Current limit', v: CURRENT },
    { hi: 'अब तक खपत', en: 'Availed', v: AVAILED },
    { hi: 'बची हुई राशि', en: 'Available', v: AVAILABLE },
  ];

  /* The utilisation bar fills to the availed share of the limit. Drawn from the
     same two numbers as the tiles, so it can never disagree with them. */
  const used = AVAILED / CURRENT;

  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card local={local} style={{ padding: 36 }}>
        <div style={{ display: 'flex', gap: 30 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: lang === 'hi' ? '0.03em' : '0.14em',
                textTransform: 'uppercase',
                color: brand.inkFaint,
                marginBottom: 10,
              }}
            >
              {lang === 'hi' ? 'जमा करनी है' : 'Due amount'}
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 82,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: brand.navy700,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {inr(DUE)}
            </div>
          </div>

          <div style={{ width: 2, background: brand.hairline, flexShrink: 0 }} />

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: lang === 'hi' ? '0.03em' : '0.14em',
                textTransform: 'uppercase',
                color: brand.inkFaint,
                marginBottom: 10,
              }}
            >
              {lang === 'hi' ? 'आख़िरी तारीख़' : 'Due date'}
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 58,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: brand.ink,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              24-08-2026
            </div>
            <div style={{ marginTop: 16, opacity: fade(local, 18, 32) }}>
              <Chip tone="gold" size={28}>
                {lang === 'hi' ? '3 दिन बाक़ी' : '3 days left'}
              </Chip>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          {tiles.map((t, i) => (
            <div
              key={t.en}
              style={{
                flex: 1,
                background: brand.paperSunk,
                borderRadius: 16,
                padding: '20px 22px',
                opacity: fade(local, 10 + i * 5, 22 + i * 5),
              }}
            >
              <div
                style={{ fontSize: 21, fontWeight: 600, color: brand.inkMuted, marginBottom: 8 }}
              >
                {lang === 'hi' ? t.hi : t.en}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: brand.ink,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {inr(t.v)}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            height: 16,
            borderRadius: 999,
            background: brand.paperSunk,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${used * 100 * fade(local, 24, 44)}%`,
              height: '100%',
              background: brand.navy700,
            }}
          />
        </div>
      </Card>

      <div
        style={{ display: 'flex', gap: 12, justifyContent: 'center', opacity: fade(local, 36, 50) }}
      >
        <Chip tone="ghost" size={27}>
          DOD
        </Chip>
        <Chip tone="ghost" size={27}>
          CREDIT
        </Chip>
        <Chip tone="ghost" size={27}>
          CASH &amp; CARRY
        </Chip>
      </div>
    </div>
  );
}

/* ══ 13 · pick — one call, and you choose ═══════════════════════════════════ */

/**
 * Nine switches, three flipped on, and a price beside them.
 *
 * The price chip carries no figure on purpose. What is promised is that the
 * number is agreed in writing before anything starts — printing an amount would
 * invent a fact the company has not stated anywhere.
 */
export function StagePick({ local, lang }: StageProps) {
  const on = [0, 1, 3];
  return (
    <div style={{ width: W, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Card local={local} style={{ padding: 38 }}>
        {NINE.slice(0, 5).map((s, i) => {
          const isOn = on.includes(i);
          const t = fade(local, 6 + i * 5, 18 + i * 5);
          return (
            <div
              key={s.no}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                padding: '24px 0',
                borderBottom: i < 4 ? `1px solid ${brand.hairline}` : 'none',
                opacity: t,
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 600, color: brand.ink }}>
                {lang === 'hi' ? s.hi : s.en}
              </div>
              <Toggle on={isOn} t={fade(local, 12 + i * 5, 24 + i * 5)} />
            </div>
          );
        })}
      </Card>

      <Card
        local={local}
        delay={34}
        tone="gold"
        style={{ padding: '26px 32px', textAlign: 'center' }}
      >
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, lineHeight: 1.26 }}>
          {lang === 'hi'
            ? 'रेट पहले लिखकर, फिर शुरू'
            : 'The price in writing, before anything starts'}
        </div>
      </Card>
    </div>
  );
}

function Toggle({ on, t }: { on: boolean; t: number }) {
  const knob = on ? interpolate(t, [0, 1], [0, 34], { extrapolateRight: 'clamp' }) : 0;
  return (
    <div
      style={{
        width: 78,
        height: 44,
        borderRadius: 999,
        flexShrink: 0,
        background: on ? `rgba(18,168,123,${0.25 + 0.75 * t})` : brand.paperSunk,
        display: 'flex',
        alignItems: 'center',
        padding: 5,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: '#FFFFFF',
          transform: `translateX(${knob}px)`,
          boxShadow: '0 2px 6px rgba(16,17,51,.25)',
        }}
      />
    </div>
  );
}

/* ══ 14 · promise — the line the film exists for ════════════════════════════ */

/**
 * Seven days filling, then the sentence, set as type straight on the navy.
 *
 * Every other beat is an object on a surface. This one is not, and that is what
 * makes it read as a statement rather than one more exhibit.
 */
export function StagePromise({ local, lang }: StageProps) {
  const rise = useRise(local, 2);

  return (
    <div
      style={{
        width: W,
        textAlign: 'center',
        opacity: rise.opacity,
        transform: `translateY(${rise.y}px)`,
      }}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 54 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const t = fade(local, 2 + i * 3, 10 + i * 3);
          return (
            <div key={i} style={{ flex: 1 }}>
              <div
                style={{
                  height: 12,
                  borderRadius: 999,
                  background: brand.gold400,
                  opacity: 0.18 + 0.82 * t,
                }}
              />
              <div
                style={{
                  marginTop: 12,
                  fontSize: 21,
                  fontWeight: 700,
                  color: brand.navy300,
                  opacity: t,
                }}
              >
                {lang === 'hi' ? `दिन ${i + 1}` : `Day ${i + 1}`}
              </div>
            </div>
          );
        })}
      </div>

      <Headline size={lang === 'hi' ? 78 : 88} style={{ lineHeight: lang === 'hi' ? 1.3 : 1.08 }}>
        {lang === 'hi' ? (
          <>
            उसके बाद आपका <Gold>एक मिनट भी</Gold> नहीं लगता।
          </>
        ) : (
          <>
            After that, you don&rsquo;t spend <Gold>a single minute</Gold> on it.
          </>
        )}
      </Headline>
    </div>
  );
}

/* ══ 15 · close — one conversation ══════════════════════════════════════════ */

/**
 * The end card. One action, and the two things a dealer wants to know before he
 * takes it: that a person answers, and in which language.
 *
 * No phone number and no download button. The film's job is to make the call
 * wanted; the marketing person standing in front of him places it.
 */
export function StageClose({ local, lang }: StageProps) {
  const rise = useRise(local, 2);
  const chips = fade(local, 18, 34);

  return (
    <div
      style={{
        width: W,
        textAlign: 'center',
        opacity: rise.opacity,
        transform: `translateY(${rise.y}px)`,
      }}
    >
      <Eyebrow tracked={lang === 'en'}>
        {lang === 'hi' ? 'बस इतना करना है' : 'The only step'}
      </Eyebrow>

      <Headline
        size={lang === 'hi' ? 74 : 84}
        style={{ margin: '30px 0 36px', lineHeight: lang === 'hi' ? 1.3 : 1.08 }}
      >
        {lang === 'hi' ? (
          <>
            एक बार <Gold>बात कर लीजिए।</Gold>
          </>
        ) : (
          <>
            Just have <Gold>one conversation.</Gold>
          </>
        )}
      </Headline>

      {/* The last six seconds are where a forwarded video loses its viewer, so
          the closing frame is not allowed to be a still. The hand sweeps the
          whole 9-to-9 day while the chips arrive, which also SHOWS the support
          promise the line is making instead of only asserting it. */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 34 }}>
        <NineToNineClock t={fade(local, 6, 56)} />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          flexWrap: 'wrap',
          opacity: chips,
        }}
      >
        <Chip tone="ghost" size={28}>
          {lang === 'hi' ? 'न कोई फ़ॉर्म' : 'No forms'}
        </Chip>
        <Chip tone="ghost" size={28}>
          {lang === 'hi' ? 'सुबह 9 से रात 9' : '9am to 9pm'}
        </Chip>
        <Chip tone="ghost" size={28}>
          {lang === 'hi' ? 'हिंदी या English' : 'Hindi or English'}
        </Chip>
      </div>

      <div
        style={{
          marginTop: 48,
          fontFamily: FONT_DISPLAY,
          fontSize: 44,
          fontWeight: 700,
          color: brand.gold400,
          letterSpacing: '-0.02em',
          opacity: fade(local, 26, 42),
        }}
      >
        mdgservices.in
      </div>
    </div>
  );
}

/**
 * A clock whose hand sweeps from 9 in the morning round to 9 at night.
 *
 * The two nines are marked on the dial and the swept arc is drawn in gold, so
 * the covered part of the day is a shape rather than a claim. The hand travels
 * 360° over twelve hours of dial, which is not how a clock works — but a hand
 * that took two full revolutions would read as "a long time" instead of "this
 * window", and the window is the point.
 */
function NineToNineClock({ t }: { t: number }) {
  const R = 96;
  const C = 2 * Math.PI * R;
  const angle = -90 + 360 * Math.max(0, Math.min(1, t));

  return (
    <svg width={236} height={236} viewBox="0 0 236 236" fill="none">
      <circle cx="118" cy="118" r={R} stroke="rgba(255,255,255,.18)" strokeWidth="8" />
      <circle
        cx="118"
        cy="118"
        r={R}
        stroke={brand.gold400}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - Math.max(0, Math.min(1, t)))}
        transform="rotate(-90 118 118)"
      />
      <line
        x1="118"
        y1="118"
        x2={118 + (R - 26) * Math.cos((angle * Math.PI) / 180)}
        y2={118 + (R - 26) * Math.sin((angle * Math.PI) / 180)}
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="118" cy="118" r="8" fill={brand.gold400} />
      <text
        x="118"
        y="46"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="26"
        fontWeight="700"
        fontFamily={FONT_DISPLAY}
      >
        9
      </text>
      <text
        x="118"
        y="204"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="26"
        fontWeight="700"
        fontFamily={FONT_DISPLAY}
      >
        9
      </text>
    </svg>
  );
}

/* ══ The registry ═══════════════════════════════════════════════════════════ */

/**
 * Step name → drawing. The script names a step; this table resolves it.
 *
 * A step with no entry draws {@link StageMissing} rather than an empty frame:
 * a silent blank stage is easy to miss in the Studio and very loud in a render.
 */
export const STAGES: Record<string, React.FC<StageProps>> = {
  gate: StageGate,
  register: StageRegister,
  arrives: StageArrives,
  'same-format': StageSameFormat,
  'nine-reveal': StageNineReveal,
  load: StageLoad,
  records: StageRecords,
  variation: StageVariation,
  deadlines: StageDeadlines,
  night: StageNight,
  dod: StageDod,
  credit: StageCredit,
  pick: StagePick,
  promise: StagePromise,
  close: StageClose,
};

export function StageMissing({ step }: { step: string }) {
  return (
    <div style={{ width: W, textAlign: 'center' }}>
      <Card tone="outline" style={{ padding: 50 }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: brand.gold400, marginBottom: 12 }}>
          no stage for &ldquo;{step}&rdquo;
        </div>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,.7)' }}>
          add it to STAGES in src/marketing/stages.tsx
        </div>
      </Card>
    </div>
  );
}

export const MAX_STAGE_HEIGHT = STAGE_H;
