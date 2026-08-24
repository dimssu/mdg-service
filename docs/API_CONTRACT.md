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
- `Paginated<T>`, `ApiSuccess<T>`, `ApiError` - `shared/src/types/api.ts`

Zod validators (from `@dk/shared` `schemas`):

- `loginSchema`, `dealerCreateStage1Schema`, `dealerUpdateSchema`, `dealerListQuerySchema`, `attachServiceSchema`, `updateDealerServiceSchema`, `runNowSchema`, `runsListQuerySchema`.
- `ttBusinessDateSchema`, `ttRegisterPhotoSchema`, `ttInvoiceListQuerySchema`, `ttRegisterDaysQuerySchema`, `ttDensityCollectSchema`.

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
| 422  | Plugin config failed Ajv validation                                                 |
| 500  | Internal                                                                            |

## Conventions

- Timestamps: ISO 8601 with offset.
- IDs: 24-char Mongo ObjectId hex strings.
- Pagination: `page` is 1-indexed; `pageSize` defaults to 20, max 200.
- Sort: `field:asc|desc`, single field per request.
- Sensitive fields (`Admin.passwordHash`) are never returned.
