# Kavach Engine — Backend Design

**Status:** Live. Reshaped on 26 Aug 2026 by ADR 0011: an MDG admin or an automation certifies every task, never the dealer. The dealer's Kavach page was removed on 13 Oct 2026 (ADRs 0018 and 0019). The dealer now gets one daily chat line, an admin-approved card, and chat requests for photos. Where this doc and ADR 0011 disagree, ADR 0011 wins.
**Companion ADRs:** 0006 (Kavach is its own subsystem, not a plugin), 0011 (who certifies), 0019 (proof is asked for in the chat).
**Contract of record:** `shared/src/types/kavach.ts` + `shared/src/schemas/kavach.ts`. Where this doc and the contract disagree, the contract wins.
**Timezone:** all date maths runs in **IST (Asia/Kolkata, UTC+05:30)**. Tasks are day-grained; "now" for a status decision is the IST wall-clock day.

---

## 0. Overview & models

Dealer Kavach is an always-on, stateful, per-task compliance tracker. It is a **first-class subsystem, deliberately NOT a `ServicePlugin`** (ADR 0006): it carries per-task clocks, an evidence exchange and a live score, none of which the stateless single-run plugin contract (ADR 0002) can model. The score is MDG's written statement about an outlet, so the whole design is built to keep one rule checkable: **a dealer's photo, note or claim is an input to a decision; only an admin or an automation makes the decision.**

Five collections, layered like the rest of `mdg-backend` (`models/` → `services/kavach/` → `routes/v1/`, plus `scheduler/`).

### `KavachTemplate` — the editable global catalog

The 45 reconciled tasks (`shared/src/data/kavachTemplate.ts`), one row per task, **version 1**. A task's `code`, `srNo`, `titleEn/Hi` (the raw sheet strings, admin-only), `labelEn/Hi` (clean, dealer-facing), `points`, `cadenceDays`, `trigger` (`TIME` or `SOS`), `cadenceBucket`, `domain`, `category`, `verification`, `evidence`, optional `signalId`, `notesEn/Hi`, `active`.

- No dealer holds a copy of it. A super-admin edits it at `/super-admin/kavach-items`, and an edit reaches every dealer that has not overridden that field, from the next recompute.
- **Retire, never delete.** `DELETE /super-admin/kavach-items/:code` sets `active: false`. Live dealers hold state rows and history keyed on the code. `code` cannot change on an existing row.
- The seed writes every editable column under `$setOnInsert`, so a deploy never reverts an owner's edit (see §2.1).

### `DealerKavachList` — one overlay per dealer

`hiddenCodes` (global tasks this outlet does not have), `customItems` (tasks only this outlet has; codes are server-generated and always start `custom-`, which the global create schema rejects, so a custom task can never shadow a catalog code), and `overrides` (per-field amendments to a catalog row: `points`, `cadenceDays`, `verification`, `evidence`, notes). Edited from the dealer's work-list tab (`PUT /dealers/:dealerId/kavach/work-list`, a full replace). It is the twin of the staff `DealerWorkList`: one overlay pattern in the codebase, not two.

**Effective list** (`services/kavach/effectiveList.ts`): `(active catalog − hiddenCodes) + active customItems`, with overrides applied, plus the derived `tier`, `cadenceBucket`, `warnWindowDays` and `verifyGraceDays`. Every read path, the scorer and the queue take a definition from here and nowhere else. The catalog is cached in process for 60 s and dropped on every write. `getEffectiveKavachListBatch(dealerIds)` resolves a whole book in two queries.

A state row whose code no longer resolves (retired, or hidden) is left alone as history. It is not scored and not shown.

### `KavachProgramme` — one per dealer

`dealerId` (unique), `status` (`ACTIVE | PAUSED`), `outlet.monthYear`, the cached `score` snapshot, `totalPoints`, `settlingUntil`, `initiatedAt/initiatedByAdminId`, `lastEvaluatedAt`, `reminderHour` (0–23 IST, optional), `lastDigestAt`, and the switch **`dealerFacingEnabled`** (off by default, with `dealerFacingEnabledAt/ByAdminId` stamped on the move to on). The outlet's name and RO code are not stored here: the dealer's own code identifies the programme.

### `KavachItem` — state only

One document per (programme × task). It holds **no definition**.

