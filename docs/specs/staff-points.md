# Feature Spec — Staff Points (dealer-internal employee roster & work rewards)

**Status:** Draft for build (PM-decisive)
**Owner:** Product
**Audience:** Architecture, backend, client UX, admin UX
**Related:** `docs/PRD.md`, `docs/ARCHITECTURE_V2.md`, ADR 0007 (subsystem), ADR 0008 (i18n), `docs/ADOPTION_AUDIT.md`, `docs/STYLE_GUIDE_V2.md`
**Source:** "स्टाफ प्रबंधन" (Staff Management) assessment sheet — 66 tasks with points & remarks

---

## 1. Summary & product thesis

A petrol-pump owner already runs a paper incentive scheme: every worker performs tasks from
a 66-item list, each worth points, and must earn **≥100 points** to qualify for the dealer's
discretionary reward. **Staff Points** moves this into the app: the owner and manager keep a
roster of their workers and **give points for work done** — pick a worker, pick the task, and
the points + today's date fill in automatically. A leaderboard shows who has earned what.

This is **dealer-internal** — the owner/manager reward their own crew. It is not an MDG-to-dealer
service (Records/tickets) and not MDG's compliance shield (Kavach). MDG admins are not involved.

|               | Kavach (ADR 0006)                        | Staff Points                             |
| ------------- | ---------------------------------------- | ---------------------------------------- |
| Whose tool    | MDG's shield **for** the dealer          | The dealer's tool for **their** crew     |
| Audience      | Dealer sees score; MDG works escalations | Owner + manager only; **no MDG surface** |
| State         | Per-item clocks, reminders, escalation   | An append-mostly **award ledger**        |
| The "catalog" | 45 compliance items (seeded)             | 66 reward tasks (seeded)                 |

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

**Where it lives:** a **`/staff` screen reached from Profile** (gated to owner + manager), not a
5th bottom tab — the bar stays at 4 (STYLE_GUIDE_V2 / ADOPTION_AUDIT; Kavach already demoted
Services into Profile). Staff Points is a management tool, not a daily dealer-compliance surface.

**The Staff screen** (mobile-first, `max-w-md`, bilingual):

- A **leaderboard** header: each worker with their points in the window (default **Today**), a
  Today / This month toggle, and a quiet line showing the **100-point** target. One legible list,
  no dashboard.
- One **primary action: "Give points" / "पॉइंट दें"**. Secondary: **"Add worker" / "स्टाफ जोड़ें"**.

**Add worker** (inline-expand form, like the existing invite form): **name** (required) + optional
phone + optional designation. That's it — no piled-on fields (adoption rule 10).

**Give points** (the core flow — a bottom sheet / inline step flow):

1. **Pick worker.** Tap one from the roster. (For split/"everyone" tasks, tapping more workers is
   offered _after_ the task is chosen — see below.)
2. **Pick the work.** A searchable list of the 66 tasks, grouped by area (Cleaning / DU / Equipment
   / Automation / Tanker / Sales / Office / Customer / Other) with the points shown on each row.
   Recognition over recall — icon + plain bilingual label + points.
3. **Auto-fill.** The points appear; the **date defaults to today** (tap to change to a recent day).
4. **Only-when-needed controls:**
   - **Per-unit task** (per vehicle / ₹1000 / guest / tank …): a **"How many? / कितने?"** stepper;
     total = per-unit × quantity, shown live.
   - **Split / everyone task**: a **"Who did it together?"** multi-select; SPLIT shows the live
     **per-person split** ("40 ÷ 3 = 13.3 each"), EACH shows each getting the full points.
5. **Confirm** → the totals tick up instantly (optimistic), and a toast confirms
   **"12 points given to Ramesh / रमेश को 12 पॉइंट मिले"** with an **Undo**.

**No confirm dialogs, no jargon.** The words `distribution`, `PER_UNIT`, `batch` never appear; the
app just does the right maths. A mistake is fixed with **Undo** (adoption rule 8), which hard-deletes
the ledger row(s).

---

## 4. Model (contracts in `shared/src/types/staff.ts`, `schemas/staff.ts`, `data/staffWorkCatalog.ts`)

### Employee (dealer-owned record — not a User)

`dealerId`, `name`, `phone?`, `designation?` (free text), `avatarKey?`,
`status: ACTIVE | INACTIVE`, `createdByUserId`. Deactivate = soft `status` flip; history survives.

### Work catalog (seeded, versioned, global)

`StaffWorkItem`: `code` (slug), `srNo` (1–66), `titleEn/titleHi` (raw sheet, admin-only),
`labelEn/labelHi` (clean, dealer-facing), `points` (base; per-unit value for PER_UNIT; may be
fractional), `distribution`, `unit?` + `unitLabel*?` (PER_UNIT), `domain`, `requiresApproval`,
`notesEn/notesHi?`. Seeded at boot via `seedStaffWorkCatalog()` on unique `{ version, code }`,
mirroring `seedKavachTemplate()`.

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

### Award ledger

