# PRD — TT Density (`tt-density`)

**Status:** Draft for build (PM-decisive)
**Owner:** Product
**Audience:** Backend (SDMS automation + plugin), admin UX, client UX, QA
**Surfaces:** `mdg-admin` (operator, desktop, English) and `mdg-client` / `mdg-app` (dealer, phone, Hindi-first)
**Portal screens:** IndianOil e-Mitra ▸ **TT Acknowledgement / Download Invoice**
**Related:** `docs/PRD.md` §3 (personas), §9 (adoption & anti-intimidation) ·
`docs/product/iras-data-editing.md` §1 (the operator) ·
`docs/ADDING_A_SERVICE.md` · `docs/ADR/0002-service-plugin-contract.md` ·
`shared/src/dsr/products.ts` (the "an unknown code is not an error" rule) ·
`mdg-backend/src/services/water-ingress-testing/README.md` (the read-only-portal precedent)

> **Amended 2026-08-24 by `docs/specs/tt-density-contract.md`.** That document is
> the build contract and it wins any conflict with this one. Where this PRD has
> been corrected the paragraph says so inline and names the contract section; the
> full list of what changed and why is `tt-density-contract.md` §13. Nine things
> moved: the dealer's back-date window (7 days, not yesterday-only), the admin's
> (60 days, not 90), the manual back-fill (a lookback, not a From/To range), the
> failure-code names, the unreadable-PDF state's name, the daily reminder push,
> photo rejection, the cross-dealer screen and the re-issued-invoice rule. The
> acceptance criteria that were not amended are unchanged and are the QA script.

> **Name.** `tt-density` is an internal service slug; TT = tank truck. Nothing about it is
> published. The dealer-facing name is **Tanker Density / टैंकर डेंसिटी**, and the daily photo
> is the **Density register photo / डेंसिटी रजिस्टर फोटो**. No trademark or package-name
> check is warranted for an internal slug; the dealer-facing words are ordinary trade terms.

---

## 0. One paragraph, in words a dealer would use

Every time a tanker delivers fuel to your pump, IndianOil issues an invoice, and printed
inside that invoice is one number per product: **Density@15**. That is the density of what
was actually loaded for you, corrected to 15°C, and it is the figure you have to copy into
your density register. Today the only way to see it is to log into the portal, set the
dates, press Fetch, download the PDF, and hunt for the line. **This service does that for
you, every day, on its own.** Open the app and the last tanker's density figures are the
first thing on the screen, in big type — 820.500 for diesel, 727.300 for petrol. Then, once
a day, you take one photo of your density register page and tap send. That is the whole
job. Nothing is ever submitted to IndianOil on your behalf: we only read.

---

## 1. The problem

### 1.1 Why a dealer cares about Density@15

The density register is the book an inspector asks for. For every tanker the outlet records
what the invoice says the product's density was and what the outlet's own dip test found.
That pair is the outlet's proof that what was ordered is what arrived — a real discrepancy
is how short delivery or contamination shows up, and an empty or back-filled register is a
finding in its own right.

So the invoice density is not a nice-to-have figure. It is a number the dealer **must have,
on the day, per product, per tanker**, and must not get wrong when copying it.

### 1.2 What getting it costs today

One tanker, one dealer, start to finish. Every row is a thing a human does:

| #   | Step                                               | Notes                                                    |
| --- | -------------------------------------------------- | -------------------------------------------------------- |
| 1   | Open a browser, go to the SDMS portal              |                                                          |
| 2   | Type the username                                  |                                                          |
| 3   | Type the password                                  |                                                          |
| 4   | Read and answer the arithmetic question            | The portal replaced its image captcha with a sum in 2026 |
| 5   | Press Login, wait for the SSO handoff              | The slowest step; often has to be retried                |
| 6   | Open e-Mitra                                       |                                                          |
| 7   | Click the **TT Acknowledgement** tile              |                                                          |
| 8   | Check / set **From Date** and **To Date**          | Defaults to the last 7 days                              |
| 9   | Press **Fetch**                                    |                                                          |
| 10  | Find the tanker's row in the Invoice Details table | By SAP invoice number or vehicle number                  |
| 11  | Press **Download**                                 | A PDF lands in the Downloads folder                      |
| 12  | Open the PDF                                       | On a phone this means a file manager                     |
| 13  | Scroll past the header block to the item lines     | The density is mid-page, not at the top                  |
| 14  | Read `Density@15` for the diesel line              | e.g. **820.500**                                         |
| 15  | Read `Density@15` for the petrol line              | e.g. **727.300**                                         |
| 16  | Copy both into the paper register, by hand         | The step where a digit gets transposed                   |

**Roughly 15 actions and 3–5 minutes per tanker.** That is an estimate read off the portal
screens, not a stopwatch measurement — we have not timed a dealer doing it.

**How often.** The one real 7-day window we have observed (17/08/2026 → 24/08/2026, one
outlet) held **two invoices**: `7010045406` on 22-08-2026 (vehicle BR09GC8009) and
`7009874468` on 17-08-2026 (vehicle BR09GC4786). At that rate an outlet sees roughly
**8–9 tankers a month**, each carrying **two product lines**, so about **17 density figures
a month, per outlet, copied by hand**. Across the eight outlets on the platform that is
about 140 figures a month and roughly 4½ hours of somebody's evening — derived from one
observed week, so treat it as an order of magnitude, not a measurement.

And the cost never ends. There is no version of this where the dealer does it once and is
finished; it recurs for every tanker for as long as the pump trades.

### 1.3 The second half of the problem — the register itself

Having the number is not the same as having recorded it. The register is a paper book, and
the only evidence that today's page was written is the page. MDG cannot verify a paper book
from a server, but it can hold the daily proof: **one photograph of the register page, per
outlet, per day**. That photo is the record. It is not read, not scored, not compared — it
exists so that a month later the dealer, the account manager and an inspector can all see
that the book was kept.

---

## 2. Who this is for

These are the personas already defined in `docs/PRD.md` §3 and
`docs/product/iras-data-editing.md` §1. Nothing new is invented here; what follows is what
each of them does in _this_ service.