```
programmeId, dealerId, templateCode, custom
status            (KAVACH_ITEM_STATUSES), everVerified
lastDoneAt, doneOn (IST date certified), expiresAt
holdUntil, holdReason            (HELD, §1.3)
lastVerifiedAt, lastVerifiedByKind, lastVerifiedNote
request { state NONE|ASKED|SUBMITTED|REJECTED, openedBy, askedAt, askedCount,
          submission { at, byUserId, proof?, note?, via?, conversationId?, messageId? },
          reviewedAt, reviewedByAdminId, rejectReason }
lastProofAttachment, paused
history[]  { at, doneOn, by{kind,userId,name}, source, proof?, note?, evidence?,
             defSnapshot{labelEn,labelHi,points}, evidenceOverrideReason?, ... }   // capped at 50
indexes: { programmeId, templateCode } unique · { dealerId, status } ·
         { status, paused, expiresAt, _id } (work queue) · { templateCode, status, expiresAt } ·
         { 'request.state', 'request.submission.at' } · { templateCode, dealerId }
```

- **Statuses:** `VALID | EXPIRING_SOON | EXPIRED | PAUSED | NOT_YET_VERIFIED | HELD | SOS_OK | SOS_FLAGGED`. There is no `ESCALATED`: escalation no longer exists.
- **Who closes a task (`verification`):** `ADMIN`, `AUTOMATION`, or `DEALER_EVIDENCE_THEN_ADMIN`. **What the closer attaches (`evidence`):** `NONE`, `PHOTO`, `NOTE`, `PHOTO_OR_NOTE`. The seed has 21 `DEALER_EVIDENCE_THEN_ADMIN`+`PHOTO`, 21 `ADMIN`+`NONE`, 1 `ADMIN`+`NOTE` and 2 `AUTOMATION`.
- `history[].source`: `INITIATION_BASELINE`, `ADMIN_VERIFIED`, `AUTOMATION`, `ADMIN_OVERRIDE` (an SOS flip). `MARK_DONE` and `ADMIN_RESOLVE` are legacy: no longer written, kept so older rows still read.
- `defSnapshot` freezes the label and points a completion was scored with, so a later catalog edit does not rewrite last month.
- The `request` block lives on the item because it is strictly 1:1 with the task and only one can be live. It is not a collection and not a chat thread.

### `KavachDailyDigest` — the frozen day

One per (`dealerId`, `businessDate`), unique. It freezes that day's score and up to five named pending tasks (`pending`, `pendingOverflow`, `awaitingDealerCount`), and records the chat line sent (`messageBody`, `messageSentAt`) and the card (`cardKey`, `cardSize`, `sharedAt`, `sharedByAdminId`, `sharedAudience`, `sharedDeliveries`). Frozen because the dealer keeps what MDG sent: a card that said 84% this morning must still say 84% after an admin verifies three tasks at lunch.

---

## 1. Per-task state machine

### 1.1 IST date maths

`services/kavach/stateMachine.ts` owns it. Dates are stored as UTC but day-aligned to IST midnight, so nothing drifts to "due at 05:30".

```
startOfDayIST(d)           // floor to 00:00 Asia/Kolkata, as a UTC Date
expiresAtFor(doneOn, days) // = startOfDayIST(doneOn) + cadenceDays ; null for SOS or no baseline
warnWindowDaysFor(bucket)  // table below
verifyGraceDaysFor(bucket) // 1 for DAILY, 0 otherwise
tierFromPoints(points)     // CRITICAL >= 200, STANDARD 50-199, LIGHT < 50 (KAVACH_TIER_THRESHOLDS)
computeStatus(task, now)   // the pure status function, §1.3
istDayKey / istDayKeyToDate / isSameIstDay / istHour
```

`tier` no longer paces anything. It only colours rows in the admin screens.

### 1.2 Warning window (the `EXPIRING_SOON` lead)

| cadenceBucket | cadenceDays | warnWindowDays | Note                                   |
| ------------- | ----------- | -------------- | -------------------------------------- |
| DAILY         | 1           | 0              | no lead; the grace day in §1.3 applies |
| WEEKLY        | 7           | 2              |                                        |
| FORTNIGHTLY   | 15          | 3              |                                        |
| MONTHLY       | 30          | 7              |                                        |
| QUARTERLY     | 90          | 10             |                                        |
| HALF_YEARLY   | 180         | 14             |                                        |
| YEARLY        | 365         | 15             | long-lead licences                     |
| BIENNIAL      | 730         | 21             | (not "TWO_YEARLY")                     |
| SOS           | null        | n/a            | not on the clock (§1.4)                |

