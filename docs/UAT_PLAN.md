# MDG — User Acceptance Test (UAT) Plan

**Status:** v1 · **Owner:** UAT · **Last updated:** 2026-06-19

This plan verifies that MDG does what real users need, mapped to the PRD user
stories (§8) and the V2 architecture. Each scenario names the **persona** who
runs it, **preconditions**, **numbered steps**, the **expected result**, and a
**pass/fail box** to tick during a test session.

## How to use this document

1. Pick an environment and confirm the backend is healthy first:
   `bash mdg-backend/scripts/smoke.sh https://api.mdgservices.in`
2. Run scenarios top to bottom. Some depend on earlier ones (e.g. a record must
   be uploaded before a dealer can find it).
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

Ramesh and Sunita belong to the **same dealer organisation** (petrol pump) but
each has their **own private conversation** with support. Records and service
history are shared across the org. Each member signs in with an email + password
login issued by staff during onboarding (there is no WhatsApp group).

## Environments / fixtures

- **Backend:** `https://api.mdgservices.in` (REST `/api/v1`, Socket.IO at
  `/socket.io`, default path).
- **Admin web:** mdg-admin (Vercel).
- **Dealer web:** mdg-client (Vercel), mobile-first.
- **Expo app:** mdg-app — WebView wrapping mdg-client + native push bridge.
- **Test dealer:** one provisioned dealer organisation with a `dealer-owner`
  (Ramesh) and a manager `dealer-staff` `title: "Manager"` (Sunita) — each with
  their own app login (email + password) and their own private conversation. No
  self-signup — dealers are provisioned by staff, who issue each member's login
  in the app-first onboarding flow (final step: `issue-app-login`).
- **Login response contract:** `POST /api/v1/auth/login` returns
  `{ ok: true, data: { token, user, admin? } }`.

## Glossary mapping (product language vs. data fields)

| Dealer sees          | Admin sees                            | Data field                         |
| -------------------- | ------------------------------------- | ---------------------------------- |
| my own chat          | one thread per member, grouped by org | `Conversation.userId` (unique)     |
| just a chat          | OPEN / ASSIGNED / RESOLVED            | `Conversation.status`              |
| (nothing)            | Low/Normal/High/Urgent                | `Conversation.priority`            |
| (nothing)            | general/sales/compliance/…            | `Conversation.category`            |
| "Daily Sales Report" | `dsr`                                 | `DealerRecord.type`                |
| (nothing)            | services-provided history             | `ServiceLog` (org-shared)          |
| (a notification)     | push on reply/record/resolve          | `Device.expoPushToken`             |
| unread badge         | unread dot in queue                   | `unreadByDealer` / `unreadByAdmin` |

---

## Scenario index

| #   | Scenario                                             | Persona         | PRD story    |
| --- | ---------------------------------------------------- | --------------- | ------------ |
| 1   | Dealer first login & onboarding                      | dealer-owner    | §8.1         |
| 2   | Auth & roles — permitted and forbidden paths         | all             | §10, §7      |
| 3   | Send a query with a photo                            | dealer-staff    | §8.2         |
| 4   | Admin pick up → priority/category → reply → resolve  | admin           | §8.5         |
| 5   | Reopen a resolved conversation                       | dealer + admin  | §8.5 AC5     |
| 6   | Admin uploads a DSR (record)                         | admin           | §8.6         |
| 7   | Dealer sees in-chat record card + opens it           | dealer-owner    | §8.3         |
| 8   | Dealer finds the record in the Reports/Records shelf | dealer-owner    | §8.4         |
| 9   | Realtime delivery — no duplicate messages            | admin + dealer  | §6           |
| 10  | Typing & read receipts                               | admin + dealer  | §6           |
| 11  | Priority/category never leak to dealers              | dealer-owner    | §7, §8.5     |
| 12  | Expo app — file picker, push delivery, offline, back | dealer          | §10          |
| 13  | Mobile responsiveness (no horizontal scroll)         | dealer          | §8.1 AC5     |
| 14  | Per-member private chats (org grouping + isolation)  | admin + dealers | §7           |
| 15  | Service log on resolve + services-provided history   | admin           | §8.5 AC5/AC7 |
| A   | **First-time intimidated dealer** (confusion audit)  | dealer-owner    | §9           |

---

## 1. Dealer first login & onboarding — `dealer-owner` (Ramesh)

