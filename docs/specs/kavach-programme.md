# Feature Spec — Dealer Kavach Programme (Recurring Assessment & Compliance Tracking)

**Status:** Draft for build (PM-decisive)
**Owner:** Product
**Audience:** Architecture, scheduler/engine, client UX, admin UX
**Related:** `docs/PRD.md`, `docs/ARCHITECTURE_V2.md`, ADR 0002 (plugin contract), ADR 0003 (scheduler), ADR 0004/0005 (comms/CRM), `docs/ADOPTION_AUDIT.md`, `docs/STYLE_GUIDE_V2.md`
**Source:** "PUMP ASSESSMENT SHEET.xlsx" — _Dealer's कवच (Kavach) programme @ MDG Services_

> **Naming flag:** "Kavach" (कवच, armour/shield) is the pre-decided product brand. Be aware KAVACH is also the name of Indian Railways' national Automatic Train Protection system — a strong real-world association in this exact market. It does not block the build, but it is surfaced as a genuine branding decision for the owner in §10.9 (keep it vs a clearer name), not just a marketing footnote.

---

## 1. Summary & product thesis

The **Kavach Programme** is an always-on compliance shield for a petrol-pump dealer. After onboarding, an MDG admin **initiates the programme** for a dealer once. From then on it runs continuously: it tracks ~45 recurring compliance tasks (DSR, density book, license displays, safety kit, SDMS declarations, etc.), each with its own cadence and importance, computes a live **operational score (%)**, and — when a task is coming due or has lapsed — nudges the dealer with gentle, scaled reminders. If the dealer doesn't act, the item **escalates into the admin support pool** where any admin picks it up and resolves it like a ticket.

**Why this is fundamentally different from existing "services":** the current plugin/service model (ADR 0002) is **stateless and single-run** — a job fires, produces an artifact, and forgets. Kavach is the opposite on every axis:

|                 | Existing services              | Kavach Programme                                                                     |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| Lifecycle       | One-shot, fire-and-forget      | **Always-on**, runs for the life of the dealer relationship                          |
| State           | None (config in, artifact out) | **Stateful per item** — each task carries expiry, reminder history, escalation level |
| Input           | Admin config at attach time    | **Dealer-input-driven** — dealer confirms "done", which resets the clock             |
| Output          | An artifact (PDF, report)      | A **living score** + a stream of nudges, escalations, and resolutions                |
| Role in product | A tool you run                 | The platform's **recurring heartbeat** — the reason the dealer keeps opening the app |

This is the feature that turns MDG from "a place records show up" into "the service that keeps my pump compliant." It is the spine: scoring, reminders, escalation, and the dealer's recurring reason to engage all hang off it.

**Hard adoption constraint (applies to every decision below):** the dealer is a 55-year-old fuel-pump owner who distrusts apps. _Could they use this without help?_ If a screen, word, or step fails that test, it is wrong.

---

## 2. Personas & jobs-to-be-done

### Dealer owner (role `dealer-owner`)

- **Who:** Owns the Retail Outlet (RO). Non-technical, change-resistant, time-poor, accountable to the oil company (IOCL etc.) for compliance. Reads Hindi more comfortably than English.
- **JTBD:** _"Tell me plainly what I must do today to keep my pump safe and compliant, remind me before it's a problem, and let me prove I did it in two taps. When I can't, get a human to handle it."_
- **Cares about:** not failing a surprise inspection; one clear number that says "am I OK"; not being made to feel stupid by software.

### Dealer staff / Manager (role `dealer-staff`, title "Manager")

- **Who:** Day-to-day operator who actually performs many daily tasks (DSR, density board, cleaning, declarations). May be the real "doer" while the owner watches the score.
- **JTBD:** _"Show me my list for today, let me tick things off fast (often with a photo), and don't nag me about things that aren't mine yet."_
- **Cares about:** speed, a short daily list, not re-reading instructions.

### MDG admin / field agent (role `admin`)