`cadenceDays` is the source of truth. The bucket is derived from it (`bucketFromCadenceDays`).

### 1.3 Status function (TIME tasks)

The order of the guards is the design.

```
computeStatus(task, now):
  if paused                                   -> PAUSED
  if trigger == SOS                           -> SOS_FLAGGED if flagged, else SOS_OK
  if holdUntil && now < holdUntil             -> HELD              (our automation could not run)
  if everVerified == false                    -> NOT_YET_VERIFIED  (nobody has ever checked)
  if lastDoneAt == null                       -> EXPIRED
  hardExpiry = expiresAt + (verifyGraceDays + (request SUBMITTED ? 2 : 0)) days
  if now >= hardExpiry                        -> EXPIRED
  if now >= expiresAt - warnWindowDays        -> EXPIRING_SOON
  else                                        -> VALID
```

- **`NOT_YET_VERIFIED`** means nobody has checked this task since the programme began. It is not `EXPIRED`: expired means we checked once and the clock ran out. The score treats it separately (§6).
- **`HELD`** means the automation that proves this task could not look (no record collected for that day, a report that failed its correctness check, a portal that was down). It counts as compliant, stays off the admin queue, and lapses after **7 days** (`holdUntil`), after which it is MDG's to answer for. A failed collection leaves no artifact, which looks the same as a dealer who did nothing; charging that to the dealer would make their score a report on MDG's uptime.
- **`verifyGraceDays`** (1 for DAILY) fixes the 08:00 trap. A daily task has no warning window and expires at the next IST midnight, so without grace all ten daily tasks read `EXPIRED` from 00:00 and every dealer would be told each morning they were 585 points (15.6%) short, with 100% unreachable. One day of grace means yesterday's daily tasks stay verifiable until tonight.
- A dealer's answer waiting for review adds **2 more days** (`SUBMITTED_GRACE_DAYS`). A task must not go red because MDG has a review backlog.
- The stored `status` is a cache of this function. The nightly refresh (§3.1) and every write recompute it.

### 1.4 SOS tasks — separate, no clock

SOS tasks (`trigger: SOS`, `cadenceDays: null`) have no `expiresAt` and never decay. They are `SOS_OK` by default. Only an admin flips one to `SOS_FLAGGED` (`PATCH /kavach/items/:itemId/sos`), and that is a live non-compliance, so `SOS_FLAGGED` is in the pending list (§5). `recordVerification` refuses an SOS task. SOS tasks are **outside the operational percentage** (§6.1, rationale in Appendix A).

### 1.5 Transitions (TIME tasks)

```
 NOT_YET_VERIFIED ──┐
                    │  admin verify / automation mark / initiation baseline
 any state ─────────┴──►  VALID  (lastDoneAt = doneOn, expiresAt = doneOn + cadenceDays)
                           │ now >= expiresAt - warnWindowDays
                           ▼
                      EXPIRING_SOON
                           │ now >= expiresAt + grace
                           ▼
                        EXPIRED  ──── an admin verify or automation mark returns it to VALID

 signal could not look ──►  HELD (7 days)  ──► lapses ──► back to the clock above
```

A task closes only by `recordVerification` (§5). Nothing the dealer sends moves it.

---

## 2. Bootstrap

### 2.1 Catalog seed — `seedKavachTemplate()`

Runs at boot (`mdg-backend/src/seed/kavachTemplate.ts`), idempotent. It upserts the 45 rows with **editable columns under `$setOnInsert`** (labels, points, cadence, `verification`, `evidence`, `signalId`, `active`) and structural columns under `$set` (`srNo`, raw titles, `domain`, `category`). With `$set`, every deploy silently put a super-admin's edit back. `seed --reset` is refused in production for the same reason.

After seeding, `assertKavachSignalsResolve` **fails the boot** if any `signalId` names a signal that is not registered. Otherwise the task could never be satisfied, would expire every cycle, and log nothing to say why.

Definitions are not copied into dealers' state. They resolve at read time (§0).

### 2.2 System sender — `resolveSystemUser()`

`MessageModel.senderId` is required, and the scheduler has no admin identity. The seeder find-or-creates one `MDG System` admin user (`system@dealerkavach.local`) and caches its id. It is the default sender of system-written chat messages across the product, not only Kavach's (the daily line and the card are two). The dealer sees the sender as "MDG", never the email.

