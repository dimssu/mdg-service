# MDG Demo — Hindi voice-guided tutorial videos

Step-by-step **Hindi** tutorial videos that teach non-technical fuel-pump dealers
how to use the MDG app. Each video is a faithful, animated mock of the real app
screens with a tapping-hand cursor, on-screen Hindi captions, and an **ElevenLabs**
voiceover — built with [Remotion](https://www.remotion.dev) (programmatic video in
React).

The videos are portrait **1080×1920** (phone-shaped), so they play perfectly on a
phone or inside WhatsApp.

## What's included

| Video                  | Composition          | Teaches                                                     |
| ---------------------- | -------------------- | ----------------------------------------------------------- |
| `login`                | `Login`              | Opening the app and signing in with email + password        |
| `add-warrior`          | `AddWarrior`         | Adding a new योद्धा (staff member)                          |
| `give-points`          | `GivePoints`         | Giving points to one योद्धा for a task                      |
| `split-points`         | `SplitPoints`        | Splitting one task's points equally among several people    |
| `submit-points`        | `SubmitPoints`       | Final-submitting the day's points with a hardcopy photo     |
| `points-system`        | `PointsSystem`       | How each work's points are derived (concept explainer)      |
| `credit-monitor`       | `CreditMonitor`      | Reading the daily CREDIT & DOD MONITORING card (recreation) |
| `credit-monitor-photo` | `CreditMonitorPhoto` | Same, marked up over the dealer's own card screenshots      |

`credit-monitor` and `credit-monitor-photo` share one narration/voiceover — the
first redraws the card cleanly, the second highlights rows on your real photos
(drop them in `public/credit-card/`, see that folder's README).

The narration for every video lives in **`src/narration.ts`** — this is the single
source of truth: the same Hindi text is both the on-screen caption **and** the
script the voice reads.

## Quick start

```bash
cd mdg-demo
npm install

# 1) Add your ElevenLabs key
cp .env.example .env
#    then edit .env → ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (a Hindi/Indian voice)

# 2) Generate the Hindi voiceover (writes public/audio/**/*.mp3)
npm run voice

# 3) Preview in the Remotion studio (live, scrub, edit)
npm run dev

# 4) Export all four MP4s to ./out
npm run render
```

You can preview and render **before** adding the key — the videos fall back to
estimated timings and show the Hindi captions silently. Add the voice later and the
timing automatically snaps to the real audio.

## The ElevenLabs voice

`.env` controls the voice:

```
ELEVENLABS_API_KEY=...          # Profile → API Keys
ELEVENLABS_VOICE_ID=...         # pick a natural HINDI / Indian voice from your Voice Library
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
```

- `npm run voice` only generates **missing** clips. To re-record everything (e.g.
  after changing a voice or editing narration): `npm run voice -- --force`.
- Audio is git-ignored (`public/audio/**`). Anyone with the key can regenerate it.
- Editing a scene's `text` in `src/narration.ts`? Delete that scene's `.mp3` (or use
  `--force`) and re-run `npm run voice`.

## How it fits together

```
src/
  narration.ts        ← ALL Hindi scripts (captions + voice). Edit copy here.
  theme.ts            ← colours/fonts mirrored from the real client
  Root.tsx            ← registers the 4 compositions + loads Hindi font
  lib/
    calc.ts           ← sizes each video to its voiceover (audio-driven timing)
    demoData.ts       ← sample roster + real work-catalog items
    scene.ts, format.ts, audio.ts
  components/          ← PhoneFrame, Cursor (tapping hand), Highlight, TutorialFrame, ui, icons
  screens/            ← faithful mock app screens (Login, Chat, Staff, GivePointsSheet)
  videos/             ← one file per tutorial; maps each scene → screen state + cursor taps
scripts/
  generate-voice.mts  ← ElevenLabs text-to-speech pipeline
  render-all.mts      ← renders every composition to out/*.mp4
public/audio/         ← generated voiceover (git-ignored)
```

Each video component maps a scene's `step` to a mock-screen state and the cursor's
tap target. Timing is never hard-coded to the audio: `calculateMetadata`
(`src/lib/calc.ts`) measures each generated `.mp3` and makes that scene exactly that
long, so the hand-taps and captions stay in sync with the voice automatically.

## Adding another tutorial

1. Add a `Tutorial` (scenes: `id`, `step`, Hindi `text`, `estSeconds`) to
   `src/narration.ts`.
2. Create `src/videos/MyVideo.tsx` — a `renderPhone({ step, local, length })` that
   draws the right screen for each `step` (copy an existing video as a template).
3. Register a `<Composition>` in `src/Root.tsx`.
4. `npm run voice` then `npm run dev`.

## Notes

- The mock screens copy the real client's colours, fonts, copy, and the actual
  66-item staff work catalog, so what dealers watch matches what they'll see.
- Rendering uses a headless browser that Remotion downloads on first `npm run render`.
- To render a single video: `npx remotion render Login out/login.mp4`.
