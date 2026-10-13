# ADR 0019 — Asks live in the chat

Status: accepted, 2026-10-13. **Supersedes ADR 0018 decision 3** (the Kavach page stays) **and the
three Settings rows in decision 8** ("Your papers", "Density register", "Pump health"). Extends
ADR 0011 (a person or the machine certifies, never the dealer) and ADR 0008 (every new word is
written in Hindi and English; the admin stays English).

- Contracts: `shared/src/types/chatAsk.ts` (`MessageAsk`, `ChatAskState`, `DealerOpenRequest`, the
  ref helpers `chatAskRef` / `parseChatAskRef`), `Message.ask` and `Message.answersAsk` in
  `shared/src/types/conversation.ts`, `sendMessageSchema.answersAsk`,
  `receiveChatAttachmentSchema`, `sendBackChatAttachmentSchema` and `chatAskStatesQuerySchema` in
  `shared/src/schemas/chat.ts`, the audit actions `CHAT_ASK_RECEIVED` and `CHAT_ASK_SENT_BACK`.
  Four copies of `@dk/shared`, mirrored together.
- Admin: the "Open requests" card, the message-menu entries and the "Answer to" chip live in
  `mdg-admin/src/features/chat/`; the decisions behind them are in `mdg-admin/src/lib/chatAsk.ts`.
  The admin has no test runner, so those decisions are checked by
  `mdg-admin/scripts/chatAsk.check.ts` (`cd mdg-admin && npx tsx --test scripts/chatAsk.check.ts`).

## What the owner asked for

Do not show the "N things to send" bar, and remove its pages too. These are handled in the chat:
the density book photo is due, so we ask in the chat, the dealer sends it in the chat, and we mark
it received. Do this for basically everything.

## Context — what was there

A dealer was asked for things in four different ways, and each one lived on its own screen.

| What MDG needs                                | How the dealer was told                                       | Where they answered           | Who closed it                           |
| --------------------------------------------- | ------------------------------------------------------------- | ----------------------------- | --------------------------------------- |
| A paper an admin asked for, or a renewal      | A push to `/documents?ask=<id>` and a live event. No message  | The ask bar, then Your papers | A person, on the Vault shelf            |
| A Kavach photo (`request-evidence`)           | Nothing at ask time. Only the daily Kavach line in the chat   | Pump health                   | A person, in the Kavach drawer          |
| The density register page                     | Nothing. The ask bar showed it as "owed"; nobody was notified | The ask bar, then Density     | The system, the moment the photo landed |
| Tanker density readings (information, no ask) | A push with `deeplink: 'density'`                             | Read on the Density screen    | Nobody; nothing to close                |

Four facts decided the shape of the change.

**A photo sent in the chat was linked to nothing.** ADR 0018 said so in as many words, and it is why
the Kavach page was kept. The answer to every request went through a side door built for that one
request type.

**"A request" is three different things in three collections.** A document ask, a Kavach task's
evidence request and a density register day have different states, different storage folders and
different people who close them. A message, a reply and an admin button need one name that works
for all three, without knowing which collection it lives in.

**The storage fences differ.** A chat file is stored under the chat's own folder. A paper must be
under the ask's folder, a Kavach photo under the Kavach proof folder, a register page under the
register folder. A chat file cannot be handed to any of them as it is; the bytes have to be copied.

**The reply clock.** A dealer's message starts the "waiting for a reply" clock, and in practice an
admin's message (or resolving the thread) is what stops it. A photo marked received in silence
would leave the 30-minute alert ringing for something already dealt with.

## Decision

### 1. Every request is asked in the chat, as an MDG message that carries `ask`

A request is named by one string, its **ref**:

| Ref                 | Is                                               | Closed by                  |
| ------------------- | ------------------------------------------------ | -------------------------- |
| `doc:<askId>`       | A document ask: licences, papers, anything asked | A person ("Mark received") |
| `reg:<YYYY-MM-DD>`  | The density register page for that IST day       | The system, on arrival     |
| `kv:<kavachItemId>` | A Kavach task's photo evidence                   | A person ("Mark received") |

The message carries `{ ref, kind, title, periodLabel?, acceptsFile? }`. Its words are bilingual in
the reader's language (Hindi unless the member chose English), say what is wanted and for which day,
include the admin's own note if there was one, and end by saying to tap "Send photo". An app that
predates the field shows those words and nothing else.

