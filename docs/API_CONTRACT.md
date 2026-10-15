# Dealer Kavach - REST API contract

Base URL: `/api/v1`. The server also answers `GET /health` at the root, outside `/api/v1`.

This page lists every route, who may call it, and what it is for. **For the exact fields of a body, query or response, read the schema:** `shared/src/schemas` holds the Zod validators and `shared/src/types` holds the response shapes. A route gets a full write-up below only when its rules are not obvious from the schema (TT Density, document validity, uploads, reading the slip).

Paths in the tables are relative to `/api/v1`.

## How a call works

**Sign in.** `POST /auth/login` returns a JWT. Send it as `Authorization: Bearer <jwt>` on every route except the ones marked Public.

- By default an admin token lasts 12 hours and a dealer token 365 days.
- Once a token is an hour old, the next response carries a fresh one in the `X-Refreshed-Token` header. The client swaps it in.
- A dealer account has one live session. Signing in on a second device ends the first: the old token gets `UNAUTHORIZED`.
- Admin and dealer accounts are re-read from the database on every request, so a suspension, a promotion or an archived dealer takes effect on the next call. A member of an archived dealer gets `FORBIDDEN` ("This account is no longer active.").

**Who may call.** Every router sets its own gate. The tables use these words:

| Who         | Meaning                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Public      | No login. The row names the gate that stands in for one (origin check, session token, shared secret, signature).    |
| Any user    | `requireAuth` only: an admin or a dealer member.                                                                    |
| Admin       | `requireRole('admin')`: any active admin.                                                                           |
| Super-admin | `requireSuperAdmin`: an admin with the super-admin tier.                                                            |
| Dealer      | `dealer-owner` or `dealer-staff` (the manager). Always scoped to the caller's own `dealerId`, taken from the token. |
| Owner       | `dealer-owner` only.                                                                                                |
| Participant | A member of that conversation, or any admin.                                                                        |

A dealer member reaches only their own dealer: either the path has no `:dealerId` (the dealer comes from the token), or the `:dealerId` must equal the token's (otherwise `FORBIDDEN`). Routes that serve dealer financials or compliance records are Admin-only so that a dealer token never reaches them.

**Envelope.** Every JSON response is:

- Success: `ApiSuccess<T> = { ok: true, data: T }`
- Error: `ApiError = { ok: false, error: { code, message, details? } }`

Exceptions: the film beacon answers `204` with no body, the staff DELETE routes answer `204`, `GET /runs/:runId/artifacts/:artifactId/download` answers a `302` redirect, `GET /iras-data/snapshots/:id/export.csv` answers a CSV file, `GET /whatsapp/webhook` answers Meta's challenge as plain text, and `POST /whatsapp/webhook` answers `{ ok: true }` with no `data`.

**Error codes.** `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR` (a Zod failure, with the issues in `details`), `PLUGIN_NOT_FOUND`, `PLUGIN_CONFIG_INVALID`, `RATE_LIMITED`, `BROWSER_BUSY` (503, retry after 60 s) and `INTERNAL`. The public surfaces add their own, named in their rows.

**Lists.** `page` is 1-indexed and `pageSize` defaults to 20 (max 200); the answer is `Paginated<T>` = `{ items, total, page, pageSize }`. Feeds that change while someone pages through them use a cursor instead (`before`, or `nextCursor` on `GET /asks`).

**Live updates.** New messages, thread changes and reactions travel over Socket.IO, not these routes. The event types are in `shared/src/types/socket.ts`.

---

## Route map

### Sign-in and the signed-in user

| Method | Path          | Who                  | What it does                                                                                                                                                 |
| ------ | ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/auth/login` | Public, rate limited | Email and password in; `{ token, user }` out. An admin login also carries an `admin` object for older clients.                                               |
| GET    | `/auth/me`    | Any user             | The signed-in `User`.                                                                                                                                        |
| GET    | `/me`         | Any user             | The same `User`.                                                                                                                                             |
| GET    | `/me/outlet`  | Any user             | The caller's own outlet file: the fields marked dealer-visible. The manager does not get the owner-only tax and payment fields. An admin gets an empty list. |
| PATCH  | `/me`         | Any user             | Own preferences (the UI language, `en` or `hi`).                                                                                                             |
| POST   | `/devices`    | Any user             | Register a push token (201). Re-registering a token moves it to the caller.                                                                                  |
| DELETE | `/devices`    | Any user             | Remove the caller's own push token.                                                                                                                          |

### Team and users

| Method | Path                             | Who                                                                          | What it does                                                                                             |
| ------ | -------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| GET    | `/admins`                        | Super-admin (any admin until the first super-admin exists)                   | The admin team.                                                                                          |
| POST   | `/admins`                        | same                                                                         | Add an admin: email, name, password (201).                                                               |
| PATCH  | `/admins/:id`                    | same                                                                         | Rename, suspend or reactivate, reset the password. Refuses to suspend yourself or the last active admin. |
| GET    | `/super-admin/users`             | Super-admin                                                                  | Every user, grouped by dealer; platform admins in a trailing group; archived users included.             |
| PATCH  | `/super-admin/users/:id`         | Super-admin                                                                  | Edit any user: login email, password, status, owner or manager role, super-admin tier.                   |
| DELETE | `/super-admin/users/:id`         | Super-admin                                                                  | Archive (soft delete): blocks login and drops the user from every chat. Reversible.                      |
| POST   | `/super-admin/users/:id/restore` | Super-admin                                                                  | Un-archive. Login stays off until the user is reactivated.                                               |
| POST   | `/dealer-users`                  | Admin, or an Owner for their own outlet                                      | Create a dealer member (201). An owner may add a manager only; a second owner is MDG's to add.           |
| PATCH  | `/dealer-users/:id`              | Admin; an Owner for their own manager or themselves; any user for themselves | Edit name, title, phone, status or password. Changing your own password needs `currentPassword`.         |
| DELETE | `/dealer-users/:id`              | Admin                                                                        | Suspend the member. The record stays.                                                                    |
| GET    | `/dealers/:dealerId/users`       | Admin, or the Owner of that dealer                                           | The dealer's members.                                                                                    |
| GET    | `/audit`                         | Super-admin                                                                  | The activity log (ADR 0020). Filters: `actorId`, `entity`, `entityId`, `action`, `from`, `to`; paged.    |
| GET    | `/audit/actors`                  | Super-admin                                                                  | Who has acted, with counts and last time.                                                                |

### Dealers

`status` is `ONBOARDING`, `ACTIVE` or `SUSPENDED`. Every route here is Admin-only unless the row says otherwise. A dealer is identified by its code (for example `15E`); there is no dealer name.

| Method       | Path                                             | Who         | What it does                                                                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET          | `/dealers`                                       | Admin       | The roster. Query: `search` (code, phone, GST, PAN, owner contact), `status`, `page`, `pageSize`, `sort` (for example `createdAt:desc`). A super-admin may add `includeArchived=true`.                                                                                                   |
| POST         | `/dealers`                                       | Admin       | Create a dealer. Body `{ code, phone? }` (201). A phone given here completes onboarding step 1. A duplicate code or phone is `CONFLICT`.                                                                                                                                                 |
| GET          | `/dealers/next-code`                             | Admin       | The next free dealer code, for the create form.                                                                                                                                                                                                                                          |
| GET          | `/dealers/service-summary`                       | Admin       | `?ids=a,b` (1 to 100): where each listed dealer stands on the DSR, the Credit & DOD card and the services that must run.                                                                                                                                                                 |
| GET          | `/dealers/:id`                                   | Admin       | One dealer.                                                                                                                                                                                                                                                                              |
| PATCH        | `/dealers/:id`                                   | Admin       | Change any subset of: code, phone, owner contact, location, GST, PAN (`null` clears), status, bank details, compliance docs, outlet profile, custom fields, SLA tier. `CONFLICT` for an archived dealer. Appends to `Dealer.audit` and writes an `AuditLog`.                             |
| DELETE       | `/dealers/:id`                                   | Super-admin | **Archive, not delete.** Status becomes `SUSPENDED`, `archivedAt` is set, and every active service is `PAUSED`. Runs, chats and the audit trail stay. Idempotent.                                                                                                                        |
| POST         | `/dealers/:id/restore`                           | Super-admin | Bring an archived dealer back. Status stays `SUSPENDED` and services stay `PAUSED`; a super-admin reactivates each by hand. `CONFLICT` if a new dealer has taken the code, phone, GST or PAN.                                                                                            |
| GET          | `/dealers/:id/audit`                             | Admin       | The dealer's history: `AuditLog` rows with `entity='Dealer'`, newest first, paged.                                                                                                                                                                                                       |
| GET          | `/dealers/:id/onboarding`                        | Admin       | The onboarding journey.                                                                                                                                                                                                                                                                  |
| GET          | `/dealers/:id/onboarding/next-code`              | Admin       | The suggested code for the assign-code step.                                                                                                                                                                                                                                             |
| POST         | `/dealers/:id/onboarding/steps/:stepId/complete` | Admin       | Complete the current step. Steps go in order: `collect-phone`, `send-welcome`, `send-terms-link`, `send-pdf`, `receive-payment-and-gst`, `assign-code`, `issue-app-login`. The body depends on the step (`STEP_PAYLOAD_SCHEMAS`). Completing the last step flips the dealer to `ACTIVE`. |
| POST         | `/dealers/:id/onboarding/steps/:stepId/reopen`   | Admin       | Reopen a step.                                                                                                                                                                                                                                                                           |
| PUT / DELETE | `/dealers/:id/iras-credentials`                  | Admin       | Store or remove the dealer's IRAS portal login.                                                                                                                                                                                                                                          |
| GET          | `/dealers/:id/iras-credentials/status`           | Admin       | Whether a login is stored. Never the password.                                                                                                                                                                                                                                           |
| POST         | `/dealers/:id/iras-credentials/reveal`           | Admin       | Show the stored IRAS username and password. Rate limited per admin per hour and audited before the answer is sent.                                                                                                                                                                       |
| PUT / DELETE | `/dealers/:id/sdms-credentials`                  | Admin       | Store or remove the dealer's SDMS portal login.                                                                                                                                                                                                                                          |
| GET          | `/dealers/:id/sdms-credentials/status`           | Admin       | Whether a login is stored. Never the password.                                                                                                                                                                                                                                           |
| POST         | `/dealers/:id/sdms-credentials/reveal`           | Admin       | As the IRAS reveal.                                                                                                                                                                                                                                                                      |

### Services, runs and the overview

| Method | Path                                          | Who                                                        | What it does                                                                                                                                                                           |
| ------ | --------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/services`                                   | Any user                                                   | The plugin catalog, from the in-memory registry: `ServicePluginCatalogEntry[]`.                                                                                                        |
| GET    | `/dealers/:id/services`                       | Admin; a Dealer for their own dealer                       | The services attached to a dealer. A dealer gets each row without its `config`.                                                                                                        |
| POST   | `/dealers/:id/services`                       | Admin                                                      | Attach a service (201). See below.                                                                                                                                                     |
| PATCH  | `/dealer-services/:dsId`                      | Admin                                                      | Change `config`, `cadence`, `customCron` or `status`. See below.                                                                                                                       |
| DELETE | `/dealer-services/:dsId`                      | Admin                                                      | Detach: hard-deletes the attachment. Refused while an attached service depends on it. Also withdraws the open document asks that service owned. `ServiceRun` history stays.            |
| POST   | `/dealer-services/:dsId/run-now`              | Admin                                                      | Start a run now. **202** `{ runId }`.                                                                                                                                                  |
| GET    | `/runs`                                       | Admin                                                      | Run history, newest first. Query: `dealerId`, `serviceId`, `status`, `from`, `to`, `page`, `pageSize`.                                                                                 |
| GET    | `/runs/:id`                                   | Admin                                                      | One run, with signed URLs for its artifacts. Diagnostic artifacts and the run's process detail are for super-admins only.                                                              |
| GET    | `/runs/:runId/artifacts/:artifactId/download` | Admin                                                      | `302` to a short-lived signed URL, forced to download. Audited.                                                                                                                        |
| GET    | `/overview/day`                               | Admin                                                      | "Today", the whole Overview page in one call: `OverviewDay`. Query: `date` (an IST day; the default is yesterday, and a future date falls back to it), `fresh=1` skips the 20 s cache. |
| GET    | `/overview/health`                            | Super-admin                                                | The machinery's own vital signs: `OverviewHealth`.                                                                                                                                     |
| GET    | `/overview`                                   | Admin                                                      | The older platform counters (dealers by status, services attached, runs in the last 24 hours), cached 30 s. The admin app now reads `/overview/day`.                                   |
| POST   | `/service-logs`                               | Admin                                                      | Log a service given to a dealer (201).                                                                                                                                                 |
| GET    | `/service-logs`                               | Admin (optional `dealerId`); a Dealer for their own outlet | The service history, newest first. `limit` default 100, max 200.                                                                                                                       |

