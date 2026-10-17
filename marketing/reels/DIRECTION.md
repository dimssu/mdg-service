# Feature reels — binding direction

Every reel's prompt inherits this file. Where a reel's prompt and this file
disagree, the prompt wins for that reel only, and the disagreement goes into
"Lessons" at the bottom if it should become the rule.

Sources behind every rule: `_research/*.md` and the fact file
`marketing/mdg-video-knowledge-pack.md` (the authority on claims).

**Owner decisions (17 Oct 2026):** vertical 9:16 only · Hinglish · cold
viewers who have never heard of us · black-and-white app-style world · the
LIVE DSR card design.

---

## 1. The series in one line

Thirty seconds per feature that make a petrol-pump owner think *"that job just
left my desk"* — shown on the real screens he would get, in his own trade
words, with nothing about how we do it.

## 2. The viewer

- A pump owner, 40-plus, twenty years in the trade. Not stupid — busy, and sold
  to before. Low trust in technology. Cheap Android phone, weak network.
- He meets the reel on WhatsApp (forwarded), Status, Reels or Shorts. **Most
  first plays are muted.** Every spoken idea must also be readable on screen.
- He has never heard of MDG Services or Dealer Kavach.
- He abandons at the first moment of confusion or embarrassment. One idea per
  screen. Never make him feel stupid.
- His fear is not price. It is being handed something he cannot ask a question
  about. A person behind the product is the reassurance.

## 3. Language — Hinglish

| | Rule |
|---|---|
| Spoken | Conversational Hindi, आप register always (never तुम). English trade words spoken the way dealers say them: DSR, stock, density, tanker, credit, due date, Fire NOC, DOD. |
| On screen | Hindi words **and everyday loanwords** in **Devanagari** (स्टॉक, रजिस्टर, टैंकर, फ़ोन, चैट, टीम). **Latin** only for acronyms, units, brand names, numbers and a card's own English column heads: `DSR`, `Fire NOC`, `DOD`, `4,222 L`, `₹4,86,120`. **Never Hindi typed in Latin letters** ("Pata chalega" is out). |
| TTS spelling | Write acronyms hyphenated for the voice: डी-एस-आर, डी-ओ-डी, एम-डी-जी सर्विसेज़, जी-एस-टी, फ़ायर एन-ओ-सी. The screen keeps the Latin form. Write फीस not फ़ीस, अंतर not फ़र्क़, इतवार not रविवार, गलत/गलती without the nuqta. **TTS text uses only `,` `।` `?`** — `…` and `—` give long, unpredictable pauses; keep them for the screen. Join a very short closing line into one take with the line before it. |
| House spellings | टंकी (spoken) · नाप-तौल · डेंसिटी (never घनत्व) · डीलर कवच · काग़ज़ |
| Numbers | Latin digits, Indian grouping (`toLocaleString('en-IN')`): `4,86,120`, `1.78 lakh`. Litres whole. Signed variation uses a true minus `−` (U+2212). Meter readings are never grouped. `font-variant-numeric: tabular-nums` on every figure. |
| Words never spoken | app, dashboard, portal, software, system, data, automatic, अपने आप, AI, bot, assistant, smart, digital, online, platform, cloud, sync, real-time, WhatsApp (as a delivery channel). |
| Words never in our own on-screen text | the same list. A faithful recreation of a real screen may keep a real UI string, but never "portal". |
| Words that cost nothing and earn trust | DSR, डिप, स्टॉक, वेरिएशन, टेस्टिंग, मीटर रीडिंग, टैंकर, डिपो, क्रेडिट, कैश एंड कैरी, इंडियन ऑयल, नोटिस, रजिस्टर, फ़ाइल. |

## 4. Claims — what may be said

**Say freely:** who we are (MDG Services; the app is Dealer Kavach), what a
dealer gets, the call to action. Endorse and sell without embarrassment.

