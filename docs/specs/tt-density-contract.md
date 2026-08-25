# Build contract — `tt-density`

**Status:** Accepted for build
**Date:** 2026-08-24
**Design:** `docs/ADR/0010-tt-density.md` — read it first; this document does not repeat the reasoning, only the shapes.
**Audience:** the five implementers of P1–P5. You will not talk to each other. Everything you need is here.
**Slug:** `tt-density` (kebab, 2+ chars, no underscore — `attachServiceSchema` rejects underscores).

---

## 0. How to read this

Everything below is **final**. Where a type, signature or file path appears here,
write it exactly as written. Where you find this document is wrong about the
codebase, stop and say so rather than improvising — a divergence between two
packages is the only failure mode this document exists to prevent.

Three standing rules that override any habit:

1. **Every file reads as if the owner wrote it himself.** No tool, vendor or
   assistant is named in any file, comment, doc or commit message.
2. **Comment voice:** every module opens with a `/** … */` header whose first
   line says what it does in words a pump owner would recognise, then says WHY IT
   EXISTS — the failure it defends against, in the past tense, with real numbers.
   The exemplars to read before you write a line:
   `mdg-backend/src/automation/sdms/portalResponse.ts`,
   `mdg-backend/src/automation/sdms/humanize.ts`,
   `mdg-backend/src/lib/runs/withDeadline.ts`, `shared/src/dsr/receipts.ts`.
3. **The service is READ-ONLY on the IndianOil portal.** It sets two dates,
   presses Fetch, reads the table and downloads PDFs. It must **never** touch
   _Vehicle Condition_, _Check Ack Status_ or _Acknowledge Receipt_.
   Acknowledging a receipt is a legal act by the dealer. This sentence belongs in
   `collector.ts`, in the service README, and nowhere is it optional.

### 0.1 What outranks what

Three documents describe this feature. **This one is the build contract and it
wins.** Where you find the other two disagreeing with it, they are stale — the
disagreements were found, resolved and written down in §13, and both files were
amended.

| Document                         | What it is for                                      | Authority                                                                                        |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `docs/ADR/0010-tt-density.md`    | why each decision was made                          | binding on _reasoning_; if a shape here contradicts it, the shape here wins and the ADR is stale |
| `docs/product/tt-density-prd.md` | what the product must do, and for whom              | binding on _intent_ — the acceptance criteria are the QA script                                  |
| `docs/specs/tt-density-ux.md`    | what a screen looks like and how it behaves         | binding on _user-visible behaviour_ — colours, copy, geometry, gestures                          |
| **this file**                    | **every type, route, key, file path and signature** | **binding, and it wins any conflict**                                                            |

If a fourth reading of the codebase shows this document is wrong about the repo,
stop and say so rather than improvising. A divergence between two packages is the
only failure mode this document exists to prevent.

Commit style: `type(scope): lowercase prose statement of the new state of the
world`, no trailing period, no footers. e.g.
`feat(tt-density): an invoice is identified by its SAP number, per dealer`.

---

## 1. The domain, in one page

The IndianOil e-Mitra portal has a screen **TT Acknowledgement ▸ Download
Invoice**. It shows two date fields pre-filled to a seven-day window ending
today, an orange **Fetch** button, and a table:

| SAP Invoice # | Invoice Date | Vehicle #  | Vehicle Condition | Download PDF | Check Ack Status | Acknowledge Receipt |
| ------------- | ------------ | ---------- | ----------------- | ------------ | ---------------- | ------------------- |
| 7010045406    | 22-08-2026   | BR09GC8009 | _(select)_        | Download     | Check            | Acknowledge         |
| 7009874468    | 17-08-2026   | BR09GC4786 | _(select)_        | Download     | Check            | Acknowledge         |

The last three columns are forbidden (see §0.3). We read the first three and
click **Download**.

The PDF is an IndianOil TAX INVOICE with a real text layer. Extraction was
prototyped and **verified** against the real file `7010045406.pdf`. The proven
output, which the parser must reproduce:

```
sapInvoiceNo   7010045406
ttNo           BR09GC8009
invoiceDate    22-Aug-26
invoiceTime    16:37
headerDen15    820.50
docNumber      20272323B052074
invoiceTotal   1248441.00
deliveryNo     0573542169 / Sales Order 0913183557
items:
  { itemNo: 10, materialCode: "16730", description: "EBMS",     quantity: 6, unit: "KL",
    tankNo: "T017", compartments: ["1","2"], density15: 727.3, sampleNo: "EBMS/PLIOCTBR/17/101" }
  { itemNo: 20, materialCode: "50700", description: "HSD-BSVI", quantity: 6, unit: "KL",
    tankNo: "T018", compartments: ["3","4"], density15: 820.5, sampleNo: "HSD/PL/IOCTBR/18/24" }
```

**EBMS** (Ethanol Blended Motor Spirit, material 16730) is ordinary petrol —
`727.300`. **HSD-BSVI** (material 50700) is diesel — `820.500`. Those two figures
are the whole point of the service.

Separately, one photo a day of the outlet's **density test register page** marks
that day done. No typed number, no comparison. See ADR 0010 §9.

---

## 2. (a) Shared types — `@dk/shared`

### 2.1 NEW FILE — `shared/src/tt/materials.ts`

**Why a new file and not `shared/src/dsr/products.ts`.** That table is keyed by
**IRAS product code** — two-letter codes (`HS`, `MS`, `X2`, `XG`) that come off a
completely different portal. This table is keyed by **IOCL SAP material code** —
five-digit codes (`16730`, `50700`) that come off a tax invoice. Two vocabularies
for the same physical fuel. Merging them would need a discriminator on every row
and would make `dsrProductProfile('16730')` a call that looks meaningful and
returns junk. What the two tables _share_ is their **output key** (`MS`, `HSD`,
`XP`, `XG`), so a future reconciliation joins on the key without either table
being rewritten — which is exactly the seam ADR 0010 §9 promises.

```ts
/**
 * What each IndianOil SAP material code IS, as printed on a tanker invoice.
 *
 * The invoice names a product twice and neither name is ours: a five-digit SAP
 * material code (`16730`) and a short description (`EBMS`, `HSD-BSVI`). Neither
 * is the vocabulary the rest of this platform speaks, which is the DSR's product
 * key — `MS`, `HSD`, `XP`, `XG` — reached from the IRAS product codes in
 * `../dsr/products`. This table is the bridge, and it deliberately produces the
 * SAME key, so a figure read off an invoice and a figure read off IRAS can be
 * put beside each other later without either table changing shape.
 *
 * WHY IT DEGRADES INSTEAD OF FAILING
 * ----------------------------------
 * We have evidence for exactly two material codes, both from one real invoice:
 * 16730 = EBMS = Ethanol Blended Motor Spirit = ordinary petrol, and
 * 50700 = HSD-BSVI = diesel. XtraPremium, XtraGreen, and whatever IndianOil
 * numbers next are unknown to us today. An outlet whose premium nozzle stopped
 * their density figures from being read at all would be a worse failure than one
 * whose figure is labelled by the words the invoice itself used — so an
 * unrecognised code falls back to a description ladder, and an unrecognised
 * description still yields a complete profile keyed by the description, marked
 * {@link TtProductProfile.provisional} so a screen can ask a human for the name.
 * This is the same philosophy, and deliberately the same wording, as
 * `dsrProductProfile` in `../dsr/products`.
 *
 * Add a row only with evidence — a real invoice naming the grade. A guessed
 * label prints beside a number a dealer copies into their register.
 */
import type { DsrProductFamily } from '../dsr/products';

/** What a material code is, once resolved. */
export interface TtProductProfile {
  /** The SAP material code exactly as the invoice printed it, e.g. `16730`. */
  materialCode: string;
  /** The invoice's own short description, verbatim, e.g. `HSD-BSVI`. */
  description: string;
  /**
   * The platform-wide product key. Deliberately the same vocabulary as
   * `DsrProductProfile.key` so the two catalogs join.
   */
  key: string;
  labelEn: string;
  labelHi: string;
  family: DsrProductFamily;
  /**
   * True when neither the code nor the description was recognised and everything
   * here is a placeholder a human should confirm.
   */
  provisional: boolean;
}

/** Material codes seen on a real invoice. Both from `7010045406.pdf`, 22-Aug-26. */
const MATERIAL_CATALOG: Record<
  string,
  Omit<TtProductProfile, 'materialCode' | 'description' | 'provisional'>
> = {
  /** Ethanol Blended Motor Spirit — ordinary petrol. Verified: 727.300 kg/m³. */
  '16730': { key: 'MS', labelEn: 'MOTOR SPIRIT', labelHi: 'मोटर स्पिरीट', family: 'PETROL' },
  /** High Speed Diesel, BS-VI. Verified: 820.500 kg/m³. */
  '50700': {
    key: 'HSD',
    labelEn: 'HIGH SPEED DIESEL',
    labelHi: 'हाई स्पीड डीजल',
    family: 'DIESEL',
  },
};

/**
 * The description ladder, tried when the material code is unknown.
 *
 * ORDER IS LOAD-BEARING and runs most-specific first. A branded grade's
 * description contains the plain grade's words — "XTRA PREMIUM MS" contains
 * "MS", "XTRAGREEN DIESEL" contains "DIESEL" — so testing MS or HSD first would
 * label every premium grade as the ordinary one, silently, on a figure a dealer
 * reads. The premium patterns therefore lead.
 */
const DESCRIPTION_LADDER: readonly {
  re: RegExp;
  profile: Omit<TtProductProfile, 'materialCode' | 'description' | 'provisional'>;
}[] = [
  {
    re: /xtra\s*-?\s*premium|^xp\b/i,
    profile: { key: 'XP', labelEn: 'XTRAPREMIUM', labelHi: 'एक्स्ट्रा प्रीमियम', family: 'PETROL' },
  },
  {
    re: /xtra\s*-?\s*green|^xg\b/i,
    profile: { key: 'XG', labelEn: 'XTRAGREEN', labelHi: 'एक्स्ट्रा ग्रीन', family: 'DIESEL' },
  },
  {
    re: /^hsd\b|high\s*speed\s*diesel/i,
    profile: {
      key: 'HSD',
      labelEn: 'HIGH SPEED DIESEL',
      labelHi: 'हाई स्पीड डीजल',
      family: 'DIESEL',
    },
  },
  {
    re: /^ebms\b|^ms\b|motor\s*spirit|petrol/i,
    profile: { key: 'MS', labelEn: 'MOTOR SPIRIT', labelHi: 'मोटर स्पिरीट', family: 'PETROL' },
  },
];

/** Every material code this table knows, for display and validation. */
export const TT_KNOWN_MATERIAL_CODES = Object.keys(MATERIAL_CATALOG);

/**
 * The profile for one invoice line, inventing a provisional one when neither the
 * material code nor the description is recognised, so a reading is never lost.
 */
export function ttProductProfile(materialCode: string, description: string): TtProductProfile {
  const code = String(materialCode ?? '').trim();
  const desc = String(description ?? '').trim();

  const byCode = MATERIAL_CATALOG[code];
  if (byCode) return { materialCode: code, description: desc, provisional: false, ...byCode };

  for (const entry of DESCRIPTION_LADDER) {
    if (entry.re.test(desc)) {
      // Recognised by words rather than by number: the grade is known, the code
      // is not. `provisional` stays false — the label is right — but the code is
      // worth adding to the catalog next time somebody has the invoice in hand.
      return { materialCode: code, description: desc, provisional: false, ...entry.profile };
    }
  }

  // The description itself is the least surprising placeholder: it is what
  // IndianOil calls the grade and what the dealer's own staff will recognise.
  const fallback = desc || code || 'UNKNOWN';
  return {
    materialCode: code,
    description: desc,
    key: fallback,
    labelEn: fallback,
    labelHi: fallback,
    family: 'UNKNOWN',
    provisional: true,
  };
}
```

### 2.2 NEW FILE — `shared/src/types/ttDensity.ts`

