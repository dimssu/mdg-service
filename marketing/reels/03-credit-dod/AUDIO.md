# Reel 03 · Credit & DOD — audio

Written by the sound director, 18 Oct 2026. Everything below was **measured** (ffprobe, ffmpeg `ebur128` / `loudnorm`,
numpy, ElevenLabs speech-to-text for word times). **Nothing was auditioned by ear** — there is no playback in this
session. Listen once before the render; §9 is the checklist. `build/verify.py` re-checks every hard rule of the brief on
the finished file (24 checks, all pass).

Files (all in `build/`): `script.json` (+ `script.js` mirror, `window.SCRIPT`) · `mix.json` · `audio/mix.wav` (the
finished track: **30.000 s = 1 440 000 frames, 48 kHz, stereo, 24-bit, −16.0 LUFS, −2.8 dBTP**) · `music-plan.groove.json`
(used) and `music-plan.minor*.json` (three rejected plans) · `build-audio.sh` (one command rebuilds everything).

## 1. Mode

**Voice + music.** The reel is an instruction with a deadline — how much to pay, by when, how many days are left, how
much credit remains. A muted play still works (every spoken idea is also on screen, DIRECTION §2), but the order of the
answer and the call at the end are carried by the voice.

## 2. Voice

The films' Hindi voice, `eleven_multilingual_v2`, stability 0.45 · similarity 0.8 · style 0 · boost on, neighbours as
`previous_text` / `next_text`. **218 characters** (Python `len`; ceiling 240) — **word for word the prompt's table**. TTS
text uses only `,` `।` `?`; no nuqta, no digit, no acronym, no number. **First take of every line was kept** (one call
each, nothing re-recorded). Speech-to-text heard every word of every line; it writes the loanwords in Latin letters
(`phone`, `credit`, `Indian Oil`, `Dealer Kavach`), which is how they sound — `script.json` keeps the Devanagari word
(`words[].w` = the TTS token) and the transcript in `heard` / `wordsHeard`.

| id | start | voiced (first sound → last sound) | chars | TTS text | on screen |
|---|---|---|---|---|---|
| L1 | 0.110 | 0.198 → 2.159 | 25 | `कितना जमा करना है, कब तक?` | `कितना जमा करना है?` / `कब तक?` |
| L2 | 2.380 | 2.476 → 5.548 | 38 | `खाता शून्य से नीचे गया, तो गिनती शुरू।` | `खाता शून्य से` / `नीचे गया —` · `गिनती शुरू।` |
| L3 | 6.150 | 6.150 → 7.964 | 22 | `यह हिसाब, आपके फोन पर।` | `यह हिसाब —` / `आपके फ़ोन पर` |
| L4 | 8.940 | 9.014 → 10.981 | 30 | `इतना जमा करना है, इस तारीख तक।` | `जमा करना है —` · `कब तक —` |
| L5 | 12.100 | 12.212 → 13.868 | 22 | `कितने दिन बाकी, यह भी।` | `कितने दिन बाक़ी?` + the days flaps |
| L6 | 16.360 | 16.360 → 17.918 | 24 | `और क्रेडिट कितना बचा है?` | `क्रेडिट कितना बचा?` |
| L7 | 20.130 | 20.203 → 22.394 | 32 | `इंडियन ऑयल का हिसाब, एक नजर में।` | `इंडियन ऑयल का` / `हिसाब —` · `कितना, कब तक —` / `एक नज़र में।` |
| L8 | 26.180 | 26.180 → 28.371 | 25 | `डीलर कवच। हमसे बात कीजिए।` (one take) | end card: `डीलर कवच` · `बात कीजिए` + number (written, never spoken) |

*Voiced* = ffmpeg `silencedetect` at −42 dB on the take; L3, L6 and L8 start on a faint lead-in (−30 to −40 dB), so the
**loud** first sound is later — `loudStart` in `script.json`: L1 0.235 · L2 2.475 · L3 6.200 · L4 9.020 · L5 12.220 ·
L6 16.395 · L7 20.205 · L8 26.205. Voice is 16.4 s of the 30 s; the pace is **13.3 characters a second** speaking, not the 11 the
draft assumed.

**Rules from the brief — all met** (`verify.py`):

| rule | limit | measured |
|---|---|---|
| L1 ends by 2.5 s | ≤ 2.5 | **2.159** |
| L7 ends by 22.5 s | ≤ 22.5 | **22.394** (`में` is the last sound) |
| nothing in the silent beat 8.5–9.0 | digital zero | **exactly 0.0** from 8.4945 to 9.0 (bed, voice, effects) |
| L3 clear of it | < 8.5 | ends **7.964** |
| L4's first word meets the hit | 9.0 | `इतना` energy rise **8.99**, audible from 9.01, loud 9.02; hit 2 is on 9.000 |
| L8 starts about 26.2 | | **26.18** (loud 26.205) |
| a line runs at most one beat into the next *scene* | | L1 +0.16 s into bar 2 · L3 ends inside bar 4 · L5, L6 inside their bars · L7 ends **0.39 s** into bar 12 (≤ 0.5) · L8 ends **0.37 s** into bar 15 (≤ 0.5). L2 (bars 2–3) and L4 (bars 5–6) each *span* the two bars of their scene by design — L4 starts on 9.0 and has 1.97 s to say 30 characters, so it ends **0.98 s** into bar 6 (the scene ends 12.0) |
| no digit, no phone number spoken | | none |

