# Dealer Kavach - REST API contract

Base URL: `/api/v1`

All endpoints (except `POST /auth/login`) require `Authorization: Bearer <jwt>`. RBAC is wired through `requireRoles(...)` middleware but the MVP only checks authentication.

Envelope (every response):

- Success: `ApiSuccess<T> = { ok: true, data: T }`
- Error:   `ApiError = { ok: false, error: { code, message, details? } }`

Common error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `PLUGIN_NOT_FOUND`, `PLUGIN_CONFIG_INVALID`, `INTERNAL`.

Shared shapes (from `@dk/shared`):

- `Admin`, `LoginResponse` - `shared/src/types/admin.ts`
- `Dealer`, `DealerStage1Input`, `DealerStage2Input` - `shared/src/types/dealer.ts`
- `DealerService`, `AttachServiceInput`, `UpdateDealerServiceInput` - `shared/src/types/dealerService.ts`
- `ServiceRun` - `shared/src/types/serviceRun.ts`
- `AuditLog` - `shared/src/types/auditLog.ts`
- `ServicePluginCatalogEntry` - `shared/src/types/plugin.ts`
- `Paginated<T>`, `ApiSuccess<T>`, `ApiError` - `shared/src/types/api.ts`

Zod validators (from `@dk/shared` `schemas`):

- `loginSchema`, `dealerCreateStage1Schema`, `dealerUpdateSchema`, `dealerListQuerySchema`, `attachServiceSchema`, `updateDealerServiceSchema`, `runNowSchema`, `runsListQuerySchema`.

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
    attached: number;            // total DealerService rows
    active: number;              // status=ACTIVE
  };
  runs: {
    last24h: number;
    successRate24h: number;      // 0..1
    failedLast24h: number;
    avgDurationMs24h: number;
  };
  recentRuns: ServiceRun[];      // newest 10
}
```

(The `OverviewSnapshot` type will live in `shared/src/types/overview.ts` when the backend agent picks this up; the architect intentionally stops at the contract.)

---

## Status codes

| Code | When                                                       |
|------|------------------------------------------------------------|
| 200  | Successful GET / PATCH / DELETE                            |
| 201  | Successful POST that creates a resource                    |
| 202  | `POST /dealer-services/:dsId/run-now`                      |
| 400  | Zod validation failure (`error.code='VALIDATION_ERROR'`)   |
| 401  | Missing/invalid JWT                                        |
| 403  | RBAC denied (currently unused)                             |
| 404  | Not found                                                  |
| 409  | Unique conflict                                            |
| 422  | Plugin config failed Ajv validation                        |
| 500  | Internal                                                   |

## Conventions

- Timestamps: ISO 8601 with offset.
- IDs: 24-char Mongo ObjectId hex strings.
- Pagination: `page` is 1-indexed; `pageSize` defaults to 20, max 200.
- Sort: `field:asc|desc`, single field per request.
- Sensitive fields (`Admin.passwordHash`) are never returned.
