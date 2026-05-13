# ADR 0001 - Monorepo layout

Status: Accepted
Date: 2026-05-13

## Context

The MVP has three deployable surfaces (backend API, frontend SPA, and a shared types/schemas package) plus docs and scripts. A single small team will work across all three. We need fast feedback on type changes - if a backend route changes its response shape, the frontend should fail to compile.

Options considered:

1. **Three separate repos.** Versioned `@dk/shared` published to a private registry. Strong isolation, but every shared-types change is a 3-PR ceremony.
2. **npm workspaces in one repo.** Workspace-local `@dk/shared` consumed by source, no publish step.
3. **Turborepo / Nx.** Adds caching and task orchestration. Overkill for three packages.

## Decision

Single repo, **npm workspaces** with three packages: `shared`, `backend`, `frontend`. Root scripts use `concurrently` for `dev` and rely on `npm --workspaces --if-present` for `test`, `lint`, `typecheck`.

`@dk/shared` is consumed **from source** (`"types": "src/index.ts"`) so backend and frontend pick up edits without a build step. A `tsc` build target exists so the package can be published later if needed.

Folder layout:

```
shared/   backend/   frontend/   docs/   scripts/   docker-compose.yml
```

## Consequences

- **Pro:** A type change in `shared/` ripples instantly to consumers; CI catches breakage.
- **Pro:** One install, one lockfile, one `npm run dev`.
- **Pro:** New tools (e.g. Turborepo) can be layered on later without restructuring.
- **Con:** Consumers depend on `shared/src/*.ts` directly. Backend's `ts-node`/`tsx` and frontend's Vite handle this fine, but any tool that does not see node_modules sources must be configured to traverse workspace folders.
- **Con:** A monolithic CI matrix - every PR builds all three. Acceptable at this size.
