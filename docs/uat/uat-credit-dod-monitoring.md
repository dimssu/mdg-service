# UAT — Credit & DOD Monitoring (SDMS capture → review → share)

**Status:** v1 · **Owner:** UAT · **Last updated:** 2026-07-18
**Surface:** `mdg-admin` (ops portal, web) + `mdg-client` / `mdg-app` (dealer chat) ·
**Service:** `credit-dod-monitoring` (backend plugin)

This plan verifies the new **Credit & DOD Monitoring** service end to end: an admin
sets a dealer's IndianOil **SDMS** credentials, attaches the service, runs it, the
backend logs into SDMS (captcha solved by an OCR sidecar), reads the Credit
Monitoring page + PAD statement, computes the **DOD due amount / due date** by FIFO
ledger aging, stores a per-dealer **snapshot**, renders the bilingual **"CREDIT &
DOD MONITORING"** card, and the admin reviews it and presses **Share with dealer**
to post it into the dealer's chat. **Nothing is sent to the dealer automatically.**

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

| Task                                              | Where in the admin                                                                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Set / update / clear SDMS creds                   | **Dealers → open a dealer → Info tab → "IndianOil SDMS (Credit & DOD)" card** (`DealerInfoTab.tsx:165` renders `SdmsCredentialsSection`) |
| Attach the service, set cadence, **Run now**      | **Services tab** (`DealerServicesTab.tsx`; Run now button `:182-195`)                                                                    |
| Review a run, see the card, **Share with dealer** | **Run history tab → click a run row** (`DealerDetailPage.tsx:29,104` → `RunsListInline` → `RunDetail` dialog)                            |
| The per-dealer "sheet" (snapshot history)         | **No dedicated UI.** Backend only: `GET /credit-dod/dealers/:dealerId/snapshots` (`creditDod.ts:53`). See Section D + gap **G8**.        |

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

