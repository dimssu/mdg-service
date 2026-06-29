# ADR 0006 — Kavach Programme: a first-class stateful assessment subsystem

- Status: Accepted
- Date: 2026-06-30
- Extends: ADR 0002 (plugin contract), ADR 0003 (scheduler), ADR 0005 (per-member chat / push / service logs)
- Spec: `docs/specs/kavach-programme.md` (product) and `docs/specs/kavach-engine.md` (engine)
- Contracts: `shared/src/types/kavach.ts`, `shared/src/schemas/kavach.ts`, seed `shared/src/data/kavachTemplate.ts`

## Context

After onboarding, an MDG admin initiates the **Dealer कवच (Kavach) programme** for a
dealer once. From then on it must run continuously for the life of the relationship: it
tracks ~45 recurring compliance tasks (DSR, density book, licence displays, safety kit,
SDMS declarations, etc.), each with its own cadence and importance; computes a live
operational score (%); sends scaled reminders as tasks come due; and, if the dealer does
not act, escalates the task into the admin support pool to be worked like a ticket. The
source is `PUMP ASSESSMENT SHEET.xlsx`.

Our existing "services" are **ServicePlugins** (ADR 0002): stateless, single-run jobs that
take a frozen config in and emit one immutable `ServiceRun` artifact out, fired by the
node-cron scheduler (ADR 0003). Kavach contradicts that contract on every axis — it is
always-on, **stateful per item** (each task carries its own clock, reminder history, and
escalation level), and **dealer-input-driven** (the dealer marking a task "done" resets the
clock). Forcing Kavach through the plugin runtime would require a hidden side-collection,
reduce `ServiceRun` to a meaningless heartbeat, and make the catalog's RJSF form render a
45-item bilingual checklist it was never meant to. That degrades the plugin abstraction
without serving Kavach.

The source spreadsheet encodes cadence as **validity-in-days** (1/7/15/30/90/180/365/730)
and disagrees with itself across sheets; some "daily" rows are really event-driven (**SOS**);
and the MAIN sheet's 4060-point total is internally inconsistent with the per-cadence tabs
(whose footer of 3580 is a stale copy-paste — the real per-cadence points sum to 4015).

## Decision

1. **First-class subsystem, not a plugin.** Kavach gets three new collections —
   `KavachTemplate` (global reconciled master list), `KavachProgramme` (one per dealer; the
   "initiate once" object), and `KavachItem` (per-dealer, per-task stateful tracker) — and a
   dedicated scheduler sweep `evaluateKavachProgrammes()` run **alongside, not through**, the
   existing plugin `tick()`. It does **not** create a `DealerService` and is not claimed by the
   generic tick.

2. **"Initiate like a service" is preserved at the UX level only.** Kavach appears in the
   admin service catalog as a pinned, display-only entry (`KAVACH_PROGRAMME_SERVICE_ID =
"kavach-programme"`), but selecting it routes to a dedicated **Initiate Programme** action.
   One initiation creates one `KavachProgramme` and snapshots `KavachItem`s from the template.

3. **Cadence stored as `cadenceDays` (source of truth) with a derived bucket label.**
   `expiresAt = lastDoneAt + cadenceDays`. Buckets (`DAILY`…`BIENNIAL` + `SOS`) are derived for
   grouping/UI only. SOS items have `cadenceDays = null` and never decay on a clock.

4. **Scoring.** An item contributes its full `points` when `VALID` or `EXPIRING_SOON`, and `0`
   when `EXPIRED`. **SOS items are excluded from the operational denominator** in MVP — they are
   admin-controlled availability flags (`SOS_OK` by default, `SOS_FLAGGED` = non-compliant),
   surfaced separately. Paused items leave both numerator and denominator. Overall % is for
   dealers; per-bucket sub-scores are admin-only. The total is **computed live** from the
   reconciled per-item points (≈3740 for the scored TIME items; ≈4060 across the full catalog
   incl. an inferred 45 pts for earthing-pits, see §source), **never hardcoded, never 3580**.

5. **Source reconciliation (MAIN canonical, with named overrides) is baked into the seed.**
   Solar-panel 15 d; crocodile-clip wires (both) 365 d; safety-signage 90 d; CAs-with-ID 90 d;
   Servo island display 10 pts. Earthing-pits (srNo 33) carries an **inferred 45 pts** (the one
   item absent from every per-cadence tab) — flagged for owner confirmation. The five SOS items
   (subsidy & claim, complaint registration, product sampling, tanker decantation, work permit)
   are stored with `cadenceDays = null`, bucket `SOS`.

6. **Reminders and escalation reuse the CRM spine verbatim (ADR 0005).** To avoid a daily
   notification firehose (≈17 daily items), **daily TIME items are never reminded per item**:
   the sweep emits **one consolidated daily digest** (push + one chat system message) per dealer
   ("You have N things to do today / आज आपके N काम हैं"), deep-linking to the Today list, with a
   hard cap of ≤1 dealer-facing digest push/day. Weekly-and-longer items use a per-item ladder
   scaled by tier (CRITICAL/STANDARD/LIGHT ⇒ 3/2/1 reminders), folded into the same daily digest
   when they fire. Marking done cancels the cycle. An escalation is an **OPEN, unassigned,
   prioritised + categorised `Conversation`** — admins Pick up → Assign → Resolve. **Resolution
   reuses `POST /conversations/:id/resolve` and requires a `ServiceLog`**; because
   `kavach-programme` is deliberately not a registered plugin, the log is written with
   `serviceId: 'other'` + `serviceName: "Kavach Programme — <item>"`. Resolve marks the item done
   on the dealer's behalf, resets its clock, and fires the existing "request resolved" push.
   `LIGHT` items never auto-escalate.

