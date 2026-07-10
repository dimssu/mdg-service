# ADR 0007 — Staff Points: a dealer-internal employee roster & work-reward ledger

- Status: Accepted
- Date: 2026-07-03
- Extends: ADR 0005 (per-member chat / dealer members), ADR 0006 (Kavach — seeded bilingual catalog + per-dealer state pattern)
- Related: ADR 0008 (bilingual app i18n), `docs/ARCHITECTURE_V2.md`
- Spec: `docs/specs/staff-points.md`
- Contracts: `shared/src/types/staff.ts`, `shared/src/schemas/staff.ts`, seed `shared/src/data/staffWorkCatalog.ts`

## Context

A petrol-pump owner runs a crew of workers ("योद्धा") who each perform operational
tasks — cleaning, DU upkeep, tanker handling, sales, office books. The dealer already
runs a **paper** incentive scheme (the "स्टाफ प्रबंधन" sheet): 66 tasks, each worth
points, and every worker must earn ≥100 points to qualify for the dealer's discretionary
incentive. The owner and manager want to run this in the app: keep a roster of workers,
and award points for work — pick a worker, pick the task, and the points + date fill in
automatically.

This is **dealer-internal**. Unlike Kavach (which is MDG's compliance shield _for_ the
dealer, escalating to the MDG admin pool) and unlike Records/tickets (MDG ↔ dealer), the
staff-points loop is entirely **inside one pump**: the owner/manager reward their own
workers. MDG admins are not in the loop (see §Decision 5).

Two facts from the existing model shape the design:

1. **"Members" are login `User`s** (owner = `dealer-owner`, manager = `dealer-staff`
   titled "Manager"; ADR 0005). Workers here are **not** members — they don't log in, have
   no email/password, no chat thread, no push device. Reusing `User` for them would drag
   in auth, uniqueness, and inbox surfaces they must never touch.
2. **Kavach already proved the pattern** for a seeded, versioned, bilingual catalog that
   per-dealer state references — `KavachTemplate` + `KAVACH_TEMPLATE_SEED` + a boot seeder.
   Staff Points reuses that spine verbatim for its work catalog.

The source sheet's REMARKS column is not decorative: some points are **split** among the
workers who did a job, some go to **each** worker, and some are **per-unit** (per vehicle,
per ₹1000 sold, per guest, per tank). Ignoring these would make the point totals — the
whole point of the feature — wrong.

## Decision

1. **A new dealer-scoped `Employee` model, NOT a `User`.** An Employee is a plain
   dealer-owned record (`dealerId`, `name`, optional `phone`/`designation`/`avatarKey`,
   `status: ACTIVE|INACTIVE`, `createdByUserId`), following the `Record`/`ServiceLog`
   precedent — no email uniqueness, no password, no `Conversation`/`Device`, never in a
   role guard or the admin inbox. Deactivation is a soft `status` flip so award history
   survives.

2. **The 66-item sheet becomes a seeded, versioned, bilingual `StaffWorkItem` catalog**
   (`shared/src/data/staffWorkCatalog.ts` → boot seeder `seedStaffWorkCatalog()`, mirroring
   `seedKavachTemplate()`; model unique index `{ version, code }`). Dealers only ever see
   the clean `labelEn`/`labelHi`; the raw sheet text is kept in `titleEn`/`titleHi` for
   traceability. **The catalog is global** (the same sheet for every pump) — per-dealer
   _customisation_ of the catalog is deferred to Phase 2; per-dealer state lives only in the
   award ledger.

3. **Point distribution is encoded per item and computed server-side — never trusted from
   the client.** Each item carries a `distribution`:
   - `SPLIT` — base points ÷ number of selected workers ("उसमें बट जायेगा").
   - `EACH` / `FLAT` — full base points to each selected worker ("सबको मिलेगा" / one-off).
   - `PER_UNIT` — base × `quantity`, with a `unit` (vehicle / ₹1000 / guest / customer /
     transaction / item / tank / photo) driving the quantity stepper's label.
     **Locked:** the server recomputes `points` from the catalog on every award; the request
     carries `employeeIds`, `items[]` (`{ workItemCode, quantity? }` — one or more works the
     same workers did), `workDate`, `note`. Per-employee points are rounded to 2 dp per work.
     Fractional points are legal (the sheet has 0.5). (The legacy single-`workItemCode` shape is
     still accepted and normalised into `items` for a cached older client during rollout.)

