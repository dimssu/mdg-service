# Known Limitations

Known limits of the system as it runs today, each with what would change it.

## Production hardening

- **JWT secret length floor.** `mdg-backend/src/config/env.ts` accepts ≥16-char secrets. Production should require ≥32 chars (256 bits for HS256). Trivial follow-up: bump the Zod `.min(16)` to `.min(32)` and condition on `NODE_ENV === 'production'` if dev ergonomics matter.
- **Per-cluster login rate limiting.** `express-rate-limit` (`mdg-backend/src/middleware/rateLimit.ts`) uses its default in-memory store, so each backend process counts on its own (the credential-reveal limiter in the same file is in-memory too). Behind multiple replicas the cap would scale with the replica count, and an attacker's attempts with it. Swap to `rate-limit-redis` (or similar) if the backend is ever run as more than one process. The single-process setup is unaffected.
- **CORS allowlist visibility.** The resolved `CORS_ORIGINS_LIST` is never logged; `mdg-backend/src/app.ts` reads it only inside the origin check. A typo in `CORS_ORIGINS` therefore shows up as a browser CORS error, not as a line at boot. Log the list at `info` level on start-up so operators can spot it.
- **The backend sends no Content-Security-Policy.** `helmet` is configured with `contentSecurityPolicy: false` in `mdg-backend/src/app.ts`. That is fine for a pure JSON API. If the backend ever serves an HTML page, add a policy first.
- **The log redaction list is hand-kept.** `mdg-backend/src/config/logger.ts` lists the pino paths that are censored: the authorization header, password fields, the encrypted portal passwords, the ElevenLabs and Vertex keys and the mobile numbers the landing assistant collects. The database password is cut from the URI on connect. A new field that holds a secret or a person's number (a bank account number on a dealer, say) is logged in clear until its path is added to that list. Add it in the same change that adds the field.

## Scheduler

- **Single-instance scheduler.** `mdg-backend/src/scheduler/index.ts` uses node-cron and claims jobs with a Mongo `findOneAndUpdate`. ADR 0003 already calls this out: BullMQ + Redis is the path when running >1 backend replica.
- **A run only leaves `RUNNING` from inside the process that started it.** An
  OOM kill, a deploy or a pm2 restart mid-capture therefore stranded the row for
  ever: production was carrying four, the oldest ten days old and still drawing a
  live spinner in the admin. `lib/runs/reapStaleRuns.ts` now closes them out on
  every scheduler tick, at the scheduler's own lease horizon — past which the tick
  had already decided nobody was running the row. It cannot reap a healthy run
  into a wrong outcome permanently: `executeRun` writes the real status
  unconditionally when the run ends, so the worst case is a label that is briefly
  wrong instead of one that is wrong for ever. It reaps only the row, never the
  attachment's `nextRunAt` — the lease expiry already owns that.

- **`startScheduler()` starts in every process unless `SCHEDULER_ENABLED=false`, and there is no leader election.** A second backend instance is therefore a second scheduler: duplicate cadence runs, and two simultaneous logins into the same dealer portal accounts. `ecosystem.config.cjs` pins `instances: 1` for this reason — do not raise it, and do not start a second pm2 app by hand. `SCHEDULER_ENABLED` defaults to true; a laptop whose `.env` points at the production database must set it to false, or `npm run dev` runs real jobs against live dealers.

## Portal scraping (SDMS / IRAS)

These services drive a real, credentialed browser session against IndianOil's
portals on a dealer's own account. That makes their failure modes unusual, and
worth stating plainly.

- **The upstream portal is the dominant source of failure.** Over a 51-run
  sample in August 2026 the Credit & DOD service was 74% successful. The single largest cause
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
  later). It is HTTP/1.1 and TLS 1.2 only, and advertises no ALPN. Until
  2026-09-03 the very first `page.goto` of a capture had no retry at all, so ONE
  such refusal ended a whole run: 19 runs across all nine dealers and every hour
  of the day, 14 of them `ERR_CONNECTION_REFUSED` and 5 `ERR_CONNECTION_RESET`,
  each dying 7-9 seconds in having submitted nothing. `automation/openLoginPage.ts`
  now retries that navigation up to three times. It is deliberately the ONLY
  place in the login that retries on its own: everything past it has already
  spent a credential attempt, which is the thing a dealer's account cannot
  afford to repeat.

