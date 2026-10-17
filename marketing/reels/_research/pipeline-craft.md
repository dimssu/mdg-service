# Reels research: production pipeline + craft playbook

Written 17 Oct 2026. Reader: the person writing the per-video prompts. Repo root = `/Users/dissu/Documents/PP/mdg-service`; every path below is relative to it unless it starts with `/`.

**Legend.** VERIFIED = I ran it or read it in this session. MEMORY = from the memory notes or past-session transcript, not re-run. 3P = third-party source, not official. UNVERIFIED = nobody has checked.

**What I did and did not touch.** Read-only on the repo. I wrote this file only. I ran: version checks, a headless Chrome on a scratch folder (card render, speed test, audio test, ffmpeg blend test, colour test), and three free read-only ElevenLabs GETs (plan quota, voice name). No `--commit`, no prod URL, no database, no paid generation, no download of anything. Secret values were never printed; only variable names appear.

---

# HALF A. Production tools on this machine

## A0. The ten things to know

1. **Render with plain Node + Playwright + the installed Chrome.** Everything needed is already here. Remotion is not installed (`mdg-demo/node_modules` is missing).
2. **The real report cards can be rebuilt locally with invented figures.** Every card is an HTML-string builder. I rendered the Credit & DOD card with the fact file's own invented numbers (due ₹4,86,120, limit 25,00,000, 74%). Result matches the real layout.
3. **Cards stay as live HTML inside the reel**, not as PNGs. That gives infinite-sharp macro zooms and lets sections be pulled apart (exploded view).
4. **Inject the vendored Noto Sans Devanagari into every card**, or this Mac draws Hindi in Kohinoor and the card looks different from what dealers get.
5. **Every card prints the outlet code in its header pill.** Public videos must hide it (no outlet codes).
6. **Voice is already solved**: one Hindi voice ("Aarush - Firm, Natural and Engaging"), model `eleven_multilingual_v2`. Measured pace: about 11 Hindi characters a second. A 30 s reel carries about 240 characters of speech.
7. **Music and SFX calls that worked are on record** (exact bodies in A2). `music_v1` composition plans honour section lengths to within 50 ms.
8. **Colour trap found today:** the repo's current ffmpeg recipe shifts brand colours by up to 9 levels (gold gets redder). Use the explicit bt709 conversion in A4.
9. **The disk is 91% full (39 GB free).** A 30 s video at 4 subframes is 3,600 JPEGs. Pipe them to ffmpeg; do not keep them.
10. **Remotion is not worth it for this.** See A8 (licence is per seat, and the company's headcount decides it).

## A1. Machine inventory (VERIFIED)

| Item | Result |
|---|---|
| Hardware | Apple M3 Pro, 11 cores, 18 GB RAM, 39 GB free disk (91% used) |
| Node / npm | v20.19.5 / 10.8.2 |
| tsx | 4.21.0, only through `npx --no-install tsx` (not on PATH) |
| ffmpeg / ffprobe | 8.1.2 at `/opt/homebrew/bin`. Filters present: `tmix`, `minterpolate`, `loudnorm`, `sidechaincompress`, `acompressor`, `agate`, `alimiter`, `amix`, `adelay`, `apad`, `areverse`, `silenceremove`, `atempo`, `xfade`, `zoompan`, `gblur`, `lut3d`, `tblend`, `blend`, `framerate`, `showvolume` |
| Encoders | `libx264`, `libx265`, `h264_videotoolbox` / `hevc_videotoolbox` (hardware, lower quality per bit), `aac`, `aac_at`, `libmp3lame`, `prores`, `libvpx-vp9`. **No `libfdk_aac`.** |
| Playwright | **1.60.0**, in repo-root `node_modules` (resolves for any script under the repo). **No bundled Chromium installed** (`~/Library/Caches/ms-playwright` missing). |
| Browser | Google Chrome 155.0.8059.85 at `/Applications/Google Chrome.app`. Use `chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }))` exactly as `marketing/films/graphics-kavach/render.mjs` does. |
| Other | python 3.14.7, ImageMagick (`magick`), `yt-dlp`. **No sox.** |
| Remotion | `mdg-demo/package.json` lists `remotion ^4.0.200` + `@remotion/*`, but `mdg-demo/node_modules` does **not exist**. It needs `npm ci` and a Chrome download on first render. |

**Measured today** (trivial page, so real scenes will be slower; UNVERIFIED for a full scene):

| Test | Result |
|---|---|
| Chrome launch | 0.37 s |
| `page.screenshot` 1080x1920 JPEG q92 | 34.6 ms/frame |
| `page.screenshot` PNG | 49.2 ms/frame |
| CDP `Page.captureScreenshot`, JPEG, `optimizeForSpeed:true` | **17.4 ms/frame** |
| `OfflineAudioContext` 30 s stereo 48 kHz (kick every beat at 120 BPM + noise riser), render and move to Node as base64 PCM | **0.24 s**, 5.76 MB, wrote a clean 30.000 s WAV |
| `Intl.Segmenter('hi')` in Chrome 155 | works (see B5) |
| ffmpeg subframe blend: 60 subframes at 120 fps in, `tmix=frames=4`, `select`, out 15 frames at 30 fps | works, exact frame count |

So the sample prompt's audio step (OfflineAudioContext to WAV) and blur step (tmix) both work on this machine.

## A2. ElevenLabs

### Where things live (names only)

| What | Where |
|---|---|
| Key, voice, model, format | `mdg-demo/.env`: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_OUTPUT_FORMAT`. Optional per `mdg-demo/README.md`: `ELEVENLABS_VOICE_ID_EN`. `.env` is git-ignored; `.env.example` is the template. |
| Value of model / format | `eleven_multilingual_v2` / `mp3_44100_128` |
| Film voice script | `marketing/voice.mjs`. Reads `../mdg-demo/.env` by hand-parsing. `node marketing/voice.mjs --film <slug>` reads `films/<slug>.json` and writes `marketing/voice-<slug>/<beat>.mp3` plus `voice.json` (sha256 of the spoken text, seconds, Veo clip length). Re-records only lines whose text changed; `--force`, `--measure` exist. |
| Tutorial voice script | `mdg-demo/scripts/generate-voice.mts` (same settings, same hash cache) |
| `films/short/finish.mjs` | does **not** call ElevenLabs. It only mixes (overlays, bed, SFX, ducking, loudnorm). |
| Music and SFX calls | **Not saved as a script.** They were typed inline (`node --input-type=module -e`) on 4 Oct. Bodies are reproduced below. The kit should save them as `audio/music.mjs` and `audio/sfx.mjs`. |
| Assistant's voice | different voice, `docs/ASSIST_RUNBOOK.md` line 93, labelled "NOT the demo-video voice". Do not use it. |

### The voice (VERIFIED by a free GET on the voice id)

**"Aarush - Firm, Natural and Engaging"**. Category professional, labels: Hindi, male, middle-aged, "confident", use case narrative. Models it supports: `eleven_turbo_v2_5`, `eleven_flash_v2_5`, `eleven_multilingual_v2`, `eleven_multilingual_sts_v2`. (No `eleven_v3`.)

### Plan quota (VERIFIED by a free GET)

Tier `grant_tier_2_2025_07_23`, active, annual billing. **6,289,918 of 33,010,000 credits used.** Resets **2027-01-11**. Voice limit 660. So 15 videos of speech, music and SFX are small against the balance. The expensive item is explicit-duration SFX (40 credits per second, per docs).

### Speech settings in use (every film so far)

```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128
{ text, model_id: "eleven_multilingual_v2",
  previous_text, next_text,                       // neighbours: shape delivery, are not spoken
  voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true } }
