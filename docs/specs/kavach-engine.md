# Kavach Engine — Backend Design

**Status:** Design only (no implementation). Every primitive below is grounded in a real path in `mdg-backend/` or `shared/`.
**Companion ADR:** `docs/ADR/0006-kavach-programme-stateful-assessment-subsystem.md` — documents the deliberate break from the stateless plugin contract (ADR 0002).
**Contract of record:** `shared/src/types/kavach.ts` + `shared/src/schemas/kavach.ts`. This design conforms to those field names **exactly**; where this doc and the contract ever disagree, the contract wins.
**Timezone:** all date math runs in **IST (Asia/Kolkata, UTC+05:30)**. Items are day-grained; "now" for a status decision is the IST wall-clock day.

---

## 0. Overview & models

The Kavach Programme is an always-on, stateful, per-item compliance tracker. It is a **first-class subsystem, deliberately NOT a `ServicePlugin`** (see `shared/src/types/kavach.ts` header and ADR 0006): it carries per-item clocks, reminder ladders, escalation history, and a live score — none of which the stateless single-run plugin contract (`shared/src/types/plugin.ts`, ADR 0002) can model. It reuses the per-member chat / escalation / ServiceLog spine of ADR 0005 verbatim.

Three new collections, layered exactly like the rest of `mdg-backend` (`models/` → `services/` → `routes/v1/`, with the cross-cutting `scheduler/` sweep). Each Mongoose model imitates the house pattern in `mdg-backend/src/models/DealerService.ts` and `Conversation.ts`: const arrays from `@dk/shared` fed into `enum:`, `{ timestamps: true }`, `InferSchemaType`, and a typed `model<...>()` export.

### `KavachTemplate` — global master list

The reconciled master list (~45 items), seeded at boot from `shared/src/data/kavachTemplate.ts`, **versioned**. Source of truth for `code / titleEn / titleHi / labelEn / labelHi / points / cadenceDays / trigger / cadenceBucket / domain / category / requiresProof`. Mirrors `KavachTemplateItem` in the contract. Programmes **snapshot** these at initiation, so later template edits never silently rewrite live dealer state.

```
templateSchema fields  (← KavachTemplateItem):
  code (String, required, unique-per-version), srNo, titleEn, titleHi,
  labelEn, labelHi, points (Number), cadenceDays (Number|null), trigger (enum KAVACH_TRIGGERS),
  cadenceBucket (enum KAVACH_CADENCE_BUCKETS), domain (enum KAVACH_DOMAINS),
  category (enum TICKET_CATEGORIES), requiresProof (Boolean), notesEn?, notesHi?,
  active (Boolean), version (Number)
indexes: { version: 1, code: 1 } unique · { active: 1 }
```

### `KavachProgramme` — one per dealer

Mirrors `KavachProgramme` in the contract. Holds the cached `score` snapshot (`KavachScoreSnapshot`), `status` (enum `KAVACH_PROGRAMME_STATUSES` = `ACTIVE | PAUSED`), `outlet` (`KavachOutletMeta` sub-schema), `settlingUntil`, `initiatedAt / initiatedByAdminId`, `lastEvaluatedAt`, `nextEvaluateAt`, and `totalPoints`.

```
programmeSchema fields  (← KavachProgramme):
  dealerId (ObjectId ref Dealer, required), status (enum, default 'ACTIVE'),
  outlet { retailOutletName, roSapCode, monthYear } (_id:false sub-schema),
  score { overallPct, byBucket (Mixed), validPoints, totalPoints, computedAt } (_id:false),
  totalPoints (Number), settlingUntil (Date),
  initiatedByAdminId (ObjectId ref User), initiatedAt (Date),
  lastEvaluatedAt (Date), nextEvaluateAt (Date)
indexes: { dealerId: 1 } unique · { status: 1 } · { nextEvaluateAt: 1 }   (sweep scan)
```

### `KavachItem` — stateful per-item tracker (the documented break)

One doc per (programme × item), template-derived OR custom. Mirrors `KavachItem` in the contract **field-for-field** — this is where the state machine lives.

```
itemSchema fields  (← KavachItem):
  programmeId (ObjectId ref KavachProgramme, required), dealerId (ObjectId ref Dealer, required),
  templateCode (String|null), custom (Boolean),
  // snapshotted definition:
  titleEn, titleHi, labelEn, labelHi, points, cadenceDays (Number|null),
  trigger (enum), cadenceBucket (enum), domain (enum), category (enum), requiresProof, notesEn?, notesHi?,
  // derived / state:
  tier (enum KAVACH_TIERS), status (enum KAVACH_ITEM_STATUSES),
  lastDoneAt (Date), expiresAt (Date), warnWindowDays (Number),
  reminder { level, maxLevel, lastSentAt, nextRemindAt, cycleStartedAt } (_id:false),
  escalation { escalated (Boolean default false), escalatedAt, conversationId (ObjectId), resolvedAt } (_id:false),
  lastProofAttachment (attachment sub-schema, reuse the one in Message.ts), paused (Boolean default false),
  history [ { at, by{kind,userId}, source (enum KAVACH_COMPLETION_SOURCES), proof?, note?, previousExpiresAt?, newExpiresAt? } ]
indexes:
  { programmeId: 1, templateCode: 1 }                       // join / dedupe
  { dealerId: 1, status: 1 }                                 // dealer "Today" view + dashboard counts
  { 'reminder.nextRemindAt': 1 }                             // sweep scan for due reminders
  { 'escalation.escalated': 1, 'escalation.conversationId': 1 }  // resolve-hook lookup
  { paused: 1 }
```

