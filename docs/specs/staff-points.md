# Feature Spec — Staff Points (dealer-internal employee roster & work rewards)

**Status:** Live since July 2026; this is the rules reference. ADR 0007 records the decisions.
**Owner:** Product
**Audience:** Architecture, backend, client UX, admin UX
**Related:** `docs/PRD.md`, `ARCHITECTURE.md`, ADR 0007 (subsystem), ADR 0008 (i18n), `docs/STYLE_GUIDE_V2.md`
**Source:** "स्टाफ प्रबंधन" (Staff Management) assessment sheet — 66 tasks with points & remarks, since grown to 85 works

---

## 1. Summary & product thesis

A petrol-pump owner already runs a paper incentive scheme: every worker performs tasks from
a 66-item list, each worth points, and must earn **≥100 points** to qualify for the dealer's
discretionary reward. **Staff Points** moves this into the app: the owner and manager keep a
roster of their workers and **give points for work done** — pick a worker, pick the task, and
the points + today's date fill in automatically. A leaderboard shows who has earned what.

This is **dealer-internal** — the owner/manager reward their own crew. It is not an MDG-to-dealer
service and not MDG's compliance shield (Kavach). MDG admins can do everything a dealer can, on
any outlet, from the dealer's Staff tab in the admin; super-admins edit the global catalog.

|               | Kavach (ADR 0006)                         | Staff Points                            |
| ------------- | ----------------------------------------- | --------------------------------------- |
| Whose tool    | MDG's shield **for** the dealer           | The dealer's tool for **their** crew    |
| Audience      | MDG certifies; dealer gets a daily digest | Owner + manager; MDG admins can act too |
| State         | Per-item clocks, admin/automation verify  | An append-mostly **award ledger**       |
| The "catalog" | 45 compliance items (seeded)              | 85 reward works (seeded)                |

**Hard adoption constraint (every decision below):** the user is a 55-year-old owner (or their
manager) who distrusts apps. _Could they add a worker and give points without help, in Hindi?_
If a screen, word, or step fails that test, it is wrong.

---

## 2. Personas & jobs-to-be-done

### Owner (`dealer-owner`)

- **JTBD:** _"Let me add my workers once, then at the end of a shift tap a worker, tap what they
  did, and the points are recorded — so I can see who deserves the incentive without keeping a
  paper register."_
- **Cares about:** a fair, visible tally; the familiar 100-point bar; doing it in Hindi in seconds.

### Manager (`dealer-staff`, title "Manager")

- **JTBD:** _"I'm on the floor; let me give points as work happens — often to several workers who
  did a job together — without doing the split maths in my head."_
- **Cares about:** speed, multi-worker jobs handled correctly, not re-reading instructions.

### The worker ("योद्धा") — _not an app user_

- Has **no login**. Is a record the owner/manager maintains and awards points to. Appears only in
  the roster and the leaderboard.

---

## 3. THE KEY UX DECISION — one dead-simple "Give points" flow, distribution handled quietly

> **Decision: the default award is one worker, one task, one tap — points and date auto-filled.
> The sheet's split/each/per-unit rules are handled by the app so totals stay honest, but the
> extra controls only appear when the chosen task needs them.**

**Where it lives:** a **`/staff` screen reached from Settings → "Warriors & points"** (gated to
owner + manager). The dealer app has no tab bar; Staff Points is a management tool, not a daily
compliance surface.

**The Staff screen** (mobile-first, `max-w-md`, bilingual):

- A **leaderboard** header: each worker with their points in the window (default **Today**), a
  Today / This month toggle, and a quiet line showing the **100-point** target. One legible list,
  no dashboard. Only **submitted** points count.
- One **primary action: "Give points" / "पॉइंट दें"**. Secondary: **"Add worker" / "स्टाफ जोड़ें"**.

**Add worker** (inline-expand form, like the existing invite form): **name** (required) + optional
phone + optional designation. That's it — no piled-on fields (adoption rule 10).

**Give points** builds a **draft**, then a **final submit** (the core flow):

1. **Pick worker.** Tap one from the roster. (For split/"everyone" tasks, tapping more workers is
   offered _after_ the task is chosen — see below.)
2. **Pick the work.** A searchable list of the dealer's works, grouped by area (Cleaning / DU /
   Equipment / Automation / Tanker / Mobile dispenser / Sales / Office / Customer / Kitchen /
   Other) with the points shown on each row. Recognition over recall — icon + plain bilingual
   label + points.