```ts
/**
 * TT Density — the tanker invoices an outlet received, and the density each load
 * was certified at.
 *
 * Every tanker that reaches a pump arrives with a tax invoice, and printed on
 * that invoice, under each product line, is the figure the load was measured at:
 * `Density@15: 820.500`. That figure is what a dealer copies into their own
 * density register on the day the tanker lands, and it is the only reason this
 * service exists. Everything else on the invoice is carried along because it
 * identifies which tanker the figure came from.
 *
 * Two shapes, because two different things write them. {@link TtInvoice} is
 * written by a robot at half past seven in the morning and keyed by the invoice
 * number; {@link TtDensityDayLog} is written by a person with a camera and keyed
 * by the calendar day. The service fetches a SEVEN-day window every day, so any
 * one invoice is seen about seven times — which is why the invoice number, and
 * not the sighting, is the identity. See ADR 0010 §4.
 */
import type { DsrProductFamily } from '../dsr/products';

/** What a single run did about the window it fetched. */
export const TT_DENSITY_OUTCOMES = [
  /** The window was read and every listed invoice is now stored with its PDF. */
  'COLLECTED',
  /** The portal listed nothing for those days. A week without a tanker is an ordinary week. */
  'NO_INVOICES',
  /** Some invoices stored; at least one row failed or was left for the next run. */
  'PARTIAL',
  /** A rehearsal: everything resolved and read, nothing downloaded. */
  'DRY_RUN',
  /** The run could not complete; see the run's failure code. */
  'FAILED',
] as const;
export type TtDensityOutcome = (typeof TT_DENSITY_OUTCOMES)[number];

/** Whether we hold the bytes IndianOil issued for this invoice. */
export const TT_INVOICE_PDF_STATUSES = [
  /** Seen on the portal; the PDF has not been fetched yet, or the last attempt failed. */
  'PENDING',
  /** The bytes are in the bucket at `pdfKey` and will never be fetched again. */
  'STORED',
  /** Fetching failed `TT_PDF_MAX_ATTEMPTS` times; this one needs an engineer. */
  'FAILED',
] as const;
export type TtInvoicePdfStatus = (typeof TT_INVOICE_PDF_STATUSES)[number];

/** How much of the invoice's text we could read. */
export const TT_INVOICE_PARSE_STATUSES = [
  /** No PDF yet, so nothing has been read. */
  'PENDING',
  /** Every product line yielded a density. */
  'READ',
  /** At least one product line yielded a density and at least one did not. */
  'PARTIAL',
  /** Text was extracted but no product line yielded a density, or there was no text layer. */
  'UNREADABLE',
] as const;
export type TtInvoiceParseStatus = (typeof TT_INVOICE_PARSE_STATUSES)[number];

/** Whether the day's density-register page has been photographed. */
export const TT_REGISTER_DAY_STATUSES = [
  /** A photo is on file; the day is done. */
  'MARKED',
  /** No photo. The day is not done. */
  'MISSING',
] as const;
export type TtRegisterDayStatus = (typeof TT_REGISTER_DAY_STATUSES)[number];

/**
 * How many invoices back `getLatestDensities` looks for each product.
 *
 * A busy outlet takes one to three tankers a day, so forty invoices is two to
 * six weeks of deliveries — long enough that every grade the outlet actually
 * stocks has appeared at least once, short enough that the read is a single
 * bounded index scan rather than an aggregation over a dealer's whole history
 * (roughly 400–1,000 invoices a year each). A grade absent from the last forty
 * deliveries drops out of the headline, which is the right answer: printing a
 * months-old figure in large type beside today's is how a stale number gets
 * copied into a register.
 */
export const TT_LATEST_DENSITY_SCAN_LIMIT = 40;

/**
 * How many times a single invoice's PDF is chased before it is given up on.
 *
 * Three, not one, because the two likeliest causes — a portal hiccup and a run
 * that ran out of its seven minutes — both clear by themselves on tomorrow's
 * run. Not ten, because a fourth attempt on a row that has failed on three
 * different days is not a retry, it is a daily tax on every run for an invoice
 * that needs an engineer.
 */
export const TT_PDF_MAX_ATTEMPTS = 3;

/**
 * How many days a DEALER may still mark from the app, counting today.
 *
 * SEVEN, INCLUSIVE OF TODAY — today plus the six days before it. The oldest
 * date a dealer may mark is therefore `today - 6`, and
 * `TtDensityMeView.earliestMarkableDate` is computed exactly that way. Read the
 * constant as "how many days are open", never as "how many days back", or the
 * client's `<input min>` and the server's refusal will be one day apart and a
 * dealer will be told a day is too old by a screen that just offered it.
 *
 * Seven because it is the same seven as the portal's own filter and our fetch
 * window: one number in the whole service means one number to explain and no
 * place for two to drift. It is also what a person can honestly reconstruct
 * from a paper register they are holding.
 */
export const TT_REGISTER_DEALER_BACKDATE_DAYS = 7;

/**
 * How many days an ADMIN may mark on a dealer's behalf, counting today.
 *
 * Sixty, inclusive, so the oldest admin-markable date is `today - 59`. An
 * account manager clearing a backlog after a dealer's phone broke is the case;
 * a year of back-filled days from one photograph is not.
 */
export const TT_REGISTER_ADMIN_BACKDATE_DAYS = 60;

/** How many days of register history the DEALER's own `/me` payload carries. */
export const TT_REGISTER_RECENT_DAYS = 14;

/**
 * When a headline figure stops being "current" and starts being "old".
 *
 * Seven days is the portal's own filter and our fetch window, so anything
 * inside it is current by construction. Twenty-one days without a tanker of a
 * grade the outlet stocks is abnormal enough that somebody should ask about it —
 * so 8–20 days is `ageing` and 21+ is `stale`.
 *
 * Both surfaces read these two numbers. They are in `shared` and not in a
 * component precisely so the admin pane and the dealer's app cannot decide
 * "old" means different things about the same figure.
 */
export const TT_DENSITY_AGEING_AFTER_DAYS = 8;
export const TT_DENSITY_STALE_AFTER_DAYS = 21;

/** The three-state ladder a screen renders a headline figure in. */
export type TtDensityFreshness = 'FRESH' | 'AGEING' | 'STALE';

/** Which of the three states an age in whole IST days falls in. */
export function ttDensityFreshness(ageDays: number): TtDensityFreshness {
  if (ageDays >= TT_DENSITY_STALE_AFTER_DAYS) return 'STALE';
  if (ageDays >= TT_DENSITY_AGEING_AFTER_DAYS) return 'AGEING';
  return 'FRESH';
}

/** One product line of an invoice, as stored — the invoice's own words only. */
export interface TtInvoiceItem {
  /** SAP line-item number: 10, 20, 30… */
  itemNo: number | null;
  /** SAP material code, verbatim: `16730`. */
  materialCode: string;
  /** The invoice's short description, verbatim: `HSD-BSVI`. */
  description: string;
  /** Quantity as printed. Not converted — see `unit`. */
  quantity: number | null;
  /** The unit as printed, normally `KL`. */
  unit: string | null;
  /** The outlet tank the load went into, verbatim: `T018`. */
  tankNo: string | null;
  /** Tanker compartments, verbatim: `["3","4"]`. */
  compartments: string[];
  /** The parsed figure. Null when the line printed none we could read. */
  density15: number | null;
  /**
   * The figure exactly as printed: `"820.500"`. This is what the UI renders.
   * The invoice states no unit — kg/m³ at 15 °C is our reading of the
   * magnitude, not IndianOil's statement — so the digits are never reformatted.
   */
  density15Raw: string | null;
  /** The sample reference, verbatim: `HSD/PL/IOCTBR/18/24`. */
  sampleNo: string | null;
  /** Why a figure is missing or doubtful. Present only when something is wrong. */
  extractionNote?: string | null;
}

/** One product line as a screen sees it: the invoice's words plus our labels. */
export interface TtInvoiceProduct extends TtInvoiceItem {
  /** Platform product key — joins to `DsrProductProfile.key`. */
  productKey: string;
  labelEn: string;
  labelHi: string;
  family: DsrProductFamily;
  /** True when neither the material code nor the description was recognised. */
  provisional: boolean;
}

/** Why an invoice's PDF could not be fetched or read. */
export interface TtInvoiceFailure {
  at: string;
  code: string;
  reason: string;
  runId?: string | null;
}

/** One tanker invoice for one dealer. Identity is `(dealerId, sapInvoiceNo)`. */
export interface TtInvoice {
  id: string;
  dealerId: string;
  dealerCode?: string | null;
  /** The portal's SAP Invoice #, verbatim: `7010045406`. */
  sapInvoiceNo: string;
  /** IST calendar day, `YYYY-MM-DD`, normalised from the portal's table. */
  invoiceDate: string;
  /** The portal's own date text, verbatim: `22-08-2026`. */
  invoiceDateRaw?: string | null;
  /** `HH:mm` from the PDF. Null until the PDF is read. */
  invoiceTime?: string | null;
  /** The portal table's Vehicle #, verbatim: `BR09GC8009`. */
  vehicleNo?: string | null;
  /** The PDF's own TT number. Recorded separately; a mismatch is a warning, not an error. */
  ttNo?: string | null;

  /** When this invoice was first listed by the portal, and most recently re-listed. */
  firstSeenAt: string;
  lastSeenAt: string;
  /** How many runs have listed it. Seven-ish for an invoice a week old. */
  sightings: number;

  pdfStatus: TtInvoicePdfStatus;
  /** Never serialised to a client. Present here only so the store's own callers can sign it. */
  pdfSize?: number | null;
  /** SHA-256 of the stored bytes: what settles a dispute about whether we altered the invoice. */
  pdfSha256?: string | null;
  pdfCapturedAt?: string | null;
  pdfAttempts: number;
  pdfFailure?: TtInvoiceFailure | null;

  parseStatus: TtInvoiceParseStatus;
  /** The density printed in the invoice header. Recorded, never relied on. */
  headerDensity15?: number | null;
  docNumber?: string | null;
  invoiceTotal?: number | null;
  /** Verbatim, e.g. `0573542169 / Sales Order 0913183557`. */
  deliveryNoRaw?: string | null;
  deliveryNo?: string | null;
  salesOrderNo?: string | null;
  /** The date the PDF itself printed, normalised. */
  pdfInvoiceDate?: string | null;
  /** True when the PDF's date and the portal table's date disagree. */
  dateMismatch: boolean;

  products: TtInvoiceProduct[];
  /** Everything the parser wanted to say but could not fix. */
  parseWarnings: string[];

  createdAt: string;
  updatedAt: string;
}

/** The row shape of the invoice table under the headline. */
export interface TtInvoiceSummary {
  id: string;
  sapInvoiceNo: string;
  invoiceDate: string;
  invoiceTime?: string | null;
  vehicleNo?: string | null;
  pdfStatus: TtInvoicePdfStatus;
  parseStatus: TtInvoiceParseStatus;
  /**
   * One entry per product line, in invoice order.
   *
   * `quantity` and `unit` are here because the admin list renders
   * `[MS] 727.300 · 6 KL` on one line — a row that had to fetch the full
   * invoice to print its own quantity would be a request per row.
   */
  densities: {
    productKey: string;
    labelEn: string;
    labelHi: string;
    density15: number | null;
    density15Raw: string | null;
    tankNo: string | null;
    quantity: number | null;
    unit: string | null;
  }[];
}

/**
 * The headline: the most recent density this outlet received for one product.
 *
 * ORDER IS PART OF THE CONTRACT. `getLatestDensities` returns these already
 * sorted — `DIESEL` family first, then `PETROL`, then everything else, and
 * within a family by product key — and both surfaces render them in the order
 * they arrive. Sorting in each screen instead would mean the admin pane and the
 * dealer's app could disagree about which figure is the important one, which is
 * exactly the thing a dealer copying a number off a phone must never encounter.
 * Diesel leads because it is the higher-volume product at almost every outlet.
 *
 * There is no entry for a product that has never been delivered. This service
 * has no idea which grades an outlet stocks — only which grades have arrived —
 * so an "expected but never seen" tile is a fact we do not hold and must not
 * invent.
 */
export interface TtLatestDensity {
  productKey: string;
  labelEn: string;
  labelHi: string;
  family: DsrProductFamily;
  provisional: boolean;
  /** The SAP material code the invoice printed, e.g. `16730`. */
  materialCode: string;
  /** The invoice's own short description, verbatim, e.g. `EBMS`. */
  description: string;
  density15: number;
  /** As printed. Render this, not the number. */
  density15Raw: string;
  /** Which invoice it came from — always shown beside the figure. */
  invoiceId: string;
  sapInvoiceNo: string;
  invoiceDate: string;
  vehicleNo?: string | null;
  tankNo?: string | null;
  /** Whole IST days between that invoice's date and today. */
  ageDays: number;
}

/** One photograph of the density-register page. Nothing here is ever deleted. */
export interface TtRegisterPhoto {
  storageKey: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  /**
   * Who sent it. `name` is denormalised at write time on purpose: the admin's
   * day panel prints "Added by Priya (MDG)", and resolving a user id to a name
   * per day would be a second request per calendar cell.
   */
  uploadedBy: { kind: 'dealer' | 'admin'; userId: string | null; name: string | null };
  note?: string | null;
  /** Set when a later upload replaced this one for the same day. */
  supersededAt?: string | null;
}

/** One dealer's density-register day. Unique per `(dealerId, businessDate)`. */
export interface TtDensityDayLog {
  id: string;
  dealerId: string;
  dealerCode?: string | null;
  /** IST calendar day, `YYYY-MM-DD`. */
  businessDate: string;
  status: TtRegisterDayStatus;
  /** The photo that currently marks the day. */
  photo: TtRegisterPhoto | null;
  /** Earlier photos for the same day, newest first. A blurry photo is a real thing. */
  superseded: TtRegisterPhoto[];
  markedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A day reduced to the one fact a strip of days needs to show. */
export interface TtRegisterDaySummary {
  businessDate: string;
  status: TtRegisterDayStatus;
  markedAt: string | null;
  uploadedBy: { kind: 'dealer' | 'admin'; userId: string | null; name: string | null } | null;
  /** How many photos exist for the day, current plus superseded. */
  photoCount: number;
}

/**
 * The admin Vault pane's payload for one dealer. Never 404s: a dealer that has
 * never been collected returns an empty summary so the pane renders a clean
 * empty state rather than an error.
 */
export interface TtDensitySummary {
  dealerId: string;
  dealerCode?: string | null;
  /** Today in IST, so no screen has to work it out. */
  today: string;
  /** The big figures. Empty until the first invoice is read. */
  latest: TtLatestDensity[];
  invoiceCount: number;
  /** Invoices we have seen but whose PDF we do not yet hold. */
  pdfPendingCount: number;
  /** Invoices whose PDF was given up on. Non-zero means an engineer is needed. */
  pdfFailedCount: number;
  /** The most recent invoices, newest first. */
  recent: TtInvoiceSummary[];
  /** The last 14 IST days of register photos, newest first. */
  register: TtRegisterDaySummary[];
  /** Read from the most recent ServiceRun for this dealer and `tt-density`. */
  lastRunAt: string | null;
  lastOutcome: TtDensityOutcome | null;
  lastFailure: { at: string; reason: string; code: string; runId?: string | null } | null;
}

/**
 * What the dealer's own app sees: their densities and their days. Never an
 * invoice, never a PDF, never a rupee figure — the tax invoice is a financial
 * document and stays admin-only (ADR 0010 §13).
 *
 * The dealer DOES see the figures. That is the owner's stated requirement —
 * *"these extracted values … need to be shown at the top in big fonts"* — and it
 * is the whole reason a dealer opens this screen at all rather than the portal.
 * What they never see is our words for it: no "Density@15", no "kg/m³", no
 * "acknowledgement". Just DIESEL, the number, and which tanker it came off.
 */
export interface TtDensityMeView {
  dealerId: string;
  today: string;
  /**
   * False when this dealer does not have `tt-density` attached. The route
   * answers 200 with an otherwise-empty view rather than 404, so the app can
   * render its calm "not on for your pump yet" state instead of an error — the
   * same posture `GET /kavach/me` takes.
   */
  attached: boolean;
  /** Sorted diesel-first by the store; render in the order given. */
  latest: TtLatestDensity[];
  /** Newest first, `TT_REGISTER_RECENT_DAYS` long. */
  days: TtRegisterDaySummary[];
  /** How many of those days carry a photo. */
  markedDays: number;
  /**
   * The oldest date this dealer may still mark, `YYYY-MM-DD` IST —
   * `today - (TT_REGISTER_DEALER_BACKDATE_DAYS - 1)`. The client feeds this
   * straight into `<input type="date" min>` so the screen and the server refuse
   * exactly the same set of days.
   */
  earliestMarkableDate: string;
}

/** Two short-lived signed URLs for one stored object. */
export interface TtSignedFileUrls {
  /** `inline` disposition — for an `<iframe>` or an `<img>`. */
  viewUrl: string;
  /** `attachment` disposition — for a save. */
  downloadUrl: string;
  filename: string;
  contentType: string;
  expiresIn: number;
}
```

### 2.3 NEW FILE — `shared/src/schemas/ttDensity.ts`

```ts
import { z } from 'zod';

/**
 * Wire shapes for the TT Density routes.
 *
 * The date rules are the interesting part. A bare `YYYY-MM-DD` regex accepts
 * `2026-06-31`, which `Date.UTC` silently rolls over to 1 July — so every
 * business date is round-tripped through IST midday and compared with itself,
 * the same guard `dsrReport` and `irasData` already use. And every date is an
 * IST calendar day, never an instant: the production box runs UTC, and "today"
 * on a UTC box is yesterday for five and a half hours of every Indian evening.
 */

/** Minutes east of UTC. Fixed: India has never observed DST since 1945. */
const IST_OFFSET_MS = 330 * 60 * 1000;

/** The IST calendar date of an instant, `YYYY-MM-DD`. Duplicated from the backend's
 *  `utils/ist.ts` because `shared` may not import from a sub-app. */
function istDateKeyUtc(instant: Date): string {
  return new Date(instant.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function isRealCalendarDate(v: string): boolean {
  const [y, m, d] = v.split('-').map(Number);
  if (!y || !m || !d) return false;
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

export const ttBusinessDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine(isRealCalendarDate, 'Not a real calendar date')
  .refine((v) => v <= istDateKeyUtc(new Date()), 'Cannot mark a day that has not happened yet');

/** A photo that marks one day's density register as done. */
export const ttRegisterPhotoSchema = z.object({
  /** The key returned by `POST /uploads/sign` with `scope: 'tt-density'`. */
  storageKey: z.string().min(1).max(512),
  filename: z.string().min(1).max(255),
  contentType: z
    .string()
    .min(1)
    .max(127)
    .refine((v) => v.startsWith('image/'), 'The register page must be a photo'),
  size: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
  note: z.string().trim().max(500).optional(),
});
export type TtRegisterPhotoInput = z.infer<typeof ttRegisterPhotoSchema>;

export const ttInvoiceListQuerySchema = z.object({
  /** Inclusive IST bounds on `invoiceDate`. */
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isRealCalendarDate, 'Not a real calendar date')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isRealCalendarDate, 'Not a real calendar date')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type TtInvoiceListQuery = z.infer<typeof ttInvoiceListQuerySchema>;

/**
 * How the admin asks for a stretch of register days.
 *
 * Two shapes in one schema, because the pane asks two different questions with
 * the same endpoint. `limit` alone answers "the last N days", which is what the
 * pane's first render wants. `from`+`to` answers "August", which is what the
 * month calendar wants the moment an operator presses the ‹ arrow — and without
 * it there is no way to see September's gaps in October, which is precisely the
 * month-end audit the calendar exists for.
 *
 * `from`/`to` win when both are supplied; the range is inclusive and capped at
 * 120 days so a mis-typed year cannot ask for a decade.
 */
export const ttRegisterDaysQuerySchema = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(isRealCalendarDate, 'Not a real calendar date')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(isRealCalendarDate, 'Not a real calendar date')
      .optional(),
    limit: z.coerce.number().int().min(1).max(120).default(30),
  })
  .refine((q) => !(q.from && q.to) || q.from <= q.to, 'from must not be after to')
  .refine(
    (q) => !(q.from && q.to) || daysBetweenInclusive(q.from, q.to) <= 120,
    'That range is longer than 120 days',
  );
export type TtRegisterDaysQuery = z.infer<typeof ttRegisterDaysQuerySchema>;

/** Inclusive day count between two `YYYY-MM-DD` dates. Local to this module. */
function daysBetweenInclusive(from: string, to: string): number {
  const a = Date.parse(`${from}T12:00:00Z`);
  const b = Date.parse(`${to}T12:00:00Z`);
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Body of the admin's "collect now". `lookbackDays` is a ONE-RUN override, not a
 * config change: it is merged over the stored config for this run only, which is
 * how a dealer new to the service gets a month fetched once without leaving a
 * month-wide window running every morning for ever.
 */
export const ttDensityCollectSchema = z
  .object({
    lookbackDays: z.number().int().min(1).max(31).optional(),
  })
  .default({});
export type TtDensityCollectInput = z.infer<typeof ttDensityCollectSchema>;
```

### 2.4 MODIFY — `shared/src/types/dealerService.ts`

Append to `ROSTER_SERVICES`, after the `water-ingress-testing` entry:

```ts
  {
    id: 'tt-density',
    label: 'TT Density',
    shortLabel: 'Density',
    // Nothing is sent to the dealer: the run either read the window or it did
    // not. The daily register photo is deliberately NOT what this column
    // reports — see ADR 0010 §13.
    delivers: false,
  },
```

### 2.5 MODIFY — `shared/src/schemas/chat.ts`

One line inside `presignUploadSchema`, plus the doc-comment on `dealerId`.

> **The scope string is `tt-density`, not `density`.** An earlier draft of the UX
> spec said `density`, and that spelling is dead. The scope, the storage prefix,
> the plugin folder, the service id and the `?vault=` deep link are all the same
> five characters plus two — one word to grep for when an object turns up in the
> bucket and nobody knows what wrote it. A scope that does not match its own
> service's id is a scope somebody will one day map to the wrong prefix check.

```ts
  scope: z.enum(['chat', 'avatar', 'staff', 'tt-density']).default('chat'),
  conversationId: z.string().optional(),
  /** Required for the `staff` and `tt-density` scopes: the dealer the photo belongs to. */
  dealerId: z.string().optional(),
```

### 2.6 MODIFY — the three barrels

```ts
// shared/src/types/index.ts   — append
export * from './ttDensity';

// shared/src/schemas/index.ts — append
export * from './ttDensity';

// shared/src/index.ts         — append beside the other domain modules
export * from './tt/materials';
```

### 2.7 The mirror (non-negotiable)

`@dk/shared` exists as **four byte-identical `src/` trees**. Edit only
`/Users/dissu/Documents/PP/mdg-service/shared/src`, then:

```bash
cd /Users/dissu/Documents/PP/mdg-service
npm --workspace shared run build
for a in mdg-backend mdg-admin mdg-client; do
  rsync -a --delete --exclude='.DS_Store' shared/src/ "$a/shared/src/"
  rsync -a shared/package.json shared/tsconfig.json "$a/shared/"
done
for d in shared mdg-backend/shared mdg-admin/shared mdg-client/shared; do
  printf '%s  %s\n' \
    "$( cd "$d" && find src package.json tsconfig.json -type f ! -name '.DS_Store' | sort | xargs md5 -q | md5 -q )" "$d"
done
npm run typecheck
```

All four hashes must match. **Never mirror `dist/`.** Then four commits, one per
repo (`mdg-service`, `mdg-backend`, `mdg-admin`, `mdg-client`), same message.

---

## 3. (b) Mongoose models

### 3.1 NEW FILE — `mdg-backend/src/models/TtInvoice.ts`