**Never say or show how it is done:** no portals logged into, credentials,
OTPs entered for him, data collection, reading, pulling, schedules, run
times, pipelines, models, "automatic". If a line needs to explain *how*, the
line is wrong.

**Numbers that may be stated** (fact file §6, verified):

| Figure | Wording |
|---|---|
| 4% | stock variation band: 4% of tank stock, plus — on a shortage only — 0.75% petrol / 0.25% diesel of sales. Clause: `नियम 5.1.11` (never "MDG guideline") |
| 3 days | to repay credit taken past zero, rolling past bank holidays |
| 9 | services ("नौ काम", never "nine app features": four have no software) |
| 7 days | onboarding: day 1 one call, days 2–3 choose and lock the price in writing, days 4–7 live (fact file §5; §6 counts from the price — open question O5, so never anchor the count to a trigger) |
| 9am–9pm | support, every day including Sunday, Hindi or English (phone line; a person) |
| 2 | languages, everywhere in the app |
| 45 / 9 | items on the clock at a pump / repeat cycles — "on the clock at your pump", never "mandatory" or "required by the oil company" |
| 12 | two-hour water-testing windows a day at a round-the-clock outlet |
| 15 · 3 · 2 · 1 | days-before-expiry paper reminders (default ladder) |
| 100 | points, each warrior's daily target · 85 named jobs in 11 groups |
| 1800-891-3496 | toll-free — **written on screen, never spoken** |
| mdgservices.in · guide.mdgservices.in | |

**Never state:** 1,400+ pumps · 14 states · 536/557 · ~11 hours a week · 22
deadline windows · 0 missed · "never a missed deadline" · 9 portals · 22
minutes · 9 days early · before 11am · "10 videos / 25 minutes" · any density
value as what petrol or diesel "is" · any real dealer's figure · any price
(not in feature reels) · "free" · "24×7" · founder-ruled film claims (250+
people, ~1,700 dealers, since 2021, eight languages) · any points total or per-item points for the compliance sheet (unverified) · the real amounts in the fact file's §7 cases (₹63 / ₹9,443 and the like — keep the idea, invent the figures) · any oil-company
consequence other than the one observable one: *miss the quarterly mock drill
and the next fuel order can be held*. Stock-variation consequences only in the
card's own words (fact file §4).