---

## 3. The two jobs

Both are registered in `scheduler/index.ts` with `{ timezone: env.KAVACH_TZ }` and carry an overlap guard, so a slow pass never has a second copy started on top of it. Both cover only `ACTIVE` programmes of `ACTIVE`, non-archived dealers.

### 3.1 Nightly refresh — `evaluateKavachProgrammes()`

`KAVACH_REFRESH_CRON`, default `20 0 * * *` (00:20 IST). In order:

1. **Reconcile automation signals** for **yesterday** (§3.2).
2. **Recompute every task's status** from its resolved definition, clear lapsed holds, write one `bulkWrite` per programme.
3. **Recompute the programme score** (§6) and stamp `lastEvaluatedAt`.

Statuses are IST-day-grained, so more than one pass a day would only re-derive values that cannot have changed. The same nightly pass then expires old document asks and sends the paper-validity reminders; those share the clock, not the code.

### 3.2 Reconciling signals — `services/kavach/reconcile.ts`

A signal exposes `probeBatch(dealerIds, businessDate) → SATISFIED | NOT_SATISFIED | UNKNOWN` per dealer. Kavach imports the domain stores; nothing imports Kavach. The reconciler judges **yesterday**, because today is still in progress and judging it at 00:20 would fail work not yet done.

- A signal only speaks for dealers whose producing `DealerService` is `ACTIVE` (`requiresServiceId`). "Not attached" must never read as "not done".
- `SATISFIED` → `recordVerification` with `source: AUTOMATION` and the proving artifact in `evidence`. Skipped if that date is already certified, so a re-run adds no history.
- `UNKNOWN` → `HELD` for 7 days (`HOLD_DAYS`). `NOT_SATISFIED` → leave the clock alone and let it expire.
- A paused task is skipped.

Registered signals (`signals/registry.ts`): `tt-register-photo` (closes `daily-density-book`, 75 pts: a day marked means `SATISFIED`, a day recorded as missing means `NOT_SATISFIED`, no record yet means `UNKNOWN`), `dsr-variation-within-limit` (closes `stock-variation-within-limit`, 40 pts), and `dsr-generated`. The last one only **corroborates** `daily-dsr-before-10am`, which stays `ADMIN`: the task asks about the dealer's own DSR book, and closing it on our generated report would turn 75 points of their score into a report on our uptime. The two closing signals cover 115 of 3,740 operational points (3.1%).

The stock-variation signal returns `UNKNOWN` (so `HELD`, not a fail) when the day has no DSR, the DSR is marked stale, it has not passed the pre-send correctness check (ADR 0014; the live server runs `ASSURANCE_MODE=ENFORCE`, the code default is `SHADOW`), or it carries no product figures. A product actually over its limit is `NOT_SATISFIED`: holding a real failure would mark it compliant, the opposite of the task.

### 3.3 Hourly delivery pass — `runKavachDigestPass()`

`KAVACH_SWEEP_CRON`, default `0 * * * *`. Each dealer chooses the hour they hear from MDG, so this runs hourly. It is cheap: one upsert per programme.

1. **Build** today's `KavachDailyDigest` for every active programme (idempotent per dealer per date), so the admin's day list is always current.
2. **Deliver** the chat line (§4) only to a dealer for whom all three gates hold: an admin switched them on (`dealerFacingEnabled`), it is their `reminderHour` (default `KAVACH_DEFAULT_REMINDER_HOUR` = 8), and nothing has gone today (`lastDigestAt`, `messageSentAt`).

### 3.4 Idempotency

State, not timing, is what makes a pass safe to run twice. Statuses are recomputed from dates. A signal mark is skipped when `doneOn` already equals the business date. The digest upsert is keyed on (dealer, date), the line is gated by `lastDigestAt`, and the card is claimed atomically by `sharedAt` (§4). A pass that runs late catches up on the next tick; nothing is replayed.

---

## 4. What reaches the dealer

There is no Kavach page in the dealer app. Old links to `/kavach` open the member's own chat. Three things reach the dealer, all in the chat.

