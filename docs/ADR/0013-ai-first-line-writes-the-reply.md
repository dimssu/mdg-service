# ADR 0013 — The AI first line writes the reply

Status: accepted, 2026-09-04. Supersedes nothing; extends the v1 design that has
been live for ten dealers since August at about three paise a turn. Extended by
ADR 0017 (2026-10-12), whose briefing engine is the live one. This router and
writer stay selectable as the fallback: the admin's "Templates only" switch, or
`AI_FIRSTLINE_ENGINE=router`. Risk 1 and 1b below still apply to the briefing
engine's replies (ADR 0017, "Costs, stated").

## What forced this

Three real turns at dealer 1E, on the first day of real use:

| They asked                                      | It said                                                             | Outcome        |
| ----------------------------------------------- | ------------------------------------------------------------------- | -------------- |
| "Today's report?"                               | "The report for Yesterday is ready and MDG is checking it…"         | Answered, 3p   |
| "What do I need to do now?"                     | "I couldn't check this one myself. I've passed it to the MDG team…" | **Handed off** |
| "Kan you give me the dsr report for yesterday?" | **byte-identical to row 1**                                         | Answered, 3p   |

Two failures, and neither is a bug in the sense of something being broken.

**Two different questions produced the same sentence**, because both resolved to
the same underlying fact and v1 could only emit one of about thirty sentences a
person had written. Accurate. Reads as the machine not listening.

**The dispute window misfired.** "What do I need to do now?" is an ordinary
conversational follow-up, not a complaint. That rule was written when the machine
could only emit fixed sentences, where a second message genuinely did mean "you
did not answer me". In a conversational product the premise is false, and it
fired on the very first real conversation.

## The decision

Keep the safety spine exactly as it is, and add ONE stage.

- The router still emits LABELS, not tool calls. No lookup takes a `dealerId` —
  it comes from `conversation.dealerId` — so **no sentence a dealer writes can
  point a lookup at another outlet**. That gate is structural, not a filter, and
  it is unchanged.
- Code still runs the lookups. Neither model touches the database.
- A **second model call** now writes the reply from a small JSON of THIS TURN'S
  FACTS plus the recent conversation. It has no tools, no database, and nothing
  about any other outlet.

The two calls are **strictly serial**, and that is a safety property rather than
an optimisation we skipped: the facts do not exist until the router has emitted a
label and code has run the lookup that label names. Overlapping them would be the
tool-calling architecture this design exists to avoid.

### The hinge: templates become the fallback, not the product

`compose.ts` renders the v1 template for the primary ask **before** the writer is
called. If the prose fails any check in `fence.ts` — or the writer times out, the
vendor is busy, the JSON is malformed, or the writer is switched off — that
template is posted and **the dealer is told nothing**.

> A fence failure posts the hand-written template for the same fact, and the turn
> stays ANSWERED. It never hands off.

That is what lets the fence be brutally strict: **being strict costs a nicer
sentence, never an answer**. `assertEveryWriterIntentHasAFallback()` holds it at
module load, because with no template to fall back to a refused reply would
become a handoff, the fence would start costing answers, and the first person to
notice would loosen the fence.

The one exception: the writer returning `facts_answer_it: false` is not a fence
failure. It is the writer saying the router mislabelled the message, so there is
no correct sentence to fall back to, and the turn hands off.

### The fence

Prose has no slots, so v1's slot check has nothing to check. The replacement
works the other way round from what you would expect: **account for the digits we
can explain, blank them out, and refuse if anything is left.** Nothing survives
unless it is explained, so a whitelist starting from zero fails closed by
construction — and it handles the awkward cases for free, because a Kavach task
called "10 am tank dip check" is masked as one span and its digits never reach
the scanner.

Seventeen rules, every one collected on every turn (the ordering is for the log,
not for control flow). The strongest is not a regex about models: **a unit family
may appear only if some fact in this turn's envelope carries that unit.** Not one
lookup returns litres, rupees or a percentage by default, so today that reduces
to _no ₹, no litres, no percentages, ever_.

## Named risks

