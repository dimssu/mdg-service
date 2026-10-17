# Reel catalogue — the brief for every reel

Fifteen reels, in build order. Each brief is what a prompt is cut from: the
feature as the dealer receives it, the one takeaway, the concept and its
signature device, hooks, checked figures, and what must never appear. Every
figure here is invented and internally consistent; the arithmetic is shown
where it matters. `DIRECTION.md` applies to all of them.

**Why this order:** reel 01 builds the shared kit on the richest screen (the
DSR card + the chat); 02–04 reuse the card pipeline; 05–08 lean on the chat
components; 09–14 are the quieter or human-service stories; 15, the anthem,
quotes every other reel's signature device, so it comes last.

| # | Reel | Signature device | Style | Status flag |
|---|---|---|---|---|
| 01 | DSR — रजिस्टर वाली रिपोर्ट | paper row → picture → paper | ledger editorial | live |
| 02 | Stock check — एक अंतर, दो फ़ैसले | asymmetric band, mirror flip | precision instrument | live |
| 03 | Credit & DOD — कितना, कब तक | split-flap date + 85% bar | departure board | live |
| 04 | Supply — लोड क्यों रुका है | seven signal lamps | control panel | live (forwarded by a person) |
| 05 | Papers — तारीख़ चुपचाप नहीं निकलेगी | the 15·3·2·1 staircase | papercraft 2.5D | live (prod switch-on unverified) |
| 06 | One chat — मेन्यू नहीं, बस चैट | everything collapses into one row | keynote UI choreography | live |
| 07 | Warriors — जिसने काम किया, उसका हिसाब | chips fill a bar to exactly 100 | scoreboard | live |
| 08 | Kavach — 45 काम, एक नज़र | 9 orbit rings collapse into one ring | orbital diagram | **switched off for dealers by default — owner to confirm** |
| 09 | Water testing — 12 पारियाँ | the 24-hour dial | horology | live (forwarded by a person) |
| 10 | Next tanker — अगला टैंकर कब? | chambers lock into a tanker | isometric logistics | **drafts only — owner to confirm** |
| 11 | Ledger Watch — तीसरी लाइन | statement X-ray | document scan | live (no real send seen) |
| 12 | Sunday — इतवार हो, तब भी | one lamp in the dark | dark-stage minimalism | human service, no screen |
| 13 | Density — तीन दशमलव | odometer into a register line | macro typography | live |
| 14 | Live in 7 days — एक कॉल से शुरुआत | the week strip | calendar typographic | promise, no screen |
| 15 | Anthem — नौ काम, एक हाथ | the logo ring closes over nine jobs | logo-driven recap | last |

