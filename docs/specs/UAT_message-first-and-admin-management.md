# UAT — Admin messages a client first + Admin team management

**Status:** v1 · **Owner:** UAT · **Last updated:** 2026-07-05
**Scope:** Two capabilities newly shipped to the MDG admin portal + backend:

1. **Message-first** — an admin can open (or reuse) a dealer member's private
   chat and send the first message, even if that member never wrote in.
2. **Team management** — admins can add and manage other admins (create, reset
   password, suspend/reactivate) from a new **Team** page.

This plan mirrors the structure of `docs/UAT_PLAN.md`: each scenario names the
**persona**, **preconditions**, **numbered steps**, the **expected result**, and
a **pass/fail box** to tick during a session. Product code is not modified by
this document — it is a runbook.

Related surfaces (for testers who want to read along):
`mdg-admin/src/pages/InboxPage.tsx`,
`mdg-admin/src/features/chat/NewConversationDialog.tsx`,
`mdg-admin/src/pages/dealers/DealerMembersTab.tsx`,
`mdg-admin/src/pages/AdminsPage.tsx`,
`mdg-admin/src/hooks/api/useAdmins.ts`,
`mdg-backend/src/routes/v1/conversations.ts`,
`mdg-backend/src/routes/v1/admins.ts`.

---

## How to run locally (preamble)

From the repo README (`README.md` → "Quick start"). You need the meta repo plus
the four service repos cloned side by side.

```bash
# From the mdg-service workspace root:
nvm use                      # Node 20 (.nvmrc)
npm install                  # npm workspaces resolves @dk/shared

# Backend env (MongoDB URI, JWT secret, S3, CORS). Mongo 7+ must be reachable.
cp mdg-backend/.env.example mdg-backend/.env
#   edit mdg-backend/.env

# Seed the admin + sample dealers/members (idempotent; --reset wipes first):
npm run seed --workspace mdg-backend
#   or a clean slate:  npm run seed --workspace mdg-backend -- --reset

# Run everything: backend :4000, admin :5173, client :5174
npm run dev
```

Then open:

- **Admin portal:** http://localhost:5173 — `admin@dealerkavach.local` / `Admin@12345`
- **Dealer client:** http://localhost:5174 — `owner@<code>.test` / `password123`

Before starting, gate on the backend smoke check (from `docs/UAT_PLAN.md`):
`bash mdg-backend/scripts/smoke.sh http://localhost:4000`.

> **Tip — a clean re-run:** the message-first "first contact" case is clearest
> against a member whose thread is still empty. The seeder gives every seeded
> member a thread with one opening message already, so for a true "never wrote
> in" test, add a fresh member first (Scenario F1.2) or run `-- --reset` and use
> a member you create during the session.

---

## Personas under test

| Persona | Role                                       | Identity used in steps                                      | Where they work |
| ------- | ------------------------------------------ | ----------------------------------------------------------- | --------------- |
| Arjun   | `admin` (seeded)                           | `admin@dealerkavach.local` / `Admin@12345`                  | mdg-admin (web) |
| Priya   | `admin` (created during UAT)               | `priya@mdg.test` / generated in-app                         | mdg-admin (web) |
| Ramesh  | `dealer-owner` (non-technical, receiving)  | `owner@e02.test` / `password123` (Northern Lights Petrol)   | mdg-client      |
| Sunita  | `dealer-staff` "Manager"                   | `manager@e02.test` / `password123` (Northern Lights Petrol) | mdg-client      |
| Neha    | `dealer-staff` (fresh, created during UAT) | you create her under a dealer in Scenario F1.2              | mdg-client      |

Ramesh (owner) and Sunita (manager) belong to the **same** dealer organisation
and each has their **own private thread**. Neha is created during the run to
prove the true "admin reaches a member who never messaged" path with a push.

---

## Seeded fixtures (from `mdg-backend/src/seed.ts`)

