# MDG Demo — voice-guided videos

Animated, voice-narrated videos for fuel-pump dealers and the MDG team, built with
[Remotion](https://www.remotion.dev) (programmatic video in React) and an
**ElevenLabs** voiceover. The app videos are faithful mock-ups of the real screens
with a tapping-hand cursor and on-screen captions. The narration is Hindi; the
public videos also come in English.

There are **66 videos**, in three groups. They are published for dealers at
**guide.mdgservices.in** (see `site/README.md`).

## What's included

**Dealer app course: 8 videos.** Portrait 1080×1920, Hindi, each hand-written.

| Video                   | Composition           | Teaches                                                              |
| ----------------------- | --------------------- | -------------------------------------------------------------------- |
| `login`                 | `Login`               | Opening the app and signing in with email + password                 |
| `add-warrior`           | `AddWarrior`          | Adding a new योद्धा (staff member)                                   |
| `give-points`           | `GivePoints`          | Giving points to one योद्धा for a task                               |
| `split-points`          | `SplitPoints`         | Splitting one task's points equally among several people             |
| `submit-points`         | `SubmitPoints`        | Final-submitting the day's points with a hardcopy photo              |
| `points-system`         | `PointsSystem`        | How each work's points are derived (concept explainer)               |
| `credit-monitor`        | `CreditMonitor`       | Reading the daily CREDIT & DOD MONITORING card                       |
| `stock-variation-sheet` | `StockVariationSheet` | Reading the old hand-typed STOCK VARIATION sheet (concept explainer) |

**MDG team videos: 4.** Landscape 1920×1080 (they record a desktop portal), Hindi
narration, English on-screen portal text. Not for dealers.

| Video                     | Composition            | Teaches                                                                         |
| ------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| `admin-credit-dod`        | `AdminCreditDod`       | What the Credit & DOD service does (concept)                                    |
| `admin-credit-dod-portal` | `AdminCreditDodPortal` | Running it in the admin portal: generate, check, send to the dealer             |
| `admin-dsr-receipts`      | `AdminDsrReceipts`     | Typing a receipt in by hand and regenerating a stale DSR                        |
| `admin-manual-shift-data` | `AdminManualShiftData` | Typing a shift in by hand for an outlet with no portal, then generating its DSR |

**Public videos: 54.** Portrait 1080×1920, made to be forwarded to anyone. Each is
made in Hindi and in English.

- `marketing-hi` and `marketing-en`: the dealer-acquisition film, about 1:41 in
  Hindi and 1:35 in English. Its script, photographs and drawings are in
  `src/marketing/`; how to build and ship it, and the other films, are in
  `../marketing/README.md`.
- 26 trade explainers, each rendered twice (`gen-<name>-hi`, `gen-<name>-en`), 36 to
  60 seconds long. They teach the trade, not the app (the three-day
  deposit clock, what a stock variation is made of, why a dip taken right after a
  decant lies), and never show an MDG screen. The list is `src/beats/catalog.ts`.

Retired: `credit-monitor-photo` (composition `CreditMonitorPhoto`). It marks up two
photos of the old seven-row credit card, and the shared narration now describes the
new card, so it is not rendered and not published. Its composition is still
registered in `Root.tsx`, so the Studio opens it; `public/credit-card/README.md`
says how to bring it back.

`admin-manual-shift-data` exists for outlets onboarded without an IndianOil
account (16E is the case), where nothing arrives on its own and the day has to be
typed into the Data Vault before a report can be generated. Its mocked screens live
in `src/screens/admin/ManualDay.tsx` and use 16E's real layout (diesel in tank 3 on
nozzles 2/4/5, petrol in tank 1 on 1/3/6), so the figures on screen are the ones an
admin would actually be copying.

`stock-variation-sheet` teaches a document rather than a screen: it rings each row
on a photo of the real sheet (`public/stock-variation/sheet.jpg`, dealer code
masked) and re-typesets that row large enough to read on a phone. The row
positions and the figures printed on the sheet both live in `src/lib/stockSheet.ts`
— replacing the photo means re-measuring both, see that folder's README.

## Quick start

```bash
cd mdg-demo
npm install

# 1) Add your ElevenLabs key
cp .env.example .env
#    then edit .env → ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (a Hindi/Indian voice)

# 2) Generate the voiceover (writes public/audio/**/*.mp3)
npm run voice

# 3) Preview in the Remotion studio (live, scrub, edit)
npm run dev

# 4) Render to ./out
npm run render                           # all 66 videos: most of an hour
npm run render:declared                  # only the 52 trade-explainer cuts
npm run render:declared -- --only gen-dod-clock    # one explainer, both languages
npx remotion render src/index.ts Login out/login.mp4   # one hand-written video
npm run stills -- MarketingHi            # one still per scene (bundles once)
```

You can preview and render **before** adding the key: the videos fall back to
estimated timings and show the captions silently. Add the voice later and the
timing snaps to the real audio.

`npm run render` uses Remotion's default quality. The marketing film needs
`--crf=28` to stay small enough for WhatsApp; the command is in
`../marketing/README.md`.

## The ElevenLabs voice

`.env` controls the voice:

```
ELEVENLABS_API_KEY=...          # Profile → API Keys
ELEVENLABS_VOICE_ID=...         # pick a natural HINDI / Indian voice from your Voice Library
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
ELEVENLABS_VOICE_ID_EN=...      # optional: the English cuts' voice
```

