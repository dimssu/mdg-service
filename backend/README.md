# Dealer Kavach - Backend

Node 20 + Express + Mongoose + node-cron API for the Dealer Kavach admin portal.

## Setup

From the repo root:

```
npm install
```

Copy the env file:

```
cp backend/.env.example backend/.env
```

Adjust values as needed. `JWT_SECRET` must be at least 16 characters.

## Run

Start Mongo (from repo root):

```
docker compose up -d mongo
```

Then the dev server (auto-reloads via tsx watch):

```
npm --workspace @dk/backend run dev
```

Or from `backend/`:

```
npm run dev
```

API is served on `http://localhost:4000`. Health endpoint at `GET /health`. All resource endpoints live under `/api/v1` and follow `docs/API_CONTRACT.md`.

## Build / start (production)

```
npm --workspace @dk/backend run build
npm --workspace @dk/backend run start
```

## Seed

Seeds 1 admin, 5 dealers in varied states, and attaches the placeholder plugin with a handful of historical runs.

```
npm --workspace @dk/backend run seed             # idempotent
npm --workspace @dk/backend run seed -- --reset  # drops + reseeds
```

Default admin: `admin@dealerkavach.local` / `Admin@12345`.

## Typecheck / test

```
npm --workspace @dk/backend run typecheck
npm --workspace @dk/backend run test            # all tests (unit + integration)
npm --workspace @dk/backend run test:integration
npm --workspace @dk/backend run test:coverage   # coverage report
npm --workspace @dk/backend run test:watch
```

The suite runs Jest with `ts-jest` in ESM mode. Because the backend is
`"type": "module"` with NodeNext resolution, the scripts launch Jest under
`NODE_OPTIONS=--experimental-vm-modules`. `mongodb-memory-server` is
booted once per Jest run by `test/global-setup.ts`, so no developer Mongo
instance is required. Coverage thresholds (≥70% lines) are enforced for
`src/services/registry.ts`, `src/utils/`, `src/middleware/`, and
`src/scheduler/`.

## Layout

- `src/app.ts` - Express app factory (Helmet, CORS, JSON body limit, pino-http, routes).
- `src/index.ts` - bootstrap (env, db, registry, scheduler, listen).
- `src/config/` - env + logger.
- `src/db/connect.ts` - Mongoose connect with retry/backoff.
- `src/models/` - Mongoose models with indexes per ADR.
- `src/middleware/` - auth, validation, error handling, request log, rate limit, async handler.
- `src/routes/v1/` - REST endpoints under `/api/v1`.
- `src/services/registry.ts` - plugin auto-discovery and Ajv config validation.
- `src/services/_example/` - placeholder plugin; remove once real plugins land.
- `src/scheduler/` - node-cron tick claiming due `DealerService` rows and invoking plugins.
- `src/utils/` - shared helpers (cadence math, audit log writer, JWT, bcrypt, pagination, AppError).
- `src/seed.ts` - dev seed script.