| Dealer                 | Code | Status     | Members with app logins                                                              |
| ---------------------- | ---- | ---------- | ------------------------------------------------------------------------------------ |
| Northern Lights Petrol | E02  | ACTIVE     | `owner@e02.test` (Dealer Owner · Owner), `manager@e02.test` (Pump Manager · Manager) |
| Riverside Refuel       | E03  | ACTIVE     | `owner@e03.test` (Dealer Owner · Owner)                                              |
| Coastal Energy         | E01  | ONBOARDING | none — code assigned but no app login issued yet                                     |
| Highway Fuels          | —    | ONBOARDING | none                                                                                 |
| Sunrise Petroleum      | —    | ONBOARDING | none                                                                                 |

- All seeded member passwords: `password123`.
- Seeded members already have a thread + one opening message (so they appear in
  the inbox **Unassigned** list; messaging them **reuses** that thread).
- Onboarding dealers (Coastal/Highway/Sunrise) are **selectable in the New
  composer** but have **no active members**, so the member picker shows
  "No active members for this dealer" — a useful negative fixture (F1.4).
- The seeded admin exists in **both** the legacy Admin store and the User store;
  login prefers the User doc, so the seeded admin is a manageable, User-store
  admin that appears on the Team page with a **You** badge.

---

## Acceptance notes — the shared-inbox model (confirm during F1)

These are invariants the whole feature rests on. Confirm them explicitly and
tick the box; they are the "why" behind the message-first behaviour.

- **One thread per member.** `Conversation.userId` is unique. Opening a chat is
  idempotent: `POST /conversations { userId }` **find-or-creates** and returns
  the same thread every time (201 the first time, 200 on reuse). There is never
  a second thread for the same member. ☐ confirmed
- **Shared, not owned.** Every admin can open and reply in **any** member's
  thread. "Pick up" / "Assign" is **soft ownership** only — it sets
  `assignedAdminId` + status `ASSIGNED` for triage/visibility; it does **not**
  lock other admins out. Any admin can still open the thread and send. ☐ confirmed
- **Member resolves by identity.** A member's `GET /conversations/mine` resolves
  their thread by `userId`, so an admin-created thread appears for the member
  the moment they open the app — no dealer action required. ☐ confirmed
- **No empty-ticket spam.** Opening a thread does **not** broadcast to the inbox
  (a message-less ticket would be noise). It appears on the next list refetch and
  broadcasts for real when the first message is sent. ☐ confirmed

---

## Scenario index

| #    | Scenario                                                       | Persona             | Feature |
| ---- | -------------------------------------------------------------- | ------------------- | ------- |
| F1.1 | Inbox "New" composer → open a seeded member's thread (reuse)   | admin (Arjun)       | 1       |
| F1.2 | Message a brand-new member first + push (true first contact)   | admin + member Neha | 1       |
| F1.3 | Members tab "Message" action → deep-link `/inbox?c=<id>`       | admin (Arjun)       | 1       |
| F1.4 | Composer guardrails — suspended hidden, no-member dealer       | admin (Arjun)       | 1       |
| F1.5 | Message button disabled for a suspended member (Members tab)   | admin (Arjun)       | 1       |
| F1.6 | Idempotency / no duplicate thread on repeated open             | admin (Arjun)       | 1       |
| F1.7 | Shared-inbox reply — a second admin replies in the same thread | admin (Arjun+Priya) | 1       |
| F2.1 | Team page loads + Add admin (generate/copy password)           | admin (Arjun)       | 2       |
| F2.2 | New admin can log in and use the portal                        | admin (Priya)       | 2       |
| F2.3 | Reset password for another admin                               | admin (Arjun)       | 2       |
| F2.4 | Suspend / reactivate another admin                             | admin (Arjun)       | 2       |
| F2.5 | Guardrail — cannot suspend yourself                            | admin (Arjun)       | 2       |
| F2.6 | Guardrail — cannot suspend the last active admin               | admin (Arjun)       | 2       |
| F2.7 | Suspension takes effect immediately (blocked mid-session)      | admin (Arjun+Priya) | 2       |
| F2.8 | Guardrail — duplicate email on Add admin                       | admin (Arjun)       | 2       |
| F2.9 | Add-admin field validation (name/email/password)               | admin (Arjun)       | 2       |

