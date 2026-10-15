# Spec — Editable IRAS shift data (the Shift Data Editor)

**Status:** Shipped 17 Aug 2026. Receipts were folded into the overlay at ship time (§8). Hand-typed days, the Shift sheet, the slip reader and day verification came after (§12). Where §2–§11 differ from the code, §8 and §12 say how.
**Owner:** Product
**Audience:** Backend, admin UX
**Surface:** `mdg-admin` only. Internal, English-only. Nothing here is dealer-facing.
**Replaced:** the receipts modal (`DsrReceiptsDialog.tsx`, deleted).
**Related:** `shared/src/types/irasData.ts`, `shared/src/iras/{fields,corrections,dayPlan,dayState}.ts`,
`shared/src/types/dsrReport.ts`, `mdg-backend/src/services/irasData/{store,corrections}.ts`,
`mdg-backend/src/services/dsr-report/{parse,compute,generate,reportStore}.ts`,
`mdg-admin/src/pages/dataVault/dayEditor/*`, `docs/STYLE_GUIDE_V2.md`, ADR 0012 (the slip reader)

---

## 0. One paragraph

The IRAS Data Vault shows what the portal said. This feature makes **every field of a day's
collected data correctable, in a grid that behaves like a spreadsheet**, routes the corrected
values into the DSR calculation, and reuses the staleness and regenerate machinery the old
receipts flow proved. Before it shipped, exactly one number could be corrected (the receipt),
through a modal in a different part of the app, and every other figure a dealer is judged on
(nozzle totalisers, tank dips, net stock) was take-it-or-leave-it even when the operator knew the
right answer. Corrections are an **overlay**: the portal's own values are never overwritten, so
"what did IRAS actually say" is answerable forever.

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

The bar: **the operator must be able to fix a wrong number without accidentally moving a row
to another tank, and must never be able to think they fixed something when they edited a
column no calculation reads.**

### The situations that bring them here

Ranked, because the ranking is the UI's priority order.

| #   | Situation                                                                                                                                                                                                                                                                                    | What is actually wrong                                                                                          | Frequency                                                                                                                                 | Fix shape                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **A tanker was decanted but never entered at the outlet.** The dealer says 12,000 L of HSD came in on the 14th; IRAS `REC` has nothing, so the DSR treats the day as a 12,000 L stock surplus and the variation blows past the 5.1.11 band.                                                  | Nothing is _wrong_; data is _absent_. There is no row to edit.                                                  | **Common** — the single most frequent reason anyone corrects DSR data.                                                                    | Add a `REC` row for the tanker, or edit the delivery's litres (§5.5).                                                                               |
| 2   | **A nozzle totaliser is transposed or mistyped in the portal.** `TOT_READING` reads 1,234,567 where the meter says 1,235,467 (or a digit is dropped entirely).                                                                                                                               | One measured numeric, one row. Poisons sales for the previous day's close _and_ everything cumulative after it. | **Occasional** — a few times a month across the book.                                                                                     | Edit one `TOT_READING` cell.                                                                                                                        |
| 3   | **A shift was captured before the last delivery landed.** The configured shift time and the physical day-end drifted apart; the closing shift IRAS offered excluded a late tanker or a late nozzle read.                                                                                     | The whole day is anchored a shift too early. Multiple rows look low.                                            | **Occasional**, and clustered — when it happens to a dealer it usually happens repeatedly until the configured shift time is fixed.       | Usually **not** an edit: re-collect, and fix the dealer's shift time. The editor's job is to say so, not to let the operator hand-patch eight rows. |
| 4   | **A dip was read on the wrong tank.** Tank 3's and Tank 4's `PRODUCT_DIP` / `NET_QTY` are swapped, or one tank's sheet was entered under the other's number.                                                                                                                                 | Two rows' measured values, or (worse) one row's identity.                                                       | **Rare** — a handful a year, but expensive: two products' variations are both wrong and the surplus one suspends sales of _all_ products. | Swap the two rows' measured values (preferred), or exclude the wrong row and add the right one.                                                     |
| 5   | **A duplicated or missing tank/nozzle row.** The portal returns `TANK_NO 3` twice (stock double-counts, because `computeProduct` **sums** `netQty` across a product's tanks), or omits a nozzle entirely (`todayPumps` yields `NaN`, the previous day's close is skipped, sales go unknown). | A whole row exists that should not, or does not exist and should.                                               | **Rare**                                                                                                                                  | Exclude a row / add a row.                                                                                                                          |

Two things follow from that table:

- **Case 1 is the common one, and it is not a cell edit.** There is no row to correct, so the
  operator adds one (an `ADDED_ROW` correction on `REC`, §5.5). Its litres are taken exactly as
  typed.
- **Case 3 is a trap.** The screen must offer "Re-collect this day" at least as loudly as
  it offers editing, or the operator will hand-patch a whole shift's worth of rows and bury
  a configuration bug.

---

## 2. The journey

Screen state at each step. `D` = the business date being corrected.

### Happy path

1. **Find the day.** Two doors, both existing:
   - Cross-dealer: `/data-vault` → IRAS shift data → business-date control → dealer row →
     drawer (`SnapshotDrawer`). The drawer has a primary **`Correct this day`** button beside
     `Re-collect`.
   - Per-dealer: `/dealers/:id?tab=data-vault` → latest capture, or a row in _Capture
     history_. Same button on `SnapshotDetail`'s action slot.
   - A third door, because this is where the operator usually _starts_: the DSR report
     toolbar and the DSR empty state carry **`Correct shift data`**, which deep-links to the
     editor for that report's date.

2. **The editor opens** at `/data-vault/dealers/:dealerId/days/:businessDate`, full page
   inside the admin shell (not a drawer — a 20-column grid does not fit 720px). Header:
   `Shift data · {dealer code}`, the snapshot's `StatusChip`, the date, the RO code and
   _collected …_, and one line, `Shift 05:59:59 · configured 06:00 · 2 other shifts were offered`,
   which opens the note that a day wrong across several rows at once is usually a shift problem,
   not a figures problem (case 3 lives in that line). Actions: `Re-collect` (only where the
   dealer has a portal collection to run) and a link back to the dealer's Data Vault.

3. **See portal value vs corrected value.** Three sections, in engine order:
   **`REC`** → **`STK`** → **`TOT`**. Receipts first because it is case 1. A cell that already
   carries a correction shows the corrected value in semibold with a corner marker, and the
   portal's own value struck through beneath it (§4.4). Above the grids sits the day's
   correction summary when there is one: _"This day has 3 corrections. Reports are using the
   corrected figures."_

4. **Edit.** Click a cell, type, Tab or Enter. Nothing has been saved. A sticky
   footer appears the instant there is one pending change (§4.6).

