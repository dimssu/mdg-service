# ADR 0017 — Tickets, and an AI that reads the whole outlet

Status: accepted, 2026-10-12. Extends ADR 0013 (the writer) and ADR 0004 (the
conversation as the ticket). The router engine from ADR 0013 is untouched and
stays selectable. Amended 2026-10-15: the last section carries the boundaries
of the September v3 plan.

## What forced this

A dealer typed "Mera koi kaam reh raha hai kya?" and got back, in Devanagari:

> MDG को आपसे ये चाहिए: Daily Density book सुबह 10:00 बजे तक update करना, Daily
> toilet निरीक्षण सीट Update की सुनिश्चितता, डेंसिटी रजिस्टर का पन्ना (5 अक्टूबर),
> डेंसिटी रजिस्टर का पन्ना (6 अक्टूबर) और डेंसिटी रजिस्टर का पन्ना (7 अक्टूबर) — और 4 और

with a "Talk to a person" link under it. Every defect in that reply has a cause
in code, and none of them is the model:

| What the dealer saw                                | Cause                                                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Devanagari reply to Hindi typed in Latin letters   | the router calls romanised Hindi `hi`; the writer was told to always answer `hi` in Devanagari                                         |
| "Daily Density book सुबह 10:00 बजे तक update करना" | the ask list put a Kavach task's raw imported TITLE on the row, not its dealer-facing LABEL — on the dealer's own Documents screen too |
| the register page three times, then "and 4 more"   | one row per owed day, capped at five; the writer could not group because the fence refuses a bare day number                           |
| "— और 4 और"                                        | the Hindi overflow appended "और N और" after a list that already ends in "और"                                                           |
| no next step                                       | the template is a bare list                                                                                                            |
| "Talk to a person"                                 | a button that sent an ordinary message the code's own phrase list did not recognise                                                    |

And underneath it, three things the owner asked to change:

1. **No "Talk to a person" button.** The machine should decide when a person is
   needed and hand it over itself.
2. **A handoff must be a ticket that stays open until a person closes it.** It
   was not: a handoff flipped a flag on the thread, and the next AI answer to an
   unrelated question cleared the reply clock and the "AI passed on" chip while
   the first question was still unanswered. Any admin "ok" did the same.
3. **The AI should know the whole outlet**, and what it tells the manager must
   be filtered — and some things filtered for owners too.

## Decision

### 1. Tickets — their own record, closed only by a person

A `Ticket` (`shared/src/types/ticket.ts`) is opened by the machine whenever it
hands a question to a person, under either engine. It is closed only by an
admin writing a resolution note. No reply, later AI answer, dealer message,
sweep or alert dismissal closes one.

- **One open ticket per thread**, enforced by a unique partial index. A second
  escalation on a thread with an open ticket is added to it as a follow-up.
- Every handoff reason maps to a trigger (`TICKET_TRIGGER_FOR_REASON`, in
  `shared/src/lib/ticketView.ts`) — so the
  Tickets page can tell _only a person can do this_ from _we never built it_
  from _we broke_.
- **Voice notes, PDFs and several files now raise a ticket and say so.** They
  used to stand down in silence. A photo nobody could place does the same.
- The handoff message carries `ai.ticketId`; the dealer's bubble shows one quiet
  line — _Sent to the MDG team_ → _MDG team is looking at it_ → _Closed by the
  MDG team_ — from the conversation's dealer-safe `tickets`.
- An admin replying in the thread marks its tickets _seen_. It never resolves
  them.
- Admin: a Tickets page, a strip in the inbox thread with Resolve, an inbox
  filter, a nav badge, a `ticket_open` alert on every admin's phone, and a row
  on the Today list.

ADR 0004's "the Conversation is the ticket" still holds for the thread a person
works by hand. It could not hold _the machine gave up on this question_, which
is what this record is.

### 2. "Talk to a person" is gone

The button, the "Talk to support" chip and their strings are removed. A dealer
who TYPES a request for a person is still recognised in code before any model
call, and the button's old wording is now on that list.

### 3. The briefing engine

