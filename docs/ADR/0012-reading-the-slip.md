# ADR 0012 — Reading the slip

Status: accepted, 2026-09-02

- **Supersedes ADR 0009 (landing assistant) § 3.1's "the server never sees a PDF"** for images. That sentence was about
  the landing assistant's knowledge base, where rasterising and transcribing is a one-time laptop
  step. This is the first place a photograph is uploaded by a user and read by the server, so the
  posture it stated no longer holds platform-wide and is restated here with its own limits.
- Extends: ADR 0002 (service plugin contract) only in the sense that this is **not** a plugin — it is
  a request an admin makes, not a job on a schedule.
- Contracts: `shared/src/iras/slip.ts`, `shared/src/schemas/slip.ts`
- Routes: `mdg-backend/src/routes/v1/irasData.ts`, `mdg-backend/src/routes/v1/uploads.ts`
- Storage: `mdg-backend/src/lib/storage/keys.ts`, `slip/<dealerId>/<uuid>.<ext>`

## 1. What it is, in one paragraph

At an outlet with no portal automation — 16E today — somebody types the whole shift into the admin
every morning: six meter readings of six digits and three decimals each, read off a strip of thermal
paper and typed into a phone. With this change they photograph the paper instead. Both readers we
have look at it, the answer is checked against the money the slip itself prints, and every figure is
shown to the operator **before** anything is filled in. About sixty digits of typing a morning, and
the class of mistake that typing sixty digits on a phone produces.

## 2. The decisions

### 2.1 Nothing is ever both read and written by the server

There is no endpoint that reads a slip and fills a box. `POST …/read-slip` answers with what the
paper says and writes one `SlipRead` row; every figure still reaches the day through the ordinary
corrections commit the operator's Save already makes.

This is not tidiness. `METER_BACKWARDS` — a meter reading lower than yesterday's, which is
arithmetically impossible and produces a negative sale on the dealer's report — is a **client-side**
block. There is no `sold < 0` refusal in `corrections.ts`. A server path that filled a box from a
photograph would walk straight past it.

### 2.2 Two readers, and the proof is neither of them

The on-box reader (free, ~2 s, no network) is the authority: its transcript is what the parser reads,
and only the parser can produce a number that reaches a box. The model is an **independent second
opinion and a veto** — where the two disagree, that nozzle is unprovable and can never be filled in
as part of a batch.

The measurement that decided this: given a blurred photograph of the real 16E slip, the on-box reader
returned nothing and the model returned `54979.890` — confidently, `legible: true`, and the same
wrong number on four independent calls. Retrying does not catch that, and checking the model's
transcript against its own structured answer does not either, because both come from the same misread.
Because the parse is always the on-box reader's, that photograph produces `looksLikeASlip: false` and
the whole slip is refused.

**What actually proves a reading is arithmetic on the dealer's own paper.** Every nozzle block prints
two cumulative counters one line apart — litres ever pumped and rupees ever taken. Subtract yesterday's
accepted pair from today's, divide the rupees by the price the slip prints for itself, and the two
litre figures must agree:

|                           |                                                    |
| ------------------------- | -------------------------------------------------- |
| Yesterday's accepted read | CumVolume 48,285.220 · CumSale 5,287,999.480       |
| Today's slip              | CumVolume 48,615.550 · CumSale 5,325,771.850       |
| Litres by the meter       | **330.330 L**                                      |
| Litres the money says     | 37,772.370 ÷ 114.47 = **329.98 L**                 |
| Apart                     | **0.35 L**, against a tolerance of 6.60 L — proved |

The same slip misread as `48915.550` comes out **300.35 L apart**: caught at 7am, before the figure
reaches a box, by two numbers printed one line apart, using arithmetic the operator can redo by hand.

### 2.3 The anchor, and why it is character-identical or nothing

The rupee counter only proves anything if both counters were printed at the same instant. So a save
records, on the slip read it came off, which nozzles' figures it actually carried — and a nozzle
counts only when the figure now on record is the **character-identical** string the slip printed for
it (`recordSlipReadsApplied`, `irasData.ts`). If the operator typed their own figure over the slip's,
the strings differ, nothing is recorded for that nozzle, and tomorrow's reading is simply unprovable.

That is the honest answer, and the alternative is not a weaker proof but an inverted one: a rupee
counter anchored to a different instant produces a confident number that is wrong.

### 2.4 The upload scope, and the hole it closed

`POST /uploads/sign` ended in a **catch-all `else`, not an `avatar` branch**. A scope accepted by the
zod enum but given no branch was silently written to `avatars/<userId>/` — and `avatars/` is the one
prefix `/uploads/download-url` serves with **no access check at all**. A forecourt slip landing there
would have been signable by any authenticated account, a dealer's staff at another outlet included.

