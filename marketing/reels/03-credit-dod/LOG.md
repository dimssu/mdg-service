# Reel 03 · Credit & DOD — log

Newest entry at the bottom. Every version, every owner note (in their words),
every decision and why. A session resuming this reel reads this file first.

## v1 prompt — 18 Oct 2026

- Written after the owner approved reel 02 v1 ("looks good", 18 Oct).
- Cards were checked with the live builder (HEAD `7c4d878`). A new kit builder,
  `credit-dod`, runs `buildCreditCard` then `cardHtml`. The fixture
  `kit/cards/fixtures/03-credit-dod.mjs` draws five cards: four countdown
  states from one set of figures, plus a 90%-used variant. Strings, the hide
  list and the chat line are in CATALOG § 03 › "Card — verified".
- The chat line's `(पोर्टल के अनुसार)` is dropped in the recreated bubble, as
  CATALOG § 03 already decided. On these cards `.foot-r` is the honest caveat
  and is kept; `.foot-l` (DATA PREPARED AT + date) and `.code` are hidden.
- Draft voice: 232 Hindi characters (ceiling 240). Widths are measured; two
  titles break at a phrase (733 px and 796 px on one line).
- Carried forward:
  - From reel 01 v2: the centre axis, 696 px, the title zone, the real logo.
  - From reel 02: the word cap counting the board's words, no dissolves,
    `motion.mjs`, checking frames from the MP4 itself.

## v1 prompt revised after review — 18 Oct 2026

Three independent critics (facts & rules · buildability & craft · Hindi &
hook), read-only, 52 findings. Every must-fix and most should-fixes were
applied, each checked against the sources first. These changed the reel:
- **The countdown was impossible.** A `5 दिन बाक़ी` card for a 26-08
  deadline, as of 21-08, describes a debt that does not exist yet: that
  deadline can only follow a 23-08 trigger. Four dated cards in sequence also
  implied a delivery rhythm. The fixture now draws one card (`due-3`). The
  countdown `3 → 2 → कल → आज` lives on the board, undated, and the card in
  the window never changes. The "cream → gold → amber" colour claim was false
  (the panels differ by a few RGB levels); it is gone, and the card is never
  tinted.
- **"Daily" on the card.** The subtitle `रोज़ का उधार-हिसाब` is now hidden
  (`.t2`). `रोज़ का` and `DATA PREPARED AT` were added to the kit's
  `FORBIDDEN`. Reels 01 and 02 still pass.
- **The voice schedule.** Line 1 ran into line 2 and line 4 started inside
  the silent beat. The hook is now the two questions the card answers,
  `कितना जमा करना है?` / `कब तक?`, so hook and payoff ask and answer the same
  thing. Line 4 starts on the hit (`इतना…`). The voice is 218 characters, and
  every line fits its slot even at 11 characters a second.
- **The 3-day rule, exactly:** if the third day is a holiday, the date moves
  to the next working day. The old wording ("rolls past") made the
  impossible card look plausible.
- **Board.** At most two rows; a full API and flip spec (ω, perspective, the
  riffle, comma flaps, the mirror proof); `data-dup` on the hidden half.
  The kit's `motion.mjs` now skips duplicates. The amount row is 636 px at
  ~110 px digits, a recorded exception to the 160 px hero rule.
- **One row, three meanings, fixed.** The `−` flap folds away before the
  amount arrives, and the board folds away for the limit beat, so
  `₹4,86,120` never reads as "below zero" and `₹6,57,350` never sits beside
  "pay today". The 85% tick and the reel-drawn bar are cut; the card's own
  bar carries 74%.
- **Phone and caption.** A one-picture `photoBubble` (312 px, 306 px tile),
  caption under the picture as the app draws it. The dropped
  `(पोर्टल के अनुसार)` is logged as the one sanctioned edit.
- **Holds and stills.**
  - A no-still plan: a 2% poster push from t = 0, 3% pushes through holds,
    and every resting centred object ≤ 674 px.
  - The end card is at rest from 28.0 s, with Hit 3 on the settle.
  - The data moment gets 6 s (bars 9–11), and bar 12 reverses bar 4.
- **Kit:** `K.fontsReady` now proves the `₹` glyph (it lives in Inter's
  latin-ext file).