- **Who:** Account manager + field agent. Initiates the programme, adds dealer-specific custom items, monitors scores across a book of dealers, and picks up escalations.
- **JTBD:** _"Set this dealer up once, then only get pulled in when something is genuinely slipping. When I'm pulled in, show me exactly what's overdue, let me grab it, fix it (often by uploading proof or doing it on the dealer's behalf), and log what I did."_
- **Cares about:** managing many dealers without drowning; defensible audit trail; knowing which dealers are at risk.

---

## 3. THE KEY UX DECISION — separate clean flow, chat as the nervous system

> **Decision: Build a dedicated, dead-simple "Kavach" surface for _seeing and acting on tasks and score_. Deliver every _reminder, escalation, and resolution_ through chat + push. Chat is never where the dealer manages a checklist; chat is where MDG reaches out and where the human conversation lives.**

The owner leans toward a separate clean flow. **I agree, and I'm making it the decision** — but the important part is defining the seam precisely, because a half-baked split is worse than either pure option.

### Why not "all inside chat"

A 45-item recurring checklist living inside the chat thread would destroy the one surface we cannot afford to break. Chat's whole value for a resistant dealer is that it looks and feels like WhatsApp: a calm, linear conversation with a human. If we inject dozens of recurring task cards, daily reminders, and tick-boxes into that stream, we get:

- **Scroll hell:** today's actual human message is buried under 12 system cards.
- **Anxiety, not calm:** the thread becomes a nagging to-do list, the exact "form to complete" framing the Adoption Audit forbids.
- **No structure:** chat is linear and ephemeral; a checklist needs grouping (Daily/Monthly/Yearly), status, and a persistent score. Chat can't hold that legibly.

### Why not "a complex standalone compliance module" either

A dense tabbed dashboard with percentages, point weights, and validity tables is equally fatal — that's the "intimidating CRM" we're escaping. The separate flow must be **WhatsApp-simple**, not a spreadsheet.

### The hybrid, defined precisely

There are two distinct verbs, and they go to two different places:

**A. SEE & ACT → the new "Kavach" tab (separate clean flow, dealer surface)**

- A dedicated bottom-tab on `mdg-client` (suggest `ShieldCheck` icon, label **"Kavach" / "कवच"**). It is the dealer's calm home for compliance. **To respect the Adoption Audit's 4-tab ceiling, Services is demoted into Profile when Kavach ships** — we add a calm, high-value tab, not a 5th one. The tab opens on the Today list, never a dashboard.
- **Default view = "Today" / "आज":** only the small set of items that need attention _now_ (due/expiring/expired), newest-risk first. Not all 45. A 55-year-old should see "3 things to do today," not a 45-row table.
- Each item is a **task card** (reuse `RecordCard` anatomy): icon tile, plain bilingual title, a status pill (Ready / Due soon / Overdue — never "VALID/EXPIRED"), and a single big primary action: **"Mark done" / "हो गया"** — optionally attach a photo as proof.
- One headline at top: a friendly **"Pump health"** ring/number (the operational score), green when high. One number, not three sub-scores, for the dealer (sub-scores are admin-side, §4).
- An always-present escape hatch: **"Need help? Message us / मदद चाहिए? हमें लिखें"** that drops them into chat. The dealer is never stuck.

**B. REACH OUT & RESOLVE → chat + push (existing comms spine)**

- **One daily digest, not per-item nagging.** Daily tasks are _not_ reminded one-by-one — that would be a notification firehose (≈17 daily items). Instead the dealer gets **one consolidated daily nudge**: a single chat system message (`Message.system = true`) + **one Expo push** ("You have 3 things to do today / आज आपके 3 काम हैं — खोलकर देखें"), deep-linking to the Today list. Hard cap: **≤1 dealer-facing push per day** (+ at most one escalation pre-warning). Weekly-and-longer items fold into the same daily digest when they come due.
- The nudge is **short, warm, and human**, and reads like a helpful person texting, not a system alert.
- **Deep-link, not a record card.** The push carries `data: { deeplink: 'kavach', itemId }` and the app routes to the Kavach tab. The in-chat message is plain system text — it does **not** reuse the `RecordCard` (that fetches a `DealerRecord` and would render disabled for a Kavach id). A tappable in-chat Kavach card (`card.kind: 'kavach'`) is explicit new client work, deferred to Phase 2.
- **Escalations land in the admin 3-pane inbox** as `Conversation` updates (the conversation _is_ the ticket — ADR 0005). The dealer's chat may also get one honest line ("We've asked our team to help with this").
- **Resolution** happens through the existing ticket lifecycle and is **logged as a `ServiceLog`** (§6), keeping the per-dealer "what we did" history intact.

