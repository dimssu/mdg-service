# MDG — Product Requirements Document

**Status:** Draft v1 · **Owner:** Product · **Last updated:** 2026-06-19

> MDG turns the messy reality of fuel-dealer support — a tangle of scattered chats, phone calls, and lost paperwork — into one calm app where every dealer member asks for help and the organisation receives its records. We win on _approachability_, not feature count.

---

## 1. Vision

Every fuel/petroleum dealer in India should be able to get an answer and find a document by doing the one thing they already know how to do: **send a message**. MDG is a chat-first support and records platform that feels as easy as a familiar messaging app but works like a real CRM and ticketing system behind the glass — all inside our own app, no third-party chat.

- **For dealers:** one screen. Ask a question, attach a photo, get your Daily Sales Report. Each member of a pump gets their own private chat with support; the pump's records are shared across the team. Nothing to learn.
- **For staff (admin):** a structured inbox where every dealer member's message becomes a triageable ticket (priority, category, assignment, resolution) grouped by organisation, where records are delivered per dealer with one upload, and where resolving a request logs the service provided.

We are deliberately replacing scattered-chat chaos with something _more humane_ — not more powerful-looking — and we own the whole experience in-app so there is one front door, not several.

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

| Persona                   | Role                                | Age / Tech comfort                    | Goals                                                                                             | Frustrations                                       |
| ------------------------- | ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Ramesh — Pump Owner**   | `dealer-owner`                      | 52, low. Uses chat apps & calls only. | Get answers fast; receive his DSR & invoices; not feel stupid                                     | Apps with menus, logins, jargon, English-heavy UI  |
| **Sunita — Pump Manager** | `dealer-staff` (`title: "Manager"`) | 34, medium. Comfortable on phone.     | Raise day-to-day queries in her own chat, send meter photos, fetch documents                      | Re-explaining the same issue to different people   |
| **Arjun — Support Agent** | `admin` (staff)                     | 28, high.                             | Pick up tickets, triage by priority/category, resolve fast, deliver records, log the service done | Context-switching across scattered chats; no queue |
| **Priya — Support Lead**  | `admin` (staff)                     | 35, high.                             | See the queue, ensure nothing rots, report on resolution time                                     | No visibility into volume, aging, or who owns what |

Primary design target: **Ramesh.** If Ramesh can use it unassisted, everyone can.

---

## 4. Goals & Non-Goals

### Goals

- Make **chat the dealer's main and only required screen**; everything reachable from it.
- Convert every dealer message into a **structured ticket** staff can triage and resolve.
- Deliver **records** (DSR, invoices, compliance, statements) as **in-chat cards** plus a simple **Records shelf**.
- Be usable by a non-technical 40–60yo owner **without training**.
- Work **mobile-first** and inside the **Expo WebView app**.

### Non-Goals (for this release)

- **Automated record generation.** Staff upload records manually, per dealer. Automation is a later phase.
- A dealer-facing analytics dashboard or BI.
- Dealer-visible ticket fields. `priority` and `category` are **admin-only**, never shown to dealers.
- Multi-language UI beyond the initial launch language(s) (planned, not committed here).
- Self-serve dealer signup. Dealers are provisioned by staff, who issue each member an app login (email + password) during onboarding.
- Threaded conversations / multiple simultaneous tickets in a single member's chat (one private thread per member; one ticket at a time per thread).

---

## 5. Success metrics

| Metric                     | Definition                                                                 | Target (90 days post-launch) |
| -------------------------- | -------------------------------------------------------------------------- | ---------------------------- |
| **Adoption %**             | Provisioned dealers who send ≥1 message                                    | ≥ 70%                        |
| **Time-to-first-message**  | First login → first sent message                                           | Median ≤ 2 min               |
| **Ticket resolution time** | `OPEN`/`ASSIGNED` → `RESOLVED`                                             | Median ≤ 4 working hours     |
| **DSR open rate**          | DSR record cards opened ÷ delivered                                        | ≥ 60% within 24h             |
| **Retention**              | Dealers active (≥1 message OR ≥1 record opened) in a rolling 30-day window | ≥ 50% month-over-month       |
| Anti-intimidation proxy    | Sessions ending in a sent message vs. silent drop-off                      | ≥ 80%                        |