| Persona                                                                                        | Defined in                             | What they do here                                                                                                                        | The bar                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Ramesh — pump owner**, 52, low tech comfort, Hindi-first, `dealer-owner`                     | `docs/PRD.md` §3                       | Opens the app, reads two big numbers, writes them in his register, photographs the page, taps send. Never types a number into MDG.       | Could he do it without help, first time, on a 2G connection, without asking his son? If not, it is a bug.               |
| **Sunita — pump manager**, 34, medium, `dealer-staff` `title: "Manager"`                       | `docs/PRD.md` §3                       | Usually the one who actually takes the photo. May do it for several days in a row while the owner travels.                               | She must be able to fill in yesterday's missing photo without anyone unlocking anything for her.                        |
| **Arjun — support agent / account manager**, 28, high, `admin`                                 | `docs/PRD.md` §3                       | Reads the density figures and the invoice PDF while a dealer is on the phone. Uploads a photo on the dealer's behalf when asked.         | Reading an invoice must not fill his Downloads folder with `7010045406.pdf`, `7010045406 (1).pdf`, …                    |
| **The MDG ops operator** (Arjun's other hat) — competent with Excel, not with data engineering | `docs/product/iras-data-editing.md` §1 | Fixes a run that failed: a wrong password, a portal that changed shape, a PDF that would not read. Never touches the portal's own forms. | A failure must tell him what to do in one sentence, in words he already uses. He must never have to read a stack trace. |
| **Priya — support lead**, 35, high, `admin`                                                    | `docs/PRD.md` §3                       | Wants one screen that says which outlets are keeping their register and which are not, without opening eight dealers.                    | The gap must be visible before a month-end audit, not during one.                                                       |

**Primary design target: Ramesh.** As in `docs/PRD.md` §3 — if Ramesh can use it unassisted,
everyone can.

---

## 3. Scope — what ships

Two halves, one service. Each half is useful on its own, which matters for rollout (§10).

### Half A — the densities come to us

1. A daily run reuses the existing, production-proven SDMS login and e-Mitra navigation, opens
   **TT Acknowledgement**, sets a **7-day window ending today**, presses **Fetch**, and reads the
   Invoice Details table.
2. For each invoice row not already held, it downloads the PDF and stores it.
3. It reads the PDF's text layer and extracts, per invoice: SAP invoice number, invoice date and
   time, vehicle number, document number, total, delivery / sales-order numbers, and **one line
   per product** carrying material code, description, quantity and unit, tank number,
   compartments, sample number and **Density@15**.
4. Invoices are de-duplicated by **SAP invoice number, per dealer**, so overlapping 7-day
   windows can run for ever without producing a second copy of anything.

### Half B — the register photo goes back

5. Once a day the dealer (or a manager) photographs the outlet's density register page and
   uploads it from the app. One photo, for the whole outlet, for that calendar day.
6. That upload marks the day **done**. Nothing else marks it done.
7. An admin can upload the same photo on the dealer's behalf, and it is stored as
   admin-uploaded — never disguised as the dealer's own.

### Both halves

8. The density figures are the **first thing** on both the dealer's screen and the admin's,
   in large type, per product, for the most recent delivery.
9. An admin can read any invoice PDF **inline, in the admin portal**, without a file landing
   in their Downloads folder — with a separate, deliberate Download button for when they do
   want the file.

---

## 4. Non-goals — and why each one is out

These are decisions, not omissions. Each is a thing a reasonable person would expect and
must not find.

| Not doing                                                                    | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Never press Acknowledge. Never press Check. Never set Vehicle Condition.** | Acknowledging receipt of a tanker on IndianOil's system is **a legal act by the dealer**. It says the dealer inspected the vehicle, accepted the delivery and accepted its condition. A robot cannot inspect a tanker, and a robot that clicks Acknowledge has filed a statement no human made. This service is **read-only on the portal**: it sets two dates, presses Fetch, reads a table and downloads PDFs. That fence is absolute, is stated wherever the code touches that page, and is a release-blocking test — see §7.9. |
| **No typed density figure from anyone.**                                     | The owner's decision. Asking a dealer to key a number into a phone is exactly the friction this platform exists to remove, and a mistyped density is worse than no density. The photo alone marks the day.                                                                                                                                                                                                                                                                                                                         |
| **No reconciliation of the register against the invoice.**                   | Follows from the above: with nothing typed there is nothing to compare. Build so this could be added later without a rebuild — the invoice density is stored per product and the photo is stored per day, which is everything a future comparison would need — but ship **no** UI, no field, no flag and no wording that hints at it.                                                                                                                                                                                              |
| **No OCR of the register photo.**                                            | Handwriting in a ruled paper register, photographed at an angle under a canopy light, is not a problem OCR solves reliably, and a wrong reading would be quietly worse than no reading. The photo is evidence a human looks at, not data.                                                                                                                                                                                                                                                                                          |
| **No DSR stock reconciliation.**                                             | The DSR engine owns receipts, stock and variation (`shared/src/dsr/*`, `mdg-backend/src/services/dsr-report/*`). This service must not compute litres, must not write into the DSR ledger, and must not mark a DSR report stale. It is a second, independent reader of the same portal.                                                                                                                                                                                                                                            |
| **No dealer-facing PDF in v1.**                                              | The dealer needs the number, not the document, and a 200 KB+ PDF on a 2G phone with no in-app PDF renderer is a dead end that reads as "the app is broken". If a dealer asks for the invoice, an admin sends it in chat, which is the existing path.                                                                                                                                                                                                                                                                               |
| **No admin UI for mapping an unknown product code.**                         | We hold verified evidence for exactly two IOCL material codes. A half-built mapping screen invites a guessed label onto a screen the dealer reads. Unknown codes degrade gracefully instead (§7.3); a new code is added to the shared catalog **with evidence**, exactly as `shared/src/dsr/products.ts` requires.                                                                                                                                                                                                                 |
| **No new dealer-facing bottom-nav tab.**                                     | The bar is four tabs and the established precedent for a fifth thing is not a fifth tab — Services and Staff Points were both demoted to Profile rows. See §8.2 for where this one lives instead.                                                                                                                                                                                                                                                                                                                                  |
| **No per-invoice chat message.**                                             | Two robot messages a week in the thread where a human is supposed to reply devalues the thread. Notification is a push that deep-links to the density screen (§8.2), not a chat message.                                                                                                                                                                                                                                                                                                                                           |

---

## 5. The model, in product language

Two nouns. Everything in this PRD is one of them.

### 5.1 A **delivery** — one tanker, one invoice

The thing IndianOil issued. Identified for ever by its **SAP invoice number** within a
dealer. It carries header facts and one or more **product lines**.

Worked example, from the one invoice already read end to end
(`/Users/dissu/Downloads/7010045406.pdf` — verified, not assumed):

| Header                 | Value                       |
| ---------------------- | --------------------------- |
| SAP invoice number     | `7010045406`                |
| Invoice date and time  | 22-Aug-26, 16:37            |
| Tanker                 | `BR09GC8009`                |
| Document number        | `20272323B052074`           |
| Delivery / sales order | `0573542169` / `0913183557` |
| Invoice total          | ₹12,48,441.00               |

| Line | Material | Description | Qty  | Tank   | Compartments | **Density@15** | What a dealer calls it |
| ---- | -------- | ----------- | ---- | ------ | ------------ | -------------- | ---------------------- |
| 10   | `16730`  | EBMS        | 6 KL | `T017` | 1, 2         | **727.300**    | Petrol (MS)            |
| 20   | `50700`  | HSD-BSVI    | 6 KL | `T018` | 3, 4         | **820.500**    | Diesel (HSD)           |

EBMS is Ethanol Blended Motor Spirit — ordinary petrol. The dealer must see the words they
use ("Petrol", "Diesel", and their Hindi equivalents), with the invoice's own description
available underneath for anyone who wants to check.

**A delivery is filed under the invoice date printed on the PDF**, never under the day we
fetched it. That is what makes §7.4 work.

### 5.2 A **register day** — one outlet, one calendar date

| Field        | Meaning                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Date         | An **IST calendar date**, not the DSR shift day. The register is a paper book with a date printed on the page; matching a shift anchor would put the photo under a different date than the page shows. |
| Photo(s)     | Every photo ever uploaded for that date, newest first. Nothing is ever deleted.                                                                                                                        |
| Status       | **Done** (`MARKED`) = a photo exists. **Missing** (`MISSING`) = otherwise. Two states, no third.                                                                                                       |
| Uploaded by  | The person, their name, and whether they were the **dealer** or an **admin acting on the dealer's behalf**.                                                                                            |
| ~~Rejected~~ | _Amended: not in v1 — see TTD-12. Replacement covers the case._                                                                                                                                        |

One photo covers the whole outlet — not one per product, not one per tanker. That is the
owner's decision and it is also the only version a 52-year-old will do 30 days running.

### 5.3 What the two nouns do **not** do

They do not touch each other. A day with three tankers and a day with none both need exactly
one photo. A photo is never matched to an invoice. Say this out loud in the code, because
the obvious "improvement" is the one thing §4 forbids.

---

## 6. User stories and acceptance criteria

Numbered `TTD-n` so QA can cite them. Every criterion is meant to be executable by a person
holding a phone or a laptop.

---

### TTD-1 — The densities arrive without anyone opening the portal

> **As Ramesh**, I want yesterday's tanker's density figures to already be in the app when I
> open it, so that I never log into IndianOil's site to find a number.

- **AC1.1** — _Given_ the dealer has the service attached and a tanker was invoiced within the
  last 7 days, _when_ the daily run completes, _then_ every invoice the portal listed in that
  window exists in MDG with its header facts and one product line per item, and no human
  opened a browser.
- **AC1.2** — _Given_ a completed run, _when_ an admin opens the dealer's Tanker Density screen,
  _then_ each stored invoice shows its SAP invoice number, invoice date, vehicle number and a
  Density@15 per product line.
- **AC1.3** — _Given_ the run downloaded a PDF, _when_ the same invoice is seen again in a later
  overlapping window, _then_ the PDF is **not** downloaded a second time.
- **AC1.4** — _Given_ the run, _then_ the run record shows the window it asked for
  (`from`/`to`), how many rows the portal listed, how many were new, and how many were already
  held. A run that found nothing new is a **success**, not a failure.
- **AC1.5** — The run's schedule is **daily**, with a **7-day lookback** matching the filter the
  portal itself defaults to. The lookback is configurable (default 7, maximum **31**) and an
  admin can additionally request a **one-off larger lookback** for a backfill.
  _Amended: the configured maximum is 31, and the one-off is a lookback, not a From/To range —
  contract §2.3 `ttDensityCollectSchema`, §4.2 A8._
- **AC1.6** — _Given_ the run, _then_ nothing on the portal changed: no Vehicle Condition was
  selected, no **Check** button pressed, no **Acknowledge** button pressed. Verified per §7.9.

---

### TTD-2 — The density figures are the first thing on the screen, in big type

> **As Ramesh**, I want to see the number I have to copy, not a table I have to read.

- **AC2.1** — _Given_ at least one delivery exists, _when_ the dealer opens the Tanker Density
  screen, _then_ the **most recent delivery's Density@15 per product** is rendered above every
  other element on the screen, with no scrolling on a 360×640 device.
- **AC2.2** — Each density is rendered at **≥ 32 px** (roughly `text-4xl`), `tabular-nums`,
  in `text-text` (not muted), to **three decimal places exactly as printed** — `820.500`, never
  `820.5`. Trailing zeros are part of the figure a dealer copies.
- **AC2.3** — Each figure is labelled with the plain product word in the dealer's language
  ("Diesel" / "डीज़ल", "Petrol" / "पेट्रोल"), with the invoice's own description (`HSD-BSVI`,
  `EBMS`) shown smaller underneath.