Maps to PRD §8.1. Validates a calm, chat-first landing with no setup wizard.

**Preconditions**

- Ramesh has been provisioned with an **app login (email + password)** by staff
  during onboarding (the `issue-app-login` step) — no WhatsApp group is involved.
- Ramesh has never logged in before.

**Steps**

1. Open mdg-client login on a phone-sized viewport. Enter Ramesh's credentials, submit.
2. Observe the first screen after login.
3. Confirm there is no setup wizard, tour, dashboard, or empty form.
4. Read the empty-state copy. Confirm it shows a friendly greeting
   ("How can we help?") and a short helper line.
5. Confirm quick-action chips are present: **Report an issue**,
   **Request a service**, **Talk to support**.
6. Tap **Report an issue**. Confirm the composer is pre-seeded with that text,
   ready to send with zero typing.
7. Scan every visible label for admin-only words: ticket, priority, category,
   queue, SLA, assigned, resolved. Confirm none appear.

**Expected result**

Ramesh lands directly on **his own** chat screen. Empty state greets him and
offers chips; tapping a chip seeds the composer. No admin/triage vocabulary
anywhere.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 2. Auth & roles — permitted and forbidden paths — all personas

Maps to PRD §10 and Architecture §7 (route-level RBAC, dealer scoping).

**Preconditions**

- Valid admin (Arjun), dealer-owner (Ramesh), dealer-staff (Sunita) accounts.
- Two different dealers (Dealer A = Ramesh/Sunita; Dealer B = another dealer).

**Steps**

1. Log in as Arjun (admin) on mdg-admin. Confirm 200 + a token is returned and
   the inbox loads.
2. Log in as Ramesh on mdg-client. Confirm 200 + token + chat loads.
3. As Ramesh, attempt to open the admin app URL / admin-only route. Confirm
   access is denied (no inbox, no dealer management).
4. As Ramesh, call `GET /api/v1/records?dealerId=<Dealer B id>`. Confirm the
   response is scoped to Ramesh's own dealer only (Dealer B's records are NOT
   returned — server forces `dealerId` to the caller's own).
   4b. As Ramesh, attempt to open **Sunita's** conversation (same org, different
   member). Confirm it is refused — a member is scoped to their own `userId`
   thread; same-org members cannot read each other's private chats. (Records and
   service history, by contrast, are correctly shared at the org level.)
5. As Ramesh, attempt `PATCH /api/v1/conversations/:id/ticket` (set priority).
   Confirm it is forbidden (admin-only write).
6. As Ramesh, attempt `POST /api/v1/records` (upload a record). Confirm forbidden.
   6b. As Ramesh, attempt `POST /api/v1/service-logs` and `POST /conversations/:id/resolve`.
   Confirm both are forbidden (admin-only).
7. Submit a login with wrong password. Confirm a gentle "Invalid credentials"
   (401), not a stack trace.
8. Submit a login with a malformed body. Confirm 400 (validation), not 500.
   (Automated by `smoke.sh` check 2.)

**Expected result**

Admin can reach admin surfaces and writes; dealers cannot. Dealer reads are
forced to their own `dealerId`; cross-dealer access and admin writes are
refused. Bad input fails gracefully.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 3. Send a query with a photo — `dealer-staff` (Sunita)

Maps to PRD §8.2 (`sendMessageSchema`, presign + image attachment).

**Preconditions**

- Sunita is logged into mdg-client. A meter photo is available on the device.

**Steps**

1. In the chat composer, type "Meter reading looks wrong, see photo".
2. Tap the attach control; choose the photo from camera or gallery.
3. Confirm the image shows a sending/upload state, then a sent indicator.
4. Confirm the message contains both the text body and the image.
5. Try to send an **empty** message (no text, no attachment). Confirm it is
   rejected with a gentle inline hint, not an error code.
6. (Boundary) Attempt to attach an oversize file (>25 MB) or an 11th attachment.
   Confirm a plain-language explanation, not a crash.
7. Switch to Arjun's admin inbox. Confirm the new message appears in real time
   and the conversation is marked unread (`unreadByAdmin` dot).

**Expected result**

Image uploads via presign and sends with the text. Empty sends are blocked
gently; oversize is explained. Admin sees it live and unread.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

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
3. In the right context panel → **Ticket** card, set **Priority = High**.
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

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 5. Reopen a resolved conversation — dealer + admin

