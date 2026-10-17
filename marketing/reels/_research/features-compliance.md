# Compliance features: research for the 30-second reels

Researched 17 Oct 2026. Reader: the prompt writer. Sources: `marketing/mdg-video-knowledge-pack.md` (the authority on what may be claimed), the memory notes, ADRs 0010/0011/0014/0018/0019, and the code. Nothing here was run against production. Every card below was rendered locally from the real card builders with invented data (recipe in section 8, tested on this laptop).

Exact UI strings are quoted. Emoji characters in UI strings are written as words ("shield emoji") so this file stays plain text.

---

## 0. The ten findings that change how the prompts must be written

1. **Water and supply cards are not sent by the system.** No code posts them to a dealer. They are PNG files an admin forwards by hand (share sheet / WhatsApp, or attaches in the chat composer). The Kavach daily line, the density message, the morning register ask and every paper request ARE posted automatically into the chat as MDG messages. Show the right path for each (section 1). How the admin forwarding happens in daily practice is UNVERIFIED.
2. **There is no compliance screen in the app any more.** Since 13 Oct the app is the chat. Papers, Density register and Pump health screens are deleted. Every compliance moment a dealer sees is either a picture in the chat or an MDG message with a black "Send photo" button. Videos must not invent a "Compliance tab".
3. **The RO Supply card leaks method on its own footer.** It prints "पोर्टल से लिया गया / Read from the IndianOil portal" and the portal's sentence "RO Supply is Unblocked in SAP." Both must be stripped from any recreation. Its action lines also say "on the portal".
4. **The Water card prints "None found / नहीं मिला" only on windows MDG itself wrote** (code: `markedByServiceAt`). That is a direct tell of who made the record. Show "—" or drop that column. The "LAST CHECKED / आख़िरी जाँच" tile also hints at machine reads. Drop it.
5. **The festival band ships with a tricolour and the Ashoka Chakra** for Independence Day and Republic Day. Fact file section 9 forbids the flag and the Chakra in commercial creative. Only Diwali, Holi, New Year are usable. Band is wired into the credit card only.
6. **The Kavach number is not the dealer's.** A dealer's photo never moves the score. Only an MDG admin or an automation does. There is no "mark done" button. The card footer literally says "verified by MDG" and the bands say "Excellent / Good". Treat both as claim risks (section 3.4, field 8).
7. **Inspection Reports are admin-only.** Router is `requireRole('admin')`; no dealer screen, card or message exists. The only dealer-visible trace is the DSR measuring window moving on inspection day. Do not make a video of the "last 3 + total" pane (it is an internal screen).
8. **Real captured app screens already exist**, drawn with a fictional outlet `99Z` and invented figures: `mdg-app/store-assets/captures/` and `.../screenshots/` (Play Store set, 15 Oct), plus a throwaway local stack that can capture more (section 7). These are the safest "actual screenshots".
9. **Public explainers already cover the trade side** of water ingress, the seven supply conditions, density, mock drill, inspection window (section 6). The reels must show the dealer's RESULT (the card, the chat ask), not re-teach the rule.
10. **Reliability is not 100%.** On 10 Oct IndianOil's portal move lost 74 runs and 22 water windows that cannot be recovered. Never say "never miss a window". The honest frame is stronger: every window is on the record, recorded or missed, and nothing is hidden.

---

## 1. How each feature actually reaches the dealer

| Feature | What the dealer gets | Posted by | To whom | Evidence |
|---|---|---|---|---|
| Water Ingress day card | PNG picture (one per finished day, archived on the server) | A person forwards it. No auto-post found | Owner and/or manager, per the admin's "Send to" choice | `services/waterIngress/card.ts`; no `postToDealer` call; admin pane uses `shareSavedImage` (share sheet / download) |
| Water Ingress "how is today" | A chat answer with counts only | First line reply on a dealer's question | Asker | `assist/firstline/templates.ts` keys `water_ingress.*` |
| RO Supply Status card | PNG picture | A person forwards it ("Share with dealer") | as above | `services/roSupplyStatus/card.ts`, `DealerRoSupplyStatusPane.tsx` |
| Tanker density | One MDG message with the figures | Automatic, one message per batch of new tankers | Manager's group chat if the outlet has a manager, else every owner | `services/ttDensity/notify.ts` |
| Density register page ask | MDG message + "Send photo" button, asks for yesterday's page | Automatic, 09:00 IST daily (`REGISTER_ASK_CRON`) | Same as above (the person on site) | `chatAsks/morning.ts` |
| Kavach daily line | One line of text | Automatic, per-dealer hour, default 08:00 IST | Owners AND manager | `kavach/digest.ts` |
| Kavach card | PNG picture + caption | A person shares it (admin-approved) | Owners/manager per choice | `kavach/share.ts` |
| Kavach photo ask | MDG message + "Send photo" | Admin presses "Send request" | Owners AND manager | `chatAsks/kavachAsk.ts` |
| Paper request / renewal reminder | MDG message + "Send photo" (+ "Choose file") | Admin, or the nightly reminder pass | Owners AND manager | `documents/notify.ts`, `chatAsks/text.ts` |
| Festival band | Replaces the top strip of the credit card picture | Applied when the card is generated | Whoever receives that card | `report/festivalBand.ts` |

Dealer language: every chat MESSAGE is written in ONE language per reader (Hindi unless that user switched to English). Every CARD picture is bilingual, English term plus Hindi meaning. Mirror that: Hindi video, Hindi bubble text, bilingual cards.

---

## 2. The app chrome to recreate (verified from tokens, tests and the Play captures)

Source of tokens: `mdg-client/src/index.css`, `tailwind.config.ts`; of layout: `mdg-app/store-assets/captures/01-04*.png` and `screenshots/`.

- **Viewport of the captures:** 390 x 811 CSS px at 3x (WebView below the status bar). Android.
- **Chat list (home):** white top bar, title "Dealer Kavach" (hi: "डीलर कवच"), search icon, three-dot menu. Filter chips All / Unread / Groups. Rows: "Support" (avatar is the MDG logomark in a grey circle) and "Manager chat" (two-person icon). Unread count is a BLACK pill. Settings sits behind the three-dot menu.
- **Chat screen:** top bar with back arrow, round MDG avatar, "Support" over "MDG team" (hi: "सहायता" over "MDG टीम"). Wallpaper `#f3f2f0` with faint doodle shapes (circle, cross, triangle, wave, square) at `rgba(17,27,33,0.045)`. Date chips white with text `#54656f` ("Today", "Yesterday"). Incoming bubble `#ffffff`, own bubble `#e7e5e4` (warm grey, not green), text `#111b21`, time `#667781`. Ticks read-blue `#53bdeb`.
- **Under the last message:** two quick-reply chips, "Today's report?" / "What do I need to do?" (hi: "आज की रिपोर्ट?" / "अब क्या करना है?"). Composer: field "Message", paperclip, camera, and a BLACK round mic button `#18181b`.
- **Brand accent in the app is near-black `#18181b`** (not green, not teal). Success `#16a34a`, danger `#dc2626`, warning `#d97706`.
- **The ask bubble** (all papers, density register page, Kavach photos): system message from MDG, width `min(80%, 330px)`. A light inset `#f0f2f5` carries the request title and, when there is one, the day ("Fire NOC", "Density register page · 12 Oct"). Under it the two-line message. Then a full-width 44 px BLACK button with a camera icon: "Send photo" (hi: "फ़ोटो भेजें"). Papers add a white outlined second button "Choose file" (hi: "फ़ाइल चुनें"); photo-only requests add "Choose from gallery" (hi: "गैलरी से चुनें"). The time sits on its own line below the button.
- **After the dealer answers, the button is replaced by one line:** "Sent — MDG is checking" (hi: "भेज दिया — MDG टीम देख रही है"), then "Received" (hi: "मिल गया"). If MDG rejects: "MDG sent it back" (hi: "MDG ने वापस भेजा है") plus MDG's reason verbatim, and the button returns.
- **MDG's reply in the thread** quotes the dealer's photo (small thumbnail, "You / Photo") and says "✓ Received — Fire NOC" (hi: "✓ मिल गया — फायर एनओसी"). A sent-back reply: "↩ Please send this again — … reason" (hi: "↩ फिर से भेजिए — …").
- **A report card in the thread is an ordinary picture message.** At phone size its text is unreadable (see `captures/02-report.png`). A tap opens it full screen with swipe and zoom. So every card video must zoom into regions, not show the whole card and hope.
- Fonts: the app draws in `system-ui`. Cards: Noto Sans Devanagari first, then system sans. Devanagari must come last in a Latin stack or it re-typesets the Latin glyphs.