`AI_FIRSTLINE_ENGINE=brief` replaces the router's closed labels with one call
over a **briefing**: every family of records MDG holds for the outlet —
pending papers grouped by paper, DSR status for the latest day and today,
density register, water checks, Kavach tasks, staff and points and leave,
services, records on file, depot closures, this thread's tickets, the last
load plan and credit report sent, the outlet file — plus an app guide written
from the real dealer screens.

The safety spine of ADR 0013 survives, moved rather than removed:

- **No reader takes a dealer id from the model.** The id comes from the
  conversation. Another outlet cannot be read because nothing can be pointed at
  one.
- **The same fence runs on the reply**, in a `message` shape that allows line
  breaks and "• " bullets. Every figure, date, person and service must fold
  back to a briefing fact; a unit family (₹, litres, density) may appear only
  when a fact carries it.
- **A refusal gets one retry, told in plain words what was wrong.** A second
  refusal is not posted: the dealer reads "I want to be sure before I answer
  this" and a `could_not_verify` ticket is raised. There is no template for an
  open question, so a person is the only honest fallback.
- The two figure gates (`AI_FIRSTLINE_QUOTE_DENSITY`,
  `AI_FIRSTLINE_QUOTE_SHARED_DSR`) are honoured exactly as the router honours
  them, and a third, `AI_FIRSTLINE_QUOTE_CREDIT`, gates credit figures. All
  three ship off.

The reply's script is decided **in code** from the message: Devanagari,
Hindi in Latin letters, or English.

### 4. Who may be told what — filtered on the way in

**A reply is cleared for the lowest-clearance person who can read the thread.**
An owner's own chat is `owner`; the manager's group chat (manager + every
owner) is `manager`. The briefing builder never reads a family the audience may
not see, so the model is never shown it and cannot repeat it — however the
question is phrased. A filter on the reply would be a regex over prose; a fact
the model never saw cannot leak.

| Family                                                                                                                                                             | Owner      | Manager                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------- |
| DSR status, density, water checks, Kavach tasks, papers, staff, services, records, depot calendar, tickets, outlet licences and basics                             | yes        | yes                                |
| Figures on a report MDG sent; the last load plan                                                                                                                   | yes        | only if it was sent to the manager |
| Credit limit, dues, DOD                                                                                                                                            | yes (gate) | **never**                          |
| GST, PAN, payment terminal and merchant ids, agreement date, ownership                                                                                             | yes        | **never**                          |
| Phone numbers and email on the outlet file                                                                                                                         | —          | — (a person answers)               |
| Admin triage fields, admin names, run errors, credentials, ledger classifications, P&L, inspection findings, invoice money, other outlets, an unpublished Kavach % | never      | never                              |

The manager's group chat is now answered — **only when a message is plainly
for MDG**, decided twice: a small, cheap gate call ("is this message for MDG?",
no briefing, no thinking) runs first, and only a yes builds the briefing, whose
answer must say yes again. Owner-to-manager talk, photos and voice notes there
stay silent and raise nothing; a model failure, a quota or a budget limit there
stays silent rather than posting into somebody else's conversation; and a
silent group turn does not count against the dealer's hourly question limit.

The same owner-only list (`DEALER_PROFILE_OWNER_ONLY_KEYS` in `@dk/shared`) now
filters the outlet-file route for the manager too, so the app and the chat
cannot disagree about who sees a GST number. Kavach tasks are not briefed until
the outlet's Kavach is publishable — the router's rule, kept (ADR 0011).
Password questions always go to a person: the guide carries no password steps,
and the fence refuses the word in any reply.

### 5. A leak closed on the way

`conversationToPublic` sent dealers the admin's triage fields — priority,
category, the assigned admin's name, the reply clock, the AI block — on
`/conversations/mine` and every socket fan-out. Dealers now get an allow-listed
projection.

## Costs, stated

- **Money.** The briefing is several thousand tokens and the model thinks
  first: roughly 30–40 paise a turn against the router's 8–11. At ten dealers ×
  ten questions a day that is about ₹35/day. The ₹400/day lid is unchanged.
  Replace these estimates from the first fifty `engine: 'brief'` rows.
