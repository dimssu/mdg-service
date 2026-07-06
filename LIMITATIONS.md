# Known Limitations

These are deliberate deferrals out of the MVP. Each is small enough to schedule
as a follow-up; none block the happy path.

## Production hardening

- **JWT secret length floor.** `backend/src/config/env.ts` accepts ≥16-char secrets. Production should require ≥32 chars (256 bits for HS256). Trivial follow-up: bump the Zod `.min(16)` to `.min(32)` and condition on `NODE_ENV === 'production'` if dev ergonomics matter.
- **Per-cluster login rate limiting.** `express-rate-limit` defaults to an in-memory store. Behind multiple replicas, swap to `rate-limit-redis` so the cap is enforced across the cluster. See `docs/REVIEW.md` SEC-004.
- **CORS allowlist visibility.** Log the resolved `CORS_ORIGINS_LIST` at boot at `info` level so operators can spot typos quickly. See SEC-003.

## Scheduler

- **Single-instance scheduler.** `backend/src/scheduler/index.ts` uses node-cron and claims jobs with a Mongo `findOneAndUpdate`. ADR 0003 already calls this out: BullMQ + Redis is the path when running >1 backend replica.

## Frontend

- **No frontend test suite.** Out of MVP scope per the QA brief. Recommended starter set: Playwright happy-path covering login → attach service → run-now → run visible in history. The REST collection at `docs/rest.http` and the smoke checklist at `docs/TEST_PLAN.md` already cover this manually.
- **Topbar search is a disabled placeholder.** Backend has no multi-entity search endpoint yet. Wire it up when the API gains a `/search` route.
- **No dark-mode toggle UI.** Tokens are wired and `darkMode: 'class'` works — only the toggle is missing. Add a switch to the topbar that toggles `document.documentElement.classList`.
- **Frontend bundle is single chunk (~681 KB / ~212 KB gzip).** Vite warns at the 500 KB threshold. Code-split per route via `React.lazy` when the bundle grows further.

## Dealer lifecycle

- **`DELETE /dealers/:id` is a hard delete with DealerService cascade.** Brief mentioned an optional `SUSPENDED` soft-delete path; the API contract was followed instead (hard delete, retain ServiceRun history). If product wants soft delete, add a `SUSPENDED` status branch in `dealerService.ts` and switch the route.

## Admin management

- **Flat admin tier — no super-admin.** `POST/PATCH /admins` are gated only on `requireRole('admin')`, so every admin can create other admins, suspend/reactivate peers, and reset any admin's password. There is no elevated "owner" tier and the seeded default admin is not specially protected. This is an acceptable MVP model for a small, mutually-trusted support team; introduce an `owner` role (or an `isOwner` flag) that alone can manage admins if the team grows or trust boundaries are needed. Self-suspension and suspending the last active admin are already blocked, and every create/update writes an audit entry.
- **Admin suspension revokes on next request, not instantly across sockets.** `requireAuth` now re-checks admin status on every REST request, so a suspended admin is blocked immediately from all actions. Their existing Socket.IO connection (realtime inbox updates only — no mutations) is not torn down until it reconnects; add an admin `sessionId`/disconnect sweep if instant socket revocation is required.

## Chat / ticket lifecycle & reply SLA

