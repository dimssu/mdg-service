# MDG — Product Requirements Document

**Status:** v2 · **Owner:** Product · **Last updated:** 2026-10-15

> MDG turns the messy reality of fuel-dealer support — a tangle of scattered chats, phone calls, and lost paperwork — into one calm app where every dealer member asks for help, gets a first answer at once, and receives the organisation's reports. We win on _approachability_, not feature count.

**What changed since v1 (June 2026).** The Records model (record cards, the Records shelf, admin "Upload report") was retired on 13 Oct 2026 (ADR 0018): a report is now a picture or a file in the chat. Every "MDG needs X" request moved into the chat as an ask message with a "Send photo" button (ADR 0019). An AI first line answers dealer messages, and a ticket sits behind every question it hands to a person (ADR 0013, ADR 0017). §1–§3 and §5 keep their intent; §4 and §6–§8 and §10 are rewritten; §9 now carries the Do-not list.

---

## 1. Vision

Every fuel/petroleum dealer in India should be able to get an answer and find a report by doing the one thing they already know how to do: **send a message**. MDG is a chat-first support platform that feels as easy as a familiar messaging app but works like a real CRM and ticketing system behind the glass — all inside our own app (Dealer Kavach), no third-party chat.

- **For dealers:** one chat app. It opens on a list of chats, WhatsApp-style. Ask a question, attach a photo, read the answer at once. Your Daily Sales Report arrives as a picture in the chat. When MDG needs a paper or a photo from you, it asks in the chat and you tap **Send photo**. Owners have their own 1:1 chat with MDG; the manager has a group chat with all the owners and MDG. Nothing to learn.
- **For staff (admin):** a structured inbox. The AI first line answers what it can settle. What it cannot settle becomes a ticket a person must close. Staff triage by priority and category, pick up, send reports to the owners, the manager or both, mark the papers and photos dealers send as received, and log the service provided when they resolve.

We are deliberately replacing scattered-chat chaos with something _more humane_ — not more powerful-looking — and we own the whole experience in-app so there is one front door, not several. "MDG" is the team that answers; "Dealer Kavach" is the app it answers in.

---

## 2. Problem statement

Today, dealer support runs through informal group chats and phone calls:

| Pain                                                            | Who feels it    | Consequence                                        |
| --------------------------------------------------------------- | --------------- | -------------------------------------------------- |
| Requests scatter across many group chats                        | Staff           | Messages missed; no ownership; no SLA              |
| No record of who handled what                                   | Staff & dealers | Repeated questions, no accountability              |
| Documents (DSR, invoices, compliance) shared as ad-hoc forwards | Dealers         | Lost files; "can you resend?" loops                |
| No priority/category/triage                                     | Staff           | Urgent compliance issues buried under routine asks |
| Apps feel intimidating to 40–60yo pump owners                   | Dealers         | Adoption stalls; they fall back to phone calls     |

There is no system of record and no humane front door. MDG is both.

---

## 3. Personas

| Persona                   | Role                                | Age / Tech comfort                    | Goals                                                                                           | Frustrations                                       |
| ------------------------- | ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Ramesh — Pump Owner**   | `dealer-owner`                      | 52, low. Uses chat apps & calls only. | Get answers fast; receive his DSR & invoices; not feel stupid                                   | Apps with menus, logins, jargon, English-heavy UI  |
| **Sunita — Pump Manager** | `dealer-staff` (`title: "Manager"`) | 34, medium. Comfortable on phone.     | Raise day-to-day queries in the manager chat, send meter and register photos, find past reports | Re-explaining the same issue to different people   |
| **Arjun — Support Agent** | `admin` (staff)                     | 28, high.                             | Pick up tickets, triage by priority/category, resolve fast, send reports, log the service done  | Context-switching across scattered chats; no queue |
| **Priya — Support Lead**  | `admin` (staff)                     | 35, high.                             | See the queue, ensure nothing rots, report on resolution time                                   | No visibility into volume, aging, or who owns what |

Primary design target: **Ramesh.** If Ramesh can use it unassisted, everyone can.

---

## 4. Goals & Non-Goals

### Goals

