/**
 * The data behind the "CREDIT & DOD MONITORING" card, in the two states the
 * dealer actually sees it in:
 *   - `due`     — money is owed to Indian Oil (positive DUE AMOUNT + a due date)
 *   - `advance` — the dealer has deposited more than consumed (negative DUE
 *                 AMOUNT, no due date) i.e. they are in credit / एडवांस
 *
 * Numbers mirror the real sample cards (dealer code redacted to XXXXX) so what
 * dealers watch matches the card in their hand. Each row's `key` matches a scene
 * `step` in narration.ts so the video can ring exactly the row it is narrating.
 *
 * FORM OF LIMIT holds exactly ONE of: DOD, CREDIT, or CASH & CARRY — never a
 * combination. The two samples show two of the three (DOD / CREDIT).
 */

export type CardState = 'due' | 'advance';

export interface CardRow {
  /** Matches the narration scene `step` for the per-field scenes. */
  key: string;
  /** English field name (left column of the real card). */
  label: string;
  /** Formatted value (middle column). Empty string renders as a dash. */
  value: string;
  /** Hindi meaning (right column of the real card). */
  hindi: string;
  /** Value is a credit / advance (shown with a minus on the real card). */
  credit?: boolean;
}

/** Indian-grouped rupee string: 6000000 → "60,00,000.00", -29670.1 → "-29,670.10". */
export function inr(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${neg ? '-' : ''}${grouped}.${dec}`;
}

export interface CardData {
  /** Episode-style code shown on the real card header (e.g. "5E01"). */
  code: string;
  /** Timestamp shown in the "Data Prepared At" row. */
  preparedAt: string;
  rows: CardRow[];
}

/** The three possible values of FORM OF LIMIT — exactly one applies at a time. */
const FORM_OF_LIMIT_HINT = 'DOD, क्रेडिट या कैश एंड कैरी — इनमें से एक';

/** State 1 — a healthy "amount due" card (DOD limit, ₹8.03L due). */
export const DUE_CARD: CardData = {
  code: 'XXXXX',
  preparedAt: '3:16:16 PM',
  rows: [
    {
      key: 'due-amount',
      label: 'DUE AMOUNT',
      value: inr(803960.6),
      hindi: 'इंडियन ऑयल के खाते में जमा करनी है',
    },
    {
      key: 'due-date',
      label: 'DUE DATE',
      value: '16-07-2026',
      hindi: 'जमा करने की आख़िरी तारीख़',
    },
    {
      key: 'current-limit',
      label: 'CURRENT LIMIT',
      value: inr(6000000),
      hindi: 'आज तक के लिए निर्धारित राशि',
    },
    {
      key: 'availed-limit',
      label: 'AVAILED LIMIT',
      value: inr(3546192.6),
      hindi: 'अभी तक की गई खपत की राशि',
    },
    {
      key: 'available-limit',
      label: 'AVAILABLE LIMIT',
      value: inr(2453807.4),
      hindi: 'खपत के लिए बची हुई राशि',
    },
    {
      key: 'form-of-limit',
      label: 'FORM OF LIMIT',
      value: 'DOD',
      hindi: FORM_OF_LIMIT_HINT,
    },
    {
      key: 'prepared-at',
      label: 'Data Prepared At',
      value: '',
      hindi: '3:16:16 PM',
    },
  ],
};

/** State 2 — the credit / advance card (CREDIT limit, negative DUE AMOUNT). */
export const ADVANCE_CARD: CardData = {
  code: 'XXXXX',
  preparedAt: '3:16:16 PM',
  rows: [
    {
      key: 'due-amount',
      label: 'DUE AMOUNT',
      value: inr(-74818.86),
      hindi: 'इंडियन ऑयल के खाते में जमा राशि',
      credit: true,
    },
    {
      key: 'due-date',
      label: 'DUE DATE',
      value: '',
      hindi: 'कोई बकाया नहीं',
    },
    {
      key: 'current-limit',
      label: 'CURRENT LIMIT',
      value: inr(0),
      hindi: 'आज तक के लिए निर्धारित राशि',
    },
    {
      key: 'availed-limit',
      label: 'AVAILED LIMIT',
      value: inr(-74818.86),
      hindi: 'अभी तक की गई खपत की राशि',
      credit: true,
    },
    {
      key: 'available-limit',
      label: 'AVAILABLE LIMIT',
      value: inr(74818.86),
      hindi: 'खपत के लिए बची हुई राशि',
    },
    {
      key: 'form-of-limit',
      label: 'FORM OF LIMIT',
      value: 'CREDIT',
      hindi: FORM_OF_LIMIT_HINT,
    },
    {
      key: 'prepared-at',
      label: 'Data Prepared At',
      value: '',
      hindi: '3:16:16 PM',
    },
  ],
};

export const CARD_BY_STATE: Record<CardState, CardData> = {
  due: DUE_CARD,
  advance: ADVANCE_CARD,
};

/**
 * Which card state + which row each scene `step` refers to. Field steps ring one
 * row on the due-state card; `advance` shows the credit card and rings DUE
 * AMOUNT; the framing steps (intro/overview/act/recap) ring nothing special.
 */
export function stepToFocus(step: string): { state: CardState; activeKey: string | null } {
  switch (step) {
    case 'advance':
      return { state: 'advance', activeKey: 'due-amount' };
    case 'act':
      return { state: 'due', activeKey: 'available-limit' };
    case 'card-full':
    case 'recap':
      return { state: 'due', activeKey: null };
    default:
      // A per-field step (due-amount, due-date, current-limit, …).
      return { state: 'due', activeKey: step };
  }
}