```

No `speed` field has ever been sent. The API has one (`speed`, default 1). Its allowed range is not stated on the docs page I read, and I have not tested it (UNVERIFIED; the usual range is 0.7 to 1.2). Worth one test line at 1.08 before deciding to post-speed the audio.
Also available and unused: `apply_text_normalization` (`auto|on|off`), `seed`.

### Hindi pace: use the measured number

| Measure | Value |
|---|---|
| The short's 10 final lines (`marketing/voice-kavach-short/voice.json` + `films/kavach-short.json`) | 363 characters in 33.14 s = **10.95 chars/s** (about 2.3 words/s). Per-line range 8.2 to 14.6. |
| Slowest line | the one with digits and a price: 8.2 chars/s |
| Plan's own estimator | seconds = chars / 10.3 + 0.35 s breath (chars include spaces and punctuation). Close to measured. |
| Old trap (memory) | Hindi runs about 35% longer than a word count suggests. First marketing film came out 2:11 against a 90 s script. Numbers are the worst: "557" is "पाँच सौ सत्तावन", about 2 s each. |

**Budget for a 30 s reel:** about 22 s of speech at most = **about 240 characters, about 50 words**, with 0.35 s between lines. Let the screen carry numbers and lists. Measure the real mp3 with ffprobe before cutting; never trust an estimate.

Spelling lessons (memory, 28 to 30 Sep): the listen-check flags spelled-out letters (एम-डी-जी, जी-एस-टी) and dropped dots under letters; ignore those. Real catches: "फ़ीस" is read as "फईस" (write फीस); "फ़र्क़" is garbled (write अंतर). House spellings: एम-डी-जी सर्विसेज़, डीलर कवच, डी-एस-आर, जी-एस-टी.

### Voice-file end click (MEMORY, cut.mjs lines ~549 to 583)

107 of 127 voice files ended on a click about 60 ms before the end. Fix (never lengthens or shortens a line beyond 39 ms of removed sound):

```
aresample=44100,areverse,
silenceremove=start_periods=1:start_duration=0.08:start_threshold=-55dB:start_silence=0.05,
areverse,afade=t=in:d=0.01,apad=whole_len=<samples>,atrim=end_sample=<samples>
```

### Music: what worked (4 Oct, `music_v1`)

```
POST https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192      // header xi-api-key
{ model_id: "music_v1",
  composition_plan: {
    positive_global_styles: ["cinematic Indian underscore for a promotional film","no vocals","no singing",
                             "85 bpm","warm, premium, restrained","sits under a spoken voice-over"],
    negative_global_styles: ["vocals","choir","lyrics","EDM drop","dubstep","electric guitar solo","loud cymbal crashes"],
    sections: [
      { section_name:"Pressure", duration_ms:12000, lines:[],
        positive_local_styles:["tense and sparse","low tanpura drone in a minor key","soft heartbeat low drum",
                               "a clock tick once a second that gets slightly faster","dark, worried"],
        negative_local_styles:["melody","bright"] },
      { section_name:"The turn", duration_ms:13000, ... "warm turn to a major key","santoor and plucked strings over a soft pad",
        "hopeful, confident, gentle swell","light hand percussion enters halfway" ... },
      { section_name:"The open question", duration_ms:9000, ... "the pulse thins out","one held low string note","slow ticking",
        "suspense, curiosity","a short riser at the very end" ... negative:["drums","resolution"] },
      { section_name:"Sting", duration_ms:4640, ... "one low drum hit with a bell shimmer, decaying to silence" ... } ] } }
```

Requested 38,640 ms total; the file came back **38.687 s** (`marketing/films/short/sound/bed.mp3`, 44.1 kHz stereo). So section lengths are honoured to about 50 ms. Plan every section as a whole number of bars.

What the ElevenLabs docs say now (3P-official, fetched today):
- `music_v1` is still available; v2 is the UI default; **v2.5 (`model_id: "music_v2_5"`) is "most advanced"** and supports composition plans.
- The v2/v2.5 plan format is **different**: `chunks[]`, each `{text:"[Section name] ...", duration_ms, positive_styles (max 50), negative_styles, context_adherence}`; each chunk 3 to 120 s; total 3 s to 10 min (docs: `/docs/eleven-api/guides/how-to/music/composition-plans`). The proven v1 format above uses `sections` and `*_local_styles`. Do not mix them.
- Music length 3 s to 5 min; output MP3 44.1 kHz 128 to 192 kbps or WAV; "cleared for nearly all commercial uses, including advertisements".
- Whether this account can call v2/v2.5, and what a generation costs in credits: **UNVERIFIED** (not tested; it costs credits). Suggest one 3 s probe, with the founder's nod.

### SFX: what worked (4 Oct)

```
POST https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192
{ text: "<prompt>", duration_seconds: <s>, prompt_influence: 0.6 }
```

| File (`marketing/films/short/sound/`) | Prompt used | Asked | Got |
|---|---|---|---|
| `subhit.mp3` | a single deep cinematic sub-bass hit, short and clean, no reverb tail | 1.5 | 1.48 s |
| `whoosh.mp3` | a quick soft airy whoosh transition, subtle, for a video cut | 0.7 | 0.68 s |
| `thump.mp3` | a thick stack of paper files dropped flat on a wooden desk, one dull thump | 0.9 | 0.88 s |
| `brandhit.mp3` | a deep warm cinematic logo hit with a soft bright shimmer tail | 2.5 | 2.48 s |
| `tick.mp3` | a soft clean user-interface tick, subtle single click | 0.5 | 0.48 s |
| `stamp.mp3` | a rubber stamp pressed firmly onto paper on a desk, one hit | 0.8 | 0.80 s |
| `pop.mp3` | a soft gentle pop, like a small bubble, subtle | 0.5 | 0.48 s |
| `sting.mp3` | one low cinematic drum hit with a delicate bell shimmer decaying to silence | 3.5 | 3.48 s |

All 44.1 kHz stereo mp3. Reusable as they are (SFX licence terms: UNVERIFIED; music is stated cleared for ads). Docs: duration 0.1 to 30 s, 40 credits per second when set, `prompt_influence` high = literal.

### How `films/short/finish.mjs` places them (copy these numbers)

Gain per kind: sub-hit -4 dB, whoosh -10, paper thump -8, deep brand hit -10, UI tick -12, stamp -6, soft pop -10, sting -3. Each effect gets a 5 ms fade-in and an 80 ms reversed fade-out (stops clicks), then `adelay` to its frame, then `amix=normalize=0`. Bed: -14 dB, then `sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350` keyed on the voice (about -17 dB under speech, 10 dB lower while he talks), faded out in the last 0.6 s.

## A3. Loudness and delivery standards already in use

| Rule | Detail |
|---|---|
| Loudness | **Two-pass `loudnorm` I=-16 LUFS, TP=-2, LRA=11.** Pass 1 with `print_format=json`; pass 2 with `measured_I/TP/LRA/thresh`, `offset`, `linear=true`. AAC adds about 1.5 dB of overshoot (target -2 TP gave -0.4 in the file). All films were -23 LUFS (too quiet) until fixed on 30 Sep. |
| Low-bitrate peak trap | A 32 kbps AAC copy overshoots by about 3.5 dB. `alimiter 0.84` still gave +1.5/+2.1 dBTP (clips). `limit=0.6` gave -0.7 dBTP at -17 LUFS. **Check the peak of every low-bitrate copy.** |
| Master | 1080x1920, H.264 High, yuv420p, `-crf 17 -preset slow` (graphics clips `-crf 16`), `+faststart`, AAC 128 to 192 kbps. The short master is 24 fps, 3.71 Mbps video + 188 kbps audio = **17.98 MB for 38.6 s, over WhatsApp's 16 MB**. A 30 s master at the same rates is about **14.6 MB**, just under. |
| WhatsApp copy | 720x1280, H.264 Main, about 1.1 Mbps. The short's copy is 5.7 MB. A "-android" variant (1.26 Mbps, 6.4 MB) also exists; how it differs in intent is UNVERIFIED. Full film: 480x854 two-pass 66k video + 32k mono AAC = 15.1 MB for 19:57. |
| WhatsApp 16 MB limit | 3P only. WhatsApp recompresses bigger files; sending as a document skips that (3P). |
| Remotion render | `--crf=28` is not optional when photographs are behind every scene (55 MB at 18, 12.5 MB at 28). Flat graphics do not need it. |
| Frame rate | Films 24 fps; Remotion tutorials 30 fps. **Recommend 30 fps for reels** (Meta's spec only says "fixed"). |
| Backup | `marketing/.gitignore` keeps media (`*.mp4 *.mp3 *.wav *.png *.jpg *.woff2 ...`) out of git. `node marketing/backup.mjs` pushes it to `s3://mdg-chat/marketing-backup/` (private). Voice takes cost money to redo, so run it after each reel. Sources (`.mjs`, `.json`, `.md`, `.html`, `.css`, `.js`) go in git. |

