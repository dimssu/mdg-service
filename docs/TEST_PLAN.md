# Dealer Kavach - 10-minute manual smoke test

> ## STOP: your laptop's `mdg-backend/.env` may point at the PRODUCTION database
>
> **Never run `seed`, `seed --reset`, or any script with `--commit` against it.**
>
> - Since 15 Oct 2026 `seed` and `seed --reset` refuse any `MONGODB_URI` that is not on this machine, whatever `NODE_ENV` says (`mdg-backend/src/seed/resetGuard.ts`). Before that the only guard checked `NODE_ENV === 'production'`, and the laptop's `.env` says `development` while pointing at the live database, so `--reset` there would have emptied the live Admins, Dealers, Users, Conversations and Messages and more. The guard reads the address, not the destination: an SSH tunnel that brings production to `localhost` passes it. Never set `SEED_ALLOW_REMOTE_RESET=1` to get past a refusal you did not expect.
> - A plain `npm run dev` with that `.env` is wired to the live database, and its `PUSH_ENABLED` is `true`, so a reply in a live chat would send a real push. On 15 Oct 2026 the `.env` already had `SCHEDULER_ENABLED=false`, but the default is `true` and fires real jobs at live dealers, so set both `SCHEDULER_ENABLED=false` and `PUSH_ENABLED=false` yourself.
> - A script that reaches its `--commit` has done it. "I expect it to be refused" is not a safeguard.
>
> **Run everything below on the throwaway stack.** A variable set in your shell beats the `.env` file, so the stack works by setting `MONGODB_URI` in the shell first. Step 0 proves it before you seed.
>
> The TT Density pass further down is different on purpose: it uses the admin portal and the live API with a real dealer, and it never runs a seed, a reset or a `--commit` script.

Goal: in ten minutes, prove that a fresh checkout boots and the happy-path flows work end-to-end. This is the test a human runs before cutting a release; the automated suites under `mdg-backend/src/**/*.test.ts` and `mdg-backend/test` cover the corners.

A second pass, **TT Density**, follows the sign-off checklist below. It is deliberately not part of the ten minutes: it needs a real dealer, the real IndianOil portal and a phone in someone's hand.

## Known break (15 Oct 2026)

`seed` stops at the first sample dealer with `Dealer validation failed: code: Path code is required`. The sample dealers still in onboarding have no code and the Dealer model now requires one. The admin account is written first (the log shows `Seeded admin`), so login works. The sample dealers, services and runs are never created, so `scripts/verify-seed.ts` fails on the dealer count. The steps below create their own dealer and do not depend on the sample data. Delete this section when the seed is fixed.

## Pre-requisites

- Node 20+, and `npm install` has run from the repo root. No Docker is needed.
- Three terminals, all at the repo root. **A** runs the throwaway database. **B** seeds and runs the backend; the variables you export there are what keep production safe. **C** runs the `curl` checks.
- Default admin credentials, written by the seed: `admin@dealerkavach.local` / `Admin@12345`

## 0. Start a throwaway database and point the backend at it (≤2 min)

Terminal A: start an in-memory Mongo. It keeps nothing; stop it and it is gone.

```
node --input-type=module -e "
import { MongoMemoryServer } from 'mongodb-memory-server';
const m = await MongoMemoryServer.create({ instance: { port: 27099, ip: '127.0.0.1', dbName: 'dk_smoke' } });
console.log('mongo up', m.getUri());
setInterval(() => {}, 1000);
"
```

Expected: `mongo up mongodb://127.0.0.1:27099/`. The first run may download a Mongo binary.

Terminal B:

```
export MONGODB_URI='mongodb://127.0.0.1:27099/dk_smoke'
export PORT=4000 SCHEDULER_ENABLED=false PUSH_ENABLED=false ASSIST_ENABLED=false
```

**Prove it before you seed.** This prints the host the backend will connect to and nothing else:

```
cat > "$TMPDIR/whichdb.mts" <<EOF
import { env } from "$PWD/mdg-backend/src/config/env.ts";
console.log("database host:", new URL(env.MONGODB_URI).host);
EOF
npx tsx "$TMPDIR/whichdb.mts"; rm "$TMPDIR/whichdb.mts"
```

Expected: `database host: 127.0.0.1:27099`. Anything else: stop. Do not seed.

## 1. Seed the throwaway database (≤1 min)

Terminal B:

```
npm --workspace mdg-backend run seed -- --reset
```

Expected: `Plugin registered` for nine plugins (`Service registry initialised`, `count: 9`), `Dropping seeded collections`, `Seeded admin`. Then the run stops with the known break above. Carry on.