Not made, on purpose: per-tanker profit (an admin tool; would need an invented
margin), the pump-slip reader (admin-only, uses a model), inspection reports
(admin-only; folded into 01/08), first-reply tickets (would invite "who is
answering?"; a quiet beat in 06 at most, never narrated), XTRA and Prepare Pro
Manager alone (too thin — one beat each in 15), the festival band alone (a
Diwali cut of 03 if wanted; never the tricolour bands).

---

## 01 · DSR — "रजिस्टर वाली रिपोर्ट" · `01-dsr`

**What he gets.** For each day, two pictures in his Dealer Kavach chat: the
sales sheet laid out in his own register's column order (yesterday's row
closed, today's row open, a glance strip on top) and the stock check. Anyone
at the pump can copy it into the register. A person at MDG looks each one
over before it is sent.

**Takeaway.** "मेरे रजिस्टर वाला हिसाब, भरा-भराया, मेरे फ़ोन पर।"

**Concept — "Paper becomes picture becomes paper."** The dealer's hand-ruled
register row lifts off the page, flips in 3D and lands as the picture in the
chat; at the end the card's cells fly back into the paper register, because
anyone can copy it. **Style:** ledger editorial — the register's ruled lines
are the motion grid; every move snaps to a rule.

**Hooks.** `रात 11:30` / `DSR का हिसाब फिर नहीं मिल रहा?` (हिसाब मिलना = the sum tallies;
"DSR नहीं मिला" would read as "didn't arrive") · `4,222 L — कल की बिक्री, भरी-भराई` ·
a blank register row beside the same row already full.

**Figures** (the fact file's published rows; checked against the live
builder). Report for **Friday 21 August 2026** (शुक्रवार, 21 अगस्त). One product
only: हाई स्पीड डीजल / HIGH SPEED DIESEL, `TANK -1`. A single-tank card has **no
STOCK column**: its columns are DATE · DIP · WATER DIP · OPENING STOCK · RECEIPT ·
TOTAL STOCK · OPENING METRE READING 1–4 · TESTING · SALES · CUMULATIVE SALES ·
REMARKS. A row's DIP is the reading that goes with its own OPENING STOCK.

| Row | DIP | WATER | OPENING STOCK | RECEIPT | TOTAL STOCK | TESTING | SALES | CUMULATIVE |
|---|---|---|---|---|---|---|---|---|
| 20-Aug (yesterday, closed) | 141 | 0 | 12,480 | 6,000 | 18,480 | 12 | 4,222 | 78,310 |
| 21-Aug (today, chip आज) | 160 | 0 | 14,246 | 0 | 14,246 | 12 | amber `—` | amber `—` |

12,480 + 6,000 = 18,480 · 18,480 − 14,246 = 4,234 · − 12 testing = **4,222** ·
19-Aug cumulative 74,088 + 4,222 = 78,310 · the stock in the tank now (14,246)
is today's OPENING STOCK. Meters: four nozzles whose today-minus-yesterday
steps sum to **4,234** (e.g. 1,060 + 1,050 + 1,070 + 1,054), because sales =
Σ meter steps − testing; 7-digit readings, never grouped. Glance strip:
`SOLD 20-Aug 4,222 L` · `STOCK IN TANK NOW 14,246 L` · `RECEIVED 20-Aug 6,000 L`.
Stock check (period since the inspection on 1 Aug): variation **−180 L**
(printed `-180`); band in two parts: 4% of tank stock **570 L** (4% × 14,246 =
569.8) + 0.25% evaporation on sales **196 L** (0.25% × 78,310 = 195.8) = **766**
on the shortage side (570 on the excess side) → `स्टॉक सही है / WITHIN
PERMISSIBLE LIMIT`, `कुछ नहीं करना — स्टॉक सीमा में है`. Since-inspection lines:
receipt 84,000 L, testing 240 L. Chat caption: `📊 DSR · 21 अगस्त — स्टॉक वेरिएशन
सीमा में है।`

**Digest** — write a bespoke one; patching `digest.mjs`'s days produces a
1,712 px two-product card with wrong meters and band parts. Fields:
`products: [HSD]` only · `tankNos: [1]`, `tankLabel: 'TANK -1'`,
`productLabelHi: 'हाई स्पीड डीजल'`, `tankNo: 1` in every `rows[].tanks[]` and
`ledger[]` · rows as in the table (20-Aug `closed: true`; 21-Aug `sales` and
`cumulativeSales` null, `closed: false`) · meter steps summing to 4,234 ·
`receiptSource: 'iras'` on both rows (so no hand-entered / dip-inferred marks
or legends print) · `variation: -180`, `variationNotWithinLimit: 0`,
`permissibleVariation: 765.615`, `sinceDate: '2026-08-01'`,
`totalReceiptSinceInspection: 84000`, `totalTestSinceInspection: 240`,
`breakdown: { actualDipStock: 14246, permissible: 569.84, afterTesting: 78310,
leakage: 195.775 }` (the printed percentages are recovered from these, so the
card reads 4% and 0.25% only if they are exact) · `shiftTime: ''` (drops both
clock times) · keep the code but hide it with CSS. Verified to render 1,360 px
wide (frame 1,432 × 842) with 570 L, 196 L and 766.

**Outcome line.** `कल की बिक्री, आज का स्टॉक — आपके रजिस्टर के खानों में।`

**Never / strip.** Clock times on the card (`shiftTime: ''` drops both) · the
date strip's left label `CURRENT DATE AND TIME` (hide; keep the date) · the code in
both places it prints (header `.code`, footer `.foot-r`) · a timestamp on the
chat bubble · the `M`/`D` superscripts (never narrate how a receipt was worked out) ·
"every morning", "WhatsApp", "automatic" · "three books before 10 am" as a rule
(that schedule is one dealer's house rule) · XTRAPREMIUM / XTRAGREEN product
names · the uncommitted Hindi-only redesign.

**Sound leaning.** Voice + music, 120 BPM. **Refs:**
`mdg-app/store-assets/capture/demo/dsr-2026-10-15-{sales,variation}.png`,
`mdg-app/store-assets/captures/02-report.png`, `_research/features-money-stock.md` §2.

---

## 02 · Stock check — "एक ही अंतर, दो फ़ैसले" · `02-stock-check`

**What he gets.** The first (left) picture of the DSR pair: a plain verdict — stock is fine /
short / over — with the allowed band shown as its two parts, the gap, and one
line on what to do; beyond the band, the clause and its consequence.

**Takeaway.** "नोटिस बनने से पहले पता चलता है — स्टॉक सीमा में है या नहीं।"

**Concept — "Same gap, opposite verdict."** An asymmetric band on a number
line: the pin at −430 sits inside the long shortage side; a mirror flip moves
it to +430 and it lands 30 L outside the shorter excess side. The instrument
is the reel's own drawing, so it stays black, white and warm grey, with the
30 L overshoot as the beat's one gold. Green and deep red arrive only inside
the real card, whose verdict box makes the turn from green to red.
**Style:** precision instrument / Swiss data-viz: hairline scales, tick labels,
one moving pin.

**Hooks.** `−430 L: सीमा में। +430 L: सीमा से बाहर।` (parallel, the card's own words;
`ठीक` read as "a 430 L loss is fine") · `तेल उड़ सकता है — हवा से आ नहीं सकता।`
("टंकी में आ नहीं सकता" contradicts every tanker) · `4% की सीमा — पर दोनों तरफ़ बराबर नहीं।`
(`छूट` reads as a discount; keep it for the evaporation part only). Revised in reel 02's prompt review.

**Figures** (fact file §4, checked). 10,000 L in the tank, 20,000 L of diesel
sold since the inspection. Shortage band = 400 L (4% of 10,000) + 50 L (0.25% of
20,000) = **450 L**. Excess band = **400 L** (evaporation applies to a shortage
only). Shortage case: book 10,430 L, dip 10,000 L → **−430 L**, inside by 20 L.
Excess case: book 9,570 L, dip 10,000 L → **+430 L**, beyond by **30 L**. Card
strings: within `स्टॉक सही है`; excess `स्टॉक मान्य सीमा से भी ज़्यादा है / EXCESS
BEYOND PERMISSIBLE LIMIT` + tag `बिक्री व सप्लाई तुरंत रुक सकती है`. Band printed as
`4% of tank stock (400 L) + 0.25% evaporation & handling on sales (50 L)`.
Consequences only in the card's words: excess beyond band → samples to lab,
sales and supply can stop immediately; shortage beyond band → samples tested,
written explanation called for, supply stops only if unsatisfactory.

**Digest — verified with the live builder (17 Oct; HEAD `a56f323`).** The
fixture `kit/cards/fixtures/02-stock-check.mjs` draws three cards. One diesel
tank, `TANK -1`, report for **Tuesday 8 September 2026**, inspection on
2 Sep, receipts since 24,000 L, testing since 72 L. Meters since the inspection
total 20,072, so 20,000 L sold after testing. Dip stock 10,000 L. `shiftTime: ''`.
- `var-short`: `-430` (the card prints a hyphen; reel type uses `−`), band
  `4% of tank stock (400 L)  +  0.25% evaporation & handling on sales (50 L)`,
  note `नियम 5.1.11 — टैंक स्टॉक का 4% और बिक्री पर वाष्पन/हैंडलिंग छूट`,
  PERMISSIBLE `450`, NOT WITHIN `0`, verdict `स्टॉक सही है` /
  `WITHIN PERMISSIBLE LIMIT`, action `कुछ नहीं करना — स्टॉक सीमा में है`.
  Frame 1,112 × 1,160 px.
- `var-excess`: `+430`, band `4% of tank stock (400 L)` with the note
  `वाष्पन छूट सिर्फ़ कमी पर मिलती है · the evaporation allowance applies to a
  shortage only`, PERMISSIBLE `400`, NOT WITHIN `+30`, deep-red verdict
  `स्टॉक मान्य सीमा से भी ज़्यादा है` / `EXCESS BEYOND PERMISSIBLE LIMIT`,
  tag `बिक्री व सप्लाई तुरंत रुक सकती है · SALES CAN BE STOPPED IMMEDIATELY`,
  consequence `सीमा से ज़्यादा (+) वेरिएशन पर सैंपल लैब भेजा जाता है और सभी
  उत्पादों की बिक्री व सप्लाई तुरंत रोक दी जाती है।` Frame 1,112 × 1,335 px.
  Hide the whole `.action` box (`≈ 30 लीटर की टेस्टिंग/निकासी दिखाकर स्टॉक ठीक
  करें` / `… before the next decant`) and the whole `.cq` consequence box: its
  label prints `MDG दिशा-निर्देश 5.1.11`, and its sentence says sales "are
  stopped" where the fact file says "can be". The verdict's tag keeps the
  card's own "can" (`रुक सकती है`). Decided in reel 02's prompt review, 17 Oct.
- `sales` (frame 1,432 × 842): only for the bubble's right picture. Yesterday's row closes on
  today's opening: 7,720 + 6,000 = 13,720 − 10,000 = 3,720 − 12 = **3,708**.
- Chat captions (the backend's own lines): within `📊 DSR · 8 सितंबर — स्टॉक
  वेरिएशन सीमा में है।` · out of band `📊 DSR · 8 सितंबर — स्टॉक वेरिएशन सीमा
  से बाहर है, कृपया देखें।`
- Both variation cards carry the outlet code twice (header pill, footer) and
  the date strip's left label `CURRENT DATE AND TIME · दिनांक व समय`: the kit's
  `DSR_HIDE` hides all three.

**Outcome line.** `नोटिस बनने से पहले पता चले — स्टॉक सीमा में है या नहीं।`

**Never / strip.** The advice lines `≈ N लीटर … स्टॉक ठीक करें` (crop: they read
as "adjust the stock to fit") · hide the consequence box's `.cq-l` line (it prints `MDG दिशा-निर्देश 5.1.11`; never rewrite card text) and keep `नियम 5.1.11` from the band note ·
the 600 KL tier · any fine · "your pump will be shut" · never imply a dealer
can fix a real excess by arithmetic.

**Sound leaning.** Voice + music, 128 BPM (16 bars). **Refs:**
`capture/demo/dsr-2026-10-15-variation.png`, `_research/features-money-stock.md` §2.4–2.10.

---

## 03 · Credit & DOD — "कितना, कब तक" · `03-credit-dod`

**What he gets.** One picture: the due amount and due date as the hero with a
days-left verdict, the three limit tiles, a utilisation bar that turns red
from 85%, the form-of-limit chips, and an honest caveat that a payment made in
the last day or two may not show yet.

**Takeaway.** "इंडियन ऑयल को कितना जमा करना है, और कब तक — एक नज़र में।"

**Concept — "One decision, two figures."** Split-flap mechanics: the
days-left verdict flips like a departure board (5 → 3 → कल → आज) while the
amount holds still; the utilisation bar fills to 74% and the 85% line waits
above it. **Style:** departure board / mechanical counters.

**Hooks.** `टैंकर आने वाला है — क्रेडिट कितना बचा है?` · `₹4,86,120 — 26 अगस्त तक` ·
`खाता शून्य से नीचे गया — गिनती शुरू।`

**Figures** (fact file §5, checked). Current limit ₹25,00,000.00 · availed
₹18,42,650.00 · available ₹6,57,350.00 (25,00,000 − 18,42,650) · **74%** used
(the card prints whole percent) · due **₹4,86,120.00** by **26-08-2026** ·
verdicts by as-of date: 21-08 `5 दिन बाक़ी हैं` · 23-08 `3 दिन बाक़ी हैं` · 25-08
`कल आख़िरी दिन` · 26-08 `आज ही जमा करना है`. Hot-bar variant: availed
₹22,50,000, available ₹2,50,000, 90% → bar red. The 3-day rule: credit taken
past zero is repaid within 3 days, rolling past Sundays and the 2nd/4th
Saturday. Do not narrate a purchase day (26-08 would need a Sunday purchase);
if one is needed: bought Mon 24-08 → due Thu 27-08.

**Outcome line.** `इंडियन ऑयल को कितना जमा करना है, और कब तक — साफ़ लिखा।`

**Never / strip.** Footer `DATA PREPARED AT` + its time (strip the whole left
footer) · `(पोर्टल के अनुसार)` / "as per portal" in the chat caption (drop) ·
the payment-lag state (its Hindi line says पोर्टल) · any consequence of missing
the date · ever expanding DOD · "we remind you every day" · "owners only" as a
promise (not yet observed in a real send) · the festival band, except a
Diwali-only seasonal cut.

**Sound leaning.** Voice + music, 120 BPM; synthesised ticks. **Refs:**
`automation/sdms/report/renderCard.ts`, `_research/features-money-stock.md` §3.

---

## 04 · Supply — "लोड क्यों रुका है" · `04-supply-status`

**What he gets.** A picture card in one of three states — `तेल लेना बंद है` /
`N काम बाक़ी हैं` / `कुछ भी बाक़ी नहीं` — listing what is pending with the one step
that clears each, and what is already clear. A person at MDG sends it.

**Takeaway.** "लोड क्यों रुका है, और उसे खोलने का एक क़दम।" (approved film line)

**Concept — "Seven lamps."** A seven-lamp signal panel: six green, one red;
the red lamp's label slides out into the `करना क्या है` step strip; the step is
done, the lamp turns green, the hero flips red → green and the counter rolls
1 → 0. **Style:** control panel / signal board — hard geometric lamps,
tabular labels.

**Hooks.** `लोड रुका है। क्यों?` · `7 शर्तें — लोड रुके तो वजह साफ़ लिखी।` ·
`मॉक ड्रिल की, पर फ़ाइल नहीं की? तो हुई ही नहीं।`

**Figures.** Seven conditions (`shared/src/data/roSupplyConditions.ts`; use the
Hindi problem and the separate Hindi "cleared" strings). Story case: stopped,
**1 pending — the quarterly mock drill**, 6 clear (7 − 1 = 6). The one safe
consequence: miss the quarterly mock drill and the next fuel order can be held.
Lead the story with physical conditions (mock drill, electrical audit); keep
conditions 1, 2 and 4 small — their strings say डेटा / पोर्टल / OTP.

**Outcome line.** `लोड क्यों रुका है — और उसे खोलने का एक क़दम।`

**Never / strip.** The whole footer (`पोर्टल से लिया गया / Read from the IndianOil
portal`, `RO Supply is Unblocked in SAP.`) · "on the portal" in action lines ·
the portal's typos (write Quarterly, communicated) · "बाक़ी हम कर देंगे" — the
dealer, his vendor or his Sales Officer does the step · hide the card's standing-rule block (`.note.rule`, "any ONE of these… is enough
for IndianOil to stop…") and the hero sub-lines — they state an oil-company
consequence for all seven conditions; the only stated consequence is the mock
drill's · hedge with सकता है ·
any real RO code.

**Sound leaning.** Voice + music, 120 BPM. **Refs:**
`services/roSupplyStatus/card.ts`, `_research/features-compliance.md` §3.2.

---

## 05 · Papers — "तारीख़ चुपचाप नहीं निकलेगी" · `05-papers`

**What he gets.** As a paper nears expiry, MDG messages in the chat — 15, 3, 2
and 1 days before (longer ladders for some papers) — each with a black
`फ़ोटो भेजें` button. He sends the renewed paper as a photo; the line under the
ask runs `भेज दिया — MDG टीम देख रही है` → `मिल गया`; a person at MDG marks it
received; the paper stays on file.

**Takeaway.** "कोई तारीख़ चुपचाप नहीं निकलती — और नया काग़ज़ बस एक फ़ोटो।"

**Concept — "The ladder."** A paper sheet (Fire NOC) descends a staircase of
day counts 15 · 3 · 2 · 1; each step drops a chat bubble; the last is answered
by a thumb on the black button, which morphs into the photo bubble while the
state line runs to `मिल गया` with a drawn tick. **Style:** papercraft 2.5D —
paper planes with real depth and soft cast shadows.

**Hooks.** `आपकी फायर एनओसी कब ख़त्म हो रही है?` · `15… 3… 2… 1…` ·
`तारीख़ निकल गई। किसी को याद नहीं था।`

**Figures.** Fire NOC, default ladder 15/3/2/1. Message: `फायर एनओसी — 3 दिन बाकी।
नया वाला भेज दीजिए।` / `नीचे “फ़ोटो भेजें” दबाइए, या फ़ाइल चुनिए।`; inset title
`Fire NOC`; reply `✓ मिल गया — फायर एनओसी`. Other papers as passing tags: नाप-तौल
लाइसेंस, विस्फोटक (PESO) लाइसेंस, DTO ट्रेड लाइसेंस. No clock time on any reminder or ask bubble that reads as a reminder hour (show
day labels — `कल`, `आज` — instead). Document props are drawn fresh: invented,
`नमूना / SPECIMEN` watermark, no emblem, no outlet row, an obviously fake number
(`WM/ST/0000/00000`). `capture/demo/licence-photo.jpg` is NOT usable as is — it
prints `Outlet 99Z` and a realistic licence number.

**Outcome line.** `कोई तारीख़ चुपचाप नहीं निकलती — नया काग़ज़, बस एक फ़ोटो।`

**Never / strip.** Any consequence of an expired paper · "we renew it for
you" (MDG reminds and files; he gets the renewed paper) · "कुछ नहीं करना" ·
raw calendar dates in reminders (counts only) · a lock-screen notification as
a promise · "verified/approved" (only `मिल गया`) · a 0-day reminder.

**Sound leaning.** Voice + music, 120 BPM; paper SFX. **Refs:**
`mdg-app/store-assets/captures/03-papers.png`, `_research/features-app-people.md` F04, `features-compliance.md` §3.5.

---

## 06 · One chat — "मेन्यू नहीं, बस चैट" · `06-one-chat`

**What he gets.** It opens on a chat list like the one he already uses.
Reports arrive as pictures; a tap opens them full-screen to zoom and swipe to
the day before; voice notes instead of typing; Hindi or English, chosen once in
Settings (⋮ → सेटिंग → भाषा) — there is no one-tap toggle on the chat list; the
MDG team answers right there.

**Takeaway.** "सीखना कुछ नहीं — यह स्क्रीन आप रोज़ देखते हैं।"

**Concept — "Everything collapses into one row."** A wall of icons, menus and
a tab bar implodes into a single chat row; the row opens into the thread; a
picture lands; tap → black viewer → pinch into the SALES cell → swipe to
yesterday; hold the mic → waveform → voice bubble; ⋮ → सेटिंग → भाषा, and the whole list
re-sets in English without a pixel of layout moving. **Style:** keynote-grade product
choreography — the phone is the hero, big type sits beside it.

**Hooks.** `कोई मेन्यू नहीं। बस चैट।` · `यह स्क्रीन तो आप रोज़ देखते हैं।` (never "चलाना नहीं
आता?" — it names his fear of looking stupid) ·
`आपकी रिपोर्ट कहाँ आती है? — इसी चैट में।`

**Figures.** Chat list (day labels, not clock times, beside report rows):
`सहायता` `आज`, 2 unread, preview `📊 DSR · 21 अगस्त — स्टॉक वेरिएशन…`; `मैनेजर चैट`
`आज`, 1 unread, `नोज़ल 3 फिर से चालू है।` (written by the pump's manager); voice
note 0:11; a 🙏 reaction on the report picture. DSR figures as reel 01.

**Outcome line.** `रिपोर्ट, काग़ज़ और टीम — एक ही चैट में।` (matches the Play line)

**Never / strip.** "WhatsApp" as a product claim (say "जैसी चैट आप रोज़ चलाते
हैं") · "free" · "works offline" · "eight languages" · the quick-reply chips ·
first-reply footnotes or ticket lines (never narrated; leave out) · the
Settings "Your services" screen · mic error screens · the word ऐप in speech.

**Sound leaning.** Music only + big type (pure UI choreography); the sound
director may add two or three spoken lines. **Refs:** `captures/01-chats.png`,
`02-report.png`, `_research/features-app-people.md` §2–3 (F01–F03, F08).

---

## 07 · Warriors — "जिसने काम किया, उसका हिसाब" · `07-warriors`

**What he gets.** The owner or manager keeps a roster of warriors (anyone who
works at the pump) and taps the work each did from 85 named jobs in 11
groups; each job's points are worked out from time, skill, effort and
responsibility; 100 points a day is the target; the final submission carries a
photo of the paper record so hard and soft copies match. Warriors never open
the app.

**Takeaway.** "पंप पर किसने कितना काम किया — लिखा हुआ, बराबरी से।"

**Concept — "The fair scoreboard."** Job chips (+18, +19, +6, +6.5…) fly from
the job list into a warrior's daily bar, which fills to **exactly 100**; a
`100 पूरे` chip lands; the roster re-sorts; the paper-record photo slides in
under `फ़ाइनल जमा करें`. **Style:** sports scoreboard — big tabular numerals,
bars, roster re-sorts; restrained, never arcade-flashy.

**Hooks.** `आज पंप पर सबसे ज़्यादा काम किसने किया?` · `100 पॉइंट — हर योद्धा का रोज़
का लक्ष्य।` · `काग़ज़ वही। फ़ोटो से मिलान।`

**Figures** (catalogue values, checked). One day = 100.0, split across two
warriors if narrated: account book 18 + bank deposit 19 + DSR book 6 + density
book 6.5 + stock board 2.5 + toilet sheet 2.5 + tanker paperwork 9.5 + tanker
density 4 + tanker dip 6 + tanker safety check 5.5 + crocodile clip 3 +
fencing chain 2.5 + electric work 15 (running 18, 37, 43, 49.5, 52, 54.5, 64,
68, 74, 79.5, 82.5, 85, **100**). Shared job: toilets 17 shared by two = 8.5
each. Invented roster (from the Play capture): दीपक वर्मा 104.5, मनोज राणा 76,
सुनील चौहान 61.5, अजय तोमर 30.5, विकास पाल 11.5, नरेश पटेल 7, कमल नेगी 3.5.

**Outcome line.** `जिसने काम किया, उसका हिसाब रहता है।`

**Never / strip.** Any rupee value of points, bonus or salary promise · real
staff names · job rows with oil-company product names (Sell HSD / XTRA GREEN,
XP-95, Servo) · "warriors open the app" · "AI scores the work" · the 503.5
total · the two-letter initials defect (`दव`) — draw one clean initial.

**Sound leaning.** Music-forward, short voice (≤ 150 chars), 128 BPM.
**Refs:** `captures/04-staff-hi.png`, `_research/features-app-people.md` F06.

---

## 08 · Kavach — "45 काम, एक नज़र" · `08-kavach`

**Owner check before release:** the dealer-facing switch is off by default and
nothing shows it on for any outlet. Build it; confirm before publishing.

**What he gets.** A daily line in the chat (`🛡️ कवच — आज 85%। बाकी काम हमारी टीम
जाँच रही है।`), a forwardable card with the percentage, what is pending, what
MDG has not checked yet and what MDG needs a photo of, and photo asks with the
black button. MDG closes every item; his photo is evidence, never the decision.

**Takeaway.** "आपके पंप के 45 काम — क्या बाक़ी है, रोज़ एक लाइन में।"

**Concept — "45 on the clock, one honest number."** 45 small tiles orbit on
nine rings, one per repeat cycle (daily innermost, every-two-years outermost,
on-call dashed outside); the rings spin down and the 40 timed tiles collapse
into one ring that fills to 85 — with a
hatched sliver that stays unfilled: `4 अभी जाँची नहीं गईं`. Then the photo ask →
`मिल गया` → the next line reads 87. **Style:** orbital systems diagram,
clockwork.

**Hooks.** `45 काम। कोई रोज़ का, कोई दो साल का।` · `एक नंबर, जो बताता है क्या अभी देखा नहीं गया।`

**Figures** (checked). 45 items on 9 cycles: daily 10 · weekly 1 · fortnightly
2 · monthly 5 · quarterly 4 · half-yearly 7 · yearly 10 · every two years 1 ·
on call 5. The percentage is of the 40 timed items (the 5 on-call ones sit
outside the ring). Card: **85%** (`ठीक है`); 7 items pending; two photo asks
(first-aid box, solar panels); 4 not checked yet. After one accepted photo, a
later line reads **87%**. **No points total and no per-item points on screen** —
the sheet's points total is unverified (fact file §6): hide `.pts-line` and every
`.pts`. Physical
task labels only: `फर्स्ट एड बॉक्स में सब दवाई रखें`, `सोलर पैनल साफ करें`,
`इमरजेंसी नंबर बाहर लगाएं`.

**Outcome line.** `रोज़ एक लाइन: आपके पंप के कामों का हाल, MDG की जाँच के हिसाब से।`

**Never / strip.** "certified", "audit-ready", "guaranteed to pass", "your
compliance score" as legal standing · the band word "Excellent" read as a
verdict (keep band words small) · the footer `MDG टीम द्वारा जाँचा / verified by
MDG` — crop it (never rewrite card text) · a dealer tapping "done" (no such control)
· "the photo raises your score" (show photo → मिल गया → a *later* line with the
higher number) · "45 required by the oil company" · task names that say portal
or SDMS.

**Sound leaning.** Voice + music, 120 BPM. **Refs:** `services/kavach/card.ts`,
`_research/features-compliance.md` §3.4.

---

## 09 · Water testing — "12 पारियाँ, हर एक का हिसाब" · `09-water-testing`

**What he gets.** A day card: how many of the day's two-hour water-testing
windows were recorded out of how many, how many were missed, the outlet's
hours, and a row per window. A window can only be recorded inside its own
time; a missed window stays missed — the record says what happened.

**Takeaway.** "पानी की हर जाँच का हिसाब — दर्ज हुई या छूटी, साफ़-साफ़।"

**Concept — "The 24-hour dial."** Twelve segments on a 24-hour dial; the hand
sweeps; each segment locks `दर्ज` as it passes; two lock `छूट गई` and stay; the
day card assembles around the dial. **Style:** horology — precise, quiet,
rhythmic. **Structural rhyme:** 96 BPM = 12 bars of 2.5 s — one bar per window.

**Hooks.** `12 जाँच। रोज़। हर दिन।` · `रात 12 वाली जाँच, सुबह 9 बजे नहीं भरी जा सकती।` ·
`कल रात की जाँच — दर्ज हुई या छूटी?` The card calls a window a पारी (`12 में से 10
पारियाँ दर्ज`): use पारी in the reel's own words too.

**Figures.** 14 October: 12 windows, **10 recorded, 2 missed** (`02:00 AM -
04:00 AM`, `06:00 AM - 08:00 AM`); headline `12 में से 10`; the card's 83% only
small, if at all. Clean day: 12 of 12. Hours: `चौबीसों घंटे`.

**Outcome line.** `हर जाँच का हिसाब रिकॉर्ड में — दर्ज हुई या छूटी, साफ़-साफ़।`

**Never / strip — critical.** How the record is made must never be shown or
implied: no one ticking, no form, no "Checked/Found", no "we mark it", no
browser, no schedule ("every two hours we…"). Hide the `WATER INGRESS / पानी
मिला?` column, the `UPDATED ON / कब दर्ज हुआ` column (per-window entry times show
a cadence) and the `LAST CHECKED` tile. Never "never miss a window", never a
consequence. Say a late entry "can't be" made, never that it is "false".

**Sound leaning.** Voice + music, 96 BPM. **Refs:**
`services/waterIngress/card.ts`, `_research/features-compliance.md` §3.1.

---

## 10 · Next tanker — "अगला टैंकर कब?" · `10-next-tanker`

**Owner check before release:** every plan is a draft an admin approves; no
plan is known to have reached a dealer yet, and the feature post-dates the fact
file. Build it; confirm before publishing. No adoption claims.

**What he gets.** A picture: today's headline (order today / no order needed —
next order on a date), the tanker's chambers by fuel and tank, days of stock
left per fuel and when it runs out, the next four days of orders with
depot-closed days, and whether credit covers this tanker.

**Takeaway.** "अगला टैंकर कब और कितना — चार दिन आगे तक, एक नज़र में।"

**Concept — "Tanker Tetris."** Three chamber blocks (diesel, diesel, petrol)
slide into an isometric tanker and lock; two fuel columns drain toward their
low line — `डीज़ल: 2.3 दिन`; a four-day strip greys out Sunday as `डिपो बंद`.
**Style:** isometric logistics.

**Hooks.** `अगला टैंकर कब मँगाना है?` · `डीज़ल: 2.3 दिन का बचा है।` ·
`इतवार को डिपो बंद — आज ही ऑर्डर।`

**Figures** (checked). Diesel 9,000 L at 4,000 L/day → **2.3 days**, runs out
17 Oct; petrol 5,500 L at 1,800 L/day → **3.1 days**, runs out 18 Oct; tanker 3
× 4,000 = 12,000 L (diesel 8,000 + petrol 4,000); Sunday 18 Oct depot closed;
headline: **whatever the builder returns for this case, shown as built** (likely
`आज ही टैंकर ऑर्डर करें — डीज़ल खत्म हो रहा है`, or `… — 18 Oct को डिपो बंद है`) —
never hand-typed card text; `इतवार को डिपो बंद` lives only in the reel's own words;
credit line `इस टैंकर के लिए
क्रेडिट काफ़ी है (₹18,00,000 उपलब्ध)`.

**Outcome line.** `अगला टैंकर कब और कितना — चार दिन आगे तक, एक नज़र में।`

**Never / strip.** "IndianOil only takes four days of projections" (not ours
to state) · planner words (pool, percentile, lead time, safety days) · "worked
out from your invoices" · depot names · "never wrong" · the header literal
`Stock at 6 AM` · on-the-way invoice lines · per-litre prices · real low-stock
lines.

**Sound leaning.** Voice + music, 120 BPM. **Refs:**
`services/loadPlanner/card.ts`, `_research/features-money-stock.md` §5.

---

## 11 · Ledger Watch — "तेल और जमा के अलावा क्या कटा?" · `11-ledger-watch`

**What he gets.** A picture of the last four entries on his oil-company
account that were not fuel bought, not his deposit and not card sales — each
named in plain words with its date and amount, charged or paid; totals of
those four only; and `यह DOD जमा राशि नहीं है`.

**Takeaway.** "खाते में तेल और जमा के अलावा जो कटा या आया — नाम और रकम के साथ।"

**Concept — "The X-ray."** A long statement scrolls; the routine pair (fuel,
deposit) fades into grey stripes; four other lines lift off the page in 3D,
take their plain names and drop into the card; charged and paid tally in two
tiles; the line `यह DOD जमा राशि नहीं है` lands like a stamp. **Style:**
document scan — greyscale ledger, one line lit at a time.

**Hooks.** `₹60 भी, ₹9,400 भी — एक ही नाम की फीस।` (invented amounts at the
ratio of a published case — the real ₹63 / ₹9,443 are a real dealer's figures) · `तेल और जमा के अलावा — यह तीसरी लाइन क्या है?`

**Figures** (checked). 24-08 `बकाया रकम पर ब्याज लगा` ₹4,386 charged · 19-08
`लाइसेंस फीस (SSLF) की वसूली` ₹11,250 charged · 12-08 `डीलर कमीशन मिला` ₹28,940 paid
to you · 05-08 `मशीन के लीज़/किराए का शुल्क` ₹5,250 charged → charged **₹20,886**
(4,386 + 11,250 + 5,250), paid **₹28,940**.

**Outcome line.** `खाते में तेल और जमा के अलावा जो कटा या आया — नाम और रकम के साथ।`

**Never / strip.** The footer `IndianOil पोर्टल से / Read from the IndianOil
portal` + stamp · "over a thousand lines", "3,163 lines", "across our
customers" · calling any charge wrong or a fraud · "classifies", "flags",
"rules" · colours or icons the card does not have.

**Sound leaning.** Voice + music, 120 BPM. **Refs:**
`services/ledgerWatch/card.ts`, `_research/features-money-stock.md` §4.

---

## 12 · Sunday — "इतवार हो, तब भी" · `12-sunday-night`

Human services 05 (Automation Support) + 06 (Web Portal Support). No app screen
exists — honest metaphors only, plus one MDG message in the chat as the
outcome.

**What he gets.** When the forecourt automation goes down — on a Sunday too —
it is flagged and chased until it is back (no response time is promised; the
desk works 9am–9pm every day); complaints
(nozzle, tank, pipeline) are raised and chased to closed; mock drills logged.

**Takeaway.** "ख़राबी आपको ढूँढनी नहीं पड़ती — पीछा हम करते हैं।"

**Concept — "One lamp in the dark."** The stage is black — the dead console,
not the night; one status lamp turns red; a week strip lights `इतवार`; a complaint slip travels one of
three lanes (`नोज़ल` · `टैंक` · `पाइपलाइन`) and thumps `बंद`; the lamp turns green
and the stage turns from black to white — the one reel where the black world
is the story. **Style:** night-mode minimalism, typographic.

**Hooks.** `इतवार। ऑटोमेशन बंद।` · `अब फ़ोन किसको करें?` (never "रात" — it invites a
24×7 reading) ·
`ड्रिल की, पर फ़ाइल नहीं की? तो हुई ही नहीं।`

**Figures.** None — no durations, no counts. Three lane labels. Outcome in
the Manager chat, written by the pump's own manager (as in the Play capture):
`नोज़ल 3 फिर से चालू है।` — never an MDG "fixed" message (no such flow is verified).

**Outcome line.** `ख़राबी ख़ुद ढूँढनी नहीं पड़ती।` (website's published line)

**Never / strip.** Durations ("22 minutes") · "uptime watch", "remote
monitoring" · vendor names · IRAS · branded consoles · "portal" spoken ·
"we log in" · what the oil company does with a complaint.

**Sound leaning.** Voice + music, 96 BPM, sparse → warm. **Refs:**
`_research/features-app-people.md` §4.3–4.4.

---

## 13 · Density — "तीन दशमलव, उसी रजिस्टर में" · `13-density`

**What he gets.** When a new tanker's density figure is ready, an MDG message
with the figure per product, to copy into his density register; and each
morning an ask for yesterday's register page with the black button — one
photo, `मिल गया`.

**Takeaway.** "टैंकर की डेंसिटी आपके हाथ में — रजिस्टर का पन्ना, बस एक फ़ोटो।"

**Concept — "Three decimals."** Giant odometer digits roll to `834.600` and
shrink into the chat bubble while the same digits drop into a ruled register
line; next beat, the morning ask: the register page slides up into the chat,
`भेज दिया` → `मिल गया`. **Style:** macro typography — huge numerals, a
hydrometer-float silhouette as the only shape.

**Hooks.** `टैंकर आया — डेंसिटी रजिस्टर में चढ़ी?` · `834.600` (alone, huge) ·
`रजिस्टर का कल वाला पन्ना कहाँ है?`

**Figures** (invented; label as one load). `नए टैंकर की डेंसिटी आ गई है।` /
`हाई स्पीड डीजल (12 अक्टूबर): 834.600 · मोटर स्पिरीट (12 अक्टूबर): 741.900` (kept
well away from every real held reading). Ask on
13 Oct: `MDG को यह चाहिए: डेंसिटी रजिस्टर का पन्ना (12 अक्टूबर)।` / `नीचे “फ़ोटो भेजें”
दबाइए।`; reply `✓ मिल गया — डेंसिटी रजिस्टर का पन्ना (12 अक्टूबर)`. Register-page
prop: blank ruled page, invented writing only.

**Outcome line.** `टैंकर की डेंसिटी आपके हाथ में, रजिस्टर का पन्ना एक फ़ोटो में।`

**Never / strip.** Any density as what diesel or petrol "is" · "we compare
your reading" · invoices downloaded or read · "same day", "the minute it
lands", "instantly" · "we never acknowledge for you" · "TT", "Density@15",
"invoice" in his copy · real values (727.300 and the like).

**Sound leaning.** Music + short voice, 120 BPM. **Refs:**
`services/ttDensity/notify.ts`, `_research/features-compliance.md` §3.3.

---

## 14 · Live in 7 days — "एक कॉल से शुरुआत" · `14-live-in-7`

**What he gets.** Day 1: one call, plain talk, no forms. Day 2–3: he picks
what to switch on and the price is locked in writing. Day 4–7: live (fact file
§5; §6 counts the seven days from the price instead — open question O5, so the
strip shows the days without anchoring the count to a trigger). Support
9am–9pm every day including Sunday, Hindi or English, the same team; a
callback within the hour; an NDA before any document is seen.

**Takeaway.** "सात दिन में शुरू — और सुबह 9 से रात 9, हर दिन, बात करने को आदमी।"

**Concept — "The week strip."** A seven-cell strip fills cell by cell (day 1 a
phone call; days 2–3 the nine services as switches, `जो चाहिए वही चालू`; days
4–7 the chat list appears); then a dial sweeps 9 → 9 with `इतवार` lit; the
toll-free number types on. **Style:** calendar / timeline typographic.

**Hooks.** `सुबह 9 से रात 9 — इतवार को भी।` · `7 दिन में आपका पंप चालू।` ·
`इतवार की रात कुछ बैठ जाए — फ़ोन किसे करेंगे?`

**Figures.** 7 days · 9am–9pm · Sunday included · Hindi or English · callback
within the hour · `1800-891-3496` written.

**Outcome line.** `आदमी से बात — सुबह 9 से रात 9, हर दिन।` (phone line only)

**Never / strip.** Price (unless the owner rules it in) · "free", "first month
free" · "24×7" · scale claims · "a person answers the chat first".

**Sound leaning.** Voice + music, 120 BPM. **Refs:**
`_research/features-app-people.md` F10–F11.

---

## 15 · Anthem — "नौ काम, एक हाथ" · `15-nine-jobs` (last)

**What it says.** Nine jobs leave a dealer's desk. "नौ काम" — never "nine app
features" (four of the nine have no software).

**Concept.** The open hand in the logo takes the nine jobs off the desk, one
per beat, and the logo's ring closes at the end. Each beat **quotes another
reel's signature device** in ~2 s: SDMS (tags stamped) · स्टॉक / DSR (the paper
row flips into the picture) · इंस्पेक्शन (a file shelf completes) · काग़ज़ (the
15·3·2·1 staircase) · ऑटोमेशन (the lamp in the dark) · शिकायत (the slip thumps
`बंद`) · XTRA (a ring fills; type only, no scheme art) · DOD (the split-flap
date) · Prepare Pro Manager (a decisions notebook ticks). **Style:**
logo-driven — the mark's open ring is the camera path.

**Hook.** `नौ काम। एक मेज़।` **Close:** the ring finishes drawing around the
three people, then the standard end card.

**Never.** "Nine features" · scale claims unless the owner rules them in · the
loyalty scheme's logo or card art · what XTRA or Prepare Pro deliver beyond
their names.

**Sound leaning.** Music-led; at most eight spoken words, or music only.