So this commit lands the enum, the key builder, the `slip` branch **before** the fall-through, and the
feature's own read path together. The fall-through is now a refusal with a `never` assignment in it:
the day somebody adds a scope and forgets its branch, the file stops compiling instead of quietly
filing their upload where anyone can read it.

`slip/` is deliberately **absent** from `/uploads/download-url`. Slip photographs are served only by
`GET /iras-data/dealers/:dealerId/slip-reads/:slipReadId/photo-url`, which resolves the owning dealer
from the stored record rather than from the key string, and re-checks the key against that dealer's
own prefix before signing it.

### 2.5 Dealers cannot send a slip

Admin only, at the presign and at the read. A dealer photographing their own totalisers into their own
report is a different feature with a different threat model; it should be decided on its own merits and
not inherited from this one. There is no client code for it either.

### 2.6 The portal dealers cannot be touched

Four fences, and the last two are on the server:

1. The shift sheet only offers the panel on a `MANUAL` day — advice, in a bundle that can be stale.
2. The read endpoint re-derives the day and refuses a snapshot that is not `MANUAL`.
3. It also refuses any dealer with an **ACTIVE** `iras-shift-data` service. Being collected for is a
   property of the outlet, not of the day, and this closes the window between midnight and a
   collection landing where a portal dealer can have a `MANUAL` shell day minted for them.
4. `IrasDayRowInForce.read` is optional and default-off, so every count, sentence and finding for the
   eight collected dealers is byte-identical to before.

`corrections.ts` is untouched. The correction job cannot change.

## 3. Storage and retention

`slip/<dealerId>/<uuid>.<ext>`. The operator's filename is thrown away — a camera-roll name says
nothing anybody will want, and a key is a path.

**Nothing is deleted, and there is no lifecycle rule on the photographs.** That matches the posture
everywhere else (`TtDensityDayLog`: "nothing is ever deleted") and it is what makes a stock variation
queried in six months traceable to the paper. It is stated here rather than discovered at the next
storage bill: roughly 3 kB of transcript plus one photograph per read, one read most mornings, at one
outlet today. A 400-day rule on the `slip/` prefix would be the first deletion policy in this codebase
and needs the owner's sign-off.

## 4. What it costs, and what it cannot spend

Per read: ≈51 paise on this repo's own rate table — call it **₹30 a month** at one slip a morning with
a retake. One spoken reply from the landing assistant is ₹8.

The slip reader **never calls `recordUsage`**. That counter is what `isBudgetExhausted()` compares to
the assistant's daily budget, and a busy morning at one petrol pump must never be the reason a visitor
to mdgservices.in is told to leave their number instead of being answered. Two purses, two lids: the
`SlipRead` collection is this feature's own meter, with its own daily cap.

## 5. Memory, on a 908 MB box that also runs Chromium

The photograph is capped at 4 MB, and the cap is enforced against what the object store says the object
**is** — `headObjectMeta` — never against the size the client declared. A presigned PUT carries no
`content-length-range`, so a client that declares one megabyte can upload two hundred, and `getObject`
would find that out by reading the whole thing into the heap.

A read holds the Buffer, its base64 and the JSON payload pinned across the retry chain at once: about
10 MB transient. `SLIP_READ_MAX_CONCURRENCY` defaults to **2** and the slot is taken before any of that
exists, so slip reading can never occupy more than two of the six shared model slots and can never
starve the public site. The on-box reader queues on its own memory budget.

The route also aborts the read when the operator presses Stop or the connection drops, so a slot is not
held for an answer nobody will see.

## 6. Consequences

- **`METER_BACKWARDS` is now reported after a save.** It was a client-only block, so a day saved past a
  stale bundle landed a negative sale with nothing said. The finding was already computed by the
  after-save pass; only the set lookup changed. A warning and not a refusal — the figures are already
  committed when it runs, and half a saved day is worse than a saved day with a sentence about it.
- **The audit row carries `readFromSlip`.** Only when there is one, so a portal dealer's entry and a
  hand-typed day nobody photographed keep exactly the shape they have always had. This is the only
  place the link between a figure and a photograph is written down.
- **The first morning at an outlet proves nothing**, by construction: there is no previous pair to
  anchor against, so every reading is accepted one at a time. The proof switches itself on after one
  day.
- **Three numbers here are reasoned, not measured**, and a week of real slips settles them: the
  tolerance (`max(0.5 L, 2% of the litres the money says)`), the compression profile, and whether the
  slip's "Nozzle No1" is this outlet's IRAS nozzle 1. The design catches a mismatch rather than
  assuming either way, and if the money check turns out not to hold day after day the fallback is
  already live and safe — every reading goes to its own card and there is no batch button at all.
- `SLIP_READ_ENABLED` defaults to **false**. Not configured means the panel does not render and no
  explanation is owed.
