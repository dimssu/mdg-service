# ADR 0021 — Many repos, and four copies of `@dk/shared`

Status: accepted. The decision was taken and in force on 2026-05-26; written down on 2026-10-15.
**Supersedes ADR 0001.**

## What forced this

ADR 0001 put the API, the admin and the shared types package in one repo, with `@dk/shared` read
straight from source. That held for 13 days. The three pieces that use `@dk/shared` are built
somewhere that has no neighbouring folder to read from:

| Piece                     | Where it builds                                                        |
| ------------------------- | ---------------------------------------------------------------------- |
| `mdg-backend`             | on the AWS box, by `deploy.sh`, under pm2 (a `Dockerfile` also exists) |
| `mdg-admin`, `mdg-client` | on Vercel, from the app's own folder                                   |

A build that needs `../shared` next to it fails on both of those hosts. The three vendoring
commits of 26 May 2026 give the same reason: copy `shared/` into the repo "so the build is standalone
(no parent monorepo required)".

## Decision

### 1. One meta repo, seven app and site repos

The workspace folder (`mdg-service`, remote `org`) is a **meta repo**. It tracks `shared/` (the
canonical copy), `docs/`, `scripts/`, `mdg-demo/`, and the root config. It does not track the apps.
Its `.gitignore` lists six of the seven; `vruoom-landing/` is not listed yet and shows as untracked.
Each app is a separate git repo under `github.com/mdg-services`, with its own history, remote and
deploy.

| Repo             | What it is                                           | First commit |
| ---------------- | ---------------------------------------------------- | ------------ |
| `mdg-backend`    | the API (Express, MongoDB, Socket.IO, the scheduler) | 2026-05-26   |
| `mdg-admin`      | the admin web app                                    | 2026-05-26   |
| `mdg-client`     | the dealer web app                                   | 2026-05-26   |
| `mdg-app`        | Expo WebView shell around `mdg-client`               | 2026-05-26   |
| `mdg-landing`    | the mdgservices.in site                              | 2026-05-26   |
| `mdg-admin-app`  | Expo WebView shell around `mdg-admin`                | 2026-07-11   |
| `vruoom-landing` | the vruoom.com company site                          | 2026-08-21   |

`backend/` became `mdg-backend` and `frontend/` became `mdg-admin`. The meta repo's commit "split
monorepo into per-service repositories" (26 May) names four of them: `mdg-backend`, `mdg-admin`,
`mdg-client` and `mdg-app`. `mdg-landing` also began that day but the meta repo only started ignoring
it on 2026-07-23; the other two joined later. `scripts/clone-services.sh` still clones only the four
named in that commit.

The root `package.json` still lists `shared`, `mdg-backend`, `mdg-admin` and `mdg-client` as npm
workspaces. That serves local dev (`npm run dev`), lint and the root CI. It is not how any app is
built for release.

### 2. `@dk/shared` exists as four byte-identical copies

| Copy                                    | Used by                                     |
| --------------------------------------- | ------------------------------------------- |
| `shared/` (canonical, in the meta repo) | the root workspace; the backend's jest runs |
| `mdg-backend/shared/`                   | the API, built and run                      |
| `mdg-admin/shared/`                     | the admin                                   |
| `mdg-client/shared/`                    | the dealer app                              |

Each app depends on its own copy (`"@dk/shared": "file:./shared"`), and the Vite aliases in the admin
and the dealer app point at `./shared/src`. The copy is committed inside the app's repo (`src/`,
`package.json`, `tsconfig.json`; `dist/` is built, not committed). `mdg-app`, `mdg-admin-app`,
`mdg-landing` and `vruoom-landing` do not use it.

### 3. The rule: mirror and check on every change

1. Edit the canonical `shared/src/...` only.
2. Copy each changed file to the same path in the other three. A new file is created in all four; a
   deleted file is deleted from all four.
3. Check that all four are the same. From the meta repo root:

   ```
   for d in shared mdg-backend/shared mdg-admin/shared mdg-client/shared; do
     (cd $d && find src -type f | sort | xargs md5 -q | md5 -q)
   done
   ```

   Four equal lines mean the copies match. Two different lines mean one copy has drifted. (`md5 -q`
   is the macOS command; on Linux use `md5sum`.)

4. Commit the canonical change in the meta repo, then **run the check again**. The meta repo's
   pre-commit hook runs `prettier --write` and `eslint --fix` on staged files, so a commit can
   reformat `shared/` after the check passed. If it did, copy the reformatted files back over the
   other three.
5. Commit each mirrored copy in its own repo. `git status` at the meta root shows only the canonical
   copy; the other three show in `mdg-backend`, `mdg-admin` and `mdg-client`.

Nothing enforces this. The root CI does not compare the copies, and `mdg-backend`, `mdg-admin` and
`mdg-client` have no CI of their own.

## Consequences

- **Pro:** each app builds from its own checkout with nothing beside it: on the box, on Vercel, in
  Docker.
- **Con: editing only the canonical copy changes nothing in production.** The apps import their own
  copy, so a type or schema change that skips the mirror does not ship, or ships half of a change.
- **Con: the backend's tests read a different copy from the one it runs.** `mdg-backend/jest.config.cjs`
  maps `@dk/shared` to `<rootDir>/../shared/src` (the canonical copy); `tsc` and the running API use
  `mdg-backend/shared`. While the copies match, no one notices. When they drift, suites fail for a
  reason that is not the change under test, or pass against code production does not run.
- **Con: the API runs the compiled copy.** `npm run build` in `mdg-backend` compiles
  `shared/tsconfig.json` into `mdg-backend/shared/dist` as well as the app. An off-box deploy has to
  ship `shared/dist/` alongside `dist/`.
- **Con: a shared change touches up to four repos.** Four commits, in an order (meta repo first), for
  one edit. ADR 0001 rejected separate repos because every shared change would be "a 3-PR
  ceremony"; this is the same ceremony, done by hand.
- Not recorded anywhere: whether a private package registry or a git submodule was weighed against
  vendoring. The commit messages give only the standalone-build reason above.
