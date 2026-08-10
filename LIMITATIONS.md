# Known Limitations

These are deliberate deferrals out of the MVP. Each is small enough to schedule
as a follow-up; none block the happy path.

## Production hardening

- **JWT secret length floor.** `backend/src/config/env.ts` accepts ≥16-char secrets. Production should require ≥32 chars (256 bits for HS256). Trivial follow-up: bump the Zod `.min(16)` to `.min(32)` and condition on `NODE_ENV === 'production'` if dev ergonomics matter.
- **Per-cluster login rate limiting.** `express-rate-limit` defaults to an in-memory store. Behind multiple replicas, swap to `rate-limit-redis` so the cap is enforced across the cluster. See `docs/REVIEW.md` SEC-004.
- **CORS allowlist visibility.** Log the resolved `CORS_ORIGINS_LIST` at boot at `info` level so operators can spot typos quickly. See SEC-003.

## Scheduler

- **Single-instance scheduler.** `backend/src/scheduler/index.ts` uses node-cron and claims jobs with a Mongo `findOneAndUpdate`. ADR 0003 already calls this out: BullMQ + Redis is the path when running >1 backend replica.
- **`startScheduler()` runs unconditionally in every process, with no leader election.** A second backend instance is therefore a second scheduler: duplicate cadence runs, and two simultaneous logins into the same dealer portal accounts. `ecosystem.config.cjs` pins `instances: 1` for this reason — do not raise it, and do not start a second pm2 app by hand.

## Portal scraping (SDMS / IRAS)

These services drive a real, credentialed browser session against IndianOil's
portals on a dealer's own account. That makes their failure modes unusual, and
worth stating plainly.

- **The upstream portal is the dominant source of failure.** Over a recent 51-run
  sample the Credit & DOD service was 74% successful. The single largest cause
  (8 of 13 failures) was the SDMS → `ioconline` eledger SSO handoff answering
  with the eledger app's own error page — an HTTP 404 whose body is the 84-byte
  string `/ioconline/com/error1.jsp`. The eledger app is load-balanced across at
  least four pods behind an F5 whose `/ioconline` persistence cookie is separate
  from the `/sdmspro` one, and only the FIRST `/ioconline` request of a session
  is exposed. It is transient: the runner now retries the handoff in-session with
  a freshly scraped link, and a transient failure re-arms a deferred retry
  20-40 minutes out instead of losing the day.
- **There is no way to end a portal session early.** sdmspro authenticates with a
  bearer token in `localStorage`, not a server-side session, and its sign-out is
  an in-app Angular action with no URL — `/sdmspro/auth/logout` returns the same
  743-byte SPA shell as any nonsense path. The one real server-side session
  belongs to the separate `ioconline` app and has no exposed sign-out, so it
  expires on its own. Do not add a "log out" navigation; it releases nothing.
- **The portal's front end intermittently resets TCP connections** (observed
  directly: `ERR_CONNECTION_RESET` from Chromium while `curl` succeeded seconds
  later). It is HTTP/1.1 and TLS 1.2 only, and advertises no ALPN.
- **Concurrency must be keyed on the portal USERNAME, not the dealer.** Several
  dealer records legitimately share one IndianOil login, and two live sessions on
  one login fight each other. `automation/sdms/accountGate.ts` serialises by
  username and enforces a quiet gap plus a circuit breaker. That state is
  **in-process** — authoritative only while the backend is a single pm2 app. The
  backfill/capture CLIs are separate processes and bypass it entirely.
- **Every login attempt is a real credential submission** against a dealer's
  account. `SDMS_CAPTCHA_MAX_ATTEMPTS` is a lockout budget as much as a retry
  budget, and the account breaker exists to stop a bad password being walked into
  a lockout unattended.
- **SDMS replaced its image captcha with an arithmetic question**, labelled
  "Security Verification \*" and answered in a box placeholdered "Enter answer to
  math question". The runner reads the question from the DOM and solves it
  (`automation/sdms/mathChallenge.ts`), so the common path now needs no OCR at
  all; the sidecar is only the fallback for a question served as a picture. Three
  things follow, and none of them are fixed:
  - **We have never seen the new page's markup.** Every selector for it is a
    ladder of guesses with the old, verified ones kept at the bottom. If none of
    the rungs match, the run fails as `LOGIN_CHALLENGE_NOT_FOUND` — which means
    "the login form changed", not "the captcha was hard", and needs a code change
    rather than a retry.
  - **The image fallback cannot read most operators.** The OCR sidecar's `alnum`
    charset keeps letters and digits and discards the rest, so `+ - * × ÷` are
    gone by the time we see the text; only `x` and the worded operators
    ("divided by") survive. We refuse to guess a missing operator, so a symbolic
    question rendered as an image fails rather than submitting a number.
  - **A re-issued question that is arithmetically identical is invisible to us.**
    The "has the portal swapped the challenge?" check compares the question text,
    where it used to compare image bytes.
