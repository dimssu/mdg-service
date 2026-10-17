# Reel 02 · Stock check — audio

Written by the sound director, 17 Oct 2026. Everything below was **measured** (ffprobe, ffmpeg
`ebur128` / `loudnorm`, numpy, ElevenLabs speech-to-text for word times). **Nothing was auditioned
by ear** — there is no playback in this session. Listen once before the render; §9 is the checklist.

Files (all in `build/`): `script.json` (+ `script.js` mirror, `window.SCRIPT`) · `mix.json` ·
`music-plan.groove.json` and `music-plan.minor.json` (the two plans that were used) ·
`music-plan.take1.json` (the first plan, rejected) · `audio/mix.wav` (the finished track: **30.000 s,
48 kHz stereo, 24-bit, −16.0 LUFS, −2.7 dBTP**).

## 1. Mode

**Voice + music.** The reel explains a rule (the asymmetric band: 400 + 50 on the shortage side,
400 on the excess side) and a muted first play would lose the *why*. Every spoken idea is also on
screen (DIRECTION §2), so a muted play still works.

## 2. Voice

The films' Hindi voice, `eleven_multilingual_v2`, stability 0.45 · similarity 0.8 · style 0 · boost on,
neighbours as `previous_text` / `next_text`. **238 characters** (Python `len`; ceiling 240). TTS text
uses only `,` `।` `?`; acronym hyphenated; no nuqta except the letter `ड़` in `उड़`, which has no
other spelling; no digit, no phone number. The lines are **word for word the prompt's**.

| id | start | voiced (first sound → last sound) | chars | TTS text | on screen |
|---|---|---|---|---|---|
| L1 | 0.185 | 0.185 → 2.205 | 27 | `एक ही अंतर, पर फैसला उल्टा।` | `−430 L: सीमा में।` / `+430 L: सीमा से बाहर।` |
| L2 | 2.450 | 2.501 → 5.036 | 42 | `इंस्पेक्शन के दिन पता चले, तो देर हो चुकी।` | `इंस्पेक्शन के दिन` / `पता चले —` · `तो देर हो चुकी।` |
| L3 | 5.660 | 5.727 → 7.918 | 33 | `अब डी-एस-आर में स्टॉक वेरिएशन भी।` | `अब DSR में —` / `स्टॉक वेरिएशन` |
| L4 | 11.780 | 11.878 → 14.449 | 36 | `तेल उड़ सकता है, हवा से आ नहीं सकता।` | `तेल उड़ सकता है —` / `हवा से आ नहीं सकता।` |
| L5 | 15.050 | 15.050 → 17.291 | 27 | `ज्यादा निकले, तो सीमा छोटी।` | `ज़्यादा पर सीमा:` / `सिर्फ़ 400 L` · `+430 L — सीमा से` |
| L6 | 19.420 | 19.420 → 22.879 | 48 | `सीमा में है या नहीं, नोटिस बनने से पहले पता चले।` | `सीमा से बाहर हो —` / `फ़ोन पर दिखे।` · `नोटिस बनने से पहले` / `पता चले।` |
| L7 | 26.310 | 26.310 → 28.773 | 25 | `डीलर कवच। हमसे बात कीजिए।` (one take) | end card: `बात कीजिए` + number (written, never spoken) |

*Voiced* = ffmpeg `silencedetect` at −42 dB, so L5, L6 and L7 include a faint lead-in (−30 to −40 dB)
of 0.1 s; the **loud** first word is in the word map below. Speech-to-text heard every word of every
line (`heard` in `script.json`).

**Rules from the brief — all met:**

| rule | limit | measured |
|---|---|---|
| L1 runs at most one beat into bar 2 | ≤ 2.344 | ends **2.205** |
| L3 may run into bar 5 (one beat) | ≤ 7.969 | ends **7.918** (0.05 s clear) |
| L5 ends before the silent beat | < 17.8125 | ends **17.291** |
| L6 may tail into bar 13 (one beat) | ≤ 22.969 | ends **22.879** (0.09 s clear) |
| the silent beat has no voice | 17.8125–18.28125 | none (L5 ends 17.29, L6 starts 19.42) |
| L7 is one take, number not spoken | | one take; no digit spoken |
| the trim-line-2 fallback | — | **not needed** |

