import * as React from 'react';

import { FORMS_OF_LIMIT, inr, type CardData } from '../lib/creditCard';
import { FONT_FAMILY } from '../theme';

/**
 * A clean, animated recreation of the daily "CREDIT & DOD MONITORING" card the
 * dealer receives, inside the MDG "Dealer's कवच" brand frame.
 *
 * It mirrors the layout the backend actually renders
 * (`mdg-backend/src/automation/sdms/report/renderCard.ts`): a HERO carrying the
 * one decision (what to deposit, by when, with a days-left verdict), three LIMIT
 * tiles under a utilisation bar, all three FORM OF LIMIT options with the
 * dealer's one lit up, and a footer saying when the figures were prepared.
 *
 * `activeKey` rings exactly one region and dims the rest, so the video can point
 * at the field being narrated. The keys are unchanged from the old seven-row
 * table (`due-amount`, `due-date`, `current-limit`, `availed-limit`,
 * `available-limit`, `form-of-limit`, `prepared-at`), so `stepToFocus` and the
 * narration still line up.
 *
 * GEOMETRY IS THE CONTRACT: the ring is positioned from the same constants that
 * lay the card out, and every section is given a fixed height. Change a height
 * here and the ring follows — that is the whole reason the sections are not
 * allowed to size themselves.
 */

export const CARD = {
  width: 1000,
  brandH: 40,
  headerH: 124,
  heroH: 212,
  limitsH: 300,
  formH: 146,
  footH: 86,
  /** Width of the DUE DATE panel on the right of the hero. */
  dpanelW: 332,
  /** Horizontal padding inside the limits / form blocks. */
  blockPadX: 28,
  /** Gap between the three limit tiles. */
  tileGap: 14,
} as const;

/** Brand / document palette (warmer than the app theme, to read as a printout). */
const c = {
  maroon: '#7f1d1d',
  maroonDeep: '#5c1010',
  maroonSoft: '#fef2f2',
  red: '#b91c1c',
  green: '#15803d',
  greenSoft: '#f0fdf4',
  gold: '#f59e0b',
  goldSoft: '#fffaf0',
  cream: '#fffdf5',
  ink: '#1c1917',
  inkSoft: '#57534e',
  grid: '#e7d9bf',
  frame: '#7f1d1d',
} as const;

/** Top edge of each stacked section, derived once so nothing can drift. */
const TOP = {
  hero: CARD.brandH + CARD.headerH,
  limits: CARD.brandH + CARD.headerH + CARD.heroH,
  form: CARD.brandH + CARD.headerH + CARD.heroH + CARD.limitsH,
  foot: CARD.brandH + CARD.headerH + CARD.heroH + CARD.limitsH + CARD.formH,
} as const;

const TILE_W =
  (CARD.width - CARD.blockPadX * 2 - CARD.tileGap * 2) / 3;
/** Distance from a block's top edge to the top of its content row. */
const BLOCK_HEAD = 22 + 34 + 14;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where each narratable field lives on the card. Driven entirely by the geometry
 * constants above, so the ring cannot drift away from what it is pointing at.
 */
const REGION: Record<string, Rect> = {
  'due-amount': {
    left: 0,
    top: TOP.hero,
    width: CARD.width - CARD.dpanelW,
    height: CARD.heroH,
  },
  'due-date': {
    left: CARD.width - CARD.dpanelW,
    top: TOP.hero,
    width: CARD.dpanelW,
    height: CARD.heroH,
  },
  'current-limit': {
    left: CARD.blockPadX,
    top: TOP.limits + BLOCK_HEAD,
    width: TILE_W,
    height: 150,
  },
  'availed-limit': {
    left: CARD.blockPadX + TILE_W + CARD.tileGap,
    top: TOP.limits + BLOCK_HEAD,
    width: TILE_W,
    height: 150,
  },
  'available-limit': {
    left: CARD.blockPadX + (TILE_W + CARD.tileGap) * 2,
    top: TOP.limits + BLOCK_HEAD,
    width: TILE_W,
    height: 150,
  },
  'form-of-limit': { left: 0, top: TOP.form, width: CARD.width, height: CARD.formH },
  'prepared-at': { left: 0, top: TOP.foot, width: CARD.width, height: CARD.footH },
};