---

# Feature 1 — Admin can message a client first

## F1.1 — Inbox "New" composer opens a seeded member's thread — `admin` (Arjun)

Maps to `NewConversationDialog.tsx` + `POST /conversations` (reuse path).

**Preconditions**

- Arjun is logged into mdg-admin at a desktop width (the 3-pane inbox + "New"
  button live in the `md:` layout; they are hidden on a phone-width admin window).
- Seeded data present (Northern Lights Petrol has active members).

**Steps**

1. Go to **Inbox**. In the middle column header (next to the filter title), click
   **New**.
2. Confirm a **New message** dialog opens with the helper text "Start a chat with
   a dealer member — even if they haven't written in yet."
3. In **Dealer**, select **Northern Lights Petrol**. Confirm the member picker
   enables and lists **Dealer Owner · Owner** and **Pump Manager · Manager**.
4. Select **Dealer Owner · Owner**. Confirm the **Open chat** button enables
   (it is disabled until a member is chosen).
5. Click **Open chat**. Confirm the dialog closes, the inbox switches to the
   **Unassigned** filter, and **that owner's thread is selected** (their name is
   in the chat header; the seeded opening message "Hi, I need help with my
   monthly invoice." is visible).
6. Type a first line in the composer and send. Confirm it appears once in the
   thread and the thread rises to the top of the list.

**Expected result**

The New composer opens/reuses the chosen member's thread and selects it so Arjun
can type immediately. Because this member already had a thread, it is **reused**
(no duplicate).

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F1.2 — Message a brand-new member first (true first contact + push) — `admin` (Arjun) → member (Neha)

Maps to Add member (`DealerMembersTab.tsx`) → `POST /conversations` (create path, 201) → first message push (`messages.ts` → `pushToUsersAsync`).

**Preconditions**

- Arjun is in mdg-admin. Choose an ACTIVE dealer (e.g. **Riverside Refuel** /
  E03). For the push half of the test: a device signed in as Neha on the Expo app
  (or mdg-client with notifications), `PUSH_ENABLED=true`, and a registered
  `Device`. If no device, do the push sub-steps as "verify the thread appears".

**Steps**

1. Go to **Dealers → Riverside Refuel → Members**. Click **Add member**.
2. Create Neha: Role **Manager**, Name "Neha", Login email `neha@e03.test`,
   click **Generate** then **Copy** the password, submit. Confirm the toast
   "Member added. Share the login email and password." and that Neha appears in
   the members table as **Active**. (Neha has **no** thread yet.)
3. On Neha's row, click **Message**. Confirm you land in the **Inbox** with a
   **new, empty** thread selected for Neha — header shows "Neha", body area shows
   no messages (or an empty state), status badge **Open**.
4. Type "Hello Neha, this is MDG support reaching out about your onboarding." and
   send. Confirm the message appears exactly once.
5. On a second device/browser, log into mdg-client as **Neha** (`neha@e03.test` +
   the copied password). Confirm her chat shows **the admin's message** with no
   action on her part (her `GET /conversations/mine` resolved the admin-created
   thread by her userId).
6. **(Push, if a device is registered)** Confirm Neha's device received a push
   titled with the dealer name ("Riverside Refuel — MDG Support") carrying the
   message preview, and tapping it deep-links into her chat.

**Expected result**

An admin reaches a member who never wrote in: a brand-new thread is **created**
(first open → 201), the admin sends the first message, and the member sees it —
and is pushed — the next time they open the app.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F1.3 — Members tab "Message" deep-links to the Inbox — `admin` (Arjun)

