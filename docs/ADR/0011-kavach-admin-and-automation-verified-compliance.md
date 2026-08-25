# ADR 0011 — Dealer Kavach: admin- and automation-verified compliance

- Status: Accepted
- Date: 2026-08-26
- **Supersedes ADR 0006 §1 (actor), §6 (reminders and escalation), §11 (versionless template edits)
  and its 2026-06-30 `requiresProof` amendment.** The subsystem decision in ADR 0006 §1 — that
  Kavach is a first-class stateful subsystem rather than a `ServicePlugin` — still stands.
- Contracts: `shared/src/types/kavach.ts`, `shared/src/schemas/kavach.ts`, seed
  `shared/src/data/kavachTemplate.ts`
- Migration: `mdg-backend/scripts/migrate-kavach-overlay.ts`

## Context

Under ADR 0006 the dealer marked their own tasks done. The subsystem's whole shape followed from
that: a per-item reminder ladder to chase them, an escalation path that raised a ticket against them
when they did not act, and a score ADR 0006 itself described as "self-reported trust … not audited
compliance".

The product owner has changed the actor. **Every task in Dealer Kavach is now marked by an MDG admin
or by an automation.** Where the fact is physical, we ask the dealer for a photograph and an admin
rules on it. Where the fact already lives in a portal or in our own data, a signal proves it. The
dealer's photo, note or claim is an _input_ to the decision and never the decision.

That single change invalidates most of what the subsystem was built to do, and — more importantly —
changes what the number _is_. It stops being the dealer's declaration that we merely store, and
becomes **MDG's written statement about that dealer**, delivered daily and forwardable as an image.
A statement carries obligations a declaration does not.

Three facts shaped everything below.

**The arithmetic.** Counted from the seed: 45 tasks, 40 of them clocked, 3,740 operational points.
Verifying each on its own cadence is **10.555 admin marks per dealer per day** — 85/day at 8 dealers,
528 at 50, 2,111 at 200. The ten DAILY tasks are 10.0 of that 10.555; everything else together is
0.555. Any design that does not make the daily ten fast is not a design.

**What can honestly be automated.** Only two tasks are provable from data we already hold —
the density-register photo (75 pts) and stock variation within limit (40 pts): **115 points, 3.1%**.
Six more are portal facts nobody has scraped yet (≈1,090 points). Twenty-four are permanently a human
with a camera.

**A latent bug that the change would have made systemic.** `warnWindowDaysFor('DAILY')` returns 0 and
`expiresAt` is the next IST midnight, so from 00:00 every daily task reads `EXPIRED`. The digest fires
at 08:00. Under self-marking that was the dealer's cue to do it again; under this model it would mean
telling every dealer every morning that they are 585 points (15.6%) short, with 100% unreachable by
construction.

## Decision

### 1. Definitions leave the item and resolve at read time

`KavachItem` becomes pure state. The thirteen definition fields it copied at initiation are gone. A
task's definition resolves as

```
(global active catalog − hiddenCodes) + active customItems, with overrides applied
```

from `KavachTemplate` plus a new per-dealer `DealerKavachList`, in `services/kavach/effectiveList.ts`.
This is a structural clone of the staff work-list overlay: one overlay pattern in the codebase, not
two.

This is what makes the owner's requested defaults tab real. ADR 0006 §11 deliberately snapshotted
definitions so template edits never rewrote live state — which meant a super-admin could change a
task's points, watch it save, and **move nobody**. `getEffectiveKavachListBatch(dealerIds)` resolves
the whole book in two queries so the cross-dealer queue does not become one query per row.

### 2. The verification contract replaces `requiresProof`

On the definition, two fields instead of one boolean:

```
verification: ADMIN | AUTOMATION | DEALER_EVIDENCE_THEN_ADMIN
evidence:     NONE  | PHOTO      | NOTE | PHOTO_OR_NOTE
```