- **AC2.4** — Immediately under the figures, in one line: the tanker number and the invoice
  date — "BR09GC8009 · 22 Aug" — so a dealer with two tankers this week knows which one this is.
- **AC2.5** — The same rule holds in the admin portal: on a dealer's Tanker Density pane the
  latest delivery's densities lead the page in large type, above the invoice list.
- **AC2.6** — _Given_ more than one delivery, _when_ the dealer scrolls, _then_ previous
  deliveries appear below, newest first, each with its own densities — smaller, but still the
  most prominent thing in its row.
- **AC2.7** — _Given_ no delivery has ever been recorded for this dealer, _then_ the screen shows
  a calm empty state ("No tanker yet — the figures will appear here the day after one arrives"),
  never a spinner that never resolves and never a zero.

---

### TTD-3 — An admin reads the invoice PDF without a download

> **As Arjun**, I want to open an invoice while a dealer is on the phone, and not have my
> Downloads folder fill with files called `7010045406 (3).pdf`.

- **AC3.1** — _Given_ a stored invoice, _when_ the admin clicks **View invoice**, _then_ the PDF
  renders **inside the admin portal** and **no file is written to the local disk**. Verified by
  watching the Downloads folder before and after.
- **AC3.2** — The viewer opens over the current page and closes back to it, without losing the
  admin's place in the invoice list, filters or an open run dialog.
- **AC3.3** — A **Download** button exists, separately and deliberately, and only that button
  saves the file.
- **AC3.4** — _Given_ the PDF cannot be rendered (an unsupported browser, a signing failure),
  _then_ the viewer shows a plain sentence and the Download button, never a blank grey box.
- **AC3.5** — Nothing about the viewer requires the admin to be a super-admin. Any admin who can
  see the dealer can read the invoice.
- **AC3.6 (engineering constraint, product-visible if it bites)** — the inline render must not
  create a stored-script hazard on the storage origin. The preferred build is a sandboxed frame
  over an `inline`-disposition signed URL. If that is judged unsafe, the fallback is a
  server-rendered page image (the PDF library is already a backend dependency) — but a fallback
  that makes the admin download the file is **not** acceptable and fails this story.

---

### TTD-4 — The same tanker never appears twice

> **As Priya**, I want a week's list to be a week's list, however many times the window ran.

- **AC4.1** — _Given_ invoice `7010045406` is already held for a dealer, _when_ a later run's
  7-day window lists it again, _then_ the dealer's invoice count does not change, no second PDF
  is stored, and no second set of densities appears.
- **AC4.2** — The identity is **(dealer, SAP invoice number)**. Not the vehicle number (one
  tanker returns), not the date (two tankers a day happens), not the PDF's checksum.
- **AC4.3** — _Given_ a re-sighting, _then_ the delivery records that it was seen again (a
  last-seen timestamp) and the run reports it as "already held", so an operator can tell
  "nothing new happened" from "nothing was fetched".
- **AC4.4** — _Given_ the portal re-issues an invoice with the **same** SAP number but changed
  contents, _then_ **nothing changes**: an invoice whose PDF we already hold is never fetched
  again and never re-parsed, so the figure a dealer copied into their register cannot move under
  them. _Amended: the original criterion asked for the new values to be stored, the old kept and
  the delivery flagged "changed", which would require re-fetching bytes we already hold on every
  sighting. The requirement behind it — **no silent overwrite of a density a dealer already
  copied** — is met more strongly by never overwriting at all. Detection of a genuine re-issue is
  a named follow-up: contract §12.5._
- **AC4.5** — Running the same window twice by hand, back to back, produces byte-identical
  stored state apart from timestamps. This is a test, not an aspiration.

---

### TTD-5 — The dealer photographs today's register page and the day turns done

