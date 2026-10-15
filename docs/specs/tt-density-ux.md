# Feature Spec — TT Density (UX/UI)

**Status:** Built 24 Aug 2026. The admin pane is live. The dealer's own screen was removed on
13 Oct 2026 (ADR 0019); what it did now happens in the chat (Part B).
**Owner:** Design
**Audience:** Admin UX, backend (for the shapes the screens need)
**Service slug:** `tt-density`
**Related:** `docs/UX_FLOWS.md`, `docs/STYLE_GUIDE_V2.md`, `docs/ADDING_A_SERVICE.md`,
`docs/specs/staff-points.md` (spec shape), `mdg-admin/docs/MOBILE.md`, ADR 0008 (bilingual
client), ADR 0010 (the decision), ADR 0019 (asks live in the chat),
`mdg-backend/src/services/tt-density/README.md` (how it runs)

---

Decisions taken during the build, kept here so the sections below read as shipped:

- The upload scope is `tt-density` (not `density`), matching the service id, the storage prefix
  and the `?vault=` deep link.
- Signed URLs for an invoice are `viewUrl` / `downloadUrl` (a `TtSignedFileUrls`, fetched by
  their own endpoint), not fields on the invoice.
- The hero has no "no invoice yet" tile. The data cannot produce it (§3.3).
- The 7 / 21-day staleness ladder lives in `shared` as `ttDensityFreshness()`, so no two screens
  can disagree about what "old" means.
- The invoice PDF opens in a `Drawer`, not a `Dialog`.
- The dealer does see the density figures. They arrive as a chat message (Part B).

## 0. What this service is, in one paragraph

Every tanker that delivers fuel to the outlet arrives with an IndianOil tax invoice, and that
invoice prints a **Density@15** figure for each product it carries — `820.500` for the diesel
line, `727.300` for the petrol line. We read those invoices off the e-Mitra portal, keep the
PDFs, and pull the density figures out. Separately, the dealer keeps a paper **density test
register** at the pump; once a day they photograph the day's page and that marks the day done.
The admin surface exists to show the density figures big and to let an operator read any
invoice without downloading it. The dealer has no screen for this service. The figures reach
them as a chat message, and the register page is asked for, and received, in the chat (Part B).

### The two names

