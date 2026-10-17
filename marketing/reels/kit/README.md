# Reel kit — the shared code every reel uses

**Status: built by reel 01 (17 Oct 2026).** The "Built so far" table at the end
is the truth about what exists — the layout below was the plan, and a few
modules were merged (noted in the table). Extend the kit when a reel needs
something new; never fork it.

Plain JavaScript, no dependencies of its own. Playwright resolves from the
repo-root `node_modules` (1.60, no bundled browser — always
`chromium.launch({ channel: 'chrome' })`). ffmpeg 8.1 at `/opt/homebrew/bin`.
Node 20. **Playwright scripts run under plain `node`, never `tsx`** (tsx
rewrites the functions `page.evaluate` ships, and every evaluate throws).

## Loading model — classic scripts on `file://`

Chrome on `file://` can load `file://` fonts but cannot `import` ES modules or
`fetch` JSON; on `http://127.0.0.1` it can, but refuses `file://` fonts — and
the font failure is silent (Devanagari falls back to Kohinoor). So:

- **Classic `<script src>` only, no modules.** Kit files attach to `window.Kit`
  (`Kit.ease`, `Kit.camera`, `Kit.chat`, …). A reel's scene sets
  `window.SCENE = { bpm, duration: 30, seek(t) }`. Data ships as JS:
  `build/script.js` sets `window.SCRIPT = {…}`.
- The renderer opens `page.goto('file://…/NN-slug/build/index.html')`.
- `brand/fonts.css` uses absolute `file://` URLs into `marketing/pamphlet/fonts/`
  and is loaded **in the main document**. Prove each face before frame 0 by
  measuring a known Devanagari and Latin string against a fallback (never
  `document.fonts.check()` — it returns true for missing fonts).

## Build now (reel 01)

```
kit/
  runtime/   clock.js  ease.js  motion.js  camera.js
  brand/     tokens.css  fonts.css  logo/ (mark.svg from mdg-app/assets/icon-src.svg, app-icon tile, logo-full.png)
  components/
    phone.js      390×811 logical phone (the captures' size), black bezel, drawn at ~2.0–2.1×
    chat.js       thread, picture bubble (1–2 pictures + caption, no timestamp by default), black viewer
    card.js       mount a card in a Shadow root; card.part(sel); explode(t); hideCode(); strip(sels)
    counter.js    count-up with en-IN grouping, true minus, tabular figures
    kinetic.js    Hindi-safe line/word reveals with padded masks
    reveal.js     clip-path masks and FLIP morphs between two boxes
    endcard.js    DIRECTION §8 end card, layout skeleton shared with frame 0
    safezone.js   overlay of the three zones (QA stills only)
  cards/     build-cards.mts + fixtures/01-dsr.json
  audio/     voice.mjs  music.mjs  synth.js  mix.mjs   (reuse marketing/films/short/sound/*.mp3 for organic SFX)
  render/    render.mjs  beats.mjs  qa.mjs  deliver.mjs
```

**Later (only when a reel needs it):** `sfx.mjs`, `preview.html`, chat list and
ask bubble, odometer digits, SVG path morph, isometric helpers.

**Save points** — commit (sources only) or write a LOG line after each: kit +
cards render · storyboard v1 · audio beat map · stills pass both gates · render.

## The per-reel contract

`NN-slug/build/index.html` loads `kit/brand/*.css`, the kit scripts, then
`script.js` and `scene.js`. `scene.js` sets `window.SCENE` and holds nothing
stateful: every style is computed from `t` inside `seek(t)`. `build/audio/`
holds media (git-ignored). Nothing else lives in a reel folder.

## Recipes that are already proven (copy them, don't rediscover them)

### Real report cards with invented data — safely

The builders are pure functions returning self-contained HTML. Importing them
naively loads `mdg-backend/src/config/env.ts`, which reads the laptop `.env`
(**production**). So:

1. **A clean HEAD copy, never the working tree** (`mdg-backend`'s working tree
   carries an uncommitted DSR redesign; reels show the live HEAD design):
   `mkdir -p <reel>/build/.cards-src && git -C mdg-backend archive HEAD src | tar -x -C <reel>/build/.cards-src/`
2. Run the builder script with **dummy env**, so the prod `.env` is never read:
   `env -i PATH="$PATH" HOME="$HOME" MONGODB_URI='mongodb://127.0.0.1:1/none' JWT_SECRET='local-render-only-xxxxxxxx' NODE_ENV=test LOG_LEVEL=silent <repo>/node_modules/.bin/tsx kit/cards/build-cards.mts`
   with a `node_modules` symlink to the repo root's beside the copy, so
   `@dk/shared` resolves (it reads `shared/dist`; the card is as current as that
   build). If the copy's `import { renderCardPngs } from '../../automation/cardRenderer.js'`
   gets in the way, delete that one line in the copy (as
   `mdg-app/store-assets/capture/render-cards.mts` describes). Call only the
   `build*Html` / `*CardHtml` functions — never `render*Png`.
   **Write to absolute paths** (a relative write once dropped files into `mdg-backend/`).