Maps to `DealerMembersTab.messageMember` → `navigate('/inbox?c=<id>')` →
`InboxPage` deep-link handling (selects the thread, switches to **Unassigned**,
then strips `?c=` so refresh/back doesn't re-fire).

**Preconditions**

- Arjun in mdg-admin. Northern Lights Petrol has active members (seeded).

**Steps**

1. Go to **Dealers → Northern Lights Petrol → Members**.
2. On **Pump Manager · Manager**'s row, click **Message**.
3. Confirm the browser navigates to the **Inbox** and that manager's thread is
   selected (header shows "Pump Manager", the seeded line "The fuel dispenser
   reading looks off today." is visible).
4. Confirm the URL no longer contains `?c=...` (it was consumed and stripped).
5. Press the browser **Back** button. Confirm it does **not** re-open/re-select
   via the stale `?c=` param (no surprise re-navigation loop).

**Expected result**

The Members-tab **Message** action jumps to the Inbox with the correct thread
selected, and the deep-link param is consumed cleanly.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F1.4 — Composer guardrails: suspended members hidden, no-member dealers — `admin` (Arjun)

Maps to `NewConversationDialog` member filter (`status === 'ACTIVE'`) and the
empty-member helper.

**Preconditions**

- Arjun in mdg-admin. At least one onboarding dealer with no members (Coastal
  Energy / Highway Fuels / Sunrise Petroleum) exists (seeded).

**Steps**

1. Open **Inbox → New**. In **Dealer**, select **Coastal Energy** (or another
   onboarding dealer). Confirm the member picker shows **"No active members for
   this dealer"** and the helper line "Add a member on the dealer's page to start
   a chat." with an inbox icon. Confirm **Open chat** stays disabled.
2. In **Dealer**, switch to **Northern Lights Petrol**. Confirm the member list
   repopulates and the previously-selected member is cleared (you must pick again).
3. **Suspend-then-check:** in another tab, go to **Dealers → Northern Lights
   Petrol → Members** and **Suspend** the Pump Manager. Return to the composer,
   reselect **Northern Lights Petrol**, and confirm the **suspended manager no
   longer appears** in the member picker (only active members are listed).
4. Reactivate the manager afterward to restore the fixture.

**Expected result**

Only active members are offered in the composer; a dealer with no active members
shows a calm, instructive empty state and cannot start a chat.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F1.5 — "Message" disabled for a suspended member (Members tab) — `admin` (Arjun)

Maps to `DealerMembersTab` (`disabled={u.status !== 'ACTIVE'}` + tooltip) and the
server guard in `POST /conversations` (400 for suspended members).

**Preconditions**

- Arjun in mdg-admin at **Dealers → Northern Lights Petrol → Members**.

**Steps**

1. On the Pump Manager's row, click **Suspend**. Confirm the status badge flips to
   **Suspended** and a toast confirms.
2. Confirm that row's **Message** button is now **disabled**; hover it and confirm
   the tooltip reads "Reactivate this member to start a chat".
3. **(API-level, optional)** With a REST tool, `POST /api/v1/conversations` with
   `{ userId: <suspended manager id> }` and Arjun's token. Confirm **400** with
   "Member is suspended — reactivate them to start a chat".
4. Click **Reactivate**; confirm the **Message** button re-enables and works.

**Expected result**

A suspended member cannot be messaged from the UI (button disabled + tooltip) and
the server refuses it defensively (400). Reactivating restores the action.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F1.6 — Idempotency: repeated "Message" never duplicates a thread — `admin` (Arjun)

Maps to the unique index on `Conversation.userId` and the find-or-create logic.

**Preconditions**

- Arjun in mdg-admin. Pick any active member (e.g. `owner@e02.test`).

**Steps**

1. From **Members**, click **Message** on the owner. Note the selected thread's id
   (visible in the temporary `/inbox?c=<id>` URL or via the network response of
   `POST /conversations`).
2. Navigate away, then click **Message** on the **same** owner again. Confirm the
   **same** conversation id is returned/selected (reuse, HTTP **200**, not a new
   201).
3. In the Inbox list, confirm there is still exactly **one** thread for that
   member under the dealer group — no duplicate row appeared.

**Expected result**

Opening a member's chat repeatedly always resolves to the one canonical thread;
no duplicate conversations are ever created.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F1.7 — Shared-inbox reply: a second admin replies in the same thread — `admin` (Arjun + Priya)

Confirms "assign/pick up is soft ownership only" — a thread another admin opened
(or picked up) is still fully replyable by any admin.

**Preconditions**

- Two admins logged in (Arjun in browser A; Priya — created in F2.1 — in browser
  B). Use the thread Arjun opened for Neha in F1.2 (or any member thread).

**Steps**

1. As Arjun, open the thread and click **Pick up**. Confirm status becomes
   **Assigned** and the header shows "Assigned to Arjun".
2. As **Priya** (browser B), open the **same** thread from the Inbox. Confirm she
   can read the full history and the composer is **enabled** for her (she is not
   locked out despite Arjun's ownership).
3. As Priya, send a reply. Confirm it appears once in the thread on both admins'
   screens and on the member's client.
4. (Optional) As Priya, click **Reassign** and confirm it reassigns to her (there
   is no admin picker yet; Reassign takes self-ownership).

**Expected result**

Ownership is advisory. Any admin can open and reply in any member's single shared
thread; picking up/assigning does not fence other admins out.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

# Feature 2 — Add / manage admins from the portal

## F2.1 — Team page + Add admin (generate/copy password) — `admin` (Arjun)

Maps to nav **Team** → `/settings/team` (`AdminsPage.tsx`), `POST /admins`.

**Preconditions**

- Arjun logged into mdg-admin.

**Steps**

1. In the left nav, confirm a **Team** item (person-with-cog icon) exists. Click
   it. Confirm the URL is `/settings/team` and the page title is **Team** with the
   subtitle about managing dealers/inbox/admins.
2. Confirm the table lists at least the seeded admin (Arjun) with a **You** badge,
   his email, an **Active** badge, a last-login timestamp, and per-row **Reset
   password** / **Suspend** actions.
3. Click **Add admin**. In the dialog: Name "Priya", Login email `priya@mdg.test`.
4. Click **Generate** — confirm a strong password fills the field. Click **Copy** —
   confirm the button flips to **Copied** and a "Password copied" toast fires.
   Record the password for F2.2.
5. Click **Add admin**. Confirm the toast "Admin added. Share the login email and
   password." and that **Priya** now appears in the table as **Active** with an
   empty/"—" last-login.

**Expected result**

The Team page lists admins and lets Arjun create a new admin with a generated,
copyable password; the new admin appears immediately as Active.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.2 — New admin can log in and use the portal — `admin` (Priya)

Maps to the User-store login path (`auth.ts`) — new admins are real User docs.

**Preconditions**

- Priya was created in F2.1; you have her password.

**Steps**

1. In a separate browser/incognito, open the admin login and sign in as
   `priya@mdg.test` with the copied password.
2. Confirm login succeeds and the **Inbox** loads (no error, no blank screen).
3. Confirm Priya can navigate **Dealers**, **Overview**, and **Team** — i.e. she
   has full admin access, not a partial/broken session.
4. Return to the Team page (as Arjun or Priya) and confirm Priya's **Last login**
   now shows a timestamp.

**Expected result**

A portal-created admin can immediately log in and use every admin surface.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.3 — Reset another admin's password — `admin` (Arjun)

Maps to `ResetPasswordDialog` → `PATCH /admins/:id { password }`.

**Preconditions**

- Arjun on the Team page; Priya exists.

**Steps**

1. On Priya's row, click **Reset password**. Confirm a dialog opens pre-filled with
   a strong password and titled for Priya (name + email shown).
2. Click **Copy** (confirm "Password copied"), optionally **Generate** a fresh one,
   then **Reset password**. Confirm the toast "Password reset for Priya. Share it
   securely." and the dialog closes.
3. As Priya (other browser), confirm the **old** password no longer works and the
   **new** password logs her in.

**Expected result**

An admin can reset another admin's password; the new password works and the old
one is invalidated.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.4 — Suspend / reactivate another admin — `admin` (Arjun)

Maps to `toggleStatus` → `PATCH /admins/:id { status }`.

**Preconditions**

- Arjun on the Team page; Priya is Active. (At least two active admins exist so the
  last-admin guard doesn't fire.)

**Steps**

1. On Priya's row, click **Suspend**. Confirm the badge flips to **Suspended** and a
   "Priya suspended" toast fires.
2. Confirm the action button on that row now reads **Reactivate**.
3. Click **Reactivate**. Confirm the badge returns to **Active** and a "Priya
   reactivated" toast fires.

**Expected result**

Admins can suspend and reactivate other admins, with clear status feedback.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.5 — Guardrail: cannot suspend yourself — `admin` (Arjun)

Maps to UI (`disabled={isSelf}` + tooltip) and server (400 "You cannot suspend
your own account").

**Preconditions**

- Arjun on the Team page (his own row carries the **You** badge).

**Steps**

1. On Arjun's own row, confirm the **Suspend** button is **disabled** and hovering
   it shows the tooltip "You can't suspend your own account".
2. **(API-level, optional)** `PATCH /api/v1/admins/<Arjun id>` with
   `{ "status": "SUSPENDED" }` and Arjun's token. Confirm **400** "You cannot
   suspend your own account".

**Expected result**

Self-suspension is impossible from both the UI and the API.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.6 — Guardrail: cannot suspend the last active admin — `admin` (Arjun)

Maps to the server count guard (400 "At least one active admin must remain").

**Preconditions**

- Start from a known state: seeded admin (Arjun) + Priya both Active. (If more
  admins exist, suspend them first so exactly one non-self active admin remains,
  then reduce to the true "last admin" situation for the API check.)

**Steps**

1. Suspend Priya (F2.4) so Arjun is the only **Active** admin.
2. In the UI, Arjun's own **Suspend** is already disabled (F2.5), so the last-admin
   case cannot be reached by clicking — good. Confirm there is no way in the UI to
   drop to zero active admins.
3. **(API-level, the real guard)** Create a second admin (F2.1), log in as that
   admin, and from _their_ token `PATCH /api/v1/admins/<the only other active
admin id>` with `{ "status": "SUSPENDED" }` **while it is the last active
   admin besides self**. Concretely: with exactly two active admins A and B, have
   A try to suspend B after B is already the only other active — the count of
   _other_ active admins hitting zero returns **400** "At least one active admin
   must remain".
4. Reactivate everyone to restore a healthy state.

**Expected result**

The system never allows the active-admin count to reach zero; the last active
admin cannot be suspended (server 400).

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.7 — Suspension takes effect immediately (mid-session) — `admin` (Arjun + Priya)

Maps to `requireAuth`: portal admins live in the User store and their status is
re-checked on **every** request, so suspension blocks the next action — not just
the next login.

**Preconditions**

- Priya logged in and actively using the portal in browser B; Arjun in browser A.
  Both Active.

**Steps**

1. In browser B (Priya), confirm she can load the Inbox and Dealers normally.
2. In browser A, Arjun suspends Priya (F2.4).
3. In browser B, **without logging out**, have Priya take her next action (switch
   filters, open a dealer, refresh a list). Confirm she is blocked — the request
   returns **403** "Account is suspended" (the app surfaces an auth error / kicks
   her out), rather than continuing as if nothing happened.
4. Confirm Priya also **cannot log in again**: a fresh login attempt returns
   **403** "User is suspended".
5. Arjun reactivates Priya; confirm she can log in and work again.

**Expected result**

Suspension is enforced on the very next request, not deferred to the next login.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.8 — Guardrail: duplicate email on Add admin — `admin` (Arjun)

Maps to `POST /admins` uniqueness across both stores (409 "Email already in use").

**Preconditions**

- Arjun on the Team page. Priya (`priya@mdg.test`) already exists.

**Steps**

1. Click **Add admin**. Enter Name "Priya Two", email `priya@mdg.test` (an existing
   admin), a valid (≥8 char) password. Submit.
2. Confirm the create is refused with an "Email already in use" toast and **no**
   duplicate row is added to the table.
3. **(Extra)** Try the seeded admin's email `admin@dealerkavach.local`. Confirm the
   same 409 — the guard also covers the legacy admin store, not just User admins.

**Expected result**

Duplicate emails are rejected (409) with a clear message; no shadow/duplicate
admin is created.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## F2.9 — Add-admin field validation — `admin` (Arjun)

Maps to `createAdminSchema` (email valid + lowercased; name ≥ 2; password ≥ 8)
enforced client-side and server-side.

**Preconditions**

- Arjun with the **Add admin** dialog open.

**Steps**

1. Leave **Name** blank (or 1 char), fill a valid email + 8-char password, submit.
   Confirm an inline error "Name is required" and the dialog stays open.
2. Enter an invalid **email** (e.g. `not-an-email`). Submit. Confirm an inline
   email validation error appears.
3. Enter a **password** shorter than 8 characters. Submit. Confirm the inline
   "At least 8 characters" error appears.
4. Enter a valid name/email/password. Confirm submission succeeds and the new admin
   appears. (Confirm the email is stored **lower-cased** — e.g. `Test@MDG.test`
   lands as `test@mdg.test`.)

**Expected result**

Bad input is caught with friendly inline messages; a well-formed admin is created
and the email is normalised to lowercase.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## Read-only smoke checks performed (2026-07-05)

Verified statically against the committed code (no servers started, no product
code modified):

- **Backend `/admins` mount** — `mdg-backend/src/routes/v1/index.ts:36`
  `v1Router.use('/admins', adminsRouter);` (import at line 3). PASS.
- **Admin route `/settings/team`** — `mdg-admin/src/App.tsx:37`
  `<Route path="settings/team" element={<AdminsPage />} />`. PASS.
- **Team nav item** — `mdg-admin/src/components/layout/AppShell.tsx:35`
  `{ to: '/settings/team', label: 'Team', icon: UserCog }`. PASS.
- **Inbox "New" button + dialog wiring** — `mdg-admin/src/pages/InboxPage.tsx`
  imports `NewConversationDialog`, `setNewOpen(true)` on the **New** button, and
  `onStarted={handleStarted}` selects the returned thread. PASS.
- **Members "Message" deep-link** — `DealerMembersTab.tsx:82`
  `navigate(\`/inbox?c=${convo.id}\`)`; button `disabled={u.status !== 'ACTIVE'}`
  with the "Reactivate this member to start a chat" tooltip. PASS.
- **Admin start route** — `conversations.ts` `POST '/'` is `requireRole('admin')`
  - `startConversationSchema`, find-or-creates on `userId`, and returns 400 for a
    suspended member. First-message push confirmed in `messages.ts`
    (`pushToUsersAsync([convo.userId], …)`). PASS.
- **Suspension guards** — `admins.ts` PATCH blocks self-suspend (400) and
  last-active-admin (400); `middleware/auth.ts` re-checks admin User `status` on
  every request (403 "Account is suspended"); `auth.ts` login returns 403 for
  suspended users. PASS.

> Not run: live `smoke.sh`, real login, and socket/push delivery — those require
> a running backend + Mongo and are covered by the numbered scenarios above.

---

## Sign-off

| Scenario | Result | Tester | Date |
| -------- | ------ | ------ | ---- |
| F1.1     |        |        |      |
| F1.2     |        |        |      |
| F1.3     |        |        |      |
| F1.4     |        |        |      |
| F1.5     |        |        |      |
| F1.6     |        |        |      |
| F1.7     |        |        |      |
| F2.1     |        |        |      |
| F2.2     |        |        |      |
| F2.3     |        |        |      |
| F2.4     |        |        |      |
| F2.5     |        |        |      |
| F2.6     |        |        |      |
| F2.7     |        |        |      |
| F2.8     |        |        |      |
| F2.9     |        |        |      |

**Release recommendation:** ☐ Go ☐ Go with caveats ☐ No-go
Caveats / blockers: ****\*\*****\_\_****\*\*****
</content>
</invoke>
