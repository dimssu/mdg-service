# Dealer Kavach - REST API contract

Base URL: `/api/v1`

All endpoints (except `POST /auth/login`) require `Authorization: Bearer <jwt>`. RBAC is wired through `requireRoles(...)` middleware but the MVP only checks authentication.

Envelope (every response):

- Success: `ApiSuccess<T> = { ok: true, data: T }`
- Error: `ApiError = { ok: false, error: { code, message, details? } }`

Common error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `PLUGIN_NOT_FOUND`, `PLUGIN_CONFIG_INVALID`, `INTERNAL`.

Shared shapes (from `@dk/shared`):

- `Admin`, `LoginResponse` - `shared/src/types/admin.ts`
- `Dealer`, `DealerStage1Input`, `DealerStage2Input` - `shared/src/types/dealer.ts`
- `DealerService`, `AttachServiceInput`, `UpdateDealerServiceInput` - `shared/src/types/dealerService.ts`
- `ServiceRun` - `shared/src/types/serviceRun.ts`
- `AuditLog` - `shared/src/types/auditLog.ts`
- `ServicePluginCatalogEntry` - `shared/src/types/plugin.ts`
- `TtInvoice`, `TtInvoiceSummary`, `TtLatestDensity`, `TtDensityDayLog`, `TtRegisterDaySummary`, `TtDensitySummary`, `TtDensityMeView`, `TtSignedFileUrls` - `shared/src/types/ttDensity.ts`
- `SlipParse`, `SlipBlock`, `SlipReading`, `SlipReadingForNozzle`, `SlipProof` - `shared/src/iras/slip.ts`
- `Paginated<T>`, `ApiSuccess<T>`, `ApiError` - `shared/src/types/api.ts`

Zod validators (from `@dk/shared` `schemas`):

- `loginSchema`, `dealerCreateStage1Schema`, `dealerUpdateSchema`, `dealerListQuerySchema`, `attachServiceSchema`, `updateDealerServiceSchema`, `runNowSchema`, `runsListQuerySchema`.
- `ttBusinessDateSchema`, `ttRegisterPhotoSchema`, `ttInvoiceListQuerySchema`, `ttRegisterDaysQuerySchema`, `ttDensityCollectSchema`.
- `presignUploadSchema`, `readSlipSchema`.

---

## Auth

### POST /auth/login

Body: `loginSchema` -> `{ email, password }`
Response: `ApiSuccess<LoginResponse>` -> `{ token, admin }`
Errors: `UNAUTHORIZED` for bad credentials.

### GET /auth/me

Response: `ApiSuccess<Admin>`
Errors: `UNAUTHORIZED` if token missing/invalid.

---

## Dealers

### GET /dealers

Query: `dealerListQuerySchema`

- `search?` - matches name, GST, PAN, owner contact (case-insensitive)
- `status?` - `PENDING_DETAILS | ACTIVE | SUSPENDED`
- `page?`, `pageSize?`, `sort?` (e.g. `createdAt:desc`)

Response: `ApiSuccess<Paginated<Dealer>>`

### POST /dealers

Body: `dealerCreateStage1Schema`
Response: `ApiSuccess<Dealer>` with `status='PENDING_DETAILS'`.
Errors: `CONFLICT` if GST or PAN already exists.

### GET /dealers/:id

Response: `ApiSuccess<Dealer>`
Errors: `NOT_FOUND`.

### PATCH /dealers/:id

Body: `dealerUpdateSchema` (any subset of mutable fields, including `status`).
Stage-2 fields (`bankDetails`, `complianceDocs`, `slaTier`) are accepted here; supplying all three flips status from `PENDING_DETAILS` to `ACTIVE` if the caller does not pass `status` explicitly.
Response: `ApiSuccess<Dealer>`.
Side effects: appends to `Dealer.audit` and writes an `AuditLog`.

### DELETE /dealers/:id

Soft delete is out of scope for MVP; this hard-deletes the dealer **and** its `DealerService` records. `ServiceRun` history is retained for forensics.
Response: `ApiSuccess<{ id: string }>`.

### GET /dealers/:id/audit

Response: `ApiSuccess<Paginated<AuditLog>>` filtered by `entity='Dealer'`, `entityId=:id`, sorted by `at:desc`.

---

## Services (plugin catalog)

### GET /services

Returns the in-memory plugin registry (no DB hit).
Response: `ApiSuccess<ServicePluginCatalogEntry[]>`

---

## Dealer-Services (attach/manage)

### GET /dealers/:id/services

Response: `ApiSuccess<DealerService[]>` for the dealer.

### POST /dealers/:id/services

