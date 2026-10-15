# MDG — User Acceptance Test (UAT) Plan

**Status:** v2 · **Owner:** UAT · **Last updated:** 2026-10-15

Reports retired (ADR 0018); asks live in the chat (ADR 0019); the AI first line and
tickets (ADR 0013, ADR 0017).

This plan verifies that MDG does what real users need, mapped to the PRD user
stories (§8) and `ARCHITECTURE.md`. Each scenario names the **persona** who
runs it, **preconditions**, **numbered steps**, the **expected result**, and a
**pass/fail box** to tick during a test session.

## How to use this document

1. Pick an environment and confirm the backend is healthy first:
   `bash mdg-backend/scripts/smoke.sh https://api.mdgservices.in`
2. Run scenarios top to bottom. Some depend on earlier ones (e.g. a report must
   be sent before a dealer can open it).
3. For each step, tick **PASS** or **FAIL**. If FAIL, capture what you saw
   (screenshot, console error, network response) in the Notes line.
4. The "first-time intimidated dealer" walkthrough (§A) is run **silently** —
   the observer watches and counts confusion points, giving no help.

## Personas under test

| Persona | Role                                | Where they work       | Login surface    |
| ------- | ----------------------------------- | --------------------- | ---------------- |
| Arjun   | `admin`                             | mdg-admin (web)       | mdg-admin login  |
| Ramesh  | `dealer-owner`                      | mdg-client / Expo app | mdg-client login |
| Sunita  | `dealer-staff` (`title: "Manager"`) | mdg-client / Expo app | mdg-client login |

Ramesh and Sunita belong to the **same dealer organisation** (petrol pump).
Ramesh has his own 1:1 support chat with MDG. Sunita, the manager, has the
**manager group chat**, which every owner of the pump also joins — so Ramesh sees
two chats and Sunita sees one. Service history is shared across the org. Each
member signs in with an email + password login issued by staff during onboarding
(there is no WhatsApp group).

## Environments / fixtures

- **Backend:** `https://api.mdgservices.in` (REST `/api/v1`, Socket.IO at
  `/socket.io`, default path).
- **Admin web:** mdg-admin (Vercel).
- **Dealer web:** mdg-client (Vercel), mobile-first.
- **Expo app:** mdg-app — WebView wrapping mdg-client + native push bridge.
- **Test dealer:** one provisioned dealer organisation with a `dealer-owner`
  (Ramesh) and a manager `dealer-staff` `title: "Manager"` (Sunita) — each with
  their own app login (email + password). Ramesh has a 1:1 support chat; Sunita
  has the manager group chat that Ramesh also joins. Dealers cannot create
  accounts — staff issue each member's login in the app-first onboarding flow
  (final step: `issue-app-login`); the app's "Register your pump" only sends an
  enrolment request.
- **Login response contract:** `POST /api/v1/auth/login` returns
  `{ ok: true, data: { token, user, admin? } }`.

## Glossary mapping (product language vs. data fields)

| Dealer sees                  | Admin sees                               | Data field                                           |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| my chat with MDG             | one 1:1 thread per owner, grouped by org | `Conversation.userId` (unique)                       |
| the manager chat             | one group thread per pump                | `Conversation.kind: 'manager'`, `participantUserIds` |
| just a chat                  | OPEN / ASSIGNED / RESOLVED               | `Conversation.status`                                |
| (nothing)                    | Low/Normal/High/Urgent                   | `Conversation.priority`                              |
| (nothing)                    | general/sales/compliance/…               | `Conversation.category`                              |
| a report picture             | a file message sent with Send to         | `Message.attachments`                                |
| "Send photo" button          | Open requests card                       | `Message.ask`, `Message.answersAsk`                  |
| "#42 · Sent to the MDG team" | Tickets page, ticket strip               | `Ticket`                                             |
| (nothing)                    | services-provided history                | `ServiceLog` (org-shared)                            |
| (a notification)             | push on reply/resolve/ask                | `Device.expoPushToken`                               |
| unread badge                 | unread dot in queue                      | `unreadByDealer` / `unreadByAdmin`                   |

---

## Scenario index

