# Dealer Kavach

Internal admin portal for onboarding petrol-pump dealers and orchestrating recurring service workflows for them. Built as a modular plugin platform - new workflows are added by dropping a folder.

## Quick start

```bash
nvm use                  # Node 20
npm install              # installs all workspaces
docker compose up -d     # starts mongo:7 on :27017
cp backend/.env.example backend/.env   # fill JWT_SECRET, MONGO_URI
npm run seed             # creates the initial admin + sample dealers
npm run dev              # runs backend (:4000) and frontend (:5173) concurrently
```

Then open http://localhost:5173 and log in as `admin@dealerkavach.local` / `Admin@12345` (the seeded admin).

## Prerequisites

- **Node 20** (`.nvmrc` provided)
- **npm 10+** (ships with Node 20)
- **MongoDB 7**, reachable on `mongodb://localhost:27017`. Either install it natively, or use the bundled `docker compose up -d mongo` for a one-line container. Docker is a convenience, not a hard requirement — the test suite uses an in-memory Mongo and needs neither.

## Setup

```bash
nvm use
npm install
```

Workspaces installed:
- `@dk/shared` - types + Zod schemas
- `backend` - Express + Mongoose API
- `frontend` - React + Vite SPA

## Run

```bash
npm run dev         # both backend and frontend
npm --workspace backend run dev   # backend only
npm --workspace frontend run dev  # frontend only
```

## Seed

```bash
npm run seed
```

Creates a default admin (`admin@dealerkavach.local` / `Admin@12345`) and a handful of dealers + attached services with historical runs for local dev. Pass `--reset` to drop and reseed.

## Test

```bash
npm test                          # all workspaces with tests
npm --workspace backend run test  # backend (Jest, 112 tests, in-memory Mongo)
npm --workspace backend run test:coverage  # coverage report
```

A frontend test suite is intentionally out of MVP scope; the manual smoke checklist at [docs/TEST_PLAN.md](./docs/TEST_PLAN.md) covers the happy path.

## Lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

## Project structure

```
mdg-service/
├── shared/        @dk/shared - types + Zod schemas (single source of truth)
├── backend/       Express API + plugin runtime
│   └── src/services/<slug>/    plugins live here (auto-discovered)
├── frontend/      React SPA
├── docs/          ADRs, API contract, style guide, plugin guide
├── scripts/       seed and utility scripts
└── docker-compose.yml
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - system overview, diagrams, scheduler design
- [docs/API_CONTRACT.md](./docs/API_CONTRACT.md) - REST endpoints under `/api/v1`
- [docs/ADDING_A_SERVICE.md](./docs/ADDING_A_SERVICE.md) - add a plugin in under 30 minutes
- [docs/STYLE_GUIDE.md](./docs/STYLE_GUIDE.md) - visual tokens for the frontend
- [docs/ADR/](./docs/ADR/) - architecture decision records
