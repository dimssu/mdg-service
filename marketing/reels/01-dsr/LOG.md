# Reel 01 · DSR — log

Newest entry at the bottom. Every version, every owner note (in their words),
every decision and why. A session resuming this reel reads this file first.

## v1 prompt — 17 Oct 2026

- Prompt written: `PROMPT.md` (v1). Not yet run.
- Card design: the **live** bilingual workbook card (owner's choice, 17 Oct),
  drawn from a clean HEAD copy of `mdg-backend` — the working tree holds the
  uncommitted Hindi-only redesign.
- Figures: the fact file's published rows (20-Aug yesterday, 21-Aug today);
  stock check −180 L against a 766 L / 570 L band. Arithmetic in CATALOG § 01.
- Draft voice: 221 Hindi characters (ceiling 240), estimated ~22.6 s.
- This reel also builds the shared kit (`kit/README.md`).
- Open: nothing blocking.

## v1 prompt revised after review — 17 Oct 2026

Three independent critics (facts & rules · buildability & craft · Hindi & hook)
returned 55 findings; all must-fix and should-fix items applied. The ones that
changed the reel:
- The live card prints the outlet code twice (header pill **and** footer) —
  both hidden now; clock times dropped with `shiftTime: ''`.
- A single-tank live card has **no STOCK column**. The paper register now uses
  the card's own heads, cut to OPENING STOCK · RECEIPT · TOTAL STOCK · SALES; the
  data moment is a vertical ledger total whose `14,246` comes from the glance
  tile STOCK IN TANK NOW. Rows corrected: 20-Aug DIP 141, 21-Aug DIP 160.
- A bespoke digest with exact fields (the stock digest gave a 1,712 px
  two-product card with wrong meters and band parts) — in CATALOG § 01.
- Picture order matches the app: stock check left, sales right.
- The stock-check beat no longer borrows reel 02's band-and-pin device.
- Hook Hindi fixed: "DSR नहीं मिला" read as "didn't arrive"; now `DSR का हिसाब
  फिर नहीं मिल रहा?`. Payoff `रात का हिसाब — अब नहीं` was an overclaim; now
  `हिसाब मिलाना नहीं — बस उतारना`.
- Voice re-timed to the bars (238 chars), TTS punctuation only `, । ?`, and a
  spoken call to action added: `डीलर कवच। हमसे बात कीजिए।`. End card now leads
  with the toll-free number.
- Kit: classic scripts on `file://` (modules and file fonts can't coexist in
  Chrome), fonts outside the shadow root, an exact build list.
- Git: the root `.gitignore` ignored every `build/` folder; `marketing/.gitignore`
  now re-includes reel sources and keeps their media out (verified).

## v1 built — 17 Oct 2026

Built in the planning session itself (the owner chose "Do it here"). Kit built
alongside (see `kit/README.md` › Built so far).

**What was made.** `build/` holds the scene (`index.html`, `scene.js`,
`scene.css`), the cards drawn by the live builder from a clean HEAD copy
(`cards.js`, `card-*.html`), the soundtrack sources (`script.json`,
`music-plan*.json`, `mix.json`, the sound director's analysis scripts). Renders
in `out/` (git-ignored): `v1.mp4` (60 fps × 3 sub-frames), `v1-whatsapp.mp4`,
`v1-poster.jpg`, `v1-sheet.jpg`, `stills-v1/`.

**Decisions taken while building**
- Bars 5–9 put the card in a window below a black type band, so white reel type
  never sits on the card.
- Lifted figures travel as white chips (a lifted cell) and only turn into white
  type once they are over the dark — over the white card they were invisible.
- The SOLD glance tile is the hero number (camera at 2×, `4,222` at ~92 px), then
  the camera glides to STOCK IN TANK NOW as the voice says "आज का स्टॉक".
- The register page runs off the bottom of the frame as blank ruled rows, and the
  end card sits on the same ruled paper — no dead lower third on WhatsApp.
- The strongest moment is a "stamp": the small sales card drops onto the paper
  row and flattens into its underline on the 22.0 hit; the gold tick sits in the
  heads row beside SALES (inside the safe box).
- The stock check shows `570 + 196 = 766` and `−180 · सीमा में` in reel type
  (no gauge or pin — reel 02's device); the voice's "साफ़ लिखा" is carried by the
  card's own verdict.
- End card leads with the toll-free number at 100 px; small lines raised to ≥ 40 px.
- Phone at 1.72× with its top at y 540 (the overlay needs the upper zone); its
  composer is cropped below the frame.

**Sound** (sound-director agent; full report `AUDIO.md`): voice + music. 238
characters, no words changed; four start times moved to fit the bars (L2 2.70,
L4 8.50, L6 18.00, L7 26.00). Music take 2 of 3, re-cut so its turn lands on 6.0
and its beats sit on the grid (98% within ±25 ms). Mix −15.9 LUFS, −2.0 dBTP.
To check by ear: the bed's seams at 5.995 s and 8.975 s; whether the
phone-safe layer on the hits is harsh; whether `डी-एस-आर` in L1 is clear.

**What the checks caught**
- A clock's waiting digits peeked through their mask's padding and drew marks
  over the Hindi hook (lesson added to DIRECTION; the kit now hides parked words).
- Headless Chrome's fast capture returned 1080×1833 frames until given an
  explicit clip (fixed in `kit/render/common.mjs`).
- QA gate 2 (fresh-eyes critic): no claim, leak, language or arithmetic fault.
  Four must-fixes, all fixed — stock-check rows overprinting the clause line;
  no big-type `−180` beside `766`; `4,222` up for under 0.5 s and landing small,
  off-safe and doubled; a frozen 21.0–22.1 with nothing landing on the hit.
  Should-fixes applied: bigger phone, clearer page pile, chips not over the heads,
  ledger centred and its backdrop dimmed to 10%, every held line drifts, phone
  shadow made a short drop, end-card sizes, tick inside the safe box, the
  bar-5 line split so "आज का स्टॉक" lands with the voice.

**Open for the owner:** watch it with sound. Everything above was checked by
frame and by measurement; nobody has listened to it.
- Delivery (17 Oct): `v1.mp4` 1080×1920, 60 fps, 30.0 s, −15.9 LUFS, −1.7 dBTP,
  13.3 MB · `v1-whatsapp.mp4` 720×1280, 30 fps, −16.4 LUFS, −3.3 dBTP, 10.8 MB.
  The first encode carried only the colour matrix (primaries/transfer blank);
  both files were re-tagged bt709 losslessly (`h264_metadata`) and the kit's
  encode chain now adds `setparams`, so later renders are tagged in full.

## v2 — 17 Oct 2026 · logo and structure

**Owner's notes on v1, in their words:** "The logo is not correct in the video.
Also the structuring is a bit messy and wrong, can we have better premium
structuring and placement inside the video."

**What changed**
- **Logo.** v1 drew the mark by hand. It is now the app's own path
  (`kit/brand/logo/mark-path.js`, generated from `BrandMark.tsx`), in the
  lockup, the end-card tile and the phone header (black on a grey disc, as in
  the app). A sweep round the ring reveals it. First pass: the header mark
  came out as a blob, because the app's small-size thickening (4 units of
  1,024) had been scaled to 136.
- **One axis.** Every line, the register, the card, the sum, the lockup and the
  end card centre on x = 540. Nothing centred is wider than 696 px
  (x 192–888), the only width both centred and inside the hard-safe box.
  Rule now in DIRECTION §5.3.
- **The register.** Four columns of 180 (x 180–900). The column grid is gone,
  so heads, figures and ruled lines carry it. Figures are 48 px (38 px
  gutters, so four numbers read as four). It sits 36 px lower (row 3 ends on
  y 1248). The three attempts each get their own line. The two older lines
  and the page clear *before* the latest one lifts into the phone bubble. In
  the first pass the lift slid over the struck figures.
- **One title zone.** Every headline starts at y 300. The copy beat and the
  team line are two phrase-true lines ("रजिस्टर में / कोई भी उतार ले",
  "MDG टीम / देखकर भेजती है"). The report sits between them and the date line
  with 34 px of air each side. It no longer covers the date. A middle pass put
  the words under the register instead. The critic called that a flipped title
  zone, and it went back.
- **Type widths.** Lines that ran past x 888 now break at phrases (`\n` in
  `kin.line`). The payoff is 72 px, the stock-check sum 78 px, and the
  end-card number 86 px (it was 104 px and 826 px wide, into the button
  column).
- **The sum (bars 6–7).** The numeral column is centred on 540, with its right
  edge at x 680. Operators hang to its left, and the rules span the numerals.
- **Smaller fixes from the critic.** The sales card is parked while the stock
  check is up; its edge had shown as a sliver at x > 1054. The dark stage is
  brand black `#18181B`, not `#000`. The lockup's name travels to the end card
  centre-to-centre at its width ratio, so it stays on the axis. The end-card
  number draws as its gold rule lands. The end card is regrouped (call ·
  brand · where · foot) with 28 px clear of the box's foot. "Google Play" and
  "Dealer Kavach" in the Play line are now set in Inter. The end card's ruled
  lines use the register's 110 px pitch.

**Checks:** QA sheets `out/stills-v2/` (heaviest frame 58 ms, so 60 fps × 3).
New measured safe-box test (`kit/render/safe.mjs`): passed; only words in
motion touch an edge. QA gate 2: one fresh-eyes critic gave 4 must-fixes,
all fixed and re-shot. Not acted on (should-fix): the stock-check card's own
−180 and 766 sit at x 885–950. They are artwork, and the reel type above
re-sets both numbers. The card also starts closer under the black-band title
than the white beats do.