7. **In-chat reminder is a plain system message + push deep-link, not a `RecordCard`.** The
   existing record card fetches a `DealerRecord` and renders disabled for a non-record id, so it
   cannot carry a Kavach deep-link. MVP delivers reminders as a chat system **text** line plus an
   Expo push (`data: { deeplink: 'kavach', itemId }`) routed to the Kavach tab. A tappable in-chat
   Kavach card (`card.kind: 'kavach'` + route `/kavach/items/:id`) is explicit new client work,
   deferred — not "RecordCard reuse."

8. **UX seam (from the spec).** A dedicated **Kavach tab** in `mdg-client` is where the dealer
   SEES and ACTS (Today list, one Pump-health ring, Mark done + optional photo, "Message us"
   escape hatch). All reaching-out (reminders, escalations, resolutions) flows through chat +
   push, deep-linking back to the same task. Tasks never clutter chat; conversations never live in
   the tab. To respect the adoption audit's 4-tab ceiling, **Services is demoted into Profile when
   Kavach ships** rather than adding a 5th tab.

9. **First-run is forgiving (never a public exam failure).** On initiation, every un-baselined
   item gets a fresh clock (`lastDoneAt = initiatedAt`, status `VALID`) and the programme carries a
   `settlingUntil = initiatedAt + 7 days` window during which no reminders or escalations fire and
   the dealer never sees a red score. Field-agent baselines entered later only lower specific items
   after the settling-in window.

10. **System sender + scheduler safety.** System messages need a valid `Message.senderId`; a
    dedicated **"MDG System"** admin user is seeded/resolved once at boot and used as the sender.
    The sweep is day-grained and **idempotent** (gated on `reminder.nextRemindAt` / `lastSentAt` /
    `cycleStartedAt` and the sticky `escalation.escalated` flag) and **skips dealers/programmes
    whose status is not `ACTIVE`** (SUSPENDED/ONBOARDING).

11. **Seeding & audit.** A seed ships the reconciled ~45-item master list (raw source titles kept
    for traceability + clean dealer-facing bilingual labels). Programmes snapshot the template at
    initiation, so future template edits never silently rewrite live dealer state. New audit actions:
    `KAVACH_INITIATE / KAVACH_MARK_DONE / KAVACH_ESCALATE / KAVACH_RESOLVE / KAVACH_ITEM_ADD /
KAVACH_ITEM_PAUSE / KAVACH_SOS_FLAG`.

## Rationale

- **Right abstraction for the job.** Per-item mutable state, independent clocks, and
  dealer-driven resets are first-class data, not a config blob. Modelling them directly keeps both
  the plugin contract and Kavach honest.
- **Minimal new surface.** No new escalation API (an escalation is an existing conversation), no
  new resolution path (existing resolve + ServiceLog with `serviceId: 'other'`), no new auth
  (existing `requireRoles` + dealer scoping), one additional scheduler sweep rather than a new
  scheduler. The catalog "initiate once" affordance is reused so admins learn nothing new.
- **Adoption-safe by construction.** One number and a short Today list in a WhatsApp-simple tab;
  a single daily digest instead of per-item nagging; a forgiving first run; jargon
  (VALID/EXPIRED, points, buckets) stays admin-side.
- **One source of truth.** Days-based cadence + a computed total mean the headline score is always
  internally consistent, unlike the conflicting sheet.

## Consequences

- **Locked choices:** Kavach is NOT a ServicePlugin and does NOT use `DealerService`; cadence is
  days-driven with a derived bucket; scoring counts `EXPIRING_SOON` as compliant and excludes SOS
  from the operational denominator; `LIGHT` items never auto-escalate; resolution always writes a
  `ServiceLog` (`serviceId: 'other'`); daily reminders are a single per-dealer digest.
- The scheduler now runs two sweeps (plugin tick + `evaluateKavachProgrammes()`); the single-process
  MVP constraint from ADR 0003 still applies, and per-programme `nextEvaluateAt` bounds the sweep cost.
- `KavachItem.history` (item timeline), `AuditLog` (security trail), and `ServiceLog` ("what we did")
  are intentionally complementary, not redundant.
- Template edits are versionless against live state by design; a "re-baseline" action (tied to the
  2-monthly review), SOS event hooks, a tappable in-chat Kavach card, the cross-dealer dashboard as
  its own nav item, proof verification, and trend analytics are all deferred to Phase 2.
- Reminders depend on `PUSH_ENABLED`; with push off, the daily digest chat message is the only
  channel and dealers must open the app to see it (flagged in spec §10).
- The MVP operational score is **self-reported trust** (frictionless "Mark done" without mandatory
  proof on most items), not audited compliance; implausible self-reporting is surfaced for a gentle
  field-agent check, not a dealer-facing accusation. This matters if the score is ever shared upward
  to the oil company (open question, spec §10).

### Naming awareness (not a blocker)

"Kavach" (कवच, _armour/shield_) is the pre-decided product brand. It also names **Indian Railways'
national Automatic Train Protection system (KAVACH)** — a well-known, government-backed system in the
same market (India). For a trust-dependent, Hindi-first dealer audience this can muddy recognition, so
it is surfaced to the owner as a real branding decision (see spec §10), not merely a marketing
footnote. No code depends on the brand word.