| Where                      | Name shown                             | Why                                                                                                                                                                |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mdg-admin` (English only) | **TT Density**                         | Matches the portal screen ("TT Acknowledgement") the operator knows. The name lives in `shared/src/lib/serviceLabel.ts`, which the admin's `serviceLabel()` reads. |
| Dealer chat (bilingual)    | **Density register / डेंसिटी रजिस्टर** | The dealer's word for the thing in their hand. "TT", "acknowledgement", "invoice" and "density@15" never appear in anything the dealer reads.                      |

---

## 1. The scope fence, on screen

The portal page carries three controls that change IndianOil's records: **Vehicle Condition**,
**Check Ack Status** and **Acknowledge Receipt**. Acknowledging a receipt is a legal act by the
dealer. This service never touches them.

That guarantee must be **visible in the admin UI**, not just in the code:

- A permanent, non-dismissible `Callout intent="info"`
  (`mdg-admin/src/components/ui/Callout.tsx`) sits directly under the pane header:

  > We only read this page. Vehicle Condition, Check Ack Status and Acknowledge are never
  > touched — acknowledging a receipt is the dealer's own legal act.

- There is **no Acknowledge button anywhere in our UI**, disabled or otherwise. A greyed-out
  Acknowledge button would imply we could enable it.
- The refresh action is worded **"Fetch invoices now"**, never "Sync", never "Update portal".

---

## 2. Design rules that bind this build

1. **Reuse the vault-pane pattern.** No new page shape, no new route, no new nav item. The admin
   surface is a per-dealer Data Vault dataset. The dealer has no page for this service.
2. **One breakpoint in admin (`md`, 768px).** `sm` and `lg` only where the existing code already
   uses them (filter bars, vault rail). No new breakpoints. (`mdg-admin/docs/MOBILE.md`)
3. **One job per dealer message.** A message from MDG about this service either gives the new
   tanker figures or asks for a register page. It never carries an invoice list, a history
   table, a PDF, a rupee figure, or any second number to compare against (Part B).
4. **Every tappable target ≥44px below `md`** in the admin.
5. **Unknown products degrade, never error** — the same philosophy as
   `shared/src/dsr/products.ts`. We have evidence for two IOCL material codes (`16730`
   EBMS → petrol, `50700` HSD-BSVI → diesel). Anything else still gets a tile, labelled by what
   the invoice itself said, marked provisional.
6. **No new dependency in the admin bundle for the PDF.** There is no PDF library in
   `mdg-admin` today and this feature does not add one (see §3.6).
7. **The dealer's word is "the book on the desk".** Anywhere a dealer reads about this service
   (a chat line, a request, an AI answer), it is the **Density register / डेंसिटी रजिस्टर**,
   or the thing they owe: yesterday's page. Never "TT", "acknowledgement", "invoice" or
   "Density@15". The table is in §0, "The two names". `shared/src/lib/serviceLabel.ts` and the
   AI first line both follow it.

---

# A. Admin — the dealer's TT Density pane

## 3.1 Where it lives

**One appended descriptor** in `mdg-admin/src/pages/dealers/vault/datasets.ts` (the dealer vault's registry). Nothing else in the routing or nav changes. **Do not add a `TabDef` to
`DealerDetailPage.tsx`** — per-service surfaces stopped getting their own dealer tab when Credit
& DOD and DSR moved into the vault rail.

```ts
{
  id: 'tt-density',
  label: 'TT Density',
  description: "Density@15 from this dealer's tanker invoices, and the daily register photos.",
  Icon: Gauge,                       // lucide-react
  requiresService: 'tt-density',
  Pane: DealerTtDensityPane,
}
```

Rail order: append after `inspection-reports`. The three-state gating in
`DealerVaultView.tsx` (attached / still asking / ask failed) is inherited unchanged — do
not simplify it.

`DealerVaultPaneProps` is `{ dealer: Dealer }` (`vault/types.ts`) — **no URL params reach this
pane**, so the open invoice, the selected calendar day and the shown month are all local
`React.useState`. That is a deliberate consequence of the existing contract, not an oversight:
a per-dealer pane is already addressable by `?tab=data-vault&vault=tt-density`.

The label is `'tt-density': { en: 'TT Density', hi: 'डेंसिटी रजिस्टर' }` in
`shared/src/lib/serviceLabel.ts`. The admin shows the English column; the Hindi column is the
dealer's word for it.

## 3.2 Pane anatomy

Top to bottom, in the `min-w-0` vault track:

```
1. Header row      h2 + subtitle + [Fetch invoices now]
2. Read-only Callout
3. THE DENSITY HERO            ← the owner's "big fonts" requirement
4. Failure Callout             (only when the last fetch failed)
5. Invoice list card           table ≥md / MobileCardList <md
6. Register-photo month card   calendar + selected-day panel
```

### Wireframe — 1440px

Frame: AppShell nav `w-52` (208px) + `main` padding `p-6` (48px) + vault rail 208px + gap 24px
→ **pane track ≈ 952px**. Scale below: 1 char ≈ 9.5px.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ 952px
│ TT Density                                                          [ ⭳ Fetch invoices now ]     │ h2 text-lg/600 · Button sm secondary
│ 8 invoices · last fetched 24 Aug 2026, 6:05 AM                                                   │ text-sm text-text-muted
│                                                                                                  │
│ ┌ⓘ We only read this page. Vehicle Condition, Check Ack Status and Acknowledge are never touched─┐│ Callout intent="info"
│ │  — acknowledging a receipt is the dealer's own legal act.                                      ││
│ └────────────────────────────────────────────────────────────────────────────────────────────────┘
│                                                                                                  │
│ ┌────────────────── 470px ──────────────────┐ ┌────────────────── 470px ──────────────────┐      │ grid-cols-1 sm:grid-cols-2 gap-3
│ │ PETROL (MS)                            ⛽ │ │ DIESEL (HSD)                           ⛽ │      │ eyebrow text-xs/600 uppercase
│ │                                           │ │                                           │      │
│ │  727.300                                  │ │  820.500                                  │      │ text-5xl/600 leading-none tabular-nums
│ │  kg/m³ at 15 °C                           │ │  kg/m³ at 15 °C                           │      │ text-xs text-text-subtle
│ │                                           │ │                                           │      │
│ │  22 Aug 2026 · BR09GC8009 · 2 days ago    │ │  22 Aug 2026 · BR09GC8009 · 2 days ago    │      │ text-xs text-text-subtle
│ └───────────────────────────────────────────┘ └───────────────────────────────────────────┘      │
│                                                                                                  │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │ Card
│ │ Tanker invoices                                                     [ 8 invoices ]           │ │ CardHeader-style, p-4 border-b
│ ├──────────┬────────────┬─────────────┬───────────────────────────────┬────────────────────────┤ │
│ │ INV DATE │ SAP INV #  │ TANKER      │ DENSITY@15                    │                INVOICE │ │ THead sticky
│ ├──────────┼────────────┼─────────────┼───────────────────────────────┼────────────────────────┤ │
│ │ 22 Aug   │ 7010045406 │ BR09GC8009  │ [MS] 727.300 · 6 KL           │       [▤ View invoice] │ │ TD h-11, grows to 2 lines
│ │   2026   │            │             │ [HSD] 820.500 · 6 KL          │                        │ │
│ ├──────────┼────────────┼─────────────┼───────────────────────────────┼────────────────────────┤ │
│ │ 17 Aug   │ 7009874468 │ BR09GC4786  │ [HSD] 819.800 · 12 KL         │       [▤ View invoice] │ │
│ │   2026   │            │             │                               │                        │ │
│ └──────────┴────────────┴─────────────┴───────────────────────────────┴────────────────────────┘ │
│                                                                                                  │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Density register photos                    [‹] August 2026 [›]      18 of 24 days · 6 missing│ │
│ ├──────────────── 352px ─────────────────┬─────────────────────────────────────────────────────┤ │ lg:grid-cols-[352px_minmax(0,1fr)]
│ │  S   M   T   W   T   F   S             │  Sat, 23 Aug 2026                                   │ │
│ │  ·   ·   ·   ·   ·   1   2             │  ┌───────────────────────────────┐                  │ │
│ │  3   4   5   6   7   8   9             │  │                               │                  │ │
│ │ 10  11  12  13  14  15  16             │  │   (register page thumbnail)   │  h-40 object-cover
│ │ 17  18  19  20 [21] 22  23             │  │                               │                  │ │
│ │ 24  25  26  27  28  29  30             │  └───────────────────────────────┘                  │ │
│ │ 31                                     │  Sent by the dealer · 23 Aug, 8:12 PM               │ │
│ │                                        │  [ See full size ]  [ Replace photo ]               │ │
│ │ ■ Dealer sent  ▣ MDG added  ▢ Missing  │                                                     │ │
│ └────────────────────────────────────────┴─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Wireframe — 1024px

Pane track ≈ **536px** (1024 − 208 nav − 48 padding − 208 rail − 24 gap). `sm:grid-cols-2` still
applies, so the hero is 2-up at 262px per tile (inner 230px; `text-5xl` "820.500" ≈ 202px — fits).
The invoice table scrolls **inside** its `Table` wrapper (`overflow-x-auto overscroll-x-contain`),
never sideways across the page. The calendar drops below the selected-day panel because
`lg:grid-cols-[352px_…]` needs ≥1024px of _pane_, not of viewport — so use `xl:` for the two-pane
calendar, or (preferred, one fewer breakpoint) **stack the calendar and the day panel at every
width below the vault's own `lg` two-pane grid**:

```
┌──────────────────────────────────── 536px ─────────────────────────────────────┐
│ TT Density                                        [ ⭳ Fetch invoices now ]     │
│ 8 invoices · last fetched 24 Aug 2026, 6:05 AM                                 │
│ ┌ⓘ We only read this page. Vehicle Condition, Check Ack Status and Acknowledge─┐
│ │  are never touched — acknowledging a receipt is the dealer's own legal act.  ││
│ └──────────────────────────────────────────────────────────────────────────────┘
│ ┌────────── 262px ──────────┐ ┌────────── 262px ──────────┐                    │
│ │ PETROL (MS)            ⛽ │ │ DIESEL (HSD)           ⛽ │                    │
│ │  727.300                  │ │  820.500                  │                    │
│ │  kg/m³ at 15 °C           │ │  kg/m³ at 15 °C           │                    │
│ │  22 Aug · BR09GC8009      │ │  22 Aug · BR09GC8009      │                    │
│ │  2 days ago               │ │  2 days ago               │                    │
│ └───────────────────────────┘ └───────────────────────────┘                    │
│ ┌──────────────────────────────────────────────────────────────────────────────┐
│ │ Tanker invoices                                            [ 8 invoices ]    ││
│ │ ‹ table scrolls horizontally inside this card ─────────────────────────────› ││
│ └──────────────────────────────────────────────────────────────────────────────┘
│ ┌──────────────────────────────────────────────────────────────────────────────┐
│ │ Density register photos      [‹] August 2026 [›]    18 of 24 · 6 missing     ││
│ │  (7-column grid, cells ≈ 40px, max-w-[352px], centred)                       ││
│ │  ── selected day panel stacks underneath ──                                  ││
│ └──────────────────────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────────────────────┘
```

### Wireframe — 390px (the admin on a phone)

Nav is the `MobileTabBar`; `main` padding `p-4` → content **358px**. Card padding `p-3` on the
calendar card → calendar grid **334px**, 7 columns at `gap-1` → **44.3px cells**. That is the
44px touch floor exactly, and it is why the calendar card is `p-3 md:p-4`.

```
┌──────────────── 358px ────────────────┐
│ TT Density                            │
│ 8 invoices · fetched 24 Aug, 6:05 AM  │
│ [ ⭳ Fetch invoices now            ]   │  full-width, min-h-11
│ ┌ⓘ We only read this page. Vehicle ──┐│
│ │  Condition, Check Ack Status and   ││
│ │  Acknowledge are never touched.    ││
│ └────────────────────────────────────┘│
│ ┌────────────────────────────────────┐│  grid-cols-1 on phone
│ │ PETROL (MS)                     ⛽ ││
│ │                                    ││
│ │  727.300                           ││  text-[40px]
│ │  kg/m³ at 15 °C                    ││
│ │  22 Aug 2026 · BR09GC8009          ││
│ │  2 days ago                        ││
│ └────────────────────────────────────┘│
│ ┌────────────────────────────────────┐│
│ │ DIESEL (HSD)                    ⛽ ││
│ │  820.500                           ││
│ │  kg/m³ at 15 °C                    ││
│ │  22 Aug 2026 · BR09GC8009          ││
│ │  2 days ago                        ││
│ └────────────────────────────────────┘│
│ ┌────────────────────────────────────┐│  MobileCardList (md:hidden)
│ │ 22 Aug 2026        View invoice ›  ││
│ │ 7010045406 · BR09GC8009            ││
│ │ MS 727.300 · 6 KL                  ││
│ │ HSD 820.500 · 6 KL                 ││
│ ├────────────────────────────────────┤│
│ │ 17 Aug 2026        View invoice ›  ││
│ │ 7009874468 · BR09GC4786            ││
│ │ HSD 819.800 · 12 KL                ││
│ └────────────────────────────────────┘│
│ ┌── 334px calendar card (p-3) ───────┐│
│ │ [‹]  August 2026  [›]              ││
│ │ 18 of 24 days · 6 missing          ││
│ │  S   M   T   W   T   F   S         ││  7 × 44px cells, gap-1
│ │ ·   ·   ·   ·   ·   1   2          ││
│ │ 3   4   5   6   7   8   9          ││
│ │ 10  11  12  13  14  15  16         ││
│ │ 17  18  19  20 [21] 22  23         ││
│ │ 24  25  26  27  28  29  30         ││
│ │ 31                                 ││
│ │ ■ Dealer  ▣ MDG  ▢ Missing         ││
│ └────────────────────────────────────┘│
└───────────────────────────────────────┘
```

## 3.3 The density hero

> "These extracted values are the important values … needs to be shown at the top in big fonts."

One tile per product the outlet has ever received, ordered **diesel first, then petrol, then
everything else** (diesel is the higher-volume product at almost every outlet), each showing the
**latest** Density@15 for that product across all invoices.

### Component

`mdg-admin/src/pages/dealers/vault/ttDensity/DensityHero.tsx` — **genuinely new** (justification in §3.9).
It is a bigger sibling of `mdg-admin/src/pages/dataVault/StatTile.tsx`, not a replacement:
`StatTile` is a 24px counter with a fixed `number` value; this is a 40–48px decimal with a
staleness state and a provenance line. `StatTile` stays untouched.

```
DensityHeroProps {
  products: DensityProductLatest[];   // already sorted by the pane
  loading?: boolean;
}
DensityProductLatest {
  key: string;            // 'HSD' | 'MS' | raw material code
  labelEn: string;        // 'DIESEL (HSD)'
  materialCode: string;   // '50700'
  provisional: boolean;   // true when the material code is not in our mapping
  density15: number | null;
  invoiceDate: string | null;   // ISO yyyy-mm-dd
  tankerNo: string | null;
  sapInvoiceNo: string | null;
  ageDays: number | null;
}
```

### Exact type and colour (mdg-admin tokens)

| Element                     | Classes                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Tile shell                  | `Card` → `CardContent className="p-4 md:p-5"` (i.e. `rounded-md border border-border bg-surface shadow-sm`) |
| Product eyebrow             | `text-xs font-semibold uppercase tracking-wide text-text-muted`                                             |
| Product glyph (right)       | lucide `Fuel` / `Droplet`, `width={18} strokeWidth={1.75}`, `text-text-subtle`                              |
| **The number**              | `text-[40px] md:text-5xl font-semibold leading-none tracking-tight tabular-nums`                            |
| Number colour, fresh/ageing | `text-text`                                                                                                 |
| Number colour, stale        | `text-text-muted`                                                                                           |
| Unit line                   | `mt-1 text-xs text-text-subtle` → `kg/m³ at 15 °C`                                                          |
| Provenance line             | `mt-3 text-xs text-text-subtle` → `22 Aug 2026 · BR09GC8009 · 2 days ago`                                   |
| Staleness badge             | `Badge intent="warning" \| "danger"` (`Badge.tsx`), absolute top-right of the eyebrow row                   |

**Always print three decimals** (`820.500`, not `820.5`) — the invoice prints three and an
operator comparing screen to paper must not have to think. Format with
`value.toFixed(3)` + `tabular-nums`; do **not** use `toLocaleString('en-IN')` here (a density is
never grouped).

### Staleness — the 3-week question, answered

The owner asked what a tile shows when the newest invoice for that product is three weeks old.
Three named states, one threshold table, and the state is always carried by **words**, never by
colour alone:

| State    | Rule                 | Number            | Badge                     | Tile border        |
| -------- | -------------------- | ----------------- | ------------------------- | ------------------ |
| `fresh`  | invoice ≤ 7 days old | `text-text`       | none                      | `border-border`    |
| `ageing` | 8–20 days            | `text-text`       | `warning` · "12 days old" | `border-border`    |
| `stale`  | ≥ 21 days            | `text-text-muted` | `danger` · "24 days old"  | `border-danger/40` |

There is no fourth "no invoice for this product, ever" state. This service knows which grades
have **arrived**; it has no idea which grades an outlet **stocks**. `getLatestDensities`
returns one entry per product actually seen, so there is no data behind an "expected but
missing" tile, and inventing one would put a dash on screen for a grade the outlet may not even
sell. A grade that stops arriving ages out through `stale` and then drops off the headline,
which is the honest ending.

The 7 / 21 thresholds live in `shared` as `TT_DENSITY_AGEING_AFTER_DAYS` (8),
`TT_DENSITY_STALE_AFTER_DAYS` (21) and `ttDensityFreshness(ageDays)`, so every screen reads the
same ladder.

Why 7 / 21: 7 days is the portal's own default filter and our fetch window, so anything inside it
is "current by construction". 21 days without a tanker of a product the outlet stocks is
abnormal enough that an operator should ask about it — that is the owner's own three-week
example, and it earns red.

**The stale tile never hides the number.** It is still the last true reading and the operator may
need it. It recedes (muted) and it announces its age. A blanked-out tile would be a worse lie
than an old figure that says how old it is.

### Provisional products

When the invoice's material code is not in our mapping, the tile still renders:

```
┌───────────────────────────────────────┐
│ 16730 · EBMS              [New product]│  Badge intent="neutral"
│  727.300                              │
│  kg/m³ at 15 °C                       │
│  22 Aug 2026 · BR09GC8009 · 2 days ago│
└───────────────────────────────────────┘
```

Label = exactly what the invoice said (`materialCode · description`). No guessed friendly name.
This mirrors `dsrProductProfile()`'s contract (`shared/src/dsr/products.ts`).

### Hero states

| State                                 | What the hero shows                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loading                               | 2 skeleton tiles: `Card > CardContent p-4` containing `Skeleton h-3 w-24`, `Skeleton h-10 w-40 mt-3`, `Skeleton h-3 w-32 mt-3`. Copy the `StatTileSkeletons` shape (`StatTile.tsx`), sized up.   |
| Never run                             | No hero at all. The whole pane collapses to one `EmptyState` (§3.8) — **and the register-photo calendar still renders below it**, because the dealer's photos do not depend on the portal fetch. |
| Run succeeded, zero invoices in range | No hero. Pane shows the "no deliveries" empty state and the photo calendar still renders.                                                                                                        |
| Fetch failed but old data exists      | Hero renders the last known figures **unchanged**, and the failure Callout above it says the newest fetch did not land. Never blank a good figure because a refresh failed.                      |
| Error loading the pane                | No hero; `EmptyState` with `AlertCircle` and the `ApiError` message.                                                                                                                             |

## 3.4 The invoice list

A `Card` with `CardContent className="p-0"`, a header strip, then the standard **dual list**:
`<div className="hidden md:block"><Table>…</Table></div>` beside `<MobileCardList className="p-3">`.

### Columns (≥md)

| Column        | Content                                                                  | Classes                                                                                  |
| ------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Invoice date  | `22 Aug 2026`                                                            | `whitespace-nowrap`                                                                      |
| SAP invoice # | `7010045406`                                                             | `font-mono text-xs text-text-muted`                                                      |
| Tanker        | `BR09GC8009`                                                             | `font-mono whitespace-nowrap`                                                            |
| Density@15    | one line per item: `[MS] 727.300 · 6 KL`                                 | product chip = `Badge intent="neutral"` `text-[10px]`; figure `tabular-nums font-medium` |
| Invoice       | `Button variant="ghost" size="sm" leftIcon={<FileText/>}` "View invoice" | `text-right`                                                                             |

Deliberately **not** columns: invoice total, document number, delivery number, sales order,
tank numbers, compartments, sample numbers. All of them live in the viewer drawer (§3.6). The
list is about density; a six-more-column table would be the dense spreadsheet this spec forbids.

### Sort order

**Invoice date descending, then SAP invoice number descending.** Two tankers can land on the same
day; the SAP number is monotonic for the outlet, so it is a stable tie-break and rows do not jump
between fetches. State it in a comment at the comparator.

### Row density and opening

- `TD` is `h-11` by default; a two-product row grows to two lines. Cap the density cell at
  **3 visible product lines** with a `+N more` in `text-xs text-text-subtle` — an invoice with
  four grades is possible and must not blow the row height out.
- Desktop: `<TRow clickable onClick={() => setOpenInvoice(row)}>`, and the "View invoice" button
  inside it calls `e.stopPropagation()` first (the mandatory idiom —
  `IrasShiftDataPane.tsx`).
- Mobile: `MobileCardList` card with `onClick` and a `primaryRight` of
  `<span className="text-xs font-medium text-brand">View invoice ›</span>`. Cards carrying a
  whole-card `onClick` must not also contain buttons.

### List states

| State               | Render                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading             | 4 × `Skeleton className="h-11 w-full"` inside `CardContent className="grid gap-2 p-4"`                                                            |
| Error               | `EmptyState` `AlertCircle` · "Could not load the invoices" · `ApiError.message` or "Please try again."                                            |
| Never fetched       | See the pane-level never-run state (§3.8) — the card is not rendered at all                                                                       |
| Fetched, none found | `EmptyState` `Truck` · "No tanker deliveries in this window" · "The last fetch covered 17–24 Aug 2026 and the portal listed no invoices for 15E." |

## 3.5 What the "8 invoices · last fetched …" header says

`text-sm text-text-muted`, built from three facts and degrading in this order:

- Fetched and fine: `8 invoices · last fetched 24 Aug 2026, 6:05 AM`
- Never fetched: `Never fetched`
- Last fetch failed: `8 invoices · last fetch failed 24 Aug 2026, 6:05 AM` (and the failure
  Callout appears — copy the block in `DealerInspectionPane.tsx`, `Card` with
  `border-danger/40 bg-danger-soft/40`).

The fetch button is `Button variant="secondary" size="sm" leftIcon={<DownloadCloud/>}`
labelled **"Fetch invoices now"**, `loading` while the mutation is pending, and it drives the
202-then-poll pattern via a `useTtDensityRunWatcher` copied from
`mdg-admin/src/pages/dsr/useDsrRunWatcher.ts`. Toasts, verbatim in the house voice:

- queued → `toast.success('Fetch queued — the portal takes about a minute. This pane refreshes when it lands.')`
- rejected → `toast.error(err instanceof ApiError ? err.message : 'Could not start the fetch')`

## 3.6 The inline PDF viewer

> "make sure you add support for viewing the pdfs without actually downloading"

### Container: a `Drawer`, not a modal

Use the existing `Drawer` (`mdg-admin/src/components/ui/Drawer.tsx`) at `width="lg"` (720px).
Reasons:

- It is already the vault's drill-in container (`SnapshotDrawer`, `DealerInspectionPane`'s
  report drawer), so an operator's muscle memory is right.
- **Below `md` it is already a bottom sheet** with a grabber, `max-h-[92dvh]` and a sticky
  safe-area footer. Free correct mobile behaviour.
- 720px renders a portrait A4 invoice at ~720 × 1018 CSS px — legible without zoom.

A full-screen sheet was considered and rejected: it does not exist as a primitive, and a
right-side drawer keeps the invoice list visible behind it so an operator can step through rows.

### Header and the density strip

The drawer's own `title` / `description` carry the identity, and — this is the important part —
**the extracted densities are rendered as chips inside the drawer body, above the PDF frame.**
The operator sees the numbers we read even if the PDF itself never renders.

```
┌ Drawer, 720px ────────────────────────────────────────────────────────┐
│ Invoice 7010045406                                              [ × ] │  Drawer title
│ 22 Aug 2026, 4:37 PM · BR09GC8009 · ₹12,48,441                        │  Drawer description
├───────────────────────────────────────────────────────────────────────┤
│ WHAT WE READ FROM THIS INVOICE                                        │  text-xs/600 uppercase text-text-muted
│ ┌──────────────────────┐  ┌──────────────────────┐                    │
│ │ PETROL (MS) · EBMS   │  │ DIESEL (HSD)         │                    │
│ │ 727.300 kg/m³        │  │ 820.500 kg/m³        │                    │  text-2xl/600 tabular-nums
│ │ 6 KL · T017 · c 1,2  │  │ 6 KL · T018 · c 3,4  │                    │  text-xs text-text-subtle
│ │ EBMS/PLIOCTBR/17/101 │  │ HSD/PL/IOCTBR/18/24  │                    │  font-mono text-[11px]
│ └──────────────────────┘  └──────────────────────┘                    │
│ Header Density@15: 820.50 · Doc 20272323B052074 · Delivery 0573542169 │  text-xs text-text-subtle
├───────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │                                                                   │ │
│ │            (browser-native PDF frame — its own toolbar            │ │  <iframe>
│ │             gives page count, zoom, print, find)                  │ │  h-[calc(100dvh-22rem)] min-h-[460px]
│ │                                                                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────────────┤
│ [ Open in a new tab ]                         [ Download ]  [ Close ] │  footer: secondary · ghost · ghost
└───────────────────────────────────────────────────────────────────────┘
```

### The embed

```tsx
<iframe
  src={urls.viewUrl}
  title={`Tax invoice ${invoice.sapInvoiceNo}`}
  className="h-[calc(100dvh-22rem)] min-h-[460px] w-full rounded-md border border-border bg-white"
  referrerPolicy="no-referrer"
  onLoad={() => setFrameReady(true)}
