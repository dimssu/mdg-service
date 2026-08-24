# ADR 0010 — Tanker invoices and the density they were loaded at

Status: accepted, 2026-08-24

- Extends: ADR 0002 (service plugin contract)
- Related: `docs/ADDING_A_SERVICE.md`, `LIMITATIONS.md` § "Portal scraping (SDMS / IRAS)"
- Spec: `docs/specs/tt-density-contract.md`
- Contracts: `shared/src/types/ttDensity.ts`, `shared/src/tt/materials.ts`, `shared/src/schemas/ttDensity.ts`

## 1. What it is, in one paragraph

Every day, for each dealer on the service, we log into IndianOil e-Mitra with
the dealer's own credentials, ask the **TT Acknowledgement ▸ Download Invoice**
screen for the last seven days of tanker invoices, store each invoice's PDF, and
read the `Density@15` figure the PDF prints for every product on it. An admin
sees those figures large, at the top of the dealer's screen, with the invoice
they came from one tap away and rendered in place. Separately, one photo a day —
of the outlet's **density test register page** — is uploaded by the dealer from
the app or by an admin from the portal, and that photo is what marks the day
done. Nothing is compared against anything, and nothing is written back to
IndianOil.

## 2. Why a plugin, and not an extension of something that already exists

`inspection-reports`, `credit-dod-monitoring` and `water-ingress-testing` all
already log into the same portal with the same credentials, and it is tempting to
hang a fourth screen off one of them rather than stand up a fourth service.

We are not doing that, for four reasons, and they are the reasons the plugin
contract exists at all:

| Reason                                     | What goes wrong if it is bolted onto an existing service                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A dealer buys a service, not a screen.** | An outlet that wants density figures but does not want us near their credit position would have to take both. Attachment is per service; that is the unit the commercial conversation is in.                             |
| **The schedules are different.**           | Water Ingress runs twelve times a day inside a statutory window. This runs once, in the morning. Merging them means either running the invoice fetch twelve times or teaching one plugin two schedules.                  |
| **The blast radius is different.**         | A selector change on the TT screen must not fail a dealer's Water Ingress compliance mark, which cannot be back-filled. Separate plugins mean separate `ServiceRun`s, separate failure codes and separate retry budgets. |
| **The registry costs nothing.**            | The whole point of ADR 0002 is that a new service is one folder and no central edits. Refusing to use that because "it is the same login" is paying the cost of the abstraction and declining the benefit.               |

The shared parts are already shared and stay shared: `automation/sdms/login/`,
`automation/sdms/emitra/`, `sdmsAccountGate`, `sdmsBrowserSemaphore`. This
service takes both gates in the same order as every other SDMS plugin — the
account gate outside, the browser semaphore inside — so a fourth daily service
tightens an existing queue rather than opening a new one.

## 3. The scope fence: this service is READ-ONLY on the portal

The TT Acknowledgement table has three controls we must never touch:

| Column                             | Why not                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vehicle Condition** (a select)   | It is a statement about the physical state of a tanker that arrived. Nobody at MDG looked at that tanker.                                                                                                               |
| **Check Ack Status** (a button)    | Harmless in itself, but it lives one cell away from Acknowledge and a loose selector reaches both.                                                                                                                      |
| **Acknowledge Receipt** (a button) | **Acknowledging a receipt is a legal act by the dealer.** It says the dealer received that load, in that condition, in that quantity. A robot must not perform it, and no config flag will ever be added that lets one. |

This is not a policy note; it is enforced. The collector resolves the Download
control **by header regex within its own column** and never by position, and it
refuses the whole row with `COLUMNS_NOT_RECOGNISED` if the column it resolved to
also matches `/acknowledge|ack\s*status|vehicle\s*condition/i`. The only click
this service ever makes inside a table row is on the Download link. The same
sentence appears at the top of `automation/sdms/ttDensity/collector.ts`, in
`mdg-backend/src/services/tt-density/README.md`, and here.

## 4. The dedup key

A seven-day window fetched daily means each invoice is seen about **seven
times**. An invoice that arrived on the 17th is listed again on the 18th, 19th,
20th, 21st, 22nd, 23rd and 24th. Seven documents for one tanker would show an
admin the same delivery seven times with no way to tell which row is the real
one, and would download the same bytes seven times against a seven-minute run
budget.

