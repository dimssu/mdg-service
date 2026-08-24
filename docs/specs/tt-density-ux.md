# Feature Spec — TT Density (UX/UI)

**Status:** Draft for build (design-decisive)
**Owner:** Design
**Audience:** Admin UX, client UX, backend (for the shapes the screens need)
**Service slug:** `tt-density`
**Related:** `docs/UX_FLOWS.md`, `docs/STYLE_GUIDE_V2.md`, `docs/ADDING_A_SERVICE.md`,
`docs/specs/staff-points.md` (spec shape), `mdg-admin/docs/design/admin-mobile-responsive-spec.md`,
ADR 0008 (bilingual client)

---

> **Amended 2026-08-24 by `docs/specs/tt-density-contract.md`.** That document is the
> build contract and it wins any conflict with this one. Six things changed here:
> the upload scope is `tt-density` (not `density`), the signed-URL fields are
> `viewUrl`/`downloadUrl` (not `pdfViewUrl`/`pdfDownloadUrl`), the hero's
> "no invoice yet" tile is gone (the data cannot produce it), the staleness ladder
> moved into `shared` as `ttDensityFreshness()`, the file names and folders are
> fixed by contract §9, and — the big one — **the dealer's screen does show the
> density figures**. Every visual decision below is otherwise binding as written.
> Full list: contract §13.

## 0. What this service is, in one paragraph

Every tanker that delivers fuel to the outlet arrives with an IndianOil tax invoice, and that
invoice prints a **Density@15** figure for each product it carries — `820.500` for the diesel
line, `727.300` for the petrol line. We read those invoices off the e-Mitra portal, keep the
PDFs, and pull the density figures out. Separately, the dealer keeps a paper **density test
register** at the pump; once a day they photograph the day's page and that marks the day done.
The admin surface exists to show the density figures big and to let an operator read any
invoice without downloading it. The dealer surface exists to do exactly one thing: send today's
photo.

### The two names

| Where                      | Name shown                             | Why                                                                                                                                     |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `mdg-admin` (English only) | **TT Density**                         | Matches the portal screen ("TT Acknowledgement") the operator knows. Register it in `mdg-admin/src/lib/serviceLabel.ts`.                |
| `mdg-client` (bilingual)   | **Density register / डेंसिटी रजिस्टर** | The dealer's word for the thing in their hand. "TT", "acknowledgement", "invoice" and "density@15" never appear on the dealer's screen. |

---

## 1. The scope fence, on screen

The portal page carries three controls that change IndianOil's records: **Vehicle Condition**,
**Check Ack Status** and **Acknowledge Receipt**. Acknowledging a receipt is a legal act by the
dealer. This service never touches them.

That guarantee must be **visible in the admin UI**, not just in the code:

- A permanent, non-dismissible `Callout intent="info"`
  (`mdg-admin/src/components/ui/Callout.tsx:36`) sits directly under the pane header:

  > We only read this page. Vehicle Condition, Check Ack Status and Acknowledge are never
  > touched — acknowledging a receipt is the dealer's own legal act.

- There is **no Acknowledge button anywhere in our UI**, disabled or otherwise. A greyed-out
  Acknowledge button would imply we could enable it.
- The refresh action is worded **"Fetch invoices now"**, never "Sync", never "Update portal".

---

## 2. Design rules that bind this build

1. **Reuse the vault-pane pattern.** No new page shape, no new route, no new nav item on either
   side. The admin surface is a per-dealer Data Vault dataset; the client surface is a page
   reached from places that already exist.
2. **One breakpoint in admin (`md`, 768px).** `sm` and `lg` only where the existing code already
   uses them (filter bars, vault rail). No new breakpoints.
   (`mdg-admin/docs/design/admin-mobile-responsive-spec.md`)
3. **One job per client screen.** The dealer's screen asks for a photo. _Amended: it also
   **shows the density figures**, at the top, in big type — that is the owner's stated
   requirement and §4.2.1 is the shape. What it still shows nothing of: an invoice list, a
   history table, a PDF, a rupee figure, or any second number to compare against._
4. **Every tappable target ≥44px below `md`** on both apps.
5. **Unknown products degrade, never error** — the same philosophy as
   `shared/src/dsr/products.ts:17-24`. We have evidence for two IOCL material codes (`16730`
   EBMS → petrol, `50700` HSD-BSVI → diesel). Anything else still gets a tile, labelled by what
   the invoice itself said, marked provisional.
6. **No new dependency in the admin bundle for the PDF.** There is no PDF library in
   `mdg-admin` today and this feature does not add one (see §3.6).

---

# A. Admin — the dealer's TT Density pane

## 3.1 Where it lives

**One appended descriptor** in `mdg-admin/src/pages/dealers/vault/datasets.ts` (the registry at
L30-73). Nothing else in the routing or nav changes. **Do not add a `TabDef` to
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
`DealerVaultView.tsx:32-48` (attached / still asking / ask failed) is inherited unchanged — do
not simplify it.

`DealerVaultPaneProps` is `{ dealer: Dealer }` (`vault/types.ts:13`) — **no URL params reach this
pane**, so the open invoice, the selected calendar day and the shown month are all local
`React.useState`. That is a deliberate consequence of the existing contract, not an oversight:
a per-dealer pane is already addressable by `?tab=data-vault&vault=tt-density`.

Also register the label:

```ts
// mdg-admin/src/lib/serviceLabel.ts:6
'tt-density': 'TT Density',
```

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

`mdg-admin/src/pages/dealers/vault/DensityHero.tsx` — **genuinely new** (justification in §3.9).
It is a bigger sibling of `mdg-admin/src/pages/dataVault/StatTile.tsx:15`, not a replacement:
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
| Number colour, none         | `text-text-subtle` (renders `—`)                                                                            |
| Unit line                   | `mt-1 text-xs text-text-subtle` → `kg/m³ at 15 °C`                                                          |
| Provenance line             | `mt-3 text-xs text-text-subtle` → `22 Aug 2026 · BR09GC8009 · 2 days ago`                                   |
| Staleness badge             | `Badge intent="warning" \| "danger"` (`Badge.tsx:10`), absolute top-right of the eyebrow row                |

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

_Amended: a fourth `none` state — "no invoice for this product, ever" — was specified here and has
been removed. This service knows which grades have **arrived**; it has no idea which grades an
outlet **stocks**. `getLatestDensities` returns one entry per product actually seen, so there is
no data behind an "expected but missing" tile and inventing one would put a dash on screen for a
grade the outlet may not even sell. A grade that stops arriving ages out through `stale` and then
drops off the headline, which is the honest ending._