One boolean could express neither "a written note is the evidence" (a maintenance visit) nor "a
machine proved it, nobody attaches anything". **Enforcement inverts**: evidence is the _closer's_
obligation. The old guard fired only when `source === 'MARK_DONE' && by.kind === 'dealer'`, which left
every admin path exempt from all 21 photo tasks — exactly backwards once the admin certifies. An
audited `overrideEvidenceReason` means an admin is never structurally stuck, but has to say why.

Seed mapping: 21 `DEALER_EVIDENCE_THEN_ADMIN`+`PHOTO`, 21 `ADMIN`+`NONE`, 1 `ADMIN`+`NOTE`, 2
`AUTOMATION`.

### 3. `recordVerification()` is the only path that certifies anything

It replaces `markDone()`. Admin verify and automation mark both go through it, so one place decides
what "done" means. Two dates, not one: `doneOn` (the IST business date being certified) separate from
`verifiedAt` (when the click happened). Without that split, a photo taken Monday evening and reviewed
Tuesday morning could never be credited to Monday, and the four daily photo tasks would be
structurally unkeepable.

Every completion row carries `defSnapshot { labelEn, labelHi, points }`, so a record scored last month
keeps the points it was scored with after a global edit. History is capped at
`KAVACH_HISTORY_LIMIT` (50) and never projected on list endpoints; `AuditLog` remains the durable trail.

### 4. Two new statuses, so the number can admit what it does not know

- **`NOT_YET_VERIFIED`** — nobody has ever checked. Outside both sides of the percentage during the
  settling window, in the denominator afterwards, and **always carried as a disclosed count**. An
  untouched programme can no longer read 100%.
- **`HELD`** — the automation that proves this could not run. Counts as compliant, off both the
  pending list and the admin queue, capped at 7 days. A failed collection produces no artifact, which
  from the store's point of view is identical to a dealer who did nothing; charging that to the dealer
  would make their score a report on _our_ uptime.

`verifyGraceDays` (1 for DAILY, 0 otherwise) plus 2 further days while evidence sits unreviewed fixes
the 08:00 trap. A task must not go red because MDG has a review backlog.

### 5. The evidence exchange is a block on the item

`request { state: NONE|ASKED|SUBMITTED|REJECTED, openedBy, askedCount, submission, rejectReason }`.
Not a collection (it is strictly 1:1 and only one can be live, so a second document would only create
something to reconcile) and not a `Conversation` (a dealer has one thread, so every ask would land in
the same place, and a chat message is immutable).

**Nothing in this block ever moves the score or the clock.** "The dealer sent it" and "MDG accepted
it" are different facts and every screen shows them as different facts. A submission with an empty
body is the unprompted claim — "I've done this" — which queues the task for review and moves nothing.
The dealer keeps a way to act and a way to disagree, without self-certification returning by the back
door.

### 6. Reminders and escalation are deleted outright

Not deprecated — removed, along with `escalateItem`, `escalateItemManual`, the ladder helpers,
`priorityFromTier`, `nextEvaluateAt` and their indexes. All of it existed to pace nagging a dealer
into ticking a box. An overdue task is now **unfinished MDG work** and belongs in the admin work
queue, not in a ticket raised against the dealer.

`POST /conversations/:id/resolve` no longer certifies. It used to call `markDone` on every task
escalated onto the thread; a dealer has ONE thread and 33 of 40 tasks were escalation-eligible, so a
single Resolve could certify dozens of compliance tasks, signed with the resolving admin's name.
Under an audited model that is a false attestation. Resolve now detaches and stamps `resolvedAt`.

### 7. The scheduler splits in two

- `evaluateKavachProgrammes` — daily at ~00:20 IST. Reconciles automation signals, recomputes
  statuses and scores, one `bulkWrite` per programme. Statuses are IST-day-grained, so the old hourly
  shape burned 23 of every 24 passes re-deriving values that could not have changed, and at 200
  dealers issued ~9,000 individual saves per pass.
- `runKavachDigestPass` — hourly, because each dealer chooses the hour they hear from us.

Both carry an overlap guard.

### 8. Automation is a scheduled reconciler with a declarative signal registry

