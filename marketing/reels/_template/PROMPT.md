# Reel NN · <Feature> — "<Hindi title>"

*Prompt vN · <date> · paste everything below the line into a fresh agent session opened at the repo root.*

<!--
HOW TO CUT A PROMPT FROM THIS TEMPLATE (for the prompt writer; delete this block)

- Start from CATALOG.md § NN. Every figure, string and "never" comes from there;
  if the brief is missing something, research it and update CATALOG.md first,
  so the catalogue stays the single source of truth.
- Carry DIRECTION.md › Lessons forward. A note the owner gave on an earlier reel
  becomes a line here (and is already in DIRECTION.md).
- Keep what made the sample brief strong: one committed concept named in a line;
  every shot made out of the previous one; a short, hard palette and type rule;
  a required range with equal weight; an explicit banned list; a beat-locked
  structure with a hook bar and a strongest bar; deterministic build; a QA gate
  before the full render; "storyboard first, then build without asking".
- What we add to it: the viewer and the one takeaway; what is true and nothing
  else; the reel's own signature device and style (never another reel's);
  a sound-director subagent; a fresh-eyes critic; the real product screens.
- Write the draft voice yourself, inside 240 Hindi characters (count with
  Python), TTS spellings hyphenated, numbers left to the screen.
- On-screen words: Hindi in Devanagari, trade words and numbers in Latin,
  ≤ 7 Hindi words per screen.
- Name every method-leak string to hide on the card or screen this reel uses —
  including the outlet code in BOTH places it prints — and the text assertions
  the build must pass. Hide by element or builder input; never rewrite card text.
- Check every figure against the real builder, not just the fact file: columns
  that exist on the card, what the builder prints for the story case.
- Give each structure row a "Becomes" cell and pin each voice line to a start
  time inside its bar; TTS text uses only , । ?
- End on the voice pointing at the number ("हमसे बात कीजिए"); never speak digits.
-->

---

<role>
You are the director and motion designer of a 15-reel series for MDG Services
and its Android app, Dealer Kavach. This is reel NN. The shared kit already
exists — use it, extend it where this reel needs something new, never fork it.
</role>

<read-first>
1. `marketing/reels/DIRECTION.md` — binding. Re-read §4 and §7 before writing any on-screen word.
2. `marketing/reels/kit/README.md` — what the kit already does ("Built so far").
3. `marketing/reels/CATALOG.md` § NN — the figures, already checked. Use them exactly.
4. `marketing/reels/NN-slug/LOG.md` and `marketing/reels/NEEDS-FROM-YOU.md`.
5. Look at: <reference images / source files for this reel's screens>.
</read-first>

<brief>
The viewer: a pump owner, 45, sound off, never heard of us.

The one thing he must leave with: **"<takeaway>"**

What is true — and nothing else may be claimed: <the feature as the dealer receives it, 2–4 lines>.
</brief>

<direction>
**Concept: "<concept>".** Commit to it and restate it in one line before the storyboard.

**Signature device (this reel's alone):** <device>.

**Style:** <style> — <what that means for motion, in one or two lines>.

**World:** black, white, warm grey; at most one gold accent per beat; any colour
beyond that arrives only inside the real card or screen.

**Type:** Inter + Noto Sans Devanagari; ≥ 54 px; ≤ 7 Hindi words on screen.

**Camera:** one virtual camera; pushes toward what is named; exit = entry; macro zooms land on a number that then changes.

**Range — every item must appear, each made out of the shot before it:**
1. Kinetic Hinglish type — <where>.
2. A 2.5D / 3D moment — <what>.
3. UI deconstruction — <which card or screen, which parts>.
4. The data moment — <which number builds, and the arithmetic>.
5. The physical world into the product — <what object becomes what>.
6. The end card (DIRECTION §8), on frame 0's layout.

**Banned:** everything in DIRECTION §7. Here in particular: <reel-specific clichés to avoid>.
</direction>

<structure>
**30.000 s at <BPM> BPM = <N> bars of <s> s.** Something lands on every beat; scenes change on downbeats. A starting map — improve it, keep every job:

| Bars | Time | Job | Becomes | On screen |
|---|---|---|---|---|
| 1 | 0–… | **Hook.** Frame 0 is the poster … | … | `…` |
| … | … | **Pain** … | … | `…` |
| … | … | **Turn** … | … | `…` |
| … | … | **Proof** … | … | `…` |
| … | … | **Strongest moment** (the reel's logo lockup arrives here, with the relief) … | … | `…` |
| last 2 | …–30 | **End card**, static from 27.5 s, on frame 0's skeleton | — | end card |
</structure>

<sound>
**Spawn a sound-director subagent** (fresh context) with your storyboard, DIRECTION §9 and this section. It decides the mode — leaning: <voice + music | music only> because <reason> — writes `NN-slug/AUDIO.md` (decision + reason, final lines with character counts and TTS spellings, composition plan JSON, SFX cue sheet by beat, mix notes), generates and measures the takes, and returns a beat map. Lock the picture to that map.

**Draft voice** — keep its facts and its length (<n> characters; ceiling 240):
1. `…`

**Music:** <BPM, key, arc by bar, the silence before the key number, the sting>.

**SFX:** <the three hits and the few event sounds>. Nothing else.
</sound>

<build>
1. **Screens and cards:** <builder, figures from CATALOG § NN, strings to strip, what to keep exactly>.
2. **Determinism:** every style from `t` inside `window.seek(t)`; no CSS animation, timers or state between frames.
3. **Motion:** expo-out, critically damped springs only, quart camera; blur from sub-frames at render.
4. **QA gate 1:** one still per beat with the safe-zone overlay, as a contact sheet; fix everything it shows.
5. **QA gate 2:** a fresh-eyes critic subagent reviews the contact sheet, STORYBOARD.md, AUDIO.md against DIRECTION.md; fix every must-fix.
6. **Render** 60 fps × 3 sub-frames, bt709, loudnorm −16 LUFS / −2 dBTP; deliver `vN.mp4`, `vN-whatsapp.mp4`, `vN-poster.jpg`, `vN-sheet.jpg` into `NN-slug/out/`; verify with `qa.mjs`.
7. **Record:** LOG.md entry; update STATUS.md; add anything the kit gained to its "Built so far" table.
</build>

<start>
First tell me the concept in one line and show the beat-by-beat storyboard (bar · beat · picture · on-screen words · voice · sound); save it as `NN-slug/STORYBOARD.md`. Then build it without asking me anything else — unless something in `NEEDS-FROM-YOU.md` is open and blocks you; then ask once, with options. Finish with the MP4, the WhatsApp copy, the contact sheet and the LOG entry.
</start>