---

## 6. Feature list (MoSCoW)

### Must have

- Chat-first dealer home: each member has their **own private conversation**, send text + image/file attachments.
- Quick-action chips on empty state (e.g. "Ask about my DSR", "Report a problem", "Send a photo").
- In-chat **record cards** (`RecordCard`) that open the underlying `DealerRecord`.
- **Records shelf** grouped by `RecordType` (DSR, Invoice, Compliance, Statement, Document), **shared across all members of the organisation**.
- Admin 3-pane inbox: queue (conversations per member, grouped by organisation) → conversation → dealer/ticket detail.
- Ticket triage: pick up (assign), set `priority`, set `category`, resolve **with a required service log**.
- **Manual service logging** (`ServiceLog`): resolving a request records the service provided (catalog `serviceId` or `'other'` + name, plus notes), building a per-dealer "services provided" history on the admin dealer detail page.
- Admin **upload a record** per dealer, optionally announcing it in chat (`announceInChat`); records fan out to every org member.
- Three roles: `admin`, `dealer-owner`, `dealer-staff` (managers = `dealer-staff` with `title: "Manager"`).
- App login issuance at onboarding (email + password); the dealer `code` (e.g. `E01`) is the friendly org identifier.
- Real-time delivery via sockets (`message:new`, `record:new`, `conversation:updated`).
- **Push notifications** via the Expo native bridge on admin replies, new records, and resolutions (`Device` model + `POST/DELETE /api/v1/devices`, `PUSH_ENABLED`).
- Read receipts / unread indicators (`unreadByAdmin`, `unreadByDealer`).

### Should have

- System messages ("Your DSR is ready") rendered distinctly (`message.system`).
- Typing indicators.
- Admin filters/sort by priority, category, status, aging.
- Record period labels ("March 2026", "14 Mar 2026") for scannability.

### Could have

- Saved replies / templates for admins.
- Dealer profile self-edit (name, phone, avatar).
- Search across a dealer's records.
- Bulk record upload across multiple dealers.

### Won't have (this release)

- Automated/scheduled record generation.
- Dealer-visible priority/category.
- Multiple simultaneous open tickets within a single member's chat.
- In-app payments / billing actions.
- Any WhatsApp / third-party chat channel — all communication is in-app.

---

## 7. The records & ticket model (in product language)

### Conversations → Tickets

A dealer is an **organisation** (a petrol pump) with one or more members — the owner and any managers. **Each member has their own private conversation** with support (`Conversation.userId`, unique per member). To staff, that conversation _is_ a ticket with a lifecycle and hidden triage metadata; the admin inbox lists these per member, **grouped by organisation**. To the member, it is just their chat. **Records and service history are shared at the organisation level** across all members — only the chat thread is private.

| Concept             | Dealer sees              | Staff sees                                                      | Data field                              |
| ------------------- | ------------------------ | --------------------------------------------------------------- | --------------------------------------- |
| Conversation status | (implicit — just a chat) | OPEN → ASSIGNED → RESOLVED                                      | `Conversation.status`                   |
| Priority            | **nothing**              | low / normal / high / urgent                                    | `Conversation.priority` (admin-only)    |
| Category            | **nothing**              | general / sales / compliance / billing / technical / onboarding | `Conversation.category` (admin-only)    |
| Owner               | "someone from MDG"       | assigned admin name                                             | `assignedAdminId` / `assignedAdminName` |
| Unread              | unread badge on chat     | unread badge in queue                                           | `unreadByDealer` / `unreadByAdmin`      |

> **Rule:** `priority` and `category` are triage tools for staff. They are **never rendered to dealers** in any client.

### Records

A **record** is a document delivered to a dealer. Staff upload it manually (for now). It appears two ways: as an **in-chat card** and on the **Records shelf**.

| Record type  | Label (dealer-facing, plain language) | Field               |
| ------------ | ------------------------------------- | ------------------- |
| `dsr`        | Daily Sales Report                    | `DealerRecord.type` |
| `invoice`    | Invoice                               |                     |
| `compliance` | Compliance                            |                     |
| `statement`  | Statement                             |                     |
| `other`      | Document                              |                     |