| Code                       | Phase            | Plain meaning                                            | Operator action                                                                                                                                        |
| -------------------------- | ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BROWSER_LAUNCH_FAILED`    | launch           | Chromium didn't start on the server                      | Server issue — call engineering (Playwright not installed)                                                                                             |
| `LOGIN_PAGE_UNREACHABLE`   | login            | SDMS login page didn't load                              | Retry later; if persistent, SDMS may be down                                                                                                           |
| `LOGIN_CAPTCHA_EXHAUSTED`  | login            | Couldn't sign in within N captcha attempts               | **Ambiguous today** — could be a wrong password, a hard captcha, _or_ the OCR sidecar missing (gap **G4**). Verify the password; then call engineering |
| `DASHBOARD_UNREACHABLE`    | dashboard        | Logged in but dashboard didn't load                      | Retry                                                                                                                                                  |
| `ELEDGER_LINK_MISSING`     | dashboard        | Credit-monitoring / PAD menu links absent for this login | This SDMS account may not have DOD/eledger access — confirm dealer type / entitlements                                                                 |
| `CREDIT_MONITORING_FAILED` | creditMonitoring | Credit page loaded but couldn't be parsed                | Open the failure screenshot; likely an SDMS layout change — call engineering                                                                           |
| `PAD_NAV_FAILED`           | padStatement     | PAD statement page didn't open                           | Retry                                                                                                                                                  |
| `RETRIVEDATA_HTTP`         | padStatement     | Ledger fetch returned a non-200                          | Retry; if persistent, SDMS-side                                                                                                                        |
| `RETRIVEDATA_EMPTY`        | padStatement     | Ledger returned zero rows for the window                 | Widen `padLookbackDays`; or the dealer truly has no ledger activity                                                                                    |

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

### CD-A4 — "Stale" badge when a daily service hasn't run today

- **Persona:** Arjun · **Precondition:** service attached (CD-A3), no run yet today.
- **Steps:** Look at the `credit-dod-monitoring` row.
- **Expected:** A yellow **"stale"** badge with tooltip _"Hasn't run today — click Run
  now to refresh"_ is shown, because a DAILY service with no `lastRunAt` today is
  stale (`DealerServicesTab.tsx:58-64,151-165`). After a successful run it disappears.
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

### CD-C4 — Reconcile mismatch (card shows "does not reconcile")

- **Persona:** Arjun · **How to trigger:** a dealer whose FIFO outstanding does **not**
  equal SDMS's Current Total Receivable (e.g. `padLookbackDays` too short to reach the
  last zero-crossing — see README "PAD window").
- **Steps:** Open the (SUCCESS) run; read the reconcile indicator and the DUE AMOUNT.
- **Expected:** The run still **SUCCEEDS** — reconcile is a _warning_, not a failure
  (`runner.ts:302-307`). The card shows a **red "Does not reconcile (SDMS receivable
  ₹…)"** (`CreditDodReportCard.tsx:164-190`).
- **What the operator needs but doesn't get:** the card is **still fully shareable**
  and there is **no instruction** that a non-reconciling card may have a wrong DUE
  AMOUNT and should be manually reviewed / the look-back widened before sharing
  (README "Limitations"). → gap **G9**.
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

---

## Section D — The "sheet" (per-dealer snapshot history)

### CD-D1 — Snapshot history for a dealer

- **Persona:** Arjun · **Precondition:** at least one successful run exists.
- **Steps (there is no UI — verify via API / `docs/rest.http`):**
  1. `GET /api/v1/credit-dod/dealers/:dealerId/snapshots` (auth required).
- **Expected:** a JSON array of snapshots, **newest first**, each with `capturedAt`,
  `code`, `window`, `currentLimit`, `availedLimit`, `availableLimit`, `dueAmount`,
  `dueDate`, `state`, `reconciles`, `openLots`, and a `shared` object (or `null`)
  (`creditDod.ts:53-65,21-46`). Each run also persists one `CreditDodSnapshot`
  (`index.ts:141-170`).
- **What the operator has today:** **no browsable "sheet" in the admin.** The only way
  to review history is to scroll the **Run history** tab and open each SUCCESS run one
  at a time. → gap **G8**.
- **PASS ☐ FAIL ☐** — notes: **********************\_\_**********************

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

**G8 · There is no "sheet" UI.** The per-dealer snapshot history endpoint exists
(`creditDod.ts:53`) but no admin hook/component consumes it — history is only
reachable by opening SUCCESS runs one at a time. Add a compact snapshot-history table
(date · due · limits · reconciled · shared?) on the dealer, backed by a
`useCreditDodSnapshots(dealerId)` hook.

**G9 · A non-reconciling card is shareable with no warning.** The red "Does not
reconcile" indicator (`CreditDodReportCard.tsx:164-190`) does not gate or annotate
the Share flow, even though the README flags that DUE AMOUNT may be wrong when the
ledger doesn't reconcile. Add a caution to the Share confirm dialog when
`!output.reconciles` ("This card did not reconcile against SDMS — review before
sharing").

**G10 · Share success copy doesn't reflect idempotency.** The toast always says "Card
shared with dealer" even when the backend returned `alreadyShared: true`
(`CreditDodReportCard.tsx:45`, `share.ts:76-82`). Also `alreadyShared` is derived only
from the snapshot query, so a share performed by _another_ admin won't flip the button
to "Shared" until that query refetches. Minor, but worth distinct "Already shared"
messaging and an invalidate-on-focus.

**G11 · No retry from the failure view.** After a failure the operator must close the
dialog, switch to the **Services** tab, and press **Run now**. A "Run again" button in
the failed `RunDetail` would close the loop.

**G12 · Creds form has no "test login" / validity feedback.** You cannot tell if a
username/password pair is valid until a full run fails hours later. A lightweight
"Test credentials" action (login-only, no capture) would catch typos at entry time and
remove the biggest source of `LOGIN_CAPTCHA_EXHAUSTED` false alarms.

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
| The sheet (snapshot history)                                                                   | CD-D1                  |
| Operator observability audit                                                                   | Findings & gaps G1–G12 |

</content>
</invoke>