**Delivery truth:** reports arrive **in the Dealer Kavach chat as pictures**,
and **a person at MDG looks each one over before it is sent** (say "देखकर
भेजती है" — never a certificate that the figures are correct; the contract
disclaims checking dealer-supplied data). Never "on WhatsApp", never "every
morning", never a time of day, never "automatically" — and so **no chat bubble,
row or reminder shows a clock time that reads as a delivery or reminder hour**
(hide the bubble time, or use day labels `आज` / `कल`).
The first reply in chat is written by a quick first line (labelled "तुरंत
जवाब" in the app): never call it AI, never claim "a person replies first".
"A person, not a menu" is true of the phone line only.

**No:** testimonials, dealer names, case studies, outlet codes — real or
invented; cards print the code in **two places** (the header pill and the
footer's right edge, `.code` and `.foot-r` on the DSR cards) and both are hidden
with `display:none`, never blanked · SAP codes, invoice
numbers, oil-company logos, livery, uniforms, canopy colours, tanker
branding, number plates, national flag, Ashoka Chakra (so never the
Independence/Republic Day festival bands), admin or internal screens, the
Settings › "Your services" screen (it prints run schedules).

## 5. The visual world — black and white, app-style

### 5.1 Palette: three colours plus black and white

| Role | Hex | Use |
|---|---|---|
| **Black** (brand) | `#18181B` | the app's own brand ink: big type on light, night/pain stages, buttons, the logo |
| **White** | `#FFFFFF` (page `#FAFAF9`) | the main stage; type on black |
| **Warm grey** — colour 1 | `#F3F2F0` wallpaper · `#E7E5E4` bubble/rule · `#78716C` muted text | the app's own neutral: secondary planes, rules, grids, quiet text |
| **Gold** — colour 2, the one accent | `#F5A524` | **one gold thing per beat, at most** — the thing that matters: the key number's underline, the verdict tick, the कवच wordmark, the CTA underline |
| **Card maroon** — colour 3, arrives only inside real cards | `#7F1D1D` / `#5C1010` + card gold `#F59E0B` + cream `#FFFDF5` | never painted onto the reel's own shapes or backgrounds; it enters only as part of a real report card |

**Artwork exemption.** A recreated app screen or report card keeps its own
true colours (verdict green `#15803D`, red `#B91C1C`, deep red `#8B1414`,
amber `#B45309`, read-tick blue `#53BDEB`, the app's status colours). Those
colours exist **only inside that artwork** — never on the reel's own
backgrounds, headlines or shapes. Because the reel's own world is black,
white and grey, the maroon card becomes the only big colour on screen: the
product is the hero.

**Stages.** Flat planes only: white `#FAFAF9`, black `#18181B`, wallpaper grey
`#F3F2F0` (with the app's faint doodle at `rgba(17,27,33,.045)` when it is the
chat). No gradients, no photographs, no grain, no textures, no navy, no WhatsApp
green, no teal.

### 5.2 Type

| Role | Face | Weights |
|---|---|---|
| Latin — headlines, numbers, UI | **Inter** (the app's Roboto stand-in) | 500–800, tracking −0.02 to −0.035em at display sizes, tabular figures |
| Devanagari — every Hindi word | **Noto Sans Devanagari** | 600–800 |
| कवच wordmark only (end lockup, optional) | Tiro Devanagari Hindi, in gold | 400 + 1.4px same-colour stroke |
| Inside recreated cards | the card's own stack, verbatim | as built |

Fonts load from the vendored files in `marketing/pamphlet/fonts/` through
`kit/brand/fonts.css`. Inter and Noto Sans Devanagari are vendored at 400–800
(reel 01 added 800 through `marketing/vendor-fonts.mjs`); fetch any other weight
the same way rather than falling back. A render with a missing face is a failed
render — check by measuring a known string's width, not with
`document.fonts.check()` (it returns true for missing fonts).

**Devanagari rules (each cost an afternoon before):**
1. Never letter-space Devanagari (`letter-spacing: 0 !important` on every Hindi run).
2. Never split Hindi into code points. Animate by word or by line; if you need
   clusters, use `Intl.Segmenter('hi', {granularity:'grapheme'})`. Never move
   individual aksharas independently.
3. Line-height 1.3–1.5; line masks get ~0.3em padding top and bottom so matras are not clipped.
4. When Latin sits beside Devanagari, set the Latin at ~0.9× and align on the headline bar.
5. No skew, no `scaleX`, no outline-only Hindi, no hairline weights.

**Sizes at 1080×1920 (the reel's own type):** a one-line hook ≤ 120 px; lines of
5–7 Hindi words 72 px (two lines fit the upper zone); 96–140 px only for lines of
≤ 3 words; hero numbers 160 px+; nothing a viewer must read below **54 px**. At
most **7 Hindi words** of the reel's own type on screen at once. Reading hold ≈
0.6 s + 0.25 s per word — the words may stay up that long while the world keeps
moving.

**Artwork exemption for size, word count and safe box.** Text inside a
recreated phone or card, ruled-paper furniture (register heads, rules, dates),
brand strings and the fixed end card are artwork: exempt from the 54 px floor,
the 7-word cap and the safe-box test. But every word or figure the voice names
must be punched in to ≥ 54 px or re-set in reel type.

### 5.3 Layout and safe zones

| Zone | Box | Holds |
|---|---|---|
| **Hard-safe** (Reels + Shorts + Status) | x 72–888, y 288–1248 | every word that matters, every key number, the CTA |
| WhatsApp-comfort | x 108–972, y 200–1500 | supporting labels |
| Full bleed | 1080 × 1920 | backgrounds and motion only |

The safe-box test applies to the reel's own type and the focal number of each
beat; a phone's header or composer may bleed past it. Centre hero objects at
**y ≈ 768**, not 960. Spoken-idea text sits in the
upper part of the hard-safe box (y ≈ 290–560) or beside the object it names —
never a subtitle strip in the bottom third (platform UI covers it). 8 px base unit.

**One centre axis, 696 px wide** (set by reel 01 v2 after the owner called the
v1 layout messy). Every line of reel type, the stage object (register, card,
phone), the lockup and the end card centre on **x = 540**, and nothing centred
is wider than **696 px (x 192–888)** — the only width that is both centred on
the frame and inside the hard-safe box. The box's right edge is real: Google's
Shorts ad guidance keeps the right 192 px for the like/share column. Headlines
live in **one title zone** (first line top y 300, second y ≈ 394–404) on every
beat. Moving one beat's headline under its object reads as a flipped title zone
(reel 01 tried it; the critic caught it); shrink the object instead.
A line too wide for 696 px wraps at a phrase boundary — a `\n` in the text
given to `kin.line` — never where the browser happens to break it. Prove it by
measurement: `node marketing/reels/kit/render/safe.mjs <reel>` walks every
visible text box each 0.1 s. An off-axis composition only when a brief asks
for one, and then on its own stated axis.

### 5.4 The product on screen

- **The phone** is the live app, pixel-faithful: chat list home, white bars,
  wallpaper `#F3F2F0` with doodle, incoming bubble white, own bubble
  `#E7E5E4`, black mic/send, black "फ़ोटो भेजें" button, blue read ticks.
  Reference: `mdg-app/store-assets/captures/01–04*.png` (390×811 CSS px @3x).
  No tab bar, no "DK" chip, no "online" dot, no green, no maroon header, no
  quick-reply chips ("आज की रिपोर्ट?" belongs to the first line — leave out), no
  bubble timestamp that reads as a delivery hour. A DSR arrives as one bubble:
  **stock check on the left, sales sheet on the right**; the viewer swipes in
  that order. The black mark in the chat header is app artwork, allowed
  whenever the phone is on screen. Draw the phone as a simple black-bezel
  object at **≤ 1.68×** (390×811 CSS px logical), so the 414 px bezel stays inside
  the 696 px centred width (§5.3). The earlier 2.0–2.1× predates that rule, and
  reel 01 v2 shipped 1.72×. It is a stage, not a hero.
- **Report cards** come from the real builders with invented data (recipe in
  `kit/README.md`), embedded as live DOM so the camera can macro-zoom without
  pixels and sections can be pulled apart. Hide the outlet code in both places it prints. Strip
  every method-leak string (each reel's prompt lists them) by hiding elements or
  through the builder's inputs — never by rewriting a real card's text. Never show a whole
  card at phone width and expect it to be read: show it arrive, then **punch
  in** to one tile, one verdict, one number.
- **The logo** is the black people-in-an-open-hand mark (vector:
  `mdg-app/assets/icon-src.svg`, `mdg-client/src/components/BrandMark.tsx`).
  Draw it only with the kit's `K.mark`, which renders the app's own path
  (`kit/brand/logo/mark-path.js`, generated from BrandMark by `make-mark.sh`) —
  never a hand-drawn or re-traced shape.
  Never a "DK" chip, never an "M" coin, never recoloured gold. **The reel's own logo lockup is never over a
  scene of pain** — it arrives with the relief.

## 6. Motion language

**One virtual camera.** Everything lives in one world element; the camera
pushes toward whatever is being named (1.0→1.3×, 0.5–0.9 s, expo-out), holds,
and moves on. Exit direction of one shot = entry direction of the next. Never
zoom into empty UI. Macro zooms land on a number that then changes.

**Every shot is made out of the previous one.** A shape, a number, a line or a
card becomes the next scene: morph (FLIP or path), mask, match cut,
push-through, or a camera move. At most **two hard cuts** per reel, each on a
downbeat with a hit. No crossfades.

**Every beat changes a fact.** A figure counts, a verdict flips, a date steps,
a tick draws, a row closes. "Fast" means information per beat, never flashing.

**Easing.** Entrances expo-out (`1 − 2^(−10t)`), 350–600 ms; exits faster,
200–300 ms; camera quart in-out, 600–900 ms; springs critically damped only (no
overshoot, no wobble). Vary timing by importance — never the same 80 ms
stagger on everything.

**Blur follows speed** — real motion blur from sub-frame sampling at render
time, never a CSS blur filter.

**Holds.** The frame as a whole is never static for more than 0.5 s except on
the end card. Words may stay up for their full reading time (§5.2) while
something else in the frame keeps moving — a 2–4% drift at minimum.

**Range every reel must show (in its own way):** kinetic Hinglish type · the
real UI or card deconstructed (exploded, layered, macro) · one 2.5D or 3D
moment · one data moment where a real number builds · one transformation from
the dealer's physical world (register, dipstick, paper, calendar) into the
product · the end card.

**Each reel has its own signature device** (see `CATALOG.md`). Do not borrow
another reel's device; the anthem (reel 15) is the only one that quotes them.

## 7. Banned

Particle bursts · glows and halos · lens flares · camera shake · RGB split ·
crossfades · gradients and blobs · glassmorphism · neon on black · grain ·
photographs and stock footage · emoji as decoration (real UI emoji inside a
real caption are fine) · stock icon packs · bouncy or overshooting easing ·
letter-by-letter bouncing type · a whoosh on every cut · Ken Burns as the only
move · slide-deck bullet lists · countdown/"limited offer" energy · a counter
that always lands on a round number · equal gaps everywhere (one centre axis
is the rule, §5.3; the gaps between title, object and lockup must vary) ·
the same fade-and-scale entrance on everything · tracked Devanagari ·
anything that looks like a template · corporate-uplifting stock music.

## 8. Structure

- **30.000 s exactly**, locked to a BPM grid of whole bars: 120 BPM = 15 bars
  of 2 s (default) · 128 BPM = 16 bars · 96 BPM = 12 bars. Something lands on
  every beat; scene changes land on downbeats.
- **Frame 0 is the poster.** A finished, readable picture with the hook words
  already in place. No logo intro, no fade from black.
- **0–1.5 s: one hook** in the dealer's own words, a number if there is one.
- **The last full bar before the end card is the strongest moment.**
- **End card** (static for the final ≥ 2 s), one clear action — call: white
  stage; the app-icon tile (black mark on white, soft shadow) and **Dealer
  Kavach** / डीलर कवच; a small `बात कीजिए` label over **`1800-891-3496` as the
  largest line**, with a gold underline (the beat's one gold) and `टोल-फ़्री ·
  सुबह 9 से रात 9, हर दिन` under it; `mdgservices.in` second; `Google Play पर:
  Dealer Kavach` as plain text (no badge); the MDG Services logo small at the
  foot with **Fueling Success**. No price, no scale claims. Nothing in a
  forwarded video is tappable, so the number — the one step he can take — leads,
  and the voice's last line points at it ("हमसे बात कीजिए"), never speaking the
  digits.
- **Loop rhyme.** The end card shares its layout skeleton with frame 0 (the
  hook's question sits where the number will sit), so a looping Reel reads
  seamlessly and a WhatsApp play still ends on a real end card.

## 9. Sound

**A specialised sound-director subagent decides the mode for each reel**,
from the storyboard, using these criteria, and records the decision and its
reason in `AUDIO.md`:

| Mode | Choose when |
|---|---|
| Voice + music (default) | the reel explains a reason or a rule (most reels) |
| Music only + big type | the reel is pure UI choreography or rhythm and every idea is already on screen |
| Voice only | almost never — the bed carries the beat grid |

**Voice.** ElevenLabs, the films' Hindi voice ("Aarush", id in
`mdg-demo/.env` as `ELEVENLABS_VOICE_ID`), `eleven_multilingual_v2`,
stability 0.45 · similarity 0.8 · style 0 · speaker boost on, neighbours as
`previous_text`/`next_text`. **Budget: ≤ 240 characters of Hindi per reel**
(~22 s of speech at the measured ~11 chars/s; digits are slowest — let the
screen carry numbers). Measure every take with ffprobe before animating to
it; never trust an estimate. Apply the end-click fix (reversed
`silenceremove`, see `kit/README.md`).

**Music.** ElevenLabs `music_v1` composition plan (the proven format:
`sections` with `positive_local_styles`; sections in whole bars; requested
lengths come back within ~50 ms). Name BPM and key. Instrumental only;
warm, premium, restrained; Indian hand percussion and plucked strings over a
soft pad; one riser into the strongest bar; a clean sting on the end card;
no vocals, no EDM drop, no choir. Silence is an effect: drop the bed for the
beat before the key number.

**SFX.** At most one sound per event. Ticks, whooshes, pulses and risers are
synthesised in code (OfflineAudioContext — sample-accurate, free). ElevenLabs
sound generation only for organic sounds (paper, stamp, a deep logo hit); the
proven takes already exist in `marketing/films/short/sound/`. A whoosh only on
camera moves ≥ 0.4 s. Three hits per reel at most: hook, key reveal, end card.

**Mix.** Bed −14 dB, sidechain-ducked under the voice
(`sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350`), 2–3 kHz
pocket (−4 dB) for the voice. Two-pass loudnorm to **−16 LUFS, true peak −2
dBTP**; check the peak of every low-bitrate copy separately.

## 10. Build contract (every reel)

1. **Use the shared kit** at `marketing/reels/kit/` (contract in its README).
   Reel 01 builds it; every later reel uses it, extends it when needed, never
   forks it. A reel writes only its own `build/` folder.
2. **Deterministic time.** Every style is computed from `t` inside
   `window.seek(t)`. No CSS animations, no transitions, no timers, no state
   carried between frames.
3. **Fonts proven before frame 0**; Playwright scripts run under plain
   `node`, never `tsx` (tsx silently breaks `page.evaluate`).
4. **Render.** Drafts at 30 fps without sub-frames. Final master 1080×1920:
   time the heaviest frame during QA gate 1 — under ~150 ms, render **60 fps
   with 3 sub-frames**; otherwise **30 fps with 4**. Blend with ffmpeg `tmix`,
   H.264 High, explicit bt709 tagging (untagged yuv420p shifts the gold by 8
   levels), CRF ~17. The WhatsApp copy is made with `tmix`, not by dropping
   frames. Pipe frames to ffmpeg; the disk is nearly full.
5. **QA gate 1 — per-beat stills.** Before the full render: one still per beat
   at **beat + 0.40 s** (the settled frame), plus **beat + 0.05 s** on the three
   hit beats, safe-zone overlay on, laid out as **four sheets of fifteen**
   (5×3, ~400×710 per tile — a single 60-up sheet is too small to judge type).
   Look at every still: clutter, overlap, off-beat, unreadable, outside the safe
   box, broken Devanagari, numbers that disagree with each other, any figure on
   §4's never-state list. Then run `kit/render/safe.mjs` — eyes miss a line
   that runs 40 px past x 888 — and `kit/render/motion.mjs` (the longest still
   run and the most Hindi words at once). Fix, re-shoot.
6. **QA gate 2 — fresh-eyes critic.** A subagent that has not seen the build
   reviews the four sheets, the six hero beats at full size (frame 0, the
   turn, the data moment, the strongest moment, the end card and one more),
   `STORYBOARD.md` and `AUDIO.md` against this file (claims, method leaks, banned list, language, safe zones, the range
   list) and returns a must-fix list. Fix every must-fix.
7. **Deliver** into `NN/out/`: `vN.mp4` (master), `vN-whatsapp.mp4` (720×1280,
   30 fps, under 16 MB), `vN-poster.jpg` (frame 0), `vN-sheet.jpg` (contact
   sheet). Verify: duration 30.0 s, loudness and peak in range, size. Run
   `node marketing/backup.mjs` after a version the owner likes.
   The 60-up sheet is only the deliverable `vN-sheet.jpg`.
8. **Record.** The storyboard is written twice: v1 on estimated voice
   timings, v2 from the sound director's measured beat map. Append a `LOG.md` entry (what was made, every decision, what
   the critic caught, open questions) and update `STATUS.md`.
9. **Never touch production.** The laptop `.env` points at prod: never run a
   script with `--commit`, never call `api.mdgservices.in`, never open the
   prod database, never send a message. Card builders are imported only
   through the safe recipe in `kit/README.md`. Never edit `mdg-backend`,
   `mdg-client` or any app source from a reel session.

## 11. Lessons (grows after every owner review)

Carried over from earlier films:
- "Too less animations and visuals" — the founder's note on the first
  marketing film. Every frame is full and moving; no flat field with a third
  of the frame empty.
- Logo never over a scene of pain ("branding a man's worst week with your own
  logo reads as gloating").
- Hindi speech runs ~35% longer than a word count suggests; the first film
  came out 2:11 against a 90 s script. Let the screen carry lists and numbers.
- A whole-film watch catches what per-shot checks miss; the frame-level
  skeptic caught four blockers that a "looks ready" pass did not.

From these reels:
- **A word parked outside its mask still shows.** The mask's padding (which
  keeps matras unclipped) also lets the tops of a parked word — the headline
  bar, a matra, a 7's bar — peek into the frame, right over the next line of
  type (reel 01: the clock's waiting digits drew marks over the Hindi hook).
  Hide parked words with `visibility: hidden` (the kit's `kin.play` does), and
  never trust a mask alone to hide something.
- Keep the stage hidden until the fonts are proven (the scene sets
  `visibility: hidden` synchronously and reveals it once `fontsReady` passes),
  so no frame is ever painted in a fallback face.
- **The logo was wrong in v1, and the owner saw it first.** The kit drew the
  mark as a hand-made outline; it read as "a logo" in review but not as *ours*.
  The mark now comes only from the app's own path (§5.4). Compare it against
  `mdg-landing/public/logo-full.png` at full size in every QA pass.
- **"Messy" was three alignments at once.** v1 mixed left-set type, a
  full-width column grid and a centred end card. v2 put everything on one axis
  (§5.3), dropped the column lines (heads and figures carry the columns), and
  gave each object its own band with air on both sides. The first centred pass
  then pushed seven lines and the phone number past x 888 — invisible by eye
  on a contact sheet, caught by measurement.
- **A flat thing on a turning plane vanishes edge-on** (reel 02: the pin rode
  a 180° turn and disappeared at the apex). Counter-rotate it so it always
  faces the lens while it travels the arc.
- **Something that leaves and comes back can tell a forbidden story.** When
  reel 02's 50 L evaporation part travelled to the excess side, the −430 pin
  stood outside the band and then "came back inside" — the banned
  correction. Send a dashed copy; the real part never moves.
- **An opacity dissolve is a crossfade.** A phone fading out over the next
  shot is the banned crossfade (and its old title overprinted the new one).
  Objects slide or scale in and out; nothing fades over something else.
- **Eyes don't see a still frame or a ninth word.** The critic measured 1.5 s
  of zero change and nine Hindi words with the labels counted; both looked
  fine on the sheets. `motion.mjs` measures them.