/>
```

This is the **same technique as the only existing iframe in the app**
(`mdg-admin/src/pages/dsr/DsrReportPanel.tsx`). No PDF library is added.

**Backend contract this requires:** two signed URLs per invoice, from
`GET /tt-density/dealers/:dealerId/invoices/:invoiceId/pdf-url`, returned as a
`TtSignedFileUrls`:

- **`viewUrl`** — `Content-Disposition: inline`, `Content-Type: application/pdf`. **Only this one
  ever goes in the iframe.** An `attachment` URL in an iframe navigates the tab away and tears
  down the open drawer (the bug already documented at `CreditDodReportCard.tsx`).
- **`downloadUrl`** — `Content-Disposition: attachment`, used only by the footer Download button.

The URLs are a second request, separate from the invoice itself. The invoice's facts render
immediately; the drawer can show every extracted figure while the file is still being signed, or
when there is no file at all.

### Toolbar

**There is no custom toolbar.** Page count, zoom, rotate, print and find all come from the
browser's built-in PDF viewer inside the iframe. Building our own would mean shipping
`pdfjs-dist` + a worker to the admin bundle for a control the browser already draws. If a
future requirement needs page thumbnails, that is when the dependency gets argued for.

### States

| State                                              | Render                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loading (frame not yet loaded)                     | `Skeleton className="absolute inset-0 rounded-md"` over the frame, **removed on `onLoad` or after 6 000 ms, whichever comes first**. An iframe that never fires `onLoad` must not leave a skeleton up forever.                                                                                                                             |
| `viewUrl` present, renders                         | The frame. Nothing else.                                                                                                                                                                                                                                                                                                                   |
| `viewUrl` is `null` (file never downloaded / lost) | In place of the frame: the `FileWarning` block copied from `DsrReportPanel.tsx` — **"The invoice PDF is not in the vault"** / "The portal listed this invoice but the file did not download. The figures above were read from an earlier copy. Fetch again to try." + a `Fetch invoices now` button. The density chips above stay visible. |
| We have the PDF but never parsed it                | Density chips replaced by `Callout intent="warning"`: "We could not read the density figures out of this invoice. The PDF is below — please read them off it."                                                                                                                                                                             |
| Signed URL expired (403 on reload)                 | Treated as the missing case; the pane's query refetch re-signs. Never show a status code.                                                                                                                                                                                                                                                  |

### Mobile — where an embedded PDF will not render, and what happens instead

**Below `md` we do not embed the PDF at all.** Android System WebView and Chrome for Android do
not render `application/pdf` in an iframe — they show a blank grey rectangle or silently start a
download. iOS WKWebView renders page 1 and refuses to scroll. All three are worse than not
trying.

Gate on the existing JS breakpoint hook, `useMediaQuery('(min-width: 768px)')`
(`mdg-admin/src/hooks/useMediaQuery.ts`), **not** on a CSS `hidden md:block` — a hidden iframe
still fetches the PDF over the operator's mobile data.

```
┌ Bottom sheet, <768px ─────────────────┐
│ ═══                                   │  grabber
│ Invoice 7010045406               [ × ]│
│ 22 Aug 2026 · BR09GC8009              │
├───────────────────────────────────────┤
│ WHAT WE READ FROM THIS INVOICE        │
│ ┌───────────────────────────────────┐ │
│ │ PETROL (MS) · EBMS                │ │
│ │ 727.300 kg/m³                     │ │  text-2xl
│ │ 6 KL · T017 · compartments 1, 2   │ │
│ │ EBMS/PLIOCTBR/17/101              │ │
│ ├───────────────────────────────────┤ │
│ │ DIESEL (HSD)                      │ │
│ │ 820.500 kg/m³                     │ │
│ │ 6 KL · T018 · compartments 3, 4   │ │
│ │ HSD/PL/IOCTBR/18/24               │ │
│ └───────────────────────────────────┘ │
│                                       │
│ INVOICE DETAILS                       │
│ Document no      20272323B052074      │  key/value rows, TD-equivalent h-11
│ Invoice total    ₹12,48,441.00        │
│ Delivery no      0573542169           │
│ Sales order      0913183557           │
│ Header Density@15  820.50             │
├───────────────────────────────────────┤
│ [    Open PDF                      ]  │  Button primary, full width, min-h-11
│ [ Close ]                             │
└───────────────────────────────────────┘
```

"Open PDF" hands the file to whatever the phone uses for PDFs:

- inside the admin Expo shell (`isNativeShell()`): `postToNative({ type: 'media:download', … })`
  with `downloadUrl` — the shell's existing handler saves and opens it. `window.open` is
  unreliable there because the WebView runs with `setSupportMultipleWindows={false}`.
- in a plain mobile browser: `window.open(viewUrl, '_blank', 'noopener')`.

So on a phone the operator gets **every figure we hold** without any PDF rendering at all, plus
one tap to the real file. They never see a blank frame.

## 3.7 The register-photo calendar

### Shape

A month grid, not a list and not a strip. A month is 28–31 cells; a horizontal strip of 31
items either scrolls (hiding the gaps, which are the whole point) or shrinks below the tap
floor. A 7 × 5 grid shows the whole month at once and makes a run of missing days visually
obvious as a hole in the block.

`mdg-admin/src/pages/dealers/vault/ttDensity/DayMarkCalendar.tsx` — **genuinely new**; there is no month
grid anywhere in `mdg-admin` (only `BankHolidaysPage.tsx`, which is a month-scoped _list_). The
month switcher header is copied verbatim from `BankHolidaysPage.tsx` (two secondary
`Button`s with `ChevronLeft`/`ChevronRight`, a `min-w-[9rem] text-center text-base font-semibold`
label between them) and bounded the same way `BusinessDateControl` bounds its arrows: never past
the current month, never before the month the service was attached.

```ts
DayMarkCalendarProps {
  year: number;
  month: number;                       // 1-based
  marks: Record<string, DayMark>;      // 'yyyy-mm-dd' -> mark
  minYmd: string;                      // service start; earlier days render blank
  todayYmd: string;                    // istTodayYmd()
  selectedYmd: string | null;
  onSelect: (ymd: string) => void;
  onMonthChange: (year: number, month: number) => void;
}
DayMark { source: 'DEALER' | 'ADMIN'; at: string; byName?: string }
```

### Cell geometry

| Width   | Cell                                                         | Gap             | Grid width                                       |
| ------- | ------------------------------------------------------------ | --------------- | ------------------------------------------------ |
| < 768px | `aspect-square w-full` → **≈44px**                           | `gap-1` (4px)   | card `p-3`, grid fills 334px at a 390px viewport |
| ≥ 768px | `aspect-square w-full`, container `max-w-[352px]` → **40px** | `gap-1.5` (6px) | 352px                                            |

Each cell is a `<button type="button">` with `rounded-md text-sm font-medium tabular-nums`.
Weekday header row above: `text-[11px] font-semibold uppercase tracking-wide text-text-subtle text-center`.

### Cell states — colour semantics

| Meaning                    | Classes                                                                    | Extra                                                                                  |
| -------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Sent by the dealer         | `bg-success-soft text-success border border-success/30`                    | —                                                                                      |
| Added by an MDG admin      | `bg-success-soft text-success ring-2 ring-inset ring-brand`                | 5px `bg-brand rounded-full` dot, top-right, `aria-hidden`                              |
| Past day, not marked       | `border border-dashed border-border text-text-subtle`                      | the "expected but absent" convention from `DealerStatusCell` (`IrasShiftDataPane.tsx`) |
| Today, not marked          | `border border-border-strong bg-surface text-text font-semibold`           | —                                                                                      |
| Future day                 | `text-text-subtle/60 cursor-default`                                       | `disabled`                                                                             |
| Before the service started | `text-text-subtle/40 cursor-default`                                       | `disabled`, no border                                                                  |
| Selected                   | any of the above + `outline outline-2 outline-offset-1 outline-focus-ring` | —                                                                                      |

**Green means the day is covered. A blue ring means we covered it, not them.** Both facts also
appear in words in the selected-day panel and in the legend, so neither is carried by colour
alone.

Legend, directly under the grid, `text-xs text-text-subtle`, each swatch a 12px square using the
same classes as its cell:

```
■ Dealer sent    ▣ MDG team added    ▢ Not marked
```

Counter line in the card header, `text-sm`: `18 of 24 days · 6 missing`, with the `6 missing`
span in `text-warning font-medium` only when it is > 0. Denominator = days in the month that
have already happened and are on or after the service start date — never the raw 31, which would
show every current month as failing.

### Selected-day panel

| Day state                 | Panel content                                                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marked (dealer)           | Thumbnail (`h-40 w-full rounded-md object-cover`, `draggable={false}`), line "Sent by the dealer · 23 Aug, 8:12 PM", buttons `See full size` (secondary) + `Replace photo` (ghost) |
| Marked (admin)            | Same, line "Added by Priya (MDG) · 24 Aug, 9:40 AM", plus `Badge intent="info"` "Added by MDG"                                                                                     |
| Not marked, past or today | Dashed placeholder box, "No photo for this day", primary button **"Upload on the dealer's behalf"**                                                                                |
| Future                    | "Not yet — this day hasn't happened." `text-sm text-text-muted`, no action                                                                                                         |
| Before service start      | "Before TT Density started for 15E." `text-sm text-text-subtle`, no action                                                                                                         |
| No day selected           | "Pick a day to see its register photo." `text-sm text-text-muted`                                                                                                                  |

### Full-size viewing

`See full size` opens the shared **`mdg-admin/src/components/ui/ImageLightbox.tsx`**: a
`Dialog size="lg"` around the photo, pinch, pan and double-tap zoom below `md`, and an optional
Download in the footer. It was written as an extraction. The same markup had been copied into the
chat attachment preview, the chat media gallery and the staff tab. The chat preview and gallery
use the shared one now.

The props this pane uses:

```ts
ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  src: string;             // inline-disposition signed URL
  alt: string;
  title?: string;
  downloadUrl?: string;    // attachment-disposition; omit to hide the Download button
}
```

### Admin upload on the dealer's behalf

`UploadDayPhotoDialog.tsx`, a `Dialog size="sm"` of the usual file-dialog shape: a hidden
`<input type="file">`, a dashed "Choose a photo (max 25 MB)" button, a chip with the filename + an
`X` to clear, presign → PUT → create.

Choices made in it, all deliberate:

- `accept="image/*"` only. A register page is a photo. A PDF here would be someone uploading the
  wrong thing.
- **A permanent line above the submit button, never a checkbox, never dismissible:**
  > This will be recorded as **uploaded by you**, not by the dealer.
- Title: `Upload register photo — Sat, 23 Aug 2026`. The date is in the title so an operator
  cannot fill in the wrong day without seeing it.
- On success: `toast.success('Register photo saved for 23 Aug')`, the calendar cell flips to the
  admin-added state, the counter line increments.
- On failure: `toast.error(err instanceof ApiError ? err.message : 'Could not save the photo')`
  and the dialog stays open with the file still staged.

`Replace photo` is the same dialog with the title `Replace register photo — Sat, 23 Aug 2026`
and a `Callout intent="warning"`: "The photo already on this day will be replaced." The previous
photo is kept server-side for audit; the UI does not offer to browse replaced photos in v1.

### Calendar states

| State                                  | Render                                                                                                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                                | The grid renders with all cells as `Skeleton`-filled squares (`Skeleton className="h-full w-full rounded-md"`), header and legend live                                                                                                                          |
| Error                                  | `EmptyState` `AlertCircle` · "Could not load the register photos" · message + a Retry via `refetch`                                                                                                                                                             |
| Never any photo, service just attached | The grid renders normally (all dashed), plus one line under the legend: "No register photos yet. The dealer sends one a day from their app, or you can add one here." (The words predate the chat flow: the dealer now replies to the morning ask in the chat.) |
| Service not attached                   | The whole pane is gated out by `DealerVaultView`; if the gating check itself failed, see §3.8                                                                                                                                                                   |

## 3.8 Pane-level states

| State                                 | Render                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                               | `DensityHero loading` (2 skeleton tiles) + a `Card` with 3 × `Skeleton h-11 w-full`, mirroring `DealerInspectionPane.tsx`                                                                                                                                                                                                                |
| Error                                 | `EmptyState` `AlertCircle` · **"Could not load TT Density"** · `ApiError.message` or "Please try again." · `cta={fetchButton}`                                                                                                                                                                                                           |
| Never run                             | `EmptyState` `Gauge` · **"No tanker invoices captured yet"** · "Once TT Density runs for 15E, the Density@15 for each product appears here, with the invoice PDF behind every figure." · `cta={fetchButton}` — **and the register-photo calendar still renders below it**, because the dealer's photos do not depend on the portal fetch |
| Service detached (gating failed open) | `EmptyState` `Plug` · "TT Density is not attached to 15E" · "Attach it from the Services tab and this pane fills in."                                                                                                                                                                                                                    |
| Last fetch failed                     | Failure `Card` (`border-danger/40 bg-danger-soft/40`) above the hero; everything else renders with the last good data                                                                                                                                                                                                                    |

## 3.9 New components — the justification list

Everything else in this spec is an existing primitive used as-is. Three components are new:

| New component                                                    | Why nothing existing does it                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DensityHero` + `DensityTile` (`pages/dealers/vault/ttDensity/`) | `StatTile` is a 24px integer counter with `value: number` and Indian digit grouping. This needs a 40–48px three-decimal figure, a unit, a provenance line, and a three-state staleness ladder. Forking `StatTile` would break every existing dataset digest. |
| `DayMarkCalendar` (`pages/dealers/vault/ttDensity/`)             | There is no month grid in `mdg-admin`. `BankHolidaysPage` is a month-scoped list; `DateRangeFilter` is a preset/range picker. The month-switcher header is copied from `BankHolidaysPage.tsx`.                                                               |
| `ImageLightbox` (`components/ui/`)                               | Not new behaviour. The same `Dialog size="lg"` photo viewer had been copied into the chat preview, the chat gallery and the staff tab. This is the shared extraction.                                                                                        |

