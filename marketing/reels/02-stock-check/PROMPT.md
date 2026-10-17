# Reel 02 · Stock check — "एक ही अंतर, दो फ़ैसले"

*Prompt v1 · 17 Oct 2026 (revised after a three-critic review) · paste everything below the line into a fresh agent session opened at the repo root.*

---

<role>
You are the director and motion designer of a 15-reel series for MDG Services
and its Android app, Dealer Kavach. This is reel 02 — the second reel, so it is
also the one that lifts reel 01's inline pieces into the shared kit. Reel 01
shipped as v2 after the owner's notes on v1: *"The logo is not correct in the
video. Also the structuring is a bit messy and wrong."* Both are now rules
(DIRECTION §5.3, §5.4, §11); this reel must not earn either note again. Use
the kit, extend it where this reel needs something new, never fork it.
</role>

<read-first>
1. `marketing/reels/DIRECTION.md` — binding. Re-read §3, §4, §5.2 (the
   seven-word cap), §5.3 (one centre axis, 696 px, one title zone), §7 and §11
   before you write a single on-screen word.
2. `marketing/reels/kit/README.md` — what the kit already does ("Built so far")
   and the safe recipe for real cards.
3. `marketing/reels/CATALOG.md` § 02 — the figures and the card's exact strings,
   verified against the live builder ("Digest"). Use them exactly.
4. `marketing/reels/01-dsr/LOG.md` (the v2 entry: what "messy" meant and how it
   was fixed), `marketing/reels/02-stock-check/LOG.md` and
   `marketing/reels/NEEDS-FROM-YOU.md`.