- **Reopen abandons continuity by design.** When a resolved client messages again, the thread reopens as a fresh **UNASSIGNED** ticket (`messages.ts` clears `assignedAdminId`), and `resolve` clears the owner too. This favours fair distribution over "the same admin keeps handling you." If continuity is wanted later, keep `assignedAdminId` on resolve and reopen to `ASSIGNED` for that admin.
- **Reply-SLA clock is wall-clock, not business hours.** The auto-unassign window (`TICKET_AUTO_UNASSIGN_MINUTES`, default 20) and the flag-colour thresholds (`TICKET_FLAG_WARN_MINUTES` = 90, `TICKET_FLAG_URGENT_MINUTES` = 180, in `shared/src/types/conversation.ts`) count real minutes since the client's oldest unanswered message. There is no "pause overnight / weekends" concept yet; add a business-calendar gate to the sweep + `ticketFlagLevel` if support isn't 24/7.
- **Auto-unassign fires on the assignee's grace window.** The sweep only returns a ticket to the pool when BOTH the client's message (`awaitingSince`) and the pickup (`assignedAt`) are older than the window, so freshly picked-up-but-stale tickets aren't yanked instantly. The claim is an atomic `findOneAndUpdate`, so running the sweep on multiple replicas is safe (each ticket is processed once).
- **Flag colour is derived, not stored.** `awaitingReplySince` is persisted; the yellow/red level is computed live client-side via `ticketFlagLevel(now)` and re-evaluated on a 60s tick, so colours advance without a server round-trip. Only the auto-return `flagged` boolean is persisted (accountability marker; cleared on next pickup/reply/resolve).
- **Any dealer message reopens a resolved thread — even "ok, thanks".** Per `docs/PRD.md` open question: a trivial acknowledgement reopens a full ticket. A grace/auto-close window or a "no reply needed" close is the eventual answer; not yet built.
- **Conversation lists still cap at 100 with no load-more.** The badge counts are now exact via `GET /conversations/counts` (`countDocuments`), but the list bodies request `limit:100` and have no cursor pagination, so a tab with >100 items hides the oldest. The backend `before` cursor exists; wire an infinite-scroll trigger (esp. for Resolved) when volume grows.
- **Reassign has no admin picker.** "Reassign" re-assigns to self (documented UX gap); assignment changes are now write-audited (`CONVERSATION_ASSIGNED` / `CONVERSATION_REASSIGNED`), but a picker + takeover notification is still pending.
- **Legacy `userId`-less "reunite" branch retained.** `GET /conversations/mine` still adopts a pre-per-member thread for an owner on first load. Dead-ish now that the schema requires `userId`; delete after confirming production has no such rows.

## Audit logging

See ADR 0009 and `docs/specs/audit-logging.md`. The trail records who did what, when, and
from where, with a global admin **Activity** page. Deliberate deferrals:

- **No retention / rotation policy.** Audit rows (which now include `ip` and `userAgent` —
  personal data) are kept indefinitely. If a data-protection regime applies, add a TTL index
  or an archival sweep on `AuditLog.at` and document the lawful basis + retention window.
- **Not tamper-proof.** Rows live in the same Mongo as the data they describe; any process
  with a DB connection can modify or delete them. This is an operational record, not a legal
  one. Append-only / WORM storage (or streaming to an external SIEM) is the path if the trail
  must be evidential.
- **Best-effort, not guaranteed.** `writeAudit` swallows-and-logs on failure so recording an
  action never breaks the action. A DB hiccup can therefore drop a row. A guaranteed trail
  would need a transactional outbox / queue.
- **Service-layer actions carry less context.** Audits written inside service functions
  (Kavach programme, `executeRun`) capture `actorId` + `action` but not IP/UA/method/path,
  because they run without an HTTP request. Route-handler actions are fully enriched via
  `auditFromReq`. Thread a request-context object through those services if full parity is
  needed.
- **`req.ip` depends on `TRUST_PROXY`.** It defaults to `loopback`; behind a load balancer
  set `TRUST_PROXY` to the proxy hop-count (e.g. `1`) or the real client IP will be the LB's.
- **Sensitive-read logging is selective.** Only `RECORD_VIEWED` and `ARTIFACT_DOWNLOAD` log
  data access; ordinary list/detail reads are not logged (by design, to keep the trail
  signal-rich). Push-token register/unregister churn is intentionally not audited.
- **No audit for the audit reads.** Viewing the Activity page / `GET /audit` is itself not
  audited; add a meta-audit if "who looked at the logs" must be tracked.

## Plugin SDK

- **Plugins live in-repo only.** No mechanism for uploading or hot-reloading plugins from outside `backend/src/services/`. ADR 0002 calls this an explicit MVP constraint.

## Tooling

- **Husky `prepare` script silently no-ops without `.git`.** Intentional so npm-installs inside Docker / CI don't fail.
- **Watchman warning** ("Recrawled this watch...") can appear on macOS during `jest`. Harmless; clear by running `watchman watch-del <path>; watchman watch-project <path>`.