Two palettes exist. Do not mix them up:

| Where | Palette |
|---|---|
| The phone UI (chat) | near-black `#18181b`, white, warm grey; success green / danger red |
| House report cards (water, supply, credit, DSR) | maroon `#7f1d1d` / `#5c1010`, gold `#f59e0b` / `#fbbf24`, cream `#fffdf5`, page `#f4ede0`, grid `#e7d9bf`, ink `#1c1917`, ink soft `#57534e`, red `#b91c1c`, green `#15803d`, green soft `#f0fdf4`, amber `#b45309`, gold soft `#fffaf0`, maroon soft `#fef2f2` |
| Kavach card | cream `#fffdf5`, border `#e7d9bf`, blue ask block `#1d4ed8` on `#eff6ff`, bands green/amber/red |
| Marketing frame (films, site, pamphlet) | navy `#2C2E80` (700) / `#1A1B4B` (900), gold `#F5A524` (400), paper `#FCFCFE`, ink `#15163A`, ok `#12A87B`, risk `#D2544B`; Space Grotesk display + Inter + Noto Sans Devanagari (`mdg-demo/src/marketing/brand.ts`) |

---

## 3. Feature cards

### 3.1 Water testing record

**1. Name / slug.** Water Ingress Testing. Card title: "WATER INGRESS TESTING" over "टंकी में पानी की जाँच". The dealer's Settings > Your services row says "टैंक में पानी की जाँच" (टैंक, not टंकी; the two spellings disagree, pick one and keep it). Slug `water-ingress`. In public copy call it "पानी की जाँच" (the explainer's word).

**2. Status.** LIVE, dealer-facing: indirect (a picture a person sends, plus a counts-only chat answer). Built 18 Aug (shared `e79c75d`), day card archived 1 Sep (`1ba8241`), counts-only chat answer 5 Sep (`4d74ae1`). Attached to the 9 eligible outlets (memory `ro-supply-status-service`). Prod holds ten dealer records, all test users. 10 Oct: 22 windows were lost to IndianOil's portal move and are permanently missed.

**3. What the dealer receives.**
- The day card: one tall picture per finished day (archived when the last window is done, so it can never disagree with the record).
- On a question in chat: a sentence with counts, never a percentage and never the names of past missed windows (deliberate). hi: "{date} की {expected} जाँच में से {recorded} दर्ज हो चुकी हैं।" en: "For {date}, {recorded} of {expected} checks are recorded." With a window open now: hi: "… अभी {window} वाली जाँच का समय चल रहा है।" en: "… The {window} one is open right now."

**4. Visual anatomy of the day card** (`services/waterIngress/card.ts`; rendered and checked).
- Frame: 1000 px card, 6 px maroon `#7f1d1d` border, 22 px radius, inside a 16 px `#f4ede0` page. Renders about 1044 css px wide, 2x PNG.
- Top and bottom bands: 34 px gold gradient, 7 repeats of "Dealer's कवच · @MDG Services" in 15 px/800 maroon, 2 px maroon rule. (A marquee in the source, static in the PNG.)
- Header (maroon gradient): white 70 px tile with the text "MDG" (not the logomark); centre title 33 px/800 white, subtitle 20 px/600 gold; right gold pill with the outlet code (25 px/800 maroon). **Replace the code with an invented one or hide it.**
- Hero left (maroon-soft; green-soft when settled at 100%): eyebrow "COMPLIANCE", percentage 62 px/800, "अनुपालन", "12 में से 10 पारियाँ दर्ज", "10 of 12 windows recorded".
- Hero right 306 px: "FOR THE DAY", "Wed, 14 Oct 2026", "बुध, 14 अक्टूबर 2026", then verdict in red "2 पारियाँ छूट गईं" / "2 windows missed", or green "कुछ नहीं छूटा" / "Nothing missed" (running day: "अब तक कुछ नहीं छूटा" / "Nothing missed so far").
- Four tiles: "WINDOWS RECORDED / दर्ज पारियाँ" = "10 of 12" / "12 में से 10"; "MISSED / छूट गईं" = 2 (red if above 0, else green); "OPERATING HOURS / पंप खुलने का समय" = "Round the clock" / "चौबीसों घंटे" (or "06:00 to 22:00" / "06:00 से 22:00"); "LAST CHECKED / आख़िरी जाँच" = "14 Oct, 23:40" (drop it).
- Note boxes, Hindi line leads in bold: red (missed): "2 पारियाँ बिना दर्ज हुए बंद हो गईं: 02:00 AM - 04:00 AM, 06:00 AM - 08:00 AM। पारी अपने समय के अंदर ही दर्ज हो सकती है, इसलिए अब ये दर्ज नहीं हो सकतीं।" with English "… A window can only be filled in while the clock is inside it, so these cannot be recovered." Green (clean): "जितनी पारियाँ बंद हुईं, सब दर्ज हुईं।" / "Every window that has closed was recorded." Grey (today, running): "यह दिन अभी चल रहा है — N पारियाँ अभी बंद नहीं हुईं, इसलिए ऊपर का आँकड़ा आख़िरी नहीं है।" Amber (last attempt failed): internal, never show.
- Grid, white box, 4 columns: "TIME SLOT / समय", "STATUS / स्थिति", "WATER INGRESS / पानी मिला?", "UPDATED ON / कब दर्ज हुआ". 12 rows, slot labels in the portal's format "12:00 AM - 02:00 AM" through "10:00 PM - 12:00 AM". Status cells: "Recorded / दर्ज" (green 700), "Missed / छूट गई" (red 700), "Still open / अभी बाक़ी" (grey). Updated-on is a timestamp like "14-10-2026 01:10"; "—" when not recorded. Water column: "None found / नहीं मिला" only on windows MDG wrote, else "—". **Hide this column.**
- States: clean day (green hero, all 12 recorded), day with misses (red), running today (grey note, open windows "Still open"), part-day outlet (fewer rows).
- Existing rendered samples: none of the real card in the repo. Tested local render in section 8 (scratchpad `water-missed.png`, `water-clean.png`). Closest prior art: `marketing/films/graphics/thumbs/G-record.jpg`, `G-checklist.jpg`.

**5. Invented consistent figures.** Day 14 Oct: 12 windows, 10 recorded, 2 missed (02:00 AM - 04:00 AM and 06:00 AM - 08:00 AM), 10/12 = 83.3 so the card prints 83%. Clean day 12/12 = 100%. A single missed window = 11/12 = 91.67 so 92%. Running day at 14:30: 7 windows have closed (00:00 to 14:00), one is open (02:00 PM - 04:00 PM), four to come.

**6. Pain and hooks.** Pain: the most relentless daily obligation and the least talked about. Twelve windows a day, every day, no catching up. A window that closes empty stays empty.
- Number: "12 जाँच। रोज़। हर दिन।" / "12 checks a day. Every day."
- Rule as a picture: "रात 12 की जाँच, सुबह 9 बजे नहीं भरी जा सकती।" / "The midnight check can't be filled in at 9 a.m." (the code README calls a late entry "false"; the existing public explainer deliberately never says so. Use "can't be", not "false".)
- Question: "कल रात की जाँच: दर्ज हुई या छूटी?" / "Last night's check: on the record, or missed?"

**7. Outcome line.** hi: "हर जाँच का हिसाब रिकॉर्ड में: दर्ज हुई या छूटी, साफ़-साफ़।" en: "Every water check on the record: recorded or missed, plain to see."