- `ELEVENLABS_VOICE_ID_EN` is read by the English cuts only. Unset, they are
  recorded in the Hindi voice.
- `npm run voice` records a clip that is missing **or whose text changed**: each
  tutorial keeps a `manifest.json` of the hash of the exact string sent. Editing a
  scene's text and re-running is enough. To re-record everything (a new voice, say):
  `npm run voice -- --force`.
- Audio is git-ignored (`public/audio/**`). It can be regenerated, but that costs
  money, so it is backed up (see Backup).

## Two ways to write a video

**Hand-written** (the 8 dealer videos, the 4 team videos, the marketing film). The
narration is a `Tutorial` (scenes: `id`, `step`, Hindi `text`, `estSeconds`) in
`src/narration.ts`; the same text is both the on-screen caption and the script the
voice reads. The marketing film keeps its two-language script in
`src/marketing/script.ts` instead. Then `src/videos/MyVideo.tsx` with a `renderPhone({ step, local,
length })` that draws the right screen for each `step`, and a `<Composition>` in
`src/Root.tsx`. Use this when the video needs a mock of a real screen, because
only a person looking at the real app can keep that mock true.

**Declared as data** (the 26 trade explainers). A video is a list of beats; each
beat has a spoken sentence in both languages and a block that draws the picture,
chosen from a fixed set (title, claim, compare, list, flow, document, wrong, recap
and a few more: `src/beats/types.ts`). To add one:

1. Write a file in `src/beats/social/` (copy a neighbour) and add it to `DECLARED`
   in `src/beats/catalog.ts`. Nothing goes in `Root.tsx`: it registers one
   composition per language for every declared video on its own.
2. `npm run voice`, then `npm run render:declared -- --only <id>`.
3. `npm run guide:entries` writes the guide site's titles, descriptions and chapter
   labels out of the video itself (`../site/README.md` has the rest).

Either way, timing is never hard-coded to the audio: `calculateMetadata`
(`src/lib/calc.ts`) measures each generated `.mp3` and makes that scene exactly that
long, so the hand-taps and captions stay in sync with the voice.

## Backup

Voiceovers, rendered masters and the marketing film's B-roll photographs are
git-ignored, and only this laptop holds them. B-roll cannot be remade: image
generation is not deterministic, so `npm run broll` gives a different photograph.

```bash
npm run media:push        # to S3 (bucket mdg-chat, prefix guide/)
npm run media:pull        # restore onto a fresh machine
npm run media:push -- --published-only | --dry-run
```

| Prefix under `guide/`          | Holds                                        | Public?           |
| ------------------------------ | -------------------------------------------- | ----------------- |
| `media/<id>/<rung>.<hash>.mp4` | the encoded renditions the guide site serves | yes, by exact key |
| `masters/<id>.mp4`             | rendered masters (`out/`)                    | no                |
| `audio/<id>/<scene>.mp3`       | voiceovers (`public/audio/`)                 | no                |
| `broll/<id>.png`               | B-roll photographs (`public/broll/`)         | no                |

`media:push` reads AWS keys from the environment, else from `../mdg-backend/.env`.
The header of `scripts/media.mts` has the bucket-policy check to run if that policy
is ever edited.

## How it fits together

```
src/
  narration.ts        ← hand-written scripts (captions + voice), plus the declared
                        videos; together they make TUTORIALS (66)
  theme.ts            ← colours/fonts mirrored from the real client
  Root.tsx            ← registers the hand-written compositions, and one per
                        language for every declared video
  lib/
    calc.ts           ← sizes each video to its voiceover (audio-driven timing)
    demoData.ts       ← sample roster + real work-catalog items
    creditCard.ts, stockSheet.ts, scene.ts, format.ts, audio.ts
  components/         ← PhoneFrame, BrowserFrame, Cursor (tapping hand), Highlight,
                        TutorialFrame, explainerChrome, landscapeChrome, ui, icons
  screens/            ← faithful mock app screens (Login, Chat, Staff,
                        GivePointsSheet, FinalizeSheet, PendingSubmission, CreditCard)
    admin/            ← mock admin-portal screens for the team videos
  videos/             ← one file per hand-written video; maps each scene → screen
                        state + cursor taps
  beats/              ← videos as data: types.ts (the shape), catalog.ts (the 26),
                        social/ (one file each), runtime.tsx (plays one)
  marketing/          ← the marketing film: script, B-roll prompts, drawings
scripts/
  generate-voice.mts  ← ElevenLabs text-to-speech
  render-all.mts      ← renders every composition to out/<id>.mp4
  render-declared.mts ← the same, for declared videos only, bundling once
  stills.mts          ← one still per scene
  broll.mts           ← the marketing film's photographs, through Vertex AI
  build-guide-media.mts ← encodes out/*.mp4 for the guide site (site/README.md)
  guide-entries.mts   ← the guide's copy for declared videos
  media.mts           ← S3 backup and restore
  _audit.mts, _dump.mts, _lens.mts ← checks and printouts for declared videos
                        (caption lengths, structure, a text dump)
public/audio/         ← generated voiceover (git-ignored)
public/broll/         ← generated photographs (git-ignored)
site/                 ← guide.mdgservices.in
```

## Notes

- The mock screens copy the real client's colours, fonts, copy, and work items from
  the real staff work catalog (85 items today), so what dealers watch matches what
  they'll see.
- Rendering uses a headless browser that Remotion downloads on first `npm run render`.