## 2. Start the backend (≤1 min)

Terminal B:

```
npm --workspace mdg-backend run dev
```

Expected: `API listening` on port 4000, and a warning that `SCHEDULER_ENABLED=false` so no scheduled service runs will start. Check what the running process was given:

```
ps eww -p $(lsof -iTCP:4000 -sTCP:LISTEN -t) | tr ' ' '\n' | grep '^MONGODB_URI='
```

Expected: the `127.0.0.1:27099` address. Anything else: stop the backend.

Terminal C, sanity-check health:

```
curl -s http://localhost:4000/health
```

Expected response: `{"ok":true,"data":{"status":"ok"}}`.

## 3. Log in (≤1 min)

Either open `docs/rest.http` in VS Code and run the "Login" request, or curl directly:

```
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@dealerkavach.local","password":"Admin@12345"}'
```

Expected: `ok:true` with a `data.token` string and a `data.user` profile (no `passwordHash`).

## 4. Inspect the overview counters (≤1 min)

Using the token from step 3:

```
curl -s http://localhost:4000/api/v1/overview \
  -H "authorization: Bearer $TOKEN"
```

Expected: `ok:true`, with `dealers`, `services`, `runs` and `recentRuns`. `services.pluginCount` is `9`. `dealers.total` is already `1`: the backend adds one dealer of its own on first start (`DEMO`, the app-store reviewer's login). (The admin's "Today" screen reads a different route, `/overview/day`.)

## 5. Create a dealer (≤1 min)

A dealer is its code. The code is one to four digits and one to three letters, like `15E`.

```
curl -s -X POST http://localhost:4000/api/v1/dealers \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"code":"99S"}'
```

Expected: 201, `data.code='99S'`, `data.status='ONBOARDING'`, and the onboarding's current step is `collect-phone`. Capture `data.id` as `DEALER_ID`.

## 6. Attach a service (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealers/$DEALER_ID/services \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"serviceId":"custom-request","config":{"requestType":"manual-audit","payload":{"ticketId":"T-SMOKE"}}}'
```

Expected: 201 with `cadence='ON_DEMAND'`, `schedule='@on-demand'` and no `nextRunAt`. Capture `data.id` as `DS_ID`.

## 7. Run now (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealer-services/$DS_ID/run-now \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{}'
```

Expected: 202 with `data.runId`. Then `GET /api/v1/runs/$RUN_ID` should show `status='SUCCESS'` and a non-null `output`.

## 8. Verify in the run history (≤1 min)

```
curl -s "http://localhost:4000/api/v1/runs?dealerId=$DEALER_ID" \
  -H "authorization: Bearer $TOKEN"
```

Expected: `data.total ≥ 1`, with the run from step 7 at the top of `items`.

## 9. Archive is for super-admins only (≤1 min)

`DELETE` on a dealer archives it. It does not delete it, and only a super-admin may do it. The seeded admin is an ordinary admin.

```
curl -s -X DELETE http://localhost:4000/api/v1/dealers/$DEALER_ID \
  -H "authorization: Bearer $TOKEN"
```

Expected: 403, `Super-admin access required`. Then `GET /dealers/$DEALER_ID` still returns 200. (When a super-admin does archive a dealer, its status becomes `SUSPENDED`, `archivedAt` is set and its attached services turn `PAUSED`.)

## 10. Clean up

Press Ctrl+C in the backend terminal and in the Mongo terminal. Nothing was written anywhere else.

## Optional automated check

`scripts/verify-seed.ts` expects a fully seeded server: at least 5 dealers, 5 plugins, one dealer with services and one run. From the repo root:

```
API_BASE=http://localhost:4000/api/v1 npx tsx scripts/verify-seed.ts
```

Expected once the seed is fixed: `[verify-seed] OK` and exit code 0. Today it prints `plugins: 9` and then `FAIL: expected ≥5 dealers` (see the known break).

## Sign-off checklist

- [ ] `ps` shows the backend is on `127.0.0.1:27099`, not on any other database
- [ ] Seed registers all nine plugins (and, once the break is fixed, finishes with `Seed complete`)
- [ ] Backend listens on port 4000 with a passing `/health`
- [ ] Login returns a JWT and a user profile (no password hash)
- [ ] Overview counters have the documented shape and `pluginCount` is 9
- [ ] Dealer creation with a code returns `ONBOARDING`
- [ ] Service attachment computes `schedule` and `nextRunAt`
- [ ] `run-now` produces a `SUCCESS` `ServiceRun`
- [ ] Run history shows the new run at the top
- [ ] Archive is refused (403) for an ordinary admin and the dealer is still there
- [ ] `verify-seed.ts` exits 0 (blocked until the seed is fixed)