Body: `attachServiceSchema` -> `{ serviceId, config, cadence?, customCron? }`
Server validates `config` against the plugin's `defaultConfigSchema` via Ajv. The compound index `{dealerId, serviceId}` is unique - re-attaching the same service yields `CONFLICT`.
Response: `ApiSuccess<DealerService>` with computed `schedule` and `nextRunAt`.
Errors: `PLUGIN_NOT_FOUND`, `PLUGIN_CONFIG_INVALID`, `CONFLICT`.

### PATCH /dealer-services/:dsId

Body: `updateDealerServiceSchema`
Behaviour:

- Updating `config` re-validates against plugin schema.
- Updating `cadence` or `customCron` recomputes `schedule` and `nextRunAt`.
- Setting `status='PAUSED'` clears `nextRunAt`.
- Setting `status='ACTIVE'` (from PAUSED) recomputes `nextRunAt`.
  Response: `ApiSuccess<DealerService>`.

### DELETE /dealer-services/:dsId

Hard-deletes the attachment. `ServiceRun` history is retained.
Response: `ApiSuccess<{ id: string }>`.

### POST /dealer-services/:dsId/run-now

Body: `runNowSchema` (optional `configOverride`).
Creates a `ServiceRun` with `status='PENDING'` and enqueues it through the runner. The endpoint returns immediately with `202`.
Response: `ApiSuccess<{ runId: string }>`.

---

## Runs

### GET /runs

Query: `runsListQuerySchema` -> `{ dealerId?, serviceId?, status?, from?, to?, page?, pageSize? }`
Response: `ApiSuccess<Paginated<ServiceRun>>`, sorted by `startedAt:desc`.

### GET /runs/:id

Response: `ApiSuccess<ServiceRun>`
Errors: `NOT_FOUND`.

---

## Overview

### GET /overview

Aggregated metrics for the dashboard. Cached in memory for 30s.
Response: `ApiSuccess<OverviewSnapshot>` where:

```ts
interface OverviewSnapshot {
  dealers: {
    total: number;
    byStatus: Record<'PENDING_DETAILS' | 'ACTIVE' | 'SUSPENDED', number>;
  };
  services: {
    pluginCount: number;
    attached: number; // total DealerService rows
    active: number; // status=ACTIVE
  };
  runs: {
    last24h: number;
    successRate24h: number; // 0..1
    failedLast24h: number;
    avgDurationMs24h: number;
  };
  recentRuns: ServiceRun[]; // newest 10
}
```

(The `OverviewSnapshot` type will live in `shared/src/types/overview.ts` when the backend agent picks this up; the architect intentionally stops at the contract.)

---

## TT Density

Tanker invoices read off the IndianOil e-Mitra **TT Acknowledgement ▸ Download Invoice** screen, the `Density@15` printed on each product line of them, and the daily photograph of the outlet's density register.

All routes live in `routes/v1/ttDensity.ts`, which exports two routers. `/tt-density/me` is mounted **before** `/tt-density`, because the admin router's role check calls `next(err)` rather than falling through to a later mount.

- `/tt-density/...` - `requireAuth` + `requireRole('admin')`. A tanker invoice carries the dealer's purchase amounts, so it is admin-only; unlike the MVP routes above, the role check on these two routers is live. Every handler calls `assertDealerNotArchived(:dealerId)` first, and every document loaded by id is asserted to belong to `:dealerId`, throwing **404 rather than 403** so a guessed id does not confirm the document exists.
- `/tt-density/me/...` - `requireAuth` + `requireRole('dealer-owner', 'dealer-staff')`. There is **no `:dealerId` in any dealer path**: the dealer comes from `req.user.dealerId`, which `requireAuth` re-derives from the database on every request, so there is nothing in the URL to tamper with.

Shared shapes (`shared/src/types/ttDensity.ts`): `TtInvoice`, `TtInvoiceSummary`, `TtLatestDensity`, `TtDensityDayLog`, `TtRegisterDaySummary`, `TtDensitySummary`, `TtDensityMeView`, `TtSignedFileUrls`.
Zod validators (`shared/src/schemas/ttDensity.ts`): `ttBusinessDateSchema`, `ttRegisterPhotoSchema`, `ttInvoiceListQuerySchema`, `ttRegisterDaysQuerySchema`, `ttDensityCollectSchema`.

Every date in this section is an **IST calendar day**, `YYYY-MM-DD`, never an instant. The box runs UTC, and "today" on a UTC box is yesterday for five and a half hours of every Indian evening.

### GET /tt-density/dealers/:dealerId/summary