**Attach (`POST /dealers/:id/services`).** Body `attachServiceSchema` = `{ serviceId, config, cadence?, customCron? }`. The server validates `config` against the plugin's schema. The unique index on `{ dealerId, serviceId }` makes a second attach of the same service `CONFLICT`. A service that declares `dependsOn` needs those services attached first (`BAD_REQUEST`). Response (201): the `DealerService` with its computed `schedule` and `nextRunAt`. A self-scheduling plugin also gets one discovery run right after the response. Errors: `PLUGIN_NOT_FOUND`, `PLUGIN_CONFIG_INVALID` (422), `CONFLICT`. The dealer must not be archived (`NOT_FOUND`).

**Change (`PATCH /dealer-services/:dsId`).** Body `updateDealerServiceSchema`.

- Changing `config` re-validates it against the plugin schema.
- Changing `cadence` or `customCron` recomputes `schedule` and `nextRunAt`. `customCron: ''` removes the cron.
- `status='PAUSED'` clears `nextRunAt`. Setting `ACTIVE` again recomputes it.
- Editing the `config` of a `dsr-report` service marks the reports it invalidated as stale, and the answer carries `meta.staleDates`.

**Run now.** Body `runNowSchema` (optional `configOverride`, merged over the stored config for this run only). It creates a `ServiceRun` with `trigger='manual'` and returns `202` at once; the run goes on in the background. Credit & DOD drives a live SDMS login per run, so it also refuses a second run while one is in flight (`CONFLICT`) and, unless the caller is a super-admin, a manual run once the dealer has used its hourly cap (3 by default, failed attempts count; `RATE_LIMITED`).

**Overview.** `OverviewDay`, `OverviewSummary`, `TriageItem`, `DealerDayRow` and `OverviewHealth` are in `shared/src/types/overview.ts`. The page grades a reporting day (yesterday by default) and lists what needs a person, pre-ranked by the server.

### Uploads and downloads

| Method | Path                    | Who                                             | What it does                                                                                                               |
| ------ | ----------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/uploads/sign`         | Any user; the `scope` decides who may sign what | Presign an upload: `{ uploadUrl, storageKey, expiresIn }`. See [Uploads](#uploads).                                        |
| GET    | `/uploads/download-url` | Any user, with a per-prefix ownership check     | A signed URL for an `avatars/`, `chat/`, `staff/` or `kavach/` key. Other prefixes are served by their own feature routes. |

### Chat

A thread belongs to one dealer member. An owner's thread is their private line to MDG; the manager's is a group thread the owners can read. Reports and records have no routes of their own: a report reaches a dealer as a chat message (ADR 0018).

| Method | Path                                                  | Who         | What it does                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/conversations`                                      | Admin       | The inbox. `status` is one of `open`, `assigned`, `mine`, `all`, `flagged`, `resolved`, `ai`, `ai-guard`, `tickets`. Also `limit` (max 200) and `before`.                                                                                                                                                                                                                                                                        |
| GET    | `/conversations/counts`                               | Admin       | Every tab badge in one call: `open`, `mine`, `all`, `resolved`, `flagged`, `ai`, `aiGuard`, `tickets`.                                                                                                                                                                                                                                                                                                                           |
| POST   | `/conversations`                                      | Admin       | Open (or reuse) a dealer member's thread. Body `{ userId }`. 201 if new, 200 if it existed. The member must be active.                                                                                                                                                                                                                                                                                                           |
| GET    | `/conversations/mine`                                 | Dealer      | Every thread the caller is in, each with their own `unreadCount`. Without the triage fields or the AI block.                                                                                                                                                                                                                                                                                                                     |
| GET    | `/conversations/:id`                                  | Participant | One thread. A dealer gets their own copy.                                                                                                                                                                                                                                                                                                                                                                                        |
| POST   | `/conversations/:id/assign`                           | Admin       | Take the thread, or give it to `adminId`. Clears the flag.                                                                                                                                                                                                                                                                                                                                                                       |
| PATCH  | `/conversations/:id/ticket`                           | Admin       | Set the thread's `priority` or `category`. (Not the Tickets below.)                                                                                                                                                                                                                                                                                                                                                              |
| POST   | `/conversations/:id/resolve`                          | Admin       | Close the thread with a service-log entry (`serviceId`, `serviceName?`, `notes`, `attachments?`). Posts "Resolved - ..." and pushes the dealer. It detaches Kavach escalations and does **not** close Tickets.                                                                                                                                                                                                                   |
| POST   | `/conversations/:id/reopen`                           | Admin       | Put the thread back in the unassigned pool.                                                                                                                                                                                                                                                                                                                                                                                      |
| POST   | `/conversations/:id/ai-guard/clear`                   | Super-admin | Clear the AI guard mark on a thread. Nothing else clears it.                                                                                                                                                                                                                                                                                                                                                                     |
| GET    | `/conversations/:id/messages`                         | Participant | The newest `limit` messages (default 50, max 200), oldest first. `before` (ISO time) pages back. Attachments carry signed view URLs.                                                                                                                                                                                                                                                                                             |
| GET    | `/conversations/:id/messages/search`                  | Participant | `q`, 2 to 100 characters, matched literally and without case, in message text only. Up to 50 hits, newest first: `{ messageId, senderId, createdAt, snippet }`.                                                                                                                                                                                                                                                                  |
| POST   | `/conversations/:id/messages`                         | Participant | Send a message (201). Body `sendMessageSchema` = `{ body?, attachments? (max 10), replyToMessageId?, answersAsk? }`; at least a body or one attachment. Every attachment key must sit under this chat's `chat/<conversationId>/` folder and exist in storage. A dealer message then starts the AI first line. A dealer photo that answers a request (`answersAsk`, or a reply to the ask message) is filed against that request. |
| GET    | `/conversations/:id/messages/:messageId/download-url` | Participant | A signed URL for one attachment of that message. `?key=` is required; `?disposition=attachment` forces a download and is audited.                                                                                                                                                                                                                                                                                                |
| POST   | `/conversations/:id/messages/share`                   | Admin       | Send a message or files to the whole outlet. Body `shareChatMessageSchema` = `{ body?, attachments?, audience }`, with `audience` `owners`, `managers` or `both`. One copy per chat, from the admin (201, `ChatShareOutcome`). No voice notes.                                                                                                                                                                                   |
| POST   | `/conversations/:id/messages/:messageId/receive`      | Admin       | Mark a dealer's photo as **received** for one of the outlet's requests. Body `{ ref, attachmentIndex?, validUntil? }`. Accepts the request, and MDG replies "Received" quoting the photo, which also stops the reply clock. A paper that tracks validity needs `validUntil`, as in `POST /asks/:id/accept`.                                                                                                                      |
| POST   | `/conversations/:id/messages/:messageId/send-back`    | Admin       | Send a dealer's answer back. Body `{ ref, reason }` (reason 4 to 500 characters, shown to the dealer as written). The request opens again. The density register page cannot be sent back (400).                                                                                                                                                                                                                                  |
| POST   | `/conversations/:id/messages/:messageId/reactions`    | Participant | Set the caller's reaction: `{ emoji }`, one of the six quick reactions. One per user per message.                                                                                                                                                                                                                                                                                                                                |
| DELETE | `/conversations/:id/messages/:messageId/reactions`    | Participant | Remove the caller's reaction. Removing one that is not there is a 200.                                                                                                                                                                                                                                                                                                                                                           |
| GET    | `/conversations/:id/media`                            | Participant | The Media, Docs and Links gallery. `tab` (default `media`), `before`, `limit` (default 30, max 100).                                                                                                                                                                                                                                                                                                                             |

