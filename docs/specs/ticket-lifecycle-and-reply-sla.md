# Ticket lifecycle & reply SLA

How a support conversation behaves as a ticket, and how the reply SLA (auto-unassign

- escalating flag) works. The `Conversation` document **is** the ticket — there is no
  separate ticket entity. Threads are per **member** (each dealer owner/manager has one
  private thread); the admin inbox is a single shared surface every admin can act on.

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

| Tab        | Filter     | Meaning                                                        |
| ---------- | ---------- | -------------------------------------------------------------- |
| Unassigned | `open`     | `OPEN` only — the pickup queue.                                |
| Mine       | `mine`     | `ASSIGNED` to the current admin.                               |
| All open   | `all`      | `OPEN` **∪** `ASSIGNED` — every active ticket across the team. |
| Resolved   | `resolved` | `RESOLVED` — no active request.                                |

Badge counts come from `GET /conversations/counts` (one `countDocuments` round-trip),
not four full list fetches. A `flagged` filter also exists server-side; flagged tickets
otherwise surface via the amber/red badge inside the tabs above.

## Admin chat rendering

The admin inbox is a shared surface, so **every** admin message (mine or a teammate's)
renders on the **right**; `own` (`senderId === currentUserId`) only drives bubble colour
and read ticks. A teammate's message is a soft-blue bubble with their name above; the
client's messages stay on the left. Resolve notices render as centered system chips and
shared records as summary cards (matching the client app). The client app is unchanged —
there, all support is one left-side voice by design.

## Config

| Env / constant                 | Default     | Where                              |
| ------------------------------ | ----------- | ---------------------------------- |
| `TICKET_AUTO_UNASSIGN_MINUTES` | 20          | `mdg-backend/src/config/env.ts`    |
| `TICKET_SWEEP_CRON`            | `* * * * *` | `mdg-backend/src/config/env.ts`    |
| `TICKET_FLAG_WARN_MINUTES`     | 90          | `shared/src/types/conversation.ts` |
| `TICKET_FLAG_URGENT_MINUTES`   | 180         | `shared/src/types/conversation.ts` |

See `LIMITATIONS.md` → "Chat / ticket lifecycle & reply SLA" for known gaps
(business-hours SLA, list pagination past 100, reassign picker, "ok thanks" reopen).
