# Brief — the 30–40 second Dealer Kavach short

## What it is for

A vertical (9:16) Hindi film of **30 to 40 seconds** that gives a petrol-pump dealer **all the
key information of the full film quickly**, and then makes him **want to watch the full film**
(26 min 29 s, `marketing/films/mdg-kavach-v2.mp4`). Same company, same narrator, same look.

Where it will be seen:
- On **mdgservices.in/film/short**, opened from a WhatsApp link on a low-end Android phone. The
  page **starts it playing immediately but MUTED** (browsers forbid sound before a tap), with Hindi
  captions on screen and a big "आवाज़ चालू करें" button. So the first 3 seconds must work
  **without sound** (picture + large on-screen Hindi words), and must still work with sound.
- When it ends, the page shows a button to the full film. The film's own last card must also
  carry the call to action, because the mp4 itself will be forwarded on WhatsApp.

Who watches: Indian petrol-pump owners (mostly men, 35–65, Hindi belt, run one or two outlets).
Busy, sceptical of sales pitches, respect plain talk and numbers. They decide in 1–2 seconds
whether to keep watching.

## What the full film says (read `script-timed.md` for every line, in order, with times)

Chapters: शुरुआत (with the founder's **problems chapter**, 0:18–6:20) · आपकी परछाई · रोज़ की
निगरानी · रिकॉर्ड का मिलान · पंप असेसमेंट पॉइंट सिस्टम · चौबीसों घंटे साथ · फ़ीस · प्रीमियम
सेवाएँ (six, the sixth being financial assistance) · आपका डेटा, आपका · जुड़िए.

The short must carry, in its own words: the dealer's real squeeze (rules, compliance, online
work and staff, all growing; margins don't) → MDG Services works as the dealer's shadow
(परछाई), every day → what that covers, at a glance → the price → there's more (premium
services) → watch the full film. **Take every fact, number and name from the full film. No new
claims, no new numbers, no new promises.** If the full film hedges ("हो सकता है", "मदद की जा
सकती है"), keep the hedge.

## House rules (non-negotiable)

1. Never mention or imply taking the dealer's passwords or logins, and never show a portal or
   login screen. Say only that the team prepares reports / DSR / filings on the dealer's behalf.
2. Outcomes only. Never describe how the work is done (no tools, systems, automation, AI,
   data pipelines, OCR, scraping, schedules).
3. No oil company's name, logo or colours (no orange/blue/red bands on canopies, dispensers or
   uniforms). "तेल कंपनी" in words is fine, as the full film does.
4. No real dealer data, names or codes. Figures on cards are illustrative, as in the full film.
5. No Claude, Anthropic or AI anywhere.
6. The company is **MDG Services** (एम-डी-जी सर्विसेज़); the app is **Dealer Kavach**
   (डीलर कवच). Keep the full film's spellings (एम-डी-जी with hyphens is how the narrator says it).

## The narrator

The same ElevenLabs Hindi voice as the full film; every line is recorded fresh, so new
sentences are fine. Measured pace: **about 10.3 Devanagari characters per second of speech**,
plus ~0.35 s of breath between lines. So 35 s of film holds roughly **300 characters** of
narration if it never pauses; leave room for a 2–3 s silent or near-silent end card and a beat
of breath after the hook. Spell numbers the way they should be SPOKEN (तीन हज़ार, not 3,000) in
the narration line; cards show digits. Short, plain, spoken Hindi. No English words a dealer
would not say himself (he does say: DSR, compliance/कंप्लायंस, online, staff/स्टाफ़, app).

## Picture sources you can use

1. **Existing live-action shots** (`assets.md`, contact sheets `sheets/shots_*.jpg`). 70 shots,
   8 s each, 720x1280, the dealer is the founder-approved face. **Only the listed approved
   windows are clean** — outside them people gesture, mouth words, or morph. Name the shot and
   the source seconds you want. You may take a different window than the long film did, but
   say so, because it must be checked by eye. A window can be stretched up to 1.3x or held on
   one frame with a slow push-in. A `frame` crop (closer framing) is possible.
2. **Existing animated cards** (`assets.md`, sheets `sheets/cards_*.jpg`; clips in
   `graphics-kavach/clips/<id>.mp4`). Each is timed to its line in the long film, so in the
   short it can play only as (a) its finished state held as a still with a push-in, or (b) a
   section of its animation whose timing you have checked. New wording on an old card is a new
   card.
3. **New cards** — built in the same design system (`graphics-kavach/panels/*.html`, cream paper
   / maroon / gold, Devanagari, word-by-word reveals). Describe template, content and timing.
   Cheap and fast; prefer them for information.
4. **New live-action shots** — a still made in Google Flow (with the founder's dealer photo as
   the face reference) and animated with Veo on Vertex: **4, 6 or 8 s**, 9:16, no sound. Budget:
   **at most 5 new shots**, and only where no existing shot does the job. Veo's rules: name small
   motions (blinks, chest rises, head turns) — never "nothing moves"; nobody walks; nothing thin
   is held (no pens, dip rods, nozzles; a phone with a dark screen is fine); no readable text,
   numbers, logos or signs; no birds or crowds; dry ground; people never talk or look into the
   lens; plain white canopy and dispensers. Veo's worst frames come at the end — plan to use 2–5 s.
5. **Sound.** The full film has narration only. Say whether this short needs a music bed and/or
   sound effects (a whoosh on a cut, a stamp, a tick), and exactly where. A bed may be generated
   for us; if you want one, describe it (mood, tempo, instruments, where it rises/drops).

## Craft notes

- Hook in the first 1.5 s, readable muted. Montage cuts every ~1–2.5 s; slower at the reveal.
- Big on-screen Hindi words (2–5 words at a time) that carry the story muted.
- End on a **cliffhanger, not a summary**: something the full film answers that the short only
  opens. Then the CTA card: "पूरी फ़िल्म देखें" + 26 मिनट + mdgservices.in/film.
- 30–40 s total, end card included. 9:16. The first frame doubles as the thumbnail.