### What was edited in the takes, and why

ElevenLabs leaves a long hole after some commas. Four takes had one that pushed the line past its bar
(L1 at 0.84 s, L7 at 0.78 s). `build/tighten.py` shortens each hole **inside** the quiet stretch (every
sample removed is below −45 dB, centred, 8 ms cross-fade), so no word is touched; the untouched take is
kept as `audio/L*.raw.wav`:

| line | comma pause before | after | removed |
|---|---|---|---|
| L1 `अंतर, पर` | 833 ms | 280 ms | 553 ms |
| L2 `चले, तो` | 364 ms | 240 ms | 124 ms |
| L5 `निकले, तो` | 409 ms | 250 ms | 159 ms |
| L7 `कवच। हमसे` | 778 ms | 400 ms | 378 ms |

Speech-to-text was re-run on the edited files and heard the same words.

**L3 is take 4 of 8.** The first take (and takes 5 and 8, the fast ones) end on a rising pitch jump
(F0 about 140 → 180 Hz in the last 0.2 s) and Scribe wrote `?` or no `।`; the slower takes 2, 3, 4, 7
end falling (to about 80 Hz) and Scribe wrote `।`. Take 4 is the shortest of those. It costs 0.4 s over
the first take, which is why L3 now ends at 7.918. All eight are in `audio/l3-takes/`. The F0 tracker is
crude (octave jumps); it is evidence, not proof — check this line by ear first.

### Word map (reel time, seconds; start good to about ±0.05 s)

Scribe's word starts were snapped to the voice's own energy rise where there was one; ends are
Scribe's and run up to 0.03 s past the true end — use each line's *voiced* end above.

**The key words**

| word | line | starts | ends | lands on |
|---|---|---|---|---|
| `इंस्पेक्शन` | L2 | **2.485** | 2.97 | in the macro pull-out (bar 2·2–2·3) |
| `पता` / `चले` | L2 | 3.405 / **3.665** | 3.93 | `चले` ends 3.93, just after bar 3 starts |
| `तो` (`तो देर हो चुकी।`) | L2 | **4.205** | | **bar 3 beat 2 = 4.219** |
| `वेरिएशन` | L3 | **7.245** | 7.74 | the tap is 7.031 (on `स्टॉक` 6.995); the FLIP 7.5 is mid-word |
| `उड़` | L4 | **12.19** | 12.36 | **bar 7 beat 3 = 12.1875** (the 50 L part lifts) |
| `हवा` | L4 | **13.24** | 13.46 | bar 8 downbeat 13.125 + 0.115 |
| `ज्यादा` | L5 | **15.075** | 15.47 | bar 9 downbeat 15.0 + 0.075 (the mirror turn) |
| `नोटिस` | L6 | **20.975** | 21.40 | bar 12 beat 2 is 21.094 — the word is **0.12 s earlier** |
| `बनने` | L6 | **21.44** | 21.64 | |
| `पहले` | L6 | **21.86** | 22.38 | |
| `चले` (end of payoff) | L6 | **22.695** | 22.88 | ends 0.09 s inside the bar-13 allowance |
| `कवच` | L7 | **26.82** | 27.23 | bar 15 beat 2 = 26.72 + 0.10 |
| `बात` | L7 | **28.12** | 28.41 | **bar 16 downbeat = 28.125** |

**Every line**