4. **An append-mostly `StaffPointAward` ledger.** One row per **(employee × work)** in an award
   action, with the work label **denormalised** at award time (so later catalog edits never
   rewrite history), the computed `points`, the `workDate` (calendar day the work was done,
   defaulting to today IST — _not_ `createdAt`), and a shared `batchId` grouping every row an
   action writes — across all its works and workers — so one **Undo** reverses the whole action.
   Corrections are a **hard delete of the row** (an "Undo" toast, per the
   adoption audit's "no confirm dialogs / offer Undo" rule), audited as `STAFF_POINTS_UNDO`.

5. **Owner AND manager can do everything; MDG admin has no surface.** All routes are gated
   `requireRole('dealer-owner', 'dealer-staff')` and hard-scoped to `req.user.dealerId`
   (nested under `/dealers/:dealerId/...`, same-dealer guard like `dealerUsers.ts`). There
   is deliberately **no admin route and no mdg-admin UI** in MVP — this is the pump's
   internal tool. (A read-only admin mirror is a clean Phase-2 add if MDG ever wants it.)

   > **Superseded (2026-07-08).** Decision 5's "admin has no write surface" is no longer
   > current. Admins now have **full write control** over any dealer's staff & points (see
   > §Phase-2 additions below). Dealer members remain hard-scoped to their own dealer; the
   > change only lifts the admin read-only restriction. The dealer handlers were factored
   > into shared services (`services/staff/{employees,award,draft,workList}.ts`) so the
   > dealer and admin routers call one implementation.

6. **Reachable from Profile, not a 5th bottom tab.** The dealer bottom bar is capped at 4
   (STYLE_GUIDE_V2 / ADOPTION_AUDIT; Kavach already demoted Services into Profile). Staff
   Points is an owner/manager management tool, not a daily dealer-compliance surface, so it
   lives as a Profile entry (like Services) routing to `/staff`, gated on the two dealer
   roles. The bar stays at 4.

7. **New audit actions**, added to `AUDIT_ACTIONS`: `STAFF_EMPLOYEE_ADD`,
   `STAFF_EMPLOYEE_UPDATE`, `STAFF_POINTS_AWARD`, `STAFF_POINTS_UNDO` — `entity: 'Dealer'`,
   `entityId: dealerId`, actor = the awarding member.

## Rationale

- **Right entity for the job.** Workers have no auth surface; modelling them as records (not
  Users) keeps auth, the inbox, and role guards clean, exactly as ADR 0005 kept members and
  the org separate.
- **Reuse over invention.** The catalog is a Kavach-shaped seed; the routes are the
  dealer-scoped nested-router pattern; the ledger is a `Record`-shaped document. No new
  scheduler, no new auth, no new realtime — the only genuinely new logic is the
  distribution math, which is ~10 lines and unit-tested.
- **Honest totals.** Encoding the sheet's split/each/per-unit rules in data means the
  headline "who earned what" is correct without the owner doing mental arithmetic — while
  the _default_ award stays one worker, one tap.
- **Adoption-safe.** One primary action ("Give points"), auto-filled points + date, a plain
  leaderboard with the familiar 100-point line, bilingual copy, Undo instead of confirm
  dialogs. No jargon reaches the owner (`distribution`, `PER_UNIT`, `batchId` are internal).

## Consequences

- **Locked choices:** Employees are records, not Users; the work catalog is global, seeded,
  versioned; `points` is always server-computed from `distribution` (client input ignored);
  awards are an append-mostly ledger with denormalised labels and a `workDate` separate from
  `createdAt`; owner + manager have identical access and MDG admin has none; Staff Points is
  a Profile entry, never a 5th tab; corrections are hard-delete + Undo, not edit.
- The leaderboard is computed by aggregating the ledger over a date window
  (`{ dealerId, workDate }` index); no denormalised running total is stored (recompute is
  cheap at pump scale).
- `StaffPointAward` (what a worker earned) and `AuditLog` (who did what, security trail) are
  complementary, not redundant — the ledger is the product surface, the audit is the trail.
- Phase 2 seams already implied by the model: per-dealer catalog overrides (custom tasks,
  disabling tasks, per-pump point tweaks), a read-only mdg-admin mirror, monthly
  export/PDF of the assessment sheet, and letting a worker be linked to a login member.

## Phase-2 additions (2026-07-08)

The Phase-2 seams called out below were built out. Contracts live in the same
`shared/src/{types,schemas}/staff.ts` files; ledger history stays stable because
labels are still snapshotted at award/finalize time.

1. **HSD/MS amount input.** For a `rupee-1000` PER_UNIT work the client may send a raw
   `amountRupees`; the server computes `quantity = amountRupees / 1000` (fractional
   allowed), ignores any client `quantity`, and denormalises `amountRupees` onto the
   award row for hardcopy reconciliation. Points remain server-computed.