### Colour trap, measured today

JPEG frames into `libx264 -pix_fmt yuv420p` with no colour flags (what `graphics-kavach/render.mjs` and `cut.mjs` do) decode, with the usual HD assumption (bt709), like this:

| Brand colour | Sent | Decoded today's recipe | Decoded with explicit bt709 |
|---|---|---|---|
| Gold `#F5A524` | F5A524 | **FDA51D** (red +8, blue -7) | F2A523 |
| Navy `#2C2E80` | 2C2E80 | 2A3383 | 2A2E7D |
| Maroon `#7F1D1D` | 7F1D1D | 87261A | 7E1C19 |

Fix for the reel encoder:

```
-vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
-colorspace bt709 -color_primaries bt709 -color_trc bt709
```

(The 3 to 9 level drift will not matter for photos. It matters for a flat brand gold on a navy field.)

## A4. Rendering

### The tsx trap (MEMORY `tsx-breaks-page-evaluate`)

Never run a Playwright script under `tsx`. esbuild rewrites function bodies; `page.evaluate(fn)` ships the rewritten text to the browser, where its helpers do not exist, and every evaluate throws. The failure looks like an outage, not a crash. **Rule for the kit: Playwright scripts are `.mjs` run with plain `node`.** The one place TypeScript is needed (importing the backend card builders) is pure string-building, so run it under `tsx` and write HTML files to disk, then shoot them with plain Node. I proved this two-step today: `tsx` produced `credit.html` (0.6 s), plain Node shot the PNG.

### Existing frame-render code to copy