The PDF drawer is **not** a new primitive: it is `Drawer` + one `<iframe>`, both already in use.

## 3.10 The cross-dealer view (secondary, ship after the per-dealer pane)

**Not built.** Only the per-dealer pane shipped. This is the design if it is ever wanted.

One appended descriptor in `mdg-admin/src/pages/dataVault/datasets.ts` (the all-dealers vault
registry) — a data-only change, no routing:

```ts
{ id: 'tt-density', label: 'TT Density',
  description: 'Latest Density@15 per product, and today\'s register photo, for every dealer',
  Icon: Gauge, Actions: TtDensityActions, Pane: TtDensityPane }
```

`TtDensityPane` mirrors `IrasShiftDataPane` exactly: a `StatTileRow` digest (Dealers on the
service / Photo sent today / Not sent today / Last fetch failed), a filter bar (`?q`, `?status`),
the four-branch state ladder, and a dual `Table` / `MobileCardList` with one row per dealer whose
density cell shows `MS 727.300 · HSD 820.500` and whose action opens a `Drawer` onto the same
per-dealer content. All state in the URL via `patchParams`.

---

# B. The dealer — what they see now

The dealer's `/density` page, its camera sheet, the week strip, the pinned card on the chat list,
the Profile row and the push that opened the page were removed on 13 Oct 2026 (ADR 0019). An old
link to `/density` opens the member's own chat. The dealer meets this service in two places, both
in the chat.