5. **Understand what it invalidated — before committing.** `Review & apply` opens a dialog
   that lists every pending change as `Dataset · Row · Field: portal → new`, states how
   many generated reports will need regenerating and from which date, warns separately and
   more loudly about any of those reports that has already been **shared** with the dealer,
   shows a **recomputed variation preview** for the affected products (`HSD variation would
move from +1,240 L — outside limit → −60 L — within limit`), and requires a one-line
   reason. `Apply 3 changes` commits.

6. **Regenerate.** Committing does **not** regenerate, because a regenerate can drive a portal
   session. On success the footer is
   replaced by a notice: _"3 changes applied"_ and _"14 reports still need regenerating"_ with
   a `Regenerate reports` button that hits the existing
   `POST /dsr/dealers/:dealerId/regenerate-stale` and watches the run with the existing
   `useDsrRunWatcher`. The existing `DsrStaleNotice` on every affected report shows the
   same thing wherever the operator lands next.

7. **Verify.** After the run lands, the notice turns green and says _"Every report for this
   dealer is up to date."_ — and the operator's real verification is the DSR itself: the
   notice offers `Open the report for <D>`. The variation card there must now match the
   preview they saw in step 5. That equality is the acceptance test for the whole feature.

### Unhappy paths

| Situation                                                                                             | Screen state                                                                                                                                                                                                                                                              | Copy                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No snapshot for D**                                                                                 | No grids. `EmptyState` (Database icon). For a dealer whose portal collection runs: primary `Collect this day`, and a quieter `Start this day by hand`. For an outlet with no portal account: the day is opened by hand (§12).                                             | Title: _"Nothing has been collected for this day"_ · Body: _"There are no portal rows to correct yet. Collect the day first — it takes about a minute."_ For an outlet with no portal: _"This outlet's figures are entered by hand"_.                         |
| **Snapshot `FAILED`**                                                                                 | No grids (a FAILED snapshot has `datasets: []`). Danger banner with `failureReason` verbatim + `Re-collect`.                                                                                                                                                              | Title: _"This collection failed"_ · then the portal's own reason · _"Correcting figures needs a collected day. Re-collect it, then come back."_                                                                                                               |
| **A dataset the portal returned no rows for**                                                         | That grid is replaced by a dashed strip, and the other datasets stay fully editable. The strip carries the add-row buttons.                                                                                                                                               | On the strip: _"The portal returned no rows for this report."_                                                                                                                                                                                                |
| **The latest re-collection attempt failed but the day has data** (`lastFailure` set, status COMPLETE) | Grids fully editable. The existing warning-tone banner from `SnapshotDetail`, unchanged.                                                                                                                                                                                  | Existing copy: _"The data below is good — but the latest re-collection attempt failed."_                                                                                                                                                                      |
| **Dealer has no DSR service attached**                                                                | Grids fully editable (the Vault is service-independent; other readers may exist). The consequence line in the footer changes.                                                                                                                                             | Footer: _"2 changes pending. This dealer has no Daily Sales Report, so no report needs regenerating."_                                                                                                                                                        |
| **Dealer's DSR config is unparseable**                                                                | Same as above; the day payload carries `dsr.configError`, rendered inline and calmly.                                                                                                                                                                                     | The configuration sentence the engine already throws.                                                                                                                                                                                                         |
| **A re-collection lands after an edit**                                                               | See §3.4 in full. Two sub-cases, both banner-level, both non-destructive: a corrected row **still exists** (correction still wins, banner notes the portal changed underneath) or a corrected row **is gone** (correction is _orphaned_, not applied, listed for review). | See §3.4 for exact strings.                                                                                                                                                                                                                                   |
| **Report for D was already SHARED with the dealer**                                                   | The `Review & apply` dialog gains a distinct danger block above the confirm. Committing is still allowed.                                                                                                                                                                 | _"The report for Fri, 14 Aug 2026 was already shared with this dealer on 15 Aug, 09:12. They have the old figures on their phone. After you regenerate, the report is no longer marked shared — you will need to share it again and tell them what changed."_ |
| **Another admin changed the same day while this one was editing**                                     | Commit fails with 409. Nothing is merged. The pending changes stay in the editor.                                                                                                                                                                                         | A toast: _"Your changes were not applied. Nothing has changed. Somebody else changed this day while you were editing. Reload to see their changes, then apply yours again."_                                                                                  |
| **Dealer is archived**                                                                                | The route loads read-only; every editable affordance is disabled. Write route rejects via the existing `assertDealerNotArchived`.                                                                                                                                         | _"This dealer is archived. Their data is read-only."_                                                                                                                                                                                                         |
| **Future date / impossible date in the URL**                                                          | Redirect to the Vault, same clamp the Vault already applies (`MIN_SELECTABLE_YMD` … IST today). No error.                                                                                                                                                                 | —                                                                                                                                                                                                                                                             |
| **Operator navigates away with pending changes**                                                      | A `beforeunload` guard stops a reload or tab close. There is no in-app route guard, and the pending set is not saved anywhere: leaving by a link drops it.                                                                                                                | The browser's own leave-page prompt.                                                                                                                                                                                                                          |

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
   the retired `DsrManualReceipt` documented ("the override lives in its own collection… here it
   survives re-collection and regeneration alike").
2. Question 1 of §6 is _"what did the portal actually say?"_ An in-place edit makes that
   unanswerable. `rawStorageKey` is not a substitute — it is the pre-filter response in
   artifact storage, not a per-cell before value.
3. The generic `columns` + `rows: Record<string,string>` shape exists so IRAS can add
   columns without a migration. An overlay keyed by field name preserves that; a typed
   patch schema would not.

Shape (the contract is `IrasDataCorrection` in `shared/src/types/irasData.ts`, beside
`IrasDataSnapshot`, since this is Vault data, not DSR data):

```
IrasDataCorrection
  id, dealerId, businessDate            // (dealerId, businessDate) is the day key
  code: IrasReportCode                  // 'TOT' | 'STK' | 'REC'
  rowKey: string                        // §3.2
  keyStrength: 'txn' | 'natural' | 'ordinal' | 'index'
  rowLabel: string                      // "Nozzle 5", "Tank 3 · invoice 7010…" — for screens without the row
  kind: 'FIELD' | 'ADDED_ROW' | 'EXCLUDED_ROW'
  field: string                         // the IRAS field key; a sentinel on row-level corrections
  portalValue?: string | null           // what the portal said at the moment of the edit
  value?: string | null                 // what it should be
  row?: IrasRow                         // ADDED_ROW only — the whole hand-entered row
  rowCountAtEdit: number                // used to orphan position-bound keys (§3.2)
  reason: string                        // required, commit-level, stamped on every change in the commit
  by, at, updatedBy, updatedAt
```

Unique on `(dealerId, businessDate, code, rowKey, field)`; index `(dealerId, businessDate)`. A
row-level correction (an exclusion) uses a sentinel `field`, so a row can carry an exclusion and
its own field corrections without colliding. Orphaned and portal-changed corrections are worked
out when the day is read (§3.4), never written.

A day also carries a **revision token** (`dayRevision`, derived from the day's corrections) used
for the optimistic-concurrency check in §2's 409 case.

### 3.2 Row identity — how a correction stays pinned to the right row

Rows have no id of ours. A positional index is not survivable: the portal can return a
different row count or order on re-collection, and a correction that slides onto a different
nozzle is worse than no correction at all.

**Decision: pin to the portal's own transaction id, and fall back only when it is not usable.**
One function, `irasRowKeys(code, rows)` in `shared/src/iras/corrections.ts`, serves the engine
and the grid, so they cannot disagree:

| Strength  | `rowKey`                                | When                                                                                                                                                                                                       |
| --------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `txn`     | `txn:<id>`                              | Every row in the dataset has a distinct portal transaction id: `FCC_TXN_ID` (`TOT`), `STK_TXN_ID` (`STK`), `REC_TXN_ID` (`REC`). These are IRAS's own primary keys, stable across consecutive collections. |
| `natural` | `nat:NOZZLE_NO=<v>` / `nat:TANK_NO=<v>` | No usable transaction ids. One row per nozzle, one per tank.                                                                                                                                               |
| `ordinal` | `nat:TANK_NO=<v>#<n>`                   | The natural value repeats (a tank can take two tankers in a day). `n` is the 1-based ordinal among those rows in portal order.                                                                             |
| `index`   | `idx:<n>`                               | The natural value is blank.                                                                                                                                                                                |

A hand-added row's key starts `add:` and can never collide with a portal row's.

Why the transaction id first: it fails safe. If the pipeline ever selects a different closing
shift, every row gets a different transaction id and the corrections orphan for review, where a
natural key would silently re-apply yesterday's correction to a different shift's reading.

Guardrails, because the `ordinal` and `index` keys are the fragile ones:

- On apply, a correction whose `rowKey` is absent from the current dataset is **orphaned**
  (§3.4). It is never re-applied to a neighbouring row.
- A position-bound key (`#n` or `idx:`) that still resolves is orphaned anyway when the
  dataset's row count differs from `rowCountAtEdit`. A second tanker appearing must not
  silently inherit the first one's correction.
- Adding one hand-typed row with no transaction id drops the whole dataset from `txn:` keys to
  positional ones, so a correction stored against `txn:1536` would stop resolving. The apply
  function therefore keys the portal's rows only, then appends the added rows.

### 3.3 Where corrections enter the calculation — exactly one seam

**Decision: `getEffectiveSnapshot(dealerId, businessDate)` (in `services/irasData/corrections.ts`)
returns the day with corrections applied, plus the orphaned, portal-changed and duplicate-risk
corrections. `getSnapshot` in `store.ts` stays raw and untouched. It is a pure read: it reports
the problems and writes nothing, because it sits in the DSR generation path and a read that
writes is a read that can fail a report.**

Call-site changes, and that is the whole list:

| Caller                                                                    | Today                               | After                                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dsr-report/generate.ts` (`generateDsr`)                                  | `getSnapshot`                       | `getEffectiveSnapshot` — this is the line that makes calculations use corrected data. Nothing else in `generate.ts` changes; `snapshotToInputs`, `computeProduct` and the ledger writes are untouched.      |
| `dsr-report/index.ts` (`ensureIrasSnapshot`, `resolveTargetDate`)         | `getSnapshot` / `getLatestSnapshot` | **Unchanged.** These ask "is there a complete snapshot for this day"; a correction never changes the answer, and routing that gate through the overlay would only add failure modes to the collection path. |
| `routes/v1/irasData.ts` `GET /snapshots/:id`, `/dealers/:dealerId/latest` | raw                                 | **Unchanged**, so nothing that reads the Vault API changes shape. The editor uses its own endpoint (§7).                                                                                                    |
| `routes/v1/irasData.ts` `GET /snapshots/:id/export.csv`                   | raw                                 | Effective, with `-corrected` appended to the filename when the day has corrections, so the CSV and the screen never disagree. Client-side `datasetToCsv` matches.                                           |

Everything else that reads the Vault (`listSnapshotSummaries`, `getSnapshotsForDate`,
`getLastCapturedAt`, the overview counters) projects rows away and is untouched.
`rowCount` / `rawRowCount` keep meaning "what the portal returned" — an added or excluded
row does **not** move them; the editor shows `{n} portal rows · {m} corrected` instead.

Because `parse.ts` coerces strings to numbers in exactly one place, the applied overlay must
write **strings** back into `rows`, keeping the generic contract intact and reusing every
existing coercion, blank-handling and `Number.isFinite` guard. No new numeric parsing.

### 3.4 A re-collection arriving after an edit

Three outcomes, all worked out when the day is read (`getEffectiveSnapshot`), all
non-destructive. Nothing is written to flag them.

1. **Row and field still there, portal value unchanged.** Correction applies. Nothing to
   say.
2. **Row still there, portal value changed underneath.** The correction still wins (it is an
   override), and the cell's corner triangle turns amber with _"(it changed after this was
   corrected)"_ in its tooltip. Day callout: _"The portal has re-sent this day and now reports
   different values for 2 cells you had corrected. Your corrections are still being used —
   check whether they are still needed."_ The operator's way back is the cell's
   `Use the portal's value`.
3. **Row is gone (or a position-bound key moved).** Correction is **orphaned**: not applied, not
   deleted. Warning banner: _"2 corrections no longer match this day's data. The rows they were
   made on are not in the latest collection, so they are not being used."_ It lists each orphan
   (dataset and row, field, portal-then → your value, reason). The list is read-only: the
   designed `Discard` and `Re-apply` buttons were not built.

A hand-added row never orphans, because it has nothing to match. It can instead become a
**duplicate risk** (§5.5).

**Reports are flagged stale by the collection, not by the read.** `saveSnapshot` compares the
day it is replacing with the one it is writing and, when the shift the readings came from or
the readings themselves changed, calls `markReportsStaleFrom` for that date (the comparison
ignores row order and key order, which the portal does not hold stable). So a re-collection of
a day marks reports stale whether or not that day has corrections. This closed the gap the
first version of this spec listed as deliberately left open.

### 3.5 Staleness — which reports a correction makes out of date

Reuse `markReportsStaleFrom(dealerId, fromDate, { reason, productKey, by })` verbatim. It
already flags `businessDate >= fromDate` because variation is cumulative, already returns the
affected dates, and `DsrStaleNotice` + `regenerate-stale` already consume that.

**The rule: a correction on day `D` marks the reports for `D` and every later day out of date.
It does not mark `D-1`.** The same rule holds for every dataset, meter readings included
(`staleFromDate` in `services/irasData/corrections.ts` returns `businessDate`).

The tempting alternative is wrong. Sales for day `D-1` are closed by day `D`'s meter readings:

```
sales(D-1) = Σ( TOT_READING(D) − TOT_READING(D-1) ) − testing(D)
```

and it is natural to conclude that a `TOT_READING` correction on `D` changes `D-1`'s report.
It does not: `D-1`'s report was generated while `D-1` was still open, and never carried a sales
figure for itself. `sales(D-1)` is computed while generating `D`, and appears in `D`'s report.
So `D` is the right floor for all three datasets.

`regenerate-stale` already copes: it starts at the earliest date that needs work, and the
plugin generates `[previousDate(target), target]` then heals the forward chain.

Two consequences for copy and contracts:

- A stale report is wrong in its variation panel and, for a meter or stock correction, in the
  figures its ledger line carries. The stale reason for a `TOT` change says so: _"A meter
  reading for 15 Aug was corrected, so this report's sales and stock variation no longer match
  its inputs."_
- `DsrReportStale.productKey` stays `null` unless every change in the commit maps to exactly
  one product (via the dealer's `tankNos` / `nozzleNos`).

`saveReport`'s `computedFrom` guard already protects the "corrected while a run was
computing" race. No change.

**A narrow case, accepted.** A report that was itself regenerated after its day closed stores a
ledger that carries its own day's sales, so a `TOT` correction on the _next_ day makes that
sheet stale without flagging it. Flagging from `previousDate(D)` for `TOT` would cover it at the
cost of one extra report in the list.

**A closed day's ledger row.** `upsertTodayRow` freezes a closed ledger row, which was right
when a receipt was the only editable input and wrong for anything else. A rebuild that
`provenance.rebuild` marks (the plugin's forced target and its forward heal) unfreezes it, and
the heal then re-closes the chain. Anything new that regenerates a past day must pass the same
flag, or the variation card moves while the ledger sheet (which the printable HTML and the
`.xlsx` render from) keeps the portal's original.

### 3.6 What this feature must not touch

Explicitly verified as out of the blast radius, and the build must keep it that way:

- The collector (`services/iras-shift-data/*`) and `recordSnapshotFailure`. `saveSnapshot` gained
  only the stale-marking comparison in §3.4.
- `computeProduct` / `compute.ts` — a pure function pinned to a real workbook by
  `compute.test.ts`. Corrections change its **inputs**, never its arithmetic. Those tests
  must still pass byte-for-byte.
- The DSR ledger (`dsr-report/store.ts`), the report doc, the HTML/xlsx/card renderers, the
  share path.
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
hook. Today's datasets are 1–15 rows, so there is no paging or collapsing.

Layout per dataset: a card headed `REC · {report name} · {n} portal rows · {m} corrected`, then
the grid. The `Show all portal columns` checkbox sits once above the three cards.

```
┌ REC  Receipts / decantation   2 portal rows · 1 corrected ─────────────────────────────┐
│ gutter     │ Tank no ⚠ │ Net qty decanted │ Product code ⚠ │ … inert columns hidden …  │
│ Tank 3 ⋯   │     3      │     12,000  ◤    │       HS        │                           │
│ Tank 4 ⋯   │     4      │      4,000       │       MS        │                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Left gutter**: the row's label, a `⋯` menu (`Leave out of report` / `Put back in report`,
  and `Undo n corrections` when the row has any), the product the row belongs to, a count of
  its corrections, and a `Left out` badge when it is excluded. A hand-added row shows
  `Added by hand` and a delete action instead.
- **Column headers carry the field class** (§5.1): identity columns show a warning mark, and
  inert columns are hidden unless `Show all portal columns` is ticked.
- Numerics right-aligned and `tabular-nums`. From `md` up it is a table; below `md` each row
  becomes a card, with the gutter as its heading and the fields stacked label over box.

### 4.2 Cell states

Each state has a distinct visual and each earning its place. Tokens are the admin's
existing ones.

| State                           | Visual                                                                                                                                              | Meaning                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Untouched**                   | `text-text-muted`, no marker                                                                                                                        | The portal's value, unmodified.                                                                            |
| **Pending** (uncommitted)       | `bg-info-soft`, `text-text` semibold, the portal value struck through beneath                                                                       | Typed in this session, not applied.                                                                        |
| **Corrected** (committed)       | `text-text` semibold + a small corner triangle `◤` in `brand`                                                                                       | An `IrasDataCorrection` is in force.                                                                       |
| **Portal changed underneath**   | Corrected styling + corner triangle in `warning`                                                                                                    | §3.4 case 2.                                                                                               |
| **Orphaned**                    | `text-text-subtle` with a `warning` dotted underline, rendered in the review list rather than in place when the row is gone                         | §3.4 case 3.                                                                                               |
| **Invalid**                     | `border-danger`, `bg-danger-soft`, message under the cell                                                                                           | Fails validation; blocks commit.                                                                           |
| **Identity** (editable, warned) | `ring-1 ring-danger` while pending or corrected, and the field's consequence sentence in red under the cell                                         | `TANK_NO`, `NOZZLE_NO`, `PRODCODE`, and a delivery's transaction id and decant stamp. Typed inline (§5.3). |
| **Locked**                      | Not editable; the cell says why and the way round (on a phone, the sentence sits under the box)                                                     | A stock row's `TANK_NO` on a row the portal sent (§5.3).                                                   |
| **Inert**                       | Hidden by default. When revealed: `text-text-subtle` italic                                                                                         | Editable, affects no calculation.                                                                          |
| **Added row / Left-out row**    | Added: an `Added by hand` badge in the gutter. Left out: `line-through`, `opacity-60`, a `Left out` badge, and `Put back in report` in the row menu | Row-level changes. Left-out rows stay visible — a removed row that disappears is a row nobody can audit.   |

### 4.3 Keyboard model

Click a cell to open a plain input in it (a numeric keyboard on a phone where the field is a
number). `Enter` or `Tab` records the value and closes the cell; `Escape` abandons it and puts
back what was there. `Cmd/Ctrl+Z`, pressed outside a text box, undoes the last pending step
(added and excluded rows included). It never touches the server.

The spreadsheet keys the first design asked for were not built: arrow-key movement, `F2`,
`Home`/`End`, copy and paste across cells, `Cmd/Ctrl+Enter` and a shortcut sheet.

### 4.4 How a corrected cell shows the portal's original

- **At a glance:** a corner triangle in `brand` (amber when the portal has since changed the
  figure), and the portal's own value struck through under the corrected one.
- **On hover:** a tooltip, _"The portal says 0"_ (adding _"(it changed after this was
  corrected)"_ when it did).
- **Back out of one cell:** `Use the portal's value` under a corrected cell (always on screen in
  the phone card, shown on hover in the grid), and `Undo this edit` under a pending one.

Who changed a figure, when and why is not printed on the cell. It is in the audit entry (§6) and
in the dealer's correction list at the foot of the editor (`GET …/dealers/:dealerId/corrections`),
which shows each correction as portal value → value, the reason and the time.

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
5. **Loss is the only cost.** A `beforeunload` guard (§2) stops an accidental reload or tab close
   while changes are pending. There is no saved draft.

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
and updates live as changes are added.

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

### 4.7 Microcopy

The wording on the screens lives in `mdg-admin/src/pages/dataVault/dayEditor/`. The text under a
cell comes from the shared field policy (`shared/src/iras/fields.ts`): each field's `hint` and
`identityWarning` are exact and are tested against the engine. For example, on a stock row's
tank number: _"The report decides which product a tank's stock belongs to from this number.
Changing it moves this whole row's stock to a different product — and if that product already
has a row for the tank, its opening stock is counted twice."_ Two more that matter to the
operator:

- `PRODUCT_DIP`: type the number exactly as the portal shows it; the report divides it by 10 to
  print the dip.
- An empty value on a field the report needs removes the row from the report; an empty `NET_QTY`
  counts as zero and keeps the row.

Banners and notices, as built:

- Has corrections: _"This day has {n} corrections. Reports are using the corrected figures."_
- Portal changed underneath: the portal re-sent the day and now reports different values for
  cells that were corrected; the corrections are still used.
- Applied: _"{n} changes applied"_, then either that no generated report is affected or that
  {m} reports still need regenerating, with `Regenerate reports`.
- Save failed: _"Your changes were not applied. Nothing has changed. {server message}"_

---

## 5. Field policy

### 5.1 The classification lives with the engine, not the UI

**Decision: one exported table, `shared/src/iras/fields.ts`, read by the editor, by the write-side
validation and by the engine's own regression test.** `dsr-report/fields.test.ts` mutates every
real column and compares `computeProduct`'s output with what the table claims, so teaching
`parse.ts` or `compute.ts` a new field fails the test until the table admits it.

This is the anti-drift decision. If the load-bearing list is hardcoded in a React component,
the day someone teaches the engine to read `WATER_QTY` the UI will still be calling it
inert, and the operator will believe a tooltip that is lying about money. An unknown column
the portal adds tomorrow defaults to class `UNKNOWN`, inert with a "we don't know this column"
note, rather than to "safe to edit".

Shape, per field: `{ field, class: 'IDENTITY' | 'MEASURED' | 'INFO' | 'UNKNOWN', usedByReport,
kind, hint?, identityWarning?, locked?, dropsRowWhenBlank?, blankReadsAsZero?,
affectsReportNotes?, min?, max?, maxDecimals? }`. `class` is what the value is; `usedByReport` is
whether the report reads it under **any** supported configuration (a column one dealer's
configuration reads must be visible to all of them). The UI keys its treatments off
`identityWarning != null`, never off `class`. Only 12 of the roughly 70 portal columns move a
report (`IRAS_ENGINE_FIELDS`).

### 5.2 Measured numerics — freely editable

| Code  | Field                                  | What it drives                                                                                                                                                                                                                                                    |
| ----- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TOT` | `TOT_READING`                          | Sales for `D-1`, cumulative sales, and via testing the whole variation chain. Some pumps report their totaliser on a different scale; the report converts where that is configured, so type the value exactly as the portal shows it.                             |
| `STK` | `PRODUCT_DIP`                          | The printed dip (`÷ 10`).                                                                                                                                                                                                                                         |
| `STK` | `WATER_DIP`                            | The printed water dip.                                                                                                                                                                                                                                            |
| `STK` | `NET_QTY`                              | Opening stock, summed across a product's tanks.                                                                                                                                                                                                                   |
| `REC` | `NET_QTY_DECANTED`, `INVOICE_QUANTITY` | The delivery's litres, summed across a product's tanks. A figure set by hand wins; otherwise the dealer's `receiptBasis` (`DECANTED` or `INVOICE`) picks one. Litres set by hand are used exactly as typed; a portal figure is rounded to a tanker's round 500 L. |
| `STK` | `PRODUCT_QTY`, `WATER_QTY`             | Parsed into `StkRow` but **not read by `computeProduct` today.** Class `MEASURED`, with the hint _"Stored, but today's report does not use this number."_ Deliberately not inert: they are measured quantities the engine already carries and may consume.        |

Validation: finite number, `>= 0`, `<= 99,999,999`, at most 3 decimals, no thousands
separators accepted on input (display formats them). A `TOT_READING` **lower** than the same
nozzle's previous-day reading gets a warning under the cell in the Full grid (_"Meters do not
run backwards — yesterday this nozzle read 1,235,467."_), and a block on the Shift sheet of a
hand-typed day (§12). It is the single highest-value check in the feature: it catches exactly
the transposition of case 2. It needs the previous day's `TOT` readings, which the day
payload carries (§7). A reading identical to yesterday's gets its own note: it reports zero
litres sold on that nozzle and drops the nozzle's 5 litre test draw.

### 5.3 Identity / key columns — typed inline, with a loud warning

`TOT.NOZZLE_NO`, `TOT.TANK_NO`, `STK.TANK_NO`, `REC.TANK_NO`, `PRODCODE` (all datasets), and on
`REC` the transaction id and the decant date and time. `TOT.PUMP_NO` is inert.

**Decision (the owner's, taken in the UAT before the build): these are edited in the cell, not
through a re-attribution dialog.** The cell carries a red ring and the field's own
`identityWarning`, which states what will move where in the operator's terms, and a separate
high-risk block leads the review dialog. One-click revert applies as for any cell. There is no
`REATTRIBUTED` kind and no "change which tank" dialog.

Why the warning matters: these are not values, they are **joins**. `stkRowsForProduct` and
`receiptForProduct` select purely on `tankNos` membership, and `todayPumps` looks up by
`nozzleNo`. Retyping `TANK_NO` from 3 to 4 does not correct a number; it moves an entire
row's stock or receipts from one product to another. Two rows on tank 4 and the product's
opening stock **doubles**; zero rows and it becomes 0 with only a warning. A positive variation
beyond the band suspends sales and supplies of **all** products the same day.

**One cell is locked outright: a stock row's `TANK_NO` on a row the portal sent.** The collision
guard (below) runs when a row is _added_ and never ran on an edit, so this was the one door left
open to counting a tank's fuel twice. The way round, shown in the cell: exclude that row and add
the right one. A _delivery's_ tank number stays editable, because a tanker typed against the wrong
tank is a real thing and correcting it is the only way to rescue those litres.

For case 4 (a dip read on the wrong tank), correcting the two tanks' dip values is safer than
moving a row, and the exclude-and-add route is fully auditable.

### 5.4 Inert columns — editable but visibly harmless

Everything else the portal sends: `NOZZLE_STATUS`, `PUMP_NO`, shift dates/times, RO codes,
truck numbers, checklist serials (class `INFO`), and any column IRAS adds tomorrow (class
`UNKNOWN`, treated as inert with an extra note). Two columns, `PRODCODE` and `TOT.TANK_NO`,
move no figure but do change the layout notes printed under the report, so their hint says
that instead of "changes nothing".

Editable, because the Vault is the record of what the portal said and an operator may
legitimately annotate it, but **inert** in the sense that no calculation reads them. The
worst outcome in this whole feature is an operator who believes they fixed a number and
actually edited a column nothing reads. Four defences, layered:

1. **Hidden by default.** The operator who came to fix a number sees only the columns that can
   fix a number. They must deliberately tick `Show all portal columns` to see the rest.
2. **Different typography when shown.** `text-text-subtle` italic values, and a `not used`
   (or `notes only`) label in the header. Load-bearing headers carry a filled dot.
3. **Tooltip**: _"No figure on the report is calculated from this."_
4. **A commit-time guard.** If the pending set contains **only** inert edits, the
   `Review & apply` dialog leads with a warning: _"None of these changes move a figure the
   report calculates. If you meant to correct a figure the report uses, close this and look for
   the column with a dot beside its name."_ The reason field is still required. No report is
   marked stale, no regeneration is offered.

### 5.5 Rows — adding and removing

| Code  | Add     | Exclude | Why                                                                                                                                                                                                                                                                                  |
| ----- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `STK` | **Yes** | **Yes** | A missing tank row makes opening stock 0 with only a warning; a duplicate tank row **doubles** it, because `stkRowsForProduct` sums. Both are unfixable by cell edits.                                                                                                               |
| `TOT` | **Yes** | **Yes** | A missing nozzle makes `todayPumps` produce `NaN`, which skips the previous day's close entirely — sales unknown, and the gap propagates.                                                                                                                                            |
| `REC` | **Yes** | **Yes** | The commonest correction is a tanker the outlet never entered (case 1), and there is no row to edit. A hand-added row carries the litres and, where known, the invoice number. Two deliveries into one tank in a day is legal, so `REC` is exempt from the duplicate-identity block. |

Guardrails on add:

- The load-bearing fields for the code must be filled (`requiredForAddedRow`): `TOT`: nozzle
  and reading; `STK`: tank and net quantity; `REC`: tank and either litres figure. On a
  hand-typed day (§12) `TOT` and `STK` rows also need `PRODCODE` (and `TOT` the tank), or the
  layout discovery finds no products and the dealer's report reads "no product code" forever.
  Inert columns are left blank, which `parse.ts` already tolerates.
- The nozzle or tank number must not collide with an existing row in that dataset for that day,
  or with another row in the same commit. **Hard block** (the double-count guard). Numbers are
  compared the way the report reads them (`02` and `2` are one tank), through the one shared
  normaliser `irasRowIdentity`. `REC` is exempt.
- The tank or nozzle should exist in the dealer's DSR config. Warning, not a block; the config
  can lag reality.
- An added row is visibly `Added by hand` for as long as it exists; who added it, when and why
  is in the correction list. Up to 60 rows per commit.
- **Which day a delivery counts on.** The portal answers the receipt query on when a delivery
  was _entered_, so one tanker can come back in two consecutive days' data. The report counts it
  on the day it was _decanted_: the 24 hours ending at that day's shift close
  (`shared/src/iras/decant.ts`, shared by the engine and the editor). The `REC` card says which
  window the day counts, and a row outside it carries `Counts on the day it was decanted` or,
  with no decant stamp, `No decant date — counted on this day`, so nobody corrects a row this
  day's report never reads. A hand-typed day has no window (§12).
- **A delivery typed into day `D`'s editor is booked on day `D-1`'s ledger row**, because the
  close of `D-1` is written when `D` is read and carries the 24 hours of deliveries that just
  ended. It needs `D`'s meter readings to close: a day with deliveries and no readings counts
  nothing, and the engine says so. The report built when `D` is saved is titled `D`; the litres
  land on `D-1`'s line inside it. (Calling both "the report" is how this confuses people.)
- **A hand-added row is an addition, not an override.** If the outlet enters the same tanker a
  day or two late, the portal's row can arrive beside it and the report would count both. The
  apply step raises `duplicateRisk` when the dataset's row count has changed since the edit and
  a portal row now shares the added row's tank. It is the loudest thing on the screen, and it
  is flagged, never auto-resolved: two tankers on one tank is legal, and only a person can tell.

Guardrails on exclude:

- It is an **exclusion**, not a delete. The row stays in the grid, struck through, with
  `Put back in report`. Nothing is ever removed from `IrasDataSnapshot`.
- `rawRowCount` / `rowCount` keep meaning "what the portal returned"; the dataset header
  reads `{n} portal rows · {m} corrected`.

---

## 6. Trust and reversibility

The operator must always be able to answer five questions.

| Question                              | Where it is answered                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What did the portal actually say?** | Never overwritten (§3.1). Per cell: the portal's value is printed struck through under the corrected one, and in the cell's tooltip. Whole dataset: `GET /iras-data/snapshots/:id/export.csv` (the corrected rows, with `-corrected` in the filename when the day has corrections). Pre-filter truth: `rawStorageKey` in artifact storage, unchanged. |
| **Who changed it?**                   | `by` on every correction, and the audit entry's actor.                                                                                                                                                                                                                                                                                                |
| **When?**                             | `at` / `updatedAt` on the correction, the dealer's correction list at the foot of the editor, and the audit entry.                                                                                                                                                                                                                                    |
| **Why?**                              | `reason`, **required** at commit (3–500 chars) and stamped on every correction in that commit. This is the one place the spec adds friction on purpose: one sentence is what makes a correction readable a month later, and the receipts flow's optional note has already proved that optional means blank.                                           |
| **How do I put it back?**             | Three scopes, below.                                                                                                                                                                                                                                                                                                                                  |

### Revert affordances

- **Revert cell** — `Use the portal's value` under a corrected cell. Deletes that one
  correction. Enters the pending set, so it commits with everything else.
- **Revert row** — the gutter `⋯` menu, `Undo n corrections`. Removes every correction on the
  row, including an exclusion; a hand-added row has its own delete.
- **Revert day** — the API accepts `revertDay: true`, which removes every correction on the
  day and marks reports stale like any other change. No control in the editor sends it today.

Reverts travel through the **same** `PUT` as edits (§7), which is deliberate: one write
path, one audit shape, one `markReportsStaleFrom` call, and "revert this cell and fix that
one" is a single commit rather than two competing staleness events.

### Audit trail

- `IRAS_DATA_EDIT` — any commit that adds or changes corrections.
- `IRAS_DATA_REVERT` — a commit that only removes them.
- `IRAS_DAY_VERIFY` / `IRAS_DAY_UNVERIFY` — a day's unexplained gap accepted or withdrawn (§12).

Entity `Dealer`, `entityId = dealerId`, so the dealer's audit tab shows them. `before` / `after`
carry `{ businessDate, changes: [{ code, rowKey, field, from, to, kind }], staleDates, reason }`.
One entry per commit, not per cell, so the audit log reads as a list of decisions.

> **Implementation note:** `@dk/shared` has four byte-identical vendored copies. Any change to
> the correction contract or the enums means mirroring it to all four and md5-verifying.

Nothing about corrections is dealer-visible. The dealer sees a corrected report, not a
correction history.

---

## 7. Surface contract (shape only — no code)

All under `/iras-data`, `requireRole('admin')` for the whole router (any admin may edit; there
is no super-admin gate). `assertDealerNotArchived` on every write.

**Read — one request, so the screen never renders half-known state:**

`GET /iras-data/dealers/:dealerId/days/:businessDate`

```
{ dealer:      { id, code, roCode, archived, portalCollection: 'ACTIVE' | 'PAUSED' | 'NONE' }
  businessDate
  snapshot:    IrasDataSnapshot | null        // the PORTAL's rows, verbatim
  corrections: IrasDataCorrection[]
  orphaned, duplicateRisk, portalChanged      // §3.4, §5.5
  revision:    string                         // optimistic-concurrency token
  previousTotReadings: Record<string, string> // nozzle -> D-1 reading, for the backwards-meter check
  previousStkRows:     Record<string, { productDip, waterDip, netQty }>
  slipRead:    boolean                        // whether reading a slip is on and usable (§12)
  dsr:         { attached, configError, products[], receiptBasis, reportDates[], sharedDates[] } }
                                              // products[]: per product its tanks, nozzles, IRAS prod codes and
                                              // any meter scale — the layout the editor lays a hand-typed day out from
```

The payload holds the raw rows and the corrections separately. The editor applies the
corrections itself with the same shared function the engine uses (`applyIrasCorrections`), so
the grid can show both values at once and the two cannot drift apart. The field policy (§5.1)
is imported from `@dk/shared`, not sent.

**Write — one endpoint for every kind of change, including reverts:**

`PUT /iras-data/dealers/:dealerId/days/:businessDate/corrections`

```
{ revision, reason, edits[], addedRows[], excludeRowKeys[], restoreRowKeys[],
  deleteAddedRowKeys[], revertRowKeys[], revertDay, slipReadIds[] }
→ the day's corrections, changes[], staleDates[], revision
```

409 on a revision mismatch. `reason` is 3 to 500 characters. An `edits[]` entry with a `null`
value reverts that cell to the portal's figure. A commit is all-or-nothing.

**Preview — the one extra endpoint, and the reason it is worth it:**

`POST …/days/:businessDate/corrections/preview` → per-product before and after variation.
Read-only: it applies the pending set in memory, runs `computeProduct` against the real prior
day, and persists nothing. It turns _"I changed a number"_ into _"the variation moves back
inside the limit"_, the thing the operator cannot check any other way before committing.

**Also on this router:** `GET /vault`, `GET /snapshots`, `GET /snapshots/:id`,
`GET /snapshots/:id/export.csv` (corrected rows, `-corrected` in the filename),
`GET /dealers/:dealerId/latest`, `POST /dealers/:dealerId/collect`,
`GET /dealers/:dealerId/day-states`, `PUT|DELETE …/days/:businessDate/verification`,
`POST /dealers/:dealerId/days/:businessDate` (open a hand-typed day), `POST …/read-slip`,
`GET /dealers/:dealerId/slip-reads/:slipReadId/photo-url`, and
`GET /dealers/:dealerId/corrections` (every correction on a dealer, across days).

There are no receipts endpoints. The DSR router says so itself (§8).

---

## 8. What happened to receipts

The first version of this spec kept receipts in their own store and merely put one screen over
both mechanisms. That was reversed when it shipped: **receipts were folded into the correction
overlay**, which is what the owner asked for ("one override mechanism, one audit shape, one
staleness event").

- **The modal is gone.** `DsrReceiptsDialog.tsx` is deleted. The per-product "Receipts band"
  the first design put at the top of the editor was never built.
- **A missing tanker is a `REC` row** added in the grid (§5.5), carrying its invoice in the
  portal's own `INVOICE_NUMBER` column. A wrong litres figure is a cell edit on the `REC` row.
- **The `/dsr/…/receipts` routes are gone.** `DSR_RECEIPT_SET` and `DSR_RECEIPT_CLEAR` stay in
  the audit list only so old rows still read. The `DsrManualReceipt` model file survives only
  for the migration script.
- **Existing receipts were migrated** by `scripts/migrateDsrReceiptsToCorrections.ts`, which ran on
  production on 17 Aug 2026. The two legacy entries, both on 13 Aug, became cell corrections on
  the portal's own rows: `txn:444` (HSD, 7,858 → 8,000) and `txn:443` (MS, 3,933 → 4,000). The
  engine's figures were checked against the old ones and the originals deleted.
- **One save path.** Everything goes through `PUT …/corrections`; there is no two-step commit.
- **Entry points.** The DSR report toolbar, the DSR empty state and the dealer's DSR tab carry
  `Correct shift data` (`EditShiftDataButton`), which opens
  `/data-vault/dealers/:dealerId/days/:businessDate`. With no date it opens today. The Vault
  drawer and `SnapshotDetail` carry `Correct this day`.
- **Precedence is gone with the mechanism.** There is no "manual receipt replaces the portal's
  figure" rule and no locked-by-receipt cell state. A person's figure on a row wins over the
  row's other figure and is used exactly as typed (§5.2).

The dealer's "M" marker and the "entered manually / IRAS reported X" footnote on a corrected
report went with `receiptSource`; a hand-typed day prints no "IRAS reported 0 L" either.

---

## 9. Acceptance criteria

Numbered so QA can walk them. Every one is observable in the admin.

**Editing and calculation**

1. Correcting `TOT.TOT_READING` for nozzle 5 on `D`, applying, and regenerating changes the
   sales figure in `D`'s report and every cumulative figure after it. `D-1`'s report is not
   marked stale (§3.5).
2. Correcting `STK.NET_QTY` for tank 3 on `D` changes that product's opening stock and its
   variation on `D`, and the variation on every later report.
3. Correcting a `REC` row's litres changes the product's receipt; a person's figure is used
   exactly as typed.
4. The `Review & apply` preview's `after` variation equals the regenerated report's
   variation, exactly.
5. Editing only an inert column changes no report figure, marks nothing stale, and offers no
   regeneration.

**Durability (the blast-radius tests)**

6. `Re-collect` a day that has corrections: the corrections are still in force afterwards,
   the day is marked "portal re-sent" where values changed, and reports from `D` are stale if
   the readings changed.
7. `Re-collect` a day where a corrected nozzle no longer appears: the correction is orphaned,
   listed for review, **not** applied, and **not** deleted.
8. Regenerating a DSR (which may drive a nested IRAS collection for a _missing_ day) never
   loses a correction on a day that was already COMPLETE.
9. `compute.test.ts` and `guideline.test.ts` pass unchanged.
10. `GET /iras-data/snapshots/:id` returns the raw portal rows, byte-identical to before.

**Guardrails**

11. A stock row's `TANK_NO` on a portal row cannot be edited. Other identity columns can, with
    their warning shown.
12. Adding a `STK` or `TOT` row whose tank or nozzle already has a row, in the portal's data, in
    an earlier commit or in the same commit, is blocked with the double-count message.
13. A `REC` row can be added and excluded; a second `REC` row on the same tank is allowed.
14. A commit is all-or-nothing: an invalid cell anywhere blocks `Apply`, and a server error
    leaves zero corrections written.
15. Two browsers editing the same day: the second commit is rejected with 409 and loses
    nothing.

**Trust**

16. Every corrected cell shows the portal's original. The actor, the timestamp and the reason
    are in the dealer's correction list and the audit entry.
17. `Revert cell` / `Revert row` each restore the portal's values and mark the right reports
    stale.
18. Every commit writes exactly one audit entry, visible on the dealer's audit tab.

**Shell**

19. Below `md` every row is a card and no column is cut off; the page body does not scroll
    horizontally.
20. No new runtime dependency in `mdg-admin/package.json`.

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
- **Automatic regeneration** on commit, and **automatic re-sharing** of a corrected report.
  Both stay deliberate clicks; a regeneration can open a portal session and a re-share
  messages a dealer. A re-share is stamped "Revised" (संशोधित) in the dealer's chat, and a
  regenerated report keeps a `sharedSuperseded` marker, so "they hold an older version" stays
  visible.
- **Dealer-visible provenance.** Dealers see corrected reports, never a correction log.
- **Editing other Vault datasets** (PAD ledger, Inspection Reports). The registry
  (`dataVault/datasets.ts`) makes that a later, additive change.
- **A collection-to-collection diff view** for one day. The per-cell `Portal originally /
Portal now` lines cover the case that matters.

Known gaps still open: no cross-dealer "reports out of date" queue; one regenerate run heals at
most `REPAIR_MAX_DAYS` = 14 following days, so a longer stale chain needs another press.

---

## 11. Decisions the owner made

Items 1, 2, 4 and 5 were the owner's, taken in the UAT before the build. Item 3 was this spec's
own default and shipped as written.

1. **Identity columns are typed in the cell, with a loud warning** (§5.3). No re-attribution
   dialog.
2. **Any admin can edit.** No super-admin gate (parity with the receipts editor it replaced).
3. **A commit-level reason is mandatory** (the spec's default), 3 to 500 characters. It is the only field that makes
   the audit trail readable later; the receipts flow's optional note had already shown that
   optional means empty.
4. **Receipts are unified into the row layer** (§8), and `REC` rows can be added and excluded.
5. **A day must be collected before it can be edited**, with one exception added later: an
   admin can open a day by hand (§12).

---

## 12. Added after ship

**Hand-typed days (21 Aug 2026).** An outlet with no portal account (16E) can have its shift
typed in and get a normal DSR. `POST /iras-data/dealers/:dealerId/days/:businessDate` opens an
empty day (`source: 'MANUAL'`, no rows, no dataset windows) and refuses without a shift time on
record. Every figure then goes in as an `ADDED_ROW` correction, which keeps author, time and
reason and marks every field hand-set. Four things turn on `source`: a stray failed collection
cannot blank a typed day; the report prints no "IRAS reported 0 L"; added rows must carry
`PRODCODE` (and the tank on `TOT`); and the Vault counts only portal rows in `rowCount`. The
engine applies **no decant window** on a hand day: whatever stamp a tanker carries, it counts on
the day being typed. Opened by "Start this day by hand" in the editor; the dealer's service
attachment stays paused so nothing tries to collect from a portal that does not exist.

**The Shift sheet (31 Aug 2026).** A hand-typed day opens on a sheet with every nozzle and tank
the outlet has already laid out from its DSR layout (`shared/src/iras/dayPlan.ts`), and one
button saves and builds the report. Yesterday's meter readings, stock and product dip sit in the
boxes as a starting point, and a box nobody has touched **blocks saving**: a day in which every
figure is still yesterday's is a morning nobody did, and the commit itself refuses it. Typing the
same reading back only warns that the nozzle sold zero litres. The water dip carries forward
without blocking, because the engine never calculates with it. The sheet is built for a phone
(`mdg-admin/docs/MOBILE.md`).

**The slip reader (2 Sep 2026, ADR 0012).** On a hand-typed day an operator can photograph the
meter printout instead of typing about sixty digits. `POST …/days/:businessDate/read-slip`
answers with what the paper says and writes one `SlipRead` row; nothing fills a box on the
server. Two readers look at the slip, the on-box reader is the authority, and arithmetic on the
slip's own counters is what proves a reading. Every figure still arrives through the ordinary
commit, so the client-side backwards-meter block still applies. Off unless `SLIP_READ_ENABLED`
is on and a second reader is configured; the day payload's `slipRead` says so.

**Day verification.** A closed day whose figures do not add up (an unexplained litre gap in a
grade) can be accepted by a named admin with a one-line note (`PUT|DELETE
…/days/:businessDate/verification`, audited `IRAS_DAY_VERIFY` / `IRAS_DAY_UNVERIFY`). The
acceptance is stored against the _gap_, not the date: if a later correction moves the gap, the
verification reads stale and the day goes back in front of somebody. `GET …/day-states` lists
the dealer's days by calendar, including the days nothing was collected for.

**Re-collection marks reports stale** when the shift or the readings changed (§3.4).