**8. Safe vs forbidden.**
- Safe: 12 windows of two hours for a round-the-clock outlet (fewer for part-day); a window can only be filled in inside its own time; there is no taking an entry back; missed windows stay missed and the card says so; the card shows recorded of total, missed, operating hours.
- FORBIDDEN: how the record is made. No one ticking, no form, no Checked/Found radios, no "Enter Details", no portal, no login, no "we mark it", no schedule ("every two hours we..."), no browser. Never show the portal's four-question row. Never say MDG "fills", "enters", "ticks", "submits".
- FORBIDDEN: what happens to a dealer who misses or fills one falsely (nothing evidenced; the explainer refuses it too). No "fine", "notice", "licence at risk".
- FORBIDDEN: "never miss a window", "100% every day", "0 missed". Fact file section 6 rates "never a missed deadline" unverified.
- Trap: the AI's rule is that a percentage is a compliance statement. The card does print one (the portal's own figure). Prefer "10 of 12" as the headline number; if the percentage appears, keep it small.
- Trap: "None found" implies a statement about water in the tank. Do not show it.

**9. Video potential 7/10. Motion moment:** the 24-hour dial of twelve segments. The clock hand passes each two-hour segment and the segment locks green ("दर्ज") as it passes; two segments pass untouched and lock red ("छूट गई") and stay red. The day card then assembles around the dial. No hands, forms or ticks being entered anywhere in frame.

---

### 3.2 Supply status

**1. Name / slug.** RO Supply Status. Card: "RO SUPPLY STATUS" over "पंप को तेल मिलने की स्थिति". Settings > Your services: "सप्लाई की स्थिति". Slug `supply-status`. Shortest dealer word: "सप्लाई" / "लोड" (the approved film line says "लोड रुका हुआ है").

**2. Status.** LIVE (5 Sep, backend `6c0cc87`; dealer card 6 Sep `fc733a4`, shared copy `12d0d33`). Attached to 9 outlets. Dealer-facing: indirect (a picture a person sends). It is NOT in the app, NOT in the first-line answers.

**3. What the dealer receives.** A picture card with one of four states, the standing warning, what is pending with the one step that clears each, and what is already clear.

**4. Visual anatomy** (`services/roSupplyStatus/card.ts`; rendered in all states).
- Same frame, bands and header as the water card (1000 px, maroon border, gold marquee bands). Title "RO SUPPLY STATUS" / "पंप को तेल मिलने की स्थिति", code pill right.
- Hero, four states:

| State | Background | Eyebrow | Big line (46 px/800) | Hindi sub | English sub | Right panel (250 px) |
|---|---|---|---|---|---|---|
| Stopped | red-soft `#fee2e2` | "SUPPLY IS STOPPED" | "तेल लेना बंद है" | "आपका पंप अभी इंडियन ऑयल से तेल नहीं ले सकता। नीचे दिए काम पूरे होने तक यह रोक चलती रहेगी।" | "Your outlet cannot lift fuel right now. The block stays until the work below is done." | "PENDING WORK", red number (68 px), "N काम बाक़ी" |
| N pending | gold-soft `#fffaf0`, amber `#b45309` | "2 ITEMS NOT CLEAR" | "2 काम बाक़ी हैं" | "इनमें से कोई भी एक काम बाक़ी रहने पर आपका पंप तेल लेना बंद कर दिया जा सकता है। अभी तेल मिल रहा है — इसी बीच इन्हें पूरा कर लें।" | "Any one of these can stop your outlet buying fuel. Supply is running today — clear them while it is." | same |
| All clear | green-soft `#f0fdf4` | "ALL CLEAR" | "कुछ भी बाक़ी नहीं" | "इस समय कोई शर्त अटकी नहीं है और आपका पंप तेल ले सकता है।" | "Nothing is holding up your supply at the moment." | "0", "सब ठीक" |
| Unreadable | amber | "STATUS UNCLEAR" | "स्थिति साफ़ नहीं" | (asks the dealer to check the portal) | | "?", "पता नहीं" |