> **As Ramesh**, I want to finish today's job in two taps.

- **AC5.1** — _Given_ today has no photo, _when_ the dealer opens the Tanker Density screen,
  _then_ directly beneath the density figures there is one primary, full-width, ≥ 44 px-tall
  button: **"Take today's register photo" / "आज के रजिस्टर की फोटो लें"**.
- **AC5.2** — _When_ the dealer taps it, _then_ the phone camera opens directly (rear camera),
  and a second, secondary control offers choosing an existing photo. Both routes accept the same
  photo.
- **AC5.3** — _When_ a photo is chosen, _then_ it is shown as a preview with two choices —
  **Send** and **Retake** — and nothing is uploaded until Send. A dealer who photographs their
  thumb must not have to explain it to anybody.
- **AC5.4** — _When_ Send is tapped, _then_ the screen shows an in-place "sending" state; on
  success the day's row turns to **"Today: done ✓"** in the success tone, and the primary button
  is replaced by a quiet **"Replace photo"** link.
- **AC5.5** — _Given_ the upload fails, _then_ the failure is shown **in place with a tap-to-retry
  control**, never as a toast that disappears, and the already-uploaded photo is retried rather
  than silently dropped. (This is the known bug in `ComplianceTaskCard` — do not reproduce it:
  hold the uploaded key in state and pass it to the retry.)
- **AC5.6** — Photos are compressed before upload using the existing client compression, and a
  photo that cannot be compressed is uploaded as-is rather than failing.
- **AC5.7** — The whole flow works inside the Expo WebView shell on Android with no new native
  permission work — the camera grant is already requested app-wide on mount.
- **AC5.8** — The dealer is never asked to type anything: no density, no litres, no note, no
  date. Zero keyboard appearances in the happy path.
- **AC5.9** — _Given_ a slow connection, _then_ the button is disabled with a visible sending
  state rather than allowing a second tap to create a second upload.

---

### TTD-6 — An admin uploads on the dealer's behalf, and it says so

> **As Arjun**, I want to accept a photo a dealer WhatsApped me at 9 pm, without pretending
> he used the app.

- **AC6.1** — _Given_ a dealer's Tanker Density pane in the admin portal, _when_ the admin picks
  a date and a file, _then_ the photo is stored against that dealer and that date and the day
  turns done.
- **AC6.2** — The stored photo records **who uploaded it and that they were an admin**. The
  admin surface shows "Uploaded by MDG — Arjun Mehta" against it, distinctly from a dealer's own
  upload.
- **AC6.3** — The dealer's own screen shows the day as done and shows, in plain words, that MDG
  added it: "Added by MDG" / "MDG ने डाला". The dealer is never shown a photo attributed to
  themselves that they did not send.
- **AC6.4** — Every admin-behalf upload is written to the audit trail with the dealer, the date,
  the actor and the time, as a distinct action from a dealer upload.
- **AC6.5** — Counting for the adoption metric (§9) uses the dealer/admin distinction. An estate
  where every day is done because Arjun did it is a **failure** the numbers must be able to show.
- **AC6.6** — An admin may upload for **any past date within the last 60 days, counting today**
  (so the oldest allowed is `today - 59`), and for today. Never for a future date (§7.8).
  _Amended from 90: contract `TT_REGISTER_ADMIN_BACKDATE_DAYS = 60`._

---

### TTD-7 — A missing day is visible, and yesterday can still be filled in

> **As Sunita**, I want to fix yesterday this morning. **As Priya**, I want to see which
> outlets are not keeping the book.

- **AC7.1** — _Given_ today has no photo, _then_ the dealer's screen leads (under the densities)
  with today's action, not with history.
- **AC7.2** — _Given_ any of the **last 7 days counting today** has no photo, _then_ the dealer's
  screen offers to fill it: today first, as the card's one primary action, and the earlier
  missing days as a quiet secondary line that names them. Using it marks that day done.
  _Amended from "yesterday only": the window is **7 days, inclusive of today** — today and the
  six days before it. Seven is the portal's own filter, our fetch window and the one number this
  whole service uses. Contract `TT_REGISTER_DEALER_BACKDATE_DAYS = 7`, and the boundary date
  arrives precomputed as `TtDensityMeView.earliestMarkableDate`._
- **AC7.3** — _Given_ a day older than that window has no photo, _then_ the dealer is not offered
  it at all — it is not shown in the week strip and there is no control for it. If they reach one
  anyway (a stale screen, an old notification) the answer is one plain sentence, "Only the last
  7 days can be filled in", with a Message us action and never a dead end. Deliberate: past a
  week, a photograph of an old page stops being evidence that the test happened that day. An
  admin can still fill it (AC6.6), which is the escape hatch when there is a real reason.
- **AC7.4** — The dealer's history is a **week strip** — one box per markable day, filled for
  done, outlined for missing, today outlined heavier. No table, no list, no percentages, no
  score. The **admin** gets the month view (a calendar), because a month of gaps is what an
  account manager is looking at. _Amended: the dealer's strip is the 7-day window, not a month,
  so every box on it is a box they can act on._
- **AC7.5** — _Given_ a day is missing, _then_ nothing on the dealer's screen scolds, scores or
  ranks them. The word used is "missing", never "failed", "overdue", "non-compliant" or a red
  number. (`docs/PRD.md` §9: features that erode approachability are bugs.)
- **AC7.6** — _(NOT IN v1 — follow-up.)_ A cross-dealer view listing every dealer with the
  service attached and, per dealer: days done this month, days missing, the date of the last
  photo and the date of the last delivery, sortable by days missing. _Amended: it needs an
  estate-wide endpoint the build contract does not define, and the UX spec itself defers the
  pane to "after the per-dealer pane" (UX §3.10). Until then Priya's question is answered one
  dealer at a time, on the dealer's own Data Vault pane, where the month calendar shows the gaps.
  Contract §12.5._
- **AC7.7** — _(NOT IN v1 — depends on AC7.6.)_ The three-consecutive-days flag lives in that
  same view. The half that still holds in v1: **no automatic message is ever sent to the dealer
  about a missing day.** An account manager decides what to say. (A robot nagging a 52-year-old
  about a paper book is how an app gets uninstalled.)
- **AC7.8** — _(NOT IN v1 — follow-up.)_ A daily reminder push at a per-dealer hour (default
  20:00 IST), only on days with no photo yet, at most once a day, deep-linking to the Tanker
  Density screen. _Amended: it needs a per-dealer reminder hour on a model and a nightly
  scheduler job of its own — the `scheduler/kavach.ts` shape — and neither is worth building
  before M4 tells us whether dealers send photos unprompted. **The push that DOES ship in v1** is
  TTD-9's: one notification when new density figures arrive, deep-linking to the same screen.
  Contract §8.2 step 8a and §12.5._

---

### TTD-8 — A run that fails says which human fixes it

> **As the ops operator**, I want the failure to tell me what to do, not what broke.

- **AC8.1** — _Given_ any failed run, _then_ the run's failure carries a **code**, the **phase**
  it failed in, and a **plain-language operator hint** — one sentence, no jargon, safe to read out
  loud. This is the `operatorHint` contract already used by `water-ingress-testing`.