1. **A daily line.** Sent automatically at the dealer's hour, once per IST day, to the owners and the manager, only when the dealer is switched on. It is written in the reader's language and led by what MDG needs from them: up to two photo requests by name, else "no score yet" (nothing verified), else "we are checking your pump" (inside the settling window, no figure), else "{n}% today, our team is checking the rest", else "everything checked". It never accuses: an overdue task is at least as likely to be MDG's backlog. The push opens that chat.
2. **A card, approved by an admin.** `POST /dealers/:dealerId/kavach/digests/:businessDate/share` renders the frozen day as a PNG and posts it to owners, the manager, or both (the admin picks). Not automatic, because an image with a percentage on it can be forwarded and can end up in front of an oil-company inspector, and nothing reaches that state without a person looking. A day is shared once (claimed before rendering; the claim is released if rendering or posting fails). Needs `dealerFacingEnabled`. Audited `KAVACH_DIGEST_SHARE`. The route works, but no admin screen calls it today (checked 15 Oct 2026 in `mdg-admin`, `mdg-admin-app` and `mdg-client`).
3. **Photo requests** (`kv:<itemId>`, §5.2). An admin asks, the dealer answers with a photo in the same thread, an admin marks it received.

**Switching a dealer on.** `PATCH /dealers/:dealerId/kavach/programme` with `dealerFacingEnabled: true`. It is **off by default, including for a freshly initiated programme**: on day one the honest figure is "nobody has checked anything yet", and sending that unasked is the worst first impression. An admin turns it on once they are actually verifying that outlet. The move to on stamps `dealerFacingEnabledAt/ByAdminId` and is audited `KAVACH_PROGRAMME_UPDATE`. The same call sets `reminderHour` and pauses or resumes the programme.

The older dealer endpoints `GET /kavach/me` and `POST /kavach/items/:itemId/evidence` still answer, for an installed app that predates ADR 0019. Nothing new calls them.

---

## 5. Verifying, proof and the work queue

### 5.1 `recordVerification()` — the only path that certifies

Admin verify (`POST /kavach/items/:itemId/verify`) and automation mark both go through it, so one function decides what "done" means.

- **Two dates:** `doneOn` (the IST business date certified; default today; not in the future; not older than one cadence period) is separate from `verifiedAt` (when the click happened). A photo taken Monday evening and reviewed Tuesday morning can still be credited to Monday.
- **Evidence is the closer's duty.** If the task's `evidence` is `PHOTO`, `NOTE` or `PHOTO_OR_NOTE`, the admin must attach it. `overrideEvidenceReason` closes it without, on the record (printed in history, audited), so an admin is never stuck. An automation is exempt but must name the artifact that proved it (`evidence.summary`), or the call is refused.
- Refused for a paused task and for an SOS task.
- Effect: `lastDoneAt = doneOn`, `expiresAt = doneOn + cadenceDays`, `everVerified = true`, any hold lifted, the `request` block reset, a history row with `defSnapshot`, the score recomputed. Audited `KAVACH_ADMIN_VERIFY` or `KAVACH_AUTOMATION_MARK`.

### 5.2 The evidence exchange — proof is asked for in the chat

Three functions touch the `request` block. **None of them moves the score or the clock.** "The dealer sent it" and "MDG accepted it" are different facts.

| Step                             | Function / route                              | State after                |
| -------------------------------- | --------------------------------------------- | -------------------------- |
| Admin asks for a photo           | `requestEvidence` · `POST …/request-evidence` | `ASKED` (`askedCount` + 1) |
| Dealer sends it                  | `submitEvidence`                              | `SUBMITTED`                |
| Admin accepts                    | `recordVerification` (verify)                 | `NONE`, task `VALID`       |
| Admin sends it back, with reason | `rejectEvidence` · `POST …/reject-evidence`   | `REJECTED`                 |

The ask is a chat message from MDG with a "Send photo" button, ref `kv:<itemId>` (ADR 0019). The dealer's photo, sent as a reply to it (or picked up from a plain reply that quotes it), is copied into the Kavach proof folder and submitted as evidence by `services/chatAsks/link.ts`. An admin then marks it received in the inbox ("Mark received" verifies the task with that photo as proof) or verifies it from the Kavach drawer; both post a "✓ Received" reply under the photo, and a send-back posts the reason with the button. A task closed with a note, or an SOS task, cannot be received this way. An empty submission is the unprompted claim ("I've done this"): it queues the task for review and moves nothing. Proof waiting for review raises one admin alert per outlet, `kavach_to_verify`, linked to the chat thread the photo came through.

### 5.3 The admin work queue

