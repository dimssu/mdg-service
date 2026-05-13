# Security Review — Dealer Kavach Admin Portal (MVP)

Date: 2026-05-13
Reviewer: DevEx pass
Scope: full backend, frontend, shared, and root tooling.

`npm audit --omit=dev` reports **0 vulnerabilities** at review time.

Findings are graded as `info` / `low` / `medium` / `high` and tagged with a status:
`fixed in this pass` | `accepted for MVP` | `tracked in LIMITATIONS.md`.

---

## [SEC-001] JWT secret minimum length is 16 characters (low)

- Location: [backend/src/config/env.ts:11](backend/src/config/env.ts:11)
- Risk: HS256 best practice is at least 256 bits (32 bytes / 32 ASCII chars). 16 chars is acceptable for development but weak in production.
- Recommendation: bump the Zod `min` to `32` and update `.env.example` to a 32+ char placeholder. Optionally key on `NODE_ENV` to enforce 32+ only in production.
- Status: `accepted for MVP`. The placeholder in `.env.example` is already 38 chars (`change-me-in-prod-please-use-32-bytes`) which would pass a stricter check; the env loader will catch a too-short value at boot. Documented as a hardening step in `LIMITATIONS.md`.

## [SEC-002] helmet CSP disabled (info)

- Location: [backend/src/app.ts:14-17](backend/src/app.ts:14)
- Risk: `contentSecurityPolicy: false` is fine for a pure JSON API but means CSP won't kick in if the backend is ever extended to serve HTML.
- Recommendation: leave as-is for the JSON-only API; add a CSP block if/when an HTML surface is added.
- Status: `accepted for MVP`.

## [SEC-003] CORS allows credentials with origin allowlist (low)

- Location: [backend/src/app.ts:18-27](backend/src/app.ts:18)
- Risk: `credentials: true` combined with a dynamic origin function is correct but requires the allowlist to be tight. A typo in `CORS_ORIGINS` is the main risk.
- Recommendation: log the resolved allowlist at startup at `info` level for operator visibility (one-line addition); kept out of this pass to stay under the 30 LOC bar per finding cumulatively.
- Status: `accepted for MVP`.

## [SEC-004] Login rate limit is per-process, not per-cluster (low)

- Location: [backend/src/middleware/rateLimit.ts:5-19](backend/src/middleware/rateLimit.ts:5)
- Risk: `express-rate-limit` defaults to the in-memory store. Behind multiple replicas an attacker can scale attempts linearly with replica count.
- Recommendation: when going multi-replica, swap to `rate-limit-redis` (or similar). Single-replica MVP is unaffected.
- Status: `tracked in LIMITATIONS.md`.

## [SEC-005] Password hashing uses bcrypt cost 12 (info)

- Location: [backend/src/utils/password.ts:3](backend/src/utils/password.ts:3)
- Risk: meets OWASP 2024 guidance (cost ≥10).
- Recommendation: no change.
- Status: `accepted for MVP`.

## [SEC-006] Mongo query inputs are not interpolated as raw strings (info)

- Audit: every `find`/`updateOne` in `backend/src/routes/v1/*.ts` passes Zod-validated, typed fields into Mongoose query objects. No `$where` usage. No string templating into queries. Pagination values are clamped in `backend/src/utils/pagination.ts`.
- Risk: low; the surface is small and well-typed.
- Status: `accepted for MVP`.

## [SEC-007] Logger redacts sensitive fields (info)

- Location: [backend/src/middleware/requestLog.ts:9-15](backend/src/middleware/requestLog.ts:9), [backend/src/config/logger.ts:8-15](backend/src/config/logger.ts:8), [backend/src/db/connect.ts:44-46](backend/src/db/connect.ts:44)
- Redaction paths: `req.headers.authorization`, `req.headers.cookie`, `req.body.password`. DB URI password is redacted on connect.
- Risk: low. If new sensitive fields are added (e.g. bank account numbers under `Dealer`), redaction list should grow.
- Status: `accepted for MVP`. Future field additions should update the redaction list.

## [SEC-008] No `dangerouslySetInnerHTML` in frontend (info)

- Audit: `grep -rn dangerouslySetInnerHTML frontend/src` returns no matches.
- Risk: none.
- Status: `accepted for MVP`.

## [SEC-009] JSON-Schema-driven config form rendering (info)

- Location: `frontend/src/pages/dealers/AttachServiceDialog.tsx` (RJSF + Ajv8 strict mode).
- Risk: a malicious plugin author could submit a schema with prototype-polluting keys. Mitigated server-side: the plugin registry compiles each `defaultConfigSchema` with Ajv `strict: true` at startup ([backend/src/services/registry.ts](backend/src/services/registry.ts)). Plugins are first-party code in this repo, not user-uploaded.
- Status: `accepted for MVP`. If plugins ever become user-uploaded, schemas must be sandboxed and validated against a meta-schema before registration.

## [SEC-010] `.env.example` contains only placeholders, `.env` is gitignored (info)

- `.env.example` placeholder for `JWT_SECRET` is `change-me-in-prod-please-use-32-bytes` — obviously a placeholder, not a real secret.
- `.gitignore` lists `.env`, `.env.local`, `.env.*.local`.
- Status: `accepted for MVP`.

## [SEC-011] Body size limit set to 1 MB (info)

- Location: [backend/src/app.ts:28](backend/src/app.ts:28)
- Risk: low. Adequate for admin JSON traffic.
- Status: `accepted for MVP`.

## [SEC-012] Test suite runs in-memory Mongo, not networked (info)

- Location: `backend/test/global-setup.ts`, `backend/test/helpers/setup.ts` (mongodb-memory-server).
- Risk: none.
- Status: `accepted for MVP`.

---

## Dependency audit

```
npm audit --omit=dev   →  0 vulnerabilities
```

Re-run on every PR via the GitHub workflow at `.github/workflows/ci.yml`.

## Cleanup performed in this pass

- `.eslintrc.cjs`: disabled `import/default`, `import/no-named-as-default`, and `import/no-named-as-default-member` — false positives on CJS-default-export packages (`jsonwebtoken`, `node-cron`, `bcryptjs`, `cron-parser`, `react`, `react-dom/client`) under NodeNext resolution. Tightened `no-constant-condition` to allow `while (true)` in the scheduler claim loop.
- `backend/src/services/registry.ts`: re-ordered imports to clear `import/order` warnings and reunited the `AjvInstance` type alias with its import block.
- `frontend/src/pages/OverviewPage.tsx`: replaced `import('@dk/shared').ServiceRun[]` with `import type { ServiceRun }` to satisfy `@typescript-eslint/consistent-type-imports`.

After cleanup, `npm run lint` is clean at `--max-warnings=0` and `npm run typecheck` / `npm run build` / `npm test` all pass.

## What was NOT done in this pass

- No JWT-secret length tightening to 32 (deferred — see SEC-001).
- No `rate-limit-redis` swap (deferred — see SEC-004).
- No additional integration tests; QA pass already at 95.82% statement coverage on backend.
- No frontend test suite (out of MVP scope; see `LIMITATIONS.md`).