- **AC8.2** — Every failure code maps to exactly one **owner**, and the owner is shown next to the
  hint:

  _Amended: the code names below are the real ones from the build contract §7.2. The earlier
  draft invented eight names that do not exist. The owner column and the hints survive
  unchanged — they were right about who fixes what._

  | Code                                                        | What happened                                            | Owner                                         | The hint says                                                                                                                       |
  | ----------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
  | `LOGIN_REJECTED`                                            | The portal refused the username or password              | **MDG ops**                                   | The dealer's SDMS username or password is wrong. Re-enter it in the dealer's Password vault tab. Nothing will be retried until you do. |
  | `SDMS_CREDENTIALS_MISSING`                                  | No SDMS credentials on this dealer                       | **MDG ops**                                   | This dealer has no SDMS credentials saved.                                                                                          |
  | `LOGIN_CAPTCHA_EXHAUSTED`, `LOGIN_CHALLENGE_*`              | The portal's login question could not be answered        | **Nobody**                                    | Transient. The next run normally succeeds.                                                                                          |
  | `LOGIN_PAGE_UNREACHABLE`                                    | IndianOil's site was down or timed out                   | **Nobody**                                    | Transient. Retries.                                                                                                                 |
  | `NAV_HOME_FAILED`, `SESSION_EXPIRED`                        | The SSO handoff dropped the session                      | **Nobody**                                    | Transient. Retries.                                                                                                                 |
  | `MENU_OPEN_FAILED`, `DOWNLOAD_INVOICE_MISSING`              | The TT Acknowledgement screen was not where expected     | **Engineering**                               | The portal renamed or moved it. The screenshot in this run shows what it looks like now.                                            |
  | `DATE_FIELDS_NOT_FOUND`, `FETCH_BUTTON_NOT_FOUND`           | The date filter changed shape                            | **Engineering**                               | Same.                                                                                                                               |
  | `FETCH_FAILED`, `TABLE_NOT_FOUND`                           | The portal did not answer                                | **Nobody** first, **Engineering** if repeated | Transient once; a pattern is a portal change.                                                                                       |
  | `COLUMNS_NOT_RECOGNISED`                                    | The invoice table's columns are not the ones we expect   | **Engineering**                               | Nothing was clicked. This is the read-only fence refusing to guess.                                                                 |
  | `INVOICE_LINK_NOT_FOUND`, `PDF_NOT_A_DOWNLOAD`, `PDF_EMPTY` | The Download link did not produce a usable file          | **Engineering**                               | The invoice is still listed; only the file is missing. **Never fails the run.**                                                     |
  | `PDF_TEXT_UNREADABLE`                                       | A PDF is a scan, not text                                | **Engineering**                               | The PDF itself is saved and can be read by hand — see §7.2. **Never fails the run.**                                                |
  | `DENSITY_NOT_FOUND`                                         | The invoice was read but printed no density we recognise | **Engineering**                               | Open the PDF to check. **Never fails the run.**                                                                                     |
  | `CAPTURE_TIMEOUT`                                           | The run ran out of its seven minutes                     | **Nobody**                                    | Invoices already saved are kept; the rest are fetched next run.                                                                     |
  | `BROWSER_LAUNCH_FAILED`, `OCR_SIDECAR_UNAVAILABLE`          | A server install, not a portal condition                 | **Ops**                                       | Run the setup script on the server.                                                                                                 |

- **AC8.3** — _Given_ a failure, _then_ the dealer sees **nothing**. Not a banner, not a push, not
  an error state. Their screen keeps showing the last densities it has. A broken pipeline is our
  problem, and showing it to Ramesh only teaches him the app is unreliable.
- **AC8.4** — _Given_ a failure whose owner is **Nobody**, _then_ it does not appear in any admin
  attention list unless it has happened on 3 consecutive scheduled runs for that dealer.
- **AC8.5** — Every failed run keeps a screenshot and the page HTML at the point of failure, so
  the operator or engineer never has to reproduce it to see it.
- **AC8.6** — A **partial** run is a success with a note, not a failure: 5 invoices fetched and 1
  PDF unreadable stores the 5 and flags the 1. Losing four good invoices because the fifth was a
  scan is not acceptable.

---

### TTD-9 — The dealer gets told when a new density arrives

> **As Ramesh**, I want to know a tanker's figures are ready without checking.

- **AC9.1** — _Given_ a run stored one or more **new** deliveries, _then_ the dealer's registered
  devices receive **one** push — "New tanker density is ready" / "नए टैंकर की डेंसिटी आ गई है" —
  at most once per day regardless of how many invoices arrived.
- **AC9.2** — Tapping it opens the Tanker Density screen directly, not the app's home screen.
- **AC9.3** — No push is sent when nothing new arrived.
- **AC9.4** — No chat message is posted for a delivery (§4).

---

### TTD-10 — An unknown product still shows its density

> **As Arjun**, I do not want an outlet's new premium grade to break its screen.

- **AC10.1** — _Given_ an invoice line whose material code is not in the catalog, _then_ its
  Density@15 is still extracted, stored and shown at full size.
- **AC10.2** — Its label is the invoice's own description (e.g. `XP-95`), shown as-is; no label is
  invented and no family is guessed.
- **AC10.3** — The line is marked **provisional**, exactly as `dsrProductProfile()` marks an
  unknown IRAS code, and appears in an admin list of "codes we have seen but not confirmed".
- **AC10.4** — An unknown code never fails a run, never blocks the other lines on the same
  invoice, and never blocks the whole invoice.
- **AC10.5** — Adding a code to the catalog requires evidence — a real invoice — as
  `shared/src/dsr/products.ts` already requires. It is a code change, not an admin form (§4).

---

### TTD-11 — An operator can back-fill a range by hand

> **As the ops operator**, I want to fetch an older window once, without changing the schedule.

- **AC11.1** — An admin can trigger a run for one dealer with a **one-off larger lookback**, up
  to **31 days**, which is merged over the stored config for that run only and never changes the
  schedule. _Amended from "an explicit From/To range, up to 90 days back": a second way to name a
  window is a second set of bugs, and the window always ends today anyway — an invoice is filed
  under its own printed date, so a longer lookback reaches back exactly as far as a range would.
  Contract §2.3 `ttDensityCollectSchema`, §4.2 A8._
- **AC11.2** — The manual run de-duplicates against everything already held (TTD-4), so it is safe
  to run over a window already covered.
- **AC11.3** — The manual run is recorded as a run like any other, with its trigger visible, so
  "why did 12 invoices appear on a Tuesday" is answerable.
- **AC11.4** — It obeys the same read-only fence. There is no "commit" mode, because there is
  nothing to commit.

---

### TTD-12 — An admin can reject a photo that is not the register — **NOT IN v1**

> **As Arjun**, I want to ask for a re-take without deleting evidence.

_Amended: cut from v1. There is no rejected state in the day-log contract
(`TtRegisterDayStatus` has exactly `MARKED` and `MISSING`) and the UX spec designed
no rejection control on either surface. The real case — a blurry or wrong page —
is already covered by **replacement** (§7.7): a second upload for the same day
becomes the day's photo and the earlier one is kept, marked replaced, and visible
to admins. What rejection adds over replacement is a way to tell the dealer to
send it again, and that conversation is a message from a named human, not a
button. Contract §12.5._