3. **Mounting in a Shadow root:** `@font-face` inside a shadow root is ignored —
   fonts come from the main document. The card's `html, body { … }` rules do
   not match inside a shadow root: rewrite them to `:host` when mounting, or the
   card loses its font stack and background.
4. **Hide, never rewrite.** The outlet code prints twice (header `.code`, footer
   `.foot-r` on the DSR cards; check each builder) — hide both with
   `display:none`. Clock times: `shiftTime: ''` in the DSR digest drops both.
   Method-leak strings are hidden by element, never edited into new text.
5. After rendering, assert on the card's text: the figures you expect are there;
   no code, no `portal`/`पोर्टल`, no `IRAS`, no clock time (each reel's prompt
   adds its own list).
6. Builders: DSR `services/dsr-report/cards.ts` → `buildSalesCardHtml(digest)`,
   `buildVariationCardHtml(digest)` (write a bespoke digest — CATALOG § 01 lists
   the fields; `mdg-app/store-assets/capture/demo/digest.mjs` shows the shape) ·
   credit `automation/sdms/report/creditCard.ts` `buildCreditCard()` +
   `renderCard.ts` `cardHtml()` · ledger `services/ledgerWatch/card.ts` · load
   plan `services/loadPlanner/card.ts` · water `services/waterIngress/card.ts` ·
   supply `services/roSupplyStatus/card.ts` · Kavach `services/kavach/card.ts`.
   Density has no card (chat messages only).

Reference images drawn this way (fictional outlet, live design):
`mdg-app/store-assets/capture/demo/dsr-2026-10-1{4,5}-{sales,variation}.png`.
Real app screens with invented data: `mdg-app/store-assets/captures/01–04*.png`.
**Never** use `marketing/refs/product/real-*.png` (real outlet, real figures),
`marketing/panels/p-*.png` (stale mock-ups) or `capture/demo/licence-photo.jpg`
as is (it prints an outlet code).

### ElevenLabs (key and ids in `mdg-demo/.env`; never print them)

```
TTS   POST https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128
      { text, model_id: "eleven_multilingual_v2", previous_text, next_text,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true } }
Music POST https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192
      { model_id: "music_v1", composition_plan: {
          positive_global_styles: [...], negative_global_styles: [...],
          sections: [{ section_name, duration_ms, lines: [], positive_local_styles: [...], negative_local_styles: [...] }] } }
SFX   POST https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192
      { text, duration_seconds, prompt_influence: 0.6 }
```

Account: ~26.7 M credits left (resets Jan 2027) — not a constraint. Organic SFX
ready to reuse: `marketing/films/short/sound/{subhit,whoosh,thump,brandhit,tick,stamp,pop,sting}.mp3`.
Measured Hindi pace ≈ 11 chars/s. Voice end-click fix, per file:
`aresample=44100,areverse,silenceremove=start_periods=1:start_duration=0.08:start_threshold=-55dB:start_silence=0.05,areverse,afade=t=in:d=0.01,apad=whole_len=<n>,atrim=end_sample=<n>`.
Effect placement that worked (`films/short/finish.mjs`): 5 ms fade-in, 80 ms
fade-out per effect, `adelay`, `amix=normalize=0`; gains: sub-hit −4, whoosh
−10, thump −8, brand hit −10, tick −12, stamp −6, pop −10, sting −3 dB.

### Render

- Capture: `page.evaluate(t => window.SCENE.seek(t))`, then CDP
  `Page.captureScreenshot` JPEG q92–94 with `optimizeForSpeed` (~17 ms on a
  blank page; time a heavy frame of your own). Viewport 1080×1920,
  deviceScaleFactor 1. Fonts proven and one warm-up seek before frame 0. Three
  Chrome workers on contiguous chunks; frames piped to ffmpeg — no JPEG folders
  (disk ~91% full).
- Motion blur: S sub-times per output frame across a 180° shutter, then
  `tmix=frames=S` and `select` the complete window. Final: 60 fps × 3 if the
  heaviest frame is under ~150 ms, else 30 fps × 4. Drafts: 30 fps, S = 1.
- Encode: `-vf "...,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -preset slow -crf 17 -movflags +faststart`.
  WhatsApp copy: 720×1280, 30 fps made with `tmix` (not frame-dropping), < 16 MB.
- Loudness: two-pass `loudnorm=I=-16:TP=-2:LRA=11` (`print_format=json`, then
  `measured_*`, `linear=true`); AAC overshoots ~1.5 dB, a low-bitrate copy ~3.5 dB
  — check each file's peak.
- `beats.mjs`: one still per beat at beat + 0.40 s (settled), plus beat + 0.05 s
  on the three hit beats; safe-zone overlay on; four sheets of fifteen (5×3,
  ~400×710 per tile) plus the deliverable 60-up sheet.

## Built so far