Response: `ApiSuccess<TtDensitySummary>` - the headline densities, the invoice counts, the newest 20 invoice rows, the last 14 IST days of register photos, and the last run's outcome.
`latest` arrives sorted (diesel family first, then petrol, then the rest) and is rendered in the order it arrives; the admin pane and the dealer's app must not each re-sort it.
**Never 404s.** A dealer that has never been collected returns an empty summary so the pane renders a clean empty state rather than an error.
Errors: `BAD_REQUEST` for a malformed id, `FORBIDDEN` if the dealer is archived.

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
- `FORBIDDEN` if the dealer is archived.

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

Body is now `acceptDocumentAskSchema` -> `{ validUntil?, reminderOffsetDays? }`, where it used to be empty.

- `validUntil` is **required by the route** — not by the schema — when the kind carries `tracksValidity`. The schema cannot make that call because it cannot see the catalog, and demanding a date for every kind would block the acceptance of a register page on a date it does not have. Errors `BAD_REQUEST`: _"This paper runs out. Enter the date printed on it before accepting."_
- It is refused rather than defaulted from `validityMonths`. A validity we computed is a validity nobody read off the paper, and it goes on to decide when the dealer is chased and what the outlet Info tab says.
- The **byte check runs first**. A paper whose object changed after it was sent still gets its `CONFLICT`, so an acceptance is never refused for a missing field on bytes that had already been swapped underneath us.
- Where the kind names a `profileFieldKey`, accepting **mirrors the date onto the outlet Info tab** (`Dealer.outletProfile.$.expiresOn`). The paper wins and the profile follows; nothing ever writes back the other way. The mirror never throws — a mirror that failed must not undo an acceptance a person made.

### POST /asks/:id/file-for-dealer

Admin. MDG already holds the paper and is filing it on the dealer's behalf. Body `fileForDealerSchema` -> `{ attachment, note?, validUntil?, reminderOffsetDays? }`.

Submits **and** accepts in one act, because the submission and the verdict are made by the same person in the same second. The row records `submission.byKind: 'admin'` and the audit action is `DOCUMENT_ASK_FILE_FOR_DEALER`, never `DOCUMENT_ASK_SUBMIT` — so nothing anywhere claims the dealer sent it, which is the claim a compliance record exists to support. No push: a dealer told "we have received your Fire NOC" about a paper they did not send reads as a mistake. The socket event still fires.

The ask must exist first, because an object is filed under `ask/<dealerId>/<askId>/`. Presign with `scope: 'ask'`.

### PATCH /asks/:id/validity

Admin, `ACCEPTED` rows only. Body `setDocumentValiditySchema` -> `{ validUntil?: string | null, reminderOffsetDays? }`. Corrects a mistyped date or quietens one certificate. `validUntil: null` clears the date and clears the mirrored one on the Info tab.

**It does not re-run the ladder.** Steps already settled stay settled: a date pushed six months out does not re-fire a warning the dealer already had.

### GET /asks/me/on-file

The dealer's own filing cabinet. `ApiSuccess<DealerDocumentAskList>` -> `{ rows, kinds: [], today }`. `ACCEPTED` rows only, capped at 500, sorted most-urgent-first, `dealerVisible`-gated **in the query** so a hidden kind's rows never leave the database.

A sibling of `GET /asks/me` rather than a mode of it: that route answers "what is outstanding" and unions three sources, caps at 200 and shows settled rows for five days — every one of which is right for a to-do list and wrong for a filing cabinet.

Each row carries `validUntil`, `validityState` (`expired` | `expiring` | `valid` — the same three words the Info tab uses), `daysToExpiry` and `validityLabel`, **already formatted in the dealer's language** ("8 दिन बाकी", "Expires today"). The verdict is decided on the SERVER against the server's IST day; a phone whose clock is a day fast must never badge a valid licence red.

### GET /document-kinds

Admin. `ApiSuccess<DocumentKind[]>`. `?activeOnly=true` for pickers. Unpaged — a handful of rows, and every consumer wants all of them.

### POST /super-admin/document-kinds, PATCH /super-admin/document-kinds/:code

Super-admin, because editing this catalog changes what every dealer can be asked for and how often each is chased. It will not rename a `code` (renaming orphans every ask filed under it), will not change `periodKind` (existing keys are in the old shape), will not expose `source` (a closed enum only the seed sets — with `reviewRequired` fixed true, that pair is what makes the auto-accept guard real), and will not delete (`active: false` retires; the row stays so old records stay readable).

`reminderOffsetDays` is where the per-KIND cadence is edited. **`[]` means never remind for that kind** and is a deliberate setting, distinct from omitting the field.

### GET /asks — two new filters

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

Body: `presignUploadSchema` -> `{ filename, contentType, size, scope?, conversationId?, dealerId? }`. `scope` defaults to `chat`.