---

# TT Density - the manual pass

Goal: prove by looking the five things no automated test can prove. That the service
never touched IndianOil's write controls. That a dealer can mark a day from their own
phone, in the chat. That an admin marking a day on the dealer's behalf says so, on both screens.
That an invoice can be read without a file landing in Downloads. And that one tanker
seen seven times is still one row.

This pass runs against a **real dealer with real SDMS credentials** - normally
production, `https://api.mdgservices.in` - because step T1 is a look at IndianOil's
own screen and there is no other portal to look at. Budget an hour, in this order:
T1 has to see the portal before the run, and T2 has to run the service a second time.

This pass uses the admin portal, the live API and a phone. It never runs a seed, a reset or a
`--commit` script, and it needs nothing from the laptop's `.env`.

Nothing in this pass writes to the portal. If any step tempts you to press Check,
Acknowledge or a Vehicle Condition dropdown, stop: acknowledging a receipt is a legal
statement by the dealer that they inspected and accepted the tanker.

## Pre-requisites

- A super-admin login for the admin portal. Ordinary admins cannot see a run's
  diagnostic screenshots, and T1 needs them.
- The dealer's own IndianOil e-Mitra login, and the dealer's permission to sign in
  with it.
- A phone signed in to the dealer app as that dealer's manager (the register ask goes to
  the manager's group chat when the outlet has a manager, and to the owners' own chats
  when it has not), and the outlet's paper density register within reach of a camera.
- TT Density is active on the outlet and it is after 09:00 IST. At 09:00 IST MDG posts an
  ask in the chat for **yesterday's** register page, and only while that day is not yet
  received. An ask still open from the last seven days also works.
- A photo on your laptop to stand in for a register page in T5.
- Four shell variables for the curl checks. `DEALER_ID` is the 24-character id in the
  address bar on the dealer's page (T0); `INVOICE_ID` comes out of the invoice list in
  T2; `TOKEN` is yours and `DEALER_TOKEN` is the dealer's own app login, which is the
  same `/auth/login` endpoint:

```
TOKEN=$(curl -s -X POST https://api.mdgservices.in/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"you@mdgservices.in","password":"..."}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

DEALER_TOKEN=$(curl -s -X POST https://api.mdgservices.in/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"owner@thedealer.example","password":"..."}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
```

## T0. The dealer, and the service on it (5 min)

1. Admin portal, **Dealers** -> the outlet (15E is the one to use first). The 24-character
   id in the address bar is `DEALER_ID` for every curl below.
2. **Services** tab. If **TT Density** is not listed: _Attach service_ -> TT Density ->
   leave every field on its default (an empty config is valid) -> Attach.
   Expected: cadence `DAILY`, schedule `35 7 * * *`.
3. **Info** tab -> the **IndianOil SDMS (Credit & DOD)** card: the dealer's SDMS
   username and password are saved there. Without them the run stops with
   `SDMS_CREDENTIALS_MISSING` before a browser starts.
4. Edit the service and switch **"Keep a screenshot of every step"** on for this pass.
   T1 reads those screenshots. **Switch it off again at the end.**

## T1. The read-only fence, checked by eye on the portal (20 min)

### Before the run

1. In your own browser, sign in to IndianOil's SDMS portal (it has lived at
   `utkarsh.indianoil.co.in` since 10 Oct 2026) with the dealer's SDMS login and open
   **TT Acknowledgement ▸ Download Invoice**. Leave the pre-filled seven-day window
   alone and press **Fetch**.
2. Screenshot the whole table. For every row write down: the SAP invoice number, what
   the **Vehicle Condition** cell shows (it should read _Select_), and whether the row
   shows as acknowledged.
3. Sign out and close the tab, so your session and the run's cannot collide.

### The run

4. Admin portal -> the dealer -> **Data Vault** -> **TT Density**
   (`/dealers/<DEALER_ID>?tab=data-vault&vault=tt-density`). Press **Fetch invoices now**.

Expected: `Fetch queued — the portal takes about a minute. This pane refreshes when it
lands.` Wait for the pane to refresh; its header line becomes `N invoices · last fetched
<today's date and time>`.

### After the run

5. Sign back into e-Mitra, same screen, same window, press Fetch, and compare against
   your screenshot row by row:
   - every **Vehicle Condition** cell still reads _Select_;
   - no row that was un-acknowledged before shows as acknowledged now;
   - the set of rows is the same.
