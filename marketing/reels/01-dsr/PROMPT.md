# Reel 01 · DSR — "रजिस्टर वाली रिपोर्ट"

*Prompt v1 · 17 Oct 2026 (revised after a three-critic review) · paste everything below the line into a fresh agent session opened at the repo root.*

---

<role>
You are the director and motion designer of a 15-reel series for MDG Services
and its Android app, Dealer Kavach. This is reel 01, and it also builds the
shared kit the other fourteen reuse — so make it like the first episode of a
show: its craft sets the bar for every reel after it.
</role>

<read-first>
1. `marketing/reels/DIRECTION.md` — binding: brand, language, claims, motion,
   sound, build contract. Re-read §3, §4 and §7 before you write a single
   on-screen word.
2. `marketing/reels/kit/README.md` — the kit contract and the proven recipes
   (real cards with invented data, ElevenLabs, render). You build the kit.
3. `marketing/reels/CATALOG.md` § 01 — the figures, already checked. Use them
   exactly; do not invent new ones.
4. `marketing/reels/01-dsr/LOG.md` and `marketing/reels/NEEDS-FROM-YOU.md`.
5. Look at: `mdg-app/store-assets/capture/demo/dsr-2026-10-15-sales.png` and
   `-variation.png` (the live card design — note the code `99Z` printed in two
   places, both to be hidden) and `mdg-app/store-assets/captures/02-report.png`
   (how a DSR arrives: stock check on the left, sales sheet on the right).
</read-first>

<brief>
The viewer: a pump owner, 45, scrolling at night with the sound off, who has
never heard of us. Reads Hindi first and trade words in English.

The one thing he must leave with: **"मेरे रजिस्टर वाला हिसाब, भरा-भराया, मेरे फ़ोन पर।"**

What is true — and nothing else may be claimed: for each day, two pictures
land in his Dealer Kavach chat — the stock check (inside the limit or not)
and the sales sheet laid out in his own register's columns (yesterday's row
closed, today's row open, a glance strip on top). Anyone at the pump can copy
it into the register. A person at MDG looks it over before it is sent.
</brief>

<direction>
**Concept: "काग़ज़ → तस्वीर → काग़ज़" — paper becomes picture becomes paper.**
Commit to it and restate it in one line, in your own words, before the
storyboard.