- **A SweetAlert modal blocks every click behind it, and Playwright reports that
  as a timeout on the button.** Both portals refuse through `swal2`, whose
  backdrop covers the page; a click aimed at the control underneath fails with
  `<div class="swal2-container …"> intercepts pointer events` buried inside an
  ordinary `locator.click: Timeout … exceeded`. This produced the single largest
  failure cluster of 2026-08: 25 tt-density runs, all ≈22 seconds, all reported
  as `FETCH_FAILED` — _"the portal did not answer when Fetch was pressed"_ —
  when the portal had in fact answered `Error / No data found`, because the
  dealer had taken no tanker that week. Typing the window into the date filter
  fires the screen's own query, and its answer is the modal. **Dismiss the modal
  immediately before any click that matters, not only after one**, and read it
  first: on this portal the popup is frequently the answer, not an obstacle.
- **Concurrency must be keyed on the portal USERNAME, not the dealer.** Several
  dealer records legitimately share one IndianOil login, and two live sessions on
  one login fight each other. `automation/sdms/accountGate.ts` serialises by
  username and enforces a quiet gap plus a circuit breaker. That state is
  **in-process** — authoritative only while the backend is a single pm2 app. The
  backfill/capture CLIs are separate processes and bypass it entirely.
- **Browser runs are one at a time, so a queue at busy hours is normal.**
  `BROWSER_MAX_CONCURRENCY` defaults to 1 and is one counter for every Chromium
  in the process: SDMS captures, IRAS collections and report-card renders share
  it (`automation/browserBudget.ts`). A run that finds the slot taken waits; an
  admin pressing Share gives up after `BROWSER_SLOT_WAIT_MS` (45 s) with "busy,
  try again". Raising the number is a memory decision for the box, not a speed
  switch. A CLI run by hand over SSH launches its own browser and the counter
  cannot see it.
- **Every login attempt is a real credential submission** against a dealer's
  account. `SDMS_CAPTCHA_MAX_ATTEMPTS` is a lockout budget as much as a retry
  budget, and the account breaker exists to stop a bad password being walked into
  a lockout unattended. Since 2026-10-11 a refused or missing SDMS password also
  puts the outlet on **hold** (`automation/sdms/credentialHold.ts`): the
  scheduler starts no SDMS run for it and looks again every 15 minutes
  (`CREDENTIAL_HOLD_RECHECK_MS`). The hold lifts when a new password is saved,
  or when a login with the saved pair works. A refusal holds the outlet only when
  the portal's words blame the account (the password, the username or a lock); a
  vague "Authentication failed" does not. A manual run on a refused outlet fails
  at once as `SDMS_PASSWORD_REFUSED` and sends nothing. It covers the five SDMS
  services; IRAS has its own login and its own saved pair.
- **SDMS replaced its image captcha with an arithmetic question**, labelled
  "Security Verification \*" and answered in a box placeholdered "Enter answer to
  math question". The runner reads the question from the DOM and solves it
  (`automation/sdms/mathChallenge.ts`), so the common path now needs no OCR at
  all; the sidecar is only the fallback for a question served as a picture. Three
  things follow, and none of them are fixed:
  - ~~**We have never seen the new page's markup.**~~ We have now: the archived
    failure dumps from 2026-08-11 and a live read the next day. Every selector
    for it is still a ladder, with the old, verified rungs kept at the bottom for
    a portal mid-rollout. If none of the rungs match, the run fails as
    `LOGIN_CHALLENGE_NOT_FOUND` — which means "the login form changed", not "the
    captcha was hard", and needs a code change rather than a retry.
  - **The image fallback cannot read most operators.** The OCR sidecar's `alnum`
    charset keeps letters and digits and discards the rest, so `+ - * × ÷` are
    gone by the time we see the text; only `x` and the worded operators
    ("divided by") survive. We refuse to guess a missing operator, so a symbolic
    question rendered as an image fails rather than submitting a number.
  - **A re-issued question that is arithmetically identical is invisible to us.**
    The "has the portal swapped the challenge?" check compares the question text,
    where it used to compare image bytes.