6. That shows nothing changed. Now show the buttons were never pressed. Dealer -> the
   `...` menu -> **Run history** -> the newest `tt-density` run -> its artifacts. Flip
   through every screenshot and confirm that none of them shows a Vehicle Condition
   dropdown open, an acknowledgement-status popup, or an Acknowledge confirmation.
   The run's steps are `launch`, `login`, `navHome`, `openMenu`, `downloadInvoice`,
   `setDates`, `fetch`, `readTable`, and then one `row:<invoice no>` per download.
   There is no step that reaches those three columns, and no setting that can add one.

**If any of the three comparisons in step 5 differ, stop the pass and report it. Do not
run the service again.**

## T2. One tanker, seven sightings, one row (10 min)

The portal's filter is a seven-day window and we re-read the whole week every morning,
so a Tuesday invoice is listed again on Wednesday, Thursday, and on to the following
Monday. Identity is the SAP invoice number, per dealer - not the vehicle, not the date.

1. In the TT Density pane, write down the header count (`N invoices`) and the SAP
   numbers in the invoice list.
2. Press **Fetch invoices now** a second time and wait for the pane to refresh.
3. Expected: the same count, the same SAP numbers, no number listed twice, no new rows.
   The only things that moved are the "last fetched" time and, inside the run, the
   already-held tally.
4. Run history -> the newest run -> its output: `rowsListed` is what it was on the first
   run and `downloaded` is **0**.
5. The file was not fetched a second time either. List the invoices, take the `id` of
   the first one as `INVOICE_ID`, and read it in full - before the second fetch and
   again after:

```
curl -s "https://api.mdgservices.in/api/v1/tt-density/dealers/$DEALER_ID/invoices?pageSize=5" \
  -H "authorization: Bearer $TOKEN"

curl -s "https://api.mdgservices.in/api/v1/tt-density/dealers/$DEALER_ID/invoices/$INVOICE_ID" \
  -H "authorization: Bearer $TOKEN"
```

Expected: the list's `total` is unchanged and `pdfCapturedAt` is the same instant it
was before. The only field that moved is `sightings`, up by one - which is the point:
we saw the invoice again, we did not fetch it again.

## T3. An invoice read inline, with the Downloads folder watched (10 min)

The owner asked for viewing without downloading, and the only honest test of that is
looking in the folder.

1. **Before you click anything**, count what is in Downloads and keep the number:

```
ls ~/Downloads | wc -l
```

2. In the invoice list, press **View invoice** on a row that has a density on it. A
   drawer opens from the right: the extracted figures are chips across the top, the PDF
   itself renders in the frame below them.
3. Read one product's figure off the chip and the same product's figure off the PDF in
   the frame. They must agree digit for digit, trailing zeros included - `820.500`,
   never `820.5`.
4. Close the drawer. You are back in the invoice list, in the same place. Count Downloads
   again:

```
ls ~/Downloads | wc -l
```

**Expected: exactly the same number. Nothing was written to disk.**

5. Now press **Download** in the drawer footer. `invoice-<SAP number>.pdf` appears in
   Downloads and the count goes up by one. That button, and only that button, saves a file.
6. Narrow the browser window below 768px and open the drawer again. The frame is not
   rendered at all at that width and the figures plus a download control are shown
   instead. That is deliberate: a hidden frame would still fetch the file.
7. The two URLs behind those two behaviours, if you want to see them (`INVOICE_ID` is
   the `id` of the row you opened, from the list request in T2):

```
curl -s "https://api.mdgservices.in/api/v1/tt-density/dealers/$DEALER_ID/invoices/$INVOICE_ID/pdf-url" \
  -H "authorization: Bearer $TOKEN"
```

Expected: `viewUrl` and `downloadUrl` point at the same object and differ only in the
disposition they ask for.

## T4. The dealer marks a day, from the chat (10 min)

Run this on the phone, in the dealer's hands if possible, and say nothing while they do it.
There is no density screen and no pinned card any more (ADR 0019): MDG asks in the chat and
the dealer answers there.

1. Open the app and the manager's chat. A message from MDG asks for the density register
   page (`डेंसिटी रजिस्टर का पन्ना` in Hindi) and names the day. It carries a
   **फ़ोटो भेजें** button (**Send photo** if the app is set to English).
2. Tap the button. The camera opens inside the tap. Photograph the register page.
3. The picture goes through the ordinary send preview. Go back and re-shoot once - nothing
   may be uploaded until Send.
4. Send. Expected: the picture appears with a sending clock, then sent; the ask flips to
   **Received** on its own; and MDG posts "✓ Received" under the photo. Nobody at MDG had to
   press anything: the register page is the one request that is received automatically.