- Make **chat the dealer's main and only required screen**; everything reachable from it.
- Give every message a **first answer at once**, and turn every question the machine cannot settle into a **ticket** staff can triage and close.
- Deliver **reports** (DSR, Credit & DOD, Kavach, load plan, ledger) as **pictures and files in the chat**, and ask for **papers and photos in the chat** too.
- Be usable by a non-technical 40–60yo owner **without training**, in **Hindi or English**.
- Work **mobile-first** and inside the **Expo WebView app**.

### Non-Goals (for this release)

- A dealer-facing analytics dashboard or BI.
- Dealer-visible triage. `priority` and `category` are **admin-only**, never shown to dealers.
- Dealer-created accounts. Staff create every login. The app's "Register your pump" screen only sends an enrolment request to MDG; it does not make an account.
- Dealers editing their own name, phone or email. The profile is read-only and offers a message to MDG instead.
- Support, asks or reports through WhatsApp or any other third-party chat. They stay in the app's chat.
- A "Talk to a person" button. The machine decides when a person is needed and opens a ticket itself.

---

## 5. Success metrics

| Metric                     | Definition                                                                    | Target (90 days post-launch) |
| -------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| **Adoption %**             | Provisioned dealers who send ≥1 message                                       | ≥ 70%                        |
| **Time-to-first-message**  | First login → first sent message                                              | Median ≤ 2 min               |
| **Ticket resolution time** | `OPEN`/`ASSIGNED` → `RESOLVED`                                                | Median ≤ 4 working hours     |
| **Report read rate**       | Report pictures read ÷ delivered                                              | ≥ 60% within 24h             |
| **Retention**              | Dealers active (≥1 message sent OR ≥1 report read) in a rolling 30-day window | ≥ 50% month-over-month       |
| Anti-intimidation proxy    | Sessions ending in a sent message vs. silent drop-off                         | ≥ 80%                        |

---

## 6. Feature list (MoSCoW)

### Must have

