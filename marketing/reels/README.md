# Feature reels — start here

A series of 30-second, fast-paced, premium motion-graphics videos, one per
Dealer Kavach feature or MDG service. Each one is made by an agent from a
written prompt; this folder holds the prompts, the decisions, the shared code
and every render, so work survives a new session or a compacted one.

## If you are resuming (a new session, or after compaction)

Read these four, in this order, and nothing else first:

1. **`STATUS.md`** — which reel is active, its version, the owner's last verdict, the next action.
2. **`DIRECTION.md`** — the binding brand, motion, sound and claims rules every reel inherits.
3. **`<NN-slug>/LOG.md`** of the active reel — every version, every piece of owner feedback, what changed.
4. **`<NN-slug>/PROMPT.md`** of the active reel — the prompt as it currently stands.

`CATALOG.md` has the brief for every reel, including the ones not started.
`NEEDS-FROM-YOU.md` lists what only the owner can give, answered or open.
`_research/` is the raw fact-finding the briefs were written from — go there to
check a fact, not to start.

## The loop, per reel

| Step | Who | Writes |
|---|---|---|
| 1. Write the prompt from `CATALOG.md` + `_template/PROMPT.md` | prompt writer | `NN/PROMPT.md`, `LOG.md` entry "v1 prompt" |
| 2. Paste the prompt into a fresh agent session | owner | — |
| 3. Storyboard, sound plan, build, self-check, render | executing agent | `NN/STORYBOARD.md`, `NN/AUDIO.md`, `NN/build/`, `NN/out/vN.mp4`, `LOG.md` entry |
| 4. Watch, give notes | owner | — |
| 5. Turn the notes into a revision prompt (a delta, not a rewrite) | prompt writer | `NN/revisions/vN+1.md`, `LOG.md` entry |
| 6. Repeat 3–5 until the owner says ship | | `STATUS.md` → shipped |
| 7. Carry anything learned into `DIRECTION.md` or `kit/` before the next reel | prompt writer | `DIRECTION.md` "Lessons" |

Step 7 is the one that makes reel 10 better than reel 1. A note the owner gives
on one reel ("too much text", "the voice is too fast") is almost always a rule
for all of them.

## Folder layout

```
reels/
  README.md            this file
  STATUS.md            the tracker — one row per reel
  DIRECTION.md         binding rules: brand, motion, sound, claims, banned list, lessons
  CATALOG.md           every reel's brief: concept, hook, facts, never-say
  NEEDS-FROM-YOU.md    owner inputs
  _template/
    PROMPT.md          the prompt skeleton every reel's prompt is cut from
    REVISION.md        the skeleton for a revision prompt
  _research/           raw findings (features, brand, tools, craft)
  kit/                 shared code every reel uses (built by reel 01, extended after)
  01-dsr/
    PROMPT.md          paste-ready prompt (current)
    LOG.md             version history + owner notes + decisions
    STORYBOARD.md      written by the executing agent
    AUDIO.md           written by the sound-director agent
    revisions/         v2.md, v3.md … revision prompts
    refs/              reference screenshots and source images
    build/             the reel's source (index.html, scenes, audio plan)
    out/               renders — v1.mp4, v1-whatsapp.mp4, v1-sheet.jpg …
  02-…/
```

**Git:** markdown, HTML, JS and JSON here are tracked. Media (`*.mp4`, `*.mp3`,
`*.wav`, `*.png`, `*.jpg`, fonts) and every `out/` folder are ignored by
`marketing/.gitignore` and backed up to S3 with `node marketing/backup.mjs`.
Run the backup after a render the owner liked — an ElevenLabs music take does
not come back identical from the same prompt.
