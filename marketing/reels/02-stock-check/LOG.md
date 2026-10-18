# Reel 02 · Stock check — log

Newest entry at the bottom. Every version, every owner note (in their words),
every decision and why. A session resuming this reel reads this file first.

## v1 prompt — 17 Oct 2026

- The owner said "Proceed" after reel 01 v2 was delivered; taken as the go-ahead
  for reel 02's prompt. It is not recorded as a verdict on 01 v2.
- Prompt written: `PROMPT.md` (v1). Not yet run.
- Cards checked with the live builder (HEAD `a56f323`). The new fixture is
  `kit/cards/fixtures/02-stock-check.mjs`. It draws the within-band shortage card
  (−430 against 400 + 50 = 450), the excess card (+430 against 400, +30 beyond)
  and a sales card for the bubble. Strings, sizes and captions are in
  CATALOG § 02 › "Digest".
- Colour reconciled with the series: the brief said "green turns to deep red"
  on the instrument. The instrument is the reel's own drawing, so it stays
  black, white and grey with one gold overshoot; the colour turn happens on
  the card's verdict box.
- Draft voice: 238 Hindi characters (ceiling 240). The "two parts" line was cut
  to fit; the screen carries `400 + 50`.
- Carried forward from reel 01 v2: one centre axis and 696 px width, one title
  zone, `safe.mjs`, the real logo path, checking the delivered MP4 itself.

## v1 prompt revised after review — 17 Oct 2026

Three independent critics (facts & rules · buildability & craft · Hindi &
hook), read-only, about 50 findings. Every must-fix and most should-fixes were
applied. These changed the reel:
- **Seven-word cap.** Three title pairs held 8–9 Hindi words. Now one half
  shows per bar where needed. Every row of the structure table carries its
  count, including the instrument's `कम` / `ज़्यादा`. All rows were measured
  at ≤ 7 words and ≤ 682 px.
- **No delivery timing.** `पहले आपके फ़ोन पर` and "the day it is out of band,
  it is in his chat" promised priority and same-day arrival; reports are
  checked by a person and shared on demand. Now `फ़ोन पर दिखे।`, and the payoff
  uses the fact file's own wording `नोटिस बनने से पहले`.
- **A y-map** for title, instrument, card window and phone, plus a full
  instrument spec: band height, pin ≤ 24 px, the gold overshoot across the
  band's height, labels kept inside x 888, and a `10,000 L` tag (the band
  depends on the tank).
- **Hindi.** The hook is parallel and uses the card's words:
  `−430 L: सीमा में।` / `+430 L: सीमा से बाहर।`. `जाँच` (also "inspection")
  became `स्टॉक वेरिएशन`. `छूट` (read as "discount") became `सीमा` for the
  band. "It cannot come into the tank" contradicted every tanker; it is now
  `हवा से आ नहीं सकता`. TTS drops the nuqta. Voice is still 238 characters.