### Tickets

A ticket is a dealer question the AI first line handed to a person. It stays open until an admin resolves it with a note. Nothing here raises one: the AI first line does (ADR 0017). A dealer sees the state and times of their own tickets on the conversation they already read.

| Method | Path                         | Who   | What it does                                                                                                                          |
| ------ | ---------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/tickets`                   | Admin | The queue. `state` (`OPEN` default, or `RESOLVED`), `dealerId`, `limit` (max 100), `before`.                                          |
| GET    | `/tickets/counts`            | Admin | Ticket counts.                                                                                                                        |
| GET    | `/tickets/:id`               | Admin | One ticket.                                                                                                                           |
| POST   | `/tickets/:id/seen`          | Admin | Stamp that an admin opened it. Only the first call changes anything.                                                                  |
| POST   | `/tickets/:id/resolve`       | Admin | Close it. Body `{ note }` (1 to 1,000 characters after trimming). The only call that closes a ticket. `CONFLICT` if already resolved. |
| POST   | `/tickets/:id/reopen`        | Admin | Open it again. `CONFLICT` if it is open, or another ticket is open on the same thread.                                                |
| PATCH  | `/tickets/:id`               | Admin | Mark urgent or not: `{ urgent }`.                                                                                                     |
| GET    | `/conversations/:id/tickets` | Admin | One thread's tickets: every open one, and any resolved in the last 7 days.                                                            |

### Asks and papers

MDG asks a dealer for a paper, a register page or a Kavach photo in the chat; the dealer answers in the chat; an admin marks it received (`…/messages/:messageId/receive` above). A request is named by a **ref** (ADR 0019). The paper rules (validity, renewals, the reminder ladder) are written out under [Document validity](#document-validity-and-renewal-reminders).

Admin routes:

| Method | Path                                | Who         | What it does                                                                                                                                                                                                         |
| ------ | ----------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/dealers/:dealerId/open-requests`  | Admin       | What MDG is still waiting for from one outlet: open and sent requests across papers, register days and Kavach photos.                                                                                                |
| GET    | `/asks`                             | Admin       | With both `kindCode` and `periodKey`: the **estate** view, one row per live dealer for that paper and period. Otherwise a keyset page of asks (`nextCursor`). Also filters `expiringWithinDays` and `validityState`. |
| POST   | `/asks`                             | Admin       | Ask one dealer for a paper (201). Push and live event go out at once.                                                                                                                                                |
| POST   | `/asks/:id/remind`                  | Admin       | Ask again, on the same row. Only while it is the dealer's turn (else `CONFLICT`), and at most once an hour (`RATE_LIMITED`). From the third ask the answer tells the admin to phone instead.                         |
| POST   | `/asks/:id/withdraw`                | Admin       | MDG no longer needs it.                                                                                                                                                                                              |
| POST   | `/asks/:id/accept`                  | Admin       | Accept the paper. Body `{ validUntil?, reminderOffsetDays? }`.                                                                                                                                                       |
| POST   | `/asks/:id/file-for-dealer`         | Admin       | MDG already holds the paper and files it for the dealer.                                                                                                                                                             |
| PATCH  | `/asks/:id/validity`                | Admin       | Correct the date or the reminder steps on an accepted paper.                                                                                                                                                         |
| POST   | `/asks/:id/reject`                  | Admin       | Send the paper back with a reason (at least 10 characters, shown to the dealer as written).                                                                                                                          |
| GET    | `/asks/:id/file-url`                | Admin       | A signed URL for the paper. Audited.                                                                                                                                                                                 |
| GET    | `/document-kinds`                   | Admin       | The catalog of papers. `?activeOnly=true` for pickers.                                                                                                                                                               |
| POST   | `/super-admin/document-kinds`       | Super-admin | Add a paper to the catalog (201).                                                                                                                                                                                    |
| PATCH  | `/super-admin/document-kinds/:code` | Super-admin | Edit a paper.                                                                                                                                                                                                        |

Dealer routes (all under `/asks/me`, Dealer only). **The dealer app has called only `GET /asks/me/states` since 13 Oct 2026 (ADR 0019); the others are still served.**

| Method | Path                    | What it does                                                                                                                       |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/asks/me/states`       | Where each request in the chat stands. `?refs=a,b,c` (1 to 50). A ref the dealer does not own is simply absent.                    |
| GET    | `/asks/me`              | Everything this dealer is being asked for.                                                                                         |
| POST   | `/asks/me/volunteer`    | The dealer sends something nobody asked for. Mints the row first (201); then presign, upload, submit.                              |
| POST   | `/asks/me/:id/submit`   | Send the paper. The key is fenced to `ask/<dealerId>/<askId>/` and checked in storage before any state changes. A replay is a 200. |
| GET    | `/asks/me/on-file`      | The dealer's filing cabinet of accepted papers. See below.                                                                         |
| GET    | `/asks/me/:id/file-url` | Look at what they sent. Audited.                                                                                                   |

### AI first line

The first line answers a dealer's message before a person does, from what the system already holds. It has no route of its own: `POST /conversations/:id/messages` starts it after the dealer's message is saved, and it decides for itself whether that message is one it may answer. Every decision, a skip included, is written to the turn log. A question it cannot settle becomes a ticket. On the live server (checked 15 Oct 2026) `AI_FIRSTLINE_ENABLED=true` and `AI_FIRSTLINE_ENGINE=brief` (ADR 0013, ADR 0017).

| Method | Path                                           | Who         | What it does                                                                                                                                                                                                                                                |
| ------ | ---------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/ai-turns`                                    | Admin       | The turn log. Filters: `dealerId`, `conversationId`, `outcome` (`ANSWERED`, `HANDED_OFF`, `SUPPRESSED`, `SUPERSEDED`, `SHADOW`), `reason`, `intent`, `verdict`, `reviewed`, `writer`, `from`, `to` (IST days). `reviewed=false` is the review queue. Paged. |
| GET    | `/ai-turns/counts`                             | Admin       | Counts by outcome and the unreviewed total (the nav badge), plus the last 24 hours: WRONG verdicts against the limit that switches the first line off, writer use, and quick follow-ups.                                                                    |
| POST   | `/ai-turns/:id/review`                         | Admin       | Judge a turn: `{ verdict }`, one of `RIGHT`, `WRONG`, `POORLY_WORDED`, `SHOULD_HAVE_HANDED_OFF`. May be changed later.                                                                                                                                      |
| GET    | `/super-admin/ai-first-line`                   | Super-admin | Where both switches stand, who last moved them, and the environment flags behind them.                                                                                                                                                                      |
| PUT    | `/super-admin/ai-first-line`                   | Super-admin | Move a switch: `{ enabled?, writer? }`, at least one. `enabled=false` is Off; `enabled=true` with `writer=false` is Templates only; both true is Full. Takes effect within about 30 seconds.                                                                |
| GET    | `/super-admin/ai-first-line/dealers`           | Super-admin | Every live dealer with its mode (`OFF`, `SHADOW`, `ON`) and who last changed it.                                                                                                                                                                            |
| PUT    | `/super-admin/ai-first-line/dealers/:dealerId` | Super-admin | Set one dealer's mode: `{ mode }`. A dealer is `OFF` until someone sets it.                                                                                                                                                                                 |

### Admin alerts

An alert is something that needs a person. A sweep raises and clears them; nothing here creates one (ADR 0016).