| #   | Scenario                                                    | Persona         | PRD story    |
| --- | ----------------------------------------------------------- | --------------- | ------------ |
| 1   | Dealer first login & onboarding (chat list, then chat)      | dealer-owner    | §8.1         |
| 2   | Auth & roles — permitted and forbidden paths                | all             | §10, §7      |
| 3   | Send a query with a photo                                   | dealer-staff    | §8.2         |
| 4   | Admin pick up → priority/category → reply → resolve         | admin           | §8.5         |
| 5   | Reopen a resolved conversation                              | dealer + admin  | §8.5 AC5     |
| 6   | Admin sends a report picture to the outlet                  | admin + dealers | §8.6, §8.3   |
| 7   | MDG asks for a paper in the chat; Mark received / Send back | dealer + admin  | §8.4, §8.6   |
| 8   | The morning density ask is received automatically           | dealer + admin  | §8.4 AC4     |
| 9   | Realtime delivery — no duplicate messages                   | admin + dealer  | §6           |
| 10  | Typing & read receipts                                      | admin + dealer  | §6           |
| 11  | Priority/category never leak to dealers                     | dealer-owner    | §7, §8.5     |
| 12  | Expo app — file picker, push delivery, offline, back        | dealer          | §10          |
| 13  | Mobile responsiveness (no horizontal scroll)                | dealer          | §8.1 AC5     |
| 14  | Owner chats, the manager group chat, org grouping           | admin + dealers | §7           |
| 15  | Service log on resolve + services-provided history          | admin           | §8.5 AC5/AC7 |
| 16  | AI first line answers; a ticket opens when it cannot        | dealer + admin  | §8.7         |
| A   | **First-time intimidated dealer** (confusion audit)         | dealer-owner    | §9           |

---

## 1. Dealer first login & onboarding — `dealer-owner` (Ramesh)

Maps to PRD §8.1. Validates a calm, chat-first landing with no setup wizard.

**Preconditions**

- Ramesh has been provisioned with an **app login (email + password)** by staff
  during onboarding (the `issue-app-login` step) — no WhatsApp group is involved.
- Ramesh has never logged in before.

**Steps**

1. Open mdg-client login on a phone-sized viewport. Enter Ramesh's credentials, submit.
2. Observe the first screen after login. Confirm it is the **chat list** — his chats,
   WhatsApp-style, with no bottom bar — and that Settings is behind the ⋮ menu.
3. Confirm there is no setup wizard, tour, dashboard, or empty form. Open his chat
   with MDG.
4. Read the empty-state copy. Confirm it shows a friendly greeting
   ("How can we help?") and a short helper line.
5. Confirm quick-action chips are present: **Report an issue** and
   **Request a service** (two chips — "Talk to support" was removed, ADR 0017).
   Once the chat has a message, two chips above the empty box ("Today's report?",
   "What do I need to do?") fill it.
6. Tap **Report an issue**. Confirm the composer is pre-seeded with that text,
   ready to send with zero typing.
7. Scan every visible label for admin-only words: ticket, priority, category,
   queue, SLA, assigned, resolved. Confirm none appear.

**Expected result**

Ramesh lands on the **chat list**, then opens his chat. Empty state greets him and
offers chips; tapping a chip seeds the composer. No admin/triage vocabulary
anywhere.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 2. Auth & roles — permitted and forbidden paths — all personas

Maps to PRD §10 and `ARCHITECTURE.md` (Security and roles: route-level RBAC, dealer scoping).

**Preconditions**

- Valid admin (Arjun), dealer-owner (Ramesh), dealer-staff (Sunita) accounts.
- Two different dealers (Dealer A = Ramesh/Sunita; Dealer B = another dealer).

**Steps**

1. Log in as Arjun (admin) on mdg-admin. Confirm 200 + a token is returned and
   the inbox loads.
2. Log in as Ramesh on mdg-client. Confirm 200 + token + chat loads.
3. As Ramesh, attempt to open the admin app URL / admin-only route. Confirm
   access is denied (no inbox, no dealer management).
4. As Ramesh, call `GET /api/v1/dealers/<Dealer B id>`. Confirm **403**
   (`Admins only`): a dealer token never reads a dealer record, its own or another's.
   4b. As Ramesh, open the **manager group chat** (`GET /api/v1/conversations/<its id>`).
   Confirm it **opens**: every owner of the pump is a participant. Then, as
   **Sunita**, attempt to open **Ramesh's 1:1 support chat**. Confirm it is refused
   (403, `Not a participant of this conversation`): a member reaches only a thread
   they own or belong to. Service history, by contrast, is shared at the org level.
5. As Ramesh, attempt `PATCH /api/v1/conversations/:id/ticket` (set priority).
   Confirm it is forbidden (admin-only write).