- **Not taken:**
  - A `due-2` card: the board carries 2 days without one.
  - The `85% पर लाल` label: cut with the tick.
  - Making the hook `टैंकर आया —`: the hook now asks the payoff's question.

## v1 build — 18 Oct 2026

Built in the owner's session ("Build the reel 3 here"); the separate build
session was stopped before it made anything.

**What was made**
- The real card, drawn by the product's own builder (`buildCreditCard` →
  `cardHtml`, HEAD 7c4d878) from `kit/cards/fixtures/03-credit-dod.mjs`: one
  card, `due-3`, dummy outlet. Hidden by element: `.code`, `.t2`, `.foot-l`;
  `.foot-r` (the honest caveat) stays. `assertClean` proves the eight figures
  the reel names are on both copies of the card.
- Two kit pieces: `Kit.flap` (a split-flap board, `kit/components/flap.js`)
  and `Kit.chat.photoBubble` (one picture, caption under it). Both are in
  the kit README.
- `build/` scene, the sound director's soundtrack (`AUDIO.md`, voice + music,
  −16 LUFS, 30.000 s), `STORYBOARD.md` v2 from the measured beat map.

**Decisions**
- **The board is locked to the clacks.** Every row change reads its time
  from `script.json → board` (a cue sits on a flip's start; it lands 0.11 s
  in), and the board's flaps flip 0.03 s apart, the clacks' own spacing.
  The opening riffle starts 40 ms ahead of its clack so the poster frame is
  never held 0.5 s.
- **Three sound cues moved to the picture** (`build/cues.py`, then
  `build-audio.sh`; all 24 audio checks pass):
  - the last days flip, 15.60 → 15.00 s: at 15.6 the verdict
    `आज ही जमा करना है` could stand only 0.6 s before the next question
    (`क्रेडिट कितना बचा?`, which must land on `क्रेडिट` at 16.64 and cannot
    share the screen with it: 8 words). It now stands 1.3 s, then folds;
  - the two row folds, 26.20 / 26.60 → 26.00 / 26.12 s: the rows fold on
    bar 14's downbeat, so `Dealer Kavach` can rise as the voice says it
    (26.53, against `डीलर` 26.28 and `कवच` 26.68). Both clacks are still
    clear of the voice.
- **How a figure moves from the card to the board.** The first build flew
  a dark copy on top of the flaps; mid-flip the two copies garbled each
  other (8.9 s and 10.4 s). Now a white slip, set in the card's own type
  and text, peels off a card that has stopped moving, arcs up and slides
  into its row's lower edge, clipped there, and the row flips on its clack.
  Three faults found on the way and fixed: a slip whose backing faded
  printed `3 दिन बाक़ी` over the card's date; a card still zooming under its
  slip read `₹4,86,1200.00` (the FLIP now lands straight on DUE AMOUNT); a
  slip in the board's typeface overhung the card's `.00` and read
  `₹4,86,120)0`.
- **Nothing fades.** The board's rows unfold and fold (scale from their top
  edge) instead of fading in and out; the sum wipes off instead of fading
  over the rising phone; the days row unfolds blank before its first
  verdict goes in, and the date row unfolds blank before its date.
- **The `−` flap stays up** until the board folds into the bubble (the
  sound has no clack for a 5.0 s fold-away); the row is reset to blank
  while the board is off screen, so `−` and `₹4,86,120` never meet.
- **The turning halves of a flap are lighter** (`#34343a`): a blank turning
  onto a blank did not read, and did not register as motion.
- **Titles on the measured words:** bar 2–3's lines on `खाता`, `नीचे`,
  `गिनती`; `कितने दिन बाक़ी?` on `कितने`; `हिसाब —` on `हिसाब`; the camera
  reaches each figure before it lifts.

**Measured** — `safe.mjs`: passed (only words in motion touch the edge).
`motion.mjs --end 28`: longest still 0.4 s, at most 7 Hindi words.