2. **Draft → finalize with a hardcopy photo.** A dealer keeps ONE server-synced draft
   (`StaffPointDraft`, unique on `dealerId`): `GET/PUT/DELETE /staff-points/draft` (PUT is
   an autosave — merges same-`(employee, work)` entries, recomputes points, and is
   deliberately **not** audited). `POST /staff-points/draft/finalize` requires a
   `staff`-scope hardcopy `hardCopyImageKey`, writes one `StaffPointAward` per entry under a
   new `batchId`, creates a `StaffPointBatch` header (totals + photo), deletes the draft,
   and audits once as `STAFF_POINTS_FINALIZE`. Finalized batches are listed/fetched via
   `GET /staff-points/batches[/:batchId]` with a signed `hardCopyImageUrl`. A SPLIT work in
   a draft divides its base among the distinct workers who have that work in the draft.
   A new `staff` presign scope (`staff/<dealerId>/<uuid>`) mirrors the `chat` scope.

3. **Per-dealer work list + super-admin global catalog.** `DealerWorkList` (unique
   `dealerId`) overlays the global catalog: `hiddenCodes` remove defaults; `customItems`
   add dealer-authored works (codes generated `custom-<slug>-<short>`). The **effective**
   list a client renders/awards from is `(global active catalog − hiddenCodes) ++ (active
customItems)`, read at `GET /dealers/:dealerId/work-items`. All award/draft/finalize
   resolution goes through this effective list. Super-admins edit the GLOBAL default
   catalog at `/super-admin/staff-work-items` (`GET/POST/PATCH/:code/DELETE/:code`, the last
   a soft `active=false`), each change audited.

4. **Admin full control (supersedes §5).** `adminDealerStaffRouter` (`/dealers/:dealerId/
staff`, `requireRole('admin')`) gained write routes: `POST/PATCH /employees`,
   `POST /awards` + `DELETE /awards/:id` (`?scope=batch`), the work-list `GET/PUT
/work-list`, and read access to the dealer's draft (`GET /drafts`) and batches. A
   batch-scope undo also removes the finalize header so a finalized submission fully
   reverses.

## Phase-3 additions — factor-derived points (2026-07-11)

The catalog's `points` values were originally hand-copied from the assessment sheet with no
rationale. They are now **derived** from a job-evaluation model so a work's reward reflects the
time it takes and the skill, effort, and responsibility it demands — skilled/hard/high-stakes
work is rewarded fairly, and every number is auditable and reproducible.

1. **The formula.** A `labour` work carries `timeMin` + `skill`/`effort`/`responsibility` (the
   last three 0–100). `deriveBasePoints()` (in `@dk/shared`, catalog version bumped 1→2) computes
   `base = round( timeMin × S × E × R ÷ K )` with `S = 1 + 1.2·skill/100`, `E = 1 + 0.5·effort/100`,
   `R = 1 + 0.8·responsibility/100`. `K = 5.3735` is a **frozen** constant (≈5.37 min/point), chosen
   once so the catalog total is preserved (daily target ~100). It must never be recomputed from the
   live catalog — that would let one edit re-price every other work. Result is floored at 0.5 so an
   active work is always awardable.

2. **Labour vs incentive.** 5 works (`INCENTIVE_WORK_CODES`: per-₹1000 HSD/MS sales, add-customer,
   Servo-mobil per item, add-new-customer) are `pricingMode:'incentive'` — priced by business policy
   with a typed `points`, outside the formula. `pricingMode` is orthogonal to `distribution` (all 5
   happen to be PER_UNIT; labour works can be PER_UNIT too, where `timeMin` is per-unit time).

3. **Points are always server-derived (supersedes §Decision 3's client-points wording).** Every write
   site — the seeder, super-admin `POST`/`PATCH /staff-work-items`, and the dealer work-list `PUT` —
   recomputes `points` via `resolveBasePoints()` (derive for labour, typed for incentive). A
   client-supplied `points` for a labour work is ignored; editing any factor re-derives. The
   award/draft/finalize engine is unchanged — it still reads the stored `points` as `basePoints`.

4. **Authoring UI.** Both the super-admin global-catalog form and the per-dealer custom-work form take
   the four factor inputs; for a labour work the points field is a read-only live-derived preview, for
   an incentive work it stays typed. Factors are required when adding a labour work, editable on
   existing ones. Full model in `docs/specs/staff-points.md §4` and `docs/staff-points-scoring-model.pdf`.

## Naming awareness (not a blocker)

The feature ships under the **descriptive** name "Staff / स्टाफ" (route `/staff`), not a
coined brand. This is deliberate: the product already carries one brand ("Kavach") that
collides with Indian Railways' national train-protection system (see ADR 0006). Rather than
mint a second brandable Hindi word (and repeat that collision risk), Staff Points stays
plainly descriptive. If a brand is wanted later, it must be checked for prior use
(package/company/trademark/domain) before adoption, per the house naming rule.