```ts
import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

import { TT_INVOICE_PARSE_STATUSES, TT_INVOICE_PDF_STATUSES } from '@dk/shared';

/**
 * One tanker invoice, for one dealer.
 *
 * The service fetches a SEVEN-day window every morning, so any given invoice is
 * listed by the portal about seven times before it falls out of the window.
 * Treating each sighting as new would mean seven documents, seven downloads and
 * seven bucket objects for one tanker, and an admin screen showing the same
 * delivery seven times with no way to tell which row is real. So identity is the
 * invoice number, per dealer, and it is enforced by the unique index below as
 * well as by the store's upsert filter — the index is what makes it true even if
 * two runs race.
 *
 * `pdfKey` is NOT written by the sighting upsert and NOT written with
 * `$setOnInsert`. A first sighting can create the row and then fail to download
 * the file, and `$setOnInsert` would never fire again — leaving an invoice in
 * the admin's list for ever with an empty density and a dead Download button,
 * with nothing in the system trying to fix it. Instead the PDF is a separate
 * verb (`attachInvoicePdf`) whose filter requires `pdfStatus: { $ne: 'STORED' }`,
 * so a failed first attempt is simply tomorrow's first attempt. See ADR 0010 §5.
 */

const ttInvoiceItemSchema = new Schema(
  {
    /** SAP line-item number: 10, 20, 30… */
    itemNo: { type: Number },
    /** SAP material code, verbatim: `16730`. */
    materialCode: { type: String, required: true },
    /** The invoice's own short description, verbatim: `HSD-BSVI`. */
    description: { type: String, required: true },
    quantity: { type: Number },
    unit: { type: String },
    tankNo: { type: String },
    compartments: { type: [String], default: [] },
    density15: { type: Number },
    /** As printed: `"820.500"`. Never reformatted; it is what the UI renders. */
    density15Raw: { type: String },
    sampleNo: { type: String },
    extractionNote: { type: String },
  },
  { _id: false },
);

const ttInvoiceFailureSchema = new Schema(
  {
    at: { type: Date, required: true },
    code: { type: String, required: true },
    reason: { type: String, required: true },
    runId: { type: Schema.Types.ObjectId, ref: 'ServiceRun' },
  },
  { _id: false },
);

const ttInvoiceSchema = new Schema(
  {
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    /** Denormalised for list views; a dealer IS its code. */
    dealerCode: { type: String },
    dealerServiceId: { type: Schema.Types.ObjectId, ref: 'DealerService' },

    /** The portal's SAP Invoice #, verbatim. */
    sapInvoiceNo: { type: String, required: true },
    /** IST calendar day, `YYYY-MM-DD`, normalised from the portal's table. */
    invoiceDate: { type: String, required: true },
    /** The portal's own date text, verbatim: `22-08-2026`. */
    invoiceDateRaw: { type: String },
    /** `HH:mm` from the PDF. */
    invoiceTime: { type: String },
    /** The portal table's Vehicle #. */
    vehicleNo: { type: String },
    /** The PDF's own TT number; a mismatch with `vehicleNo` is a parse warning. */
    ttNo: { type: String },

    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    sightings: { type: Number, required: true, default: 1 },

    pdfStatus: {
      type: String,
      enum: TT_INVOICE_PDF_STATUSES,
      required: true,
      default: 'PENDING',
    },
    /** Bucket key. Never serialised to a client — routes sign it, they do not send it. */
    pdfKey: { type: String },
    pdfSize: { type: Number },
    /** SHA-256 of the stored bytes; what settles a dispute about whether we altered it. */
    pdfSha256: { type: String },
    pdfCapturedAt: { type: Date },
    pdfAttempts: { type: Number, required: true, default: 0 },
    pdfFailure: { type: ttInvoiceFailureSchema, default: undefined },

    parseStatus: {
      type: String,
      enum: TT_INVOICE_PARSE_STATUSES,
      required: true,
      default: 'PENDING',
    },
    headerDensity15: { type: Number },
    docNumber: { type: String },
    invoiceTotal: { type: Number },
    deliveryNoRaw: { type: String },
    deliveryNo: { type: String },
    salesOrderNo: { type: String },
    pdfInvoiceDate: { type: String },
    dateMismatch: { type: Boolean, required: true, default: false },

    items: { type: [ttInvoiceItemSchema], default: [] },
    parseWarnings: { type: [String], default: [] },

    lastRunId: { type: Schema.Types.ObjectId, ref: 'ServiceRun' },
  },
  { timestamps: true },
);

// THE dedup key. Compound rather than `{ sapInvoiceNo: 1 }` alone: a SAP billing
// document number is very probably globally unique, but we cannot verify that,
// and the cost of being wrong is asymmetric — a global unique index would reject
// a second dealer's real invoice with a duplicate-key error and lose it, where
// the compound index is correct whether or not the number is global. ADR 0010 §4.
ttInvoiceSchema.index({ dealerId: 1, sapInvoiceNo: 1 }, { unique: true });
// "This dealer's invoices, newest first" — the list view AND the bounded scan
// `getLatestDensities` walks. `sapInvoiceNo` breaks ties within a date so the
// scan is deterministic across calls.
ttInvoiceSchema.index({ dealerId: 1, invoiceDate: -1, sapInvoiceNo: -1 });
// "Which of this dealer's invoices still need their PDF" — the collector's
// candidate set, asked once per run.
ttInvoiceSchema.index({ dealerId: 1, pdfStatus: 1 });
// Cross-dealer, for an estate-wide view later.
ttInvoiceSchema.index({ invoiceDate: -1 });

export type TtInvoiceDoc = InferSchemaType<typeof ttInvoiceSchema> & { _id: unknown };
export type TtInvoiceModelType = Model<TtInvoiceDoc>;

export const TtInvoiceModel: TtInvoiceModelType = model<TtInvoiceDoc>('TtInvoice', ttInvoiceSchema);
```

### 3.2 NEW FILE — `mdg-backend/src/models/TtDensityDayLog.ts`

```ts
import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

import { TT_REGISTER_DAY_STATUSES } from '@dk/shared';

/**
 * One dealer's density-register day: the photograph that says the outlet's own
 * register page was written up, and who sent it.
 *
 * Kept apart from {@link TtInvoiceModel} on purpose. That collection is written
 * by a robot at half past seven and keyed by an invoice number; this one is
 * written by a person with a camera and keyed by a calendar day. On a day with
 * no tanker there is no invoice and there is still a register page. Folding the
 * two together would produce a document that is an invoice on some days and a
 * photo record on others, and would put a dealer-writable field on the same
 * document as portal financial data — which is the shape access-control bugs are
 * made of. See ADR 0010 §7.
 *
 * Nothing is ever deleted. A second upload for the same day REPLACES the photo
 * and pushes the old one onto `superseded`, because a blurry photo is a real
 * thing and an erasable compliance mark proves nothing. There is deliberately no
 * "unmark".
 */

const ttRegisterPhotoSchema = new Schema(
  {
    storageKey: { type: String, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true },
    /** Which side of the app sent it — the dealer's own staff, or an admin for them. */
    uploadedByKind: { type: String, enum: ['dealer', 'admin'], required: true },
    uploadedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    /**
     * The uploader's display name, copied in at write time.
     *
     * Denormalised deliberately. The admin's calendar prints "Added by Priya
     * (MDG)" on a day panel, and a `populate` per day would be one lookup per
     * calendar cell for a string that never has to be current — the person who
     * took that photo on that day is a historical fact, and if they later leave
     * and their account is archived, the day should still say who did it.
     */
    uploadedByName: { type: String },
    note: { type: String },
    /** Set when a later upload replaced this one. */
    supersededAt: { type: Date },
  },
  { _id: false },
);

const ttDensityDayLogSchema = new Schema(
  {
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    /** Denormalised for list views; a dealer IS its code. */
    dealerCode: { type: String },
    /** IST calendar day, `YYYY-MM-DD`. */
    businessDate: { type: String, required: true },
    status: {
      type: String,
      enum: TT_REGISTER_DAY_STATUSES,
      required: true,
      default: 'MISSING',
    },
    photo: { type: ttRegisterPhotoSchema, default: undefined },
    superseded: { type: [ttRegisterPhotoSchema], default: [] },
    markedAt: { type: Date },
  },
  { timestamps: true },
);

// One document per dealer per day; every upload for that day upserts it.
ttDensityDayLogSchema.index({ dealerId: 1, businessDate: 1 }, { unique: true });
// "This dealer's recent days" — the strip on both screens.
ttDensityDayLogSchema.index({ dealerId: 1, businessDate: -1 });
// "Who has not sent today's page" — the estate view this is built to allow later.
ttDensityDayLogSchema.index({ businessDate: -1, status: 1 });

export type TtDensityDayLogDoc = InferSchemaType<typeof ttDensityDayLogSchema> & {
  _id: unknown;
};
export type TtDensityDayLogModelType = Model<TtDensityDayLogDoc>;

export const TtDensityDayLogModel: TtDensityDayLogModelType = model<TtDensityDayLogDoc>(
  'TtDensityDayLog',
  ttDensityDayLogSchema,
);
```

> **Index note.** `mdg-backend/src/db/connect.ts` does not set `autoIndex`, so
> Mongoose's default (`true`) applies and these indexes are built when the model
> registers. That is safe for **new** collections. It is _not_ how an index change
> on an existing collection lands — that still needs a hand-run migration on the
> box, as the dealer soft-delete work found.

---

## 4. (c) API — every endpoint

Base: `/api/v1`. Envelope: `{ ok: true, data }` on success,
`{ ok: false, error: { code, message, details? } }` on failure (rendered by
`middleware/error.ts`). All routes live in **one file**,
`mdg-backend/src/routes/v1/ttDensity.ts`, which exports **two** routers.

Mount, in `routes/v1/index.ts`, **in this order** — the more specific path first,
because `requireRole('admin')` on the second router calls `next(err)` rather than
falling through to a later mount:

```ts
// TT Density: tanker invoices + the Density@15 each load was certified at, and
// the daily density-register photo. Invoices are dealer financial documents —
// admin-only. The `/me` half is the dealer's own register photos, scoped by the
// token, and MUST be mounted before the admin router.
v1Router.use('/tt-density/me', ttDensityMeRouter);
v1Router.use('/tt-density', ttDensityRouter);
```

### 4.1 Router preamble

```ts
export const ttDensityRouter = Router();
ttDensityRouter.use(requireAuth);
// Tanker invoices carry the dealer's purchase amounts — admin-only, never dealer
// app tokens. Same posture as the IRAS, DSR and Inspection vaults.
ttDensityRouter.use(requireRole('admin'));

export const ttDensityMeRouter = Router();
ttDensityMeRouter.use(requireAuth);
ttDensityMeRouter.use(requireRole('dealer-owner', 'dealer-staff'));
```

**How a dealer is prevented from reading another dealer's data — three
mechanisms, all of them present:**

1. **The dealer routes have no `:dealerId` at all.** `dealerId` comes only from
   `req.user.dealerId`, re-derived from the database by `requireAuth` on every
   request. There is nothing in the URL to tamper with. This is the `/kavach/me`
   pattern and it is the strongest one in the codebase.
2. **The admin routes are `requireRole('admin')` at the router level**, so a
   dealer token never reaches a handler that takes a `:dealerId`.
3. **Every admin handler that loads a document by id asserts
   `String(doc.dealerId) === req.params.dealerId` and throws `AppError.notFound`
   on mismatch — 404, not 403**, so a guessed id does not confirm the document
   exists. (`runArtifacts.ts` establishes this.)

**The guard already exists. It is not being invented here, and this is what it
is called.** `mdg-backend/src/middleware/auth.ts` exports `requireAuth` and
`requireRole`, and `mdg-backend/src/routes/v1/staff.ts:100` holds the dealer-scope
assertion every dealer-facing route in this codebase uses. Verbatim, both:

```ts
// mdg-backend/src/middleware/auth.ts
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (roles.length === 0) return next();
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role'));
    }
    next();
  };
}
```

```ts
// mdg-backend/src/routes/v1/staff.ts:100
/** Reject unless the caller is a dealer member acting on their OWN dealer. */
function assertDealerScope(req: Request, dealerId: string): void {
  if (!req.user) throw AppError.unauthorized();
  if (req.user.role !== 'dealer-owner' && req.user.role !== 'dealer-staff') {
    throw AppError.forbidden('Staff Points is a dealer-only tool');
  }
  if (req.user.dealerId !== dealerId) {
    throw AppError.forbidden('Cannot access another dealer');
  }
}
```

`requireAuth` re-derives the caller's role, status and `dealerId` **from the
database on every request**, which is why a token cannot outlive a suspension or
a dealer archival, and why `req.user.dealerId` is trustworthy as an identity
rather than a claim. It also carries its own second belt on archival:

```ts
// mdg-backend/src/middleware/auth.ts — inside requireAuth
if (dealerId) {
  const dealer = await DealerModel.findById(dealerId).select('archivedAt').lean();
  if (dealer?.archivedAt) throw AppError.forbidden('This account is no longer active.');
}
```

**This service does not use `assertDealerScope`, and that is the point.** It is
the guard for routes shaped `/…/dealers/:dealerId/…` that dealers may call, and
this service has none: every dealer route is `/tt-density/me/…`, so there is no
path segment to compare and nothing to forget to compare. `assertDealerScope`
exists here only as the fallback shape to reach for if a dealer-facing
`:dealerId` route is ever added — and it should not be.

Additionally: every admin route with a `:dealerId` calls
`await assertDealerNotArchived(dealerId)` before doing anything, exactly as
`inspectionReports.ts:457` does.

Shared param schema:

```ts
const dealerIdParam = z.object({
  dealerId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});
const dealerInvoiceParams = dealerIdParam.extend({
  invoiceId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});
const dealerDayParams = dealerIdParam.extend({
  businessDate: ttBusinessDateSchema,
});
const dayParams = z.object({ businessDate: ttBusinessDateSchema });
```

### 4.2 Admin endpoints