_Also amended: the 7 / 21 thresholds now live in `shared` as `TT_DENSITY_AGEING_AFTER_DAYS`,
`TT_DENSITY_STALE_AFTER_DAYS` and `ttDensityFreshness(ageDays)`, so the admin pane and the
dealer's app cannot disagree about what "old" means about the same figure._

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
This mirrors `dsrProductProfile()`'s contract (`shared/src/dsr/products.ts:123`).

### Hero states

| State                                 | What the hero shows                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loading                               | 2 skeleton tiles: `Card > CardContent p-4` containing `Skeleton h-3 w-24`, `Skeleton h-10 w-40 mt-3`, `Skeleton h-3 w-32 mt-3`. Copy `StatTileSkeletons` shape (`StatTile.tsx:74`), sized up.    |
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
  `IrasShiftDataPane.tsx:700`).
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
  Callout appears — copy the block at `DealerInspectionPane.tsx:179-199`, `Card` with
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

Use the existing `Drawer` (`mdg-admin/src/components/ui/Drawer.tsx:27`) at `width="lg"` (720px).
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
  src={invoice.pdfViewUrl}
  title={`Tax invoice ${invoice.sapInvoiceNo}`}
  className="h-[calc(100dvh-22rem)] min-h-[460px] w-full rounded-md border border-border bg-white"
  referrerPolicy="no-referrer"
  onLoad={() => setFrameReady(true)}
/>
```

This is the **same technique as the only existing iframe in the app**
(`mdg-admin/src/pages/dsr/DsrReportPanel.tsx:125`). No PDF library is added.

**Backend contract this requires:** two signed URLs per invoice, from
`GET /tt-density/dealers/:dealerId/invoices/:invoiceId/pdf-url` (contract §4.2 A4), returned as
a `TtSignedFileUrls`:

- **`viewUrl`** — `Content-Disposition: inline`, `Content-Type: application/pdf`. **Only this one
  ever goes in the iframe.** An `attachment` URL in an iframe navigates the tab away and tears
  down the open drawer (the bug already documented at `CreditDodReportCard.tsx:100-135`).
- **`downloadUrl`** — `Content-Disposition: attachment`, used only by the footer Download button.

_Amended: the fields are `viewUrl` and `downloadUrl` on a `TtSignedFileUrls`, fetched by their
own endpoint, not `pdfViewUrl`/`pdfDownloadUrl` hanging off the invoice. The invoice's facts come
from A3 and render immediately; the URLs are a second request, which is what lets the drawer show
every extracted figure while the file is still being signed — or when there is no file at all._

### Toolbar

**There is no custom toolbar.** Page count, zoom, rotate, print and find all come from the
browser's built-in PDF viewer inside the iframe. Building our own would mean shipping
`pdfjs-dist` + a worker to the admin bundle for a control the browser already draws. If a
future requirement needs page thumbnails, that is when the dependency gets argued for.

### States

| State                                                 | Render                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading (frame not yet loaded)                        | `Skeleton className="absolute inset-0 rounded-md"` over the frame, **removed on `onLoad` or after 6 000 ms, whichever comes first**. An iframe that never fires `onLoad` must not leave a skeleton up forever.                                                                                                                                 |
| `pdfViewUrl` present, renders                         | The frame. Nothing else.                                                                                                                                                                                                                                                                                                                       |
| `pdfViewUrl` is `null` (file never downloaded / lost) | In place of the frame: the `FileWarning` block copied from `DsrReportPanel.tsx:143` — **"The invoice PDF is not in the vault"** / "The portal listed this invoice but the file did not download. The figures above were read from an earlier copy. Fetch again to try." + a `Fetch invoices now` button. The density chips above stay visible. |
| We have the PDF but never parsed it                   | Density chips replaced by `Callout intent="warning"`: "We could not read the density figures out of this invoice. The PDF is below — please read them off it."                                                                                                                                                                                 |
| Signed URL expired (403 on reload)                    | Treated as the missing case; the pane's query refetch re-signs. Never show a status code.                                                                                                                                                                                                                                                      |

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
│ [    Open the invoice PDF          ]  │  Button primary, full width, min-h-11
│ [ Close ]                             │
└───────────────────────────────────────┘
```

"Open the invoice PDF" hands the file to whatever the phone uses for PDFs:

- inside the admin Expo shell (`isNativeShell()`): `postToNative({ type: 'media:download', … })`
  with `pdfDownloadUrl` — the shell's existing handler saves and opens it. `window.open` is
  unreliable there because the WebView runs with `setSupportMultipleWindows={false}`.
- in a plain mobile browser: `window.open(pdfViewUrl, '_blank', 'noopener')`.

So on a phone the operator gets **every figure we hold** without any PDF rendering at all, plus
one tap to the real file. They never see a blank frame.

## 3.7 The register-photo calendar

### Shape

A month grid, not a list and not a strip. A month is 28–31 cells; a horizontal strip of 31
items either scrolls (hiding the gaps, which are the whole point) or shrinks below the tap
floor. A 7 × 5 grid shows the whole month at once and makes a run of missing days visually
obvious as a hole in the block.

