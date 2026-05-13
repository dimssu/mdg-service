# Release Review — Dealer Kavach Admin Portal (MVP)

Build date: 2026-05-13
Branch: `main`

## Executive summary

The MVP ships a working, typed, tested admin portal with five plug-and-play
service workflows. Backend, frontend, shared types, scheduler, plugin registry,
seed data, integration tests, lint/format tooling, security review, and CI
hints are all in place. All quality gates pass:

| Gate | Result |
|---|---|
| `npm run typecheck` | clean across shared, backend, frontend |
| `npm run lint` (--max-warnings=0) | clean |
| `npm run build` | clean (frontend bundle 681 KB / 212 KB gz, single chunk) |
| `npm run -w @dk/backend test` | 19 suites, 112 tests, 100% passing |
| Backend line coverage | 96.30% (gate ≥70% on registry/utils/middleware/scheduler — all >91%) |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `docker compose config -q` | parses |
| `npm run -w @dk/backend check:plugins` | loads all five plugin IDs |

## What shipped

- **Modular monorepo** — `shared/` (Zod schemas + types as `@dk/shared`), `backend/`, `frontend/`. npm workspaces.
- **Backend** — Express + Mongoose + Zod, JWT auth with rate-limited login, env-driven CORS allowlist, helmet, pino with redaction. Scheduler ticks every minute, claims jobs atomically via `findOneAndUpdate`, writes `ServiceRun`, recomputes `nextRunAt` from cadence.
- **Plugin registry** — auto-discovers `backend/src/services/<slug>/index.ts`, validates the contract with Zod, compiles each plugin's `defaultConfigSchema` with Ajv strict. Adding a plugin is a drop-in folder; documented in `docs/ADDING_A_SERVICE.md`.
- **Five plugins** — `daily-stock-check`, `weekly-compliance-report`, `monthly-invoice-generation`, `annual-license-renewal-reminder`, `custom-request`. All deterministic from a seed `dealerId:dealerServiceId:startedAt`, all with hand-authored JSON Schemas + Zod twins. Plus a `_example` placeholder kept as the canonical reference.
- **Frontend** — Vite + React 18 + TS, Tailwind wired to the style-guide tokens, TanStack Query, React Router v6, Zustand auth store, RHF + Zod forms. Pages: Login, Overview, Dealers, Dealer Detail (Info / Services / Run History / Custom Requests), Service Catalog, Run History. The Attach-Service form is auto-generated from each plugin's `defaultConfigSchema` via `@rjsf/core` + Ajv8 — zero per-plugin frontend code.
- **Tests** — 112 backend tests (Jest + ts-jest ESM, supertest + mongodb-memory-server). Per-plugin determinism smoke tests, registry/scheduler/auth/cadence/jwt/password units, and six integration suites covering the full happy path.
- **Seed** — admin + 5 dealers in mixed statuses, each active dealer gets a varied mix of the five plugins with historical runs.
- **Tooling** — ESLint + Prettier with per-workspace overrides, lint-staged via husky pre-commit, GitHub Actions CI (`.github/workflows/ci.yml`) running install → shared build → typecheck → lint → backend tests on Node 20.
- **Docs** — `ARCHITECTURE.md`, three ADRs, `docs/API_CONTRACT.md`, `docs/STYLE_GUIDE.md`, `docs/ADDING_A_SERVICE.md`, `docs/TEST_PLAN.md`, `docs/rest.http`, `docs/REVIEW.md`.
- **Docker** — `docker-compose.yml` with `mongo:7` + `backend` services; backend `Dockerfile` is multi-stage Node 20 alpine, monorepo-aware.

## File & LOC counts

| Workspace | TypeScript files | Total lines (incl. comments/blank) |
|---|---:|---:|
| `backend/src` | 60 | 3,946 |
| `frontend/src` | 53 | 4,472 |
| `shared/src` | 16 | 500 |

Backend tests live under `backend/src/**/*.test.ts` and `backend/test/integration/`.

## Security review

See [`docs/REVIEW.md`](docs/REVIEW.md) for the 12-item findings list. All
findings are graded `info` / `low` — none block the release. `npm audit
--omit=dev` reports 0 vulnerabilities.

## Deferred items

See [`LIMITATIONS.md`](LIMITATIONS.md). Highlights:
- Bump `JWT_SECRET` min length to 32 for production.
- Swap `express-rate-limit` to a Redis store for multi-replica deployments.
- Code-split frontend per-route (bundle is single 212 KB-gz chunk).
- BullMQ scheduler when running >1 backend replica.
- No frontend test suite (MVP scope; manual smoke checklist provided).

## Suggested next steps

1. Run the manual smoke test in `docs/TEST_PLAN.md` against a live stack
   (`docker compose up` + `npm --workspace @dk/backend run seed` + `npm run -w
   @dk/frontend dev`).
2. Wire SSO / real RBAC into the `requireRoles` seam in
   `backend/src/middleware/auth.ts` when the directory of admins grows beyond
   the seeded user.
3. Add Playwright happy-path E2E once a frontend test framework is on the
   roadmap.
4. Action the `JWT_SECRET` length tightening and Redis rate-limit store
   before promoting to production.

## Cleanup applied in this review pass

- `.eslintrc.cjs` — disabled three `import/*` rules that produce false positives on CJS-default-export packages under NodeNext, and allowed `while (true)` in `no-constant-condition` for the scheduler claim loop. Net effect: lint is clean at `--max-warnings=0`.
- `backend/src/services/registry.ts` — re-ordered imports.
- `frontend/src/pages/OverviewPage.tsx` — replaced `import('@dk/shared').T` annotation with a proper `import type`.

All other quality gates were already green when this pass started.