| #   | Method + path                                                    | Query / body                                          | 200 `data`                                                                                                      | Other codes                                                                                                                                                 |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `GET /tt-density/dealers/:dealerId/summary`                      | —                                                     | `TtDensitySummary`                                                                                              | 400 bad id, 403 archived. **Never 404** — an uncollected dealer returns an empty summary so the pane renders an empty state.                                |
| A2  | `GET /tt-density/dealers/:dealerId/invoices`                     | `ttInvoiceListQuerySchema`                            | `{ items: TtInvoiceSummary[]; total: number; page: number; pageSize: number }`                                  | 400                                                                                                                                                         |
| A3  | `GET /tt-density/dealers/:dealerId/invoices/:invoiceId`          | —                                                     | `TtInvoice`                                                                                                     | 404 if absent **or belonging to another dealer**                                                                                                            |
| A4  | `GET /tt-density/dealers/:dealerId/invoices/:invoiceId/pdf-url`  | —                                                     | `TtSignedFileUrls`                                                                                              | 404 absent / other dealer / `pdfStatus !== 'STORED'` (message: _"The invoice PDF has not been downloaded yet. It will be fetched on the next collection."_) |
| A5  | `GET /tt-density/dealers/:dealerId/days`                         | `ttRegisterDaysQuerySchema` (`from`+`to`, or `limit`) | `TtRegisterDaySummary[]`, newest first, **one entry per calendar day in the range including the unmarked ones** | 400                                                                                                                                                         |
| A6  | `GET /tt-density/dealers/:dealerId/days/:businessDate/photo-url` | —                                                     | `TtSignedFileUrls`                                                                                              | 404 if no photo for that day                                                                                                                                |
| A7  | `POST /tt-density/dealers/:dealerId/days/:businessDate/photo`    | `ttRegisterPhotoSchema`                               | **201** `TtDensityDayLog`                                                                                       | 400 (bad date, older than `TT_REGISTER_ADMIN_BACKDATE_DAYS`, non-image, key outside this dealer's prefix), 403 archived                                     |
| A8  | `POST /tt-density/dealers/:dealerId/collect`                     | `ttDensityCollectSchema`                              | **202** `{ runId: string }`                                                                                     | 404 service not attached, 409 a collection is already running                                                                                               |

Rules the handlers must obey:

- **A4 signs the SAME key twice**, `inline` for the frame and `attachment` for the
  save, and writes an audit row **before** responding:

  ```ts
  const storage = getStorage();
  const filename = `invoice-${invoice.sapInvoiceNo}.pdf`;
  const [viewUrl, downloadUrl] = await Promise.all([
    storage.getSignedDownloadUrl(pdfKey, env.S3_SIGNED_URL_TTL_SECONDS, {
      contentDisposition: inlineDisposition(filename),
    }),
    storage.getSignedDownloadUrl(pdfKey, env.S3_SIGNED_URL_TTL_SECONDS, {
      contentDisposition: attachmentDisposition(filename),
    }),
  ]);
  await auditFromReq(req, {
    entity: 'TtInvoice',
    entityId: String(invoice.id),
    action: 'TT_INVOICE_PDF_VIEW',
    after: { dealerId, sapInvoiceNo: invoice.sapInvoiceNo },
  });
  ```

  JSON, not a 302: an `<iframe src>` cannot carry a bearer token, so the
  redirect used for run artifacts would 401 inside the frame. The stored-XSS
  caveat in `utils/contentDisposition.ts` is about `text/html` bodies, not PDFs.

  **The 404 on a not-yet-stored PDF is a UI state, not an error.** The admin
  drawer opens on the invoice's _facts_ — which it already holds from A3 — and
  asks for the URL second. A 404 there renders the "the file did not download"
  block with a Fetch button, never a toast and never a red banner: the operator
  can still read every figure we extracted, and the file is genuinely missing
  rather than broken. The client must therefore special-case A4's 404 and not
  route it through the generic error path.

- **A6** audits `TT_REGISTER_PHOTO_VIEW` the same way.
- **A7** must validate that `body.storageKey` starts with
  `tt-density/${dealerId}/register/` before storing it. A presigned key is
  attacker-influenced input; without this check an admin request could point a
  day log at any object in the bucket. Audit `TT_REGISTER_PHOTO_UPLOAD` with
  `before` = the previous photo's key and `after` = the new one, and set
  `uploadedBy: { kind: 'admin', userId: req.user.id, name: <the admin's name> }`
  — the name is read once here and stored, because the calendar prints it.

  **Backdating limit for an admin is `TT_REGISTER_ADMIN_BACKDATE_DAYS` (60),
  inclusive of today**, so the oldest acceptable date is `today - 59`. Refuse an
  older one with _"That day is more than 60 days ago."_ An earlier draft of the
  PRD said 90; 60 is the number, and the PRD has been amended.

- **A8** copies `inspectionReports.ts`'s `/generate` handler verbatim in shape:
  `assertDealerNotArchived` → find the `DealerService` (404 with _"This dealer
  does not have the TT Density service attached. Attach it from the dealer's
  Services tab first."_) → advisory in-flight guard on
  `status: 'RUNNING', startedAt > now - TT_DENSITY_RUN_STALE_MS` (409) →
  `registry.getOrThrow` → create the `ServiceRun` with `trigger: 'manual'` →
  `auditFromReq({ entity: 'DealerService', entityId: String(ds._id), action: 'SERVICE_RUN', after: { runId, trigger: 'tt-density-collect', lookbackDays } })`
  → `res.status(202).json({ ok: true, data: { runId } })` → **then** the detached
  `executeRun({ ..., config: { ...ds.config, ...(body.lookbackDays ? { lookbackDays: body.lookbackDays } : {}) } }).catch(...)`.
  `const TT_DENSITY_RUN_STALE_MS = 8 * 60 * 1000;` — a collection drives a browser;
  give a wedged run the same slack an SDMS run gets.

### 4.3 Dealer endpoints

| #   | Method + path                                     | Body                    | 200 `data`                | Other codes                                                                                                                                                                                                                 |
| --- | ------------------------------------------------- | ----------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `GET /tt-density/me`                              | —                       | `TtDensityMeView`         | 400 if the token carries no `dealerId`. **Never 404 and never 403 for a dealer without the service** — it answers 200 with `attached: false` and empty arrays, so the app renders its calm "not on for your pump yet" state |
| D2  | `POST /tt-density/me/days/:businessDate/photo`    | `ttRegisterPhotoSchema` | **201** `TtDensityDayLog` | 400 (bad/future date, older than `earliestMarkableDate`, non-image, key outside their own prefix), 404 if the service is not attached to their dealer                                                                       |
| D3  | `GET /tt-density/me/days/:businessDate/photo-url` | —                       | `TtSignedFileUrls`        | 404 if they have not sent one                                                                                                                                                                                               |

First line of every dealer handler:

```ts
if (!req.user?.dealerId) throw AppError.badRequest('User has no dealerId');
const dealerId = req.user.dealerId;
```

D2's backdate refusal message is written for the person reading it:
_"That day is more than 7 days ago. Ask MDG to add it for you."_

The boundary is `earliestMarkableDate` = `today - (TT_REGISTER_DEALER_BACKDATE_DAYS - 1)`
= **today and the six days before it**. The same expression produces the
`<input type="date" min>` the client renders, so the screen never offers a day
the server will refuse. D1 returns it precomputed for exactly that reason: a
client that works it out itself is a client that will one day be off by one at
IST midnight.

D1 also carries `latest`, and the dealer's screen renders it. The dealer sees
their figures — in their own words, with no unit and no portal vocabulary — and
never sees an invoice, a PDF, a rupee amount or a document number.

### 4.4 The upload scope — MODIFY `routes/v1/uploads.ts`

Add a fourth branch to the scope switch, modelled exactly on `staff`:

```ts
} else if (body.scope === 'tt-density') {
  // Density-register page photo — image only, scoped to the dealer. The scope
  // guard is the ENTIRE access control on this route: `/uploads/sign` is
  // `requireAuth` only, so any authenticated role reaches it, and without the
  // three checks below a dealer-staff account could write objects under another
  // dealer's prefix.
  if (!body.contentType.startsWith('image/')) {
    throw AppError.badRequest('The density register page must be a photo');
  }
  if (!body.dealerId || !Types.ObjectId.isValid(body.dealerId)) {
    throw AppError.badRequest('dealerId required for tt-density scope');
  }
  assertTtDensityDealerAccess(req.user, body.dealerId);
  storageKey = ttRegisterPhotoKey(body.dealerId, body.filename);
}
```

`assertTtDensityDealerAccess` is a **new named function beside
`assertStaffDealerAccess`**, with the same body. Do not reuse
`assertStaffDealerAccess` under a second name in the switch: if the staff rules
ever change, sharing the function silently changes these rules too.

**Do NOT add `tt-density/` to the `/uploads/download-url` prefix allowlist.**
Reading a register photo goes through A6/D3, where the dealer check and the audit
row already live.

---

## 5. (d) The store modules

Two files, one per collection. Both follow the house seam: **the plugin and the
routes write through the store, nobody outside the store touches the model**, and
every store ends with a hand-written `toPublic()` that stringifies ids,
`toISOString()`s Dates and normalises `undefined → null`.

### 5.1 `mdg-backend/src/services/ttDensity/invoiceStore.ts`

```ts
/** One row exactly as the portal's table showed it. */
export interface InvoiceSightingInput {
  dealerId: string;
  dealerCode?: string | null;
  dealerServiceId?: string | null;
  runId?: string | null;
  sapInvoiceNo: string;
  /** Normalised IST `YYYY-MM-DD`. */
  invoiceDate: string;
  invoiceDateRaw?: string | null;
  vehicleNo?: string | null;
  seenAt: Date;
}

/**
 * Upsert one invoice from a sighting. Idempotent on `(dealerId, sapInvoiceNo)`,
 * so the seven sightings of one invoice converge on one document.
 * NEVER touches `pdfKey`, `pdfStatus` or `items` — see {@link attachInvoicePdf}.
 */
export async function recordInvoiceSighting(input: InvoiceSightingInput): Promise<TtInvoice>;

export interface AttachInvoicePdfInput {
  dealerId: string;
  sapInvoiceNo: string;
  runId?: string | null;
  pdfKey: string;
  pdfSize: number;
  pdfSha256: string;
  capturedAt: Date;
  /** The parser's output. Undefined when the bytes were stored but unreadable. */
  parsed?: ParsedTtInvoice;
}

/**
 * Attach the downloaded PDF and everything read out of it.
 *
 * The filter carries `pdfStatus: { $ne: 'STORED' }`, so this is a no-op on an
 * invoice whose bytes we already hold and a success on one whose first download
 * failed — however that row came to exist. Returns null when nothing matched
 * (i.e. it was already stored), which is not an error.
 */
export async function attachInvoicePdf(input: AttachInvoicePdfInput): Promise<TtInvoice | null>;

/**
 * Record that this run could not get an invoice's PDF, WITHOUT touching the row
 * otherwise. Increments `pdfAttempts`; at `TT_PDF_MAX_ATTEMPTS` it flips
 * `pdfStatus` to `FAILED` so the row stops being a download candidate.
 */
export async function recordInvoicePdfFailure(input: {
  dealerId: string;
  sapInvoiceNo: string;
  runId?: string | null;
  code: string;
  reason: string;
  at: Date;
}): Promise<void>;

/**
 * The invoice numbers whose PDF this dealer already has, within the window.
 * This — not "invoices I have seen" — is what the collector skips.
 */
export async function listStoredInvoiceNos(
  dealerId: string,
  fromDate: string,
  toDate: string,
): Promise<Set<string>>;

export async function listInvoices(q: {
  dealerId: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: TtInvoiceSummary[]; total: number; page: number; pageSize: number }>;

/** Null when the id is unknown OR belongs to a different dealer. */
export async function getInvoice(dealerId: string, invoiceId: string): Promise<TtInvoice | null>;

/**
 * The storage key for an invoice's PDF, or null. Separate from
 * {@link getInvoice} because `pdfKey` is an internal detail that is never
 * serialised to a client; only the signing route may see it.
 */
export async function getInvoicePdfRef(
  dealerId: string,
  invoiceId: string,
): Promise<{ storageKey: string; sapInvoiceNo: string; contentType: 'application/pdf' } | null>;

/**
 * The most recent density for each product, over the last
 * `TT_LATEST_DENSITY_SCAN_LIMIT` invoices. Computed on read: see ADR 0010 §8.
 * `now` is injected so the `ageDays` arithmetic is testable.
 *
 * RETURNS THEM SORTED, and the sort is part of the contract: `DIESEL` family
 * first, then `PETROL`, then everything else, and within a family by
 * `productKey` ascending. Both surfaces render the array in the order it
 * arrives. Two screens each doing their own sort is two screens that can
 * disagree about which figure leads — on a number a dealer is copying into a
 * book by hand.
 *
 * A line whose `density15` is null is skipped: this list is the headline, and a
 * headline with a dash in it is worse than a headline with one fewer tile. The
 * gap is visible on the invoice row instead, where the PDF is one click away.
 */
export async function getLatestDensities(dealerId: string, now?: Date): Promise<TtLatestDensity[]>;

/** The Vault pane payload. Never throws for an uncollected dealer. */
export async function getTtDensitySummary(dealerId: string, now?: Date): Promise<TtDensitySummary>;
```

`getTtDensitySummary` composes: `getLatestDensities` + `listInvoices({ pageSize: 20 })`

- two `countDocuments` + `listRegisterDaySummaries(dealerId, { days: TT_REGISTER_RECENT_DAYS })` +
  one `ServiceRunModel.findOne({ dealerId, serviceId: 'tt-density' }).sort({ startedAt: -1 })`
  for `lastRunAt` / `lastOutcome` (from `run.output.outcome`) / `lastFailure` (from
  `run.error` + `run.failureCode`). **There is deliberately no fourth collection
  holding collection state** — the `ServiceRun` already holds exactly those facts
  and cannot drift from itself.

### 5.2 `mdg-backend/src/services/ttDensity/registerStore.ts`

```ts
export interface RecordRegisterPhotoInput {
  dealerId: string;
  dealerCode?: string | null;
  businessDate: string;
  photo: {
    storageKey: string;
    filename: string;
    contentType: string;
    size: number;
    note?: string | null;
  };
  uploadedBy: { kind: 'dealer' | 'admin'; userId: string | null };
  at: Date;
}

/**
 * Mark one day done with a photograph of the register page.
 *
 * Idempotent by `(dealerId, businessDate)`. A second upload REPLACES the current
 * photo and pushes the old one onto `superseded` with a `supersededAt` — nothing
 * is deleted, because a blurry photo is a real thing and an erasable compliance
 * mark proves nothing.
 */
export async function recordRegisterPhoto(
  input: RecordRegisterPhotoInput,
): Promise<TtDensityDayLog>;

export async function getRegisterDay(
  dealerId: string,
  businessDate: string,
): Promise<TtDensityDayLog | null>;

/** Newest first. `limit` is clamped to 1..120 inside the store. */
export async function listRegisterDays(
  dealerId: string,
  limit?: number,
): Promise<TtDensityDayLog[]>;

/**
 * A stretch of IST calendar days, newest first, INCLUDING the ones with no
 * document at all — a day nobody photographed has no row, and a list that
 * silently omitted it would show a clean month that never happened. The gaps
 * ARE the output.
 *
 * Two ways to ask, because the two screens ask different questions with the
 * same store call: `{ days: 14 }` for "the last fortnight", which is what the
 * dealer's `/me` payload and the pane's first render want; `{ from, to }` for
 * "August", which is what the admin's month calendar wants the moment somebody
 * presses the back arrow. `from`/`to` win when both are given.
 */
export async function listRegisterDaySummaries(
  dealerId: string,
  range: { days: number } | { from: string; to: string },
  now?: Date,
): Promise<TtRegisterDaySummary[]>;

/** The current photo's storage key for one day, or null. */
export async function getRegisterPhotoRef(
  dealerId: string,
  businessDate: string,
): Promise<{ storageKey: string; filename: string; contentType: string } | null>;
```

---

## 6. (e) The parser modules

Two files. The split is the house technique for testability: the part that needs
a real PDF is a thin shell, and the part that makes decisions is pure.

### 6.1 `mdg-backend/src/automation/sdms/ttDensity/pdfText.ts`

```ts
/** One positioned glyph run, as pdfjs reports it. Structural, so tests need no PDF. */
export interface TextItemLike {
  str: string;
  /** pdfjs `transform`: [a, b, c, d, e, f]; `e` is x, `f` is the baseline y. */
  transform: number[];
  width: number;
  height?: number;
}

export interface PdfTextResult {
  /** The whole document, lines separated by `\n`, pages by `\n\n`. */
  text: string;
  pages: number;
  chars: number;
  ms: number;
}

/**
 * Rebuild readable lines from positioned glyph runs. PURE — no pdfjs, no I/O.
 */
export function reconstructLines(items: readonly TextItemLike[]): string;

/**
 * Extract the text layer of an invoice PDF.
 *
 * Loads pdfjs LAZILY, on first call, and caches the module. The plugin registry
 * imports every plugin at boot; a ~10 MB parser pulled in at module scope would
 * be resident on a ~1 GB box twenty-three hours a day for a service that runs for
 * two minutes. Throws `TtDensityError('PDF_TEXT_UNREADABLE', 'PARSE', …)` when
 * the document has no text layer or pdfjs refuses it.
 */
export async function extractPdfText(pdf: Buffer): Promise<PdfTextResult>;
```

Implementation notes that are part of the contract, not suggestions:

- Import path: `await import('pdfjs-dist/legacy/build/pdf.mjs')`. The legacy
  build is the one that runs under Node without a bundler.
- Options: `{ data, useWorkerFetch: false, isEvalSupported: false, disableFontFace: true, useSystemFonts: false, verbosity: 0 }`.
  There is nothing to parallelise — one invoice at a time, inside a run already
  serialised by `sdmsBrowserSemaphore`.
- `data` must be a **copy**: `Uint8Array.from(pdf)`. pdfjs takes ownership of the
  buffer it is handed, and a detached Node `Buffer` upstream is a bug that only
  appears on the second use.
- Always `await doc.destroy()` in a `finally`.
- Two named constants, each justified where it is declared:

  ```ts
  /**
   * How far apart two glyph baselines may be and still be the same line, in
   * points.
   *
   * The invoice body is ~7pt on ~9pt leading, so two different lines are never
   * within 2.2pt of each other — while glyphs WITHIN one line sit up to ~1.8pt
   * off the baseline (the `@` in `Density@15`, the digits after a decimal).
   * Below about 2pt those split, and `Density@15:` separates from `820.500`,
   * which is the one thing the grammar cannot survive. Above about 4pt two
   * adjacent table rows merge and one product's tank number lands on another
   * product's line.
   */
  const LINE_BAND_PT = 2.2;

  /**
   * How wide a gap must be, as a fraction of the preceding run's own width, to
   * count as a space rather than kerning.
   *
   * Tuned against `__fixtures__/invoice-7010045406.txt` and held there by
   * `invoice.test.ts`: below this, `Tank` and `no:` fuse into one token; above
   * it, `Comp No(s)` splits mid-token and the compartment list is lost.
   */
  const SPACE_GAP_RATIO = 0.28;
  ```

  If the fixture forces a different value, change the number **and** the comment.

### 6.2 `mdg-backend/src/automation/sdms/ttDensity/invoice.ts`

```ts
/** One product line, exactly as the invoice printed it. The parser knows nothing
 *  about our product vocabulary — that mapping happens in the store. */
export interface ParsedTtInvoiceItem {
  itemNo: number | null;
  materialCode: string;
  description: string;
  quantity: number | null;
  unit: string | null;
  tankNo: string | null;
  compartments: string[];
  density15: number | null;
  density15Raw: string | null;
  sampleNo: string | null;
  extractionNote?: string;
}

export interface ParsedTtInvoice {
  sapInvoiceNo: string | null;
  ttNo: string | null;
  /** Verbatim: `22-Aug-26`. */
  invoiceDateRaw: string | null;
  /** Normalised IST `2026-08-22`, or null when the raw text could not be read. */
  invoiceDate: string | null;
  /** `HH:mm`, 24-hour: `16:37`. */
  invoiceTime: string | null;
  /** The density printed in the header. Recorded, never relied on. */
  headerDen15: number | null;
  docNumber: string | null;
  invoiceTotal: number | null;
  /** Verbatim: `0573542169 / Sales Order 0913183557`. */
  deliveryNoRaw: string | null;
  deliveryNo: string | null;
  salesOrderNo: string | null;
  items: ParsedTtInvoiceItem[];
  /** Everything the parser wanted to say but could not fix. */
  warnings: string[];
}

/** Parse the reconstructed text of one invoice. PURE — string in, data out. */
export function parseTtInvoiceText(text: string): ParsedTtInvoice;

/**
 * Extract and parse in one call. This is what the collector is handed as
 * `deps.readInvoice`, and what the CLI wires up.
 * Returns the raw text as well, because it is saved as a diagnostic artifact for
 * EVERY invoice — when a density fails to parse, that artifact settles whether
 * the PDF or the grammar is at fault without re-running anything.
 */
export async function readTtInvoicePdf(
  pdf: Buffer,
): Promise<{ parsed: ParsedTtInvoice; text: string }>;
```

**The grammar's one rule, which is not negotiable:**

> A product line with no readable density is emitted with `density15: null` and
> an `extractionNote`. It is **never dropped** and **never inherits a
> neighbour's figure.**

A visible gap next to a viewable PDF costs a human ten seconds. A wrong number
copied into a dealer's register is not recoverable at all.

Named regexes, `_RE`-suffixed, each with the sample line it was written against
in a comment above it — at minimum `ITEM_RE`, `DENSITY_RE`, `TANK_RE`,
`COMPARTMENT_RE`, `SAMPLE_RE`, `INVOICE_NO_RE`, `INVOICE_DATE_RE`,
`INVOICE_TIME_RE`, `DOC_NUMBER_RE`, `TOTAL_RE`, `DELIVERY_RE`. `DENSITY_RE` is
anchored on the WORDS (`/density\s*@\s*15\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i`),
never on a column position, because the column `Density@15` starts at moves with
the width of the tank number beside it.

The five things the fixtures must settle before the parser is trusted, each of
which gets its own `it(...)`:

1. A product with **two or more tanks** — two density lines under one product, or
   one line listing both.
2. A product with **no density** — line absent, or present and blank.
3. **A multi-page invoice** — does the product table continue, and does the item
   numbering restart.
4. Whether item numbers are always the SAP `10/20/30` convention.
5. Whether the PDF's own date can disagree with the portal table's.

Only (1)–(5) as _tests_; where no fixture exists yet, write the test as a
documented `it.todo` naming the fixture it needs. Do not guess a behaviour into
the parser that no invoice has demonstrated.

---

## 7. (f) The collector

`mdg-backend/src/automation/sdms/ttDensity/collector.ts`

```ts
export interface TtInvoicePdfRef {
  storageKey: string;
  size: number;
  sha256: string;
}

export interface TtDensityCollectorDeps {
  creds: SdmsCredentials;
  now: Date;
  /** Inclusive IST window, `YYYY-MM-DD`. */
  fromDate: string;
  toDate: string;
  /**
   * Invoice numbers whose PDF is ALREADY stored. Not "seen" — stored. A row we
   * saw yesterday and failed to download is a candidate again today.
   */
  storedInvoiceNos: ReadonlySet<string>;
  /** Hard cap on downloads in one run; the rest wait for the next one. */
  maxDownloads: number;
  /** Walk everything, click no Download link. */
  dryRun: boolean;
  debugScreenshots: boolean;
  /** Persist one invoice PDF. The collector NEVER builds a storage key itself. */
  savePdf: (sapInvoiceNo: string, bytes: Buffer) => Promise<TtInvoicePdfRef>;
  /** Extract and parse. Injected so the collector never imports the PDF library. */
  readInvoice: (bytes: Buffer) => Promise<{ parsed: ParsedTtInvoice; text: string }>;
  logger: PipelineLogger;
  recordStep: RecordStep;
  saveArtifact: SaveArtifact;
  headless: boolean;
  captchaMaxAttempts: number;
  /**
   * Login pacing override. Present so an integration test against the mock
   * portal can run in seconds — the water-ingress collector omits it and its
   * tests pay for that.
   */
  pacing?: Partial<HumanPacing>;
  signal?: AbortSignal;
  deadlineAt?: number;
}

/** What happened to one row of the portal's table. */
export interface TtDensityRowResult {
  sapInvoiceNo: string;
  /** Normalised IST `YYYY-MM-DD`. */
  invoiceDate: string;
  invoiceDateRaw: string;
  vehicleNo: string | null;
  /** Present only when THIS run downloaded it. */
  pdf?: TtInvoicePdfRef;
  parsed?: ParsedTtInvoice;
  /** Present when nothing was downloaded, and why. */
  skipped?: 'ALREADY_STORED' | 'DOWNLOAD_CAP' | 'TIME_BUDGET' | 'DRY_RUN';
  /** A row failure. NOT a run failure — the other rows are already saved. */
  failure?: { code: TtDensityFailureCode; message: string };
}

export interface TtDensityResult {
  outcome: TtDensityOutcome;
  window: { fromDate: string; toDate: string };
  /** How many rows the portal listed for the window. */
  rowsListed: number;
  /**
   * Rows whose SAP invoice number could not be read at all, and which were
   * therefore dropped without being stored.
   *
   * They are counted and never invented. An invoice filed under a made-up key
   * is a duplicate waiting to happen the day the real number turns up, and the
   * dedup key is the one thing in this service that has to be exactly right.
   * A non-zero count is an Engineering signal — it means the table's shape
   * changed under us — and it makes the run `PARTIAL`.
   */
  rowsUnidentified: number;
  rows: TtDensityRowResult[];
  downloaded: number;
  parsed: number;
  /** True when the run stopped on `maxDownloads` with work left — drives `nextRunAt`. */
  capHit: boolean;
  loginAttempts: number;
  ocrAttempts: OcrAttempt[];
}

/**
 * Fetch one dealer's TT Acknowledgement window and download every invoice PDF we
 * do not already hold.
 *
 * READ-ONLY ON THE PORTAL. It sets two dates, presses Fetch, reads the table and
 * clicks Download. It NEVER touches Vehicle Condition, Check Ack Status or
 * Acknowledge Receipt — acknowledging a receipt is a legal act by the dealer,
 * and a robot must not perform it.
 */
export async function runTtDensityCollection(
  deps: TtDensityCollectorDeps,
): Promise<TtDensityResult>;
```

### 7.1 Phases (each `recordStep`s start/ok/error under this name)

`launch` → `login` → `navHome` → `openMenu` → `downloadInvoice` → `setDates` →
`fetch` → `readTable` → `rows` (one step per downloaded invoice, named
`row:<sapInvoiceNo>`) → done.

- `login` is `sdmsLogin({ page, creds, captchaMaxAttempts, logger, recordStep, grabDiagnostics, makeError, budget, pacing })`. You write none of it.
- `navHome` is `reachEmitraHome({ page, loginUrl: creds.loginUrl, landmark: ttAckMenuItem, landmarkDescription: 'the "TT Acknowledgement" menu', prepare: revealSidebar, logger, recordStep, grabDiagnostics, makeError, budget, remainingMs })`. You write none of it. Pass `prepare` even though the menu may not be in a sidebar — it is a no-op when the landmark is already visible.
- `ttAckMenuItem` is a **text ladder**, `:text-is()` first, and must accept BOTH
  spellings: `TT Acknowledgement` and `TT Acknowledgment`.
- `setDates` uses the IRAS select-all-and-insert dance
  (`click` → `click({clickCount:3})` → `press('Delete')` → `keyboard.insertText`
  → `press('Tab')`), because `fill()` on an Angular/MUI datepicker silently
  reverts. Which text format to insert is unknown; try the format the field
  already contains (read it first — the portal pre-fills a seven-day window) and
  fall back to `DD/MM/YYYY`. **Then re-read both fields and fail with
  `DATE_FIELDS_NOT_FOUND` if they do not hold what you typed** — a date filter
  that silently reverted returns the portal's default window and everything
  downstream looks like it worked.
- `readTable` maps columns **by header regex, never by position**:

  ```ts
  export const COLUMN_MATCHERS = {
    sapInvoiceNo: /sap\s*invoice/i,
    invoiceDate: /invoice\s*date/i,
    vehicleNo: /vehicle\s*(no|#|number)/i,
    download: /download/i,
  } as const;

  /** Columns this service must never reach into. If the Download column resolves
   *  to one of these, the table is not what we think it is and we stop. */
  export const FORBIDDEN_MATCHERS = [
    /vehicle\s*condition/i,
    /ack(nowledge)?\s*(status|receipt)?/i,
    /^\s*check\s*$/i,
  ] as const;
  ```

  and guards the row shape before addressing a cell (`row.cells.length !== headers.length` → `COLUMNS_NOT_RECOGNISED`).

- **A row whose SAP invoice number cannot be read is dropped, counted in
  `rowsUnidentified`, and never given an invented identity.** Not the vehicle
  number, not the date, not a hash of the row — the dedup key is
  `(dealerId, sapInvoiceNo)` and a placeholder in it becomes a permanent
  duplicate the day the real number is read. Everything else about the row may
  be missing and still be stored; the number may not.
- Downloading one row: register `context.waitForEvent('page')` **and**
  `page.waitForEvent('download')` **before** the click, both with
  `.catch(() => null)` attached immediately, then `Promise.all`. Guard
  `download.path()` for `null` — an unguarded read stores a zero-byte PDF, which
  is worse than storing none. On the **first** row only, dump
  `download_link_<sap>.txt` with `href`, `onclick` and the list URL as a
  diagnostic; that file is what settles the download mechanism on the first live
  run.
- A `page.on('dialog')` handler is mandatory: a portal `confirm()` before a
  download hangs every subsequent Playwright call. Read `.swal2-popup` before
  concluding a click did nothing — this portal uses SweetAlert2 for refusals as
  well as confirmations.
- Every row is wrapped so **one bad row cannot fail the run**, and the page is
  forced back to the list URL afterwards.
- Stop downloading when `remainingMs() < TT_DOWNLOAD_RESERVE_MS` (60 000) and
  mark the remaining rows `skipped: 'TIME_BUDGET'`.
- Set `acceptDownloads: true` explicitly in your own `newContext` options rather
  than relying on Playwright's default; do not edit the shared
  `humanContextOptions`.

### 7.2 `mdg-backend/src/automation/sdms/ttDensity/errors.ts`

```ts
export type TtDensityFailureCode =
  // ── shared: browser + login ────────────────────────────────────────────────
  | 'BROWSER_LAUNCH_FAILED'
  | 'LOGIN_PAGE_UNREACHABLE'
  | 'LOGIN_REJECTED'
  | 'LOGIN_CAPTCHA_EXHAUSTED'
  | 'LOGIN_CHALLENGE_EXHAUSTED'
  | 'LOGIN_CHALLENGE_NOT_FOUND'
  | 'LOGIN_CHALLENGE_UNAVAILABLE'
  | 'OCR_SIDECAR_UNAVAILABLE'
  // ── shared: e-Mitra ───────────────────────────────────────────────────────
  | 'NAV_HOME_FAILED'
  | 'SESSION_EXPIRED'
  // ── this pipeline: reaching the screen ────────────────────────────────────
  | 'MENU_OPEN_FAILED'
  | 'DOWNLOAD_INVOICE_MISSING'
  // ── this pipeline: the filter ─────────────────────────────────────────────
  | 'DATE_FIELDS_NOT_FOUND'
  | 'FETCH_BUTTON_NOT_FOUND'
  | 'FETCH_FAILED'
  // ── this pipeline: the table ──────────────────────────────────────────────
  | 'TABLE_NOT_FOUND'
  | 'COLUMNS_NOT_RECOGNISED'
  // ── this pipeline: one row (never fails the run) ──────────────────────────
  | 'INVOICE_LINK_NOT_FOUND'
  | 'PDF_NOT_A_DOWNLOAD'
  | 'PDF_EMPTY'
  | 'PDF_TEXT_UNREADABLE'
  | 'DENSITY_NOT_FOUND'
  // ── shared: run control ───────────────────────────────────────────────────
  | 'CAPTURE_TIMEOUT'
  | 'UNEXPECTED';

export type TtDensityDiagnostics = PortalDiagnostics;

/** Every code MUST have an entry; `Record<>` makes the compiler enforce it. */
const OPERATOR_HINTS: Record<TtDensityFailureCode, string> = {
  /* … */
};

export function operatorHintFor(code: string): string;

export class TtDensityError extends Error {
  readonly code: string;
  readonly phase: string;
  readonly diagnostics?: TtDensityDiagnostics;
  readonly transient: boolean;
  readonly operatorHint: string;
  constructor(
    code: TtDensityFailureCode | string,
    phase: string,
    message: string,
    diagnostics?: TtDensityDiagnostics,
  );
}

/**
 * True when trying again LATER, with no human involved, is a sensible bet.
 *
 * `LOGIN_REJECTED` is absent on purpose: a wrong password retried walks a real
 * dealer's IndianOil account into a lockout. So are every "the portal changed
 * shape" code — a selector does not un-break itself in twenty minutes — and the
 * two server-install codes, which need Ops and not patience.
 */
export function worthDeferring(code: string): boolean;

const DEFERRABLE: ReadonlySet<TtDensityFailureCode> = new Set([
  'LOGIN_PAGE_UNREACHABLE',
  'LOGIN_CAPTCHA_EXHAUSTED',
  'LOGIN_CHALLENGE_EXHAUSTED',
  'LOGIN_CHALLENGE_UNAVAILABLE',
  'NAV_HOME_FAILED',
  'SESSION_EXPIRED',
  'MENU_OPEN_FAILED',
  'FETCH_FAILED',
  'TABLE_NOT_FOUND',
  'CAPTURE_TIMEOUT',
]);
```

Operator hints, verbatim (they are what a non-technical admin reads):

| Code                                               | Hint                                                                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOGIN_REJECTED`                                   | _Admin — the dealer's SDMS username or password is wrong. Re-enter it in the dealer's Password vault tab. Nothing will be retried until you do._ |
| `SDMS_CREDENTIALS_MISSING`                         | _Admin — this dealer has no SDMS credentials saved._                                                                                          |
| `OCR_SIDECAR_UNAVAILABLE`                          | _Ops — run `bash ocr/setup.sh` on the server._                                                                                                |
| `BROWSER_LAUNCH_FAILED`                            | _Ops — the browser could not start on the server._                                                                                            |
| `LOGIN_CAPTCHA_EXHAUSTED` / `LOGIN_CHALLENGE_*`    | _Nobody — the portal's login question could not be answered this time. The next run normally succeeds._                                       |
| `NAV_HOME_FAILED` / `SESSION_EXPIRED`              | _Nobody — the portal's sign-in handoff failed. It is retried automatically._                                                                  |
| `MENU_OPEN_FAILED` / `DOWNLOAD_INVOICE_MISSING`    | _Engineering — the portal renamed or moved the TT Acknowledgement screen._                                                                    |
| `DATE_FIELDS_NOT_FOUND` / `FETCH_BUTTON_NOT_FOUND` | _Engineering — the date filter on the portal changed shape._                                                                                  |
| `FETCH_FAILED` / `TABLE_NOT_FOUND`                 | _Nobody first — the portal did not answer. Engineering if it keeps happening._                                                                |
| `COLUMNS_NOT_RECOGNISED`                           | _Engineering — the invoice table's columns are not the ones we expect, so nothing was clicked._                                               |
| `INVOICE_LINK_NOT_FOUND` / `PDF_NOT_A_DOWNLOAD`    | _Engineering — the portal now serves the invoice differently. The invoice is still listed; only the file is missing._                         |
| `PDF_EMPTY`                                        | _Engineering — the portal returned an empty file for this invoice._                                                                           |
| `PDF_TEXT_UNREADABLE`                              | _Engineering — this invoice has no readable text layer. The PDF itself is saved and can be read by hand._                                     |
| `DENSITY_NOT_FOUND`                                | _Engineering — the invoice was read but printed no density we recognise. Open the PDF to check._                                              |
| `CAPTURE_TIMEOUT`                                  | _Nobody — the run ran out of time. Invoices already saved are kept; the rest are fetched next run._                                           |
| `UNEXPECTED`                                       | _Engineering — an unexpected error. The run's diagnostics have the detail._                                                                   |

### 7.3 The CLI — `mdg-backend/src/automation/sdms/ttDensity/cli/run-tt-density.ts`

Modelled on `inspection/cli/run-inspection.ts` (no `--commit` prompt: this
pipeline never writes to the portal, so there is nothing to confirm).

```
npm run automation:tt-density -- --headed --days 7          # dry: reads, downloads nothing
npm run automation:tt-density -- --headed --download        # downloads + parses into ./var/tt-density/<ts>/
npm run automation:tt-density -- --out ./var/tt-density --keep 3
```

`main(): Promise<number>`, `main().then((c) => process.exit(c))`.
`import 'dotenv/config'` at the top. `debugScreenshots: true` hardcoded — tuning
selectors is the whole reason to run it by hand. Result written to
`result.json`; every PDF and every extracted `.txt` written into the run
directory. On `TtDensityError`, print `FAILED [code] at phase`, the
`operatorHint` and the diagnostics, return 1.

---

## 8. (g) The plugin

### 8.1 `mdg-backend/src/services/tt-density/schema.ts`

```ts
import { z } from 'zod';

/**
 * Per-dealer configuration for TT Density.
 *
 * Deliberately tiny, and deliberately missing two switches somebody will ask for.
 *
 * There is no "rehearse only" toggle. The CLI is a dry run unless you pass
 * `--download`, which covers every case a rehearsal is actually wanted for, and
 * a permanently-available admin toggle would only be a way to leave a dealer's
 * collection quietly switched off.
 *
 * There is no configuration of what gets clicked. This service is read-only on
 * the portal, and a form field that could ever set Vehicle Condition or press
 * Acknowledge Receipt is a form field that can file a legal statement on a real
 * dealer's account from a mis-click. Acknowledging a receipt is the dealer's act,
 * not ours.
 *
 * Every default is chosen so that attaching with an empty config is correct.
 */
export const ttDensityConfigZod = z.object({
  lookbackDays: z.number().int().min(1).max(31).default(7),
  maxDownloadsPerRun: z.number().int().min(1).max(60).default(12),
  debugScreenshots: z.boolean().default(false),
});

export type TtDensityConfig = z.infer<typeof ttDensityConfigZod>;

/** JSON Schema (draft-07) driving the RJSF attach/edit form in the admin. */
export const ttDensitySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: false,
  properties: {
    lookbackDays: {
      type: 'integer',
      minimum: 1,
      maximum: 31,
      default: 7,
      title: 'How many days back to fetch each run',
      description:
        "The portal's own filter defaults to seven days, and a tanker's invoice does not always appear the day it is delivered — so each run re-fetches the whole week. Seeing the same invoice seven times costs nothing: invoices are identified by their SAP number and the file is downloaded once. Raise this only to back-fill a dealer who is new to the service.",
    },
    maxDownloadsPerRun: {
      type: 'integer',
      minimum: 1,
      maximum: 60,
      default: 12,
      title: 'Most invoices to download in one run',
      description:
        'A run has about seven minutes in total, including signing in. A dealer being collected for the first time can have twenty or more invoices waiting, and trying all of them would time out and save none. Past this many, the run finishes cleanly with what it has and comes back for the rest shortly after.',
    },
    debugScreenshots: {
      type: 'boolean',
      default: false,
      title: 'Keep a screenshot of every step',
      description:
        'Off by default. Failures always keep a screenshot regardless. Turn this on temporarily when the portal has changed and the selectors need re-checking.',
    },
  },
} as const;
```

> **The `additionalProperties` landmine.** Every plugin schema here sets
> `additionalProperties: false` and ajv has no `removeAdditional`, so **removing a
> key from this schema makes every stored config that still carries it return 400
> on the next PATCH**, with an error the admin cannot clear because the offending
> field is not rendered. Never delete a config key without a migration script that
> `$unset`s it from every stored `DealerService.config` in the same deploy.

### 8.2 `mdg-backend/src/services/tt-density/index.ts`

```ts
const PLUGIN_ID = 'tt-density';

const plugin: ServicePlugin = {
  id: PLUGIN_ID,
  name: 'TT Density',
  description:
    "Reads the dealer's tanker acknowledgement invoices from IndianOil e-Mitra for the last seven days, keeps each invoice PDF, and records the Density@15 printed for every product on it. Read-only on the portal: it never acknowledges a receipt.",
  cadence: 'DAILY',
  // 07:35 IST, not 07:00: `water-ingress-testing` fires on `0 1-23/2 * * *` for
  // every dealer that has it, and SDMS_MAX_CONCURRENCY bounds live browsers to
  // two across ALL pipelines. Landing on the water window queues this service
  // behind the estate.
  defaultCustomCron: '35 7 * * *',
  defaultConfigSchema: ttDensitySchema as unknown as Record<string, unknown>,
  async run(ctx) {
    /* … */
  },
};

export default plugin;
```

No `dependsOn` — this service reads a screen nothing else touches.
No `discoverScheduleOnAttach` — that hook requires the attach run to be
side-effect-free, and this run's whole purpose is a side effect.

`run(ctx)` in order:

1. `ttDensityConfigZod.safeParse(ctx.config)`; on failure throw with the field
   list (copy the water-ingress wording).
2. `sdmsCredentialsFromDealer(ctx.dealerId)`; on failure throw a **non-transient**
   `RunFailure('SDMS_CREDENTIALS_MISSING', 'config', …, false)` _before_ a browser
   is launched.
3. Window: `toDate = istDateKey(ctx.now)`,
   `fromDate = istDateKey(addDays(ctx.now, -(cfg.lookbackDays - 1)))`.
4. `storedInvoiceNos = await listStoredInvoiceNos(ctx.dealerId, fromDate, toDate)`.
5. Build `saveArtifact` (default `kind: 'output'` for the PDFs — this service's
   deliverable IS a file), `recordStep`, `savePdf` and `readInvoice`:
   ```ts
   const savePdf = async (sapInvoiceNo: string, bytes: Buffer): Promise<TtInvoicePdfRef> => {
     // A STABLE key, not a per-run one: the invoice belongs to the dealer, not to
     // the run that happened to fetch it, and the same invoice always maps to the
     // same object so a repeat write is a no-op rather than litter.
     const key = ttInvoicePdfKey(ctx.dealerId, sapInvoiceNo);
     const sha256 = createHash('sha256').update(bytes).digest('hex');
     await storage.put(key, bytes, { contentType: 'application/pdf', size: bytes.length });
     await ctx.recordArtifact({
       filename: `invoice-${sapInvoiceNo}.pdf`,
       storageKey: key,
       size: bytes.length,
       contentType: 'application/pdf',
       kind: 'output',
     });
     return { storageKey: key, size: bytes.length, sha256 };
   };
   ```
6. **Take the gates, in this order**: `sdmsAccountGate.acquire(creds.username)`
   OUTSIDE, `sdmsBrowserSemaphore.acquire()` INSIDE. Translate
   `AccountBlockedError` into a **transient** `RunFailure('ACCOUNT_COOLDOWN', …, true)`.
7. `runWithDeadline(env.SDMS_RUN_TIMEOUT_MS, ({signal, deadlineAt}) => runTtDensityCollection({...}), () => new TtDensityError('CAPTURE_TIMEOUT','run',…), releaseSlot)`.
   `headless: true`, always — headed debugging goes through the CLI.
8. Persist: for each row, `recordInvoiceSighting(...)`; then, for rows with a
   `pdf`, `attachInvoicePdf(...)`; for rows with a `failure`,
   `recordInvoicePdfFailure(...)`.
   8a. **Tell the dealer, at most once, and only when something is actually new.**
   Count the `attachInvoicePdf` calls that returned a document (a null return
   means the bytes were already held, which is not news). If that count is
   greater than zero, call
   `notifyTtDensityArrived(ctx.dealerId, storedCount)` from
   `services/ttDensity/notify.ts`, which resolves the dealer's owner and staff
   and calls `pushToUsersAsync(userIds, { title, body, data: { deeplink: 'density' } })`
   — the existing helper at `mdg-backend/src/lib/push/expoPush.ts:111`, which is
   fire-and-forget and swallows its own failures, so a push outage can never
   fail a run that has already saved its invoices.

   One push per run, whatever the invoice count: three tankers in a night is one
   sentence, not three notifications. **No chat message** — two robot lines a
   week in the thread where a human is supposed to reply is how a thread stops
   being read. The push carries the short deep-link token `density`, which
   `mdg-app/lib/bridge.ts` maps to `/density`; it must be added to
   `DEEP_LINK_TOKENS` (P5c) or the tap opens the app's home screen instead.

   **The 20:00 "you have not sent today's photo" reminder is NOT in this
   release.** It needs a per-dealer reminder hour and a nightly scheduler job of
   its own — the `scheduler/kavach.ts` shape — and neither is worth building
   before we know whether the dealers who have the service are sending photos
   without being asked. §12 names it as the first follow-up.

9. `lease.release(outcome)` — `'rejected'` **only** on `LOGIN_REJECTED`, `'ok'` on
   success, `'portal-error'` otherwise.
10. Return:
    ```ts
    return {
      output: {
        outcome,
        window: { fromDate, toDate },
        rowsListed,
        downloaded,
        parsed,
        stored,
        alreadyStored,
        rowFailures: rows
          .filter((r) => r.failure)
          .map((r) => ({ sapInvoiceNo: r.sapInvoiceNo, ...r.failure })),
        loginAttempts,
        ocrAttemptCount: ocrAttempts.length,
      },
      durationMs: Date.now() - started,
      // The ONLY case this plugin expresses an opinion about its own schedule:
      // it stopped on the download cap and there is more of the window waiting.
      ...(result.capHit ? { nextRunAt: new Date(Date.now() + 45 * 60 * 1000) } : {}),
    };
    ```
11. On `TtDensityError`, record an error step carrying
    `{ code, phase, operatorHint, transient, url, screenshotKey, htmlKey, context }`
    and throw
    `new RunFailure(err.code, err.phase, `${PLUGIN_ID}: [${err.code}] ${err.operatorHint} (failed at ${err.phase})`, worthDeferring(err.code))`.

### 8.3 `mdg-backend/src/services/tt-density/README.md`

Follow the `water-ingress-testing/README.md` skeleton exactly:
`# TT Density` → what it does in one breath, naming the screen with a `▸`
breadcrumb → `## The one rule` (a blockquote: _"An invoice is identified by its
SAP invoice number, per dealer, and its PDF is fetched exactly once."_) →
`## What it does NOT do` (the Acknowledge fence first) → `## Cadence` →
`## Outcomes` → `## Failure codes — who fixes it` → `## Config` (`Field | Default
| Why`) → `## Where it stores things` → `## Running it by hand` →
`## ⚠️ Selectors need live verification`.

---

## 9. (h) The file list — five disjoint work packages

**No file appears in two packages.** Where a package needs a function another
package owns, the signature is given above and the merge order below resolves it.

**Merge order:** P1 first (everything type-checks against it), then P2–P5 in any
order, then the branch is integrated and `npm run check:plugins` + the backend
suite is run over the whole thing.

### Pre-flight (P1, its own commit, before anything else)

`main` is red today: root `npm run lint` fails with 13 warnings and
`--max-warnings=0`. Ten are `import/order` and fix themselves with
`eslint --fix`; three are real —
`mdg-client/src/lib/micDiagnostics.ts:1:35` (unused import),
`shared/src/iras/corrections.ts:66:10` (unused var),
`shared/src/types/conversation.ts:232:10` (inline `import()` type annotation).
Fix all 13 in one commit, mirror the two `shared/` files ×4, and land it before
the feature branch — otherwise nobody can tell their own failures from the
pre-existing ones.

### P1 — Shared contracts (`@dk/shared`, four copies)

Owns **every** file under any `shared/src` tree. Nobody else touches `shared/`.

| Action | Path (repeat in all four trees: `shared/`, `mdg-backend/shared/`, `mdg-admin/shared/`, `mdg-client/shared/`) |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| CREATE | `src/types/ttDensity.ts` — §2.2                                                                              |
| CREATE | `src/tt/materials.ts` — §2.1                                                                                 |
| CREATE | `src/schemas/ttDensity.ts` — §2.3                                                                            |
| MODIFY | `src/types/index.ts` — `export * from './ttDensity';`                                                        |
| MODIFY | `src/schemas/index.ts` — `export * from './ttDensity';`                                                      |
| MODIFY | `src/index.ts` — `export * from './tt/materials';`                                                           |
| MODIFY | `src/types/dealerService.ts` — the `ROSTER_SERVICES` entry, §2.4                                             |
| MODIFY | `src/schemas/chat.ts` — the presign `scope` enum, §2.5                                                       |

Also owns the pre-flight commit above. **Deliverable:** the mirror verification
(§2.7) printing four identical hashes, `npm run typecheck` green at the root, and
four commits (meta, backend, admin, client).

### P2 — The PDF reader and the invoice grammar

Pure, browserless, portal-free. This is the only package that can be finished
with certainty on day one.

| Action | Path                                                                                                                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/pdfText.ts` — §6.1                                                                                                                                                                                                                       |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/pdfText.test.ts` — `reconstructLines` against a synthetic glyph list built from the real invoice's geometry                                                                                                                              |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/invoice.ts` — §6.2                                                                                                                                                                                                                       |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/invoice.test.ts` — the fixture, plus the five open questions as `it` / `it.todo`                                                                                                                                                         |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/__fixtures__/invoice-7010045406.txt` — the extracted text of the real invoice                                                                                                                                                            |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/__fixtures__/invoice-7010045406.expected.json` — the §1 output, exactly                                                                                                                                                                  |
| MODIFY | `mdg-backend/package.json` — add `"pdfjs-dist": "^4.x"` to `dependencies` **and** `"automation:tt-density": "tsx src/automation/sdms/ttDensity/cli/run-tt-density.ts"` to `scripts` (the CLI file is P3's; adding the script line here is what keeps `package.json` in one package) |

**Do not commit a real dealer's invoice PDF.** The committed fixture is the
extracted TEXT. `__fixtures__/` is deliberately not `*.test.ts`, so jest's
`testMatch` ignores it.

**Definition of done:** `cd mdg-backend && npm test -- src/automation/sdms/ttDensity`
passes, and `parseTtInvoiceText(fixture)` deep-equals `invoice-7010045406.expected.json`.

### P3 — The portal collector and its CLI

| Action | Path                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/errors.ts` — §7.2                                                                                                                        |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/table.ts` — the browser half: `readInvoiceTable({ evaluate })`, `COLUMN_MATCHERS`, `FORBIDDEN_MATCHERS`, `mapColumns`, `parsePortalDate` |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/table.test.ts` — `mapColumns` against real and mangled header rows, including one where Download collides with an Acknowledge column     |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/collector.ts` — §7                                                                                                                       |
| CREATE | `mdg-backend/src/automation/sdms/ttDensity/cli/run-tt-density.ts` — §7.3                                                                                                            |

P3 imports the TYPE `ParsedTtInvoice` from P2's `invoice.ts` but calls no
implementation — parsing arrives as `deps.readInvoice`. The CLI wires P2's
`readTtInvoicePdf` and a filesystem `savePdf`.

**Definition of done:** `npm test -- src/automation/sdms/ttDensity/table.test.ts`
passes, and `npm run automation:tt-density -- --headed --days 7` reaches the
table against the real portal and prints the rows. **Budget a full day for the
live tuning**, with the dealer's credentials; everything after `NAV_HOME` was
written from screenshots.

### P4 — Persistence, the plugin, and registration

| Action | Path                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE | `mdg-backend/src/models/TtInvoice.ts` — §3.1                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| CREATE | `mdg-backend/src/models/TtDensityDayLog.ts` — §3.2                                                                                                                                                                                                                                                                                                                                                                                                                               |
| CREATE | `mdg-backend/src/services/ttDensity/invoiceStore.ts` — §5.1                                                                                                                                                                                                                                                                                                                                                                                                                      |
| CREATE | `mdg-backend/src/services/ttDensity/registerStore.ts` — §5.2                                                                                                                                                                                                                                                                                                                                                                                                                     |
| CREATE | `mdg-backend/src/services/ttDensity/notify.ts` — `notifyTtDensityArrived(dealerId, count)`: resolve the dealer's `dealer-owner` / `dealer-staff` users with `status: 'ACTIVE'` (the `resolveDealerOwner` shape in `services/kavach/kavachNotify.ts`), then one `pushToUsersAsync` with `data: { deeplink: 'density' }`. Bilingual title/body live here, not in the plugin, and are the same two sentences as `density.pushTitle` / `density.pushBody` in the client's i18n table |
| CREATE | `mdg-backend/src/services/tt-density/index.ts` — §8.2                                                                                                                                                                                                                                                                                                                                                                                                                            |
| CREATE | `mdg-backend/src/services/tt-density/schema.ts` — §8.1                                                                                                                                                                                                                                                                                                                                                                                                                           |
| CREATE | `mdg-backend/src/services/tt-density/README.md` — §8.3                                                                                                                                                                                                                                                                                                                                                                                                                           |
| CREATE | `mdg-backend/test/integration/ttDensityStore.test.ts` — the dedup test is the one that matters: seven sightings of one invoice produce one document; a failed first download leaves `pdfStatus: 'PENDING'` and the second attempt succeeds; `attachInvoicePdf` on an already-`STORED` row is a no-op returning null; `pdfAttempts` reaching 3 flips to `FAILED`; `getLatestDensities` picks the newest per product and reports `ageDays`                                         |
| MODIFY | `mdg-backend/src/lib/storage/keys.ts` — add `'tt-density'` to `STORAGE_PREFIXES` plus `ttInvoicePdfKey(dealerId, sapInvoiceNo)`, `ttRegisterPhotoKey(dealerId, filename)` and `dealerIdFromTtDensityKey(key)`                                                                                                                                                                                                                                                                    |
| MODIFY | `mdg-backend/scripts/check-plugins.ts` — add `'tt-density'` to `EXPECTED`, **and `'water-ingress-testing'`, which is missing**                                                                                                                                                                                                                                                                                                                                                   |
| MODIFY | `mdg-backend/src/automation/sdms/sharedGate.ts` — the comments naming which services share the account gate and the browser semaphore now name four                                                                                                                                                                                                                                                                                                                              |
| MODIFY | `mdg-backend/src/services/rosterSummary.ts` — **only if needed.** `tt-density` has `delivers: false` and no bespoke deliverable, so the generic non-delivering path (`DONE` / `FAILED` / `PENDING`) should already cover it. Confirm by running `mdg-backend/test/integration/dealerServiceSummary.test.ts`; if it does not, add the branch. Do not add one speculatively.                                                                                                       |

Key shapes, fixed here so P5 can call them:

```ts
/**
 * A tanker invoice PDF, keyed by the invoice rather than by the run that fetched
 * it: the document belongs to the dealer, and the same invoice always maps to
 * the same object so a repeat write is a no-op instead of litter.
 *   tt-density/<dealerId>/invoices/<sapInvoiceNo>.pdf
 * `sapInvoiceNo` is portal data, so it is validated against /^[0-9]{4,24}$/ and
 * passed through `safeFilename` before it reaches a key.
 */
export function ttInvoicePdfKey(dealerId: string, sapInvoiceNo: string): string;

/**
 * A density-register page photo, partitioned by dealer:
 *   tt-density/<dealerId>/register/<uuid>.<ext>
 * The first three segments are stable so the owning dealer can be derived from
 * any key — which is what the upload route checks before it will store one.
 */
export function ttRegisterPhotoKey(dealerId: string, filename: string): string;

/** Extract the dealerId from a `tt-density/<dealerId>/...` key, or null. */
export function dealerIdFromTtDensityKey(key: string): string | null;
```

**Every other place in the repo that enumerates a service id — checked, and why
each one is not on this list.** The list came from a full grep for the five
existing plugin ids; nothing below needs an edit, and the reason is recorded so
nobody re-checks it.

| File                                                                           | Why it is not touched                                                                                                                                                |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mdg-backend/src/services/registry.test.ts:13` (`REAL_PLUGINS`)                | asserts _contains_, not equals — `expect(ids).toContain(expected)` over a two-id list. A sixth plugin passes unchanged                                               |
| `mdg-backend/test/integration/services.test.ts:26` (`REQUIRED_PLUGIN_IDS`)     | same shape, same reason                                                                                                                                              |
| `mdg-backend/src/seed.ts` (`ATTACH_PLAN`)                                      | the demo seed. `tt-density` needs real SDMS credentials to do anything, so seeding it onto a demo dealer would manufacture a service that fails on its first run     |
| `mdg-admin/src/pages/dealers/schedulePicker.ts`                                | holds `DSR_SERVICE_ID` / `IRAS_SERVICE_ID` / `INSPECTION_SERVICE_ID` only because the DSR schedule advisory needs them. `tt-density` has no upstream and no advisory |
| `mdg-admin/src/pages/dealers/AttachServiceDialog.tsx`, `EditServiceDialog.tsx` | the same DSR-only advisory branch                                                                                                                                    |
| `mdg-admin/src/pages/dealers/DealerServicesTab.tsx`                            | reads whether IRAS / Inspection are attached, for that advisory                                                                                                      |
| `mdg-admin/src/pages/dataVault/datasets.ts`                                    | the cross-dealer Vault, deliberately out of this release (P5b)                                                                                                       |
| `mdg-backend/src/routes/v1/dealerServices.ts:362-368`                          | the one service-id special case in "run now" — a Credit & DOD hourly quota. `tt-density` takes the generic path                                                      |
| `mdg-backend/src/services/creditDod/runQuota.ts`                               | that quota                                                                                                                                                           |
| `shared/src/types/enums.ts` (`CADENCES`)                                       | closed on purpose. `DAILY` covers this; `defaultCustomCron` carries the 07:35                                                                                        |
| `mdg-app`, `mdg-admin-app`, `mdg-landing`, `mdg-demo`                          | no `shared/` copy and no service ids. The single `mdg-app` line P5c adds is a deep-link token, not a service id                                                      |

**Definition of done:** `npm run check:plugins` lists `tt-density`;
`npm run test:integration` passes; `npm run typecheck` clean.

### P5 — The HTTP API and both user interfaces

The largest package. It splits cleanly on the backend/frontend line if two people
take it; the groups below are already disjoint.

**P5a — backend**

| Action | Path                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE | `mdg-backend/src/routes/v1/ttDensity.ts` — §4, both routers                                                                                                                                                                                                                                                                                                                                                                                                     |
| CREATE | `mdg-backend/test/integration/ttDensity.test.ts` — the summary never 404s for an uncollected dealer; the pdf-url response carries an `inline` and an `attachment` URL and writes an audit row; a dealer token gets 403 on every `/tt-density/dealers/...` route; a dealer marking a day marks THEIR day and cannot name another dealer; a `storageKey` outside the dealer's own prefix is refused; a second photo for one day supersedes rather than duplicates |
| MODIFY | `mdg-backend/src/routes/v1/index.ts` — the two mounts, in the order given in §4                                                                                                                                                                                                                                                                                                                                                                                 |
| MODIFY | `mdg-backend/src/routes/v1/uploads.ts` — the `tt-density` scope branch and `assertTtDensityDealerAccess`, §4.4                                                                                                                                                                                                                                                                                                                                                  |

**P5b — mdg-admin**

Every visual decision below is `docs/specs/tt-density-ux.md` §3, which is binding
on appearance and behaviour. What this table fixes is the **file names, the
folder and the container primitive**, because the UX spec and an earlier draft of
this section disagreed about all three.

| Action | Path                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE | `mdg-admin/src/hooks/api/useTtDensity.ts` — `ttDensityKeys` + queries for summary / invoices / invoice / pdf-url / days (`{from,to}` **and** `{limit}` variants), and mutations for the photo upload and "Fetch invoices now"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CREATE | `mdg-admin/src/pages/dealers/vault/DealerTtDensityPane.tsx` — the pane; props are `{ dealer }` (`DealerVaultPaneProps`, `vault/types.ts:13`). No URL params reach it, so open-invoice / selected-day / shown-month are local `useState`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CREATE | `mdg-admin/src/pages/dealers/vault/ttDensity/DensityHero.tsx` — UX §3.3. One tile per product, in the order `getLatestDensities` returned them (diesel first — do **not** re-sort). The number is `text-[40px] md:text-5xl font-semibold leading-none tabular-nums`, always three decimals via `toFixed(3)`, never `toLocaleString`. Grid is `grid-cols-1 sm:grid-cols-2` at every width. Staleness is the shared `ttDensityFreshness(ageDays)` ladder — 7/21, not 14 — and **a stale tile never hides the figure**. A `provisional` product is labelled `16730 · EBMS` from `materialCode` and `description`, with a neutral "New product" badge. There is **no "no invoice yet" tile**: this service does not know which grades an outlet stocks                                     |
| CREATE | `mdg-admin/src/pages/dealers/vault/ttDensity/InvoiceTable.tsx` — UX §3.4. `Table` ≥`md`, `MobileCardList` below. Five columns, sorted invoice date desc then SAP number desc, density cell capped at 3 product lines. `quantity`/`unit` come off `TtInvoiceSummary.densities`, so a row never fetches the full invoice to print `6 KL`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| CREATE | `mdg-admin/src/pages/dealers/vault/ttDensity/InvoicePdfDrawer.tsx` — a **`Drawer width="lg"`**, not a `Dialog`. Below `md` the `Drawer` is already a bottom sheet with a grabber, `max-h-[92dvh]` and a safe-area footer, which is exactly the mobile behaviour UX §3.6 specifies and which a `Dialog` would have to reimplement. Contains the extracted-density chips **above** the frame (so the numbers survive a frame that never paints), then `<iframe src={viewUrl}>` — `viewUrl`/`downloadUrl` from A4, not `pdfViewUrl`/`pdfDownloadUrl`. Skeleton clears on `onLoad` **or 6000 ms**. Below `md` do not mount the iframe at all: gate on `useMediaQuery('(min-width: 768px)')`, never `hidden md:block`, because a hidden iframe still downloads the file. **No PDF library** |
| CREATE | `mdg-admin/src/pages/dealers/vault/ttDensity/DayMarkCalendar.tsx` — UX §3.7. A **month grid**, not a 14-day strip: a month of gaps is the thing an operator is looking at, and a strip either scrolls the gaps out of sight or shrinks below the 44px floor. Card `p-3 md:p-4`, grid `grid-cols-7 gap-1 md:gap-1.5` — that is what yields 44.3px cells at 390px; do not "tidy" it to `p-4 gap-2`. Green = covered, `ring-2 ring-inset ring-brand` + dot = MDG added it, dashed = missing. Month arrows call A5 with `{from,to}`                                                                                                                                                                                                                                                        |
| CREATE | `mdg-admin/src/pages/dealers/vault/ttDensity/UploadDayPhotoDialog.tsx` — UX §3.7, modelled on `features/records/UploadRecordDialog.tsx`. `accept="image/*"`, presign with `scope: 'tt-density'` + `dealerId`, PUT, then A7. The permanent line above submit — _"This will be recorded as uploaded by you, not by the dealer."_ — is not a checkbox and not dismissible                                                                                                                                                                                                                                                                                                                                                                                                                 |
| CREATE | `mdg-admin/src/pages/dealers/vault/ttDensity/useTtDensityRunWatcher.ts` — the 202-then-poll watcher for A8, copied from `pages/dsr/useDsrRunWatcher.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CREATE | `mdg-admin/src/pages/dealers/vault/ttDensity/format.ts` — the pure bits (freshness → classes, age wording, `toFixed(3)`, the density-cell line builder), kept out of the components so they are testable the day `mdg-admin` gets a test runner. **It has none today** — `mdg-admin/package.json` has `lint` and `typecheck` and no `test` script — which is exactly why anything decidable belongs in this file                                                                                                                                                                                                                                                                                                                                                                       |
| CREATE | `mdg-admin/src/components/ui/ImageLightbox.tsx` — the extraction UX §3.9 asks for: `Dialog size="lg"` + `<img className="mx-auto max-h-[70vh] w-auto" draggable={false}>` + an optional ghost Download. Props `{ open, onClose, src, alt, title?, downloadUrl? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| MODIFY | `mdg-admin/src/components/ui/index.ts` — export `ImageLightbox`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| MODIFY | `mdg-admin/src/features/chat/AttachmentPreview.tsx`, `mdg-admin/src/features/chat/MediaGalleryCard.tsx`, `mdg-admin/src/pages/dealers/DealerStaffTab.tsx` — migrate the three existing copies of that markup onto `ImageLightbox` in the same change. An extraction that leaves the copies behind has made four of a thing that was three                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| MODIFY | `mdg-admin/src/pages/dealers/vault/datasets.ts` — append `{ id: 'tt-density', label: 'TT Density', description: "Density@15 from this dealer's tanker invoices, and the daily register photos.", Icon: Gauge, requiresService: 'tt-density', Pane: DealerTtDensityPane }`, after `inspection-reports`. `Gauge` from `lucide-react`. **Do not add a `TabDef` to `DealerDetailPage.tsx`** — per-service dealer tabs were retired; the Vault grows by gaining a descriptor. Reproduce the existing three-state gate exactly (in flight → withhold; error → show; success → membership); collapsing it to "truthy data or not" is what once deleted the Credit & DOD tab silently                                                                                                          |
| MODIFY | `mdg-admin/src/lib/serviceLabel.ts` — `'tt-density': 'TT Density'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Not in this release, and not to be started:** the cross-dealer Data Vault pane
(UX §3.10). It answers a real question — _which outlets are not keeping the
book_ — but it needs an estate-wide endpoint this contract does not define, and
UX §3.10 itself says "ship after the per-dealer pane". `mdg-admin/src/pages/dataVault/datasets.ts`
is therefore **not** touched by any package. §12 names it as a follow-up.

**P5c — mdg-client (and the one line in `mdg-app`)**

Binding on appearance and copy: `docs/specs/tt-density-ux.md` §4, including the
whole bilingual string table at §4.6.

| Action | Path                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE | `mdg-client/src/pages/DensityPage.tsx` — mirrors `KavachPage`: `flex flex-1 flex-col gap-5 p-4`, `h1 text-lg font-semibold tracking-tight`, four states (loading / error / not-attached / normal), `HelpFooter`, all hooks before any early return                                                                                                                                                                                                                                                                                                                               |
| CREATE | `mdg-client/src/features/density/DensityLatestStrip.tsx` — the dealer's own view of the figures, above the photo card. One row per product from `TtDensityMeView.latest`, **in the order it arrived**, each showing `labelHi`/`labelEn` and `density15Raw` at `text-[32px] font-semibold tabular-nums`, with `density.registerLine` under it and the tanker and date beneath that. **No unit, no "Density@15", no invoice number, no rupees** — the banned-words list in UX §4.6 applies. Older than `TT_DENSITY_STALE_AFTER_DAYS` it keeps the figure and adds the age in words |
| CREATE | `mdg-client/src/features/density/DensityTodayCard.tsx` — mirrors `ComplianceTaskCard`: `rounded-2xl border p-4 shadow-sm`, an `h-11 w-11 rounded-xl` icon tile, `<Button fullWidth size="lg" leftIcon={<Camera />}>` for the camera and a secondary for the gallery. Two hidden inputs (`capture="environment"` and plain), `e.target.value = ''` after every pick. Also the done state and the missed-days state; **never two primary buttons on one card**                                                                                                                     |
| CREATE | `mdg-client/src/features/density/DensityCaptureSheet.tsx` — the preview sheet (UX §4.3): object-URL preview `draggable={false}` revoked on close and unmount, `useScrollLock()`, Send / Take again, no progress bar, offline disables the send with a sentence above it                                                                                                                                                                                                                                                                                                          |
| CREATE | `mdg-client/src/features/density/DensityWeekStrip.tsx` — the 7 markable days as `<button>`s ≈44px, sent / still-to-do / today / MDG-added                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| CREATE | `mdg-client/src/hooks/api/useDensity.ts` — `useQuery` on `/v1/tt-density/me` with `enabled: !!token`, `staleTime: 30_000`; the mark-done mutation with `onMutate` / rollback `onError` / `onSettled` invalidate. **Hold the uploaded `storageKey` in state and carry it into the retry path** — `ComplianceTaskCard.tsx:715` re-uploads a photo that already landed, and here the photo _is_ the deliverable                                                                                                                                                                     |
| CREATE | `mdg-client/src/lib/uploadDensityPhoto.ts` — cloned from `uploadStaffHardcopy.ts`: `resolveFileType(file, { assumeImage: true })` (Android camera captures arrive with an empty MIME type), `compressImage`, then presign with `scope: 'tt-density'` and `dealerId`, then `PUT`. Returns the `storageKey`                                                                                                                                                                                                                                                                        |
| MODIFY | `mdg-client/src/App.tsx` — a `lazyWithRetry` import and a `<Route path="density">` inside the protected layout                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| MODIFY | `mdg-client/src/pages/ChatListPage.tsx` — render `DensityTodayCard` pinned above the list **only while something is due** (today unmarked, or a day inside the window missed). Once today is sent it disappears until tomorrow. Chat is the app's home route; the one thing the dealer owes today belongs there, not on the Reports shelf, which is where MDG puts things it sends _to_ the dealer                                                                                                                                                                               |
| MODIFY | `mdg-client/src/pages/ProfilePage.tsx` — a `Card` row linking to `/density`, identical markup to the Staff Points row. **No fifth bottom tab**; the bar is four and stays four                                                                                                                                                                                                                                                                                                                                                                                                   |
| MODIFY | `mdg-client/src/lib/i18n.ts` — the `density.*` block from UX §4.6, `{ en, hi }` on every key, plus the three keys the figures strip needs: `density.latestTitle`, `density.registerLine`, `density.noReadingYet`                                                                                                                                                                                                                                                                                                                                                                 |
| MODIFY | `mdg-app/lib/bridge.ts` — one entry in `DEEP_LINK_TOKENS`: `density: '/density'`. Without it the "new density" push (§8.2 step 8a) opens the app's home screen. Nothing else in `mdg-app` changes — Android `CAMERA` is already granted on mount, which is the permission `<input capture>` needs                                                                                                                                                                                                                                                                                |

> **`mdg-app` is a separate git repo** with no `shared/` copy of its own. One
> line, one commit, and it must ship before the first push is sent or the deep
> link is dead on arrival.

**P5d — docs**

| Action | Path                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MODIFY | `docs/API_CONTRACT.md` — the eleven endpoints of §4                                                                                                                                                                       |
| MODIFY | `docs/rest.http` — one curl example per endpoint group                                                                                                                                                                    |
| MODIFY | `docs/TEST_PLAN.md` — the manual pass: the read-only fence checked by eye on the portal, one dealer marking a day, one admin marking a day, and an invoice read inline with the Downloads folder watched before and after |

The date the dealer marks: an `<input type="date">` defaulted to `istDate()`,
`max` = today, `min` = `earliestMarkableDate` from the `/me` payload. That is the
Staff Points pattern, and it is what stops a dealer who uploads at 00:30 from
marking the wrong day.

---

## 10. Commands, per package

```bash
# shared mirror + hashes (P1)                      §2.7
cd /Users/dissu/Documents/PP/mdg-service && npm run typecheck && npm run lint

# backend: one file (the NODE_OPTIONS flag lives in the npm script, not the config)
cd /Users/dissu/Documents/PP/mdg-service/mdg-backend
npm test -- src/automation/sdms/ttDensity/invoice.test.ts
npm test                       # everything; maxWorkers:1, so it is slow
npm run test:integration
npm run check:plugins
npm run lint                   # --max-warnings=0
npm run typecheck

# the portal, by hand (P3)
npm run automation:tt-density -- --headed --days 7

# client (P5c)
cd /Users/dissu/Documents/PP/mdg-service/mdg-client && npm test

# admin (P5b) — there is NO test runner in mdg-admin. Keep logic in `format.ts`.
cd /Users/dissu/Documents/PP/mdg-service/mdg-admin && npm run lint && npm run typecheck
```

Backend tests occasionally fail at the transport level under load (`socket hang
up`, a phantom 426). Re-run the single file before hunting a regression.

---

## 11. Things that will bite, in order of likelihood

1. **The portal DOM after `NAV_HOME` is entirely unknown.** Menu label spelling,
   whether "Download Invoice" is a sub-item or a column, whether the date filter
   is native or a picker, whether the grid is a `<table>` or an ag-Grid, and
   which of three date formats the filter wants. Every selector is a text ladder,
   every column is matched by header regex, nothing is positional, and every
   phase saves a diagnostics bundle. **First run: `--headed`, dry.**
2. **The download mechanism.** A real `href`, a JS `download` event, a same-page
   navigation, or a POST-driven download that none of those cover. The
   `download_link_*.txt` diagnostic answers it in one look; if `href` and
   `onclick` are both empty, watch `page.on('response')` for
   `application/pdf` and read the body directly.
3. **`download.path()` can return `null`.** Guard it. An unguarded read stores a
   zero-byte PDF, which is worse than storing none.
4. **The seven-minute run budget.** `SDMS_RUN_TIMEOUT_MS` is 420 000 ms for the
   whole run, including a captcha login and the SSO handoff. A first collection
   for a busy dealer can list 15–25 invoices; at 4–6 s each that is 80–120 s,
   which fits — but `maxDownloadsPerRun` and `TT_DOWNLOAD_RESERVE_MS` are what
   make a squeeze end as a clean `PARTIAL` rather than a `CAPTURE_TIMEOUT` that
   saves nothing.
5. **`dist/` is never cleaned by the deploy.** `deploy.sh` runs `tsc` over an
   existing `dist/`, and `tsc` does not remove outputs for deleted sources — so
   production has registered plugins that no longer exist in source. Adding
   `tt-density` does not trigger this, but **renaming the folder at any point
   before launch means deleting `dist/services/<old-name>/` on the box by hand**,
   or two plugins register and one of them is a corpse still holding an id.
6. **Four vendored copies of `@dk/shared`.** A copy you forgot to mirror
   compiles against the old contract and fails at runtime with a field that is
   not there. Run the four-hash check before every commit that touches `shared/`.
7. **`/uploads/sign` is `requireAuth` only.** The per-scope guard is the entire
   access control. Miss any one of the three checks in §4.4 and a dealer-staff
   account can write objects under another dealer's prefix. The integration test
   for that refusal is worth more than any UI test in this feature.

---

## 12. Implementation order and hand-off

Five packages. Nobody talks to anybody. This section is the only thing that makes
that safe: it says what each package owns, what it may assume already exists, and
what it must not touch.

### 12.1 The order

```
        ┌──────────────────────────────────────────────┐
        │  P0  pre-flight: make `main` green           │  ← P1's first commit,
        │      13 lint warnings, its own commit        │     before the branch
        └───────────────────────┬──────────────────────┘
                                ▼
        ┌──────────────────────────────────────────────┐
        │  P1  @dk/shared × 4 — types, schemas, catalog │  ← everything compiles
        │      MUST land first and alone                │     against this
        └───────────────────────┬──────────────────────┘
                                ▼
        ┌───────────┬───────────┬───────────┬──────────┐
        │  P2 PDF   │  P3 portal│  P4 store │  P5 API  │  ← any order, in parallel
        │  reader   │  collector│  + plugin │  + UIs   │
        └───────────┴───────────┴───────────┴──────────┘
                                ▼
        ┌──────────────────────────────────────────────┐
        │  integrate → check:plugins → backend suite    │
        │  → headed dry run on 15E → attach to 15E      │
        └──────────────────────────────────────────────┘
```

**P1 goes first and goes alone.** Not because it is big — it is the smallest of
the five — but because it is the only one every other package type-checks
against, and because it is the only one that touches four git repositories at
once. A P1 that lands half-mirrored produces a `mdg-admin` that compiles against
a `TtLatestDensity` without `materialCode` and fails at runtime with a field that
is not there. Run the four-hash check in §2.7 before the commit, not after.

P2, P3, P4 and P5 are genuinely parallel. They are wired to each other only by
signatures, all of which are written out above:

| This package needs…                             | …which this one owns                  | How it is bridged before that one lands                                                                                                               |
| ----------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3 needs to parse a PDF                         | P2's `readTtInvoicePdf`               | P3 never imports it. Parsing arrives as `deps.readInvoice`, and P3 imports only the **type** `ParsedTtInvoice`. The CLI wires the real one at the end |
| P4 needs to drive a browser                     | P3's `runTtDensityCollection`         | one import, one call, signature fixed in §7. Until P3 lands, P4's tests exercise the stores directly                                                  |
| P4 needs a `pdfjs` dependency in `package.json` | P2                                    | P2 adds it, and adds P3's npm script line too, so `mdg-backend/package.json` is edited by exactly one package                                         |
| P5a needs the stores                            | P4's `invoiceStore` / `registerStore` | signatures fixed in §5. P5a's route handlers are thin enough to write against them blind                                                              |
| P5b/P5c need the API                            | P5a's routes                          | shapes fixed in §4 and typed by P1. Both UIs can be built against a hand-written fixture of `TtDensitySummary` / `TtDensityMeView`                    |

### 12.2 What each package may assume already exists

Everything in this column is production code today. **Do not rewrite any of it,
and do not fork it.** If it does not do what you need, say so — that is a finding
about this document, not a licence to copy a file.

| Package | May assume                                                                                                                                                                                                                                                                                                                                                         | Must not touch                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**  | `shared/src/dsr/products.ts` (`DsrProductFamily`, the degrade-don't-fail philosophy), the four-tree mirror procedure, `ROSTER_SERVICES`                                                                                                                                                                                                                            | anything under `mdg-backend/`, `mdg-admin/`, `mdg-client/src` — apart from the three pre-flight lint fixes, which land in a separate commit before the branch           |
| **P2**  | nothing but Node and `pdfjs-dist`. No database, no browser, no portal. This package can be finished with certainty on day one                                                                                                                                                                                                                                      | every other file in the repo. It owns `mdg-backend/package.json` and six files in one folder                                                                            |
| **P3**  | `automation/sdms/login/` (`sdmsLogin` — the captcha, the maths question, the SSO handoff), `automation/sdms/emitra/` (`reachEmitraHome`, `revealSidebar`), `portalResponse.ts`, `humanize.ts`, `PipelineLogger`, `RecordStep`, `SaveArtifact`, `PortalDiagnostics`, `withDeadline`. **You write none of the login and none of the navigation**                     | `humanContextOptions` (set `acceptDownloads: true` in your own `newContext` instead), `sharedGate.ts` (P4 edits its comments), anything under `services/`               |
| **P4**  | `ServicePlugin` / `ServiceRunContext` / `RunFailure` / `executeRun`, `sdmsAccountGate`, `sdmsBrowserSemaphore`, `sdmsCredentialsFromDealer`, `runWithDeadline`, `getStorage()`, `pushToUsersAsync`, `istDateKey`, the registry's boot-time glob of `services/*/index.ts` — **there is no central registry to edit**                                                | `routes/` (P5a's), `mdg-backend/package.json` (P2's), any `shared/` tree                                                                                                |
| **P5a** | `requireAuth`, `requireRole`, `validate`, `asyncHandler`, `AppError`, `auditFromReq`, `assertDealerNotArchived`, `inlineDisposition` / `attachmentDisposition`, `getStorage().getSignedDownloadUrl`, `paginate`                                                                                                                                                    | the stores' internals (call them, never reach past them into the models), `keys.ts` (P4's)                                                                              |
| **P5b** | every primitive in `mdg-admin/src/components/ui/` — `Drawer`, `Dialog`, `Card`, `Table`, `MobileCardList`, `Badge`, `Callout`, `EmptyState`, `Skeleton`, `Button`, `Toast` — plus `useMediaQuery`, `DealerVaultView`'s three-state gate, `pages/dsr/useDsrRunWatcher.ts` as a model. **`mdg-admin` has no test runner**, so anything decidable goes in `format.ts` | `DealerDetailPage.tsx` (no new `TabDef`), `pages/dataVault/` (cross-dealer, deferred), `StatTile.tsx` (a 24px integer counter — leave it alone and write `DensityHero`) |
| **P5c** | `KavachPage` as the page model, `ComplianceTaskCard` and `FinalizeSubmitSheet` as the card and sheet models, `compressImage`, `resolveFileType`, `uploadStaffHardcopy` as the upload model, `useScrollLock`, `lazyWithRetry`, `HelpFooter`, `EmptyState`, the four-state page rule, and an Android `CAMERA` grant that already happens on mount                    | the bottom tab bar (four tabs, stays four), `mdg-app` beyond the one `DEEP_LINK_TOKENS` line                                                                            |

### 12.3 Every file, and the one package that owns it

**No path appears twice.** This table is the disjointness proof; if you find
yourself editing a file that is not in your own block, stop.

| File                                                                                             | Package |
| ------------------------------------------------------------------------------------------------ | ------- |
| `shared/src/types/ttDensity.ts` _(×4 trees)_                                                     | P1      |
| `shared/src/tt/materials.ts` _(×4)_                                                              | P1      |
| `shared/src/schemas/ttDensity.ts` _(×4)_                                                         | P1      |
| `shared/src/types/index.ts` _(×4)_                                                               | P1      |
| `shared/src/schemas/index.ts` _(×4)_                                                             | P1      |
| `shared/src/index.ts` _(×4)_                                                                     | P1      |
| `shared/src/types/dealerService.ts` _(×4)_                                                       | P1      |
| `shared/src/schemas/chat.ts` _(×4)_                                                              | P1      |
| `shared/src/iras/corrections.ts` _(×4)_ — pre-flight lint only                                   | P1      |
| `shared/src/types/conversation.ts` _(×4)_ — pre-flight lint only                                 | P1      |
| `mdg-client/src/lib/micDiagnostics.ts` — pre-flight lint only, separate commit before the branch | P1      |
| `mdg-backend/src/automation/sdms/ttDensity/pdfText.ts`                                           | P2      |
| `mdg-backend/src/automation/sdms/ttDensity/pdfText.test.ts`                                      | P2      |
| `mdg-backend/src/automation/sdms/ttDensity/invoice.ts`                                           | P2      |
| `mdg-backend/src/automation/sdms/ttDensity/invoice.test.ts`                                      | P2      |
| `mdg-backend/src/automation/sdms/ttDensity/__fixtures__/invoice-7010045406.txt`                  | P2      |
| `mdg-backend/src/automation/sdms/ttDensity/__fixtures__/invoice-7010045406.expected.json`        | P2      |
| `mdg-backend/package.json`                                                                       | P2      |
| `mdg-backend/src/automation/sdms/ttDensity/errors.ts`                                            | P3      |
| `mdg-backend/src/automation/sdms/ttDensity/table.ts`                                             | P3      |
| `mdg-backend/src/automation/sdms/ttDensity/table.test.ts`                                        | P3      |
| `mdg-backend/src/automation/sdms/ttDensity/collector.ts`                                         | P3      |
| `mdg-backend/src/automation/sdms/ttDensity/cli/run-tt-density.ts`                                | P3      |
| `mdg-backend/src/models/TtInvoice.ts`                                                            | P4      |
| `mdg-backend/src/models/TtDensityDayLog.ts`                                                      | P4      |
| `mdg-backend/src/services/ttDensity/invoiceStore.ts`                                             | P4      |
| `mdg-backend/src/services/ttDensity/registerStore.ts`                                            | P4      |
| `mdg-backend/src/services/ttDensity/notify.ts`                                                   | P4      |
| `mdg-backend/src/services/tt-density/index.ts`                                                   | P4      |
| `mdg-backend/src/services/tt-density/schema.ts`                                                  | P4      |
| `mdg-backend/src/services/tt-density/README.md`                                                  | P4      |
| `mdg-backend/test/integration/ttDensityStore.test.ts`                                            | P4      |
| `mdg-backend/src/lib/storage/keys.ts`                                                            | P4      |
| `mdg-backend/scripts/check-plugins.ts`                                                           | P4      |
| `mdg-backend/src/automation/sdms/sharedGate.ts`                                                  | P4      |
| `mdg-backend/src/services/rosterSummary.ts` _(only if the test demands it)_                      | P4      |
| `mdg-backend/src/routes/v1/ttDensity.ts`                                                         | P5a     |
| `mdg-backend/test/integration/ttDensity.test.ts`                                                 | P5a     |
| `mdg-backend/src/routes/v1/index.ts`                                                             | P5a     |
| `mdg-backend/src/routes/v1/uploads.ts`                                                           | P5a     |
| `mdg-admin/src/hooks/api/useTtDensity.ts`                                                        | P5b     |
| `mdg-admin/src/pages/dealers/vault/DealerTtDensityPane.tsx`                                      | P5b     |
| `mdg-admin/src/pages/dealers/vault/ttDensity/DensityHero.tsx`                                    | P5b     |
| `mdg-admin/src/pages/dealers/vault/ttDensity/InvoiceTable.tsx`                                   | P5b     |
| `mdg-admin/src/pages/dealers/vault/ttDensity/InvoicePdfDrawer.tsx`                               | P5b     |
| `mdg-admin/src/pages/dealers/vault/ttDensity/DayMarkCalendar.tsx`                                | P5b     |
| `mdg-admin/src/pages/dealers/vault/ttDensity/UploadDayPhotoDialog.tsx`                           | P5b     |
| `mdg-admin/src/pages/dealers/vault/ttDensity/useTtDensityRunWatcher.ts`                          | P5b     |
| `mdg-admin/src/pages/dealers/vault/ttDensity/format.ts`                                          | P5b     |
| `mdg-admin/src/components/ui/ImageLightbox.tsx`                                                  | P5b     |
| `mdg-admin/src/components/ui/index.ts`                                                           | P5b     |
| `mdg-admin/src/features/chat/AttachmentPreview.tsx`                                              | P5b     |
| `mdg-admin/src/features/chat/MediaGalleryCard.tsx`                                               | P5b     |
| `mdg-admin/src/pages/dealers/DealerStaffTab.tsx`                                                 | P5b     |
| `mdg-admin/src/pages/dealers/vault/datasets.ts`                                                  | P5b     |
| `mdg-admin/src/lib/serviceLabel.ts`                                                              | P5b     |
| `mdg-client/src/pages/DensityPage.tsx`                                                           | P5c     |
| `mdg-client/src/features/density/DensityLatestStrip.tsx`                                         | P5c     |
| `mdg-client/src/features/density/DensityTodayCard.tsx`                                           | P5c     |
| `mdg-client/src/features/density/DensityCaptureSheet.tsx`                                        | P5c     |
| `mdg-client/src/features/density/DensityWeekStrip.tsx`                                           | P5c     |
| `mdg-client/src/hooks/api/useDensity.ts`                                                         | P5c     |
| `mdg-client/src/lib/uploadDensityPhoto.ts`                                                       | P5c     |
| `mdg-client/src/App.tsx`                                                                         | P5c     |
| `mdg-client/src/pages/ChatListPage.tsx`                                                          | P5c     |
| `mdg-client/src/pages/ProfilePage.tsx`                                                           | P5c     |
| `mdg-client/src/lib/i18n.ts`                                                                     | P5c     |
| `mdg-app/lib/bridge.ts`                                                                          | P5c     |
| `docs/API_CONTRACT.md`                                                                           | P5d     |
| `docs/rest.http`                                                                                 | P5d     |
| `docs/TEST_PLAN.md`                                                                              | P5d     |

**The one near-collision, and how it is resolved:** `mdg-client/src/lib/micDiagnostics.ts`
is P1's (a pre-existing lint warning) and `mdg-client/src/**` is otherwise P5c's.
P1's fix lands in its **own commit, on `main`, before the feature branch is cut**,
so the two never touch the same working tree. If for any reason the pre-flight
commit slips onto the branch, P5c must rebase on it rather than fix the warning
itself.

**The other one worth naming:** `mdg-backend/package.json` gains a dependency
(P2's `pdfjs-dist`) _and_ a script line pointing at a file P3 creates. Both edits
are P2's, deliberately, so one file has one owner. P3's CLI simply does not run
until P2 has landed, which is the same day.

### 12.4 The gate before anybody attaches this to a dealer

In order, and none of them is optional:

1. `npm run typecheck` and `npm run lint` green at the root, with four identical
   `shared` hashes.
2. `cd mdg-backend && npm test && npm run test:integration && npm run check:plugins`.
   `check:plugins` must print `tt-density` **and** `water-ingress-testing` — the
   latter has been missing from `EXPECTED` all along and P4 fixes it.
3. `npm run automation:tt-density -- --headed --days 7`, **without `--download`**,
   against 15E, watched by a human. Budget a day. Everything after `NAV_HOME` was
   written from screenshots.
4. That human confirms **by eye** that no Vehicle Condition select was touched, no
   Check pressed and no Acknowledge pressed, and that the acknowledgement state of
   every listed invoice is unchanged at the end of the run.
5. `--download` on the same window; every extracted `Density@15` compared by eye
   against its PDF for at least three invoices.
6. Only then attach to 15E, alone, for seven days.

### 12.5 The follow-ups this release deliberately leaves

Named so nobody rebuilds them by accident, and so nobody thinks they were
forgotten:

| Follow-up                                                                   | Why not now                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The 20:00 "today's photo is missing" reminder push                          | Needs a per-dealer reminder hour and a nightly scheduler job of its own. Build it when we know whether dealers send photos unprompted — that is what metric M4 is for                                                                                          |
| The cross-dealer Data Vault pane ("who is not keeping the book")            | Needs an estate-wide endpoint this contract does not define. UX §3.10 already says "ship after the per-dealer pane"                                                                                                                                            |
| Rejecting a photo as "not the register page"                                | No status for it in `TtRegisterDayStatus` and no UI in the UX spec. Replacement already covers the real case (a blurry photo); rejection needs a conversation with the dealer that a button does not have                                                      |
| Detecting a re-issued invoice with the same SAP number and changed contents | `attachInvoicePdf` never re-reads a stored invoice, so a stored invoice is immutable — which is the property that guarantees a density a dealer already copied cannot silently change under them. Detection would need a second fetch of bytes we already hold |
| Any reconciliation of the register photo against the invoice density        | ADR 0010 §9. The tolerance has not been agreed. The seam is open — same product keys in both catalogs, an optional `note` on the photo — and nothing in the UI hints at it                                                                                     |
| A dealer-facing invoice PDF                                                 | ADR 0010 §13. The dealer already holds these documents from IndianOil; serving financial documents to a dealer token widens the surface for no new fact                                                                                                        |

---

## 13. What the three design documents disagreed about, and what won

Recorded because two of them are still on disk and somebody will read one of them
in six months. The PRD and the UX spec were **both amended** where they were
simply wrong; where they were merely different, this contract's shape won.

| #   | The disagreement                                                                                                                                                                                                           | Resolution                                                                                                                                                                                                                                                                                                                                                                 | Amended                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | Upload scope string: `tt-density` (contract) vs `density` (UX §4.3)                                                                                                                                                        | `tt-density` — one word for the scope, the prefix, the folder, the id and the deep link                                                                                                                                                                                                                                                                                    | UX §4.3                                |
| 2   | Storage key: `ttRegisterPhotoKey(dealerId, filename)` vs `densityPhotoKey(dealerId, businessDate, filename)`                                                                                                               | the dealer-partitioned key. The prefix check in §4.4 is `tt-density/<dealerId>/register/`, and a date in the middle of it makes the owning dealer harder to derive, not easier                                                                                                                                                                                             | UX §4.3                                |
| 3   | How far a **dealer** may back-date: 7 days (UX, contract) vs today+yesterday only (PRD §7.8, AC7.2)                                                                                                                        | **7 days, inclusive of today.** One number for the whole service — it is also the portal's filter and our fetch window                                                                                                                                                                                                                                                     | PRD                                    |
| 4   | How far an **admin** may back-date: 60 (contract) vs 90 (PRD AC6.6, §7.8)                                                                                                                                                  | **60**                                                                                                                                                                                                                                                                                                                                                                     | PRD                                    |
| 5   | Manual back-fill: an explicit From/To range up to 90 days (PRD TTD-11) vs a `lookbackDays` override ≤31 (contract A8)                                                                                                      | the one-run `lookbackDays` override. A second way to name a window is a second set of bugs                                                                                                                                                                                                                                                                                 | PRD                                    |
| 6   | Admin register history: a 14-day strip (contract P5b) vs a month calendar with month switching (UX §3.7)                                                                                                                   | **the month calendar** — a month of gaps is the thing an operator is looking at. Required a new capability: A5 and `listRegisterDaySummaries` now take `{from,to}`                                                                                                                                                                                                         | contract §2.3, §4.2, §5.2              |
| 7   | Invoice viewer container: `Dialog` (contract) vs `Drawer width="lg"` (UX §3.6)                                                                                                                                             | **`Drawer`** — below `md` it is already a bottom sheet with a grabber and a safe-area footer, which is the mobile behaviour the spec needs and a `Dialog` would have to reimplement                                                                                                                                                                                        | contract P5b                           |
| 8   | Signed-URL field names: `viewUrl`/`downloadUrl` (contract `TtSignedFileUrls`) vs `pdfViewUrl`/`pdfDownloadUrl` (UX §3.6)                                                                                                   | `viewUrl`/`downloadUrl`, from A4                                                                                                                                                                                                                                                                                                                                           | UX §3.6                                |
| 9   | Staleness threshold: "older than 14 days is dimmed" (contract P5b) vs the 7/21 three-state ladder (UX §3.3)                                                                                                                | **7/21**, and it moved into `shared` as `ttDensityFreshness()` so the admin pane and the dealer's app cannot disagree about what "old" means                                                                                                                                                                                                                               | contract §2.2, P5b                     |
| 10  | **Does the dealer see the density figures?** PRD TTD-2 says yes, in ≥32px type. UX §5.3 trap 8 says a dealer screen showing density numbers is a trap                                                                      | **Yes, the dealer sees them.** It is the owner's stated requirement — _"these extracted values … need to be shown at the top in big fonts"_ — and it is why a dealer opens the screen at all. The UX's concern (a readout invites "is mine different?") is answered by the wording, not by hiding the number: no unit, no "Density@15", no invoice, no comparison anywhere | UX §4.2, §5.3, §4.6                    |
| 11  | Hero tile for a product with no invoice ever ("No invoice yet", UX §3.3)                                                                                                                                                   | **removed.** This service knows which grades have _arrived_, never which grades an outlet _stocks_. `getLatestDensities` cannot produce that tile and must not pretend to                                                                                                                                                                                                  | UX §3.3                                |
| 12  | `TtLatestDensity` had no `materialCode`/`description`, but UX §3.3 labels a provisional tile `16730 · EBMS`                                                                                                                | fields added                                                                                                                                                                                                                                                                                                                                                               | contract §2.2                          |
| 13  | `TtInvoiceSummary.densities` had no `quantity`/`unit`, but UX §3.4 renders `[MS] 727.300 · 6 KL`                                                                                                                           | fields added                                                                                                                                                                                                                                                                                                                                                               | contract §2.2                          |
| 14  | UX §3.7 prints "Added by Priya (MDG)"; the API returned a user id and no name                                                                                                                                              | `uploadedBy` gained `name`, denormalised at write time                                                                                                                                                                                                                                                                                                                     | contract §2.2, §3.2, §4.2              |
| 15  | Who sorts the headline tiles — the pane (UX) or the store (unspecified)                                                                                                                                                    | **the store**, diesel first. Two screens each doing their own sort can disagree about which figure leads                                                                                                                                                                                                                                                                   | contract §2.2, §5.1                    |
| 16  | Dealer entry point 2: "pinned entry on the Reports/Records tab" (PRD §8.2) vs "pinned card on the chat list while something is due" (UX §4.1)                                                                              | **the chat list.** Reports is a receiving shelf for things MDG sends the dealer; this is a chore the dealer does                                                                                                                                                                                                                                                           | PRD §8.2                               |
| 17  | The client had no "service not attached" signal — the UX requires a calm state and the API had no field                                                                                                                    | `TtDensityMeView.attached`, and D1 answers 200 rather than 404                                                                                                                                                                                                                                                                                                             | contract §2.2, §4.3                    |
| 18  | Push notifications: PRD TTD-9 (new density) and TTD-7.8 (20:00 reminder) and UX §4.1 (the push is the primary entry) — and **no push anywhere in the contract**                                                            | the **new-density push ships** (one per run, deep link `density`, via the existing `pushToUsersAsync`); the **20:00 reminder is deferred** — it needs a per-dealer hour and a scheduler job                                                                                                                                                                                | contract §8.2, §9 (P4, P5c); PRD AC7.8 |
| 19  | PRD TTD-12: an admin rejecting a photo, returning the day to missing                                                                                                                                                       | **cut from v1.** `TtRegisterDayStatus` has two members and the UX designed no rejection UI. Replacement covers the blurry-photo case                                                                                                                                                                                                                                       | PRD TTD-12                             |
| 20  | PRD AC7.6/7.7: a cross-dealer "who is not keeping the book" screen                                                                                                                                                         | **cut from v1** — no endpoint, and UX §3.10 defers the pane itself                                                                                                                                                                                                                                                                                                         | PRD                                    |
| 21  | PRD AC4.4: a re-issued invoice with the same number and changed contents is stored, flagged and kept alongside the old                                                                                                     | **cut.** `attachInvoicePdf` refuses to re-read a stored invoice, which is what makes a figure a dealer already copied immutable. The PRD's actual requirement — _no silent overwrite_ — is satisfied more strongly by never overwriting at all                                                                                                                             | PRD AC4.4                              |
| 22  | PRD §7.2 calls the unreadable-PDF state `DENSITY_UNREAD`; the contract calls it `parseStatus: 'UNREADABLE'`                                                                                                                | the contract's name                                                                                                                                                                                                                                                                                                                                                        | PRD §7.2                               |
| 23  | PRD AC8.2 lists failure codes (`CAPTCHA_UNREADABLE`, `PORTAL_UNAVAILABLE`, `SESSION_LOST`, `TT_PAGE_NOT_FOUND`, `TABLE_NOT_PARSED`, `PDF_DOWNLOAD_FAILED`, `PDF_NO_TEXT_LAYER`, `DEALER_NOT_CONFIGURED`) that do not exist | replaced with the real codes from §7.2. The owner/hint columns survive unchanged — they were right about who fixes what                                                                                                                                                                                                                                                    | PRD AC8.2                              |
| 24  | PRD §7.10: a row whose SAP number cannot be read is "counted as skipped" — the contract had nowhere to count it                                                                                                            | `TtDensityResult.rowsUnidentified`, plus the rule that no identity is ever invented                                                                                                                                                                                                                                                                                        | contract §7                            |
| 25  | PRD M8 (inline reads ÷ inline + downloads) is not computable: A4 returns both URLs in one call and writes one audit row                                                                                                    | metric redefined as invoice views per dealer per month, reported not targeted                                                                                                                                                                                                                                                                                              | PRD §9                                 |
| 26  | Admin component names and folder: `DensityHeadline`/`RegisterDayStrip` in `vault/ttDensity/` vs `DensityHero`/`DayMarkCalendar` in `vault/`                                                                                | **the UX's names, the contract's folder** — `vault/ttDensity/`, except `ImageLightbox`, which is a shared primitive and goes in `components/ui/`                                                                                                                                                                                                                           | contract P5b                           |
| 27  | Client component names: `RegisterDayCard` + `useTtDensity` (contract) vs `DensityTodayCard`/`DensityCaptureSheet`/`DensityWeekStrip` + `useDensity` (UX)                                                                   | the UX's set — it is four components because the screen genuinely has four parts                                                                                                                                                                                                                                                                                           | contract P5c                           |
| 28  | `mdg-app/lib/bridge.ts` and `mdg-client/src/pages/ChatListPage.tsx` were in the UX's checklist and in no package                                                                                                           | both added to P5c                                                                                                                                                                                                                                                                                                                                                          | contract P5c                           |