- Each record carries a `title`, optional `periodLabel`, optional `note`, and an `attachment`.
- On upload with `announceInChat: true`, a `RecordCard` message is posted into the dealer's conversation.
- The Records shelf groups a dealer's records by type for one-tap retrieval.

---

## 8. User stories & acceptance criteria

### 8.1 First login & onboarding (dealer)

**As Ramesh, I want to land somewhere I instantly understand, so I'm not scared off.**

> Onboarding is admin-led and app-first (7 steps: collect-phone, send-welcome, send-terms-link, send-pdf, receive-payment-and-gst, assign-code, **issue-app-login**). At the final step the admin creates the dealer owner's app login (email + password) and shares the credentials — there is no WhatsApp group. Additional members (managers) are added later as `dealer-staff` with `title: "Manager"`, each receiving their own login.

- **AC0:** The owner receives a working app login (email + password) from staff; the dealer `code` (e.g. `E01`) identifies the organisation.
- **AC1:** On first login the dealer lands directly on **their own** chat screen — no setup wizard, no empty dashboard.
- **AC2:** The empty state shows a short friendly greeting and **quick-action chips** that pre-fill or start a message.
- **AC3:** Tapping any chip produces a ready-to-send or sent message with zero typing required to get unstuck.
- **AC4:** No admin-only concepts (priority, category, ticket, queue) appear anywhere.
- **AC5:** Reachable and usable in the Expo WebView app and mobile browser without horizontal scroll.

### 8.2 Sending a query with a photo (dealer)

**As Sunita, I want to send a meter photo with my question, so staff see the issue immediately.**

- **AC1:** From the chat composer the dealer can attach an image (camera or gallery) — supported via presign + `image` attachment kind.
- **AC2:** A message may contain a body, attachments, or both (per `sendMessageSchema`); empty messages are rejected with a gentle inline hint.
- **AC3:** Attachments up to 25 MB and up to 10 per message are accepted; oversize is explained in plain language.
- **AC4:** The image shows an upload/sending state, then a sent + delivered indicator.
- **AC5:** Staff receive the message in real time (`message:new`) and the conversation surfaces as unread in their queue.

### 8.3 Receiving a DSR (dealer)

**As Ramesh, I want my Daily Sales Report to arrive in my chat, so I never hunt for it.**

- **AC1:** When staff upload a DSR with announce-in-chat on, a record card appears in the dealer's conversation in real time (`record:new` / `message:new`).
- **AC2:** The card shows the plain label "Daily Sales Report" and the period (e.g. "14 Mar 2026").
- **AC3:** Tapping the card opens/downloads the document via a signed URL.
- **AC4:** A push notification fires in the Expo app ("Your Daily Sales Report is ready").
- **AC5:** The same record is now visible on the Records shelf under "Daily Sales Report".

### 8.4 Browsing records (dealer)

**As Ramesh, I want a simple place to find past documents, so I don't scroll the chat.**

- **AC1:** The Records shelf is reachable from chat in one tap and lists records grouped by type.
- **AC2:** Each group shows the most recent records first with title + period label.
- **AC3:** Empty groups are hidden or show a calm "Nothing here yet" line.
- **AC4:** Opening a record uses the same signed-URL flow as the in-chat card.
- **AC5:** No ticket/triage language appears on the shelf.

### 8.5 Admin handling a ticket (pick up / triage / resolve)

**As Arjun, I want to own and triage a dealer's request, so nothing falls through the cracks.**

- **AC1:** Incoming dealer messages appear in the queue marked unread (`unreadByAdmin`).
- **AC2:** Arjun can **pick up** a conversation, setting status to `ASSIGNED` and `assignedAdminId` to himself (`assignConversationSchema`).
- **AC3:** Arjun can set **priority** (low/normal/high/urgent) and **category** (general/sales/compliance/billing/technical/onboarding) via `updateTicketSchema`; both persist on the conversation.
- **AC4:** Replying clears the dealer-facing unread and notifies the member in real time, and (if they have a registered device) sends a push notification.
- **AC5:** Arjun can **resolve** the conversation (status `RESOLVED`), but only by logging the service provided — he picks a `serviceId` from the service catalog (or `'other'` + a free-text `serviceName`) and writes required `notes`; resolution creates a `ServiceLog`. A later member message can reopen it. The member receives a push on resolution.
- **AC6:** Priority/category changes are write-audited and never sent to dealer clients.
- **AC7:** The logged service appears in that dealer's "services provided" history on the dealer detail page (shared at the organisation level).