**1. The fence proves PROVENANCE, not ATTACHMENT.** Given `{points: 142, hidden:
3, total: 8}`, a reply saying "3 points" passes every rule and is wrong. On a
multi-ask turn it can prove a date came from a lookup; it cannot prove that date
belonged to the DSR rather than the density register. What holds it down is
arithmetic and review, not logic: a four-numeric-fact cap on the envelope, a
three-ask cap, per-tool key namespacing, temperature 0.3 with a two-sentence
reply, the review queue, and the three-`WRONG` breaker. **This is the residual
risk and it is the specific thing the first fortnight's review should look for.**

**1b. And the sharpest form of it is a BOOLEAN, not a figure.** The example above
is a number, which makes the risk sound narrower than it is. Verified against the
fence as built: with `dsr_status.shared_with_you: false` in the envelope, the
reply "Yesterday's report has been shared with you already" passes every one of
the seventeen rules — it carries no digit, no unit, a sourced date and a sourced
service name. So does "Nothing is pending from your side" on a turn whose
envelope says three papers are owed. Both are materially wrong and both are
things a dealer ACTS on: one sends them hunting for a report that was never
shared, the other lets a compliance deadline go by.

This matters more than the number case because a status reply is mostly
booleans — `exists`, `shared`, `received`, `ever_submitted` — and the fence has
no rule that touches them at all. Nothing in code can fix it: a flag's meaning is
carried by the sentence, not by any token in it. The mitigations are the ones
above plus one specific instruction to reviewers: **when reading the first
fortnight's turns, check the yes/no of every reply against the turn's own facts
block, not only its figures.** The `writerProse` field and the facts on the turn
row make that a two-column comparison.

**2. Hindi register drift is the most likely QUALITY failure and no code check
can catch it.** `fence.ts` will pass "दैनिक विक्रय प्रतिवेदन प्रेषित किया गया है"
without a murmur, and a pump owner will read it as a government circular. The
sixty words of the prompt's Hindi paragraph are the whole defence. If they are
ever trimmed for token cost, "निरीक्षण" comes straight back. A human must read
the first fortnight's Hindi turns specifically for register.

**3. `scanOutput` allows ₹3,000 today.** Its `pricing` rule passes any body where
every figure is in `SANCTIONED_AMOUNTS = [3000, 15000, 18]` — the LANDING SITE'S
published price — so a dealer support reply quoting a ₹3,000 monthly fee passes
it untouched. Measured, not reasoned. **The fix is not to edit that list**, which
is the public assistant's commercial offer; the unit fence closes it
categorically instead, and `fence.test.ts` asserts both halves so the reason
survives.

**4. Timing promises cannot be checked in code.** "It'll come by evening" has no
digit and no unit for any rule to catch. The explicit shapes are caught; the soft
ones are not. The real mitigation is negative — keep future-tense facts out of
the envelope — and it depends on nobody adding a schedule field without also
adding a rule. That sentence is in `facts.ts` beside the field they would add.

**5. `MAX_CONSECUTIVE` 2 → 6, plus the dispute-window deletion, removes both of
the things that used to make a long thread reach a person.** `talk_to_human`
still always wins, but it depends on them asking (since ADR 0017 there is no
"Talk to a person" button; a typed request is still recognised in code) — and a 55-year-old who thinks
he is talking to the MDG team may not know to. `missStreak` and `same_answer` are
the replacements, and six is a guess a shadow week should confirm.

**6. `getDealerDocumentAsks` is the heaviest lookup in the inventory** (~6–7
indexed reads) on a 908 MB box that already caps browser concurrency at 1 after
twelve OOM kills. It is the same cost the dealer's own Documents screen pays on
every open, so the shape is proven — but a `todo` turn is now the most expensive
turn the machine makes, and it is also the one the owner will ask for most.

**7. The 4,500 ms router timeout is a budget, not a measurement.** Before
trusting it, run the `latencyMs` percentile aggregate over v1's turns; if p95
already exceeds ~4,000 ms, raise the router's share and lower the writer's,
keeping the 9,000 ms turn deadline fixed.

**8. Token estimates are character-count arithmetic, not measurements.** The
method reproduces the live 3-paise v1 figure exactly, which anchors the router.
The writer's prompt size and the ~2 chars/token Devanagari rate are reasoned.
Replace both from the first fifty real rows.

## What this is measured by

Both come off `AiTurn` and neither existed before.

