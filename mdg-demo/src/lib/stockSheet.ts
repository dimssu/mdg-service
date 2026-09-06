/**
 * The OLD, hand-made "STOCK VARIATION" sheet — the one MDG used to type up and
 * send on WhatsApp before the DSR service started generating the card.
 *
 * Dealers who were onboarded early still have months of these in their chat, and
 * some still receive this format, so the explainer has to teach the sheet they
 * actually hold. Everything here describes ONE reference sheet — the sample in
 * `public/stock-variation/sheet.jpg`, with the dealer code masked to `XXXXX`.
 *
 * Two things live in this file, and they must not drift apart:
 *
 *   1. `ROWS` — where each row sits in the photo, measured off the JPEG's grid
 *      lines (see the README beside the image). The video rings a row on a
 *      thumbnail of the sheet, so a wrong band points the dealer at the wrong
 *      line.
 *   2. `FIGURES` — the numbers PRINTED on that photo. The video re-typesets them
 *      large, because a 970px-wide landscape sheet shown inside a portrait phone
 *      video is far too small to read. Re-typesetting is the only way to make it
 *      legible — which means these constants are a transcription, and a typo
 *      here makes the video say one number while the picture behind it shows
 *      another. `assertSheetIsConsistent` guards the one relationship the sheet
 *      states twice.
 */

/** Natural pixel size of `public/stock-variation/sheet.jpg`. */
export const SHEET = { width: 970, height: 745 } as const;

/** Left/right edge of the table itself, inside the decorative border. */
export const TABLE = { left: 36, right: 936 } as const;

/** A horizontal band of the sheet, in source pixels (top inclusive, bottom exclusive). */
export interface Band {
  top: number;
  bottom: number;
}

/**
 * Every row of the reference sheet, measured from the JPEG's grid lines.
 *
 * The two products repeat the same five-row shape, which is exactly what makes
 * the sheet teachable: learn the HSD half and the MS half reads itself.
 */
export const ROWS = {
  hsdHeader: { top: 113, bottom: 150 },
  hsdDate: { top: 150, bottom: 180 },
  hsdVariation: { top: 180, bottom: 210 },
  hsdPermissible: { top: 210, bottom: 239 },
  hsdNotWithin: { top: 239, bottom: 268 },
  hsdAdvice: { top: 268, bottom: 357 },
  hsdReceipt: { top: 358, bottom: 386 },
  hsdTest: { top: 386, bottom: 414 },

  msHeader: { top: 415, bottom: 452 },
  msDate: { top: 452, bottom: 481 },
  msVariation: { top: 481, bottom: 510 },
  msPermissible: { top: 510, bottom: 540 },
  msNotWithin: { top: 540, bottom: 570 },
  msReceipt: { top: 658, bottom: 686 },
  msTest: { top: 686, bottom: 715 },
} as const satisfies Record<string, Band>;

export type RowKey = keyof typeof ROWS;

