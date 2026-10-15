# Ticket lifecycle & reply SLA

How a support conversation behaves as a ticket, and how the reply SLA (auto-unassign
plus an escalating flag) works.

The `Conversation` document carries the hand-worked flow below: Open → Assigned →
Resolved. Separately, since 12 Oct 2026, when the AI first line hands a question to a
person it raises a `Ticket` record (ADR 0017). That record has two states, OPEN and
RESOLVED, one open ticket per thread, and only an admin's written resolve note closes
it — no reply, pickup or chat resolve does. It shows as a strip inside the thread and on
the admin's Tickets page. This doc covers the conversation flow; ADR 0017 covers tickets.
In this doc, "ticket" means the conversation's status unless it says `Ticket` record.

Each dealer owner has their own support thread. The manager has a group thread that every
owner also joins, so an owner sees two threads. The admin inbox is one shared surface every
admin can act on.

## State machine

```
                 client sends first message
   (no thread) ─────────────────────────────▶ OPEN (unassigned)
                                                 │
                        admin "Pick up" ─────────┤
                                                 ▼
                                              ASSIGNED (owner = that admin)
                                                 │
                        admin "Resolve" ─────────┤
                                                 ▼
                                              RESOLVED (no owner)
                                                 │
                 client messages again ──────────┘  ⟶ back to OPEN (unassigned)
```

- **OPEN** — unassigned; any admin can pick it up.
- **ASSIGNED** — one admin owns it (soft ownership; other admins can still read/reply/reassign).
- **RESOLVED** — closed; `assignedAdminId` is cleared, so a later client message reopens
  it as a fresh **UNASSIGNED** ticket (fair distribution, not "same admin forever").

Reopen (both a client message on a RESOLVED thread and the manual **Reopen** button)
always returns the thread to the unassigned pool.

## Reply SLA

The clock is **time since the client's oldest unanswered message** — persisted as
`awaitingSince` (exposed as `awaitingReplySince`). It is set when a client message
arrives and the team wasn't already behind, and cleared to `null` when an admin replies
(or on resolve). A ticket only escalates while the **last message is the client's**.

| Elapsed (client waiting)                            | Effect                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TICKET_AUTO_UNASSIGN_MINUTES` (default **20 min**) | ASSIGNED ticket is **auto-returned to the pool** (`status→OPEN`, owner cleared) and `flagged=true`. Requires the assignee's own grace window too: `assignedAt` must also be older than the window, so a just-picked-up stale ticket isn't yanked instantly. |
| `TICKET_FLAG_WARN_MINUTES` (**90 min**)             | List/header flag turns **amber** (`ticketFlagLevel → 'warn'`).                                                                                                                                                                                              |
| `TICKET_FLAG_URGENT_MINUTES` (**180 min**)          | Flag turns **red** (`'urgent'`) so the whole team notices.                                                                                                                                                                                                  |

- **Auto-unassign** runs on `TICKET_SWEEP_CRON` (default every minute) via
  `scheduler/ticketSweep.ts`. The claim is an atomic `findOneAndUpdate`, so it is safe on
  multiple replicas. It writes a `CONVERSATION_AUTO_UNASSIGNED` audit and broadcasts
  `conversation:updated`. `awaitingSince` is **kept** so the flag colour keeps escalating
  after the ticket returns to the pool.
- **Flag colour** is _derived_, not stored: `ticketFlagLevel(awaitingReplySince, Date.now())`
  (`shared/src/types/conversation.ts`) is evaluated client-side and re-rendered on a 60s
  tick, so amber→red advances with no server round-trip. Only the auto-return `flagged`
  boolean is persisted; it clears on the next pickup, admin reply, or resolve.

## Inbox tabs

Eight tabs. **Mine** is the default (a deep link to one thread opens **All open**).

| Tab         | Filter     | Meaning                                                                                                                                 |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Unassigned  | `open`     | `OPEN` only — the pickup queue.                                                                                                         |
| Mine        | `mine`     | `ASSIGNED` to the current admin.                                                                                                        |
| All open    | `all`      | `OPEN` **∪** `ASSIGNED` — every active conversation across the team.                                                                    |
| Resolved    | `resolved` | `RESOLVED` — no active request.                                                                                                         |
| Dropped     | `flagged`  | Active threads the 20-minute sweep took back from an admin who did not reply.                                                           |
| Tickets     | `tickets`  | Threads with an open `Ticket` record. A lens, not a pile: a thread stays listed however its status moves, until the ticket is resolved. |
| ⚡ AI       | `ai`       | A lens over Unassigned: threads the AI first line has answered or handed off.                                                           |
| 🛡 AI guard | `ai-guard` | Threads where someone tried to plant a figure or read the AI's instructions back. Cleared only by a super-admin.                        |

Badge counts come from `GET /conversations/counts` in one round-trip. It returns `open`,
`mine`, `all`, `resolved`, `flagged`, `ai`, `aiGuard` and `tickets`.

## Admin chat rendering

The admin inbox is a shared surface, so **every** admin message (mine or a teammate's)
renders on the **right**; `own` (`senderId === currentUserId`) only drives bubble colour
and read ticks. A teammate's message is a soft-blue bubble with their name above; the
client's messages stay on the left. Resolve notices render as centered system chips. For
the dealer's side of the chat, see ADR 0018.

## Config

| Env / constant                 | Default     | Where                              |
| ------------------------------ | ----------- | ---------------------------------- |
| `TICKET_AUTO_UNASSIGN_MINUTES` | 20          | `mdg-backend/src/config/env.ts`    |
| `TICKET_SWEEP_CRON`            | `* * * * *` | `mdg-backend/src/config/env.ts`    |
| `TICKET_FLAG_WARN_MINUTES`     | 90          | `shared/src/types/conversation.ts` |
| `TICKET_FLAG_URGENT_MINUTES`   | 180         | `shared/src/types/conversation.ts` |

## Testing the time limits without waiting

Two ways, both on test data only.

**Shrink the auto-unassign window.** In a test `mdg-backend/.env`, set
`TICKET_AUTO_UNASSIGN_MINUTES=1` and restart the backend. The sweep already runs every
minute (`TICKET_SWEEP_CRON`). Send a dealer message, pick it up, do not reply: within about
two minutes it is back in Unassigned and flagged. The sweep needs both the wait and the
pickup to be older than the window, so allow a little over a minute after pickup.

**Back-date the clock in Mongo.** The 90 and 180 minutes are constants in code, not env
vars, so amber and red can only be tested this way. Connect with
`docker exec -it dk-mongo mongosh dealer_kavach` (or `mongosh` at your URI); the thread's
`_id` is the `?c=<id>` in the admin URL.

```javascript
// Amber (≥90 min waiting)
db.conversations.updateOne(
  { _id: ObjectId('<conversationId>') },
  { $set: { awaitingSince: new Date(Date.now() - 95 * 60 * 1000) } },
);

// Red (≥180 min waiting)
db.conversations.updateOne(
  { _id: ObjectId('<conversationId>') },
  { $set: { awaitingSince: new Date(Date.now() - 185 * 60 * 1000) } },
);

// Auto-unassign with no wait: back-date BOTH fields on an ASSIGNED thread
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

The admin screen picks up a new colour on its 60-second tick, or at once on refresh. The
next sweep tick (≤60 s) takes the third case back to the pool. To reset a thread to "not
waiting": `{ $set: { awaitingSince: null, flagged: false } }`.

See `LIMITATIONS.md` → "Chat / ticket lifecycle & reply SLA" for known gaps
(business-hours SLA, list pagination past 100, reassign picker, "ok thanks" reopen).