### The seam in one sentence

**The dealer _does the work_ in the Kavach tab; MDG _talks to the dealer_ and _talks to itself_ in chat.** Tasks never clutter chat; conversations never live in the Kavach tab. Tapping any reminder anywhere routes to the same task card in the Kavach tab, so there is exactly one place to act.

This keeps chat pristine (protecting adoption), gives compliance the structure it genuinely needs, and still uses chat/push as the proven channel that reaches a dealer who won't open a dashboard on their own.

---

## 4. Scoring model

### Item fields (per task, per dealer)

Each tracked item carries: `code` (stable id), `titleEn`/`titleHi` (raw source, admin-only), `labelEn`/`labelHi` (clean dealer-facing copy), `points` (importance weight), `cadenceDays` (validity in days; `null` for SOS), `cadenceBucket` (DAILY/WEEKLY/FORTNIGHTLY/MONTHLY/QUARTERLY/HALF_YEARLY/YEARLY/BIENNIAL/SOS), `domain` (operational grouping), `category` (derived `TicketCategory` for escalation), `lastDoneAt`, `expiresAt` (= `lastDoneAt` + `cadenceDays`), and a derived `status`. Contracts: `shared/src/types/kavach.ts`.

### Status (internal) → what each persona sees

Internally an item is one of three states, derived from `expiresAt` vs now:

| Internal status | Rule                           | Dealer sees (bilingual, friendly)   | Admin sees    |
| --------------- | ------------------------------ | ----------------------------------- | ------------- |
| `VALID`         | now < expiresAt − warnWindow   | **Ready** / तैयार (green)           | VALID         |
| `EXPIRING_SOON` | within warnWindow of expiresAt | **Due soon** / जल्द करना है (amber) | EXPIRING SOON |
| `EXPIRED`       | now ≥ expiresAt                | **Overdue** / बाकी है (red)         | EXPIRED       |

`warnWindow` is cadence-relative (see §5). We never show the words VALID/EXPIRED or raw dates-as-jargon to the dealer; we show plain status pills and relative time ("due tomorrow", "कल तक").

### Score math

- **Item contribution** = its `points` if status is `VALID` **or** `EXPIRING_SOON` (a due-soon item is still currently compliant); **0** if `EXPIRED`.
  - Rationale: the sheet defines "operational" as currently-VALID. Expiring-soon means _still valid right now_ — penalising it would punish dealers for the future. Reminders (§5) handle the "act before it lapses" job; the score handles "are you compliant right now."
- **Bucket score** = `sum(points of non-expired items in bucket) / sum(points of all items in bucket)`, computed per cadence bucket.
- **Overall operational %** = `sum(points of all non-expired items) / sum(all points)`.
- **"100% operational"** = every item non-expired, matching the sheet's intent.

### Dealer vs admin view of score

- **Dealer:** sees **one** number — overall **Pump health %** — as a friendly ring, plus the short Today list. No point weights, no per-bucket breakdown, no "4060". Keep it to one legible signal.
- **Admin:** sees overall % **and** the per-bucket sub-scores (Daily / Monthly / Yearly etc.), point weights, item-level history, and the trend across the 2-monthly review cycle.

### SOS (event-driven) items — how they count

SOS items (tanker decantation, work permit, subsidy & claim, product sampling, complaint registration) are **done when an event happens, not on a fixed clock**. A daily countdown on them is meaningless and would constantly, unfairly tank the score.

**Decision:** SOS items are **availability flags, not part of the operational %.** Concretely:

- They are **excluded from the auto-decay score loop** (`cadenceDays = null`, bucket `SOS`). They do **not** flip to EXPIRED on a daily timer.
- They are **excluded from the operational-% denominator entirely** in MVP. Status is `SOS_OK` by default; only an **admin/field agent can mark an SOS item `SOS_FLAGGED`** (non-compliant, e.g. a tanker was decanted without proper documentation observed during a visit). This avoids SOS items silently inflating the score (a dealer who never touches them would otherwise read as "compliant" on them forever).
- SOS items generate **no automated dealer reminder** in MVP (event hooks are Phase 2). For the dealer they appear — if at all — as a single muted **"When it happens" / "जब ज़रूरत हो"** explainer row, not as actionable daily chores. Admins see and control them per-item.

> This cleanly resolves the SOS ambiguity: clock-based TIME items decay and drive the live operational %; SOS items are a separate admin-controlled availability gauge.

### Source-data reconciliation (MAIN sheet wins, with named overrides)

The MAIN sheet and the per-cadence sheets disagree. **We adopt the MAIN sheet as canonical for validity and points**, with these explicit, reviewed exceptions resolved here so the engine has one truth:

| Item                        | Conflict                               | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solar-panel cleaning        | MAIN 15d vs WEEKLY 7d                  | **15 days** (MAIN). Field-realistic; weekly is too aggressive.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Crocodile-clip wires (both) | MAIN 1d vs YEARLY 365d                 | **365 days** (YEARLY). These are _availability_ checks, not daily chores; 1-day was a sheet artifact.                                                                                                                                                                                                                                                                                                                                                                                                    |
| Safety-signage display      | MAIN 1d vs MONTHLY 90d                 | **90 days** (MONTHLY). A displayed poster is not a daily task.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Servo island display points | 15 (image) vs 10 (DAILY)               | **10 points** (DAILY sheet) — lower-stakes cosmetic display.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| CAs-with-ID                 | MAIN 180d vs MONTHLY 90d               | **90 days** (MONTHLY). Tighter cadence for an ID-availability check is safer.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Total points                | MAIN 4060 vs sheets' stale 3580 footer | The **total is computed live from the reconciled per-item points**, never hardcoded and never 3580 (that footer is a stale copy-paste). The full catalog reconciles to **≈4060** (4015 explicit per-cadence points + an **inferred 45 pts for earthing-pits**, srNo 33 — the one item missing from every per-cadence tab; _flag for owner confirmation_). The dealer's **operational %** denominator excludes the five SOS items (≈320 pts) and any paused items, so it runs over **≈3740** TIME points. |

A seed file (`shared` data + a backend seed) ships the reconciled master list of ~45 items as the **programme template**. Each dealer's programme is instantiated from this template at initiation (§7), so future template edits don't silently rewrite live dealer state.

---

## 5. Reminder ladder policy

Reminders are **scaled by importance (points)** and timed **relative to each item's own cadence/expiry**, not on a global clock — but they are **delivered to the dealer batched into one daily digest**, never one push per item. The ladder below governs _when an item wants attention and when it escalates_; the dealer-facing delivery of all due items on a given day is a **single chat system message + single push** (deep-linking to the Today list), capped at **one dealer-facing push/day**.

### Importance tiers (by points)

| Tier         | Points | Examples                                                    | Reminders before escalation                         |
| ------------ | ------ | ----------------------------------------------------------- | --------------------------------------------------- |
| **Critical** | ≥ 200  | TDS upload (260), DTO/W&M license validity (260), DAR (460) | **3 reminders**, tighter spacing, faster escalation |
| **Standard** | 50–199 | DSR (75), density (75), most monthly tasks (80)             | **2 reminders**                                     |
| **Light**    | < 50   | Servo display (10), CA pics (10), stock variation (40)      | **1 reminder**, slow/no escalation                  |

### Timing (cadence-relative)

`warnWindow` and reminder offsets scale with `cadenceDays`:

- **Daily items (1d):** rolled into the **morning daily digest** (one nudge listing all of today's tasks), never per-item pushes. No per-item "Reminder 2 after deadline" push — the next morning's digest re-lists anything still not done. Escalation for Critical/Standard daily items only after the day fully lapses (and a daily item that lapses repeatedly is what surfaces it to admins).
- **Weekly/fortnightly (7–15d):** warnWindow ~2 days. R1 at T−2d, R2 at expiry, R3 (critical only) at T+1d.
- **Monthly+ (30/90/180/365/730d):** warnWindow scales (e.g., ~15d for yearly licenses, ~7d for monthly). R1 at start of warnWindow, R2 mid-window, R3 (critical) at/just-after expiry. Long-lead license items deliberately remind **well before** expiry — a yearly license at T−15d, not T−1d.

### Channel per reminder

- All dealer-facing reminders (R1/R2/R3 across all due items) are **consolidated into the single daily digest** — chat system message + one push, deep-linking to the Today list. The digest tone firms up if items have lingered, and for **Critical** items it **pre-warns** that MDG's team will step in if not handled.
- A dealer **marking an item done** at any point cancels its remaining reminders for that cycle and resets the clock (`lastDoneAt = now`).
- During the programme's **settling-in window** (first 7 days after initiation, §8), no reminders fire at all.

### SOS reminder timing

SOS items are **not** put on this clock. They remind **on event/visit context only** (e.g., when a tanker delivery is logged, or as a field-agent checklist during a visit). MVP: SOS items simply appear in the "When it happens" group with no automated nudge; Phase 2 adds event hooks.

### Exact escalation trigger

An item escalates into the admin pool when **all of its scheduled reminders for the current cycle have been sent AND the item is still `EXPIRED` (not marked done) at the point after the final reminder's grace period**, where grace scales by tier:

- Critical: grace = 0–4h after final reminder.
- Standard: grace = ~24h after final reminder.
- Light: **does not auto-escalate** (it surfaces in the admin dashboard's "slipping" view but creates no ticket); avoids drowning admins in 10-point cosmetic items.

Escalation is **per item**, dedup'd: an already-escalated item does not re-escalate until resolved or until the dealer marks it done and it lapses again in a future cycle.

---

## 6. Escalation policy

### What an escalation looks like to admins

An escalation **surfaces in the existing 3-pane admin inbox** by acting on the dealer member's `Conversation` (the conversation is the ticket — ADR 0005). On escalation, the engine:

1. Ensures the member's `Conversation` exists.
2. Posts a **system message** describing the lapsed item ("Overdue: Daily DSR not updated — escalated for follow-up"), optionally with a `card` pointing to the Kavach item.
3. Sets the conversation to **`OPEN`, `assignedAdminId = null`** (claimable by any admin), and sets triage fields:
   - **`category`** mapped from the item's compliance domain (default `compliance`; license/safety items → `compliance`, billing/TDS → `billing`, automation/equipment → `technical`).
   - **`priority`** mapped from the item's tier: Critical → `high` or `urgent`, Standard → `normal`, (Light does not escalate).
4. Sets `unreadByAdmin = true` and emits `conversation:updated` to `inbox:admins` so it appears live.

So an escalation is just an **OPEN, unassigned, prioritised, categorised conversation** — admins already know how to read and work these. No new admin surface is required for MVP; the conversation preview names the lapsed item.

### "Any admin assigns to self"

Unchanged from the existing support-inbox model: an admin clicks **Pick up** → `POST /conversations/:id/assign` (defaults to self) → status `ASSIGNED`, `assignedAdminId = me`. This is the existing mechanic; Kavach reuses it verbatim.

### Resolution — yes, requires a ServiceLog (consistent with all tickets)

Resolving a Kavach escalation uses the **same `POST /conversations/:id/resolve` flow** and **requires a `ServiceLog`** (ADR 0005 mandate). The resolve action additionally:

- Marks the underlying Kavach item as **done on the dealer's behalf** (`lastDoneAt = now`), resetting its clock and restoring its score contribution — often the admin uploads proof (e.g., the corrected DSR) as the `ServiceLog` attachment.
- `serviceId` for these logs is the Kavach programme service id (with item code in `notes`), so the dealer's "services provided" history reads cleanly: _"Helped update Daily DSR — done on your behalf."_
- Fires the existing "request resolved" push to the dealer.

This keeps Kavach fully inside the audited ticket lifecycle — no parallel resolution path, no accountability gap.

---

## 7. Custom items (admin-added, per dealer)

Admins can add a **dealer-specific custom item** that behaves like any other tracked item.

- **Where:** in `mdg-admin`, on the dealer's Kavach programme view (under dealer detail), an **"Add custom task"** action.
- **Fields (kept minimal):**
  - `titleEn` (required), `titleHi` (required — bilingual is non-negotiable for dealer-facing copy),
  - `points` (1–500; required) → auto-derives the importance tier,
  - `cadenceDays` (or pick a bucket; SOS allowed) → derives bucket + reminder schedule,
  - optional `notes`/instructions for the dealer,
  - optional `requiresProof` (boolean) → forces a photo attachment on "Mark done".
- **Behaviour:** instantly joins the dealer's programme — counts toward score, follows the reminder ladder by its tier, escalates per §5/§6.
- **Scope:** custom items are **per dealer**, stored on that dealer's programme instance, never on the shared template. An admin can also **pause** or **remove** any item (template or custom) for a dealer (e.g., item not applicable to this RO) — paused items are excluded from score and reminders, with an audit entry.

---

## 8. Scope — MVP vs Phase 2 (ruthless)

### MVP (must-have to ship the heartbeat)

1. **Programme template** — reconciled master list of ~45 items (§4) seeded; bilingual titles.
2. **Initiate programme** — admin attaches Kavach to a dealer once; instantiates per-dealer item state. **Un-baselined items get a fresh clock (`lastDoneAt = initiatedAt`, status VALID) — never EXPIRED on day one.** A **7-day settling-in window** (`settlingUntil`) suppresses all reminders/escalations and any red score, so the dealer's first open is never a failing grade. Field-agent baselines captured during the first visit only lower specific items after settling-in.
3. **Per-item stateful tracking** — new tracker model holding `lastDoneAt`, `expiresAt`, `status`, `reminderLevel`, `escalatedAt` (this is the documented break from the stateless plugin contract — needs an ADR).
4. **Live score** — overall % (dealer) + per-bucket sub-scores (admin), recomputed on the scheduler tick and on any "mark done".
5. **Kavach dealer tab** — Today list + Pump-health ring + "Mark done" (with optional photo) + "Message us" escape hatch. Bilingual, WhatsApp-simple.
6. **Reminder ladder + daily digest** — tiered, cadence-relative reminders, but delivered as **one consolidated daily digest per dealer** (≤1 push/day), with "mark done cancels remaining."
   - **Demote Services into Profile** so the dealer bottom-bar stays at 4 tabs when Kavach is added.
   - **Score is self-reported trust in MVP** (frictionless "Mark done", no mandatory proof on most items); implausible self-report patterns are surfaced to admins for a gentle field-agent check, never a dealer-facing accusation. Do not treat the MVP score as audited compliance.
7. **Escalation into admin inbox** — OPEN/unassigned conversation with mapped priority/category; reuse Pick up → Assign → Resolve(+ServiceLog); resolution resets the item.
8. **Admin programme view** — per-dealer item list with statuses, sub-scores, pause/remove, **add custom item**.
9. **Audit trail** — initiate, mark-done, escalate, resolve, pause/remove all audited.

### Phase 2 (later — explicitly out of MVP)

- **SOS event hooks** — auto-trigger SOS reminders from real events (tanker delivery logged, etc.). MVP just lists SOS items as "when it happens."
- **Cross-dealer compliance dashboard** in admin (the "at-risk dealers" queue as its own nav item) — MVP relies on the inbox + per-dealer view.
- **Manager-vs-owner task assignment** — splitting which member owns which item. MVP nudges the owner (and manager if present) without per-item ownership.
- **Trend/analytics** — score-over-time charts, 2-monthly review report generation as an artifact.
- **Proof verification workflow** — admin approving/rejecting dealer-submitted photos. MVP trusts "mark done."
- **Auto-pull from external portals** (SDMS/IOCL) to auto-mark items done. Far future; everything is dealer/admin-confirmed for now.
- **Smart cadence learning / snooze**.

---

## 9. Success metrics

- **Adoption:** % of active dealers with Kavach initiated; **% opening the Kavach tab weekly** (the recurring heartbeat working).
- **Score improvement:** median overall operational % across dealers, and **% of dealers improving** their score over a 2-monthly review cycle (the programme's core promise).
- **Reminder → action conversion:** % of reminders that result in the dealer marking the item done **before escalation** (target: rises over time; this is the "did the nudge work" metric). Track by tier.
- **Escalation rate:** escalations per dealer per month (we want this to _fall_ as dealers self-serve), and **% of items resolved by dealer vs. by admin on their behalf**.
- **Time-to-resolve escalations:** median time from escalation (OPEN) to RESOLVED — reuses existing ticket timing.
- **Anti-intimidation health:** Kavach-tab task-card tap-through rate and "Mark done" completion rate (a low completion rate signals the surface is confusing — the 55-year-old test failing).
- **Leading risk indicator:** count of dealers below an operational-% threshold (e.g., <80%) — the book-of-business health an admin watches.

---

## 10. Open questions / decisions needed from the owner

1. **Initial assessment data entry:** _(Resolved for first-impression safety — see §8: un-baselined items get a fresh clock + a 7-day settling-in window, so the dealer never opens to red.)_ Remaining open: does the field agent still capture real baseline dates during the first visit (more accurate, data-entry burden), or do we rely on the fresh-clock default and let the first cycle establish reality? _(PM lean: capture baselines opportunistically; fresh-clock is the safe default either way.)_
2. **Daily-item reminder hours:** _(Resolved & implemented.)_ The digest hour is now **configurable per dealer** and **admin-editable** from the dealer's Kavach panel (`reminderHour`, 0–23 IST). It falls back to a global env default `KAVACH_DEFAULT_REMINDER_HOUR` (8 AM IST); timezone is `KAVACH_TZ` (default `Asia/Kolkata`). The sweep runs hourly (`KAVACH_SWEEP_CRON`, default `0 * * * *`) and delivers each dealer's single daily digest at their chosen hour (escalation is evaluated every hour, idempotently). Remaining owner input: confirm the global default hour for new dealers.
3. **Score visibility to the oil company:** is the operational % ever shared upward (IOCL etc.) or strictly internal between dealer and MDG? **This must be answered before launch** because it changes the dealer-facing presentation: if the number is ever externally visible, the dealer should **not** see that same raw red percentage cast as casual "Pump health" — show forward action-language and a coarse band (Good / A few things to do / Let's catch up), never a precise red "fail" number. Either way, lead with the action count ("2 things to do today"), not the percentage. _(Reinforces the §8 "score = self-reported trust" framing.)_
4. **SOS marking authority:** confirm SOS items are admin/field-agent-controlled only (PM recommendation in §4), or whether dealers should also self-report SOS events in MVP.
5. **Light-tier escalation:** confirm 10–40 point cosmetic items should **never** auto-escalate (PM recommendation), to protect admin bandwidth.
6. **Per-bucket vs single dealer score:** confirm dealers see only the single overall "Pump health" number (PM recommendation), not Daily/Monthly/Yearly sub-scores.
7. **2-monthly review:** is the "reviewed every 2 months" cadence a _manual field-agent re-assessment_ (re-baselining items) or just a reporting checkpoint? Affects whether we build a "re-assess" action in MVP.
8. **Push dependency:** Kavach reminders lean on Expo push (`PUSH_ENABLED`). Confirm push is on in production; if not, the chat system message (daily digest) is the only channel and dealers must open the app to see nudges.
9. **Brand name — a real decision, not just a footnote:** "Kavach" (कवच) is the pre-decided brand, but **KAVACH is also Indian Railways' national Automatic Train Protection system** — a well-known, government-backed name in this exact market. A Hindi-first dealer googling "Kavach" finds train signalling, which can muddy the recognition this app depends on. Decide whether to keep it (and accept the association) or use a clearer descriptive name (e.g. "MDG Sahyog / सहयोग", "Pump Suraksha Programme"). Separately, reconcile the in-app name mismatch the Adoption Audit already flags (header "Dealer Kavach" vs logo "MDG" vs login "MDG team") — pick one surface-wide name regardless.