5. Look at: `marketing/reels/01-dsr/out/v2.mp4` (the series' current bar) and
   `marketing/reels/01-dsr/build/scene.js` (the viewer, FLIP, tap and bubble
   code you will lift into the kit), `mdg-app/store-assets/capture/demo/dsr-2026-10-15-variation.png`
   (the live stock-check design), `mdg-app/store-assets/captures/02-report.png`
   (a DSR arrives as one bubble: stock check left, sales right) and
   `mdg-landing/public/logo-full.png` (the logo the lockup must match).
</read-first>

<brief>
The viewer: a pump owner, 45, scrolling with the sound off, who has never
heard of us. Twenty years in the trade; he knows a dip, a book stock and a
variation better than we do. Reads Hindi first and trade words in English.

The one thing he must leave with: **"नोटिस बनने से पहले पता चले — स्टॉक सीमा में है या नहीं।"**

What is true, and nothing else may be claimed: the first (left) picture of
his DSR is the stock check. It gives a plain verdict (stock is fine, short or
over), shows the allowed band as its two parts, the gap, and one line on what
to do; out of band, the verdict carries a one-line tag in the card's own
words. (This reel hides the excess card's clause label, its advice line and
its consequence box — see Build.) The band is asymmetric: 4% of tank stock on
either side, plus an evaporation and handling allowance on sales on the
**shortage side only** — fuel can leave a tank into the air; it cannot come
from the air into it. A person at MDG looks each report over before it is
sent; never promise when it arrives.
</brief>

<direction>
**Concept: "Same gap, opposite verdict."** A pin 430 L from zero is inside the
band as a shortage and outside it as an excess. Commit to it and restate it in
one line, in your own words, before the storyboard.

**Signature device (this reel's alone): the mirror flip.** An asymmetric band
on a hairline number line; the pin at −430 sits inside the long shortage side.
The pin turns over the zero tick — a 180° rotation of a transparent 696 px arm
about x 540, like a coin turned — and lands at +430, 30 L outside the shorter
excess side. Later the real card turns over the same way, in one continuous
rotation with no cut at the edge-on frame (reel 01's flip cut there), and its
back face is the excess card.

**Style: precision instrument / Swiss data-viz.** Hairlines (2 px `#18181B`),
Inter tabular figures, one moving pin, generous white. The band is a flat grey
segment `#E7E5E4` on the hairline — it never fills like a progress bar (that
reads as reel 03's device). The instrument is the reel's own drawing, so it is
black, white and warm grey; the 30 L overshoot is the hook's one gold
`#F5A524`. **Green and deep red exist only inside the real card**: the card's
verdict box turns from green to red, the instrument never does.

**The instrument, specified** (prove each number at init with an assert):
- Linear, zero on the axis (x 540), ±460 L across x 192–888 (0.757 px per
  litre): −450 at x 200, +400 at x 843, the pin at x 215 / 865.
- Band 56 px tall, centred on the axis line. Ticks every 50 L (38 px), the zero
  tick taller than the rest.
- The pin: a black disc ≤ 24 px across sitting above the band on a 2 px stem
  that runs down through it; the stem marks the value (865 + 12 ≤ 888).
- The gold overshoot spans the band's full height, x 843–865.
- Labels: `−450` and `+400` at ≥ 54 px under the band's ends, each kept inside
  x 192–888 (`+400` right-aligned so it ends at or before x 888, not centred on
  its tick); `0` small under the zero tick; `कम` / `ज़्यादा` at 40 px under the
  far ends. The pin's readout lives in the title lines, never on the pin.
- A grey `10,000 L` tag (no Hindi word) above the zero tick from frame 0: the
  rule depends on the tank, and this tag becomes the dip's stock in bar 2.
- Readings in reel type use a true minus `−` (U+2212). The card prints its own
  `-430` with a hyphen; never rewrite card text.

**World:** white page `#FAFAF9` for every bar (the pain may go to black
`#18181B` if the gold reads better there — then gold text gets ≥ 3:1 contrast
or becomes a black number with a gold underline). At most one gold accent per
beat. The maroon card is the only big colour; the beat the bubble lands is the
beat colour enters.

**Layout (DIRECTION §5.3):** one centre axis at x 540; nothing centred wider
than 696 px; every headline in the title zone (first line top y 300, second
line y ≈ 394–404) on every beat. Each object gets its own vertical band with
air on both sides, and the gaps vary. The y-map:

| Bars | Title zone | Instrument | Object |
|---|---|---|---|
| 1 | 300–490 | axis y ≈ 800 (band 772–828, pin above, labels to ≈ 950) | — |
| 2–3 | 300–490 | becomes the rod: y ≈ 560–1216, tank outline below | — |
| 4, 11 | 300–490 | — | phone, top y ≈ 540, ≤ 1.68× (bezel ≤ 696 px), composer may crop below 1248 |
| 5–6 | 300–490 | — | card window y 520–1248, card at 0.626 (696 px wide), clipped |
| 7–10 | 300–490 | axis y ≈ 640 (band 612–668) | card window y 780–1248, cropped to the band row and values |
| 12–14 | 300–490 | the bare band at axis y ≈ 800, then up to y 450 | lockup at the end card's own coordinates |

**Type:** Inter + Noto Sans Devanagari. Everyday loanwords in Devanagari
(स्टॉक, वेरिएशन, इंस्पेक्शन, नोटिस, फ़ोन, डिप); acronyms, units and numbers in
Latin (`DSR`, `430 L`). **At most 7 Hindi words on screen at once, counting the
instrument's `कम` / `ज़्यादा` whenever they are up** — the structure table
counts every row for you; a title pair whose halves would break the cap shows
one half at a time. Every figure the voice or the title names is punched in to
≥ 54 px or re-set in reel type.

**Camera:** one virtual camera. It pushes toward whatever is named, exits the
way the next shot enters, and every macro lands on a number that then changes.
Never pan across the whole card to read it (1,112 px wide); hold on the rows
that matter.

**Range — every item must appear, each made out of the shot before it:**
1. Kinetic Hinglish type — the hook and the rule (`तेल उड़ सकता है — हवा से आ नहीं सकता`).
2. A 3D moment — the mirror flip: first the pin, then the card, whose back
   face is the excess card.
3. UI deconstruction — the stock-check card as live DOM: the verdict box, the
   three-row table, the band row's two parts lifted out of their text; on the
   excess card, the band row printing only `(400 L)` and its note.
4. The data moment — the lifted parts fly into the title zone and become its
   second line, `400 + 50 = 450` (the `10,000 L` tag meets the 400: 4% of it);
   `−430` sits 20 L inside. Then `430 − 400 = 30` on the excess side, landing
   as the card's `+30`.
5. The physical world into the product — the dip rod. The scale tilts up into
   a vertical rod in a tank (flat line drawing); its wet line reads `डिप 131`
   (the sales card's own DIP for 8 Sep) and `10,000 L` is what that dip gives.
6. The end card (DIRECTION §8), built on frame 0's layout.

**Banned:** everything in DIRECTION §7. Here in particular: a gauge drawn on
the card (the live card has none; the instrument stays the reel's, beside or
over the card); green or red on the reel's own shapes; **any pin move from
outside the band back inside** (it reads as fixing a real excess by
arithmetic) — after bar 10 the pin stays at +430 and leaves with the card, and
the loop from end card to frame 0 is not a pin move; the dip rod travelling
into the phone (it would say the dealer's dip is what we send — a method we do
not use; it is a graphic match only); a hard cut (this reel needs none — every
change is a move); a notice document, letterhead, officer, uniform or
oil-company mark; any fine, penalty or "your pump will be shut"; the 600 KL
tier; particles or rising vapour for evaporation; a ticking clock; a paper
register row (reel 01's device); two DSR bubbles for one date in one thread.
</direction>

<structure>
**30.000 s at 128 BPM = 16 bars of 1.875 s**, beats every 0.469 s; take every
time from `Kit.clock(128, 16).at(bar, beat)`. Something lands on every beat;
scenes change on downbeats. A starting map — improve it, but keep every job,
every "becomes" and every word count:

| Bars | Time | Job | Becomes | On screen (Hindi words incl. labels) |
|---|---|---|---|---|
| 1 | 0–1.875 | **Hook.** Frame 0 is the finished poster: the instrument, the pin at −430 inside the band, both lines set at 68 px — line 1 black, line 2 `#57534E`. Beat 2: the pin lifts off its tick. Beat 3: apex over the zero tick. Beat 4 (1.406 s): it lands at +430, the overshoot draws gold, line 2 turns black and line 1 dims to `#57534E`. **Hit 1.** | the camera pushes into the gold overshoot | `−430 L: सीमा में।` / `+430 L: सीमा से बाहर।` (7) |
| 2–3 | 1.875–5.625 | **Pain** — the excess case only (the "too late" is the +430 case; no frame shows a shortage). The macro pulls out as the scale tilts up 90° into a dip rod in a tank; its ticks become the rod's graduations. The rod rises; the wet line reads `डिप 131`; the `10,000 L` tag rides to it as what that dip gives; a small black `+430` with a gold underline stays as the stake. No logo, no card. Bar 3's line replaces bar 2's pair. | the rod lays flat (bar 3, beats 3–4) | bar 2 `इंस्पेक्शन के दिन` / `पता चले —` (6) · bar 3 `तो देर हो चुकी।` (5) |
| 4 | 5.625–7.5 | **Turn** (no cut). The flat rod's hairline is the line the DSR bubble slides along into the live chat — a graphic match; the rod itself never enters the phone. The bubble: stock check left, sales right, caption `📊 DSR · 8 सितंबर — स्टॉक वेरिएशन सीमा में है।`. **Colour enters here.** The music's turn to major on the downbeat is the accent. | the left picture is tapped | `अब DSR में —` / `स्टॉक वेरिएशन` (4) |
| 5–6 | 7.5–11.25 | **Proof 1 — the shortage card** (`var-short`). It FLIPs into the card window; the camera pushes into `स्टॉक सही है`, then the band row: `(400 L)` and `(50 L)` lift out of the text, fly up and become the title's second line `400 + 50 = 450`. VARIATION `-430` punched in as `−430` with `20 L अंदर`. | the two parts drop into the instrument | `कमी पर सीमा:` / `400 + 50 = 450` (3) · then `20 L अंदर` (4) |
| 7–8 | 11.25–15.0 | **The rule.** The instrument re-forms above the card out of those parts: 400 + 50 on the shortage side, 400 alone on the excess side. The 50 L part travels to the excess edge and is refused — it stops short, outlines, returns (critically damped, no bounce). One title half per bar. | the pin's arm and the card, together | bar 7 `तेल उड़ सकता है —` (6) · bar 8 `हवा से आ नहीं सकता।` (7) |
| 9–10 | 15.0–18.75 | **Proof 2 — the mirror.** On the downbeat the pin's arm and the card turn over together about x 540 in one continuous rotation; the back face is `var-excess`. The camera goes to its band row (`4% of tank stock (400 L)` and the note `वाष्पन छूट सिर्फ़ कमी पर मिलती है`), then VARIATION `+430`. The bed drops for one beat (17.81–18.28 s); on bar 10 beat 4 (18.281 s) NOT WITHIN `+30` lands and the title's second line appears. **Hit 2.** | the deep-red verdict box | bar 9 `ज़्यादा पर सीमा:` / `सिर्फ़ 400 L` (6) · bar 10 `+430 L — सीमा से` then on the hit `30 L ज़्यादा।` (5) |
| 11 | 18.75–20.625 | **On his phone.** Hold the `+30` and the red verdict box with its tag `बिक्री व सप्लाई तुरंत रुक सकती है` (card artwork: read, never narrated or re-set) until beat 3 (19.69 s); then the card shrinks into the phone as that world's bubble, caption `📊 DSR · 8 सितंबर — स्टॉक वेरिएशन सीमा से बाहर है, कृपया देखें।`. Bar 4's bubble left with the first card's flip: no frame ever holds both. The out-of-band bubble is its own face, never a mirrored image of the first (mirrored Hindi is banned). The instrument and the pin leave with the card. | the phone recedes | `सीमा से बाहर हो —` / `फ़ोन पर दिखे।` (7) |
| 12–13 | 20.625–24.375 | **Payoff.** The payoff lands with its spoken words (lock it to the measured word map) and holds; the bare band — no pin, no labels — returns under it at axis y ≈ 800. | the band | `नोटिस बनने से पहले` / `पता चले।` (6) |
| 14 | 24.375–26.25 | **Strongest moment.** The payoff leaves after its hold. The lockup arrives **at the end card's own coordinates** (tile, name, नाम — no travel later): beat 1 the mark sweeps on (`K.mark`), beat 2 `Dealer Kavach`, beat 3 `डीलर कवच`; the band rises to y 450 and flattens into the gold rule, landing on beat 4 (25.78 s). | the end card's rule | — (2) |
| 15–16 | 26.25–30 | **End card** (`K.endcard`, DIRECTION §8), static from 27.5 s: the label and number write in above the rule — where the hook lines sat (the loop rhyme). **Hit 3.** | — | end card |

Every title above was measured with the vendored fonts; keep each line under
**682 px** (696 less the 2% held-line drift). Re-measure anything you reword,
and let `safe.mjs` have the last word. Frame 0 must already read as a
finished poster. The last frame must carry the whole call to action. Words
may stay up for their full reading time (§5.2) while the world keeps moving;
only the frame as a whole is never static (except the end card).
</structure>

<sound>
**Spawn a sound-director subagent** (fresh context). Give it your storyboard,
DIRECTION §9 and this section. It decides the mode — the leaning is voice +
music, because this reel explains a rule — and writes `02-stock-check/AUDIO.md`:
the decision with a one-line reason, the final lines with character counts and
TTS spellings, the music composition plan as JSON, the SFX cue sheet by beat,
and mix notes. It generates the takes with the kit's audio scripts, measures
every take with ffprobe, and returns a beat map. Lock the picture to that map,
not to estimates; rewrite `STORYBOARD.md` from it.

**Draft voice** — keep its facts and its length (238 characters; ceiling 240).
Start times are targets that assume ~11 characters a second (reel 01 measured
faster, 13.7–19.5); re-time from the measured takes. A line may run at most
one beat into the next bar (line 3 may run into bar 5; line 6 may tail into
bar 13), and none runs over the silent beat before `+30`. TTS text uses only
`,` `।` `?`, and drops the nuqta as DIRECTION §3 asks (the screen keeps it):

| # | Start | Line |
|---|---|---|
| 1 | 0.10 s | `एक ही अंतर, पर फैसला उल्टा।` |
| 2 | 2.00 s | `इंस्पेक्शन के दिन पता चले, तो देर हो चुकी।` |
| 3 | 5.70 s | `अब डी-एस-आर में स्टॉक वेरिएशन भी।` |
| 4 | 11.35 s | `तेल उड़ सकता है, हवा से आ नहीं सकता।` |
| 5 | 15.10 s | `ज्यादा निकले, तो सीमा छोटी।` (must end before 17.81 s) |
| 6 | 19.30 s | `सीमा में है या नहीं, नोटिस बनने से पहले पता चले।` |
| 7 | 26.35 s | `डीलर कवच। हमसे बात कीजिए।` (one take; the number is written, never spoken) |

Bar 6 and bar 14 carry no voice on purpose: the data moment and the lockup are
the picture. If a measured line runs long, trim line 2 to `इंस्पेक्शन पर पता
चले, तो देर हो चुकी।` before touching any other.

**Music:** 128 BPM. Bars 1–3 sparse and minor: a low pulse and a dry, high
pluck on the beat. On bar 4's downbeat it opens to major — that turn is the
turn's accent: plucked strings, soft hand percussion on the grid, a warm pad —
measured, exact, never busy. The bed drops to silence for the beat before
`+30` (17.81–18.28 s). A riser into bar 14. A clean sting on the end card.
Sections in whole bars.

**SFX:** synthesised hairline ticks as the scale's ticks draw (−12 dB, never
as a clock); a soft wooden "tock" when the pin lands; the three hits (pin
landing 1.406 s, `+30` 18.281 s, end card 26.25 s); one organic metal slide as
the dip rod rises. Nothing else.
</sound>

<build>
0. **Lift reel 01's inline pieces into the kit first** (the kit README asks the
   second reel to): the card viewer (window + camera), the FLIP from a bubble
   tile into the window, the tap marker and the bubble unfold, into
   `kit/components/`. Add `K.flip` for the mirror flip: a holder with its own
   `perspective: 1800px` and `perspective-origin` at the card's centre, a
   `transform-style: preserve-3d` child, two faces with
   `backface-visibility: hidden`, the back face at `rotateY(180deg)`, faces
   top-aligned in one 1,112 px-wide box (the excess face is taller; let the
   difference sit at the foot). Add a Range-based text-rect helper so parts of
   one text run (`(400 L)`, `(50 L)`) can be lifted. Do not change reel 01's
   build; list everything new in the README's "Built so far" table.
1. **Cards.** Draw all three with the live builder through the kit's safe
   recipe: a clean HEAD copy of `mdg-backend/src` into
   `marketing/reels/02-stock-check/build/.cards-src/` (delete its one
   `import { renderCardPngs } …` line; `node_modules` symlinked beside it), dummy
   env, the **verified fixture** `kit/cards/fixtures/02-stock-check.mjs` →
   `var-short`, `var-excess`, `sales`. Never use or edit `mdg-backend`'s working
   tree. Hide with `display:none`, never rewrite: the kit's `DSR_HIDE` on every
   card (the code in the header pill and the footer, the date strip's
   `CURRENT DATE AND TIME` label); on `var-excess` also the whole `.action` box
   (the advice `≈ 30 लीटर … स्टॉक ठीक करें` reads as "adjust the stock to fit")
   and the whole `.cq` consequence box (its label prints `MDG दिशा-निर्देश`, and
   its sentence says sales "are stopped" where the fact file says "can be";
   the verdict's tag carries the card's own "can"). Add `/ठीक करें/`,
   `/decant/`, `/X0X/` and `/CURRENT DATE AND TIME/` to `K.card.FORBIDDEN`.
   Then `K.card.assertClean` on all three:
   - `var-short` contains `4% of tank stock (400 L)`, `(50 L)`, `450`, `-430`,
     `स्टॉक सही है`, `नियम 5.1.11`;
   - `var-excess` contains `+430`, `+30`, `4% of tank stock (400 L)`,
     `वाष्पन छूट सिर्फ़ कमी पर मिलती है`, `स्टॉक मान्य सीमा से भी ज़्यादा है`,
     `बिक्री व सप्लाई तुरंत रुक सकती है`;
   - `sales` contains `3,708`, `10,000`, `25,960`.
2. **The phone** is the kit's live chat (DIRECTION §5.4) at ≤ 1.68× so its bezel
   stays inside 696 px: `सहायता` / `MDG टीम`, the header's black mark on its grey
   disc (`K.mark`), the doodle wallpaper, the two-picture bubble with the caption
   for its world, **no timestamp on the bubble**, no quick-reply chips.
3. **The instrument** is new: build it in this reel's scene from the spec in
   Direction, driven from `t`. If it turns out generic, add it to the kit
   README as a candidate; reel 15 will quote it.
4. **Determinism:** every style computed from `t` inside `window.seek(t)` — no
   CSS animation, no timers, no state between frames. Prove the mirror flip
   with computed style and a pixel sample: the back face hidden at 0°, the
   front hidden at 180°.
5. **Motion:** expo-out entrances, critically damped springs only, quart
   camera; motion blur from sub-frames at render, never a CSS filter.
6. **Scene metadata** for the kit's tools: `window.SCENE = { bpm: 128,
   duration: 30, seek, hits: [1.406, 18.281, 26.25], hero: [frame 0 and the
   settled frames of bars 4, 6, 10, 14 and the end card], safeSel: [the
   instrument's labels, the title's numbers, every punched-in figure] }`, with
   the times from `Kit.clock(128, 16)`.
7. **QA gate 1:** `kit/render/beats.mjs` — 64 beat stills in five sheets (beat
   + 0.40 s), the hit stills and the hero frames, overlay on. Look at every
   still: clutter, overlap, anything off the beat, unreadable, off the axis, a
   headline outside the title zone, more than 7 Hindi words on screen, broken
   Devanagari, a number that disagrees with another, anything on §4's
   never-state list. Then `node marketing/reels/kit/render/safe.mjs
   marketing/reels/02-stock-check` and fix every failure.
8. **QA gate 2:** spawn a fresh-eyes critic subagent with the five sheets, the
   hero frames at full size, `STORYBOARD.md`, `AUDIO.md`, `DIRECTION.md` and
   `logo-full.png`. It returns a must-fix list (claims and delivery timing,
   method leaks, banned list, language, word cap, axis and title zone, safe
   box, the logo against the real one, the range list). Fix every must-fix and
   re-shoot those stills.
9. **Render** per DIRECTION §10.4: mix with the kit's `mix.mjs`, then
   `kit/render/render.mjs marketing/reels/02-stock-check --fps 60 --sub 3
   --preset slow --out out/v1.mp4 --audio build/audio/mix.wav` (30 × 4 if the
   heaviest frame is 150 ms or more), then `kit/render/deliver.mjs
   marketing/reels/02-stock-check --tag v1` — it now fails a file without an
   audio stream. Deliver `v1.mp4`, `v1-whatsapp.mp4` (< 16 MB), `v1-poster.jpg`,
   `v1-sheet.jpg` in `02-stock-check/out/`. Pull frames from the MP4 itself to
   confirm the fixes are in the file, not just the page.
10. **Record:** append a `LOG.md` entry (what was made, every decision, what
    the critic caught, open questions), update the kit's "Built so far" table
    and `STATUS.md`. Never touch production (DIRECTION §10.9).
</build>

<start>
First tell me the concept in one line and show the beat-by-beat storyboard
(bar · beat · picture · becomes · on-screen words with their count · voice ·
sound); save it as `02-stock-check/STORYBOARD.md`. Then build it without
asking me anything else — unless something in `NEEDS-FROM-YOU.md` is open and
blocks you; then ask once, with options. Finish by giving me the MP4, the
WhatsApp copy, the contact sheet and the LOG entry.
</start>