**Signature device (this reel's alone): the register row.** A hand-ruled
register row lifts off the page, flips in 3D and lands as the picture in the
chat bubble. At the end the card's cells fly back into the same paper row,
cell by cell, because anyone at the pump can copy it.

**Style: ledger editorial.** The register's ruled lines are the motion grid —
every element enters along a rule, snaps to a rule, leaves along a rule. The
register is drawn flat: page `#FAFAF9`, warm-grey rules `#E7E5E4`, black ink
`#18181B`. Never a photograph or a paper texture. Its column heads are the
**card's own heads in the card's order, cut to the four that close the sum**:
`OPENING STOCK · RECEIPT · TOTAL STOCK · SALES` (204 px each across the 816 px
safe width, figures 60 px, heads ≥ 28 px — ruled-paper furniture counts as
artwork, DIRECTION §5.2).

**World:** black, white and warm grey, with at most one gold `#F5A524` accent
per beat. The maroon cards are the only big colour in the reel — the beat the
bubble lands is the beat colour enters.

**Type:** Inter + Noto Sans Devanagari. Everyday loanwords in Devanagari
(स्टॉक, रजिस्टर, फ़ोन, टीम); acronyms, units and numbers in Latin (`DSR`,
`4,222 L`). Sizes and the seven-word cap per DIRECTION §5.2 — card and phone
text are artwork and exempt, but every figure the voice names is punched in to
≥ 54 px or re-set in reel type.

**Camera:** one virtual camera. It pushes toward whatever is being named, exits
the way the next shot enters, and every macro zoom lands on a number that then
changes. Never a reading pan across the whole landscape table — it is 1,360 px
wide; the camera holds on the cells that matter and treats the rest as texture.

**Range — every item must appear, each made out of the shot before it:**
1. Kinetic Hinglish type — the hook and the pain.
2. A 2.5D moment — the row lifting off the page and flipping into the bubble.
3. UI deconstruction — the sales card as live DOM (glance strip, then the
   cells of yesterday's row); the stock check lifted apart into three planes.
4. The data moment — a vertical ledger total in reel type, its figures lifted
   from their cells: `12,480 + 6,000 = 18,480`, `− 14,246` (from the glance tile
   STOCK IN TANK NOW), `− 12` testing, a ruled line, **`4,222`** — which lands in
   SALES; then the `14,246` tile slides down into today's OPENING STOCK: the stock
   in the tank now is today's opening.
5. The physical world into the product and back — paper → picture → paper.
6. The end card (DIRECTION §8), built on frame 0's layout.

**Banned:** everything in DIRECTION §7. Here in particular: no paper crumple,
no red-pen scribble, no handwriting font, no ticking-clock sound as decoration,
no gauge or pin on the stock check (that device belongs to reel 02).
</direction>

<structure>
**30.000 s at 120 BPM = 15 bars of 2 s.** Something lands on every beat;
scenes change on downbeats. A starting map — improve it, but keep every job
and every "becomes":

| Bars | Time | Job | Becomes | On screen |
|---|---|---|---|---|
| 1 | 0–2 | **Hook.** Frame 0 is the finished poster: the register row with its four heads and empty cells, the hook already set. Beat 2: typed Inter digits wipe into OPENING `12,480` and RECEIPT `6,000`; beat 3: a wrong SALES `4,322` wipes in; beat 4: a straight 6 px black rule strikes it. | the struck row duplicates | `रात 11:30` / `DSR का हिसाब फिर नहीं मिल रहा?` |
| 2–3 | 2–6 | **Pain.** The page copies itself backwards along its rules — page after page, the same struck cell. The corner clock steps 11:30 → 11:38 → 11:47 (steps, never a sweep). No logo. | the top page's row lifts | bar 2 `एक जगह गलती —` · bar 3 `पूरा पन्ना दोबारा।` |
| 4 | 6–8 | **Turn.** Beats 1–2: the row lifts and flips; the one hard cut lands on the flip's edge-on frame with a sub-hit — a match cut from the paper's edge to the bubble's edge. Beats 3–4: the two-picture bubble settles in the live chat (stock check left, sales right); phone at 2.0–2.1×, bubble centre y ≈ 768, header and composer may bleed past the safe box. **Colour enters here.** | the right picture is tapped | `अब DSR — आपके फ़ोन पर` |
| 5 | 8–10 | **Proof 1a.** The sales picture FLIPs into the black viewer; the camera pushes into the glance strip. Only `SOLD 20-Aug` counts up to `4,222`; `RECEIVED 6,000` and `STOCK IN TANK NOW 14,246` are read in place. | the camera drops to yesterday's row | `कल की बिक्री · आज का स्टॉक` |
| 6 | 10–12 | **Proof 1b.** Hold on OPENING + RECEIPT + TOTAL (`12,480 + 6,000 = 18,480`); a fast, blurred pan across the meter columns (texture — not read) to TESTING and SALES. The figures lift out of their cells into the ledger total beside the card. | the ledger total | `आपके रजिस्टर के खानों में` |
| 7 | 12–14 | **The data moment.** The bed drops for one beat; `− 14,246`, `− 12`, the rule, **`4,222`** lands in SALES with a tick; the `14,246` tile slides down into today's OPENING STOCK. | swipe back | the ledger figures themselves |
| 8–9 | 14–18 | **Proof 2 — the stock check.** Swipe back to the left picture (the finger moves right). Three planes lift apart: the verdict `स्टॉक सही है`, the VARIATION row `-180` as printed, and the band line, whose `(570 L)` and `(196 L)` enlarge in reel type and add to `766`; −180 sits well inside 766; the planes close. | swipe forward to the sales sheet | `स्टॉक सीमा में है?` / `साफ़ लिखा` |
| 10 | 18–20 | **Anyone can copy.** On the sales sheet, the four cells fly back out to the paper register, one per beat, into the very columns frame 0 left empty. | the last cell lands | `रजिस्टर में कोई भी उतार ले` |
| 11 | 20–22 | The struck `4,322` from the hook is gone; the row reads true. | the paper row and the card row meet | `MDG टीम देखकर भेजती है` |
| 12–13 | 22–26 | **Strongest moment.** The finished paper row and the card's row stack and lock into one line; the hook's clock is gone; the reel's own logo lockup arrives — with the relief, never before. (The black mark in the chat header is app artwork and is allowed from bar 4.) | the row becomes the end card's rule | `हिसाब मिलाना नहीं — बस उतारना` |
| 14–15 | 26–30 | **End card** (DIRECTION §8), static from 27.5 s, on frame 0's skeleton: the toll-free number sits exactly where the hook's question sat. | — | end card |

Frame 0 must already read as a finished poster. The last frame must carry the
whole call to action. Words may stay up for their full reading time while the
world keeps moving; only the frame as a whole is never static (except the end
card).
</structure>

<sound>
**Spawn a sound-director subagent** (fresh context). Give it your storyboard,
DIRECTION §9 and this section. It decides the mode — the leaning is voice +
music, because this reel explains a reason — and writes `01-dsr/AUDIO.md`:
the decision with a one-line reason, the final lines with character counts and
TTS spellings, the music composition plan as JSON, the SFX cue sheet by beat,
and mix notes. It generates the takes with the kit's audio scripts, measures
every take with ffprobe, and returns a beat map. Lock the picture to that map,
not to estimates; rewrite `STORYBOARD.md` from it (v1 uses estimated timings,
v2 the measured ones).

**Draft voice** — keep its facts and its length (238 characters; ceiling 240).
Start times are targets; a line may start late inside its bar, may run at most
one beat into the next, and never runs over the hard cut or the silent beat
before `4,222`. TTS text uses only `,` `।` `?` — never `…` or `—`:

| # | Start | Line |
|---|---|---|
| 1 | 0.1 s | `डी-एस-आर का हिसाब नहीं मिल रहा?` |
| 2 | 3.0 s | `एक जगह गलती, पूरा पन्ना दोबारा।` |
| 3 | 6.0 s | `अब डी-एस-आर आपके फ़ोन पर।` |
| 4 | 9.0 s | `कल की बिक्री, आज का स्टॉक, रजिस्टर के खानों में।` |
| 5 | 14.3 s | `स्टॉक सीमा में है या नहीं, साफ़ लिखा।` |
| 6 | 18.2 s | `कोई भी उतार ले। हमारी टीम देखकर भेजती है।` |
| 7 | 25.8 s | `डीलर कवच। हमसे बात कीजिए।` (one take; the number is written, never spoken) |

Bars 12–13 carry no voice on purpose: the payoff is the picture, the swell
and the sub-hit.

**Music:** 120 BPM. Bars 1–3 in a minor key and sparse — a low drone and a dry
wood-block on the beat. On bar 4's downbeat it turns major: plucked strings,
soft hand percussion, a warm pad. A riser into bar 12. The bed drops to
silence for the beat before `4,222` lands. A clean sting on the end card.
Sections in whole bars.

**SFX:** synthesised soft ticks under the counter (−12 dB) and on `4,222`
landing; one organic paper slide when the row lifts; a sub-hit on the turn,
another on the strongest moment, the brand hit on the end card. Nothing else.
</sound>

<build>
0. **Build the kit first** (`kit/README.md` names the exact build list and
   the defer list) — classic scripts on `file://`, not ES modules. Vendor
   Inter 800 and Noto Sans Devanagari 800 through `marketing/vendor-fonts.mjs`.
   Save points: commit or note in LOG after (a) kit + cards render, (b)
   storyboard, (c) audio beat map, (d) stills pass both gates, (e) render.
1. **Cards.** Draw both DSR pictures with the **live** builder from a clean HEAD
   copy through the kit's safe recipe — `mdg-backend`'s working tree holds an
   uncommitted redesign; never use it, never edit `mdg-backend`. Write a
   **bespoke digest** (do not patch `digest.mjs`'s days) with exactly the
   fields in CATALOG § 01 › "Digest". Hide the code in both places it prints
   (`.code` in the header, `.foot-r` in the footer) with `display:none`; drop
   the clock times with `shiftTime: ''`; hide the date strip's left label
   (`CURRENT DATE AND TIME …`) and keep the date. After rendering, assert the
   card text contains `4% of tank stock (570 L)`, `(196 L)` and `766`, and
   contains none of: `99Z`, `portal`, `पोर्टल`, `IRAS`, `हाथ से भरी`, `डिप बढ़ने`,
   a clock time, `MDG दिशा-निर्देश`.
2. **The phone** is the live chat from the real tokens (DIRECTION §5.4):
   `सहायता` / `MDG टीम`, wallpaper with the doodle, the two-picture bubble
   (stock check left, sales right), the caption `📊 DSR · 21 अगस्त — स्टॉक
   वेरिएशन सीमा में है।`, **no timestamp on the bubble**, black mic, no
   quick-reply chips.
3. **Determinism:** every style computed from `t` inside `window.seek(t)` — no
   CSS animation, no timers, no state between frames.
4. **Motion:** expo-out entrances, critically damped springs only, quart
   camera; motion blur from sub-frames at render, never a CSS filter.
5. **QA gate 1:** the per-beat stills exactly as DIRECTION §10.5 describes
   (four sheets of fifteen at beat + 0.40 s, plus the hit beats at + 0.05 s,
   safe-zone overlay on). Look at every still. Fix clutter, overlap, anything
   off the beat, unreadable, outside the safe box, broken Devanagari, any number
   that disagrees with another, any figure on DIRECTION §4's never-state list.
   Time the heaviest frame (bar 6) here — it decides the render settings.
6. **QA gate 2:** spawn a fresh-eyes critic subagent with the four sheets, the
   six hero beats at full size (frame 0, bars 4, 7, 9, 12 and the end card),
   `STORYBOARD.md`, `AUDIO.md` and `DIRECTION.md`. It returns a must-fix list
   (claims, method leaks, banned list, language, safe zones, the range list).
   Fix every must-fix and re-shoot those stills.
7. **Render** per DIRECTION §10.4 (60 fps × 3 sub-frames if the heaviest frame
   is under ~150 ms, else 30 fps × 4), bt709, mux, loudnorm −16 LUFS / −2 dBTP.
   Deliver `v1.mp4`, `v1-whatsapp.mp4` (< 16 MB), `v1-poster.jpg` and
   `v1-sheet.jpg` into `01-dsr/out/`; verify duration 30.0 s, loudness, peak
   and size with `qa.mjs`.
8. **Record:** append a `LOG.md` entry (what was made, every decision, what
   the critic caught, open questions), fill in the kit's "Built so far" table,
   and update `STATUS.md`.
</build>

<start>
First tell me the concept in one line and show the beat-by-beat storyboard
(bar · beat · picture · becomes · on-screen words · voice · sound); save it as
`01-dsr/STORYBOARD.md`. Then build it without asking me anything else — unless
something in `NEEDS-FROM-YOU.md` is open and blocks you; then ask once, with
options. Finish by giving me the MP4, the WhatsApp copy, the contact sheet and
the LOG entry.
</start>