### 8.6 Admin uploading a record

**As Arjun, I want to deliver a document to a dealer in one step, so the dealer gets it where they already look.**

- **AC1:** From a dealer's detail/conversation, Arjun selects a dealer, a record `type`, a `title`, optional `periodLabel`/`note`, and an attachment (`createRecordSchema`).
- **AC2:** With `announceInChat` on (default), a record card is posted to that dealer's conversation.
- **AC3:** The record immediately appears on that dealer's Records shelf.
- **AC4:** Upload uses presigned S3; failures are recoverable without losing entered metadata.
- **AC5:** The action is attributed (`uploadedByAdminId` / `uploadedByName`) and audited.

---

## 9. Adoption & anti-intimidation

> This is the product. Features that erode approachability are bugs, regardless of utility.

**Design principles**

1. **Chat is the whole product.** If something important needs a second screen, redesign it. The Records shelf is the only secondary surface, and it is one tap from chat.
2. **No empty rooms.** Every screen — especially the first — offers a next action. Empty chat shows quick-action chips so a dealer is never staring at a blank box.
3. **Speak human, hide the machine.** Never show dealers the words _ticket, priority, category, queue, SLA, resolved_. They see a conversation and their documents.
4. **Thumb-first, big targets.** Mobile-first layout, large tap targets, minimal typing, camera/gallery one tap away.
5. **Plain labels over jargon.** "Daily Sales Report," not "DSR." "Document," not "asset/artifact."
6. **Forgiving by default.** Gentle inline hints instead of error codes; recoverable uploads; nothing punishes a wrong tap.
7. **Fast first win.** A new dealer should send a useful message within ~2 minutes, using a chip if they don't want to type.

**Anti-patterns we explicitly reject**

- Onboarding wizards, tours, or multi-step setup before the dealer can do anything.
- Dashboards, tabs, or settings as the dealer's landing screen.
- Showing internal triage state to dealers.
- English-only dense forms; required fields the dealer doesn't understand.
- Notifications that link to a screen other than the relevant chat/record.

**How we measure it:** time-to-first-message, % sessions ending in a sent message, DSR open rate, and qualitative "could you do it without help?" checks with real 40–60yo dealers during pilot.

---

## 10. Constraints & dependencies (reflected in scope)

- **Roles:** `admin`, `dealer-owner`, `dealer-staff` (managers = `dealer-staff` with `title: "Manager"`). Admin-only fields must be filtered out of dealer responses server-side.
- **Members & scoping:** A dealer (org) has many members; each member has a private conversation (`Conversation.userId`, unique). Records and service history are org-shared (`dealerId`). Member-level chat scoping is enforced server-side.
- **Manual records & services:** No generation pipeline this release; staff upload records and log services per dealer by hand.
- **Mobile + Expo WebView:** Client is mobile-first and must function inside the WebView shell with a native push bridge (token register/unregister + deep-link taps).
- **Push delivery:** Implemented via the Expo Push API (`PUSH_ENABLED`); `Device` tokens registered via `POST/DELETE /api/v1/devices`.
- **Data contract:** Implementations conform to `@dk/shared` types/schemas (`Conversation`, `Message`, `DealerRecord`, `RecordCard`, `ServiceLog`, `Device`, `createRecordSchema`, `updateTicketSchema`, `sendMessageSchema`, resolve/service-log/device schemas, socket events). Product changes that touch these must update the shared package first.

---

## 11. Open questions

- Should a resolved conversation auto-reopen on any dealer message, or only on a new query (vs. a "thank you")?
- Do we need per-dealer-staff vs. dealer-owner permission differences for records in v1, or is read-parity fine?
- What is the launch language set, and does anti-intimidation require it at GA rather than fast-follow?
- Retention denominator: count record-opens as "active," or messages only?
