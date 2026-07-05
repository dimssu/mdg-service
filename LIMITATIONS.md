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

## Plugin SDK

- **Plugins live in-repo only.** No mechanism for uploading or hot-reloading plugins from outside `backend/src/services/`. ADR 0002 calls this an explicit MVP constraint.

## Tooling

- **Husky `prepare` script silently no-ops without `.git`.** Intentional so npm-installs inside Docker / CI don't fail.
- **Watchman warning** ("Recrawled this watch...") can appear on macOS during `jest`. Harmless; clear by running `watchman watch-del <path>; watchman watch-project <path>`.