- Standing red note (on EVERY card, even a clean one): "इनमें से कोई भी एक शर्त पूरी न होने पर इंडियन ऑयल आपके पंप का तेल लेना रोक सकता है।" / "Any ONE of these conditions left unmet is enough for IndianOil to stop your outlet buying fuel."
- Block "WHAT IS PENDING / क्या-क्या बाक़ी है": each item is a numbered red 34 px square, the condition in English (17 px/800), the Hindi problem in red (18 px/700), then a green box with a 4 px green left rule: "करना क्या है: …" over the English action.
- Block "ALREADY CLEAR / ये ठीक हैं": pill chips with a green tick and the "cleared" Hindi.
- Footer left: "पोर्टल से लिया गया / Read from the IndianOil portal" + date stamp ("15 Oct 2026, 09:30 am"). Footer right: the portal's sentence. **Strip the whole footer.**
- **The seven conditions, exact strings** (`shared/src/data/roSupplyConditions.ts`). Portal English (typos are the portal's: "Quaterly", "Comunicated") / Hindi problem / Hindi cleared / the one step:

| # | Portal wording | Problem (hi) | Cleared (hi) | One step (en) |
|---|---|---|---|---|
| 1 | Automation data not received | ऑटोमेशन का डेटा पोर्टल तक नहीं पहुँचा | ऑटोमेशन का डेटा पहुँच रहा है | Get the automation link at the pump working again — your vendor fixes this. |
| 2 | Pending OTP | कोई OTP मंज़ूरी बाक़ी है | कोई OTP बाक़ी नहीं | Approve the pending OTP on the portal. |
| 3 | Blocked in SDMS-DAR | SDMS-DAR में रोक लगी है | SDMS-DAR में कोई रोक नहीं | Take this up with your Sales Officer — the block is set on their side. |
| 4 | DU/Tank Not Comunicated in 24 hrs | 24 घंटे से मशीन/टंकी का डेटा नहीं गया | मशीन और टंकी का डेटा जा रहा है | Check that every dispensing unit and tank is reporting again. |
| 5 | Quaterly Mock Drill Not Conducted | तिमाही मॉक ड्रिल नहीं हुई | तिमाही मॉक ड्रिल हो चुकी है | Conduct the quarterly mock drill and file the declaration on the portal. |
| 6 | Electrical Audit Non-Compliance | बिजली ऑडिट की कमियाँ पूरी नहीं हुईं | बिजली ऑडिट की कमियाँ पूरी हैं | Close the electrical audit points and upload the proof. |
| 7 | RO not in Auto | पंप ऑटोमेशन पर नहीं है | पंप ऑटोमेशन पर है | Put the outlet back on automation. |

  The cleared Hindi is a separate string on purpose: a green tick beside the problem wording reads as confirming the fault (the first draft shipped that bug).
- Recommend in video: write the English with correct spelling ("Quarterly", "communicated"). A video with the portal's typos looks like our error. Keep the Hindi lines leading, as on the real card.
- Existing rendered samples: `marketing/panels/p-supply.png` (a stylised film imitation, older teal header, text "लोड रुका हुआ है" / "वजह: मॉक ड्रिल" / "एक क़दम: मॉक ड्रिल कराइए, फ़ोटो भेजिए। बाक़ी हम कर देंगे।"; not faithful to the current card or app, and it promises "we do the rest"); `marketing/shots/P06-supply-blocked.png`, `S05-supply.png` (generated photographs, phone screens dark). Real card: render locally (section 8).

**5. Invented figures.** Seven conditions, all consistent: "2 not clear, 5 clear" (Pending OTP and Quarterly mock drill open; the other five in "ALREADY CLEAR"). Stopped example: 1 pending (quarterly mock drill), 6 clear. Clean: 0 pending, 7 clear. 7 - 2 = 5 and 7 - 1 = 6 check.

**6. Pain and hooks.** Pain 4 of the five recurring pains (money found out on the wrong day, here as a held load): the tanker is due and the load will not release, and nobody can say why.
- Fear word: "लोड रुका है। क्यों?" / "Your load is held. Why?"
- Number: "7 शर्तें। एक भी खुली, तो लोड अटक सकता है।" / "Seven conditions. One open can hold your load."
- Contradiction: six green ticks, one red cross that fills the screen, then "कुछ भी बाक़ी नहीं".

**7. Outcome line.** hi: "लोड क्यों रुका है, और उसे खोलने का एक क़दम।" (already approved in the marketing film, shot S05) en: "Why the load is held, and the one step that frees it."

**8. Safe vs forbidden.**
- Safe: three states (stopped / n items pending / all clear); seven conditions, attested on a live screen 5 Sep for two outlets; one step per condition; "IndianOil" named in words.
- Safe consequence, the only one: miss the quarterly mock drill and the next fuel order can be held (observable).
- Hedge everything else with "can": "can hold up your next load" (the public explainer's own rule). The card's standing sentence ("is enough for IndianOil to stop your outlet buying fuel") goes further than the fact file allows for conditions other than the mock drill. If the card is recreated faithfully, do not VOICE it.
- FORBIDDEN: any portal, "SAP", "Read from", "captured", "checked every few hours", login, schedule. Strip the footer. No outlet code, no real RO number (two real codes sit in the capture the strings came from; neither may appear).
- FORBIDDEN: "we clear it for you" (the p-supply panel says "बाक़ी हम कर देंगे"; the cards say the dealer or his vendor or his Sales Officer does the step). Four of the seven steps are the dealer's own errand.
- Trap: "SDMS-DAR" and "OTP" are trade words the dealer knows. "Automation" is the dealer's word for his forecourt electronics. Fine on screen; "डेटा" appears on cards but is banned from spoken lines.
- Trap: the SDMS-DAR step ("the block is set on their side") is operator knowledge, not published by IndianOil. Say it as "usually", not as the rule.

**9. Video potential 9/10. Motion moment:** the seven-lamp panel. Six lamps green, one red; the red lamp's label slides up into the "एक क़दम" strip; a photo is sent; the lamp turns green and the hero swaps from red "तेल लेना बंद है" to green "कुछ भी बाक़ी नहीं" with the pending counter rolling 1 to 0.

---

### 3.3 Tanker density

**1. Name / slug.** TT Density, dealer word "डेंसिटी रजिस्टर" (his desk book). Never "TT", "invoice", "acknowledgement" or "Density@15" in dealer-facing copy (`docs/specs/tt-density-ux.md` section 2, `serviceLabel.ts`). Message headline: "नए टैंकर की डेंसिटी आ गई है।". Ask title: "डेंसिटी रजिस्टर का पन्ना" / "Density register page". Slug `tanker-density`.

**2. Status.** LIVE for all 9 outlets since 24 Aug (`c61a720`/`14b3cca`). Chat ask live since 13 Oct (backend `b8395d5`, ADR 0019). Dealer-facing: yes (automatic chat messages). Only outlets with the service active get the 9 am ask, and only for days on or after attachment.

**3. What the dealer receives (two things).**
- (a) **The figure.** One MDG message per batch of new tankers, in the manager's group chat when there is a manager, else in every owner's chat. hi: "नए टैंकर की डेंसिटी आ गई है।" then a second line, products joined by " · ": "हाई स्पीड डीजल (12 अक्टूबर): 822.400 · मोटर स्पिरीट (12 अक्टूबर): 729.100". For several tankers: "{n} टैंकरों की डेंसिटी आ गई है।" en: "New tanker density is ready." / "Density for {n} tankers is ready." / "High speed diesel (12 Oct): 822.400 · Motor spirit (12 Oct): 729.100". Diesel first, then petrol, then premium. Digits exactly as printed (three decimals, trailing zeros kept). No unit, no invoice number, no rupee amount. Product labels: "HIGH SPEED DIESEL / हाई स्पीड डीजल", "MOTOR SPIRIT / मोटर स्पिरीट", "XTRAPREMIUM / एक्स्ट्रा प्रीमियम". Push title "टैंकर की डेंसिटी" / "Tanker density". Day label drops the year when it is this year ("12 अक्टूबर" / "12 Oct").
- (b) **The morning ask.** Each day at 09:00 IST an MDG message asks for YESTERDAY's register page, only if not already received. Inset: "डेंसिटी रजिस्टर का पन्ना" with the day "12 अक्टूबर". Body hi: "MDG को यह चाहिए: डेंसिटी रजिस्टर का पन्ना (12 अक्टूबर)।" / "नीचे “फ़ोटो भेजें” दबाइए।" en: "MDG needs this from you: Density register page (12 Oct)." / "Tap “Send photo” below." Black "Send photo" button (photo-only, so a "Choose from gallery" button sits under it). Dealer sends; the bubble goes "Sent — MDG is checking" then "Received"; MDG posts "✓ मिल गया — डेंसिटी रजिस्टर का पन्ना (12 अक्टूबर)". "Received" is automatic on arrival (the day is marked), so it means received, not read or checked. A second photo for a day already held: "12 अक्टूबर का पन्ना हमारे पास पहले से है।"

**4. Visual anatomy.** No card. Both moments are chat bubbles (section 2 chrome). The figure message is a plain white incoming system bubble (no inset, no button). The ask is the ask bubble. Existing imitation: `marketing/films/graphics/thumbs/G-density.jpg` (a stylised card with "831.5 / डेंसिटी @ 15°C", older teal chat header, not how the real message looks; see traps). Source `marketing/films/graphics/graphics.html` (panel `G-density`). Photo of the dealer's own register page: `mdg-app/store-assets/capture/demo/licence-photo.jpg` is a licence, not a register; a register-page prop would need to be made (blank ruled page, no real writing).

**5. Invented figures.** Do NOT reuse any figure held from a real invoice (727.300, 820.500, 728.100, 819.700, 727.200, 727.600). Use clearly invented values and label the moment "one load" not "what diesel is": diesel 822.400, motor spirit 729.100, premium 730.200, dated "12 अक्टूबर". The register page the dealer photographs is for the day before the ask: ask on 13 Oct for "12 अक्टूबर".

**6. Pain and hooks.** Pain: a tanker lands and the density must be in the register that day; the book is hand-kept; an empty page is found later.
- Visual: a three-decimal figure sliding into a chat bubble: "822.400".
- Question: "टैंकर आया: डेंसिटी रजिस्टर में चढ़ी?" / "Tanker's in: is the density in your register?"
- Morning: "कल का रजिस्टर का पन्ना कहाँ है?" / "Where is yesterday's register page?"

**7. Outcome line.** hi: "टैंकर की डेंसिटी आपके हाथ में, रजिस्टर का पन्ना एक फ़ोटो में।" en: "Your tanker's density in hand; the register page is one photo."
(The approved film line is "टैंकर की डेंसिटी उसी दिन आपके हाथ में।" Whether the figure arrives the same day is UNVERIFIED: the figure arrives with the morning pass, so a tanker that lands in the afternoon is seen the next morning. Avoid "the minute it lands" and "instantly".)

**8. Safe vs forbidden.**
- Safe: the figure per product for the register, sent to the person on site; the register page asked for each morning for yesterday; "Received" after the photo; the density of "this load" shown as an example.
- FORBIDDEN: any specific density as what petrol or diesel "are" (fact file section 6, unverified; real values come from one load on one day, no unit printed).
- FORBIDDEN: "we compare your reading to the tanker's" or "we catch a mismatch". Not built (ADR 0010 section 9); no screen hints at it.
- FORBIDDEN: method. No invoices downloaded, no portal, no reading of PDFs, no daily 07:35 run, no seven-day window. "The figure from your tanker's invoice" is trade fact; "we read it from IndianOil" is method.
- FORBIDDEN and method-adjacent: "we never acknowledge the delivery for you". It is true and the fact file states it, but saying it implies MDG has access to that portal action. Leave it out of public copy.
- Trap: one grade-pair can print the same density (XP and MS from the same tank). Not an error; do not show two grades with identical figures as a "bug".
- Trap: the morning ask goes to the MANAGER's group chat when a manager exists, not to the owner.
- Trap: a known defect (memory `density-pin-invisible`) means the old pin never showed to managers; irrelevant now that the ask is a chat message.

**9. Video potential 6/10. Motion moment:** an odometer roll to "822.400" in the bubble while a pen writes the same digits into a register line; next beat, 09:00, the ask bubble, a thumb on the black button, the bubble line flips "भेज दिया" to "मिल गया" with a tick. Pick one of the two flows for 30 seconds; both together is cramped.

---

### 3.4 Kavach compliance standing

**1. Name / slug.** Dealer's कवच. Card header: "कवच / Kavach". Daily chat line starts "shield emoji कवच —". Hindi app name "डीलर कवच". Slug `kavach-standing`.

**2. Status.** Rebuilt and live 26 Aug (ADR 0011, backend `cb0472e`). **Dealer-facing switch `dealerFacingEnabled` is OFF by default and nothing says it was turned on for any outlet. Whether any real outlet receives the line or card today is UNVERIFIED.** Dealer-facing: yes when switched on (line automatic; card admin-approved; photo asks admin-triggered).

**3. What the dealer receives (three things).**
- (a) **The daily line**, one message at the dealer's hour (default 08:00 IST), to owners and manager:
  - nothing to send, MDG still checking: hi "shield emoji कवच — आज 85%। बाकी काम हमारी टीम जाँच रही है।" / en "shield emoji Kavach — 85% today. Our team is checking the rest."
  - all checked: hi "आज 100%। सब जाँचा हुआ है — शाबाश!" / en "100% today. Everything checked — well done."
  - MDG needs a photo (this leads, and the percentage is dropped): title "कवच — आपसे कुछ चाहिए" / "Kavach — we need something"; hi "आपसे चाहिए: {task}, {task} और {n}।" en "We need from you: {task}, {task} +{n} more." (at most 2 named)
  - settling-in grace: hi "आपके पंप की जाँच चल रही है। हमारी टीम बाकी काम देख रही है।" / en "We are checking your pump. Our team is looking at the rest." (no number)
  - not started: hi "अभी कोई अंक नहीं — जाँच शुरू नहीं हुई।" / en "No score yet — we have not started checking."
- (b) **The card**, a forwardable picture, admin-approved, at most once per day. Caption: hi "shield emoji कवच · 15 अक्टूबर — 3180/3740 अंक (85%)।" en "shield emoji Kavach · 15 Oct — 3180/3740 points (85%)."
- (c) **A photo ask** per task ("MDG needs a photo for: …"), with the black button (kind kavach, photo only).

**4. Visual anatomy of the card** (`services/kavach/card.ts`; rendered). Narrower than the house cards: 720 px, `#fffdf5` body, 1 px `#e7d9bf` border, 18 px radius, page `#f4ede0`. **Not maroon, no marquee.**
- Header row: "कवच / Kavach" (23 px/700) left, outlet code right (hide).
- Ask block (only when MDG needs something from the dealer): blue-soft `#eff6ff`, 4 px blue `#1d4ed8` left rule, heading "camera emoji आपसे चाहिए / We need from you", then one row per task: Hindi 15 px/600 plus English 12.5 px. Leads the card.
- Hero: big percentage (58 px/800) with the band, band word in Hindi and English, and "3180 / 3740 अंक / points" (no thousands separator on the card).
  - 90 and above: green, "बहुत बढ़िया / Excellent". 75 to 89: green, "ठीक है / Good". 50 to 74: amber, "ध्यान दें / Needs attention". Below 50: red, "काम बाकी है / Work outstanding".
  - No denominator: white hero, "अभी कोई अंक नहीं / No score yet — we have not started checking".
- Amber strip, only when something was never checked: "अभी N चीज़ें जाँची नहीं गई हैं / N not checked by us yet".
- Pending list "अभी बाकी / STILL PENDING": up to 5 rows, heaviest first, Hindi + English label and points on the right; then "और N / N more". Or the green box "सब कुछ जाँचा हुआ है / Everything is checked".
- Footer: date "15 Oct 2026" left; "MDG टीम द्वारा जाँचा / verified by MDG · 09:00 IST" right. **Treat "verified by MDG" as a claim risk (see 8).**
- Samples: none in the repo. Local render in section 8 (`kavach.png`). Prior art, a stylised imitation: `marketing/films/graphics-kavach/` stills and `marketing/films/graphics/thumbs/G-checklist.jpg`.

**5. Invented consistent figures.** Operational total 3,740 points (40 clocked items; the 5 on-call items are excluded). Valid 3,180. 3,180 / 3,740 = 85.03 so "85%" and "ठीक है / Good". Pending 3,740 - 3,180 = 560 points over 7 items: two photo asks (first-aid box 80, solar panels 80) = 160, plus five with MDG (mock drill 120, minimum wages 80, 80, 80, 40) = 400, 160 + 400 = 560. Four of the seven "not checked by us yet". Rolling forward, each accepted 80-point photo is worth about 2 points of percentage: 3,180 to 3,260 = 87.2 so 87%, to 3,340 = 89.3 so 89%. 90% needs 3,366 (exactly 90.0). Real task labels the dealer sees (EN / HI, points): "Keep first-aid box stocked / फर्स्ट एड बॉक्स में सब दवाई रखें" 80; "Clean the solar panels / सोलर पैनल साफ करें" 80; "Display emergency number outside / इमरजेंसी नंबर बाहर लगाएं" 80; "Fill toilet inspection sheet / शौचालय निरीक्षण शीट भरें" 75; "Update today's DSR (before 10 am) / आज का DSR अपडेट करें (10 बजे से पहले)" 75; "Update density book (before 10 am) / घनत्व (density) बुक अपडेट करें (10 बजे से पहले)" 75; "Update stock board (by 10 am) / स्टॉक बोर्ड अपडेट करें (10 बजे तक)" 75; "Keep stock variation within limit / स्टॉक वेरिएशन सीमा के अंदर रखें" 40.

**6. Pain and hooks.** Pain 5: the gate. The inspection team has arrived and the file is not complete. Plus: 45 things on the clock and he is the only one holding them.
- Number: "45 काम। 9 अलग चक्र। एक पंप।" / "45 jobs. 9 cycles. One pump." (verified, fact file section 6)
- Number: "रोज़ के 10 काम। 3 सुबह 10 बजे से पहले।" / "10 daily jobs. 3 before 10 a.m."
- Contradiction: a big "85%" with a small hatched sliver: "4 चीज़ें अभी जाँची नहीं गईं". "यह आँकड़ा बताता है कि क्या नहीं देखा गया।" / "A number that tells you what it has not checked."

**7. Outcome line.** hi: "रोज़ एक लाइन: आपके पंप के कामों का हाल, MDG की अपनी जाँच के हिसाब से।" en: "One line a day on where your pump's jobs stand, by MDG's own check."

**8. Safe vs forbidden.**
- Safe: 45 items on the clock, 9 cycles (daily 10, weekly 1, fortnightly 2, monthly 5, quarterly 4, half-yearly 7, yearly 10, every two years 1, on-call 5; they add to 45); ten daily jobs, three before 10 am; a percentage plus what is pending, what MDG has not yet checked, and what MDG needs a photo of; MDG's admin or an automation closes every item; the dealer sends a photo, MDG decides.
- FORBIDDEN: "certified", "audit-ready", "inspection-proof", "guaranteed to pass", "your compliance score" as a rating of legality. It is "MDG's written statement about the dealer", not a certification and not a guarantee of passing an inspection. Do not show the word "Excellent" as a verdict on legal standing; if the card is recreated, soften the band words or show them only at a size nobody reads.
- FORBIDDEN: the footer "verified by MDG / MDG टीम द्वारा जाँचा" read as a certificate. Use "MDG की जाँच के अनुसार" / "by MDG's check", or crop it out.
- FORBIDDEN: a dealer tapping "done" or ticking a checkbox. There is no such control. The only dealer action is "Send photo".
- FORBIDDEN: "the photo raises your score". Show photo, then "Sent — MDG is checking", then "Received", then a LATER line with a higher number.
- FORBIDDEN: "45 checks required by oil companies". The 45 and their cycles come from one working dealer's own assessment sheet, not an oil company circular. Say "45 जॉब आपके पंप पर घड़ी में" / "45 jobs on the clock at your pump", never "mandatory".
- FORBIDDEN: a percentage on a fresh outlet (it must read "अभी कोई अंक नहीं"; an untouched programme cannot read 100%).
- FORBIDDEN: any points total for the sheet beyond what is above. One item's weight (earthing pits, 45) is a reconstruction flagged for confirmation; never show it.
- Trap: several item labels contain "portal" and "SDMS" ("Fill mock drill on web portal", "File subsidy & claim in SDMS", "Upload TDS certificate to IOCL portal"). They are the dealer's own task names and may appear on screen, but pick the physical ones (first-aid box, solar panels, emergency number) for the picture and never speak them.
- Trap: items marked HELD (our collection failed) count as compliant for up to 7 days and stay off the pending list. Do not claim "every item is checked every day".

**9. Video potential 8/10. Motion moment:** the percentage ring filling to 85 with a hatched, unfilled sliver labelled "4 अभी जाँची नहीं गईं" that stays visible; then the photo-ask bubble, "Send photo", "Received", and the next morning's line ticking 85 to 87 on screen.

---

### 3.5 Document reminders (papers that run out)

**1. Name / slug.** The dealer sees a request in the chat; the Hindi word is "काग़ज़" / "काग़ज़ात" (papers). Catalog titles: "Fire NOC / फायर एनओसी", "Explosive (PESO) licence / विस्फोटक (PESO) लाइसेंस", "DTO trade licence / DTO ट्रेड लाइसेंस", "Weights & Measures licence / नाप-तौल लाइसेंस", free-form "A document MDG asked for / MDG ने जो माँगा". Slug `document-reminders`. (Kavach item names spell it "नापतोल"; the card marketing panel says "नापतौल". Use "नाप-तौल" as the paper ask does.)

**2. Status.** Built 8 Sep (`2b316c4`). Asks in the chat since 13 Oct (`b8395d5`). Dealer-facing: yes. **The deploy is inert until the hand-run `node dist/scripts/migrateDocumentValidity.js` is applied. Whether it was run in prod is UNVERIFIED** (memory says "single most likely way to ship it doing nothing"). Reminders land in the chat; push is not guaranteed (it reached the owner once on 12 Oct; fleet-wide reach not measured since 5 Sep). A filed paper is stored as an accepted request (one record, not a second store).

**3. What the dealer receives.**
- A reminder per step of the ladder, as an MDG message with the black button. Default ladder 15, 3, 2, 1 days before expiry. Per kind: Fire NOC uses the default (12-month paper); PESO licence 60, 30, 15, 7, 3, 1 (36 months); DTO trade licence and W&M licence 30, 15, 7, 3, 1 (12 months). At most one message per paper per pass; the words use the real days left, not the ladder step. The first reminder also opens the renewal request so there is somewhere to put the new paper.
- Message: hi "फायर एनओसी — 3 दिन बाकी। नया वाला भेज दीजिए।" / "नीचे “फ़ोटो भेजें” दबाइए, या फ़ाइल चुनिए।" en "Fire NOC: 3 days left. Please send the new one." / "Tap “Send photo” below, or choose a file." Day counts: "{n} दिन बाकी" / "{n} days left"; "1 दिन बाकी" / "1 day left"; once it lapses (fires once, ever): "{n} दिन पहले ख़त्म" / "Expired {n} days ago". **Counts only, never a raw date.** Push titles "काग़ज़ की तारीख़ ख़त्म हो रही है" / "Document expiring", "काग़ज़ की तारीख़ निकल गई" / "Document expired". Fixed push heading when MDG asks first: "MDG को एक काग़ज़ चाहिए" / "MDG needs a document".
- After the dealer sends: bubble "भेज दिया — MDG टीम देख रही है", then MDG's reply "✓ मिल गया — फायर एनओसी" quoting the photo. A person at MDG, never the dealer and never automation, marks a paper received.
- A dealer can also ask in chat and get an answer: hi "आपका {paper} — {expiry} तक वैध।" en "Your {paper} — valid till {expiry}." (that one prints the date with its year). Lapsed: "… इसकी वैधता {expiry} को ख़त्म हो चुकी है।" Not dated: "… इस पर मियाद की तारीख़ दर्ज नहीं है।"

**4. Visual anatomy.** Chat ask bubble (section 2). Real capture exists: `mdg-app/store-assets/screenshots/screenshot-03-papers.png` and `captures/03-papers.png` (fictional outlet; shows a "Fire NOC" ask bubble with an admin note "The old one runs out this month. Please send the renewed copy.", black "Send photo", outlined "Choose file", above it a photographed Weights & Measures licence marked "SPECIMEN" and MDG's quoted reply "✓ Received — Weights & Measures licence"). That specimen licence is `mdg-app/store-assets/capture/demo/licence-photo.jpg`, safe to reuse. No standalone card or countdown chip exists in the app; a countdown is the video's own graphic, built from the real strings "15 दिन बाकी / 3 दिन बाकी / 2 दिन बाकी / 1 दिन बाकी".
- Prior art: `marketing/panels/p-dates.png` (stylised, old teal header, "नापतौल कैलिब्रेशन 9 दिन बाक़ी ... क्या करें: कुछ नहीं। तारीख़ हमने पकड़ ली है।"; **not faithful**, the real flow asks the dealer to send the new paper), `marketing/films/graphics/thumbs/G-docs.jpg`.

**5. Invented figures.** Fire NOC, ladder 15, 3, 2, 1: the 15-day message reads "15 दिन बाकी", then 3, 2, 1. Lapsed notice: "1 दिन पहले ख़त्म". Do not print a calendar date. Do not show a 0-day ("Expires today") reminder: the default ladder has no step at zero.

**6. Pain and hooks.** Pain 2: the date that went past and nobody remembered.
- Countdown: "15… 3… 2… 1…" / "Fire NOC: 15 days left."
- Question: "आपकी फायर एनओसी की तारीख़ कब निकल रही है?" / "When does your Fire NOC run out?"
- Fear: "तारीख़ निकल गई। किसी को याद नहीं था।" / "The date went by. Nobody remembered."

**7. Outcome line.** hi: "कोई तारीख़ चुपचाप नहीं निकलती: पहले से याद, और नया काग़ज़ एक फ़ोटो में।" en: "No date slips by quietly: reminded ahead, and the new paper is one photo."

**8. Safe vs forbidden.**
- Safe: papers expire; reminders 15, 3, 2 and 1 days before for the default ladder, longer for some papers; a message in the chat with a "Send photo" button; a filed paper stays on file; a person at MDG marks it received.
- FORBIDDEN: any consequence of an expired Fire NOC, PESO, trade or W&M paper (fines, sealing, supply). None is evidenced. The only safe consequence in the whole product is the mock-drill order hold.
- FORBIDDEN: "we renew it for you". MDG reminds and files; the dealer obtains the renewed paper.
- FORBIDDEN: "22 deadline windows tracked", "renewed 9 days early", "filed before the 11am cut-off" (fact file section 6, illustrative). Also "कुछ नहीं करना है".
- FORBIDDEN: promising a phone buzz. Show the chat message, not a lock-screen notification as a guarantee.
- FORBIDDEN: "automatic", "digital", "online", "AI" in spoken lines.
- Trap: Fire NOC validity 12 months is "a prefill; the paper governs". Do not say Fire NOCs last a year.
- Trap: the schedules ladder per paper kind is MDG's own, not an oil-company rule.

**9. Video potential 8/10. Motion moment:** a due-date chip stepping down 15 to 3 to 2 to 1 on a paper sheet, each step dropping a bubble into the chat, the last one answered by a thumb on the black "Send photo", the paper flipping to "✓ मिल गया" with a stamp-style tick.

---

### 3.6 Inspection reports

**1. Name / slug.** "Inspection Reports" / "इंस्पेक्शन रिपोर्ट" (Settings service list name). Slug `inspection-reports`. Public service line 03 is "Inspection Compliance / इंस्पेक्शन की तैयारी" (a human service line; nothing in the app).

**2. Status.** LIVE internally since 13 Aug (shared `0149f78`, `9adf767`). Dealer-facing: **NO**. Router is `requireRole('admin')`; the only surfaces are the admin's per-dealer Data Vault pane (last 3 reports plus a total count, with the full "Retail Outlet Inspection and Analysis Report, Form SL.5(R)" opened in a drawer) and the roster's Inspection column. Memory note: "dealers see nothing new".

**3. What the dealer sees.** Nothing. The one visible effect is indirect: an inspection resets the DSR measuring window, and a new inspection now moves the DSR window by itself (shipped 29 Aug, `42b2aab`). The dealer sees it as the report's cumulative / since-inspection figures starting again.

**4. Visual anatomy.** None to recreate. The admin pane is an internal screen and may never be shown.

**5. Figures.** Use only the public explainer's rounded case: an outlet inspected, its book carried on from a baseline four months older, 1.78 lakh litres of old receipts still in the sum (fact file section 7). Do not show an inspection number, date or form.

**6. Hooks (belong to the DSR / inspection-window video, not a feature reel).** "जिस दिन इंस्पेक्शन हुआ, उस दिन पुरानी गिनती ख़त्म।" / "The day of an inspection, the old count ends." (this is the existing explainer's hook).

**7. Outcome line.** hi: "इंस्पेक्शन के दिन आपका हिसाब अपने आप नई गिनती पर।" en: "On inspection day your count starts again." (check against the DSR research before use; "अपने आप" is close to the banned word "automatic" in spoken lines, so rephrase or drop it.)

**8. Safe vs forbidden.** Safe: Form SL.5(R) is named in the public explainer; the inspection day closes the measuring period; IndianOil's inspection checks stock, density, logs, samples, equipment. FORBIDDEN: any picture of the admin vault pane, "we read your inspection report", "last 3 reports", "47 inspections", any real inspection date or number, any claim that MDG "predicts" or "prepares you to pass".

**9. Video potential 2/10 as a feature reel.** Fold the dealer-visible effect into the DSR "inspection window" video; fold "inspection-ready" into the Kavach standing reel without saying how.

---

### 3.7 Festival greeting band

**1. Name / slug.** Festival greeting band. Admin screen name "Festival greeting" (super-admin only, `/festival`); dealers never see a screen, only the band. Slug `festival-band`.

**2. Status.** LIVE since 15 Aug, **credit card only** (not DSR, not any other card; confirmed: the only callers are `creditDod` and `renderCard.ts`). Dealer-facing: indirect. A band is on only when a super-admin has switched it on for a window; the window is inclusive of both ends; nothing expires, the window simply stops containing today.

**3. What the dealer sees.** The top brand strip of the Credit & DOD card picture is replaced by a greeting band, 86 px high, border-bottom 2 px in the card's border colour. Everything below (amount, due date, limits) is untouched.

**4. Visual anatomy** (`shared/src/data/festivals.ts`, `report/festivalBand.ts`).

| Key | Hindi greeting | English | Style | Colours | Ink | Emblem | Default days | Date |
|---|---|---|---|---|---|---|---|---|
| diwali | दीपावली की हार्दिक शुभकामनाएँ | Happy Diwali | gradient 90deg a to b 50% to c | `#f59e0b`, `#fef3c7`, `#d97706` | `#7c2d12` | lit diya SVG both sides | 5 | admin types it (lunar) |
| holi | होली की हार्दिक शुभकामनाएँ | Happy Holi | gradient | `#ec4899`, `#fde68a`, `#22c55e` | `#7c2d12` | none | 2 | admin types it |
| new-year | नववर्ष की हार्दिक शुभकामनाएँ | Happy New Year | gradient | `#0ea5e9`, `#f8fafc`, `#6366f1` | `#0c4a6e` | none | 2 | 01-01 |
| independence-day, republic-day | | | stripes | tricolour | | Ashoka Chakra | 3 | 08-15, 01-26 |

  Row: emblem, Hindi (27 px/800), a faint "·", English (20 px/700, 82% opacity), emblem. Gradient festivals sit the text in a near-white pill (`rgba(255,255,255,0.94)`, 999 px radius, soft shadow); tricolour drops the pill and uses 26/48/26 stripes.
- **Do NOT use independence-day or republic-day (flag and Chakra).**
- Rendered sample route: `mdg-backend/scripts/preview-festival-card.ts <out.png> <festival-key>` renders a sample credit card with a band. It needs the backend's own Chromium, which this laptop does not have installed (no Playwright browser cache); use the HTML builders with system Chrome (section 8) or the `channel: 'chrome'` pattern in `mdg-app/store-assets/capture/render-cards.mts`.
- Existing credit-card imitations: `mdg-demo/src/screens/CreditCard.tsx`, `mdg-demo/public/credit-card/{due,advance}.jpg`, `marketing/panels/p-credit.png`.

**5. Invented figures** (reuse the fact file's, they check): current limit ₹25,00,000; availed ₹18,42,650; available ₹6,57,350; due ₹4,86,120 by 26-08; 73.7% used. 25,00,000 - 18,42,650 = 6,57,350. 18,42,650 / 25,00,000 = 73.706 so 73.7%.

**6. Hooks.** A seasonal bumper, not a feature reel: "आपकी रिपोर्ट पर MDG की तरफ़ से दीपावली की शुभकामना।" Visual contradiction: a serious amount-and-date card gains a lit diya.

**7. Outcome line.** hi: "आपकी रिपोर्ट के ऊपर त्योहार की शुभकामना।" en: "A festival greeting on top of your report."

**8. Safe vs forbidden.** Safe: Diwali, Holi, New Year; greeting text above. FORBIDDEN: tricolour, Chakra, "Independence Day" band; claiming the band is on all reports (credit card only); a date for Diwali as fact: Diwali 2026 is on or about 8 Nov 2026 per general knowledge, UNVERIFIED here and the product does not know it (the admin types it). Time the post for the real window.

**9. Video potential 5/10 as a 6 to 8 second end-slate on the credit-card reel or a stand-alone greeting reel.** Motion moment: the gold marquee strip slides off the top of the card and the Diwali band rolls in, the diya flame flickering (a small shape flicker only; the project bans glows and bursts in its sample direction).

---

## 4. Anything else compliance-shaped that reaches the dealer

| Item | Reaches dealer how | Belongs to | Note |
|---|---|---|---|
| The 45-item, 9-cycle compliance load | Not a screen; the Kavach card and daily line are its outputs | Kavach overview video (strong stand-alone, verified numbers) | "45 on the clock" only; never "required by IndianOil". Ten daily; the heaviest item (the DAR filing, 460 points, every two years) is the rarest: "the job done least often is the one that goes missing" is a true, quotable fact-file line |
| Mock drill | Inside supply conditions and a Kavach item | Supply video; a public explainer exists | The one safe consequence: miss it and the next fuel order can be held. "Doing it is not enough, if it is not filed it did not happen" |
| Electrical audit non-compliance | Supply condition 6 | Supply video | Public explainer `equipmentAudit.ts` exists |
| Stock variation within limit | DSR panel two, plus a Kavach item closed by automation | DSR research | 4% band is the one quotable rule (clause 5.1.11) |
| Ledger Watch card | Picture, labelled "यह DOD जमा राशि नहीं है / This is not your DOD deposit amount" | Money research | Compliance-adjacent; first run found 3,163 lines in 12 kinds |
| Outlet registration file (licence numbers and expiry dates) | The first line can answer "what is my licence number" in chat | Documents | Mirrors the filed paper's date; Info tab is admin-side |
| Admin alerts, assurance, tickets | Internal | none | Never show |

---

## 5. Cross-cutting method-leak audit of strings that exist on dealer-facing cards

| String | Where | Why it is dangerous | Use in video |
|---|---|---|---|
| "पोर्टल से लिया गया / Read from the IndianOil portal" | RO supply card footer | Names the source and the act of reading | Remove |
| "RO Supply is Unblocked in SAP." | RO supply card footer right | Source system | Remove |
| "… on the portal." in 3 supply actions | supply action lines | Mild; "portal" is a trade word but banned in spoken lines | Keep in a small card caption at most; never speak |
| "None found / नहीं मिला" | water grid, only on MDG-written windows | Shows MDG made the record | Hide the column |
| "LAST CHECKED / आख़िरी जाँच" | water tile | Implies scheduled reads | Drop the tile |
| "UPDATED ON … 14-10-2026 01:10" | water grid | The portal's own stamp | Fine as a time stamp column only if the idea of who entered is absent; safer to show a plain tick |
| "verified by MDG / MDG टीम द्वारा जाँचा" | Kavach card footer | Reads as a certificate | Soften, or crop |
| Condition names with typos ("Quaterly", "Comunicated") | supply card | Looks like our error | Correct them |
| Outlet code in the header pill | all cards | Real code is forbidden | Replace with an invented marker or hide |
| `MDG` text tile in place of the logomark | house cards | Not the brand mark | The real mark is `mdg-demo/public/brand/logo-mark.png` |
| Marketing panels p-supply, p-dates | `marketing/panels/` | Older teal header; "कुछ नहीं करना"; "बाक़ी हम कर देंगे" | Do not copy the promises |

---

## 6. Prior art, so the reels do not repeat it

Public trade explainers (guide.mdgservices.in, `mdg-demo/src/beats/social/*.ts`, renders `mdg-demo/out/gen-*-hi.mp4` and `-en.mp4`): `waterIngress.ts` ("दो घंटे की खिड़की", also teaches the four-question row, which this series must not), `supplyConditions.ts` ("सात शर्तें"; its source notes explain the hedging rule), `densityAt15.ts`, `mockDrill.ts`, `inspectionWindow.ts`, `equipmentAudit.ts`, `wallPapers.ts`, `dailyBooks.ts`. Marketing film shots with approved Hindi voice lines: `marketing/shots/S05-supply.json` "लोड क्यों रुका है — और उसे खोलने का एक क़दम।", `S04-density.json` "टैंकर की डेंसिटी उसी दिन आपके हाथ में।", `S01-dates.json` "हर तारीख़ की ख़बर, तारीख़ आने से पहले।". The Kavach films (teaser, explainer, full, 38.6 s short) also describe some of this; their scripts say सिस्टम/डेटा/डिजिटल and are not the rule for this series.

---

## 7. Getting real or faithful screens without touching production

1. **Already captured (use as is):** `mdg-app/store-assets/captures/01-chats.png`, `02-report.png`, `03-papers.png`, `04-staff-hi.png` (390 x 811 @3x, raw) and the framed `screenshots/screenshot-0N-*.png` plus `feature-graphic.png`. Published on Play, so allowed imagery. Fictional outlet "99Z", fictional first names (Prakash owner, Mahesh manager).
2. **Capture more with the throwaway local stack:** `mdg-app/store-assets/capture/stack.sh up` (in-memory Mongo on 27099, stand-in file store on 9100, API on 4100, app on 5198, every outside service switched off; both seed and capture refuse any database but `mongodb://127.0.0.1:27099/dk_local`). Then `node seed.mjs`, `node capture.mjs`, `./stack.sh down`. The Fire NOC ask and the "Received" reply are already seeded; adding a density register ask, a Kavach photo ask, a Kavach card picture and the water/supply cards means extending `seed.mjs` (MDG's side goes through the API; the cards can be rendered to PNG with the section 8 recipe and attached through the admin share route). Memory `local-stack-for-ui-checks` has the same recipe for the admin.
3. **Faithful imitation in Remotion:** `mdg-demo/src/components/PhoneFrame.tsx`, `screens/ChatScreen.tsx`, `theme.ts` (mirrors the client tokens). The card HTML builders are pure functions, so their HTML can be dropped into a scene and scrolled; or render PNGs and pan across them.
4. Cards at 2x are 2088 px wide and 3,000+ tall for water; plan scroll and zoom, not a static show.

---

## 8. Tested recipe: render the real cards locally with invented data

Run on this laptop on 17 Oct, no database connection, no network, nothing written to the repo. The card builders (`waterIngressCardHtml`, `roSupplyCardHtml`, `buildKavachCardHtml`) are pure. Importing them loads `config/env.ts`, which validates env and loads the laptop `.env` (production values) into memory without using them, so set the two required values first (dotenv never overrides an existing variable):

```
cd /Users/dissu/Documents/PP/mdg-service/mdg-backend
env MONGODB_URI=mongodb://127.0.0.1:1/none SCHEDULER_ENABLED=false \
    JWT_SECRET=local-render-only-secret-xxxxxxxx \
  ../node_modules/.bin/tsx <absolute path to gen.mts>
```

`gen.mts` imports the three modules by absolute path (`.../mdg-backend/src/services/waterIngress/card.ts` etc.), builds invented inputs and `writeFileSync`s HTML. **Give it an absolute output path:** the first run wrote relative to the working directory and put six stray `.html` files in `mdg-backend/`; they were moved out to the scratchpad and the repo is clean again (the three modified files in `git status` belong to another session and were not touched).

Screenshot with system Chrome (the backend's bundled Playwright Chromium is not installed here):

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --user-data-dir=<tmp>/prof --window-size=1060,1700 --virtual-time-budget=3000 \
  --screenshot=<out>.png file://<html>
```

Wrap it with `perl -e 'alarm 40; exec @ARGV' ...` in case it hangs (it did once, with another headless Chrome already running). Window-size screenshots include the `#f4ede0` page around the card; to crop to the card use Playwright `page.locator('#frame').screenshot()` at `deviceScaleFactor: 2` with `channel: 'chrome'`, as `render-cards.mts` does.

Samples rendered (scratchpad, will not survive the session): `/private/tmp/claude-502/-Users-dissu-Documents-PP-mdg-service/236ce7c5-ac26-4498-9e9b-332a87c88170/scratchpad/cards/{water-missed,water-clean,supply-pending,supply-stopped,supply-clear,kavach}.png` plus the `.html` files and `gen.mts`. Re-create with the recipe if they are gone. Inputs used: water `WaterIngressDayLog` with 12 slots labelled "12:00 AM - 02:00 AM" to "10:00 PM - 12:00 AM", `operating {from:'00:00',to:'00:00'}`, `now = 2026-10-15T04:00Z`; supply `RoSupplyStatusSnapshot` with seven `rows` of `{description, mark:'YES'|'NO'}`, `blocked` true/false, `failingCount`; Kavach `KavachCardData` with `score {scored:true, overallPct:85, validPoints:3180, totalPoints:3740, notYetVerifiedCount:4}` and four `pending` entries (two `awaitingDealer:true`) plus `pendingOverflow:3`.

---

## 9. Ranking and a suggested set from this topic

| Rank | Reel | Potential | Why |
|---|---|---|---|
| 1 | Supply status ("seven lamps") | 9 | Fear word, a binary state flip, one clean visual, no dealer action needed beyond the step. Approved film line exists |
| 2 | Kavach standing (ring with the unchecked sliver, daily line, photo ask) | 8 | Verified numbers (45, 9, 10 daily), the honesty device is a real differentiator, three real surfaces |
| 3 | Document reminders (countdown into "Send photo") | 8 | The real app capture already exists; plain, repeatable, emotionally clear |
| 4 | Water testing record (24-hour dial) | 7 | Strong rhythm; riskiest for method leaks, so keep it to the day card |
| 5 | Kavach "45 on the clock" overview | 7 | Pure counting motion; can open the series; needs the "not mandatory" guard |
| 6 | Tanker density (figure into chat, then the morning ask) | 6 | Small payload; use one of the two flows |
| 7 | Festival band | 5 | Seasonal bumper; time it for the Diwali window |
| 8 | Inspection reports | 2 | Admin-only; fold into the DSR inspection-window video |

---

## 10. UNVERIFIED, and what to ask the owner

1. **How do the water and supply cards actually reach dealers?** WhatsApp from the share sheet, or uploaded into the chat? The video should show the real path. (Code posts nothing automatically; a comment in `routes/v1/messages.ts` lists the water card among service-written files, but no call site exists.)
2. **Is Kavach switched on for any real outlet** (`dealerFacingEnabled`)? And is "verified by MDG / MDG टीम द्वारा जाँचा" on the card footer acceptable in public, or should the recreation say "MDG की जाँच के अनुसार"?
3. **Was `migrateDocumentValidity` run in production?** Until it was, Fire NOC reads "does not expire" and no ladder fires. Also: are real papers being chased today?
4. **Same-day density.** Does the figure really reach the dealer the same day the tanker lands? The code reads once a morning. The approved film line says "उसी दिन".
5. **The percentage on the water card.** The AI deliberately never states it (a percentage is a compliance statement). OK to show "83%" small, or lead with "10 of 12" only?
6. **Diwali timing.** Diwali 2026 is about 8 Nov (not verified here). Is a seasonal bumper wanted, and is the band to be shown on the credit card only?
7. **Spelling.** टैंक vs टंकी, नापतौल vs नापतोल vs नाप-तौल, डेंसिटी vs घनत्व. Pick one set for all reels (this file recommends the chat's own: टंकी on the card, नाप-तौल, डेंसिटी).
8. **Permission to extend the local seed** with water, supply, Kavach and density scenes so the screens are real captures, not imitations.
9. **A prop** for the dealer's density register page (blank ruled page, no real writing) and a Fire NOC specimen (the existing specimen is a Weights & Measures licence).
10. Not checked in this pass: the other four service lines (05, 06, 07, 09) are human services; the DSR, credit and load-planner cards belong to other research topics.
