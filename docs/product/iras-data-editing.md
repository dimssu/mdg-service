# Spec — Editable IRAS shift data (the Shift Data Editor)

**Status:** Draft for build (PM-decisive)
**Owner:** Product
**Audience:** Backend, admin UX
**Surface:** `mdg-admin` only. Internal, desktop, English-only. Nothing here is dealer-facing.
**Supersedes:** the receipts modal (`mdg-admin/src/pages/dsr/DsrReceiptsDialog.tsx`)
**Related:** `shared/src/types/irasData.ts`, `shared/src/types/dsrReport.ts`,
`mdg-backend/src/services/irasData/store.ts`, `mdg-backend/src/services/dsr-report/{parse,compute,generate,receipts,reportStore}.ts`,
`mdg-admin/src/pages/dataVault/*`, `docs/STYLE_GUIDE_V2.md`

---

## 0. One paragraph

Today the IRAS Data Vault is a read-only window onto what the portal said, and exactly one
number in it can be corrected — the receipt — through a modal that lives in a different
part of the app. Every other figure a dealer is judged on (nozzle totalisers, tank dips,
net stock) is take-it-or-leave-it, even when the operator can see it is wrong and knows the
right answer. This spec makes **every field of a day's collected data correctable, in a
grid that behaves like a spreadsheet**, folds receipt entry into that same screen, routes
the corrected values into the DSR calculation, and reuses the staleness/regenerate machinery
the receipts flow already proved. Corrections are an **overlay** — the portal's own values
are never overwritten, so "what did IRAS actually say" is answerable forever.

---

## 1. Who and why

### The operator

One of a handful of MDG ops staff. Competent with Excel, not with data engineering. Knows
what a dip is, what a totaliser is, and which dealer rang up this morning. They are
**not** the person who wrote the DSR engine, they cannot read a Mongo document, and they
will not know that `PRODUCT_DIP` is divided by ten on its way to the report unless the
screen tells them. They correct data a few times a week, usually within a day or two of the
mistake, always because a dealer or a field visit told them something the portal does not
know.

The bar: **the operator must be able to fix a wrong number without being able to
accidentally re-attribute a tank, and must never be able to think they fixed something when
they edited a column no calculation reads.**

### The situations that bring them here

Ranked, because the ranking is the UI's priority order.

| #   | Situation                                                                                                                                                                                                                                                                                    | What is actually wrong                                                                                          | Frequency                                                                                                                                 | Fix shape                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **A tanker was decanted but never entered at the outlet.** The dealer says 12,000 L of HSD came in on the 14th; IRAS `REC` has nothing, so the DSR treats the day as a 12,000 L stock surplus and the variation blows past the 5.1.11 band.                                                  | Nothing is _wrong_; data is _absent_. There is no row to edit.                                                  | **Common** — the single most frequent reason anyone corrects DSR data. It is why the receipts override exists.                            | State the product's real receipt total (Receipts band).                                                                                             |
| 2   | **A nozzle totaliser is transposed or mistyped in the portal.** `TOT_READING` reads 1,234,567 where the meter says 1,235,467 (or a digit is dropped entirely).                                                                                                                               | One measured numeric, one row. Poisons sales for the previous day's close _and_ everything cumulative after it. | **Occasional** — a few times a month across the book.                                                                                     | Edit one `TOT_READING` cell.                                                                                                                        |
| 3   | **A shift was captured before the last delivery landed.** The configured shift time and the physical day-end drifted apart; the closing shift IRAS offered excluded a late tanker or a late nozzle read.                                                                                     | The whole day is anchored a shift too early. Multiple rows look low.                                            | **Occasional**, and clustered — when it happens to a dealer it usually happens repeatedly until the configured shift time is fixed.       | Usually **not** an edit: re-collect, and fix the dealer's shift time. The editor's job is to say so, not to let the operator hand-patch eight rows. |
| 4   | **A dip was read on the wrong tank.** Tank 3's and Tank 4's `PRODUCT_DIP` / `NET_QTY` are swapped, or one tank's sheet was entered under the other's number.                                                                                                                                 | Two rows' measured values, or (worse) one row's identity.                                                       | **Rare** — a handful a year, but expensive: two products' variations are both wrong and the surplus one suspends sales of _all_ products. | Swap the two rows' measured values (preferred), or re-attribute a row's `TANK_NO` (guarded).                                                        |
| 5   | **A duplicated or missing tank/nozzle row.** The portal returns `TANK_NO 3` twice (stock double-counts, because `computeProduct` **sums** `netQty` across a product's tanks), or omits a nozzle entirely (`todayPumps` yields `NaN`, the previous day's close is skipped, sales go unknown). | A whole row exists that should not, or does not exist and should.                                               | **Rare**                                                                                                                                  | Exclude a row / add a row.                                                                                                                          |

Two things follow from that table:

- **Case 1 is the common one, and it is not a cell edit.** It is a statement about a
  product's total. The existing product-level receipt override is the right shape for it and
  stays (see §5). A grid alone would not solve the most frequent problem.
- **Case 3 is a trap.** The screen must offer "Re-collect this day" at least as loudly as
  it offers editing, or the operator will hand-patch a whole shift's worth of rows and bury
  a configuration bug.

---

## 2. The journey

Screen state at each step. `D` = the business date being corrected.

### Happy path

1. **Find the day.** Two doors, both existing:
   - Cross-dealer: `/data-vault` → IRAS shift data → business-date control → dealer row →
     drawer (`SnapshotDrawer`). The drawer gains a primary **`Edit data`** button beside
     `Re-collect`.
   - Per-dealer: `/dealers/:id?tab=data-vault` → latest capture, or a row in _Capture
     history_. Same **`Edit data`** button on `SnapshotDetail`'s action slot.
   - A third door, because this is where the operator usually _starts_: the DSR report
     toolbar and the DSR empty state, where the `Receipts` button lives today. It becomes
     **`Edit shift data`** and deep-links to the editor for that report's date.

2. **The editor opens** at `/data-vault/dealers/:dealerId/days/:businessDate`, full page
   inside the admin shell (not a drawer — a 20-column grid does not fit 720px). Header:
   dealer name + code + RO, the date, the snapshot's `StatusChip`, `Collected at …`, and
   the shift anchor summary reused from `ShiftAnchorCard` — collapsed to one line
   (`Shift 05:59:59 · configured 06:00 · 2 other shifts were offered`) with a disclosure,
   because case 3 lives in that line. Actions: `Re-collect`, `Download CSV`,
   `Back to the Vault`.

3. **See portal value vs corrected value.** Three sections, in engine order:
   **Receipts (per product)** → **`REC`** → **`STK`** → **`TOT`**. Receipts first because
   it is case 1. Each dataset is a grid, expanded by default if it has ≤ 20 rows (all three
   normally do), collapsed with a row count otherwise. A cell that already carries a
   correction shows the corrected value in `text-text` semibold with a corner marker; the
   portal's own value is one hover/focus away, and always in the row's provenance popover.
   Above the grids sits the day's correction summary when there is one: _"This day has 3
   corrections. Reports are using the corrected figures."_

4. **Edit.** Click or arrow to a cell, type, Tab/Enter. Nothing has been saved. A sticky
   footer appears the instant there is one pending change (§4.6).

5. **Understand what it invalidated — before committing.** `Review & apply` opens a dialog
   that lists every pending change as `Dataset · Row · Field: portal → new`, states how
   many generated reports will need regenerating and from which date, warns separately and
   more loudly about any of those reports that has already been **shared** with the dealer,
   shows a **recomputed variation preview** for the affected products (`HSD variation would
move from +1,240 L — outside limit → −60 L — within limit`), and requires a one-line
   reason. `Apply 3 changes` commits.

