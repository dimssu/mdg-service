# Reel 03 · Credit & DOD — "कितना, कब तक"

*Prompt v1 · 18 Oct 2026 (revised after a three-critic review) · paste everything below the line into a fresh agent session opened at the repo root.*

---

<role>
You are the director and motion designer of a 15-reel series for MDG Services
and its Android app, Dealer Kavach. This is reel 03. Reel 02 v1 is approved by
the owner; reel 01 v2 is delivered. The shared kit already holds the card
viewer, the FLIP, the two-faced flip, the phone, the end card and three
measuring tools (`safe.mjs`, `motion.mjs`, `beats.mjs`). Use it, extend it
where this reel needs something new, never fork it.
</role>

<read-first>
1. `marketing/reels/DIRECTION.md` — binding. Re-read §3, §4 (claims and delivery
   truth), §5.2 (the seven-word cap), §5.3 (one centre axis, 696 px, one title
   zone), §6, §7 and §11 (every lesson so far) before you write a single
   on-screen word.
2. `marketing/reels/kit/README.md` — what the kit already does ("Built so far").
3. `marketing/reels/CATALOG.md` § 03 — the figures and the card's exact strings,
   verified against the live builder ("Card — verified"), including what was
   deliberately **not** drawn and why. Use them exactly.
4. `marketing/reels/02-stock-check/LOG.md` — what the last reel's critic caught
   (nine words with labels counted, an opacity dissolve, frozen frames, a
   misleading move). Then `03-credit-dod/LOG.md` and `marketing/reels/NEEDS-FROM-YOU.md`.
5. Look at: `marketing/reels/02-stock-check/out/v1.mp4` (the series' current
   bar), `marketing/reels/02-stock-check/build/scene.js` (how a reel uses the
   kit's viewer, phone, end card and the init order: `K.fontsReady` before
   anything is measured, then `window.READY`), `mdg-app/store-assets/captures/02-report.png`
   (how a picture arrives in the chat: caption under it) and
   `mdg-landing/public/logo-full.png`.
</read-first>

<brief>
The viewer: a pump owner, 45, scrolling with the sound off, who has never
heard of us. He buys fuel from Indian Oil against a limit. When his account
goes below zero, he has three days to pay that credit back.

The one thing he must leave with: **"इंडियन ऑयल को कितना जमा करना है, और कब तक — एक नज़र में।"**

What is true, and nothing else may be claimed:
- He gets one picture in his Dealer Kavach chat.
- Its hero is the amount due and the due date, with a days-left verdict.
- Under that sit his three limit tiles, a bar showing how much of the limit
  is used (the bar turns red from 85%), and which form of limit he is on:
  DOD, credit or cash & carry.
- The card carries one honest caveat: it counts up to the moment it was
  made, and later purchases or payments are not in it.
- **The rule:** credit taken past zero is repaid within three days. If the
  third day is a Sunday, the 2nd or 4th Saturday or a bank holiday, the date
  moves to the next working day.
- A person at MDG looks each card over before it is sent.
- Never say or show when or how often it arrives.

(Director's intent, never on screen or in the voice: the clock is easy to
lose track of. If words are ever needed, the approved hedge is `अक्सर किसी को
दिखती नहीं`.)
</brief>

<direction>
**Concept: "One decision, two figures."** How much, and by when. These are
the two numbers he has to act on, set like a departure board. Commit to it
and restate it in one line, in your own words, before the storyboard.