## 4.1 The new tanker figures arrive as a chat message

After a run that stores invoices the dealer did not have before, MDG posts **one** message
(`mdg-backend/src/services/ttDensity/notify.ts`). One per run, not one per invoice: three
tankers in a night is one sentence, not three notifications at two in the morning.

```
New tanker density is ready.
HIGH SPEED DIESEL (11 Oct): 820.500 · MOTOR SPIRIT (11 Oct): 727.300
```

Products are ordered diesel first, then petrol, then the rest.

- **Who gets it:** the person on site. The manager's group chat when the outlet has a manager,
  each owner's own chat when it has not. Each copy is in its reader's language. The push opens
  that chat.
- **Where the figures come from:** the invoices that run stored, and nowhere else. An invoice
  whose reading could not be read adds nothing. If none of the new ones has a reading, the
  message is the headline alone. "The newest reading there is" could be a week-old tanker's,
  printed as the new one, and the dealer copies that number into a statutory register.
- **Each figure names its invoice day**, so a dealer with two tankers can match it to a delivery
  note.
- **The fence, in words** (the rules the old screen kept, unchanged):
  - the figure is what the invoice printed, digit for digit: `820.500`, never `820.5`;
  - the product named in the platform's own words (`HIGH SPEED DIESEL` / हाई स्पीड डीजल,
    `MOTOR SPIRIT` / मोटर स्पिरीट), never `HSD-BSVI` or a material code;
  - no unit, no "Density@15", no invoice number, no rupee figure;
  - no second number, no field to type into, nothing that implies MDG knows or cares what the
    dealer's own dip test said. The release deliberately ships no comparison.