- **Latency.** One larger call with thinking: a few seconds longer than the
  router, behind typing dots.
- **The fence proves provenance, not attachment** (ADR 0013 risk 1) — and the
  briefing hands over far more facts than one label's lookups. A sourced figure
  attached to the wrong noun is the residual risk, now larger. Review the first
  fortnight's `brief` turns for exactly that, and for yes/no claims against the
  briefing.
- **Group-chat judgement is the model's.** "Is this for MDG?" has no code check.
  A wrong _yes_ posts an unwanted reply into the owners' and manager's chat; a
  wrong _no_ leaves a question for the person who reads the thread anyway.

## What the review caught before it shipped

A five-angle adversarial review ran on the finished change; every finding was
proven by a test or a line-by-line read. The ones that would have hurt:

| Found                                                                                                   | Effect it would have had                                                                      | Fixed by                                                                  |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Staff names were keyed `….name`, which the fence reads as "the one person this reply is about"          | at every outlet with staff on the app, **every** reply refused twice and turned into a ticket | keys renamed `….person`; a test with staff                                |
| The fence read the word "may" as the month May                                                          | honest English replies refused, including the credit caveat the prompt asks for               | "May"/"March" count as months only beside a number or a month preposition |
| An employee name with a newline in it                                                                   | a manager could write fake lines into the briefing the owner's chat is answered from          | every fact printed on one line; names with digits never carried           |
| Group chatter counted against the dealer's question limit, and limits posted a busy line into the group | twenty owner-to-manager lines blocked the owner's own question                                | silent group turns uncounted; limits silent in the group; the gate call   |
| A brief answer stopped the reply clock while a ticket was open                                          | "ok thanks" after an escalation removed the thread's SLA colour                               | no clock is stopped while a ticket is open                                |
| A role switch deletes the member's chat                                                                 | an open ticket left pointing at nothing                                                       | the switch is refused (409) until the ticket is resolved                  |

Also fixed in the same ship, because the review of the AI path walked into them:

| Found                                                                                                                                    | Fixed by                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Two messages a second apart both went unanswered — the second could not take the thread, the first refused to post under a newer message | the turn that held the thread answers the newest unanswered message after it lets go; one reply covers the burst |
| An owner's Invite button always failed — it posted to an admin-only route                                                                | an owner may add a MANAGER to their own outlet (one per outlet, as before); another owner still goes through MDG |
| A manager could not change their own password (403)                                                                                      | every member may change their own password, with the current one, and nothing else through that path             |
| An owner could suspend or reset a co-owner                                                                                               | an owner manages the manager and themselves only                                                                 |
| The daily Kavach line printed "{pct}% today" during the settling-in grace while the Kavach screen hid the figure                         | the line follows `kavachScoreIsPublishable` and carries no number until then                                     |

Left as found, and why:

- **A shared load plan is one sentence**, so only the whole headline can be
  quoted, not its date on its own.
- **An invented name that is not on the roster is not caught** by code — the
  fence checks roster names, not every capitalised word. The prompt forbids it.

## Deploy

Done: the box runs `AI_FIRSTLINE_ENGINE=brief` with the first line switched on (confirmed on the
box 2026-10-15). It went live on 2026-10-12.

`AI_FIRSTLINE_ENGINE` ships `router`, so a box that never sets it behaves as
before except for tickets and the attachment line. To switch on the briefing
engine, set in the server's `.env`:

```
AI_FIRSTLINE_ENGINE=brief
AI_FIRSTLINE_WRITER_ENABLED=true   # brief runs only while written replies are allowed
```

and restart. The admin's "Templates only" switch also drops it back to the
router. The kill switch is `AI_FIRSTLINE_ENGINE=router`. The three figure gates
(`AI_FIRSTLINE_QUOTE_DENSITY`, `…_SHARED_DSR`, `…_CREDIT`) stay off until the
owner chooses to open them.

## Boundaries carried over from the v3 plan (5 September 2026)

A planning document for the AI first line ("v3", written 5 September, before this ADR) was never
built as written. Its buttons-in-replies design became asks in the chat (ADR 0019) and its router
became the briefing engine above. Its list of what to refuse to build is still the boundary of
the AI first line. Each row reads: what we do not do, what that costs the owner, and why.