**QA gate 2 — the fresh-eyes critic** (3 must-fixes, 9 should-fixes)
- Must-fixes, all fixed:
  - the payoff's gold underline lay across the date row (8 px between the
    rows; bars 5–8 had 28): the payoff rows are now at y 570 / 742, the
    gold is centred in the gap, the phone sits at y 908;
  - the push on the card's bar framed only its first stretch, so the fill
    ran off the window and read 100% full: bar 10 is now a punch-in on the
    fill's end, the grey that is left and `26% बची है` (the voice asks what
    is left), drifting along the bar so the flat close-up still moves;
  - window edges sliced lines of text (8.4–12.0, 12.9–16.4, 18.9–19.9):
    every card framing is now set by its window edges, each between two
    lines, and anchored at the window's top edge so the hold's push never
    moves the top cut; the bottom cut is proven to stay in its gap
    (`scene.js` throws otherwise). The window's height follows: the
    amount band alone during the countdown (y 1014–1248), YOUR LIMIT → the
    chips at full width for the data moment (y 942–1248).
- Should-fixes applied: the tanker has stopped by ≈ 2.5 s (it stopped on
  the `0` clack: cause and effect); `−` on the sign's place after `₹`, so it
  is not one of the "no answer" dashes; the gold moves from the amount to
  the date at 24.0; the lockup tile at 26.32, as soon as the rows are flat
  (at 26.2 it landed on the folding rows); the data framing starts below
  the card's own verdict and the camera moves down before it widens; the
  equation's rule 674 px; AUDIO.md brought in line.
- Clacks recounted to the picture: each clack now has as many landings as
  flaps that turn (riffle 12, dashes 9, `0` 6, `₹−` 2, `3 दिन` 3, the rows
  set 9 + 3 from 22.40 together). Audio rebuilt, 24/24.
- Not taken:
  - longer verdict holds (0.75 / 0.85 / 0.90 / 1.30 s against §5.2's
    1.10–1.85): the first three repeat one pattern, one word changing per
    flip; the last holds 1.3 s and the next question must land on the
    spoken `क्रेडिट`. Dropping the `2 दिन` step would cut the countdown;
  - the title held to 26.0 in the payoff (the prompt's hold);
  - `शून्य` → `माइनस में` (a dealer's word): needs line 2 re-recorded — the
    owner's call.

**QA gate 2, the recheck** — three blind reviewers (facts and story · craft ·
did the fixes hold), every must-fix challenged by a skeptic (8 agents).
- Confirmed must-fixes, fixed:
  - the bar punch-in read nearly empty (a stub of orange beside `26% बची
    है`): dropped; the data framing holds the whole bar with both its
    captions and pushes 8%, proven to keep `26% बची है` inside the side
    edges and the footer below the bottom cut;
  - the lockup tile faded in over the travelling bar (a dissolve), and the
    bar's colour tween passed through brown: the tile now scales in opaque
    (the bar passes behind it) and the bar turns gold by a wipe from its
    centre.
- Downgraded by the skeptics, fixed anyway:
  - the turn: the board hung over the phone and `₹−` lay on the card's
    `₹4,86,120.00` (read: the amount below zero) — it is folded flat by 6.32,
    before the card unfolds;
  - the phone rose through the sum: the sum and its title are out by 19.85.
- Should-fixes applied: the window closes and reopens between framings
  (the camera never pans across the card; no half-cut line is legible
  mid-move); the windows sit 34 px under the board (y 864), the countdown's
  amount band seated under it (y 864–1098); `इंडियन ऑयल को` / `जमा करना है —`
  at 8.1 (the reel names whom); `एक नज़र में।` on `एक` (21.72); the gold under
  the amount, not the last verdict (it read as a deadline sting); the
  answer `= ₹6,57,350` at 72 px with its gold its own width; the payoff
  phone at y 930; the name on `डीलर` (26.34); the tanker drives straight
  through, the road retracting after it, and its brake hiss is dropped
  (a truck that stopped under the board dated the purchase to the as-of
  day, a Sunday).
- Motion kept: bars 1–3 push linearly on the frame's centre, the payoff
  push is 5%; `नीचे गया —` keeps its 4.42 exit (held longer, bars 2–3 had a
  0.6 s still).
- Not taken: unevener days gaps (0.75 / 0.85 / 0.90 pass the sound's
  never-even check); the payoff's 24.5–26.0 holds the gold under the date;
  the sum's answer after `बचा` (17.8, it answers the question);
  `शून्य` → `माइनस`/`ज़ीरो` (needs a re-voice: the owner's call).

**Measured, final:** `safe.mjs` passed; `motion.mjs --end 28` longest still
0.3 s, at most 7 Hindi words; audio 24/24.