`mdg-admin/src/pages/dealers/vault/DayMarkCalendar.tsx` — **genuinely new**; there is no month
grid anywhere in `mdg-admin` (only `BankHolidaysPage.tsx`, which is a month-scoped _list_). The
month switcher header is copied verbatim from `BankHolidaysPage.tsx:186-208` (two secondary
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

| Meaning                    | Classes                                                                    | Extra                                                                                      |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Sent by the dealer         | `bg-success-soft text-success border border-success/30`                    | —                                                                                          |
| Added by an MDG admin      | `bg-success-soft text-success ring-2 ring-inset ring-brand`                | 5px `bg-brand rounded-full` dot, top-right, `aria-hidden`                                  |
| Past day, not marked       | `border border-dashed border-border text-text-subtle`                      | the "expected but absent" convention from `DealerStatusCell` (`IrasShiftDataPane.tsx:689`) |
| Today, not marked          | `border border-border-strong bg-surface text-text font-semibold`           | —                                                                                          |
| Future day                 | `text-text-subtle/60 cursor-default`                                       | `disabled`                                                                                 |
| Before the service started | `text-text-subtle/40 cursor-default`                                       | `disabled`, no border                                                                      |
| Selected                   | any of the above + `outline outline-2 outline-offset-1 outline-focus-ring` | —                                                                                          |

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

`See full size` opens **`mdg-admin/src/components/ui/ImageLightbox.tsx`** — `Dialog size="lg"` +
`<img className="mx-auto max-h-[70vh] w-auto" draggable={false}>` + a ghost Download in the
footer. This is a **genuinely new shared component**, and it is a consolidation, not an
invention: the identical markup exists three times today
(`features/chat/AttachmentPreview.tsx:82-140`, `features/chat/MediaGalleryCard.tsx:37-110`,
`pages/dealers/DealerStaffTab.tsx:940-1000`). Extract it once here and migrate the three call
sites in the same change.

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

`Dialog size="sm"` modelled line-for-line on
`mdg-admin/src/features/records/UploadRecordDialog.tsx` — hidden `<input type="file">`, a dashed
"Choose a photo (max 25 MB)" button, a chip with the filename + an `X` to clear, presign → PUT →
create.

Differences from the records dialog, all deliberate:

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

| State                                  | Render                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                                | The grid renders with all cells as `Skeleton`-filled squares (`Skeleton className="h-full w-full rounded-md"`), header and legend live                                |
| Error                                  | `EmptyState` `AlertCircle` · "Could not load the register photos" · message + a Retry via `refetch`                                                                   |
| Never any photo, service just attached | The grid renders normally (all dashed), plus one line under the legend: "No register photos yet. The dealer sends one a day from their app, or you can add one here." |
| Service not attached                   | The whole pane is gated out by `DealerVaultView`; if the gating check itself failed, see §3.8                                                                         |

## 3.8 Pane-level states

| State                                 | Render                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                               | `DensityHero loading` (2 skeleton tiles) + a `Card` with 3 × `Skeleton h-11 w-full`, mirroring `DealerInspectionPane.tsx:109-122`                                                                                                                                                                                                        |
| Error                                 | `EmptyState` `AlertCircle` · **"Could not load TT Density"** · `ApiError.message` or "Please try again." · `cta={fetchButton}`                                                                                                                                                                                                           |
| Never run                             | `EmptyState` `Gauge` · **"No tanker invoices captured yet"** · "Once TT Density runs for 15E, the Density@15 for each product appears here, with the invoice PDF behind every figure." · `cta={fetchButton}` — **and the register-photo calendar still renders below it**, because the dealer's photos do not depend on the portal fetch |
| Service detached (gating failed open) | `EmptyState` `Plug` · "TT Density is not attached to 15E" · "Attach it from the Services tab and this pane fills in."                                                                                                                                                                                                                    |
| Last fetch failed                     | Failure `Card` (`border-danger/40 bg-danger-soft/40`) above the hero; everything else renders with the last good data                                                                                                                                                                                                                    |

## 3.9 New components — the justification list

Everything else in this spec is an existing primitive used as-is. Three components are new:

| New component                                          | Why nothing existing does it                                                                                                                                                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DensityHero` + `DensityTile` (`pages/dealers/vault/`) | `StatTile` is a 24px integer counter with `value: number` and Indian digit grouping. This needs a 40–48px three-decimal figure, a unit, a provenance line, and a four-way staleness state. Forking `StatTile` would break every existing dataset digest. |
| `DayMarkCalendar` (`pages/dealers/vault/`)             | There is no month grid in `mdg-admin`. `BankHolidaysPage` is a month-scoped list; `DateRangeFilter` is a preset/range picker. The month-switcher header is copied from `BankHolidaysPage.tsx:186-208`.                                                   |
| `ImageLightbox` (`components/ui/`)                     | Not new behaviour — the same `Dialog size="lg"` + `max-h-[70vh]` image exists three times already. This is the overdue extraction; migrate all three call sites.                                                                                         |

The PDF drawer is **not** a new primitive: it is `Drawer` + one `<iframe>`, both already in use.

## 3.10 The cross-dealer view (secondary, ship after the per-dealer pane)

One appended descriptor in `mdg-admin/src/pages/dataVault/datasets.ts:27-44` — a data-only
change, no routing:

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

# B. Client — the dealer's daily register photo

## 4.1 Where it lives, and what it is not

**Route:** `/density` (lazy, via `lazyWithRetry`, inside `ProtectedLayout` in
`mdg-client/src/App.tsx:29-45`).

**Three ways in, in the order the dealer will actually use them:**

1. **The push notification** — add one token to the allowlist in `mdg-app/lib/bridge.ts:168-172`.
   _Amended: in v1 the push that fires is the **new-density** one — a single notification after a
   run stores new invoices, at most one per run whatever the invoice count (contract §8.2 step
   8a). The **daily 20:00 "you have not sent today's photo" reminder is deferred**: it needs a
   per-dealer reminder hour and a nightly scheduler job, and neither is worth building before we
   know whether dealers send photos unprompted. Until it exists, the pinned chat-list card (entry 2) is what a dealer sees when something is due, and it is the one they will actually meet._
   ```ts
   const DEEP_LINK_TOKENS: Record<string, string> = {
     kavach: '/kavach',
     chat: '/chat',
     records: '/records',
     density: '/density',
   };
   ```
2. **A pinned card at the top of the chat list** (`ChatListPage`, the app's default route),
   rendered **only while there is something to do** — today unmarked, or a day inside the
   7-day window missed. Once today is sent, it disappears until tomorrow. Chat is home; the
   dealer opens the app and the one thing they owe today is the first thing they see.
3. **A Profile row** (`ProfilePage.tsx`), always present when the service is attached — the
   established route for a non-tab feature, identical markup to the Services and Staff Points
   rows at `ProfilePage.tsx:422-472`.

**Rejected, with reasons:**

| Rejected                             | Why                                                                                                                                                                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A 5th bottom tab                     | The bar is locked at 4 (`AppShell.tsx:117-126`) and two features have already been demoted to Profile rather than break it. A once-a-day 10-second task does not outrank Chat, Reports, Kavach or Profile.                  |
| A card in the Kavach "Do today" list | Kavach's promise is a score ring. A task card sitting in that list that does not move the ring is a quiet lie, and wiring density into the Kavach engine would couple two services that have nothing to do with each other. |
| A card on the Reports tab            | Reports is a receiving shelf — things MDG sends the dealer. This is a chore the dealer does. Wrong category, and a tab they may not open for days.                                                                          |

## 4.2 The `/density` page

```
┌────────────── 390px ──────────────┐
│ Density register                  │  h1 text-lg/600 tracking-tight
│                                   │  page root: flex flex-1 flex-col gap-5 p-4
│ ┌───────────────────────────────┐ │
│ │ ┌──┐                          │ │  Card rounded-2xl border shadow-sm, p-4
│ │ │📷│ Today's register photo   │ │  h-11 w-11 rounded-xl tile · text-[15px]/600
│ │ └──┘ Sun, 24 Aug              │ │  text-xs text-text-muted
│ │                               │ │
│ │ Open your register at today's │ │  text-sm text-text-muted
│ │ page and take one clear photo.│ │
│ │                               │ │
│ │ [ 📷  Take photo            ] │ │  Button primary fullWidth size="lg" (h-12)
│ │ [ 🖼  Choose from phone      ] │ │  Button secondary fullWidth size="lg"
│ └───────────────────────────────┘ │
│                                   │
│ THIS WEEK                         │  h2 text-xs/600 uppercase tracking-wide text-text-subtle
│ ┌───────────────────────────────┐ │
│ │  M    T    W    T    F    S  S│ │  7 cells, gap-1, ≈44px each within 334px
│ │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │ │
│ │ │✓ │ │✓ │ │· │ │✓ │ │✓ │ │✓ │ │ │
│ │ │18│ │19│ │20│ │21│ │22│ │23│ │ │
│ │ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ │ │
│ │                          ┌──┐ │ │
│ │                          │24│ │ │  today, unmarked: border-border-strong
│ │                          └──┘ │ │
│ │ ✓ Sent   · Still to do        │ │  legend, text-xs text-text-subtle
│ └───────────────────────────────┘ │
│                                   │
│ ┌───────────────────────────────┐ │
│ │ 💬 Something not right?       │ │  HelpFooter — copy KavachPage.tsx:35-49
│ │    Message us.                │ │
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
                            [ tabs ]   pb-20 reserves the bar
```

Page shell rules, inherited from `KavachPage`:
`<div className="flex flex-1 flex-col gap-5 p-4">`, `h1` = `text-lg font-semibold tracking-tight
text-text`, section `h2` = `text-xs font-semibold uppercase tracking-wide text-text-subtle`,
four states (loading `Spinner size={20}` in `py-12` / error `EmptyState` + `t('common.helpDesc')`
/ not-provisioned calm welcome / normal), and **all hooks before any early return**.

The week strip cells are `<button>`s. Tapping a **sent** day opens the photo in a full-screen
lightbox; tapping a **missed** day inside the window starts the capture flow for that day;
future days are `disabled`.

## 4.2.1 The figures, on the dealer's own screen — **added by the build contract**

_The wireframe above predates this section and omits the card; it sits directly under the `h1`
and above the Today card, so the figures are the first thing on the screen and the day's job is
the second._

`mdg-client/src/features/density/DensityLatestStrip.tsx`, fed by
`TtDensityMeView.latest` — **rendered in the order it arrives** (the store sorts it diesel
first; do not re-sort in the component, or the dealer's phone and the admin's screen can put a
different number at the top).

```
┌────────────── 390px ──────────────┐
│ Density register                  │  h1
│                                   │
│ पिछले टैंकर की रीडिंग              │  h2 text-xs/600 uppercase text-text-subtle
│ ┌───────────────────────────────┐ │
│ │ डीज़ल                          │ │  text-[15px]/600
│ │  820.500                      │ │  text-[32px]/600 leading-none tabular-nums
│ │  यह अपने रजिस्टर में लिखें       │ │  text-sm text-text-muted
│ │  22 अग · BR09GC8009           │ │  text-xs text-text-subtle
│ ├───────────────────────────────┤ │
│ │ पेट्रोल                        │ │
│ │  727.300                      │ │
│ │  यह अपने रजिस्टर में लिखें       │ │
│ │  22 अग · BR09GC8009           │ │
│ └───────────────────────────────┘ │
│ …Today card, week strip, help…    │
└───────────────────────────────────┘
```

**The rules, and every one of them is the fence:**

| Rule                                                                                               | Why                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three decimals, always, via `toFixed(3)` on `density15Raw`'s own digits — `820.500`, never `820.5` | it is copied into a book by hand; the trailing zeros are part of the figure                                                                                          |
| `text-[32px]` minimum, `tabular-nums`, `text-text`                                                 | the owner asked for big fonts, and a 52-year-old is reading it under a canopy light                                                                                  |
| The product word only — **डीज़ल / Diesel**, from `labelHi` / `labelEn`                             | never `HSD-BSVI`, never `50700`, never `HSD`                                                                                                                         |
| **No unit.** No `kg/m³`, no `@15`, no `Density@15`                                                 | the invoice states no unit; kg/m³ at 15 °C is our reading of the magnitude, not IndianOil's statement, and it is four characters of jargon on a screen that has none |
| **No invoice number, no rupee figure, no document number**                                         | a tax invoice is a financial document and stays admin-only                                                                                                           |
| **No second number anywhere.** No "your reading", no field, no placeholder, no "compare"           | this is the release that deliberately does not ship a comparison, and a screen that hints at one is a promise we did not make                                        |
| Tanker and date underneath, in one line                                                            | a dealer with two tankers this week has to know which one this is                                                                                                    |
| A `provisional` product is labelled by the invoice's own words                                     | `dsrProductProfile()`'s rule, on a dealer's screen                                                                                                                   |
| Older than `TT_DENSITY_STALE_AFTER_DAYS` (21): keep the number, add its age in words               | `density.figureAge`. A stale figure is still the last true reading. Blanking it would be a worse lie than an old number that says how old it is                      |
| No figures at all: one calm line, `density.noReadingYet`                                           | never a spinner that never resolves, and never a zero                                                                                                                |

Three keys are added to the §4.6 table for this: `density.latestTitle`,
`density.registerLine`, `density.noReadingYet`, plus `density.figureAge` for the stale case.

## 4.3 The capture flow, step by step

```
Today card
   │  tap [ Take photo ]                    tap [ Choose from phone ]
   ▼                                                     ▼
cameraRef.current.click()                    galleryRef.current.click()
<input type="file" accept="image/*"          <input type="file" accept="image/*"
       capture="environment" hidden>                 hidden>
   │                                                     │
   └──────────────────► onPick(e) ◄──────────────────────┘
                          │  const f = e.target.files?.[0]; e.target.value = '';   ← MANDATORY
                          │  resolveFileType(f, { assumeImage: true })
                          │  if kind !== 'image' → toast.error(density.notAPhoto) ; stop
                          ▼
                   DensityCaptureSheet opens (bottom sheet)
                   ┌───────────────────────────────┐
                   │ ═══                           │  grabber
                   │ Sun, 24 Aug                   │  text-[15px]/600
                   │ ┌───────────────────────────┐ │
                   │ │                           │ │  <img draggable={false}
                   │ │   (the photo, contained)  │ │   className="max-h-[52vh] w-full
                   │ │                           │ │              rounded-xl object-contain">
                   │ └───────────────────────────┘ │
                   │ Is the page readable?         │  text-sm text-text-muted
                   │ [   Yes, send this         ]  │  Button primary fullWidth size="lg"
                   │ [   Take again             ]  │  Button ghost fullWidth size="lg"
                   └───────────────────────────────┘
                          │  Yes
                          ▼
                   compressImage()  →  presign (scope 'density')  →  PUT to S3
                   button: loading, label "Sending your photo…"
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
           success                  failure
   sheet closes                sheet STAYS OPEN
   optimistic day → sent       inline line: "The photo did not reach us"
   toast "Photo saved"         button becomes [ Send again ]
   strip cell turns green      storageKey held in state → retry never re-uploads
```

### Rules the implementation must honour

1. **Two hidden inputs, not one.** `capture="environment"` locks the picker to the camera, so a
   second plain input is the only way to reach the gallery — the pattern at
   `FinalizeSubmitSheet.tsx:198-212`. Both are `hidden`; two visible `Button`s drive them.
2. **Reset `e.target.value = ''` after every pick.** Without it, re-picking the same file never
   fires `onChange` and the dealer's second attempt silently does nothing.
3. **Never trust `file.type`.** Android WebView hands back `type === ''` for camera captures.
   Use `resolveFileType(file, { assumeImage: true })` (`lib/uploadAttachment.ts:57-86`).
4. **Compress before presign** via `compressImage` (1600px longest edge, JPEG q0.70, skipped
   below 300 KB). A raw camera JPEG is 3–6 MB; on 2G that is a minute of upload the dealer will
   abandon.
5. **Revoke the object URL** on sheet close and on unmount (`FinalizeSubmitSheet.tsx:76-85`).
6. **`draggable={false}` on the preview `<img>`.** The press-hold drag ghost hangs the shell.
7. **`useScrollLock()`** while the sheet is open — it is a full-screen sheet and this route is not
   `/chat`.
8. **Hold the uploaded `storageKey` in state.** This is the bug not to copy: in
   `ComplianceTaskCard.tsx:715` a failed mark-done retries with no proof, silently dropping the
   photo. Here the photo _is_ the deliverable — if the S3 PUT succeeded and only the mark-day
   POST failed, `Send again` must reuse the existing `storageKey` and skip the upload entirely.
9. **No progress bar.** `fetch(… PUT)` has no upload-progress event and there is no XHR
   precedent in the repo. The honest UI is a spinner plus the words "Sending your photo…". Do
   not fake a bar.
10. **Offline blocks the send with a sentence, not a disabled mystery.** Mirror
    `FinalizeSubmitSheet.tsx:281-305`: the button is disabled and a plain line sits directly
    above it saying why.
11. **The mutation is optimistic with rollback** — `onMutate` marks the day sent and flips the
    card, `onError` restores the snapshot so the dealer sees true state, `onSettled`
    invalidates (`useKavach.ts:104-127`).

### Native shell

**Nothing new is needed.** `ensureCameraPermissionsAsync()` already grants Android `CAMERA` on
mount (`mdg-app/app/index.tsx:237-239`), which is the permission the `<input capture>` intent
path requires. iOS needs nothing.

### Backend contract this requires

A new upload scope, added to `shared/src/schemas/chat.ts:63-77` and handled in
`mdg-backend/src/routes/v1/uploads.ts:110-131` alongside the `staff` branch:

```ts
scope: z.enum(['chat', 'avatar', 'staff', 'tt-density']);
```

image-only, `dealerId` required, `assertTtDensityDealerAccess(req.user, dealerId)`, storage key
`ttRegisterPhotoKey(dealerId, filename)` → `tt-density/<dealerId>/register/<uuid>.<ext>`.
Without this the presign 400s.

_Amended: the scope is `tt-density`, matching the service id, the storage prefix, the plugin
folder and the `?vault=` deep link — one word to grep for when an object turns up in the bucket
and nobody knows what wrote it. The key is partitioned by dealer only; the business date is not
in it, because the upload route's whole access check is "does this key start with
`tt-density/<dealerId>/register/`". Contract §2.5, §4.4, and the key helpers in §9 P4._

## 4.4 Done, missed, and how far back

### Today is done

```
┌───────────────────────────────┐
│ ┌──┐                          │  tile: bg-success-soft text-success
│ │✓ │ Today is done            │  CheckCircle2 width={20} strokeWidth={2}
│ └──┘ Sun, 24 Aug              │
│                               │
│ We have today's register      │  text-sm text-text-muted
│ photo. Nothing else to do.    │
│                               │
│ [ See the photo ]             │  Button ghost size="lg" fullWidth
└───────────────────────────────┘
```

On the chat list this card is **not rendered at all** once today is done and no day is missed —
the dealer's home screen goes back to being just their conversations.

### A day was missed

```
┌───────────────────────────────┐
│ ┌──┐                          │  tile: bg-warning-soft text-warning
│ │!!│ 2 days still to do       │  text-[15px]/600
│ └──┘                          │
│ Open the register at that     │  text-sm text-text-muted
│ day's page and take a photo.  │
│                               │
│ ┌────────┐ ┌────────┐         │  day chips, min-h-[44px], rounded-full
│ │ Fri 22 │ │ Sat 23 │         │  bg-warning-soft text-warning text-sm/500
│ └────────┘ └────────┘         │
│                               │
│ [ 📷  Take photo for Fri 22 ] │  primary; label names the day
└───────────────────────────────┘
```

Today always comes first. If today is unmarked, the card is the Today card and the missed days
appear as a single quiet line below it ("2 earlier days still to do") that opens `/density`.
Two competing primary buttons on one card is not allowed.

### How far back a dealer may fill in — **7 days** (today + the 6 before it)

Recommended, and it is the same 7 everywhere in this service:

1. It is the window the portal's own TT Acknowledgement filter defaults to, and the window our
   daily fetch uses. One number in the whole service means one number to explain, one to test,
   and no place for the two to drift.
2. A week is what a dealer can honestly reconstruct from a paper register they physically hold.
   They know whether they were at the pump last Tuesday.
3. Past a week, a photograph of an old page stops being evidence that the test happened that
   day and becomes evidence only that the page exists. Allowing 30 days would quietly turn a
   daily record into a monthly one.

Days older than 7 are **not shown** in the week strip and are not offerable. If a dealer reaches
one anyway (an old notification, a stale screen), the copy is
`density.tooOld` — "Only the last 7 days can be filled in." — with a `Message us` action, never
a dead end.

### A day MDG filled in

The strip cell renders green with a `ring-1 ring-inset ring-border-strong` and tapping it shows
the photo with the line **"यह फोटो MDG टीम ने डाली है" / "MDG team added this photo"**. The
dealer is never told off for it and is never offered a Replace button — an admin correction is
not the dealer's problem to fix.

## 4.5 Client states

| State                                                                                                | Render                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                                                                                              | `Spinner size={20}` centred in `py-12`                                                                                                                                                                            |
| Error                                                                                                | `EmptyState` `Camera` · `t('density.errorTitle')` · `t('common.helpDesc')` + `HelpFooter`                                                                                                                         |
| Service not attached (`attached: false` on the `/me` payload — the route answers **200**, never 404) | Calm welcome: `EmptyState` `Camera` · `t('density.notOnTitle')` · `t('density.notOnDesc')` + `HelpFooter`. **Never a 404 and never an empty list.** The Profile row and the chat-list card are also not rendered. |
| Attached, nothing due                                                                                | The Today-done card + the week strip                                                                                                                                                                              |
| Sending                                                                                              | Sheet open, primary button `loading`, label `t('density.sending')`                                                                                                                                                |
| Send failed                                                                                          | Sheet open, card border `border-danger/40`, inline retry pill `bg-danger-soft text-danger` with `RotateCw`, exactly `ComplianceTaskCard.tsx:173-182`                                                              |
| Offline                                                                                              | Send button disabled + `t('density.offline')` directly above it                                                                                                                                                   |

## 4.6 Bilingual copy — every string

New section in `mdg-client/src/lib/i18n.ts`, `{ en, hi }` on every key, dot-namespaced
`density.*`. A missing key is a compile error, so add them all in one block.

```ts
/* ── density register (tt-density) ──────────────────────────────────── */
```

| Key                       | English                                                               | हिन्दी                                                              |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `density.title`           | Density register                                                      | डेंसिटी रजिस्टर                                                     |
| `density.latestTitle`     | Last tanker's reading                                                 | पिछले टैंकर की रीडिंग                                               |
| `density.registerLine`    | Write this in your register                                           | यह अपने रजिस्टर में लिखें                                           |
| `density.noReadingYet`    | No tanker reading yet. It will appear here the day after one arrives. | अभी कोई टैंकर रीडिंग नहीं है। टैंकर आने के अगले दिन यह यहाँ दिखेगी। |
| `density.figureAge`       | This reading is {n} days old                                          | यह रीडिंग {n} दिन पुरानी है                                         |
| `profile.density`         | Density register                                                      | डेंसिटी रजिस्टर                                                     |
| `profile.densityDesc`     | Send today's register page                                            | आज के रजिस्टर का पन्ना भेजें                                        |
| `density.todayTitle`      | Today's register photo                                                | आज के रजिस्टर की फोटो                                               |
| `density.todayHint`       | Open your register at today's page and take one clear photo.          | अपना रजिस्टर आज वाले पन्ने पर खोलें और एक साफ़ फोटो लें।            |
| `density.takePhoto`       | Take photo                                                            | फोटो लें                                                            |
| `density.takePhotoFor`    | Take photo for {day}                                                  | {day} की फोटो लें                                                   |
| `density.chooseFromPhone` | Choose from phone                                                     | फ़ोन से चुनें                                                       |
| `density.readable`        | Is the page readable?                                                 | क्या पन्ना साफ़ पढ़ा जा रहा है?                                     |
| `density.sendThis`        | Yes, send this                                                        | हाँ, यही भेजें                                                      |
| `density.takeAgain`       | Take again                                                            | दोबारा लें                                                          |
| `density.sending`         | Sending your photo…                                                   | फोटो भेजी जा रही है…                                                |
| `density.doneTitle`       | Today is done                                                         | आज का काम हो गया                                                    |
| `density.doneDesc`        | We have today's register photo. Nothing else to do.                   | आज के रजिस्टर की फोटो हमें मिल गई। और कुछ नहीं करना है।             |
| `density.doneToast`       | Photo saved                                                           | फोटो सेव हो गई                                                      |
| `density.doneToastDesc`   | Today's register page is saved.                                       | आज के रजिस्टर का पन्ना सेव हो गया।                                  |
| `density.seePhoto`        | See the photo                                                         | फोटो देखें                                                          |
| `density.weekTitle`       | This week                                                             | इस हफ़्ते                                                           |
| `density.legendSent`      | Sent                                                                  | भेज दी                                                              |
| `density.legendTodo`      | Still to do                                                           | अभी बाकी                                                            |
| `density.missedOne`       | 1 day still to do                                                     | 1 दिन बाकी है                                                       |
| `density.missedMany`      | {n} days still to do                                                  | {n} दिन बाकी हैं                                                    |
| `density.missedDesc`      | Open the register at that day's page and take a photo of it.          | उस दिन वाले पन्ने पर रजिस्टर खोलें और उसकी फोटो लें।                |
| `density.earlierDays`     | {n} earlier days still to do                                          | {n} पुराने दिन अभी बाकी हैं                                         |
| `density.today`           | Today                                                                 | आज                                                                  |
| `density.yesterday`       | Yesterday                                                             | बीता कल                                                             |
| `density.failedTitle`     | The photo did not reach us                                            | फोटो हम तक नहीं पहुँची                                              |
| `density.failedDesc`      | Your phone lost the network. Tap to send it again.                    | आपके फ़ोन का नेटवर्क चला गया था। दोबारा भेजने के लिए दबाएँ।         |
| `density.sendAgain`       | Send again                                                            | दोबारा भेजें                                                        |
| `density.notAPhoto`       | That is not a photo. Please take a photo of the register page.        | यह फोटो नहीं है। कृपया रजिस्टर के पन्ने की फोटो लें।                |
| `density.offline`         | Your phone is not on the internet right now. The photo will not go.   | आपका फ़ोन अभी इंटरनेट पर नहीं है। फोटो अभी नहीं जाएगी।              |
| `density.tooOld`          | Only the last 7 days can be filled in.                                | सिर्फ़ पिछले 7 दिन ही भरे जा सकते हैं।                              |
| `density.adminAdded`      | MDG team added this photo                                             | यह फोटो MDG टीम ने डाली है                                          |
| `density.notOnTitle`      | Nothing to do yet                                                     | अभी कुछ नहीं करना है                                                |
| `density.notOnDesc`       | This service is not on for your pump yet. Message us if you want it.  | यह सेवा अभी आपके पंप के लिए चालू नहीं है। चाहिए तो हमें मैसेज करें। |
| `density.errorTitle`      | We could not open this                                                | यह खुल नहीं पाया                                                    |
| `density.helpLine`        | Something not right? Message us.                                      | कुछ ठीक नहीं लग रहा? हमें मैसेज करें।                               |
| `density.pushTitle`       | Today's density register                                              | आज का डेंसिटी रजिस्टर                                               |
| `density.pushBody`        | Take a photo of today's page. It takes 10 seconds.                    | आज वाले पन्ने की फोटो लें। 10 सेकंड लगेंगे।                         |

### Copy notes the translator and the reviewer must both keep

- **Hindi "कल" means both yesterday and tomorrow.** Never use it bare. `density.yesterday` is
  **"बीता कल"**, and every day chip also prints the date ("शनि 23") so the word is never doing
  the work alone.
- **No jargon, either language.** These words are banned from the dealer's screen: sync, upload,
  server, retry, failed, error, invoice, acknowledgement, TT, Density@15, kg/m³, storage,
  attachment, API. _The ban survives §4.2.1 unchanged — the dealer sees the **number**, never our
  name for it. "डीज़ल · 820.500" carries the whole fact with none of the vocabulary._
- **Failure copy names the cause and the fix in one sentence.** "The photo did not reach us. Your
  phone lost the network. Tap to send it again." — not "Upload failed — retry?".
- **Plurals are two keys**, the manual idiom already used at `KavachPage.tsx:133-136`.
- **Reading level**: every string above is short sentences, everyday words, no subordinate
  clauses. A person who has never used software can act on each one.
- `mdg-admin` stays English (ADR 0008). Nothing in section A is translated.

---

# C. Cross-cutting

## 5.1 Colour semantics — one table, existing tokens only

**Admin (`mdg-admin/tailwind.config.ts`, reached only through `Badge intent` / `INTENT_CLASSES`):**

| Meaning                | Token pair                                            | Where                                                                   |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Density fresh (≤7d)    | none — `text-text`                                    | hero number                                                             |
| Density ageing (8–20d) | `warning` (`#d97706` / `-soft #fef3c7`)               | `Badge intent="warning"` "12 days old"                                  |
| Density stale (≥21d)   | `danger` (`#dc2626` / `-soft #fee2e2`)                | `Badge intent="danger"` + `border-danger/40` + number `text-text-muted` |
| No invoice ever        | `neutral`                                             | `Badge intent="neutral"` "No invoice yet", value `—`                    |
| Provisional product    | `neutral`                                             | `Badge intent="neutral"` "New product"                                  |
| Day covered            | `success` (`#16a34a` / `-soft #dcfce7`)               | calendar cell fill                                                      |
| Covered _by MDG_       | `success` fill + `brand` (`#2563eb`) ring/dot         | calendar cell                                                           |
| Day missing            | none — `border-dashed border-border text-text-subtle` | calendar cell                                                           |
| Fetch failed           | `danger`                                              | `Card border-danger/40 bg-danger-soft/40`                               |

**Client (`mdg-client/tailwind.config.ts`; note `brand` is near-black `#18181b`, so green is the
only colour that can mean "done"):**

| Meaning            | Classes                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| Sent / done        | `bg-success-soft text-success` (tile, strip cell, done line)                        |
| Still to do, today | `bg-surface-2 text-text-muted` tile + `Button variant="primary"`                    |
| Missed day         | `bg-warning-soft text-warning` (tile, day chip, strip cell)                         |
| Send failed        | card `border-danger/40`; retry pill `bg-danger-soft text-danger`                    |
| Added by MDG       | `bg-success-soft text-success` + `ring-1 ring-inset ring-border-strong` + the words |

**The rule that binds both apps: no state is carried by colour alone.** Every coloured element in
this feature also carries either a number, a word, or an icon that says the same thing.

## 5.2 Accessibility

**Tap targets.** Admin: 44px floor below `md` (`Button` `min-h-11 md:min-h-0`, `Input`/`Select`
`h-11 md:h-9`, `TD h-11`, calendar cells ≈44px below `md` / 40px at `md`+). Client: everything
≥44px; the two capture buttons are `size="lg"` (48px); week-strip cells ≈44px.

**Focus.** Every calendar cell and every strip cell is a real `<button>` and inherits
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
2026." Empty tile: "Diesel, H S D. No density figure yet — no invoice has been captured for this
product."

**Screen readers — the calendar.** `aria-label` per cell, never just the day number:

- `"23 August 2026, photo sent by the dealer"`
- `"21 August 2026, photo added by the MDG team"`
- `"20 August 2026, no photo. Activate to upload on the dealer's behalf."`
- `"24 August 2026, today, no photo."`

The grid is `role="grid"` with `role="row"` / `role="gridcell"` wrappers and an
`aria-live="polite"` region carrying the counter line, so a change after an upload is announced.

**Screen readers — the client.** The week strip is a `<ul>` of buttons, each
`aria-label={t('density.a11yDay', { day, state })}`. The done card's tick is `aria-hidden`; the
heading text carries the meaning. Toasts already announce (`role="status"` in `Toast.tsx`).

**Motion.** `prefers-reduced-motion` already kills the sheet animations in both apps
(`index.css`). Nothing in this feature adds animation beyond the existing sheet/drawer entrances
and `animate-pulse` skeletons.

## 5.3 What this must NOT look like — the traps

1. **A dense data table as the primary admin view.** The invoice table is _below_ the hero and
   carries five columns. If someone adds invoice total, document number, delivery number, sales
   order, tank numbers and sample numbers as columns, the screen becomes the spreadsheet the
   owner asked us to avoid. Those fields belong in the viewer drawer.
2. **A PDF that downloads.** The list action is "View invoice", the frame is fed the _inline_
   signed URL, and Download is a ghost button in a footer. An `attachment` URL in an iframe
   navigates the tab away and destroys the open drawer — a bug this codebase has already been
   bitten by once (`CreditDodReportCard.tsx:100-135`).
3. **A blank grey rectangle on a phone.** Do not embed the PDF below `md` and do not rely on
   `hidden md:block` (a hidden iframe still downloads the file). Gate on `useMediaQuery` and
   render the facts + a single "Open the invoice PDF" button instead.
4. **A calendar that needs pinch-zoom.** Pinch-zoom is disabled app-wide
   (`maximum-scale=1.0` + the `gesturestart` guard). A month grid that overflows 358px on a
   390px phone is unusable, permanently. The `p-3` card padding and `gap-1` on the grid exist
   solely to keep the cells at 44px — do not "tidy" them to `p-4 gap-2`.
5. **A greyed-out Acknowledge button.** There must be no Acknowledge, Check or Vehicle Condition
   control in our UI in any state. A disabled one implies the capability exists.
6. **A staleness state shown only as a colour.** "The tile turned amber" is not a message. The
   day count is always in words.
7. **A fake upload progress bar.** `fetch` PUT gives no progress. A bar that jumps 0→100 teaches
   the dealer not to trust the screen.
8. ~~**A dealer screen that shows density numbers.**~~ **AMENDED — the dealer DOES see the
   figures.** This was written as a trap and it is not one: the owner's requirement is
   _"these extracted values are the important values … needs to be shown at the top in big
   fonts"_, and a dealer who cannot see the number on their own phone is still logging into the
   portal for it, which is the entire problem this service exists to remove. The real trap is
   narrower, and it is this: **a dealer screen that invites a comparison.** So the figures ship,
   and the fence is the wording — no unit, no "Density@15", no invoice, no rupees, no second
   number beside the first, no field to type into and nothing anywhere that implies MDG knows or
   cares what the dealer's own dip test said. §4.2.1 has the shape. Contract §2.2
   `TtDensityMeView`, §13 row 10.
9. **A "Retry?" toast.** Failures retry **in place**, on the card or in the sheet, holding the
   already-uploaded photo. Dead toasts that vanish before the dealer reads them are banned.
10. **Two primary buttons on one client card.** Today first; missed days are a quiet secondary
    line.

---

## 6. Deliberately not in this release

| Not shipping                             | Why, and what keeps the door open                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A typed measured density from the dealer | The owner's decision: the photo alone marks the day. The day record should carry an optional `measured?: Record<productKey, number>` field from day one so adding it later is additive, but **no UI, no label, no placeholder** ships for it now. |
| Any comparison of register vs invoice    | Same reason. Nothing on either screen should imply a comparison exists.                                                                                                                                                                           |
| The dealer seeing density figures        | One job per client screen. Revisit only with evidence a dealer asked.                                                                                                                                                                             |
| Per-product or per-tanker photos         | One photo per day for the whole outlet.                                                                                                                                                                                                           |
| Browsing replaced photos                 | Server keeps them for audit; no UI in v1.                                                                                                                                                                                                         |
| A custom PDF toolbar / page thumbnails   | Would cost a `pdfjs-dist` + worker in the admin bundle. Argue for it when a real need appears.                                                                                                                                                    |

## 7. Implementation checklist by file

_Amended: the authoritative file list is `docs/specs/tt-density-contract.md` §9 and §12.3,
which assigns every path to exactly one of five work packages. The list below is the same set
with the paths corrected — the pane-specific admin components live in a `ttDensity/` subfolder,
and the shared `ImageLightbox` does not._

**mdg-admin** _(package P5b)_

- `src/pages/dealers/vault/datasets.ts` — append the `tt-density` descriptor (`Icon: Gauge`)
- `src/pages/dealers/vault/DealerTtDensityPane.tsx` — new pane (model: `DealerInspectionPane.tsx`)
- `src/pages/dealers/vault/ttDensity/DensityHero.tsx` — new
- `src/pages/dealers/vault/ttDensity/InvoiceTable.tsx` — new
- `src/pages/dealers/vault/ttDensity/DayMarkCalendar.tsx` — new
- `src/pages/dealers/vault/ttDensity/InvoicePdfDrawer.tsx` — new (`Drawer` + iframe + `useMediaQuery`)
- `src/pages/dealers/vault/ttDensity/UploadDayPhotoDialog.tsx` — new (model: `UploadRecordDialog.tsx`)
- `src/pages/dealers/vault/ttDensity/useTtDensityRunWatcher.ts` — copy of `pages/dsr/useDsrRunWatcher.ts`
- `src/pages/dealers/vault/ttDensity/format.ts` — the pure bits. **`mdg-admin` has no test
  runner**, so anything decidable belongs here
- `src/components/ui/ImageLightbox.tsx` + `index.ts` — new shared primitive, migrate all 3 call sites
- `src/hooks/api/useTtDensity.ts` — new, with a `ttDensityKeys` prefix object
- `src/lib/serviceLabel.ts` — `'tt-density': 'TT Density'`
- (later, and **not in v1**) `src/pages/dataVault/datasets.ts` + `TtDensityPane.tsx` for the
  cross-dealer view — no package owns it, contract §12.5

**mdg-client** _(package P5c)_

- `src/App.tsx` — `lazyWithRetry` import + `<Route path="density">`
- `src/pages/DensityPage.tsx` — new (model: `KavachPage.tsx`)
- `src/features/density/DensityLatestStrip.tsx` — new, §4.2.1
- `src/features/density/DensityTodayCard.tsx` — new (model: `ComplianceTaskCard.tsx`)
- `src/features/density/DensityCaptureSheet.tsx` — new (model: `FinalizeSubmitSheet.tsx`)
- `src/features/density/DensityWeekStrip.tsx` — new
- `src/lib/uploadDensityPhoto.ts` — new (clone of `uploadStaffHardcopy.ts`)
- `src/hooks/api/useDensity.ts` — new (model: `useKavach.ts`, optimistic + rollback)
- `src/pages/ChatListPage.tsx` — render `DensityTodayCard` above the list when due
- `src/pages/ProfilePage.tsx` — one `Card` row, identical to the Staff Points row
- `src/lib/i18n.ts` — the `density.*` block, both languages

**mdg-app** _(package P5c — a separate git repo, one line, one commit)_

- `lib/bridge.ts` — `density: '/density'` in `DEEP_LINK_TOKENS`. Nothing else; camera is
  already granted on mount. It must ship before the first push is sent, or the tap opens the
  app's home screen.

**shared / backend** _(packages P1 and P5a — not this spec's to write)_

- `shared/src/schemas/chat.ts` — **`'tt-density'`** in the presign `scope` enum (mirror all four copies)
- `mdg-backend/src/routes/v1/uploads.ts` — the `tt-density` scope branch and
  `assertTtDensityDealerAccess`