| line | words (start s) |
|---|---|
| L1 | `एक` 0.20 · `ही` 0.49 · `अंतर` 0.655 · *(0.25 s pause)* · `पर` 1.18 · `फैसला` **1.425** (hit 1 is 1.406) · `उल्टा` **1.885** (bar 2 = 1.875) |
| L2 | `इंस्पेक्शन` 2.485 · `के` 3.055 · `दिन` 3.19 · `पता` 3.405 · `चले` 3.665 · *(0.27 s pause)* · `तो` 4.205 · `देर` 4.41 · `हो` 4.67 · `चुकी` 4.81 |
| L3 | `अब` 5.715 · `डी-एस-आर` 5.99–6.62 · `में` 6.68 · `स्टॉक` 6.995 · `वेरिएशन` 7.245 · `भी` 7.82 |
| L4 | `तेल` 11.86 · `उड़` 12.19 · `सकता` 12.465 · `है` 12.78 · *(0.36 s pause)* · `हवा` 13.24 · `से` 13.565 · `आ` 13.72 · `नहीं` 13.92 · `सकता` 14.17 |
| L5 | `ज्यादा` 15.075 · `निकले` 15.57 · *(0.27 s pause)* · `तो` 16.185 · `सीमा` 16.465 (camera to the band row is 16.406) · `छोटी` 16.855 (bar 10 = 16.875) |
| L6 | `सीमा` 19.53 · `में` 19.82 · `है` 20.00 · `या` 20.20 · `नहीं` 20.34 · *(0.42 s pause)* · `नोटिस` 20.975 · `बनने` 21.44 · `से` 21.73 · `पहले` 21.86 · `पता` 22.415 · `चले` 22.695 |
| L7 | `डीलर` 26.405 (soft lead-in from 26.31) · `कवच` 26.82 · *(0.42 s pause)* · `हमसे` 27.645 · `बात` 28.12 · `कीजिए` 28.425 |

### What moved from the draft starts, and why

| line | draft | now | why |
|---|---|---|---|
| L1 | 0.10 | 0.185 | so `फैसला` starts on the pin's landing and `उल्टा` on bar 2's downbeat; with the pause trimmed it ends 2.205, inside the beat of allowance |
| L2 | 2.00 | 2.45 | L1 now ends 2.205; a 0.3 s sentence gap first. `तो` lands on bar 3 beat 2 |
| L3 | 5.70 | 5.66 | take 4 is slower (ends 7.918, limit 7.969); the voice still enters 0.09 s after the turn, so the strum is heard first |
| L4 | 11.35 | 11.78 | `उड़` on bar 7 beat 3 (the part lifts) and `हवा` just after bar 8's downbeat |
| L5 | 15.10 | 15.05 | the pause trimmed; it now ends 0.52 s before the silent beat |
| L6 | 19.30 | 19.42 | `नोटिस` as early as the tail allowance lets it be (it cannot reach bar 12·2 = 21.094 without ending past 22.969) |
| L7 | 26.35 | 26.31 | the loud first sound is 26.405, 0.155 s after the hit; the pause trimmed so `बात` lands on bar 16 |

## 3. Music

**Plan.** `music_v1`, 128 BPM, key D, instrumental (negatives: vocals, choir, lyrics, EDM drop,
dubstep, 808, sub bass, heavy kick, guitar solo, cymbal crashes, corporate uplifting). Five sections in
whole bars, as the brief asks: *Worry* (bars 1–3, 5.625 s) → *The turn* (4–9, 11.25 s) → *Hold* (10–11,
3.75 s) → *Payoff* (12–14, 5.625 s) → *Sting and settle* (15–16, 3.75 s).

**Three generations, one rejected** (the cap reel 01 set):

