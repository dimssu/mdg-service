# UAT — Credit & DOD Monitoring (SDMS capture → review → share)

**Status:** v1 · **Owner:** UAT · **Last updated:** 2026-08-06
**Surface:** `mdg-admin` (ops portal, web) + `mdg-client` / `mdg-app` (dealer chat) ·
**Service:** `credit-dod-monitoring` (backend plugin)

This plan verifies the new **Credit & DOD Monitoring** service end to end: an admin
sets a dealer's IndianOil **SDMS** credentials, attaches the service, runs it, the
backend logs into SDMS (captcha solved by an OCR sidecar), reads the Credit
Monitoring page + PAD statement, computes the **DOD due amount / due date** by FIFO
ledger aging, stores a per-dealer **snapshot**, renders the bilingual **"CREDIT &
DOD MONITORING"** card, and the admin reviews it and presses **Share with dealer**
to post it into the dealer's chat. **Nothing is sent to the dealer automatically.**

Two later sections cover the ways this can hand a dealer a wrong or harmful
figure: **[Section E](#section-e--transactions-the-portal-publishes-late)** for
transactions IndianOil publishes days after they happen, and
**[Section F](#section-f--missed-deposit-deadlines-overdue)** for a dealer who
misses the deposit deadline — including how to produce a missed deadline on
demand instead of waiting for one.

It mirrors the structure of the other docs in `docs/uat/*`: every scenario names the
**persona**, **preconditions**, **numbered plain-language steps**, an **expected
result**, and a **PASS / FAIL** box. Where behaviour is grounded in code, the source
is cited as `file:line` for whoever wants to read along — the operator does not need
to touch it.

The second half of this document — **[Findings & gaps](#findings--gaps)** — is the
core deliverable: a code-grounded audit of whether a **non-technical operator can
tell, from the admin UI alone, WHERE and WHY a run failed and what to do next.** The
short answer is **not yet** — see the P0/P1 items.

---

## How to run (preamble)

```bash
# From the mdg-service workspace root:
nvm use                       # Node 20 (.nvmrc)
npm install                   # npm workspaces resolves @dk/shared

# Backend env: MongoDB, JWT, S3/MinIO, CORS, AND the SDMS-specific vars:
#   SDMS_LOGIN_URL, SDMS_OCR_PYTHON, SDMS_OCR_SCRIPT, SDMS_CAPTCHA_MAX_ATTEMPTS
cp mdg-backend/.env.example mdg-backend/.env    # then edit

# Server prerequisites for THIS service (see the plugin README):
#   - Playwright Chromium:  npx playwright install chromium  (+ --with-deps on Linux)
#   - OCR sidecar venv:     mdg-backend/ocr/README.md
#   - A Devanagari font (e.g. fonts-noto) or the Hindi column renders as boxes.

npm run seed --workspace mdg-backend            # idempotent admin + sample dealers
npm run dev                                     # backend :4000, admin :5173, client :5174
```

Open:

- **Admin portal:** http://localhost:5173 — `admin@dealerkavach.local` / `Admin@12345`
- **Dealer client:** http://localhost:5174 — `owner@<code>.test` / `password123`

**Gate on the backend smoke check first:**
`bash mdg-backend/scripts/smoke.sh http://localhost:4000` (see `docs/UAT_PLAN.md`).

> **Live-portal warning.** A real run drives a headless Chromium into the _actual_
> IndianOil SDMS portal with the dealer's real credentials. For a non-production UAT
> without a valid SDMS account, you can only fully exercise the **failure** journeys
> (Section C) and the credential/UI surfaces. The **happy path (Section B)** requires
> a dealer whose SDMS creds are real and whose portal has a DOD ledger. There is a dev
> CLI to rehearse the capture off-band: `npm run automation:sdms -- --code 297282 [--headed]`
> writes the card + raw dumps under `./var/sdms/<timestamp>/` (README "Dev CLI").

---

## Where each surface lives (navigation map)

| Task                                         | Where in the admin                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Set / update / clear SDMS creds              | **Dealers → open a dealer → Info tab → "IndianOil SDMS (Credit & DOD)" card** (`DealerInfoTab.tsx:165` renders `SdmsCredentialsSection`)    |
| Attach the service, set cadence              | **Services tab** (`DealerServicesTab.tsx`)                                                                                                  |
| **Generate a report** (today or a past date) | **Credit & DOD tab → Generate card** (`DealerCreditDodTab.tsx`). Capped at 3 per dealer per hour; super-admins exempt.                      |
| Review the card, **Share with dealer**       | **Credit & DOD tab → Report history → expand a row** (`CreditDodReportCard`). Also reachable from Run history, which renders the same card. |
| The per-dealer "sheet" (snapshot history)    | **Credit & DOD tab → Report history**, directly above the maintained PAD ledger. API: `GET /credit-dod/dealers/:dealerId/snapshots`.        |
| Learn the feature                            | **"How this works"** button on the Credit & DOD tab → two Hindi admin videos on guide.mdgservices.in.                                       |

---

## Personas under test

| Persona | Role                      | Identity                                   | Surface              |
| ------- | ------------------------- | ------------------------------------------ | -------------------- |
| Arjun   | `admin` (regular ops)     | `admin@dealerkavach.local` / `Admin@12345` | mdg-admin (web)      |
| Ramesh  | `dealer-owner` (non-tech) | `owner@<code>.test` / `password123`        | mdg-client / mdg-app |

Arjun does everything in the admin. Ramesh only ever sees the **shared card land in
his chat** (Section B, step B-6). The "non-technical operator" whose experience this
plan audits **is Arjun** — an ops person, not an engineer.

---

## Failure-code reference (what each SDMS error _means_)

The runner raises a categorised `SdmsError` with one of these codes at a named phase
(`runner.ts:27-37`). This table is the **translation an operator needs but the UI
does not currently give them** (gap **G1/G2**). Keep it beside you while running
Section C.

| Code                        | Phase            | Plain meaning                                                                                                      | Operator action                                                                                                                                        |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BROWSER_LAUNCH_FAILED`     | launch           | Chromium didn't start on the server                                                                                | Server issue — call engineering (Playwright not installed)                                                                                             |
| `LOGIN_PAGE_UNREACHABLE`    | login            | SDMS login page didn't load                                                                                        | Retry later; if persistent, SDMS may be down                                                                                                           |
| `LOGIN_CAPTCHA_EXHAUSTED`   | login            | Couldn't sign in within N captcha attempts                                                                         | **Ambiguous today** — could be a wrong password, a hard captcha, _or_ the OCR sidecar missing (gap **G4**). Verify the password; then call engineering |
| `LOGIN_CHALLENGE_EXHAUSTED` | login            | SDMS asked its arithmetic "Security Verification" question, we answered it correctly N times, and it kept refusing | Retry — usually portal-side. The question we read and the answer we sent are in the run's attempt diagnostics                                          |
| `LOGIN_CHALLENGE_NOT_FOUND` | login            | The login page showed no security verification we could answer (no question, no captcha image, or nowhere to type) | **SDMS changed its login form** — do not retry, call engineering. The diagnostics carry what the page was showing                                      |
| `DASHBOARD_UNREACHABLE`     | dashboard        | Logged in but dashboard didn't load                                                                                | Retry                                                                                                                                                  |
| `ELEDGER_LINK_MISSING`      | dashboard        | Credit-monitoring / PAD menu links absent for this login                                                           | This SDMS account may not have DOD/eledger access — confirm dealer type / entitlements                                                                 |
| `CREDIT_MONITORING_FAILED`  | creditMonitoring | Credit page loaded but couldn't be parsed                                                                          | Open the failure screenshot; likely an SDMS layout change — call engineering                                                                           |
| `PAD_NAV_FAILED`            | padStatement     | PAD statement page didn't open                                                                                     | Retry                                                                                                                                                  |
| `RETRIVEDATA_HTTP`          | padStatement     | Ledger fetch returned a non-200                                                                                    | Retry; if persistent, SDMS-side                                                                                                                        |
| `RETRIVEDATA_EMPTY`         | padStatement     | Ledger returned zero rows for the window                                                                           | Widen `padLookbackDays`; or the dealer truly has no ledger activity                                                                                    |

On any of these, the runner also saves a **diagnostics bundle** — `fail_<phase>.png`
(full-page screenshot) + `fail_<phase>.html` (DOM) — as run artifacts
(`runner.ts:110-127`).

---

## Section A — Setup (credentials, attach, cadence)

### CD-A1 — Set SDMS credentials (Retail / LPG / 1906)

- **Persona:** Arjun · **Precondition:** an ACTIVE dealer exists; you are on its
  **Info** tab.
- **Steps:**
  1. Scroll to the **"IndianOil SDMS (Credit & DOD)"** card.
  2. If no creds are set, the form is shown directly; enter **Username** (the SDMS
     login, e.g. `0000297282_01`), **Password**, and pick a **Dealer type**
     (Retail / LPG / 1906).
  3. Press **Save credentials**.
- **Expected:** Toast **"SDMS credentials saved"**; the card collapses to a summary
  showing a green **"SDMS credentials set"**, the **username** (echoed), the **dealer
  type**, and a **Set** timestamp (`SdmsCredentialsSection.tsx:191-222`). The password
  is never echoed back — it is stored encrypted (`README.md` "Credentials";
  subtitle at `:109-113`).
- **Note the caveat:** the login flow currently always clicks the **Retail** tab and
  uses a single `SDMS_LOGIN_URL` regardless of the dealer type you pick
  (`credentials.ts:65`, `runner.ts:146`). Picking **LPG / 1906** is stored but not
  yet honoured — see gap **G7**.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-A2 — Update and Clear credentials

- **Persona:** Arjun · **Precondition:** creds are set (CD-A1).
- **Steps:**
  1. Press **Update** → the form reopens with **empty** username/password and the
     saved dealer type preselected (`SdmsCredentialsSection.tsx:226-238`). Change the
     password; **Save**.
  2. Press **Clear** → a browser `confirm()` warns _"Clear SDMS credentials? The
     service will stop running until new credentials are set."_ (`:86-88`). Confirm.
- **Expected:** Update → **"SDMS credentials saved"**. Clear → **"SDMS credentials
  cleared"**, the form returns to the empty state.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-A3 — Attach the service with a cadence

- **Persona:** Arjun · **Precondition:** on the **Services** tab.
- **Steps:**
  1. Press **Attach service**; pick **Credit & DOD Monitoring** from the catalog.
  2. Set **Cadence** = _Daily_ (or leave "Plugin default" — the plugin default is
     `DAILY`, `index.ts:38`). Leave **Custom cron** blank.
  3. In the generated **Config** form, optionally set `padLookbackDays` (default 60)
     and `reportCode` (defaults to the dealer code). Press **Attach**.
- **Expected:** Toast **"Service attached"**; a row **`credit-dod-monitoring`**
  appears with its cadence badge, ACTIVE status, and empty Last/Next run
  (`DealerServicesTab.tsx:146-179`).
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-A4 — "Stale" badge when a daily service hasn't run today

- **Persona:** Arjun · **Precondition:** service attached (CD-A3), no run yet today.
- **Steps:** Look at the `credit-dod-monitoring` row.
- **Expected:** A yellow **"stale"** badge with tooltip _"Hasn't run today — click Run
  now to refresh"_ is shown, because a DAILY service with no `lastRunAt` today is
  stale (`DealerServicesTab.tsx:58-64,151-165`). After a successful run it disappears.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## Section B — Happy path (run → review → share → dealer receives)

> Requires a dealer with **real, valid SDMS creds** and a live DOD ledger. Without
> one, skip to Section C and use the dev CLI to eyeball the card.

### CD-B1 — Run now and watch it reach SUCCESS

- **Persona:** Arjun · **Precondition:** creds set (CD-A1) + service attached (CD-A3).
- **Steps:**
  1. On the **Services** tab, press **Run now** on the `credit-dod-monitoring` row.
  2. Toast **"Run enqueued"** appears (`DealerServicesTab.tsx:69`).
  3. Switch to the **Run history** tab. A new row appears at the top,
     `credit-dod-monitoring`, status **RUNNING**.
  4. Click the row to open the **Run** dialog; leave it open. It polls while running
     (`RunsListInline.tsx:123` `pollWhileRunning: true`).
- **Expected:** The **Steps** timeline fills in live: `login → dashboard →
creditMonitoring → padStatement → computeDod → renderCard`, each turning green
  (`RunStepTimeline.tsx`). The dialog header shows `Run ########`. When done the
  status chip flips to **SUCCESS** and the **Output** section renders the card
  (next step).
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-B2 — Review the card: values, image, reconcile indicator

- **Persona:** Arjun · **Precondition:** CD-B1 reached SUCCESS; the Run dialog is open.
- **Steps:**
  1. In the **Output** section, confirm the rendered **card image** (the bilingual
     "CREDIT & DOD MONITORING" PNG) shows on the left
     (`CreditDodReportCard.tsx:56-70`; artifact `credit_dod_card.png`).
  2. On the right, read the value grid: **Due amount, Due date, Current limit,
     Availed limit, Available limit, Form of limit** (`:73-92`), plus **Risk
     category** and the **Window** (from → to) (`:94-99`).
  3. Read the **reconcile indicator** at the bottom (`:100-104,164-190`).
- **Expected:**
  - Values are formatted (₹ amounts via `inrFormat`, date via `formatDate`).
  - **Form of limit** is one of `DOD / CREDIT / CASH & CARRY`.
  - The reconcile line is **green "Reconciles"** with a check when the FIFO
    outstanding matches SDMS's own Current Total Receivable, or **red "Does not
    reconcile (SDMS receivable ₹…)"** with an alert icon when it disagrees.
  - The rendered card image's numbers **match** the value grid.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-B3 — Confirm and Share with dealer

- **Persona:** Arjun · **Precondition:** CD-B2; the card shows and is **not yet shared**.
- **Steps:**
  1. Press **Share with dealer** (`CreditDodReportCard.tsx:113-120`).
  2. A confirm dialog appears: _"Share this Credit & DOD card with the dealer's chat?
     This will message the dealer."_ (`:123-148`). Press **Share**.
- **Expected:** Button shows a loading state, then toast **"Card shared with dealer"**;
  the dialog closes; the button becomes a **disabled "Shared"** with a check
  (`:109-112`). An audit entry `CREDIT_DOD_SHARE` is written (`share.ts:158-164`) —
  visible in the dealer's **Info tab → Audit log** accordion.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-B4 — Dealer receives the card in chat + a push

- **Persona:** Ramesh (dealer-owner) · **Precondition:** CD-B3 shared; Ramesh is an
  **ACTIVE** app member of that dealer.
- **Steps:**
  1. On `mdg-client` (or the `mdg-app`) signed in as Ramesh, open the **Chat** tab.
  2. Observe the new message from **MDG**.
  3. On the `mdg-app` build (Expo), confirm a **push notification** arrived.
- **Expected:**
  - A system message headed **"📋 CREDIT & DOD MONITORING (code)"** with a bilingual
    line — if there's a due, _"देय राशि / Due: ₹… — जमा करने की आख़िरी तारीख़ / by
    DD-MM-YYYY"_, else _"कोई बकाया नहीं / No dues."_ — plus a Current/Availed/Available
    limits line (`share.ts:37-59`).
  - The **card PNG is attached** as an image (`share.ts:98-111`), openable full-size.
  - The conversation shows as **unread** for the dealer; a push titled **"Credit & DOD
    update"** with body _"Due ₹… by DATE"_ or _"No dues"_ deep-links to the chat
    (`share.ts:152-156`).
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-B5 — Re-share is idempotent ("Shared")

- **Persona:** Arjun · **Precondition:** CD-B3 already shared.
- **Steps:**
  1. Reopen the same run's dialog. The share control reads **"Shared"** and is
     disabled (`CreditDodReportCard.tsx:40,109-112`; driven by `snapshot.shared`).
  2. (Backend check) POST the share endpoint again for the same snapshot:
     `POST /credit-dod/snapshots/:id/share`.
- **Expected:** The UI never posts a second message. The API returns
  `alreadyShared: true` with the _same_ `conversationId` / `messageId` and does **not**
  create a duplicate chat message or a second push (`share.ts:76-82`). Ramesh sees
  **exactly one** card in his chat — **no duplicate-message bug**.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## Section C — Failure journeys (WHAT THE OPERATOR SHOULD SEE)

For each, note **what the UI shows today** vs **what an operator needs to conclude**.
These feed the [Findings & gaps](#findings--gaps). Trigger the failures per the "How
to trigger" line; then open the failed run in **Run history → click the row**.

### CD-C1 — Wrong SDMS password

- **Persona:** Arjun · **How to trigger:** set a deliberately wrong password (CD-A1),
  then **Run now**.
- **Steps:** Open the failed run. Inspect **Steps**, **Error**, **Output**, **Artifacts**.
- **Expected (product intent):** After N attempts the run **FAILS** with
  `LOGIN_CAPTCHA_EXHAUSTED` at phase `login` (`runner.ts:188-195`); a
  `fail_login.png` + `fail_login.html` diagnostics bundle is attached
  (`runner.ts:110-127`).
- **What the operator actually sees today (audit):**
  - **Status chip:** red **FAILED** (good).
  - **Steps timeline:** the `login` step shows a **red ✗ with no explanation** — the
    error step carries `meta:{ code, diagnostics }` but the timeline only renders an
    "Error details" block when `step.error` is set, which this step never has
    (`index.ts:123-126` sets `meta`, not `error`; `RunStepTimeline.tsx:72`). **The
    category code is invisible in the timeline.** → gap **G1**.
  - **Error section:** a raw monospace dump
    `credit-dod-monitoring: [LOGIN_CAPTCHA_EXHAUSTED] failed at login — captcha not
solved in N attempts` **plus a stack trace** (`executeRun.ts:158-171`,
    `RunsListInline.tsx:167-177`). The code is _in the string_ but buried and
    intimidating. → gap **G2**.
  - **Output section:** literally renders **`null`** (`RunsListInline.tsx:191-194`,
    since a failed run has no `output`). → gap **G5**.
  - **Artifacts:** `fail_login.png` / `fail_login.html` appear as filename rows with a
    **Download** link that opens in a new tab — **no inline thumbnail, no "screenshot
    at failure" label** (`RunsListInline.tsx:197-231`). → gap **G3**.
  - **Note:** a wrong password and a genuinely-hard captcha are indistinguishable here.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-C2 — Captcha never solved

- **Persona:** Arjun · **How to trigger:** valid password but the OCR keeps failing to
  read the captcha (e.g. lower `SDMS_CAPTCHA_MAX_ATTEMPTS`, or an unusually hard
  captcha run).
- **Expected:** identical surface to CD-C1 — `LOGIN_CAPTCHA_EXHAUSTED` at `login`, same
  diagnostics bundle. **This is the problem:** the operator cannot distinguish "wrong
  password" from "hard captcha" from "OCR sidecar down" (CD-C5) — all three are the
  same code + same copy. → gaps **G2, G4**.
- **Steps:** Open the failed run; confirm you cannot tell _why_ login failed without
  opening `fail_login.png` and/or reading server logs.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-C3 — Dealer has no active app member (share blocked)

- **Persona:** Arjun · **How to trigger:** a dealer with a **successful** run/snapshot
  but **no ACTIVE `dealer-owner`/`dealer-staff`** user (e.g. members not yet issued
  logins, or all archived).
- **Steps:**
  1. Open the successful run; press **Share with dealer**; confirm **Share**.
- **Expected (product intent):** the share is **rejected** —
  `AppError.badRequest('Dealer has no active app member to share with')`
  (`share.ts:85-88`).
- **What the operator sees today (audit):** the confirm dialog closes… actually the
  mutation throws, so a **red toast "Dealer has no active app member to share with"**
  appears (`CreditDodReportCard.tsx:47-50`). **There is no pre-check** — the Share
  button is fully enabled and only fails _after_ you confirm — and **no guidance** on
  the fix (issue/activate an app login on the **Team** tab). → gap **G6**.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-C4 — Reconcile mismatch (card shows "does not reconcile")

- **Persona:** Arjun · **How to trigger:** a dealer whose FIFO outstanding does **not**
  equal SDMS's Current Total Receivable (e.g. `padLookbackDays` too short to reach the
  last zero-crossing — see README "PAD window").
- **Steps:** Open the (SUCCESS) run; read the reconcile indicator and the DUE AMOUNT.
- **Expected:** The run still **SUCCEEDS** — reconcile is a _warning_, not a failure
  (`runner.ts:302-307`). The card shows a **red "Does not reconcile (SDMS receivable
  ₹…)"** (`CreditDodReportCard.tsx:164-190`).
- **Also expected (CLOSED, was gap G9):** the **Share** action is now **refused** for a
  plain admin on a non-reconciling card — the API returns 400 with a plain-language
  reason and nothing reaches the dealer. A **super-admin** may still override, and
  still sees the warning. Verify both roles.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-C5 — OCR sidecar not installed on the server

- **Persona:** Arjun · **How to trigger:** run on a server where the Python OCR sidecar
  venv is missing / `SDMS_OCR_PYTHON` is wrong.
- **Expected (mechanism):** `solveCaptcha` **never throws** — a missing/broken sidecar
  returns `{ ok:false, error:"OCR process error: spawn … ENOENT" }` (`captcha.ts:4-6,
80-83`). The runner treats every attempt as unsolved and, after N attempts, fails
  with **`LOGIN_CAPTCHA_EXHAUSTED`** — **the very same code as CD-C1/CD-C2.**
- **What the operator sees today (audit):** an identical failed-login run. The real
  cause (`spawn ENOENT`) is **only in server logs** — it is not put into the
  `ocrAttempts` records (which carry `text/confidence/submitted` only, `runner.ts:80,
164,169`) nor surfaced anywhere in the UI. A non-technical operator has **no way to
  tell "the server is missing the OCR sidecar (call engineering)" from "unlucky
  captcha (just retry)."** → gaps **G4 (P1)**.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## Section D — The "sheet" (per-dealer snapshot history)

### CD-D1 — Snapshot history for a dealer

- **Persona:** Arjun · **Precondition:** at least one successful run exists.
- **Steps:** open **Dealer → Credit & DOD**. Report history sits directly under the
  Generate card, above the maintained PAD ledger.
- **Expected:** rows newest-first with Captured at, Due amount, Due date, State,
  Reconciles and Shared. The newest row is **already expanded**. The same list is
  available at `GET /api/v1/credit-dod/dealers/:dealerId/snapshots`, which now also
  returns `openingCarriedForward`, `transactionCount`, `droppedRows`, `runId` and an
  `artifacts` object of short-lived **signed URLs** (`cardUrl`, `cardDownloadUrl`,
  `padStatementUrl`; the raw portal captures only for a super-admin).
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-D2 — Review and share straight from Report history

- **Persona:** Arjun · **Precondition:** an unshared successful report exists.
- **Steps:**
  1. Expand a row in **Report history** (do NOT go to Run history).
  2. Read the card image, the figures, the green **Reconciles** line, and open
     **"Why this amount?"**.
  3. Press **Share with dealer** → confirm.
- **Expected:** everything needed to approve a report is in that one row — no trip
  through Run history. After sharing, the row's Shared cell flips without a reload,
  and the button becomes a disabled **Shared** with a timestamp.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-D3 — Generation quota (3 per dealer per hour)

- **Persona:** Arjun (plain admin) and Priya (super-admin).
- **Steps:**
  1. As a plain admin, note the footer text: "N of 3 generations left this hour".
  2. Press **Generate now** three times (waiting for each to finish).
  3. Press it a fourth time.
  4. Repeat as a super-admin.
- **Expected:** the fourth attempt is refused with **429 `RATE_LIMITED`** and a toast
  naming Report history and roughly when the next slot frees up; the button is
  disabled once the counter hits zero. **No ServiceRun row is created** for a refused
  attempt. The daily **scheduled** run is never throttled and never consumes quota.
  A super-admin sees no counter and is never refused. Knobs: `CREDIT_DOD_RUN_LIMIT`,
  `CREDIT_DOD_RUN_LIMIT_WINDOW_MS`.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-D4 — Downloads actually download, and the PAD statement is readable

- **Persona:** Arjun · **Precondition:** a successful run exists.
- **Steps:** in an expanded report, press **Download** on **PAD statement**, then on
  **Card image**. Also open a run in Run history and use its Downloads list.
- **Expected:** each one **saves a file** — it must not open in the current tab. The
  signed URL carries `Content-Disposition: attachment` (the HTML `download` attribute
  is ignored for a cross-origin href, which is what used to make these navigate).
  Opening the saved `pad_statement.html` shows a **styled, printable statement** —
  header, period, opening/closing balances, totals, one numbered row per transaction,
  and a "How to read this" key — not the portal's raw table fragment.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-D5 — Concurrent-run guard

- **Persona:** Arjun · **Steps:** press **Generate now**, then immediately press it
  again (or from a second browser).
- **Expected:** the second attempt is refused with **409** and a message saying a
  report is already being generated for this dealer. A run older than
  `SDMS_RUN_TIMEOUT_MS` is treated as dead and does not block.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-D6 — "How this works" videos

- **Persona:** Arjun (new to the team).
- **Steps:** press **How this works** next to the Generate card (and on the empty
  Report-history state).
- **Expected:** a dialog offering two Hindi videos — _what the service does_ and
  _using it in the admin portal_ — each opening the MDG guide in a new tab.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## Section E — Transactions the portal publishes late

IndianOil does not show a payment on the day it is made. It typically appears one or
two days later, still carrying its original value date. Everything in this section is
about that lag. It is the single most likely way a dealer receives a wrong figure, so
run it against a **real dealer who has paid in the last three days**.

### CD-E1 — A payment made today is not in today's report

- **Persona:** Meena (dealer) · **Setup:** pick a dealer who deposited money today and
  confirm with them that the portal does not show it yet.
- **Steps:** generate a report, read the card, then share it and open the dealer's chat.
- **Expected:** the card and the chat message both state the date the figures describe
  ("As per portal on dd-mm-yyyy") and both carry the line that a payment made in the
  last day or two may not appear yet. The dealer must not read the message as a demand
  to pay again.
- **Why it cannot be fixed any other way:** the portal itself does not know about the
  payment, so no cross-check can detect it — both sides of every comparison are equally
  ignorant. Disclosure is the control here.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-E2 — The payment posts a day or two later and the figures correct themselves

- **Persona:** Arjun · **Setup:** the dealer from CD-E1, once the portal shows the
  payment (check the PAD statement artifact, or ask them).
- **Steps:** generate a fresh report. Compare DUE AMOUNT / DUE DATE against the earlier
  one.
- **Expected:** the late payment is in the maintained PAD ledger even though its value
  date is older than the previous report; DUE AMOUNT drops by the payment; DUE DATE
  moves to the next unpaid purchase. The report shows a notice naming the value date of
  the transaction that arrived late.
- **Regression watch:** if DUE AMOUNT has NOT changed, the fetch window is not reaching
  back far enough — raise `padReconfirmDays` on the dealer service.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-E3 — An already-shared report is flagged as superseded

- **Persona:** Arjun · **Setup:** CD-E2, but the earlier report was **shared** with the
  dealer before the payment posted.
- **Steps:** open the new report.
- **Expected:** a prominent notice saying a report was already sent to the dealer at
  <date/time> and its figures are now out of date. Report history marks that entry too.
- **Expected operator action:** share the new report. A chat message cannot be edited or
  withdrawn, so the correction has to be a newer message — confirm the dealer receives it.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-E4 — Repairing a ledger that has drifted further back than the re-read window

- **Persona:** super-admin · **How to trigger:** a dealer whose report says it does not
  reconcile on two consecutive runs.
- **Steps:** `POST /dealer-services/:dealerServiceId/run-now` with body
  `{"configOverride":{"resync":true}}`.
- **Expected:** the run re-reads the full look-back rather than the recent tail, widening
  until it reaches a balance reset, and the resulting report reconciles. The run's `ledger`
  step reports `restatedRows` / `backdatedRows` for what it corrected.
- **Note:** an ordinary run already re-reads a wider window by itself when it fails to
  reconcile (`verifyWidenings` in the run step says how many times). `resync` is for drift
  older than that reaches.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-E5 — The maintained ledger matches the portal's own statement

- **Persona:** Arjun · **Steps:** open **Maintained PAD ledger** for the dealer and the
  `pad_statement.html` artifact from the same run side by side.
- **Expected:** same transactions, same amounts, same running balances. A row the portal
  has since corrected or withdrawn appears **once**, in its current form — not twice, and
  not in its old form.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## Section F — Missed deposit deadlines (overdue)

A dealer who does not deposit by the DOD deadline used to look exactly like one
whose deadline is still ahead: the same `due` badge in Report history, and a chat
message that said _"deposit by 04-07-2026"_ on the 10th of July. This section is
about the verdict that now sits beside the figures.

Three sentences carry the whole section:

1. **Overdue is not a new state.** Every overdue report is still `state: 'due'`
   with an extra `overdue` block, so nothing that used to work changes shape.
2. **The overdue amount is deliberately NOT the due amount.** DUE AMOUNT is the
   oldest unpaid date's lot — the right answer to "what does the next deadline
   cost". Once several deadlines have gone by it is the wrong number: a dealer
   who pays it has done exactly what the card asked and is still in default. The
   overdue figure sums **every** past-deadline lot, and it is the one the dealer
   is shown. **CD-F4 is the journey that proves this, and it is the one to run
   if you only run one.**
3. **Nothing is sent automatically.** A missed deadline is still just a prepared
   report; it reaches the dealer when an admin presses **Share** (CD-F9).

### Producing an overdue position on purpose (read this first)

You cannot ask a dealer to default on cue, and waiting for one is not a test
plan. Two facts make this section runnable today:

- A **back-dated** report (Credit & DOD tab → **Past date**) rebuilds the ledger
  as of any date you choose and judges the deadlines against **that** date. Any
  day on which the dealer _was_ late produces a genuine overdue card now.
- A back-dated run re-reads the portal **as it stands today** and files every
  transaction under its own **value date**. So a reconstruction has hindsight
  about when a payment was _published_, but not about when it was _made_: a lot
  the dealer genuinely had not paid by the 6th still shows unpaid in a
  reconstruction of the 6th.

> **The one consequence to hold on to.** A reconstruction cannot reproduce
> "the dealer paid on time but IndianOil hadn't posted it yet" — in a
> reconstruction that payment is already there, on its value date, and the lot is
> closed. So the amber grace-band journey (CD-F2) is run against a lot that was
> genuinely unpaid on the day you pick. That is still a valid test of the
> **wording**; it is not a test of the grace band's generosity, which only a live
> run on the morning after a real deadline can show.

**Pick your dates once** — about five minutes and one report:

1. Dealer → **Credit & DOD** → scroll to **Maintained PAD ledger**. Find a
   stretch where the running balance stayed positive for a week or more (the
   dealer did not clear). Note the date of the first **credit** (payment) row
   that ends that stretch — call it **Q**.
2. Scroll back to the top, choose **Past date**, set the as-of date to **the day
   before Q**, press **Generate**. It takes about a minute.
3. Open the new row in **Report history** and open **"Why this amount?"**. It
   lists every unpaid purchase as `Availed dd-mm-yyyy · due dd-mm-yyyy`. The
   **due** dates are the deposit deadlines the engine judges against. Write down
   the first two: **D1** and **D2**.
4. **Check the stretch is long enough:** `D2 + 3 days` must still be earlier than
   **Q**. If it is not, the dealer cleared too soon for this exercise — go back to
   the ledger and pick a longer positive-balance stretch. (This one check is what
   keeps every date below on the unpaid side of the payment.)

Every scenario below is now just an as-of date:

| Journey | Generate as of     | What it proves                     |
| ------- | ------------------ | ---------------------------------- |
| CD-F1   | `D1`               | on the deadline day, still on time |
| CD-F2   | `D1 + 1 day`       | one day past → softened wording    |
| CD-F3   | `D1 + 2`, `D1 + 3` | day 3 is where the wording hardens |
| CD-F4   | `D2 + 3`           | two or more deadlines lapsed       |
| CD-F5   | `Q`, or later      | a late payment clears the breach   |

**Quota.** Manual generations are capped at **3 per dealer per hour** (CD-D3) and
this section is six or more runs. Either run them as a **super-admin** (exempt),
spread them over two hours, or — much faster — ask whoever has server access to
produce them all at once, off the quota:

```bash
# On the backend server, from /home/ubuntu/mdg-backend.
# The <dealerServiceId> is the id of this dealer's credit-dod-monitoring row on
# the Services tab; the person running this can read it off the API response.
npx tsx scripts/run-credit-dod-backfill.ts <dealerServiceId> \
  04-07-2026 05-07-2026 06-07-2026 07-07-2026 13-07-2026 16-07-2026
```

Each date is a separate stateless run (one failing does not abort the rest), and
every one lands in the same **Report history** list. The rest of the section is
then a review exercise in the browser, with no waiting.

> **Use a UAT dealer.** Several of these journeys press **Share**, which posts a
> "deposit immediately" message and a push notification to a real dealer about a
> position that may be weeks old. Run them on a dealer whose owner login is a
> tester's own account, or skip the share steps and mark them so.

### CD-F1 — The deadline day itself is not a miss

- **Persona:** Arjun · **Precondition:** you have **D1** from the recipe above.
- **Steps:**
  1. **Past date** → as-of date = **D1** → **Generate**. Wait for _"Report ready"_.
  2. Look at the new row in **Report history** (State column, or the badges on
     the mobile card).
  3. Open the row and read from the top: the notices, then the figures list, then
     the card image.
  4. _(Optional, UAT dealer only)_ press **Share with dealer** and read the chat
     message.
- **Expected:**
  - **No** overdue badge — the State cell shows the ordinary amber **`due`**.
  - **No** red or amber "deadline" notice above the card, and **no "Overdue
    amount" row** in the figures list; the first row is **Due amount**.
  - The card hero is the normal one: eyebrow **DUE AMOUNT**, right-hand panel
    headed **DUE DATE** showing **D1**, verdict _"आज ही जमा करना है / Due today"_.
  - Shared message reads _"देय राशि / Due: ₹… — जमा करने की आख़िरी तारीख़ / by
    D1"_ with no OVERDUE line; push title **"Credit & DOD update"**.
- **FAIL if** anything anywhere calls the dealer late on the day the deposit is
  actually due. The dealer has until close of business; this is the boundary that
  would otherwise accuse every compliant dealer once per cycle.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F2 — One day past: "payment may not be posted yet" (amber)

- **Persona:** Arjun, then Ramesh · **Precondition:** CD-F1 done; **D1** known.
- **Steps:**
  1. **Past date** → as-of = **D1 + 1 day** → **Generate**.
  2. In **Report history**, read the badge in the State column.
  3. Open the row. Read the notice above the card image, then the top two rows of
     the figures list, then the card image itself.
  4. _(UAT dealer)_ **Share with dealer** → confirm. Open the dealer's chat as
     Ramesh and read the message; check the push notification on the app build.
- **Expected:**
  - **Badge:** amber, reading **`Past deadline · 1 day`** (hovering it explains
    that a deposit made on time may not be published yet).
  - **Notice (amber, above the card):** _"The deadline of D1 has passed with ₹…
    still showing unpaid — 1 day ago. IndianOil takes a day or two to publish a
    deposit, so this may already have been paid. Check with the dealer before
    treating it as a default."_
  - **Figures:** a new **Overdue amount** row in red, sitting **above** Due
    amount. With only one lapsed deadline the two figures are equal — that is
    correct, not a bug.
  - **Card image:** the right-hand panel is headed **DEADLINE WAS** with D1 under
    it, on a pale-orange background, reading _"Deadline passed 1 day ago —
    payment may not be posted yet"_.
  - **Chat message** contains, on its own line:
    _"⚠️ जमा करने की तारीख़ निकल चुकी है / Deadline passed: ₹… — तारीख़ थी / was D1"_
    followed by _"…पोर्टल पर दिखने में 1-2 दिन लगते हैं / If you have already
    deposited, the portal can take a day or two to show it."_
  - **Push:** title **"Credit & DOD — deadline passed"**, body _"₹… — deadline
    was D1. If you have paid, the portal may not show it yet."_
- **FAIL if** the chat message or the push contains the word **OVERDUE** or tells
  the dealer to _deposit immediately_ while inside the two-day band.
- **The card must soften too.** Its hero block is **amber**, not red, and its
  eyebrow reads **PAST DEADLINE** — not "OVERDUE AMOUNT". **FAIL if** the hero is
  red-tinted or says OVERDUE anywhere inside the two-day band.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F3 — Three days past: a firm breach, and where the wording flips

- **Persona:** Arjun, then Ramesh · **Precondition:** **D1** known.
- **Steps:**
  1. Generate as of **D1 + 2**. Read the badge and the notice.
  2. Generate as of **D1 + 3**. Read the badge, the notice and the card.
  3. _(UAT dealer)_ share the **D1 + 3** report and read the chat message + push.
- **Expected:**
  - **D1 + 2** is still the softened treatment: amber badge **`Past deadline · 2
days`**, the same "may already have been paid" notice with _2 days_. (If **D2**
    happens to fall on D1 + 1, a second deadline has lapsed by now and the amount
    will be larger and the notice will name two deadlines — that is correct. The
    day count, which is what drives the wording, is still measured from **D1**.)
  - **D1 + 3** hardens, everywhere at once:
    - **Badge:** red **`Overdue 3 days`**.
    - **Notice (red):** _"Deadline missed. ₹… has been past its deposit deadline
      since D1 — 3 days."_
    - **Card:** the date panel turns red, reading _"3 दिन पहले तारीख़ निकल चुकी है
      — तुरंत जमा करें"_ / _"Overdue by 3 days — deposit now"_.
    - **Chat:** _"🔴 बकाया — तारीख़ निकल चुकी / OVERDUE: ₹… — आख़िरी तारीख़ थी /
      deadline was D1 (3 दिन पहले / 3 days ago)"_ followed by _"कृपया तुरंत जमा
      करें / Please deposit immediately."_
    - **Push:** _"Overdue ₹… — deadline was D1 (as per portal). Please deposit
      now."_
- **FAIL if** the flip happens on day 2 (too harsh — the portal's own lag would
  be blamed on the dealer) or has still not happened on day 4 (too soft — a real
  default reads as a routine reminder).
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F4 — Several missed deadlines: the dealer must not be told to pay the smaller number

> **The most valuable journey in this document.** Everything else here is
> wording. This one is money: if it fails, a defaulting dealer deposits the
> figure we gave them, believes they are square, and is still in default.

- **Persona:** Arjun, then Ramesh · **Precondition:** **D1** and **D2** from the
  recipe. You need an as-of date by which **two or more** deadlines have lapsed —
  `D2 + 3` is the safe choice.
- **Steps:**
  1. Generate as of **D2 + 3**.
  2. Open the row. Read the red notice at the very top, word for word.
  3. Read the first two rows of the figures list: **Overdue amount** and **Due
     amount**. Write both down — call them **A** (overdue) and **B** (due).
  4. Open **"Why this amount?"** and, on paper, add up every lot whose **due**
     date is _before_ your as-of date. Compare that total to **A**.
  5. Look at the card image: the big number in the hero, the line under it, and
     the right-hand panel.
  6. _(UAT dealer)_ **Share with dealer**. Read the chat message and the push
     notification as Ramesh.
- **Expected:**
  - **A is larger than B.** If they are equal, only one deadline has lapsed —
    move the as-of date later and start again.
  - **A equals your hand total from step 4**, to the paisa.
  - **Notice:** _"Deadline missed. ₹A has been past its deposit deadline since D1
    — N days, across L separate deadlines. The due amount below (₹B) covers only
    the oldest of them, so paying that alone would not clear the default."_
  - **Card hero:** eyebrow **OVERDUE AMOUNT**, and the large figure is **A, not
    B**. Under it, in red: _"L जमा तारीख़ें निकल चुकी हैं · L missed deadlines,
    oldest D1"_. The right-hand panel reads **DEADLINE WAS D1**.
  - **Chat message** carries **₹A** on the OVERDUE line, plus _"इसमें L तारीख़ें
    शामिल हैं / This covers L missed deadlines."_ — and **the smaller figure B
    appears nowhere in the message**.
  - **Push** body carries **₹A**.
- **FAIL if** any dealer-facing surface — card hero, chat line, push — presents
  **B** as the amount to deposit. Stop and report it rather than continuing.
- **The Report history list must carry ₹A too**, without expanding the row: the
  amount column shows **₹A** in red and the date column reads _"was D1"_. On a
  phone the same row reads _"₹A · was due D1"_. **FAIL if** the list shows **B**
  beside a red overdue badge, or phrases a deadline that has gone as _"by D1"_ —
  that is the figure an admin would read out over the phone.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F5 — A payment lands late and clears the breach

- **Persona:** Arjun · **Precondition:** **Q** (the payment date) from the recipe,
  and the CD-F4 report still open in another tab for comparison.
- **Steps:**
  1. Generate as of **Q**, and again as of **Q + 2**.
  2. Compare each against the CD-F4 report: badge, notices, figures list, card.
- **Expected:** the overdue treatment **disappears** — no badge, no notice, no
  **Overdue amount** row — as soon as the as-of date reaches the payment's value
  date, provided that payment covered the lapsed lots. The report reverts to an
  ordinary `due` with a deadline in the future, or to `clear` / `advance`. The
  only thing you changed is the as-of date.
- **If the dealer only part-paid**, the overdue treatment may survive; in that
  case the **Overdue amount** must have fallen by at least the payment. An overdue
  figure that has not moved at all after a payment is a fail.
- **Live variant (run this too if you can):** for a dealer who really is past a
  deadline **today**, wait for the deposit to appear in the **Maintained PAD
  ledger** (one to two days — see Section E) and generate today's report. The
  overdue treatment must be gone. A card already shared cannot be edited or
  withdrawn, so the correction is a **newer share** — cross-check CD-E3, which
  should also be flagging that earlier report as superseded.
- **Regression watch:** if the overdue treatment survives after the payment is
  visibly in the Maintained PAD ledger with a value date at or before the lapsed
  deadline, the FIFO is not consuming the lot. Stop and report — that would mean
  chasing a dealer who has paid.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F6 — A back-dated report is judged against that date, not today

- **Persona:** Arjun · **Precondition:** none beyond **D1**.
- **Steps:**
  1. In one sitting, generate two reports: as of **D1 + 1** and as of **D1 + 10**.
  2. Read the day count on each badge and notice.
  3. Open each card image and read the footer line.
  4. _(UAT dealer)_ share one of them and read the first and last lines of the
     chat message.
- **Expected:**
  - The two reports say **1 day** and **10 days**, not the number of days between
    D1 and today. Both were generated in the same minute; only the requested date
    differs.
  - Each row in Report history carries a blue **`As of dd-mm-yyyy`** badge.
  - The card footer reads **DATA PREPARED AT** _clock time_ · **the as-of date** —
    not today's date.
  - The chat message opens with _"🗓 स्थिति / Position as of dd-mm-yyyy"_ and ends
    with _"यह पुरानी तारीख़ की स्थिति है, आज की नहीं / This is the position on
    that past date, not today."_ — and **not** the "a payment in the last day or
    two may not appear" line, which only belongs on a report about today.
- **The push must say which day it describes.** Its body contains
  _"(position on dd-mm-yyyy)"_. **FAIL if** it reads as today's position — a
  notification is seen on a lock screen, stripped of the chat message's framing.
  Still use a UAT dealer: a real one should not receive practice reports.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F7 — An older report in Report history still shows the verdict

- **Persona:** Arjun · **Precondition:** the dealer has at least one report
  **captured before this release shipped**. Check the Captured-at column in
  Report history against the deploy date.
- **Steps:**
  1. Scroll to a pre-release row. Open it and read its **Window** (from → to) in
     the muted metadata block, and its **"Why this amount?"** list.
  2. If any lot's **due** date is _earlier_ than the window's **to** date, that
     report described a dealer who was already past a deadline.
  3. Read the badge on the collapsed row and the notice at the top of the
     expanded one.
- **Expected:** the old report carries the **same badge and the same notice** as a
  freshly generated one, worked out from the open lots it already stored and the
  last day its own window covered. Crucially, it is judged against **the day that
  report described, not today** — a report that was on time when it was captured
  must stay on time forever, however long ago it was.
- **Cannot be produced on demand — say so if it does not apply.** There is no way
  to create a "pre-release" report from the admin: every new run stores the
  verdict itself. If this dealer has no history from before the release, mark the
  journey **N/A** and note it. The substitute, if it needs proving, is for an
  engineer to clear the stored `overdue` field on one snapshot in a **staging**
  database and re-open the row — the value shown must be identical to the one
  that was cleared.
- **PASS ☐ FAIL ☐ · N/A ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F8 — A breach built on carried-forward debt says "at least N days"

- **Persona:** Arjun · **Precondition:** a report that shows **both** the warning
  _"Due date is an estimate — the look-back didn't reach a balance reset…"_ **and**
  an overdue verdict.
- **Steps:** open such a report and read the red notice.
- **Expected:** the notice reads _"… has been past its deposit deadline since
  <date> — **at least** N days"_. The words "at least" are the whole point: the
  oldest unpaid purchase is older than the ledger we could read, so its deadline
  is the latest it could possibly have been. The dealer is late by **at least**
  that many days, never fewer.
- **Not reproducible on demand — be honest about it.** A back-dated run keeps
  widening its window until the balance resets (up to roughly 400 days), so this
  only survives for a dealer who has been continuously in debit for longer than
  that. You cannot force it from the admin. Practically:
  - if any existing report already shows both signals, run the journey on it;
  - otherwise mark **NOT REPRODUCIBLE** and record that. The arithmetic is
    covered by an automated test; what no human can currently confirm in-product
    is the wording in situ.
- **The hedge must reach the dealer, not just the admin.** The card's date panel
  reads _"Overdue by at least N days"_ and the chat line _"कम से कम N दिन पहले /
  at least N days ago"_. **FAIL if** any dealer-facing surface states the day
  count as an exact number — the non-overdue card already hedges this same
  uncertainty with _"by approx."_, and the harsher message must not hedge less.
- **PASS ☐ FAIL ☐ · NOT REPRODUCIBLE ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F9 — A missed deadline still sends nothing on its own

- **Persona:** Arjun, then Ramesh · **Precondition:** any of CD-F2 – CD-F4.
- **Steps:**
  1. Immediately after a report finishes and **before touching Share**, open the
     dealer's chat as Ramesh (a second browser or the app).
  2. Return to Report history and look at the **Shared** column and the _"N not
     shared yet"_ count in the header.
  3. Now press **Share with dealer** → **Share**. Re-check the chat.
- **Expected:** nothing reaches the dealer at step 1 — no message, no push, no
  unread badge — however severe the breach. The row shows **Not shared** and the
  header count has gone up by one. Only after step 3 does the message and its
  push appear, exactly once (re-share stays idempotent, CD-B5).
- **Also confirm the existing guards still bite:** a report that **does not
  reconcile**, or one with unreadable ledger rows, is still refused for a plain
  admin with the same plain-language reason (CD-C4). Being overdue does not
  unlock a card whose figures we already know are wrong.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-F10 — No false alarms for dealers who are up to date

- **Persona:** Arjun · **Precondition:** two or three dealers who are current,
  plus one in advance if you have one.
- **Steps:** generate **today's** report for each (the **Today** tab, not Past
  date). Scan Report history, then open each one.
- **Expected:** for every one of them — no overdue badge, no notice, **no
  "Overdue amount" row**, and the card hero unchanged from before this release
  (**DUE AMOUNT**, **NOTHING DUE**, or **ADVANCE WITH INDIAN OIL**). Shared
  messages read _"देय राशि / Due: ₹… — by …"_ or _"कोई बकाया नहीं / No dues."_
- **Why this is a journey and not an afterthought:** one false "OVERDUE — deposit
  immediately" sent to a dealer who has paid costs more trust than every true one
  this feature catches. If a single compliant dealer is flagged, the release
  should not go out.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

---

## Section G — A locked credit line (review date lapsed)

The Credit Monitoring page carries a **Next Review Date** — the expiry on the
credit limit itself. Once it passes without IndianOil completing the review, the
account is locked: the dealer cannot lift product on credit, every purchase is
paid for upfront (**cash and carry**), and only their **sales officer** can get
it reopened.

Three sentences carry this section:

1. **A lock is not a new FORM OF LIMIT.** The card still lights the portal's own
   category (`DOD`, `CREDIT` or `CASH & CARRY`) — a lapsed review suspends that
   limit, it does not restate what kind of limit was granted. The lock is a
   separate band with its own wording.
2. **A lock is not a deposit problem.** Money owed is still owed on its own date,
   so the hero, the DUE AMOUNT and the deadline are untouched. What changes is
   what the dealer may buy tomorrow — and no deposit fixes it.
3. **Silence is not an all-clear.** No verdict is reached on a back-dated report,
   or when the portal published a date we could not read. In both cases nothing
   is claimed either way (CD-G4, CD-G5).

### Producing a locked account on purpose (read this first)

You cannot make IndianOil lapse a dealer's review on cue, and no dealer we have
captured is locked — every real page so far shows a review date years out. So
**CD-G1 and CD-G2 are not runnable against the live portal today**; they are
written for the first dealer who is genuinely locked, and until then the
behaviour is covered by automated tests
(`src/automation/sdms/creditReview.test.ts`,
`test/integration/creditDod.plugin.test.ts`). What you CAN and SHOULD run today
is **CD-G3** — the no-false-alarms journey — because that is the one that would
hurt if it were wrong.

### CD-G1 — A locked account says so on every surface

- **Persona:** Arjun, then Ramesh · **Precondition:** a dealer whose portal Next
  Review Date has passed. **Not producible on demand — skip and say so if you
  have no such dealer.**
- **Steps:**
  1. **Today** → **Generate**. Wait for _"Report ready"_.
  2. Read the new row in **Report history** (State column, or the badges on the
     mobile card), then open it and read top to bottom.
  3. _(UAT dealer only)_ press **Share with dealer**, then read the chat message
     and the push on the dealer's phone.
- **Expected:**
  - Report history shows a red **"Credit locked"** badge **beside** the state
    badge, not instead of it — the dealer's `due`/`clear`/overdue position is
    still shown.
  - Above the card, a red notice naming the review date, how long ago it passed,
    that the dealer must pay upfront, and that their **sales officer** reopens
    it. The figures list shows **Next review date** in red and **Form of limit**
    with a red **(locked)** beside the portal's own value.
  - On the card image: a red **CREDIT LOCKED — REVIEW DATE PASSED** band directly
    under the hero; the utilisation bar **replaced** by a red line saying the
    remaining amount cannot be used; a red caption under the FORM OF LIMIT chips.
    The lit chip is still the dealer's own category.
  - Chat message contains **🔒 उधार बंद / CREDIT LOCKED**, the date, _"कैश एंड
    कैरी / cash & carry"_ and _"सेल्स ऑफिसर / sales officer"_. The limits line
    ends **`DOD — अभी बंद / locked`**, never a bare `DOD`.
  - Push title **"Credit & DOD — credit locked"** (unless the dealer is also
    overdue — see CD-G2).
- **FAIL if** the card shows a green utilisation bar, or any surface states the
  lock while another is silent about it.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-G2 — Locked AND overdue: the deposit still leads

- **Persona:** Ramesh · **Precondition:** the CD-G1 dealer, also past a deposit
  deadline. **Not producible on demand.**
- **Expected:** the hero stays the **OVERDUE AMOUNT** hero and the push still
  announces the deposit — a deadline is time-critical and a lock is not made
  worse by a day. The lock band sits **below** that hero, and the chat message
  carries **both**, money first.
- **FAIL if** the lock suppresses the overdue amount anywhere, or the push
  announces the lock while the message it opens leads with a deposit.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-G3 — No false locks (run this one)

- **Persona:** Arjun · **Precondition:** the dealers you already use for UAT.
- **Steps:** generate **today's** report for each and scan Report history, then
  open two or three.
- **Expected:** for every one of them — **no** "Credit locked" badge, **no** red
  notice, **no** CREDIT LOCKED band on the card, the utilisation bar exactly as
  before this release, and the shared message's limits line ending in a bare
  `DOD` / `CREDIT` / `CASH & CARRY`. **Next review date** may appear in the
  figures list in ordinary text — that is correct, it is the portal's date.
- **Why this is a journey and not an afterthought:** telling a dealer their
  account is shut when it is not sends them to their sales officer over nothing
  and makes them doubt every card after it. Unlike an overdue flag, it cannot
  correct itself on the next run. If one healthy dealer is flagged, the release
  should not go out.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-G4 — A back-dated report reaches no verdict at all

- **Persona:** Arjun · **Precondition:** any dealer.
- **Steps:** **Past date** → pick any date a week or two back → **Generate**.
  Open the report.
- **Expected:** **no** "Credit locked" badge and **no** review notice, whatever
  the dealer's real review date is — and **no** "everything is fine" claim
  either. The **Next review date** row shows the portal's date followed by
  **"(not judged — back-dated)"**.
- **Why:** the portal only ever publishes the review date as it stands **today**
  and keeps no history of it, so a past-dated report has nothing to judge. The
  same reason a back-dated card is not cross-checked against that page's Current
  Total Receivable (CD-F6 is the sibling journey).
- **FAIL if** a back-dated report claims a lock, claims the limit was live, or
  labels that date **"(unreadable)"** — that wording means the portal changed its
  format and is the one signal that should send you to engineering. Nothing
  failed to parse here; the question simply cannot be asked of a past date.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***

### CD-G5 — Reports from before this release stay blank, not green

- **Persona:** Arjun · **Precondition:** a dealer with reports in **Report
  history** captured before this release.
- **Steps:** open two or three older reports.
- **Expected:** no **Next review date** row, no badge, no notice — and nothing
  claiming the review was fine. Every other figure renders exactly as it did
  before.
- **Why:** unlike the overdue verdict, this one cannot be re-derived for an old
  report — nothing was stored to recompute from. Blank is the honest answer.
- **PASS ☐ FAIL ☐** — notes: \***\*\*\*\*\***\*\*\***\*\*\*\*\***\_\_\***\*\*\*\*\***\*\*\***\*\*\*\*\***


---

## Findings & gaps

Ranked by how badly they block a **non-technical operator** from diagnosing and
recovering from a failure on their own. The headline: the failure **data** is all
captured server-side (categorised code, phase, screenshot, DOM) — the **failure UX**
does not surface it in a way an ops person can act on.

### P0 — a failed run does not tell the operator where or why

**G1 · The failing step in the timeline shows a bare red ✗ with no reason.**
On a `SdmsError`, `index.ts:123-126` records the failing phase as a step with
`meta:{ code, diagnostics }` — but `RunStepTimeline.tsx:72` only renders an "Error
details" block when `step.error` is set, and this step has **no `error` field**. So
the `login` (or `padStatement`, etc.) step turns red with **no code, no message, no
link to the screenshot**. The single most useful signal — the category code and the
phase — is computed and stored but **not shown**.

> **Fix:** in `RunStepTimeline`, render `step.meta.code` as a coloured pill on the
> failing step, plus a one-line human label from the failure-code table above, plus a
> thumbnail/link built from `step.meta.diagnostics.screenshotKey`.

**G2 · The only failure explanation is a raw error string + stack trace.**
The "Error" section dumps `run.error.message` (`credit-dod-monitoring:
[CODE] failed at PHASE — message`) plus up to 10 stack frames in monospace
(`executeRun.ts:158-171`, `RunsListInline.tsx:167-177`). The code is present but
buried in a developer string, and the stack trace is noise to an operator.

> **Fix:** add a **failure banner** at the top of `RunDetail` for FAILED runs: a red
> card with (a) the **plain-language category** ("Couldn't sign in to SDMS"), (b)
> **which step** failed, (c) a **"What to do next"** line from the reference table,
> and (d) a **thumbnail of `fail_<phase>.png`** that opens full-size. Keep the raw
> string collapsed under a "Technical details" `<details>` for engineering.

**G3 · The diagnostic screenshot is hidden in an unlabelled artifacts list.**
`fail_login.png` / `fail_login.html` are saved (`runner.ts:110-127`) and _are_
downloadable, but they appear only as generic filename rows with a "Download" link
that opens a new tab (`RunsListInline.tsx:197-231`) — **no inline thumbnail, no
"Screenshot at the moment of failure" label.** A non-technical operator will not
realise the PNG is the single most useful thing to open.

> **Fix:** detect `fail_*.png` artifacts and render them inline as thumbnails inside
> the failure banner (reuse the `<img>` pattern already in
> `CreditDodReportCard.tsx:56-62`), labelled "Screenshot at failure".

### P1 — recoverable but confusing

**G4 · "OCR sidecar down" is indistinguishable from "wrong password" / "hard
captcha."** All three surface as `LOGIN_CAPTCHA_EXHAUSTED` with identical copy
(CD-C1/C2/C5). `solveCaptcha` never throws (`captcha.ts:4-6`); its `spawn ENOENT`
error is dropped — it is not written into `ocrAttempts` (`runner.ts:164,169` record
`text/confidence/submitted` only) and never shown. An operator cannot tell a config
outage (call engineering) from bad luck (retry).

> **Fix:** capture `sol.error` into the ocr-attempt records and into the
> `LOGIN_CAPTCHA_EXHAUSTED` diagnostics `context`; if _every_ attempt errored with a
> spawn/exec failure, raise a distinct code (e.g. `OCR_SIDECAR_UNAVAILABLE`) so the
> banner can say "The OCR service is not running on the server — contact support."

**G5 · The Output section shows literally `null` on a failed run.**
`isCreditDod && run.output` is false when there's no output, so it falls to
`<pre>{JSON.stringify(run.output ?? null)}</pre>` → the word **`null`**
(`RunsListInline.tsx:183-194`). Reads like something is broken beyond the failure.

> **Fix:** hide the Output section entirely when `run.status === 'FAILED'` (the
> failure banner replaces it).

**G6 · "Share" is a dead-end when the dealer has no app member.**
The button is always enabled; the "no active app member" rejection only arrives as a
red toast _after_ the operator confirms (`share.ts:85-88`,
`CreditDodReportCard.tsx:47-50`), with **no guidance** to go issue/activate a login on
the **Team** tab.

> **Fix:** pre-check membership (or read it off the dealer) and either disable Share
> with an inline hint ("No app login yet — add one on the Team tab") or make the toast
> actionable with that instruction.

**G7 · The "Dealer type" field (Retail / LPG / 1906) is misleading.**
The creds form offers three types (`SdmsCredentialsSection.tsx:34-38`) and stores the
choice, but the runner **always clicks the Retail tab** (`runner.ts:146`) and uses a
single `SDMS_LOGIN_URL` regardless (`credentials.ts:65-66`). Selecting LPG/1906 will
still attempt a Retail login and likely fail confusingly.

> **Fix:** either wire `dealerType` through to the login (tab + URL) end to end, or
> until then constrain the field to Retail (or add "LPG/1906 not yet supported" help
> text) so the operator isn't misled.

### P2 — polish / observability debt

**G8 · There is no "sheet" UI.** ✅ **CLOSED.** Report history now sits on the dealer's
Credit & DOD tab (`DealerCreditDodTab.tsx`, backed by `useCreditDodSnapshots`), above
the maintained PAD ledger, and expanding a row shows the whole report — card, figures,
reconcile line, open lots, source files and **Share with dealer** — so history is no
longer reachable only by opening SUCCESS runs one at a time. See CD-D1/CD-D2.

**G9 · A non-reconciling card is shareable with no warning.** ✅ **CLOSED.** The Share
confirm dialog shows a caution when `reconciles === false`, and a second one when
the snapshot is back-dated. The report body additionally warns on
`openingCarriedForward` (the due date is an estimate) and on `droppedRows > 0`
(parser drift). The warning is now **enforced**, not advisory: the share API refuses a
non-reconciling or partly-unreadable card for a plain admin (super-admins may override),
because the DUE AMOUNT on such a card disagrees with IndianOil's own receivable and a
dealer acting on it deposits the wrong money.

**G11 · A transaction the portal published late could never be picked up.** ✅ **CLOSED.**
The fetch window used to start at the last stored transaction date, so a payment dated
the 1st that posted on the 3rd fell outside every future window — permanently, since the
window's left edge only moved forward. Runs now re-read the last `padReconfirmDays`
(default 10) and treat that window as authoritative, so late rows, amendments and
withdrawals all land; a window that fails to reconcile re-reads further back mid-capture,
before anything is written. See Section E.

**G12 · An already-shared report was never marked as superseded.** ✅ **CLOSED.** When a
late transaction lands on a day whose report had already gone to the dealer, the new
report says so (`supersededSharedAt`), and Report history marks the affected entry. The
sent chat message still cannot be edited — the correction is a newer share, which is what
CD-E3 checks.

**G10 · Share success copy doesn't reflect idempotency.** ✅ **CLOSED.** The toast now
reads "This report had already been shared with the dealer." when the backend returns
`alreadyShared: true`. _(Original finding:)_ The toast always said "Card
shared with dealer" even when the backend returned `alreadyShared: true`
(`CreditDodReportCard.tsx:45`, `share.ts:76-82`). Also `alreadyShared` is derived only
from the snapshot query, so a share performed by _another_ admin won't flip the button
to "Shared" until that query refetches. Minor, but worth distinct "Already shared"
messaging and an invalidate-on-focus.

**G13 · No retry from the failure view.** After a failure the operator must close the
dialog, switch to the **Services** tab, and press **Run now**. A "Run again" button in
the failed `RunDetail` would close the loop.
_(Renumbered from a second "G11" — an earlier draft reused two numbers.)_

**G14 · Creds form has no "test login" / validity feedback.** You cannot tell if a
username/password pair is valid until a full run fails hours later. A lightweight
"Test credentials" action (login-only, no capture) would catch typos at entry time and
remove the biggest source of `LOGIN_CAPTCHA_EXHAUSTED` false alarms.
_(Renumbered from a second "G12".)_

### Missed deadlines (Section F)

The engine and the copy are in good shape — the amount is right, the grace band
is right, and the approval model is untouched. What follows is where the four
surfaces (card, chat, push, admin) stop agreeing with each other.

**G15 (P1) · The card treated the two-day grace band as a full breach.**
**RESOLVED.** `overdueVerdict` softened the words, but the hero was driven by
`overdue != null`, so the red background and an **OVERDUE AMOUNT** eyebrow
appeared on day 1 while the chat, the push and the admin badge all hedged — on
the one artefact a dealer actually forwards. The hero now follows
`withinPortalLag`: an amber `.hero.lagging` with a **PAST DEADLINE** eyebrow
inside the band, the red `.hero.late` treatment only past it. Covered by CD-F2.

**G16 (P1) · A back-dated overdue report sent a present-tense push.**
**RESOLVED.** The chat body carried _"This is the position on that past date"_
but the push did not, and a push is read on a lock screen with none of that
framing. The push body now appends _"(position on dd-mm-yyyy)"_ whenever
`snap.backdated`. Covered by CD-F6.

**G17 (P2) · The "at least N days" caveat never reached the dealer.**
**RESOLVED.** `estimatedFrom` was computed and stored but dropped by
`assemble.ts` and by `share.ts`'s local type, so only the admin's notice hedged.
The asymmetry was the tell: the _non_-overdue path already discloses the same
uncertainty as _"अनुमानित / by approx."_, and the hedge vanished exactly when the
message got harsher. It is now carried into `CreditCardInput.overdue` and into
the chat body, which read _"at least N days"_ / _"कम से कम N दिन"_. Covered by
CD-F8.

**G18 (P2) · Once a deadline lapses, the next one stops being shown.**
**ACCEPTED, not fixed.** A dealer one day past ₹1,00,000 who also has ₹80,000
falling due tomorrow hears only about the ₹1,00,000. Real, but not a regression:
`dueDate` has always been the _oldest_ open lot's deadline, so the upcoming one
was never shown either. Fixing it means putting a second amount in front of
someone being asked to pay a first, and someone paying the wrong one is worse
than the omission. The admin sees the full ladder under "Why this amount?".
Recorded in the service README under "What this deliberately does NOT do".

**G19 (P2) · Report history's list still showed the smaller number.**
**RESOLVED.** The desktop table showed **Due amount** beside a red overdue badge
and the mobile stack rendered `₹1,00,000.00 · by 04-07-2026` — a deadline that
had gone, phrased as an instruction — with the explanation hidden inside the
expanded row. Both now show the overdue total in red, dated _"was D1"_ /
_"was due D1"_. Covered by CD-F4.

**G20 (P2, dev tooling) · The dev CLI's `--as-of` card could contradict itself.**
**RESOLVED.** The CLI passed the as-of date to `computeDod` but not to
`assembleCreditCardInput`, so `preparedOn` stayed today and a reconstruction of a
compliant past date rendered a red "Overdue by N days" panel under an ordinary
**DUE AMOUNT** hero. It now passes `asOf`, matching the plugin. CLI-only, but the
CLI is this document's own rehearsal route.

**G21 (P1) · DUE AMOUNT named less than was owed by the date it named.**
**RESOLVED.** `computeDod` grouped open lots by availment DATE, on the
assumption that one date means one deadline. That holds one way only: a Thursday
purchase rolls +3 to Sunday and on to Monday, and a Friday purchase lands on
that same Monday. So the card said "Due ₹1,00,000 by 06-07", the dealer
deposited exactly that on the 6th, and was reported OVERDUE ₹60,000 three days
later — the precise failure this whole section exists to prevent, caused by the
figure it was measuring against. DUE AMOUNT now sums every lot sharing the
NEAREST DEADLINE. **This changes a paisa-validated figure**: neither of the two
validated dealer cards had a shared-deadline collision, so both still match, but
it has not been confirmed against a real card that does. Worth doing — noting
that the old behaviour walks a compliant dealer into default and the new one
cannot.

**G22 (P2) · `overdue.lots` counted lots and was published as deadlines.**
**RESOLVED.** Every string built from it — chat, card, both admin surfaces —
said "missed deadlines", but the value counted past-deadline _lots_. Two
invoices lifted on one day, any Thursday+Friday pair, and any confirmed holiday
all collapse several lots onto one deadline. The worst case was the card
contradicting itself: for two same-day invoices `overdue.amount === dueAmount`,
yet the note claiming "the due amount covers only the oldest" still fired. The
field is now `deadlines` and counts distinct deadlines, and the note that
explains the gap fires on the MONEY (`overdue.amount > dueAmount`) rather than
on any count — the two come apart in both directions.

**G23 (P2) · The grace band excused a breach of unknown age.**
**RESOLVED.** `withinPortalLag` was `days <= 2`, and `days` is only a LOWER
bound when `estimatedFrom` is true. Together they said "at least 1 day late,
possibly months" and concluded "this may just be the portal lagging an on-time
deposit" — reachable with ₹5,01,000 of carry-forward debt on a short window.
Stating a breach on a lower bound is sound; excusing one needs an upper bound we
do not have, so the band is now withheld whenever the count is an estimate.

**Verified correct while writing these** (worth keeping, because each is a way
this could have gone wrong and did not): the deadline day itself is a strict `<`
so nobody is accused a day early; the grace band is judged from the **earliest**
missed deadline, not the newest; `overdue.amount ≥ dueAmount` always, so replacing
the hero figure can never understate; the verdict re-derived for an older report
goes through the **same** summariser as a live run, so the two cannot drift; and a
fresh report with nothing overdue re-derives to nothing overdue, so the
compatibility path cannot invent a breach (CD-F10).

---

## Coverage summary

| Requirement                                                                                    | Cases                  |
| ---------------------------------------------------------------------------------------------- | ---------------------- |
| Setup: creds (Retail/LPG/1906), attach, cadence                                                | CD-A1 – CD-A4          |
| Happy path: run → SUCCESS → review card → Share → dealer receives + push → re-share idempotent | CD-B1 – CD-B5          |
| Failure: wrong password                                                                        | CD-C1                  |
| Failure: captcha never solved                                                                  | CD-C2                  |
| Failure: share blocked (no app member)                                                         | CD-C3                  |
| Reconcile mismatch ("does not reconcile")                                                      | CD-C4                  |
| Failure: OCR sidecar not installed                                                             | CD-C5                  |
| The sheet (snapshot history), quota, downloads, concurrency, help videos                       | CD-D1 – CD-D6          |
| Transactions the portal publishes late (and a report already sent that they invalidate)        | CD-E1 – CD-E5          |
| Missed deadline: deadline day itself is not a miss                                             | CD-F1, CD-F10          |
| Missed deadline: 1–2 days past → softened "may not be posted yet" on card, chat, push, badge   | CD-F2, CD-F3           |
| Missed deadline: 3+ days past → firm breach wording, and where the two flip                    | CD-F3                  |
| **Several missed deadlines → the summed amount is what the dealer is told to pay**             | **CD-F4**              |
| A late payment clears an overdue position                                                      | CD-F5                  |
| Back-dated (`asOf`) run judged against that date, not today                                    | CD-F6                  |
| An older stored report still shows the overdue verdict                                         | CD-F7                  |
| Opening carry-forward → "at least N days"                                                      | CD-F8 (see caveat)     |
| Nothing auto-sends on a breach; existing share guards still apply                              | CD-F9                  |
| **A lapsed credit review locks the account (cash and carry, sales officer)**                    | **CD-G1 – CD-G2** (not producible on demand) |
| **No false locks for dealers whose review is still ahead**                                      | **CD-G3**              |
| A back-dated report, and a report from before the release, reach no lock verdict               | CD-G4, CD-G5           |
| Operator observability audit                                                                   | Findings & gaps G1–G20 |

</content>
</invoke>