| Module | Built in | Notes |
|---|---|---|
| `runtime/ease.js` | 01 | expo/quart/cubic/sine, Material emphasized, critically damped `spring(sec, ω)`, `bezier()` |
| `runtime/motion.js` | 01 | `M.p/e/tw/sp/env/kf/in` and `Kit.clock(bpm, bars)` (the planned `clock.js` lives here) |
| `runtime/camera.js` | 01 | `Kit.cam` (world point → anchor at scale), `Kit.tf`, `Kit.show` (opacity + visibility) |
| `brand/tokens.css` | 01 | DIRECTION §5 palette, type families, safe-zone vars, mask classes `.kword` / `.kline` |
| `brand/fonts.css` + `make-fonts.sh` | 01 | relative URLs into `marketing/pamphlet/fonts/` (Inter + Noto Sans Devanagari 400–800, Space Grotesk, Tiro) |
| `brand/logo/` | 01 (v2) | `mark-path.js` — the app's own mark path, generated from `mdg-client/src/components/BrandMark.tsx` by `make-mark.sh` (re-run it if the app's mark changes); `logo-full.png` (black). The v1 hand-made `mark-src.svg` is gone — it was the wrong logo |
| `components/type.js` | 01 | `Kit.fmt.inr/signed`, `Kit.count`, `Kit.kin.line/play` — merges the planned `counter.js` + `kinetic.js`; parked words are hidden (they peek through the mask padding otherwise); a `\n` in a line's text forces a phrase-true break; `play(…, { origin: '50% 100%' })` makes a centred line's held drift grow from its centre (the default left origin walks it toward x 888) |
| `components/card.js` | 01, 02 | `Kit.card.mount` (shadow root, html/body → :host, animations off, hide list), `rect()`, `textRect(sel, substring)` (02: a Range over one run, to lift `(400 L)` out of a line), `DSR_HIDE`, `assertClean()`; `FORBIDDEN` gained `ठीक करें`, `decant`, `X0X`, `CURRENT DATE AND TIME` (02) |
| `components/viewer.js` | 02 (lifted from 01) | `Kit.view`: `apply` / `toScreen` / `keys` (a camera over a card in card pixels), `frameRect`, `flipClip` (the FLIP from a bubble tile into a window), `tap`, `unfold`; `Kit.flip` — a two-faced card for a mirror flip (own perspective, preserve-3d, backface hidden, back face pre-rotated; measure the back face flat, or its x comes back mirrored) |
| `components/chat.js` | 01 | phone (414×860 object, 390-wide screen), thread bar, doodle wallpaper, date chip, two-picture album bubble, composer; no timestamps |
| `components/brand.js` | 01 (v2) | `Kit.mark` (the real filled path, revealed by a sweep round the ring; small sizes grow their ink as the app does), `Kit.endcard` (DIRECTION §8: one centred stack, every line ≤ 696 px — the number is 86 px so it stays inside x 888), `Kit.fontsReady` (width-measured proof) — merges the planned `endcard.js` |
| `components/safezone.js` | 01 | overlay with `?safe=1` |
| `cards/build-cards.mts` + `fixtures/01-dsr.mjs` | 01 | builders: `dsr-sales`, `dsr-variation`; add others to `BUILDERS` as reels need them |
| `cards/fixtures/02-stock-check.mjs` | 02 (prompt) | verified with the live builder at HEAD `a56f323`: `var-short` (−430 within 400 + 50), `var-excess` (+430, +30 beyond 400), `sales` (bubble thumbnail) — CATALOG § 02 › Digest |
| `audio/lib.mjs, voice.mjs, music.mjs, sfx.mjs, synth.mjs, mix.mjs` | 01 | voice measures speech onset/end and word times (sound director's fix); synth makes tick, tickhi, whoosh, riser, woodblock |
| `render/common.mjs, render.mjs, beats.mjs, deliver.mjs, still.mjs` | 01 | `deliver.mjs` also does the QA measuring (the planned `qa.mjs`); `still.mjs` is the quick-look tool (instead of `preview.html`) |
| `render/still.mjs`, `render/deliver.mjs` fixes | 02 | `still.mjs` no longer reads an option's value (`--scale 0.4`) as a time; `deliver.mjs` fails a file with no audio stream (a silent render used to pass) |
| `render/motion.mjs` | 02 | the two rules eyes miss: the longest still run before the end card (frame diffs every 0.1 s) and the most Hindi words of the reel's own type at once (`.rt` + `SCENE.wordSel`); fails at ≥ 0.5 s or > 7 words |
| `render/safe.mjs` | 01 (v2) | the safe-box test by measurement: every visible `.rt` / `.ec-c` text box plus the scene's `SCENE.safeSel`, every 0.1 s, against x 72–888 / y 288–1248; fails on anything out for ≥ 0.5 s |
| `reveal.js`, `phone.js`, `preview.html`, `qa.mjs` | — | not built: reveal/FLIP math lives inline in reel 01's scene; lift it into the kit when a second reel needs it |