| `scope`      | Who                                       | Key                                           |
| ------------ | ----------------------------------------- | --------------------------------------------- |
| `chat`       | a participant of the thread, or any admin | `chat/<conversationId>/{voice,files}/...`     |
| `avatar`     | any authenticated caller, for themselves  | `avatars/<userId>/<uuid>.<ext>`               |
| `staff`      | a member of that dealer, or any admin     | `staff/<dealerId>/<uuid>.<ext>`               |
| `tt-density` | a member of that dealer, or any admin     | `tt-density/<dealerId>/register/<uuid>.<ext>` |
| `kavach`     | a member of that dealer, or any admin     | `kavach/<dealerId>/proof/<uuid>.<ext>`        |
| `slip`       | **admin only**                            | `slip/<dealerId>/<uuid>.<ext>`                |

**There is no fall-through.** A scope in the enum with no branch is refused, and the refusal is a `never` assignment so it stops compiling first. It used to be a catch-all `else` that wrote to `avatars/<userId>/` - the one prefix `GET /uploads/download-url` serves with no access check at all - which would have made a forecourt slip signable by any authenticated account.

The `slip` scope carries its own, tighter caps from `@dk/shared`: `SLIP_PHOTO_MIME_TYPES` (`image/jpeg`, `image/png`, `image/webp` - HEIC is refused because a browser canvas cannot decode it, so it could be neither shrunk before sending nor shown back on the screen where the operator checks it against the paper) and `SLIP_PHOTO_MAX_BYTES` (4 MB, against the route's general 25 MB).
Errors: `FORBIDDEN` _"Only MDG can send a shift slip."_ for any dealer account; `BAD_REQUEST` for a wrong type, an oversize photo, or a missing `dealerId`.

### GET /uploads/download-url

Query: `key`, optional `disposition=attachment`, optional `filename`.
Serves **only** `avatars/`, `chat/`, `staff/` and `kavach/`, each with its own ownership check except `avatars/`. `slip/` and `tt-density/` are deliberately absent and adding either would be a regression: both are served by their own feature routes, which resolve the owning dealer from the stored record rather than from the key string.

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

1. `BAD_REQUEST` when `SLIP_READ_ENABLED` is off or no service-account key is configured - _"Reading the slip is not switched on here. Type the figures in yourself."_
2. `FORBIDDEN` when the dealer is archived; `NOT_FOUND` when there is no such dealer.
3. `BAD_REQUEST` when the day's snapshot is missing or is not `MANUAL`. The portal firewall, enforced on the server and not only by a client gate that lives in a bundle which can be stale.
4. `BAD_REQUEST` when the dealer has an **ACTIVE** `iras-shift-data` service. Being collected for is a property of the outlet, not of the day, and this closes the window between midnight and a collection landing where a portal dealer can have a `MANUAL` shell day minted for them.
5. `BAD_REQUEST` when `storageKey` does not start with `slip/<dealerId>/` - _"That photo does not belong to this dealer."_ A presigned key is attacker-influenced input.
6. `BAD_REQUEST` when the object is not there, is over `SLIP_READ_MAX_IMAGE_BYTES`, or is not one of the three photo types - measured with `headObjectMeta`, never taken from the `size` the client declared. A presigned PUT carries no `content-length-range`.
7. `TOO_MANY_REQUESTS` when this dealer's slip has already been read `SLIP_READ_LIMIT_PER_DEALER_DAY` (10) times for this business date, when the day's slip-reading spend has run out, or when both slip-reading slots are busy.

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

| Code | When                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 200  | Successful GET / PATCH / DELETE                                                     |
| 201  | Successful POST that creates a resource                                             |
| 202  | `POST /dealer-services/:dsId/run-now`, `POST /tt-density/dealers/:dealerId/collect` |
| 400  | Zod validation failure (`error.code='VALIDATION_ERROR'`)                            |
| 401  | Missing/invalid JWT                                                                 |
| 403  | Role denied by `requireRole`, or the dealer is archived                             |
| 404  | Not found                                                                           |
| 409  | Unique conflict                                                                     |
| 429  | Quota, daily budget or concurrency cap (`POST …/read-slip`, Credit & DOD)           |
| 422  | Plugin config failed Ajv validation                                                 |
| 500  | Internal                                                                            |

## Conventions

- Timestamps: ISO 8601 with offset.
- IDs: 24-char Mongo ObjectId hex strings.
- Pagination: `page` is 1-indexed; `pageSize` defaults to 20, max 200.
- Sort: `field:asc|desc`, single field per request.
- Sensitive fields (`Admin.passwordHash`) are never returned.
