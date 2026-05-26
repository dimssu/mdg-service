# MDG Service

Multi-service workspace for the MDG dealer platform. The platform has four runtime pieces and one shared package, each in its own Git repository under the [`mdg-services`](https://github.com/mdg-services) organisation.

| Repo | What it is |
|---|---|
| [`mdg-backend`](https://github.com/mdg-services/mdg-backend) | Express + MongoDB + Socket.IO API. Serves both admin and dealer clients. |
| [`mdg-admin`](https://github.com/mdg-services/mdg-admin) | React + Vite admin portal. Dealer management + support inbox. |
| [`mdg-client`](https://github.com/mdg-services/mdg-client) | React + Vite dealer portal. Chat, services, profile. Mobile-first. |
| [`mdg-app`](https://github.com/mdg-services/mdg-app) | Expo (React Native) wrapper that loads `mdg-client` in a WebView. |
| `shared` (in this repo) | `@dk/shared` — TypeScript types + Zod schemas consumed by all of the above. |

## What's in this repo

This is the **meta workspace**. It contains:

- `shared/` — the cross-repo TypeScript types and Zod schemas
- `docs/` — ADRs, API contract, style guide, plugin author guide
- `scripts/` — helper scripts (clone the four service repos, run lifecycle helpers)
- Root `package.json` declaring npm workspaces so all five packages resolve from a single tree once cloned alongside.

The four service folders (`mdg-backend/`, `mdg-admin/`, `mdg-client/`, `mdg-app/`) are intentionally gitignored here — they live in their own repos and are cloned in next to this one for local dev.

## Quick start

```bash
# 1. Clone this meta repo
git clone https://github.com/mdg-services/mdg-service.git
cd mdg-service

# 2. Clone the four service repos alongside (uses the org from $MDG_GH_ORG or defaults to mdg-services)
./scripts/clone-services.sh

# 3. Install (npm workspaces resolves @dk/shared via file:../shared)
nvm use            # Node 20
npm install

# 4. Configure backend env (MongoDB URI, JWT secret, S3 creds, CORS origins)
cp mdg-backend/.env.example mdg-backend/.env
# edit mdg-backend/.env

# 5. Seed an admin + sample dealer
npm run seed --workspace mdg-backend

# 6. Run everything (backend :4000, admin :5173, client :5174)
npm run dev
```

Then open:
- Admin: http://localhost:5173 — `admin@dealerkavach.local` / `Admin@12345`
- Client: http://localhost:5174 — `owner@<seeded-dealer-code>.test` / `password123`

For the mobile app:
```bash
cd mdg-app
npm install
npx expo start
```

## Architecture at a glance

- One Express server handles REST + Socket.IO on the same port.
- MongoDB Atlas (or any Mongo 7+) is the datastore; node-cron drives recurring service runs.
- S3 backs all file uploads (chat attachments + service-run artifacts), accessed via presigned URLs.
- Auth is JWT (HS256, 12h) with three roles: `admin`, `dealer-owner`, `dealer-staff`.
- The admin portal includes a 3-pane inbox where any admin can pick up a dealer's incoming message, reply, and resolve.
- The dealer portal is chat-first. Empty state offers quick-action chips so anyone can get unstuck.
- The mobile app is an Expo WebView shell around `mdg-client` with a native push-token bridge.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/API_CONTRACT.md](./docs/API_CONTRACT.md)
- [docs/ADDING_A_SERVICE.md](./docs/ADDING_A_SERVICE.md)
- [docs/STYLE_GUIDE.md](./docs/STYLE_GUIDE.md)
- [docs/ADR/](./docs/ADR/)