## 4.2 The register page is asked for in the chat

- **The ask.** Every morning at 09:00 IST (`REGISTER_ASK_CRON`) MDG posts a chat ask with a
  "Send photo" button for **yesterday's** register page (ref `reg:<YYYY-MM-DD>`, title "Density
  register page" / डेंसिटी रजिस्टर का पन्ना). It goes only to outlets whose TT Density service
  is active, only while that day is not yet received, and never twice into the same chat. It goes
  to the same chat as 4.1.
- **The answer.** The dealer's photo, sent as a reply to the ask, is filed for that day on its
  own and MDG replies "✓ Received". No admin step, and no admin's phone is pushed. A page that
  comes with typed words is still filed, but handled as an ordinary message, so a person reads
  it.
- **How far back.** A dealer can file today and the six days before it (7 days,
  `TT_REGISTER_DEALER_BACKDATE_DAYS`). A page older than that reads closed in their chat. An
  admin can mark any of the last 60 days, counting today (`TT_REGISTER_ADMIN_BACKDATE_DAYS`), from the calendar's
  "Upload on the dealer's behalf" (§3.7). That is also the fallback for a dealer who never opens
  the chat. The dealer is never told off for a day MDG filled in.
- **Storage.** The photo is stored under `tt-density/<dealerId>/register/`, the same folder the
  admin upload uses (upload scope `tt-density`). The business date is not in the key.

