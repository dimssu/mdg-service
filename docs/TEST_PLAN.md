# Dealer Kavach - 10-minute manual smoke test

Goal: in ten minutes, prove that a fresh checkout boots and the happy-path flows work end-to-end. This is the test a human runs before cutting a release; the automated suites under `backend/test` and `backend/src/**/*.test.ts` cover the corners.

A second pass, **TT Density**, follows the sign-off checklist below. It is deliberately not part of the ten minutes: it needs a real dealer, the real IndianOil portal and a phone in someone's hand.

## Pre-requisites

- Node 20+ and Docker installed
- Repo checked out and `npm install` has run from the repo root
- `backend/.env` exists (copy from `backend/.env.example`)
- Default admin credentials: `admin@dealerkavach.local` / `Admin@12345`

## 0. Start dependencies (≤1 min)

1. From repo root: `docker compose up -d mongo`
2. Confirm container is healthy: `docker ps | grep mongo`

Expected: a running `mongo` container with the host port mapped.

## 1. Seed the database (≤1 min)

```
npm --workspace @dk/backend run seed -- --reset
```

Expected: log lines `Seeded admin`, plugin registrations for the five plugins, and `Seed complete` with exit code 0.

## 2. Start the backend (≤1 min)

```
npm --workspace @dk/backend run dev
```

Expected: `API listening` on port 4000, `scheduler started (every minute)`.

In a separate terminal, sanity-check health:

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

Expected: `ok:true` with a `data.token` string and `data.admin` profile (no `passwordHash`).

## 4. Inspect the overview dashboard (≤1 min)

Using the token from step 3:

```
curl -s http://localhost:4000/api/v1/overview \
  -H "authorization: Bearer $TOKEN"
```

Expected: `dealers.total ≥ 5`, `services.pluginCount ≥ 5`, `services.attached ≥ 1`, `runs.last24h ≥ 1`, `recentRuns` non-empty.

## 5. Create a dealer (stage 1) (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealers \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Smoke Test Petrol","ownerContact":{"name":"Smoke Owner","phone":"+91-9000000123","email":"smoke@example.com"},"pumpLocation":{"address":"Test Road","lat":12.97,"lng":77.59},"gst":"29ZZTEST0099Z1Z9","pan":"ZTEST0099Z"}'
```

Expected: 201, `data.status='PENDING_DETAILS'`. Capture `data.id` as `DEALER_ID`.

## 6. Complete stage 2 (≤1 min)

```
curl -s -X PATCH http://localhost:4000/api/v1/dealers/$DEALER_ID \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"bankDetails":{"accountHolder":"Smoke Test Petrol","accountNumber":"123456789012","ifsc":"HDFC0000123","bankName":"HDFC Bank"},"complianceDocs":[{"label":"GST","url":"https://example.com/gst.pdf"}],"slaTier":"SILVER"}'
```

Expected: 200, `data.status='ACTIVE'` (auto-promotion).

## 7. Attach a service (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealers/$DEALER_ID/services \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"serviceId":"custom-request","config":{"requestType":"manual-audit","payload":{"ticketId":"T-SMOKE"}}}'
```

Expected: 201 with `cadence='ON_DEMAND'`, `schedule='@on-demand'`, `nextRunAt` null. Capture `data.id` as `DS_ID`.

## 8. Run now (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealer-services/$DS_ID/run-now \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{}'
```

Expected: 202 with `data.runId`. Then `GET /api/v1/runs/$RUN_ID` should show `status='SUCCESS'` and a non-null `output`.

## 9. Verify in the run history (≤1 min)

```
curl -s "http://localhost:4000/api/v1/runs?dealerId=$DEALER_ID" \
  -H "authorization: Bearer $TOKEN"
```

Expected: `data.total ≥ 1`, with the run from step 8 at the top of `items`.

## 10. Cleanup (≤1 min)

```
curl -s -X DELETE http://localhost:4000/api/v1/dealers/$DEALER_ID \
  -H "authorization: Bearer $TOKEN"
```

Expected: 200. Then re-running `GET /dealers/$DEALER_ID` should return 404 and `GET /dealer-services` for the dealer should return zero rows (cascade deletion).

## Optional automated check

After completing the manual path above (or skipping straight to it on a freshly seeded server):

```
npx tsx scripts/verify-seed.ts
```

Expected: `[verify-seed] OK` and exit code 0.

## Sign-off checklist

- [ ] Mongo container is healthy
- [ ] Seed completes without errors and registers all five plugins
- [ ] Backend listens on port 4000 with a passing `/health`
- [ ] Login returns a JWT and admin profile (no password hash)
- [ ] Overview snapshot has the documented shape with non-negative counters
- [ ] Stage-1 dealer creation returns `PENDING_DETAILS`
- [ ] Stage-2 patch auto-promotes status to `ACTIVE`
- [ ] Service attachment computes `schedule` and `nextRunAt`
- [ ] `run-now` produces a `SUCCESS` `ServiceRun`
- [ ] Run history shows the new run at the top
- [ ] Dealer delete cascades to its `DealerService` rows
- [ ] `verify-seed.ts` exits 0

---

# TT Density - the manual pass

Goal: prove by looking the five things no automated test can prove. That the service
never touched IndianOil's write controls. That a dealer can mark a day from their own
phone. That an admin marking a day on the dealer's behalf says so, on both screens.
That an invoice can be read without a file landing in Downloads. And that one tanker
seen seven times is still one row.

This pass runs against a **real dealer with real SDMS credentials** - normally
production, `https://api.mdgservices.in` - because step T1 is a look at IndianOil's
own screen and there is no other portal to look at. Budget an hour, in this order:
T1 has to see the portal before the run, and T2 has to run the service a second time.