| # | plan | what came back | verdict |
|---|---|---|---|
| 1 | `music-plan.take1.json`: all five sections in one 30 s request | 30.041 s. **85–95 % of the power below 300 Hz** (centroid 190–260 Hz), flat −17 → −10 dB from bar 2 to 14, **bar 1 silent** (−88 dB), no change in F vs F♯ at the turn, sting only −23 dB | **rejected** (the same failure as reel 01's take 1: a tanpura drone swallowed the plan) |
| 2 | `music-plan.groove.json`: **no intro, no drone, no bass**; the groove starts on beat 1; four sections = bars 4–16 only (24.375 s) | 24.424 s. Centroid 600–1 250 Hz, 15–37 % of power above 1 kHz, **F♯ outweighs F about 2:1**, about 8 plucks per bar (eighth notes). Section lines land **+23 … +33 ms** late, always by the same amount (16.875 +24, 18.75 +26, 20.625 +23, 24.375 +23, 26.25 +33); first attack +30 ms; no tempo drift (128.0) | **used** for bars 4–16 |
| 3 | `music-plan.minor.json`: one 7.5 s section, a tanpura drone on D, no percussion | 7.523 s. Steady D3 / D4 / D5, nothing else, −21 dB | **used** for bars 1–3 |

Splitting the plan is the fix for reel 01's problems (a silent first bar, a late first groove and a
splice): the groove file is already on the grid from its first sample, and the opening is a separate
take that cannot be late.

**How the bed is built** (`build/make-bed.py`, deterministic; every edit is on a bar or beat line):

1. **Bars 4–16 = `bed-groove-1.mp3`, advanced 26 ms** (its constant lag) and laid at **5.625 s**. Its own
   Groove / Hold / Payoff / Sting sections then fall on bars 4 / 10 / 12 / 15.
2. **Bar levels** (dB added to the file, smooth over 0.2 s): bar 4 +2.3 · 5 +2.4 · 6 +1.3 · 7 +1.7 ·
   8 −0.5 · 9 −1.7 · 10 −3.7 · 11 −4.4 · 12 −3.0 · 13 −1.6 · **14 +1.2 (peak)** · 15 +2.0 · 16 0.
   The model's Payoff was only 0.3 dB louder than its Groove, so the climb into bar 14 is shaped here
   (bed RMS: bars 4–7 −22.6 … −22.5, 8–9 −20.9 / −21.0, hold −23.9 / −23.3, build −21.5 / −19.8,
   **peak −17.0**, sting −21.6; before the mix's −8 dB). The model's Hold is not sparser, only quieter.
3. **The silent beat is cut into the file**: the bed is zero from **17.8055 s to 18.2778 s** (a 8 ms fade
   ends at 17.805; it comes back 3.5 ms before the beat, because the groove's own downbeat attack sits
   2–4 ms ahead of the grid). Cutting it here, not with the mix's 30 ms gate, keeps the +30 downbeat sharp.
4. **Bars 1–3 are `audio/synth-intro.wav`** and are *not* ducked, because the voice is nearly continuous
   there and a ducked pulse would vanish: the model's D drone (with 368 / 735 / 1 470 Hz notched, so it
   carries no major third), a soft low pulse on 0.0 · 1.875 · 2.8125 · 3.75, and dry high plucks
   (additive synthesis, 1.1 s) on the beat: **F5 at 0.469, A5 at 0.9375** (the pin lifts, then the apex),
   D5 at 2.344, F5 at 3.281, A4 at 4.6875. Bar 1 beat 4 (1.406) is the hit and **bar 3 beat 4 (5.156) is
   left empty** so the turn is a change. Everything sits on the grid by construction.