function BrandBand({ top }: { top?: boolean }) {
  const marks = Array.from({ length: 7 });
  return (
    <div
      style={{
        height: CARD.brandH,
        background: `linear-gradient(90deg, ${c.gold}, #fbbf24 50%, ${c.gold})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        overflow: 'hidden',
        borderTop: top ? undefined : `2px solid ${c.maroon}`,
        borderBottom: top ? `2px solid ${c.maroon}` : undefined,
      }}
    >
      {marks.map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: c.maroon,
            whiteSpace: 'nowrap',
            flex: 'none',
          }}
        >
          Dealer&apos;s कवच · @MDG Services
        </span>
      ))}
    </div>
  );
}

/** Fixed side slots keep the centred title from colliding with the logo/code. */
const HEADER_SLOT = 150;

function Header({ code }: { code: string }) {
  return (
    <div
      style={{
        height: CARD.headerH,
        background: `linear-gradient(180deg, ${c.maroon}, ${c.maroonDeep})`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        gap: 10,
      }}
    >
      <div style={{ width: HEADER_SLOT, display: 'flex' }}>
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: 16,
            background: '#ffffff',
            color: c.maroon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          }}
        >
          MDG
        </div>
      </div>

      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        <div
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.05,
            whiteSpace: 'nowrap',
          }}
        >
          CREDIT &amp; DOD MONITORING
        </div>
        <div style={{ fontSize: 21, fontWeight: 600, color: c.gold, marginTop: 4 }}>
          रोज़ का उधार-हिसाब
        </div>
      </div>

      <div style={{ width: HEADER_SLOT, display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            background: c.gold,
            color: c.maroon,
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 25,
            fontWeight: 800,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {code}
        </div>
      </div>
    </div>
  );
}

/** `₹12,345.00`, and `-₹12,345.00` for a negative — never `₹-12,345.00`. */
function rupees(value: string): string {
  return value.startsWith('-') ? `-₹${value.slice(1)}` : `₹${value}`;
}

/** `dd-mm-yyyy` → epoch ms at UTC midnight, or null. */
function dmyToUtc(dmy: string | null): number | null {
  if (!dmy) return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy);
  return m ? Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

/** The same plain-language verdict the shipped card prints. */
function verdictFor(dueDate: string | null, preparedOn: string): string | null {
  const due = dmyToUtc(dueDate);
  const from = dmyToUtc(preparedOn);
  if (due == null || from == null) return null;
  const days = Math.round((due - from) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} दिन पहले तारीख़ निकल चुकी है`;
  if (days === 0) return 'आज ही जमा करना है';
  if (days === 1) return 'कल आख़िरी दिन';
  return `${days} दिन बाक़ी हैं`;
}

function Hero({ data }: { data: CardData }) {
  const { figures } = data;
  const advance = figures.dueAmount < 0;
  const settled = !advance && figures.dueAmount === 0 && !figures.dueDate;
  const good = advance || settled;
  const verdict = good ? null : verdictFor(figures.dueDate, figures.preparedOn);
  const amount = rupees(inr(advance ? Math.abs(figures.dueAmount) : figures.dueAmount));

  return (
    <div
      style={{
        height: CARD.heroH,
        display: 'flex',
        background: good ? c.greenSoft : c.maroonSoft,
        borderBottom: `3px solid ${c.grid}`,
      }}
    >
      <div style={{ flex: 1, padding: '26px 28px 24px', minWidth: 0 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: good ? c.green : c.maroon,
          }}
        >
          {advance ? 'ADVANCE WITH INDIAN OIL' : settled ? 'NOTHING DUE' : 'DUE AMOUNT'}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 88,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: good ? c.green : c.red,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {amount}
        </div>
        <div style={{ marginTop: 8, fontSize: 26, fontWeight: 600, color: c.inkSoft }}>
          {advance
            ? 'इंडियन ऑयल के खाते में आपकी जमा राशि'
            : settled
              ? 'सारा हिसाब चुकता है — कुछ जमा नहीं करना'
              : 'इंडियन ऑयल के खाते में जमा करनी है'}
        </div>
      </div>

      <div
        style={{
          width: CARD.dpanelW,
          flex: 'none',
          padding: '26px 24px',
          borderLeft: `3px solid ${c.grid}`,
          background: good ? c.greenSoft : c.cream,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: good ? c.green : c.maroon,
          }}
        >
          DUE DATE
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: good ? 38 : 42,
            fontWeight: 800,
            color: good ? c.green : c.ink,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {good ? 'कुछ नहीं' : figures.dueDate}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 23,
            fontWeight: 700,
            lineHeight: 1.25,
            color: good ? c.green : c.inkSoft,
          }}
        >
          {good ? 'कोई बकाया नहीं' : (verdict ?? 'जमा करने की आख़िरी तारीख़')}
        </div>
      </div>
    </div>
  );
}

function BlockHead({ en, hi }: { en: string; hi: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
      <span
        style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.06em', color: c.maroon }}
      >
        {en}
      </span>
      <span style={{ fontSize: 20, fontWeight: 600, color: c.inkSoft }}>{hi}</span>
    </div>
  );
}

function Tile({ label, value, hindi }: { label: string; value: string; hindi: string }) {
  const credit = value.startsWith('-');
  return (
    <div
      style={{
        width: TILE_W,
        height: 150,
        flex: 'none',
        background: '#ffffff',
        border: `1.5px solid ${c.grid}`,
        borderRadius: 14,
        padding: '16px 16px 14px',
      }}
    >
      <div
        style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em', color: c.maroon }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 36,
          fontWeight: 800,
          color: credit ? c.green : c.ink,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {rupees(value)}
      </div>
      <div style={{ marginTop: 6, fontSize: 19, fontWeight: 600, lineHeight: 1.25, color: c.inkSoft }}>
        {hindi}
      </div>
    </div>
  );
}

function Limits({ data }: { data: CardData }) {
  const { figures } = data;
  const byKey = (k: string) => data.rows.find((r) => r.key === k);
  const showBar = figures.currentLimit > 0 && figures.availedLimit > 0;
  const pct = showBar
    ? Math.min(100, Math.round((figures.availedLimit / figures.currentLimit) * 100))
    : 0;

  return (
    <div
      style={{
        height: CARD.limitsH,
        padding: `22px ${CARD.blockPadX}px`,
        borderBottom: `1.5px solid ${c.grid}`,
      }}
    >
      <BlockHead en="YOUR LIMIT" hi="आपकी उधार सीमा" />
      <div style={{ display: 'flex', gap: CARD.tileGap }}>
        {(['current-limit', 'availed-limit', 'available-limit'] as const).map((k) => {
          const row = byKey(k);
          return (
            <Tile key={k} label={row?.label ?? ''} value={row?.value ?? ''} hindi={row?.hindi ?? ''} />
          );
        })}
      </div>
      {showBar ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              height: 20,
              borderRadius: 10,
              background: '#ffffff',
              border: `1.5px solid ${c.grid}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background:
                  pct >= 85
                    ? `linear-gradient(90deg, #ef4444, ${c.red})`
                    : `linear-gradient(90deg, ${c.gold}, #ea580c)`,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 7,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 19,
              fontWeight: 600,
              color: c.inkSoft,
            }}
          >
            <span>{pct}% इस्तेमाल हो चुकी है</span>
            <span style={{ color: c.green }}>{100 - pct}% बची है</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FormOfLimit({ data }: { data: CardData }) {
  const active = data.figures.formOfLimit;
  return (
    <div
      style={{
        height: CARD.formH,
        padding: `22px ${CARD.blockPadX}px`,
        borderBottom: `1.5px solid ${c.grid}`,
      }}
    >
      <BlockHead en="FORM OF LIMIT" hi="इन तीन में से एक — आपका नीचे हाइलाइट है" />
      <div style={{ display: 'flex', gap: 12 }}>
        {FORMS_OF_LIMIT.map((f) => {
          const on = f === active;
          return (
            <div
              key={f}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '13px 8px',
                borderRadius: 12,
                border: `1.5px solid ${on ? c.maroon : c.grid}`,
                background: on ? c.maroon : '#ffffff',
                color: on ? '#ffffff' : '#a8a29e',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}
            >
              {f}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Foot({ data }: { data: CardData }) {
  return (
    <div
      style={{
        height: CARD.footH,
        padding: `18px ${CARD.blockPadX}px`,
        background: c.goldSoft,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div style={{ flex: 'none' }}>
        <div
          style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em', color: c.maroon }}
        >
          DATA PREPARED AT
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 25,
            fontWeight: 800,
            color: c.ink,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {data.preparedAt} · {data.figures.preparedOn}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          textAlign: 'right',
          fontSize: 19,
          fontWeight: 600,
          lineHeight: 1.3,
          color: c.inkSoft,
        }}
      >
        इस समय तक का हिसाब · इसके बाद की खरीद-भुगतान इसमें नहीं है
      </div>
    </div>
  );
}

/** The pulsing ring drawn over whichever region is being narrated. */
function RegionRing({ rect, local }: { rect: Rect; local: number }) {
  const pulse = (Math.sin(local / 7) + 1) / 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.left - 6,
        top: rect.top - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        borderRadius: 16,
        border: `4px solid ${c.gold}`,
        boxShadow: `0 0 0 ${3 + pulse * 9}px rgba(245,158,11,${0.1 + pulse * 0.16})`,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    />
  );
}

export function CreditCard({
  data,
  activeKey,
  local,
  scale = 1,
}: {
  data: CardData;
  activeKey: string | null;
  local: number;
  scale?: number;
}) {
  const rect = activeKey ? REGION[activeKey] : undefined;

  return (
    <div
      style={{
        width: CARD.width,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        borderRadius: 22,
        overflow: 'hidden',
        position: 'relative',
        background: c.cream,
        border: `6px solid ${c.frame}`,
        boxShadow: '0 24px 60px rgba(24,24,27,0.18)',
        fontFamily: FONT_FAMILY,
      }}
    >
      <BrandBand top />
      <Header code={data.code} />
      <Hero data={data} />
      <Limits data={data} />
      <FormOfLimit data={data} />
      <Foot data={data} />
      <BrandBand />
      {rect ? <RegionRing rect={rect} local={local} /> : null}
    </div>
  );
}
