# MDG Service

Multi-service workspace for the MDG dealer platform. "MDG Services" is the company; "Dealer Kavach" is the app its petrol-pump dealers use. The platform is seven repositories plus one shared package. Each repository is its own Git repo under the [`mdg-services`](https://github.com/mdg-services) organisation.

| Repo                                                               | What it is                                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [`mdg-backend`](https://github.com/mdg-services/mdg-backend)       | Express + MongoDB + Socket.IO API. Serves both apps and the website, runs the scheduler and the portal robots.  |
| [`mdg-admin`](https://github.com/mdg-services/mdg-admin)           | React + Vite admin portal. Dealer management, support inbox, tickets, alerts.                                   |
| [`mdg-client`](https://github.com/mdg-services/mdg-client)         | React + Vite dealer portal. One chat, plus services and settings. Mobile-first.                                 |
| [`mdg-app`](https://github.com/mdg-services/mdg-app)               | Expo (React Native) wrapper that loads `mdg-client` in a WebView. Ships on Google Play as "Dealer Kavach".      |
| [`mdg-admin-app`](https://github.com/mdg-services/mdg-admin-app)   | The same Expo wrapper around `mdg-admin`, for MDG staff.                                                        |
| [`mdg-landing`](https://github.com/mdg-services/mdg-landing)       | mdgservices.in: marketing site, voice and chat assistant, film pages, "Register your pump" and grievance forms. |
| [`vruoom-landing`](https://github.com/mdg-services/vruoom-landing) | vruoom.com: the parent company's site.                                                                          |
| `shared` (in this repo)                                            | `@dk/shared`: TypeScript types + Zod schemas used by the backend, admin and client.                             |

## What's in this repo

This is the **meta workspace**. It contains:

- `shared/` - the cross-repo TypeScript types and Zod schemas (the canonical copy; the backend, admin and client each keep a vendored copy that must stay identical)
- `docs/` - ADRs, API contract, style guide, plugin author guide
- `scripts/` - helper scripts; `clone-services.sh` is the one you need
- `mdg-demo/` - Remotion tutorial videos, tracked here
- `marketing/` - films and the leave-behind pamphlet (sits in the workspace folder but is not in git)
- `graphify-out/` - a generated knowledge graph of the code (gitignored; refresh with `graphify update .`)
- Root `package.json` declaring npm workspaces. There are four packages: `shared`, `mdg-backend`, `mdg-admin` and `mdg-client`. `mdg-app` is not one.

Any `*.html` file at the root is a gitignored working note, not documentation.

The service folders (`mdg-backend/`, `mdg-admin/`, `mdg-client/`, `mdg-app/`, `mdg-admin-app/`, `mdg-landing/`) are gitignored here because they live in their own repos. They are cloned in next to this one.

## Quick start

```bash
# 1. Clone this meta repo
git clone git@github.com:dimssu/mdg-service.git
cd mdg-service

# 2. Clone the service repos alongside (uses the org from $MDG_GH_ORG or defaults to mdg-services)
./scripts/clone-services.sh
```

`clone-services.sh` fetches only four repos: `mdg-backend`, `mdg-admin`, `mdg-client` and `mdg-app`. Clone `mdg-admin-app`, `mdg-landing` and `vruoom-landing` by hand from the same organisation if you work on them.

```bash
# 3. Install (npm workspaces resolves @dk/shared via file:../shared)
nvm use            # Node 20
npm install

# 4. Configure backend env (MongoDB URI, JWT secret, S3 creds, CORS origins)
cp mdg-backend/.env.example mdg-backend/.env
# edit mdg-backend/.env

# 5. Seed an admin + sample dealers
npm run seed --workspace mdg-backend

# 6. Run everything (backend :4000, admin :5173, client :5174)
npm run dev
```

> **Check `MONGODB_URI` first.** A `mdg-backend/.env` can point at the production database. If yours does, set `SCHEDULER_ENABLED=false` before `npm run dev`; otherwise your laptop starts real portal logins and posts into dealers' chats. The seed (with or without `--reset`) now refuses any database that is not on this machine; do not override it with `SEED_ALLOW_REMOTE_RESET=1` against that `.env`. Never run a script with `--commit` "as a test": it acts on real dealers.

Then open:

- Admin: http://localhost:5173 - `admin@dealerkavach.local` / `Admin@12345`
- Client: http://localhost:5174 - `owner@<seeded-dealer-code>.test` / `password123`

For the mobile app (`mdg-admin-app` is the same):

```bash
cd mdg-app
npm install
npx expo start
```

## Architecture at a glance

- One Express server handles REST + Socket.IO on the same port.
- MongoDB Atlas (or any Mongo 7+) is the datastore; node-cron drives recurring service runs.
- S3 backs all file uploads (chat attachments + service-run artifacts), accessed via presigned URLs.
- Auth is JWT (HS256) with three roles: `admin`, `dealer-owner`, `dealer-staff`, plus a super-admin flag on admins. Admin tokens last 12h and dealer tokens a year; a token more than an hour old is replaced in the `X-Refreshed-Token` response header.
- The scheduler runs nine service plugins. Several of them drive IndianOil's SDMS and IRAS portals in a headless Chromium, one browser at a time.
- The dealer app is one WhatsApp-style chat. Reports arrive in it as pictures and files, and MDG's requests to the dealer are asked and answered in it.
- An AI first line answers dealer questions in the chat. When it cannot, it opens a ticket and a person takes over.
- Admin alerts (a portal login refused, a chat waiting, a report held) are pushed to every admin's phone.
- The admin portal has a 3-pane inbox where any admin can pick up a dealer's message, reply, and resolve.
- The mobile apps are Expo WebView shells around `mdg-client` and `mdg-admin`, with a native push-token bridge.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - what runs where and how the parts fit
- [LIMITATIONS.md](./LIMITATIONS.md) - known weak spots and deliberate deferrals
- [docs/API_CONTRACT.md](./docs/API_CONTRACT.md)
- [docs/ADDING_A_SERVICE.md](./docs/ADDING_A_SERVICE.md)
- [docs/STYLE_GUIDE_V2.md](./docs/STYLE_GUIDE_V2.md)
- [docs/ASSIST_RUNBOOK.md](./docs/ASSIST_RUNBOOK.md) - turning on and running the landing assistant
- [docs/ADR/](./docs/ADR/) - decisions 0001 to 0021; start at [docs/ADR/README.md](./docs/ADR/README.md)
- [mdg-backend/README.md → Deploy](mdg-backend/README.md#deploy) - how the backend ships