5. **The turn at 5.625 (bar 4's downbeat)**: the groove's first stroke lands there, with a plucked **D-major
   strum** (D4 F♯4 A4 D5 A5, 18 ms apart) and a hand-drum stroke from the synth stem. There is no cut.

**Major and minor, measured** (energy at the note frequencies F and F♯ over four octaves; reel 01 could
not prove this):

| span | F vs F♯ |
|---|---|
| the raw model drone | −3.7 dB (a hair towards F♯) |
| bars 1–3 as built (notched drone + F plucks) | **+14.7 dB towards F — D minor** |
| the strum at 5.625 | **−51 dB — pure F♯** |
| groove, bars 4–9 | **−16.5 dB — D major** |
| payoff, bars 12–14 | −12.5 dB |

At the turn the music alone (no voice, no effects) steps from −32.6 dBFS in bar 3 to −26.3 in bar 4
(+6.3 dB) and the share of its power above 1 kHz goes from 1.0 % to 4.9 %.

**Grid of the finished bed** (128 BPM, beat 0.46875 s): the downbeat attacks are at 5.625 **+1 ms** ·
16.875 −2 · 18.75 0 · 20.625 −3 · 24.375 −3 · 26.25 +7. Beat by beat, 5.6–17.7 s: median +1 ms,
81 % within ±25 ms (the misses are off-beat notes winning the "strongest attack" test, ±45–52 ms);
18.3–26.2 s: median −5 ms, **100 % within ±25 ms**.

## 4. SFX cue sheet (`build/mix.json`; the times are also in `script.json` → `cues`)

At most one sound per event. The three hits are **1.40625 · 18.28125 · 26.25**. The two organic
sounds are the dip-rod slide (ElevenLabs, take 1 of 2, trimmed) and the two hits (the films' `subhit`
and `brandhit` with the phone-safe copy of reel 01, here with their tails shortened where the voice sits
on them). Ticks, whooshes, tock and riser are synthesised (`build/dsp.py`, seeded). Gains are dB on the
file's own level; effects are not ducked.

| at (s) | bar·beat | sound | dB | event |
|---|---|---|---|---|
| 0.000 | 1·1 | `synth-intro` | 0 | **bed instruments, not events**: drone, pulse, plucks, strum (§3) |
| 0.020 → 0.300 | 1·1 | hairline ×5 | −12 … −15 | the poster scale's ticks settle (0.020 0.047 0.106 0.192 0.300) |
| **1.406** | **1·4** | `hit1-short` | −14 | **HIT 1** — the pin lands at +430 |
| 1.406 | 1·4 | `tock` | −16 | soft wooden tock, the pin lands |
| 2.460 → 3.180 | 2·2 → 2·4 | hairline ×9 | −12 … −15 | the scale's ticks become the rod's graduations (2.460 2.481 2.528 2.596 2.682 2.784 2.902 3.034 3.180) |
| 3.220 | 2·3 | `slide` | −18 | **metal slide**, the dip rod rises; audible 3.22–3.80, loudest 3.58 |
| 7.540 | 5·1 | `whoosh-flip` | −15 | the FLIP (move starts 7.5; whoosh is 40 ms behind it so it clears the last syllable of L3); peak 7.78 |
| 11.300 → 11.850 | 7·1 | hairline ×7 | −12 … −15 | the instrument re-forms (11.300 11.326 11.385 11.469 11.576 11.703 11.850) |
| 15.000 | 9·1 | `whoosh-mirror` | −16 | the mirror turn, 0.94 s long, loudest 15.47 (edge-on) |
| 15.938 | 9·3 | `tock` | −16 | the pin lands at +430 again |
| **18.281** | **10·4** | `subhit-phone` | −5 | **HIT 2** — NOT WITHIN +30, after the silent beat |
| 19.690 | 11·3 | `whoosh-shrink` | −15 | the card shrinks into the phone; peak 19.88 |
| 20.625 → 24.375 | 12·1 → 14·1 | `riser` | −19 | 3.75 s, noise sweep 200 → 6 000 Hz with a rising A (220 → 880 Hz, the dominant of D); **ends on bar 14's downbeat** |
| 21.100 → 21.550 | 12·2 | hairline ×5 | −12 … −15 | the bare band returns (21.100 21.143 21.238 21.376 21.550) |
| **26.250** | **15·1** | `hit3-short` | −12 | **HIT 3** — the end card; the bed's own sting lands at 26.25 (+7 ms) too |

The tick cascades are not clocks: each gap is longer than the last (0.02 s up to 0.17 s), three
pitches (2.75 / 3.3 / 3.95 kHz), loudest in the middle. Nothing sounds in 17.8125–18.28125.

**Left out on purpose, so you can ask for them** (the brief says "nothing else"; the storyboard v1 had
them): a whoosh at 12.188 for the 50 L part (it is not a camera move); a tap tick at 7.031; ticks at
9.844 · 10.313 · 10.781 for the parts flying up (bars 6–7 carry no voice, so they would be heard).
Adding one is a line in `build/cues.py` and a re-mix (§10).

## 5. Mix (`kit/audio/mix.mjs` → `build/audio/mix.wav`)

- **Voice**: the files as recorded, 0 dB.
- **Bed (the groove)**: gain **−8 dB**, 2.5 kHz pocket −4 dB, sidechain-ducked under the voice with
  **threshold 0.010** (the films' 0.03 ducked it only 8–13 dB here), ratio 8, attack 15, release 350,
  fade-out 0.6 s.
- **Synth intro and all effects**: not ducked.
- **Master**: a look-ahead peak limiter (ceiling 0.30, attack 5 ms, release 60 ms, latency
  compensated), then the kit's **two-pass loudnorm** to −16 LUFS / −2 dBTP, then `build/finish.py`, which
  trims the last −0.04 dB so the two meters (ebur128 and loudnorm) straddle −16.00.
- **Why a limiter**: speech peaks are about 15 dB over its average. Without it the true peak before
  normalising was −5.5 dBTP, the +6.6 dB loudnorm gain could not fit under −2 dBTP, and loudnorm fell back
  to its *dynamic* mode and rode the gain by ±1.5 dB. With it the peak is −10.3 dBTP and loudnorm runs in
  **linear** mode (one constant gain, +7.6 dB). The limiter acts 4.1 % of the time; when it acts it takes a
  median 1.7 dB, at worst 4.1 dB, off a speech peak; the average level changes by 0.5 dB.
- **Measured** on `mix.wav`: **30.000 s (1 440 000 frames), 48 kHz, stereo, 24-bit.** Integrated
  **−15.97 LUFS (ebur128) / −16.04 (loudnorm)**, loudness range 3.9 LU, **true peak −2.7 dBTP**.
  Per-bar RMS: −18.2 −18.0 −20.6 −17.9 −23.8 −23.0 −19.2 −19.9 −18.6 −16.8 −17.8 −18.3 −20.7 −18.4 −16.1 −24.4.
- **Balance** (final scale, stems rendered separately): the voice averages −18.1 dBFS while he speaks. The
  groove sits **12.8 dB under him in L4, 14.4 in L5, 17.2 in L6, 17.0 in L7** and 19.4 in L3. In the
  voice-free bars 5–6 it is −23.1 dBFS (5 dB under his level) and in bars 13–14 −19.4 (as loud as he was).
  In bars 1–3 the whole synth intro (drone, pulse, plucks) averages −31 dBFS, about 13 dB under him.
- **Hits against the voice**: hit 1 and `फैसला` are level (−19.1 dB each over the first 0.4 s); hit 3 sits
  3 dB under `डीलर कवच`; hit 2 has the silence to itself and is the loudest event (limited at the
  ceiling).
- **AAC copies** of `mix.wav`: 192 k → true peak **−2.3 dBTP**; 128 k → −1.4; 64 k → −1.3. The
  WhatsApp copy needs its own limiter or a lower target (DIRECTION §9).

## 6. What the picture must respect

1. **Lock to §2's word map and §4's cue times.** The three hits are 1.40625, 18.28125, 26.25. The mix is
   sample-placed to the nearest millisecond.
2. **L1 → L2 → L3 are later than the storyboard v1 estimates.** In particular **`इंस्पेक्शन` is at 2.485**
   (not 2.00), **`तो देर हो चुकी।` is at 4.205 = bar 3 beat 2** (not bar 3's downbeat), and **L3 is slower
   than v1 assumed** (ends 7.918, so the FLIP at 7.5 lands mid-`वेरिएशन` and `भी` finishes after it).
3. **L4**: `उड़` on bar 7 beat 3 (12.19, the lift) and `हवा` at 13.24 (the hold, bar 8). The voice does not
   start with the bar: `तेल` is at 11.86.
4. **L6**: the payoff word `नोटिस` is at **20.975**, not on bar 12·2 (21.094); `पता चले` is 22.415–22.88.
   Key the payoff text to the word, or to 20.975.
5. **Silence**: nothing may sound 17.806–18.278 (bed and voice both). L5 is finished at 17.29, so 17.3–17.8
   is a bed-only beat and a half; hit 2 at 18.281 follows.
6. **The turn is at 5.625**: groove stroke, strum and hand-drum on the downbeat; the voice enters at 5.715.
   Colour entering on 5.625 is on the music; the strum rings for about 0.1 s before the voice.
7. **The riser ends on 24.375** and the bed peaks there (bar 14, +2.8 dB over bar 13 in the bed, +2.3 dB in the mix). There is no voice from
   22.88 to 26.31.
8. **The end card at 26.25**: hit 3 and the bed's sting land together; the first loud sound of the voice is
   26.405; `बात` lands on **bar 16 (28.125)**; the voice is done at 28.77, then 1.2 s of bed decay.
9. If the director wants a different start for a line, the line files are at 0 s; a start is the only number
   to change in `build/place.py`.

## 7. Beat-map summary (what to key on)

| t (s) | bar·beat | audio event |
|---|---|---|
| 0.185 | 1·1 | L1 begins |
| 0.469 · 0.9375 | 1·2 · 1·3 | pluck F5 · pluck A5 (the pin lifts · the apex) |
| **1.406** | 1·4 | **HIT 1 + tock**; `फैसला` starts at 1.425 |
| 1.885 | 2·1 | `उल्टा` |
| 2.485 | 2·2 | L2 `इंस्पेक्शन`; tick cascade 2.46–3.18 |
| 3.22 → 3.80 | 2·3 → 3·1 | metal slide, loudest 3.58 |
| 4.205 | 3·2 | `तो देर हो चुकी।` |
| **5.625** | 4·1 | **the turn** to D major (groove + strum); L3 `अब` 5.715 |
| 7.245 | 4·4 | `वेरिएशन` (tap 7.031 on `स्टॉक`) |
| 7.54 | 5·1 | whoosh (FLIP); voice done 7.918 |
| 7.92 → 11.86 | 5·2 → 7·1 | **no voice**: the groove alone (bars 5–6 and the start of 7) |
| 11.30 → 11.85 | 7·1 | tick cascade, the instrument re-forms |
| 12.19 | 7·3 | `उड़` |
| 13.24 | 8·1 | `हवा` |
| 15.0 | 9·1 | mirror whoosh; `ज्यादा` 15.075 |
| 15.9375 | 9·3 | tock |
| 16.465 · 16.855 | 9·4 · 10·1 | `सीमा` · `छोटी` |
| 17.291 → 17.806 | | last voice · bed ends |
| **17.806 → 18.278** | 10·3 | **silence** |
| **18.28125** | 10·4 | **HIT 2**, bed back |
| 19.42 | 11·2 | L6 begins; the shrink whoosh at 19.69 |
| 20.625 | 12·1 | riser starts |
| 20.975 | 12·2 | `नोटिस` |
| 22.879 | 13·2 | last voice before the end card |
| **24.375** | 14·1 | riser ends, bed peaks |
| **26.25** | 15·1 | **HIT 3** + sting; `डीलर` 26.405, `कवच` 26.82 |
| 28.12 | 16·1 | `बात`; L7 ends 28.773 |

## 8. Changes outside this folder

**`kit/audio/mix.mjs`**, three optional additions. Without them in `mix.json` the filter graph is
unchanged (reel 01's `mix.json` has none):

- `"master": { "limit": 0.30, "attack": 5, "release": 60 }` — a look-ahead `alimiter` before loudnorm, with
  `latency=1` (without it the limiter delays the whole mix by its attack, 5 ms).
- `"bed": { "duck": { "threshold", "ratio", "attack", "release" } }` — overrides the sidechain; defaults
  are the films' 0.03 / 8 / 15 / 350.

Nothing else outside `marketing/reels/02-stock-check/` was touched. No production system was touched; no
key was printed or written.

## 9. Risks to check by ear (nobody has listened)

1. **L3's ending** (take 4): confirm it falls like a statement, not a question. If it still lifts, record
   it again (`node kit/audio/voice.mjs … --only L3 --force`), then §10 — a single line costs one call.
2. **L1's seam** (cut at 0.873 s of the take) and the cuts in L2, L5, L7 — all inside silence, all
   cross-faded, but not heard.
3. **L1: `फैसला` sits on hit 1**: they are level at 1.425–1.5. If the word is hard to catch, lower the hit
   (`cues.py`, −14 → −17).
4. **Hit 3 against `डीलर कवच`**: the brand name must be clear; the loud voice starts 0.155 s after the hit.
5. **The synthesised plucks, pulse and strum**: additive-synthesis notes. They are measured in tune and on
   grid, but they may sound thin or toy-like against the model's groove. They are quiet (plucks −14 dBFS at
   the peak, pulse −17, strum −10). If they annoy, lower the `PL`/`ST` constants in `make-bed.py`.
6. **The drone's three notches** (368, 735, 1 470 Hz): narrow (Q 30), but check there is no audible hole.
7. **The hairline ticks** (peaks −14 dBFS, 30 ms): they may be inaudible under the voice (the 0.02–0.30
   and 2.46–3.18 cascades sit under L1 and L2) — fine for hairlines, but if they are the point, raise them
   by 4 dB in `make-sfx.py`.
8. **The metal slide** is one ElevenLabs take chosen by its envelope (rise 0.36 s, fall 0.28 s) and its
   brightness (centroid 4.5 kHz). It may sound like a hiss; take 2 is in `audio/sfx-slide2.mp3`.
9. **The mirror whoosh** (−16, under L5's `ज्यादा निकले`) and the shrink whoosh (−15, under `में है`).
10. **The groove's Hold** is the same pattern at lower level, not sparser; **the model's drone** is a steady
    D tanpura with no variation across 5.6 s.
11. **Low-bitrate copies** (§5): 128 k AAC is −1.4 dBTP, 64 k −1.3.
12. For the record: no time-stretch or pitch change was used anywhere; every line is as spoken except the four shortened comma pauses.

## 10. Reproduce

```
node marketing/reels/kit/audio/voice.mjs marketing/reels/02-stock-check        # records only changed lines (L3 is take 4: copy audio/l3-takes/take4.* to audio/L3.* if re-recorded)
python3 marketing/reels/02-stock-check/build/tighten.py                        # the four comma pauses (keeps audio/L*.raw.wav)
node marketing/reels/02-stock-check/build/words.mjs                            # word times from speech-to-text
python3 marketing/reels/02-stock-check/build/place.py                          # measure, place (START dict), write script.json / script.js
node marketing/reels/02-stock-check/build/gen-music.mjs build/music-plan.groove.json audio/bed-groove-1.mp3   # already run
node marketing/reels/02-stock-check/build/gen-music.mjs build/music-plan.minor.json  audio/bed-minor-1.mp3    # already run
python3 marketing/reels/02-stock-check/build/make-sfx.py                       # ticks, tock, whooshes, riser, slide, hits
python3 marketing/reels/02-stock-check/build/make-bed.py                       # bed-final.wav + synth-intro.wav
python3 marketing/reels/02-stock-check/build/cues.py                           # mix.json + cues/music in script.json
node marketing/reels/kit/audio/mix.mjs marketing/reels/02-stock-check          # mix.wav
python3 marketing/reels/02-stock-check/build/finish.py                         # -16.00 LUFS trim + check
python3 marketing/reels/02-stock-check/build/stems.py && python3 marketing/reels/02-stock-check/build/balance.py   # stems and balance (stems are large; delete after)
python3 marketing/reels/02-stock-check/build/analyze-bed.py audio/bed-groove-1.mp3:5.625   # the bed against the grid
```