The rules for the ask and its answer are in ADR 0019. Why 7 days: it is the window of the
portal's own TT Acknowledgement filter and of our daily fetch, so one number explains the whole
service. It is also what a dealer can honestly reconstruct from a paper register they are
holding. Past a week, a photograph of an old page proves only that the page exists.

## 4.3 Words the dealer reads

The chat copy is written in Hindi and English by the backend (`services/ttDensity/notify.ts`
for the figures, `services/chatAsks/text.ts` for the ask). Three notes survive from the old
screen's copy sheet and still bind anyone who writes dealer-facing text for this service:

- **Hindi "कल" means both yesterday and tomorrow.** Never use it bare. Say "बीता कल", and print
  the date beside it.
- **No jargon, either language.** These words are banned from anything the dealer reads about
  this service: sync, upload, server, retry, failed, error, invoice, acknowledgement, TT,
  Density@15, kg/m³, storage, attachment, API. The dealer sees the **number**, never our name
  for it: "हाई स्पीड डीजल · 820.500" carries the whole fact with none of the vocabulary.
- Failure copy names the cause and the fix in one sentence.

---

# C. Cross-cutting

## 5.1 Colour semantics — one table, existing tokens only

**Admin (`mdg-admin/tailwind.config.ts`, reached only through `Badge intent` / `INTENT_CLASSES`):**

| Meaning                | Token pair                                            | Where                                                                   |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Density fresh (≤7d)    | none — `text-text`                                    | hero number                                                             |
| Density ageing (8–20d) | `warning` (`#d97706` / `-soft #fef3c7`)               | `Badge intent="warning"` "12 days old"                                  |
| Density stale (≥21d)   | `danger` (`#dc2626` / `-soft #fee2e2`)                | `Badge intent="danger"` + `border-danger/40` + number `text-text-muted` |
| Provisional product    | `neutral`                                             | `Badge intent="neutral"` "New product"                                  |
| Day covered            | `success` (`#16a34a` / `-soft #dcfce7`)               | calendar cell fill                                                      |
| Covered _by MDG_       | `success` fill + `brand` (`#2563eb`) ring/dot         | calendar cell                                                           |
| Day missing            | none — `border-dashed border-border text-text-subtle` | calendar cell                                                           |
| Fetch failed           | `danger`                                              | `Card border-danger/40 bg-danger-soft/40`                               |

**No state is carried by colour alone.** Every coloured element in this feature also carries
either a number, a word, or an icon that says the same thing.

## 5.2 Accessibility

**Tap targets.** 44px floor below `md` (`Button` `min-h-11 md:min-h-0`, `Input`/`Select`
`h-11 md:h-9`, `TD h-11`, calendar cells ≈44px below `md` / 40px at `md`+).

**Focus.** Every calendar cell is a real `<button>` and inherits
`focus-visible:ring-2 focus-visible:ring-focus-ring`. The month grid supports arrow-key
navigation with a roving `tabIndex` (one cell in the tab order; arrows move focus within the
month, `PageUp`/`PageDown` change month).