6. **Regenerate.** Committing does **not** regenerate; identical to the receipts rule, and
   for the same reason (a regenerate can drive a portal session). On success the footer is
   replaced by a green line: _"3 changes applied. 14 reports now need regenerating."_ with
   a `Regenerate reports` button that hits the existing
   `POST /dsr/dealers/:dealerId/regenerate-stale` and watches the run with the existing
   `useDsrRunWatcher`. The existing `DsrStaleNotice` on every affected report shows the
   same thing wherever the operator lands next.

7. **Verify.** After the run lands, the editor's footer shows _"Reports rebuilt. Nothing on
   this dealer is out of date."_ — and the operator's real verification is the DSR itself:
   the notice offers `Open the report for <D>`. The variation card there must now match the
   preview they saw in step 5. That equality is the acceptance test for the whole feature.

### Unhappy paths

| Situation                                                                                             | Screen state                                                                                                                                                                                                                                                                   | Copy                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No snapshot for D**                                                                                 | No grids. `EmptyState` (Database icon) + primary `Collect now` (existing `CollectButton`, dated to D). **The Receipts band still renders and is still editable** — recording a receipt for a day the portal has nothing for is today's behaviour and must not regress.         | Title: _"Nothing has been collected for this day"_ · Body: _"There are no portal rows to correct yet. Collect the day first — it takes about a minute. You can still record a receipt below; it will be used the moment this day is generated."_                                            |
| **Snapshot `FAILED`**                                                                                 | No grids (a FAILED snapshot has `datasets: []`). Danger banner with `failureReason` verbatim + `Re-collect`. Receipts band still editable.                                                                                                                                     | Title: _"This collection failed"_ · then the portal's own reason · _"Correcting figures needs a collected day. Re-collect it, then come back."_                                                                                                                                             |
| **Snapshot `PARTIAL`**                                                                                | The datasets that are present are fully editable. Each missing one renders the existing dashed _"Not collected"_ strip, now with a `Re-collect` link and, secondary, `Add a row by hand`.                                                                                      | On the strip: _"`STK` was not collected for this day. Re-collecting is usually the right fix — adding tank rows by hand means typing every tank."_                                                                                                                                          |
| **The latest re-collection attempt failed but the day has data** (`lastFailure` set, status COMPLETE) | Grids fully editable. The existing warning-tone banner from `SnapshotDetail`, unchanged.                                                                                                                                                                                       | Existing copy: _"The data below is good — but the latest re-collection attempt failed."_                                                                                                                                                                                                    |
| **Dealer has no DSR service attached**                                                                | Grids fully editable (the Vault is service-independent; other readers may exist). The Receipts band is **disabled** with an inline notice, not a toast — `loadProducts` already throws exactly this sentence, so render it calmly. The consequence line in the footer changes. | Receipts band: _"This dealer does not have the Daily Sales Report service attached, so receipts cannot be attributed to a product. Attach it from the dealer's Services tab first."_ Footer: _"2 changes pending. This dealer has no Daily Sales Report, so no report needs regenerating."_ |
| **Dealer's DSR config is unparseable**                                                                | Same as above, with the existing second sentence.                                                                                                                                                                                                                              | _"This dealer's Daily Sales Report configuration is incomplete, so receipts cannot be attributed to a product. Fix the service configuration first."_                                                                                                                                       |
| **A re-collection lands after an edit**                                                               | See §3.4 in full. Two sub-cases, both banner-level, both non-destructive: a corrected row **still exists** (correction still wins, banner notes the portal changed underneath) or a corrected row **is gone** (correction is _orphaned_, not applied, listed for review).      | See §3.4 for exact strings.                                                                                                                                                                                                                                                                 |
| **Report for D was already SHARED with the dealer**                                                   | The `Review & apply` dialog gains a distinct danger block above the confirm. Committing is still allowed.                                                                                                                                                                      | _"The report for Fri, 14 Aug 2026 was already shared with this dealer on 15 Aug, 09:12. They have the old figures on their phone. After you regenerate, the report is no longer marked shared — you will need to share it again and tell them what changed."_                               |
| **Another admin changed the same day while this one was editing**                                     | Commit fails with 409. Nothing is merged. Pending changes are kept in the footer so nothing is lost.                                                                                                                                                                           | _"Somebody else changed this day while you were editing. Reload to see their changes, then apply yours again."_ + `Reload` button.                                                                                                                                                          |
| **Dealer is archived**                                                                                | The route loads read-only; every editable affordance is disabled. Write route rejects via the existing `assertDealerNotArchived`.                                                                                                                                              | _"This dealer is archived. Their data is read-only."_                                                                                                                                                                                                                                       |
| **Future date / impossible date in the URL**                                                          | Redirect to the Vault, same clamp the Vault already applies (`MIN_SELECTABLE_YMD` … IST today). No error.                                                                                                                                                                      | —                                                                                                                                                                                                                                                                                           |
| **Viewport < 900px**                                                                                  | Grids render as the existing read-only key/value cards. Every editable affordance replaced by one notice.                                                                                                                                                                      | _"Editing needs a wider screen. Open this day on a laptop to correct figures."_                                                                                                                                                                                                             |
| **Operator navigates away with pending changes**                                                      | `beforeunload` guard + in-app route guard. Pending set is also mirrored to `sessionStorage` keyed by `(dealerId, businessDate)` and restored on return with a dismissible line.                                                                                                | Guard: _"You have 3 changes that have not been applied. Leave anyway?"_ · On restore: _"You have 3 unapplied changes from earlier. [Review & apply] [Discard]"_                                                                                                                             |

---

## 3. The data model and the blast radius

This section exists because the wrong storage choice here silently destroys operator work
and silently changes dealers' reports. It is the load-bearing decision of the spec.

### 3.1 Corrections are an overlay, never a write into the snapshot

**Decision: a new collection, `IrasDataCorrection`. `IrasDataSnapshot.datasets` is never
mutated by an operator.**

Three reasons, all mechanical:

1. `saveSnapshot` (`services/irasData/store.ts`) upserts by `(dealerId, businessDate)` and
   **replaces `datasets` wholesale**. Any correction written into the snapshot is destroyed
   by the next collection of that day — scheduled, `Collect now`, `Re-collect`, or the
   nested collection the DSR plugin drives for a back-date. The operator's work would
   vanish and a dealer's report would silently revert. This is precisely the reasoning
   `DsrManualReceipt` already documents ("the override lives in its own collection… here it
   survives re-collection and regeneration alike").
2. Question 1 of §6 is _"what did the portal actually say?"_ An in-place edit makes that
   unanswerable. `rawStorageKey` is not a substitute — it is the pre-filter response in
   artifact storage, not a per-cell before value.
3. The generic `columns` + `rows: Record<string,string>` shape exists so IRAS can add
   columns without a migration. An overlay keyed by field name preserves that; a typed
   patch schema would not.

Shape (contract goes in `shared/src/types/irasData.ts` beside `IrasDataSnapshot`, since
this is Vault data, not DSR data):

```
IrasDataCorrection
  id, dealerId, businessDate            // (dealerId, businessDate) is the day key
  code: IrasReportCode                  // 'TOT' | 'STK' | 'REC'
  rowKey: string                        // §3.2
  kind: 'FIELD' | 'ADDED_ROW' | 'EXCLUDED_ROW' | 'REATTRIBUTED'
  field?: string                        // FIELD only — the IRAS field key
  portalValue?: string | null           // what the portal said at the moment of the edit; null when the row/field did not exist
  value?: string | null                 // what it should be; null on EXCLUDED_ROW
  row?: IrasRow                         // ADDED_ROW only — the whole hand-entered row
  reason: string                        // required, commit-level, inherited per change
  by, at, updatedBy, updatedAt
  // Set by the apply step when the portal later disagrees or the row disappears:
  portalValueAtLastCollection?: string | null
  orphanedAt?: string | null
```

Unique on `(dealerId, businessDate, code, rowKey, field)`; index `(dealerId, businessDate)`
and `(dealerId, businessDate, code)`.

A day also carries a **revision counter** (`IrasDataCorrectionRevision`, or simply the max
`updatedAt` across the day's corrections) used for the optimistic-concurrency check in §2's
409 case.

### 3.2 Row identity — how a correction stays pinned to the right row

Rows have no id. A positional index is not survivable: the portal can return a different
row count or order on re-collection, and a correction that slides onto a different nozzle is
worse than no correction at all.

**Decision: a per-code natural key, computed by one exported function
`irasRowKey(code, row, ordinalWithinKey)`.**

| Code  | `rowKey`             | Why                                                                                                                                                    |
| ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TOT` | `NOZZLE_NO=<v>`      | One row per nozzle. `parseTot` already treats `NOZZLE_NO` as the row's identity, and `todayPumps` looks rows up by it.                                 |
| `STK` | `TANK_NO=<v>`        | One row per tank. `parseStk` keys on it; `stkRowsForProduct` filters on it.                                                                            |
| `REC` | `TANK_NO=<v>#<n>`    | A tank can legitimately receive two tankers in a day, so the tank alone is not unique. `n` is the 1-based ordinal of that tank's rows in portal order. |
| any   | `idx=<n>` (fallback) | Used only when the natural key is blank or duplicated. Marked `positionBound` and treated as orphan-prone (see below).                                 |

Guardrails, because `REC`'s ordinal and the `idx` fallback are the fragile ones:

- On apply, if a correction's `rowKey` is absent from the current snapshot → **orphaned**
  (§3.4). Never re-applied to a neighbouring row.
- On apply, if the **row count for a `REC` tank changed** since the correction was made,
  every `REC` correction on that tank is orphaned even if the ordinal still resolves. A
  second tanker appearing must not silently inherit the first one's correction.
- `idx=` corrections are orphaned by **any** change to that dataset's row count.

Backend tests must cover: reorder without count change (corrections hold), count change on
`REC` (orphaned), a nozzle disappearing (orphaned), a nozzle reappearing after being
orphaned (re-offered for review, **not** auto-re-applied).

### 3.3 Where corrections enter the calculation — exactly one seam

**Decision: `store.ts` gains `getEffectiveSnapshot(dealerId, businessDate)` which returns
`{ snapshot, corrections, orphaned }` where `snapshot.datasets` already has corrections
applied. `getSnapshot` stays raw and untouched.**

Call-site changes, and that is the whole list:

| Caller                                                                    | Today                               | After                                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dsr-report/generate.ts` (`generateDsr`)                                  | `getSnapshot`                       | `getEffectiveSnapshot` — this is the line that makes calculations use corrected data. Nothing else in `generate.ts` changes; `snapshotToInputs`, `computeProduct` and the ledger writes are untouched.      |
| `dsr-report/receipts.ts` (`irasReceiptsFor`)                              | `getSnapshot`                       | `getEffectiveSnapshot`, so the "portal says" figure in the Receipts band matches what the engine would use. **The label changes** (§5.4) — it is no longer purely the portal's number.                      |
| `dsr-report/index.ts` (`ensureIrasSnapshot`, `resolveTargetDate`)         | `getSnapshot` / `getLatestSnapshot` | **Unchanged.** These ask "is there a complete snapshot for this day"; a correction never changes the answer, and routing that gate through the overlay would only add failure modes to the collection path. |
| `routes/v1/irasData.ts` `GET /snapshots/:id`, `/dealers/:dealerId/latest` | raw                                 | **Unchanged**, so nothing that reads the Vault API today changes shape. The editor uses its own new endpoint (§7).                                                                                          |
| `routes/v1/irasData.ts` `GET /snapshots/:id/export.csv`                   | raw                                 | Effective, with `-corrected` appended to the filename when the day has corrections, so the CSV and the screen never disagree. Client-side `datasetToCsv` matches.                                           |

Everything else that reads the Vault (`listSnapshotSummaries`, `getSnapshotsForDate`,
`getLastCapturedAt`, the overview counters) projects rows away and is untouched.
`rowCount` / `rawRowCount` keep meaning "what the portal returned" — an added or excluded
row does **not** move them; the editor shows `13 rows · 1 added, 1 excluded` instead.

Because `parse.ts` coerces strings to numbers in exactly one place, the applied overlay must
write **strings** back into `rows`, keeping the generic contract intact and reusing every
existing coercion, blank-handling and `Number.isFinite` guard. No new numeric parsing.

### 3.4 A re-collection arriving after an edit

Three outcomes, all handled at apply time (`getEffectiveSnapshot`), all non-destructive.

1. **Row and field still there, portal value unchanged.** Correction applies. Nothing to
   say.
2. **Row still there, portal value changed underneath.** The correction still wins (it is an
   override), and the cell gains a `portal-changed` state. Day banner:
   _"The portal re-sent this day on 16 Aug, 06:31 and now reports different values for 2
   cells you had corrected. Your corrections are still being used. Check whether they are
   still needed."_ Each such cell's popover shows three lines: `Portal originally`,
   `Portal now`, `You set`. Per cell: `Keep mine` (dismiss the flag) / `Use the portal's
new value` (a revert).
3. **Row is gone (or `REC` ordinals moved).** Correction is **orphaned**: not applied, not
   deleted. Warning banner:
   _"2 corrections no longer match this day's data — the rows they were made on are not in
   the latest collection. They are not being used. [Review them]"_ `Review them` opens a
   list showing each orphan (dataset, row key, field, portal-then, your value, reason,
   who/when) with `Discard` and, when the row has come back, `Re-apply`.

**In all three cases, the effective inputs for D changed**, so the apply step calls
`markReportsStaleFrom` for the affected date — meaning a re-collection of a day **that has
corrections** marks reports stale. Reason string:
_"This day was collected again on 16 Aug, and 2 of the corrections on it no longer match, so
this report's figures no longer match its inputs."_

> **Known pre-existing gap, deliberately not fixed here:** a re-collection of a day with
> **no** corrections does not mark existing reports stale today either, even though the raw
> figures may have changed. That hole predates this feature and closing it touches the
> collector for every dealer. Listed in §9 and in §10 for the owner's call.

### 3.5 Staleness — and the one place the existing rule is wrong

Reuse `markReportsStaleFrom(dealerId, fromDate, { reason, productKey, by })` verbatim. It
already flags `businessDate >= fromDate` because variation is cumulative, already returns
the affected dates, and `DsrStaleNotice` + `regenerate-stale` already consume that.

**But `fromDate` is not always `D`.** Sales for day `D-1` are closed by day `D`'s meter
readings:

```
sales(D-1) = Σ( TOT_READING(D) − TOT_READING(D-1) ) − testing(D)
```

So a correction to a `TOT.TOT_READING` on day `D` changes **`D-1`'s report**, which
`markReportsStaleFrom(D)` would not flag. Per-field rule:

| What changed                                                      | `fromDate`                                     |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| `TOT.TOT_READING` (edit, added row, excluded row, re-attribution) | `previousDate(D)`                              |
| everything else (`STK.*`, `REC.*`, receipts)                      | `D`                                            |
| a commit containing both                                          | the earlier of the two, i.e. `previousDate(D)` |

`regenerate-stale` already copes: it starts at the earliest date that needs work, and the
plugin generates `[previousDate(target), target]` then heals the forward chain.

Two consequences for copy and contracts:

- `DsrReportStale`'s doc comment in `shared/src/types/dsrReport.ts` currently says _"a stale
  report is wrong in its variation panel, not its ledger"_. That is true for a receipt and
  **false** for a totaliser correction. The comment must be corrected, and the stale reason
  for a `TOT` change must say so: _"A meter reading for 15 Aug was corrected, so this
  report's sales and stock variation no longer match its inputs."_
- `DsrReportStale.productKey` stays `null` unless every change in the commit maps to exactly
  one product (via the dealer's `tankNos` / `nozzleNos`).

`saveReport`'s `computedFrom` guard already protects the "corrected while a run was
computing" race. No change.

### 3.6 What this feature must not touch

Explicitly verified as out of the blast radius, and the build must keep it that way:

- The collector (`services/iras-shift-data/*`), `saveSnapshot`, `recordSnapshotFailure`.
- `computeProduct` / `compute.ts` — a pure function pinned to a real workbook by
  `compute.test.ts`. Corrections change its **inputs**, never its arithmetic. Those tests
  must still pass byte-for-byte.
- The DSR ledger (`dsr-report/store.ts`), the report doc, the HTML/xlsx/card renderers, the
  share path.
- `DsrManualReceipt` and every one of its endpoints (§5).
- The PAD ledger and Inspection Reports Vault datasets.
- Anything dealer-facing: `mdg-client`, `mdg-app`, the report cards, the chat share text.

---

## 4. The editing UX

### 4.1 It reads as a spreadsheet, not a form

Built on the existing `Table` / `THead` / `TRow` / `TH` / `TD` primitives from
`mdg-admin/src/components/ui`, in the admin's existing blue/slate tokens. **No new
dependency.** ag-grid and Handsontable are both rejected: 100–300 kB gzipped for a grid
that is at most ~20 columns × ~20 rows, a second visual language inside a small admin, and
in Handsontable's case a licence question — none of which is worth avoiding one keyboard
hook. If a dataset ever exceeds **500 rows** the grid renders read-only with the existing
_"Show N more rows"_ escape hatch and a notice; today's datasets are 1–15 rows.

Layout per dataset:

```
┌ REC · Receipts / decantation ────────── 2 rows · 1 corrected ──── [Used in the report ▣] [Download CSV] ┐
│ ▸ gutter │ ● Tank no 🔒 │ ● Net qty decanted │ ● Product code 🔒 │ … hidden inert columns …              │
│    ⋮     │      3       │     12,000  ◤      │        HS         │                                      │
│    ⋮     │      4       │      4,000         │        MS         │                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Left gutter** (56px, pinned): row state — a correction count badge (`2 edits`), an
  `Added` / `Excluded` chip, and a `⋯` menu (`Revert row`, `Exclude row`, `Change tank /
nozzle this row belongs to`).
- **First data column pinned** (`sticky left-0`), exactly as `DatasetTable` already does, so
  a wide report stays readable when the grid scrolls horizontally **inside its own card**,
  never the page body.
- **Column headers carry the field class** (§5.1): a filled dot for load-bearing, a padlock
  for identity, and inert columns are hidden by default behind the `Used in the report`
  toggle.
- Numerics right-aligned, `tabular-nums`, thousands-separated for display and raw on edit.
- `min-w-0` and `whitespace-nowrap` per cell; the grid's own `overflow-x-auto` container.
  Below 900px, read-only cards (§2).

### 4.2 Cell states

Ten, each with a distinct visual and each earning its place. Tokens are the admin's
existing ones.

| State                                | Visual                                                                                                                           | Meaning                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Untouched**                        | `text-text-muted`, no marker                                                                                                     | The portal's value, unmodified.                                                                          |
| **Pending** (uncommitted)            | `bg-info-soft`, `text-text` semibold, dashed left border                                                                         | Typed in this session, not applied.                                                                      |
| **Corrected** (committed)            | `text-text` semibold + a small corner triangle `◤` in `brand`                                                                    | An `IrasDataCorrection` is in force.                                                                     |
| **Portal changed underneath**        | Corrected styling + corner triangle in `warning`                                                                                 | §3.4 case 2.                                                                                             |
| **Orphaned**                         | `text-text-subtle` with a `warning` dotted underline, rendered in the review list rather than in place when the row is gone      | §3.4 case 3.                                                                                             |
| **Invalid**                          | `border-danger`, `bg-danger-soft`, message under the cell                                                                        | Fails validation; blocks commit.                                                                         |
| **Locked — identity**                | `bg-surface-2`, `text-text-muted`, padlock on hover, not focus-editable                                                          | `TANK_NO`, `NOZZLE_NO`, `PRODCODE`. Change via the row menu.                                             |
| **Locked — overridden by a receipt** | `bg-surface-2`, strikethrough value, tooltip                                                                                     | A `REC` row whose product has a manual receipt total; the cell cannot affect the report.                 |
| **Inert**                            | Hidden by default. When revealed: `text-text-subtle` italic, header pill `not used`                                              | Editable, affects no calculation.                                                                        |
| **Added row / Excluded row**         | Added: whole row `bg-info-soft` + `Added` chip. Excluded: `line-through`, `opacity-60`, `Excluded` chip, `Restore` in the gutter | Row-level changes. Excluded rows stay visible — a removed row that disappears is a row nobody can audit. |

### 4.3 Keyboard model

One `<input>` is mounted only in the cell being edited; the rest are plain `<td>`s with
`tabIndex` managed by a roving-tabindex grid, so a 400-cell grid stays cheap and screen
readers get a real `role="grid"`.

| Key                                   | Behaviour                                                                                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `↑ ↓ ← →`                             | Move the selection. Skips locked and hidden columns. Stops at edges (no wrap — wrapping in a money grid disorients).                                                                                                                                   |
| `Tab` / `Shift+Tab`                   | Commit the cell being edited, move right / left, wrapping to the next / previous row.                                                                                                                                                                  |
| `Enter`                               | Commit the cell, move **down**. On the last row, stay.                                                                                                                                                                                                 |
| `Shift+Enter`                         | Commit, move up.                                                                                                                                                                                                                                       |
| Typing a character on a selected cell | Enters edit mode, **replacing** the value (Excel behaviour).                                                                                                                                                                                           |
| `F2` or double-click                  | Edit in place, caret at the end.                                                                                                                                                                                                                       |
| `Esc`                                 | Abandon the cell being edited, restore its previous value. A second `Esc` clears the selection.                                                                                                                                                        |
| `Backspace` / `Delete`                | Clear the cell to empty. On a load-bearing field this raises a warning, not a block — an empty `TOT_READING` makes `parseTot` drop the row entirely, which the operator must be told: _"An empty meter reading removes this nozzle from the report."_  |
| `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z`     | Undo / redo across the **pending** change set (including added and excluded rows). Never touches the server. Depth 50.                                                                                                                                 |
| `Cmd/Ctrl+C`                          | Copy the selected cell, or the whole row with the row selected, as TSV.                                                                                                                                                                                |
| `Cmd/Ctrl+V`                          | Paste. A single value fills the selected cell. A TSV/multiline clipboard fills the rectangle from the selection, **skipping** locked and hidden columns, then reports: _"Filled 4 cells. Skipped 2 — Tank no and Product code cannot be edited here."_ |
| `Home` / `End`                        | First / last editable column in the row.                                                                                                                                                                                                               |
| `Cmd/Ctrl+Enter`                      | Open `Review & apply`.                                                                                                                                                                                                                                 |
| `?`                                   | Keyboard shortcut sheet.                                                                                                                                                                                                                               |

No drag-fill handle in v1. Accessibility: `role="grid"`/`gridcell`, `aria-readonly` on
locked cells, `aria-invalid` on invalid ones, and an `aria-live="polite"` region announcing
`3 changes pending` and paste results.

### 4.4 How a corrected cell shows the portal's original

Three depths, so the common case costs nothing and the audit case is always reachable:

1. **At a glance:** the corner triangle. Spreadsheet convention for "there is a note here."
2. **On hover / focus:** a popover, ~280px:
   ```
   Net qty decanted · Tank 3
   Portal said        0
   Now                12,000
   Changed by         Rahul Sharma · 14 Aug 2026, 09:12
   Reason             Tanker decanted, not entered at the outlet
   [Revert this cell]
   ```
   With a portal-changed flag it gains a `Portal now  11,800` line and a
   `[Use the portal's new value]` button.
3. **Side by side:** a header toggle `Show portal values` splits every corrected cell into
   two stacked lines — the portal's in `text-text-subtle line-through` above, the corrected
   value below. Off by default (it doubles row height); the one control an operator reaches
   for when reconciling a whole day against a paper DSR book.

### 4.5 Save model — explicit commit, not per-cell autosave

**Decision: an explicit `Apply N changes` commit.**

Justification, in order of weight:

1. **Every save invalidates reports.** A commit calls `markReportsStaleFrom`, which touches
   _every_ report from that date forward. Autosaving each cell would fire that N times for
   one logical correction, write N audit entries, and produce N regeneration prompts.
   Fixing a transposed pair of nozzles is 2 cells; swapping two tanks' dips is 4.
2. **The consequence must be shown before the fact.** _"3 changes will make 14 reports need
   regenerating, one of which is already shared with the dealer"_ has no place to live in an
   autosaving UI.
3. **Multi-cell corrections pass through an invalid intermediate state.** Halfway through a
   swap, both tanks hold the same dip. Autosave would push that into the ledger the moment
   somebody regenerated.
4. **A commit is where the reason lives.** One sentence per correction event, not per cell.
5. **Loss is the only cost, and it is cheap to fix properly:** a `sessionStorage` draft plus
   navigation guards (§2) beat autosave without any of its costs.

The commit is **all-or-nothing** on the server: one request, one transaction-shaped write,
one `markReportsStaleFrom`, one audit entry. A partial apply would leave the operator
unable to answer "what state is this day in?"

### 4.6 Surfacing the consequence before commit

**The sticky footer** — appears on the first pending change, `bg-surface`, top border,
`shadow`, full width of the content column:

```
3 changes pending · 14 reports will need regenerating, from Thu, 14 Aug 2026
1 of them has already been shared with the dealer          [Discard all]  [Review & apply]
```

The report count comes from the day's payload (§7): the editor already holds the dealer's
report dates, so `reportsAffected = reports.filter(d => d >= fromDate)` needs no round trip
and updates live as changes are added — including the `fromDate` shift to `previousDate(D)`
the moment a `TOT_READING` is touched.

**The `Review & apply` dialog** (`Dialog size="lg"`), top to bottom:

1. **What you are changing** — a compact table, grouped by dataset:
   `REC · Tank 3 · Net qty decanted    0 → 12,000`
   `TOT · Nozzle 5 · Meter reading    1,234,567 → 1,235,467`
   Added rows as `STK · Tank 4 · added by hand`, exclusions as
   `STK · Tank 3 (duplicate) · excluded`.
2. **What it changes in the report** — the recomputed preview (§7, `POST …/preview`):
   ```
   HSD    variation  +1,240 L  outside limit  →  −60 L  within limit
   MS     variation     −22 L  within limit   →  −22 L  unchanged
   ```
   If the preview call fails, the dialog says so and still allows the commit:
   _"The preview could not be calculated. Your changes can still be applied — check the
   report after regenerating."_
3. **What needs regenerating** — the date list, oldest first, capped at 6 with `+ 8 more`.
4. **The shared warning**, when applicable — `bg-danger-soft`, the §2 copy.
5. **The inert-only guard**, when applicable — see §5.3.
6. **Reason** (`Textarea`, required, 3–500 chars, placeholder _"e.g. Tanker decanted on the
   14th, invoice 88231 — not entered at the outlet"_). One reason for the commit; it is
   stored on every correction in it.
7. Footer: `[Cancel]` `[Apply 3 changes]`.

### 4.7 Exact microcopy

Page:

- Title: `Shift data · {dealer name}` · Subtitle: `{Thu, 14 Aug 2026} · collected {…}`
- Intro line under the header: _"Correct what the portal got wrong. Your corrections are
  used by the report; the portal's own values are kept and always visible."_
- Column toggle: `Used in the report` (on) / `Show all portal columns` (off). Helper on
  hover: _"Hidden columns are stored but no calculation reads them."_

Banners:

- Has corrections: _"This day has {n} corrections. Reports are using the corrected
  figures. [Show portal values] [Revert this day]"_
- Portal changed underneath: _"The portal re-sent this day on {when} and now reports
  different values for {n} cells you had corrected. Your corrections are still being used.
  Check whether they are still needed."_
- Orphans: _"{n} corrections no longer match this day's data — the rows they were made on
  are not in the latest collection. They are not being used. [Review them]"_
- Applied, nothing to regenerate: _"{n} changes applied. No generated report is affected
  yet."_
- Applied, reports affected: _"{n} changes applied. {m} reports now need regenerating.
  [Regenerate reports]"_
- Rebuilding: _"Rebuilding from {date} — this updates when it lands."_
- Rebuilt: _"Reports rebuilt. Nothing on this dealer is out of date. [Open the report for
  {date}]"_

Cell tooltips:

- Load-bearing: _"Used by the report."_ (plus the field's own hint, below)
- Identity, locked: _"This is how the row is matched to a tank and a product. Changing it
  moves the whole row's figures to a different product — use ⋯ → Change tank / nozzle."_
- Inert: _"Stored, but no calculation reads this. Editing it will not change any report."_
- Locked by a receipt: _"HSD has a receipt entered by hand ({12,000 L}), which replaces the
  portal's decantation figures for its tanks. Clear that receipt to make this cell matter."_
- `PRODUCT_DIP`: _"Type the number exactly as the portal shows it. The report divides it by
  10 to print the dip."_
- `TOT_READING` while editing, live: _"Yesterday 1,234,567 → this is 900 L for the day."_
- `NET_QTY`: _"This is the tank stock the report opens the day with. A product's tanks are
  added together."_
- Empty on a load-bearing field: _"An empty value removes this row from the report."_

Confirms:

- Exclude row: title `Exclude this row?` · body _"The row stays visible and can be restored.
  The report will behave as if the portal never sent it."_ · `[Cancel] [Exclude]`
- Revert row: _"Remove all {n} corrections on this row and go back to what the portal said?"_
- Revert day: _"Remove all {n} corrections on {date} and go back to what the portal said?
  Reports built from them will need regenerating."_ · `[Cancel] [Revert the day]`
- Re-attribute: title `Change which tank this row belongs to` · body _"This row's figures —
  stock 12,340 L, dip 1,234 — will move from Tank 3 (HIGH SPEED DIESEL) to Tank 4 (MOTOR
  SPIRIT). Both products' stock variation will change."_ · a `Select` of the tanks in the
  dealer's DSR config · required reason · `[Cancel] [Move this row]`

Errors:

- Identity collision on add / re-attribute: _"Tank 4 already has a row in this day's stock
  report. Two rows for one tank would count its stock twice. Correct the existing row
  instead."_
- Unknown tank on add: _"Tank 7 is not in this dealer's Daily Sales Report configuration, so
  no product will pick it up. Add it anyway?"_ (warning, not a block)
- Not a number: _"Enter a number. No commas, no units."_
- Negative: _"This cannot be negative."_
- Save failed: _"Your changes were not applied. Nothing has changed. {server message}"_

---

## 5. Field policy

### 5.1 The classification lives with the engine, not the UI

**Decision: one exported table, `mdg-backend/src/services/dsr-report/fields.ts`, served to
the admin as `fieldPolicy` on the day payload (§7). `parse.ts` reads the same table.**

This is the anti-drift decision. If the load-bearing list is hardcoded in a React component,
the day someone teaches the engine to read `WATER_QTY` the UI will still be calling it
inert — and the operator will believe a tooltip that is lying about money. Reading the
policy from the engine's own module makes that class of bug impossible, and lets an unknown
column the portal adds tomorrow default to **inert + a "we don't know this column" note**
rather than to "safe to edit."

Shape: `{ field, headerName, class: 'MEASURED' | 'IDENTITY' | 'INERT' | 'UNKNOWN', hint?, validate? }`.

### 5.2 Measured numerics — freely editable

| Code  | Field                      | What it drives                                                                                                                                                                                                                                                                                                                                 |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TOT` | `TOT_READING`              | Sales for `D-1`, cumulative sales, and via testing the whole variation chain. **The only field whose staleness starts at `previousDate(D)`.**                                                                                                                                                                                                  |
| `STK` | `PRODUCT_DIP`              | The printed dip (`÷ 10`).                                                                                                                                                                                                                                                                                                                      |
| `STK` | `WATER_DIP`                | The printed water dip.                                                                                                                                                                                                                                                                                                                         |
| `STK` | `NET_QTY`                  | Opening stock, summed across a product's tanks.                                                                                                                                                                                                                                                                                                |
| `REC` | `NET_QTY_DECANTED`         | The receipt total, summed across a product's tanks — unless a manual receipt overrides it.                                                                                                                                                                                                                                                     |
| `STK` | `PRODUCT_QTY`, `WATER_QTY` | Parsed into `StkRow` but **not read by `computeProduct` today.** Class `MEASURED`, with the hint _"Stored, but today's report does not use this number."_ Deliberately not `INERT`: they are measured quantities the engine already carries and may consume, and mislabelling them the day it does is the failure mode §5.1 exists to prevent. |

Validation: finite number, `>= 0`, `<= 99,999,999`, at most 3 decimals, no thousands
separators accepted on input (display formats them). Warnings that do not block: a
`TOT_READING` **lower** than the same nozzle's previous-day reading (_"Meters do not run
backwards — yesterday this nozzle read 1,235,467."_), and the live implied-litres hint. The
backwards-meter warning is the single highest-value check in the feature: it catches exactly
the transposition of case 2. It needs the previous day's `TOT` readings, which the day
payload carries (§7).

### 5.3 Identity / key columns — locked, with a guarded re-attribution

`TOT.NOZZLE_NO`, `TOT.TANK_NO`, `STK.TANK_NO`, `REC.TANK_NO`, `PRODCODE` (all datasets).

**Decision: locked as cells; changeable only through `⋯ → Change which tank / nozzle this
row belongs to`, which is a dialog with a plain-English impact statement, a collision block,
and a required reason. `TOT.PUMP_NO` is inert (parsed to `pumpNo`, read by nothing).**

Why not freely editable: these are not values, they are **joins**. `stkRowsForProduct` and
`receiptForProduct` select purely on `tankNos` membership, and `todayPumps` looks up by
`nozzleNo`. Retyping `TANK_NO` from 3 to 4 does not correct a number — it silently moves an
entire row's stock and receipts from one product to another. Two rows on tank 4 and the
product's opening stock **doubles** (`reduce((s, r) => s + r.netQty, 0)`); zero rows and it
becomes 0 with only a warning. Either outcome moves the variation past the 5.1.11 band, and
a positive variation suspends sales and supplies of **all** products immediately. That is
far too much consequence for a two-keystroke inline edit that looks like fixing a typo.

Why not hard-locked either: case 4 is real. Denying it does not make the data right — it
pushes the operator into the genuinely destructive workaround of editing the _numbers_ until
the report "comes out right", which destroys the audit trail and teaches everyone that the
provenance popover is fiction. A rare, deliberate, explained, guarded action is strictly
better than a common, undocumented lie.

Guards on the dialog:

- Destination must be a tank/nozzle in the dealer's DSR config (`tankNos` / `nozzleNos`
  union) — otherwise a warning that the row will be picked up by no product.
- Destination must not already have a row in this dataset for this day — hard block, with
  the double-count sentence from §4.7.
- The impact statement names both products by their `labelEn` and quotes the figures moving.
- Reason required. Stored as `kind: 'REATTRIBUTED'` and audited distinctly from a field edit.
- **Preferred alternative offered first**, in the dialog's own body: _"If two tanks' dips
  were simply swapped, correcting the two dip values is safer than moving a row."_

### 5.4 Inert columns — editable but visibly harmless

Everything else the portal sends: `NOZZLE_STATUS`, `PUMP_NO`, shift dates/times, RO codes,
truck numbers, checklist serials, and any column IRAS adds tomorrow (class `UNKNOWN`,
treated as inert with an extra note).

Editable, because the Vault is the record of what the portal said and an operator may
legitimately annotate it, but **inert** in the sense that no calculation reads them. The
worst outcome in this whole feature is an operator who believes they fixed a number and
actually edited a column nothing reads. Four defences, layered:

1. **Hidden by default.** The `Used in the report` toggle is ON when the screen opens. The
   operator who came to fix a number sees only the columns that can fix a number. They must
   deliberately choose `Show all portal columns` to see the rest.
2. **Different typography when shown.** `text-text-subtle` italic values, and a `not used`
   pill in the header next to the header name. Load-bearing headers carry a filled dot and
   semibold `text-text`.
3. **Tooltip on focus** (not just hover, so keyboard users get it): _"Stored, but no
   calculation reads this. Editing it will not change any report."_
4. **A commit-time guard.** If the pending set contains **only** inert edits, the
   `Review & apply` dialog leads with an info block — _"None of these changes affect any
   report. They will be recorded against this day, but no figure and no report will
   change."_ — the reason field is still required, and the button reads `Apply anyway`. No
   report is marked stale, no regeneration is offered.

### 5.5 Rows — adding and removing

| Code  | Add     | Exclude | Why                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STK` | **Yes** | **Yes** | A missing tank row makes opening stock 0 with only a warning; a duplicate tank row **doubles** it, because `stkRowsForProduct` sums. Both are unfixable by cell edits.                                                                                                                                                                                                                                                        |
| `TOT` | **Yes** | **Yes** | A missing nozzle makes `todayPumps` produce `NaN`, which skips the previous day's close entirely — sales unknown, and the gap propagates.                                                                                                                                                                                                                                                                                     |
| `REC` | **No**  | **No**  | Both cases — a missing tanker and a duplicated decantation — are exactly what the product-level receipt override already expresses, correctly, at the level the engine consumes (a product total, across tanks). Offering two ways to say the same thing would let an operator add a `REC` row for a product that also has a manual receipt, where the manual receipt silently wins and the added row does nothing. One path. |

Guardrails on add:

- Every load-bearing field for the code must be filled — `TOT`: `NOZZLE_NO`, `TOT_READING`,
  `TANK_NO`, `PRODCODE`; `STK`: `TANK_NO`, `PRODCODE`, `PRODUCT_DIP`, `WATER_DIP`,
  `NET_QTY`. Inert columns are left blank, which is what `parse.ts` already tolerates.
- The identity value must not collide with an existing row in that dataset for that day —
  **hard block** (the double-count guard).
- The tank/nozzle should exist in the dealer's DSR config — warning, not a block; the config
  can lag reality.
- An added row is visibly `Added` forever, in `bg-info-soft`, and its provenance popover says
  who added it, when, and why.
- Maximum 10 added rows per dataset per day. Beyond that the honest answer is a re-collection
  or a configuration fix, and the notice says so.

Guardrails on exclude:

- It is an **exclusion**, not a delete. The row stays in the grid, struck through, with
  `Restore`. Nothing is ever removed from `IrasDataSnapshot`.
- Excluding the **last** row for a tank or nozzle that a product depends on raises a warning
  in the confirm: _"HIGH SPEED DIESEL has no other stock row after this. Its opening stock
  will be 0 and its variation will be wrong."_
- `rawRowCount` / `rowCount` keep meaning "what the portal returned"; the dataset header
  reads `13 rows · 1 added · 1 excluded`.

---

## 6. Trust and reversibility

The operator must always be able to answer five questions.

| Question                              | Where it is answered                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What did the portal actually say?** | Never overwritten (§3.1). Per cell: `portalValue` in the popover. Whole day: the `Show portal values` toggle. Whole dataset: `Download CSV` (raw vs corrected are separate files, distinguished by the `-corrected` suffix). Pre-filter truth: `rawStorageKey` in artifact storage, unchanged.              |
| **Who changed it?**                   | `by` on every correction → the popover's `Changed by` line, and the audit entry's actor.                                                                                                                                                                                                                    |
| **When?**                             | `at` / `updatedAt` → the popover, the day banner, the audit entry.                                                                                                                                                                                                                                          |
| **Why?**                              | `reason`, **required** at commit (3–500 chars) and stamped on every correction in that commit. This is the one place the spec adds friction on purpose: one sentence is what makes a correction readable a month later, and the receipts flow's optional note has already proved that optional means blank. |
| **How do I put it back?**             | Three scopes, below.                                                                                                                                                                                                                                                                                        |

### Revert affordances

- **Revert cell** — in the cell popover. Deletes that one correction. Enters the pending
  set, so it commits with everything else.
- **Revert row** — the gutter `⋯` menu. Removes every correction on the row, including an
  exclusion or an added row (`Delete this added row`).
- **Revert day** — the day banner. Removes every correction on the day. Confirmed, and it
  marks reports stale exactly like any other change, from the earliest `fromDate` the
  reverted corrections implied.

Reverts travel through the **same** `PUT` as edits (§7), which is deliberate: one write
path, one audit shape, one `markReportsStaleFrom` call, and "revert this cell and fix that
one" is a single commit rather than two competing staleness events.

### Audit trail

Two new actions on `shared/src/types/enums.ts`, following the `DSR_RECEIPT_SET` /
`DSR_RECEIPT_CLEAR` precedent:

- `IRAS_DATA_EDIT` — any commit that adds or changes corrections.
- `IRAS_DATA_REVERT` — a commit that only removes them.

Entity `Dealer`, `entityId = dealerId` (matching the receipts routes, so the dealer's audit
tab shows corrections next to receipts). `before` / `after` carry
`{ businessDate, changes: [{ code, rowKey, field, from, to, kind }], staleDates, reason }`.
One entry per commit — not per cell — so the audit log reads as a list of decisions.

> **Implementation note:** `@dk/shared` has four byte-identical vendored copies. Adding the
> two enum values and the `IrasDataCorrection` contract means mirroring the change to all
> four and md5-verifying, per the repo's standing rule.

Nothing about corrections is dealer-visible. The dealer sees a corrected report, not a
correction history.

---

## 7. Surface contract (shape only — no code)

**Read — one request, so the screen never renders half-known state:**

`GET /iras-data/dealers/:dealerId/days/:businessDate`

```
{ dealer:      { id, name, code, roCode, archived }
  snapshot:    IrasDataSnapshot | null        // RAW, verbatim
  effective:   IrasDataSnapshot | null        // corrections applied
  corrections: IrasDataCorrection[]
  orphaned:    IrasDataCorrection[]
  revision:    string                         // optimistic-concurrency token
  fieldPolicy: Record<IrasReportCode, FieldPolicy[]>   // from the engine (§5.1)
  previousTotReadings: Record<string, string> // nozzle → D-1 reading, for the backwards-meter check
  dsr: {
    attached: boolean
    configError: string | null                // rendered inline, calmly
    products: DsrProductConfig[]              // tank/nozzle map for impact statements
    receipts: DsrDayReceipts | null           // the Receipts band, as today
    reportDates: string[]                     // this dealer's generated report dates
    sharedDates: string[]                     // of those, the ones already shared
  } }
```

**Write — one endpoint for every kind of change, including reverts:**

`PUT /iras-data/dealers/:dealerId/days/:businessDate/corrections`

```
{ revision, reason, edits[], addedRows[], excludedRowKeys[], reattributions[], reverts[] }
→ { corrections, changes[], staleDates[], revision }
```

409 on a revision mismatch. `assertDealerNotArchived`. Same business-date validation the
Vault already uses (real calendar date, not in the future). `requireRole('admin')`, as the
whole `irasDataRouter` already is.

**Preview — the one extra endpoint, and the reason it is worth it:**

`POST /iras-data/dealers/:dealerId/days/:businessDate/corrections/preview`
→ per-product `{ productKey, label, before: DsrVariationSummary, after: DsrVariationSummary }`

Read-only: it applies the pending set in memory, runs `computeProduct` against the real
prior day, and persists nothing. It is what turns _"I changed a number"_ into _"the
variation moves back inside the limit"_, which is the operator's actual goal and the one
thing they cannot check any other way before committing.

**Receipts endpoints are unchanged** — `GET/PUT /dsr/dealers/:dealerId/receipts…` keep
working exactly as they do (§8).

---

## 8. Receipt migration

### (a) The modal

`mdg-admin/src/pages/dsr/DsrReceiptsDialog.tsx` is **deleted**, both exports
(`DsrReceiptsButton`, `DsrReceiptsDialog`). Its content becomes the **Receipts (per
product)** band at the top of the new editor — one row per configured product, in the
dealer's config order, above the `REC` grid.

### (b) The entry points

Four call sites, all repointed to the editor route, none removed:

| File                                               | Today                                                                | After                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pages/dsr/DsrReportView.tsx:184` (toolbar)        | `<DsrReceiptsButton dealerId businessDate={report?.businessDate} />` | `Edit shift data` → `/data-vault/dealers/:dealerId/days/:businessDate`                     |
| `pages/dsr/DsrReportView.tsx:225` (empty state)    | `<DsrReceiptsButton dealerId />`                                     | Same, dated to the day the operator picks in `GenerateDsrForDate`, defaulting to IST today |
| `pages/dealers/DealerDsrTab.tsx:138` (toolbar)     | same                                                                 | same                                                                                       |
| `pages/dealers/DealerDsrTab.tsx:177` (empty state) | same                                                                 | same                                                                                       |

Plus two new doors: the Vault drawer footer and `SnapshotDetail`'s action slot (§2 step 1).
The button label changes from `Receipts` to `Edit shift data` everywhere, and the `Truck`
icon becomes `Table2` / `PencilRuler` — because the screen now does more than receipts and a
truck would under-promise.

### (c) Receipts already entered

**Nothing happens to them. There is no data migration.** `DsrManualReceipt` stays as the
storage for product-level receipt overrides, with its own collection, its own endpoints, its
own audit actions, and its existing behaviour: it survives re-collection and regeneration,
`getManualReceipts` still feeds `ManualInputs.receipt`, `manual.receipt ?? irasReceipt`
still decides.

**Why not migrate receipts into the correction overlay** — the decision that keeps this
build small and safe:

1. A receipt override is **product-scoped**, and a product can span several tanks. Cell
   corrections are **row-scoped**. `"HSD received 12,000 L"` has no single row to attach to
   when the product has two tanks — and the split between them is information nobody has.
2. The most common case (§1 case 1) is that `REC` has **no row at all**, sometimes no
   snapshot at all. There is no cell to edit. Expressing it as a correction would mean
   inventing a row, which means inventing tank attribution.
3. It already works, is already audited, and already survives everything. Migrating it would
   put live financial overrides through a rewrite for a purely cosmetic unification.

So the unification the owner asked for is **at the surface, not in the storage**: one screen,
one save, one consequence, one reason — two mechanisms underneath, neither of which the
operator can see.

### (d) The receipt-specific affordances a generic grid lacks

All four survive, in the band:

| Affordance                    | Where it lives now                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Invoice / DSN number**      | `Invoice / DSN` column in the Receipts band, `maxLength 64`, optional. Persisted on `DsrManualReceipt.invoiceNo` exactly as today.                                                                                                                                                                                                                                                               |
| **Tank**                      | Shown as the product's `tankLabel` in the row's label cell (read-only, from config), with `DsrManualReceipt.tankNo` defaulting to `product.tankNos[0]` as `saveManualReceipts` already does.                                                                                                                                                                                                     |
| **Reason / note**             | Per-row `Reason` column, `maxLength 500`, optional, seeded from the commit-level reason when left blank. Persisted on `DsrManualReceipt.note`.                                                                                                                                                                                                                                                   |
| **"IRAS said X, you said Y"** | Made **more** precise than today, because corrected `REC` rows now feed the comparison. Three columns: `Portal` (raw `REC` sum for the product's tanks) · `After REC corrections` (shown only when they differ) · `Your entry`. Plus the effective figure and `Clear and use the portal's figure` — today's `Clear and use IRAS`, renamed because "IRAS" now means "IRAS plus your corrections". |
| **Entered-by-hand history**   | The modal's _"Entered by hand so far"_ list (`useDsrReceiptHistory`) moves to a `History` disclosure under the band, unchanged.                                                                                                                                                                                                                                                                  |
| **A day with no snapshot**    | Today's `Callout` survives verbatim: _"No shift data has been collected for {date} yet… A receipt entered now will be used the moment that day is generated."_                                                                                                                                                                                                                                   |

Precedence, stated on screen because it is the one place the two mechanisms meet: **a
manual receipt for a product replaces the portal's decantation figures for that product's
tanks.** While a product has one, its tanks' `REC` rows render in the
`locked-by-receipt-override` state with the §4.7 tooltip. Clearing the receipt unlocks them.

The commit is still **one** commit: the `Apply` action writes the corrections (`PUT
…/corrections`) and the receipts (`PUT /dsr/…/receipts/:businessDate`) and reconciles their
two `staleDates` results into one footer message. Ordering: receipts first (it is the
existing, proven path), then corrections; on a corrections failure the footer reports the
partial state explicitly — _"Receipts were saved. The other {n} changes were not applied.
{message}"_ — rather than pretending the commit was atomic across two subsystems.

---

## 9. Acceptance criteria

Numbered so QA can walk them. Every one is observable in the admin.

**Editing and calculation**

1. Correcting `TOT.TOT_READING` for nozzle 5 on `D`, applying, and regenerating changes the
   sales figure on `D-1`'s report and every cumulative figure after it.
2. Correcting `STK.NET_QTY` for tank 3 on `D` changes that product's opening stock and its
   variation on `D`, and the variation on every later report.
3. Correcting `REC.NET_QTY_DECANTED` changes the product's receipt — **unless** the product
   has a manual receipt, in which case the report is unchanged and the cell was locked.
4. The `Review & apply` preview's `after` variation equals the regenerated report's
   variation, exactly.
5. Editing only an inert column changes no report figure, marks nothing stale, and offers no
   regeneration.

**Durability (the blast-radius tests)**

6. `Re-collect` a day that has corrections: the corrections are still in force afterwards,
   the day is marked "portal re-sent" where values changed, and reports from the right date
   are stale.
7. `Re-collect` a day where a corrected nozzle no longer appears: the correction is orphaned,
   listed for review, **not** applied, and **not** deleted.
8. Regenerating a DSR (which may drive a nested IRAS collection for a _missing_ day) never
   loses a correction on a day that was already COMPLETE.
9. `compute.test.ts` and `guideline.test.ts` pass unchanged.
10. `GET /iras-data/snapshots/:id` returns the raw portal rows, byte-identical to before.

**Guardrails**

11. `TANK_NO` / `NOZZLE_NO` / `PRODCODE` cannot be edited by typing in a cell.
12. Re-attributing a row to a tank that already has a row is blocked with the double-count
    message.
13. Adding a `STK` row for an existing tank is blocked with the same message.
14. Excluding the only stock row a product has warns before committing.
15. `REC` offers no add and no remove.
16. A commit is all-or-nothing: an invalid cell anywhere blocks `Apply`, and a server error
    leaves zero corrections written.
17. Two browsers editing the same day: the second commit is rejected with 409 and loses
    nothing.

**Trust**

18. Every corrected cell shows the portal's original, the actor, the timestamp and the reason.
19. `Revert cell` / `Revert row` / `Revert day` each restore the portal's values and mark the
    right reports stale.
20. Every commit writes exactly one audit entry, visible on the dealer's audit tab.

**Receipts parity**

21. Every receipt entered through the old modal is visible and editable in the new band.
22. A receipt can still be recorded for a day with no snapshot and no `REC` rows.
23. Invoice number, tank and note round-trip unchanged.
24. A dealer with no DSR service can still have their IRAS data corrected; only the Receipts
    band is disabled, with the existing sentence.

**Shell**

25. At 900px the grid scrolls inside its own card with the first column pinned; the page body
    does not scroll horizontally.
26. Below 900px the day is read-only with the "open this on a laptop" notice.
27. No new runtime dependency in `mdg-admin/package.json`.

---

## 10. Out of scope

Deliberately excluded, so the build stays bounded:

- **Editing the shift anchor.** Which closing shift a day is pinned to is a collection
  decision. Wrong shift → re-collect, and fix the dealer's configured `shiftTime`. The
  editor surfaces the anchor and the other candidate shifts so the operator can _see_ the
  problem; it does not let them re-pin it.
- **Editing the derived DSR ledger** (`DsrDayRow`: sales, cumulative, testing, dip as
  printed). Derived state is rewritten by every generation; an edit there would be erased.
  Correct the inputs.
- **Editing the dealer's DSR configuration** (tank/nozzle map, inspection baselines,
  percentages) from this screen. That lives on the Services tab and has its own form.
- **Multi-day editing, CSV import, formulas, fill-handle drag, column add/rename/reorder,
  row reorder.** A spreadsheet _feel_, not a spreadsheet.
- **Mobile editing.**
- **Automatic regeneration** on commit, and **automatic re-sharing** of a corrected report.
  Both stay deliberate clicks; a regeneration can open a portal session and a re-share
  messages a dealer.
- **Telling the dealer a correction happened.** If a shared report changes, the operator
  sends a chat message like any other conversation. No automation, no system message.
- **Dealer-visible provenance.** Dealers see corrected reports, never a correction log.
- **Editing other Vault datasets** (PAD ledger, Inspection Reports). The registry
  (`dataVault/datasets.ts`) makes that a later, additive change.
- **A collection-to-collection diff view** for one day ("show me what changed when the
  portal re-sent this"). The per-cell `Portal originally / Portal now` lines cover the case
  that matters.
- **Closing the pre-existing hole where a re-collection of a day with _no_ corrections
  leaves existing reports un-stale.** Flagged in §3.4; a separate ticket, because it changes
  behaviour for every dealer whether or not anyone edits anything.

---

## 11. Needs the owner's call

Four, each with the default the build should assume if nobody answers.

1. **Should `REC` rows be addable / removable after all?**
   _Recommended default: no — the Receipts band is the only way to state a day's real
   receipt total (§5.5)._ It is the correct level for the engine, it already survives
   re-collection, and two ways to say one thing invites a silent double-count. Change this
   only if the ops team routinely needs to correct **one tanker among several** on a day, in
   which case the receipts model itself needs a per-delivery shape and that is a bigger
   design.

2. **Should identity re-attribution (`TANK_NO` / `NOZZLE_NO` / `PRODCODE`) exist at all?**
   _Recommended default: yes, as the guarded dialog in §5.3 — never as an inline cell edit._
   The alternative is a hard lock, which is safer on paper but pushes the "dip on the wrong
   tank" case into operators fudging measured values to make the report come out right —
   strictly worse, because it is invisible. If the owner prefers the hard lock, the fallback
   for case 4 is: exclude both rows and add two correct ones, which is fully auditable and
   only slightly more work.

3. **Is a commit-level reason really mandatory?**
   _Recommended default: yes, 3–500 chars._ It is the only field that makes the audit trail
   readable later, and the receipts flow's optional note has already demonstrated that
   optional means empty. The cost is one sentence per correction event, a few times a week.
   If the owner wants it optional, the trade is that §6's "why" question stops being
   answerable and the audit log becomes a list of numbers.

4. **Should a re-collection of a day with no corrections mark existing reports stale?**
   _Recommended default: not in this build — ship it as the very next ticket._ It is a real
   correctness gap (the portal can re-send different figures and reports silently keep the
   old ones), but it is orthogonal to editing, it fires for every dealer on every
   re-collection, and bundling it would make this feature's blast radius impossible to
   reason about in review.