The one criterion that holds in v1 regardless:

- **AC12.5** — There is **no automatic rejection**. Nothing inspects the pixels (§4). No
  machine ever tells Ramesh his photo is wrong.

---

## 7. Edge cases, with the decided behaviour

Each of these has one answer, and the build must implement that answer rather than choosing
at the keyboard.

### 7.1 A week with no tanker at all

**Decided:** an ordinary successful run with the outcome **`NO_INVOICES`**. Not a failure, not
a retry, not an alert. Modelling it as a failure would set the retry machinery chasing
something no retry can fix — the same reasoning `water-ingress-testing` applies to
`OUTSIDE_OPERATING_HOURS`.

The screens say so plainly. Dealer: the last delivery's figures stay on screen with their
date, so nothing changes under them. Admin: "No tanker in the last 7 days · last delivery 17
Aug". No push (AC9.3). A quiet week is a normal week.

### 7.2 An invoice whose PDF has no text layer

**Decided:** store the invoice from the **table row** (SAP number, date, vehicle), store the
PDF, mark the delivery **`parseStatus: 'UNREADABLE'`**, and carry on with the other invoices.
_Amended: the state is called `UNREADABLE`, not `DENSITY_UNREAD` — contract §2.2
`TT_INVOICE_PARSE_STATUSES`. A partly-read invoice is `PARTIAL`._

- The admin list shows that row with "Density could not be read — open the invoice" and the
  inline viewer one click away. Owner: **MDG ops**.
- The dealer's screen **does not** show a broken row. A delivery with no readable density is
  invisible to the dealer until a human resolves it; showing "—" where a figure should be is
  worse than showing nothing.
- v1 has **no** hand-entry field for the density, because §4 forbids typed densities. The
  resolution path is: an admin reads the PDF and tells the dealer in chat. If unreadable PDFs
  turn out to be common rather than theoretical, that is the moment to reconsider — and §11
  asks the owner about it. Today the evidence is one PDF, and it had a clean text layer.

### 7.3 A product code the catalog does not know (XP, XG, a new grade)

**Decided:** provisional, never an error. See TTD-10. This directly mirrors the rule
`shared/src/dsr/products.ts` already states: _"An unknown code is NOT an error… a dealer whose
new premium nozzle stops their whole report from generating would be a worse failure than one
whose report needs a label filled in."_

We hold verified evidence for exactly two IOCL material codes — `16730` → EBMS (petrol) and
`50700` → HSD-BSVI (diesel). The IRAS catalog knows `HS`, `MS`, `X2` (XtraPremium) and `XG`
(XtraGreen), but those are **IRAS** codes, not IOCL material codes; the two tables are not the
same table and must not be conflated. XP and XG invoices will therefore arrive as unknown
material codes, and must produce a working screen the first time they do.

### 7.4 A tanker delivered on the 31st that only appears on the portal on the 2nd

**Decided:** the delivery is filed under the **invoice date printed on the PDF** (§5.1), so it
lands on the 31st however late it is seen. The daily 7-day window covers a lag of up to a week,
which comfortably covers two days.

Consequences that must be built:

- The list is ordered by **invoice date**, so a late arrival appears in its rightful place, not
  at the top.
- A delivery first seen more than 24 hours after its invoice date is marked **new** for 48 hours
  wherever it appears, so nobody scrolls past it.
- The push (TTD-9) fires for it, because it is new to the dealer even though it is old to the
  portal.
- A lag longer than the lookback is handled by raising `lookbackDays` or by a manual range fetch
  (TTD-11), not by re-architecting.

### 7.5 A dealer whose SDMS credentials are wrong

**Decided:** the run fails fast with `LOGIN_REJECTED`, and the failure is **not transient** — it
must not be retried in a loop, because repeated bad logins against a real dealer account is
exactly how an account gets locked. Owner: **MDG ops**, hint: _"Ask the dealer for their current
SDMS password and update it in the dealer's Password vault tab."_

- After **two** consecutive `LOGIN_REJECTED` runs the service surfaces in the admin attention
  list. (Two, not three: unlike a flaky portal, a wrong password never fixes itself.)
- The dealer sees nothing (AC8.3).
- The last-known densities remain on the dealer's screen, with their date. They are still true;
  they are just not new.

### 7.6 The dealer photographs the wrong page, or the photo is blurry

**Decided:** nothing automatic. The photo is accepted, the day turns done, and a human decides
later. An admin who notices can reject it (TTD-12), which returns the day to missing and asks
for a re-take.

Why accept it: the alternative is a machine telling Ramesh his photo is wrong. Every false
rejection of a perfectly good photo costs more adoption than every accepted bad photo costs
in evidence quality — and we have no reliable way to tell the two apart (§4, no OCR).

The one preventive measure is in the flow, not in a check: the preview + Retake step (AC5.3)
means a dealer sees the blurry photo before we do.

### 7.7 Two photos uploaded for the same day

**Decided:** allowed, and it is the re-take path. The **latest** photo is the day's photo; every
earlier one is kept, visible to admins, marked "replaced". Nothing is ever deleted.

- The dealer's screen shows one photo (the latest) and a "Replace photo" link, never a gallery
  and never a count.
- The admin's day view shows all of them, newest first, with times, so "he sent it twice" is
  visible rather than mysterious.
- A replaced photo does not change who the day is credited to unless the replacement came from a
  different kind of person — a dealer replacing an admin's photo makes the day dealer-uploaded,
  which is the honest reading and the one the adoption metric (§9) should reward.

### 7.8 A photo uploaded for a date in the future, or long past

**Decided:**

_Amended: the dealer's window is 7 days and the admin's is 60. Contract
`TT_REGISTER_DEALER_BACKDATE_DAYS` / `TT_REGISTER_ADMIN_BACKDATE_DAYS`, both counted
inclusive of today._

| Who    | Earliest date allowed                  | Latest date allowed  | If out of range                                                                                                         |
| ------ | -------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Dealer | `today − 6` (7 days, counting today)   | Today                | The option is not offered. If one is reached anyway: "Only the last 7 days can be filled in", with a Message us action. |
| Admin  | `today − 59` (60 days, counting today) | Today                | Rejected with a plain sentence naming the range.                                                                        |
| Anyone | —                                      | **Never the future** | Hard rejection, server-side, in every path.                                                                             |

Dates are **IST calendar dates** and the boundary is IST midnight — a photo taken at 00:20 IST
counts for the new day, which is why yesterday stays open all day (TTD-7).

A future date is rejected server-side even for admins, because a register page cannot be
photographed before it is written, and a system that allows it is a system whose evidence means
nothing.

### 7.9 The portal's write controls — the fence, as a test

**Decided:** this is not a guideline, it is a release gate.

- The automation is only ever permitted to: set From Date, set To Date, press **Fetch**, read the
  table, and press **Download** on a row.
- The Vehicle Condition dropdown, the **Check** button and the **Acknowledge** button are never
  read for state, never focused, and never clicked. Not in a dry run, not in a debug mode, not
  behind a flag. There is no flag.
- A test must assert that no click, change or submit event ever targets those controls, and the
  fence must be restated in a comment at the exact place the code drives that page.