`GET /kavach/work-queue`, shown at `/kavach` in the admin. One flat list across the whole book of every non-paused task in a pending status (`EXPIRED`, `EXPIRING_SOON`, `NOT_YET_VERIFIED`, `SOS_FLAGGED`), oldest expiry first, with `daysPending`. Filters: `dealerId`, `code` ("stock board, every dealer" in one pass), `status`, `verification`, `awaitingReview`. Archived dealers are excluded.

It is flat because verification is repetitive data entry: the seed asks for roughly 10.6 verifications per dealer per day, ten of them the DAILY tasks. It pages by keyset on (`expiresAt`, `_id`), never by offset, because rows close while an admin pages; tasks with no clock yet (`NOT_YET_VERIFIED`) come first and have their own cursor form.

`GET /kavach/dashboard` (`/kavach/dashboard` in the admin) is the per-dealer standing view. Its row carries `daysSinceLastVerified`, the only alarm for MDG's own backlog ("nobody has looked at this outlet in 11 days").

---

## 6. Scoring

### 6.1 Formula (`services/kavach/scoring.ts`)

```
operational = tasks where trigger == TIME and not paused
validPoints = Σ points of operational tasks with status in {VALID, EXPIRING_SOON, HELD}
totalPoints = Σ points of operational tasks              // live, NEVER hardcoded
scored      = totalPoints > 0
overallPct  = scored ? round(100 × validPoints / totalPoints) : 0
byBucket[b] = 100 × (valid points in bucket b) / (points in bucket b)
```

- `EXPIRED` contributes 0. `HELD` counts as compliant (our failure, not theirs). A due-soon task is still currently compliant.
- **`NOT_YET_VERIFIED`** is left out of **both** sides while the programme is settling in (`now < settlingUntil`), so a new dealer is not marked down for work nobody has reached. Afterwards it counts in the denominator, so an untouched programme cannot read 100%. Either way its count and points (`notYetVerifiedCount/Points`) and `heldCount` are carried separately: a percentage that hides how much was never examined is a claim, not a measurement.
- **`scored: false`** means nothing is scoreable yet. There is then no percentage at all (not 0, not 100). Read `scored` before `overallPct` on every surface.
- SOS tasks are excluded from `overallPct`. `byBucket.SOS` reports the share of SOS tasks currently `SOS_OK`.
- `totalPoints` is the live sum for that dealer. In the shipped seed it is 3,740 for TIME tasks (4,060 with the five SOS tasks, 320). Never use the stale 3,580 footer from the source sheet. A catalog edit or a dealer override changes the denominator.

### 6.2 When it is recomputed

The result is cached on `KavachProgramme.score`. `recomputeScores(programme)` is a plain pass over the programme's ~45 state rows. It runs on every verification, pause or unpause, custom task add or remove, work-list save, SOS flip, and in the nightly refresh.

### 6.3 What a dealer may see

The figure is MDG's statement, so the dealer's copy is gated by `kavachScoreIsPublishable` (`shared/src/kavach/dealerFacing.ts`), which the serializer, the daily line and the AI first line all call. All three must hold: an admin has switched the dealer on; something has been verified (`scored`); the settling window has ended. If any fails, `overallPct` and `totalPoints` are **left out of the payload, not zeroed** (0% is also a statement). `byBucket` and `validPoints` are always left out of the dealer's API payload. The shared card is an image an admin approved and does print `valid / total` points (A.3). The "not yet checked" count is shown to the dealer even when the figure is withheld: it is a statement about MDG's backlog, not a verdict on the outlet.

---

## 7. Start-up, custom tasks and the settling window

`POST /dealers/:dealerId/kavach/programme` → `programmeService.initiate`, validated by `initiateKavachProgrammeSchema`:

1. Create the `KavachProgramme`: `ACTIVE`, `outlet.monthYear` from the input, `settlingUntil = initiatedAt + 7 days`, **`dealerFacingEnabled: false`**, optional `reminderHour`.
2. Resolve the dealer's effective list, so tasks already hidden or added in the overlay are respected.
3. Insert one state row per task, in one write:
   - **Untested task** (no baseline): `NOT_YET_VERIFIED`, `everVerified: false`, `lastDoneAt` null. A new dealer is not marked compliant for work nobody checked.
   - **Baselined task** (`baselines[code]`, a date a field agent recorded on the first visit): `lastDoneAt` set, a history row `INITIATION_BASELINE`, status from the clock.
   - **SOS task:** `SOS_OK`. **`excludeCodes`:** `PAUSED`.