Maps to PRD §8.5 AC5 (a later dealer message can reopen) and PRD §11 open question.

**Preconditions**

- The conversation from Scenario 4 is **Resolved**.

**Steps**

1. As the dealer (Ramesh), open the chat. The conversation is resolved — note
   whether the composer is disabled or whether sending a new message is allowed.
   (Admin client disables the composer when `status === 'RESOLVED'`.)
2. Trigger a reopen path:
   - **Admin path:** As Arjun, click **Reopen** on the resolved conversation.
     Confirm status returns to **Assigned**/**Open** and the composer re-enables.
   - **Dealer path (if supported):** As the dealer, send a new message. Confirm
     the conversation reopens for admins (reappears in active filters).
3. Confirm the reopened conversation retains its history (messages, records, and
   prior triage fields).

**Expected result**

A resolved conversation can be reopened (by admin, and/or by a new dealer
message), preserving full history. Record the exact reopen trigger observed —
this resolves PRD §11's open question for the build.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 6. Admin uploads a DSR (record) — `admin` (Arjun)

Maps to PRD §8.6 (`createRecordSchema`, presign + S3, `announceInChat`).

**Preconditions**

- Arjun is in a dealer's conversation in mdg-admin. A PDF/CSV DSR file is ready.

**Steps**

1. Click **Upload report** (header) or the upload icon in the **Reports** card.
2. In the dialog, confirm the dealer is preselected (the open conversation's dealer).
3. Set **Type = Daily Sales Report (dsr)**, **Title = "Daily Sales Report"**,
   **Period label = "14 Mar 2026"**, optional note.
4. Attach the DSR file. Confirm the upload uses presigned S3 (file uploads, then
   the create call fires).
5. Leave **Announce in chat** ON (default). Submit.
6. Confirm a success state and the record appears in the right-panel **Reports**
   list immediately (title + period).
7. **Recovery check:** intentionally trigger a failure (e.g. cancel mid-upload),
   reopen the dialog, and confirm previously entered metadata is not lost or that
   re-entry is trivial.
8. Confirm the action attributes the uploader (`uploadedByName` shown where
   surfaced) — no anonymous uploads.

**Expected result**

Record is created via presign + `POST /records`, appears in the admin Reports
list, is attributed to Arjun, and (with announce on) is posted into the dealer's
chat. Failures are recoverable.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 7. Dealer sees the in-chat record card + opens it — `dealer-owner` (Ramesh)

Maps to PRD §8.3 (`record:new` / `message:new`, system card, signed URL, push).

**Preconditions**

- Scenario 6 completed with **Announce in chat** ON.
- Ramesh is logged into mdg-client (and, for AC4, the Expo app).

**Steps**

1. With Ramesh's chat open, watch for the record card to appear in real time
   (no manual refresh) right after the admin upload.
2. Confirm the card shows the plain label **"Daily Sales Report"** and the
   period **"14 Mar 2026"** — not the raw type `dsr`.
3. Confirm the card renders distinctly as a system/record message, not a normal
   text bubble.
4. Tap the card. Confirm the document opens/downloads via a **signed URL**
   (the link is short-lived; a raw `storageKey` is never exposed).
5. (Expo) Confirm a push notification fired ("Your Daily Sales Report is ready"),
   and tapping it deep-links into the relevant chat.

**Expected result**

The record card arrives live in chat with plain labels, opens via signed URL,
and (in Expo) triggers a push that deep-links to the chat.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 8. Dealer finds the record in the Reports/Records shelf — `dealer-owner` (Ramesh)

Maps to PRD §8.4 (Records shelf grouped by type, signed-URL open).

**Preconditions**

- At least one DSR delivered (Scenario 6/7).

**Steps**

1. From chat, reach the Records/Reports shelf in **one tap** (nav).
2. Confirm records are grouped by type, with **Daily Sales Report** as a group.
3. Confirm the DSR appears with title + period, most recent first.
4. Confirm empty groups are hidden or show a calm "Nothing here yet" line — no
   error, no blank screen.
5. Open the DSR from the shelf. Confirm it uses the same signed-URL open flow as
   the in-chat card.
6. Scan the shelf for any ticket/triage language. Confirm there is none.

**Expected result**

The shelf is one tap from chat, groups records by plain-language type, shows the
DSR with period, opens via signed URL, and exposes no triage vocabulary.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 9. Realtime delivery — no duplicate messages — admin + dealer

Maps to Architecture §6 (`message:new`, `conversation:updated`, rooms). This is
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

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 10. Typing & read receipts — admin + dealer

Maps to Architecture §6 (`typing`, `read`) and PRD "Should have".

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

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

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

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 12. Expo app — file picker, push delivery, offline, back — dealer

Maps to PRD §10 and mdg-app README (WebView shell + native push bridge).

**Preconditions**

- mdg-app build installed (iOS or Android), pointed at the target client URL.

**Steps**

1. **Cold start / session:** launch the app. Confirm the native splash holds
   until first paint, then the chat loads. Restart the app — confirm the session
   persists (no re-login; cookies/localStorage retained).
2. **File picker:** in chat, tap attach. Confirm the OS picker opens (camera +
   gallery) and the chosen image uploads through the WebView.
3. **Push token:** after login, confirm the shell registers an Expo push token
   and relays it to the web layer (`expo-push-token` event /
   `window.__EXPO_PUSH_TOKEN__`), which calls `POST /api/v1/devices` to register
   the `Device`. On logout, confirm `DELETE /api/v1/devices` unregisters it.
   (Requires a real `eas.projectId` and `PUSH_ENABLED=true` on the backend.)
4. **Push deep link:** trigger a notification by having an admin reply, upload a
   record, or resolve the member's request (Scenarios 4/6/7). Confirm a push is
   **actually delivered** to the device (admin reply / resolved → that member;
   new record → all org members). Tap it and confirm the app deep-links to the
   relevant chat or record (not a blank or home screen).
5. **Offline:** enable airplane mode. Confirm the offline screen appears (not a
   blank WebView). Restore connectivity; confirm it recovers (pull-to-refresh
   works).
6. **Android hardware back:** navigate chat → records → profile, then press the
   hardware back button repeatedly. Confirm it walks WebView history before
   exiting the app (does not exit immediately from a deep screen).
7. **Load failure:** point at an unreachable URL or kill connectivity at load.
   Confirm the error screen appears, never a blank page.

**Expected result**

The WebView shell provides persistent session, native file picker, push token
register/unregister with **real push delivery** + deep-link, an offline screen,
graceful load-failure handling, and correct Android back behavior.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 13. Mobile responsiveness (no horizontal scroll) — dealer

Maps to PRD §8.1 AC5 and §9 (thumb-first, big targets).

**Preconditions**

- mdg-client open on a 360px-wide viewport (small Android) and an iPhone SE size.

**Steps**

1. Load chat. Confirm no horizontal scroll at 360px width.
2. Confirm tap targets (chips, attach, send, nav) are large enough for a thumb.
3. Open the records shelf and profile. Confirm no horizontal scroll, no clipped
   controls.
4. Open the on-screen keyboard in the composer. Confirm the input stays visible
   and the layout does not break.
5. Rotate to landscape briefly. Confirm nothing is unusable.

**Expected result**

Every dealer screen is usable on a small phone with large tap targets and no
horizontal scrolling.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 14. Per-member private chats (org grouping + isolation) — admin + dealers

Maps to Architecture §3/§6 and PRD §7 (per-member conversations, org-shared records).

**Preconditions**

- Ramesh (`dealer-owner`) and Sunita (manager `dealer-staff`) belong to the same
  dealer organisation, each with their own login. Arjun is in mdg-admin.

**Steps**

1. As Sunita, send a message. As Ramesh, send a different message. Confirm each
   sees **only their own** thread — Ramesh does not see Sunita's message in his
   chat and vice versa.
2. In the admin inbox, confirm **two conversations** appear for this organisation —
   one per member — **grouped under the same dealer/pump**, each separately
   triageable.
3. As Arjun, reply to Sunita's thread. Confirm only **Sunita** receives the
   message/push, not Ramesh.
4. As Arjun, upload a record for the dealer (Scenario 6) with announce on.
   Confirm the record appears in **both** Ramesh's and Sunita's Reports shelf
   (records are org-shared) and that `record:new` reaches both members.
5. Confirm a service log created at resolution (Scenario 15) is visible in the
   dealer's services-provided history regardless of which member's thread it came
   from (org-shared history).

**Expected result**

Each member has a private conversation; same-org members cannot see each other's
chats; the admin inbox groups per-member threads by organisation; records and
service history are shared across all members of the dealer.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## 15. Service log on resolve + services-provided history — `admin` (Arjun)

Maps to PRD §8.5 AC5/AC7 and Architecture §3/§5 (`ServiceLog`, resolve requires a log).

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

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

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
- A fresh, never-logged-in account; an admin standing by to upload a DSR.
- A photo on the device. Observer with a stopwatch and the confusion-point
  tally below. **No coaching during the run.**

**Task given to the dealer (verbatim, then stay silent):**
"Log in, ask support a question and include a photo, wait for their reply, and
then find your Daily Sales Report."

**Steps the observer tracks (do not read these to the dealer):**

1. **Login.** Start the stopwatch. Can the dealer log in without help?
   Confusion point if: confused by which field is email vs. phone, password
   visibility, or any jargon. → ☐ smooth ☐ hesitated ☐ needed help
2. **Find the chat.** After login, does the dealer recognize the screen as
   "where I talk to support"? Confusion point if they look for a menu or a
   "start" button. → ☐ smooth ☐ hesitated ☐ needed help
3. **Send a question + photo.** Does the dealer find the composer and the
   attach/camera control unaided? Confusion point if they can't find how to add
   a photo, or send an empty message and get confused by the rejection.
   → ☐ smooth ☐ hesitated ☐ needed help
4. **Use a quick-action chip (optional path).** If the dealer is stuck typing,
   do the chips ("Report an issue", "Request a service", "Talk to support")
   rescue them? Note whether they noticed the chips at all.
   → ☐ used a chip ☐ ignored chips ☐ didn't see chips
5. **Receive a reply.** Admin replies (and uploads a DSR with announce on). Does
   the dealer notice the reply/record card arrive? Confusion point if they don't
   realize a response came, or don't understand the record card.
   → ☐ smooth ☐ hesitated ☐ needed help
6. **Open the DSR / find it later.** Can the dealer open the Daily Sales Report
   from the card AND locate it again in the Records/Reports shelf? Confusion
   point if they can't find the shelf, or expect the document somewhere it isn't.
   → ☐ smooth ☐ hesitated ☐ needed help
7. **Jargon scan.** During the whole run, did the dealer encounter any word that
   confused them (ticket, priority, category, queue, DSR-as-acronym, asset)?
   List each word that caused a pause: ********\*\*********\_\_********\*\*********

**Metrics to capture (PRD §5 / §9):**

- **Time-to-first-message** (login → first sent message): **\_\_** (target ≤ 2 min)
- **Did the session end in a sent message?** ☐ yes ☐ no (silent drop-off)
- **DSR opened?** ☐ yes ☐ no
- **Total confusion points** (count of "hesitated" + "needed help" above): \_\_\_\_
- **"Could you do that without help?" (ask afterward):** ☐ yes ☐ no
- **Verbatim quote of the biggest frustration:** ****\*\*\*\*****\_\_\_\_****\*\*\*\*****

**Expected result (acceptance bar)**

The dealer logs in, sends a question with a photo, sees the reply, and finds the
DSR — **unaided**, in **≤ 2 minutes to first message**, with **zero** exposure
to admin/triage jargon. Two or more "needed help" confusion points is a FAIL for
the approachability thesis even if every feature technically works.

**PASS ☐ FAIL ☐** Notes: **********\*\***********\_\_**********\*\***********

---

## Backend smoke test (run before any UAT session)

`mdg-backend/scripts/smoke.sh` is a curl-based health gate anyone can run:

```bash
# Basic (health, login-validation, socket handshake):
bash mdg-backend/scripts/smoke.sh https://api.mdgservices.in

# Full (adds real login + records check):
MDG_EMAIL=you@example.com MDG_PASSWORD=secret \
  bash mdg-backend/scripts/smoke.sh https://api.mdgservices.in
```

It checks: `/health` → 200; bad-body login → 400 (not 500); valid login → token;
Socket.IO handshake → sid; `GET /api/v1/records` → 200. It prints ✅/❌ per check,
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
| A        |        |        |      |

**Release recommendation:** ☐ Go ☐ Go with caveats ☐ No-go
Caveats / blockers: **********\*\*\*\***********\_\_\_\_**********\*\*\*\***********