- **SDMS rebuilt the whole login page as "e-Mitra" on 2026-08-11**, between a run
  that succeeded at 04:17 UTC and one that failed at 12:45 UTC, and every
  scheduled and manual run failed for the ~33 hours after that. It is worth being
  precise about what broke, because the page still loaded perfectly:
  `placeholder="Enter username"` became `"Enter 6-digit RO SAP Code"`, the runner
  waited 20s for the old one, and reported `LOGIN_PAGE_UNREACHABLE` — "the portal
  is down" — for a field that was on the page the whole time. The dealer-type
  radios (`Retail` / `LPG` / `1906 helpline`) were deleted outright, the title
  became `e-Mitra`, and the Sign in button lost its `btn-ioc` class. What did NOT
  change, in either generation, is the Angular `formcontrolname` on every field,
  which is why the selectors now lead with it.
  - **A cosmetic portal change presents as an outage, and the failure code lies
    about which.** `LOGIN_PAGE_UNREACHABLE` is reported for both "the portal did
    not answer" and "the portal answered with a page we no longer recognise", and
    only the archived HTML tells them apart. Check the diagnostics bundle before
    believing the code.
  - **The login-page fingerprint has to be maintained alongside the selectors.**
    `portalResponse.ts` recognises a mid-run session bounce by matching login-page
    strings, and the redesign deleted all three it was matching on — so for those
    33 hours a bounce back to the login page would have been classified `ok` and
    handed to the parser. That failure is silent, unlike the one that was
    actually reported, and on the PAD statement it produces a wrong report rather
    than a failed run. **Any future login-page change must update both.**
  - **The suite was green throughout.** `__testing__/mockPortal.ts` served — and
    only served — the old shape, so nothing in CI could have caught this. It now
    serves both generations and defaults to the current one.
- **SDMS moved to a new address on 2026-10-10, and the old one only redirects.**
  IndianOil moved the portal from `sdms.indianoil.in` to `utkarsh.indianoil.co.in`,
  with a maintenance page standing in for the login from 20:21 IST on 10 Oct to
  about 02:17 on 11 Oct (74 runs reported it as "the portal may be down"). The
  old host now answers every path with a 302. A browser follows that without
  comment, but a 302 turns a POST into a body-less GET, and that is what broke
  Credit & DOD: its PAD statement request went to the old host as an empty GET
  and failed `RETRIVEDATA_EMPTY` on 8 runs over 10-11 Oct. Production sets no
  `SDMS_LOGIN_URL`, so the code default in `config/env.ts` is the truth, and it
  now names the new host. Every later SDMS URL is built from the origin the
  session actually landed on (`automation/sdms/portalOrigin.ts`); there is no
  baked-in fallback host. From 03:00 to 03:04 IST on 11 Oct the old host did not
  even redirect. It served a 200 "Page Moved" stub, and six RO Supply rides took
  it for the dashboard.
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
- **A transient failure is silent until its retries run out.** Admin alerts
  (ADR 0016) raise one alert per problem for a failed, late or stopped service
  and for a refused or missing portal password, and push it to every admin's
  phone and the Alerts page. A failure that is still inside its retries raises
  nothing, by design: it may fix itself, and an alert for each would drown the
  ones that matter. The 13 failures above predate the alerts; they went unnoticed
  until a user reported one.
- **Deploy provisions neither Playwright's Chromium nor the OCR venv.**
  `deploy.sh` is `git pull` → `npm ci` → `build` → `pm2 restart`; the browser and
  `ocr/.venv` must be installed on the box by hand (`npx playwright install
chromium`, `bash ocr/setup.sh`). `BROWSER_LAUNCH_FAILED` and
  `OCR_SIDECAR_UNAVAILABLE` are what you see when they are missing.

