# UAT — Editable IRAS shift data (the Shift Data Editor)

**Status:** v1 (pre-build) · **Owner:** UAT · **Last updated:** 2026-08-17
**Surface:** `mdg-admin` only (internal, desktop, English). Nothing on this screen
is dealer-facing — but everything on it changes what the dealer is shown.
**Spec:** `docs/product/iras-data-editing.md`, **as amended** by the four owner
decisions restated in §0 below. Where the spec and §0 disagree, **§0 wins** and
this plan tests §0.

This plan verifies that every field of a dealer's collected IRAS shift data
(`TOT` nozzle totalisers, `STK` tank stock/dips, `REC` decantation receipts) can
be corrected in a spreadsheet-like grid; that the Daily Sales Report then
computes from the corrected data; that affected reports are flagged and can be
rebuilt; and — the part that actually matters — that **the number the dealer ends
up holding on their phone is the corrected one**.

It follows the conventions of `docs/uat/staff-points-and-chat-uat.md`: every
scenario names the **persona**, its **preconditions**, **numbered plain-language
steps**, an **expected result**, and a **PASS / FAIL** box. Code references are
given as `file:line` for whoever wants to read along; a tester never needs to
open them.

> **Read this before you start.** At the time of writing, only the shared
> contract exists (`shared/src/types/irasData.ts`, `shared/src/iras/fields.ts`,
> `shared/src/iras/corrections.ts`). The backend seam (`getEffectiveSnapshot`),
> the endpoints and the admin screen are **not built yet**, and the three vendored
> copies of `@dk/shared` (`mdg-backend/shared`, `mdg-admin/shared`,
> `mdg-client/shared`) do **not** carry the new contract. So this is a plan to run
> against the build when it lands, not a session you can run today. §S0 gates on
> exactly that.

---