### What was edited in the takes, and why

ElevenLabs leaves a long hole after most commas (L8's full stop 0.93 s, L1 0.71 s). `build/tighten.py` shortens each
hole **inside** the quiet stretch (every sample removed is below −45 dB, centred, 8 ms cross-fade), so no word is
touched; the untouched take is kept as `audio/L*.raw.wav`:

| line | pause before | after | removed |
|---|---|---|---|
| L1 `है, कब` | 708 ms | 300 ms | 408 ms |
| L2 `गया, तो` | 609 ms | 260 ms | 349 ms |
| L3 `हिसाब, आपके` | 639 ms | 260 ms | 379 ms |
| L4 `है, इस` | 549 ms | 260 ms | 289 ms |
| L5 `बाकी, यह` | 344 ms | 250 ms | 94 ms |
| L6 | no comma pause | — | — |
| L7 `हिसाब, एक` | 604 ms | 260 ms | 344 ms |
| L8 `कवच। हमसे` | 933 ms | 380 ms | 553 ms |

Then `place.py` writes each take back **gated to digital silence** outside its speech (everything before the first
voiced sample −12 ms and after the last +60 ms, faded; a take that starts on speech keeps its own 10 ms fade-in) so the
files' faint lead-ins can never sound in the silent beat. Gating always starts from `audio/L*.pregate.wav` (the
tightened take) — **delete those after re-recording or re-tightening**. No time-stretch and no pitch change anywhere.
ffprobe lengths (mp3 as recorded → wav after the cut, 44.1 kHz): L1 3.669 → 3.653 · L2 4.598 → 4.582 · L3 3.390 → 3.374 ·
L4 3.390 → 3.374 · L5 2.554 → 2.538 · L6 2.368 → 2.368 · L7 3.437 → 3.421 · L8 3.065 → 3.049 s (each cut costs one
8 ms cross-fade; the files are padded with ~1 s of near-silence that the gate removes).

**How the lines end** (crude autocorrelation F0 of the last 0.6 s, evidence not proof): L2 → 128 Hz, L3 → 109, L4 → 75, L5 → 92,
L7 → 84, L8 → 86 all **fall** (statements). L6 ends **rising** (140 → 176 Hz): a question. L1 (`कब तक?`) ends 251 → 240 → 193 → 128: it
*falls* — a wh-question in Hindi often does, and Scribe wrote `?` for it, but check it by ear first (§9).

### Word map (reel time, seconds; start good to about ±0.05 s)

Scribe's word starts were snapped to the voice's own energy rise where there was one; ends are Scribe's and run up to
0.03 s past the true end — use each line's *voiced* end above.

**The key words**

| word | line | starts | ends | lands on |
|---|---|---|---|---|
| `कितना` (question) | L1 | **0.19** | 0.59 | frame 0 poster; riffle at 0.50 is on `कितना`'s tail |
| `कब` | L1 | **1.65** | 1.83 | the comma gap is **1.42–1.64**; hit 1 (1.500) is alone in it |
| `शून्य` | L2 | **3.06** | 3.42 | the `0` flip (starts 3.00, first flap lands 3.11) |
| `नीचे` | L2 | **3.72** | 4.02 | the `−` flip (3.60 → lands 3.71) |
| `गिनती` | L2 | **4.75** | 5.14 | the `3 दिन` flip (4.65 → lands 4.76) |
| `हिसाब` | L3 | **6.39** | 6.83 | the phone rising; the turn's strum is 6.000 |
| `फोन` | L3 | **7.51** | 7.73 | the tap on the picture is 7.500 |
| `इतना` | L4 | **8.99** (loud 9.02) | 9.28 | **9.000**: hit 2, the amount row's flips begin |
| `तारीख` | L4 | **10.45** | 10.76 | the date row flip (starts 10.32, lands 10.43) |
| `कितने` | L5 | **12.21** | 12.48 | |
| `दिन` | L5 | **12.54** | 12.68 | days flip 1 `3 दिन बाक़ी` (starts 12.50, lands 12.61) |
| `बाकी` | L5 | **12.76** | 13.12 | |
| `यह` / `भी` | L5 | **13.31** / 13.58 | 13.78 | days flip 2 `2 दिन बाक़ी` (starts 13.25, lands 13.36) |
| `क्रेडिट` | L6 | **16.64** | 17.00 | equation line 1 wipes on at 17.00 (the title `क्रेडिट कितना बचा?` lands on this word, 16.62) |
| `बचा` | L6 | **17.50** | 17.78 | **bar 9 beat 4**; equation line 2 `= ₹6,57,350` follows at 17.80 |
| `इंडियन` | L7 | **20.18** | 20.51 | the shrink starts 20.00 |
| `नजर` | L7 | **21.95** | 22.25 | the board rises 22.00 |
| `कवच` | L8 | **26.68** | 27.08 | `डीलर` is 26.28 |
| `बात` | L8 | **27.80** | 28.00 | ends in the 28.00 gap; `कीजिए` starts 28.02 |