4. Recompute the score (unscored until something is verified), audit `KAVACH_INITIATE`.

**Settling window (7 days).** During it, unverified tasks are out of both sides of the percentage, and the dealer is shown no figure. A figure never opens on a failing grade.

**Custom task** (`POST /dealers/:dealerId/kavach/items`, admin): the definition goes into the overlay's `customItems`; a state row is created `NOT_YET_VERIFIED` (SOS: `SOS_OK`). Only custom tasks can be removed (`DELETE /kavach/items/:itemId`); catalog tasks are paused or hidden. Pause and unpause recompute from the current definition, since a task paused for months may have been edited since.

---

## 8. Files and routes

**Shared:** `shared/src/types/kavach.ts`, `shared/src/schemas/kavach.ts`, `shared/src/data/kavachTemplate.ts` (seed), `shared/src/kavach/dealerFacing.ts` (publish gate).

**Models:** `KavachTemplate`, `DealerKavachList`, `KavachProgramme`, `KavachItem`, `KavachDailyDigest`.

**Services (`mdg-backend/src/services/kavach/`):** `stateMachine.ts` (pure date maths and status), `effectiveList.ts` (overlay resolver), `programmeService.ts` (`initiate`, `recordVerification`, evidence exchange, custom tasks, pause, SOS), `scoring.ts`, `reconcile.ts` + `signals/`, `digest.ts` (build and deliver the line), `share.ts` + `card.ts` (the card), `workQueue.ts`. Chat asks and verdicts: `services/chatAsks/kavachAsk.ts`, `link.ts`, `verdict.ts`. Scheduler: `scheduler/kavach.ts` (nightly refresh), registered with the hourly digest pass in `scheduler/index.ts`.

**Routes** (`routes/v1/kavach.ts`, `kavachCatalog.ts`):

| Caller             | Routes                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Admin, one dealer  | `/dealers/:dealerId/kavach/` `programme` (POST, GET, PATCH), `items` (GET, POST), `digests` (GET), `digests/:businessDate/share` (POST); `/dealers/:dealerId/kavach/work-list` (GET, PUT, GET `effective`)               |
| Admin, all dealers | `/kavach/` `work-queue`, `dashboard`, `catalog` (read-only lookup), `items/:itemId` (GET), `items/:itemId/verify`, `…/request-evidence`, `…/reject-evidence`, `…/paused`, `…/sos`, `items/:itemId` (DELETE, custom only) |
| Super-admin        | `/super-admin/kavach-items` GET, POST, PATCH `/:code`, DELETE `/:code` (retire)                                                                                                                                          |
| Older app          | `GET /kavach/me`, `POST /kavach/items/:itemId/evidence` (dealer tokens; kept for installed apps)                                                                                                                         |

**Admin screens:** `/kavach` (work queue), `/kavach/dashboard`, `/kavach/defaults` (super-admin catalog editor), and on each dealer a Kavach tab (programme, switch-on, digest hour, pause) and a work-list tab.

**Audit actions:** `KAVACH_INITIATE`, `KAVACH_PROGRAMME_UPDATE`, `KAVACH_ADMIN_VERIFY`, `KAVACH_AUTOMATION_MARK`, `KAVACH_EVIDENCE_REQUEST/SUBMIT/REJECT`, `KAVACH_ITEM_ADD`, `KAVACH_ITEM_PAUSE`, `KAVACH_SOS_FLAG`, `KAVACH_CATALOG_CREATE/UPDATE/DELETE`, `KAVACH_WORK_LIST_UPDATE`, `KAVACH_DIGEST_SHARE`. `KAVACH_MARK_DONE`, `KAVACH_ESCALATE` and `KAVACH_RESOLVE` are no longer written.

**Env:** `KAVACH_TZ` (`Asia/Kolkata`), `KAVACH_DEFAULT_REMINDER_HOUR` (8), `KAVACH_SWEEP_CRON` (`0 * * * *`, the hourly digest pass), `KAVACH_REFRESH_CRON` (`20 0 * * *`).

---

## 9. Edge cases