| Not doing                                                                           | What the owner loses                                                                         | Why                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A model looking at dealer photos**                                                | No automatic "this is a register page" or "this is unreadable".                              | On a blurred slip the model returned a confident wrong number, marked it legible, and returned the same wrong number four times (ADR 0012). And "is this a register page?" is certification, which ADR 0011 reserves. The blur warning in the app covers the useful half.                            |
| **Free-text or numeric inputs in a chat bubble**                                    | No "enter today's dip reading" in the chat.                                                  | A number typed into a bubble becomes a figure our own reports could quote, with none of the shift-data editor's closed-ledger protections.                                                                                                                                                           |
| **Yes/no compliance ticks** ("mark it done")                                        | The dealer still cannot self-certify a task.                                                 | A tick is cheaper to fake than a photograph and weighs the same on screen. ADR 0011 exists to stop exactly this.                                                                                                                                                                                     |
| **A menu as a general control**                                                     | No "pick from these three" bubbles.                                                          | A chat that answers "what's pending?" with a menu has stopped answering and started delegating. The honest case, several papers open, is prose naming all of them, one control and a link to the list.                                                                                               |
| **Rupee figures in the chat**: credit due, DOD date, tanker invoices, our own bills | Money questions still go to a person.                                                        | The credit figure moves daily; quoting yesterday's approved amount today is the authoritative-figure fault. If it is ever done it must be gated and off by default. This ADR's `AI_FIRSTLINE_QUOTE_CREDIT` is that gate: off by default, owner only, and limited to the last credit report MDG sent. |
| **Inspection findings, IRAS per-nozzle rows, run error detail**                     | Dealers cannot self-serve these.                                                             | Findings are an officer's verdict about their licence. The meter rows have no screen anywhere, so the chat would be inventing a fact. Run errors carry portal text, selectors and occasionally a credential.                                                                                         |
| **Anything a dealer taps that triggers a browser run**                              | No "run my water check now" button.                                                          | Browser automation is one Chromium at a time on the box. Ten dealers tapping it is an outage.                                                                                                                                                                                                        |
| **Voice notes routed to obligations**                                               | A voice note still goes straight to a person (now with a ticket, §1).                        | A voice note cannot satisfy a paper obligation, and the document schema already says so. Transcription is a later option, and a transcript is only words: they may choose between targets the code already offers, never select one.                                                                 |
| **Multi-page documents**                                                            | A multi-page fire NOC submits page one; every page is on the ledger and on the admin's card. | Both destinations take one file. The fix is a pages array, a new field with no index change. Later work, not a blocker.                                                                                                                                                                              |
| **Actions in WhatsApp**                                                             | Buttons live in the app only.                                                                | WhatsApp interactive messages have their own limits and their own approval flow.                                                                                                                                                                                                                     |

### Considered, not built

Dated 5 September 2026. None of these exists in the code on 15 October 2026.

- **Gap Register.** Handoffs grouped by how many dealers hit the same one, so the next thing to
  build is the thing most dealers ran into.
- **Unfiled-photos tray.** An admin pane, per dealer and across dealers, listing every photo a
  dealer sent that nothing filed, so an admin can file it by hand with their name on it.
- **Honest-number dashboard.** The share of questions _handled_ (answered, acted on, guided, or
  escalated with a subject line and a named next step) shown beside the share _answered by the
  machine_, always on the same screen. About one question in five is money, a dispute or a
  judgement that ADR 0011 reserves for a person, so the answered rate has a ceiling near 80%
  whatever the prompts say. Chasing a higher answered rate would mean widening what the model may
  say, which is the one direction that breaks the guarantees.
- **A general claim layer.** The writer declares what its sentence means and which fact each
  number came from, and code compares. It would catch what the digit-and-unit fence cannot: an
  instruction or a yes/no with no digit in it.
- **A sampled shadow judge.** A third model call after the reply is posted, from a queue, answering
  closed questions, never a gate, with its own flag, its own daily cost lid and concurrency of 1.
  A gate that can itself hallucinate is not a gate.