**Contrast — the honest position.** `text-warning` (`#d97706`) on `bg-surface` is ≈3.6:1, below
the 4.5:1 AA floor for normal text. Two mitigations, both mandatory:

1. Warning and danger text only ever appears inside a `Badge` (`bg-*-soft` background,
   `font-semibold`, never below 12px), which is the existing `INTENT_CLASSES` convention — do
   not hand-pick a hex or paint `text-warning` onto `bg-surface`.
2. Because the pair is still marginal, **the fact is always duplicated in text** ("24 days old",
   "6 missing"), so a reader who cannot resolve the hue loses nothing.

**Screen readers — the hero tiles.** The tile is a `role="group"` whose visual parts are all
`aria-hidden`, with one `sr-only` sentence carrying the whole fact. Read the value as `820.5`,
not `820.500` (otherwise: "eight two zero point five zero zero"), and space the tanker so it is
spelled out:

```tsx
<div role="group" aria-labelledby={id}>
  <span id={id} className="sr-only">
    Diesel, H S D. Density at 15 degrees: 820.5 kilograms per cubic metre. From invoice 7010045406
    dated 22 August 2026, tanker B R 0 9 G C 8 0 0 9. 2 days old.
  </span>
  <span aria-hidden>{/* the visual tile */}</span>
</div>
```

Stale tile: append "This figure is 24 days old — there has been no diesel delivery since 31 July
2026."

**Screen readers — the calendar.** `aria-label` per cell, never just the day number:

- `"23 August 2026, photo sent by the dealer"`
- `"21 August 2026, photo added by the MDG team"`
- `"20 August 2026, no photo. Activate to upload on the dealer's behalf."`
- `"24 August 2026, today, no photo."`

The grid is `role="grid"` with `role="row"` / `role="gridcell"` wrappers and an
`aria-live="polite"` region carrying the counter line, so a change after an upload is announced.

**Motion.** `prefers-reduced-motion` already kills the sheet animations (`index.css`). Nothing
in this feature adds animation beyond the existing sheet/drawer entrances and `animate-pulse`
skeletons.

## 5.3 What this must NOT look like — the traps

1. **A dense data table as the primary admin view.** The invoice table is _below_ the hero and
   carries five columns. If someone adds invoice total, document number, delivery number, sales
   order, tank numbers and sample numbers as columns, the screen becomes the spreadsheet the
   owner asked us to avoid. Those fields belong in the viewer drawer.
2. **A PDF that downloads.** The list action is "View invoice", the frame is fed the _inline_
   signed URL, and Download is a ghost button in a footer. An `attachment` URL in an iframe
   navigates the tab away and destroys the open drawer — a bug this codebase has already been
   bitten by once (`CreditDodReportCard.tsx`).
3. **A blank grey rectangle on a phone.** Do not embed the PDF below `md` and do not rely on
   `hidden md:block` (a hidden iframe still downloads the file). Gate on `useMediaQuery` and
   render the facts + a single "Open PDF" button instead.
4. **A calendar that needs pinch-zoom.** Pinch-zoom is disabled app-wide
   (`maximum-scale=1.0` + the `gesturestart` guard). A month grid that overflows 358px on a
   390px phone is unusable, permanently. The `p-3` card padding and `gap-1` on the grid exist
   solely to keep the cells at 44px — do not "tidy" them to `p-4 gap-2`.
5. **A greyed-out Acknowledge button.** There must be no Acknowledge, Check or Vehicle Condition
   control in our UI in any state. A disabled one implies the capability exists.
6. **A staleness state shown only as a colour.** "The tile turned amber" is not a message. The
   day count is always in words.
7. **A fake upload progress bar.** `fetch` PUT gives no progress. A bar that jumps 0→100 teaches
   the operator not to trust the screen. The admin upload dialog shows a spinner and words.
8. **A dealer message that invites a comparison.** The dealer does see the density figures: the
   owner's requirement is _"these extracted values are the important values … needs to be shown
   at the top in big fonts"_, and a dealer who cannot see the number on their own phone is still
   logging into the portal for it, which is the problem this service exists to remove. The trap
   is narrower: no unit, no "Density@15", no invoice, no rupees, no second number beside the
   first, no field to type into, and nothing that implies MDG knows or cares what the dealer's
   own dip test said (§4.1).
9. **A "Retry?" toast.** A failed upload retries **in place**: the admin dialog stays open with
   the file still staged. Toasts that vanish before the reader sees them are banned.

---

## 6. Deliberately not in this release

| Not shipping                             | Why, and what keeps the door open                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A typed measured density from the dealer | The owner's decision: the photo alone marks the day. The day record should carry an optional `measured?: Record<productKey, number>` field from day one so adding it later is additive, but **no UI, no label, no placeholder** ships for it now. |
| Any comparison of register vs invoice    | Same reason. Nothing the dealer reads, and nothing on the admin pane, should imply a comparison exists.                                                                                                                                           |
| Per-product or per-tanker photos         | One photo per day for the whole outlet.                                                                                                                                                                                                           |
| Browsing replaced photos                 | Server keeps them for audit; no UI in v1.                                                                                                                                                                                                         |
| A custom PDF toolbar / page thumbnails   | Would cost a `pdfjs-dist` + worker in the admin bundle. Argue for it when a real need appears.                                                                                                                                                    |

## 7. Where it lives in the code

**mdg-admin**

- `src/pages/dealers/vault/datasets.ts` — the `tt-density` descriptor (`Icon: Gauge`)
- `src/pages/dealers/vault/DealerTtDensityPane.tsx` — the pane (model: `DealerInspectionPane.tsx`)
- `src/pages/dealers/vault/ttDensity/` — `DensityHero.tsx`, `InvoiceTable.tsx`,
  `DayMarkCalendar.tsx`, `InvoicePdfDrawer.tsx` (`Drawer` + iframe + `useMediaQuery`),
  `UploadDayPhotoDialog.tsx`, `useTtDensityRunWatcher.ts` (a copy of the DSR run watcher),
  `format.ts` (the pure bits; **`mdg-admin` has no test runner**, so anything decidable belongs
  here)
- `src/components/ui/ImageLightbox.tsx` — the shared lightbox
- `src/hooks/api/useTtDensity.ts` — the queries, with a `ttDensityKeys` prefix object
- Not built: the cross-dealer view (§3.10).

**shared / backend**

- `shared/src/lib/serviceLabel.ts` — the two names
- `shared/src/types/ttDensity.ts` — `TT_DENSITY_AGEING_AFTER_DAYS`, `TT_DENSITY_STALE_AFTER_DAYS`,
  `ttDensityFreshness()`, `TT_REGISTER_DEALER_BACKDATE_DAYS`, `TT_REGISTER_ADMIN_BACKDATE_DAYS`
- `shared/src/schemas/chat.ts` — `'tt-density'` in the presign `scope` enum (four mirrored copies)
- `mdg-backend/src/routes/v1/uploads.ts` — the `tt-density` scope branch and
  `assertTtDensityDealerAccess`
- `mdg-backend/src/services/ttDensity/notify.ts` — the chat message with the new figures (§4.1)
- `mdg-backend/src/services/chatAsks/morning.ts` — the 09:00 ask for yesterday's page (§4.2)