| Method | Path                        | Who   | What it does                                                                                                                                                                                                                                                                                  |
| ------ | --------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/admin-alerts`             | Admin | `view` is `open` (default), `dismissed` or `cleared` (the last 7 days). `limit` default 100, max 200. Answer `{ items, counts: { open, dismissed } }`. Five kinds are shown to super-admins only: WhatsApp replies, grievances, new registrations, server restarts and failed start-up steps. |
| POST   | `/admin-alerts/:id/dismiss` | Admin | Hide an open alert. A problem that still stands stays live and clears itself once fixed.                                                                                                                                                                                                      |
| POST   | `/admin-alerts/:id/restore` | Admin | Un-hide a dismissed alert.                                                                                                                                                                                                                                                                    |

### The website, the assistant and WhatsApp

These are the routes a person outside the app can reach. Each public one has its own gate instead of a login.

**Landing assistant** (mdgservices.in, ADR 0009). Every route is origin-checked. After `POST /assist/session`, send the returned session token. A blocked visitor gets `ASSIST_BLOCKED` (403), a session past its turn cap gets `TURN_LIMIT` (429), and a voice upload that is not webm, ogg, mp4 or mp3 gets `UNSUPPORTED_MEDIA_TYPE` (415).

| Method     | Path                                        | Who             | What it does                                                                                                                     |
| ---------- | ------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| GET        | `/assist/config`                            | Public (origin) | Widget settings: whether chat and calls are on, languages, limits, the recording notice.                                         |
| POST       | `/assist/session`                           | Public (origin) | Start a visitor session (201): token, greeting, language. `ASSIST_DISABLED` (503) when it is off.                                |
| POST       | `/assist/message`                           | Session token   | One typed turn.                                                                                                                  |
| POST       | `/assist/voice`                             | Session token   | One voice turn: audio in (webm, ogg, mp4 or mp3), transcript and spoken reply out.                                               |
| POST       | `/assist/voice/live-token`                  | Session token   | A token for live captions. `LIVE_TRANSCRIPT_OFF` (503) when off.                                                                 |
| POST       | `/assist/lead`                              | Session token   | Save the visitor's name and number.                                                                                              |
| POST       | `/assist/escalate`                          | Session token   | Ask for a call-back. `MOBILE_UNCONFIRMED` (400) until the number was read back and confirmed through `/assist/lead`.             |
| POST       | `/assist/grievance`                         | Session token   | File a grievance for the visitor. 201, or 200 with `duplicate: true` on a retry. Not held back by the kill switch or the budget. |
| POST       | `/assist/end`                               | Session token   | The visitor left.                                                                                                                |
| GET        | `/super-admin/assist/sessions`              | Super-admin     | Sessions and leads, filtered and paged.                                                                                          |
| GET        | `/super-admin/assist/sessions/:id`          | Super-admin     | One session: the whole conversation, with signed recording links.                                                                |
| PATCH      | `/super-admin/assist/sessions/:id/followup` | Super-admin     | Record whether somebody rang the visitor back.                                                                                   |
| GET / POST | `/super-admin/assist/blocks`                | Super-admin     | List or add blocks on a visitor.                                                                                                 |
| DELETE     | `/super-admin/assist/blocks/:id`            | Super-admin     | Lift a block.                                                                                                                    |
| GET        | `/super-admin/assist/usage`                 | Super-admin     | Usage and spend per day (`days`).                                                                                                |
| GET        | `/super-admin/assist/kb`                    | Super-admin     | Knowledge base status and the daily budget.                                                                                      |
| POST       | `/super-admin/assist/kb/reload`             | Super-admin     | Reload the knowledge base.                                                                                                       |

**Films** (mdgservices.in film pages, ADR 0015).

| Method     | Path                          | Who                  | What it does                                                                                                                                                                       |
| ---------- | ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST       | `/films/beacon`               | Public, rate limited | A watch beacon from a film page. Body is JSON, sent as `text/plain` or `application/json`. **204**, no body. `INVALID_BEACON` (400), `FILM_NOT_READY` (409), `RATE_LIMITED` (429). |
| GET        | `/admin/films`                | Super-admin          | The films with their headline numbers.                                                                                                                                             |
| GET / POST | `/admin/films/links`          | Super-admin          | List, or create (201), tracked share links.                                                                                                                                        |
| DELETE     | `/admin/films/links/:code`    | Super-admin          | Archive a share link.                                                                                                                                                              |
| GET        | `/admin/films/:film/stats`    | Super-admin          | Views, retention and drop-offs.                                                                                                                                                    |
| GET        | `/admin/films/:film/sessions` | Super-admin          | Individual viewing sessions.                                                                                                                                                       |

**Website forms.** The website's own server posts here; no browser does.

| Method | Path                              | Who                                                                                                                | What it does                                                                                                            |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| POST   | `/website/grievances`             | The website server: `Authorization: Bearer <WEBSITE_INTAKE_SECRET>`; wrong-secret attempts are rate limited per IP | Save a grievance. 201, or 200 with `duplicate: true` for a retry. `INTAKE_DISABLED` (503) when no usable secret is set. |
| POST   | `/website/enrolments`             | same                                                                                                               | Save a "Register your pump" form. Same answers.                                                                         |
| GET    | `/admin/grievances`               | Super-admin                                                                                                        | `view` (`open` default, or `all`), `limit` 0 to 500 (0 sends counts only).                                              |
| POST   | `/admin/grievances/:id/resolve`   | Super-admin                                                                                                        | Resolve with a note: `{ note }`.                                                                                        |
| POST   | `/admin/grievances/:id/reopen`    | Super-admin                                                                                                        | Reopen.                                                                                                                 |
| GET    | `/admin/enrolments`               | Super-admin                                                                                                        | `view` (`new` default, or `all`), `limit` as above.                                                                     |
| POST   | `/admin/enrolments/:id/contacted` | Super-admin                                                                                                        | Mark contacted, with an optional `{ note }`.                                                                            |
| POST   | `/admin/enrolments/:id/reopen`    | Super-admin                                                                                                        | Reopen.                                                                                                                 |

**WhatsApp** (Business API webhook).

| Method | Path                           | Who                                   | What it does                                                                                                               |
| ------ | ------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/whatsapp/webhook`            | Public (Meta's verify token)          | Meta's subscription handshake.                                                                                             |
| POST   | `/whatsapp/webhook`            | Public (Meta's `x-hub-signature-256`) | Delivery and read reports, replies, and "Stop promotions" taps. An unsigned or wrongly signed body is `401 BAD_SIGNATURE`. |
| GET    | `/admin/whatsapp/replies`      | Super-admin                           | Replies by person. `view` (`unread` default, or `all`), `limit` max 100.                                                   |
| POST   | `/admin/whatsapp/replies/seen` | Super-admin                           | Mark a person's replies read: `{ person, upTo }`.                                                                          |

### Shift data, DSR and the dealer's records

All Admin-only: a dealer token never reaches any of these. The "collect", "generate" and "capture" routes start a normal `ServiceRun`, so an on-demand run looks like a scheduled one in run history, audit and live progress, and answer **202** `{ runId }`.

**Shift data (`/iras-data`).**

| Method       | Path                                                                  | What it does                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET          | `/iras-data/vault`                                                    | Every dealer with the pipeline attached and its snapshot for `businessDate` (default today, IST). A dealer who should be collected but produced nothing shows as missing. |
| GET          | `/iras-data/snapshots`                                                | Snapshot summaries, without rows. Filters `dealerId`, `from`, `to`, `status`; paged.                                                                                      |
| GET          | `/iras-data/snapshots/:id`                                            | One snapshot in full.                                                                                                                                                     |
| GET          | `/iras-data/snapshots/:id/export.csv`                                 | One dataset (`?code=`) as CSV, in the portal's column order. Corrected rows where a day has corrections.                                                                  |
| GET          | `/iras-data/dealers/:dealerId/latest`                                 | The latest snapshot, failures included.                                                                                                                                   |
| GET          | `/iras-data/dealers/:dealerId/day-states`                             | The dealer's days one by one, including days with no snapshot. `from`, `to` or `days` (default 30, max 366).                                                              |
| PUT / DELETE | `/iras-data/dealers/:dealerId/days/:businessDate/verification`        | Accept a day whose figures do not add up (with a note), or withdraw the acceptance.                                                                                       |
| POST         | `/iras-data/dealers/:dealerId/collect`                                | Collect now. Optional `businessDate` (not in the future). 202.                                                                                                            |
| POST         | `/iras-data/dealers/:dealerId/days/:businessDate`                     | Open a hand-entered day for an outlet nobody collects for. Optional `shiftTime`. 201 if new, 200 if it existed.                                                           |
| GET          | `/iras-data/dealers/:dealerId/days/:businessDate`                     | Everything the shift data editor needs for one dealer-day.                                                                                                                |
| POST         | `/iras-data/dealers/:dealerId/days/:businessDate/corrections/preview` | Recompute the day with pending changes and save nothing.                                                                                                                  |
| PUT          | `/iras-data/dealers/:dealerId/days/:businessDate/corrections`         | Apply a day's corrections as one commit. Flags the reports it invalidated; regenerates none.                                                                              |
| GET          | `/iras-data/dealers/:dealerId/corrections`                            | Every correction the dealer has had, newest day first. `limit` default 50.                                                                                                |
| POST         | `/iras-data/dealers/:dealerId/days/:businessDate/read-slip`           | Read a photographed shift slip. See [Reading the slip](#reading-the-slip).                                                                                                |
| GET          | `/iras-data/dealers/:dealerId/slip-reads/:slipReadId/photo-url`       | The slip photograph, signed.                                                                                                                                              |

**Daily Sales Report (`/dsr`).**

| Method | Path                                      | What it does                                                                                                                                                                                                                                                                                                 |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/dsr/overview`                           | Every dealer with the generator attached and its latest report headline.                                                                                                                                                                                                                                     |
| GET    | `/dsr/dealers/:dealerId/latest`           | The latest report: digest and signed card URLs. `NOT_FOUND` if none yet.                                                                                                                                                                                                                                     |
| GET    | `/dsr/dealers/:dealerId/reports`          | Recent report headlines. `limit` default 60, max 200.                                                                                                                                                                                                                                                        |
| GET    | `/dsr/dealers/:dealerId/pnl`              | Litres sold per product between `from` and `to` (both required). Litres only: no rate, no rupee figure.                                                                                                                                                                                                      |
| GET    | `/dsr/dealers/:dealerId/setup-draft`      | The pump layout read from the latest shift data, for setting a dealer up.                                                                                                                                                                                                                                    |
| GET    | `/dsr/reports/:id`                        | One report.                                                                                                                                                                                                                                                                                                  |
| POST   | `/dsr/dealers/:dealerId/generate`         | Generate or regenerate now. Optional `businessDate`. 202.                                                                                                                                                                                                                                                    |
| GET    | `/dsr/dealers/:dealerId/stale`            | Which reports no longer match their inputs.                                                                                                                                                                                                                                                                  |
| POST   | `/dsr/dealers/:dealerId/regenerate-stale` | Start a run at the earliest date that needs work. 202 `{ runId, businessDate, staleDates }`. `BAD_REQUEST` if nothing is stale.                                                                                                                                                                              |
| POST   | `/dsr/reports/:id/share`                  | Post the two cards and a line to the chat. Body `{ audience? }` (`owners`, `managers`, `both`). Once per report; a second call returns the first share. With `ASSURANCE_MODE=ENFORCE` (the live setting) a report the correctness check is holding is refused with `BAD_REQUEST` until an admin releases it. |

**Report checks (`/assurance`).**

| Method | Path                                             | What it does                                                                                                                                      |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/assurance/holds`                               | Reports currently held back, newest business date first. `limit` default 50.                                                                      |
| GET    | `/assurance/reports/:reportId`                   | One report's verdict, evaluated now.                                                                                                              |
| POST   | `/assurance/reports/:reportId/override`          | Release a held report. Body `{ reason (10+ characters), acknowledged: [finding codes] }`. Covers only the findings named, and only those figures. |
| GET    | `/assurance/dealers/:dealerId/remarks`           | The dealer's remarks that explain a check. `?includeRevoked=true`.                                                                                |
| POST   | `/assurance/dealers/:dealerId/remarks`           | Add a remark (201).                                                                                                                               |
| DELETE | `/assurance/dealers/:dealerId/remarks/:remarkId` | Revoke a remark.                                                                                                                                  |

**Credit & DOD (`/credit-dod`).**

| Method | Path                                      | What it does                                                                    |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------- |
| GET    | `/credit-dod/vault`                       | Every dealer with the service attached and its ledger digest.                   |
| GET    | `/credit-dod/dealers/:dealerId/snapshots` | Snapshot history, newest first (`limit`).                                       |
| GET    | `/credit-dod/snapshots/:id`               | One snapshot. Raw portal captures are signed for super-admins only.             |
| GET    | `/credit-dod/dealers/:dealerId/quota`     | How many manual generations the dealer has left in the current window.          |
| GET    | `/credit-dod/dealers/:dealerId/ledger`    | The maintained PAD ledger, most recently published first. `limit`, `beforeSeq`. |
| POST   | `/credit-dod/snapshots/:id/share`         | Post the card to the dealer's chat. Body `{ audience? }`.                       |

**Ledger Watch (`/ledger-watch`).** Reads the Credit & DOD ledger and flags what is not routine. It observes; it cannot change a ledger figure.

| Method | Path                                         | What it does                                                                                         |
| ------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET    | `/ledger-watch/flags`                        | Findings across all live dealers.                                                                    |
| GET    | `/ledger-watch/dealers/:dealerId/flags`      | One dealer's findings, newest ledger date first.                                                     |
| GET    | `/ledger-watch/dealers/:dealerId/summary`    | The month's charged-against-received summary (`month`, default this IST month).                      |
| PATCH  | `/ledger-watch/flags/:id`                    | Acknowledge, resolve or ignore a finding. The only thing that moves a finding's status.              |
| GET    | `/ledger-watch/rules`                        | The rule catalogue and the confirm queue (`?source=AI_PROPOSED&reviewed=false`).                     |
| PATCH  | `/ledger-watch/rules/:id`                    | Confirm or change a rule. Does not re-run detection.                                                 |
| POST   | `/ledger-watch/sweep`                        | Run detection now. `?propose=false` skips the model. Proposals are created inactive.                 |
| GET    | `/ledger-watch/dealers/:dealerId/card`       | The dealer's card. `from` and `to` together widen the window; one alone is a 400. Audited as a read. |
| POST   | `/ledger-watch/dealers/:dealerId/card/share` | Post the card to the chat. Body `{ audience? }`.                                                     |

**Load Planner (`/load-planner`).** When to order the next tanker, which fuel per chamber, which tank each chamber unloads into; always a four-day projection.

| Method | Path                                  | What it does                                                                                         |
| ------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET    | `/load-planner/dealers/:dealerId`     | The admin pane's one-call payload for a dealer.                                                      |
| GET    | `/load-planner/plans/:planId`         | One plan in full.                                                                                    |
| GET    | `/load-planner/plans/:planId/card`    | Signed URLs of the plan's card, or `null` if not drawn. Never draws.                                 |
| POST   | `/load-planner/plans/:planId/card`    | Draw the card if there is none, then sign it.                                                        |
| POST   | `/load-planner/plans/:planId/approve` | Approve a draft and send its card to the dealer's chat. Body `{ audience? }`. Once only.             |
| POST   | `/load-planner/plans/:planId/dismiss` | Dismiss a draft with `{ reason }`. A plan already sent, dismissed or superseded cannot be dismissed. |

**Inspection reports, RO supply status and water ingress.**

| Method | Path                                               | What it does                                                                            |
| ------ | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| GET    | `/inspection-reports/dealers/:dealerId/summary`    | The Vault section: the latest reports and how many more the portal holds. Never 404s.   |
| GET    | `/inspection-reports/dealers/:dealerId/latest`     | The latest full snapshot, failures included.                                            |
| POST   | `/inspection-reports/dealers/:dealerId/generate`   | Capture now. 202.                                                                       |
| GET    | `/ro-supply-status/dealers/:dealerId/summary`      | Whether SAP is blocking supply to the outlet, and the conditions behind it. Never 404s. |
| GET    | `/ro-supply-status/dealers/:dealerId/latest`       | The full snapshot with the evidence each mark was read from.                            |
| POST   | `/ro-supply-status/dealers/:dealerId/collect`      | Capture now. 202.                                                                       |
| GET    | `/ro-supply-status/dealers/:dealerId/card`         | The status card, signed inline and as a download. Audited as a read.                    |
| GET    | `/water-ingress/dealers/:dealerId/days`            | The dealer's recent days with each slot grid, newest first (`limit`, max 90).           |
| GET    | `/water-ingress/dealers/:dealerId/days/:date`      | One day.                                                                                |
| GET    | `/water-ingress/dealers/:dealerId/days/:date/card` | The day's card, signed inline and as a download. Audited as a read.                     |

**TT Density (`/tt-density`).** Full write-up below under [TT Density](#tt-density).

- Admin, under `/tt-density/dealers/:dealerId`: `GET /summary`, `GET /invoices`, `GET /invoices/:invoiceId`, `GET /invoices/:invoiceId/pdf-url`, `GET /days`, `GET /days/:businessDate/photo-url`, `POST /days/:businessDate/photo`, `POST /collect` (202).
- Dealer, under `/tt-density/me`: `GET /`, `POST /days/:businessDate/photo`, `GET /days/:businessDate/photo-url`. The dealer app no longer calls these.

### Kavach and staff points

**Kavach** (ADR 0006, ADR 0011). An admin or the automation certifies every task; a dealer can only claim or send evidence.

| Method         | Path                                                    | Who                                      | What it does                                                                                          |
| -------------- | ------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| POST           | `/dealers/:dealerId/kavach/programme`                   | Admin                                    | Start a dealer's Kavach programme (201).                                                              |
| GET / PATCH    | `/dealers/:dealerId/kavach/programme`                   | Admin                                    | Read, or change, the programme settings.                                                              |
| GET            | `/dealers/:dealerId/kavach/items`                       | Any user (a Dealer for their own dealer) | The dealer's tasks. Filters `bucket`, `status`, `dueOnly`. A dealer never sees paused tasks.          |
| POST           | `/dealers/:dealerId/kavach/items`                       | Admin                                    | Add a custom task (201).                                                                              |
| GET            | `/dealers/:dealerId/kavach/digests`                     | Admin                                    | The day-by-day cards an admin can share.                                                              |
| POST           | `/dealers/:dealerId/kavach/digests/:businessDate/share` | Admin                                    | Render the day's card and post it to the chat. Body `{ audience? }`.                                  |
| GET            | `/dealers/:dealerId/kavach/work-list`                   | Admin                                    | The per-dealer overlay on the global task catalog.                                                    |
| GET            | `/dealers/:dealerId/kavach/work-list/effective`         | Admin                                    | The list the dealer is actually scored against.                                                       |
| PUT            | `/dealers/:dealerId/kavach/work-list`                   | Admin                                    | Replace the overlay as a whole.                                                                       |
| GET            | `/kavach/items/:itemId`                                 | Any user (a Dealer for their own item)   | One task.                                                                                             |
| POST           | `/kavach/items/:itemId/verify`                          | Admin                                    | Certify a task.                                                                                       |
| POST           | `/kavach/items/:itemId/request-evidence`                | Admin                                    | Ask the dealer for a photo.                                                                           |
| POST           | `/kavach/items/:itemId/evidence`                        | Dealer                                   | Send evidence. An empty body is a claim that queues the task for review; it moves no score.           |
| POST           | `/kavach/items/:itemId/reject-evidence`                 | Admin                                    | Send the evidence back.                                                                               |
| PATCH          | `/kavach/items/:itemId/paused`                          | Admin                                    | Pause or resume a task.                                                                               |
| PATCH          | `/kavach/items/:itemId/sos`                             | Admin                                    | Set the SOS compliance flag on a task.                                                                |
| DELETE         | `/kavach/items/:itemId`                                 | Admin                                    | Remove a custom task.                                                                                 |
| GET            | `/kavach/catalog`                                       | Admin                                    | The active catalog, read-only, for filters.                                                           |
| GET            | `/kavach/work-queue`                                    | Admin                                    | Every dealer's outstanding work in one list.                                                          |
| GET            | `/kavach/dashboard`                                     | Admin                                    | One row per live dealer with an active programme: score and counts.                                   |
| GET            | `/kavach/me`                                            | Dealer                                   | The dealer's own programme and tasks. **Still served; the dealer app no longer calls it (ADR 0019).** |
| GET / POST     | `/super-admin/kavach-items`                             | Super-admin                              | The global catalog including retired rows; add a task (201).                                          |
| PATCH / DELETE | `/super-admin/kavach-items/:code`                       | Super-admin                              | Edit a catalog task, or retire it. Editing points moves every dealer without an override.             |

**Staff points** (ADR 0007). A dealer keeps its own roster and awards points; an admin has the same control over any dealer through `/dealers/:dealerId/staff`.

| Method             | Path                                                 | Who                                  | What it does                                                                                                                                       |
| ------------------ | ---------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET                | `/staff-work-items`                                  | Any user                             | The global work catalog.                                                                                                                           |
| GET                | `/dealers/:dealerId/work-items`                      | Admin; a Dealer for their own dealer | The dealer's effective work list (catalog plus its own).                                                                                           |
| GET / POST         | `/dealers/:dealerId/employees`                       | Dealer                               | The roster with each employee's points for `from` to `to` (`includeInactive` too), or add an employee (201).                                       |
| PATCH              | `/dealers/:dealerId/employees/:id`                   | Dealer                               | Edit an employee.                                                                                                                                  |
| GET                | `/dealers/:dealerId/employees/leave`                 | Dealer                               | Leave days in a window.                                                                                                                            |
| POST               | `/dealers/:dealerId/employees/:id/leave`             | Dealer                               | Mark a leave day (201).                                                                                                                            |
| DELETE             | `/dealers/:dealerId/employees/:id/leave/:date`       | Dealer                               | Remove a leave day (204).                                                                                                                          |
| GET / PUT / DELETE | `/dealers/:dealerId/staff-points/draft`              | Dealer                               | The server-synced draft of a points batch: read, replace, clear (204).                                                                             |
| POST               | `/dealers/:dealerId/staff-points/draft/finalize`     | Dealer                               | Submit the draft as a batch (201). Body `{ hardCopyImageKey, workDate?, note? }`; the photo comes from `POST /uploads/sign` with `scope: 'staff'`. |
| GET                | `/dealers/:dealerId/staff-points/batches`            | Dealer                               | Submitted batches.                                                                                                                                 |
| GET                | `/dealers/:dealerId/staff-points/batches/:batchId`   | Dealer                               | One batch.                                                                                                                                         |
| POST               | `/dealers/:dealerId/staff-points`                    | Dealer                               | Award points (201).                                                                                                                                |
| GET                | `/dealers/:dealerId/staff-points`                    | Dealer                               | The point ledger.                                                                                                                                  |
| GET                | `/dealers/:dealerId/staff-points/summary`            | Dealer                               | Totals per employee.                                                                                                                               |
| DELETE             | `/dealers/:dealerId/staff-points/:id`                | Dealer                               | Remove an award (204).                                                                                                                             |
| GET                | `/dealers/:dealerId/staff/overview`                  | Admin                                | The dealer's staff-points overview.                                                                                                                |
| GET                | `/dealers/:dealerId/staff/awards`                    | Admin                                | Awards, filtered.                                                                                                                                  |
| POST               | `/dealers/:dealerId/staff/awards`                    | Admin                                | Award points for the dealer (201).                                                                                                                 |
| DELETE             | `/dealers/:dealerId/staff/awards/:id`                | Admin                                | Remove an award (204).                                                                                                                             |
| POST               | `/dealers/:dealerId/staff/employees`                 | Admin                                | Add an employee (201).                                                                                                                             |
| PATCH              | `/dealers/:dealerId/staff/employees/:id`             | Admin                                | Edit an employee.                                                                                                                                  |
| GET                | `/dealers/:dealerId/staff/employees/leave`           | Admin                                | Leave days.                                                                                                                                        |
| POST               | `/dealers/:dealerId/staff/employees/:id/leave`       | Admin                                | Mark a leave day (201).                                                                                                                            |
| DELETE             | `/dealers/:dealerId/staff/employees/:id/leave/:date` | Admin                                | Remove a leave day (204).                                                                                                                          |
| GET                | `/dealers/:dealerId/staff/drafts`                    | Admin                                | The dealer's draft view.                                                                                                                           |
| GET                | `/dealers/:dealerId/staff/batches`                   | Admin                                | The dealer's batches.                                                                                                                              |
| GET / PUT          | `/dealers/:dealerId/staff/work-list`                 | Admin                                | Read, or replace, the dealer's work-list overlay.                                                                                                  |
| GET / POST         | `/super-admin/staff-work-items`                      | Super-admin                          | The global default work catalog; add an item (201).                                                                                                |
| PATCH / DELETE     | `/super-admin/staff-work-items/:code`                | Super-admin                          | Edit or retire a catalog item.                                                                                                                     |

### Calendars and report settings

All Super-admin.

| Method | Path                                 | What it does                                                                                                                                            |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/super-admin/bank-holidays/month`   | `?year=&month=`: the month's bank and national holidays, saved rows merged with library suggestions. The Credit & DOD due date rolls off this calendar. |
| GET    | `/super-admin/bank-holidays/pending` | Library holidays nobody has confirmed yet (the badge).                                                                                                  |
| PUT    | `/super-admin/bank-holidays/month`   | Confirm (replace) a whole month.                                                                                                                        |
| GET    | `/super-admin/depot-holidays/month`  | `?year=&month=`: the depot closure calendar, with the weekly closed days. The Load Planner reads it.                                                    |
| PUT    | `/super-admin/depot-holidays/month`  | Confirm (replace) a whole month.                                                                                                                        |
| GET    | `/super-admin/festival`              | The festival catalog, the saved setting, and the window it resolves to today.                                                                           |
| PUT    | `/super-admin/festival`              | Replace the festival greeting band setting drawn on dealer report images.                                                                               |

---

## TT Density

Tanker invoices read off the IndianOil e-Mitra **TT Acknowledgement ▸ Download Invoice** screen, the `Density@15` printed on each product line of them, and the daily photograph of the outlet's density register. Design: ADR 0010.

All routes live in `routes/v1/ttDensity.ts`, which exports two routers. `/tt-density/me` is mounted **before** `/tt-density`, because the admin router's role check calls `next(err)` rather than falling through to a later mount.

- `/tt-density/...` - `requireAuth` + `requireRole('admin')`. A tanker invoice carries the dealer's purchase amounts, so it is admin-only. Every handler calls `assertDealerNotArchived(:dealerId)` first (an archived dealer is `NOT_FOUND`), and every document loaded by id is asserted to belong to `:dealerId`, throwing **404 rather than 403** so a guessed id does not confirm the document exists.
- `/tt-density/me/...` - `requireAuth` + `requireRole('dealer-owner', 'dealer-staff')`. There is **no `:dealerId` in any dealer path**: the dealer comes from `req.user.dealerId`, which `requireAuth` re-derives from the database on every request, so there is nothing in the URL to tamper with. **The dealer app has not called these routes since 13 Oct 2026; density is asked for in the chat now (ADR 0019). They are still served.**

Shared shapes (`shared/src/types/ttDensity.ts`): `TtInvoice`, `TtInvoiceSummary`, `TtLatestDensity`, `TtDensityDayLog`, `TtRegisterDaySummary`, `TtDensitySummary`, `TtDensityMeView`, `TtSignedFileUrls`.
Zod validators (`shared/src/schemas/ttDensity.ts`): `ttBusinessDateSchema`, `ttRegisterPhotoSchema`, `ttInvoiceListQuerySchema`, `ttRegisterDaysQuerySchema`, `ttDensityCollectSchema`.

Every date in this section is an **IST calendar day**, `YYYY-MM-DD`, never an instant. The box runs UTC, and "today" on a UTC box is yesterday for five and a half hours of every Indian evening.

### GET /tt-density/dealers/:dealerId/summary

Response: `ApiSuccess<TtDensitySummary>` - the headline densities, the invoice counts, the newest 20 invoice rows, the last 14 IST days of register photos, and the last run's outcome.
`latest` arrives sorted (diesel family first, then petrol, then the rest) and is rendered in the order it arrives; the admin pane and the dealer's app must not each re-sort it.
**Never 404s** for a dealer that has never been collected: it returns an empty summary so the pane renders a clean empty state rather than an error.
Errors: `BAD_REQUEST` for a malformed id, `NOT_FOUND` if the dealer is archived.

### GET /tt-density/dealers/:dealerId/invoices

Query: `ttInvoiceListQuerySchema`

- `from?`, `to?` - inclusive IST bounds on `invoiceDate`
- `page?` (default 1), `pageSize?` (default 50, max 200)

Response: `ApiSuccess<{ items: TtInvoiceSummary[]; total: number; page: number; pageSize: number }>`, sorted `invoiceDate:desc` then `sapInvoiceNo:desc` - two tankers can land on the same day, and the SAP number is monotonic for the outlet, so rows do not jump between fetches.
Each row carries one `densities` entry per product line, including `quantity` and `unit`, so the list renders `[MS] 727.300 · 6 KL` without a request per row.
Errors: `VALIDATION_ERROR`.

### GET /tt-density/dealers/:dealerId/invoices/:invoiceId

Response: `ApiSuccess<TtInvoice>` - every product line, the parse warnings, the PDF status and the document facts. `pdfKey` is never serialised; routes sign it, they do not send it.
Errors: `NOT_FOUND` if the id is unknown **or belongs to another dealer**.

### GET /tt-density/dealers/:dealerId/invoices/:invoiceId/pdf-url

Response: `ApiSuccess<TtSignedFileUrls>` -> `{ viewUrl, downloadUrl, filename, contentType, expiresIn }`. The same stored object is signed twice: `viewUrl` with an `inline` disposition for the `<iframe>`, `downloadUrl` with `attachment` for a save.
JSON, not a `302`: an `<iframe src>` cannot carry a bearer token, so the redirect used by run artifacts would 401 inside the frame.
Side effects: writes an `AuditLog` `TT_INVOICE_PDF_VIEW` **before** responding.
Errors: `NOT_FOUND` when the invoice is unknown, belongs to another dealer, or its `pdfStatus` is not `STORED` - message _"The invoice PDF has not been downloaded yet. It will be fetched on the next collection."_ That 404 is a UI state, not an error: the drawer already holds every figure we extracted and renders a "the file did not download" block, never a red banner.

### GET /tt-density/dealers/:dealerId/days

Query: `ttRegisterDaysQuerySchema` - either `from`+`to` (inclusive, at most 120 days) or `limit` (default 30, max 120). `from`/`to` win when both are supplied.
Response: `ApiSuccess<TtRegisterDaySummary[]>`, newest first, with **one entry per calendar day in the range, including the days nobody photographed**. The gaps are the output; a list that silently omitted them would show a clean month that never happened.
Errors: `VALIDATION_ERROR` (`from` after `to`, or a range longer than 120 days).

### GET /tt-density/dealers/:dealerId/days/:businessDate/photo-url

Response: `ApiSuccess<TtSignedFileUrls>` - the day's current photo, signed inline and as an attachment.
Side effects: writes an `AuditLog` `TT_REGISTER_PHOTO_VIEW`.
Errors: `NOT_FOUND` if the day has no photo.

### POST /tt-density/dealers/:dealerId/days/:businessDate/photo

Body: `ttRegisterPhotoSchema` -> `{ storageKey, filename, contentType, size, note? }`. The key comes from `POST /uploads/sign` with `scope: 'tt-density'` and this `dealerId`.
Response: **201** `ApiSuccess<TtDensityDayLog>` with `uploadedBy: { kind: 'admin', userId, name }`. The admin's name is read once here and stored, because the calendar prints "Added by Priya (MDG)" on a day panel and resolving a user id per calendar cell would be one lookup per cell.
A second photo for the same day **replaces** the current one and pushes the old one onto `superseded`. Nothing is ever deleted, and there is no unmark: an erasable compliance mark proves nothing.
Side effects: writes an `AuditLog` `TT_REGISTER_PHOTO_UPLOAD`, `before` = the replaced photo's key, `after` = the new one.
Errors:

- `BAD_REQUEST` for a day that has not happened yet; for a day older than `TT_REGISTER_ADMIN_BACKDATE_DAYS` (60, counting today, so `today - 59` is the oldest) - _"That day is more than 60 days ago."_; for a non-image `contentType`; and for a `storageKey` that does not start with `tt-density/<dealerId>/register/`. A presigned key is attacker-influenced input, and without that prefix check an admin request could point a day log at any object in the bucket.
- `NOT_FOUND` if the dealer is archived.

### POST /tt-density/dealers/:dealerId/collect

Body: `ttDensityCollectSchema` -> `{ lookbackDays? }` (1..31). A **one-run** override merged over the stored config for this run only - how a dealer new to the service gets a month fetched once without leaving a month-wide window running every morning for ever. The schedule is untouched.
Response: **202** `ApiSuccess<{ runId: string }>`. The endpoint returns as soon as the `ServiceRun` exists; the run is started detached.
Side effects: creates a `ServiceRun` with `trigger: 'manual'` and writes an `AuditLog` `SERVICE_RUN`.
Errors: `NOT_FOUND` if the dealer does not have `tt-density` attached (_"This dealer does not have the TT Density service attached. Attach it from the dealer's Services tab first."_); `CONFLICT` if a collection for this dealer is already in flight - a run counts as in flight for 8 minutes from `startedAt`, because a collection drives a browser.

### GET /tt-density/me

The dealer's own view: their densities and their days. Never an invoice, never a PDF, never a rupee figure - the tax invoice is a financial document and stays admin-only.
Response: `ApiSuccess<TtDensityMeView>` -> `{ dealerId, today, attached, latest, days, markedDays, earliestMarkableDate }`.

- `attached` is false when this dealer does not have the service. The route still answers **200** with empty arrays, so the app renders its calm "not on for your pump yet" state instead of an error - the same posture `GET /kavach/me` takes. It never 404s and never 403s for that case.
- `days` is the last `TT_REGISTER_RECENT_DAYS` (14) IST days, newest first.
- `earliestMarkableDate` is `today - (TT_REGISTER_DEALER_BACKDATE_DAYS - 1)` = `today - 6`, precomputed here and fed straight into the client's `<input type="date" min>`, so the screen never offers a day the server will refuse.

Errors: `BAD_REQUEST` if the token carries no `dealerId`.

### POST /tt-density/me/days/:businessDate/photo

Body: `ttRegisterPhotoSchema`, the key from `POST /uploads/sign` with `scope: 'tt-density'` and the caller's own `dealerId`.
Response: **201** `ApiSuccess<TtDensityDayLog>` with `uploadedBy: { kind: 'dealer', userId, name }`. Replacement works exactly as on the admin route.
Errors:

- `BAD_REQUEST` for a future day; for a day before `earliestMarkableDate` - _"That day is more than 7 days ago. Ask MDG to add it for you."_; for a non-image `contentType`; and for a `storageKey` outside `tt-density/<their own dealerId>/register/`.
- `NOT_FOUND` if `tt-density` is not attached to their dealer.

### GET /tt-density/me/days/:businessDate/photo-url

Response: `ApiSuccess<TtSignedFileUrls>` for their own day's photo.
Errors: `NOT_FOUND` if they have not sent one for that day.

---

## Document validity and renewal reminders

A dealership paper — a Fire NOC, a PESO licence, a DTO trade licence, a W&M licence — carries a date it is good until. That date lives on the **accepted `DocumentAsk`**, in `validUntil`, and it is a `YYYY-MM-DD` IST calendar day.

**`validUntil` is not `expiresAt`, and the two must never be conflated.** `expiresAt` is the ASK's own lifetime — "stop chasing this unanswered request after thirty days" — it is a real instant, it is only ever set on an `ASKED` row, and the state it produces, `EXPIRED`, means the REQUEST lapsed. `validUntil` is when the PAPER stops being any good. A validity stored under the other name would be swept by `services/documents/expire.ts` and rendered by the estate table as a dead request.

A **renewal is a new ask, not a reopened one**, because `ACCEPTED` is the one closed state that refuses to reopen. It is filed under a distinct period key built from the suffix mechanism that already exists — `periodKeyFor('NONE', today, 'renew-2027-03-31')` → `':renew-2027-03-31'` — so last year's certificate and this year's are separate rows with separate evidence, and the unique index (whose partial filter is `periodKey > ''`) covers every renewal after the first.

### POST /asks/:id/accept

Admin. Body `acceptDocumentAskSchema` -> `{ validUntil?, reminderOffsetDays? }`.

- `validUntil` is **required by the route** — not by the schema — when the kind carries `tracksValidity`. The schema cannot make that call because it cannot see the catalog, and demanding a date for every kind would block the acceptance of a register page on a date it does not have. Errors `BAD_REQUEST`: _"This paper runs out. Enter the date printed on it before accepting."_
- It is refused rather than defaulted from `validityMonths`. A validity we computed is a validity nobody read off the paper, and it goes on to decide when the dealer is chased and what the outlet Info tab says.
- The **byte check runs first**. A paper whose object changed after it was sent still gets its `CONFLICT`, so an acceptance is never refused for a missing field on bytes that had already been swapped underneath us.
- Where the kind names a `profileFieldKey`, accepting **mirrors the date onto the outlet Info tab** (`Dealer.outletProfile.$.expiresOn`). The paper wins and the profile follows; nothing ever writes back the other way. The mirror never throws — a mirror that failed must not undo an acceptance a person made.
- Marking a dealer's photo received in the chat (`POST /conversations/:id/messages/:messageId/receive`) takes the same `validUntil` and follows the same rule.

### POST /asks/:id/file-for-dealer

Admin. MDG already holds the paper and is filing it on the dealer's behalf. Body `fileForDealerSchema` -> `{ attachment, note?, validUntil?, reminderOffsetDays? }`.

Submits **and** accepts in one act, because the submission and the verdict are made by the same person in the same second. The row records `submission.byKind: 'admin'` and the audit action is `DOCUMENT_ASK_FILE_FOR_DEALER`, never `DOCUMENT_ASK_SUBMIT` — so nothing anywhere claims the dealer sent it, which is the claim a compliance record exists to support. No push: a dealer told "we have received your Fire NOC" about a paper they did not send reads as a mistake. The socket event still fires.

The ask must exist first, because an object is filed under `ask/<dealerId>/<askId>/`. Presign with `scope: 'ask'`.

### PATCH /asks/:id/validity

Admin, `ACCEPTED` rows only. Body `setDocumentValiditySchema` -> `{ validUntil?: string | null, reminderOffsetDays? }`. Corrects a mistyped date or quietens one certificate. `validUntil: null` clears the date and clears the mirrored one on the Info tab.

**It does not re-run the ladder.** Steps already settled stay settled: a date pushed six months out does not re-fire a warning the dealer already had.

### GET /asks/me/on-file

Dealer. The dealer's own filing cabinet. `ApiSuccess<DealerDocumentAskList>` -> `{ rows, kinds: [], today }`. `ACCEPTED` rows only, capped at 500, sorted most-urgent-first, `dealerVisible`-gated **in the query** so a hidden kind's rows never leave the database. **Still served; the dealer app no longer calls it since 13 Oct 2026 (ADR 0019).**

A sibling of `GET /asks/me` rather than a mode of it: that route answers "what is outstanding" and unions three sources, caps at 200 and shows settled rows for five days — every one of which is right for a to-do list and wrong for a filing cabinet.

Each row carries `validUntil`, `validityState` (`expired` | `expiring` | `valid` — the same three words the Info tab uses), `daysToExpiry` and `validityLabel`, **already formatted in the dealer's language** ("8 दिन बाकी", "Expires today"). The verdict is decided on the SERVER against the server's IST day; a phone whose clock is a day fast must never badge a valid licence red.

### GET /document-kinds

Admin. `ApiSuccess<DocumentKind[]>`. `?activeOnly=true` for pickers. Unpaged — a handful of rows, and every consumer wants all of them.

### POST /super-admin/document-kinds, PATCH /super-admin/document-kinds/:code

Super-admin, because editing this catalog changes what every dealer can be asked for and how often each is chased. It will not rename a `code` (renaming orphans every ask filed under it), will not change `periodKind` (existing keys are in the old shape), will not expose `source` (a closed enum only the seed sets — with `reviewRequired` fixed true, that pair is what makes the auto-accept guard real), and will not delete (`active: false` retires; the row stays so old records stay readable).

`reminderOffsetDays` is where the per-KIND cadence is edited. **`[]` means never remind for that kind** and is a deliberate setting, distinct from omitting the field.

### GET /asks — validity filters

`expiringWithinDays` (0..365) and `validityState`. Deliberately NOT folded into `from`/`to`, which bound DAY _period_ keys — a filter for "expiring this fortnight" that used those would silently drop every fire NOC, whose period key is the empty string. `expiringWithinDays` has **no lower bound**: a certificate that lapsed last month is more urgent than one lapsing next week.

`validityState` narrows the query to "not yet lapsed" and then filters the band **on the row**, because the boundary between `valid` and `expiring` is the first step of each row's own ladder and is therefore per-kind and per-paper. A page can come back shorter than `limit` while `nextCursor` still points at more.

### The reminder ladder

Days before expiry, biggest first. Shipped default `[15, 3, 2, 1]`; overridable per KIND (catalog) and per PAPER (`PATCH /asks/:id/validity`), resolved by `resolveReminderOffsets` — one function, because the amber badge and the notification are both derived from the first step.

The nightly pass (`sweepDocumentValidityReminders`) rides the existing IST-anchored Kavach task at `00:20 Asia/Kolkata`. Its three rules:

1. **At most one notification per paper per pass.** Four steps overdue after an outage fires the smallest — the one closest to the truth — and writes the rest off as `skipped` so they cannot fire tomorrow.
2. **The message never quotes the step.** A fifteen-day step going out on the tenth day says "10 days left".
3. **Past the date the ladder stops**, and a single lapsed notice goes instead.

An empty ladder means complete silence, including the lapsed notice and the renewal slot.

The renewal request is opened as a **condition, not an event** — every pass asks "should this paper have an open renewal by now?" — so a process that died between firing a reminder and creating the ask self-heals on the next pass instead of leaving a dealer warned with nowhere to upload.

**Two hand-run migrations, not a deploy.** Production never calls `syncIndexes()`, and the seeder writes new catalog columns under `$setOnInsert`, which never reaches an existing row. `node dist/scripts/migrateDocumentValidity.js` creates the two indexes and fills the absent columns. Without the second half the feature ships and does nothing, silently, on exactly the certificate it was built for.

---

## Uploads

`POST /uploads/sign` is `requireAuth` **only** - every authenticated role reaches it, admin and dealer alike - so the branch a `scope` lands in is the entire access control on the object key a caller gets back.

Body: `presignUploadSchema` -> `{ filename, contentType, size, scope?, conversationId?, dealerId?, askId? }`. `scope` defaults to `chat`. Response: `{ uploadUrl, storageKey, expiresIn }`; the client PUTs the file to `uploadUrl` and passes `storageKey` to the route that uses it. The general caps are 25 MB, and images, audio, Office (.docx, .xlsx, .pptx) files, PDF or plain text.

| `scope`      | Who                                       | Key                                           |
| ------------ | ----------------------------------------- | --------------------------------------------- |
| `chat`       | a participant of the thread, or any admin | `chat/<conversationId>/{voice,files}/...`     |
| `avatar`     | any authenticated caller, for themselves  | `avatars/<userId>/<uuid>.<ext>`               |
| `staff`      | a member of that dealer, or any admin     | `staff/<dealerId>/<uuid>.<ext>`               |
| `tt-density` | a member of that dealer, or any admin     | `tt-density/<dealerId>/register/<uuid>.<ext>` |
| `kavach`     | a member of that dealer, or any admin     | `kavach/<dealerId>/proof/<uuid>.<ext>`        |
| `ask`        | a member of that dealer, or any admin     | `ask/<dealerId>/<askId>/<uuid>.<ext>`         |
| `slip`       | **admin only**                            | `slip/<dealerId>/<uuid>.<ext>`                |

`chat` needs `conversationId`. `staff`, `tt-density`, `kavach`, `slip` and `ask` need `dealerId`, and `ask` also needs `askId` (it only picks a folder inside that dealer's prefix; the submit route decides whether the key belongs to the ask). `staff`, `tt-density` and `kavach` take images only. `ask` takes JPEG, PNG, WebP or PDF, at most 10 MB (`DOCUMENT_ASK_MIME_TYPES`, `DOCUMENT_ASK_MAX_BYTES`).

**There is no fall-through.** A scope in the enum with no branch is refused, and the refusal is a `never` assignment so it stops compiling first. It used to be a catch-all `else` that wrote to `avatars/<userId>/` - the one prefix `GET /uploads/download-url` serves with no access check at all - which would have made a forecourt slip signable by any authenticated account.

The `slip` scope carries its own, tighter caps from `@dk/shared`: `SLIP_PHOTO_MIME_TYPES` (`image/jpeg`, `image/png`, `image/webp` - HEIC is refused because a browser canvas cannot decode it, so it could be neither shrunk before sending nor shown back on the screen where the operator checks it against the paper) and `SLIP_PHOTO_MAX_BYTES` (4 MB, against the route's general 25 MB).
Errors: `FORBIDDEN` _"Only MDG can send a shift slip."_ for any dealer account; `BAD_REQUEST` for a wrong type, an oversize photo, a missing `dealerId`, or slip reading being switched off on this server (so the refusal comes before the photo is sent).

### GET /uploads/download-url

Query: `key`, optional `disposition=attachment`, optional `filename`.
Serves **only** `avatars/`, `chat/`, `staff/` and `kavach/`, each with its own ownership check except `avatars/`. `slip/`, `tt-density/` and `ask/` are deliberately absent and adding any of them would be a regression: each is served by its own feature route, which resolves the owning dealer from the stored record rather than from the key string. A chat attachment is also served by `GET /conversations/:id/messages/:messageId/download-url`, which decides from the message row.

---

## Reading the slip

An admin photographs the pump console's printed shift slip on a hand-typed IRAS morning, and the meter reading boxes fill themselves in - after the operator has seen every figure against the paper. Both routes inherit `irasDataRouter`'s `requireAuth` + `requireRole('admin')`.

**There is no endpoint that both reads a slip and writes a figure.** `METER_BACKWARDS` is a client-side block with no server-side equivalent in `corrections.ts`, so a server write path would walk straight past it. Every figure reaches the day through the ordinary corrections commit.

Shared shapes (`shared/src/iras/slip.ts`): `SlipParse`, `SlipBlock`, `SlipReading`, `SlipReadingForNozzle`, `SlipProof`, `SlipNozzleOutcome`, `SlipSource`.
Zod validators (`shared/src/schemas/slip.ts`): `readSlipSchema`.

### POST /iras-data/dealers/:dealerId/days/:businessDate/read-slip

Body: `readSlipSchema` -> `{ storageKey, filename, contentType, size }`. The key comes from `POST /uploads/sign` with `scope: 'slip'` and this `dealerId`.
Response: `ApiSuccess<SlipReadResponse>` -> `{ slipReadId, reading, transcript, photo: { storageKey, viewUrl, expiresIn }, quota, cost }`.
Side effects: writes one `SlipRead` row and **nothing else**. No figure is written to the day, and the day is not touched by opening it.
Guards, in this order, each refusing before the next costs anything - all of them in `services/irasData/readSlip.ts`:

1. `BAD_REQUEST` when `SLIP_READ_ENABLED` is off or the second reader (Vertex) is not configured - _"Reading the slip is not switched on here. Type the figures in yourself."_
2. `NOT_FOUND` when the dealer is archived or unknown.
3. `BAD_REQUEST` when the day's snapshot is missing or is not `MANUAL`. The portal firewall, enforced on the server and not only by a client gate that lives in a bundle which can be stale.
4. `BAD_REQUEST` when the dealer has an **ACTIVE** `iras-shift-data` service. Being collected for is a property of the outlet, not of the day, and this closes the window between midnight and a collection landing where a portal dealer can have a `MANUAL` shell day minted for them.
5. `BAD_REQUEST` when `storageKey` does not start with `slip/<dealerId>/` - _"That photo does not belong to this dealer."_ A presigned key is attacker-influenced input.
6. `BAD_REQUEST` when the object is not there, is over `SLIP_READ_MAX_IMAGE_BYTES`, or is not one of the three photo types - measured with `headObjectMeta`, never taken from the `size` the client declared. A presigned PUT carries no `content-length-range`.
7. `RATE_LIMITED` (429) when this dealer's slip has already been read `SLIP_READ_LIMIT_PER_DEALER_DAY` (10) times for this business date, when the day's slip-reading spend has run out, or when both slip-reading slots are busy.

### GET /iras-data/dealers/:dealerId/slip-reads/:slipReadId/photo-url

Response: `ApiSuccess<{ viewUrl, filename, contentType, expiresIn }>` - the photograph, signed `inline`, for `S3_SIGNED_URL_TTL_SECONDS` (900). Signed on demand and never stored: a URL held across a break renders as a broken image, which on a verification screen looks identical to no evidence.
There is no `downloadUrl` half. The operator is checking the paper on screen, not filing it.
Side effects: writes an `AuditLog` `IRAS_SLIP_PHOTO_VIEW`.
Errors: `NOT_FOUND` when the id is unknown **or belongs to another dealer** - 404 rather than 403, so a guessed id does not confirm the record exists; `BAD_REQUEST` when the stored key is outside `slip/<dealerId>/`.

### PUT /iras-data/dealers/:dealerId/days/:businessDate/corrections

Gains one optional field: `slipReadIds: string[]` (max 10). **Provenance and nothing else** - it changes no figure, and a commit that omits it saves exactly what it saved before the field existed.

For each id that belongs to this dealer and this day, the commit stamps `appliedAt`, `appliedNozzleNos` and `appliedCumSale` on the `SlipRead`, and adds `readFromSlip: [{ slipReadId, nozzleNos }]` to the audit entry's `after`. A nozzle counts only when the figure now on record is the **character-identical** string the slip printed for it: that equality is what makes tomorrow's litre and rupee counters provably anchored to the same instant, and if the operator typed over the slip's figure nothing is recorded for that nozzle.
An id from another dealer or another day is **skipped, never refused** - the figures are already saved, and a stale id in a client's state must not be able to fail a morning.

---

## Status codes

| Code | When                                                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 200  | Successful GET / PATCH / PUT / DELETE, and most POSTs that act on something that already exists                                        |
| 201  | Successful POST that creates a resource                                                                                                |
| 202  | A run was started and goes on in the background: the "run now", "collect", "generate" and "capture" routes                             |
| 204  | No body: `POST /films/beacon`, and the staff DELETE routes                                                                             |
| 302  | `GET /runs/:runId/artifacts/:artifactId/download`                                                                                      |
| 400  | `BAD_REQUEST`, or a Zod failure (`error.code='VALIDATION_ERROR'`)                                                                      |
| 401  | Missing or invalid JWT, a dealer session ended on another device, or a bad shared secret or signature on a public route                |
| 403  | Role denied by `requireRole`, a dealer reaching another dealer, or a member of an archived dealer                                      |
| 404  | Not found. Also an archived dealer on a dealer-scoped admin route, and another dealer's record behind a guessed id                     |
| 409  | Unique conflict, or an action the record's state does not allow                                                                        |
| 422  | Plugin config failed schema validation (`PLUGIN_CONFIG_INVALID`)                                                                       |
| 429  | `RATE_LIMITED`: login attempts, credential reveals, quotas, daily budgets and concurrency caps (`POST …/read-slip`, Credit & DOD runs) |
| 500  | Internal                                                                                                                               |
| 503  | A feature is off or busy: `ASSIST_DISABLED`, `INTAKE_DISABLED`, `LIVE_TRANSCRIPT_OFF`, `BROWSER_BUSY`                                  |

The 202 routes are `POST /dealer-services/:dsId/run-now`, `POST /tt-density/dealers/:dealerId/collect`, `POST /iras-data/dealers/:dealerId/collect`, `POST /dsr/dealers/:dealerId/generate`, `POST /dsr/dealers/:dealerId/regenerate-stale`, `POST /inspection-reports/dealers/:dealerId/generate` and `POST /ro-supply-status/dealers/:dealerId/collect`.

## Conventions

- Timestamps: ISO 8601 with offset.
- Business dates: IST calendar days, `YYYY-MM-DD`.
- IDs: 24-char Mongo ObjectId hex strings.
- Sort: `field:asc|desc`, single field per request.
- Sensitive fields are never returned: password hashes, and the stored IRAS and SDMS passwords. The one exception is the audited, rate-limited `POST /dealers/:id/iras-credentials/reveal` and `/sdms-credentials/reveal`.