Note the **status enum has no separate ESCALATED value** (per the contract: `VALID | EXPIRING_SOON | EXPIRED | PAUSED | SOS_OK | SOS_FLAGGED`). Escalation is orthogonal: it is `status === 'EXPIRED'` **plus** `escalation.escalated === true` plus a live `escalation.conversationId`. This keeps scoring simple (only `EXPIRED` zeroes points; see §6).

---

## 1. Per-item state machine

### 1.1 IST date math

All comparisons are done against **IST midnight boundaries** for TIME items (day-grained validity). Store UTC `Date`s but day-align to IST midnight to avoid "due at 05:30 IST" drift. A small `stateMachine.ts` helper module owns this:

```
startOfDayIST(d)         // floor to 00:00 Asia/Kolkata, returned as a UTC Date
expiresAtFor(item)       // = startOfDayIST(lastDoneAt) + cadenceDays days ; null for SOS
warnWindowDaysFor(bucket)// table below
tierFromPoints(points)   // CRITICAL >= 200, STANDARD 50–199, LIGHT < 50  (KAVACH_TIER_THRESHOLDS)
computeStatus(item, now) // pure status fn below
```

`tierFromPoints` uses `KAVACH_TIER_THRESHOLDS` from the contract (`{ critical: 200, standard: 50 }`) — never hardcode the numbers in two places.

### 1.2 warnWindow table (the `EXPIRING_SOON` lead, persisted as `item.warnWindowDays`)

| cadenceBucket | cadenceDays | warnWindowDays | Rationale                                                 |
| ------------- | ----------- | -------------- | --------------------------------------------------------- |
| DAILY         | 1           | 0              | intra-day; "due soon" only from the digest hour to expiry |
| WEEKLY        | 7           | 2              | T−2d heads-up                                             |
| FORTNIGHTLY   | 15          | 3              |                                                           |
| MONTHLY       | 30          | 7              |                                                           |
| QUARTERLY     | 90          | 10             |                                                           |
| HALF_YEARLY   | 180         | 14             |                                                           |
| YEARLY        | 365         | 15             | long-lead license reminders                               |
| BIENNIAL      | 730         | 21             | DAR etc. (NOT "TWO_YEARLY")                               |
| SOS           | null        | n/a            | not on the clock (§1.4)                                   |

### 1.3 Status function (TIME items)

```
warnStartAt = expiresAt − warnWindowDays days
computeStatus(item, now):
  if item.paused                       -> 'PAUSED'
  if lastDoneAt == null OR now >= expiresAt   -> 'EXPIRED'
  if now >= warnStartAt                -> 'EXPIRING_SOON'
  else                                 -> 'VALID'
```

The persisted `item.status` is a **cache** of this pure function; the sweep recomputes it (§3). Dealer-facing labels never expose the enum: `VALID → "Ready / तैयार"`, `EXPIRING_SOON → "Due soon / जल्द"`, `EXPIRED → "Overdue / बाकी है"`.

### 1.4 SOS items — separate, no clock

SOS items (`trigger === 'SOS'`, `cadenceDays === null`) have **no `expiresAt`, no decay, no reminder ladder** in MVP. Their status is one of `SOS_OK | SOS_FLAGGED`:

```
computeStatus(sosItem) = item.paused ? 'PAUSED'
                       : item.status === 'SOS_FLAGGED' ? 'SOS_FLAGGED'
                       : 'SOS_OK'                       // default
```

- `SOS_OK` is the default (an availability gauge — the dealer is assumed ready).
- Only an **admin/field agent** flips it to `SOS_FLAGGED` via `PATCH /kavach/items/:itemId/sos` (`setKavachSosComplianceSchema`).
- The sweep **skips SOS items entirely** in the decay/reminder/escalation phases (`if (item.trigger === 'SOS') continue`).
- **SOS items are EXCLUDED from the operational scoring denominator** (§6) — they cannot silently tank or inflate the dealer's score.

### 1.5 Transition diagram (TIME items)

```
  [initiate / baseline]  lastDoneAt set, now < warnStart
        │ ─────────────────────────────────────────────────────► VALID
        │                                                           │  now crosses warnStartAt
        │                                                           ▼
        │                                                     EXPIRING_SOON
        │                                                           │  now crosses expiresAt
        │                                                           ▼
        │                                                       EXPIRED
        │                          ladder exhausted + grace elapsed │  (tier != LIGHT, not settling-in)
        │                                                           ▼
        │                                       EXPIRED + escalation.escalated = true
        │                                          (= an OPEN, unassigned Conversation)
        │
  ◄──── MARK DONE  (dealer "हो गया"  OR  admin ADMIN_RESOLVE)  from ANY state above
        resets: lastDoneAt = now, expiresAt recomputed, reminder.{level=0, cycleStartedAt=now,
                nextRemindAt=R1-of-new-cycle}, escalation.escalated=false, status=VALID
```