**Signature device (this reel's alone): the split-flap board.**
- A departure board of black flaps. Each flap is a two-half card with a
  hairline split.
- The top half falls (rotateX about the split line) to reveal the next
  character, and the bottom half rises with the new glyph.
- Digits flip per character. **A Hindi word or phrase flips as one wide
  flap**, never letter by letter (DIRECTION §5.2 rule 2).
- The amount holds still while the days row flips: `3 दिन बाक़ी` →
  `2 दिन बाक़ी` → `कल आख़िरी दिन` → `आज ही जमा करना है`.
- The flips are **verdict changes, not urgency**: the same unhurried pace for
  every flip, no acceleration, no pulse, no red, and never on an even beat
  spacing, so it never reads as a ticking clock.

**Style: departure board / mechanical counters.**
- Flaps are `#18181B` with white Inter 800 tabular digits, a split line of
  `rgba(255,255,255,.14)`, rounded 10 px, on the white page `#FAFAF9`.
- Labels are grey `#78716C`.
- The board is the reel's own drawing, so it stays black, white and warm grey,
  with at most one gold `#F5A524` accent per beat: an underline under the row
  being named.
- **The card is never tinted or recoloured**; its own colours stay inside it.
  The only tone change the card itself has is the amber verdict of a due-today
  card, and this reel does not show one.

**The board, specified** (build it as `kit/components/flap.js`, `Kit.flap`; prove widths and heights at init with asserts, after `K.fontsReady`):
- **API:** `board.row(id).schedule([[t0, 'text'], …])`, evaluated purely at
  `t`. Stagger is by index among the flaps that change (0.03 s). Each flap
  turns in 0.14 s with a critically damped settle (ω ≈ 45, no overshoot).
  Perspective is ≈ 700 px with its origin on the split line; the 3D parent has
  no overflow clip. A "riffle" is one synchronous flip of every flap to a
  different blank; it never cycles through characters (no slot machine).
- **The amount row** `₹4,86,120`: 9 flaps. `₹` and the six digits are
  76 × 136 px, the two comma flaps 28 px, gaps 6 px, for 636 px; digits at
  about 110 px. That is below DIRECTION's 160 px hero size because the row is
  capped by width; record the exception in LOG.
- **The date row:** `26` as 2 digit flaps, then `अगस्त` as one word flap.
- **The days row:** one wide flap holding a whole phrase at 60 px
  Devanagari, ≤ 560 px wide (the widest phrase, `आज ही जमा करना है`, measures
  509 px).
- **At most two rows on screen at once.** Every centred row stays ≤ 674 px at
  rest, so a 3% push stays inside 696.
- **The second copy of each glyph** (the half that is not the visible one)
  carries `data-dup`. The kit's `motion.mjs` skips it when it counts words.
  Prove a half-turned flap never shows a mirrored glyph: the falling half
  shows the old top, the rising half the new bottom, and nothing is visible
  past 90°. Use computed style plus a pixel sample at 45°.
- Reel 13 must not reuse `Kit.flap` for its odometer; say so in the README.

**World:** black, white and warm grey, with at most one gold accent per beat.
The maroon card is the only big colour; the beat the bubble lands is the beat
colour enters.

**Layout (DIRECTION §5.3):**
- One centre axis at x 540; nothing centred wider than 696 px.
- Every headline sits in the title zone on every beat: the first line's top
  at y 300, the second line at y ≈ 394–404.
- Lines too wide wrap at a phrase with `\n` in `kin.line`, and every title
  grows from its centre (`kin.play(…, { origin: '50% 100%' })`).

The y-map:

| Bars | Title zone | Board | Object |
|---|---|---|---|
| 1–3 | 300–490 | y ≈ 560–880 (two rows) | the tanker on a hairline at y ≈ 1100, a flat line drawing ≤ 640 px wide |
| 4, 11 | 300–490 | — | phone, top y ≈ 540, ≤ 1.65× (bezel ≤ 683 px), composer may crop below 1248 |
| 5–6 | 300–490 | y ≈ 520–800 (amount, then date) | card window x 192–888, y 830–1248; card at ≤ 0.62 when its whole width shows (1,080 × 0.62 = 670 px) |
| 7–8 | 300–490 | y ≈ 520–800 (amount + days; the date row has folded away) | card window y 860–1248, the camera on the card's date panel (s ≈ 1.3) |
| 9–10 | 300–490 | — (folded away) | the two equation lines y ≈ 520–700; card window y 760–1248 on the three tiles and the bar |
| 12–13 | 300–490 | y ≈ 560–860 (amount + date) | — |
| 14–15 | end card | its rows fold into the end card's rule | the lockup at the end card's own coordinates |

**Type:**
- Inter + Noto Sans Devanagari.
- Everyday loanwords in Devanagari (टैंकर, क्रेडिट, फ़ोन); acronyms, units and
  numbers in Latin (`DOD`, `₹4,86,120`, `74%`).
- Rupees in Indian grouping, without paise in reel type (`₹4,86,120`); the
  card keeps its own `₹4,86,120.00`.
- **At most 7 Hindi words on screen at once, counting the board's word
  flaps.** The structure table counts every row.
- Every figure the voice or the title names is punched in to ≥ 54 px or set
  on the board.

**Camera:** one virtual camera. It pushes toward what is named, exits the
way the next shot enters, and every macro lands on a number that then changes.
Never pan across the card to read it.

**No frame holds still for 0.5 s before the end card** (`motion.mjs`):
- From t = 0 the poster pushes 2% (1.0 → 1.02 over 1.4 s), and its first event
  comes by 0.5 s.
- The card window carries a 3% push through every hold, as in reel 02.
- The bubble drifts 1% while it sits.
- Every resting centred object stays ≤ 674 px.

**Range — every item must appear, each made out of the shot before it:**
1. Kinetic Hinglish type — the hook and the pain.
2. A 2.5D / 3D moment: the split flaps themselves (each half a rotateX plane),
   and the board folding down into the chat bubble at the turn. Bar 12
   reverses bar 4: the board rises out of the bubble.
3. UI deconstruction — the credit card as live DOM: the hero's DUE AMOUNT and
   DUE DATE lifted onto the board; the date panel's own `3 दिन बाक़ी हैं`
   lifted as the days row's first flap; the three limit tiles; the card's own
   bar.
4. The data moment, on two lines at 54 px and ≤ 674 px each (line 1 measures 660 px at 54 px; at 56 px it is 685 px, too wide):
   `₹25,00,000 − ₹18,42,650` then `= ₹6,57,350`, which builds while the
   camera holds the card's tiles. Then the card's own bar is pushed in, with
   its `74% इस्तेमाल हो चुकी है` (the card prints whole percent). There is no
   reel-drawn bar and no 85% tick.
5. The physical world into the product. A tanker (a flat line drawing: no
   livery, no number plate, no oil-company mark) rolls in. The board's top
   row clacks down to `0`, then to a single `−` flap: credit taken. Show
   **no cause and effect** between the truck's arrival and the debit; the
   title names the account, not the truck. Before bar 5 the `−` flap folds
   away, so the row that later carries `₹4,86,120` never reads as "₹4,86,120
   below zero".
6. The end card (DIRECTION §8), on frame 0's layout.

**Banned:** everything in DIRECTION §7. Here in particular:
- A ticking clock or a clock face.
- Any consequence of missing the date (no fine, no hold, no "supply stops").
- Ever expanding DOD.
- "We remind you", "every day", "every morning", any time of day, any dated
  sequence of cards. The only exception is the end card's fixed support-hours
  line (DIRECTION §8); the bans apply to delivery and reminders.
- `रोज़ का` (the card's subtitle, hidden).
- "Owners only" as a promise.
- The payment-lag, overdue and locked states.
- The festival band.
- A narrated purchase day.
- A slot-machine spin.
- Red or green on the reel's own shapes.
- Any opacity dissolve of one object over another; objects slide, scale or
  flip in and out.
- `K.card.DSR_HIDE` on this card.
- The register row (01), the mirror flip (02).
</direction>

<structure>
**30.000 s at 120 BPM = 15 bars of 2 s**, beats every 0.5 s; take every time
from `Kit.clock(120, 15).at(bar, beat)`. Something lands on every beat; scenes
change on downbeats. A starting map — improve it, but keep every job, every
"becomes" and every word count:

| Bars | Time | Job | Becomes | On screen (Hindi words, board included) |
|---|---|---|---|---|
| 1 | 0–2 | **Hook.** Frame 0 is the finished poster: the two questions, and under them the board with two rows of blank flaps (an amount row starting `₹`, a date row). The tanker's hairline road is already drawn at the bottom. Beat 2: one riffle. Beat 4 (1.5 s): the flaps settle on dashes, no answer. **Hit 1.** | the tanker rolls in | `कितना जमा करना है?` / `कब तक?` (6) |
| 2–3 | 2–6 | **Pain.** The tanker rolls along the hairline and stops. The board's top row clacks to `0`, then to a single `−` flap (credit taken). Bar 3: the bottom row clacks to `3 दिन`, gold underline. No logo, no card. Bar 3's line replaces bar 2's pair. | the board folds | bar 2 `खाता शून्य से` / `नीचे गया —` (5) · bar 3 `गिनती शुरू।` + `3 दिन` (3) |
| 4 | 6–8 | **Turn** (no hard cut). The `−` flap has folded away. The board folds down like one big flap into the live chat: one picture bubble, the `due-3` card, its caption under it: `💳 ₹4,86,120.00 26 अगस्त तक जमा करें।` **Colour enters here.** Beat 4: a tap. | the picture FLIPs into the window | `यह हिसाब —` / `आपके फ़ोन पर` (5) |
| 5–6 | 8–12 | **Proof 1 — the two figures.** The card in its window. The bed is silent 8.5–9.0 s. The camera pushes into DUE AMOUNT; `₹4,86,120` lifts out and the amount row clacks to it, digit by digit, settling at 9.0 s on the voice's `इतना`. **Hit 2.** Bar 6: DUE DATE `26-08-2026` lifts; the date row flips to `26 अगस्त`. | the card's date panel | bar 5 `कितना जमा करना है —` (4) · bar 6 `कब तक —` + `अगस्त` (3) |
| 7–8 | 12–16 | **Proof 2 — the days.** The date row folds away (two rows at most). The camera pushes into the card's date panel; its own `3 दिन बाक़ी हैं` lifts and becomes the days row's first flap. Then the board alone flips while the amount row holds still: `2 दिन बाक़ी`, then `कल आख़िरी दिन` (held 1.5 s), then `आज ही जमा करना है` (held into bar 9). The times follow the measured voice, never an even spacing. The card in the window stays the 23-08 card and never changes. The title leaves before the last flip. | the card's tiles | bar 7 `कितने दिन बाक़ी?` + flap (≤ 6) · bar 8 the last flap alone (5) |
| 9–11 | 16–22 | **The data moment — the limit** (6 s, not crammed). On bar 9 beat 1 the board folds away. The camera moves to the three tiles. The two equation lines build (`₹25,00,000 − ₹18,42,650`, then `= ₹6,57,350`). On bar 10 the card's own bar is pushed in at 74%. On bar 11 the card shrinks back into its bubble, and the phone rises under it. | the bubble | bars 9–10 `क्रेडिट कितना बचा?` (3) · bar 11 `इंडियन ऑयल का` / `हिसाब —` (4) |
| 12–13 | 22–26 | **Payoff.** The board rises out of the bubble (bar 4 reversed). It holds only the two figures that decide: `₹4,86,120` and `26 अगस्त`, with **no days flap**. The payoff lands with its spoken words. A 3% push through the hold. | the board's rows | `कितना, कब तक —` / `एक नज़र में।` + `अगस्त` (7) |
| 14 | 26–28 | **Strongest moment.** The payoff leaves. The board's rows fold flat, one after the other, into the gold rule the end card's number will sit on. The lockup arrives at the end card's own coordinates (tile, name, नाम; no travel later). On beat 4 (27.5 s) the label and number write in where the hook's questions sat. | the end card | (2) |
| 15 | 28–30 | **End card** (`K.endcard`, DIRECTION §8), fully at rest from 28.0 s. **Hit 3** at 28.0 s on the settle. | — | end card |

**Cut first if time runs short:** bar 11's title, then the date-panel lift in
bar 7 (start the days row on its own `3 दिन बाक़ी`), then the bar push in bar 10.
Never cut the flap mechanics, the two lifts in bars 5–6, the FLIP, the tanker
or the fold into the rule.

**Measured widths and holds:**
- Every title was measured with the vendored fonts at 72 px, and each line
  stays under **682 px**.
- `खाता शून्य से नीचे गया —` is 733 px on one line, so it breaks after `से`
  (371 / 343 px). `इंडियन ऑयल का हिसाब —` is 796 px, so it breaks after `का`
  (501 / 276 px). `कितना जमा करना है —` is 673 px and stays one line.
- Re-measure anything you reword, and let `safe.mjs` have the last word.
- Reading holds (0.6 s + 0.25 s per word): bar 1's 6 words need 2.1 s, so the
  poster's words are up from frame 0 and stay to 2.1 s. Bars 2 and 4 hold 5
  words for 1.85 s.
</structure>

<sound>
**Spawn a sound-director subagent** (fresh context).
- Give it your storyboard, DIRECTION §9, this section, and
  `02-stock-check/AUDIO.md` as the precedent: its methods, and its
  `script.json` schema (words in reel time, `speechStart` / `speechEnd`).
- It decides the mode. The leaning is voice + music, because this reel says
  what to do and by when.
- It writes `03-credit-dod/AUDIO.md` and the mix, measures every take, and
  returns a beat map.
- **Build the picture after the beat map exists:** lock every title to its
  measured words, then rewrite `STORYBOARD.md` from the map.

**Draft voice** — keep its facts and its length (218 characters, counted with
Python `len`; ceiling 240).
- Start times are targets at ~11 characters a second (the films' voice has
  measured 13–19); re-time from the measured takes.
- A line may run at most one beat into the next bar. None runs into the
  silent beat (8.5–9.0 s). Line 4 starts on the hit, so its first word meets
  the amount landing.
- TTS text uses only `,` `।` `?` and drops the nuqta (DIRECTION §3).

| # | Start | Line |
|---|---|---|
| 1 | 0.10 s | `कितना जमा करना है, कब तक?` (ends by 2.5 s even at 11 characters a second) |
| 2 | 2.60 s | `खाता शून्य से नीचे गया, तो गिनती शुरू।` |
| 3 | 6.20 s | `यह हिसाब, आपके फोन पर।` |
| 4 | 9.00 s | `इतना जमा करना है, इस तारीख तक।` |
| 5 | 12.10 s | `कितने दिन बाकी, यह भी।` |
| 6 | 16.20 s | `और क्रेडिट कितना बचा है?` |
| 7 | 19.50 s | `इंडियन ऑयल का हिसाब, एक नजर में।` (must end by 22.5 s; its 32 characters end by 22.4 even at 11 a second) |
| 8 | 26.20 s | `डीलर कवच। हमसे बात कीजिए।` (one take; the number is written, never spoken) |

**Music:**
- 120 BPM.
- Bars 1–3 tense and sparse: a low pulse and a dry, high pluck.
- On bar 4's downbeat it opens warm: plucked strings, soft hand percussion,
  a pad. That turn is the turn's accent; there is no hard cut.
- Silence for the beat before the amount lands (8.5–9.0 s).
- A riser into bar 14, and a clean sting on the end card. Sections in whole
  bars.

**SFX:**
- **One clack sample per row change**: a short rattle for its flips, never one
  event per flap, never at an even beat spacing. Digit rows quieter than word
  rows.
- One low organic sound for the tanker: an air-brake hiss or a tyre settle.
- The three hits: 1.5 s, 9.0 s and 28.0 s.
- Nothing else.
</sound>

<build>
1. **Card.** Draw it with the live builder through the kit's safe recipe:
   - Copy a clean HEAD of `mdg-backend/src` into
     `marketing/reels/03-credit-dod/build/.cards-src/`. In the copy, delete
     the one `import { renderCardPng } …` line in
     `automation/sdms/report/renderCard.ts`, and symlink `node_modules`
     beside it.
   - Use dummy env and the **verified fixture**
     `kit/cards/fixtures/03-credit-dod.mjs`. It draws one card, `due-3`.
   - Never use or edit `mdg-backend`'s working tree.
   - Hide with `display:none`, never rewrite: `.code` (the header pill),
     `.t2` (the subtitle `रोज़ का उधार-हिसाब`) and `.foot-l` (`DATA PREPARED AT`
     and the as-of date). Keep `.foot-r`, the honest caveat. **Do not use
     `K.card.DSR_HIDE`**: it hides the caveat and misses the pill.
   - `K.card.FORBIDDEN` already includes `रोज़ का` and `DATA PREPARED AT`.
   - Then run `K.card.assertClean` on every mount (window and bubble). Each
     must contain `₹4,86,120.00`, `26-08-2026`, `3 दिन बाक़ी हैं`,
     `₹25,00,000.00`, `₹18,42,650.00`, `₹6,57,350.00`, `74% इस्तेमाल हो चुकी है`
     and `इस समय तक का हिसाब`, and show nothing in `FORBIDDEN`.
2. **The phone** is the kit's live chat (DIRECTION §5.4) at ≤ 1.65×:
   - `सहायता` / `MDG टीम`, with the header's black mark on its grey disc
     (`K.mark`), and the doodle wallpaper.
   - **One** picture bubble: 312 logical px wide with a 306 px tile, the card
     cover-fitted, top-aligned. Add it to `kit/components/chat.js` as
     `photoBubble` and list it in the README.
   - The caption goes **under** the picture, as the app draws it, verbatim:
     `💳 ₹4,86,120.00 26 अगस्त तक जमा करें।` (no space before `।`). This drops
     the backend's `(पोर्टल के अनुसार)`, the one sanctioned edit of a real
     string; log it.
   - No timestamp, no quick-reply chips.
   - While the card is in the viewer (bars 5–10) the phone is parked below
     the frame. It is never faded out.
3. **The board** is `kit/components/flap.js`, as specified in Direction. Add a
   short keyframe note for each of the four transitions, giving axis, origin,
   direction and which parts move: board → bubble (bar 4), card → bubble
   (bar 11), bubble → board (bar 12), rows → rule (bar 14).
4. **Determinism:** every style is computed from `t` inside `window.seek(t)`:
   no CSS animation, no timers, no state between frames. Build after
   `K.fontsReady` (it now proves `₹`), and set `window.READY` the way reel 02
   does.
5. **Motion:** expo-out entrances, critically damped springs only, a quart
   camera. Motion blur comes from sub-frames at render, never a CSS filter.
6. **Scene metadata:** `window.SCENE = { bpm: 120, duration: 30, seek, hits:
   [1.5, 9.0, 28.0], hero: [frame 0 and the settled frames of bars 4, 5, 8,
   10, 13 and the end card], safeSel: [the board's flaps, the equation lines,
   every punched-in figure], wordSel: [the board's word flaps] }`, with the
   times from `Kit.clock(120, 15)`.
7. **QA gate 1:**
   - Run `kit/render/beats.mjs` (60 beat stills in four sheets, the hit
     stills, the hero frames, overlay on) and look at every still: clutter,
     overlap, off the beat, unreadable, off the axis, a headline outside the
     title zone, broken Devanagari, a number that disagrees with another,
     anything on §4's never-state list.
   - Then run `kit/render/safe.mjs` and `kit/render/motion.mjs --end 28`: the
     longest still run must stay under 0.5 s, and no more than 7 Hindi words
     may be on screen at once. Fix every failure.
8. **QA gate 2:** spawn a fresh-eyes critic subagent with the four sheets, the
   hero frames at full size, `STORYBOARD.md`, `AUDIO.md`, `DIRECTION.md` and
   `logo-full.png`. It returns a must-fix list covering:
   - claims and delivery timing (including any dated sequence);
   - method leaks and the banned list;
   - language and the word cap;
   - the axis, the title zone and the safe box;
   - still frames and dissolves;
   - the logo against the real one;
   - the range list.
   Fix every must-fix and re-run gate 1's measurements.
9. **Render** per DIRECTION §10.4:
   - Mix with the kit's `mix.mjs`.
   - Render with `kit/render/render.mjs marketing/reels/03-credit-dod --fps 60
     --sub 3 --preset slow --out out/v1.mp4 --audio build/audio/mix.wav`
     (30 × 4 if the heaviest frame is 150 ms or more).
   - Then run `kit/render/deliver.mjs marketing/reels/03-credit-dod --tag v1`.
   - Pull frames from the MP4 itself to confirm the fixes are in the file.
10. **Record:** append a `LOG.md` entry (what was made, every decision, what
    the critic caught, open questions), update the kit's "Built so far" table
    and `STATUS.md`. Never touch production (DIRECTION §10.9).
</build>

<start>
First tell me the concept in one line and show the beat-by-beat storyboard
(bar · beat · picture · becomes · on-screen words with their count · voice ·
sound); save it as `03-credit-dod/STORYBOARD.md`. Then build it without
asking me anything else — unless something in `NEEDS-FROM-YOU.md` is open and
blocks you; then ask once, with options. Finish by giving me the MP4, the
WhatsApp copy, the contact sheet and the LOG entry.
</start>