/** A band spanning several consecutive rows. */
export function span(...keys: RowKey[]): Band {
  const bands = keys.map((k) => ROWS[k]);
  return {
    top: Math.min(...bands.map((b) => b.top)),
    bottom: Math.max(...bands.map((b) => b.bottom)),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * What the reference sheet prints
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ProductFigures {
  /** As printed in the coloured header band. */
  heading: string;
  /** Stock minus book, in litres. Positive = more in the tank than the books say. */
  variation: number;
  /** The allowed band, in litres. */
  permissible: number;
  /**
   * What the sheet prints on the "Variation not within limit" line. `0` when the
   * variation is inside the band. Carries decimals because the figures it is
   * derived from do.
   */
  notWithin: number;
  /** Litres received since the last inspection. */
  totalReceipt: number;
  /** Litres drawn for testing since the last inspection. */
  totalTest: number;
}

/** The date the sheet's "from" columns count from — the last inspection. */
export const SINCE_DATE = '29-Apr-26';
/** The date/time the sheet was taken. */
export const AS_OF = { date: 'Thursday, August 20, 2026', time: '7:30 AM', short: '20-Aug-26' };

export const FIGURES: Record<'hsd' | 'ms', ProductFigures> = {
  hsd: {
    heading: 'HSD STOCK VARIATION',
    variation: 2440,
    permissible: 317,
    notWithin: 2123.13,
    totalReceipt: 178000,
    totalTest: 1120,
  },
  ms: {
    heading: 'MS STOCK VARIATION',
    variation: -379,
    permissible: 423,
    notWithin: 0,
    totalReceipt: 46000,
    totalTest: 1120,
  },
};

/**
 * The sheet states one relationship twice — the variation, the permissible band,
 * and how far outside the band the variation fell. The video walks a dealer
 * through that subtraction out loud, so if the transcription above ever stopped
 * satisfying it the video would be teaching arithmetic that does not work on the
 * picture next to it. Called from the video component so a bad edit fails in the
 * Studio rather than in a rendered MP4.
 *
 * The printed `notWithin` keeps a couple of decimals the two whole-litre figures
 * above it have already been rounded to, so this checks to the litre, not exactly.
 */
export function assertSheetIsConsistent(): void {
  for (const [key, f] of Object.entries(FIGURES)) {
    const outside = Math.abs(f.variation) - f.permissible;
    const expected = outside > 0 ? outside : 0;
    if (Math.abs(expected - Math.abs(f.notWithin)) > 1) {
      throw new Error(
        `stockSheet: ${key} does not add up — |${f.variation}| − ${f.permissible} = ${expected}, ` +
          `but the sheet prints ${f.notWithin} on "Variation not within limit".`,
      );
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Focus — what the video shows for each narration step
 * ──────────────────────────────────────────────────────────────────────────── */

/** One re-typeset line of the sheet, blown up so it is readable on a phone. */
export interface CalloutRow {
  /** The label exactly as the sheet prints it — including its spelling. */
  label: string;
  /** Plain-Hindi gloss of that label. */
  hi: string;
  /** The value as printed. */
  value: string;
  /** Draws the eye to the line the narration is on. */
  active?: boolean;
  /** Tints the value red — used for a figure that needs action. */
  alarm?: boolean;
}

export type Callout =
  | { kind: 'rows'; product: 'hsd' | 'ms'; title: string; rows: CalloutRow[] }
  | { kind: 'advice'; hi: string }
  | { kind: 'note'; title: string; lines: string[] }
  | { kind: 'whole'; title: string; hi: string };

export interface Focus {
  /** Rows ringed on the sheet thumbnail. Empty = show the whole sheet plainly. */
  marks: Band[];
  callout: Callout;
}

const L = {
  variation: (p: 'HSD' | 'MS') => `${p} VERIATION`,
  permissible: 'PERMISSEABLE VARIATION',
  notWithin: 'Variation not within limit',
  date: 'CURRENT DATE AND TIME',
  receipt: `Total recipt from ${SINCE_DATE} to ${AS_OF.short}`,
  test: `Total test from ${SINCE_DATE} to ${AS_OF.short}`,
} as const;

/** Litres, grouped Indian-style, sign kept. */
export function litres(n: number): string {
  const s = Math.abs(n).toLocaleString('en-IN');
  return n < 0 ? `-${s}` : s;
}

const hsdThreeLines = (activeIdx: number): CalloutRow[] => {
  const f = FIGURES.hsd;
  return [
    {
      label: L.variation('HSD'),
      hi: 'किताब और टंकी का फ़र्क़',
      value: litres(f.variation),
      active: activeIdx === 0,
    },
    {
      label: L.permissible,
      hi: 'इतने तक का फ़र्क़ माफ़ है',
      value: litres(f.permissible),
      active: activeIdx === 1,
    },
    {
      label: L.notWithin,
      hi: 'इतने का कोई जवाब नहीं',
      value: litres(f.notWithin),
      active: activeIdx === 2,
      alarm: activeIdx === 2,
    },
  ];
};

const msThreeLines = (activeIdx: number): CalloutRow[] => {
  const f = FIGURES.ms;
  return [
    {
      label: L.variation('MS'),
      hi: 'माइनस — यानी तेल कम निकला',
      value: litres(f.variation),
      active: activeIdx === 0,
    },
    {
      label: L.permissible,
      hi: 'इतने तक का फ़र्क़ माफ़ है',
      value: litres(f.permissible),
      active: activeIdx === 1,
    },
    {
      label: L.notWithin,
      hi: 'शून्य — कुछ नहीं करना',
      value: litres(f.notWithin),
      active: activeIdx === 2,
    },
  ];
};

/**
 * Step → what the screen shows. Keys match the `step` of each scene in
 * `narration.ts` under the `stock-variation-sheet` tutorial.
 */
export const FOCUS_BY_STEP: Record<string, Focus> = {
  intro: {
    marks: [],
    callout: {
      kind: 'whole',
      title: 'STOCK VARIATION',
      hi: 'टंकी में जितना होना चाहिए, और जितना है — दोनों का फ़र्क़',
    },
  },

  blocks: {
    marks: [ROWS.hsdHeader, ROWS.msHeader],
    callout: {
      kind: 'note',
      title: 'शीट के दो हिस्से',
      lines: [
        'ऊपर नीला — HSD, यानी डीज़ल',
        'नीचे नारंगी — MS, यानी पेट्रोल',
        'दोनों में एक जैसी लाइनें हैं',
      ],
    },
  },

  date: {
    marks: [ROWS.hsdDate],
    callout: {
      kind: 'rows',
      product: 'hsd',
      title: FIGURES.hsd.heading,
      rows: [
        {
          label: L.date,
          hi: `${AS_OF.date} — इसी वक़्त की डिप का हिसाब`,
          value: AS_OF.time,
          active: true,
        },
      ],
    },
  },

  variation: {
    marks: [ROWS.hsdVariation],
    callout: {
      kind: 'rows',
      product: 'hsd',
      title: FIGURES.hsd.heading,
      rows: hsdThreeLines(0),
    },
  },

  permissible: {
    marks: [ROWS.hsdPermissible],
    callout: {
      kind: 'rows',
      product: 'hsd',
      title: FIGURES.hsd.heading,
      rows: hsdThreeLines(1),
    },
  },

  bandRule: {
    marks: [ROWS.hsdPermissible],
    callout: {
      kind: 'note',
      title: 'छूट बनती कैसे है?',
      lines: [
        'टंकी के स्टॉक का 4%',
        '+ बिके माल पर उड़ान की छूट — डीज़ल 0.25%, पेट्रोल 0.75%',
        'तेल ज़्यादा निकले तो उड़ान वाली छूट नहीं मिलती',
      ],
    },
  },

  notWithin: {
    marks: [span('hsdVariation', 'hsdNotWithin')],
    callout: {
      kind: 'rows',
      product: 'hsd',
      title: FIGURES.hsd.heading,
      rows: hsdThreeLines(2),
    },
  },

  advice: {
    marks: [ROWS.hsdAdvice],
    callout: {
      kind: 'advice',
      hi: 'D.S.R. book में testing दिखाकर स्टॉक ठीक कर लें — या टैंकर से decantation से पहले किसी और DRUM में निकाल लें।',
    },
  },

  stake: {
    marks: [ROWS.hsdNotWithin],
    callout: {
      kind: 'note',
      title: 'दिशा-निर्देश 5.1.11',
      lines: [
        'तेल सीमा से ज़्यादा (+) — सैंपल जाँच को जाता है, बिक्री और सप्लाई तुरंत रुक सकती है',
        'तेल सीमा से कम (−) — सैंपल जाता है और आपसे लिखित जवाब माँगा जाता है',
      ],
    },
  },

  totals: {
    marks: [span('hsdReceipt', 'hsdTest')],
    callout: {
      kind: 'rows',
      product: 'hsd',
      title: `${SINCE_DATE} से अब तक`,
      rows: [
        {
          label: L.receipt,
          hi: 'आख़िरी जाँच के बाद कुल आवक',
          value: litres(FIGURES.hsd.totalReceipt),
          active: true,
        },
        {
          label: L.test,
          hi: 'आख़िरी जाँच के बाद कुल टेस्टिंग',
          value: litres(FIGURES.hsd.totalTest),
          active: true,
        },
      ],
    },
  },

  ms: {
    marks: [span('msVariation', 'msNotWithin')],
    callout: {
      kind: 'rows',
      product: 'ms',
      title: FIGURES.ms.heading,
      rows: msThreeLines(0),
    },
  },

  msOk: {
    marks: [ROWS.msNotWithin],
    callout: {
      kind: 'rows',
      product: 'ms',
      title: FIGURES.ms.heading,
      rows: msThreeLines(2),
    },
  },

  recap: {
    marks: [],
    callout: {
      kind: 'note',
      title: 'हर बार यही तीन लाइनें',
      lines: [
        'VERIATION — फ़र्क़ कितना है',
        'PERMISSEABLE VARIATION — छूट कितनी है',
        'Variation not within limit — शून्य है तो सब ठीक',
      ],
    },
  },
};