- **The login session is paced, not disguised.** It types at a human speed, moves
  the pointer before clicking, waits ~2.5-5s between attempts
  (`SDMS_ATTEMPT_PAUSE_*_MS`), and presents a desktop Chrome user agent derived
  from the Chromium actually running rather than announcing `HeadlessChrome`.
  That is the whole of it: no fingerprint spoofing, no proxy rotation, nothing
  that misrepresents who is logging in. If IndianOil decides to block automated
  logins outright, this does not — and is not meant to — get around that.
- **Diagnostic artifacts are unredacted and never expire.** A failure writes a
  full-page screenshot plus the complete DOM, which for the Credit Monitoring and
  PAD phases is the dealer's credit position. They are super-admin-only, but
  there is no retention policy and no scrubbing.
- **`SDMS_CAPTCHA_ENGINE` is a dead knob.** It is declared and validated in
  `config/env.ts` but read nowhere; the OCR sidecar is always used. It looks like
  a kill switch and is not one.
- **The "credit locked" verdict has never been seen against a locked dealer.**
  A Credit Monitoring page whose Next Review Date has passed means the dealer's
  credit line is shut and every purchase is cash and carry until their sales
  officer reopens it — and the card, the chat message, the push and the admin
  report now all say so. Every page captured so far carries a review date years
  out (`31-Mar-2027`), so three things are asserted rather than observed: that a
  lapsed account still publishes the old date rather than blanking the cell; that
  it keeps its `dd-MMM-yyyy` form there (that and `dd-mm-yyyy` both parse,
  anything else fails silent and is logged); and that the portal reflects a
  completed review the same day. If it turns out to lag one — the way it lags a
  deposit by a day or two — this needs its own grace band like
  `overdue.withinPortalLag`, or a dealer whose review was renewed this morning is
  told they are shut. Unlike an overdue flag, a false lock cannot correct itself
  on the next run: it sends the dealer to their sales officer over nothing. The
  CONSEQUENCE itself (locked → cash and carry → sales officer) is operator domain
  knowledge; the portal publishes only the date.
- **A back-dated report says nothing about the credit review, by design.** The
  Credit Monitoring page reports only the position today and the portal keeps no
  history of that date, so an "as of" reconstruction cannot know whether the
  limit was live then — the same reason it is not cross-checked against that
  page's Current Total Receivable. Reports captured before this shipped are blank
  for a related reason: nothing was stored to re-derive a verdict from, and blank
  is more honest than an invented all-clear.
- **Nothing alerts a human when a run fails.** Failures land in a pm2 log and the
  admin run history. The 13 failures above went unnoticed until a user reported
  one.
- **Deploy provisions neither Playwright's Chromium nor the OCR venv.**
  `deploy.sh` is `git pull` → `npm ci` → `build` → `pm2 restart`; the browser and
  `ocr/.venv` must be installed on the box by hand (`npx playwright install
chromium`, `bash ocr/setup.sh`). `BROWSER_LAUNCH_FAILED` and
  `OCR_SIDECAR_UNAVAILABLE` are what you see when they are missing.

## Frontend

- **No frontend test suite.** Out of MVP scope per the QA brief. Recommended starter set: Playwright happy-path covering login → attach service → run-now → run visible in history. The REST collection at `docs/rest.http` and the smoke checklist at `docs/TEST_PLAN.md` already cover this manually.
- **Topbar search is a disabled placeholder.** Backend has no multi-entity search endpoint yet. Wire it up when the API gains a `/search` route.
- **No dark-mode toggle UI.** Tokens are wired and `darkMode: 'class'` works — only the toggle is missing. Add a switch to the topbar that toggles `document.documentElement.classList`.
- **Frontend bundle is single chunk (~681 KB / ~212 KB gzip).** Vite warns at the 500 KB threshold. Code-split per route via `React.lazy` when the bundle grows further.

## Dealer lifecycle

- **`DELETE /dealers/:id` is a hard delete with DealerService cascade.** Brief mentioned an optional `SUSPENDED` soft-delete path; the API contract was followed instead (hard delete, retain ServiceRun history). If product wants soft delete, add a `SUSPENDED` status branch in `dealerService.ts` and switch the route.

## Admin management

- **Super-admin tier gates Activity + Team; the rest of the admin tier is still flat.** A `User.isSuperAdmin` flag now gates the Activity (audit) log and team management (`/admins`): only super-admins can view the audit trail or create/suspend/reset admins. Super-admins are provisioned on boot from `SUPER_ADMIN_EMAILS` (default `aryan@mdgservices.in`), re-derived from the DB on every request. Team management is bootstrap-safe (any admin may act until the first super-admin exists, to avoid a lock-out). Outside those two surfaces the admin tier remains flat — every admin can still manage dealers, services, Kavach, chat, etc. There is no UI to grant/revoke super-admin yet (env-driven only), and legacy `Admin`-store admins can't be super-admins (the flag lives on the `User` store). Self-suspension and suspending the last active admin are still blocked, and every admin create/update writes an audit entry.
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