1. **Prose rate** — `writer === 'prose'` ÷ all `ANSWERED`. **Below about 70% and
   nothing has changed**: dealers are still reading v1's sentences and we are
   paying for output we throw away. `fenceFailure` says which rule to look at,
   and **the fix is the envelope or the prompt, never the fence.**
2. **Quick-follow-up rate** — `quickFollowUp` ÷ all `ANSWERED`. Unmeasurable
   under v1, because the window handed off instead of recording.

Watch both **split by language**. A systematically high rejection rate on Hindi
would quietly mean Hindi dealers get templates while English dealers get prose,
and the aggregate would look fine.

## What running out of money costs

Two lids, and the ordering is the design.

| bound                              | fires when                | affects        | they lose                   |
| ---------------------------------- | ------------------------- | -------------- | --------------------------- |
| per-dealer count (60/day, 20/hour) | one dealer floods         | **one dealer** | this hour's questions       |
| writer budget (₹150)               | the day is genuinely busy | everyone       | **prose, not answers**      |
| day budget (₹400)                  | something is faulty       | everyone       | answers (handoff, as today) |

> Running out of money must cost the dealer variety BEFORE it costs an answer.

A single lid has one failure mode and it is the worst available: the machine goes
dark for every dealer for the rest of the day, which forces the lid so high it
protects against nothing.

MEASURED, not estimated: the writer's system instruction is 1,121 tokens, so a
written turn costs **8 paise** and a template-only turn stays at 3. (The spec's
working assumed a 650-token prompt and 9 paise; the prompt is bigger and the turn
is cheaper, because output tokens dominate and there are few of them.)

**8 paise is the ENGLISH turn, and the table below is built on it.** Output is
priced 8.3× input, and Devanagari tokenises at roughly half the characters per
token that Latin does, so the same two sentences in Hindi carry two to three
times the output tokens. On the reasoned rate in risk 8 that puts a Hindi written
turn nearer **10–11 paise**, which moves every row here by a quarter to a third
and brings the ₹400 hard lid forward by several hundred turns in the last row.
Most of these dealers write Hindi. Nothing is wrong with the lids — they are
counted in paise as they are spent, not in turns — but the ₹/day column is an
English-shaped estimate and should be replaced, per risk 8, from the first fifty
real rows split BY LANGUAGE rather than in aggregate.

| dealers × questions/day | turns  | written | templated | handed off | ₹/day      |
| ----------------------- | ------ | ------- | --------- | ---------- | ---------- |
| 10 × 6                  | 60     | 60      | 0         | 0          | **4.80**   |
| 10 × 60                 | 600    | 600     | 0         | 0          | 48.00      |
| 200 × 6                 | 1,200  | 1,200   | 0         | 0          | 96.00      |
| **200 × 60**            | 12,000 | 1,875   | 8,333     | **1,792**  | **400.00** |

BE PRECISE ABOUT THE LAST ROW. Two hundred outlets each firing all sixty of their
allowed questions is ₹400 a day and about **85% of those twelve thousand
questions still get a correct answer**; the last 15% hand off to a person, which
is the hard lid working exactly as designed. It is not "every question answered",
and saying so would be the kind of round number that stops being checked. The
realistic shapes — the first four rows — never reach it: the day budget does not
bite until roughly 666 outlets at six questions a day.

## Deploy

Done: by 2026-09-05 the writer was on for all ten dealers, and the box now runs
the briefing engine (ADR 0017), which only runs while written replies are
allowed. What follows is the original rollout plan.

`AI_FIRSTLINE_WRITER_ENABLED` ships **false**. With it off the product is
byte-identical to what is live today. Ship the limits, the dispute-window
replacement, `documents_open` and the streak first; watch a day; then switch the
writer on for one dealer in SHADOW, then one live, then the rest.

**The production `.env` overrides most of these numbers**, so changing a default
in `env.ts` changes nothing on the box. `mdg-backend/.env.example` is the list of
lines to reconcile, and two vars must be **deleted** there:
`AI_FIRSTLINE_TIMEOUT_MS` and `AI_FIRSTLINE_DISPUTE_WINDOW_MINUTES`. With the
vars gone from the schema they are silently ignored, and leaving them is a note
to a future reader that lies.