- **The dip rod reads a height** (`डिप 131`, the sales card's own DIP), and
  `10,000 L` is what that dip gives. The rod never enters the phone (that
  would imply we send his dip).
- **The mirror world is defined.** One bubble per world, never both in one
  thread, never a mirrored image. The pin never re-enters the band.
- **Excess card.** The whole consequence box is hidden. Its sentence says
  "are stopped" where the fact file says "can be". The verdict's tag keeps
  the card's own "can".
- **No hard cut.** DIRECTION wants a hit on every cut, and the reel has only
  three hits. The turn's accent is the music's turn to major.
- **Build gaps.** Lift reel 01's viewer, FLIP, tap and bubble code into the
  kit (second reel); add `K.flip` with a prescribed 3D setup and a text-range
  helper; `SCENE` metadata for 128 BPM (five sheets); assert the sales card
  too; extend `FORBIDDEN`; render with the mix. `kit/render/deliver.mjs` now
  fails a file with no audio stream; before, a silent render passed.
- **Rule book.** The phone is ≤ 1.68× (DIRECTION §5.4). §7's "everything
  centred" ban now reads "equal gaps everywhere", which no longer contradicts
  the centre axis.
- **Not taken:** counting `+30` up in bar 2's macro, since it would spoil hit
  2. The extra `वही अंतर, उल्टी तरफ़` cue at the flip, since it doesn't fit the
  bar's reading time. The flip itself and line 5 carry it.

## v1 built — 17 Oct 2026

Built in the planning session (the owner chose "Do it here" on the build card).

**What was made.** `build/` holds the scene (`index.html`, `scene.js`, `scene.css`), the
cards drawn by the live builder from a clean HEAD copy (`cards.js`, `card-*.html`),
and the soundtrack sources. The sound director wrote `script.json`/`script.js`,
`mix.json`, `music-plan.*.json` and its helper scripts. Renders are in `out/`
(git-ignored).

**Kit, lifted and extended** (`kit/README.md` › Built so far):
- `components/viewer.js`: reel 01's card camera, the FLIP, the tap and the
  bubble unfold, now shared. `Kit.flip` is the two-faced card.
- `card.textRect` lifts part of one text run.
- Four new `FORBIDDEN` patterns.
- `kin.play({ origin })`, so a centred line grows from its centre.
- `still.mjs`: option values are no longer read as times.
- `deliver.mjs` fails a silent file.
- The sound director added optional `master.limit` and `bed.duck` to
  `audio/mix.mjs`; reel 01's graph is unchanged.

**Decisions taken while building**
- The excess card's consequence box is `.conseq` (the prompt said `.cq`). The
  whole box and `.action` are hidden by element; nothing is rewritten. Every
  card passes `assertClean`.
- **The pin always faces the lens** while it rides the arm's 180° turn; flat
  on the plane, it vanished edge-on. The arm turns about x 540, so −430 lands
  exactly on +430.
- **The 50 L evaporation part never leaves.** A dashed copy makes the trip
  to the excess end and is refused. When the part itself travelled, the
  −430 pin stood outside the band and then "came back inside" (critic).
- **The poster** shows numbers only on the scale. The tag reads
  `वेरिएशन · टंकी 10,000 L`, which names what is measured and that it depends
  on the tank: 7 Hindi words at frame 0. `कम` / `ज़्यादा` arrive in the rule
  beat and leave after the +30.
- **The +30 is lifted out of its cell** as a 160 px white chip on the axis,
  over a dimmed card. A camera macro caught the card's edge.
- **Bar 11 is one line**, `आपके फ़ोन पर दिखे।`, so it is gone before the
  payoff lands on the spoken `नोटिस` (20.975 s). The two-line version
  overprinted it.
- **The payoff** shows both answers fanned: the shortage card over `−430 L`,
  the excess card over `+430 L`, the hook's two readings. In bar 14 the two
  fold into the app tile as the band rises into the gold rule. Before, the
  frame was nearly empty.
- **Nothing dissolves.** The phone slides in and out; a crossfade is banned.
  The stage objects stay ≤ 696 px: phone 1.65×, cards 0.6 in bars 7–11.
- **No frame holds still** for more than 0.4 s before the end card. Measured:
  slow pushes on the rod, the instrument and the card through the long
  holds, and a 1.5% push on the lockup.

**Sound** (sound-director agent; full report `AUDIO.md`): voice + music.
- Voice: 238 characters, word for word. L3 is take 4 of 8; the fast takes
  ended on a rising pitch, like a question. Long comma pauses were shortened
  inside the silence.
- Music: D minor bars 1–3, a D-major groove from the turn (5.625 s). The bed
  is cut to zero from 17.806 to 18.278 s, before the +30.
- Hits at 1.406, 18.281 and 26.25 s.
- Loudness: −15.97 LUFS, −2.7 dBTP.
- Titles are locked to its measured words: `तो` 4.205, `स्टॉक` 6.995,
  `नोटिस` 20.975, `पता` 22.415.

**What the checks caught**
- QA gate 1, by eye: piled-up titles (a word-time lookup bug), ghost numbers
  parked at the corner, a pin hidden edge-on, an empty payoff, weak
  push-ins.
- QA gate 1, measured: the `+400` label past x 888 during a macro and the
  rule beat's push (`safe.mjs`), and 9 Hindi words for an instant at 15.1 s.
- QA gate 2, the fresh-eyes critic: four must-fixes, all fixed. They were 9
  words in bar 11, the phone dissolving, two frozen stretches, and the pin
  out and back in.
- Should-fixes applied: stage widths, a centred band-row push, the title
  held through the FLIP, the hero-size +30, a fuller payoff and bar 14, the
  poster naming what is measured, and the tag no longer crossing the rod.
- Should-fixes not applied:
  - 9 सितंबर for the out-of-band bubble: both cards print Tuesday 8
    September, and the mirror world is the same day.
  - The pin stem crossing a `400` label mid-turn: transient.
  - The `−430 L · 20 L अंदर` chip covering the card's BUSINESS DATE: artwork.
- The mirror flip is proven: before the turn only the front card shows (the
  green verdict); after it, only the back card (red), and its text is not
  mirrored.

**Open for the owner:** watch it with sound. Nobody has listened to it. Per
`AUDIO.md` §9, check L3's ending (it should fall like a statement), Hit 1 on
`फैसला`, whether the plucks sound thin, and whether the metal slide reads as
a hiss.
- Delivery (17 Oct): `v1.mp4` 1080×1920, 60 fps × 3 sub-frames, 30.0 s, −16.0 LUFS,
  −2.3 dBTP, 10.5 MB, bt709 tagged in full · `v1-whatsapp.mp4` 720×1280, 30 fps,
  −16.4 LUFS, −3.3 dBTP, 10.5 MB · `v1-poster.jpg`, `v1-sheet.jpg`. Frames pulled
  from the MP4 itself confirm the fixes are in the file. `safe.mjs` and the new
  `motion.mjs` both pass (longest still run 0.4 s; at most 7 Hindi words on
  screen).

## Owner verdict on v1 — 18 Oct 2026

"Reel 02 v1 looks good." Approved. Committed and pushed as `0d05b10`. Media is
git-ignored: run `node marketing/backup.mjs` to keep `out/` and `build/audio/`.
