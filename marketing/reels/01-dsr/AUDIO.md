# Reel 01 · DSR — audio

Written by the sound director, 17 Oct 2026. Everything below was **measured**
(ffprobe, ffmpeg, numpy, ElevenLabs speech-to-text for word times). Nothing was
auditioned by ear — there is no playback in this session. Listen once before
the render and treat §7 (risks) as the checklist.

Files: `build/script.json` (+ `script.js` mirror) · `build/music-plan.json` ·
`build/mix.json` · `build/audio/mix.wav` (the finished 30.000 s track, 48 kHz
stereo, 24-bit).

## 1. Mode

**Voice + music.** The reel explains a reason (why the day's *हिसाब* never
tallies and how it comes already written in his register's columns); a
music-only cut would lose that story. Muted first plays are still safe: every
spoken idea is also on screen (DIRECTION §2).

## 2. Voice — final lines and the measured beat map

Voice: the films' Hindi voice, `eleven_multilingual_v2`, stability 0.45 ·
similarity 0.8 · style 0 · boost on, neighbours as `previous_text`/`next_text`.
**238 characters** (ceiling 240), counted with Python `len`. TTS text uses only
`,` `।` `?` and the hyphens in acronyms; no number is spoken; none of
DIRECTION §3's never-spoken words appears. A speech-to-text round trip heard
every word of every line.

**Lock the picture to `speech`, not to the file length.** ElevenLabs leaves
about 1 s of silence after any line that has a next line; `voice.mjs` pads the
file back to that length, so `seconds` is the *file*, not the voice (see §8).
`onset` / `end` in `script.json` are seconds after `start`.

| id | start | speech (voiced) | last word ends | chars | TTS text | screen text |
|---|---|---|---|---|---|---|
| L1 | 0.10 | 0.10 → 1.69 | 1.70 | 31 | `डी-एस-आर का हिसाब नहीं मिल रहा?` | `रात 11:30` / `DSR का हिसाब फिर नहीं मिल रहा?` |
| L2 | **2.70** (draft 3.0) | 2.70 → 4.88 | 4.86 | 31 | `एक जगह गलती, पूरा पन्ना दोबारा।` | `एक जगह गलती —` / `पूरा पन्ना दोबारा।` |
| L3 | 6.00 | 6.08 → 7.58 | 7.68 | 25 | `अब डी-एस-आर आपके फ़ोन पर।` | `अब DSR — आपके फ़ोन पर` |
| L4 | **8.50** (draft 9.0) | 8.58 → 12.27 | 12.32 | 48 | `कल की बिक्री, आज का स्टॉक, रजिस्टर के खानों में।` | `कल की बिक्री · आज का स्टॉक` / `आपके रजिस्टर के खानों में` |
| L5 | 14.30 | 14.30 → 17.01 | 17.06 | 37 | `स्टॉक सीमा में है या नहीं, साफ़ लिखा।` | `स्टॉक सीमा में है?` / `साफ़ लिखा` |
| L6 | **18.00** (draft 18.2) | 18.07 → 21.74 | 21.86 | 41 | `कोई भी उतार ले। हमारी टीम देखकर भेजती है।` | `रजिस्टर में कोई भी उतार ले` / `MDG टीम देखकर भेजती है` |
| L7 | **26.00** (draft 25.8) | 26.00 → 28.32 | 28.42 | 25 | `डीलर कवच। हमसे बात कीजिए।` (one take) | end card: `बात कीजिए` / `1800-891-3496` (written, never spoken) |

Windows from the brief — all met: L1 ≤ 3.0 · L2 ≤ 6.0 · L3 ≤ 8.5 (it crosses
the 7.0 cut, allowed for line 3) · L4 ≤ 12.5 (ends 12.27–12.32, 0.18 s clear of
the silent beat) · L5 ≤ 18.0 · L6 ≤ 22.5 (and clear of the 22.0 hit) · L7 ≤ 29.0.

**Word map** (absolute seconds, good to about ±0.05 s) — put picture beats on
these words:

- **L1** DSR 0.20–0.66 · का 0.74 · हिसाब 0.84–1.16 · नहीं 1.20 · मिल 1.38 · रहा 1.56–1.70 *(the question ends as the rule strikes at 1.5)*
- **L2** एक 2.80 · जगह 2.98 · गलती 3.26–3.54 · *(pause)* · **पूरा 4.02** · पन्ना 4.30 · दोबारा 4.54–4.86 *(पूरा lands on bar 3's downbeat)*
- **L3** अब 6.12 · DSR 6.36–6.90 · आपके 6.96–7.22 · **फ़ोन 7.24**–7.40 · पर 7.46–7.68 *(the cut is at 7.0; फ़ोन lands as the phone opens)*
- **L4** कल 8.60 · की 8.84 · **बिक्री 8.98–9.30** *(the count starts at 9.0)* · *(pause)* · आज 9.84 · का 10.12 · **स्टॉक 10.32–10.68** · *(pause)* · **रजिस्टर 11.20–11.62** *(the fast pan, 11.0–11.5)* · के 11.70 · खानों 11.88–12.16 · में 12.20–12.32
- **L5** स्टॉक 14.42 · सीमा 14.76 · में 15.06 · है 15.24 · या 15.46 · नहीं 15.62–15.86 · *(pause)* · **साफ़ 16.36–16.64** · **लिखा 16.68–17.06** *(on the 766 sum)*
- **L6** कोई 18.10 · भी 18.30 · उतार 18.40–18.68 · ले 18.72–18.84 · *(pause 1.3 s, the cells fly)* · **हमारी 20.10–20.50** *(just after 4,222 lands at 20.0)* · टीम 20.54 · देखकर 20.84 · भेजती 21.24 · है 21.64–21.86
- **L7** डीलर 26.10–26.44 · कवच 26.52–26.86 · *(pause)* · **हमसे 27.48** *(the end card goes static at 27.5)* · बात 27.80 · कीजिए 28.06–28.42

**What changed from the draft, and why.** No wording changed — the seven
draft lines are word for word. Only four start times moved, all inside their own
bar, because the measured speech is much shorter than the estimate (about 13–19
characters a second, not 11) but L4 is a long line:

- **L2 3.0 → 2.70.** पूरा now lands on 4.02, the downbeat of bar 3, where `पूरा पन्ना दोबारा।` appears; `एक जगह गलती` sits over the retyped-and-struck cell (2.5–3.5).
- **L4 9.0 → 8.50.** Starting at 9.0 the line ends at 12.77 and runs into the silent beat. At 8.5 (the flip to the viewer) it ends at 12.27.
- **L6 18.2 → 18.00.** Ends 21.74 instead of 21.94, clear of the 22.0 hit. The long pause in the middle now ends at 20.10, so `हमारी टीम…` follows the `4,222` landing at 20.0.
- **L7 25.8 → 26.00.** `डीलर कवच` lands with the end-card hit; `हमसे बात कीजिए` starts at 27.48, when the card goes static.

## 3. Music

**Plan:** `build/music-plan.json` — ElevenLabs `music_v1`, 120 BPM, key D, five
sections in whole bars (6 000 + 12 000 + 4 000 + 4 000 + 4 000 = 30 000 ms):
*Worry* (bars 1–3) → *The turn* (4–9) → *Build* (10–11) → *Payoff* (12–13) →
*Sting and settle* (14–15). Instrumental; negatives: vocals, choir, lyrics, EDM
drop, dubstep, 808, sub bass, heavy kick, guitar solo, loud cymbal crashes,
corporate uplifting.

**Three takes, none perfect.** Mean level per 2-second bar (dB) and the comb fit
of the beat (best BPM, how far the beat sits from the 0.5 s grid, how sharp the
pulse is):

| take | what the plan asked for | bars 1–15 RMS | tempo · beat phase · pulse sharpness (9–26 s) | verdict |
|---|---|---|---|---|
| 1 | first plan | −17 −10 −9 −8 −9 −10 −10 −9 −9 −9 −9 −9 −9 −13 −52 | 118.8 BPM · 170 ms · 2.3 dB (no clear pulse) | **rejected.** Almost all low bass (97–100% of power below 300 Hz), flat from bar 2 to 13, no turn, a heavy sub-bass thump every 2 s. Would vanish on a phone speaker. |
| 2 | rewritten to name acoustic instruments, ban sub-bass | −37 −26 −21 −21 −19 −19 −18 −17 −17 −13 −12 −16 −14 −13 | **120.0 BPM** · 320 ms · **13.8 dB** | **chosen.** Sparse dark swell for 6 s, a bright groove after, build at 18, payoff at 22, a sting at 26 and a fade to nothing by 28.7. Faults: the full groove came in at raw 8.81 s (planned 6.0) after a near-silent gap; the whole grid sat 0.314 s off; the payoff bar was quieter than the build. |
| 3 | S1 made 4 bars (32 s plan) to dodge a suspected late first turn | −26 −22 −20 −19 −19 −13 −15 −16 −15 −15 −13 −11 −11 −9 −18 | 116.2 BPM · 15 ms · 1.6 dB (no clear pulse) | **rejected.** Flat low-mid drone, almost nothing above 1 kHz, no change at the section boundary. (32 s long; its plan is in `music-plan.take3.json`.) |

Per-take plans: `music-plan.take1.json`, `music-plan.json` (= take 2),
`music-plan.take3.json`. Three takes used — the cap.

**Take 2 repaired, not used raw** (`build/make-bed.py`, deterministic, writes
`audio/bed-final.wav`). Every edit is on a bar or beat line:

1. **Delay 0.186 s.** The take's strong beats ran on 8.814 + 0.5004 n (119.9 BPM). Delayed, they land on 9.000, 9.500 … and the take's three section accents land on **18.0, 22.0, 26.0**.
2. **The turn at 6.0.** The take's sparse opening is cut at 5.995. A 3-second slice of its own groove (delayed take 9.995–12.97) is laid at 5.995–8.975. Its strong beat lands on **6.0**, its kick on **7.0** (the hard cut), the next strong beat on **8.0**, and the take's real arrival (kick at 8.99) carries on from the seam with no gap. Seam is a 20 ms cross-fade on a kick boundary.
3. **Bar levels.** Build bars 18–22 pulled down 3 and 2 dB, payoff bars 22–26 raised 4 and 3.5 dB, so the energy keeps rising into the payoff.

**Measured result, bed alone** (`check-grid.py`, `analyze-bed.py`):

| bars | seconds | RMS dB | brightness | notes |
|---|---|---|---|---|
| 1 | 0–2 | −39 | centroid 300 Hz, 0.1% of energy above 1 kHz | silent first second, then a low drone swell |
| 2 | 2–4 | −26 | 315 Hz, 1.5% | |
| 3 | 4–6 | −21 | 300 Hz, 0.4% | still dark; no beat of its own — the wood-block is added in the mix |
| **4** | **6–8** | **−18** | **715 Hz, 7.9% above 1 kHz (about 20× the share before)** | **the turn: strong beat exactly on 6.0, groove with 4 attacks a second** |
| 5–9 | 8–18 | −19 … −17 | 650–980 Hz, 6–12% | groove; real arrival kick at 9.0 |
| 10–11 | 18–22 | −16, −14 | | build |
| 12–13 | 22–26 | −13, −11 | | payoff, loudest part |
| 14 | 26–28 | −12 | | sting on 26.0, settle |
| 15 | 28–30 | −40 | | near silence |

Grid check on the final bed: **120.0 BPM**, 98% of the beats from 6.0 to 27.0
sit within ±25 ms of the 0.5 s grid (median −3 ms), pulse sharpness 14–19 dB.
The strong beat of bar 4 is at 6.0 −1 ms.

**Honest limits.**
- *Major / minor is not proven.* The chroma test cannot tell: F♯ outweighs F both before and after 6.0. What measurably changes at 6.0 is energy, brightness and rhythm, not a verified minor-to-major chord. The take's harmony reads as modal around D and A.
- *The first groove bars are borrowed.* 6.0–8.97 is a splice of the same groove (§3.2). Its seam is on a kick and cross-faded, but nobody has heard it.
- *The take's own drone swells in bars 1–3* (−39 → −21 dB). The "dry wood-block on the beat" is not in the take; it is the kit's synthesised wood-block (§4), exactly on the grid.

## 4. SFX cue sheet (`build/mix.json`)

At most one sound per event. Organic hits come from `marketing/films/short/sound/`
and are reused as they are, plus a saturated copy at −9 dB high-passed at 110 Hz
(`*-phone.wav`): the originals are almost pure 20–120 Hz and a phone speaker
plays almost none of that. Body in the 120–1 000 Hz range went up 20–25 dB on the sub-hit and 5–8 dB on the brand hit (which already had a bright shimmer).
Gains are relative to the file's own level. The only new organic sound is the
paper slide (`sfx-paper.mp3`, 0.68 s, ElevenLabs sound generation).

| at (s) | sound | gain dB | event | notes |
|---|---|---|---|---|
| 0.0 · 2.0 · 4.0 | wood-block (synth) | −14 / −14 / −15 | bar downbeats | bed instrument, not an event |
| 0.5 · 1.0 | wood-block | −18 | digits wipe in · wrong `4,322` wipes in | |
| **1.5** | wood-block | **−12** | the strike | the one accented beat of the hook |
| 2.5 · 3.0 · 3.5 | wood-block | −18 | | |
| 5.0 | wood-block | −18 | last one | bar 3 thins to beats 1 and 3 (4.0 and 5.0) |
| 6.0 | *(the bed's strong beat)* | | the turn | music, not a cue |
| 6.05 | paper slide | −9 | the row lifts (swish 6.05–6.5, peak 6.25) | |
| **7.0** | sub-hit (phone) | **−10** | **HIT 1 of 3 — the hard cut** | bed kick lands on 7.0 too |
| 9.00 · 9.15 · 9.32 · 9.52 · 9.76 | tick | −12 | the `4,222` count-up | slowing gaps; **the count should settle at 9.76** |
| 11.04 | whoosh | −10 | the fast blurred pan 11.0–11.5 (peak 11.25) | drop it if the pan is under 0.4 s |
| 12.32 → 13.0 | **silence** | | the beat before `4,222` | voice ends 12.32, bed gated 12.47–12.97, no effect |
| **13.0** | tickhi | −9 | `4,222` lands in SALES | bed comes back on its kick at 12.995 |
| 18.5 · 19.0 · 19.5 | tick | −12 | cells land: OPENING, RECEIPT, TOTAL | |
| 20.0 | tickhi | −9 | `4,222` lands in SALES (rhymes with 13.0) | |
| 18.0 → 22.0 | riser | −19 | the build | ends on the hit; kept low because the bed already builds |
| **22.0** | sub-hit (phone) | **−4** | **HIT 2 of 3 — strongest moment, row locks** | voice finished at 21.86 |
| **26.0** | brand hit (phone) | **−10** | **HIT 3 of 3 — end card** | the bed's own sting is at 26.02, so no separate sting |

Three hits: 7.0, 22.0, 26.0. The sting is the bed's, not a cue.

## 5. Mix (`kit/audio/mix.mjs` → `build/audio/mix.wav`)

- **Bed** `audio/bed-final.wav`, gain **−10 dB** (not −14): the repaired bed's own level is about 4 dB under the films' bed (−18 vs −14 dB RMS), so −10 here equals the film recipe's −14. Then the kit's 2.5 kHz pocket (−4 dB), sidechain duck under the voice (threshold 0.03, ratio 8, attack 15, release 350), gated **12.47–12.97** (the brief said 12.5–13.0; the bed's kick is at 12.995 and a 30 ms ramp from 13.0 would have softened it), fade-out 0.6 s.
- **Result:** the bed sits about 20 dB under the voice while he speaks and about 5 dB under him in the gaps. In the voice-free payoff (22–26 s) it is as loud as the voice was.
- **Loudness:** integrated **−15.9 LUFS**, true peak **−2.0 dBTP**, loudness range 4.1 LU. Measured twice: ffmpeg `ebur128=peak=true` on `mix.wav` (−15.9 / −2.0) and a separate `loudnorm` analysis pass (−15.93 / −2.00). Length 30.000 s.
- **Low-bitrate copies:** AAC 192 k and 128 k → true peak **−1.7 dBTP**; AAC 64 k → **−0.1 dBTP**. A WhatsApp copy at 64 k or below needs its own limiter or a lower target (DIRECTION §9 already says to check each).
- Pre-normalisation the mix peaked at −5.5 dBTP, so loudnorm only gains; nothing is squashed.

## 6. What the picture must respect

1. **Lock to §2's word map and §4's cue times.** The counter should *settle* at 9.76 (ticks slow down to it); `4,222` lands in SALES at 13.0; the four register cells land at 18.5, 19.0, 19.5, 20.0; the hit beats are 7.0, 22.0, 26.0.
2. **L2, L4, L6, L7 start earlier or later than the v1 draft** (§2). L4 now begins at 8.5, as the sales picture flips to the viewer.
3. **Nothing may be spoken between 12.32 and 13.0**, and the screen should hold the pause: it is the only silence in the reel.
4. **The turn is at 6.0** (strong beat on 6.0, kick on 7.0, strong beat on 8.0, arrival kick on 9.0 with the count). Colour entering at 7.0–8.0 and the flip at 8.5 both sit on beats.
5. **The wood-block ticks are the hook's sound.** 0.5 and 1.0 are the two digit wipes, **1.5 is the strike** (louder), 2.0 is bar 2's page copy. Beat 4 of bar 3 (5.5) and bar 4 beat 1 (6.0) are deliberately empty of wood-block so the turn is a change.
6. If the fast pan is shorter than 0.4 s, delete the whoosh from `mix.json` and re-run the mix.
7. The bed's sting is at 26.02. The number should type on at 26.0–26.5 so the brand hit and the sting read as one event.

## 7. Risks to check by ear (nobody has listened)

- The 5.995 and 8.975 seams of the repaired bed.
- That the phone-safe hits are audible on a small speaker without sounding harsh.
- That L1's `डी-एस-आर` (0.46 s) is clear enough at the start; if not, re-word to `डी-एस-आर का हिसाब, नहीं मिल रहा?` (a pause after हिसाब, but it pushes the question past the strike at 1.5).
- Bars 1–3 are very quiet (−39 → −21 dB bed) — the hook is carried by the voice and the wood-block.

## 8. Changes outside `build/` and this file

One: **`kit/audio/voice.mjs`** printed `start + file length` as each line's end,
which is about 1 s late (the file is padded). It now also measures where the
voice really starts and stops (`onset`, `end`, ffmpeg `silencedetect` at −42 dB)
and prints "speech" times; `seconds` is unchanged. Nothing else in the kit was
touched.

## 9. Reproduce

```
node marketing/reels/kit/audio/synth.mjs marketing/reels/01-dsr          # ticks, whoosh, riser, wood-block (already run)
node marketing/reels/kit/audio/voice.mjs marketing/reels/01-dsr          # records only changed lines; prints speech times
node marketing/reels/01-dsr/build/words.mjs                              # word times from speech-to-text
node marketing/reels/kit/audio/music.mjs marketing/reels/01-dsr          # next music take (cap: 3 used)
python3 marketing/reels/01-dsr/build/make-bed.py                         # bed-final.wav + the phone-safe hits
python3 marketing/reels/01-dsr/build/check-grid.py marketing/reels/01-dsr/build/audio/bed-final.wav 5.5 27.5
node marketing/reels/kit/audio/mix.mjs marketing/reels/01-dsr            # build/audio/mix.wav
```