3. **Auto-fill.** The points appear; the **date defaults to today** (tap to change to a recent day).
4. **Only-when-needed controls:**
   - **Per-unit task** (per vehicle / guest / tank …): a **"How many? / कितने?"** stepper;
     total = per-unit × quantity, shown live.
   - **Per-₹1000 sales works** (HSD / XTRA GREEN at 0.5, MS / XP-95 at 1): a **₹ amount box**.
     The server works out quantity = amount ÷ 1000. ₹2,500 of HSD = 2.5 × 0.5 = **1.25 points**.
   - **Catch-all works** ("Other cleaning work", "Other DU work", "Other office work" and the
     tanker preventive-maintenance work): a **written description is required**. Every other
     work takes an optional note.
   - **Split / everyone task**: a **"Who did it together?"** multi-select; SPLIT shows the live
     **per-person split** ("40 ÷ 3 = 13.3 each"), EACH shows each getting the full points.
5. **Add to the draft.** There is one draft per outlet, saved to the server as it changes, so the
   owner and manager can both add to it over a shift. Lines can be edited or removed, or the
   whole draft cleared.
6. **Final submit** asks for a **photo of the paper hardcopy**. Only then are the points written
   to the ledger, as one submission that keeps the photo. The leaderboard counts submitted points
   only.

A mistake after submit is undone by an MDG admin from the dealer's Staff tab — one row, or the
whole submission. The admin's own **"Award points"** posts straight to the ledger, with no draft
and no photo.

**Leave (छुट्टी).** From a worker's edit dialog the owner can mark them **on leave today** (or
yesterday, since owners often notice a day late), with an optional reason, and remove it again.
Leave never adds or removes points. It only explains a 0-point day: the Today list shows "छुट्टी
पर" instead of 0, the month view shows the leave days, and the admin's target for a window
leaves out each worker's leave days (100 × days actually worked).

**No confirm dialogs, no jargon.** The words `distribution`, `PER_UNIT`, `batch` never appear; the
app just does the right maths.

---

## 4. Model (contracts in `shared/src/types/staff.ts`, `schemas/staff.ts`, `data/staffWorkCatalog.ts`)

### Employee (dealer-owned record — not a User)

`dealerId`, `name`, `phone?`, `designation?` (free text), `avatarKey?`,
`status: ACTIVE | INACTIVE`, `createdByUserId`. Deactivate = soft `status` flip; history survives.

### Work catalog (seeded, versioned, global)

85 works: rows 1–66 from the sheet, 67–74 kitchen (मेस/रसोई), 75–78 tanker-staff refinery runs,
79–85 mobile dispenser. Super-admins edit it at `/super-admin/staff-work-items`.

`StaffWorkItem`: `code` (slug), `srNo` (1–85), `titleEn/titleHi` (raw sheet, admin-only),
`labelEn/labelHi` (clean, dealer-facing), `points` (base; per-unit value for PER_UNIT; may be
fractional), `distribution`, `pricingMode`, `timeMin?`/`skill?`/`effort?`/`responsibility?` (the
factors), `unit?` + `unitLabel*?` (PER_UNIT), `domain`, `requiresApproval`, `notesEn/notesHi?`.
Seeded at boot via `seedStaffWorkCatalog()` on unique `{ version, code }` (currently version 2),
mirroring `seedKavachTemplate()`.

**Points are DERIVED, not hand-set (v2).** A `labour` work's `points` is computed from four factors
by `deriveBasePoints()` (in `@dk/shared`):

```
base = round( timeMin × Skill × Effort × Responsibility ÷ K )
Skill = 1 + 1.2·(skill/100)   Effort = 1 + 0.5·(effort/100)   Responsibility = 1 + 0.8·(responsibility/100)
```

`skill/effort/responsibility` are entered on a 0–100 scale; `timeMin` is real minutes (whole-job for
FLAT/SPLIT/EACH, per-unit for PER_UNIT). `K = 5.3735` is a **frozen** calibration constant (≈5.37 min
of ordinary work = 1 point) chosen once to preserve the catalog total (daily target ~100); it must
never be recomputed from the live catalog. The 5 `incentive` works (`INCENTIVE_WORK_CODES` — per-₹1000
fuel sales, customer add/acquisition, Servo-mobil per item) keep a typed policy `points` and bypass the
formula. `points` is **always recomputed server-side** at every write (seed, super-admin create/PATCH,
dealer work-list PUT) via `resolveBasePoints()`; a client-supplied `points` for a labour work is
ignored. The four factors are required when creating a labour work and editable on existing ones, in
both the super-admin global catalog and the per-dealer overlay.