**Every line** (`script.json` → `lines[].words` has these plus the ends)

| line | words (start s) |
|---|---|
| L1 | `कितना` 0.19 · `जमा` 0.69 · `करना` 0.98 · `है` 1.35 · *(0.22 s gap, hit 1)* · `कब` **1.65** · `तक` 1.88 |
| L2 | `खाता` 2.46 · `शून्य` **3.06** · `से` 3.54 · `नीचे` 3.72 · `गया` 4.09 · *(0.26 s)* · `तो` 4.54 · `गिनती` **4.75** · `शुरू` 5.28 |
| L3 | `यह` 6.16 · `हिसाब` 6.39 · `आपके` 7.08 · `फोन` **7.51** · `पर` 7.82 |
| L4 | `इतना` **8.99** · `जमा` 9.32 · `करना` 9.62 · `है` 9.83 · *(0.26 s)* · `इस` 10.26 · `तारीख` **10.45** · `तक` 10.84 |
| L5 | `कितने` 12.21 · `दिन` **12.54** · `बाकी` 12.76 · *(0.25 s)* · `यह` **13.31** · `भी` 13.58 |
| L6 | `और` 16.38 · `क्रेडिट` 16.64 · `कितना` 17.09 · `बचा` **17.50** · `है` 17.84 |
| L7 | `इंडियन` 20.18 · `ऑयल` 20.55 · `का` 20.89 · `हिसाब` 21.01 · *(0.26 s)* · `एक` 21.70 · `नजर` **21.95** · `में` 22.27 |
| L8 | `डीलर` 26.28 · `कवच` 26.68 · *(0.38 s)* · `हमसे` 27.45 · `बात` 27.80 · `कीजिए` 28.02 |

### What moved from the draft starts, and why

| line | draft | now | why |
|---|---|---|---|
| L1 | 0.10 | 0.11 | the tightened comma gap (1.42–1.64) is centred on 1.50, so hit 1 sounds alone between the two questions; `कब` follows it by 0.15 s |
| L2 | 2.60 | 2.38 | `शून्य` lands on the `0` flip (3.06 vs 3.11) and `गिनती` on the `3 दिन` flip; the voice enters 0.32 s after `तक?` ends |
| L3 | 6.20 | 6.15 | `फोन` on the tap (7.51); the voice ends 7.96, before the FLIP whoosh peaks |
| L4 | 9.00 | 8.94 | the take's loud onset is 0.08 s into the file; `इतना` meets 9.00 |
| L5 | 12.10 | 12.10 | unchanged: `दिन` already sits on the first flip |
| L6 | 16.20 | 16.36 | `बचा` lands on bar 9 beat 4 (17.50); the equation's answer line follows at 17.80 |
| L7 | 19.50 | 20.13 | must end by 22.5; `नजर` lands on the board rising (22.00); ends 22.394. *(Later, not earlier: the draft start would have finished the phrase at 21.7, 0.3 s before its own payoff.)* |
| L8 | 26.20 | 26.18 | the dip between `बात` and `कीजिए` (a 0.1 s hole, −69 dB at its centre) is on 28.00, where hit 3 lands |

## 3. Music

**120 BPM exactly, key D, instrumental** (negatives: vocals, choir, lyrics, EDM drop, dubstep, 808, sub bass, heavy kick,
guitar solo, cymbal crashes, corporate uplifting). The prompt's six sections in whole bars:

| section | bars | from → to | what it is |
|---|---|---|---|
| Tense | 1–3 | 0 → 6.0 | **synthesised**: a quiet D drone, a low pulse, dry high plucks (D minor) |
| The turn | 4–9 | 6.0 → 18.0 | the ElevenLabs groove, D major: plucked santoor and sitar-like strings, tabla/dholak/shaker, a string pad. The silent beat 8.5–9.0 is cut into it |
| Hold | 10–11 | 18.0 → 22.0 | the same groove, 1.6 dB lower (the data moment) |
| Build | 12–13 | 22.0 → 26.0 | the groove climbs; the riser runs 23.0 → 26.0 |
| Peak | 14 | 26.0 → 28.0 | strongest moment: the peak lands on 26.0, then the bed sits 5.5 dB lower under the voice |
| Sting and settle | 15 | 28.0 → 30.0 | the groove's own sting on 28.0 with hit 3; decays, 0.6 s fade-out |

**Generations.** One `music_v1` request of 26.0 s was used (`music-plan.groove.json`: Groove 12 s · Hold 4 s · Payoff 6 s ·
Sting and settle 4 s; only the first 2 s of the sting are used; a 2 s section was not tried, so the sting was asked for 4 s). It came back **25.992 s**,
tempo **120.0 BPM** (comb fit 120.0, 119.8, 118.9 over its three stretches), and lags every section line by a constant ~34 ms (reel 02: 26 ms), so it is
advanced by that. The model's "tense" opening failed **three times** — a one-section 6 s request each — so bars 1–3 are
synthesised instead (the files are kept in `audio/rejected/`):