Invariants:

- **`escalation.escalated` is sticky within a cycle** — an item never re-escalates until it is marked done (new cycle) and lapses again. This is the §5 dedup rule.
- There is no "ESCALATED" status node; completion routes the item back to `VALID` of a **new cycle** (`reminder.cycleStartedAt` rolls).

---

## 2. Bootstrap (boot-time setup the sweep depends on)

Both of these run once at boot, added to `bootstrap()` in `mdg-backend/src/index.ts` (next to `initRegistry()` / before `startScheduler()`), so the sweep and `kavachNotify` always have valid data.

### 2.1 Template seed — `seedKavachTemplate()`

New file `mdg-backend/src/seed/kavachTemplate.ts` (or folded into `seed.ts`). On boot, upsert `KavachTemplate` from `shared/src/data/kavachTemplate.ts`, **versioned**: if the shipped template `version` is greater than the stored max version, write a new version's worth of rows. Existing programmes keep their snapshotted item fields and are not touched (template edits are not live-bound). Idempotent: re-running boot on an unchanged version is a no-op upsert.

### 2.2 System sender user — `resolveSystemUser()` (fixes the missing-sender bug)

`MessageModel.senderId` is `required: true, ref: 'User'` (`mdg-backend/src/models/Message.ts:35`) and there is **no system user** in the codebase — the scheduler runs without a request context and therefore has no admin identity. The sweep must construct valid `Message` docs.

**Decision:** seed (upsert) a dedicated `MDG System` admin `User` once at boot:

```
resolveSystemUser():
  find-or-create UserModel { email: 'system@mdg.local', role: 'admin', name: 'MDG System', status: 'ACTIVE' }
  cache the _id in a module-level singleton (the system-sender id)
```

`kavachNotify` uses this id as `senderId` (and `senderRole: 'admin'`) for **all** Kavach system messages, mirroring the resolve handler's `messageToPublic(message, { senderName: 'MDG' })` so the dealer sees "MDG", not the email. Documented fallback if the team prefers not to add a user: reuse the seeded admin id from `seed.ts` (`admin@dealerkavach.local`) — but the dedicated `MDG System` user is preferred so audit/sender attribution is unambiguous.

---

## 3. The daily sweep — `evaluateKavachProgrammes()`

### 3.1 Where it hooks in

The existing scheduler is `mdg-backend/src/scheduler/index.ts`: `startScheduler()` registers `cron.schedule('* * * * *', tick)` (the per-minute generic `DealerService` plugin loop). Kavach is stateful and per-item — it must **NOT** go through that `nextRunAt`-claim `tick()` loop or the plugin `run(ctx)` contract.

Instead, register a **separate** IST-anchored cron task in `startScheduler()`, alongside (not through) the existing one:

```
cron.schedule('30 2 * * *', () => { evaluateKavachProgrammes(io).catch(log) }, { timezone: 'Asia/Kolkata' })
// 02:30 IST = "early morning sweep"; the digest hour itself is a per-programme config (default 08:00 IST).
```