6. As Ramesh, attempt `POST /api/v1/conversations/:id/messages/share` (send to the
   outlet). Confirm forbidden (admin-only).
   6b. As Ramesh, attempt `POST /api/v1/service-logs` and `POST /conversations/:id/resolve`.
   Confirm both are forbidden (admin-only).
7. Submit a login with wrong password. Confirm a 401 (`Invalid credentials`) from the
   API, and that the app shows its own gentle sentence ("That email or password
   didn't work…"), not a stack trace or the raw code.
8. Submit a login with a malformed body. Confirm 400 (validation), not 500.
   (Automated by `smoke.sh` check 2.)

**Expected result**

Admin can reach admin surfaces and writes; dealers cannot. Dealer reads are
forced to their own `dealerId`; cross-dealer access and admin writes are
refused. Bad input fails gracefully.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 3. Send a query with a photo — `dealer-staff` (Sunita)

Maps to PRD §8.2 (`sendMessageSchema`, presign + image attachment).

**Preconditions**

- Sunita is logged into mdg-client. A meter photo is available on the device.

**Steps**

1. In the chat composer, type "Meter reading looks wrong, see photo".
2. Tap the attach control. Confirm a sheet offers **Document**, **Camera** and
   **Gallery**; choose the photo from Camera or Gallery. Confirm it goes through the
   send preview before it is sent.
3. Confirm the image shows a sending/upload state, then a sent indicator.
4. Confirm the message contains both the text body and the image.
5. With nothing typed and nothing attached, look at the Send button. Confirm it is
   the **mic**: an empty message cannot be sent. (The API also refuses it, 400.)
6. (Boundary) Attempt to attach an 11th attachment. Confirm the note "You can send
   up to 10 files at once", not a crash and not a silent drop. Then attach a file
   over 25 MB. The server refuses the upload (400), and the app says "We couldn't
   send <name>. Please check your network and try again." in place of a raw error.
7. Switch to Arjun's admin inbox. Confirm the new message appears in real time
   and the conversation is marked unread (`unreadByAdmin` dot).

**Expected result**

Image uploads via presign and sends with the text. Empty sends are not possible;
going over 10 files or 25 MB is refused in plain words. Admin sees it live and unread.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 4. Admin pick up → priority/category → reply → resolve — `admin` (Arjun)

Maps to PRD §8.5 (`assignConversationSchema`, `updateTicketSchema`).

**Preconditions**

- A dealer message exists, unread in the queue (from Scenario 3).
- Arjun is logged into mdg-admin.

**Steps**

1. Open the inbox. Confirm the dealer's conversation shows in the **Unassigned**
   filter with an unread dot, status badge **Open**.
2. Select the conversation. Click **Pick up**. Confirm status becomes
   **Assigned** and the header shows "Assigned to Arjun".
3. In the right context panel → **Triage** card, set **Priority = High**.
   Confirm it persists (reload the conversation; still High).
4. Set **Category = Technical**. Confirm it persists.
5. Type a reply in the composer and send. Confirm the dealer-facing unread is
   cleared and the member receives it in real time (verify on a dealer session),
   and a push notification fires to that member (if a device is registered).
6. Click **Resolve**. Confirm a **service-log dialog** appears and resolution is
   **blocked until a service is logged**: choose a service from the catalog
   (`GET /services`) — or **Other** + a free-text service name — and enter required
   **notes**. Confirm submitting with no service or empty notes is rejected.
   6b. Submit a valid service log. Confirm status becomes **Resolved**, the member
   gets a "resolved" push, and the logged service now appears in the dealer's
   **services-provided** history on the dealer detail page (org-shared).
7. Confirm the conversation now appears under the **Resolved** filter.

**Expected result**

Arjun owns, triages (priority + category persist), replies (clears dealer
unread, delivered live, pushes), and resolves the conversation through OPEN →
ASSIGNED → RESOLVED **only after logging the service provided**, which lands in
the dealer's services-provided history.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 5. Reopen a resolved conversation — dealer + admin

Maps to PRD §8.5 AC5 (a later dealer message can reopen) and PRD §11 open question.

**Preconditions**

- The conversation from Scenario 4 is **Resolved**.

**Steps**

1. As the dealer (Ramesh), open the chat. The conversation is resolved — note
   whether the composer is disabled or whether sending a new message is allowed.
   (The admin client disables its composer when `status === 'RESOLVED'`: "This chat
   is resolved — reopen to reply.")
2. Trigger a reopen path:
   - **Admin path:** As Arjun, click **Reopen** on the resolved conversation.
     Confirm status returns to **Open**, unassigned, and the composer re-enables.
   - **Dealer path:** As the dealer, send a new message — even "ok, thanks". Confirm
     the conversation reopens as **Open**, unassigned, and reappears in active
     filters. (A register-page photo sent to answer the morning ask is the one
     message that does not reopen it; see Scenario 8.)
3. Confirm the reopened conversation retains its history (messages, report
   pictures, and prior triage fields).

**Expected result**

A resolved conversation can be reopened (by admin, and by any new dealer
message), preserving full history. Record whether a trivial "thank you" should
have reopened it — this is PRD §11's open question.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 6. Admin sends a report picture to the outlet — `admin` (Arjun)

Maps to PRD §8.6 and §8.3 (`shareChatMessageSchema`,
`POST /conversations/:id/messages/share`, ADR 0018).

**Preconditions**

- Arjun is in Ramesh's conversation in mdg-admin. A DSR picture or PDF is ready.
- The test dealer has an owner (Ramesh) and a manager (Sunita) on the app, so the
  four **Send to** choices reach different people.

**Steps**

1. Attach the file with the paperclip and type a caption, "Daily Sales Report — 14
   Mar 2026". Confirm there is no "Upload report" button, no Reports card and no
   type, period or announce field: a report is a file sent in the chat.
2. Look at **Send to** above the box. Confirm the default is **This chat**
   ("Only the people in this chat").
3. Choose **Both** ("Every owner and the manager") and send. Confirm a one-line
   confirmation names who was reached, such as "Sent to 1 owner and the manager."
4. As Ramesh, confirm the picture arrives live in his own chat as an ordinary
   incoming picture from MDG, with the caption under it. Tap it: it opens
   full-screen; pinch to zoom; swipe to the next picture; download works.
5. As Sunita, confirm the same picture arrives in the manager group chat.
6. Confirm **Send to** went back to **This chat** after the send.
7. Repeat with **Owners** (only owners' own chats get it) and **Manager** (only the
   group chat gets it).
8. (Expo) Confirm one push per person, and that a tap opens the exact chat.
9. Confirm the message is from Arjun, not an anonymous notice, and that the share
   left an audit row (`CHAT_MESSAGE_SHARED`).

**Expected result**

A report reaches the people Arjun chose, as a plain picture in their chat, live and
with a push. Nothing in the dealer app is called a record, a shelf or a report type.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 7. MDG asks for a paper in the chat; Mark received / Send back — dealer + admin

Maps to PRD §8.4 and §8.6 (ADR 0019: `Message.ask`, `answersAsk`, the Open requests
card, `POST /conversations/:id/messages/:messageId/receive` and `/send-back`).

**Preconditions**

- A paper kind the dealer can see (for example Fire NOC) exists in the document
  catalog.
- Arjun is in mdg-admin; Sunita (or Ramesh) is in the app.

**Steps**

1. As Arjun, open Data Vault → Documents → **Ask for a document**. Pick the kind and
   this dealer; press **Ask**.
2. As the dealer, confirm an MDG message arrives live in the chat saying what is
   wanted, with a **फ़ोटो भेजें** button (**Send photo** if the app is in English).
   Confirm the app has no ask bar, no Papers screen and no Documents screen.
3. Tap the button. Confirm the camera opens inside the tap. Photograph a paper, pass
   the preview and send. Confirm the ask now reads **Sent — MDG is checking**.
4. As Arjun, open the dealer's thread. Confirm the **Open requests** card (the
   Details panel; on a phone the Details row reads "Details · 1 to check") lists the
   request as "Dealer sent it — check it", and the photo carries a chip "Answer to:
   <paper> — mark received".
5. Press **Show message**, look at the photo, then **Mark received**. If the paper
   runs out, confirm the dialog asks for the date printed on it and does not prefill
   it. Confirm.
6. Confirm MDG posts "✓ Received" under the dealer's photo, the dealer's ask reads
   **Received**, and the reply clock for that thread stops.
7. Ask for a second paper and answer it. This time press **Send back…**. Confirm a
   reason shorter than four characters is refused. Send a real reason.
8. As the dealer, confirm the reason is read word for word, a **Send photo** button
   sits right under it, and the first ask reads **MDG sent it back**.
9. (Boundary) As the dealer, answer an ask with a voice note or plain words only.
   Confirm it is an ordinary message: the ask stays open and a person reads it.

**Expected result**

Every request MDG makes is asked in the chat and answered there. A paper is received
only when a person at MDG says so; the dealer never certifies anything (ADR 0011).

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 8. The morning density ask is received automatically — dealer + admin

Maps to PRD §8.4 AC4 (ADR 0019).

**Preconditions**

- The test outlet's TT Density service is **active**, the scheduler is on, and it is
  after 09:00 IST. Yesterday's register page has not been received.
- Sunita is on the app. Arjun is in mdg-admin.

**Steps**

1. As Sunita, open the manager group chat (an outlet with no manager gets the ask in
   each owner's own chat instead). Confirm an MDG message asks for the density
   register page and names yesterday, with a **Send photo** button.
2. Confirm it arrived once. Come back the same day and confirm it was not posted a
   second time into the same chat.
3. Tap **Send photo**, photograph the register page and send, without typing a
   word. Confirm the ask flips to **Received** by itself and MDG posts "✓ Received"
   under the photo.
4. As Arjun, confirm the day has left the **Open requests** card, no push reached
   his phone, and the thread was not reopened and no reply clock started.
5. In the dealer's Data Vault → TT Density calendar, confirm that day is green with
   no blue ring and the day panel reads "Sent by the dealer".
6. If a second open day exists, send its register photo **with a typed note**.
   Confirm it is filed but handled as an ordinary message: the thread reopens and MDG
   is told.
7. (Boundary) Confirm an ask for a day more than a week old reads closed, with no
   **Send photo** button.

**Expected result**

The register page is asked each morning, answered with one photo, and received
without a person pressing anything. A page that arrives with words is also filed, but
a person reads the words.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 9. Realtime delivery — no duplicate messages — admin + dealer

Maps to `ARCHITECTURE.md` (Realtime: `message:new`, `conversation:updated`, rooms). This is
the explicit anti-duplicate regression check.

**Preconditions**

- Arjun (admin) and Ramesh (dealer) both have the same conversation open in
  separate sessions/devices.

**Steps**

1. Ramesh sends a message. Confirm it appears **exactly once** in Ramesh's own
   thread (no optimistic + socket double-render).
2. Confirm the same message appears **exactly once** in Arjun's inbox thread.
3. Arjun replies. Confirm it appears once on each side.
4. Send 5 messages rapidly from each side. Confirm message count matches sent
   count on both sides — no dupes, no drops, correct order.
5. Have Ramesh background/foreground the app (or reconnect the socket), then send
   again. Confirm reconnection does not replay/duplicate prior messages.
6. Open a second admin session on the same conversation; confirm a single send
   does not produce two rendered bubbles across the fan-out.

**Expected result**

Every message renders exactly once on every connected client, in order, with no
duplicates on optimistic send, fan-out, or reconnect.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 10. Typing & read receipts — admin + dealer

Maps to `ARCHITECTURE.md` (Realtime: `typing`, `read`) and PRD "Should have".

**Preconditions**

- Arjun and Ramesh both have the conversation open.

**Steps**

1. Ramesh starts typing. Confirm Arjun sees a typing indicator within ~1s.
2. Ramesh stops typing / sends. Confirm the typing indicator clears.
3. Arjun opens the conversation containing Ramesh's unread message. Confirm the
   unread indicator clears (read receipt / `readBy`).
4. Confirm the dealer side reflects read state appropriately (delivered/seen).

**Expected result**

Typing indicators appear and clear correctly; reading a message clears unread on
the appropriate side.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 11. Priority/category never leak to dealers — `dealer-owner` (Ramesh)

Maps to PRD §7 rule and §8.5 AC6 (admin-only fields stripped server-side).

**Preconditions**

- Arjun has set Priority=High, Category=Technical on Ramesh's conversation
  (Scenario 4).

**Steps**

1. As Ramesh, inspect the conversation in the UI. Confirm no priority/category
   badge or label appears.
2. As Ramesh, fetch the conversation via the dealer API
   (`GET` my conversation). Confirm the JSON does **not** contain `priority`,
   `category`, or `assignedAdminId`/`assignedAdminName` (stripped server-side).
3. Confirm the same for any socket `conversation:updated` payload received by the
   dealer — no triage fields present.

**Expected result**

Triage fields are absent from every dealer-facing surface (UI, REST, socket).

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 12. Expo app — file picker, push delivery, offline, back — dealer

Maps to PRD §10 and mdg-app README (WebView shell + native push bridge).

**Preconditions**

- mdg-app build installed (iOS or Android), pointed at the target client URL.

**Steps**

1. **Cold start / session:** launch the app. Confirm the native splash holds
   until first paint, then the chat list loads. Restart the app — confirm the session
   persists (no re-login; cookies/localStorage retained).
2. **File picker:** in chat, tap attach. Confirm the attach sheet offers Document,
   Camera and Gallery, that the OS picker or camera opens, and that the chosen image
   uploads through the WebView.
3. **Push token:** after login, confirm the shell registers an Expo push token
   and relays it to the web layer (`expo-push-token` event /
   `window.__EXPO_PUSH_TOKEN__`), which calls `POST /api/v1/devices` to register
   the `Device`. On logout, confirm `DELETE /api/v1/devices` unregisters it.
   (Requires a real `eas.projectId` and `PUSH_ENABLED=true` on the backend.)
4. **Push deep link:** trigger a notification by having an admin reply, send a report
   picture, post an ask, or resolve the member's request (Scenarios 4/6/7). Confirm
   a push is **actually delivered** to the device (admin reply / resolved / ask →
   the members of that chat; a report sent to Owners, Manager or Both → each person
   chosen). Tap it and confirm the app opens the exact chat (not a blank or home
   screen).
5. **Offline:** enable airplane mode. Confirm the offline screen appears (not a
   blank WebView). Restore connectivity; confirm it recovers (pull-to-refresh
   works).
6. **Android hardware back:** navigate chat list → a chat → Settings (⋮ menu), then
   press the hardware back button repeatedly. Confirm it walks WebView history
   before exiting the app (does not exit immediately from a deep screen).
7. **Load failure:** point at an unreachable URL or kill connectivity at load.
   Confirm the error screen appears, never a blank page.

**Expected result**

The WebView shell provides persistent session, native file picker, push token
register/unregister with **real push delivery** + deep-link, an offline screen,
graceful load-failure handling, and correct Android back behavior.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 13. Mobile responsiveness (no horizontal scroll) — dealer

Maps to PRD §8.1 AC5 and §9 (thumb-first, big targets).

**Preconditions**

- mdg-client open on a 360px-wide viewport (small Android) and an iPhone SE size.

**Steps**

1. Load chat. Confirm no horizontal scroll at 360px width.
2. Confirm tap targets (chips, attach, send, nav) are large enough for a thumb.
3. Open the chat list, a chat's media page and Settings. Confirm no horizontal
   scroll, no clipped controls.
4. Open the on-screen keyboard in the composer. Confirm the input stays visible
   and the layout does not break.
5. Rotate to landscape briefly. Confirm nothing is unusable.

**Expected result**

Every dealer screen is usable on a small phone with large tap targets and no
horizontal scrolling.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 14. Owner chats, the manager group chat, org grouping — admin + dealers

Maps to `ARCHITECTURE.md` (Chat, tickets and the AI first line) and PRD §7 (support
and manager conversations, org-shared service history).

**Preconditions**

- Ramesh (`dealer-owner`) and Sunita (manager `dealer-staff`) belong to the same
  dealer organisation, each with their own login. Arjun is in mdg-admin.

**Steps**

1. Open the app as Ramesh. Confirm the chat list shows **two** chats: his own chat
   with MDG, and the manager group chat. Open the app as Sunita. Confirm she sees
   **one**: the manager group chat.
2. As Sunita, send a message in the group chat. As Ramesh, confirm he reads it there,
   with her name on it. Then as Ramesh, send a different message in his own chat with
   MDG. Confirm Sunita does **not** see it and cannot open that chat.
3. In the admin inbox, confirm the pump's chats are **grouped under the same
   dealer**, each separately triageable: Ramesh's support chat and the manager group.
4. As Arjun, reply in Sunita's group thread. Confirm everyone in the group (Sunita
   and every owner) receives the message and a push. Reply in Ramesh's own thread and
   confirm only Ramesh does.
5. As Arjun, send a report with **Send to → Owners** and then **Manager** (Scenario
   6). Confirm Owners reaches each owner's own chat only, and Manager reaches the
   group chat only.
6. Confirm a service log created at resolution (Scenario 15) is visible in the
   dealer's services-provided history regardless of which thread it came from
   (org-shared history).

**Expected result**

Each owner has a private chat with MDG; the manager and every owner share one group
chat; the admin inbox groups the chats by organisation; service history is shared
across the dealer.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 15. Service log on resolve + services-provided history — `admin` (Arjun)

Maps to PRD §8.5 AC5/AC7 and `ARCHITECTURE.md` (Chat, tickets and the AI first line: `ServiceLog`, resolve requires a log).

**Preconditions**

- An ASSIGNED conversation for the dealer (from Scenario 4). The service catalog
  (`GET /services`) returns at least one service.

**Steps**

1. Click **Resolve**. Confirm the service-log dialog opens and resolution is
   blocked until a service log is provided.
2. Try to submit with **no service selected** — confirm it is rejected.
3. Try to submit with a service but **empty notes** — confirm it is rejected
   (notes are required).
4. Select a catalog service, add notes, submit. Confirm the conversation becomes
   **Resolved** and a `ServiceLog` is created (`POST /conversations/:id/resolve`).
5. Resolve another request (or use `POST /service-logs`) choosing **Other** +
   a free-text service name + notes. Confirm it is accepted.
6. Open the dealer detail page. Confirm the **services-provided history** lists
   both logs (catalog + "Other"), newest first, attributed to Arjun, and shared
   at the organisation level (visible regardless of which member's thread).

**Expected result**

A conversation cannot be resolved without a valid service log; both catalog and
"Other" services are supported with required notes; logs build a per-dealer,
org-shared services-provided history attributed to the admin who logged them.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## 16. The AI first line answers; a ticket opens when it cannot — dealer + admin

Maps to PRD §8.7 (ADR 0013: the writer; ADR 0017: tickets).

**Preconditions**

- The dealer's first line is on (the live server runs `AI_FIRSTLINE_ENABLED=true` with
  `AI_FIRSTLINE_ENGINE=brief`).
- Run it in Ramesh's own chat with MDG. Nobody has picked up the thread, and no admin
  has written in it for the last hour: a person handling a chat silences the AI on
  that chat for an hour.

**Steps**

1. As Ramesh, tap the chip **Today's report?** (or type the question) and send it. Confirm a reply
   arrives within seconds, in his language, with a small "Instant reply" note on the
   same line as the time. Confirm nothing says "AI" or "bot".
2. As Arjun, confirm the thread now shows under the **⚡ AI** filter, with the AI
   strip over the reply.
3. As Ramesh, send a voice note, which the machine cannot listen to. Confirm a reply
   says it has passed this to the MDG team, and a quiet line under it reads
   "#<number> · Sent to the MDG team" (Hindi: MDG टीम को भेजा गया). Confirm there is
   no "Talk to a person" button anywhere and the word "ticket" never appears.
4. As Arjun, confirm the thread shows under the **Tickets** filter, a strip over the
   thread offers **Resolve**, and the same ticket is listed on the Tickets page.
5. As Ramesh, send a second voice note. Confirm it is added to the same ticket as a
   follow-up, not opened as a second ticket.
6. As Arjun, reply in the thread without resolving. Confirm the dealer's line now
   reads "MDG team is looking at it" and the ticket is still open on the Tickets page.
7. Press **Resolve** on the strip and write a note. Confirm the dealer's line reads
   "Closed by the MDG team" and the ticket leaves the open list.

**Expected result**

The dealer gets an answer at once, or a plain line saying a person has it. A ticket
closes only when an admin resolves it with a written note; no reply closes it.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## A. First-time intimidated dealer — confusion audit — `dealer-owner` (Ramesh)

> This is the most important scenario. MDG's core thesis (PRD §9) is
> approachability for a 52-year-old, low-tech pump owner. Features that erode it
> are bugs regardless of utility. Run this **silently**: the observer gives no
> guidance and only records where the user hesitates, taps the wrong thing,
> reads aloud, or asks for help.

**Persona:** Ramesh — 52, uses only everyday chat apps and phone calls,
intimidated by apps with menus, logins, and English jargon.

**Preconditions**

- A real (or role-played) first-time, non-technical dealer.
- A fresh, never-logged-in account; an admin standing by to send a DSR picture.
- A photo on the device. Observer with a stopwatch and the confusion-point
  tally below. **No coaching during the run.**

**Task given to the dealer (verbatim, then stay silent):**
"Log in, ask support a question and include a photo, wait for their reply, and
then find your Daily Sales Report."

**Steps the observer tracks (do not read these to the dealer):**

1. **Login.** Start the stopwatch. Can the dealer log in without help?
   Confusion point if: confused by which field is email vs. phone, password
   visibility, or any jargon. → ☐ smooth ☐ hesitated ☐ needed help
2. **Find the chat.** After login, does the dealer see the chat list, tap their
   chat with MDG, and recognize it as "where I talk to support"? Confusion point if
   they look for a menu or a "start" button.
   → ☐ smooth ☐ hesitated ☐ needed help
3. **Send a question + photo.** Does the dealer find the composer and the
   attach control unaided, and choose Camera or Gallery from the attach sheet?
   Confusion point if they can't find how to add a photo, or don't know what to
   tap to send it. → ☐ smooth ☐ hesitated ☐ needed help
4. **Use a quick-action chip (optional path).** If the dealer is stuck typing,
   do the chips ("Report an issue", "Request a service")
   rescue them? Note whether they noticed the chips at all.
   → ☐ used a chip ☐ ignored chips ☐ didn't see chips
5. **Receive a reply.** Admin replies (and sends a DSR picture with **Send to →
   This chat**). Does the dealer notice the reply and the picture arrive? Confusion
   point if they don't realize a response came, or don't know the picture is the
   report. → ☐ smooth ☐ hesitated ☐ needed help
6. **Open the DSR / find it later.** Can the dealer open the picture (zoom, swipe)
   AND find it again by scrolling the chat or on the chat's media page? Confusion
   point if they look for a Reports tab or shelf, which does not exist.
   → ☐ smooth ☐ hesitated ☐ needed help
7. **Jargon scan.** During the whole run, did the dealer encounter any word that
   confused them (ticket, priority, category, queue, DSR-as-acronym, asset)?
   List each word that caused a pause: **\*\*\*\***\*\***\*\*\*\***\_\_**\*\*\*\***\*\***\*\*\*\***

**Metrics to capture (PRD §5 / §9):**

- **Time-to-first-message** (login → first sent message): **\_\_** (target ≤ 2 min)
- **Did the session end in a sent message?** ☐ yes ☐ no (silent drop-off)
- **DSR opened?** ☐ yes ☐ no
- **Total confusion points** (count of "hesitated" + "needed help" above): \_\_\_\_
- **"Could you do that without help?" (ask afterward):** ☐ yes ☐ no
- **Verbatim quote of the biggest frustration:** \***\*\*\*\*\*\*\***\_\_\_\_\***\*\*\*\*\*\*\***

**Expected result (acceptance bar)**

The dealer logs in, sends a question with a photo, sees the reply, and finds the
DSR — **unaided**, in **≤ 2 minutes to first message**, with **zero** exposure
to admin/triage jargon. Two or more "needed help" confusion points is a FAIL for
the approachability thesis even if every feature technically works.

**PASS ☐ FAIL ☐** Notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## Backend smoke test (run before any UAT session)

`mdg-backend/scripts/smoke.sh` is a curl-based health gate anyone can run:

```bash
# Basic (health, login-validation, socket handshake):
bash mdg-backend/scripts/smoke.sh https://api.mdgservices.in

# Full (adds real login + a signed-in read of /api/v1/me):
MDG_EMAIL=you@example.com MDG_PASSWORD=secret \
  bash mdg-backend/scripts/smoke.sh https://api.mdgservices.in
```

It checks: `/health` → 200; bad-body login → 400 (not 500); valid login → token;
Socket.IO handshake → sid; `GET /api/v1/me` → 200. It prints ✅/❌ per check,
skips the credentialed checks gracefully when no creds are supplied, and exits
non-zero on any failure. **Do not start a UAT session if smoke.sh fails.**

---

## Sign-off

| Scenario | Result | Tester | Date |
| -------- | ------ | ------ | ---- |
| 1        |        |        |      |
| 2        |        |        |      |
| 3        |        |        |      |
| 4        |        |        |      |
| 5        |        |        |      |
| 6        |        |        |      |
| 7        |        |        |      |
| 8        |        |        |      |
| 9        |        |        |      |
| 10       |        |        |      |
| 11       |        |        |      |
| 12       |        |        |      |
| 13       |        |        |      |
| 14       |        |        |      |
| 15       |        |        |      |
| 16       |        |        |      |
| A        |        |        |      |

**Release recommendation:** ☐ Go ☐ Go with caveats ☐ No-go
Caveats / blockers: \***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***