Nothing in this pass writes to the portal. If any step tempts you to press Check,
Acknowledge or a Vehicle Condition dropdown, stop: acknowledging a receipt is a legal
statement by the dealer that they inspected and accepted the tanker.

## Pre-requisites

- A super-admin login for the admin portal. Ordinary admins cannot see a run's
  diagnostic screenshots, and T1 needs them.
- The dealer's own IndianOil e-Mitra login, and the dealer's permission to sign in
  with it.
- A phone signed in to the dealer app as that dealer's owner or manager, and the
  outlet's paper density register within reach of a camera.
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

1. In your own browser, sign in to e-Mitra with the dealer's SDMS login and open
   **TT Acknowledgement ▸ Download Invoice**. Leave the pre-filled seven-day window
   alone and press **Fetch**.
2. Screenshot the whole table. For every row write down: the SAP invoice number, what
   the **Vehicle Condition** cell shows (it should read _Select_), and whether the row
   shows as acknowledged.
3. Sign out and close the tab, so your session and the run's cannot collide.

### The run

4. Admin portal -> the dealer -> **Data Vault** -> **TT Density**
   (`/dealers/<DEALER_ID>?tab=data-vault&vault=tt-density`). Press **Fetch invoices now**.

Expected: `Fetch queued - the portal takes about a minute. This pane refreshes when it
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

## T4. The dealer marks a day, from a phone (10 min)

Run this on the phone, in the dealer's hands if possible, and say nothing while they do it.

1. Open the app. On the chat list - the app's home - a card is pinned at the top:
   **Today's register photo**, with today's date under it. (If today is already marked
   the card is gone; use a day inside the last seven that is still open, from the week
   strip on the density screen.)
2. Tap **Take photo**. The rear camera opens straight away. Photograph the register page.
3. The preview sheet appears with **Yes, send this** and **Take again**. Tap _Take again_
   once and re-shoot - nothing may be uploaded until Send.
4. Tap **Yes, send this**. Expected: the button reads "Sending your photo…", the sheet
   closes, the day turns to done, that day's cell in the week strip turns green, and the
   pinned card disappears from the chat list.
5. Check what did **not** happen: no keyboard appeared, and nobody was asked to type a
   density, a volume, a date or a note.
6. Back in the admin pane's calendar, that day's cell is green with **no** blue ring, and
   the day panel reads _Sent by the dealer_, with the time.

## T5. An admin marks a day for the dealer, and it says so (10 min)

1. In the calendar, pick a **past** day that is drawn dashed (not marked) and is inside
   the last 60 days. The panel says "No photo for this day".
2. Press **Upload on the dealer's behalf**.
3. Read the dialog title before you do anything else: it names the day in words -
   `Upload register photo - Sat, 23 Aug 2026`. That is the guard against filling in the
   wrong day.
4. Confirm the line above the submit button is present and cannot be dismissed:
   **"This will be recorded as uploaded by you, not by the dealer."**
5. Choose the photo and submit. Expected: `Register photo saved for 23 Aug`; the cell
   turns green **with a blue ring and a dot**; the day panel reads _Added by <your name>
   (MDG)_ and carries an **Added by MDG** badge.
6. On the phone, refresh the density screen. That day shows as done, and tapping it says
   **"MDG team added this photo" / "यह फोटो MDG टीम ने डाली है"**. There is no Replace
   button on it - an MDG correction is not the dealer's to fix.
7. The audit row: **Activity** (super-admin) -> set Actor to yourself and the date to
   today. Expected: a `TT_REGISTER_PHOTO_UPLOAD` row naming the dealer and the day.
   Filter by Actor and date, not by Action: the Action dropdown is built from the
   audit-action list in `shared`, which does not carry the TT Density actions yet.

## T6. The four refusals, one request each (5 min)

Each of these should be refused, and the message matters as much as the code.

1. A dealer cannot reach back further than a week. With the **dealer's** token, for a
   day ten days ago (change the date to ten days before whatever today is):

```
curl -s -X POST "https://api.mdgservices.in/api/v1/tt-density/me/days/2026-08-14/photo" \
  -H "authorization: Bearer $DEALER_TOKEN" -H 'content-type: application/json' \
  -d '{"storageKey":"tt-density/'$DEALER_ID'/register/x.jpg","filename":"x.jpg","contentType":"image/jpeg","size":1000}'
```

Expected: 400, _"That day is more than 7 days ago. Ask MDG to add it for you."_ And on
the phone, that day is not in the week strip at all - the screen never offers a day the
server refuses.

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
- [ ] A dealer marked a day from a phone with no keyboard and no typing
- [ ] That day shows as "Sent by the dealer" in the admin calendar
- [ ] An admin-uploaded day is ringed, badged "Added by MDG", and says so on the dealer's phone too
- [ ] The audit trail has the admin's upload
- [ ] All four refusals in T6 were refused, with the wording above
- [ ] "Keep a screenshot of every step" is switched off again