| take | plan | what came back | verdict |
|---|---|---|---|
| minor-1 | the reel 02 recipe: D minor tanpura drone, no percussion | a plucked decay, not a drone: −10 dB at 0 s, −27 at 1 s, −49 at 2.5 s, −70 at 4 s | rejected |
| minor-2 | a bowed-cello drone, constant volume | swells from silence: −62 → −28 dB at 2.5 s → −78 at 5.5 s | rejected |
| minor-3 | a tanpura re-plucked every second | −41 → −16 dB at 2 s → −65 at 5.5 s | rejected |

**How the bed is built** (`build/make-bed.py`, deterministic):

1. **Bars 4–15 = `bed-groove-1.mp3` advanced 34 ms**, laid at 6.000 s. Beat attacks from 6.2 to 29.5 s then sit **median −2 ms**
   from the grid, 81 % within ±25 ms (the misses are off-beat notes winning the "strongest attack" test); section lines
   22.0 −5 ms · 26.0 −9 ms · **28.0 −1 ms**. The model's Hold is **not sparser** — the same pattern at the same level — so
   the calm of bars 10–11 is made with level alone (target −20.5/−20.7 against −18.9 to −19.7 for bars 4–9).
2. **Bar levels** (target RMS dB before the mix's −8 dB, smooth over 0.2 s): bar 4 −18.5 · 5 −19.7 · 6 −19.7 · 7 −18.9 ·
   8 −18.9 · 9 −18.9 · 10 −20.5 · 11 −20.7 · 12 −20.0 · 13 −18.5 · **14 −15.5 (peak, first 0.25 s)** · 15 −22.5. In bar 14 the voice
   speaks over the peak from 26.28, so the bed is lowered 5.5 dB from 26.25 to 26.5 and back by 28.0 — otherwise the
   bed was only 5–7 dB under `डीलर कवच। हमसे बात कीजिए।`. The model's Payoff is not much louder than its Groove; the climb
   into bar 14 is shaped here, as in reel 02.
3. **The silent beat** is cut into the file: a 8 ms fade out ending 8.493, digital zero until **9.000** (re-entry exactly on
   the grid; the groove's own downbeat attack is 2 ms ahead of it and is clipped by that, hidden under hit 2 and `इतना`).
   `finish.py` then zeroes 8.4945–9.0 in the final file too, because the resampler leaves a −95 dBFS ripple in the last 0.3 ms before an onset.
4. **Bars 1–3 are `audio/synth-intro.wav`** and are *not* ducked, because the voice is nearly continuous there and a ducked
   pulse would vanish: a drone on D (D2 A2 D3 A3 · two detuned copies, a little tanh buzz, low-passed at 0.9 kHz, **no
   third in it**), a soft **low pulse on 0.0 · 2.0 · 4.0 · 5.0**, and **dry high plucks (additive synthesis, 1.1 s) on 1.0 F5 ·
   2.0 A4 · 4.0 D5 · 5.0 A5**. **5.5 is left empty** so the turn is a change. No pulse or pluck falls on a clack landing
   (the closest: the riffle's last landing ≈ 0.91 and the F5 pluck at 1.0); the plucks are on the beat, the clacks are not.
5. **The turn at 6.000 (bar 4's downbeat)**: the groove's first stroke, a plucked **D-major strum** (D4 F♯4 A4 D5 A5, 18 ms
   apart) and a hand-drum stroke from the synth stem. There is no cut and no whoosh. The strum rings out by 7.9 and is silent after 8.0.

**Major and minor, measured** (energy at the note frequencies F and F♯ over four octaves; positive = towards F = minor):

| span | F vs F♯ |
|---|---|
| bars 1–3 (drone + F plucks) | **+14.0 dB — D minor** |
| the strum at 6.000 | **−37.8 dB — pure F♯** |
| groove, bars 4–5 | −10.6 dB — D major |
| groove, bars 6–9 | −8.2 dB |
| hold, build, peak | −12.0, −14.1 dB |

At the turn the music alone (synth + groove, before voice, ducking and effects) steps from **−34.1 dBFS in bar 3 to −23.9
in bar 4 (+10.2 dB)**, and its share of power above 1 kHz goes from **1.9 % to 16.0 %**. In the finished mix the bars read
(RMS dBFS) −18.0 −19.6 −18.4 | −17.3 −19.7 −20.1 −16.6 −20.3 −18.5 −21.7 −17.0 −19.6 −19.1 −17.0 −21.4.

## 4. SFX cue sheet (`build/mix.json`; the same times are in `script.json` → `cues` and `board`)

At most one sound per event. **The three hits are 1.500 · 9.000 · 28.000.** Gains are dB on the file's own level
(every file is peak-normalised first); effects are not ducked.

**The board's clacks — one sample per row change.** Each is a short rattle: one flap landing for each flap that changes,
**0.03 s apart** (the board's own stagger), the first landing **0.11 s after the flip starts** (a flip is 0.14 s). So a
cue is placed at the picture's **flip start**. A landing is a "tk" (a 2 ms band-limited noise burst) on a short wooden
"thock" (three decaying modes) with a smaller rebound 15 ms later; pitch and level jitter on every landing; three
different pitches (digit ≈ 520 Hz, word ≈ 310 Hz, fold ≈ 230 Hz). Never a pure tone, never periodic — not a tick. **Digit
rows are 3–5 dB quieter than word rows** (peaks −11 … −13 against −8 … −9.4 dBFS); the four days flips are the same level (no crescendo, no urgency).

| flip starts | lands | row → shows | sample | flaps | dB | sits on |
|---|---|---|---|---|---|---|
| 0.500 | 0.61 | amount + date → riffle (the picture leads by 40 ms) | `clack-riffle` | 12 | −14 | `जमा` (0.69) |
| 1.500 | 1.61 | amount + date → dashes | `clack-settle` | 9 | −17 | under hit 1, before `कब` |
| 3.000 | 3.11 | amount → dashes clear, `0` | `clack-zero` | 6 | −15 | `शून्य` 3.06 |
| 3.600 | 3.71 | amount → `₹−` (the `0` clears) | `clack-minus` | 2 | −17 | `नीचे` 3.72 |
| 4.650 | 4.76 | date → `3` + `दिन` | `clack-3din` | 3 | −12 | `गिनती` 4.75 |
| 9.000 | 9.11 → 9.32 | amount → `₹4,86,120` | `clack-amount` | 8 | −14 | `इतना`, under hit 2 |
| 10.320 | 10.43 | date → `26` + `अगस्त` | `clack-date` | 3 | −12 | `तारीख` 10.45 |
| 12.500 | 12.61 | days → `3 दिन बाक़ी` | `clack-days1` | 1 wide | −12 | `दिन` 12.54 |
| 13.250 | 13.36 | days → `2 दिन बाक़ी` | `clack-days2` | 1 wide | −12 | `यह` 13.31 |
| 14.100 | 14.21 | days → `कल आख़िरी दिन` | `clack-days3` | 1 wide | −12 | no voice |
| 15.000 | 15.11 | days → `आज ही जमा करना है` | `clack-days4` | 1 wide | −12 | no voice (moved from 15.60 in the build: the verdict needs 1.3 s before `क्रेडिट` 16.64) |
| 22.400 | 22.51 → 22.75 | both rows set (both from 22.40) | `clack-rowset` | 9 + 3 | −15 | just after `में` ends (22.42) |
| 26.000 | 26.11 | amount row folds flat | `clack-fold1` | 8 | −18 | bar 14's downbeat, before `डीलर` (26.28) (moved from 26.20 in the build) |
| 26.120 | 26.23 | date row folds flat | `clack-fold2` | 5 | −18 | before `डीलर` (moved from 26.60 in the build, so the name can rise as it is said) |

The clack gaps are 1.00 1.50 0.60 1.05 4.35 1.32 2.18 0.75 0.85 0.90 7.40 3.60 0.12 s: no two consecutive gaps are equal.
**The four days flips are 12.50 · 13.25 · 14.10 · 15.00** (gaps 0.75 · 0.85 · 0.90 — all different; each lands 0.11 s
later, 0.21 s off the groove's beats, so they never lock into a pulse).

**Everything else**

| at (s) | bar·beat | sound | dB | event |
|---|---|---|---|---|
| 0.000 | 1·1 | `synth-intro` | 0 | **bed instruments, not events**: drone, pulse, plucks, strum (§3) |
| **1.500** | **1·4** | `hit1` | −13 | **HIT 1** — the flaps settle on dashes; alone in the comma gap, a 0.1 s decay, gone by 0.35 s |
| 2.000 | 2·1 | `tanker` | −16 | **the tanker**: a pass-by: tyre rumble swelling in from 2.0 (0.45 s) and out by ~2.9 as the truck drives straight through (one ElevenLabs take shaped in code). The air-brake hiss was dropped in the build: the truck no longer stops |
| 8.000 | 5·1 | `whoosh-flip` | −17 | the FLIP, 0.42 s (8.0 → 8.42), peak ~8.2; **gone before 8.5** |
| **9.000** | **5·3** | `hit2` | −9 | **HIT 2** — the amount lands; `इतना` starts on it; 0.14 s decay |
| 20.000 | 11·1 | `whoosh-shrink` | −21 | the card shrinks into the bubble, 0.50 s, under `इंडियन ऑयल` |
| 22.000 | 12·1 | `whoosh-rise` | −21 | the board rises out of the bubble, 0.56 s, under `नजर` |
| 23.000 → 26.000 | 12·3 → 14·1 | `riser` | −15 | 3 s: noise sweep 200 → 6 000 Hz with a rising A (220 → 880 Hz, the dominant of D); **ends on bar 14's downbeat** |
| **28.000** | **15·1** | `hit3` | −13 | **HIT 3** — the end card settles; the groove's own sting lands on 28.0 (−1 ms) too; 0.28 s decay with a bell shimmer; **in the 0.1 s gap between `बात` and `कीजिए`** |

Hits are phone-safe copies of the films' `subhit` and `brandhit` (the originals are almost pure 20–120 Hz; a boosted,
tanh-clipped, high-passed copy is mixed back in, as in reel 02), shaped with a short exponential tail. Whooshes and the
riser are synthesised (`dsp.py`, seeded). Nothing sounds in 8.4945–9.0.

## 5. Mix (`kit/audio/mix.mjs` → `build/audio/mix.wav`, then `build/finish.py`)

- **Voice**: the files as gated, 0 dB.
- **Bed (the groove)**: gain **−8 dB**, 2.5 kHz pocket −4 dB, sidechain-ducked under the voice with threshold **0.010**,
  ratio 8, attack 15, release 350 (reel 02's setting), fade-out 0.6 s.
- **Synth intro and all effects**: not ducked.
- **Master**: a look-ahead peak limiter (ceiling 0.30, attack 5 ms, release 60 ms, latency compensated), then the kit's
  **two-pass loudnorm** to −16 LUFS / −2 dBTP, then `finish.py`: the last −0.06 dB so the two meters straddle −16.00, and the
  silent beat zeroed sample-accurately. Pass 1 read −23.6 LUFS, −10.3 dBTP; loudnorm ran in **linear** mode (one constant
  gain, +7.55 dB). The stem-sum and `mix.wav` are aligned to the sample (checked by cross-correlation, lag 0).
- **Measured** on `mix.wav`: **30.000 s (1 440 000 frames), 48 kHz, stereo, 24-bit.** Integrated **−15.95 LUFS (ebur128) / −16.06
  (loudnorm)**, loudness range 2.5 LU, **true peak −2.8 dBTP**, DC offset 0.001.
- **Balance** (final scale, stems rendered separately; the voice averages **−17.4 dBFS** while speaking): the ducked
  groove sits **17.1 dB under L3, 12.6 under L4, 14.0 under L5, 18.0 under L6, 22.1 under L7, 13.3 under L8**. Where nobody
  speaks it comes back to −19.7 … −21.2 dBFS (11.0–12.1, 14.0–16.3, 18.0–20.1, 23–26 s) — the usual 10–12 dB breath.
  In bars 1–3 the synth intro averages −27 dBFS, about 9 dB under the voice.
- **Hits against the voice** (rms of the first 0.4 s, final scale): hit 1 −22.1 against the voice's −20.4 (it sits in the
  gap; the voice there is only `कब`'s start); hit 2 −17.1 against `इतना` −15.5 (1.6 dB under, but 90 % of the hit is below
  150 Hz); hit 3 −18.5 against −17.9, in the gap between two words. Peaks: −9.5 · −5.5 · −9.4 dBFS.
- **Effects against the voice**: the word-row clacks peak at −7.8 … −9.4 dBFS (voice peaks −2 … −9); digit clacks −11 … −13; the
  whooshes under `इंडियन ऑयल` and `नजर` peak −17.4 / −17.5 dBFS, 15 dB under the voice (rms).
- **AAC copies** of `mix.wav`: 192 k → true peak **−2.8 dBTP**; 128 k → −2.3; **64 k → −0.7**. The WhatsApp copy needs its own
  limiter or a lower target (DIRECTION §9).

## 6. What the picture must respect

1. **Lock to §2's word map and §4's cue times.** The mix is sample-placed to the nearest millisecond. Hits: **1.500 · 9.000 · 28.000**.
2. **The silent beat is 8.5–9.0 and it is digital zero.** The bed stops at 8.493 (the FLIP whoosh ended at 8.42, L3 at 7.96).
   Anything that must be *heard* leaves a mark before 8.49 or after 9.00.
3. **Hook.** `कितना जमा करना है,` ends 1.43 → 0.22 s of nothing with **hit 1 alone at 1.500** → `कब तक?` 1.65–2.16. The poster's
   two questions are on screen from frame 0; `कब` appears with the voice at 1.65, not before. The riffle (0.50) is under
   `जमा`; the settle clack is under hit 1.
4. **Pain.** `शून्य` **3.06** (the `0` flip, starts 3.00) → `नीचे` **3.72** (the `−`, starts 3.60) → `गिनती` **4.75** (`3 दिन`, starts 4.65);
   `शुरू` 5.28–5.58. The first title may enter on the bar-2 downbeat (2.0) — the voice is 0.46 s behind it (`खाता` 2.46); the
   second title (`गिनती शुरू।`) should enter by 4.7, not 4.0. The tanker is 2.0–2.95 and the `0` flip is 3.00: the truck is
   quiet before the debit, they do not overlap.
5. **Turn.** The strum + groove are on **6.000**; `यह` 6.16, `हिसाब` 6.39, `आपके` 7.08, `फोन` **7.51** (the tap), `पर` 7.82, done 7.96. The
   FLIP starts 8.0 and its whoosh is gone by 8.42.
6. **Proof 1.** `इतना` **9.00** with hit 2 and the amount row; `जमा करना है` 9.32–10.24 (L4 still speaks for 2.0 s, so the camera's
   move to DUE DATE at 10.0 is mid-phrase); `तारीख` **10.45** (the date row's flip starts 10.32); `तक` ends 11.01. No voice 11.0–12.2.
7. **Proof 2.** `कितने` 12.21, `दिन` **12.54**, `बाकी` 12.76; `यह भी` 13.31–13.78. **Days flips: 12.50 · 13.25 · 14.10 · 15.00** (15.60 until the build moved it). No voice from
   13.78 to 16.36, so 14.10 and 15.00 are heard on their own, with the bed.
8. **Data moment.** `क्रेडिट` **16.64**, `कितना` 17.09, `बचा` **17.50** (bar 9 beat 4); no voice 17.92–20.18. The equation (17.0 / 17.8) and the push over the card's whole bar (74% / 26%) are silent.
9. **Bubble and payoff.** The shrink starts 20.00; `इंडियन` 20.18; `हिसाब` 21.01; `एक` 21.70, `नजर` **21.95**, `में` 22.27, done **22.39**. The
   board rises at 22.00 (`नजर`); its rows set at **22.40** with a clack just after the voice ends. **No voice 22.4 → 26.28.**
10. **Strongest moment.** The riser ends and the bed peaks on **26.000**. `डीलर` **26.28**, `कवच` **26.68** (ends 27.08); the row folds
    are 26.00 and 26.12 (26.20 / 26.60 until the build moved them); `हमसे` 27.45, `बात` **27.80** (ends 28.00), `कीजिए` **28.02**–28.36. The rows' fold into the rule can run
    26.0–27.4; the label and number writing in at 27.5 sit under `हमसे`.
11. **End card.** **28.000**: hit 3 and the groove's sting together, in the hole between `बात` and `कीजिए`. At rest from 28.0;
    the voice is done at 28.37, then 1.6 s of bed decay and a 0.6 s fade.
12. If the director wants a different start for a line, the line files are at 0 s; a start is the only number to change
    in `build/place.py` (`START`), then `bash build/build-audio.sh`. A flip time is one number in `build/cues.py`.

## 7. Beat-map summary (what to key on)

| t (s) | bar·beat | audio event |
|---|---|---|
| 0.198 | 1·1 | L1 begins (`कितना` 0.19) |
| 0.50 | 1·2 | riffle clack (lands 0.61); pulse at 0.0 |
| 1.00 | 1·3 | pluck F5 |
| **1.500** | 1·4 | **HIT 1** alone in the gap; `कब` 1.65 |
| 2.00 | 2·1 | pulse + pluck A4 (bar 2); the tanker begins; L1 done 2.16 |
| 2.46 | 2·1 | L2 `खाता`; the truck mid-pass (rumble 2.0–2.9) |
| 3.00 → 3.06 | 2·3 | `0` flip (lands 3.11) on `शून्य` 3.06 |
| 3.60 → 3.72 | 2·4 | `−` flip on `नीचे` 3.72 |
| 4.00 | 3·1 | pulse + pluck D5 |
| 4.65 → 4.75 | 3·2 | `3 दिन` flip on `गिनती` 4.75 |
| 5.00 | 3·3 | pulse + pluck A5; `शुरू` 5.28 → 5.58 |
| 5.5 → 6.0 | 3·4 | **nothing** (the turn is a change) |
| **6.000** | 4·1 | **THE TURN**: strum + groove + hand drum; `यह` 6.16 |
| 7.51 | 4·4 | `फोन` (the tap, 7.50); L3 done 7.96 |
| 8.000 | 5·1 | FLIP whoosh (0.42 s) |
| **8.4945 → 9.000** | 5·2 | **SILENCE** (digital zero) |
| **9.000** | 5·3 | **HIT 2**, bed back, `इतना` 9.00, amount flips |
| 10.32 → 10.45 | 6·1 | date flip on `तारीख`; L4 done 10.98 |
| 12.21 | 7·1 | L5 `कितने`; **12.50** days flip 1 (`दिन` 12.54) |
| 13.25 | 7·3 | days flip 2 (`यह` 13.31); L5 done 13.87 |
| 14.10 | 8·1 | days flip 3 (no voice) |
| 15.00 | 8·3 | days flip 4 (no voice) |
| 16.64 · 17.50 | 9·1 · 9·4 | `क्रेडिट` · `बचा` (L6 done 17.92) |
| 18.0 → 22.0 | 10·1 | Hold (bed 1.6 dB lower); L7 `इंडियन` 20.18 |
| 20.000 | 11·1 | shrink whoosh |
| 21.95 · 22.000 | 12·1 | `नजर` · board-rise whoosh; L7 done 22.39; rows-set clack **22.40** |
| 23.000 → 26.000 | 12·3 → 14·1 | riser; the bed builds |
| **26.000** | 14·1 | **riser ends, bed peaks**; `डीलर` 26.28; fold clacks 26.00 · 26.12 |
| 26.68 | 14·2 | `कवच` |
| 27.45 · 27.80 | 14·4 | `हमसे` · `बात` |
| **28.000** | 15·1 | **HIT 3 + sting** in the hole before `कीजिए` 28.02; L8 done 28.37 |
| 29.4 → 30.0 | | bed fade-out |

## 8. Changes outside this folder

**None.** `kit/audio/mix.mjs` already has the optional `master` limiter and `bed.duck` override from reel 02; `mix.json` uses
both. No production system was touched; the ElevenLabs key was read from `mdg-demo/.env` and never printed or written.
`graphify update` was not run (it writes `graphify-out/`, outside this folder).

## 9. Risks to check by ear (nobody has listened)

1. **L1's ending** (`कब तक?`): the measured pitch *falls* (251 → 128 Hz) though Scribe wrote `?`. If it sounds like a statement, record it again
   (`node kit/audio/voice.mjs marketing/reels/03-credit-dod --only L1 --force`, then delete `audio/L1.raw.wav` and `audio/L*.pregate.wav`,
   `tighten.py`, `words.mjs`, `build-audio.sh`). One line costs one call; the other seven are first takes and unheard.
2. **The cuts**: seven comma pauses were shortened (cross-faded, all inside silence), L8's full stop to 0.38 s. Listen to
   `कवच। हमसे` — it should feel like a full stop, not a comma.
3. **Hit 3 against `बात | कीजिए`**: the hit lands in a 0.1 s hole, which holds only if L8's take is the one measured. The brand-hit shimmer
   decays over 0.3 s under `कीजिए`; if that word is hard to catch, lower hit 3 (`cues.py`, −13 → −16).
4. **Hit 2 under `इतना`**: level with the voice (1.6 dB under), 90 % of it below 150 Hz — a phone speaker mostly hears its 150–500 Hz part. If `इतना` is
   masked, −9 → −12.
5. **The clacks** (synthesised "tk" + "thock" + rebound): measured on grid and in level, but they may sound toy-like or too
   woody. The digit clacks (`0`, `−`, the amount) peak −11 … −13 dBFS and land on word onsets; they may be inaudible under
   `शून्य` and `नीचे`. Raise by 3 dB in `cues.py` if so. The word-row clacks are the loudest effects after the hits.
6. **The tanker** (one ElevenLabs rumble take, shaped): chosen by envelope and spectrum, never heard. **Resolved in the build:**
   the hiss is dropped and the truck drives straight through (gone by 2.95), so nothing lands just before the `0` flip
   (the picture shows no cause and effect).
7. **The synthesised plucks, pulse, strum and drone**: additive synthesis, measured in tune and on the grid, but possibly thin or
   toy-like next to the model's groove. Plucks peak −21 dBFS pre-master, the strum −18; the drone is −38 dBFS. If they annoy,
   lower `PL` / `ST` / `DRONE_DB` in `make-bed.py`.
8. **The step at the turn is +10.2 dB** (reel 02: +6.3). It should read as "colour enters", not as a cut. If it is harsh, lower bar 4
   (`TARGET` in `make-bed.py`) or raise the intro.
9. **The groove's Hold (bars 10–11)** is the same pattern, quieter: it may not feel calmer. The onset detector finds a model drum fill at about
   **21.75**, 0.25 s before the build, under `एक` (ducked; not heard).
10. **Ducking**: the bed breathes by 10–12 dB between speech and gaps (reel 02's recipe). If it pumps, raise `DUCK_THRESHOLD`
    or lengthen `DUCK_RELEASE` in `cues.py` (`python3 tune.py` prints the effect of each in 40 s).
11. **The riser** (−15) ends at 26.0 and drops out 40 ms early; the bed peak lasts only 0.25 s before the voice comes in.
12. **Low-bitrate copies**: 64 k AAC is −0.7 dBTP (§5).
13. For the record: no time-stretch or pitch change; every line is as spoken except the seven shortened pauses.

## 10. Reproduce

```
node marketing/reels/kit/audio/voice.mjs marketing/reels/03-credit-dod           # records only changed lines (done; first takes kept)
python3 marketing/reels/03-credit-dod/build/tighten.py                            # the seven comma pauses (keeps audio/L*.raw.wav)
node marketing/reels/03-credit-dod/build/words.mjs                                # word times from speech-to-text
node marketing/reels/03-credit-dod/build/gen-music.mjs build/music-plan.groove.json audio/bed-groove-1.mp3   # already run (the three minor-* plans: rejected)
bash marketing/reels/03-credit-dod/build/build-audio.sh                           # place (gate + words) · make-sfx · make-bed · cues · mix.mjs · finish · verify
python3 marketing/reels/03-credit-dod/build/stems.py && python3 marketing/reels/03-credit-dod/build/events.py && python3 marketing/reels/03-credit-dod/build/balance.py   # balance (stems are large; delete audio/stem-*.wav, mix-pre.wav after)
python3 marketing/reels/03-credit-dod/build/tune.py                               # try BED_GAIN_DB / DUCK_* overrides: the duck depth and the gap levels
python3 marketing/reels/03-credit-dod/build/check-grid.py audio/bed-final.wav 6.2 29.5      # the bed against the 0.5 s grid
```

`audio/mix.wav` is the finished track. Do **not** re-run `kit/audio/mix.mjs` on its own — it would give back the version
without `finish.py`'s trim and the zeroed silent beat; `build-audio.sh` runs the whole chain.