## 0. The four decisions this plan tests (they override the spec)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                      | What it changes for a tester                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Identity columns are edited inline**, with a loud warning — no re-attribution dialog.                                                                                                                                                                                                                                                                                                                       | `TANK_NO` / `NOZZLE_NO` / `PRODCODE` / shift date-time / txn id are typed straight into the cell. Expect a warning border, an inline consequence note, a separate high-risk block in the commit dialog, and one-click revert. **Scenario G1.** |
| 2   | **Any admin can edit** — no super-admin gate (parity with today's receipts editor).                                                                                                                                                                                                                                                                                                                           | A plain admin must succeed. **Scenario S0 step 6.**                                                                                                                                                                                            |
| 3   | **A day must be collected before it can be edited.**                                                                                                                                                                                                                                                                                                                                                          | The old receipts modal let you pre-enter a receipt for an uncollected day. That capability is **gone**. **Scenario U1.**                                                                                                                       |
| 4   | **Receipts are unified into the row-override layer.** `DsrManualReceipt` (model, service, endpoints) and `DsrReceiptsDialog` are **deleted**; add/exclude works on all three datasets **including `REC`**; the 2 legacy production receipt entries on 2026-08-13 are migrated into row overrides; a missing tanker is now "add a `REC` row" carrying its invoice in the portal's own `INVOICE_NUMBER` column. | There is no Receipts band and no Receipts button anywhere. **Scenarios R1, R2, R3** — and **R3 is a data migration, so run it first and check it before anything else.**                                                                       |

**Staleness rule under test:** `markReportsStaleFrom(dealerId, D)` — i.e. `>= D`,
for every dataset including `TOT`. The spec's claim that a `TOT_READING`
correction on day `D` invalidates **`D−1`'s** report is **wrong**: day `D−1`'s
report was generated on `D−1`, when `D−1`'s sales were still open (`sales: null`);
`sales(D−1)` is computed while generating **`D`** and appears in **`D`'s** report
(`generate.ts:82-118`, `compute.ts:276-301`). A tester should therefore expect
`D` and everything after it to be flagged, and `D−1` **not** to be flagged.

---

## 1. How to run

```bash
# From the mdg-service workspace root:
nvm use                      # Node 20 (.nvmrc)
npm install

cp mdg-backend/.env.example mdg-backend/.env     # Mongo 7+, JWT secret, S3/MinIO
npm run seed --workspace mdg-backend             # idempotent

npm run dev                  # backend :4000, admin :5173, client :5174
```

Then:

- **Admin portal:** http://localhost:5173 — `admin@dealerkavach.local` / `Admin@12345`
- **Dealer client** (only needed for H1 step 12 and REG2): http://localhost:5174

Gate on the backend smoke check before you start:
`bash mdg-backend/scripts/smoke.sh http://localhost:4000`.

### Which database to point at

This feature **writes to a real dealer's financial figures and can message a real
dealer**. Choose one:

- **Preferred:** a local Mongo restored from a production dump, so 15E's real
  snapshots and reports are present but nothing you do reaches anybody. All
  scenarios are then safe to run as written.
- **Against production 15E:** allowed, but obey the three safety rules below.

> ### Safety rules if you run against the live dealer
>
> 1. **Never press `Share with dealer`** in any scenario except H1, and in H1 only
>    after you have told the dealer's account owner. Sharing posts two card
>    images and a push notification to the dealer's phone (`share.ts:197-242`).
> 2. **Finish every scenario with `Revert this day` → `Regenerate`**, so the
>    dealer's history is left exactly as you found it. Note the "before" numbers
>    first (§S0 step 4).
> 3. **Pick a date whose report has NOT been shared** for the destructive
>    scenarios. The report view shows a disabled `Shared` chip with a timestamp
>    when it has (`DsrReportPanel.tsx:252-264`).

---

## 2. Test dealer and data preconditions

| Thing                        | Value                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| Dealer                       | **15E** — the outlet the whole DSR engine is pinned to           |
| `dealerId`                   | `6a722edc7fb504c022668be8`                                       |
| Generated DSR reports        | **2026-08-08 → 2026-08-17** (10 days)                            |
| Legacy hand-entered receipts | **2 entries on 2026-08-13** (to be migrated — R3)                |
| Editor URL                   | `/data-vault/dealers/6a722edc7fb504c022668be8/days/<YYYY-MM-DD>` |
| DSR report URL               | `/dsr/dealers/6a722edc7fb504c022668be8`                          |
| Per-dealer Vault             | Dealers → 15E → **Data Vault** tab                               |

### 15E's DSR configuration — memorise this table, every expectation depends on it

From the dealer's own macro workbook, pinned in `compute.test.ts:33-63`. **Confirm
it on screen** (Dealers → 15E → Services → Daily Sales Report) before you start;
config can be edited and this plan's arithmetic follows the config, not this page.

| Product                     | Tank  | Nozzles   | Evaporation | Permissible |
| --------------------------- | ----- | --------- | ----------- | ----------- |
| **HSD** (HIGH SPEED DIESEL) | **2** | **8, 10** | 0.25 %      | 4 %         |
| **MS** (MOTOR SPIRIT)       | **1** | **7, 9**  | 0.75 %      | 4 %         |

Also: testing is **5 L per nozzle that moved at least 1 L** since yesterday, so a
normal day is **10 L per product**. Variation is cumulative **since 2026-04-15**.

> **The nozzles interleave.** Portal order is 7, 8, 9, 10 — so HSD's two nozzles
> (8 and 10) are _not_ adjacent in the grid; an MS nozzle sits between them. When
> a scenario says "nozzle 8", read the nozzle number in the row, never the row's
> position.

### Sanity numbers for 2026-08-09 (the day the engine is pinned to)

Open `/dsr/dealers/6a722edc7fb504c022668be8` and select **Sat, 09 Aug 2026**.
Unless something has since been corrected on or before that day, it should read:

| Figure               | Expected                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| HSD variation        | **−1,464.78 L** · band **1,144.72 L** · **320.06 L outside** (Short beyond limit) |
| MS variation         | **+38.74 L** · band **202.40 L** · Within limit                                   |
| HSD sales for 08 Aug | **1,417.4 L**                                                                     |
| MS sales for 08 Aug  | **1,073.8 L**                                                                     |
| HSD dip printed      | **65.11** (portal `PRODUCT_DIP` 651.1 ÷ 10)                                       |
| HSD opening stock    | **5,640.83 L** · MS **5,059.92 L**                                                |

If they differ, don't stop — write down what you actually see and use **deltas**
from here on. Every expectation in this plan is a _change_ from a "before"
number you wrote down, never an absolute.

---

## 3. Personas

| Persona    | Role                  | Identity used in steps                     | Why they're here                                                            |
| ---------- | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| **Arjun**  | `admin` (plain ops)   | `admin@dealerkavach.local` / `Admin@12345` | The operator. Decision 2 says a plain admin must be able to do all of this. |
| **Meera**  | `admin` + super-admin | any super-admin login                      | Only to prove nothing here is super-admin-gated.                            |
| **Ramesh** | `dealer-owner` of 15E | 15E's owner login on the client            | The person holding the number. Appears in H1 and REG2 only.                 |

---

## 4. Vocabulary for the tester

- **TOT** — one row per nozzle. The meter total (`TOT_READING`). Yesterday's
  sales are the difference between today's and yesterday's reading.
- **STK** — one row per tank. The dip and the stock in the tank.
- **REC** — one row per delivery decanted into a tank.
- **Dip** — the report prints `PRODUCT_DIP ÷ 10`. 651.1 in the grid → 65.11 on
  the report.
- **Variation** — meter sales vs tank dips since the last inspection. Positive =
  stock over; that **suspends sales and supplies of all products**, so a
  correction that pushes variation positive is the expensive kind of mistake.
- **Permissible band** — 4 % of stock, plus a 0.25 % / 0.75 % evaporation
  allowance **only when the variation is negative**.
- **Out of date / stale** — a generated report whose inputs changed after it was
  built. Shows a yellow banner with a `Regenerate` button
  (`DsrStaleNotice.tsx:42-81`).
- **Shared** — the report's two card images have been posted into the dealer's
  chat. Once shared, the button reads a disabled `Shared` with a timestamp.

---

## 5. How to predict the number without asking an engineer

This is the tester's most important tool. Every rule below is a direct
consequence of `compute.ts` and is **exact, not approximate**.

| You change                                             | On day D, expect exactly                                                                                                                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REC.NET_QTY_DECANTED` for an HSD tank, **+X litres**  | HSD **variation moves −X**. "Receipts" on the variation card **+X**. Sales, cumulative and testing **unchanged**. Every later report's HSD variation also moves −X.                                        |
| `STK.NET_QTY` for tank 2, **+Δ litres**                | HSD **opening stock +Δ**, **variation +Δ**, **permissible band +0.04 × Δ** (4 %). Sales unchanged. Later reports' variations **unchanged** (only that day's stock is used).                                |
| `STK.PRODUCT_DIP` for tank 2                           | The printed dip becomes **your value ÷ 10**. **Nothing else moves at all.**                                                                                                                                |
| `STK.WATER_DIP`                                        | The printed water dip only.                                                                                                                                                                                |
| `TOT.TOT_READING` for nozzle 8, **+Δ litres**          | **HSD sales for D−1 goes up by Δ** (shown in **D's** report), HSD **variation on D +Δ**, and **HSD sales for D goes down by Δ** (shown in **D+1's** report). Cumulative from D onwards nets out unchanged. |
| Anything in a hidden ("not used in the report") column | **Nothing.** No figure, no report, no stale flag.                                                                                                                                                          |

Worked example you can check against §2's sanity numbers: HSD's band on 09 Aug is
`0.25 % × 367,635.39 (= 919.09) + 4 % × 5,640.83 (= 225.63) = 1,144.72 L`. If you
add 1,000 L of stock to tank 2, the band becomes `919.09 + 4 % × 6,640.83 =
1,184.72 L` and the variation becomes `−464.78 L` — now **inside** the band.

---

## 6. Cross-cutting checks (run these opportunistically, in every scenario)

### X1 — The four-step chain is never allowed to look finished when it isn't

Getting a corrected number to the dealer is **four** acts:
**commit → reports flagged → Regenerate → re-share**. At every step, confirm the
screen names the step that is still outstanding, by name, with a button.

- After **Apply**: the screen must say how many reports need regenerating and
  offer `Regenerate reports`. It must **not** read as "done".
- While **rebuilding**: a visible in-progress state, and the page must survive a
  refresh without losing the fact that a rebuild is owed.
- After the rebuild: the screen must **re-read what is still out of date** and
  say so. It must never assert "nothing on this dealer is out of date" without
  having checked (`GET /dsr/dealers/:id/stale`).
- If any affected report **had been shared**, the screen must still be telling
  you to re-share it _after_ the rebuild — not only before the commit.
  **PASS ☐ FAIL ☐**

### X2 — "Did my edit matter?" is answered honestly, every time

- Columns the report does not read are **hidden by default**; the toggle is
  `Used in the report` (on) / `Show all portal columns`
  (`shared/src/iras/fields.ts:40-45`).
- A revealed unused column reads visibly differently and its tooltip says so
  ("Stored, but today's report does not use this number").
- A commit containing **only** unused columns says so before you commit, flags
  nothing and offers no rebuild.
- The **loud identity warning appears only where changing the cell really moves
  money** — i.e. on `TOT.NOZZLE_NO`, `STK.TANK_NO`, `REC.TANK_NO`. `PRODCODE`
  (all three datasets) and `TOT.TANK_NO` must **not** carry a scary warning: the
  report never reads them, and the field table says so in its own hints
  (`fields.ts:118-131, 174-180, 209-215`). A warning on those cells is a FAIL —
  it teaches the operator that a no-op edit was consequential.
  **PASS ☐ FAIL ☐**

### X3 — Screen width

- At **900 px**, each grid scrolls **inside its own card** with the first column
  pinned; the page body must not scroll sideways.
- **Below 900 px**, the day is read-only with one notice ("Editing needs a wider
  screen"). No half-working editor on a phone. **PASS ☐ FAIL ☐**

---

## 7. Scenario index

| #    | Scenario                                                           | Persona        | Kind        |
| ---- | ------------------------------------------------------------------ | -------------- | ----------- |
| S0   | Environment + data preconditions, and "a plain admin can edit"     | Arjun / Meera  | Setup       |
| R3   | **Migrate the 2 legacy receipts on 2026-08-13** (run first)        | Arjun          | Migration   |
| H1   | Happy path end to end — correction → dealer's report shows it      | Arjun + Ramesh | Happy       |
| D1   | `TOT` — a transposed meter reading                                 | Arjun          | Per dataset |
| D2   | `STK` — a dip read on the wrong tank                               | Arjun          | Per dataset |
| D3   | `REC` — the portal recorded the wrong number of litres             | Arjun          | Per dataset |
| R2   | `REC` — a tanker the portal never recorded (add a row)             | Arjun          | Receipts    |
| V1   | Preview = regenerated report = the dealer's card                   | Arjun          | Verify      |
| V2   | **A closed day: does the correction reach the ledger?**            | Arjun          | Verify      |
| U1   | The day was never collected                                        | Arjun          | Unhappy     |
| U2   | The collection FAILED                                              | Arjun          | Unhappy     |
| U3   | The dealer has no DSR service attached                             | Arjun          | Unhappy     |
| U4   | A re-collection lands after an edit (portal changed / orphaned)    | Arjun          | Unhappy     |
| U5   | The report for that day was already shared with the dealer         | Arjun          | Unhappy     |
| U6   | An edit that changes nothing (unused column, and a no-op)          | Arjun          | Unhappy     |
| U7   | Abandoning uncommitted changes (Escape, navigate, reload)          | Arjun          | Unhappy     |
| U8   | Two admins on the same day (409)                                   | Arjun + Meera  | Unhappy     |
| U9   | Archived dealer, future date, impossible date                      | Arjun          | Unhappy     |
| G1   | Identity-column edit, inline (decision 1)                          | Arjun          | Guardrail   |
| G2   | Duplicate row / excluding a product's last row                     | Arjun          | Guardrail   |
| G3   | Blanking a load-bearing cell                                       | Arjun          | Guardrail   |
| T1   | Trust — portal value, who, when, why, and three scopes of revert   | Arjun          | Trust       |
| REG1 | Regression — the read-only Vault, CSV, Collect now, other datasets | Arjun          | Regression  |
| REG2 | Regression — DSR generate / share / chat, and the dealer's app     | Arjun + Ramesh | Regression  |
| REG3 | Regression — the engine's own tests still pass byte-for-byte       | any            | Regression  |

---

# SETUP

## S0 — Environment, data preconditions, and "any admin can edit" — `admin` (Arjun), then Meera

**Preconditions**

- Backend, admin and (for H1) client running; smoke check green.
- You know which database you are pointed at (§1).

**Steps**

1. **Shared contract is mirrored.** In a terminal at the repo root, confirm the
   new shared module reached all four copies of `@dk/shared`:

   ```bash
   for d in shared mdg-backend/shared mdg-admin/shared mdg-client/shared; do
     echo "== $d"; ls $d/src/iras/ 2>&1 | head -3
   done
   ```

   **Expected:** all four list `corrections.ts` and `fields.ts`. If only the root
   `shared/` has them, **stop** — the admin and backend cannot compile against the
   contract and nothing below can pass.

2. **Builds are clean.** `npm run typecheck` at the root, then
   `npm run build --workspace mdg-admin`. **Expected:** exit 0, and **no new
   runtime dependency** in `mdg-admin/package.json` (no ag-grid, no
   Handsontable).

3. **The day exists.** Open `/data-vault`, pick **IRAS shift data**, set the
   business date to **2026-08-13**, find 15E in the list. **Expected:** status
   **COMPLETE**, with row counts for TOT, STK and REC.

4. **Write down the "before" numbers** for 2026-08-12 → 2026-08-17 from
   `/dsr/dealers/6a722edc7fb504c022668be8`. For each day, for each product:
   variation, permissible band, "Receipts", and the sales figure of the day
   before. You will compare against these all session. Also note **which of
   those reports show a `Shared` chip** and their share timestamps.

5. **Open the editor.** From 15E's row → drawer → **`Edit data`**. **Expected:**
   the URL is
   `/data-vault/dealers/6a722edc7fb504c022668be8/days/2026-08-13`; the header
   carries the dealer name, code, RO, the date, the COMPLETE chip, "Collected
   at …" and a one-line shift summary (`Shift 05:59:59 · configured 06:00 · N
other shifts were offered`) with a disclosure. Three grids: `REC`, `STK`,
   `TOT`. No Receipts band anywhere (decision 4).

6. **All three doors work.** Confirm you can reach the same URL from: (a) the
   cross-dealer Vault drawer, (b) Dealers → 15E → **Data Vault** tab →
   `SnapshotDetail`'s action slot, (c) the DSR report toolbar at
   `/dsr/dealers/6a722edc7fb504c022668be8` — where the old `Receipts` button was,
   now reading **`Edit shift data`** and dated to the report on screen.

7. **Decision 2 — no super-admin gate.** You (Arjun) are a **plain** admin. You
   must be able to open the editor, type in a cell, and see the sticky footer
   appear. Then sign in as Meera (super-admin) and confirm she sees **exactly the
   same screen** — no extra controls, no extra warnings.

8. **The old receipts surface is gone.** Search the admin for a `Receipts`
   button: the DSR report toolbar, the DSR empty state, Dealers → 15E → **Daily
   Sales Report** tab toolbar and its empty state (the four old call sites,
   `DsrReportView.tsx:184, 225`, `DealerDsrTab.tsx:138, 177`). **Expected:** all
   four now read `Edit shift data` and deep-link to the editor. No dialog titled
   "Receipts" exists anywhere.

**Expected result**

The contract is mirrored to all four copies, both apps build with no new
dependency, 2026-08-13 is COMPLETE for 15E, the editor opens from all three
doors, a **plain admin** has full edit capability, and the receipts modal is gone
from all four of its old entry points.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# MIGRATION — do this before anything else

## R3 — The 2 legacy receipts on 2026-08-13 become row overrides — `admin` (Arjun)

Decision 4 deletes `DsrManualReceipt`. The two live entries on 2026-08-13 must
land in the new layer with **the same effective litres**, or 15E's report silently
changes.

**Preconditions**

- You have the two legacy entries' details to hand (product, litres, invoice,
  note, entered-by, entered-at). Before the migration runs, read them from
  Dealers → 15E → audit trail (`DSR_RECEIPT_SET` entries) or from the old
  Receipts dialog if the build still has it.
- You have written down 2026-08-13's report figures (S0 step 4).

**Steps**

1. **Record the "before" state.** For 2026-08-13, note for each product: the
   effective **Receipts** figure on the variation card, the **variation**, and
   whether the report's sheet shows a small **`M`** superscript next to the
   receipt figure with a footnote "Entered manually — IRAS reported X"
   (`render.ts:110-123`, `cards.ts:449-450, 484-491`).
2. **Run the migration** as the release runbook specifies.
3. Open the editor for **2026-08-13**. **Expected:** the `REC` grid shows, for
   each migrated tank, `NET_QTY_DECANTED` **corrected to the litres the legacy
   entry stated**, with the portal's own figure preserved behind it (corner
   marker → popover → `Portal said …`).
4. **The reason and the paper trail survived.** The popover must show the
   original `entered-by` / `entered-at` and a reason derived from the legacy
   `note`; if the legacy note was blank, the reason must say where it came from
   (e.g. "Migrated from the receipts editor, 13 Aug 2026") — never an empty
   reason.
5. **The invoice survived.** Reveal all portal columns and confirm the legacy
   invoice / DSN number is in **`INVOICE_NUMBER`** on the right row.
6. **The number did not move.** Regenerate 2026-08-13 and compare against step 1.
   **Expected:** Receipts and variation are **bit-identical** to before the
   migration, for both products.
7. **The `M` marker.** Look at the regenerated report's sheet and at the dealer's
   Daily Sales card. **Expected — and confirm this against product before you
   call it:** with `DsrManualReceipt` gone, `receiptSource` is `'iras'`, so the
   `M` superscript and the "IRAS reported X" footnote **no longer appear**. That
   is a visible change to a report the dealer may already hold. If product
   intended the marker to survive, this is a **FAIL**; if they accepted the loss,
   record it as expected and move on.
8. **Nothing else changed.** Confirm no other date's report figures moved
   (spot-check 08-12 and 08-14 against S0 step 4).

**Expected result**

Both legacy entries are visible and editable as `REC` cell corrections with their
litres, invoice, reason and actor intact; regenerating 2026-08-13 reproduces the
identical Receipts and variation figures; the only difference on the rendered
report is the disappearance of the hand-entered `M` marker, which product has
explicitly signed off.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# THE HAPPY PATH

## H1 — Correction → applied → rebuilt → shared → the dealer's report shows the corrected figure — `admin` (Arjun) + `dealer-owner` (Ramesh)

The whole feature in one scenario. Use **2026-08-16** (or any date whose report
has **not** been shared), and use **HSD** so you can read the effect on one
product.

**Preconditions**

- 2026-08-16 is COMPLETE in the Vault and has a generated report.
- 2026-08-16's report has **not** been shared (no `Shared` chip).
- You wrote down HSD's variation, band and Receipts for 08-16 and 08-17.
- Ramesh can sign in to the client and open the Chat tab.

**Steps**

1. Open `/dsr/dealers/6a722edc7fb504c022668be8`, select **Sun, 16 Aug 2026**, and
   press **`Edit shift data`**. The editor opens on 2026-08-16.
2. In the **`REC`** grid, find the row for **tank 2** (HSD). If the portal has no
   REC row for 08-16, skip to **R2** instead and come back; H1 needs an existing
   row.
3. Click the `NET_QTY_DECANTED` cell, type a value **1,000 L higher** than what
   is there, and press **Enter**.
4. **The footer appears immediately.** **Expected:**
   `1 change pending · N reports will need regenerating, from Sun, 16 Aug 2026`
   with `Discard all` and `Review & apply`. **N must be 2** (08-16 and 08-17) —
   count the reports on or after 08-16 yourself and check the number matches.
   08-15 and earlier must **not** be counted.
5. Press **`Review & apply`**. **Expected**, top to bottom:
   - **What you are changing** — `REC · Tank 2 · Net qty decanted  <old> → <new>`.
   - **What it changes in the report** — a per-product preview. HSD's variation
     must move by **exactly −1,000 L**; MS must read **unchanged**.
   - **What needs regenerating** — 2026-08-16 and 2026-08-17, oldest first.
   - **No shared-report danger block** (this report was never shared).
   - A **required reason** field. Try to apply with it empty: **blocked**.
6. Type a reason ("Tanker of 1,000 L short-decanted at the outlet — UAT H1") and
   press **`Apply 1 change`**.
7. **Expected:** the footer is replaced by
   `1 change applied. 2 reports now need regenerating.` with a
   **`Regenerate reports`** button. Nothing has been rebuilt yet — this is
   deliberate (a rebuild can open an IndianOil portal session).
8. **Prove the halfway state is visible everywhere.** Without regenerating, open
   `/dsr/dealers/6a722edc7fb504c022668be8` for 08-16 **and** 08-17.
   **Expected:** both carry the yellow "This report is out of date" banner naming
   your reason, and each says how many other reports are affected
   (`DsrStaleNotice.tsx:42-57`). The figures on screen are still the **old**
   ones — that is correct; a stale report keeps showing what was shared.
9. Go back to the editor and press **`Regenerate reports`**. **Expected:** an
   in-progress state, then a success message. Refresh the page mid-rebuild:
   the "a rebuild is owed / running" fact must survive the refresh.
10. **Verify the number.** Open 08-16's report. **Expected:** HSD's variation is
    **exactly 1,000 L lower** than the figure you wrote down, HSD "Receipts" is
    exactly 1,000 L higher, MS is untouched, and the yellow banner is **gone**.
    08-17's HSD variation is also exactly 1,000 L lower. 08-15 and earlier are
    **unchanged and were never flagged**.
11. **The variation matches the preview exactly** — compare to step 5. Not
    "close": the same number.
12. **The dealer sees it.** Press **`Share with dealer`** → confirm. As Ramesh on
    the client, open **Chat**. **Expected:** a message with the two card images
    and the bilingual summary; the **Stock variation** card's headline number is
    the corrected one, and the **Daily Sales** card's "RECEIVED TODAY" tile shows
    the corrected litres. Tapping an image opens it full-size. The same report
    appears in the **Reports** tab.

**Expected result**

One cell edit travels the whole chain — pending → previewed → committed → flagged
→ rebuilt → shared — and the number on the dealer's phone is the corrected one,
identical to the preview shown before the commit. Reports before the edited day
are never touched.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# ONE SCENARIO PER DATASET

## D1 — `TOT`: a transposed meter reading — `admin` (Arjun)

**The real situation.** The dealer rings up: "your report says my HSD pump sold
900 litres yesterday, my book says 1,800." Somebody keyed the closing totaliser
into IRAS with two digits swapped — `1,234,567` where the meter reads
`1,235,467`. One row, one number, but it poisons the previous day's sales _and_
everything cumulative after it.

**Preconditions**

- Pick a date **D** in 2026-08-10 … 2026-08-16 whose report is **not** shared.
- Note, from D's report: HSD's variation, and **the sales figure printed for
  D−1**. From D+1's report: **the sales figure printed for D**.

**Steps**

1. Open the editor for D. In **`TOT`**, find the row whose **`NOZZLE_NO` is 8**
   (read the number, not the position — nozzle 8 is the _second_ row).
2. Hover the `TOT_READING` header. **Expected:** it is marked as used by the
   report, with the hint "The meter total. The day's sales are the difference
   between this and yesterday's reading for the same nozzle."
   (`fields.ts:113-117`).
3. Type a value **900 L higher** than what is there. **Before committing**, look
   for a live hint on the cell telling you what the day's litres now imply
   (e.g. `Yesterday 1,234,567 → this is 1,800 L for the day`).
4. **The backwards-meter check.** Now type a value **lower** than nozzle 8's
   **previous-day** reading. **Expected:** a non-blocking warning — "Meters do
   not run backwards — yesterday this nozzle read X." (The previous day's
   readings are on the page payload for exactly this,
   `IrasDayEditorView.previousTotReadings`.) Correct it back to +900 before
   continuing.
5. **The footer's date must be D, not D−1.** **Expected:**
   `1 change pending · N reports will need regenerating, from <D>`. Count the
   reports from D forward and confirm N matches, and that **D−1 is not
   included**.
6. `Review & apply` → the preview must show HSD's variation on D moving **+900 L**
   and the band moving **not at all** (the band follows stock, not meters). Give
   a reason, apply, then **`Regenerate reports`**.
7. **Verify the three places a meter reading lands:**
   - **D's report:** HSD variation **+900 L** vs your note. The sales figure
     printed for **D−1** is **900 L higher**.
   - **D+1's report:** the sales figure printed for **D** is **900 L lower**.
   - **D−1's report:** completely unchanged, and it was never flagged.
8. **Now check the ledger, not just the cards** — this is the step that catches
   the expensive failure. Press **Download Excel** on D's report and open it.
   **Expected:** the row for D in the full sheet shows your **corrected** meter
   reading for nozzle 8, and the cumulative column is continuous — for every day,
   `cumulative(day) = cumulative(previous day) + sales(day)`. Also check the
   report's own on-screen table (the HTML hero) shows the corrected reading.
   **If the variation card moved but the sheet still shows the old reading, this
   is a FAIL — see V2, which exists to characterise exactly that.**

**Expected result**

A single `TOT_READING` correction moves D−1's sales up by exactly the amount
typed, moves D's own variation by the same amount, moves D's sales down by that
amount in D+1's report, leaves D−1's report untouched and unflagged, and appears
in the downloaded Excel sheet and the on-screen table as well as on the variation
card.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## D2 — `STK`: a dip read on the wrong tank — `admin` (Arjun)

**The real situation.** A field visit finds tank 1's and tank 2's dip sheets were
filled in under each other's numbers. Two products' variations are both wrong,
and because one of them is now _positive_, the report is telling the dealer their
sales are suspended.

**Preconditions**

- Pick a date **D** whose report is not shared. Note both products' variation,
  band, opening stock and printed dip.

**Steps**

1. Open the editor for D. In **`STK`** there are two rows: `TANK_NO` 1 (MS) and
   `TANK_NO` 2 (HSD).
2. **Confirm the grid tells you which product each row feeds.** A row must be
   readable as "tank 2 → HIGH SPEED DIESEL" without the tester consulting §2. If
   it does not, note it — this is the single easiest way to correct the wrong row.
3. **Swap the measured values, not the identities.** Copy tank 1's `PRODUCT_DIP`,
   `WATER_DIP` and `NET_QTY` into tank 2's cells and vice-versa. That is 6 cells.
   (Do **not** retype `TANK_NO` — that path is G1.)
4. **Halfway through the swap both tanks hold the same dip.** Confirm nothing is
   saved at that moment: the footer says `N changes pending`, and no report has
   been flagged. This is why the commit is explicit.
5. Check the `PRODUCT_DIP` hint: "Type it exactly as the portal shows it. The
   report divides it by 10 to print the dip." (`fields.ts:157-160`).
6. `Review & apply`. **Expected:** all 6 changes listed, grouped under `STK`, and
   a per-product preview showing **both** products' variations moving.
7. Apply, then **`Regenerate reports`**.
8. **Verify, using the §5 rules:**
   - HSD's opening stock is now tank 1's old `NET_QTY`. Its variation moved **in
     the same direction and by the same litres** as its stock, and its band moved
     by exactly **4 %** of that difference. (On 09 Aug the two tanks differ by
     580.91 L — 5,640.83 vs 5,059.92 — so that day the swing would be 580.91 L
     each way. Use the figures for your own date.)
   - HSD's printed dip is now the value you typed **÷ 10**.
   - MS moved by the mirror amounts.
   - **Later days' variations did not move** (opening stock is a per-day figure).
     Only D's report changes; the flag on later reports is precautionary.
9. **Check the sheet.** Download Excel for D and confirm the row for D shows the
   corrected dip and stock, not the old ones (see the warning in D1 step 8).

**Expected result**

Swapping two tanks' measured values fixes both products in one commit, each by the
arithmetic in §5; the invalid intermediate state is never persisted; and the
printed dip is exactly the typed value ÷ 10.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## D3 — `REC`: the portal recorded the wrong number of litres — `admin` (Arjun)

**The real situation.** The invoice says 12,000 L of HSD; whoever keyed the
decantation at the outlet typed 1,200. The DSR treats the day as 10,800 L short
and the variation blows through the 5.1.11 band.

**Preconditions**

- A date **D** that has at least one `REC` row for tank 2, report not shared.
- Note HSD's variation and Receipts on D **and on the last day (08-17)** — a
  receipt correction is cumulative, so it must move both.

**Steps**

1. Open the editor for D. In **`REC`**, find the tank-2 row.
2. Reveal all portal columns and read the row's paper trail: `INVOICE_NUMBER`,
   `INVOICE_QUANTITY`, `TRUCK_NUMBER`, `NO_OF_CHAMBERS`. **Expected:**
   `INVOICE_QUANTITY` is marked as **not used by the report** (it is the invoice's
   figure; the report counts the _decanted_ litres — `fields.ts:218-221`). This is
   a trap worth checking: correcting `INVOICE_QUANTITY` must change nothing.
3. Deliberately fall into the trap first: change `INVOICE_QUANTITY` to 12,000 and
   look at the footer. **Expected:** it says the change affects **no** report —
   `0 reports will need regenerating` (or equivalent), and `Review & apply` leads
   with "None of these changes affect any report." Discard it.
4. Now correct **`NET_QTY_DECANTED`** from 1,200 to **12,000**.
5. `Review & apply` → the preview must show HSD's variation moving **exactly
   −10,800 L**, and MS unchanged. If HSD was outside the band and 10,800 L is
   enough to bring it back, the preview must say so in words ("outside limit →
   within limit").
6. Apply with a reason quoting the invoice number. Regenerate.
7. **Verify:** HSD's variation on D is 10,800 L lower; "Receipts" on D is 10,800 L
   higher; **08-17's HSD variation is also 10,800 L lower** (the cumulative
   effect); MS untouched on every day; sales and cumulative unchanged everywhere.

**Expected result**

Correcting the decanted litres moves that product's receipt and variation by
exactly the difference, on the edited day **and every later day**, and leaves
sales alone. Editing the invoice quantity instead changes nothing, and the screen
says so before you commit.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## R2 — `REC`: a tanker the portal never recorded (add a row) — `admin` (Arjun)

**The real situation and why it matters most.** This is the single most frequent
reason anyone corrects DSR data. The dealer says 12,000 L of HSD arrived on the
14th; IRAS `REC` has nothing at all, so the DSR reads the day as a 12,000 L stock
surplus — and a **positive** variation suspends sales and supplies of _all_
products. Under decision 4 the fix is the spreadsheet gesture "add a row".

**Preconditions**

- A date **D** with **no** `REC` row for tank 2 (or where you can tell the
  difference), report not shared.
- Note HSD's variation on D and on 08-17. Have an invoice number to type.

**Steps**

1. Open the editor for D → the `REC` grid → **Add a row**.
2. **Expected:** you are made to fill every field the report reads for `REC` —
   `TANK_NO` and `NET_QTY_DECANTED` (`fields.ts:97-101`) — and the row is
   plainly marked **Added**, in its own tint, forever.
3. Enter `TANK_NO` **2**, `NET_QTY_DECANTED` **12,000**, and the invoice number in
   **`INVOICE_NUMBER`** (decision 4's rationale: the paper trail rides in the
   portal's own column, not a bolted-on field).
4. **Unknown tank warning.** Try `TANK_NO` **7** first — a tank not in 15E's DSR
   config. **Expected:** a warning, **not** a block: "Tank 7 is not in this
   dealer's Daily Sales Report configuration, so no product will pick it up."
   Then set it back to 2.
5. `Review & apply` → preview shows HSD's variation moving **exactly −12,000 L**;
   the entry is listed as `REC · Tank 2 · added by hand`. Apply with a reason.
   Regenerate.
6. **Verify:** HSD's variation on D and 08-17 each moved −12,000 L; "Receipts" on
   D is 12,000 L higher; the added row is still visibly `Added` in the editor,
   with a popover naming you, the time and the reason.
7. **THE CASE THIS SCENARIO EXISTS FOR — the portal catches up.** The outlet
   almost always enters the decantation a day or two late. Simulate it: press
   **`Re-collect`** on D (or wait for a scheduled collection) at a point where the
   portal now _does_ carry the 12,000 L decantation.
   **Expected:** the editor must warn you that the portal now reports a
   decantation on tank 2 that your hand-added row may duplicate, and the day must
   be flagged for review. Then regenerate and check HSD's Receipts for D.
   **It must be 12,000 L, not 24,000 L.**
   **If the figure doubles with no warning, this is a FAIL and a release blocker**
   — the receipts mechanism decision 4 replaced was an _override_ precisely so a
   late portal entry could not double-count (`compute.ts:174-181`).
8. Note whether the added row **orphaned**, was **flagged**, or was silently kept.
   Write down which — product needs to know.

**Expected result**

A tanker the portal never recorded can be added as a `REC` row with its invoice,
moves the variation by exactly its litres on the edited day and every later day —
and when the portal later sends the same decantation, the operator is warned and
the litres are **not** counted twice.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# VERIFY — the two checks that decide whether this feature is trustworthy

## V1 — Preview = regenerated report = the dealer's card — `admin` (Arjun)

**Steps**

1. Make any one measured correction (reuse D3's). Screenshot the `Review & apply`
   preview's per-product `after` figures.
2. Apply and regenerate.
3. Compare the **admin variation card** to the screenshot: **identical to the
   last decimal shown**.
4. Compare the **dealer's Stock variation card image** (visible on the report
   page under "Share with dealer") to the same figures.
5. Compare the **downloaded Excel** and the **on-screen HTML report table** for
   the edited day to the same figures.

**Expected result**

Preview, admin card, dealer card, HTML report and Excel all state the same
number. Any disagreement between them is a FAIL, and which pair disagrees tells
you where the bug is.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## V2 — A **closed** day: does a `TOT` / `STK` correction actually reach the ledger? — `admin` (Arjun)

**Why this scenario exists.** The DSR ledger deliberately **freezes** a day's row
once that day has been closed by the next day's report: `upsertTodayRow` writes
only the _receipt_ onto a closed row and returns
(`mdg-backend/src/services/dsr-report/store.ts:97-129`), and the existing test
`'corrects a CLOSED day without disturbing its finalised sales'`
(`test/integration/dsrManualReceipt.test.ts:177`) pins that a receipt is the sole
exception. Every 15E day except the most recent (**2026-08-17**) is closed. If
nothing changed the freeze, a `TOT` or `STK` correction to a closed day reaches
the variation card **but not the ledger** — and the on-screen report table and
the Excel sheet are rendered _from the ledger_ (`render.ts:104`, `xlsx.ts:41`).

**Preconditions**

- A `TOT` correction already applied and regenerated on a **closed** day (D1
  gives you one). Any day 2026-08-08 … 2026-08-16 is closed.

**Steps**

1. On the edited day's report, note the **variation** (should be corrected) and
   the **meter reading printed in the report's own table** for the nozzle you
   edited.
2. **Compare them.** **Expected (pass):** both show the corrected value.
   **If the variation moved but the table still shows the portal's original
   reading, that is the freeze — FAIL.**
3. **Download Excel** and check the row for the edited day. Same comparison.
4. **Walk the cumulative column** across 08-08 → 08-17 in the Excel sheet. For
   every day, `cumulative(day)` must equal `cumulative(previous day) +
sales(day)`. **A single-day discontinuity of exactly the litres you corrected
   is the signature of this bug.**
5. **Check the next day's sales.** The day after your edit must print a sales
   figure for the edited day that is lower by exactly what you added (D1 step 7).
   If it is unchanged, the correction never reached the ledger.
6. **Now repeat the whole thing on 2026-08-17** — the only day whose ledger row is
   still open. **Expected:** everything above passes cleanly there. A pass on
   08-17 and a fail on 08-13 is conclusive evidence of the freeze rather than of
   a bad correction.
7. **Contrast with `REC`.** Repeat on a closed day with a `REC` correction only.
   **Expected:** it propagates fully, because the receipt is the one figure the
   freeze lets through. If `REC` passes and `TOT`/`STK` fail on the same day, you
   have localised the defect precisely.

**Expected result**

A `TOT` or `STK` correction on a **closed** day reaches the ledger, so the
report's own table, the Excel sheet, the next day's sales figure and the
cumulative chain all carry it — not only the variation card. If they do not, this
is a **release blocker**: the dealer's card would show one number and the report
sheet another, and the cumulative sales history would be permanently wrong.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# UNHAPPY PATHS

## U1 — The day was never collected (decision 3) — `admin` (Arjun)

**Preconditions**

- A date with **no** IRAS snapshot for 15E — try a recent date whose Vault row
  reads "Not collected". If none exists, use a date well before the dealer's
  first collection.

**Steps**

1. Navigate straight to
   `/data-vault/dealers/6a722edc7fb504c022668be8/days/<that date>`.
2. **Expected:** no grids. An empty state (database icon) titled "Nothing has
   been collected for this day", body explaining that there are no portal rows to
   correct yet, and a primary **`Collect now`** dated to that day.
3. **Decision 3 in force:** there must be **no** way to enter anything — no
   Receipts band, no "add a row". The old receipts modal allowed pre-entering a
   receipt for an uncollected day; that capability is deliberately gone. If any
   editable field is present here, it is a FAIL against decision 3.
4. Press **`Collect now`** and let it finish (about a minute). **Expected:** the
   screen becomes the editable grids for that day without a manual refresh, or
   tells you plainly to reload.

**Expected result**

An uncollected day offers collection and nothing else — no route to a
correction that has no row to attach to.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U2 — The collection FAILED — `admin` (Arjun)

**Preconditions**

- A 15E day whose snapshot status is **FAILED**. Filter the Vault by status to
  find one; if none exists on 15E, use any other dealer's failed day — this
  scenario is about the screen, not the dealer.

**Steps**

1. Open the editor for that day.
2. **Expected:** no grids (a FAILED snapshot carries no datasets), a red banner
   titled "This collection failed" quoting the portal's **own** failure reason
   verbatim, and a **`Re-collect`** button. Copy must say that correcting figures
   needs a collected day.
3. Confirm there is nothing editable on the page.
4. **Also test PARTIAL** if you can find one: the datasets that _are_ present
   must be **fully editable**, and each missing one shows the existing dashed
   "Not collected" strip with a `Re-collect` link and, secondary, `Add a row by
hand`.
5. **And "good data, failed retry"**: a day with status COMPLETE but a
   `lastFailure` set must show the existing **yellow** banner "The data below is
   good — but the latest re-collection attempt failed"
   (`SnapshotDetail.tsx:124-145`) and stay fully editable. It must **not** be red.

**Expected result**

FAILED offers only re-collection; PARTIAL is editable where it has data and says
what is missing; a COMPLETE day with a failed retry stays editable behind a
warning, not an alarm.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U3 — The dealer has no DSR service attached — `admin` (Arjun)

**Preconditions**

- A dealer with the **IRAS Shift Data** service but **not** the Daily Sales
  Report service. Find one in Dealers → Services, or detach DSR from a scratch
  dealer (never 15E).

**Steps**

1. Open that dealer's editor for a collected day.
2. **Expected:** the grids are **fully editable** — the Vault is
   service-independent and other readers may exist.
3. **Expected:** an inline, calm notice (not a toast, not a red error) reading
   _"This dealer does not have the Daily Sales Report service attached. Attach it
   from the dealer's Services tab first."_ — the exact sentence the backend
   already produces (`receipts.ts:92-95`).
4. Make a correction. **Expected:** the footer says
   _"N changes pending. This dealer has no Daily Sales Report, so no report needs
   regenerating."_ The `Review & apply` dialog shows **no** variation preview
   (there is no product map) and says so calmly.
5. Apply. **Expected:** it succeeds, no report is flagged, and no `Regenerate`
   button appears.
6. **And the unparseable-config case:** on a dealer whose DSR config is
   incomplete, the same shape with the second sentence — _"This dealer's Daily
   Sales Report configuration is incomplete…"_ (`receipts.ts:99-102`).

**Expected result**

A dealer with no DSR can still have their IRAS data corrected; the consequence
copy changes to say no report is affected; nothing errors and nothing is
half-disabled.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U4 — A re-collection lands after an edit — `admin` (Arjun)

Three outcomes, all of which must be non-destructive. This is the scenario that
decides whether an operator's work can silently vanish.

**Preconditions**

- A 15E day with **at least 3 committed corrections** across `TOT` and `STK` (D1
  and D2 leave you with these). Note exactly what they are.

**Steps**

1. Press **`Re-collect`** on that day and let it finish.
2. **Case A — the portal re-sent the same values.** **Expected:** every
   correction is still in force. The day banner says how many corrections the day
   has and that reports are using the corrected figures. Nothing alarming.
3. **Case B — the portal now reports a different value** for a cell you
   corrected. **Expected:** your correction **still wins** (it is an override),
   the cell gains a distinct "portal changed" marker, and a banner reads
   _"The portal re-sent this day on <when> and now reports different values for N
   cells you had corrected. Your corrections are still being used. Check whether
   they are still needed."_ The cell popover shows **three** lines: `Portal
originally`, `Portal now`, `You set`, with `Keep mine` and `Use the portal's
new value`.
4. **Case C — the row is gone** (or the portal picked a **different closing
   shift**, which changes every row's transaction id and orphans everything —
   `shared/src/iras/corrections.ts:21-38`). **Expected:** the correction is
   **orphaned**: not applied, **not deleted**, listed under a warning banner
   _"N corrections no longer match this day's data … [Review them]"_. The review
   list shows dataset, row, field, portal-then, your value, reason, who and when,
   with `Discard` and — only when the row has come back — `Re-apply`. **A
   correction must never be silently re-pointed at a neighbouring row.**
5. **Reports are flagged for the right reason.** After the re-collection,
   confirm the affected reports carry a stale banner whose reason names the
   re-collection, e.g. _"This day was collected again on <date>, and N of the
   corrections on it no longer match, so this report's figures no longer match
   its inputs."_
6. **Regenerating must settle.** Press `Regenerate`, let it land, and then
   **reload the report**. **Expected:** the stale banner is gone and **stays**
   gone. Press `Regenerate` again if it is still offered. If regenerating a day
   leaves it stale again — an endless "out of date → rebuild → out of date" loop
   — that is a FAIL and a blocker: it means staleness is being raised by
   _reading_ the day rather than by the collection that changed it, and
   `saveReport`'s guard (`reportStore.ts:94-97`) will never clear it.
7. **Nothing was destroyed.** Count the corrections on the day: applied +
   orphaned must equal what you started with. None deleted.

**Expected result**

A re-collection never destroys an operator's work: unchanged corrections hold
silently, changed ones hold loudly, vanished ones orphan for review, the reports
are flagged once with an honest reason, and one rebuild clears the flag for good.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U5 — The report for that day was already shared with the dealer — `admin` (Arjun)

**The situation.** The dealer is holding the old numbers on their phone. This is
the scenario where the journey either protects the relationship or damages it.

**Preconditions**

- A 15E date **D** whose report shows a disabled **`Shared`** chip with a
  timestamp. If none exists and you are on a **local/dump database**, share one
  deliberately to set this up. **Do not** share a live dealer's report just to
  create a test case.
- Note the share timestamp.

**Steps**

1. Open the editor for D and make one measured correction.
2. **Before the commit:** the sticky footer must already say that one of the
   affected reports has been shared — not just the dialog. Count: if 3 of the 5
   affected reports were shared, the footer must say **3**.
3. Press `Review & apply`. **Expected:** a distinct danger block above the
   confirm, naming the date and the share time, e.g. _"The report for Thu, 13 Aug
   2026 was already shared with this dealer on 15 Aug, 09:12. They have the old
   figures on their phone. After you regenerate, the report is no longer marked
   shared — you will need to share it again and tell them what changed."_
4. Committing is still **allowed**. Apply with a reason.
5. **Regenerate.** Now go to D's report. **Expected — and this is the check that
   matters:** the page must **still be telling you to re-share**. Note what
   actually happens: a regeneration clears the shared marker
   (`reportStore.ts:78-82`), so the `Shared` chip and its timestamp **disappear**
   and the button reverts to a plain enabled `Share with dealer`
   (`DsrReportPanel.tsx:194, 252-264`) — with no trace that the dealer already
   has an older version. **If nothing on the screen after the rebuild remembers
   that this report was shared, that is a FAIL:** the one moment the operator
   needs the reminder is the moment it is gone.
6. **The forward blast radius.** Regenerating D heals the _whole_ forward chain
   (`dsr-report/index.ts:196-219`), so **every** later report is regenerated too
   — and each of those loses its shared marker as well. Compare your S0 step 4
   list of shared dates against what the reports show now. **Expected:** the
   screen accounts for all of them. Silently forgetting N share records is a
   FAIL.
7. **Re-share and look at it from the dealer's side.** Press `Share with dealer`.
   As Ramesh, open the chat. **Expected:** you now have **two** DSR messages for
   the same business date, with different numbers. Check whether anything
   distinguishes them — a "revised" line, a corrected marker, anything
   (`share.ts:34-52` builds the body). **If the two messages are
   indistinguishable apart from their figures, record it: the dealer cannot tell
   which one to act on.**
8. **Re-share is single-shot.** Press `Share with dealer` twice quickly.
   **Expected:** exactly one new chat message ("This report had already been
   shared with the dealer.").

**Expected result**

The already-shared consequence is stated in the footer _before_ the commit and in
the dialog with the date and time; the commit is allowed; and after the rebuild
the operator is **still** being told to re-share, for every report that had been
shared. The dealer can tell a corrected report from the one it replaces.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U6 — An edit that changes nothing — `admin` (Arjun)

Two separate cases, both of which must be honest before the commit, not after.

**Steps — case A: only unused columns**

1. Open the editor for a collected day. Switch the column toggle to **`Show all
portal columns`**.
2. Edit **three** cells the report never reads: `TOT.NOZZLE_STATUS`,
   `REC.TRUCK_NUMBER`, and `STK.PRODUCT_QTY`.
3. **Expected while typing:** each cell reads visibly differently from a
   load-bearing one (subdued, italic, a "not used" pill in the header) and its
   tooltip — **on focus, not just hover** — says editing it will not change any
   report.
4. **`STK.PRODUCT_QTY` is the dangerous one.** On 15E, tank 2's `PRODUCT_QTY`
   (5,711.31) and `NET_QTY` (5,640.83) differ only by the water — they look like
   the same number. `PRODUCT_QTY` is a genuine measured quantity that **today's
   report does not use** (`fields.ts:166-169`). **Expected:** the screen makes
   the distinction impossible to miss, ideally by naming the alternative ("the
   report opens the day on Net Qty"). Note whether it does.
5. **Expected in the footer:** it must **not** claim reports will need
   regenerating. `Review & apply` must **lead** with _"None of these changes
   affect any report. They will be recorded against this day, but no figure and
   no report will change."_ The reason is still required and the button reads
   `Apply anyway`.
6. Apply. **Expected:** no report is flagged, no `Regenerate` is offered, and the
   day's audit entry records the changes.

**Steps — case B: a real no-op**

7. Open a corrected cell and retype **exactly the value already in force**. Tab
   away. **Expected:** no pending change is created (or it is created and then
   recognised as a no-op at commit, reporting "Nothing changed"). Either way
   **no report may be flagged.** Re-flagging every report because somebody
   re-typed the same number is the failure the receipts flow already guards
   against (`receipts.ts:240-259`).
8. Also revert a cell and then re-apply the same correction inside one commit.
   **Expected:** the net effect is "nothing changed" and nothing is flagged.

**Expected result**

Editing columns the report never reads is possible, visibly harmless, honestly
described **before** the commit, and flags nothing. Re-entering an identical
value flags nothing at all.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U7 — Abandoning uncommitted changes — `admin` (Arjun)

**Steps**

1. Open the editor and type into a cell **without** pressing Enter. Press
   **`Esc`**. **Expected:** the cell returns to its previous value and the
   pending count does **not** go up. Press `Esc` again: the selection clears.
   `Esc` must **never** close the whole editor while changes are pending.
2. Make **3** pending changes. Confirm the footer reads `3 changes pending`.
3. **Undo / redo.** `Cmd/Ctrl+Z` three times — the count must walk back to 0.
   `Cmd/Ctrl+Shift+Z` — back to 3. Include an added and an excluded row in the
   undo chain.
4. **In-app navigation.** Click a left-nav item. **Expected:** a guard —
   _"You have 3 changes that have not been applied. Leave anyway?"_ Choose
   **stay**: the 3 changes are still there.
5. **Browser navigation / reload.** Press reload. **Expected:** the browser's own
   "leave site?" prompt appears (its wording is the browser's, not ours). Cancel,
   then reload for real and accept.
6. **On return:** the editor must offer the abandoned set back —
   _"You have 3 unapplied changes from earlier. [Review & apply] [Discard]"_.
7. **The restored draft must be safe to apply.** Press `Review & apply` on the
   restored set and apply it. **Expected:** it succeeds. **If it fails with
   "Somebody else changed this day while you were editing", that is a FAIL** —
   the restored draft is carrying a stale concurrency token from before the
   reload, and the operator is being blamed for a conflict that does not exist.
8. **`Discard all`** must ask before wiping a pending set, and after discarding,
   a reload must **not** bring it back.

**Expected result**

A cell edit can be abandoned with `Esc`; three pending changes survive a reload
and are offered back; the restored set applies cleanly; nothing is ever lost
without a confirmation, and nothing is ever silently kept after `Discard`.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U8 — Two admins on the same day — `admin` (Arjun) + super-admin (Meera)

**Steps**

1. Arjun and Meera both open the editor on the **same** 15E day in separate
   browsers.
2. Meera makes one correction and applies it.
3. Arjun (whose page is now out of date) makes a **different** correction and
   applies it.
4. **Expected:** Arjun's commit is rejected with
   _"Somebody else changed this day while you were editing. Reload to see their
   changes, then apply yours again."_ and a `Reload` button. **Nothing of
   Arjun's is merged and nothing of Arjun's is lost** — his pending changes are
   still in the footer.
5. Arjun presses `Reload`, sees Meera's correction in place, and re-applies his
   own. **Expected:** succeeds. Both corrections are now in force, one audit
   entry each.
6. **Double-click the commit.** Press `Apply` twice fast. **Expected:** one
   commit, one audit entry, one staleness event.
7. **A rebuild already running.** Have Meera start `Regenerate reports`, then
   have Arjun press it too. **Expected:** Arjun gets _"A DSR is already being
   generated for this dealer. Wait for it to finish before starting another."_
   (`dsrReport.ts:280-284`) — a clear message, not a silent failure, and Arjun's
   corrections are unaffected.

**Expected result**

A concurrent commit is rejected cleanly with nothing merged and nothing lost;
re-applying after a reload works; a double click makes one commit; a second
rebuild is refused with a sentence that explains itself.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## U9 — Archived dealer, future date, impossible date — `admin` (Arjun)

**Steps**

1. **Archived dealer:** archive a scratch dealer (never 15E), then open their
   editor URL for a collected day. **Expected:** the page loads **read-only**,
   every editable affordance disabled, one notice: _"This dealer is archived.
   Their data is read-only."_ Attempting the write directly must be refused by
   the server.
2. **Future date:** navigate to
   `/data-vault/dealers/6a722edc7fb504c022668be8/days/2027-01-01`.
   **Expected:** redirected to the Vault with no error page — the same clamp the
   Vault already applies.
3. **Impossible date:** `…/days/2026-06-31`. **Expected:** the same clean
   redirect, never a 500 and never a snapshot filed under a date no picker can
   produce (`irasData.ts:39-51`).
4. **Nonsense date:** `…/days/banana`. Same clean redirect.

**Expected result**

An archived dealer is read-only end to end; impossible and future dates redirect
quietly instead of erroring.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# GUARDRAILS

## G1 — Identity columns, edited inline (decision 1) — `admin` (Arjun)

Decision 1 removed the re-attribution dialog. The whole guard is now the inline
warning, so it has to carry the weight.

**Preconditions**

- A collected 15E day, report not shared. Note both products' opening stock and
  variation.

**Steps**

1. **The three identity cells that really move money.** Click each of
   `TOT.NOZZLE_NO`, `STK.TANK_NO` and `REC.TANK_NO` in turn. **Expected for
   each:** the cell is editable, carries a **warning border**, and shows an
   inline note that states the _consequence in the operator's own terms_ — not
   "be careful". The exact sentences are already written in the field table
   (`shared/src/iras/fields.ts:110-111, 154-155, 201-202`); check the screen says
   the same thing. For `STK.TANK_NO`: _"…moves this whole row's stock to a
   different product — and if that product already has a row for the tank, its
   opening stock is counted twice."_
2. **The identity cells that move nothing.** Now click `TOT.TANK_NO` and
   `PRODCODE` (on all three grids), plus the shift date/time and txn-id columns.
   **Expected: NO warning border and NO consequence note** — the report reads
   none of them and the field table's own hints say so
   (`fields.ts:118-131, 174-180, 209-215`). A scary warning here is a **FAIL**:
   it tells the operator a no-op edit mattered, which is the mirror image of the
   bug the "hidden columns" defence exists to prevent.
3. **Do it.** Change `STK.TANK_NO` on the tank-2 row to **1**.
4. **Expected in the footer and dialog:** identity changes are listed in a
   **separate high-risk block**, visually distinct from measured edits, and the
   preview shows **both** products' variations moving. Two rows now sit on tank 1
   and none on tank 2, and stock is **summed** across a product's tanks
   (`compute.ts:221`), so: **MS's opening stock becomes tank 1's stock + tank 2's
   stock** and **HSD's becomes 0**.
5. **The double-count must be stated in words, not left to arithmetic.**
   **Expected:** something like _"Tank 1 already has a row in this day's stock
   report. Two rows for one tank count its stock twice."_ Whether this blocks or
   only warns is product's call — record which it does.
6. Apply with a reason, regenerate, and confirm the report matches the preview.
   **Expected, and check the direction — it is not intuitive:** MS's stock went
   **up**, so MS's variation goes **up** by that amount and lands hugely
   **positive** → **"Over beyond limit"** (the outcome that suspends sales of all
   products). HSD's stock went to 0, so HSD's variation goes **down** by 5,640-odd
   litres and lands hugely **negative** → **"Short beyond limit"**. The report
   should also carry a data-quality note that MS now _"spans 2 tanks; opening
   stock is summed, dip/water shown for tank 1"_ (`compute.ts:224-228`).
7. **One-click revert.** Back in the editor, revert that one cell. **Expected:**
   the revert is itself a pending change, commits through the same path, flags
   the same reports, and after a regenerate both products are **exactly** back to
   your step-0 numbers.
8. **Audit.** Dealers → 15E → audit. **Expected:** the identity change is
   recorded distinctly from a plain field edit, with the reason, and the revert
   is recorded too.

**Expected result**

Identity cells are editable inline; the loud warning appears **only** on the
three cells that really re-attribute money and states the consequence plainly;
the commit dialog isolates identity changes; the double-count is described in
words; and one click puts it back exactly.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## G2 — Duplicate rows and excluding a product's last row — `admin` (Arjun)

**Steps**

1. **Duplicate on add.** In `STK`, add a row with `TANK_NO` **2** — a tank that
   already has a row. **Expected:** a **hard block** with the double-count
   sentence, not a warning. Same for `TOT` with an existing `NOZZLE_NO`.
2. **Duplicate `REC` is legitimate.** Add a second `REC` row for tank 2.
   **Expected:** **allowed** — a tank really can take two tankers in a day. This
   is the one dataset where a repeated tank is normal.
3. **Exclude a duplicate.** If the portal ever returns `TANK_NO 2` twice in
   `STK`, exclude one. **Expected:** the row stays visible, struck through, with
   a `Restore` action and an `Excluded` chip. Nothing is deleted from the
   snapshot.
4. **Excluding the last row a product depends on.** Exclude the only `STK` row
   for tank 2. **Expected:** the confirm warns _"HIGH SPEED DIESEL has no other
   stock row after this. Its opening stock will be 0 and its variation will be
   wrong."_ before you commit.
5. **Row counts stay honest.** The dataset header must distinguish what the
   portal sent from what you changed — e.g. `2 rows · 1 added · 1 excluded` — and
   the Vault's own row counters and the "N of M portal rows fell outside this
   shift" note (`SnapshotDetail.tsx:351-356`) must be **unchanged** by your
   additions and exclusions.
6. **A cap on additions.** Add rows until you hit the limit (10 per dataset per
   day). **Expected:** a notice saying that beyond this the honest answer is a
   re-collection or a configuration fix.

**Expected result**

A duplicate identity is blocked on `STK`/`TOT` and permitted on `REC`; exclusion
is a reversible strike-through, never a delete; excluding a product's last stock
row warns first; and the portal's own row counts are never rewritten by hand
edits.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## G3 — Blanking a load-bearing cell — `admin` (Arjun)

The consequence of a blank differs by field, and only two of them actually remove
the row. The screen must not blur them.

**Steps**

1. **Blank `TOT.TOT_READING`** on nozzle 8. **Expected:** a warning (not a block)
   saying the nozzle is **removed from the report** — which is true: the parser
   drops a `TOT` row with no reading (`parse.ts:25-42`, flagged
   `dropsRowWhenBlank` in `fields.ts:113-117`). Also expect the knock-on to be
   named: with a nozzle missing, the **previous day's sales cannot be closed at
   all** (`compute.ts:276-289`). Discard.
2. **Blank `STK.NET_QTY`** on tank 2. **Expected:** a warning saying the opening
   stock for that tank becomes **0** — _not_ "the row is removed". The parser
   keeps the row and reads a blank as zero (`parse.ts:44-60`). If the copy says
   "removed", it is misleading: the row survives and still supplies the printed
   dip. Record it.
3. **Blank `STK.TANK_NO`.** **Expected:** a warning that the row is removed
   entirely (this one really is dropped, `parse.ts:47-48`).
4. **Blank `REC.NET_QTY_DECANTED`.** **Expected:** a warning that the delivery
   stops counting (the row is dropped, `parse.ts:62-74`).
5. **Blank `REC.TANK_NO`.** **Expected:** a warning that the litres will belong
   to no product and stop counting. Note whether the screen says anything at all
   here — the parser silently files it under tank 0, which no product reads, so
   the litres vanish without the row disappearing.
6. **Validation basics.** In any measured cell try: `1,234` (commas), `abc`,
   `-5`, `1.2345` (four decimals), and `999999999`. **Expected**, respectively:
   "Enter a number without commas.", "Enter a number. No units, no commas.",
   "This cannot be negative.", "At most 3 decimal places.", "This looks too
   large…" (`fields.ts:299-330`). Each must **block the commit** while it stands.

**Expected result**

Each blank is described by its **actual** consequence — removed from the report,
or read as zero, or orphaned to no product — and never with a generic sentence
that covers all three. Invalid input blocks the commit with a plain message.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# TRUST

## T1 — Portal value, who, when, why, and three scopes of revert — `admin` (Arjun)

**Steps**

1. On a corrected cell, confirm the **three depths**: a corner marker at a
   glance; a popover on hover **and on keyboard focus** showing `Portal said` /
   `Now` / `Changed by` / `Reason` with a `Revert this cell`; and a header toggle
   **`Show portal values`** that stacks the portal's struck-through value above
   every corrected one.
2. **Revert cell**, **Revert row** (gutter menu) and **Revert this day** (day
   banner) each exist. Each must: confirm first, enter the **pending** set rather
   than writing immediately, and flag the same reports a forward edit would.
3. `Revert this day` on a day with N corrections must say _"Remove all N
   corrections on <date> … Reports built from them will need regenerating."_
4. After a `Revert this day` + `Regenerate`, every figure must be **exactly** back
   to the portal's own numbers — compare against your S0 step 4 notes,
   digit for digit.
5. **CSV agrees with the screen.** With corrections in force, use **`Download
CSV`** on a dataset. **Expected:** the corrected values, and the filename
   marked so it cannot be confused with the raw one (a `-corrected` suffix). Then
   confirm the **raw** portal export is still obtainable and still byte-identical
   to what the portal sent.
6. **Audit.** Dealers → 15E → audit trail. **Expected:** **one** entry per
   commit (not per cell), listing every change, the stale dates and the reason,
   with the acting admin. A commit that only removed corrections is recorded as a
   revert, distinctly.
7. **Nothing is dealer-visible.** As Ramesh, confirm there is no correction
   history, no "corrected" list, nothing about who changed what — only the
   corrected report.

**Expected result**

For every corrected cell an operator can answer what the portal said, who changed
it, when, and why, and can put it back at three scopes; the CSV never disagrees
with the screen; the audit reads as a list of decisions; and none of it leaks to
the dealer.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

# REGRESSION — what must still work, untouched

## REG1 — The Vault itself — `admin` (Arjun)

**Steps**

1. **Read-only IRAS views.** `/data-vault` → IRAS shift data: the cross-dealer
   list for a business date, the overview counters (configured / collected /
   failed / missing), the status chips, the dealer drawer, the **`Why this
shift`** card with the selected shift at full seconds, the folded dataset
   sections with their row counts and "N of M portal rows fell outside this
   shift" line. All exactly as before.
2. **Snapshot history.** Dealers → 15E → Data Vault → _Capture history_: paging,
   date filters, status filter, drill-in.
3. **CSV export.** `Download CSV` on a dataset with **no** corrections:
   byte-identical to before, with the portal's own headers in the portal's own
   order, a UTF-8 BOM, and leading `=`/`+`/`-`/`@` values neutralised
   (`DatasetTable.tsx:27-49`).
4. **Collect now / Re-collect.** Works from the cross-dealer drawer and the
   per-dealer tab; a second press while one is running is refused with _"A
   collection is already running for this dealer."_; an archived dealer cannot be
   collected at all.
5. **`GET /iras-data/snapshots/:id` is unchanged.** With corrections in force on
   a day, the raw snapshot endpoint must still return the **portal's** rows,
   unchanged in shape and value. (Ask an engineer to curl it once, or compare the
   raw CSV.)
6. **The other Vault datasets are untouched.** Cross-dealer rail: **PAD ledger**.
   Per-dealer Vault sidebar: **IRAS shift data, PAD ledger, Credit & DOD, Daily
   Sales Report, Inspection Reports** (`pages/dealers/vault/datasets.ts`). Open
   each: it renders, filters and exports exactly as before, and **none of them has
   gained an edit affordance**.
7. **Deep links still work.** An old bookmark of the form
   `/data-vault?date=…&status=…&dealer=…` (no `?dataset=`) must still land on IRAS
   shift data.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## REG2 — DSR generate / share, and the dealer's app — `admin` (Arjun) + `dealer-owner` (Ramesh)

**Steps**

1. **Generate now** and **Generate for a date** (a back-date) both still work
   from `/dsr/dealers/:dealerId` and from Dealers → 15E → Daily Sales Report.
2. **A back-date with no IRAS data** still fails under the single **"Insufficient
   Data"** headline with the specific reason, not a raw stack trace.
3. **Regenerate** on a report with no corrections behaves as before.
4. **Share** posts two card images plus the bilingual summary to the dealer's
   chat, sends a push, and becomes a disabled `Shared` with a timestamp; a second
   press posts nothing new.
5. **The dealer's side.** As Ramesh: the DSR card arrives in Chat within a second
   or two without a refresh; tapping an image opens it; the report also appears in
   the **Reports** tab; the download / signed URL opens. Send a chat message each
   way and confirm it appears exactly once on both sides (no duplicate-message
   regression).
6. **The DSR Vault landing** (`/dsr`) still lists every dealer with the service,
   with their latest report headline and its out-of-date flag.
7. **Nothing dealer-facing changed shape.** The report card layout, the Hindi and
   English advisory sentences, and the "RECEIVED TODAY" tile are as before — with
   the one exception recorded in **R3 step 7** (the hand-entered `M` marker).

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## REG3 — The engine's own tests — any

**Steps**

```bash
cd mdg-backend
NODE_OPTIONS=--experimental-vm-modules npx jest src/services/dsr-report/compute.test.ts src/services/dsr-report/guideline.test.ts
```

1. **Expected:** 2 suites, **22 tests, all passing** — the baseline measured on
   2026-08-17 before this feature. `compute.ts` is a pure function pinned to the
   dealer's real workbook; corrections change its **inputs**, never its
   arithmetic, so these must pass **byte-for-byte unchanged**.
2. Run the DSR integration suites too:
   `npx jest test/integration/dsrReport.test.ts test/integration/dsrIrasPrereq.test.ts`.
   **Expected:** green.
3. **The receipts suite.** `test/integration/dsrManualReceipt.test.ts` covers a
   subsystem decision 4 **deletes**. It must have been **replaced** by equivalent
   coverage over the new layer — not simply removed. Confirm the replacement
   still pins: the entered figure wins; a **closed** day can be corrected; the
   correction reaches every later day's since-inspection total; clearing hands the
   day back to the portal; an explicit 0 is an override; the edited day and every
   later report are flagged and nothing earlier is; re-saving the same figure
   flags nothing; a regeneration clears the flag; an edit mid-run leaves the flag
   standing.
4. **New coverage that must exist.** A test pinning
   `shared/src/iras/fields.ts` against `parse.ts`, so that teaching the parser a
   new field fails the build until the field table admits it — the anti-drift
   guarantee the whole "is this column used?" promise rests on. There is no such
   test today.
5. **Row-key coverage** (`shared/src/iras/corrections.ts`): reorder without a
   count change (corrections hold), a `REC` count change (orphaned), a nozzle
   disappearing (orphaned), a nozzle reappearing (offered for review, **not**
   auto-re-applied), a different closing shift (everything orphans). No tests
   exist for this module today.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## Static checks performed while writing this plan (2026-08-17)

Read-only; no product code was modified.

- **Engine baseline** — `compute.test.ts` + `guideline.test.ts`: **22 tests
  passed** (0.25 s). This is the byte-for-byte baseline REG3 compares against.
  PASS.
- **Shared typecheck** — `tsc --noEmit -p shared/tsconfig.json`: **exit 0**. The
  new `iras/fields.ts` and `iras/corrections.ts` compile. PASS.
- **Vendored `@dk/shared` copies** — `mdg-backend/shared`, `mdg-admin/shared` and
  `mdg-client/shared` have **no `src/iras/` directory** and their
  `types/irasData.ts` does **not** contain `IrasDataCorrection`. The root
  `shared/src/index.ts` exports `./iras/fields` and `./iras/corrections`, so the
  contract exists in exactly one of four copies. Existing builds are unaffected
  (nothing imports it yet), but the backend and admin cannot be built against the
  contract until it is mirrored. **BLOCKER for the build — S0 step 1.**
- **Feature not yet built** — no `getEffectiveSnapshot` in
  `mdg-backend/src/services/irasData/store.ts`; no corrections model, route or
  admin page. The old receipts path (`DsrReceiptsDialog.tsx`, `receipts.ts`,
  `DsrManualReceiptModel`, `GET/PUT /dsr/dealers/:id/receipts…`) is fully intact.
- **Staleness rule** — verified against `generate.ts:82-118`,
  `compute.ts:265-301` and `store.ts:162-171`: `sales(D−1)` is written while
  generating **D**, so `D−1`'s own report never contained a closed sales figure
  for `D−1`. `markReportsStaleFrom(dealerId, D)` (`>= D`) is correct; the spec's
  `previousDate(D)` rule for `TOT` is not. One narrow caveat is recorded in the
  open questions below.
- **Closed-row freeze** — `dsr-report/store.ts:97-129` writes **only the
  receipt** onto an already-closed ledger row, and
  `test/integration/dsrManualReceipt.test.ts:177` pins that as deliberate. Nine
  of 15E's ten report days are closed. **V2 exists to measure this.**
- **Report rendering reads the ledger** — `render.ts:104` and `xlsx.ts:41` render
  from `ledger` when present; the dealer's card prefers the in-memory window
  (`cards.ts:422-425`, `SHEET_DAYS = 2`). So admin and dealer can disagree.
  Covered by V1 and V2.
- **Regeneration clears `shared`** — `reportStore.ts:78-82` unsets the marker, and
  the admin's `Shared` chip is driven by it (`DsrReportPanel.tsx:194`). The
  forward-chain heal (`dsr-report/index.ts:196-219`) regenerates every later
  report, so it clears their markers too. Covered by U5.
- **Field policy already tells the truth** about the inert identity columns:
  `TOT.TANK_NO` and `PRODCODE` (all three datasets) are `usedByReport: false`
  with hints that say so, and carry **no** `identityWarning` — only
  `TOT.NOZZLE_NO`, `STK.TANK_NO` and `REC.TANK_NO` do
  (`shared/src/iras/fields.ts`). X2 and G1 test that the UI keys its warning off
  that, not off the class name.

---

## Sign-off

| Scenario | Result | Tester | Date |
| -------- | ------ | ------ | ---- |
| X1       |        |        |      |
| X2       |        |        |      |
| X3       |        |        |      |
| S0       |        |        |      |
| R3       |        |        |      |
| H1       |        |        |      |
| D1       |        |        |      |
| D2       |        |        |      |
| D3       |        |        |      |
| R2       |        |        |      |
| V1       |        |        |      |
| V2       |        |        |      |
| U1       |        |        |      |
| U2       |        |        |      |
| U3       |        |        |      |
| U4       |        |        |      |
| U5       |        |        |      |
| U6       |        |        |      |
| U7       |        |        |      |
| U8       |        |        |      |
| U9       |        |        |      |
| G1       |        |        |      |
| G2       |        |        |      |
| G3       |        |        |      |
| T1       |        |        |      |
| REG1     |        |        |      |
| REG2     |        |        |      |
| REG3     |        |        |      |

**Release recommendation:** ☐ Go ☐ Go with caveats ☐ No-go
Blockers: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

> **Any FAIL in V2, R2 step 7 or U5 steps 5–6 is a no-go**, not a caveat. Each
> one ends with the dealer holding a number that is wrong or unexplained, which
> is the only outcome this feature exists to prevent.

---

## Open questions for product / engineering (raised while writing this plan)

1. **A closed day's ledger.** `upsertTodayRow` freezes a closed row and lets only
   the receipt through (`dsr-report/store.ts:97-129`), and the report's table and
   Excel sheet are rendered from the ledger. Unless that changes, a `TOT` or
   `STK` correction to any day but the latest reaches the variation card only.
   Which is it: unfreeze on a correction-driven regeneration, or re-close the
   forward chain? **V2 measures it either way.**
2. **A hand-added `REC` row is an addition; the mechanism it replaced was an
   override.** `ManualInputs.receipt` is documented as "REPLACES the portal's
   figure — an override, never an addition, so a later IRAS re-collection that
   finally carries the decantation cannot double-count it"
   (`compute.ts:174-181`). Added rows never orphan
   (`corrections.ts:203-210`). What warns the operator when the portal catches
   up? **R2 step 7.**
3. **The "already shared" warning outlives the share record it depends on.**
   Regeneration unsets `shared`, so `sharedDates` is only accurate the first
   time, and the reminder to re-share disappears at the exact moment it is
   needed. Is a `previouslyShared` marker in scope? **U5 steps 5–6.**
4. **Two DSR messages for one date.** Re-sharing posts a second message with no
   marker distinguishing it from the one it supersedes (`share.ts:34-52`). Should
   the body say "revised"? **U5 step 7.**
5. **The `M` marker disappears with `DsrManualReceipt`.** `receiptSource` will
   always be `'iras'`, so the dealer-visible "entered manually / IRAS reported X"
   footnote goes away — including on 2026-08-13, which the migration touches.
   Intended? **R3 step 7.**
6. **Where staleness is raised for an orphaned or portal-changed correction.** If
   it is raised while _reading_ the effective snapshot, a regeneration will
   re-stale the report it just built and `saveReport`'s `computedFrom` guard
   (`reportStore.ts:94-97`) will never clear it. **U4 step 6.**
7. **A row no product reads.** The field table can say a _column_ is unused, but
   not that a _row_ is — a `TANK_NO` outside the dealer's DSR config makes a
   perfectly load-bearing cell inert for this dealer. Nothing in the plan
   surfaces that. **D2 step 2, R2 step 4.**
8. **`previousDate(D)`, the narrow case.** `>= D` is right for a report generated
   on its own day. But a report that was itself **regenerated after** its day was
   closed stores a ledger that carries its own day's sales — and a `TOT`
   correction on the next day makes that sheet stale without flagging it. Accept,
   or flag `>= previousDate(D)` for `TOT` (one extra cheap report in the list)?
9. **A partial rebuild still reports success.** `useDsrRunWatcher` toasts success
   on a terminal SUCCESS, and the generator repairs at most
   `REPAIR_MAX_DAYS = 14` forward days (`dsr-report/index.ts:64`). The editor
   must re-read `/dsr/dealers/:id/stale` before claiming the dealer is up to
   date. **X1.**
10. **`STK.PRODUCT_QTY` vs `NET_QTY`.** On real 15E data they differ by only the
    water (5,711.31 vs 5,640.83). Hiding `PRODUCT_QTY` behind a toggle may not be
    enough; a "did you mean Net qty?" nudge would be. **U6 step 4.**