## Frontend

- **The admin has no test runner and nothing tests it end to end.** `mdg-client` runs Vitest (`npm test`). `mdg-admin` has no `test` script; the few decisions kept as pure logic are checked with `npx tsx --test scripts/*.check.ts`. Nothing drives a browser through login → attach service → run now → run visible in history; a Playwright happy path would be the starter set. The REST collection at `docs/rest.http` and the smoke checklist at `docs/TEST_PLAN.md` cover it by hand.
- **The admin topbar search is a disabled placeholder.** The box in `mdg-admin` reads "Search (coming soon)". The backend has no multi-entity search endpoint yet. Wire it up when the API gains a `/search` route.
- **No dark-mode toggle UI in either app.** The tokens and `darkMode: 'class'` are wired, but nothing sets the `dark` class. The dealer chat is light-only by design (ADR 0018). For the admin, add a switch to the topbar that toggles `document.documentElement.classList`.

## Dealer lifecycle

- **`DELETE /dealers/:id` archives; nothing in `dealers.ts` deletes a dealer for good.** It is super-admin only. The dealer goes to `SUSPENDED` with `archivedAt` set, every attached service that was `ACTIVE` is `PAUSED` with its next run cleared (so no portal login fires on the dealer's credentials), and the dealer's runs, chat threads and audit trail stay. `POST /dealers/:id/restore` brings the dealer back to the roster, but status stays `SUSPENDED` and the services stay `PAUSED`: a restore never restarts portal automation by itself, a super-admin switches each service back on. There is no purge route; removing a dealer's data for good would take a script written for the day it is asked for.

## Admin management

- **There are two admin tiers, and everything outside the super-admin list is flat.** A `User.isSuperAdmin` flag gates, in `mdg-backend/src/routes/v1`: the Activity (audit) log, team management (`/admins`), the All Users page, the AI Answers review, the landing assistant's admin, bank and depot holidays, document kinds, the Kavach catalog, the festival band, films, website intake, WhatsApp replies, the system-health card on Today, staff work items, and archiving and restoring dealers. Every other admin screen (dealers, services, Kavach, chat, and so on) is open to every admin. Super-admins are provisioned on boot from `SUPER_ADMIN_EMAILS` (default `aryan@mdgservices.in`), re-derived from the DB on every request, and can now be granted or revoked from the All Users page (`superAdminUsers.ts`). You cannot remove your own super-admin access or the last super-admin's. Team management is bootstrap-safe (any admin may act until the first super-admin exists, to avoid a lock-out). Legacy `Admin`-store admins (`models/Admin.ts` still exists) can't be super-admins, because the flag lives on the `User` store. Self-suspension and suspending the last active admin are blocked, and every admin create/update writes an audit entry.
- **Admin suspension revokes on next request, not instantly across sockets.** `requireAuth` now re-checks admin status on every REST request, so a suspended admin is blocked immediately from all actions. Their existing Socket.IO connection (realtime inbox updates only — no mutations) is not torn down until it reconnects; add an admin `sessionId`/disconnect sweep if instant socket revocation is required.

## Chat / ticket lifecycle & reply SLA

- **Reopen abandons continuity by design.** When a resolved client messages again, the thread reopens as a fresh **UNASSIGNED** ticket (`messages.ts` clears `assignedAdminId`), and `resolve` clears the owner too. This favours fair distribution over "the same admin keeps handling you." If continuity is wanted later, keep `assignedAdminId` on resolve and reopen to `ASSIGNED` for that admin.
- **Reply-SLA clock is wall-clock, not business hours.** The auto-unassign window (`TICKET_AUTO_UNASSIGN_MINUTES`, default 20) and the flag-colour thresholds (`TICKET_FLAG_WARN_MINUTES` = 90, `TICKET_FLAG_URGENT_MINUTES` = 180, in `shared/src/types/conversation.ts`) count real minutes since the client's oldest unanswered message. There is no "pause overnight / weekends" concept yet; add a business-calendar gate to the sweep + `ticketFlagLevel` if support isn't 24/7.
- **Auto-unassign fires on the assignee's grace window.** The sweep only returns a ticket to the pool when BOTH the client's message (`awaitingSince`) and the pickup (`assignedAt`) are older than the window, so freshly picked-up-but-stale tickets aren't yanked instantly. The claim is an atomic `findOneAndUpdate`, so running the sweep on multiple replicas is safe (each ticket is processed once).
- **Flag colour is derived, not stored.** `awaitingReplySince` is persisted; the yellow/red level is computed live client-side via `ticketFlagLevel(now)` and re-evaluated on a 60s tick, so colours advance without a server round-trip. Only the auto-return `flagged` boolean is persisted (accountability marker; cleared on next pickup/reply/resolve).
- **Any dealer message reopens a resolved thread — even "ok, thanks".** Per `docs/PRD.md` open question: a trivial acknowledgement reopens a full ticket. A grace/auto-close window or a "no reply needed" close is the eventual answer; not yet built.
- **Conversation lists still cap at 100 with no load-more.** The badge counts are now exact via `GET /conversations/counts` (`countDocuments`), but the list bodies request `limit:100` and have no cursor pagination, so a tab with >100 items hides the oldest. The backend `before` cursor exists; wire an infinite-scroll trigger (esp. for Resolved) when volume grows.
- **"Take over" has no admin picker.** The Inbox's Pick up and Take over buttons both give the thread to the admin who presses them. `POST /conversations/:id/assign` accepts an `adminId`, but the admin screen never sends one. Assignment changes are write-audited (`CONVERSATION_ASSIGNED` / `CONVERSATION_REASSIGNED`); a picker and a takeover notification to the previous owner are still pending.
- **An AI-raised Ticket is a separate record from the conversation's status (ADR 0017).** The AI opens one when it cannot settle a dealer's question. There is at most one open per thread; a second escalation is appended to it. Only an admin closes it, with a written note: no reply, later AI answer, dealer message or sweep does. The reply clock above does not track them: an admin reply stops the clock but leaves the Ticket open.
- **Legacy `userId`-less "reunite" branch retained.** `GET /conversations/mine` still adopts a pre-per-member thread for an owner on first load. Dead-ish now that the schema requires `userId`; delete after confirming production has no such rows.

## Audit logging

See ADR 0020 and `docs/specs/audit-logging.md`. The trail records who did what, when, and
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
- **Sensitive-read logging is selective.** Only file downloads (`ARTIFACT_DOWNLOAD` for run
  files; `ATTACHMENT_DOWNLOAD` for staff hardcopy photos and chat attachments saved on
  purpose) and credential reveals (`IRAS_CREDENTIALS_REVEAL`, `SDMS_CREDENTIALS_REVEAL`) log
  data access; ordinary list/detail reads are not logged (by design, to keep the trail
  signal-rich). `RECORD_VIEWED` is no longer written: the Records shelf it audited is gone
  (ADR 0018), and the value stays only so old rows still read. Push-token register/unregister
  churn is intentionally not audited.
- **No audit for the audit reads.** Viewing the Activity page / `GET /audit` is itself not
  audited; add a meta-audit if "who looked at the logs" must be tracked.

## Plugin SDK

- **Plugins live in-repo only.** No mechanism for uploading or hot-reloading plugins from outside `mdg-backend/src/services/`. The registry reads that folder once at boot, so a new plugin needs a deploy. ADR 0002 calls this an explicit MVP constraint. See `docs/ADDING_A_SERVICE.md`.

## Tooling

- **Husky `prepare` script silently no-ops without `.git`.** Intentional so npm-installs inside Docker / CI don't fail.
- **Watchman warning** ("Recrawled this watch...") can appear on macOS during `jest`. Harmless; clear by running `watchman watch-del <path>; watchman watch-project <path>`.