1. **Timezone.** All expiry, warning and delivery-hour maths use `KAVACH_TZ`; both jobs are registered with that timezone. Without it a cron fires in UTC and answers for a different day than everything else.
2. **Paused, suspended or archived.** A paused task is out of the score, the queue and the dealer's list. A programme or dealer that is not `ACTIVE`, and any archived dealer, is skipped by every job: no refresh, no line. On reactivation the next nightly pass recomputes from the dates, so there is no backlog to replay.
3. **No device token, push off.** The chat line is persisted regardless, so it is never lost; the push is best-effort.
4. **Initiated mid-cycle.** Nothing starts compliant and nothing starts failed: untested tasks are `NOT_YET_VERIFIED`, and the dealer sees no figure for 7 days.
5. **Late pass or downtime.** Statuses come from dates, so a late nightly pass simply lands on today's truth. The signals reconciler judges only yesterday; an earlier missed night is not back-filled and the task expires on its own clock.
6. **Catalog edited under live dealers.** The next recompute moves every dealer without an override. Past completions keep their `defSnapshot`.
7. **A signal that names nothing.** Fails the boot (§2.1).
8. **SOS never decays.** No clock, outside the percentage, changed only by an admin flip.

---

## Appendix A — Product rationale carried from the original Kavach programme spec

### A.1 Why the catalog differs from the source sheet

The "PUMP ASSESSMENT SHEET" MAIN tab is canonical for validity and points, with these reviewed exceptions. They are in the seed; the reasons are recorded here because the seed comment gives only the numbers.

| Task                                     | Conflict in the sheet                        | Decision and why                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solar-panel cleaning                     | MAIN 15 days vs WEEKLY tab 7 days            | **15 days.** Field-realistic; weekly is too aggressive.                                                                                                                                                                                                                                                                                             |
| Crocodile-clip wires (bucket and tanker) | MAIN 1 day vs YEARLY tab 365 days            | **365 days.** These are availability checks, not daily chores; 1 day was a sheet artefact.                                                                                                                                                                                                                                                          |
| Safety-signage display                   | MAIN 1 day vs MONTHLY tab 90 days            | **90 days.** A displayed poster is not a daily task.                                                                                                                                                                                                                                                                                                |
| Servo island display                     | 15 points (image) vs 10 (DAILY tab)          | **10 points.** Lower-stakes cosmetic display.                                                                                                                                                                                                                                                                                                       |
| Staff ID cards (CAs with ID)             | MAIN 180 days vs MONTHLY tab 90 days         | **90 days.** A tighter cadence is safer for an ID-availability check.                                                                                                                                                                                                                                                                               |
| Total points                             | MAIN 4,060 vs the sheets' stale 3,580 footer | The total is **computed live** from the reconciled per-task points. The full seed reconciles to **4,060**: 4,015 explicit per-tab points plus an **inferred 45 for the earthing pits**, the one task missing from every per-cadence tab. The operational denominator drops the five SOS tasks (320) and any paused ones, so it runs over **3,740**. |

The earthing-pits 45 is a reconstruction to close the 4,060 − 4,015 gap and is still flagged in the seed for owner confirmation. The editable catalog may differ from the seed values.

### A.2 Why SOS tasks are an availability gauge

The five SOS tasks (tanker decantation paperwork, work permit, subsidy and claim, product sampling, equipment complaint) are done when an event happens, not on a clock. A daily countdown on them is meaningless and would unfairly tank the score. And counting them as compliant by default would let the score rise on tasks a dealer never touches. So they sit outside the percentage as a gauge: `SOS_OK` by default, flipped to `SOS_FLAGGED` only by an admin who saw a real problem on a visit. They send no reminder. Hooking them to real events (a tanker delivery logged, for example) is not built.

### A.3 Dealer versus admin view of the score

The daily chat line carries one percentage and nothing else of the score, and only when §6.3
allows it. The admin-approved card shows more: the percentage, the points behind it
(`valid / total`) and each pending task with its points. It is gated by the admin pressing
share and by `dealerFacingEnabled`, not by the settling window, because a person looks at it
first. Neither carries the per-bucket split. The admin sees the overall percentage, the
per-bucket sub-scores, the point weights and each task's history.

### A.4 Open owner questions

1. **Does the score ever go upward to the oil company?** Not decided. It changes how the dealer should see it: if it can be externally visible, a precise red percentage in a casual daily line is the wrong form, and action language with a coarse band would be safer. The card is already an image that can be forwarded.
2. **Is the "reviewed every two months" cycle a manual re-assessment?** Not decided. If it is, an admin "re-assess" action that re-baselines tasks would be needed. None exists.
