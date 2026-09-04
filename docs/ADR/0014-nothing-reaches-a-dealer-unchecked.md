# 0014 — Nothing reaches a dealer unchecked

**Status:** accepted, shipped in SHADOW
**Date:** 2026-09-04

## What happened

IndianOil re-inspected dealer 1E on 3 September 2026. The DSR re-baseline picked
up the inspection and moved the measuring window onto it, which is what it is for.
It then put the inspection's meter readings on the **wrong nozzles**.

The report printed a stock variation of **2,646,765 L** against a true **263 L**.
It rendered, it saved, its two PNG cards were built, it was flagged HIGH, it was
marked stale — and it sat one confirm click from the dealer's phone.

Every guard in the system passed, and none of them was broken. They were all
_structural_: a missing ledger row, a non-adjacent day, a tank that reported no
fuel, a nozzle dispensing from a tank nobody configured. Not one thing anywhere in
the codebase asked whether a number was **possible**. A variation 134 times larger
than every litre the outlet had ever held was, to the machine, just a number.

Two facts decided the shape of everything below:

- **Nothing is recallable.** `routes/v1/messages.ts` has no delete and no edit
  endpoint, and `attachSignedUrls` presigns every attachment the instant the row
  exists. Once a card is posted the only remedy is a second message.
- **There are four ways a DSR reaches a dealer, not one.** The admin's Share
  button; the AI first line re-sending a report on a dealer's question; the Kavach
  daily digest, which is **automatic** and has no admin in it at all; and a
  flagged-off quoting path. A gate that lives only in the Share function protects
  the one path that already had a human looking at it.

## Decision

A pre-send correctness layer, `mdg-backend/src/assurance/`, in two halves — and
only one of them carries a guarantee.

### The detectors carry the guarantee

Pure functions over the generated artefact, encoding conservation laws and
arithmetic identities. Certain, cheap, synchronous, testable, and the thing that
actually stops a wrong figure.

**Every threshold was measured before it was written.** Each candidate rule was
replayed over all 517 product-days stored in production (201 reports, 9 dealers)
and its false-positive count recorded. The replay harness is
`npm run assurance:replay` and it needs nothing deployed.

The catalogue holds 5 of 201 reports, and every one of the five is a report we
already knew was wrong — three marked stale by the re-baseline, and two 16E days
where six days of shift data were never entered. **Zero false positives.**

Two rules came out of that replay and cost real money to learn:

1. **Never write a bound as `max(absolute, proportional)`.** A 100,000 L constant
   beside a 15,000 L outlet is not a floor, it is a licence: the constant always
   wins and the proportional arm never fires. Where a small-outlet guard is wanted
   it is a floor _on_ the proportional arm.
2. **The inspection day is not like other days.** A report's readings are taken at
   the shift anchor around 06:00; an inspection happens whenever the officer
   arrives. 1E's was at 15:58, so that day's report measures from a baseline taken
   nine hours _after_ its own anchor reading, and both meter sales and dip sales
   come out negative. All three of 1E's products look physically impossible on
   that day and all three are correct. Without the `daysSinceInspection >= 2`
   guard this layer would have held three healthy reports on its first day.

### The model may only add

A second, fallible reader for the shapes no rule anticipated. It is shown what the
detectors already decided and what the admin's remarks already explained, so it
neither repeats nor re-litigates.

- `BLOCK` is **absent from its response schema**. It has no route to withholding
  anything on its own.
- It never emits a corrected figure. It says "this looks wrong and here is why",
  never "it should be 263" — a model-supplied replacement is one copy-paste from
  becoming the report.
- Every concern is **fenced**: each number in it must appear verbatim at a cited
  fact path. A concern that fails is dropped, not softened.
- **Every safety property of this layer holds with the model deleted.** That is
  the test to apply to any change here.

The fail-closed rule matters more than any of it. `generateContent` returns empty
text on **five** distinct conditions — safety block, decline, truncation, genuine
emptiness, and unparseable output — and reading any of them as "no problems found"
silently disables the whole layer. `assist/llm/askJson.ts` exists to make that
impossible; five call sites had been hand-rolling the sequence and one of them
collapsed `declined` into the empty case.

### Gates re-check rather than trust a stored boolean

Each egress takes the **worse** of the stored verdict and a live Tier-A pass over
the stored digest. Tier A is pure and needs no database read, so this is free on an
already-loaded document, and it closes three holes a stored flag leaves open: every
report generated before the layer existed carries no verdict at all; `stale` is set
long after generation by something else entirely; and a check tightened tomorrow
would never apply to anything already written.

The verdict rides in the **same `saveReport` call** as the digest it judges, and is
therefore cleared by every regeneration. A pass left attached to figures it never
saw is the 1E failure one layer up.

### Remarks explain, they do not silence

An admin records standing operational facts — "1E tank 6's dip meter is broken so
its dip is entered by hand", "16E nozzles 5 and 6 are not functioning" — scoped to
a dealer and optionally a product, tank or nozzle.

Three limits, all enforced:

- **The floor belongs to the check's author, not the remark's writer.** A physical
  impossibility declares `maxDowngrade: 'NONE'` and no remark at any scope can move
  it. There is a test asserting that no remark anyone can write makes the 1E
  figures releasable.
- **A remark stops applying once the fault outgrows it.** Past 3× the figure it
  was written against, it lapses and the admin is shown both numbers. A note
  written when a pump was 200 L out must not silence it at 2,000 L.
- **Nothing is permanent.** 90 days, capped on save. The admin re-affirms it or
  the fault comes back.

They live in their own collection. Putting them in `DealerService.config` would
fail twice over: `dsrReportConfigZod` has no `.strict()` so the key is silently
stripped, and the JSON Schema's `additionalProperties: false` would then break the
next admin edit of that service.

## Consequences

- It ships in **SHADOW**: everything runs and is recorded, nothing is withheld.
  Replay says ENFORCE would hold 2.5% of reports and that all of them are wrong,
  but calibration against stored data is not the same as watching it run, and the
  reports it would hold are reports a dealer is waiting for. `ASSURANCE_MODE` is
  one variable.
- The model half is gated separately (`ASSURANCE_LLM`, default off), so a shadow
  period of the deterministic half costs nothing.
- A held report is not a failed dealer. The Kavach signal returns `UNKNOWN`, not
  `NOT_SATISFIED` — judging a dealer on figures we will not stand behind would be
  judging them on our own bad data, which is the same argument the existing `stale`
  branch already makes.
- An admin needs somewhere to see holds they did not cause. The automatic paths
  withhold on their own schedule with nobody watching, so the cross-dealer queue is
  not a convenience.

## What this does not do

It makes it impossible to send a report that states something the physics of a
forecourt forbids. **It does not make the report correct.**

Had 1E's baselines slid by 300 litres instead of 2,646,502, every check here
passes it. These are conservation laws, so they catch corruption that is large
relative to the outlet. Small, plausible wrongness remains exactly as invisible as
it was — and the honest response to that is better inputs and better
reconciliation, not a tighter threshold, because a threshold tight enough to catch
300 litres would fire on ordinary trading several times a week and be switched off
within a fortnight.
