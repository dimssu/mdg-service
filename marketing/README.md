# Marketing collateral

What a dealer sees before he is a customer: films he is sent on WhatsApp, and a
**two-sided A4 sheet** a marketing person leaves on his desk. The films and the
sheet carry the same argument in the same order, so a dealer who watched one
recognises the other.

**The sources are in git; the media is in S3.** Scripts, script and shot JSON,
prompts, page sources and notes are tracked in the main repo (since 15 Oct
2026). Media — films, clips, stills, voice takes, PDFs — is ignored by
`.gitignore` here and backed up to the private prefix
`s3://mdg-chat/marketing-backup/` by `node marketing/backup.mjs` (`--pull`
restores it on a new machine). Run the backup after any new render; a Veo or
Flow clip does not come back identical from the same prompt. Only `.work/`
(render scratch) is left out. The full film and the short are also on S3
(bucket `mdg-films`), packaged for the website.

## Current deliverables

These are the finished masters. Anything else with a similar name is an older cut.

| What | Length | Current file | Made by |
|---|---|---|---|
| Pamphlet, Hindi and English | 2 sides | `out/dealer-kavach-pamphlet-hindi.pdf`, `-english.pdf` | `pamphlet/`, `build-pdf.mjs` |
| Marketing film, Hindi / English | 1:41 / 1:35 | `mdg-demo/out/marketing-hi.mp4`, `marketing-en.mp4` (rendered 7 Sep) | `mdg-demo`, compositions `MarketingHi` / `MarketingEn` |
| Problem → solution film, shot with Veo (Hindi) | 2:26 | `mdg-film-branded.mp4`; smaller copies `-hq` and `-whatsapp` (720×1280, 13.9 MB) | `build.mjs`, then `brandpass.mjs` |
| Teaser (Hindi) | 1:04 | `films/mdg-teaser.mp4`, `-whatsapp` | `films/cut.mjs teaser` |
| Explainer (Hindi) | 2:43 | `films/mdg-explainer.mp4`, `-whatsapp` | `films/cut.mjs explainer` |
| **Full Kavach film, v2** (Hindi) | 26:29 | `films/mdg-kavach-v2.mp4`. Phone copy `mdg-kavach-v2-whatsapp.mp4` (480×854, 15.9 MB). Faster 1.2x versions beside them (22:05). **Live at mdgservices.in/film.** | `films/cut.mjs kavach` |
| **Short** (Hindi) | 38.6 s | `films/mdg-kavach-short.mp4`. Phone copies `-whatsapp` and `-whatsapp-android`. **Live at mdgservices.in/film/short.** | `films/short/`, `films/cut.mjs kavach-short` |

Older cuts, not to be sent: `mdg-film.mp4` and `mdg-film-whatsapp.mp4` (the
Veo film before the brand pass, 2:18); `films/mdg-kavach.mp4` and its
`-whatsapp`, `-preview` and `-1.2x` files (v1, 19:57); `films/mdg-kavach-draft.mp4`
(byte for byte the same file as v2); `films/mdg-kavach-short-draft.mp4`.

## The one rule

**Say what the dealer receives. Never say how it is produced.**

No portals signed into, no credentials, no data collection, no schedules, no
"AI". Not because any of it is secret from him, but because method on a
marketing surface helps a competitor and helps no customer. The website follows
the same rule (its words are in `mdg-landing/src/i18n`). If a line ever needs to
explain *how*, the line is wrong.

### Trade words in, our words out

The dealer is a man of forty-plus who has run his pump for twenty years and
knows the trade completely. He has little to do with technology and mild
suspicion toward it. He is not stupid; he is busy, and he has been sold to
before. Two lists follow from that.

- **Trade words are in:** DSR, डिप, स्टॉक, डेंसिटी, मीटर रीडिंग, टैंकर, शिफ़्ट,
  Fire NOC, Weights & Measures, क्रेडिट, नोटिस, इंडियन ऑयल, फ़ाइल, रिकॉर्ड. They cost
  nothing and they tell him we know his work.
- **Our words are out:** app, dashboard, portal, cloud, software, system, data,
  platform, automatic, AI, digital, online, integration, sync, real-time. None
  appears in the spoken lines. WhatsApp is the one exception, because to him it
  is not a technology; it is where his family is.

He is not buying software. He is buying a job that leaves his hands and does not
come back. The idea the problem → solution film was built to reach is the word
**कोई भी**, anyone: his manager can do the job without him.

This is the rule the 8 Sep brief set for the problem → solution film. The
marketing film's spoken lines keep it. Nothing else keeps it completely: the Veo
film says "ऐप" once (the line "ऐप आपके फ़ोन पर हम ही लगा देंगे"), the pamphlet says
"app" and "portal", and the Kavach films, scripted from the founder's own drafts,
say सिस्टम, डेटा, डिजिटल and ऑनलाइन.

### Approved figures

Every figure is one we can produce on request. For the **pamphlet and the
marketing film**:

| Figure | Meaning | Where |
|---|---|---|
| 536 / 557 | reconstructed figures checked against dealers' own books | pamphlet only — the founder cut this beat from the film |
| 45 | compliance items on the clock, per outlet | both |
| 22 | deadline windows tracked | both |
| ~11 hrs | what the work costs a dealer doing it himself, per week | both |
| 9 · 7 · 9–9 | services · days to go live · support hours | both |

Nothing else is claimed there: no outlet count, no state count, no phone number.
The "1,400+ pumps / 14 states" chips on the website's hero appear on no other
surface and nothing corroborates them.

The **Kavach films** (teaser, explainer, full film, short) also say:

- ₹3,000 a month plus GST for the standard service. The full film adds "18%" and
  "one charge across India"; the short says only "GST".
- "250+ people", "about 1,700 dealers" and "since 2021", on the founder's ruling
  of 20 Sep, read as the company's numbers and not the app's database (the teaser
  and explainer add "eight languages")
- the toll-free 1800-891-3496 on the full film's end card, written and never spoken

`mdg-video-knowledge-pack.md` has the full list of what may and may not be
claimed, with the evidence for each.

## Rebuilding the pamphlet

```bash
node marketing/vendor-fonts.mjs     # once; downloads the brand webfonts
node marketing/build-pdf.mjs        # both languages → marketing/out/
node marketing/build-pdf.mjs hi     # just one
```

Fonts are **vendored**, not pulled from a CDN at build time. A PDF whose fonts
came off the network renders differently the day the machine is offline, and the
failure is silent: missing Devanagari does not error, it prints empty boxes, and
nobody notices until a dealer is holding the sheet. `build-pdf.mjs` refuses to
run if the Devanagari files are absent.

Printing notes:

- `@page` margin is 0 and the navy bands bleed to the edge. A print shop handles
  this; an office printer shrinks it slightly to fit, which is fine because
  nothing sits within 12mm of an edge.
- The colour **is** the design, so print with "background graphics" on.
- The Hindi sheet is not a translation of the English one. Most of its wording is
  lifted verbatim from `mdg-landing/src/i18n/hi`, which is the vetted voice for
  this audience.

## Rebuilding the marketing film

The Remotion film, in `mdg-demo`:

```bash
cd mdg-demo
npm run dev                                  # Remotion Studio
npm run broll                                # generates any missing photograph
npm run voice                                # records only clips that are missing
npm run stills -- MarketingHi                # one still per scene, one bundle
npx remotion render src/index.ts MarketingHi out/marketing-hi.mp4 --crf=28
npx remotion render src/index.ts MarketingEn out/marketing-en.mp4 --crf=28
```

**`--crf=28` is not optional.** Remotion defaults to 18, which was fine while the
film was flat navy and white cards — it came out at 10 MB. With a photograph
under every scene the same setting produces **55 MB**, and WhatsApp will not send
a video over 16 MB. At 28 the file was about 12.5 MB and, checked frame against
frame at phone size, indistinguishable from 18. Film grain is what costs the
bitrate here, and grain is exactly what nobody sees on a phone. The 7 Sep masters
in `mdg-demo/out` are 16.3 MB (Hindi) and 16.9 MB (English), so check the size
against WhatsApp's limit before sending one.

### The B-roll

Every scene has a generated photograph behind it, pushing slowly and dissolving
into the next. Without them the film was fifteen white cards on a flat navy
field — legible, correct, and dead still, with a third of every frame empty.

`npm run broll` renders the prompts in `src/marketing/broll.ts` through **Vertex
AI (`gemini-2.5-flash-image`)** into `public/broll/`, skipping anything that
already exists. It authenticates with the same service-account key the landing
assistant uses (`~/mdg-assist-key.json`, `roles/aiplatform.user`), so it draws on
the Google Cloud credit rather than an AI-Studio key, which would not.

```bash
npm run broll                                    # fill in what is missing
npm run broll -- --force --only pump-night       # re-roll one shot
```

**Imagen is 404 on this project; Veo 3.1 works.** Veo 3.1 (`generate`, `fast` and
`lite`) answers on Vertex (probed 14 Sep 2026, wrapped in `veo.mjs`), and it made
the problem → solution film. The Kavach films' live-action footage came from
Google Flow, which animates a still with Veo 3.1. This film's own motion is still
camera moves over stills, which is what B-roll under a caption wants anyway.

**Expect 429s.** The project runs on default per-minute Vertex quotas and a run
of fourteen images will trip them; the script backs off 20/40/60s and retries,
which is enough. A quota increase is free to request and would remove the wait.

Four rules every prompt keeps, and they are not stylistic:

- **No readable text, logos or brand marks.** A legible OMC mark would be
  someone else's trademark on our advertising, and a legible outlet code would
  be a real dealer's.
- **No recognisable faces** — silhouettes, backs, hands only.
- **Deep blue and warm amber grade**, so a photograph can sit under a gold card
  without the frame falling apart.
- **Documentary, not advertising.** Wet concrete and worn edges read as a real
  pump to this audience; glossy stock photography reads as a lie.