**An invoice is identified by `(dealerId, sapInvoiceNo)`.** Uniqueness is
enforced in two places that must agree: a Mongo unique index
`{ dealerId: 1, sapInvoiceNo: 1 }` on `ttinvoices`, and the same tuple as the
filter of the store's `findOneAndUpdate(..., { upsert: true })`.

### Why the compound tuple and not `sapInvoiceNo` alone

A SAP billing document number is very probably globally unique inside IndianOil's
SAP — `7010045406` and `7009874468` are consecutive-looking numbers from one
number range, and that is what a billing document number is for. **We have not
verified it, and cannot.** So the choice is between an assumption whose failure
is silent and destructive, and one whose failure is nothing at all:

| If we index on…              | …and the number is globally unique                     | …and it is not                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ sapInvoiceNo }`           | correct                                                | **a second dealer's real invoice is rejected by a duplicate-key error and lost for good**, and the run reports a row failure that looks like a portal problem |
| `{ dealerId, sapInvoiceNo }` | correct — the compound is a superset of the unique one | correct                                                                                                                                                       |

The compound index is right in both worlds, and the only thing it gives up is
the ability to detect the same invoice reaching two dealers — which cannot
happen, because a tax invoice is addressed to one outlet.

## 5. Whether the PDF is re-downloaded on a re-sighting

**No. The bytes IndianOil issued do not change.** A second sighting of invoice
`7010045406` on the 23rd is the same document as the first sighting on the 22nd,
so re-fetching it spends a run's budget to arrive at a file we already hold.

The obvious implementation is `$setOnInsert: { pdfKey }` on the upsert. **That is
wrong, and the reason is the case the naive version gets silently wrong:** the
first sighting can create the row and then fail to download the PDF — the link
was a popup we did not expect, the download event never fired, the portal served
an error page, the run hit its deadline halfway down the table. `$setOnInsert`
only fires on insert. The row now exists, permanently, with no PDF, and every
subsequent run sees an existing row and writes nothing. The invoice would sit in
the admin's list for ever with an empty density and a Download button that goes
nowhere, and nothing in the system would be trying to fix it.

So the sighting and the PDF are **two separate verbs**, exactly as
`recordDay` / `recordDayFailure` are in the Water Ingress store:

- `recordInvoiceSighting()` upserts the row from what the portal's table showed —
  invoice number, invoice date, vehicle number — every time it is seen. It never
  touches `pdfKey`.
- `attachInvoicePdf()` writes `pdfKey`, `pdfSha256`, `pdfStatus: 'STORED'` and
  the parsed densities, under a filter that additionally requires
  `pdfStatus: { $ne: 'STORED' }`. It is a no-op on a row that already has its
  bytes, and it succeeds on a row that does not — however that row came to exist.

What the collector skips is therefore not "invoices I have seen" but **"invoices
whose PDF I already hold"**: the plugin passes
`storedInvoiceNos = listStoredInvoiceNos(dealerId, from, to)` into the collector,
and every other listed row is a download candidate. A first-attempt failure
becomes tomorrow's first-attempt retry, for free, with no retry queue.

That loop has to terminate. `pdfAttempts` is incremented on every failed
download and, at `TT_PDF_MAX_ATTEMPTS = 3`, the row moves to
`pdfStatus: 'FAILED'` with the last failure code and drops out of the candidate
set. Three, not one, because the two most likely causes (a portal hiccup, a run
deadline) both clear by themselves; and not ten, because a fourth attempt on a
row that has failed three times on three different days is not a retry, it is a
daily tax on every run for an invoice that needs an engineer.

## 6. Reading the PDF: `pdfjs-dist`, pure JS, no system packages

The invoice has a real text layer — verified against the real file
`7010045406.pdf`, not assumed. Extraction was prototyped end to end and produced
`Density@15: 727.300` for the EBMS line (material 16730) and `820.500` for the
HSD-BSVI line (material 50700), together with the SAP invoice number, the tanker
number, the date and time, the document number, the invoice total, the delivery
and sales-order numbers, and the tank and compartment numbers for both products.

The obvious tool is `pdftotext -layout`, and it is the tool the grammar was first
seen working under. **We are not using it**, for one reason that outweighs its
convenience:

> `mdg-backend/deploy.sh` is `git pull` → `npm ci` → `npm run build` → `pm2
restart`. There is no `apt install` step of any kind. Poppler is not on the
> production box unless somebody put it there by hand, and nothing in the deploy
> would tell you it was missing.

The failure that produces is the worst kind: the deploy succeeds, the service
registers, the run logs in, reaches the portal, downloads the invoice — and then
fails on every single invoice with a message about a missing binary that no admin
looking at the admin UI can act on and no engineer looking at the run history
would think to connect to the shell. This repo already has the precedent written
down: ADR 0009 §5.1 records _"There is no ffmpeg on the server (verified)"_ and
changed the design rather than adding a server prerequisite.

So: **`pdfjs-dist`, the `legacy/build/pdf.mjs` entry point, in-process, no
worker, no system package.** It arrives with `npm ci` like every other
dependency, which means the thing that proves it works is the same thing that
proves the build works.

Honest about the cost:

| Cost                        | Number                                                                       | What we do about it                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install size                | ~10 MB in `node_modules` (the legacy build ships its own font and cmap data) | Accepted. It is disk, not memory, and the box has disk.                                                                                                                                                                                                                                                                                                                                                              |
| Resident memory once loaded | ~30–50 MB                                                                    | The module is `await import()`ed **lazily, inside the extraction function**, never at module scope. The plugin registry imports every plugin's `index.ts` at boot; a multi-megabyte parser loaded at boot would be resident on a ~1 GB box twenty-three hours a day for a service that runs for two minutes. It is cached in a module-level `let` after the first call, so the second invoice in a run pays nothing. |
| Worker                      | pdfjs wants a web worker it cannot have in Node                              | Run in the "fake worker" in-process: `useWorkerFetch: false`, `isEvalSupported: false`, `disableFontFace: true`, `verbosity: 0`. There is nothing to parallelise — one invoice at a time, inside a run that is already serialised by `sdmsBrowserSemaphore`.                                                                                                                                                         |
| Peak while parsing          | one PDF's page content at a time                                             | The bytes are copied into a fresh `Uint8Array` before being handed to pdfjs, because pdfjs takes ownership of the buffer it is given and a detached Node `Buffer` upstream is a bug that only shows up on the second use.                                                                                                                                                                                            |

`pdfjs-dist` gives positioned glyph runs, not lines. Line reconstruction is ours:
items are clustered into bands of `LINE_BAND_PT = 2.2` on the text-matrix `y`,
and a gap wider than `SPACE_GAP_RATIO` of the neighbouring glyph's own width
becomes a space. Both constants are justified where they are declared, and both
are held to the fixture by `invoice.test.ts` — the extracted text of the real
invoice is committed as a fixture, so the grammar is tested on every machine
whether or not it has a PDF.

The whole mechanism lives in one file, `automation/sdms/ttDensity/pdfText.ts`,
behind `extractPdfText(pdf: Buffer): Promise<PdfTextResult>`. If it ever has to
change, that is a one-file change and the fixtures say immediately whether the
replacement produces the same text.

**The raw extracted text is saved as a diagnostic artifact for every invoice.**
When a density fails to parse, that artifact settles whether the PDF or the
grammar is at fault, without re-running anything and without a second portal
visit.

## 7. Two collections, not one

`TtInvoice` and `TtDensityDayLog` are separate collections. They look joinable —
both are per-dealer, both are about a day — and they must not be joined:

|                    | `TtInvoice`                          | `TtDensityDayLog`                                |
| ------------------ | ------------------------------------ | ------------------------------------------------ |
| Who writes it      | a robot, unattended, at 07:35        | a person, with a camera, whenever they get to it |
| Key                | `(dealerId, sapInvoiceNo)`           | `(dealerId, businessDate)`                       |
| How many per day   | zero, one, or five                   | exactly zero or one                              |
| Who may write it   | nobody outside the plugin            | a dealer-owner, a dealer-staff, or an admin      |
| What absence means | no tanker arrived — an ordinary week | the day is **not** done — a compliance gap       |
| Lifecycle          | immutable once the PDF is stored     | replaceable; a blurry photo is a real thing      |

Merging them would produce a document that is an invoice on the days a tanker
came and a photo record on the days one did not — a row that lies about what it
is — and would put a dealer-writable field on the same document as portal
financial data, which is the shape access-control bugs are made of.

There is deliberately **no third collection** for "collection state". `lastRunAt`,
`lastOutcome` and `lastFailure` come from the most recent `ServiceRun` for
`(dealerId, 'tt-density')`, which already holds exactly those facts, is already
indexed, and cannot drift from itself.

## 8. What "latest density per product" means, and where it is computed

The headline the owner asked for — the big figures at the top — is _"the most
recent density this outlet received for each product it stocks"_. That is not a
stored fact. It is a question about the invoice history.

**It is computed on read, in the store, over a bounded window**, by
`getLatestDensities(dealerId)`: take the most recent
`TT_LATEST_DENSITY_SCAN_LIMIT = 40` invoices for the dealer, sorted
`{ invoiceDate: -1, sapInvoiceNo: -1 }`, walk them newest-first, and keep the
first density seen for each product key.

Reasoning about volume, because it is what decides between the three options:

- A busy outlet takes one to three tankers a day. That is **roughly 400–1,000
  invoices per dealer per year**, and about **50,000 documents a year** across an
  estate of fifty.
- Forty invoices is therefore **two to six weeks** of deliveries — long enough
  that any grade the outlet actually stocks has appeared, short enough that the
  read is one bounded index scan.
- Computing it **on write** would mean a denormalised "latest densities" document
  updated by every run, which is a second copy of a derived fact that can
  disagree with the invoices it was derived from — and it would still be wrong
  the moment an older invoice arrived late and had to be inserted behind a newer
  one.
- Computing it in an **aggregation** (`$sort` + `$group` + `$first`) is correct
  and unbounded, and buys nothing at this size that the bounded scan does not
  already give. At fifty thousand documents a year it is a pipeline where a
  `find().limit(40)` would do.

Every headline figure is printed **with the invoice date and tanker number it
came from**, so a five-week-old XtraPremium figure cannot be mistaken for
today's. A grade that has not been delivered in the last forty invoices simply
does not appear in the headline; that is the correct behaviour, not a gap.

Density is printed **exactly as the invoice printed it**. `density15Raw`
(`"727.300"`) is stored beside the parsed number and is what the UI renders. The
invoice states no unit; kg/m³ at 15 °C is our reading of the magnitude, not the
portal's statement, so the unit is UI chrome and never part of the data.

## 9. The daily photo

One photo per day, for the whole outlet, of the **density test register page**.
Uploading it marks that day done.

- **Not per product, not per tanker.** The register is one page for the outlet's
  day; asking for one photo per grade would be asking for four photos of one
  page.
- **No typed density number, and no comparison.** We do not ask anyone to key in
  a measured density, and we do not reconcile the register against the invoice.
  A comparison needs a tolerance, and a tolerance is a number somebody has to
  defend to a dealer whose figure it just called wrong. That conversation has not
  happened, so the feature has not been built, and no UI hints that it exists.
  The shape is left open: `TtRegisterPhoto` carries an optional `note`, the day
  log has room beside `photo`, and the product catalog in
  `shared/src/tt/materials.ts` yields the _same_ product keys (`MS`, `HSD`, `XP`,
  `XG`) as the DSR's IRAS catalog — so a future reconciliation joins on the key
  rather than needing either table rewritten.
- **Who may upload:** the dealer's owner or staff, from the app, for their own
  outlet — the route takes the dealer from the token and has no `:dealerId` at
  all, so there is nothing to tamper with. Or an admin, from the portal, on a
  named dealer's behalf; the record says which.
- **Which day:** the business date is in the path, validated as a real IST
  calendar date and refused if it is in the future. A dealer may back-date up to
  **7 days**; an admin up to **60**. Seven, because someone away for a week
  should be able to catch up, and a dealer marking a month of days at once from
  one photo is not a record of anything.
- **Replacing, not undoing.** A second upload for the same day replaces the
  photo; the previous one moves to `superseded[]` and nothing is deleted. There
  is deliberately no "unmark": Water Ingress's rule (_"The portal has no 'unmark
  this slot'"_) is about IndianOil's record, but here the record is ours, and a
  compliance mark that can be silently removed is a compliance mark that proves
  nothing. Replacement covers the real case (a blurry photo) and leaves an audit
  trail; erasure covers a case nobody has described.

## 10. Failure taxonomy — what retries itself, and who fixes the rest

Two levels, and keeping them apart is the point.

**Run-level failures** are thrown as a `TtDensityError`, translated to a
`RunFailure` by the plugin, and either deferred (20–40 minutes, at most twice) or
left for a human:

| Code                                                                                                    | Transient? | Who fixes it                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `LOGIN_PAGE_UNREACHABLE`                                                                                | yes        | Nobody — the next run normally succeeds                                                                                    |
| `LOGIN_CAPTCHA_EXHAUSTED`, `LOGIN_CHALLENGE_EXHAUSTED`, `LOGIN_CHALLENGE_UNAVAILABLE`                   | yes        | Nobody                                                                                                                     |
| `NAV_HOME_FAILED`, `SESSION_EXPIRED`                                                                    | yes        | Nobody — the SSO handoff is the portal's known flaky edge (`LIMITATIONS.md`)                                               |
| `MENU_OPEN_FAILED`                                                                                      | yes        | Nobody first, Engineering if it repeats — a collapsed sidebar and a renamed menu look the same for one run                 |
| `FETCH_FAILED`, `TABLE_NOT_FOUND`                                                                       | yes        | Nobody first, Engineering if it repeats                                                                                    |
| `ACCOUNT_COOLDOWN`                                                                                      | yes        | Nobody — the account breaker is doing its job                                                                              |
| `CAPTURE_TIMEOUT`                                                                                       | yes        | Nobody                                                                                                                     |
| `LOGIN_REJECTED`                                                                                        | **no**     | **Admin** — re-enter the dealer's SDMS credentials. Retrying a wrong password walks a real dealer's account into a lockout |
| `SDMS_CREDENTIALS_MISSING`                                                                              | **no**     | **Admin** — the dealer has no SDMS credentials stored                                                                      |
| `OCR_SIDECAR_UNAVAILABLE`, `BROWSER_LAUNCH_FAILED`                                                      | **no**     | **Ops** — a server install, not a portal condition                                                                         |
| `DOWNLOAD_INVOICE_MISSING`, `DATE_FIELDS_NOT_FOUND`, `FETCH_BUTTON_NOT_FOUND`, `COLUMNS_NOT_RECOGNISED` | **no**     | **Engineering** — the portal changed shape, and a selector does not un-break itself in twenty minutes                      |

**Row-level failures are not run failures.** One invoice whose link did not fire
(`INVOICE_LINK_NOT_FOUND`, `PDF_NOT_A_DOWNLOAD`, `PDF_EMPTY`) or whose text could
not be read (`PDF_TEXT_UNREADABLE`, `DENSITY_NOT_FOUND`) is recorded against that
invoice and named in the run output; the other rows are already saved and the run
ends `PARTIAL`. Modelling a bad row as a run failure would set the retry
machinery chasing something a retry cannot fix, and would throw away the nineteen
invoices that worked.

The same rule protects the figure itself: **a product with no readable density is
emitted with `density15: null` and an `extractionNote`, never dropped and never
guessed from a neighbour.** A visible gap next to a viewable PDF is recoverable
in ten seconds by a human. A wrong number copied into a dealer's register is not
recoverable at all.

## 11. Cadence

`DAILY`, `defaultCustomCron: '35 7 * * *'` (IST). After the portal's overnight
batch has settled and before the office opens. Thirty-five minutes past, not on
the hour, because `water-ingress-testing` fires at `0 1-23/2 * * *` — including
07:00 — for every dealer that has it, and `SDMS_MAX_CONCURRENCY` bounds live
Chromiums to two across **all** SDMS pipelines. Landing on top of the water
window would queue this service behind the estate.

`nextRunAt` is returned in exactly one case: when the run stopped because it hit
`maxDownloadsPerRun` and there is more of the window still to fetch. Then it asks
for `now + 45 min`, which the runner clamps and honours only on a scheduled run
that completed. In every other case the plugin returns no opinion, because
nothing it learned changes when the next run belongs — and a plugin that returns
an opinion it did not earn is a plugin whose schedule nobody can explain.

There is no `discoverScheduleOnAttach`. That hook requires the attach run to be
side-effect-free, and this service's whole run is a side effect.

## 12. Serving the invoice

Two signed URLs from one storage key: `inline` for the `<iframe>` the admin reads
it in, `attachment` for the rare save. Both are returned as JSON from
`GET /tt-density/dealers/:dealerId/invoices/:invoiceId/pdf-url`, not as a 302 —
an `<iframe src>` cannot carry a bearer token, so the token-gated redirect used
for run artifacts would 401 in the frame.

The stored-XSS caveat in `utils/contentDisposition.ts` (_"Never use this for raw
portal captures"_) is about `text/html` bodies served inline from the bucket
origin. A PDF is in the same class as the Credit & DOD card PNG: something we
positively want rendered in place, that does not execute in our origin.

**Viewing an invoice writes an audit row.** This codebase audits reads of
sensitive files, not only writes — `ARTIFACT_DOWNLOAD` on the artifact redirect,
`RECORD_VIEWED` on a record detail, `ATTACHMENT_DOWNLOAD` on staff photos always.
An IndianOil tax invoice carries the dealer's purchase amounts; it belongs in
that set. The action is `TT_INVOICE_PDF_VIEW`.

Cross-dealer reads are prevented twice: the admin routes are
`requireRole('admin')` at the router, so no dealer token reaches them at all; and
each handler asserts the loaded document's `dealerId` equals the path's before
signing anything, answering **404, not 403**, so a guessed id does not confirm
that the invoice exists.

## 13. What is deliberately not built

- **No reconciliation of the register against the invoice.** §9. The tolerance
  has not been agreed, and no screen hints that a comparison exists.
- **No typed density entry.** The photo alone marks the day.
- **No writing to the portal, ever.** §3.
- **No OCR fallback for a scanned invoice.** These invoices have a text layer.
  One that does not gets `PDF_TEXT_UNREADABLE` on that invoice, a stored PDF a
  human can read, and a headline that shows a gap rather than a guess.
- **No PDF renderer in the bundle.** No `react-pdf`, no `pdf.js` in the admin.
  The browser has a PDF viewer; adding one to a bundle for a screen an admin
  opens at a desk is a cost with no buyer.
- **No dealer access to the invoice PDFs.** The dealer sees their own latest
  densities and their own register photos; the tax invoices stay admin-only. The
  dealer already holds these documents from IndianOil, and serving financial
  documents to a dealer token widens the surface for no new fact. If the owner
  wants it, it is one route and one guard.
- **No roster column state for the daily photo.** The `tt-density` roster column
  reports what the _run_ did (`DONE` / `FAILED` / `PENDING`), like every other
  non-delivering service. "Which dealers have not uploaded today's register page"
  is a genuinely useful estate view and belongs in the cross-dealer Data Vault
  later, not as a per-dealer query inside a roster render.
- **No back-fill beyond the configured window.** Raising `lookbackDays` once is
  the back-fill; a separate back-fill path would be a second way to do the same
  thing with its own bugs.
- **No "unmark".** §9.
- **No config for what gets clicked.** There is no toggle that could ever set
  Vehicle Condition or press Acknowledge, for the same reason Water Ingress has
  no toggle that can file a false water alarm.

## 14. Known hazards for the first live run

Everything after `LOGIN` and `NAV_HOME` was written from screenshots, not a DOM
dump. Specifically unresolved, and each one has a diagnostic that settles it:

1. The exact menu label ("TT Acknowledgement" vs "TT Acknowledgment") and whether
   "Download Invoice" is a sub-item, a tab or a column. → text ladders, plus
   `step_*.png` from a headed dry run.
2. Whether the date filter is a native `<input type="date">`, an Angular/MUI
   picker or two selects — and therefore whether `fill()` sticks or the IRAS
   select-all-and-insert dance is required. All three date formats exist on this
   portal: `DD-MM-YYYY` on the PAD wire, `DD/MM/YYYY` in the grid, `YYYY-MM-DD`
   from a native input.
3. Whether the results grid is a plain `<table>` or an ag-Grid. The settle helper
   races both; the reader must handle `[role="row"]`.
4. How the download actually fires — a real `href`, a JS handler raising a
   `download` event, a same-page navigation, or a POST-driven download that none
   of those three cover. The first row's `href` and `onclick` are dumped to
   `download_link_*.txt` on every run, which answers it in one look. If both are
   empty, watch `page.on('response')` for `application/pdf` and read the body.
5. `download.path()` can return `null`. An unguarded read stores a zero-byte PDF,
   which is worse than storing none.

The first run is `npm run automation:tt-density -- --headed --days 7` **with no
`--download`**. Budget a day, with the dealer's credentials, before the service
is attached to anybody.

## 15. Naming

`tt-density` is an internal slug and "TT Density" an internal admin label.
Neither is a customer-facing product name, so no package or trademark check is
warranted. If this ever gets a name a dealer sees, check it first.
