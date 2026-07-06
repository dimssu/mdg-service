# ADR 0009 — User-level audit logging (who did what, when, from where)

- Status: Accepted
- Date: 2026-07-06
- Extends: existing `AuditLog` model + `writeAudit()` helper (present since the MVP)
- Related: ADR 0005 (per-member `User`s / roles), `docs/specs/audit-logging.md`
- Contracts: `shared/src/types/auditLog.ts`, `shared/src/types/enums.ts` (`AUDIT_ACTIONS`, `AUDIT_ENTITIES`), `shared/src/schemas/audit.ts`

## Context

The platform already wrote audit rows for _some_ mutations via `writeAudit({ entity,
entityId, actorId, action, before?, after? })`, but the trail had three gaps that made it
unfit as a real "who did what" record:

1. **Thin actor context.** Only a raw `actorId` string was stored — no role, no
   email/name, and no request context (IP, user-agent, method, path). A row could not
   answer "which admin, signed in from where, did this?".
2. **Inconsistent coverage.** Many state-mutating handlers wrote no audit at all (dealer
   user create/suspend, record uploads, conversation-started, the client-message reopen,
   run-now), and **failed logins were never recorded** — only successful ones. Several
   actions were written as raw strings outside the `AUDIT_ACTIONS` enum.
3. **No way to read it.** The only read surface was `GET /dealers/:id/audit` (one dealer).
   There was no cross-entity activity feed and no admin UI, so the trail was effectively
   write-only.

The ask: proper user-level logging so the team has an auditable record of the actions
anyone takes, and can see it.

## Decision

1. **Enrich every audit row with actor + network context.** `AuditLog` gains
   `actorRole`, `actorEmail` (snapshotted from the JWT at write time so the row stays
   self-describing even if the user is later renamed/deleted), plus `ip`, `userAgent`,
   `method`, `path`. `actorName` is **not stored** — it is resolved best-effort at read
   time by batch-joining the `User`/`Admin` stores, so a rename is reflected retroactively
   and we avoid an extra write per action.

2. **A request-aware helper, `auditFromReq(req, { entity, entityId, action, before?,
after?, actorId? })`.** It auto-captures the actor from `req.user` and the IP/UA/method/
   path from the request, and is the required way to audit in route handlers. The lower-
   level `writeAudit()` remains for background jobs (sweeps, `executeRun`) that have no
   request. `req.ip` is made trustworthy by `app.set('trust proxy', env.TRUST_PROXY)`
   (default `loopback`; set to the proxy hop-count in production).

3. **Audit writes are best-effort, never fatal.** `writeAudit` wraps the insert in
   try/catch and logs on failure. Recording an action must never break the action itself
   (a login must not 500 because the audit insert failed). It is still `await`ed so the row
   is present synchronously for tests and immediate reads.

4. **Close the coverage gaps and formalise the taxonomy.** All mutating user actions now
   audit through `auditFromReq`, including the previously-silent ones and **`LOGIN_FAILED`**
   (invalid password / suspended / unknown email). Two sensitive **reads** are logged as
   data-access events: `RECORD_VIEWED` (a dealer document's signed URL is minted) and
   `ARTIFACT_DOWNLOAD` (run-artifact egress). The raw-string actions (`CONVERSATION_*`,
   `ADMIN_*`, `IRAS_CREDENTIALS_*`, `SERVICE_LOGGED`) are promoted into `AUDIT_ACTIONS`.

5. **Never log secrets or unnecessary PII.** Passwords/hashes are recorded only as
   `{ passwordChanged: true }`; IRAS credentials log `{ username, setAt }` — never the
   plaintext or ciphertext; bank account details are stripped from dealer snapshots
   (`bankDetailsChanged` boolean instead); push tokens are not logged. IP + user-agent
   are themselves personal data and are retained deliberately (see Consequences).

6. **A global, admin-only read API + Activity page.** `GET /audit` returns a paginated,
   filterable feed (actor, entity, entityId, action, date range) with actor names resolved
   in one batch; `GET /audit/actors` powers the actor filter. The admin app gets an
   **Activity** page (`/activity`) mirroring the existing list-page pattern, with a
   row-detail dialog showing before/after and the full request context.

## Consequences

- **Positive.** Every meaningful action — including failed logins and sensitive document
  access — is now attributable to a person, a role, and an origin IP, and is visible in one
  place. Coverage is consistent and the action vocabulary is enum-checked.
- **PII / retention.** Audit rows now hold IP and user-agent (personal data) and are kept
  indefinitely — there is no retention/rotation policy yet. If a data-protection regime
  applies, add a TTL or archival sweep and document the lawful basis. See `LIMITATIONS.md`.
- **Not tamper-proof.** Rows live in the same Mongo as the data they describe and any
  process with a DB connection can alter them. This is an operational record, not a legal
  one; ship-to-WORM/append-only storage is a future step if needed.
- **Best-effort, not guaranteed.** A DB hiccup can drop an audit row (logged, not thrown).
  Acceptable for this operational trail; a guaranteed trail would need an outbox/queue.
- **Service-layer actions carry less context.** Audits written inside service functions
  (Kavach programme, `executeRun`) still capture `actorId`/`action` but not IP/UA, because
  they don't hold the request. Route-handler actions are fully enriched.