The script is `mdg-demo/src/marketing/script.ts` — one bilingual scene list that
is **both** the spoken narration and the on-screen caption, because a forwarded
video is watched with the sound off at least as often as with it on. Editing a
line there and re-running `npm run voice` re-records only that scene, so a copy
fix costs one clip.

Both cuts render the same visuals; only the words change. Their runtimes differ
by a few seconds because each composition sizes itself to its own voiceover, and
a sentence is not the same length in two languages.

`npm run stills` bundles once and renders every scene, which is the difference
between iterating on the artwork and not bothering — `npx remotion still`
re-bundles on every call.

## The newer films

The problem → solution film, the teaser, the explainer, the full film and the
short are not Remotion. They are cut with ffmpeg from generated footage.

- **Voice first, pictures cut to it.** `voice.mjs` records each script line
  (`node voice.mjs --film teaser` reads `films/teaser.json` and writes
  `voice-teaser/`; with no flag it records the original film from `script.json`).
  Every picture is cut to the measured length of its line.
- **An edit file decides which shot covers which line:** `films/<slug>.edit.json`.
  `node films/cut.mjs <slug>` assembles it; `DRAFT=1` fills anything not made yet
  with grey cards. The full film's edit file is built by `films/kavach-edit.mjs`
  from `kavach.plan.json` and the approved windows. The short has its own
  `films/short/edit.mjs`, then `films/short/finish.mjs` adds the on-screen words,
  the music bed and the sound effects, and sets loudness to −16 LUFS.
- **Footage.** `films/flow-kavach/` holds the Flow prompts, clips, `cast.json` (one
  fixed face per recurring person) and `windows.json` (the clean seconds of each
  clip that may be used). `clips-clean/` has Flow's corner mark painted out, and
  `cut.mjs` prefers it. Final takes can go through Vertex Veo instead, with
  `films/short/vertex-animate.mjs`.
- **Cards** are HTML panels in `films/graphics-kavach/`, drawn to frames by
  `render.mjs`.
- **Check a film twice.** `films/listen.mjs` (voice) and `films/clipcheck.mjs`
  (clips) have Gemini watch for faults, and it both over-flags and passes real
  ones: on the short, a frame-by-frame reviewer found four blockers that Gemini
  called ready.
- **Timed script and shot catalogue.** `films/short/context/script-timed.md` is the
  full film v2 line by line with its start time and the picture under each line.
  `films/short/context/assets.md` lists every live-action shot with its prompt and
  the seconds that are safe to use. Any retake or new cut needs both. The short's
  own design record is `films/short/plan.md`.
- **Publishing to the website.** `node films/web/package.mjs kavach` (or
  `kavach-short`) builds the streaming versions, Hindi captions, chapters and
  poster, and uploads them to the `mdg-films` bucket under a hashed folder. Then
  paste the `film.json` it writes (in `.work/web/<film>/<version>/`) into
  `mdg-landing/src/film/films.json` and deploy the landing. The steps are in
  `mdg-landing/README.md`.

## Where things live

```
marketing/
  README.md, mdg-video-knowledge-pack.md   this guide; the fact file for writers
  vendor-fonts.mjs        downloads + rewrites pamphlet/fonts.css
  build-pdf.mjs           headless Chrome → A4 PDFs
  pamphlet/
    style.css             the whole print design system
    pamphlet.hi.html      side 1 argues, side 2 answers
    pamphlet.en.html
    fonts/ fonts.css      vendored, generated
    assets/               brand logomarks
  out/                    the PDFs

  script.json             the problem → solution film: 25 beats
  voice.mjs               records the Hindi voice for any film (voice/, voice-<film>/)
  shoot.mjs               draws one shot's still (shots/, refs/)
  animate.mjs, veo.mjs    animates a still with Veo 3.1 on Vertex (clips/)
  build.mjs               cuts picture and voice together
  brandpass.mjs           lays the phone cards, logo and outro (panels/) → mdg-film-branded.mp4

  films/
    <slug>.json           the script of a film (teaser, explainer, kavach, kavach-short)
    <slug>.edit.json      which shot covers which line
    cut.mjs               assembles a film from its edit file
    kavach-edit.mjs       builds the full film's edit file
    flow-kavach/          Flow footage, cast faces, approved windows, clean-up scripts
    graphics-kavach/      the full film's cards
    short/                the short: plan.md, cut-sheet, overlays, sound, context/
    web/package.mjs       packages a film for mdgservices.in and uploads it
    mdg-*.mp4             the finished films (see Current deliverables)
  .work/                  scratch: cut segments, and the website packages

mdg-demo/src/marketing/
  script.ts               THE COPY — both languages, both cuts
  broll.ts                the photograph prompts, one per beat
  film.ts                 scene model + the projection to a `Tutorial`
  brand.ts                navy/gold tokens, mirrored from mdg-landing
  chrome.tsx              the frame every scene is drawn inside
  kit.tsx                 cards, chips, counters, ticks
  dsr.tsx                 the register, drawn twice — the film's centrepiece
  stages.tsx              one drawing per beat, keyed by scene `step`
```