`StaffPointAward`: one row per **(worker × work)** in the action, with the work label **denormalised**
at award time,
`basePoints` + `quantity?`/`splitAmong?` + computed `points`, `workDate` (YYYY-MM-DD, the day the
work was done — defaults today IST, **not** `createdAt`), `note?`, shared `batchId`, and
`awardedByUserId`/`awardedByName`. Indexes: `{ dealerId, workDate }`, `{ dealerId, employeeId, workDate }`.

### Summary / leaderboard

`GET …/staff-points/summary?from&to` aggregates the ledger per employee in the window and returns
rows `{ employeeId, employeeName, status, totalPoints, awardCount }` plus `targetPoints = 100`.

---

## 5. API surface (all `/api/v1`, dealer-scoped, `requireRole('dealer-owner','dealer-staff')`)

Nested under the dealer (same pattern as `dealerNestedUsersRouter`), hard-scoped to
`req.user.dealerId`:

| Method   | Path                                      | Body / Query                    | Response                                                  |
| -------- | ----------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `GET`    | `/staff-work-items`                       | —                               | `StaffWorkItem[]` (the seeded catalog; read-only)         |
| `GET`    | `/dealers/:dealerId/employees`            | `?from&to&includeInactive`      | `EmployeeWithPoints[]` (roster + windowed points)         |
| `POST`   | `/dealers/:dealerId/employees`            | `createEmployeeSchema`          | `Employee` (201)                                          |
| `PATCH`  | `/dealers/:dealerId/employees/:id`        | `updateEmployeeSchema`          | `Employee` (edit / deactivate)                            |
| `POST`   | `/dealers/:dealerId/staff-points`         | `awardStaffPointsSchema`        | `AwardStaffPointsResult` (201; one row per worker × work) |
| `GET`    | `/dealers/:dealerId/staff-points`         | `staffPointsQuerySchema`        | `StaffPointAward[]`                                       |
| `GET`    | `/dealers/:dealerId/staff-points/summary` | `staffPointsSummaryQuerySchema` | `StaffPointsSummary`                                      |
| `DELETE` | `/dealers/:dealerId/staff-points/:id`     | —                               | `204` (Undo; hard-delete a row, or the whole `batchId`)   |
| `PATCH`  | `/me`                                     | `updateMyPreferencesSchema`     | `User` (self-set `lang`; ADR 0008)                        |

All mutations audited (`STAFF_EMPLOYEE_ADD/UPDATE`, `STAFF_POINTS_AWARD/UNDO`). No admin route.

---

## 6. Language (ADR 0008)

Staff Points is the first **fully bilingual** surface: every string via the `t()` catalog, every
catalog label via `pick(lang, labelEn, labelHi)`. It ships alongside the app-wide Hindi/English
toggle (default Hindi). Copy is warm and plain — "Give points", not "Award transaction"; the
leaderboard says "needs 100" not "target: 100 pts".

---

## 7. Scope — MVP vs Phase 2 (ruthless)

### MVP (must-have)

1. **Employee roster** — add / edit / deactivate workers (owner + manager).
2. **Seeded 66-item work catalog** — bilingual, with distribution/points/units baked in.
3. **Give points flow** — pick worker(s) → pick task → auto points + today's date; per-unit stepper
   and split/each multi-select appear only when the task needs them; optimistic total + Undo.
4. **Leaderboard** — per-worker points for Today / This month, with the 100-point target line.
5. **App-wide Hindi/English toggle** (ADR 0008) — foundation + full `mdg-client` retrofit.
6. **Audit trail** — add/update employee, award, undo.

### Phase 2 (explicitly out)

- **Per-dealer catalog customisation** — custom tasks, disabling tasks, per-pump point tweaks.
  (MVP catalog is global.)
- **Read-only mdg-admin mirror** of a pump's roster + totals.
- **Monthly export / WhatsApp-ready sheet** of each worker's points (the sheet's "send by 10 AM").
- **Attendance / shift** modelling and per-shift point windows.
- **Linking a worker to a login member**, or letting workers self-view their points.
- **Approvals workflow** for `requiresApproval` tasks (MVP treats the flag as an informational note,
  since the owner/manager is the one awarding).

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
2. **Who can undo/deactivate:** MVP lets **both** owner and manager add workers, give points, undo,
   and deactivate (symmetric access). Confirm, or restrict deactivate/undo to the owner. _(PM lean:
   symmetric — the manager is trusted floor staff.)_
3. **Per-unit tasks marked "everyone gets it"** (₹1000 fuel sales, sr 21–22): MVP treats these as
   per-unit awarded to the selected worker(s); confirm we don't need automatic fan-out to the whole
   on-shift crew (which needs a shift model — Phase 2).
4. **Underground-tank dip (sr 50):** the sheet's points column says 10 but the remark says "2 points
   for each tank"; MVP encodes it **per-tank at 2** (quantity = number of tanks). Confirm.
5. **Global vs per-pump catalog:** MVP ships one global 66-item list for all pumps. Confirm no pump
   needs its own tasks/points on day one (else pull the Phase-2 customisation forward).
6. **Default language for new members:** **Hindi**. Confirm (owner can toggle any time).