### Per-dealer work list (overlay)

`DealerWorkList`, one per dealer: `hiddenCodes` (default works this outlet does not use) and
`customItems` (works an admin added for this outlet, code prefixed `custom-`). The **effective
list** a dealer sees and awards from is the global catalog, minus hidden works, plus custom works
(`GET /dealers/:dealerId/work-items`). Admins edit it from the dealer's Staff tab.

### Distribution → point maths (server-side, authoritative)

One award action covers **one or more works** (`items[]`) done by the **same set of workers**. For
each work with base `base` and quantity `q`, awarded to `N` selected workers:

- **SPLIT** → each worker gets `round(base / N, 2)` (divided among the doers).
- **EACH / FLAT** → each worker gets `base`.
- **PER_UNIT** → each worker gets `round(base × q, 2)` (`q` defaults to 1).

The client sends `employeeIds`, `items[]` (`{ workItemCode, quantity? }`), `workDate?`, `note?`. The
server looks up each catalog item and computes `points` per item; **client-sent points are never
trusted**. (The legacy single-work shape `{ workItemCode, quantity? }` is still accepted and
normalised into `items` so a cached older client keeps working through a rollout.)

### Draft and submission

`StaffPointDraft`: one per dealer (unique `dealerId`) — `entries[]` (`employeeId`, `workItemCode`,
`quantity?`, `amountRupees?`, `note?`), `workDate`, `note?`, last editor. **No points are stored
here**; they are recomputed against the effective list on every read and at finalize.

`StaffPointBatch`: one per final submit — `batchId`, totals (points, entries, workers) and the
required `hardCopyImageKey`. Finalize writes the ledger rows under that `batchId` and deletes the
draft.

### Award ledger

`StaffPointAward`: one row per **(worker × work)** in the action, with the work label **denormalised**
at award time,
`basePoints` + `quantity?`/`amountRupees?`/`splitAmong?` + computed `points`, `workDate` (YYYY-MM-DD, the day the
work was done — defaults today IST, **not** `createdAt`), `note?`, shared `batchId`, and
`awardedByUserId`/`awardedByName`. Indexes: `{ dealerId, workDate }`, `{ dealerId, employeeId, workDate }`.

### Leave

`EmployeeLeave`: one row per (worker, day) — `date` (YYYY-MM-DD, IST), `note?`, who marked it. The
roster read adds `leaveDaysInWindow` and `onLeaveToday` to each worker.

### Summary / leaderboard

`GET …/staff-points/summary?from&to` aggregates the ledger per employee in the window and returns
rows `{ employeeId, employeeName, status, totalPoints, awardCount }` plus `targetPoints = 100`.

---

## 5. API surface (all `/api/v1`)

**Dealer** routes (`requireRole('dealer-owner','dealer-staff')`), hard-scoped to the caller's own
dealer:

| Method   | Path                                                 | Purpose                                                       |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `GET`    | `/staff-work-items`                                  | The global catalog (read-only)                                |
| `GET`    | `/dealers/:dealerId/work-items`                      | This outlet's effective work list (admins may read it too)    |
| `GET`    | `/dealers/:dealerId/employees`                       | Roster + windowed points + leave (`?from&to&includeInactive`) |
| `POST`   | `/dealers/:dealerId/employees`                       | Add a worker                                                  |
| `PATCH`  | `/dealers/:dealerId/employees/:id`                   | Edit / deactivate                                             |
| `GET`    | `/dealers/:dealerId/employees/leave`                 | Leave days in a window                                        |
| `POST`   | `/dealers/:dealerId/employees/:id/leave`             | Mark leave (`date` defaults to today IST)                     |
| `DELETE` | `/dealers/:dealerId/employees/:id/leave/:date`       | Remove leave                                                  |
| `GET`    | `/dealers/:dealerId/staff-points/draft`              | The outlet's draft                                            |
| `PUT`    | `/dealers/:dealerId/staff-points/draft`              | Autosave (full replace)                                       |
| `DELETE` | `/dealers/:dealerId/staff-points/draft`              | Clear the draft                                               |
| `POST`   | `/dealers/:dealerId/staff-points/draft/finalize`     | Final submit with `hardCopyImageKey`                          |
| `GET`    | `/dealers/:dealerId/staff-points/batches[/:batchId]` | Past submissions                                              |
| `GET`    | `/dealers/:dealerId/staff-points`                    | Ledger rows                                                   |
| `GET`    | `/dealers/:dealerId/staff-points/summary`            | Leaderboard                                                   |
| `PATCH`  | `/me`                                                | Self-set `lang` (ADR 0008)                                    |