- **Why, in one sentence anybody can repeat:** acknowledging a receipt on IndianOil's system is a
  legal statement by the dealer that they inspected and accepted the tanker, and no robot may
  make a statement on a dealer's behalf.

### 7.10 The portal lists an invoice whose row we cannot fully read

**Decided:** if the SAP invoice number is readable, store the row and mark the delivery
incomplete. If the SAP invoice number is **not** readable, skip that row, count it in the run
output as skipped, and do not invent an identity for it — an invoice with a made-up key is a
duplicate waiting to happen (AC4.2).

### 7.11 Two dealers share one IndianOil login

**Decided:** already solved upstream and must not be re-solved here. The shared login gate and
concurrency semaphore in the SDMS layer serialise work per IndianOil username. This service
inherits that and adds nothing.

---

## 8. Where it lives

### 8.1 Admin

- **Per dealer:** a new dataset in the existing per-dealer Data Vault rail, gated on the service
  being attached — **not** a new tab on the dealer page. That is the established mapping; Credit &
  DOD and DSR were both moved into the rail.
- **Cross-dealer:** one pane answering Priya's question (AC7.6) — every dealer on the service,
  days done and missing this month, last photo, last delivery.
- **The pane's own order, top to bottom:** the latest delivery's densities in large type → the day
  strip with photo thumbnails → the invoice list with a **View invoice** action per row → the run
  history that already exists for every plugin.
- No new page, no new nav item, unless the cross-dealer view proves too big for a Vault pane.

### 8.2 Dealer

- **A dedicated page**, reached three ways, in this order of expected use:
  1. the **push notification** deep-link (TTD-9, TTD-7.8) — how most dealers will arrive;
  2. a **pinned card at the top of the chat list**, rendered only while something is due and
     gone once today's photo is sent. _Amended from "the Reports/Records tab": Reports is the
     receiving shelf for things MDG sends **to** the dealer, and this is a chore the dealer
     **does**. Chat is the app's home route, so the one thing they owe today is the first thing
     they see. UX §4.1._
  3. a **row on Profile**, matching the Services and Staff Points precedent.
- **Not a fifth bottom-nav tab** (§4). The bar stays at four.
- The page obeys the four-state rule every dealer page obeys: loading, error, not-provisioned,
  empty — each a calm sentence, never a raw error, always with the existing "Need help?" footer
  that drops the dealer into chat.
- Hindi and English, both written rather than translated, following ADR 0008.
- Every tap target ≥ 44 px; no field below 16 px; images `draggable={false}`; inner scrollers
  `overscroll-contain`. The WebView hardening rules are not optional.

---

## 9. Success metrics

Every metric below is computable from data this service stores. No metric depends on asking
anybody anything.

| #   | Metric                         | Exact definition                                                           | Target at 30 days on the pilot dealer | Why this one                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------ | -------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | **Density coverage**           | Deliveries with a Density@15 on **every** product line ÷ deliveries stored | **≥ 98%**                             | The service's entire promise. Anything less means somebody still opens the portal.                                                                                                                                                                                                                                                                   |
| M2  | **Time to visible**            | Median hours from invoice date/time to the delivery being stored           | **≤ 24 h**, 95th percentile ≤ 48 h    | A density that arrives after the register page is written is worthless.                                                                                                                                                                                                                                                                              |
| M3  | **Register days kept**         | Days with an accepted photo ÷ days the service was attached, per dealer    | **≥ 90%**                             | The point of Half B.                                                                                                                                                                                                                                                                                                                                 |
| M4  | **Self-service share**         | Days marked by a **dealer** upload ÷ all days marked                       | **≥ 60%**                             | The adoption metric. A 100% M3 achieved entirely by Arjun is a failed product, and only this shows it.                                                                                                                                                                                                                                               |
| M5  | **Days to first dealer photo** | Service attached → the dealer's first own upload                           | **≤ 3 days**, median                  | The `docs/PRD.md` time-to-first-message idea, applied here.                                                                                                                                                                                                                                                                                          |
| M6  | **Runs needing a human**       | Failed runs whose owner is MDG ops or Engineering, per dealer per month    | **≤ 1**                               | Distinguishes "the portal was flaky" from "somebody has to do something".                                                                                                                                                                                                                                                                            |
| M7  | **Duplicate rate**             | Deliveries sharing a (dealer, SAP invoice number)                          | **exactly 0**, always                 | TTD-4 is a correctness claim, so its metric is absolute.                                                                                                                                                                                                                                                                                             |
| M8  | **Invoice views**              | `TT_INVOICE_PDF_VIEW` audit rows, per dealer per month                     | reported, not targeted                | _Amended: the original ratio (inline ÷ inline + downloads) is not computable — one API call returns both the inline and the download URL and writes one audit row, so the two cannot be told apart server-side. The requirement itself is checked by hand instead, once, per AC3.1: watch the Downloads folder before and after opening an invoice._ |
| M9  | **Portal sessions avoided**    | Deliveries stored × 1 portal session each                                  | reported, not targeted                | The headline number for the owner — ~8–9 logins a month per outlet. **Derived, and labelled as derived.**                                                                                                                                                                                                                                            |
| M10 | **Portal writes**              | Any click on Vehicle Condition / Check / Acknowledge                       | **exactly 0**, verified by test       | The fence (§7.9), expressed as a number.                                                                                                                                                                                                                                                                                                             |

**What "this worked" looks like in a month, in one sentence:** the pilot dealer has not opened
the SDMS portal for a density figure once, has a photo for at least 27 of 30 days, and took at
least 18 of those photos himself.

---

## 10. Rollout

The platform has **eight dealers live on the Daily Sales Report** — 1E, 2E, 3E, 5E, 9E, 12E,
14E and 15E — all of which have working SDMS credentials and a proven login. A ninth outlet,
**16E, has no portal automation at all**: its shift data is typed in by hand and its
`iras-shift-data` service is deliberately attached-then-paused because there is no account to
log into. **16E cannot receive Half A of this service, ever, in this design.** It could still
receive Half B (the register photo) on its own, and §11 asks the owner whether that is wanted.

### Phase 0 — before anything is attached to anybody

Follow the `water-ingress-testing` "First live run" discipline, which exists precisely because
selectors written from screenshots are guesses until a human watches them:

1. Run the collector **by hand, headed, dry**, against **15E**, and watch it. It must reach the
   TT Acknowledgement page, show the pre-filled 7-day window, press Fetch, and print the rows it
   read — including the two known ones if the dates line up.
2. Confirm with your own eyes that it never touches Vehicle Condition, Check or Acknowledge.
3. Let it download and parse the PDFs to a local folder. Compare every extracted Density@15
   against the PDF, by eye, for at least three invoices.
4. Only then attach the service to one dealer.

**Gate to Phase 1:** every row on the page was read, every density matched the PDF by eye, and
no acknowledgement state on the portal changed.

### Phase 1 — 15E alone, for 7 days

**Why 15E first:** it is the outlet the whole DSR engine is pinned to, the dealer the UAT plan
already uses, the one whose data the team knows by heart, and its daily portal run already
happens at 10:00 IST so a second daily read is a known, tolerated load on that account. It is
also the outlet whose owner and manager are most used to being asked to try something.

**What to check daily during the 7 days:**