- **Chat list is home**, always — even with one chat. No bottom bar. **Settings** is behind the ⋮ menu on the list.
- **Owners** have a 1:1 support chat with MDG and also see the **manager group chat**. The **manager** has the group chat, which every owner of the outlet joins.
- **Composer:** text; an attach sheet (Document / Camera / Gallery); voice notes; swipe to reply; reactions; search in a chat; a media page of everything shared in a chat.
- **Reports are pictures or files in the chat.** A tap opens the picture full-screen: pinch to zoom, swipe to the next or the last one, download.
- **Asks in the chat.** Every "MDG needs X" (a paper, a Kavach photo, yesterday's density register page) is a message with a **Send photo** button. The dealer's reply is linked to the ask. A person marks papers and Kavach photos received or sends them back with a reason; the register page is received automatically.
- **AI first line + tickets.** The AI replies at once in the member's language. When it cannot settle a question it opens a ticket for a person. The dealer sees one quiet line under the reply, not the word "ticket".
- Admin 3-pane inbox: queue (chats grouped by organisation) → chat → dealer/ticket detail, with filters Unassigned, Mine, All open, Resolved, Dropped, Tickets, ⚡ AI and 🛡 AI guard.
- Ticket triage: pick up (assign), set `priority`, set `category`, resolve **with a required service log**, reopen.
- **Manual service logging** (`ServiceLog`): resolving a conversation records the service provided (catalog `serviceId` or `'other'` + name, plus notes), building a per-dealer "services provided" history on the admin dealer detail page.
- **Admin sends to the outlet.** The composer's **Send to** picks This chat, Owners, Manager or Both. A report's Share button in the admin offers Owners, Manager or Both. Every owner gets a copy.
- Three roles: `admin`, `dealer-owner`, `dealer-staff` (managers = `dealer-staff` with `title: "Manager"`).
- App login issuance at onboarding (email + password). The dealer `code` (e.g. `15E`) is the whole identity of the outlet; there is no separate dealer name.
- **Settings** (behind ⋮): profile (read-only), Account (change password), Language (Hindi / English), Your team (owner only), Your services, Warriors & points (owner and manager), Help (the video guide), Log out.
- **Hindi and English** throughout; Hindi unless the member chose English.
- Real-time delivery via sockets (`message:new`, `conversation:updated`, `tickets:changed`).
- **Push notifications** via the Expo native bridge when MDG replies, sends a report, asks for something, or resolves a request. A tap opens the exact chat. (`Device` model + `POST/DELETE /api/v1/devices`, `PUSH_ENABLED`.)
- Unread counts on the chat list; read receipts; "is typing" dots.
- **Automated services.** Nine service plugins run on a timer or on demand: DSR report, Credit & DOD, TT Density, Load Planner, Water Ingress, RO Supply Status, Inspection Reports, IRAS shift data and a custom-request plugin. The ones that make a report send it to the dealer as a picture in the chat.
- **Register your pump.** The login screen offers it to someone with no login. It sends an enrolment request to MDG and appears on the admin's Registrations page; staff still create the account.

### Should have

- Admin filters/sort by priority, category, status, aging.

### Could have

- Saved replies / templates for admins.

### Won't have (this release)

- Dealer-visible priority/category.
- Multiple simultaneous open tickets within a single thread (one open `Ticket` per thread; later escalations are added to it).
- In-app payments / billing actions.
- Any WhatsApp / third-party chat channel for support — all communication is in-app.

---

## 7. The ticket & report model (in product language)

### Conversations → Tickets

A dealer is an **organisation** (a petrol pump) with one or more members — the owners and any manager. There are two kinds of chat (`Conversation.kind`):

- **Support** — one per owner, private to that owner and MDG.
- **Manager** — one group chat per outlet that has a manager. The manager, every owner and MDG are in it (`participantUserIds`). An owner therefore sees two chats; the manager sees one.

To staff, a conversation _is_ a ticket with a lifecycle and hidden triage metadata; the admin inbox lists them **grouped by organisation**. To the member, it is just their chat. Reports and service history belong to the organisation: a report goes to the owners' chats, the manager group, or both, as the admin chooses.

| Concept             | Dealer sees                                                                                                     | Staff sees                                                                     | Data field                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| Conversation status | (implicit — just a chat)                                                                                        | OPEN → ASSIGNED → RESOLVED                                                     | `Conversation.status`                           |
| Priority            | **nothing**                                                                                                     | low / normal / high / urgent                                                   | `Conversation.priority` (admin-only)            |
| Category            | **nothing**                                                                                                     | general / sales / compliance / billing / technical / onboarding                | `Conversation.category` (admin-only)            |
| Owner               | "someone from MDG"                                                                                              | assigned admin name                                                            | `assignedAdminId` / `assignedAdminName`         |
| Unread              | unread badge on chat                                                                                            | unread badge in queue                                                          | `unreadByDealer` / `unreadByAdmin`              |
| AI-raised ticket    | one line under the reply: "#42 · Sent to the MDG team" → "MDG team is looking at it" → "Closed by the MDG team" | Tickets page and a strip in the thread; closed only by an admin's written note | `Ticket` (`ai.ticketId` on the handoff message) |

> **Rule:** `priority` and `category` are triage tools for staff. They are **never rendered to dealers** in any client.

A `Ticket` is separate from the conversation's status. The AI opens one whenever it hands a question to a person. Only an admin's resolve note closes it — no reply, pickup, chat resolve, later AI answer or dealer message does (ADR 0017). The conversation flow and its reply clock are in `docs/specs/ticket-lifecycle-and-reply-sla.md`.

### Reports and asks

There is no Records shelf. A **report** is a picture or a file message in the chat; the admin side records what was shared, when, and to whom. Old records were moved into the chat by a one-off migration on 13 Oct 2026 (ADR 0018).

An **ask** is an MDG message that carries a reference: `doc:<askId>` (a paper), `reg:<YYYY-MM-DD>` (the density register page for that day) or `kv:<kavachItemId>` (a Kavach photo). The dealer answers with a picture or PDF sent as a reply to the ask; MDG sees it under **Open requests** (ADR 0019).

---

## 8. User stories & acceptance criteria

### 8.1 First login & onboarding (dealer)

**As Ramesh, I want to land somewhere I instantly understand, so I'm not scared off.**

> Onboarding is admin-led and app-first (7 steps: collect-phone, send-welcome, send-terms-link, send-pdf, receive-payment-and-gst, assign-code, **issue-app-login**). At the final step the admin creates the dealer owner's app login (email + password) and shares the credentials — there is no WhatsApp group. Additional members (managers) are added later as `dealer-staff` with `title: "Manager"`, each receiving their own login.

- **AC0:** The owner receives a working app login (email + password) from staff; the dealer `code` (e.g. `15E`) identifies the organisation.
- **AC1:** On first login the dealer lands on the **chat list**, then taps into their chat — no setup wizard, no empty dashboard, no tour.
- **AC2:** The empty chat shows "How can we help?" and two **quick-action chips**, "Report an issue" and "Request a service", that start a message.
- **AC3:** Once the chat has messages, two chips above the empty box fill it: "Today's report?" and "What do I need to do?". Tapping a chip needs no typing.
- **AC4:** No admin-only concepts (priority, category, ticket, queue) appear anywhere.
- **AC5:** Reachable and usable in the Expo WebView app and mobile browser without horizontal scroll.

### 8.2 Sending a query with a photo (dealer)

**As Sunita, I want to send a meter photo with my question, so staff see the issue immediately.**

- **AC1:** From the composer the dealer opens the attach sheet — Document, Camera or Gallery — or records a voice note.
- **AC2:** A message may contain a body, attachments, or both (per `sendMessageSchema`). An empty message cannot be sent: until there is something to send, the Send button is the mic.
- **AC3:** Attachments up to 25 MB and up to 10 per message are accepted; going over 10 is explained in plain language, not dropped silently.
- **AC4:** The message appears at once with a sending clock, then a sent + delivered indicator. If it fails, the words or photo come back into the box and a plain-language note says the message did not go through.
- **AC5:** Staff receive the message in real time (`message:new`) and the conversation surfaces as unread in their queue.

### 8.3 A DSR picture arrives in my chat (dealer)

**As Ramesh, I want my Daily Sales Report to arrive in my chat, so I never hunt for it.**

- **AC1:** When the DSR is ready, it appears in the chat as an ordinary incoming picture from MDG, in real time, with one short line in the member's language.
- **AC2:** Tapping the picture opens it full-screen: pinch to zoom, swipe to the next or the last picture, download.
- **AC3:** A push notification fires in the Expo app, and a tap opens that exact chat.
- **AC4:** Past reports are found by scrolling the chat or on its media page (`/chat/:id/media`).
- **AC5:** A report sent to the whole outlet reaches every owner's chat and the manager group, as the admin chose.

### 8.4 MDG asks me for a paper or a photo (dealer)

**As Sunita, I want to be asked for a paper or a photo in the chat and answer it there, so I don't hunt through screens.**

- **AC1:** Every request MDG has of the dealer — a document, a Kavach photo, yesterday's density register page — arrives as a message in the chat with a **Send photo** button (फ़ोटो भेजें in Hindi).
- **AC2:** Tapping the button opens the camera inside the tap; the picture goes through the usual preview and is sent as a reply linked to the ask. A second button, **Choose from gallery** (or **Choose file** for a paper), covers a picture already taken. Swiping to reply on the ask with a picture links it too.
- **AC3:** The ask shows where it stands: waiting for the dealer, **Sent — MDG is checking**, **Received**, or **MDG sent it back** with the reason read word for word.
- **AC4:** The density register page is received automatically, and MDG replies "✓ Received" under the photo. It is asked each morning at 09:00 IST for the day before, and only of outlets whose TT Density service is active.
- **AC5:** A paper or a Kavach photo waits for a person at MDG to mark it received. The dealer never certifies anything (ADR 0011).
- **AC6:** A voice note or plain words are never taken as an answer; they are an ordinary message and a person reads them.

### 8.5 Admin handling a ticket (pick up / triage / resolve)

**As Arjun, I want to own and triage a dealer's request, so nothing falls through the cracks.**

- **AC1:** Incoming dealer messages appear in the queue marked unread (`unreadByAdmin`).
- **AC2:** Arjun can **pick up** a conversation, setting status to `ASSIGNED` and `assignedAdminId` to himself (`assignConversationSchema`).
- **AC3:** Arjun can set **priority** (low/normal/high/urgent) and **category** (general/sales/compliance/billing/technical/onboarding) via `updateTicketSchema`; both persist on the conversation.
- **AC4:** Replying clears the dealer-facing unread and notifies the member in real time, and (if they have a registered device) sends a push notification.
- **AC5:** Arjun can **resolve** the conversation (status `RESOLVED`), but only by logging the service provided — he picks a `serviceId` from the service catalog (or `'other'` + a free-text `serviceName`) and writes required `notes`; resolution creates a `ServiceLog` and posts a "Resolved —" line into the chat. A later member message can reopen it. The member receives a push on resolution.
- **AC6:** Priority/category changes are write-audited and never sent to dealer clients.
- **AC7:** The logged service appears in that dealer's "services provided" history on the dealer detail page (shared at the organisation level).
- **AC8:** A ticket the AI opened appears on the Tickets page and as a strip in the thread. Replying marks it seen; only a written resolve note closes it.

### 8.6 Admin sends a report to the outlet and handles asks

**As Arjun, I want to send a document to the right people in one step and mark what dealers send back, so the dealer gets it where they already look.**

- **AC1:** In the composer, Arjun attaches a file with a caption and picks **Send to**: This chat (the default, and what it returns to after every send), Owners, Manager or Both.
- **AC2:** Anything but "This chat" posts one copy per chat, as Arjun, with the usual unread marks and one push per person.
- **AC3:** A dealer's picture or file shows **Mark received…** and **Send back…** in its menu. The thread's **Open requests** card lists what MDG is waiting on and what the dealer sent that needs checking.
- **AC4:** **Send back** needs a reason of at least four characters; the dealer reads it word for word and gets the Send photo button again under it.
- **AC5:** Mark received is offered only on a photo the admin can see. A paper that runs out asks for the date printed on it.
- **AC6:** A share to the outlet, a receive and a send-back are each audited.

### 8.7 The AI answers first; a person takes what it can't (dealer and admin)

**As Ramesh, I want a quick answer at any hour; as Arjun, I want only the questions that need a person.**

- **AC1:** The AI first line replies at once in the member's language, with a small "Instant reply" note on the same line as the time. Nothing says "AI" or "bot".
- **AC2:** It speaks only about the outlet of the chat it is in, and every reply is cleared for the lowest-clearance person who can read that chat: an owner's own chat is cleared for owners, the manager group is cleared for the manager.
- **AC3:** When it cannot settle a question it says so and opens a ticket. The same applies to a voice note or a PDF it cannot place.
- **AC4:** One open ticket per thread; a second escalation is added to it as a follow-up.
- **AC5:** The dealer sees "#N · Sent to the MDG team", then "MDG team is looking at it", then "Closed by the MDG team". An admin's reply marks the ticket seen but never closes it.
- **AC6:** Once an admin has picked a chat up, or has written in it within the last hour, the AI stays out. MDG's own system lines — asks, the daily line, "✓ Received" — do not count as a person.

---

## 9. Adoption & anti-intimidation

> This is the product. Features that erode approachability are bugs, regardless of utility.

**Design principles**

1. **Chat is the whole product.** If something important needs a second screen, redesign it. **Settings (⋮) is the only secondary surface.** It holds what a dealer sets once (language, password, team); anything MDG asks for is asked in the chat.
2. **No empty rooms.** Every screen — especially the first — offers a next action. An empty chat shows quick-action chips so a dealer is never staring at a blank box.
3. **Speak human, hide the machine.** Never show dealers the words _ticket, priority, category, queue, SLA, resolved_. They see a conversation, a number and a quiet line.
4. **Thumb-first, big targets.** Mobile-first layout, large tap targets, minimal typing, camera/gallery one tap away.
5. **Plain labels over jargon.** "Daily Sales Report," not "DSR." "Document," not "asset/artifact."
6. **Forgiving by default.** Gentle inline hints instead of error codes; recoverable uploads; nothing punishes a wrong tap.
7. **Fast first win.** A new dealer should send a useful message within ~2 minutes, using a chip if they don't want to type.

**Anti-patterns we explicitly reject**

- Onboarding wizards, tours, or multi-step setup before the dealer can do anything.
- Dashboards, tabs, or settings as the dealer's landing screen.
- Showing internal triage state to dealers.
- English-only dense forms; required fields the dealer doesn't understand.
- Notifications that link to a screen other than the relevant chat.

### The Do-not list

Twelve patterns that scare a 40–60yo owner on a cheap Android with a patchy network. They come from the June 2026 adoption audit of the dealer app. Check every new screen and every new message against them.

1. **Do not show raw errors or codes.** Never `Upload failed: 500`, `Network request failed`, stack-like strings or HTTP numbers. One warm sentence and what to do next.
2. **Do not use machine words.** No _ticket, record, sync, upload, queue, SLA, priority, category, resolved, cadence, asset, status: ACTIVE_. Say _report, document, message, send, runs weekly, Active/Paused_.
3. **Do not show ALL-CAPS enum values.** "ACTIVE", "INACTIVE", "SUSPENDED" leak the database. Map them to friendly words.
4. **Do not show a slug or an ID where a name belongs.** A service's id as a headline reads as broken.
5. **Do not make the dealer start anything.** Chats are created for them; never a "New chat" button.
6. **Do not present empty rooms.** Every screen offers a next action, or a warm "we'll message you" and a way to reach a person.
7. **Do not dead-end.** Every error offers "message us in Chat" — in the app, not a phone call that pulls them out of it.
8. **Do not stack modals or confirm reversible actions.** Act at once and offer an Undo, rather than "Are you sure?".
9. **Do not rely only on a disappearing toast for message or upload state.** The dealer must be able to see a stuck message and retry it in place.
10. **Do not pile on required fields the dealer doesn't understand.** Don't ask an owner to invent a "temporary password".
11. **Do not blame the user.** "That email or password didn't work", not "Invalid credentials"; "didn't go through", not "you failed to send".
12. **Do not make them type when a tap will do.** Keep quick-action chips and a one-tap camera and gallery path.

### Fixes still open

Checked against the dealer app and the backend on 15 Oct 2026:

- **No show-password eye** on the login and change-password fields. Hidden dots on a cheap keyboard turn a typo into a lockout.
- **The owner must invent a temporary password** to add a manager (Settings → Your team). Auto-generate it, or send an invite link. (Rule 10.)
- **Pausing a teammate is instant, with no Undo.** It should offer "Teammate paused — Undo". (Rule 8.)
- **A failed send has no in-place retry.** The bubble is removed, the words or photo go back into the box, and a toast says it did not go through. A "tap to retry" bubble would show where the message is stuck. (Rule 9.)
- **The resolve notice uses a banned word.** The chat line reads "Resolved — <service>" (English only, even for a Hindi reader) and the English push title reads "Request resolved". (Rule 2 and principle 3.)

Closed since the audit: services show their names, not their ids; going over 10 files says so; the change-password form has its own page (Settings → Account). The naming question is settled: the app is Dealer Kavach, and "MDG" is the team that answers.

**How we measure it:** time-to-first-message, % sessions ending in a sent message, report read rate, and qualitative "could you do it without help?" checks with real 40–60yo dealers during pilot.

---

## 10. Constraints & dependencies (reflected in scope)

- **Roles:** `admin`, `dealer-owner`, `dealer-staff` (managers = `dealer-staff` with `title: "Manager"`). Admin-only fields must be filtered out of dealer responses server-side.
- **Members & scoping:** A dealer (org) has many members. Each owner has a private support chat; the manager chat is a group of the manager and all owners (`Conversation.kind`, `participantUserIds`). Service history is org-shared (`dealerId`). Chat scoping is enforced server-side.
- **Automated and manual services:** Nine service plugins generate reports and checks. Hand-resolved requests are logged by staff as a `ServiceLog`.
- **Mobile + Expo WebView:** Client is mobile-first and must function inside the WebView shell with a native push bridge (token register/unregister + deep-link taps).
- **Push delivery:** Implemented via the Expo Push API (`PUSH_ENABLED`); `Device` tokens registered via `POST/DELETE /api/v1/devices`.
- **Languages:** Every dealer-facing string is written in Hindi and English (ADR 0008). The admin stays English.
- **Data contract:** Implementations conform to `@dk/shared` types/schemas (`Conversation`, `Message` with `ask` and `answersAsk`, `TicketView`, `TicketDealerView`, `MessageAsk`, `ChatAskState`, `DealerOpenRequest`, `ServiceLog`, `Device`, `updateTicketSchema`, `sendMessageSchema`, resolve/service-log/device schemas, socket events). Product changes that touch these must update the shared package first, in all four copies.

---

## 11. Open questions

- Should a resolved conversation auto-reopen on any dealer message, or only on a new query (vs. a "thank you")? Today any message reopens it (`LIMITATIONS.md`).
- Do we need per-dealer-staff vs. dealer-owner permission differences in v1, or is read-parity fine?
- Retention denominator: count report reads as "active," or messages only?
