# Audit logging — user activity trail

How the platform records **who did what, when, and from where**, and how admins read it.
See ADR 0009 for the rationale.

## The record

Every audit row (`AuditLog`, `mdg-backend/src/models/AuditLog.ts`) captures:

| Field                      | Meaning                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `entity` / `entityId`      | What was acted on (e.g. `Dealer`/`<id>`, `Auth`/`<email>`).       |
| `action`                   | A verb from `AUDIT_ACTIONS` (e.g. `CREATE`, `LOGIN_FAILED`).      |
| `actorId`                  | The acting `User`/`Admin` id, or `anonymous` / `system`.          |
| `actorRole` / `actorEmail` | Snapshotted from the JWT at write time (self-describing forever). |
| `ip` / `userAgent`         | Request origin. **Personal data.** Null for background actions.   |
| `method` / `path`          | HTTP method + path (query string stripped).                       |
| `before` / `after`         | State snapshots / summaries (secrets & PII redacted — see below). |
| `at`                       | Timestamp.                                                        |

`actorName` is **not stored** — it is resolved at read time from the `User`/`Admin` stores,
so a later rename is reflected retroactively and there is no extra write per action.

## How actions are recorded

- **Route handlers** call `auditFromReq(req, { entity, entityId, action, before?, after?,
actorId? })` (`mdg-backend/src/utils/audit.ts`). It auto-fills actor + IP/UA/method/path.
  `req.ip` is trustworthy because `app.set('trust proxy', env.TRUST_PROXY)` is set.
- **Background jobs** (the reply-SLA sweep, `executeRun`) call the lower-level
  `writeAudit({ ... actorId })` — no request, so no IP/UA.
- **Best-effort:** `writeAudit` never throws. A failed audit insert is logged, not
  propagated, so it can't break the user action it records. It is still awaited.

## What is covered

Login (success **and** `LOGIN_FAILED`: invalid password / suspended / unknown email);
admin create/update/password-reset; dealer create/update/delete; dealer-user
create/update/suspend; IRAS credential set/clear; service attach/update/detach/run-now and
`SERVICE_LOGGED`; onboarding step complete/reopen; record create; conversation
started/assigned/reassigned/ticket-updated/resolved/reopened (incl. the client-message
reopen) and the auto-unassign sweep; staff employee add/update and points award/undo; the
self-serve preference update.

Two **sensitive reads** are logged as data-access events (not mutations): `RECORD_VIEWED`
(a dealer document's signed URL is minted) and `ARTIFACT_DOWNLOAD` (run-artifact egress).

## Secrets & PII hygiene

`before`/`after` never contain: passwords or hashes (recorded as `{ passwordChanged: true }`),
IRAS credentials (only `{ username, setAt }` — never plaintext or ciphertext), bank account
details (stripped; `bankDetailsChanged` boolean instead), or push tokens. IP + user-agent
are retained deliberately as forensic context.

## Reading the trail

| Endpoint                 | Who   | Purpose                                                                                                                            |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GET /audit`             | admin | Paginated feed. Filters: `actorId`, `entity`, `entityId`, `action`, `from`, `to`. Newest first, actor names resolved in one batch. |
| `GET /audit/actors`      | admin | Distinct actors + activity counts (powers the actor filter).                                                                       |
| `GET /dealers/:id/audit` | admin | Pre-existing per-dealer view (unchanged).                                                                                          |

Both new endpoints are gated by `requireAuth` + `requireRole('admin')`.

### Admin UI

The **Activity** page (`/activity`, `mdg-admin/src/pages/ActivityPage.tsx`) mirrors the
standard list-page pattern: a filter bar (actor / entity / action / from / to, persisted in
the URL) over a table (Time, Actor + role, Action, Entity, Target, IP). Clicking a row opens
a detail dialog with the actor, full request context (method/path, IP, user-agent), and the
`before`/`after` JSON.

## Config

| Env           | Default    | Effect                                                                                                                                                  |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRUST_PROXY` | `loopback` | Express `trust proxy`; governs how `req.ip` is derived from XFF. Set to the proxy hop-count (e.g. `1`) in production so the real client IP is recorded. |

## Known gaps

See `LIMITATIONS.md` → "Audit logging": no retention/TTL policy (IP/UA kept indefinitely),
not tamper-proof (same DB), best-effort (not guaranteed), and service-layer actions
(Kavach) carry `actorId` but not IP/UA.