| Check                                                    | Passing looks like                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| Invoices on the portal for the window vs invoices in MDG | Identical sets, no extras, no misses                                |
| Duplicates                                               | Zero, across seven overlapping windows (M7)                         |
| Densities                                                | Every stored figure matches its PDF, checked by hand (M1)           |
| Acknowledgement state on the portal                      | Unchanged on every invoice, checked by eye on day 1 and day 7 (M10) |
| Failed runs                                              | None, or transient-only (M6)                                        |

**Gate to Phase 2:** seven consecutive days, zero duplicates, zero density mismatches, zero
portal writes, and at least one week where the dealer's own photo landed on ≥ 5 of 7 days.

### Phase 2 — 2E and 14E, for 7 days

**Why these two:** both are on `receiptBasis: 'INVOICE'`, meaning their DSR already counts the
tanker's **invoice** volume. That gives an independent cross-check available nowhere else: the
quantity this service reads off the invoice (6 KL, 6 KL in the worked example) can be eyeballed
against what the DSR recorded as that day's receipt for the same product. It must agree. If it
does not, one of the two readings is wrong and we want to know before five more dealers are
attached. **This is a cross-check performed by a human, not a feature** — §4 still forbids any
automatic DSR reconciliation.

14E additionally carries the per-nozzle meter-scale oddity, so it is the outlet most likely to
have something unusual about its paperwork.

**Gate to Phase 3:** the invoice quantities agree with the DSR receipts by eye for every tanker
in the week, and both dealers' figures are clean.

### Phase 3 — the remaining five (1E, 3E, 5E, 9E, 12E)

Attach in one batch, watch for a week. Two known things to expect:

- **9E** has previously had tankers reported with a zero invoice quantity that only carried the
  real figure a day later. If that shape shows up here as a missing or odd figure, it is a known
  portal behaviour, not a bug in this service.
- **1E** carries a standing DSR warning about a decommissioned tank. It is unrelated to this
  service and must not be "fixed" here.

**Gate to done:** all eight dealers, one full week, M1 ≥ 98%, M7 = 0, M10 = 0.

### The photo, separately

Half B is rolled out **one dealer behind** Half A, and only to the owner and manager of that
dealer. Reason: the photo is the half that asks something of a human, and asking before the
densities are reliably arriving spends goodwill on an unproven thing. Once M4 (self-service
share) holds above 60% for two weeks on a dealer, add the next one.

---

## 11. Open questions for the owner

Four, and only four. Everything else in this document is decided.

1. **Should 16E get the register photo on its own?** 16E has no portal automation, so it can
   never receive the density half. The photo half would work perfectly well standalone — but it
   would mean a dealer whose Tanker Density screen shows a permanent "no deliveries" state above
   a working photo button, which reads as a broken app. If yes, the screen needs a second layout
   for photo-only outlets. _Recommendation: no, not in v1._

2. **If unreadable PDFs turn out to be common, what is the fallback?** Today the evidence is one
   PDF with a clean text layer, so §7.2 assumes it is rare and routes it to a human. If it turns
   out to be, say, one invoice in five, the choices are (a) leave it to a human every time,
   (b) let an admin type the density from the PDF they are already looking at — which is a
   _typed density_, and therefore needs your explicit permission because it crosses §4, or
   (c) OCR the invoice. _Recommendation: revisit only if the first month shows it above 5%._

3. **How long do we keep the invoice PDFs?** They are the dealer's own documents and they are
   small, but they accumulate at ~9 per outlet per month for ever. Options: keep everything
   (~110 PDFs per outlet per year), or keep the extracted figures for ever and the PDFs for
   24 months. _Recommendation: keep everything until it is a cost, which is years away._

4. **Should the daily reminder be on by default?** _Amended: the question is deferred with the
   feature. The 20:00 reminder is not in v1 (AC7.8) — it needs a per-dealer reminder hour and a
   nightly scheduler job, and neither is worth building before M4 says whether dealers send
   photos unprompted. The push that ships is the one that fires when new density figures arrive
   (TTD-9), which nobody has to be asked about because it is news rather than a nag. Ask this
   again when M3 has a month of numbers on it. Prior recommendation, unchanged: on by default,
   off with one tap, and the off state respected for ever without asking again._

---

## Appendix A — Facts this PRD relies on, and how they are known

Nothing here is an assumption. Kept separate so a reader can see the difference.

| Fact                                                                                                                                                                                                            | How it is known                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| The TT Acknowledgement page has From/To dates, a Fetch button, and an Invoice Details table with SAP Invoice #, Invoice Date, Vehicle #, Vehicle Condition, Download PDF, Check Ack Status, Acknowledge Receipt | Read off the portal screenshot                                                    |
| The window defaults to the last 7 days (17/08/2026 → 24/08/2026 observed)                                                                                                                                       | Same screenshot                                                                   |
| Two invoices in that observed week: `7010045406` (22-08-2026, BR09GC8009) and `7009874468` (17-08-2026, BR09GC4786)                                                                                             | Same screenshot                                                                   |
| The invoice PDF has a real text layer                                                                                                                                                                           | **Verified** by extracting `/Users/dissu/Downloads/7010045406.pdf`                |
| Densities in that invoice: EBMS (material `16730`) = **727.300**, HSD-BSVI (material `50700`) = **820.500**                                                                                                     | **Verified** — extracted and read against the PDF                                 |
| EBMS = Ethanol Blended Motor Spirit = ordinary petrol (MS)                                                                                                                                                      | Trade knowledge, consistent with the invoice's own tank and quantity structure    |
| The e-Mitra dashboard and the SDMS login are already reachable in production                                                                                                                                    | `water-ingress-testing` uses them daily                                           |
| Eight dealers live on the DSR; 16E has no portal automation                                                                                                                                                     | The DSR onboarding record                                                         |
| The manual cost is ~15 actions and 3–5 minutes per tanker                                                                                                                                                       | **Estimated** from the portal screens. Not timed. Treat as an order of magnitude. |
| ~8–9 tankers per outlet per month                                                                                                                                                                               | **Derived** from one observed 7-day window at one outlet. Not a measurement.      |

---

## Appendix B — Shared contracts this touches

Product-level note only; the technical spec owns the detail.

- **`@dk/shared`** gains the delivery and register-day contracts, the product-line shape carrying
  `density15`, and the audit actions for an admin-behalf upload and a photo rejection. `@dk/shared`
  has four byte-identical vendored copies — every change here must be mirrored to all four and
  md5-verified, per the standing repo rule.
- **`ServicePlugin` / `ServiceRunContext` / `ServiceRunResult`** — the service is an ordinary
  plugin with `cadence: 'DAILY'`. It does **not** need `nextRunAt` (its schedule is not read off
  the page) and it does **not** need `discoverScheduleOnAttach`.
- **`shared/src/dsr/products.ts`** — the philosophy is reused, the table is not. IOCL material
  codes and IRAS product codes are different namespaces (§7.3) and must live in different tables.
- **`presignUploadSchema`** (`shared/src/schemas/chat.ts`) — the register photo needs its own
  upload scope, image-only and dealer-scoped, alongside the existing `chat` / `avatar` / `staff`.
- **Nothing in the DSR contracts changes.** If a change there looks necessary, it is a sign this
  service has strayed into §4.
