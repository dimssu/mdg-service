# UAT — Ticket lifecycle & reply SLA

**Status:** v1 · **Owner:** UAT · **Last updated:** 2026-07-06
**Scope:** The chat-as-ticket lifecycle and reply-SLA behaviour newly shipped to
the MDG admin portal + backend. Four capabilities:

1. **Admin↔admin message display** — on the admin side, every admin message
   (yours **and** a teammate's) renders on the **right**; the client's messages
   stay on the **left**. Your own bubble is solid blue with read ticks; a
   teammate's is soft-blue with their name above it. Resolve notices are centered
   system chips; shared reports are summary cards. **The client app is unchanged**
   — there, all support is one left-side voice.
2. **Ticket lifecycle loop** — a client message opens an **UNASSIGNED (OPEN)**
   ticket → any admin **Pick up** (**ASSIGNED**) → **Resolve** (**RESOLVED**) →
   the next client message reopens it as a **fresh UNASSIGNED** ticket (not back
   to the previous admin). One unified thread per member; shared admin inbox.
3. **Reply-SLA** — the clock is time since the client's oldest **unanswered**
   message, and only runs while the last message is the client's. 20 min
   assigned-but-no-reply auto-unassigns the ticket back to the pool and flags it;
   ≥90 min turns the flag **amber**; ≥180 min turns it **red**.
4. **Inbox tabs + counts** — **Unassigned** (OPEN only), **Mine** (assigned to
   me), **All open** (OPEN ∪ ASSIGNED), **Resolved**; badge counts from a single
   counts endpoint; flag colours appear inside the tabs.

This plan mirrors `docs/UAT_PLAN.md` and
`docs/specs/UAT_message-first-and-admin-management.md`: each scenario names the
**persona**, **preconditions**, **numbered steps**, the **expected result**, and
a **pass/fail box** to tick during a session. Product code is not modified by this
document — it is a runbook. Behaviour verified against
`docs/specs/ticket-lifecycle-and-reply-sla.md`.

Related surfaces (for testers who want to read along):
`mdg-admin/src/pages/InboxPage.tsx`,
`mdg-admin/src/features/chat/MessageBubble.tsx`,
`mdg-backend/src/routes/v1/conversations.ts`,
`mdg-backend/src/routes/v1/messages.ts`,
`mdg-backend/src/scheduler/ticketSweep.ts`,
`shared/src/types/conversation.ts`,
`mdg-backend/src/config/env.ts`.

---

## How to run locally (preamble)

From the repo README (`README.md` → "Quick start"). You need the meta repo plus
the service repos cloned side by side.

```bash
# From the mdg-service workspace root:
nvm use                      # Node 20 (.nvmrc)
npm install                  # npm workspaces resolves @dk/shared

# Backend env (MongoDB URI, JWT secret, S3, CORS). Mongo 7+ must be reachable.
cp mdg-backend/.env.example mdg-backend/.env
#   edit mdg-backend/.env       (see the SLA test-config box below)

# Seed the admin + sample dealers/members (idempotent; --reset wipes first):
npm run seed --workspace mdg-backend
#   or a clean slate:  npm run seed --workspace mdg-backend -- --reset

# Run everything: backend :4000, admin :5173, client :5174
npm run dev
```

Then open:

- **Admin portal:** http://localhost:5173 — `admin@dealerkavach.local` / `Admin@12345`
- **Dealer client:** http://localhost:5174 — `owner@<code>.test` / `password123`

Before starting, gate on the backend smoke check:
`bash mdg-backend/scripts/smoke.sh http://localhost:4000`.

> **Two browsers, one session.** Almost every scenario needs the **admin portal
> and the dealer client open side by side** (two windows, or one normal + one
> incognito). Realtime is the whole point — keep both visible so you can watch a
> message land, a ticket flip state, and a flag appear without refreshing.

---

## Personas under test

| Persona | Role                                       | Identity used in steps                                      | Where they work |
| ------- | ------------------------------------------ | ----------------------------------------------------------- | --------------- |
| Arjun   | `admin` (seeded)                           | `admin@dealerkavach.local` / `Admin@12345`                  | mdg-admin (web) |
| Priya   | `admin` (second admin, created during UAT) | `priya@mdg.test` / generated on the Team page               | mdg-admin (web) |
| Ramesh  | `dealer-owner` (non-technical, receiving)  | `owner@e02.test` / `password123` (Northern Lights Petrol)   | mdg-client      |
| Sunita  | `dealer-staff` "Manager"                   | `manager@e02.test` / `password123` (Northern Lights Petrol) | mdg-client      |

Ramesh (owner) and Sunita (manager) belong to the **same** dealer organisation
and each has their **own private thread**. Two admins (Arjun + Priya) are required
for the admin↔admin display and shared-ownership scenarios.

### Creating the fixtures you need (one-time, per session)

- **A dealer + members** — the seeder already creates **Northern Lights Petrol
  (E02)** with `owner@e02.test` and `manager@e02.test`. To make your own: admin
  portal → **Dealers → New dealer**, then open it → **Members → Add member**
  (pick a role, generate + copy the password). New members get an app login
  immediately.
- **The first admin (Arjun)** — seeded; log in at http://localhost:5173.
- **A second admin (Priya)** — admin portal → **Team** (`/settings/team`) → **Add
  admin** → Name "Priya", email `priya@mdg.test`, **Generate** + **Copy** the
  password, submit. Log her in from a second browser / incognito window.
- **Log in on client vs admin** — the **admin** portal (:5173) takes an admin
  email; the **dealer client** (:5174) takes a member email (`owner@e02.test` /
  `password123`). They are different apps on different ports — keep one in each
  window.

---

## Seeded fixtures (from `mdg-backend/src/seed.ts`)

| Dealer                 | Code | Status     | Members with app logins                                                              |
| ---------------------- | ---- | ---------- | ------------------------------------------------------------------------------------ |
| Northern Lights Petrol | E02  | ACTIVE     | `owner@e02.test` (Dealer Owner · Owner), `manager@e02.test` (Pump Manager · Manager) |
| Riverside Refuel       | E03  | ACTIVE     | `owner@e03.test` (Dealer Owner · Owner)                                              |
| Coastal Energy         | E01  | ONBOARDING | none — code assigned but no app login issued yet                                     |

- All seeded member passwords: `password123`.
- Seeded members already have a thread + one opening client message, so they
  appear in the inbox **Unassigned** list from the start. For a clean "first
  message opens a ticket" test (B1) either **Resolve** the seeded thread first and
  send a fresh message, or add a brand-new member and message from them.

---

## Acceptance notes — invariants (confirm during the run)

Tick these once; they are the "why" behind the lifecycle.

- **One thread per member.** `Conversation.userId` is unique — there is never a
  second ticket for the same member. Reopen re-uses the same thread. ☐ confirmed
- **Shared, not owned.** "Pick up" / "Assign" is **soft ownership** only. It sets
  `assignedAdminId` + status `ASSIGNED` for triage; it does **not** lock other
  admins out — any admin can still open and reply. ☐ confirmed
- **Reopen abandons continuity by design.** Resolve clears the owner, so the next
  client message reopens as a **fresh UNASSIGNED** ticket (fair distribution, not
  "same admin forever"). ☐ confirmed
- **The clock is the client's oldest unanswered message.** Persisted as
  `awaitingSince` (exposed as `awaitingReplySince`); set when a client message
  arrives and the team wasn't already behind; **cleared** when an admin replies or
  resolves. It only escalates while the **last message is the client's**. ☐ confirmed
- **Flag colour is derived, not stored.** Amber/red is computed live from
  `awaitingReplySince` and re-rendered on a **60-second tick** in the browser — no
  server round-trip. Only the auto-return `flagged` boolean is persisted. ☐ confirmed

---

<a id="sla-shortcuts"></a>

## Exercising the TIME-BASED SLA without waiting hours

The three SLA thresholds are **20 min** (auto-unassign), **90 min** (amber) and
**180 min** (red). You do **not** need to wait that long. Use one of the two
approaches below. (Both are safe, reversible, and touch only test data.)

### Approach 1 — shrink the clock in a test env (best for the 20-min auto-unassign)

Only the **auto-unassign window** and the **sweep frequency** are env-configurable.
Edit `mdg-backend/.env` and restart the backend (`npm run dev` or
`npm run dev --workspace mdg-backend`):

```dotenv
# mdg-backend/.env — TEST ONLY, revert before release testing
TICKET_AUTO_UNASSIGN_MINUTES=1      # default 20; 1 = auto-unassign after ~1 min
TICKET_SWEEP_CRON=* * * * *         # default is already every minute; keep it
```

Now: client sends a message → an admin clicks **Pick up** → **do not reply** →
within ~2 minutes the sweep returns the ticket to **Unassigned** and it shows a
flag. (The sweep needs **both** the client wait **and** the pickup to be older
than the window, so allow a little over a minute after pickup — see C2.)

> The **90 / 180-minute flag colours are compile-time constants**
> (`TICKET_FLAG_WARN_MINUTES` / `TICKET_FLAG_URGENT_MINUTES` in
> `shared/src/types/conversation.ts`), **not** env vars. You cannot shrink them in
> `.env`. To see amber/red quickly, use Approach 2 (back-date the clock).

### Approach 2 — back-date the clock in Mongo (best for amber 90m / red 180m, and zero-wait auto-unassign)

Connect to Mongo (the ticket lives in the `conversations` collection, DB
`dealer_kavach`):

```bash
# If you run Mongo via docker-compose (container dk-mongo):
docker exec -it dk-mongo mongosh dealer_kavach
# Or point mongosh at your URI directly:
mongosh "mongodb://localhost:27017/dealer_kavach"
```

Find the ticket you want to age (grab its `_id` from the admin URL bar — the
`?c=<id>` deep-link — or list recent ones):

```javascript
db.conversations
  .find({}, { status: 1, awaitingSince: 1, assignedAt: 1, flagged: 1 })
  .sort({ updatedAt: -1 })
  .limit(5);
```

The two fields that drive the SLA:

| Field           | Meaning                                                             |
| --------------- | ------------------------------------------------------------------- |
| `awaitingSince` | ISO time of the client's oldest unanswered message (the SLA clock). |
| `assignedAt`    | When the current assignee picked the ticket up (grace window).      |

**Amber (≥90 min waiting)** — set the clock ~95 minutes ago, then reload the
inbox list so the admin re-fetches `awaitingReplySince`:

```javascript
db.conversations.updateOne(
  { _id: ObjectId('<conversationId>') },
  { $set: { awaitingSince: new Date(Date.now() - 95 * 60 * 1000) } },
);
```

**Red (≥180 min waiting)** — use 185 minutes:

```javascript
db.conversations.updateOne(
  { _id: ObjectId('<conversationId>') },
  { $set: { awaitingSince: new Date(Date.now() - 185 * 60 * 1000) } },
);
```

**Auto-unassign with no waiting** — back-date **both** fields on an `ASSIGNED`
ticket past the 20-min window; the next sweep tick (≤60 s) returns it to the pool:

```javascript
db.conversations.updateOne(
  { _id: ObjectId('<conversationId>'), status: 'ASSIGNED' },
  {
    $set: {
      awaitingSince: new Date(Date.now() - 25 * 60 * 1000),
      assignedAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  },
);
```

After a back-date, the admin browser picks up the new colour on its own **60-second
tick**, or immediately if you refresh / switch tabs (which re-fetches
`awaitingReplySince`). To reset a ticket to "not waiting":
`db.conversations.updateOne({_id: ObjectId("<id>")}, {$set: {awaitingSince: null, flagged: false}})`.

---

## Scenario index

| #   | Group | Scenario                                                             | Persona            |
| --- | ----- | -------------------------------------------------------------------- | ------------------ |
| A1  | A     | Your own admin message → right, solid blue, read ticks               | Arjun              |
| A2  | A     | A teammate's admin message → right, soft-blue, name above            | Arjun + Priya      |
| A3  | A     | Client left; resolve chip centered; shared report as card            | Arjun + Ramesh     |
| B1  | B     | Client's first message opens an UNASSIGNED (OPEN) ticket             | Ramesh → Arjun     |
| B2  | B     | Any admin "Pick up" → ASSIGNED (owner = that admin)                  | Arjun              |
| B3  | B     | "Resolve" → RESOLVED, owner cleared, service logged                  | Arjun              |
| B4  | B     | Next client message reopens as a FRESH UNASSIGNED ticket             | Ramesh → Priya     |
| B5  | B     | Manual "Reopen" also returns the thread to the pool                  | Arjun              |
| B6  | B     | One thread per member; soft ownership (second admin can reply)       | Arjun + Priya      |
| C1  | C     | 20-min assigned-but-no-reply → auto-unassign + flag                  | Arjun              |
| C2  | C     | Grace window — a just-picked-up stale ticket isn't yanked instantly  | Arjun              |
| C3  | C     | ≥90 min waiting → amber flag in "All open"                           | Arjun              |
| C4  | C     | ≥180 min waiting → red flag                                          | Arjun              |
| C5  | C     | Flag clears on pickup / reply / resolve; wait clock persists in pool | Arjun              |
| C6  | C     | Clock only runs while the last message is the client's               | Arjun + Ramesh     |
| D1  | D     | Tab semantics (Unassigned / Mine / All open / Resolved)              | Arjun + Priya      |
| D2  | D     | Badge counts come from the counts endpoint and update live           | Arjun              |
| D3  | D     | Flag colours appear inside the tab lists                             | Arjun              |
| E1  | E     | Regression — client app chat unchanged (one left-side voice)         | Ramesh + 2 admins  |
| E2  | E     | Regression — message-first still works                               | Arjun → new member |
| E3  | E     | Regression — no duplicate message, no duplicate thread               | Arjun + Ramesh     |

---

# Group A — Admin↔admin message display

## A1 — Your own admin message renders right, solid blue, with read ticks — `admin` (Arjun)

Maps to `MessageBubble.tsx` (`own = senderId === currentUserId` → `bg-brand`, ticks).

**Preconditions**

- Arjun logged into mdg-admin. A client thread with at least one client message
  exists (any seeded member's thread). Ramesh (or Sunita) available on the client
  to confirm the read tick.

**Steps**

1. Open the member's thread in the Inbox. Type a reply and send.
2. Confirm **your** message sits on the **right**, in a **solid blue** bubble with
   white text, and shows a **single/double grey tick** (sent → delivered).
3. On the client (Ramesh), open the chat so the message is read. Back on Arjun's
   screen, confirm the tick turns **blue (✓✓ "Read")** — this happens live or on
   the next read event, no manual refresh.

**Expected result**

An admin's own message is right-aligned, solid blue, and carries WhatsApp-style
delivery/read ticks that go blue when the client reads it.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## A2 — A teammate's admin message renders right, soft-blue, name above — `admin` (Arjun + Priya)

Maps to `MessageBubble.tsx`: a teammate's admin message is `adminSide` but not
`own` → right side, `bg-brand-soft`, `senderName` shown above, **no** ticks.

**Preconditions**

- Two admins logged in: Arjun (browser A), Priya (browser B). Both viewing the
  **same** member's thread.

**Steps**

1. As **Priya**, send a reply in the shared thread.
2. On **Arjun's** screen, confirm Priya's message is on the **right** (not the
   left) — the whole support team reads as "us", not "them".
3. Confirm the bubble is a **soft/pale blue** (distinct from Arjun's own solid
   blue) and that **Priya's name** is shown as a small label **above** her bubble.
4. Confirm the teammate's bubble shows **no read ticks** (ticks are only on your
   own messages).
5. Reverse it: Arjun sends; on Priya's screen his message is right, soft-blue,
   labelled "Arjun".

**Expected result**

Every admin message is on the right. Your own is solid blue with ticks; a
teammate's is soft-blue with their name above and no ticks — so you can always
tell which admin replied.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## A3 — Client left; resolve notice centered chip; shared report as card — `admin` (Arjun + Ramesh)

Maps to `MessageBubble.tsx` `SystemMessage` (centered chip) and `CardMessage`
(summary card), plus the client-left rendering (`adminSide === false`).

**Preconditions**

- Arjun in mdg-admin; Ramesh on the client. A thread with client + admin messages.

**Steps**

1. Have Ramesh send a message. On Arjun's screen, confirm the **client's** message
   is on the **left** in a plain/grey bubble.
2. As Arjun, **Resolve** the ticket (Resolve dialog → pick a service → confirm).
   Confirm the resolution notice ("Resolved — <service>") renders as a **centered
   grey chip**, not a left/right bubble.
3. (If the Reports/records upload is available) Share a DSR/report into the thread.
   Confirm it renders as a **centered summary card** (title + period/type), not a
   chat bubble.

**Expected result**

The client's voice stays on the left; automated resolve notices are centered
chips; shared reports are centered summary cards.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

# Group B — Ticket lifecycle loop (open → assign → resolve → reopen-unassigned)

## B1 — A client message opens an UNASSIGNED (OPEN) ticket — `dealer-owner` (Ramesh) → `admin` (Arjun)

Maps to `messages.ts` (client message sets `awaitingSince`, status stays OPEN) and
the Inbox **Unassigned** tab.

**Preconditions**

- Ramesh on the client with a thread that is **not** currently open/waiting (if his
  seeded thread already shows in Unassigned, Resolve it first so this is a clean
  "new request"). Arjun watching the Inbox on **Unassigned**.

**Steps**

1. As **Ramesh**, send a message (e.g. "My monthly DSR looks wrong.").
2. On **Arjun's** Inbox, confirm the thread appears (or moves to the top of) the
   **Unassigned** tab, with status badge **Open** and **no assignee**.
3. Confirm there is **no "Assigned to …"** line in the chat header — it is in the
   shared pool for anyone to pick up.

**Expected result**

A client message with no active ticket opens a fresh **OPEN / unassigned** ticket
visible to every admin in the Unassigned tab.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## B2 — Any admin "Pick up" → ASSIGNED (owner = that admin) — `admin` (Arjun)

Maps to `POST /conversations/:id/assign` (status ASSIGNED, `assignedAt` set,
`flagged` cleared) and the Inbox **Pick up** button.

**Preconditions**

- The OPEN ticket from B1 exists. Arjun on that thread.

**Steps**

1. In the chat header, click **Pick up**.
2. Confirm the status badge flips to **Assigned** and the header shows **"Assigned
   to Arjun"**.
3. Confirm the ticket now appears under **Mine** (and still under **All open**),
   and has left the **Unassigned** tab.

**Expected result**

Any admin can take an OPEN ticket; it becomes **ASSIGNED** to them and moves out of
the pickup queue into their **Mine** tab.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## B3 — "Resolve" → RESOLVED, owner cleared, service logged — `admin` (Arjun)

Maps to `POST /conversations/:id/resolve` (status RESOLVED, `assignedAdminId` &
`assignedAt` cleared, `awaitingSince` nulled, `flagged` cleared, system chip +
service log).

**Preconditions**

- The ASSIGNED ticket from B2. Arjun on that thread.

**Steps**

1. Reply once so the client isn't left waiting, then click **Resolve**.
2. In the Resolve dialog, pick the service provided and confirm.
3. Confirm the status flips to **Resolved**, a **centered "Resolved — <service>"
   chip** appears in the thread, and the header no longer shows an assignee.
4. Confirm the ticket now appears under the **Resolved** tab and has left **Mine**
   and **All open**.
5. On the client (Ramesh), confirm he sees the resolution notice (and, if a device
   is registered, a "Request resolved" push).

**Expected result**

Resolve closes the ticket, clears the owner and the reply clock, posts a resolution
chip + a service-history entry, and moves it to Resolved.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## B4 — Next client message reopens as a FRESH UNASSIGNED ticket — `dealer-owner` (Ramesh) → `admin` (Priya)

Maps to `messages.ts` client-message-on-RESOLVED branch: `status → OPEN`,
`assignedAdminId → null`, `assignedAt → null`, `awaitingSince → now`. **Not** back
to the previous admin.

**Preconditions**

- The thread is **RESOLVED** from B3 (it was assigned to Arjun before resolve).

**Steps**

1. As **Ramesh**, send a new message on the resolved thread (e.g. "Actually one
   more question.").
2. On the admin side, confirm the thread reappears in **Unassigned** with status
   **Open** and **no assignee** — crucially it is **not** auto-assigned back to
   Arjun.
3. Confirm any admin (e.g. **Priya**) can now **Pick up** this fresh ticket.

**Expected result**

A message on a resolved thread reopens it as a brand-new **UNASSIGNED** ticket for
fair redistribution — not glued to whoever handled it last.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## B5 — Manual "Reopen" also returns the thread to the pool — `admin` (Arjun)

Maps to `POST /conversations/:id/reopen` (status OPEN, owner + `assignedAt`
cleared, `flagged` cleared; `awaitingSince` stays idle since no new client message).

**Preconditions**

- A **RESOLVED** thread. Arjun on it.

**Steps**

1. Click **Reopen** in the header.
2. Confirm the status returns to **Open / unassigned** (no assignee) and the thread
   is back in **Unassigned**.
3. Confirm **no** reply-SLA flag appears yet — reopening without a new client
   message does **not** start the wait clock.

**Expected result**

The manual Reopen button behaves like a client-message reopen: back to the
unassigned pool for anyone to pick up, with the wait clock idle until the client
writes again.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## B6 — One thread per member; soft ownership (second admin can reply) — `admin` (Arjun + Priya)

Maps to the unique index on `Conversation.userId` and soft-ownership (assign does
not lock others out).

**Preconditions**

- Two admins logged in. A member thread that Arjun has **picked up** (ASSIGNED to
  Arjun).

**Steps**

1. As **Priya**, open the **same** thread from the Inbox. Confirm she can read the
   full history and the composer is **enabled** (she is not locked out by Arjun's
   ownership).
2. As Priya, send a reply. Confirm it appears **once** on both admins' screens and
   on the client — and (per A2) it is right-aligned soft-blue labelled "Priya".
3. Confirm there is still exactly **one** thread for that member (no second row
   appeared for Priya's reply).

**Expected result**

Ownership is advisory. Any admin can open and reply in the single shared thread
per member; picking up does not fence teammates out.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

# Group C — Reply SLA (auto-unassign + escalating flag)

> Read the [SLA shortcuts box](#sla-shortcuts) first. C1–C2 use the shrunk env
> (`TICKET_AUTO_UNASSIGN_MINUTES=1`) **or** back-dating; C3–C5 use back-dating.

## C1 — 20-min assigned-but-no-reply → auto-unassign + flag — `admin` (Arjun)

Maps to `scheduler/ticketSweep.ts`: an ASSIGNED ticket whose client has waited
past `TICKET_AUTO_UNASSIGN_MINUTES` is atomically returned to OPEN with
`flagged = true`; `awaitingSince` is **kept**.

**Preconditions**

- Either (a) `.env` set to `TICKET_AUTO_UNASSIGN_MINUTES=1` and backend restarted,
  or (b) you will back-date `awaitingSince` + `assignedAt` per Approach 2.
- A client message + an admin **Pick up**, with **no admin reply** after it.

**Steps**

1. Have Ramesh send a message; as Arjun, **Pick up** (status **Assigned to
   Arjun**). Do **not** reply.
2. **(env path)** Wait just over a minute for the sweep. **(Mongo path)** Back-date
   both `awaitingSince` and `assignedAt` to 25 min ago; wait ≤60 s for the next
   sweep tick.
3. Confirm the ticket **auto-returns to Unassigned** (status **Open**, no
   assignee) without anyone clicking anything.
4. Confirm a **flag badge** now shows on the thread (a ⚑ marker; label
   "Returned" while under 90 min, or "Waiting …" once past 90 min).

**Expected result**

An assigned ticket left unanswered past the window is automatically dropped back to
the shared pool and flagged so another admin picks it up.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## C2 — Grace window: a just-picked-up stale ticket isn't yanked instantly — `admin` (Arjun)

Maps to the sweep's dual condition: it only unassigns when **both** `awaitingSince`
**and** `assignedAt` are older than the window.

**Preconditions**

- `TICKET_AUTO_UNASSIGN_MINUTES=1` (env path) or back-dating (Mongo path).
- A ticket whose client message is already **old** (e.g. `awaitingSince` 25 min
  ago) but which is **freshly picked up** now.

**Steps**

1. Back-date only `awaitingSince` to 25 min ago (leave `assignedAt` = now), or in
   the env path pick up a ticket whose client message is already stale.
2. As Arjun, **Pick up** the ticket **now** (this sets `assignedAt` to the current
   time and clears any prior flag).
3. Wait through the next sweep tick. Confirm the ticket **stays Assigned to Arjun**
   — it is **not** yanked back immediately, because his own grace window
   (`assignedAt`) hasn't elapsed yet.
4. (Optional) Now back-date `assignedAt` past the window too; the next sweep then
   returns it to the pool — confirming the grace window was the only thing holding
   it.

**Expected result**

Picking up an already-stale ticket gives the new assignee a full grace window; the
sweep won't snatch it back on the very next tick.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## C3 — ≥90 min waiting → amber flag in "All open" — `admin` (Arjun)

Maps to `ticketFlagLevel` → `warn` at `TICKET_FLAG_WARN_MINUTES` (90); amber Badge
in `InboxPage.tsx`.

**Preconditions**

- A ticket with a client waiting. Back-date `awaitingSince` to **95 min** ago
  (Approach 2, amber snippet).

**Steps**

1. Back-date `awaitingSince` to 95 min ago. Reload the Inbox list (or wait for the
   60-second tick) so the admin re-fetches `awaitingReplySince`.
2. Open the **All open** tab. Confirm the ticket shows an **amber/yellow** flag
   badge with a ⚑ and a "Waiting ~1 h" style label.
3. Confirm the same amber flag is visible both in the **list row** and in the
   **chat header** for that thread.

**Expected result**

A client waiting ≥90 minutes turns the ticket's flag amber across the list and
header so the team notices the slip.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## C4 — ≥180 min waiting → red flag — `admin` (Arjun)

Maps to `ticketFlagLevel` → `urgent` at `TICKET_FLAG_URGENT_MINUTES` (180); red
Badge (`intent: danger`).

**Preconditions**

- A ticket with a client waiting. Back-date `awaitingSince` to **185 min** ago.

**Steps**

1. Back-date `awaitingSince` to 185 min ago; reload the Inbox (or wait for the
   60-second tick).
2. Confirm the flag badge is now **red** (urgent), not amber.
3. (Optional, no back-date) Leave a ticket ageing and confirm the colour advances
   **amber → red on its own** at the next 60-second tick, with **no** page refresh
   or server change — the colour is computed live in the browser.

**Expected result**

A client waiting ≥180 minutes turns the flag red so the whole team sees an urgent
slip; the colour advances client-side on the 60-second tick.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## C5 — Flag clears on pickup / reply / resolve; wait clock persists in pool — `admin` (Arjun)

Maps to: `flagged` cleared on assign (`:id/assign`), on admin reply
(`messages.ts` `isAdmin` branch), and on resolve; `awaitingSince` **kept** after
auto-unassign so the colour keeps escalating in the pool.

**Preconditions**

- A **flagged** ticket (e.g. the auto-returned one from C1, or an amber/red one
  from C3/C4).

**Steps**

1. **Reply clears it:** as Arjun, send a reply. Confirm the **flag disappears** and
   the wait clock stops (`awaitingReplySince` → none).
2. **Pickup clears the returned flag:** produce another auto-returned ⚑ ticket
   (C1), then **Pick up**. Confirm the ⚑ "Returned" marker clears on pickup.
3. **Resolve clears it:** on a waiting/flagged ticket, **Resolve**. Confirm the
   flag and the wait clock both clear.
4. **Persistence in the pool:** produce an auto-unassigned ticket whose client is
   still waiting (C1), and back-date its `awaitingSince` past 90/180. Confirm the
   flag **colour still escalates amber→red while the ticket sits in Unassigned** —
   returning it to the pool does not reset the clock.

**Expected result**

Any real support action (pickup, reply, resolve) clears the flag; but a still-
waiting ticket that was auto-returned keeps its clock, so its colour keeps rising
in the pool until someone acts.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## C6 — Clock only runs while the last message is the client's — `admin` (Arjun) + `dealer-owner` (Ramesh)

Maps to `messages.ts`: an admin message nulls `awaitingSince`; a client message
sets it **only if not already set** (repeats don't reset — see edge-cases).

**Preconditions**

- A live thread. Arjun and Ramesh both available.

**Steps**

1. Ramesh sends a message → confirm a wait clock starts (a flag will eventually
   appear; check `awaitingReplySince` is set, or back-date to see amber quickly).
2. Arjun replies → confirm the clock **stops** immediately (no flag; the last
   message is now support's).
3. Ramesh replies again → confirm a **new** clock starts from this message.
4. Confirm that while the **last message is the admin's**, no flag can appear no
   matter how long you wait.

**Expected result**

The SLA clock runs only when the client is the one waiting; an admin reply always
stops it, and a fresh client message restarts it.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

# Group D — Inbox tabs + counts

## D1 — Tab semantics (Unassigned / Mine / All open / Resolved) — `admin` (Arjun + Priya)

Maps to the `GET /conversations?status=…` filters: `open` = OPEN only, `mine` =
ASSIGNED to me, `all` = OPEN ∪ ASSIGNED, `resolved` = RESOLVED.

**Preconditions**

- Two admins. Set up a mix: one OPEN ticket, one ASSIGNED to Arjun, one ASSIGNED to
  Priya, one RESOLVED.

**Steps**

1. **Unassigned** — confirm it lists **only OPEN** (unassigned) tickets, and **not**
   anything ASSIGNED.
2. **Mine** (as Arjun) — confirm it lists **only tickets ASSIGNED to Arjun** — the
   one assigned to Priya does **not** appear here.
3. **All open** — confirm it lists **every active** ticket: the OPEN one **plus**
   both ASSIGNED ones (Arjun's and Priya's), across the whole team.
4. **Resolved** — confirm it lists only RESOLVED threads and none of the active
   ones.

**Expected result**

Each tab filters exactly as specified; "All open" is the union of unassigned and
assigned across the team, while "Mine" is scoped to the current admin.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## D2 — Badge counts come from the counts endpoint and update live — `admin` (Arjun)

Maps to `GET /conversations/counts` returning `{ open, mine, all, resolved,
flagged }` (one round-trip, not four list fetches).

**Preconditions**

- Arjun on the Inbox with a few tickets in mixed states.

**Steps**

1. Note the numeric badges next to **Unassigned**, **Mine**, **All open**,
   **Resolved**. Confirm they match the number of rows you see when opening each
   tab.
2. Trigger a state change: have Ramesh send a new message (Unassigned +1), or
   **Pick up** a ticket (Unassigned −1, Mine +1, All open unchanged), or **Resolve**
   one (Mine/All open −1, Resolved +1).
3. Confirm the badges update to reflect the new state (on the next refetch / socket
   update), staying consistent with the actual list contents.

**Expected result**

Tab badges are driven by the counts endpoint and stay in sync with real ticket
counts as tickets move between states.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## D3 — Flag colours appear inside the tab lists — `admin` (Arjun)

Maps to `TicketFlagBadge` rendered per row in `InboxPage.tsx`.

**Preconditions**

- At least one amber and one red ticket (back-date `awaitingSince` to 95 and 185
  min on two threads).

**Steps**

1. Open **All open**. Confirm the aged tickets show their **amber** and **red**
   flag badges **in the list rows themselves**, not only when the thread is opened.
2. Confirm an auto-returned ticket (C1) shows a ⚑ marker in **Unassigned** too.

**Expected result**

Flag colours surface directly inside the tab lists, so a slipping ticket is visible
at a glance without opening each thread.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

# Group E — Regression checks

## E1 — Client app chat is unchanged (one left-side voice) — `dealer-owner` (Ramesh) + two admins

Maps to `mdg-client/src/features/chat/MessageBubble.tsx` (`mine = senderId ===
currentUserId`): every admin message has `mine = false` → **left**.

**Preconditions**

- Ramesh on the client. Both Arjun and Priya reply in his thread.

**Steps**

1. Have **both** Arjun and Priya send replies in Ramesh's thread.
2. On **Ramesh's client**, confirm **both** admins' messages render on the **left**
   as a **single support voice** — there is **no** "Arjun" vs "Priya" name label
   and **no** right/soft-blue distinction on the client side.
3. Confirm **Ramesh's own** messages stay on the **right** with his ticks, exactly
   as before this release.

**Expected result**

The admin-side right/soft-blue/name changes did **not** leak into the client app;
dealers still see all support as one calm left-side voice.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## E2 — Message-first still works — `admin` (Arjun) → new member

Maps to `POST /conversations` find-or-create (message-first, covered in
`UAT_message-first-and-admin-management.md`) — confirm the lifecycle changes didn't
regress it.

**Preconditions**

- Arjun in mdg-admin. Add a brand-new member (e.g. under Riverside Refuel) who has
  never written in.

**Steps**

1. From the member's row (or Inbox **New** composer), open a chat and send the
   first message.
2. Confirm a thread is **created** (first open) and appears in **Unassigned** once
   the first message is sent, with the admin's message rendered right (A1).
3. Log in as that member on the client and confirm they see the admin's message
   with no action on their part.

**Expected result**

An admin can still start a thread with a member who never wrote in; the ticket
lifecycle changes didn't break message-first.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## E3 — No duplicate message, no duplicate thread — `admin` (Arjun) + `dealer-owner` (Ramesh)

Maps to the single `emitMessageNew` broadcast + unique `userId` index (no
double-render, no second thread).

**Preconditions**

- Arjun and Ramesh both on the same thread, both windows visible.

**Steps**

1. Send several messages rapidly in both directions (admin↔client) and via
   pickup/resolve/reopen actions.
2. Confirm **each message appears exactly once** on every screen — no duplicated
   bubbles, no ghost re-renders when a socket event and an HTTP refetch overlap.
3. Confirm there is still exactly **one** thread row per member throughout (reopen
   re-uses the same thread; it never spawns a second).

**Expected result**

Realtime delivery is idempotent: one message = one bubble everywhere, and one
member = one thread across the whole open→resolve→reopen loop.

**PASS ☐ FAIL ☐** Notes: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

---

## Edge-case checklist

Tick each after confirming. These are the corners most likely to bite.

- ☐ **Repeated client messages don't reset the wait clock.** With a client already
  waiting, send a 2nd and 3rd client message. Confirm `awaitingSince` /
  `awaitingReplySince` **does not jump forward** — the flag's "waiting" time keeps
  counting from the **oldest** unanswered message, not the newest. (Server:
  `awaitingSince` is set only `if (!convo.awaitingSince)`.)
- ☐ **"ok, thanks" reopens a resolved ticket — known open question.** A trivial
  acknowledgement on a resolved thread reopens a **full fresh UNASSIGNED ticket**
  (any client message does). This is current, intended behaviour but a flagged
  product gap (see `LIMITATIONS.md` → "Any dealer message reopens a resolved thread
  — even 'ok, thanks'"). A grace/auto-close window or "no reply needed" close is
  the eventual fix; **not yet built**. Note it, don't fail it.
- ☐ **Suspended member with an open thread.** Suspend a member who has an active
  thread. Confirm: the member **can't log in** (403), so they won't see new
  replies; the admin can still **view** the existing thread; but starting a **new**
  chat with them via the composer is **blocked** (400 "Member is suspended —
  reactivate them to start a chat"). Reactivating restores normal behaviour.
- ☐ **Two admins picking up at once = soft ownership, last-write-wins.** Have Arjun
  and Priya both click **Pick up** on the same OPEN ticket at nearly the same time.
  Confirm the ticket ends up **ASSIGNED to whoever wrote last** (`assignedAdminId`
  is a plain overwrite), and — critically — the "loser" is **not** locked out: they
  can still open and reply (soft ownership). No error, no duplicate ticket.
- ☐ **Auto-unassign is safe on multiple replicas.** (Info) The sweep claims each
  ticket with an atomic `findOneAndUpdate`, so running >1 backend won't
  double-process or double-audit a ticket. No tester action beyond noting it if a
  clustered env is under test.

---

## Results table template

Copy this table per session; fill Actual + Pass/Fail + Notes for every scenario.

| Scenario | Expected                                                    | Actual | Pass/Fail | Notes |
| -------- | ----------------------------------------------------------- | ------ | --------- | ----- |
| A1       | Own admin msg → right, solid blue, ticks go blue on read    |        |           |       |
| A2       | Teammate admin msg → right, soft-blue, name above, no ticks |        |           |       |
| A3       | Client left; resolve = centered chip; report = card         |        |           |       |
| B1       | Client message opens OPEN/unassigned ticket                 |        |           |       |
| B2       | Pick up → ASSIGNED to me; moves to Mine                     |        |           |       |
| B3       | Resolve → RESOLVED, owner cleared, service logged           |        |           |       |
| B4       | Next client msg → fresh UNASSIGNED (not prior admin)        |        |           |       |
| B5       | Manual Reopen → back to unassigned pool, clock idle         |        |           |       |
| B6       | One thread/member; second admin can still reply             |        |           |       |
| C1       | 20-min no-reply → auto-unassign + flag                      |        |           |       |
| C2       | Fresh pickup of stale ticket isn't yanked instantly         |        |           |       |
| C3       | ≥90 min waiting → amber flag in All open                    |        |           |       |
| C4       | ≥180 min waiting → red flag; advances on 60s tick           |        |           |       |
| C5       | Flag clears on pickup/reply/resolve; clock persists in pool |        |           |       |
| C6       | Clock runs only while last message is the client's          |        |           |       |
| D1       | Tab filters: Unassigned/Mine/All open/Resolved              |        |           |       |
| D2       | Counts endpoint drives badges; update live                  |        |           |       |
| D3       | Flag colours show inside tab lists                          |        |           |       |
| E1       | Client app unchanged — one left-side support voice          |        |           |       |
| E2       | Message-first still works                                   |        |           |       |
| E3       | No duplicate message, no duplicate thread                   |        |           |       |

---

## Read-only smoke checks performed (2026-07-06)

Verified statically against the committed code (no servers started, no product
code modified):

- **Admin chat rendering** — `mdg-admin/src/features/chat/MessageBubble.tsx:102-104`
  `adminSide = senderRole === 'admin'` (right for all admins), `own = senderId ===
currentUserId` (drives colour + ticks), `showName = senderName && !own`
  (teammate name above). System lines render as a centered chip; `card` as a
  centered summary card. PASS.
- **Client chat unchanged** — `mdg-client/src/features/chat/MessageList.tsx:100`
  `mine = m.senderId === currentUserId` → every admin message is left; no
  admin-name / soft-blue path. PASS.
- **Lifecycle loop** — `conversations.ts` `:id/assign` (ASSIGNED, `assignedAt`
  set, `flagged=false`), `:id/resolve` (RESOLVED, `assignedAdminId`+`assignedAt`
  cleared, `awaitingSince=null`, `flagged=false`, system chip + service log),
  `:id/reopen` (OPEN, owner cleared). `messages.ts:154-162` reopens a RESOLVED
  thread on a client message as OPEN/unassigned with `awaitingSince=now`. PASS.
- **Reply-SLA sweep** — `scheduler/ticketSweep.ts` claims `status:'ASSIGNED',
awaitingSince ≤ cutoff, assignedAt ≤ cutoff` via atomic `findOneAndUpdate`,
  sets `status:'OPEN', assignedAdminId:null, assignedAt:null, flagged:true`, keeps
  `awaitingSince`, writes `CONVERSATION_AUTO_UNASSIGNED`, emits
  `conversation:updated`. PASS.
- **Flag thresholds** — `shared/src/types/conversation.ts` `ticketFlagLevel`:
  `warn` ≥90, `urgent` ≥180 min, derived from `awaitingReplySince` +
  `Date.now()`. Re-rendered on a 60s tick in `InboxPage.tsx:215`
  (`setInterval(() => setNow(Date.now()), 60_000)`). PASS.
- **Repeated-message clock** — `messages.ts:160` sets `awaitingSince` only
  `if (!convo.awaitingSince)`, so later client messages don't reset the clock.
  PASS.
- **Config** — `mdg-backend/src/config/env.ts:60-61`
  `TICKET_AUTO_UNASSIGN_MINUTES` default 20, `TICKET_SWEEP_CRON` default
  `* * * * *`. PASS.
- **Tabs + counts** — `conversations.ts` `GET /` filters `open|mine|all|resolved`
  and `GET /counts` returns `{open, mine, all, resolved, flagged}`. PASS.

> Not run: live `smoke.sh`, real login, socket/push delivery, and the actual
> timed sweep — those require a running backend + Mongo and are covered by the
> numbered scenarios above.

---

## Sign-off

| Group | Scenarios | Result | Tester | Date |
| ----- | --------- | ------ | ------ | ---- |
| A     | A1–A3     |        |        |      |
| B     | B1–B6     |        |        |      |
| C     | C1–C6     |        |        |      |
| D     | D1–D3     |        |        |      |
| E     | E1–E3     |        |        |      |

**Release recommendation:** ☐ Go ☐ Go with caveats ☐ No-go
Caveats / blockers: \***\*\*\*\*\***\_\_\***\*\*\*\*\***