A signal exposes `probeBatch(dealerIds, businessDate) → SATISFIED | NOT_SATISFIED | UNKNOWN`. Kavach
imports the domain stores; nothing imports Kavach. Rejected: a success hook from the plugin runtime —
it can only ever say "yes", cannot express `UNKNOWN` (the whole safety mechanism behind `HELD`), and
would put Kavach on the critical path of every portal run.

The reconciler judges **yesterday**, because today is still in progress. It is gated on the producing
`DealerService` being `ACTIVE` — _"not attached" must never read as "not done"_ — guarded on
`isSameIstDay` for idempotency, and skips paused tasks. A `signalId` naming no registered signal
**fails the boot**: otherwise the task could never be satisfied, would expire every cycle, and would
log nothing to explain it.

`daily-dsr-before-10am` is `ADMIN` with a _corroborating_ signal. The task asks about the dealer's own
DSR book; auto-closing on our generated report would quietly turn 75 points of their score into a
report on our uptime.

### 9. The daily list: automatic message, admin-approved card, behind a per-dealer gate

`KavachDailyDigest` is one frozen document per `(dealerId, businessDate)`, unique-indexed, mirroring
`DsrReport`. Frozen because the dealer keeps what we send: a card that said 84% this morning must
still say 84% after an admin verifies three tasks at lunchtime.

- The **bilingual chat line** is delivered automatically at the dealer's hour, once per IST day. It
  restates what they can already see in their own tab.
- The **rendered PNG card** is admin-approved and idempotent per day. An image with a percentage on it
  is forwardable and can end up in front of an inspector; nothing reaches that state without a person
  having looked at it. Same rule as DSR and Credit & DOD.

Both sit behind **`KavachProgramme.dealerFacingEnabled`, off by default, including on a freshly
initiated programme.** On day one the honest figure is "nobody has checked anything yet", and sending
that unasked would be the worst possible first impression. An admin turns it on once they are
actually verifying that outlet's tasks — which makes "we don't tell them until we've done the work" an
enforced rule rather than a habit every admin has to remember.

### 10. Requirement 4: the two editing surfaces

- `/super-admin/kavach-items` — the global catalog. Editing points moves every dealer without an
  override, from their next evaluation. Retire (`active: false`), never hard-delete: live dealers hold
  state rows and history keyed on the code. `code` is immutable on an existing row.
- `/dealers/:id/kavach/work-list` — the per-dealer overlay: hide, add, override. Full-replace `PUT`,
  like the staff work list. Adding or removing a task creates or pauses the state row immediately.

Custom codes are server-generated and always `custom-`-prefixed; the global create schema rejects that
prefix. Without the rail a dealer custom could shadow a global code, and the symptom would not be an
error — it would be a silently wrong score.

The seeder now writes the editable columns under `$setOnInsert`. Under `$set` every deploy silently
reverted the owner's edits: they would change a point value, see it saved, and find it back next
Tuesday with nothing in any log. `seed --reset` is refused in production for the same reason.

## Consequences

- **Every live dealer drops to 0% on migration, by design.** Carrying old self-marked ticks forward
  as though MDG had checked them would make the first "certified" score a restatement of exactly the
  self-declaration this change replaces. Nothing reaches a dealer until `dealerFacingEnabled` is
  turned on, so the figure is internal until the verifying has been done. Each task returns to a real
  standing as it is verified.
- **Admin labour is the new bottleneck**, and it has no other alarm: the dashboard carries
  `daysSinceLastVerified` per dealer precisely so "nobody has looked at this outlet in 11 days" is
  visible rather than silent.
- Automation covers 3.1% of the operational points today. The six unscraped SDMS/e-Mitra tasks
  (≈1,090 points, 29%) are the obvious next increment, and the signal contract is ready for them.
- History rows written before this ADR keep `source: 'MARK_DONE'`. Those values survive in the enum,
  read-only, because "the dealer said so" is exactly what they should keep saying.
- Conversations that carried an escalation remain as ordinary threads; only the link back to a task is
  gone.
- Migration is deploy-then-migrate and idempotent, and drops the snapshot, ladder and escalation
  fields along with their indexes.