`marketing/films/graphics-kavach/render.mjs` (same method in `films/graphics/render.mjs`). Note: `marketing/films/motion.mjs` is a Gemini motion-watcher, not a renderer.
- Seeks paused CSS animations: `document.getAnimations().forEach(a => a.currentTime = ms)`; the panel sets its own `--T`.
- **3 browsers x 3 pages**, JPEG q94 via `page.screenshot({clip})`; one browser was the bottleneck (one core pegged). About 13 clips a minute; 144 panels in about 11 min.
- ffmpeg: `-framerate 24 -i f%04d.jpg -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p`.
- Each run keeps frames in `.frames-<pid>` (an `ONLY=` run once deleted the full run's frames).
- `ONLY=D03,I07` filter, a stills mode (one frame at 70% of a clip for a contact sheet), a staleness check against the HTML and kit mtimes, a refusal to render any panel that still carries the placeholder text `FOUNDER TO SUPPLY`.

These panels animate with CSS animations. The sample prompt bans CSS animations (everything from `window.seek(t)`), and springs cannot be written in CSS. **Do not reuse the old panel HTML for reels; reuse the render harness shape.**

### Reel renderer design (recommended)

- **One contract:** `window.seek(t)` sets every style from `t` alone. No CSS animation, no timers, no state between frames.
- **Workers:** 3 Chrome processes, each takes a contiguous chunk of the timeline (for example 10 s), pipes JPEGs straight into ffmpeg's stdin (`-f image2pipe -c:v mjpeg`) and writes a near-lossless segment. Then concat and encode once. No JPEG folders (disk is tight).
- **Capture:** `page.evaluate(t => seek(t))`, then CDP `Page.captureScreenshot` JPEG q92 to 94, `optimizeForSpeed`. Viewport 1080x1920, `deviceScaleFactor` 1. Before frame 0: `await document.fonts.ready`, one warm-up seek.
- **Motion blur is real, not a CSS filter.** Capture S sub-times per output frame, spread across a shutter window centred on the frame time (180 degrees is the usual start; it is a convention, not a law; sources: [Pro Video Coalition](https://www.provideocoalition.com/motion_blur/), [Wipster](https://www.wipster.io/blog/debunking-the-180-degree-shutter-rule)). Blend with ffmpeg:

```
ffmpeg -framerate 120 -i sub_%05d.jpg \
  -vf "tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\,4)\,3)',setpts=N/(30*TB),scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -r 30 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -crf 17 -preset slow out.mp4
```

  (Tested today: 60 subframes in, 15 frames out. The `select` keeps the frame whose 4-frame window is complete.) With S=4 at 30 fps the shutter is 4 sub-times; for an exact 180 degrees space the 4 sub-times across half the frame interval.
- **Cost:** 30 s x 30 fps x 4 = **3,600 captures** (7,200 at 60 fps). At 35 to 60 ms each across 3 browsers I estimate **2 to 5 minutes** (UNVERIFIED for a real scene). 60 fps doubles this and the file; I would not pay it by default.
- **Per-beat QA stills:** render one frame per beat (60 at 120 BPM) at beat time + 0.05 s, make a contact sheet, look at it before the full render. Cheap, and it is the step that catches clutter.
- **Hardware encode** (`h264_videotoolbox`) exists but is for drafts only.

### A note on loops

Reels/Shorts loops want the last frame to rhyme with the first; WhatsApp plays once and needs a real end card. See B1 for the reconciliation.

## A5. Real references with invented data

### Report cards: all HTML-string builders (VERIFIED by reading; credit card VERIFIED by running)

All cards are drawn as HTML and shot by `mdg-backend/src/automation/cardRenderer.ts` (viewport per card, **deviceScaleFactor 2**, the `#frame` element). Fonts are a system stack: `'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN',system-ui,...`. The builders are pure functions of their input, with no database call.

| Card | Builder (file: function) | Input | Notes |
|---|---|---|---|
| Credit & DOD | `mdg-backend/src/automation/sdms/report/creditCard.ts: buildCreditCard(input)` then `renderCard.ts: cardHtml(data, festival?)` | `{code, dueAmount, dueDate 'dd-mm-yyyy', currentLimit, availedLimit, availableLimit, formOfLimit 'DOD'/'CREDIT'/'CASH & CARRY', preparedAt, preparedOn}` | Shot at 1120x1400; `#frame` is 1000 px + 6 px maroon border. Closest existing script: `mdg-backend/scripts/preview-festival-card.ts` with a built-in sample (`npx tsx scripts/preview-festival-card.ts out.png [independence-day]`). I did **not** run it: it launches Chromium through `launchChromium`, i.e. Playwright's bundled browser, which is not installed here. My route: write the HTML with `tsx`, shoot with plain Node and `channel:'chrome'`. Note `renderCard.ts` imports `cardRenderer.ts` -> `browserBudget.ts` -> `config/env.ts`, so even the builder import parses the env (my probe did this; it printed no error and opened no connection, but it is the prod-pointing `.env`, so keep fixture scripts free of any DB or network call). Test fixture in `renderCard.test.ts`. |
| DSR (2 images) | `services/dsr-report/cards.ts: buildSalesCardHtml(digest)`, `buildVariationCardHtml(digest)`; `renderDsrCards()` | `DsrReportDigest` from `@dk/shared` | Card width 720. Copy the `row()` / `product()` / `WEEK` factories from `cards.test.ts` for invented data. (`services/dsr-report/render.ts` makes the older full-sheet HTML.) |
| Ledger Watch | `services/ledgerWatch/card.ts: ledgerWatchCardHtml(data)` | `{code, movements:[{date,titleEn,titleHi,amount,direction}] (max 4), totals..., window?}` | Card says "this is not your DOD deposit amount". |
| Water testing | `services/waterIngress/card.ts: waterIngressCardHtml(log, outletCode, now)` | `WaterIngressDayLog` | 12 two-hour windows. Never show how the record is made. |
| Supply status | `services/roSupplyStatus/card.ts: roSupplyCardHtml(snapshot, outletCode)` | `RoSupplyStatusSnapshot` | `card.test.ts` has fixtures. |
| Kavach compliance | `services/kavach/card.ts: buildKavachCardHtml(data)` | `{outletCode, businessDate, score, pending[], pendingOverflow, computedAt}` | Card width 720. |
| Load Planner | `services/loadPlanner/card.ts: loadPlanCardHtml(plan)` | `LoadPlan` (`shared/src/types/loadPlan.ts`) | **Not in the fact file's service list**; memory says LIVE for 8 dealers. 4-day projection. Planner should check the fact file for what may be said. |
| Tanker density | **no card.** | | It reaches the dealer as chat messages and a 9 am "send photo" ask (`services/ttDensity/notify.ts`, `services/chatAsks/morning.ts`). Recreate as chat bubbles. |
| Festival band | `automation/sdms/report/festivalBand.ts` | | Credit card only. |

**What I proved:** `buildCreditCard` + `cardHtml` with the fact file's invented figures produced a 12.9 KB HTML file; shot at 2x it gave a 467 KB PNG showing "₹4,86,120.00", "26-08-2026", "3 दिन बाक़ी हैं", the three limit tiles, the 74% bar, the DOD chip lit, the gold ticker band top and bottom. This is the real design (maroon `#7f1d1d`, red `#b91c1c`, gold `#f59e0b`, cream `#fffdf5`, ink `#1c1917`, grid `#e7d9bf`, page `#f4ede0`).

**Four things the prompt must say about cards:**
1. **Outlet code.** Header pill prints `data.code` (`renderCard.ts` `.code`, other builders take `outletCode`). I used "DEMO". Public videos must show no outlet code: hide or replace the pill (CSS `visibility:hidden` on `.code`, or a neutral word such as "आपका पंप"). Check each builder's own class.
2. **Fonts.** On this Mac, `Noto Sans Devanagari` is not installed, so Chrome fell through to Kohinoor and the card looked different (compare my two renders). Inject `marketing/pamphlet/fonts.css` (rewrite its `url(./fonts/...)` to absolute `file://` paths) so the first font in the stack resolves. Whether the production server has Noto Sans Devanagari installed is UNVERIFIED (it is first in the stack, so likely).
3. **Embed as DOM, not PNG.** Parse the builder's HTML, put its `<style>` and `#frame` into a Shadow DOM root (rewrite `html, body {}` rules to `:host`), so the reel can address sections (hero, three tiles, bar, form chips, footer) and zoom without pixelation. UNVERIFIED (not built); the alternative is `<iframe srcdoc>` and reaching in through `contentDocument`.
4. **Every figure invented.** Reuse the fact file's own invented sets (DSR 19-08 / 20-08 rows; credit ₹25,00,000 / ₹18,42,650 / ₹6,57,350 / due ₹4,86,120 by 26-08).

### Dealer app screens

- **Real tokens** are in `mdg-client/src/index.css`: `--color-bg #fafaf9`, `--color-surface #ffffff`, `--color-brand #18181b` (near-black, not teal or navy), `--wa-bar #ffffff`, `--wa-wallpaper #f3f2f0`, `--wa-in #ffffff` (their bubble), `--wa-out #e7e5e4` (his bubble, warm grey), `--wa-bubble-text #111b21`, `--wa-meta #667781`, `--wa-tick-read #53bdeb`, `--wa-notice #ffeecd`, `--wa-chip #ffffff`, `--wa-divider #e9edef`, `--wa-doodle rgba(17,27,33,.045)`. Dark mode exists but is not the default. Since 13 Oct the chat list is the home screen (WhatsApp layout in the brand's black).
- **Real screens** to read for structure: `mdg-client/src/pages/ChatListPage.tsx`, `ChatPage.tsx`, `ChatInfoPage.tsx`, `ChatMediaPage.tsx`, `SettingsPage.tsx`, `ServicesPage.tsx`, `StaffPage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`.
- **`mdg-demo/src/screens/*` is partly stale.** `ChatScreen.tsx` has no `--wa-` tokens, so it predates the 13 Oct chat restyle (do not copy its layout). `CreditCard.tsx` states it mirrors the current `renderCard.ts` layout. `src/theme.ts` mirrors the old app tokens. `PhoneFrame.tsx` + `SCREEN = 390x844` is a usable phone frame.
- **Do not use:** `mdg-demo/public/credit-card/*.jpg` (RETIRED, old seven-row card, README says so); `mdg-demo/public/stock-variation/sheet.jpg` (the old hand-typed sheet, a bridge format).
- **Logos:** `mdg-demo/public/brand/logo-{full,mark}{,-white}.png`, same set in `mdg-landing/public/`, `marketing/panels/icon-512.png`.
- **Screenshotting the real app with seed data (MEMORY `local-stack-for-ui-checks`, 10 Oct; NOT run today because the laptop `.env` points at production):** in-memory Mongo on `127.0.0.1:27099`; backend with shell env overrides `MONGODB_URI=<local> SCHEDULER_ENABLED=false PUSH_ENABLED=false ASSIST_ENABLED=false PORT=4100` (prove the override with `ps eww -p <pid>` before doing anything); client with `VITE_API_BASE_URL='http://localhost:4100/api/v1' npx vite --port 5174` (client script is `vite --port 5174`); Playwright `channel:'chrome'`; plain node. About ten minutes. On every boot the backend seeds a permanent DEMO dealer, owner login, a **one-message** chat and a Kavach programme (`mdg-backend/src/seed/demoReviewer.ts`; the login is in that file, use it only against the local stack). So a realistic chat needs extra `Message` rows with card images inserted.
- **Recommendation:** hand-build the phone screens as HTML from the exact tokens above (cheap, animatable, no stack), and take **one** local-stack screenshot set as pixel truth to diff against. Public rule: only screens a dealer already sees (no admin, no `mdg-demo/src/screens/admin/*`).

## A6. Fonts offline (VERIFIED)

| Where | What |
|---|---|
| `marketing/pamphlet/fonts/` (31 woff2, 1.4 MB) + `marketing/pamphlet/fonts.css` | **Inter** 400/500/600/700 (latin, latin-ext **only**, no Devanagari); **Noto Sans Devanagari** 400/500/600/700 (devanagari, latin, latin-ext); **Space Grotesk** 400 to 700 (latin, latin-ext); **Tiro Devanagari Hindi** 400 (serif; the brand uses it for the कवच mark only). Rebuild with `node marketing/vendor-fonts.mjs`. `*.woff2` is git-ignored. |
| System (macOS) | Kohinoor, Devanagari Sangam MN, ITF Devanagari, Mukta Mahee, Noto Sans (many scripts, not Noto Sans Devanagari). **Inter, Geist and Noto Sans Devanagari are NOT installed.** `document.fonts.check()` returns true for missing fonts, so do not use it to test. |
| Brand stack | `mdg-demo/src/marketing/brand.ts`: display `"Space Grotesk", Inter, "Noto Sans Devanagari"`; sans `Inter, "Noto Sans Devanagari"`; mark `"Tiro Devanagari Hindi"`. |

**Gap:** no Devanagari weight above 700 and no real width axis. A kinetic Hindi headline wants 800/900. Candidates to vendor (need a download, so ask first; availability and licence UNVERIFIED): Noto Sans Devanagari variable (to 900), Anek Devanagari (variable weight and width), Mukta 800, Baloo 2 800. Add them with `vendor-fonts.mjs`. Geist is not a brand face; skip it.

**Brand palettes: there are three, do not mix them.**
1. Brochure / site / films (`mdg-demo/src/marketing/brand.ts`): navy 700 `#2C2E80`, navy 900 `#1A1B4B`, navy 950 `#101133`, gold 400 `#F5A524`, paper `#FCFCFE`, ink `#15163A`, "handled" green `#12A87B`, risk `#D2544B`. This is the reel's own frame.
2. The report cards: maroon / gold / cream (above). These live inside the card and are never recoloured.
3. The app: near-black `#18181b` on `#fafaf9` with the warm-grey chat. Inside the phone frame only.

## A7. Recommended reel pipeline: `marketing/reels/kit/`

Plain `.mjs`/`.js`, no dependencies of its own (Playwright resolves from the repo root). Source in git; media ignored.

```
marketing/reels/
  README.md  PLAN.md  TODO.md            index, the 15-video plan, running to-do (survive compaction)
  _research/                             this file and the other research notes
  kit/
    runtime/
      clock.js        BPM grid helpers: beat(n), bar(n), t -> {bar, beat, frac}; total duration
      ease.js         expoOut, expoInOut, quartInOut, cubicBezier(m3 emphasized), springCD(t,w)  (critically damped, no overshoot)
      motion.js       tween(t,t0,dur,ease,[a,b]), stagger, velocity(t) for per-element blur diagnostics, path/camera interpolators
      camera.js       one "world" element; cam(t) -> translate/scale/rotate; push(), whip(dir), hold-with-drift
    brand/
      tokens.css      the three palettes (A6) as CSS variables; type scale; the safe-zone constants
      fonts.css       absolute-path @font-face for the vendored files (+ new heavy Devanagari)
      logo/           mark + wordmark SVG/PNG
    components/
      phone.js        390x844 phone frame, status bar, notch; safeZoneGuide(debug)
      chat.js         WhatsApp-layout list/thread built from the real --wa tokens; bubble, tick, typing, image bubble
      card.js         embed a card HTML string in a Shadow root; card.part('hero'); explode(t); macroZoom(sel,t)
      counter.js      count-up, odometer / split-flap digits, en-IN grouping
      kinetic.js      Hindi-safe split (word / grapheme cluster, never code point), line masks with matra padding
      caption.js      muted-autoplay captions inside the safe box; word-timed reveal
      cta.js          end card: URL biggest, toll-free written (never spoken), Play wording
      reveal.js       mask / wipe / clip-path helpers, shape-to-shape morph via FLIP
    cards/
      build-cards.mts       (runs under tsx; pure) imports the real builders, writes cards/html/*.html from fixtures
      fixtures/*.json       invented figures only (the fact file's sets)
      shoot-cards.mjs       (plain node) inject fonts, hide outlet code, shoot PNG at 2x for references
    audio/
      voice.mjs       TTS per line, sha256 cache, previous_text/next_text, declick, measures seconds
      music.mjs       the v1 composition-plan call, sections as whole bars
      sfx.mjs         the sound-generation call + cache
      synth.js        OfflineAudioContext: tick, whoosh, hit, riser, soft pulse; renders WAV
      mix.mjs         VO + bed + SFX: adelay, sidechain duck, mid-EQ pocket, amix normalize=0, 2-pass loudnorm
    render/
      render.mjs      workers, subframes, shutter, CDP capture, pipe to ffmpeg, tmix+select, bt709 encode
      preview.html    scrubber + play for window.seek (the "Studio" replacement)
      beats.mjs       one still per beat + contact sheet
      qa.mjs          safe-zone overlay frames, loudness and true-peak check, size check, frame-0/poster, last-vs-first diff
      deliver.mjs     master 1080x1920 + WhatsApp 720x1280 + poster JPG; size gate 16 MB; runs marketing/backup.mjs
  videos/NN-slug/
    brief.md  prompt.md  STATE.md        facts used, the prompt, iteration log
    script.hi.json                       lines, spoken text, measured seconds, on-screen words
    scene.js                             exports {duration,bpm,seek(t),scenes}
    assets/  audio/  renders/            media: git-ignored, backed up to S3
```

**Per-video contract** (what each prompt should tell the builder): write `scene.js` only; import everything else from the kit; no CSS animation or timers; all positions from `t`; fonts and tokens from the kit; text inside the safe box; run `beats.mjs` and look; run `qa.mjs`; deliver.

**Keep / change vs the sample direction:**

| Sample says | For MDG |
|---|---|
| 1920x1080 | **1080x1920** vertical |
| 15 s, 120 BPM | **30 s.** 120 BPM = 60 beats = 15 bars of 2 s. 96 BPM = 12 bars of 2.5 s. 128 BPM = 16 bars = exactly 30.000 s |
| 60 fps x 3 subframes | **30 fps x 4 subframes** (half the cost; platforms re-encode anyway); 60 fps only for a hero move |
| `window.seek(t)`, no CSS animation, no timers | **Keep** |
| Web Audio OfflineAudioContext to WAV; kick every beat | **Keep the synth** (verified). A kick on every beat is wrong for the brand's "calm competence"; use a soft pulse, kick on the hits only |
| One typeface (Geist/Inter), 3 colours | Space Grotesk + Inter + Noto Sans Devanagari; brochure navy/gold + paper; real cards keep their own colours |
| Banned: glows, flares, shake, RGB split, bouncy easing, template look, crossfades | **Keep all**, and add the brand's own list in B3 |
| Holds longer than 0.5 s banned | Relax for Hindi lines: a message line may hold up to 1.2 s if it keeps a slow drift (B1) |
| Last frame matches first (loop) | Keep as a match cut, then an honest end card (B1) |
| Per-beat frames before the full render | **Keep** |

## A8. Remotion vs own HTML kit

| | Remotion (`mdg-demo`) | Own HTML + Playwright kit |
|---|---|---|
| Installed here | **No** (`npm ci` + Chrome download first) | Yes |
| Licence | See below | None |
| Preview | Studio with timeline | Build `preview.html` (small) |
| Springs, interpolate | built in | 50 lines in `ease.js` |
| Real card HTML | needs porting to React | drops in as DOM |
| Motion blur | needs extra work | subframe + tmix, already proven |
| Existing assets | the 26 trade-explainer `beats` engine, tutorial screens | `graphics-kavach` harness and kit CSS as shape to copy |
| Time-driven determinism | yes | yes |

**Remotion licence (official FAQ, fetched today, [remotion.dev](https://www.remotion.dev/docs/license-pricing-compliance/faq)):** free for individuals, **teams of up to 3**, non-profits and evaluation. **Headcount is the company's total, not just the people using it** ("a 20-person company where only one person uses Remotion still needs a Company License"). Paid: **Creators $25 per seat per month** for each person who writes Remotion code, **including with agentic coding tools**; **Automators $0.01 per render, $100 a month minimum** when code calls render APIs or the CLI; both together carry a combined $100 minimum; Enterprise from $500 a month (pricing page, 3P summary). An in-house marketing video is not addressed in the FAQ; Remotion says to write hi@remotion.dev.
For MDG: the company's headcount is not in any file I read (the films' "250+ people" is a founder-ruled film claim, not a payroll fact). `mdg-demo` already depends on Remotion, so the licence question exists today whatever we do for reels. **Founder decision, not mine.**

**Recommendation: build the own HTML kit.** No licence exposure, already installed, same family as the graphics harness, and it makes motion blur and card-as-DOM easy. Leave Remotion for the existing tutorial videos.

## A9. Traps, in one list

1. `tsx` + Playwright = silent failure. Plain node.
2. Card builders pull `@dk/shared` (built in `shared/dist`, present) and, through `cardRenderer.ts`, `config/env.ts` (parses the prod-pointing `.env`; no connection is made). Call only the pure HTML builders; never `render*Png`, which opens a browser through the backend's own launcher.
3. Cards print the outlet code. Hide it.
4. Cards need Noto Sans Devanagari injected or the Hindi looks different.
5. A relative `writeFileSync('x.html')` from a script run at the repo root lands in the repo root (it did on my first try; I moved it into the scratch folder immediately, `git status` was unchanged). Always write absolute paths into the reel folder.
6. Colour drift from untagged yuv420p (A3).
7. Disk 91% full: pipe frames, delete scratch, back up media to S3.
8. The brand's tracked-out Latin eyebrows must not be used on Devanagari (B5).
9. Hindi speech runs about 11 chars/s; digits slow it. Measure with ffprobe.
10. Voice files end on a click: apply the reversed `silenceremove` fix.
11. Low-bitrate AAC copies overshoot peaks; check them.
12. Public rules (fact file §9): no method, no admin screens, no oil-company marks, no real data, no unverifiable consequences. Cards must be invented-data builds only.
13. Two Hindi spellings and the pronunciations of trade words (A2) go in the script file, not the builder's memory.

## A10. Things only the founder can answer or approve

| # | Ask | Why |
|---|---|---|
| 1 | Company headcount, or an OK to skip Remotion (recommended) | Licence (A8) |
| 2 | OK to download 2 to 4 extra Devanagari display fonts into `marketing/pamphlet/fonts/` | Weights 800 and 900 |
| 3 | OK to spend a few credits on one 3 s `music_v2_5` probe, and one `speed` test line | Newer music model, faster speech |
| 4 | Keep the same Hindi voice for all 15, or a second voice for variety | Consistency vs. variety |
| 5 | Forward one test render to himself on WhatsApp (Android) and screenshot it, and one as a Status preview | No official WhatsApp safe-zone numbers exist (B2) |
| 6 | Which two or three videos run as music-only variants | Cheap A/B (B4) |

---

# HALF B. Craft playbook

Evidence is labelled. Where I found no source I say "judgement". Nothing found on cut cadence; that part is opinion.

## B1. A 30 s vertical feature ad that holds people

**What the sources support**
- Meta's own for-business posts: key message or branding **within the first 3 seconds** (the "3 second rule"); people who watch 3 s mostly stay (older post: **65% of those who watch the first 3 s watch at least 10 s**); **design for sound off**, better with sound on; captions raised view duration (older post: **+12%**); consider **15 s or less** (older post). Sources: [Meta, updated video ad features](https://www.facebook.com/business/news/updated-features-for-video-ads), [Meta, mobile video ads](https://www.facebook.com/business/news/want-to-better-video-ads-for-mobile-well-show-you-how), [Meta, add captions](https://www.facebook.com/business/help/1675722002698686). These are older posts, found through search summaries and not re-fetched.
- Meta's Reels page (self-reported): 9:16 video **with audio and the message inside the safe zone** got about **2x the delivery** on Reels; Reels play with sound on by default unless the viewer turned it off. [Meta, Reels ads](https://www.facebook.com/business/ads/facebook-instagram-reels-ads).
- Hook rate = 3-second plays / impressions. Vendor benchmarks conflict: "30% or more is strong on Meta" in one, "15 to 35% range" in another, "20% decent" in a Harvard appendix. Treat as vendor claims. A widely repeated "70% three-second retention" figure traces to a report I could not verify.
- YouTube Shorts has counted a view on every start or replay since 31 Mar 2025 (secondary sources: [Says](https://says.com/my/tech/youtube-shorts-new-metric), [RouteNote](https://routenote.com/blog/?p=103879)), so loops help there. For Reels I found nothing authoritative.

**Playbook (judgement unless marked)**
1. **Frame 0 is the poster.** It must already be a finished, readable picture with the hook words in place (the short did this: "frame 0 is the thumbnail and must carry the words"). No logo intro, no fade from black.
2. **0 to 1.5 s: one hook, in the dealer's own words,** over a thing he recognises (a DSR page, a deadline, a due amount). Hindi, 5 to 7 words, a number if there is one. Something moves on the first frame.
3. **Something changes every beat of the clock, a new idea every 2 to 3 s.** At 120 BPM that is every 4 to 6 beats. Pattern interrupts are camera moves, a scale jump to a number, a layout change, a card exploding apart. Not flashes, not shakes.
4. **Every spoken idea also appears as Hindi words on screen**, because many views start muted and the film is forwarded. Size and timing in B2 and B5.
5. **Default skeleton at 120 BPM (15 bars of 2 s), deviate freely:**

| Bars | Seconds | Job |
|---|---|---|
| 1 | 0 to 2 | Hook (poster frame) |
| 2 to 3 | 2 to 6 | The pain, in his words, one visual |
| 4 to 11 | 6 to 22 | Proof: the real card, three reveals, one macro-zoom to the key number |
| 12 to 13 | 22 to 26 | Payoff: the outcome line, the number lands, one stamp |
| 14 to 15 | 26 to 30 | End card (hold at least 2 s), then a match cut back toward frame 0 |

6. **One CTA only.** Existing films end on the website URL as the biggest line with the toll-free number **written, never spoken** (fact file §9). Do not stack three actions.
7. **Loop vs end card.** Reels/Shorts like a last frame that rhymes with the first; WhatsApp plays once and needs a real ending. Resolve it by making the end card share layout and colour with frame 0 and entering it by a match cut, so the loop is seamless and the card still reads as an end.
8. **Fast but calm.** `mdg-landing/PRODUCT.md` lists "pushy ad energy: countdowns, flashing, walls of exclamation marks" and "generic SaaS gloss: purple gradients, glassmorphism, hero-metric cards, neon on black" as anti-references, and "calm motion" as a principle. Speed comes from information per beat and confident ease-outs, never strobing.
9. **Never state what the oil company does on a missed deadline** (fact file §4, §9). The one allowed consequence is the quarterly mock drill.

## B2. Safe zones at 1080x1920

| Platform | Top | Bottom | Left / right | Source |
|---|---|---|---|---|
| **Instagram Reels** (ads spec) | at least **14%** = 269 px | **35%** = 672 px (content must end by y=1248) | **6%** = 65 px each | **Official**: [Meta Instagram Reels video ad specs](https://www.facebook.com/business/ads-guide/update/video/instagram-reels). Meta's help page "About text overlays and the safe zone" confirms the topic but I could not extract its body. |
| **YouTube Shorts** | **288 px** (15%) | **672 px** (35%) | 48 left, **192 right** | Google's transparent 1080x1920 template as reported by [AdKit](https://adkit.so/tools/safe-zones/youtube) (dated 10 Sep 2026; safe box x48-888, y288-1248). Other 3P guides give 120 to 288 top, 300 to 480 bottom, 48 to 140 right; the bottom grows with long titles; the subscribe button grew in late 2025 ([ClipSpeed](https://www.clipspeed.ai/blog/youtube-shorts-size.html), [Blitzcut](https://blitzcutai.com/blog/best-caption-size-youtube-shorts-2026)). |
| **WhatsApp Status** | about 250 px (sender, progress bar) | about 400 px (reply bar) | none given | **No official numbers.** 3P guides only. Official length limit: **90 s** ([WhatsApp: About status](https://faq.whatsapp.com/454876960047011); an older article says 30 s). A 30 s reel fits either. |
| **WhatsApp chat** (how dealers will mostly see it) | | | | UNVERIFIED. The bubble crop, the play button and the duration badge sit on the picture; test on the founder's phone. |
| Cross-platform "working margins" | 15% (288) | 25 to 35% (480 to 672) | 10 to 15% | [Reap](https://reap.video/blog/short-form-video-safe-zones), 3P, stated as "not official". |

One claim to ignore until checked: a guide says Meta merged Stories and Reels into one safe zone in March 2026 (single 3P source).

**Recommended constants for the kit**

| Zone | Box | Holds |
|---|---|---|
| **Hard-safe** (all three platforms) | **x 72 to 888, y 288 to 1248** (816 x 960; centre = 480, 768) | the one message, every number that matters, captions, the CTA text |
| **WhatsApp-comfort** | x 108 to 972, y 200 to 1500 | supporting text, small labels, tickers |
| **Full bleed** | 0 to 1080, 0 to 1920 | backgrounds, colour fields, decoration, nothing a viewer must read |

- **Centre hero objects at y = 768, not 960.** The visual middle of the safe box sits 192 px above the frame's middle.
- **Captions go in the upper part of the hard-safe box (about y 290 to 560), not the bottom third.** Every existing MDG film put captions at the bottom, which the bottom 35% covers on Reels and Shorts.
- **Text size** (judgement, from `PRODUCT.md`: body at least 17 px, controls 44 to 48 px, on a phone about 360 units wide, so 1080 px is 3x): minimum **54 px** for anything that must be read, **96 to 140 px** for the key line, numbers **160 px or more**.
- **Reading time** (judgement; the brand notes say many dealers read Devanagari slowly): at most **7 Hindi words** per screen; hold about **0.6 s + 0.25 s per word**, so a 5-word line holds about 1.85 s. Keep it alive during the hold with a slow 2 to 4% drift.
- Add a debug overlay that draws the three zones on every QA still.

## B3. Premium motion vocabulary, and what reads as a template

*(Technique list is craft judgement; the web results for this were portfolio pages, not authorities.)*

| Technique | How to build it time-driven in HTML | Use at MDG |
|---|---|---|
| **Macro zoom into a number** | one "world" element, `cam(t)` scales 1 to 3x with expo-out toward the figure; the card is DOM so it stays sharp; the figure counts up under the lens | Credit due amount, stock variation gap, compliance percentage |
| **UI deconstruction / exploded view** | split the card's sections (hero, tiles, bar, chips, footer); give each its own `translateZ` and offset under `perspective`; hairline callout lines; reassemble on the beat | Showing what one card holds, at 2 to 3 s per card |
| **2.5D parallax** | 3 to 4 depth layers; each scales 0.92 to 1.08 and drifts at a different rate; blur by depth only at the far layer | Phone over a soft navy field |
| **Isometric UI** | `rotateX(55deg) rotateZ(-45deg)` on a plane of cards; slide planes apart | One "stack of papers becomes one card" moment |
| **Match cut** | end of shot A and start of shot B share a shape and position (a bar's end cap becomes a ring, a stamp becomes a button) | Between problem and proof |
| **Morph** | FLIP (record A's box, set B, animate the delta) or an SVG path interpolation; border-radius and clip-path morphs are free | A paper sheet morphing into the chat bubble that carries it |
| **Mask / wipe reveal** | `clip-path: inset()` or per-line `overflow:hidden` mask with the text sliding up; colour-block stair wipes | Headline lines; before/after |
| **Data-viz build** | bar grows with expo-out and no overshoot; stroke-dashoffset line draw; a two-part allowance band that visibly splits (400 L + 50 L) | Stock variation band; utilisation bar going amber past 85% |
| **Split-flap / odometer counter** | each digit a column of 0 to 9 translated by `value(t)`; en-IN grouping | DUE AMOUNT, litres |
| **Camera language for screen content** | a virtual camera: push toward what is being named (1.0 to 1.3x, 0.5 to 0.9 s, expo-out), hold, cut on action; never zoom empty UI; exit direction = entry direction of the next shot; a quick whip with true blur for a hard cut | Everything with a card or a chat |
| **Chat choreography** | typing dots, a bubble springing in from the sender's side, double tick turning blue (blue ticks are the one place the app is blue), a photo bubble arriving | Anything "MDG sends you X" |
| **Typographic grid** | 6 columns inside the 816 px safe box, 8 px base unit, type scale 160 / 112 / 72 / 54, align Devanagari on the headline (shirorekha) rather than the Latin baseline, tabular figures for numbers | Everywhere |

**Easing and blur standards**
- Entrances: **expo-out** `1 - 2^(-10t)`, 350 to 600 ms. Exits faster, 200 to 300 ms. Camera moves 600 to 900 ms, quart in-out. UI moves can use the Material 3 emphasized curve `cubic-bezier(0.2, 0, 0, 1)` (value from memory of the M3 tokens; the page would not render to re-check).
- Springs only **critically damped** (settle with no overshoot). "Bouncy" is banned by the sample and by the brand's calm.
- **Blur follows speed through subframes (A4), not through CSS blur.** CSS `filter: blur` is isotropic and slow; directional blur from real sampling is exact and free once tmix is in.
- Do not stagger every list at the same 80 ms. Vary by importance.

**What reads as a template, and is out**
- Everything centred with equal gaps; the same ease on every element; fade plus scale 0.9 to 1 on every entrance.
- Gradient blobs, glows, glassmorphism, purple-to-blue gradients, neon on black, sparkles (all in the brand's anti-reference list or the sample's ban list).
- Emoji or stock icon packs; screenshots of UI shrunk too small to read.
- Letter-by-letter bouncing on every line; a whoosh on every cut; a preset wipe unrelated to the content.
- Ken Burns as the only camera move.
- Slide-deck bullet lists; a counter that always lands on a round number.
- Countdowns, "limited offer" flashes (brand ban).
- Corporate-uplifting stock music.

## B4. Audio direction

**Default: voice plus music, with every spoken idea also on screen.** Reasons, all judgement tied to MDG facts: dealers get the film on WhatsApp and tap to play (sound on); the brand's whole promise is "a person, not a menu", and the one Hindi voice is the brand's person; Reels/Shorts default to sound on per Meta, but muted views still need the words.

| Mode | Use when |
|---|---|
| Voice + music (default) | Any card or chat story. About 60 to 70% of runtime spoken, about 240 characters, bars of silence left for the numbers |
| Music-only with big captions | The 2 or 3 most visual videos, as a cheap A/B (the same scene file with a different mix). Weak at explaining anything with a reason |
| Voice only | Not recommended; the bed is what carries the beat grid |

**Tempo.** 120 BPM gives 0.5 s beats and 2 s bars; one Hindi phrase of about 22 characters fits a bar, about 44 characters (9 words) a two-bar phrase. 96 BPM is the calmer choice (2.5 s bars, 12 bars). Both land exactly on 30.000 s. The short used 85 BPM with tanpura and santoor; for "fast" go 108 to 120 with hand percussion and a plucked line.

**Bed brief.** Instrumental only; warm, premium, restrained (the proven words); Indian hand percussion and plucked strings over a soft pad; one riser into the payoff bar; a clean sting on the end card; no EDM drop, no vocals. Carve a pocket for the voice: bed at -14 dB before the sidechain, and about -4 dB at 2 to 3 kHz (`equalizer=f=2500:t=q:w=1:g=-4`). Plan each section as whole bars; the account respects section lengths to about 50 ms.

**SFX without cheese**
- At most one sound per event, never a wash. Hits only on the hook, the key reveal and the end card (three per video). A low sub-hit when a number lands; a soft tick under counters (-12 dB); a stamp on "done"; a paper thump on papers.
- A whoosh only on a camera move of 0.4 s or more, panned the way the camera goes.
- Silence is an effect: drop the bed 0.3 s before the key number (the short cut to total silence for the beat before its pivot).
- **Synthesise ticks, whooshes, pulses and risers in code** (sample-accurate, free, no licence question, verified working) and use ElevenLabs only for organic sounds (paper, stamp, a deep logo hit).

**ElevenLabs prompt practice** (docs fetched today: [Music best practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices), [composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans), [Sound effects](https://elevenlabs.io/docs/overview/capabilities/sound-effects), [TTS reference](https://elevenlabs.io/docs/api-reference/text-to-speech/convert))
- Music: name genre, mood, instruments, era; **give a BPM number and a key**; say "instrumental only"; describe the arrangement **in playing order** and mark silences explicitly (the word "just" stops it filling gaps); for loops state bars, BPM, key and what to exclude; use a composition plan for section control. Studio words (sidechained, plate reverb) change the mix; if unsure, describe the room. The docs have no advice on beds under narration.
- SFX: short concrete prompts ("Glass shattering on concrete"); sequences in order; terms like impact, whoosh, one-shot, braam, drone sharpen it; set `duration_seconds` yourself (0.1 to 30 s; costs credits per second); `prompt_influence` high = literal (we used 0.6); generate two or three takes and pick. The docs have no UI-sound guidance, so our proven prompts (A2) are the starting set.
- Speech: keep stability 0.45, similarity 0.8, style 0, speaker boost on; send `previous_text` / `next_text`; write numbers the way they are spoken or keep them off the voice; one test of `speed` 1.08 (UNVERIFIED) before post-speeding. For word-synced reveals, ElevenLabs offers a with-timestamps TTS endpoint that returns per-character timings (standard API, UNVERIFIED on this account, not tested); the past films judged timings from frames and `silencedetect` because Gemini's clock ran 0.5 to 1 s off.

## B5. Hindi / Devanagari kinetic type: do and do not

Sources: [Alphabettes, Devanagari typography 101](https://www.alphabettes.org/devanagari-typography-101-a-guide-for-typesetting-with-latin/), [W3C Indic letter-spacing thread](https://lists.w3.org/Archives/Public/public-i18n-indic/2013OctDec/0013.html), [IndiaFont tips](https://indiafont.com/blog/indian-typography-tips), plus the project's own findings.

**Do**
1. **Split by word, or by grapheme cluster (akshara), never by code point.** Verified in Chrome 155 with `new Intl.Segmenter('hi', {granularity:'grapheme'})`: स्टॉक gives `स्टॉ | क`; प्रीमियम gives `प्री | मि | य | म`; क्षत्रिय gives `क्ष | त्रि | य`; ज्ञान gives `ज्ञा | न`; दिक़्क़त gives `दि | क़्क़ | त`. Conjuncts and matras stay together. Use `granularity:'word'` for words (it also kept काग़ज़ी and ज़िम्मे whole).
2. **Prefer word-level and line-level motion.** A line reveal (each line in an `overflow:hidden` mask sliding up) is the safest and the most premium.
3. **Give line masks padding for matras** (top and bottom about 0.3 em); a tight mask clips the upper vowel signs.
4. **Line-height 1.35 to 1.5** for Devanagari; the Latin 1.1 clips.
5. **Weights 500 to 800**, headline 700 to 800. Thin or light Devanagari vanishes on a cheap screen in daylight.
6. **Align on the headline line (shirorekha) and the body mass**, not the Latin baseline. When Latin sits next to Devanagari (DSR, ₹, digits), set the Latin at about 0.9 of the Devanagari size and keep one family (Noto Sans Devanagari carries Latin).
7. **Latin digits for figures** (brand rule: "numbers in digits on screen"); `toLocaleString('en-IN')` gives 4,86,120; tabular figures; ₹ exists in Inter and Noto.
8. Trade words as the dealer reads them: DSR, DOD, Fire NOC in Latin on screen even when the voice spells them डी-एस-आर.
9. `text-wrap: balance` on 2-to-3-line headlines; never hyphenate Hindi.
10. **Load-check fonts:** a missing Devanagari face prints boxes silently (memory: the pamphlet builder refuses to run without them). In the render harness, measure a known Devanagari string's width against the fallback to fail the render if the face is missing.

**Do not**
1. **No letter-spacing / tracking on Devanagari.** It cuts the shirorekha and floats the matras. The project hit this: `0.22em` printed दिक़्क़त as four floating pieces. Tracked-out eyebrows are a Latin uppercase device.
2. **Do not transform individual aksharas independently** (translate, rotate, scale) unless the break in the headline line is the deliberate effect. The shirorekha is part of the glyph, not a separate line; a per-cluster offset visibly snaps the line.
3. **No `scaleX` or skew to fake condensed or extended** type. It distorts the headline weight. Use a font with a real width axis (Anek) or pick another face.
4. **No outline-only or hairline Devanagari;** no gradient-filled text on small sizes.
5. **No more than about 7 words per screen,** no all-caps trick (there is no case), no text smaller than 54 px.
6. Do not rotate Hindi text by more than a few degrees; do not set it on busy photos without a scrim.
7. Do not trust the voice's spelling for on-screen copy: the on-screen text is lifted from the vetted site strings (`mdg-landing/src/i18n/hi`, per the marketing README).

---

# Source list

**Repo (read):** `marketing/mdg-video-knowledge-pack.md` §5, §6, §9; `marketing/voice.mjs`; `marketing/films/short/finish.mjs`, `edit.mjs`, `plan.md`, `sound/`; `marketing/films/cut.mjs` (lines 399 to 612); `marketing/films/graphics-kavach/render.mjs`, `kit-base.css`; `marketing/README.md`; `marketing/backup.mjs`; `marketing/vendor-fonts.mjs`, `marketing/pamphlet/fonts*`; `mdg-demo/.env` (names only), `README.md`, `package.json`, `src/theme.ts`, `src/marketing/brand.ts`, `src/screens/*`; `mdg-client/src/index.css`, `package.json`; `mdg-backend/src/automation/cardRenderer.ts`, `automation/sdms/report/*`, `services/*/card*.ts`, `seed/demoReviewer.ts`, `scripts/preview-festival-card.ts`; `mdg-landing/PRODUCT.md`. **Memory:** `kavach-full-film`, `marketing-film-and-pamphlet`, `tsx-breaks-page-evaluate`, `local-stack-for-ui-checks`, `mdg-demo-tutorial-videos`. **Past-session transcript (4 Oct):** the inline music and SFX calls.

**Web:** Meta [Reels video ad specs](https://www.facebook.com/business/ads-guide/update/video/instagram-reels), [Reels ads](https://www.facebook.com/business/ads/facebook-instagram-reels-ads), [safe zone help](https://www.facebook.com/business/help/980593475366490/), [video ad features](https://www.facebook.com/business/news/updated-features-for-video-ads), [mobile video](https://www.facebook.com/business/news/want-to-better-video-ads-for-mobile-well-show-you-how), [captions](https://www.facebook.com/business/help/1675722002698686); [AdKit YouTube safe zones](https://adkit.so/tools/safe-zones/youtube); [Reap safe zones](https://reap.video/blog/short-form-video-safe-zones); [ClipSpeed](https://www.clipspeed.ai/blog/youtube-shorts-size.html); [Blitzcut](https://blitzcutai.com/blog/best-caption-size-youtube-shorts-2026); [WhatsApp About status](https://faq.whatsapp.com/454876960047011); [Remotion licence FAQ](https://www.remotion.dev/docs/license-pricing-compliance/faq); ElevenLabs docs ([music](https://elevenlabs.io/docs/overview/capabilities/music), [best practices](https://elevenlabs.io/docs/overview/capabilities/music/best-practices), [composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans), [sound effects](https://elevenlabs.io/docs/overview/capabilities/sound-effects), [TTS](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)); [Alphabettes](https://www.alphabettes.org/devanagari-typography-101-a-guide-for-typesetting-with-latin/); [W3C Indic list](https://lists.w3.org/Archives/Public/public-i18n-indic/2013OctDec/0013.html); [IndiaFont](https://indiafont.com/blog/indian-typography-tips); [Pro Video Coalition](https://www.provideocoalition.com/motion_blur/); [Wipster](https://www.wipster.io/blog/debunking-the-180-degree-shutter-rule); [Says](https://says.com/my/tech/youtube-shorts-new-metric); [RouteNote](https://routenote.com/blog/?p=103879).

## Not verified, in one place
- Whether `music_v2` / `music_v2_5` work on this account; their credit cost.
- The `speed` range and effect on this voice; a with-timestamps call on this account.
- A full-scene render time (my numbers are from a trivial page).
- Card-as-Shadow-DOM (designed, not built).
- Which fonts the production server has; the licence of the SFX files; the "-android" WhatsApp variant's purpose.
- WhatsApp's in-chat crop and any official Status safe-zone numbers; whether Meta merged its safe zones in 2026.
- Remotion's headcount fit for MDG.
- Availability and licence of the extra Devanagari display fonts.
- Any claim on cut cadence or pattern-interrupt frequency: no source found; those are opinion.