New file `mdg-backend/src/scheduler/kavach.ts` exporting `evaluateKavachProgrammes(io)`. Because the sweep emits socket events (§5) it needs the `AppIoServer`; `app.locals.io` is wired after `startScheduler()` in `index.ts`, so either (a) pass a lazy getter `() => app.locals.io`, or (b) move the Kavach cron registration to just after `app.locals.io = io` in `bootstrap()`. The design uses **(a) a lazy io accessor** so the sweep degrades gracefully (push + chat persistence still happen even if `io` is momentarily absent — emit is best-effort, same as the resolve handler's `if (io) ...` guard).

The sweep is **day-grained** and **must be safe to run twice the same day** (§3.4). A 02:30 daily cadence is the unit; the schedule interval is irrelevant to correctness because all sends are gated on persisted item state, not on tick timing.

### 3.2 Guards (dealer + programme + settling-in)

```
evaluateKavachProgrammes(io):
  now = new Date()
  // Only ACTIVE dealers. SUSPENDED/ONBOARDING dealers get NO reminders/escalations.
  activeDealerIds = Dealer.find({ status: 'ACTIVE' }).distinct(_id)
  programmes = KavachProgramme.find({ status: 'ACTIVE', dealerId: { $in: activeDealerIds } })
  for P in programmes:
      settlingIn = P.settlingUntil && now < P.settlingUntil
      digestItems = []           // TIME items that should fire today, folded into ONE digest
      dirty = false
      for I in KavachItem.find({ programmeId: P._id, paused: false }):
          if I.trigger === 'SOS': continue                 // SOS skips decay+reminders entirely
          newStatus = computeStatus(I, now)
          if newStatus !== I.status: I.status = newStatus; dirty = true
          rollCycleIfNeeded(I, now)                         // §3.3
          if settlingIn: continue                           // NO reminders, NO escalation during settling-in
          if reminderDueToday(I, now):  digestItems.push(I) // §4 — fold weekly+ ladder rungs into the digest
          maybeEscalate(I, now, io)                         // §5 — gated by escalation.escalated == false
          persist(I) if changed
      if digestItems.length > 0:   kavachNotify.sendDailyDigest(P, digestItems, io)   // §4 — ONE push + ONE chat line
      if dirty || marked:  recomputeScores(P)               // §6 — at most once per programme per sweep
      P.lastEvaluatedAt = now; P.nextEvaluateAt = earliest(reminder.nextRemindAt | expiresAt across items)
      P.save()
```

### 3.3 `rollCycleIfNeeded(I, now)`

When an item's `expiresAt` has moved (because it was marked done and the clock reset), start a clean reminder ladder for the next due date:

```
cycleAnchor = I.expiresAt?.toISOString() ?? null
if I.reminder.cycleStartedAt-derived-anchor != cycleAnchor:   // i.e. expiresAt changed since the cycle started
    I.reminder.level = 0
    I.reminder.cycleStartedAt = now
    I.reminder.nextRemindAt = firstReminderOffset(I)          // §4.2 ; null for daily items (digest handles them)
    // escalation.escalated is reset by markDone / resolve, NOT here.
```

### 3.4 Idempotency — the dedupe contract (safe to run twice the same day)

Enforced by **state fields on `KavachItem`, never by sweep timing**:

1. **Reminder dedupe (per-item ladder, weekly+):** a rung fires only when `now >= reminder.nextRemindAt` **and** the `reminder.lastSentAt` date (IST) is not today. Sending advances `reminder.nextRemindAt` to the next ladder offset and increments `reminder.level` in the **same atomic update**. A second sweep the same day sees either `now < nextRemindAt` or `lastSentAt` already dated today, and sends nothing.
2. **Atomic claim** (mirrors the existing scheduler's `findOneAndUpdate` claim in `scheduler/index.ts:17`):
   ```
   KavachItem.findOneAndUpdate(
     { _id: I._id, 'reminder.level': I.reminder.level, 'reminder.nextRemindAt': { $lte: now } },
     { $inc: { 'reminder.level': 1 },
       $set: { 'reminder.lastSentAt': now, 'reminder.nextRemindAt': <next offset | null> } },
     { new: true })
   ```
   Only the CAS winner (matched on `reminder.level`) proceeds to enqueue this item into the digest; a concurrent sweep loses the match and does nothing.
3. **Digest dedupe (per-dealer/day):** `kavachNotify.sendDailyDigest` is itself capped to **one dealer-facing push + one chat system line per dealer per IST day** (§4.3). Even if multiple item CAS-wins happen, they fold into one digest. The digest send records `programme`-level "digest sent today" state (a `lastDigestAt` date check inside `kavachNotify`) so a re-run the same day is a no-op.
4. **Escalation dedupe:** `maybeEscalate` only acts when `escalation.escalated === false`; setting it is part of the same conditional update (`{ 'escalation.escalated': false } → { $set: { 'escalation.escalated': true, 'escalation.escalatedAt': now } }`). Idempotent across sweeps and restarts.
5. **Catch-up after downtime:** because everything is state-derived, a sweep after the server was down sees `now >= nextRemindAt` and fires the **current** rung once (CAS-guarded), then advances. It does **not** replay every missed rung — `reminder.level` only ever increments by 1 per CAS win.

---

## 4. Digest + ladder reminders — `kavachNotify`

### 4.1 The key fix — daily items are NEVER reminded per-item

A per-item daily reminder firehose (R1+R2 per daily item per day → dozens of pushes for a dealer who skips a day) was adoption-fatal. The rule:

- **TIME items with `cadenceDays <= 1` are NEVER reminded individually.** They are surfaced only through **one consolidated daily digest** per dealer.
- The sweep produces, per dealer per IST day, at most:
  - **ONE digest Expo push** ("You have N things to do today / आज आपके N काम हैं"), and
  - **ONE chat system message** (a plain text line) deep-linking to the Kavach "Today" list.
- **Weekly+ items use the per-item tier ladder** (R1/R2/R3, cadence-relative; §4.2). But when a ladder rung fires on a given day, the item is **folded into that same daily digest** — never one push per item. The ladder governs _when an item starts appearing_ in the digest, not how many pushes go out.

### 4.2 Per-item ladder offsets (weekly+ items only), relative to `expiresAt` (IST)

`reminder.maxLevel` is set from tier at item creation (recomputed if admin edits points):

| tier     | points | maxLevel (rungs) | escalates?                                         |
| -------- | ------ | ---------------- | -------------------------------------------------- |
| CRITICAL | ≥ 200  | 3                | yes, grace 0–4h                                    |
| STANDARD | 50–199 | 2                | yes, grace ~24h                                    |
| LIGHT    | < 50   | 1                | **never** (surfaces in admin "slipping" view only) |

```
firstReminderOffset(I):
  if cadenceDays <= 1:  return null                 // daily → digest only, no per-item ladder
  // weekly+ :
  R1 = warnStartAt                                  // start of warnWindow (T−warnWindowDays)
  R2 = expiresAt
  R3 = expiresAt + 1 day                            // CRITICAL only
  nextRemindAt advances R1 → R2 → R3 (capped at maxLevel) → null
```

Each rung that fires marks the item for inclusion in today's digest (§4.1). A yearly license thus first appears in the digest at T−15d, well before expiry.

### 4.3 `kavachNotify` — per-dealer cap & batching logic

New file `mdg-backend/src/services/kavach/kavachNotify.ts`. It wraps the existing comms primitives and enforces the cap.

```
kavachNotify.sendDailyDigest(programme, items, io):
  if alreadySentDigestToday(programme): return            // per-dealer/day idempotency (lastDigestAt IST date check)
  ownerUserId = resolve dealer-owner (and dealer-staff if present) for programme.dealerId
  systemSenderId = resolveSystemUser()                    // §2.2

  // 1. ensure each member's private conversation (mirrors conversations.ts /mine: ConversationModel.findOne({ userId }))
  convo = ConversationModel.findOne({ userId: ownerUserId }) ?? create({ dealerId, userId: ownerUserId, status: 'OPEN' })

  // 2. ONE plain system TEXT line (NOT a card — see §4.4)
  body = `आज आपके ${items.length} काम हैं — खोलकर देखें / You have ${items.length} things to do today`
  msg = MessageModel.create({ conversationId: convo._id, senderId: systemSenderId, senderRole: 'admin',
                              body, system: true, readBy: [systemSenderId] })
  convo.lastMessageAt = now; convo.lastMessagePreview = body.slice(0,280); convo.unreadByDealer = true; convo.save()

  // 3. realtime (best-effort) — reuse emitMessageNew exactly as conversations.ts does
  if (io) emitMessageNew(io, messageToPublic(msg, { senderName: 'MDG' }), conversationToPublic(convo, { dealerName }))

  // 4. ONE push, fire-and-forget (gated by PUSH_ENABLED inside pushToUsersAsync)
  pushToUsersAsync([String(ownerUserId)], {
    title: 'Action needed', body,
    data: { deeplink: 'kavach', itemCount: items.length },     // app routes to the Kavach "Today" tab
  })

  markDigestSentToday(programme)                          // set programme.lastDigestAt = now
```

**Hard per-dealer caps:**

- **At most 1 dealer-facing digest push + 1 chat system line per dealer per IST day** (the digest is the unit, never the item).
- **At most 1 escalation pre-warning** to the dealer per day (R3-critical copy can carry the "our team will step in" line inside the _same_ digest body when a critical item is in today's set — not a separate push).
- Escalation-to-admin events (§5) are **admin-facing**, not subject to the dealer cap; they emit to `inbox:admins`.

### 4.4 In-chat card — what is and isn't reused (fixes the broken deep-link)

The existing `card` sub-schema in `Message.ts` is a **`recordCardSubSchema`** with `kind: 'record'`; the client's `CardMessage`/`RecordCard` fetches a `DealerRecord` via `useRecord(card.recordId)` and renders **disabled** for a non-record id. Reusing it for a Kavach deep-link is broken.

**MVP decision:** the reminder is delivered as a **plain chat system text line** (no `card`) **plus** an Expo push carrying `data: { deeplink: 'kavach', itemId? }`, which the app routes to the Kavach tab / Today list. No `card` field is set on Kavach messages.

**Phase-2 / parallel client work (explicitly NEW, not "RecordCard reuse"):** a tappable in-chat Kavach card requires a new `card.kind: 'kavach'` in the `Message` card sub-schema + shared `Message` type, and a new in-app route `/kavach/items/:id`. Noted here so the engine does not assume it exists.

### 4.5 Mark-done cancels remaining (no jobs to cancel)

When the dealer taps "हो गया" or an admin resolves on behalf, `programmeService.markDone` resets the item (§3.2 transition): `reminder.level = 0`, `reminder.cycleStartedAt = now`, `reminder.nextRemindAt = R1 of next cycle`, `escalation.escalated = false`. Remaining rungs for the old cycle simply never fire because `expiresAt` (the cycle anchor) changed — there were never queued jobs, only state-derived computations.

---

## 5. Escalation → Conversation & resolution hook

### 5.1 Trigger — `maybeEscalate(I, now, io)`

```
eligible =
   I.status === 'EXPIRED'
   AND I.tier !== 'LIGHT'                              // LIGHT never auto-escalates (spec §5)
   AND I.reminder.level >= I.reminder.maxLevel         // ladder exhausted
   AND now >= I.reminder.lastSentAt + graceFor(I.tier) // CRITICAL 0–4h, STANDARD ~24h
   AND I.escalation.escalated === false                // dedupe (sticky)
```

For daily items (no per-item ladder, `maxLevel` still set from tier), escalation eligibility uses `expiresAt + graceFor(tier)` as the grace anchor instead of `reminder.lastSentAt`, since `reminder.level` stays 0 for digest-only items. (Implementation note for the engineer: treat a null `lastSentAt` as "anchor on `expiresAt`".)

### 5.2 An escalation IS a Conversation (ADR 0005, reused verbatim)

The escalation acts on the dealer member's `Conversation` exactly as the support inbox does — no new admin surface:

```
maybeEscalate body (CAS-guarded on escalation.escalated):
  convo = ConversationModel.findOne({ userId: ownerUserId }) ?? create({ dealerId, userId, status: 'OPEN' })
  systemSenderId = resolveSystemUser()

  escalationMsg = MessageModel.create({ conversationId: convo._id, senderId: systemSenderId, senderRole: 'admin',
    body: `Overdue: ${I.labelEn} — escalated for follow-up.`, system: true, readBy: [systemSenderId] })

  // make it an OPEN, unassigned, prioritised, categorised ticket:
  convo.status = 'OPEN'
  convo.assignedAdminId = null                          // any admin can Pick up (existing POST /conversations/:id/assign)
  convo.priority = priorityFromTier(I.tier, I.cadenceDays)  // §5.3
  convo.category = I.category                            // the item's own TicketCategory field (already derived from domain)
  convo.unreadByAdmin = true
  convo.lastMessageAt = now; convo.lastMessagePreview = escalationMsg.body.slice(0,280); convo.save()

  if (io) { emitMessageNew(io, messageToPublic(escalationMsg, { senderName: 'MDG' }), conversationToPublic(convo, { dealerName }))
            emitConversationUpdated(io, conversationToPublic(convo, { dealerName })) }   // surfaces live in inbox:admins

  I.escalation.escalated = true
  I.escalation.escalatedAt = now
  I.escalation.conversationId = convo._id
  writeAudit({ entity: 'Dealer', entityId: dealerId, actorId: systemSenderId, action: 'KAVACH_ESCALATE',
               after: { conversationId, templateCode: I.templateCode, priority: convo.priority } })
```

`category` is read straight off `I.category` — the contract already stores the derived `TicketCategory` on the item (and `domain` separately), so the engine does **not** re-map domain→category at escalation time.

### 5.3 Priority mapping (from tier)

| item tier                            | `priority` (a real `TicketPriority`) |
| ------------------------------------ | ------------------------------------ |
| CRITICAL, daily (`cadenceDays <= 1`) | `urgent`                             |
| CRITICAL, weekly+                    | `high`                               |
| STANDARD                             | `normal`                             |
| LIGHT                                | n/a (never escalates)                |

### 5.4 Resolution hook — fixes the 400 bug (`serviceId: 'other'`)

`kavach-programme` is deliberately NOT a registered `ServicePlugin`, so `resolveServiceName` (`mdg-backend/src/services/serviceLogService.ts:34-38`) would `registry.get('kavach-programme')` → `undefined` → throw `AppError.badRequest('Unknown serviceId')`. Therefore Kavach escalation resolution **must** be logged with:

```
serviceId:   'other'
serviceName: `Kavach Programme — ${item.labelEn}`
```

via the existing `POST /conversations/:id/resolve` flow (`mdg-backend/src/routes/v1/conversations.ts:181`), which already handles `serviceId: 'other'` + free-text `serviceName` (`serviceLogService.ts:28-32`). No change to `serviceLogService` is needed.

**The precise hook** in the `conversations.ts` resolve handler — added **after** `createServiceLog(...)` succeeds (line 202) and **after** `convo.status = 'RESOLVED'`, but it may run before or after the existing system message / push (order-independent):

```
// --- Kavach resolve hook (after the ServiceLog is created) ---
const item = await KavachItemModel.findOne({ 'escalation.conversationId': convo._id, 'escalation.escalated': true })
if (item) {
  // Idempotent: if a late dealer mark-done already reset this item, escalation.escalated is false
  // and the findOne above returns nothing → hook is a no-op. (See §7 late-completion.)
  await programmeService.markDone(item._id, {
    by: { kind: 'admin', userId: req.user.id },
    source: 'ADMIN_RESOLVE',
    note: `Resolved via conversation ${convo._id}`,
  })
  // markDone resets the clock (lastDoneAt=now, expiresAt recomputed, reminder reset, status=VALID),
  // clears escalation (escalated=false, resolvedAt=now, conversationId=null),
  // recomputes the programme score synchronously, and emits audit KAVACH_RESOLVE.
}
```

`markDone` with `source: 'ADMIN_RESOLVE'` is the single code path for both dealer "हो गया" and admin-on-behalf, so behaviour cannot drift. It is **idempotent**: gated on `escalation.escalated === true`, so if the dealer already marked the item done (clearing the flag), the hook finds nothing and does nothing. `KAVACH_RESOLVE` is emitted by `markDone` (not duplicated here), distinct from the handler's existing `CONVERSATION_RESOLVED` audit.

---

## 6. Scoring computation

### 6.1 Formula (mirrors `KavachScoreSnapshot` in the contract)

- Per item contribution: full `points` if `status ∈ {VALID, EXPIRING_SOON}` (a due-soon item is still currently compliant); `0` if `EXPIRED`.
- **SOS items are EXCLUDED from the operational denominator** — an admin-controlled availability gauge, not part of `overallPct`. `SOS_OK` is the default; `SOS_FLAGGED` = non-compliant. Their `byBucket['SOS']` reads as an availability count, not folded into `overallPct`.
- **Paused items are excluded** from numerator and denominator.

```
operationalItems = items where trigger === 'TIME' AND paused === false
validPoints = Σ points of operationalItems with status ∈ {VALID, EXPIRING_SOON}
totalPoints = Σ points of operationalItems                 // the live denominator, NEVER hardcoded
overallPct  = totalPoints > 0 ? round(100 * validPoints / totalPoints) : 100
byBucket[b] = 100 * (Σ valid points in bucket b) / (Σ points in bucket b)
```

`totalPoints` is computed live from the snapshotted item points. Expected magnitude ≈ **3740 TIME points** (full catalog ≈ 4060 including the inferred earthing-pits 45). **Never reference 3580** (a stale per-cadence footer). The single product confirmation still outstanding is the earthing-pits item points (srNo 33, inferred 45).

### 6.2 When recomputed (cached on `KavachProgramme.score`)

`recomputeScores(programme)` is a pure aggregation over the programme's `KavachItem`s (~45 docs, cheap; no incremental delta in MVP). The cached `score` makes the dealer's "Pump health" ring and the admin dashboard O(1) reads. Recompute:

- **On every sweep** where any item's status changed (`dirty`) or an item was marked/escalated — once per programme (§3.2).
- **On any mark-done** (dealer or admin-on-behalf) — synchronously inside the request so the ring jumps immediately after "हो गया".
- **On admin pause/unpause/add-custom/remove/edit-points** — denominator changes.
- **On SOS flag flip** — recompute (only affects `byBucket['SOS']`, not `overallPct`).

### 6.3 Settling-in never shows red (first-run)

During settling-in (`now < programme.settlingUntil`), un-baselined items are already `VALID` (fresh clock from initiation — see §7.4) so the score is naturally high; the sweep additionally fires no reminders/escalations. The dealer's first impression is never a failing grade.

---

## 7. Initiation, custom items & first-run settling-in

`programmeService.initiate(dealerId, input)` (new file `mdg-backend/src/services/kavach/programmeService.ts`), validated by `initiateKavachProgrammeSchema`:

1. Create the `KavachProgramme` (status `ACTIVE`, `outlet` from input, `initiatedAt = now`, `initiatedByAdminId`).
2. **`programme.settlingUntil = initiatedAt + 7 days`.**
3. Snapshot each active `KavachTemplate` row into a `KavachItem` (skip `input.excludeCodes`, which start `paused: true`):
   - If `input.baselines[code]` is present → `lastDoneAt = baselines[code]`.
   - **Else (un-baselined) → `lastDoneAt = initiatedAt` (fresh clock).** This is the key first-run rule: an un-baselined item is **VALID, never EXPIRED-on-day-one**. Push a `history` entry `source: 'INITIATION_BASELINE'`.
   - Compute `tier = tierFromPoints(points)`, `reminder.maxLevel` from tier, `warnWindowDays`, `expiresAt`, initial `status` (`VALID` for TIME, `SOS_OK` for SOS).
4. `recomputeScores(programme)` (will be high — see §6.3).
5. `writeAudit({ action: 'KAVACH_INITIATE', ... })`.

During settling-in the sweep `continue`s past the reminder/escalation phase for that programme (§3.2). **Field-agent baselines entered later only LOWER specific items after settling-in** (an explicit `lastDoneAt` in the past can move an item toward `EXPIRING_SOON`/`EXPIRED`) — never the reverse, and never during the grace week.

**Custom items** (`addCustomKavachItemInput`, `POST /dealers/:dealerId/kavach/items`): create a `KavachItem` with `custom: true, templateCode: null`, derive `tier`/`maxLevel`/`warnWindowDays`, `lastDoneAt = now` (fresh clock), recompute score. **Pause/unpause** (`setKavachItemPausedSchema`) and SOS flag (`setKavachSosComplianceSchema`) recompute score and audit (`KAVACH_ITEM_PAUSE` / `KAVACH_SOS_FLAG`). Adding a custom item audits `KAVACH_ITEM_ADD`.

---

## 8. New backend files / dirs (paths, layering)

All under `mdg-backend/`, imitating `models/` → `services/` → `routes/v1/` (+ `scheduler/`, `seed/`), registered in `routes/v1/index.ts`.

**Shared (already canonical):** `shared/src/types/kavach.ts`, `shared/src/schemas/kavach.ts`. **New shared data:** `shared/src/data/kavachTemplate.ts` (reconciled ~45-item master list, single source for seed + clients).

**Models:**

- `mdg-backend/src/models/KavachTemplate.ts`
- `mdg-backend/src/models/KavachProgramme.ts`
- `mdg-backend/src/models/KavachItem.ts`
- register exports in `mdg-backend/src/models/index.ts`

**Services (business logic, imitating `services/serviceLogService.ts`):**

- `mdg-backend/src/services/kavach/programmeService.ts` — `initiate`, `markDone(itemId, { by, source, proof?, note? })`, `addCustomItem`, `setPaused`, `removeItem`, `setSosCompliance`.
- `mdg-backend/src/services/kavach/scoring.ts` — `recomputeScores(programme)`.
- `mdg-backend/src/services/kavach/stateMachine.ts` — pure: `startOfDayIST`, `computeStatus`, `warnWindowDaysFor`, `expiresAtFor`, `tierFromPoints`, `firstReminderOffset`, `graceFor`, `priorityFromTier`. Reused by sweep + unit tests.
- `mdg-backend/src/services/kavach/kavachNotify.ts` — `sendDailyDigest`, escalation send helpers, per-dealer daily cap; `resolveSystemUser()` singleton.

**Scheduler:**

- `mdg-backend/src/scheduler/kavach.ts` — `evaluateKavachProgrammes(io)`; registered from `startScheduler()` in `mdg-backend/src/scheduler/index.ts` as a **separate** `cron.schedule('30 2 * * *', ..., { timezone: 'Asia/Kolkata' })` (alongside, not through, the per-minute plugin `tick()`).

**Seed / bootstrap:**

- `mdg-backend/src/seed/kavachTemplate.ts` — `seedKavachTemplate()` (versioned upsert) + `resolveSystemUser()`; called from `bootstrap()` in `mdg-backend/src/index.ts` next to `initRegistry()`.

**Routes** (`mdg-backend/src/routes/v1/kavach.ts`, registered in `routes/v1/index.ts`):

- `POST  /api/v1/dealers/:dealerId/kavach` — initiate programme (admin) — `initiateKavachProgrammeSchema`.
- `GET   /api/v1/dealers/:dealerId/kavach` — admin programme view (items + byBucket + overall).
- `GET   /api/v1/dealers/:dealerId/kavach/items` — `kavachItemsQuerySchema` (`dueOnly`, `bucket`, `status`).
- `GET   /api/v1/kavach/me` — dealer Kavach tab payload `{ overallPct, today: [...], whenItHappens: [...SOS] }`.
- `POST  /api/v1/kavach/items/:itemId/mark-done` — dealer/admin mark done — `markKavachItemDoneSchema`.
- `POST  /api/v1/dealers/:dealerId/kavach/items` — admin add custom — `addCustomKavachItemSchema`.
- `PATCH /api/v1/kavach/items/:itemId/paused` — `setKavachItemPausedSchema`.
- `PATCH /api/v1/kavach/items/:itemId/sos` — `setKavachSosComplianceSchema`.

**Resolve hook:** small addition in `mdg-backend/src/routes/v1/conversations.ts` resolve handler (§5.4).

**ADR:** `docs/ADR/0006-kavach-programme-stateful-assessment-subsystem.md` (uppercase `ADR/`).

---

## 9. Edge cases & failure modes

1. **Timezone (IST):** all `expiresAt` / warnWindow / digest-hour / escalation-grace math uses `Asia/Kolkata`; the sweep cron is registered with `{ timezone: 'Asia/Kolkata' }`. Store UTC `Date`s, day-align to IST midnight (`startOfDayIST`). The digest hour is a per-programme config (default 08:00 IST), deferred owner question (spec §10.2).

2. **Paused item / paused programme / suspended dealer:** `item.paused === true` → excluded from score, reminders, escalation (audit `KAVACH_ITEM_PAUSE`). The sweep iterates only `KavachProgramme.status === 'ACTIVE'` **and** `Dealer.status === 'ACTIVE'` (skips `SUSPENDED` / `ONBOARDING`, per `DEALER_STATUSES`). A suspended dealer's items keep their clocks running for accuracy but get **no** nudges/escalations; on reactivation the sweep resumes from current `expiresAt` (the dealer just sees current reality, not a backlog of stale reminders).

3. **No device token / push disabled:** `pushToUsersAsync` no-ops cleanly for missing tokens / `PUSH_ENABLED === false` (`expoPush.ts:53,64`). The **chat system message is still persisted**, so the reminder is never lost — the dealer sees it next time they open the app. Reminder state still advances (idempotency unaffected; the in-app message is the source of truth — spec §10.8 fallback).

4. **Programme initiated mid-cycle:** un-baselined items default to `lastDoneAt = initiatedAt` (VALID) plus a 7-day settling-in window with zero reminders/escalations (§7) — never a day-one wall of "Overdue" or a red ring.

5. **Clock drift / catch-up after downtime:** sends are state-derived, not job-queued; a delayed sweep fires the current rung once (CAS-guarded) and advances `reminder.level` by 1, skipping stale intermediate rungs rather than blasting them. Escalation fires once if grace already elapsed (§3.4.5).

6. **Late completion after escalation:** if the dealer marks done while `escalation.escalated === true` and the ticket is still OPEN/ASSIGNED, `markDone` resets the item (status→VALID, score restored), sets `escalation.resolvedAt = now`, clears `escalated`/`conversationId`, and posts a system note to the escalation conversation ("Dealer marked this done"). We do **not** auto-resolve the ticket — an admin must still resolve it with a ServiceLog (ADR 0005). Conversely, if the admin resolves first (§5.4), the dealer's later mark-done is a no-op on an already-VALID item. The resolve hook is idempotent because it gates on `escalation.escalated === true` (cleared by whichever path ran first).

7. **Concurrent mark-done + sweep:** the CAS on `reminder.level` / `escalation.escalated` (§3.4) plus a single-update `markDone` prevent a sweep from escalating an item the same instant the dealer completes it. Worst case the sweep's escalation CAS loses (precondition `escalation.escalated === false` already changed) — correct outcome, no double action.

8. **Template version skew:** programmes pin their snapshotted item fields; a re-seed with new items/points never mutates live programmes. A "re-assess / apply new template" admin action is Phase 2 (spec §10.7) and would diff + migrate explicitly.

9. **SOS never decays:** guarded by `if (item.trigger === 'SOS') continue` in the sweep decay/reminder/escalation phases, and excluded from the scoring denominator (§6.1) — an SOS item can never silently tank or inflate the score on a timer; only an admin flip changes it.