The older direct `POST /dealers/:dealerId/staff-points` and `DELETE …/staff-points/:id`
(`?scope=batch` for a whole submission) are still served, but the dealer app no longer calls
them.

**Admin** routes, `/dealers/:dealerId/staff/…`, any outlet: `GET overview`, `GET|POST awards`,
`DELETE awards/:id` (`?scope=batch`), `POST employees`, `PATCH employees/:id`, the same three
leave routes under `employees/`, `GET drafts`, `GET batches`, `GET|PUT work-list`.

**Super-admin**: `GET|POST /super-admin/staff-work-items`, `PATCH|DELETE …/:code` (the global
catalog).

All mutations are audited: `STAFF_EMPLOYEE_ADD/UPDATE`, `STAFF_POINTS_AWARD/UNDO/FINALIZE`,
`STAFF_DRAFT_CLEAR`, `STAFF_WORK_LIST_UPDATE`, `STAFF_WORK_ITEM_CREATE/UPDATE/DELETE`,
`STAFF_LEAVE_SET/CLEAR`.

---

## 6. Language (ADR 0008)

Staff Points is the first **fully bilingual** surface: every string via the `t()` catalog, every
catalog label via `pick(lang, labelEn, labelHi)`. It ships alongside the app-wide Hindi/English
toggle (default Hindi). Copy is warm and plain — "Give points", not "Award transaction"; the
leaderboard says "needs 100" not "target: 100 pts".

---

## 7. Scope

### Built

1. **Employee roster** — add / edit / deactivate workers (owner + manager), with leave marking.
2. **Seeded work catalog** — 85 works, bilingual, with distribution/points/units baked in.
3. **Give points** — pick worker(s) → pick work → auto points + today's date; per-unit stepper,
   ₹ amount box and split/each multi-select appear only when the work needs them; one autosaved
   draft; final submit with a hardcopy photo.
4. **Leaderboard** — per-worker points for Today / This month, with the 100-point target line.
5. **App-wide Hindi/English toggle** (ADR 0008).
6. **Audit trail** — every mutation (§5).
7. **Per-dealer work list** — hidden works and custom works per outlet.
8. **Admin control** — full read and write on any outlet's workers, points, drafts, submissions
   and work list; super-admin edits the global catalog.

### Not built

- **Monthly export / WhatsApp-ready sheet** of each worker's points (the sheet's "send by 10 AM").
- **Shift** modelling and per-shift point windows.
- **Linking a worker to a login member**, or letting workers self-view their points.
- **Approvals workflow** for `requiresApproval` tasks (the flag is an informational note, since
  the owner/manager is the one awarding).

---

## 8. Success metrics

- **Adoption:** % of active dealers who add ≥1 worker and give ≥1 point in week 1; weekly-active
  owners/managers in `/staff`.
- **Habit:** awards per dealer per week; % of workers reaching the 100-point line in a month.
- **Simplicity health:** "Give points" completion rate (started → confirmed); Undo rate (high Undo
  = the flow is confusing or mis-fills).
- **Language:** % of dealer sessions in Hindi vs English (validates the toggle & default).

---

## 9. Open questions / decisions needed from the owner

1. **Point-window default:** leaderboard defaults to **Today** with a This-month toggle — confirm
   this matches how the incentive is actually tallied (the sheet implies a daily ≥100). _(PM lean:
   Today default; monthly is the payout view.)_
2. **Who can undo/deactivate:** _Answered — owner and manager have the same access._
3. **Per-unit tasks marked "everyone gets it"** (₹1000 fuel sales, sr 21–22): MVP treats these as
   per-unit awarded to the selected worker(s); confirm we don't need automatic fan-out to the whole
   on-shift crew (which needs a shift model — Phase 2).
4. **Underground-tank dip (sr 50):** the sheet's points column says 10 but the remark says "2 points
   for each tank"; MVP encodes it **per-tank at 2** (quantity = number of tanks). Confirm.
5. **Global vs per-pump catalog:** _Answered — one global catalog plus a per-dealer overlay
   (hidden and custom works)._
6. **Default language for new members:** **Hindi**. Confirm (owner can toggle any time).