What posts one:

- A document ask an admin raises, and a nudge on it.
- A paper sent back from the Vault shelf: asked again, with the reason, and the button.
- A renewal the nightly ladder opens. Its "running out" and "has run out" reminders are an ask
  **only while a renewal request is open** to answer them. With none open they are a plain notice,
  because a button that files nothing is worse than no button.
- A Kavach photo request.
- **A new morning job** that asks for **yesterday's** density register page, each morning (09:00 IST
  by default; `REGISTER_ASK_CRON`, in the Kavach timezone, beside the other scheduler jobs). It
  asks only outlets whose TT Density service is **active** (a paused service is not asked), only
  while that day is not yet received, and never twice into the same chat. It respects archived
  dealers and the switch that turns the scheduler off.
- **The same job also catches up.** Each morning it also asks for every open request the chat was
  never told about: a paper asked for or sent back, or a Kavach photo asked for or sent back,
  raised before this release, when the chat carried no asks. It posts each one once, into each chat
  that has not heard of it, so it is safe every day. And when the server starts after nine has
  already gone by that day, it runs the whole job once, so a deploy over 09:00 does not lose
  yesterday's register ask. Without this, a request raised before the release had no message to
  tap and nowhere else to be answered.

A paper kind an admin has hidden from dealers (`dealerVisible` off) is not asked or reminded in
the chat, and a photo is not filed against one through it.

Who receives it: the register page goes to the manager's group chat when the outlet has a manager,
and to the owners' own chats when it has not. Owners are in the manager's group and can read it
there, but they are not pinged for it. If the manager never opens the app, nobody is pinged at all.
Papers and Kavach photos go to the owners and the manager. One push per event, opening the chat.
The old `/documents?ask=` push is no longer produced.

These messages are written `system: true` — they are notices, as every report share is (ADR 0018
decision 4). One consequence is deliberate and is a change to the AI first line: its "a person spoke
a minute ago, stay quiet" check now **ignores `system` messages**. Before, any admin post — an ask
included — silenced the AI on that thread for the next hour.

### 2. The dealer answers in the chat

The ask bubble draws the title and the day, and while the request is open, a **"Send photo"**
button. It opens the camera inside the tap (the Android WebView drops a picker opened later), the
picture goes through the ordinary preview, and it is sent as a **reply to the ask** with
`answersAsk: <ref>`. A plain swipe-reply with a picture to an ask message counts too: the server
reads the ref off the quoted message. A ref is accepted only if it belongs to the dealer of that
conversation, **and only when the message carries a picture or a PDF**. A voice note or plain
words are never an answer, even when they quote an ask: they are an ordinary message and a person
reads them.

The bubble reads where the request stands from `GET /v1/asks/me/states?refs=…`, which answers
`open`, `sent` (MDG has it, has not checked it), `received`, or `closed` (withdrawn or lapsed), and,
when MDG sent an answer back, the reason.

The server files the answer after it has stored the message, by kind:

| Ref   | What happens                                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reg` | Copied into the register folder and filed as the dealer. **Received automatically.** MDG posts a "✓ Received" reply under the photo                                         |
| `doc` | Copied into the ask's folder and submitted: the ask is now `SENT`. Provenance (`via: 'chat'`, the conversation, the message) is kept on the submission. Nothing is accepted |
| `kv`  | Copied into the Kavach proof folder and submitted as evidence: the task is `SUBMITTED`. Provenance as above                                                                 |

A picture that cannot be filed (a HEIC picture, one that is too large) gets one short reply from
MDG, and nothing is filed. For a paper it says to send a photo or a PDF. For a register page or a
Kavach photo it says to send a photo, because a PDF is no use there. The AI first line stands down
on any message that carries `answersAsk`, so a photo is never filed twice.

### 3. Who marks it received

ADR 0011 stands: **the dealer never certifies anything.**

- The **register page** is received automatically. It is a fact about what was photographed, not a
  judgement. It does not reopen a resolved thread, does not start the reply clock and **does not
  push any admin's phone**, or the other members of a manager's group — MDG's "✓ Received" reply is the whole of the handling. The cost is
  that nobody at MDG is told a page arrived, except by the unread dot on the thread; the day just
  leaves the Open requests card. A page that comes **with words** (a typed note) is still filed,
  but it is handled as an ordinary dealer message, so the thread reopens, the clock starts and MDG
  is told: the words are for a person. So is a page that cannot be filed.
- **Papers and Kavach photos wait for a person.** The dealer's answer is a message waiting for MDG,
  so it does start the reply clock; that is what the clock is for. "Mark received" stops it.

The admin does this in the inbox, in four places that all open the same two dialogs:

- **An "Open requests" card** in the thread's Details panel (the same card is in the Details drawer
  on a phone). For the thread's dealer it lists what MDG is waiting on, each as **"Waiting for the
  dealer"** or **"Dealer sent it — check it"**, the ones to check first. One to check has **Show message**
  (scroll to and flash the dealer's photo, opening the other chat first when it was sent there),
  **Mark received** and **Send back**.
- **The message menu** on a dealer's picture or file: **"Mark received…"** and **"Send back…"**.
  Not on MDG's own messages, not on notices, not on a bare voice note.
- **A chip under the photo**: "Answer to: Fire NOC — mark received". The long-press that opens the
  menu is invisible, and this is the one thing in the thread that is somebody's job. One tap opens
  "Mark received" on the right request.
- **A small label on an ask notice** in the thread — what was asked, for which day, and where it
  stands — because the notice's own words are written for the dealer.

On a phone the Details panel is shut, so the thread's menu button carries a count of what is waiting
to be checked, and the Details row says "Details · 2 to check".

**"Mark received…"** opens a picker of the dealer's open requests. It starts on the one the dealer's
message answered; with one request outstanding it starts on that; with several and no match it
starts on nothing, because filing a photo against the wrong paper tells a dealer "received" about
something MDG never looked at. A paper that runs out asks for **the date printed on it**, never
prefilled — the date that governs is the one on the certificate. A message with several pictures
lets the admin pick which one is filed.

**"Send back…"** asks for a reason of at least four characters, which the dealer reads word for
word. It lists the requests this photo can go back on: the one it answered, and any still waiting
on the dealer (nothing is filed then, but the dealer is told why the photo will not do). A register
page is never sent back, and a request answered by a different photo is that photo's to send back.

Three endpoints back this:

- `GET /v1/dealers/:dealerId/open-requests` → `DealerOpenRequest[]`: requests waiting on the
  dealer, and sent ones waiting on MDG, across document asks, Kavach requests and register days. A
  register day is listed only for an outlet whose TT Density service is active, only while it is not
  received, and only if the dealer can still answer it: the six days before today, up to yesterday.
  A sent one names the message that answered it. A request the dealer answered in the chat that was
  never filed (a HEIC picture) stays `open` and names the message too: the card and the chip offer
  the same buttons on it, which is how a person rescues one the machine could not. Once a person at
  MDG has replied under that photo they go away: a photo just sent back still names itself as the
  latest answer, and must not ask to be marked again.
- `POST /v1/conversations/:id/messages/:messageId/receive`, body `{ ref, attachmentIndex?,
validUntil? }`. If the request is already waiting on this very message it is accepted. Otherwise
  the bytes are copied, submitted **as the dealer who sent the photo**, and accepted in the same
  call — the shape of "file for dealer", so nothing claims MDG filed a paper it only received. A
  paper that runs out is refused before any bytes move if no date was given. A Kavach photo is
  verified with the copied photo as the proof; a task that is closed with a written note, or an SOS
  task, is refused before any bytes move too. A register day is filed as the admin. A request that
  already holds a **different** photo, or is already done, is refused with a 409 that says so: a
  double press or a second admin cannot receive it twice. Then MDG posts
  "✓ Received — title, day" as a reply quoting the dealer's photo, from the admin so it reads as a
  person, and that reply stops the reply clock.
- `POST /v1/conversations/:id/messages/:messageId/send-back`, body `{ ref, reason }`. A paper is
  rejected from `SENT`, a Kavach photo from `SUBMITTED`; a request still waiting on the dealer
  stays as it is and the reply alone carries the reason. A register day cannot be sent back. The
  reply **carries the request again**, so the "Send photo" button sits right under the reason and
  a swipe-reply onto it links. Otherwise the button stays on the original ask, far up a thread that
  has since filled with daily asks and digests.

When a **renewal** is received, the old paper's reminder ladder stops with it. Otherwise the old
row keeps its ladder, and a "has run out" notice lands under a "✓ Received" for the new paper.

Both write their audit row (`CHAT_ASK_RECEIVED` / `CHAT_ASK_SENT_BACK`) on top of the ask and Kavach
rows the underlying writers already leave, and both call the same accept and reject code as the
Vault shelf and the Kavach drawer, which were moved out of their routes so that there is one
implementation. The admin alerts `paper_to_review` and `kavach_to_verify` link to the inbox thread
that holds the answer when it came through the chat. The old `paper_to_review` link could not open
a `SENT` ask at all.

**Who can answer, and for how long.** The dealer can send a register page for today and the six
days before it (seven days, counting today). A page older than that reads `closed` in their chat;
only MDG can add it.

After either action the admin refreshes the open requests, the thread, the Vault shelf, the Kavach
queue and the density calendar.

**"Mark received" is only offered on a photo the admin can see.** From the card, the answer is
often in the outlet's other chat or on an older page. Then the card's main button is "Show message"
(or "Open chat"), "Mark received" waits until the photo is on screen, and the dialog itself refuses
to confirm with no picture in it. A photo the admin has not looked at must not be told "received".

### 4. What was removed from the dealer app

The ask bar (the strip and the engine behind it) and its offline queue; the ask list and filing
cabinet (`/asks`, `/documents`); the density screen (`/density`); the Pump health page (`/kavach`);
and their rows in Settings. **Old links to those four routes open the member's own chat.**

### 5. What those screens showed now arrives in the chat

| It used to be                                         | It is now                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Tanker density readings: a push to the Density screen | An MDG message in the chat with the figures, in the reader's language; to the manager, else the owners. The push opens the chat |
| Which papers are on file and when they run out        | An ask when a renewal is open, otherwise a notice (the nightly ladder), and the AI already answers "what is on file"            |
| The density book's state                              | The morning ask, and the AI already answers "density kya hai"                                                                   |

**The tanker message carries only figures from the tankers that arrived in that run, and each
figure names the invoice day it came from.** An invoice whose reading could not be read adds
nothing, and if none of the new ones has a reading the message is just the headline, "New tanker
density is ready". "The newest reading there is" could be a week-old tanker's, printed as the new
one, and a dealer copies that number into a statutory register.

The AI's guide to the app and its canned lines were rewritten to say "MDG asks here; tap Send photo
on the message", and the removed Settings rows were taken out of the guide.

## What was kept

- **The old dealer endpoints**: `/asks/me/*`, `/kavach/me`, `/kavach/items/:id/evidence`,
  `/tt-density/me/*`. An installed app or an open tab may still call them. Nothing new uses them.
- **Every admin screen that raises or reviews a request.** "Ask for a document", "Remind all not
  sent", the Vault shelf's accept and send-back, the Kavach "Ask the dealer" and verify drawer,
  dealer-detail "File a paper" (for an original handed over in person), and the density calendar's
  "Upload on the dealer's behalf" (the fallback for a dealer who never uses the chat). They work as
  before; the backend now posts the ask into the chat. Their helper text says the dealer gets it in
  their chat, not as a notification or on a papers screen. **Every door says its verdict in the
  chat and stops the reply clock of the thread the photo came through**, but not in the same
  words:

  | Door                     | What the dealer gets in the chat                                                     |
  | ------------------------ | ------------------------------------------------------------------------------------ |
  | Inbox: Mark received     | "✓ Received" as a reply under their photo                                            |
  | Inbox: Send back         | The reason as a reply under their photo, with the Send photo button                  |
  | Vault shelf: Accept      | A "Checked by MDG" notice to the owners and the manager                              |
  | Vault shelf: Send back   | A new ask with the reason and the button                                             |
  | Kavach drawer: Verify    | For a photo sent in the chat, "✓ Received" under it, as the inbox does               |
  | Kavach drawer: Send back | For a photo sent in the chat, the reason under it with the button, as the inbox does |

  A Kavach task certified or sent back with no chat photo behind it (the old app's route, or MDG's
  own upload) posts nothing. The Pump health page, which used to carry a send-back reason, is gone,
  so for a chat photo the reply is where the dealer reads it.

- **The ask, document and Kavach rows' own trail.** Nothing was renamed.
- **The paper validity register** in the admin, and the document catalog. They are about when a
  paper runs out, not about how it arrives.

## Left out, on purpose

- **Auto-accepting a paper or a Kavach photo.** A picture can be anything. ADR 0011 stands.
- **Reading the picture to decide which request it answers.** The dealer says which by pressing the
  button on the ask; failing that, an admin says which by choosing.
- **Sending a register page back.** The fix for a wrong page is another page, by message.
- **More than one file on a request.** A request holds one picture or file. When a dealer's message
  carries several and it links on its own, the first is filed; an admin marking it received can
  choose another.
- **Live refresh in the admin's review lists.** The live event for a paper changing state goes to
  the dealer's room only. The inbox's open requests refresh when a message arrives that carries or
  answers a request, when another admin's reply ("Received", "Send back") lands under a dealer's
  photo, when the tab comes back to the front, and after an action. A second read follows four
  seconds after an arrival, because the server stores the message first and files the photo just
  after. If filing takes longer than that, the card catches up on the next focus. The Vault shelf
  and the Kavach queue are as they were.

## Costs, stated

- **A photo sent on a dead link is not saved to try again later. The dealer has to send it again.**
  The old ask bar kept up to three photos in the phone and retried them until the signal came back,
  which suited a forecourt on 2G. The chat does not do that for the answer to an ask: if the upload
  fails, the photo is gone from the queue and the dealer taps Send photo again. On a bad link that
  will happen. We took one simple screen over a retry queue, and this is the one cost a dealer may
  notice. A photo still waiting in the old queue when the phone updates is dropped on the first start
  of the new app. The request it answered is not lost: the morning job asks for anything never asked
  in the chat.
- **The AI's "a person spoke" check changed for everybody**, not only for asks. A `system` notice no
  longer counts as a person on any thread. That includes the "Resolved" notice an admin's resolve
  posts, which used to keep the AI quiet for an hour: a dealer's "thanks" or "still not working"
  straight after a resolve can now get an AI answer at once.
- **The nightly ladder runs at 00:20 IST**, so a renewal ask or an expiry notice lands in the chat
  and buzzes the phone in the middle of the night. The old push went out at the same hour. Not
  changed here.
- **Four copies of `@dk/shared`** had to change together, as in ADR 0018.
- **A dealer who answers a paper puts a message in the inbox.** It is a ticket's worth of attention
  by design — somebody has to look at the paper — and it is why "Mark received" posts a reply:
  without one the thread would keep ringing the 30-minute alert for a paper already dealt with.
- **Three kinds of request behind one button.** The writers for papers, Kavach and the register
  page were extracted so that the inbox and the old screens call one implementation of accept and
  reject. A bug there now shows up in both doors.

## Deploy

In this order:

1. Deploy the **backend**. The old dealer app keeps working: every endpoint it calls is kept. The
   first start posts one message for **each request that was open before the release**, with one
   push each, into the chat it belongs in. That is a handful with today's few dealers and a burst
   with real ones.
2. Release the **admin**, then the **dealer client**. "Mark received", "Send back", the Open
   requests card and the "Answer to" chip exist only in the new admin, so until it is out nobody
   can file a dealer's chat photo from the inbox. Until the dealer client is out, a dealer on the
   **old app** gets each ask as a plain message that still says "Tap Send photo below" and has **no button**
   (the old app does not know the field). A **swipe-reply with a picture onto that message does
   link**, because the server reads the ref off the quoted message. A picture sent the ordinary way
   does not: it is a plain message that starts the reply clock. Keep the window to minutes.
3. Let the morning job run once and look at the chat of an outlet with TT Density attached. A
   restart over 09:00 is covered by the catch-up at start.

Check it yourself:

1. In the admin, Data Vault, Documents, "Ask for a document": the dealer's chat gets an MDG message
   with a "Send photo" button.
2. The dealer taps it and sends a photo. In the inbox the photo carries "Answer to: … — mark
   received", the thread's Open requests card says "Dealer sent it — check it", and an alert
   points at the thread.
3. Press "Mark received" (type the date printed on the paper if it asks). The dealer sees
   "✓ Received" under their photo; the card and the alert clear.
4. The next morning, an outlet with TT Density is asked for yesterday's register page in its chat.
   The photo is received at once, with no admin step.