5. Check what did **not** happen: no keyboard appeared, and nobody was asked to type a
   density, a volume, a date or a note.
6. Back in the admin pane's calendar, that day's cell is green with **no** blue ring, and
   the day panel reads _Sent by the dealer_, with the time.

## T5. An admin marks a day for the dealer, and it says so (10 min)

1. In the calendar, pick a **past** day that is drawn dashed (not marked) and is inside
   the last 60 days. The panel says "No photo for this day".
2. Press **Upload on the dealer's behalf**.
3. Read the dialog title before you do anything else: it names the day in words -
   `Upload register photo — Sat, 23 Aug 2026`. That is the guard against filling in the
   wrong day.
4. Confirm the line above the submit button is present and cannot be dismissed:
   **"This will be recorded as uploaded by you, not by the dealer."** The Note box is
   optional ("Why this day was filed by MDG").
5. Choose the photo and submit. Expected: `Register photo saved for 23 Aug`; the cell
   turns green **with a blue ring and a dot**; the day panel reads _Added by <your name>
   (MDG)_ and carries an **Added by MDG** badge.
6. On the phone, if the chat still holds an ask for that day, it now reads **Received**:
   a day counts as received however it was filed.
7. The audit row: **Activity** (super-admin) -> set Actor to yourself and the date to
   today. Expected: a `TT_REGISTER_PHOTO_UPLOAD` row naming the dealer and the day. It is
   also in the Action dropdown now.

## T6. The four refusals, one request each (5 min)

Each of these should be refused, and the message matters as much as the code.

1. A dealer cannot reach back further than a week. With the **dealer's** token, for a
   day ten days ago (change the date to ten days before whatever today is):

```
curl -s -X POST "https://api.mdgservices.in/api/v1/tt-density/me/days/2026-08-14/photo" \
  -H "authorization: Bearer $DEALER_TOKEN" -H 'content-type: application/json' \
  -d '{"storageKey":"tt-density/'$DEALER_ID'/register/x.jpg","filename":"x.jpg","contentType":"image/jpeg","size":1000}'
```

Expected: 400, _"That day is more than 7 days ago. Ask MDG to add it for you."_ In the
chat, an ask for a day that old reads closed, with no Send photo button: the app never
offers a day the server refuses.

These `/tt-density/me/...` routes are kept for an older installed app. The current app does
not call them; it files through the chat, which runs the same checks.

2. A dealer cannot read invoices:

```
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://api.mdgservices.in/api/v1/tt-density/dealers/$DEALER_ID/summary" \
  -H "authorization: Bearer $DEALER_TOKEN"
```

Expected: `403`.

3. A photo cannot be filed under someone else's prefix. Repeat request 1 for **today**,
   with `storageKey` starting `tt-density/<a different dealer's id>/register/`.
   Expected: 400.

4. A day that has not happened cannot be marked. Repeat request 1 for tomorrow's date.
   Expected: 400, _"Cannot mark a day that has not happened yet"_.

## After the pass

- Switch **"Keep a screenshot of every step"** back off on the dealer's TT Density service.
- There is nothing to clean up, and no delete button to look for. A day's photo can only
  be replaced, never removed, and the one it replaces is kept beside it: an erasable
  compliance mark proves nothing. If the stand-in photo from T5 bothers you, upload the
  real register page for that day over the top of it.

## Sign-off checklist

- [ ] The service is attached with defaults and the dealer has SDMS credentials saved
- [ ] Every Vehicle Condition cell still reads "Select" after the run
- [ ] No invoice's acknowledgement state changed
- [ ] No run screenshot shows a Vehicle Condition dropdown, a Check result or an Acknowledge dialog
- [ ] Two runs on the same day produced the same invoice count and the same SAP numbers
- [ ] The second run downloaded nothing and left `pdfCapturedAt` alone
- [ ] Downloads folder unchanged after reading an invoice inline
- [ ] Downloads folder gained exactly one file after pressing Download
- [ ] Every density chip matched the PDF beside it, trailing zeros included
- [ ] A dealer answered the morning ask from the chat with no keyboard and no typing
- [ ] The ask flipped to Received on its own, with MDG's "✓ Received" under the photo
- [ ] That day shows as "Sent by the dealer" in the admin calendar
- [ ] An admin-uploaded day is ringed and badged "Added by MDG", and the chat ask for that day reads Received
- [ ] The audit trail has the admin's upload
- [ ] All four refusals in T6 were refused, with the wording above
- [ ] "Keep a screenshot of every step" is switched off again
