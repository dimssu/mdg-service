# Research: the money-and-stock features (DSR, stock variation, Credit & DOD, Ledger Watch, Load Planner, per-tanker profit, slip reader)

Read-only research for the reel prompt writer. Researched 17 Oct 2026 against the code in the working tree, the memory notes and `marketing/mdg-video-knowledge-pack.md` (call it "the fact file"). Anything I could not verify is marked **UNVERIFIED**. Nothing in the repo was edited; nothing touched production.

Repo root `/Users/dissu/Documents/PP/mdg-service`. Sub-repos (`mdg-backend`, `mdg-admin`, `mdg-client`, `mdg-app`) have their own git history; `git status` at the root does not show their changes.

---

## 0. READ THIS FIRST — seven things that change how the prompts must be written

### 0.1 There are TWO DSR card designs and only one of them is live

| | **LIVE design** (committed, deployed) | **REDESIGN** (uncommitted, awaiting owner review) |
|---|---|---|
| Where | `mdg-backend/src/services/dsr-report/cards.ts` at HEAD (last commit `a56f323`, 30 Sep). Saved copy of it: `/private/tmp/claude-502/-Users-dissu-Documents-PP-mdg-service/236ce7c5-ac26-4498-9e9b-332a87c88170/scratchpad/cards.HEAD.ts` | Working tree of `mdg-backend` (`git status`: `M cards.ts`, `M cards.test.ts`, `M lib/dealerText.ts`). Memory `dsr-cards-redesign.md`: made 12 Oct, owner said "get it reviewed by me before making it live" |
| Language | Bilingual: English caps label + Hindi under it | **Hindi only** (trade words in Devanagari), per-reader language only on the line under the picture |
| Sales card | Landscape table, 1432×1258 CSS px for two products (card 1360 wide, grows 88 px per extra tank column). Glance strip (3 tiles) + the workbook table: DATE · TANK DIP/WATER DIP · OPENING STOCK · RECEIPT · TOTAL STOCK · OPENING METRE READING 1..n · TESTING · SALES · CUMULATIVE SALES · REMARKS. Yesterday's row + today's open row | Portrait, 960 px wide card. Three tiles, two pills, a "today's readings" box. **No table, no yesterday row** |
| Variation card | 1040 px wide. Verdict box, 3-row table, band printed as its two parts, "what to do" box, 5.1.11 consequence box, "since" table | 960 px wide. One summary banner, per product a big signed number + chip + a **drawn gauge**. Band is not spelled out as two parts any more; the green zone is simply wider on the shortage side |
| Frame | Four-sided scrolling brand marquee, twin MDG logos | One maroon header, gold border, one gold brand strip at the bottom |

**Evidence that HEAD is what dealers get today:** the backend deploy on 16 Oct was a `git pull` on the box (memory `dsr-per-sheet-sharing`: "Another session's uncommitted cards.ts… do NOT build off-box from this tree"). The Play-store captures of 15 Oct (`mdg-app/store-assets/capture/demo/*.png`) were drawn "from the committed cards.ts". The fact file §5 describes the LIVE design. **I did not see the box itself, so "live = HEAD" is UNVERIFIED but strongly implied.**

**Consequence for the prompt writer:** every DSR/variation prompt must say which design it recreates. Default recommendation: the LIVE design (it is what a dealer actually holds, and the fact file's "copy the rows into your paper register" story only works with it, because the redesign dropped yesterday's full row; memory flags this as an open question). Note that the LIVE sales card is landscape (≈1.14:1), so for 9:16 it needs a zoom/pan or a crop to the glance strip; the redesign is natively phone-shaped. **Owner decision needed (section 9, Q1).**

### 0.2 Method-leak strings that are PRINTED ON the real dealer-facing cards or chat lines
The cards are screens a dealer already sees, so they are allowed, but these particular strings break the "outcomes only, never method" rule and must be cropped, blurred or re-worded in any public video:

| Where | String | Why it is a leak |
|---|---|---|
| Ledger Watch card footer, left | `IndianOil पोर्टल से / Read from the IndianOil portal` + a timestamp | says "portal" and "read from" (data collection) |
| Credit & DOD card, "payment lag" state (deadline passed ≤2 days) | `तारीख़ निकल चुकी है — भुगतान किया हो तो पोर्टल पर दिखने में समय लगता है` / `Deadline passed N days ago — payment may not be posted yet` | Hindi line says "portal" |
| Credit & DOD chat line under the card | `… (पोर्टल के अनुसार)` / `as per portal` ; no-dues: `कोई बकाया नहीं (पोर्टल के अनुसार)।` | "portal" |
| Credit & DOD card footer | `DATA PREPARED AT 9:14 AM · 23-08-2026` + `इस समय तक का हिसाब · इसके बाद की खरीद-भुगतान इसमें नहीं है` | "DATA" is a banned word; a preparation time hints at a schedule |
| Every card header/footer | a clock time (`6:30 AM`, `सुबह 6:30`, `BUSINESS DATE 2026-10-15 · 06:30:00`) | it is the shift time, but reads as a delivery schedule |
| Load plan card header | `Stock at 6 AM, 15 Oct` (the "6 AM" is a literal in `card.ts`, not computed) | schedule hint |
| Load plan card, optional lines | `रास्ते में · On the way: 4,000 L petrol, invoiced 14 Oct` | draws on tanker invoices (method) |
| Chat message timestamps in existing panels | `6:02`, `9:14` in `marketing/panels/*.png` | implies a delivery clock; sends are admin-triggered, not on a timer (memory `service-cadence-policy`: `dsr-report` and `credit-dod-monitoring` are ON_DEMAND) |

### 0.3 Existing public assets contradict the fact file
- `mdg-demo/src/marketing/script.ts` line 72 (the marketing film): "हर सुबह आपके **WhatsApp** पर एक फ़ोटो आती है". Fact file §6: **"Nothing sends dealer reports over WhatsApp: they land in the app's chat, and a person forwards them by hand."** Say "your phone" / "in your Dealer Kavach chat". Do not say WhatsApp, do not say "every morning at 6".
- `marketing/panels/p-dsr.png` and `p-credit.png` (15 Sep) are **stylised mock-ups**, not the real cards: they use a teal chat header and a serif hero number, show `73.7%` (the real card prints whole `74%`), and show a header date `14 सित` above a `26 अगस्त` due date. The chat chrome pre-dates the 13 Oct rule "WhatsApp-like means the experience, not WhatsApp's green" (memory `chat-is-the-app`). **Do not reuse as visual reference.**
- `marketing/refs/product/real-sales.png` / `real-variation.png` are **real** cards of a real outlet (code `1E`, 14 Sep 2026, real litres, real meter readings). **FORBIDDEN in any public video.** `mdg-demo/public/credit-card/due.jpg` / `advance.jpg` (photos of the old seven-row card) are unverified for real figures: treat as forbidden. `mdg-demo/src/lib/creditCard.ts` `DUE_CARD` says "Numbers mirror the real sample cards" (₹8,03,960.60): do not reuse those numbers.

### 0.4 Festival band trap
`shared/src/data/festivals.ts`: `independence-day` and `republic-day` draw a **tricolour band with an Ashoka Chakra** (24 spokes). Fact file §9: "No national flag or Ashoka Chakra in commercial creative." A video must only ever show the **Diwali / Holi / New Year** bands, or none. Wired into the Credit & DOD card only (confirmed: the only caller of `festivalBandHtml` is `renderCard.ts`).

### 0.5 Do not expand acronyms, and do not say "MDG guideline"
The LIVE variation card prints `MDG दिशा-निर्देश 5.1.11 · GUIDELINE 5.1.11` (code comments read "MDG" as the oil company's marketing discipline guideline). The company is also called MDG Services, so a viewer reads it as the company's own rule. Fact file §3: never invent a full form. Say **"नियम 5.1.11"** (the redesign prints exactly that). The code comment in `dodDueDate.ts` expands DOD as "Deposit-on-Demand": **never print or say that**.

### 0.6 "Automatic", "AI", "checked by a model" are all out
Reports are generated by code and a person checks before sending (fact file §5, §6 "Automatic delivery"). Never say "automatic", "AI", "reads", "collects", "pulls". The slip reader is the only place in this topic that uses a vision model (ADR 0012) and it is admin-only.

### 0.7 Status summary

| # | Feature | Slug | Status | Dealer-facing | Video potential |
|---|---|---|---|---|---|
| 1 | Daily Sales Report, sales sheet | `dsr-sales-sheet` | LIVE (8 dealers, all test users) | **Yes**: picture in the chat | **9** |
| 2 | Stock variation verdict | `stock-variation-verdict` | LIVE (second picture of the DSR pair) | **Yes** | **9** |
| 2b | DSR extras: who gets which sheet, hand-entered / inferred receipts, corrected report | `dsr-share-and-corrections` | LIVE since 11 and 16 Oct | **Yes** | 5 (as a beat, not a video) |
| 3 | Credit & DOD card | `credit-dod-card` | LIVE (admin approves each send) | **Yes**, owners only | **9** |
| 4 | Ledger Watch card | `ledger-watch` | LIVE since 6 Sep; dealer card since 8 Sep | **Yes**, owners only, admin-sent | **6** |
| 5 | Load Planner, "अगला टैंकर" | `next-tanker-plan` | LIVE for 8 outlets, **drafts only**, admin approves each send | **Yes after approval**; UNVERIFIED that any real send has happened | **7** |
| 6 | Per-tanker profit (Fuel P&L) | `per-tanker-profit` | LIVE as an admin screen (27 Aug), image export (31 Aug) | **No** (admin tool; an admin may hand the PNG over) | **3**, do not make |
| 7 | Pump-slip photo reader | `slip-reader` | LIVE on one hand-entered outlet, behind a flag | **No** | **1**, do not make |

---

## 1. Shared visual language of the four cards (Credit, Ledger, Load, DSR)

All are HTML strings screenshotted by Chromium at 2× (`mdg-backend/src/automation/cardRenderer.ts`, selector `#frame`), posted into the dealer's chat as PNGs.

**Palette (same across cards; hex from the code):** maroon `#7f1d1d`, maroon-deep `#5c1010`, red `#b91c1c`, red-soft `#fef2f2`, deeper red for an EXCESS `#8b1414` (soft `#fde8e8`), green `#15803d` (soft `#f0fdf4`), amber `#b45309`, gold `#f59e0b` (band gradient gold → `#fbbf24` → gold), gold-soft `#fffaf0`, cream `#fffdf5` (redesign cream `#fbf7ef`), ink `#1c1917`, ink-soft `#57534e`, grid `#e7d9bf`, page `#f4ede0`. Product tones: diesel `#2f5fa8` (wash `#eef3fb`), petrol `#b4632b` (wash `#fdf3ec`), neutral/premium `#4b5563` (`#f3f4f6`).

**Type:** `'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN', system-ui…`; weights 600–800; `font-variant-numeric: tabular-nums`. Hindi trade words are in Devanagari on the cards (वेरिएशन, स्टॉक, टेस्टिंग, डिप). Numbers: Latin digits, Indian grouping (`4,12,000`; rupees with `.00` on the Credit card, whole rupees on Ledger/Load). Litres whole. Meter readings ungrouped 6–7 digit strings.

**Brand marks printed on cards:** square white `MDG` chip (maroon text) top-left; gold code pill (`99Z`-shaped, digits+letters); marquee text `Dealer's कवच Programme @MDG Services` (live DSR), `Dealer's कवच Programme · MDG Services` (redesign), `Dealer's कवच · @MDG Services` (Credit, Ledger, Load). No oil-company logo anywhere. `MDG` here is the **company mark**; the app name is "Dealer Kavach" (memory `mdg-brand-vs-app`).

**How it arrives (real app capture, fictional data): `/Users/dissu/Documents/PP/mdg-service/mdg-app/store-assets/captures/02-report.png` (1170×2433)** — the best reference for the chat chrome:
- Top bar white: back arrow, round avatar (people-in-hand icon), title **`Support`**, subtitle **`MDG team`** (English UI). Hindi header strings **UNVERIFIED** (i18n has `chat.support` = `सहायता`, `chat.supportFallbackName` = `MDG सहायता`, manager group = `मैनेजर चैट`).
- Wallpaper warm grey `#f3f2f0` with a faint doodle pattern; date chips `Yesterday` / `Today` (white pill); incoming bubble white; **my** bubble warm grey `#e7e5e4` (`Thank you 🙏 9:40 am ✓`); meta text `#667781`; read ticks blue `#53bdeb`; brand colour is black `#18181b` (the mic button is a black circle). **No green** (owner rule 13 Oct).
- A DSR arrives as **one bubble holding the two pictures side by side (2-up grid), then one line of text and the time**, Hindi (default language) `📊 DSR · 15 अक्टूबर — स्टॉक वेरिएशन सीमा में है।`; English as the live builder writes it `📊 DSR · 15 Oct — stock variation within limit.` (the capture shows `15 October` because its text was seeded; the code prints the short month, and adds the year only when it is not the current year)
- Tap a picture → full-screen viewer, swipe through every picture in the chat (zoomable).
- Reports are `system:true` messages drawn as ordinary incoming MDG bubbles (memory `chat-is-the-app`). Push notification title/body per report in the member's language (below).
- The capture also shows two quick-reply chips (`Today's report?`, `What do I need to do?`) and a Message box with attach, camera, mic. The chips belong to the assistant that writes first replies: **leave them out** (no "AI" in public material).
- Composer/ticks/dates in the capture are real UI; the times `9:00 am` are store-asset fiction. Use neutral times.

---

## 2. Feature 1 + 2 — Daily Sales Report (two pictures) and the stock-variation check

### 2.1 Names, slugs
- Report: **DSR** (the dealer's own word, "DSR · 15 Oct"). Hindi on cards: HEAD `रोज़ाना बिक्री रिपोर्ट — कल और आज का हिसाब`; redesign `बिक्री रिपोर्ट (DSR)`. Slug `dsr-sales-sheet`.
- Panel two: HEAD `STOCK VARIATION` + `स्टॉक की जाँच — क्या करना है`; redesign `स्टॉक वेरिएशन`. Slug `stock-variation-verdict` (a separate video is justified, see 2.9).
- It is **not a tenth service**; it lives inside service 02 "MDG Compliance / रोज़ाना स्टॉक जाँच" (fact file §5). Do not call it a service.

### 2.2 Status and evidence
LIVE for 8 outlets (1E 2E 3E 5E 9E 12E 14E 15E; 16E is hand-entered). Production holds only test users (memory `prod-is-test-users-only`). Memory: `dsr-report-service`, `dsr-per-sheet-sharing` (shipped 16 Oct: root `6d83569`, backend `7c4d878`, admin `778aa9a`; "Not yet seen: a real admin send in prod"), `dsr-per-tank-readings`, `dsr-monthly-cumulative`, `dsr-inferred-deliveries`, `dsr-hand-entered-days`, `dsr-hand-added-receipts`. Code: `mdg-backend/src/services/dsr-report/{cards,share,sheets,compute}.ts`, `shared/src/dsr/{guideline,tanks,cumulative,receipts}.ts`.
**Cadence:** `dsr-report` is ON_DEMAND (an admin presses Generate, a person checks, an admin presses Share). Nothing guarantees "every morning". Treat any "daily at a fixed time" line as unverified.

### 2.3 What the dealer receives
Two PNG pictures in ONE chat bubble + one line + a push. Owners: a copy in **each owner's own private chat**; manager: the outlet group chat (owners can open it). The outlet's saved rule decides who gets which sheet.
- Chat line (variation sent): Hindi `📊 DSR · 15 अक्टूबर — स्टॉक वेरिएशन सीमा में है।` / out of band `📊 DSR · 15 अक्टूबर — स्टॉक वेरिएशन सीमा से बाहर है, कृपया देखें।` English `📊 DSR · 15 Oct — stock variation within limit.` / `…over limit. Please check.` (Hindi month is spelled out: `15 अक्टूबर`; English month is `Oct`)
- Chat line (sales sheet alone, no verdict): `📊 DSR · 15 अक्टूबर — दैनिक बिक्री।` / `📊 DSR · 15 Oct — daily sales.`
- **Corrected report line:** `♻️ संशोधित DSR · 15 अक्टूबर — पहले भेजी गई की जगह यही मान्य है।` / `♻️ Revised DSR · 15 Oct — use this one, not the earlier copy.` Push body: `संशोधित रिपोर्ट — पहले वाली की जगह यही मान्य है।`
- Push: title `DSR · 15 अक्टूबर`, body `स्टॉक वेरिएशन सीमा में है।` or `दैनिक बिक्री।`
- Per-sheet audience: values `owners | managers | both`, set per sheet (`sales`, `variation`) as the outlet's saved rule (`Dealer.dsrShareRule`). A one-tap send can narrow the rule, never widen it. Owner-only sheets never go to the group chat. Example outcome: owner phone shows both pictures; manager phone shows only the sales picture with the verdict-free line. **The dealer does not set this himself**; MDG sets it at the owner's request. Say "आपके कहे अनुसार" not "you choose".

### 2.4 VISUAL ANATOMY — LIVE design (bilingual, workbook-shaped)
Real rendered samples with FICTIONAL outlet `99Z` (HEAD design): `/Users/dissu/Documents/PP/mdg-service/mdg-app/store-assets/capture/demo/dsr-2026-10-15-sales.png` (2864×2516 at 2×), `dsr-2026-10-15-variation.png` (2224×3790), plus the `10-14` pair. Generator of the digest: `…/capture/demo/digest.mjs`.

**Sales card (`buildSalesCardHtml`, 1360 px card + 36 px frame):**
1. 4-sided marquee (gold gradient; top/bottom horizontal, left/right vertical-rl) text `Dealer's कवच Programme @MDG Services`, 14 px, maroon-deep.
2. Header (128 px, maroon gradient): MDG chip · centre stack [gold code pill `99Z`, title `DAILY SALES REPORT`, sub (gold) `रोज़ाना बिक्री रिपोर्ट — कल और आज का हिसाब`] · MDG chip.
3. Date strip (`#fffaf0`): left `CURRENT DATE AND TIME · दिनांक व समय`; right `Thursday, 15 October 2026 · 6:30 AM`.
4. Per product, a **product band** in the product colour: `उत्पाद: मोटर स्पिरीट  PRODUCT : MOTOR SPIRIT` … right-aligned `TANK -1` (several tanks print `TANK -6/4/8`). Real product labels: `हाई स्पीड डीजल / HIGH SPEED DIESEL` (HSD), `मोटर स्पिरीट / MOTOR SPIRIT` (MS), `एक्स्ट्रा प्रीमियम / XTRAPREMIUM` (XP), `एक्स्ट्रा ग्रीन / XTRAGREEN` (XG). XtraPremium/XtraGreen are oil-company brand names: prefer "Petrol / Diesel / premium petrol" in videos.
5. **Glance strip**, 3 tiles: `SOLD 14-Oct` **4,210 L** / `कल की बिक्री` (green border `#15803d`, wash `#f0fdf4`) · `STOCK IN TANK NOW` 9,120 L / `अभी टंकी में स्टॉक` · `RECEIVED 14-Oct` 0 L / `टैंक में आवक` (a `M` or `D` superscript follows a hand-entered / dip-inferred figure).
6. **Table** (1.5 px borders `#b8a887`, header wash `#f6efe1`): `DATE दिनांक` | per tank `TANK -1` over `DIP`, `WATER DIP` (a grade in several tanks gets DIP · WATER DIP · STOCK per tank) | `OPENING STOCK` | `RECEIPT` | `TOTAL STOCK` | `OPENING METRE READING` over nozzle numbers 1..n | `TESTING` | `SALES` | `CUMULATIVE SALES इस माह · this month` | `REMARKS` (always empty).
   Rows: yesterday `14-Oct` (closed, `SALES` bold) and today `15-Oct` + gold chip `आज`, row tinted with the product wash, thicker top/bottom border; **today's SALES and CUMULATIVE cells are an amber `—`** because they close on tomorrow's reading. Legend under it: `— आज की बिक्री कल की रीडिंग से तय होगी · today's sales close on tomorrow's reading`. A new month inside the window gets a 3 px black rule above its first row.
7. Footer (`#fffaf0`): `BUSINESS DATE` / `2026-10-15 · 06:30:00` and the code at right.

**Variation card (`buildVariationCardHtml`, 1040 px card):** marquee, header (title `STOCK VARIATION`, sub `स्टॉक की जाँच — क्या करना है`), date strip, then per product: product band; **verdict box** (icon circle ✓ green / ! red, Hindi headline 30 px, English caps line, a red tag when out of band); **3-row table** `VARIATION / स्टॉक और बिक्री का अंतर` (signed, big) · `PERMISSIBLE VARIATION / अनुमत सीमा` with the band spelled in two parts · `VARIATION NOT WITHIN LIMIT / सीमा से बाहर`; **WHAT TO DO box** (dashed border); when out of band a **guideline box**; `since` table (2 rows `Total receipt from 20-Aug · जाँच के बाद कुल आवक  4,12,000 L`, `Total test from 20-Aug · जाँच के बाद कुल टेस्टिंग  1,380 L`); footer.
Exact strings by state (HEAD):
- Within: headline `स्टॉक सही है` / `WITHIN PERMISSIBLE LIMIT`; action `कुछ नहीं करना — स्टॉक सीमा में है` / `No action needed — stock is within the allowed limit`.
- Shortage beyond band: `स्टॉक मान्य सीमा से भी कम है` / `SHORTAGE BEYOND PERMISSIBLE LIMIT`; tag `लिखित स्पष्टीकरण माँगा जाएगा · EXPLANATION WILL BE CALLED FOR`; action `≈ 339 लीटर डीयू (DU) से टंकी में डालकर स्टॉक ठीक करें` / `Top up ≈ 339 L from the DU into the underground tank`; guideline box `सीमा से ज़्यादा (−) वेरिएशन पर सैंपल जाँच के लिए भेजा जाता है और डीलर से लिखित स्पष्टीकरण माँगा जाता है; जवाब संतोषजनक न होने पर सप्लाई रोक दी जाती है।`
- Excess beyond band (deeper red `#8b1414`): `स्टॉक मान्य सीमा से भी ज़्यादा है` / `EXCESS BEYOND PERMISSIBLE LIMIT`; tag `बिक्री व सप्लाई तुरंत रुक सकती है · SALES CAN BE STOPPED IMMEDIATELY`; action `≈ 365 लीटर की टेस्टिंग/निकासी दिखाकर स्टॉक ठीक करें` / `Account for ≈ 365 L (show testing / draw off) before the next decant`; guideline box `सीमा से ज़्यादा (+) वेरिएशन पर सैंपल लैब भेजा जाता है और सभी उत्पादों की बिक्री व सप्लाई तुरंत रोक दी जाती है।`
- **Band as two parts** (the fact file's "shown as two parts"): shortage `4% of tank stock (365 L)  +  0.25% evaporation & handling on sales (796 L)`; excess `4% of tank stock (575 L)` + `वाष्पन छूट सिर्फ़ कमी पर मिलती है · the evaporation allowance applies to a shortage only`.
- Severity colours were corrected by the owner: excess is the DEEPER red, never amber.

### 2.5 VISUAL ANATOMY — REDESIGN (Hindi only, uncommitted)
Renders I made with the real builders and fictional data (ephemeral, scratchpad; recipe in section 8): `/private/tmp/claude-502/-Users-dissu-Documents-PP-mdg-service/236ce7c5-ac26-4498-9e9b-332a87c88170/scratchpad/render/dsr-new-sales-ok.png`, `dsr-new-var-ok.png`, `dsr-new-var-breach.png` (≈1024 px wide at 1×).
- Card 960 px, gold 4 px border, radius 30, nothing smaller than 20 px. Header: MDG chip · gold code pill · title · right-aligned `गुरुवार, 15 अक्टूबर` / gold `सुबह 6:30`.
- **Sales:** per product a coloured head (`पेट्रोल` `MS` chip, right `TANK -1`), three tiles `14 अक्टूबर की बिक्री` **4,210 L** (green) · `स्टॉक अभी` 9,120 L · `अक्टूबर में कुल बिक्री` 52,880 L; pills `14 अक्टूबर आवक 0 L` (gold + `(हाथ से भरी)` or `(डिप से आँकी)` when not portal-sourced) · `टेस्टिंग 20 L`; box `आज की रीडिंग`: table `डिप | पानी | स्टॉक` per tank, then `मीटर` with numbered chips 1..n and the reading of each nozzle. Brand strip `Dealer's कवच Programme · MDG Services`.
- **Variation:** summary banner (all fine: green, icon ✓, `स्टॉक सही है` / `सभी 2 उत्पाद सीमा में — कुछ नहीं करना`; otherwise red, icon !, `ध्यान दें` + one line per product `पेट्रोल सीमा से 339 L कम` / `डीज़ल सीमा से 365 L ज़्यादा`). Per product: label `वेरिएशन`, number `−1,500 L` (64 px, true minus sign), chip `सीमा में` (green outline) / `सीमा से 339 L कम` (red) / `…ज़्यादा` (deep red), **gauge**: ends `◀ कम` … `ज़्यादा ▶`, pale-red track `#f6d6d6`, **green zone `#7fcf95` from −(4% stock + evaporation) to +(4% stock)**, centre zero tick, round 40 px pin (white 5 px ring) coloured by verdict, scale labels e.g. `−1,161` and `+365`; for a breach an action box (`क्या करें: …` + risk line with `!` badge `लिखित स्पष्टीकरण माँगा जाएगा · नियम 5.1.11` or `बिक्री व सप्लाई तुरंत रुक सकती है · नियम 5.1.11`); dashed line then `20 अगस्त की जाँच से · आवक 4,12,000 L · टेस्टिंग 1,380 L`.
- **The gauge makes the asymmetry visible**: zone edges are −450 (4% + evaporation) and +400 (4% only) in the fact file's example.

### 2.6 Invented, internally consistent figures (checked)
**A. The fact file's published pair (use exactly; arithmetic verified):**

| DATE | OPENING | RECEIPT | TOTAL | DIP | STOCK | TESTING | SALES |
|---|---|---|---|---|---|---|---|
| 19-08 | 9,120 | 9,000 | 18,120 | 141 | 12,480 | 10 | 5,630 |
| 20-08 | 12,480 | 6,000 | 18,480 | 160 | 14,246 | 12 | 4,222 |

18,120 − 12,480 = 5,640 − 10 testing = **5,630**; 18,480 − 14,246 = 4,234 − 12 = **4,222**; row 1 closing 12,480 = row 2 opening. Month cumulative to add (invented, consistent): 19-08 **74,088**, 20-08 **78,310** (74,088 + 4,222 ✓). In the engine a day's closing stock appears as the NEXT day's opening, and the SALES cell of the newest row is empty.
**B. Two-product fictional set already used in store graphics (outlet `99Z`):** MS sold 4,210 L on 14 Oct, stock now 9,120 L, October total 52,880 L, variation −180 within band 1,161; HSD sold 6,980 L, stock now 14,380 L, October total 91,640 L, variation +95 within band 1,978 (excess band 575: 4% of 14,380). Meter readings in `digest.mjs`.
**C. Stock-variation motion example (fact-file basis, verified):** tank shows 10,000 L, 20,000 L of diesel sold → band shortage **450 L** (400 + 50), excess **400 L**. Show a gap of **430 L**: as a SHORTAGE (−430) it is inside the 450 band; as an EXCESS (+430) it is **30 L outside** the 400 band. Consistent set: inspection stock + receipts since = 30,430 L, tank now 10,000 L, meters say 20,000 L sold → variation −430; flipped version 29,570 L, tank 10,000 L → +430. Beyond-band demo from my render: petrol −1,500 against band 1,161 → 339 L short; diesel +940 against 575 → 365 L over.

### 2.7 Pain and hooks (first 1.5 s)
Pain (fact file §8): "the late night — half past eleven, the report still will not tally"; "the stock loss found late"; the daily 10 a.m. book list ("update sales report, density book, stock board — all before 10").
1. **Number:** `4,222 लीटर` fills the paper register line / "4,222 litres. Yesterday's sales. Copy it in."
2. **Question:** `रात के साढ़े ग्यारह बजे, रजिस्टर अब भी नहीं मिल रहा?` / "11:30 at night and the book still won't tally?"
3. **Visual contradiction:** a blank register row on the left, the picture lands on the right and every box is already full; or three paper books by ten ("दस बजे से पहले तीन बुक") collapse into one picture.
Variation hooks: (a) `−430 L: ठीक। +430 L: सीमा से बाहर।` / "Same gap. Opposite verdict."; (b) fear word `नोटिस आने से पहले` / "Before the notice, not after"; (c) `4% की छूट — पर हर तरफ़ नहीं` / "4% allowance, but not both ways".

### 2.8 One outcome line (outcome-only, no banned tech words)
DSR: `कल की बिक्री और आज का स्टॉक — आपके फ़ोन पर, रजिस्टर में उतारने भर की देर। कोई भी उतार सकता है।` / "Yesterday's sales and today's stock, on your phone, ready to copy into the register. Anyone at the pump can do it."
Variation: `नोटिस बनने से पहले पता चले — स्टॉक सीमा में है या नहीं।` / "Know before it becomes a notice: is your stock inside the limit."

### 2.9 SAFE vs FORBIDDEN
**Safe:** 4% of stock; evaporation allowance on sales 0.75% petrol / 0.25% diesel (the existing explainer states both); the asymmetry (excess cannot be explained by evaporation: fuel can boil off, it cannot arrive); clause "नियम 5.1.11" (founder-confirmed industry rule); the consequences **as the card words them** with "can": excess → samples to lab and sales/supply of all products can be stopped immediately; shortage → samples tested, trading continues, written explanation called for, supply stops only if unsatisfactory (fact file §4); the worked 450 / 400 example; the corrected-report line; "anyone at the pump can copy it"; "today's sales close on tomorrow's reading" (it is printed on the card).
**Forbidden / traps:**
- Any fine, penalty or threshold beyond what §4 states; "your pump will be shut".
- The 600 KL tier (not implemented; fact file mentions it only in passing). Do not say 4% "for every grade at every outlet" (`products.ts` says it is a default seen so far).
- `536 of 557 figures matched`, `11 hours a week`, `22 windows`, `0 missed`, `never a missed deadline`, `1,400+ pumps`, "all 8 dealers live" (§6).
- Method: IRAS, "from the automation", "5 L testing per pump" (flat engine assumption), "rounded up to 500 L", "worked out from the tank dip" (inferred deliveries), "business day runs from the shift anchor", "macro Excel workbook", "since-inspection seeds", "ledger". The printed `(हाथ से भरी)` / `(डिप से आँकी)` / `M` / `D` markers are on the card; do not narrate or animate their explanation.
- Real outlet codes (1E…16E), RO/SAP codes, real litres or meter readings (`real-*.png`), the real 1E tank-4 dead-gauge story.
- The two advice lines `≈ N लीटर डीयू (DU) से टंकी में डालकर स्टॉक ठीक करें` and `…टेस्टिंग/निकासी दिखाकर स्टॉक ठीक करें` read as "adjust the stock to fit". They are on the real card but I recommend cropping or blurring them in public creative and showing verdict + band only. **Owner to confirm (Q3).**
- Delivery claims: "every morning", "6 AM", "WhatsApp", "automatically".
- "Never say" words in spoken lines: app, dashboard, portal, software, system, data, automatic, AI, digital, online. (The cards print `DATA PREPARED AT` on the Credit card: not on the DSR.)

### 2.10 Video potential: DSR 9, variation 9. Best motion moments
- **DSR:** the tile number counts up `0 → 4,222` while the same number is written into a paper register row; then the arithmetic line `12,480 + 6,000 − 14,246 − 12 = 4,222` snaps on; finally yesterday's `STOCK 14,246` slides down to become today's `OPENING`. (Today's row `—` resolving next morning is a second beat.)
- **Variation:** the round pin sits at −430 inside the long green zone; a mirror flip moves it to +430 and it lands **outside the shorter right edge (+400)**; colour goes green → deep red; the chip changes `सीमा में` → `सीमा से 30 L ज़्यादा`. (A pin swinging back inside the band after a "correction" is the optimistic mirror: do NOT imply the dealer can fix a real excess by arithmetic.)
- Separate videos are justified: DSR = "the register fills itself"; variation = "two allowances, two directions". The existing public explainers (`mdg-demo/src/beats/social/stockVariation.ts`, `plusVsMinus.ts`, `cumulativeColumn.ts`, `testingLitres.ts`) teach the trade with no MDG screen and, by design, **never state the breach consequence**. New reels may show the real card and use the §4 wording; check with the founder that "can be stopped immediately" is acceptable (fact file §4 allows it as founder-confirmed; the explainers were written before that).

---

## 3. Feature 3 — Credit & DOD card

### 3.1 Name, slug, status
`CREDIT & DOD MONITORING` / `रोज़ का उधार-हिसाब`. Slug `credit-dod-card`. LIVE since Aug 2026 (memory `credit-dod-service`, `credit-dod-admin-ux-pass`); an admin generates, reviews and shares. A card whose figures do not reconcile with the oil company's own receivable is **blocked from sending** (a super-admin may override). **Owners only** since 16 Oct: the server refuses Manager/Both (`services/ownersOnlyShare.ts`); copy lands in each owner's private chat, never the group chat. Delivery not on a timer. Code: `mdg-backend/src/automation/sdms/report/{renderCard,creditCard,festivalBand}.ts`, `services/creditDod/share.ts`, `shared/src/data/festivals.ts`.

### 3.2 What the dealer receives
One picture (1000 px card, frame 40) + one line + push. Line (due): `💳 ₹4,86,120.00 26 अगस्त तक जमा करें (पोर्टल के अनुसार)।` / `₹4,86,120.00 due by 26 Aug, as per portal.` (**drop the portal clause**); overdue `🔴 …`; lag `⚠️ जमा की तारीख़ निकल गई`; locked `🔒 उधार बंद — रिव्यू की तारीख़ 20 अगस्त निकल गई। अपने सेल्स ऑफिसर से बात करें।`; no dues `✅ कोई बकाया नहीं`. Push titles `क्रेडिट और DOD` / `भुगतान बकाया` / `जमा की तारीख़ निकल गई` / `उधार बंद`. Without a card image the full bilingual text is posted instead (contains the "honest caveat": `पिछले 1-2 दिन में किया भुगतान इसमें न दिखे तो चिंता न करें / A payment made in the last day or two may not appear here yet.`).

### 3.3 VISUAL ANATOMY (top to bottom) — renders in `…/scratchpad/render/credit-*.png`
Frame cream `#fffdf5`, 6 px maroon border, radius 22.
1. **Brand band** 40 px gold gradient, text `Dealer's कवच · @MDG Services` repeating (replaced by the **festival band** when a festival is live: a white pill with `दीपावली की हार्दिक शुभकामनाएँ · Happy Diwali` and a diya on each side, gradient `#f59e0b → #fef3c7 → #d97706`).
2. **Header** 124 px maroon gradient: MDG chip · centre `CREDIT & DOD MONITORING` (38 px white) over gold `रोज़ का उधार-हिसाब` · gold code pill at right.
3. **Hero** (two columns). Left (`#fef2f2`): eyebrow `DUE AMOUNT` (22 px, letter-spaced maroon) · amount `₹4,86,120.00` 88 px red `#b91c1c` · Hindi `इंडियन ऑयल के खाते में जमा करनी है`. Right panel 320 px: label `DUE DATE` · `26-08-2026` 46 px · **verdict (the "days-left chip")** Hindi + English: `3 दिन बाक़ी हैं / 3 days left`.
4. **Lock band** (only when the credit review date has lapsed; red `#fee2e2`, 10 px left rule): `CREDIT LOCKED — REVIEW DATE PASSED` + `20-08-2026 · 3 दिन पहले / 3 days ago`; Hindi `उधार की समीक्षा (रिव्यू) की तारीख़ निकल चुकी है — अब उधार पर तेल नहीं मिलेगा। हर खरीद का पैसा पहले जमा करना होगा (कैश एंड कैरी)।`; action `खाता दोबारा चालू कराने के लिए अपने सेल्स ऑफिसर से संपर्क करें।`; English twin.
5. **YOUR LIMIT / आपकी उधार सीमा**: three white tiles `CURRENT LIMIT ₹25,00,000.00 / आज तक के लिए निर्धारित राशि` · `AVAILED LIMIT ₹18,42,650.00 / अभी तक की गई खपत की राशि` · `AVAILABLE LIMIT ₹6,57,350.00 / खपत के लिए बची हुई राशि`. Below, the **utilisation bar** (20 px, white track): fill gold→orange `#f59e0b → #ea580c`, left caption `74% इस्तेमाल हो चुकी है`, right green `26% बची है`. **From 85% up the fill turns red `#ef4444 → #b91c1c`** (code is `pct >= 85`; the fact file says "above 85%"). Whole-percent rounding (the card prints 74%, not 73.7%). While locked the bar is replaced by a red note `रिव्यू की तारीख़ निकलने की वजह से यह बची हुई राशि अभी इस्तेमाल नहीं हो सकती / …`.
6. **FORM OF LIMIT / इन तीन में से एक — आपका नीचे हाइलाइट है**: three chips `DOD` · `CREDIT` · `CASH & CARRY`, the dealer's own filled maroon, the others grey `#a8a29e`; when locked the chip stays as is and a red note says purchases are cash & carry for now.
7. **Footer** (`#fffaf0`): `DATA PREPARED AT` `9:14 AM · 23-08-2026` and right `इस समय तक का हिसाब · इसके बाद की खरीद-भुगतान इसमें नहीं है` (this is the on-card honest caveat). Closing brand band.

**States (all real):**
| State | Trigger | Look |
|---|---|---|
| Due, >3 days | `N दिन बाक़ी हैं` | plain cream date panel |
| Due, ≤3 days | `soon` | gold-soft panel |
| 1 day left | `कल आख़िरी दिन / Due tomorrow` | `soon` |
| Due today | `आज ही जमा करना है / Due today` | amber panel `#fff7ed`, amber verdict `#c2410c` |
| Payment-lag (deadline passed ≤ **2** days) | `PAST DEADLINE` eyebrow `जिसकी जमा करने की तारीख़ निकल चुकी है`; panel `DEADLINE WAS` | **amber hero** `#fff7ed`, amount `#c2410c`, deliberately not an accusation |
| Overdue (> 2 days) | `OVERDUE AMOUNT`; `DEADLINE WAS 26-08-2026`; `4 दिन पहले तारीख़ निकल चुकी है — तुरंत जमा करें / Overdue by 4 days — deposit now` | **red hero** `#fee2e2`; if the overdue sum exceeds DUE AMOUNT a note `नीचे दिया DUE AMOUNT इसका सिर्फ़ एक हिस्सा है · DUE AMOUNT below is only part of this` |
| Advance (negative balance) | `ADVANCE WITH INDIAN OIL` / `इंडियन ऑयल के खाते में आपकी जमा राशि` | green hero, amount shown as a magnitude, date panel `कुछ नहीं / कोई बकाया नहीं / Nothing to pay` |
| Settled | `NOTHING DUE` / `सारा हिसाब चुकता है — कुछ जमा नहीं करना` | green hero |
| Locked | credit review date passed | lock band + bar replaced (above) |
| ≥85% used | bar red | see 5 |
| Festival | admin toggle, window inclusive | band replaced (Diwali/Holi/New Year only for public creative) |
A negative limit tile (money in the dealer's favour) is shown **green**, with `-₹` not `₹-`.

### 3.4 Invented, consistent figures (checked)
Fact-file set: **current limit ₹25,00,000 · availed ₹18,42,650 · available ₹6,57,350 (25,00,000 − 18,42,650 ✓) · due ₹4,86,120 by 26-08 · 73.7% (prints 74%)**.
**Date trap:** under the encoded rule (due date = oldest open purchase date + 3 days, rolled forward off Sundays and the 2nd/4th Saturday, plus confirmed bank holidays; `automation/sdms/dodDueDate.ts`), **26-08-2026 (Wednesday) can only come from a Sunday purchase, and the depot loads nothing on Sundays** (memory `load-planner-service`). If a video narrates "bought Monday, due Thursday", use **Mon 24-08 → due Thu 27-08-2026**. A card that prints only the due date (no purchase date) is fine with 26-08. Countdown for the animation (as-of date → verdict): 21-08 `5 दिन बाक़ी` · 23-08 `3 दिन` · 25-08 `कल आख़िरी दिन` · 26-08 `आज ही जमा करना है` · 27-08 lag (amber, 1 day) · 30-08 overdue 4 days (red). Hot-bar variant: availed ₹22,50,000, available ₹2,50,000, 90%. Advance example: ₹74,818.86 in advance (from the repo's test fixture: invented). The festival band is time-stamped at generation, not at sharing.

### 3.5 Pain and hooks
Pain (§8): "the money found out on the wrong day: the tanker is due and the credit has run short"; the 3-day clock nobody sends a reminder for (existing explainer `dodClock.ts`: `खाता शून्य से नीचे गया — तो गिनती शुरू हो चुकी है।`).
1. **Number:** `₹4,86,120 — 26 अगस्त तक`, amount slams in at 88 px.
2. **Question:** `टैंकर आने वाला है — क्रेडिट कितना बचा है?` / "The tanker is coming. How much credit is left?"
3. **Visual:** the red days-left verdict ticking `5 → 3 → 1 → आज`, background shifting cream → gold → amber while the amount does not move.
Fear-word variant: `तारीख़ निकल गई?` / "The date went by?"

### 3.6 Outcome line
`इंडियन ऑयल को कितना जमा करना है, और कब तक: एक नज़र में, आपके फ़ोन पर।` / "How much to deposit with Indian Oil, and by when, at a glance." (the existing marketing film line is close: `इंडियन ऑयल को कितना जमा करना है, और कब तक — साफ़ लिखा हुआ आपके पास।`).

### 3.7 SAFE vs FORBIDDEN
**Safe:** one decision, two figures (how much, by when); the 3-day rule incl. bank-holiday roll (§6 "safe to state"); limit tiles; the bar and the 85% colour change; the three form-of-limit chips; "locked → every purchase must be paid upfront (cash & carry) until the sales officer reopens it" (fact file §5 states it; it is printed on the card); the honest caveat (a payment made in the last day or two may not show yet); the card goes to owners only (shipped 16 Oct; no real send observed, UNVERIFIED in practice); the festival band (non-national festivals).
**Forbidden / traps:**
- What happens on a missed deadline (fine, hold, interest, block). The overdue card says only "deposit now"; keep it at that (§6).
- "Portal", "SDMS login", "pulled from IndianOil", `DATA PREPARED AT`, preparation time (0.2). Never expand DOD. The oil company may be named in words only; no logo, no livery.
- "We never miss a deadline", "we will remind you every day" (0 missed is unverified; reminders are not an automated daily schedule).
- Real figures: any real dealer limit, the repo's `5E01` fixture (₹8,03,960.60), the existing mock panel's `73.7%`.
- The tricolour / Chakra festival bands (0.4).
- Implying the dealer can fix a lock by depositing: the card says only the sales officer can reopen it.
### 3.8 Video potential **9**. Best motion moment: the due-date verdict counting down with the hero colour shifting (cream → amber → red), then the utilisation bar filling 74% and flipping to red past 85%.

---

## 4. Feature 4 — Ledger Watch card

### 4.1 Name, slug, status
Card title `OTHER MOVEMENTS` / `तेल-भुगतान से अलग की एंट्री`; push title `खाते की जाँच / Account check`. Slug `ledger-watch`. Detection LIVE since 6 Sep; dealer card from 8 Sep; dated-window card 20 Sep (memory `ledger-watch`). **Admin-sent** (a menu on the admin's Ledger Watch pane), **owners only** since 16 Oct. No timer. Whether any dealer has actually received one: **UNVERIFIED** (prod has test users only). Code: `mdg-backend/src/services/ledgerWatch/{card,cardStore,detect,classify}.ts`, `shared/src/types/ledgerWatch.ts`.

### 4.2 What the dealer receives
A picture + one line `📒 आपके खाते में तेल, जमा और कार्ड सेल्स के अलावा 4 एंट्री आई — कार्ड देखें।` / `📒 4 entries on your account besides fuel, deposits and card sales — see the card.` With a date window the line names the dates; picture shows up to 30 rows then says "showing the 30 most recent of 47 — the totals below cover all 47".

### 4.3 VISUAL ANATOMY (render: `…/scratchpad/render/ledger-sample.png`, 1000 px card)
1. Gold brand band 34 px `Dealer's कवच · @MDG Services`.
2. Header maroon: MDG chip · `OTHER MOVEMENTS` (30 px white) over gold `तेल-भुगतान से अलग की एंट्री` · white-outlined code pill.
3. Hero (centred): maroon `तेल और आपके जमा से अलग की एंट्री` (27 px) + English `The last 4 entries on your account that were not fuel, not your deposit and not your card sales.` Optional `h-more` `4 of 37 · ऐप में पूरी सूची / full list in the app`. Empty state: green `कुछ अलग नहीं आया` + `Nothing outside the usual — only fuel, your deposits and your card sales.`
4. Table `तारीख़ / Date | क्या था / What it was | रकम / Amount`; row = date `24-08-2026` · English title bold over Hindi title · amount (red `₹4,386` + `काटे गए · charged`, or green `₹28,940` + `जमा हुए · paid to you`). The word, not a minus sign, carries the direction.
5. Totals, two tiles: red-wash `इन 4 में से काटे गए / Charged, of these 4  ₹20,886` and green-wash `इन 4 में से जमा हुए / Paid to you, of these 4  ₹28,940`.
6. Footer: left `IndianOil पोर्टल से / Read from the IndianOil portal` + stamp (**crop**); right **`यह DOD जमा राशि नहीं है / This is not your DOD deposit amount`** (keep: it is the one thing the card must never be mistaken for). Closing band.
Row kinds (plain titles the dealer reads, EN / HI): `Interest charged on the outstanding` / `बकाया रकम पर ब्याज लगा`; `Licence fee (SSLF) recovered` / `लाइसेंस फ़ीस (SSLF) की वसूली`; `Dealer commission paid` / `डीलर कमीशन मिला`; `Machinery lease / rental charge` / `मशीन के लीज़/किराए का शुल्क`; `Xtra Power machine monthly rental` / `एक्स्ट्रा पावर मशीन का मासिक किराया`; `Site modernisation EMI recovered` / `साइट मॉडर्नाइज़ेशन की EMI कटी`; `Corpus fund EMI recovered` / `कॉर्पस फ़ंड की EMI कटी`; `Fleet card settlement reversed` / `फ्लीट कार्ड की रकम वापस ली गई`; `K0 merchant consent charge` / `K0 मर्चेंट कंसेंट का शुल्क`. (Fleet-card settlements are ROUTINE and never appear; fuel invoices and deposits never appear.)

### 4.4 Invented consistent figures (my sample, checked)
24-08 interest ₹4,386 charged · 19-08 licence fee ₹11,250 charged · 12-08 commission ₹28,940 paid to you · 05-08 machinery rental ₹5,250 charged → **charged 4,386 + 11,250 + 5,250 = ₹20,886; received ₹28,940**. Do not use the real range endpoints (₹433.64–₹61,565.09 interest, ₹9,202.56–₹2,69,730.70 licence fee, ₹5,842 / ₹28,994.50 commission, ₹7,118.26 reversal). The flat `₹1,062` participation fee is a fixed charge, not dealer-identifying, but not needed.

### 4.5 Pain and hooks
Pain: a month-end balance does not tie and "it looks like the company made a mistake" (existing explainer `ledgerLines.ts`).
1. **Number/contrast:** `₹63 भी, ₹9,443 भी: एक ही नाम की फ़ीस` (already published, fact file §7; keep it unattributed).
2. **Question:** `तेल और जमा के अलावा: यह तीसरी लाइन क्या है?` / "Fuel, deposits… so what is this third line?"
3. **Visual:** two stacks of paper (fuel bills, deposits) and a few loose slips falling between them; the card collects them.

### 4.6 Outcome line
`खाते में तेल और जमा के अलावा जो कटा या आया: नाम और रकम के साथ।` / "Everything on your account that was not fuel or your deposit, named, with the amount."

### 4.7 SAFE vs FORBIDDEN
**Safe:** the "last four non-routine entries" card; totals "of these 4 only"; `This is not your DOD deposit amount`; "interest, licence fee, rent, EMIs, commission" as kinds; "twelve kinds of line, only two are fuel and money" (existing explainer; I cannot reconcile this with memory's "13 entry kinds / 12 rules"; use as the explainer words it).
**Forbidden / traps:**
- **Stale number:** the fact file's "over a thousand lines were worth a second look; exactly one was serious" is superseded (7 Sep: fleet-card settlements became routine, 1,252 of 1,418 flags retired; 166 real findings left). Do not use "a thousand".
- Calling any charge wrong or a fraud; naming the one anomaly (a fleet-card debit); naming an outlet.
- `3,163 lines`, "across our customer base" (production is 10 test records). The existing explainer says "eleven pumps' accounts"; use only if the founder agrees.
- "Read from the portal", the footer stamp, "classifies", "flags", "rules", "AI proposes names" (a model proposes inactive rule names internally).
- The card's English-heavy, table-like look is real; do not add colours or icons the card does not have.
### 4.8 Video potential **6** (quiet topic, little visual drama). Best motion moment: four rows drop in, red charged vs green received totals tally in two tiles, then a stamp `यह DOD जमा राशि नहीं है` lands on the footer.

---

## 5. Feature 5 — Load Planner ("अगला टैंकर")

### 5.1 Name, slug, status
Card header `अगला टैंकर · Next tanker`; chat/push title `टैंकर प्लान / Tanker plan`. Slug `next-tanker-plan`. **Not mentioned anywhere in the fact file** (it post-dates it). LIVE since 6 Oct (pilot 1E) and for 8 outlets since 8 Oct (1E 2E 3E 5E 9E 12E 14E 15E; 16E not attached); **every plan is a DRAFT; an admin approves, then it is drawn and sent; a plan can be dismissed** (memory `load-planner-service`, `mdg-backend/src/services/load-planner/README.md`). **UNVERIFIED that a plan has ever reached a dealer.** Audience Owners/Manager/Both (confirm warns it shows the credit amount). Code: `services/loadPlanner/{card,share,plan,inputs}.ts`, `shared/src/types/loadPlan.ts` (`LOAD_PLAN_PROJECTION_DAYS = 4`).

### 5.2 What the dealer receives
One picture + `🚚 आज टैंकर ऑर्डर करें — डीज़ल खत्म हो रहा है।` (the plan's own headline, one language) + push `टैंकर प्लान`. Headlines (Hindi / English) by case: `आज ही टैंकर ऑर्डर करें — डीज़ल खत्म हो रहा है` / `Order a tanker today — diesel is running out` (red); `आज टैंकर ऑर्डर करें` / `Order a tanker today` (amber); `आज टैंकर ऑर्डर करें — रविवार को डिपो बंद है` / `…the depot is closed on Sun`; `आज ऑर्डर की ज़रूरत नहीं — अगला ऑर्डर 17 Oct को` / `No order needed today — next order on 17 Oct` (green).

### 5.3 VISUAL ANATOMY (render: `…/scratchpad/render/loadplan-sample.png`, 1000 px card, frame 16)
1. Gold band 34 px. 2. Header: MDG chip · `अगला टैंकर · Next tanker` over gold-cream `Stock at 6 AM, 15 Oct` (literal "6 AM", crop) · white-outlined code.
3. **Headline** centred, Hindi 27 px (red / amber / green by urgency) over English 19 px.
4. **Truck block:** `Order 15 Oct · Loads at depot 16 Oct · Unloads about 4 PM, 16 Oct`, then **one green-wash tile per chamber** (`डीज़ल · Diesel` / `4,000 L` / `Tank 2`; `खाली · Empty` grey tile when no tank has room). Several tankers → `टैंकर 1 · Tanker 1` labels.
5. **Four-day projection** box, maroon title `अगले 4 दिन का ऑर्डर · Orders for the next 4 days`; four rows (weekday Hindi + date, English weekday): `गुरुवार 15 Oct · 1 टैंकर: डीज़ल 8,000 L · पेट्रोल 4,000 L` (amber row), `कोई ऑर्डर नहीं · No order`, `डिपो बंद · Depot closed` on Sundays/holidays.
6. **Stock table** `फ्यूल / Fuel | स्टॉक / Stock | बचे दिन / Days left | खत्म / Runs out` (`2.3 दिन · days`, `17 Oct`); a fuel at its low-stock line is red-washed with `न्यूनतम स्टॉक पर · At the low-stock line`.
7. Depot-closed box (amber border): `डिपो बंद: रविवार 18 Oct` / `Depot closed: Sun 18 Oct`.
8. Optional on-the-way lines (omit). 9. **Credit line:** green `इस टैंकर के लिए क्रेडिट काफ़ी है (₹18,00,000 उपलब्ध)` / `Credit covers this tanker (₹18,00,000 available)` or red `ऑर्डर से पहले ₹4,36,555 जमा करें` / `Deposit ₹4,36,555 before ordering`. (Quirk: the covered state prints the Hindi line in red; it is real.) 10. Footer `Daily sale = average of recent normal days.` 11. Band.

### 5.4 Invented consistent figures (my sample)
Diesel 9,000 L at 4,000 L/day → **2.3 days** (9,000/4,000 = 2.25), runs out 17 Oct; petrol 5,500 L at 1,800 L/day → **3.1 days**, 18 Oct; tanker 3 × 4,000 L = 12,000 L (diesel 8,000 + petrol 4,000, the projection row says the same); Sunday 18 Oct depot closed; credit available ₹18,00,000. Tank sizes are always 10 or 20 KL in this fleet; the low-stock line figures 2,407 L / 1,383 L are real fleet settings: do not print them. Never print a per-litre price.

### 5.5 Pain and hooks
Pain: "the tanker is due and the credit has run short" (§8 pain 4); a depot shut on Sunday makes yesterday's order late.
1. **Number:** `डीज़ल: 2.3 दिन का बचा है` counting down.
2. **Question:** `अगला टैंकर कब मँगाना है?` / "When do you order the next tanker?"
3. **Visual:** Sunday `डिपो बंद` tile turns amber on the calendar strip while the headline says `आज ही ऑर्डर करें`.

### 5.6 Outcome line
`अगला टैंकर कब और कितना मँगाना है: चार दिन आगे तक, एक नज़र में।` / "When to order the next tanker and how much, four days ahead, at a glance."

### 5.7 SAFE vs FORBIDDEN
**Safe:** the card as printed; "four days" as the card's own title; chambers by fuel and tank; a depot closed on Sunday (observable trade fact).
**Forbidden / traps:** "IndianOil takes projections for the next 4 days only" (an owner statement, not verifiable: do not attribute the 4-day limit to the oil company; per §9 never state oil-company rules you cannot back); planner words (pool, percentile, lead time, safety days, backfill, scorecard); how the depot time is learnt ("measured from your invoices": method); a depot name (all eleven real outlets load at one terminal: naming it identifies the region); real tank lines / invoice numbers / vehicle numbers; any claim that "it is never wrong" (outcome scoring exists internally; accuracy unknown); showing a real credit figure; claiming dealers already use it at scale (drafts, 8 test outlets).
### 5.8 Video potential **7** (strong visual: tanker chambers + days-left), but status risk: do not sell it as a mass-adopted feature. Best motion moment: three chamber tiles slide into a tanker silhouette and fill (diesel, diesel, petrol) while the `2.3 दिन` countdown shrinks to the red low-stock line.

---

## 6. Feature 6 — Per-tanker profit (Fuel P&L)

- **Status:** LIVE admin screen `/dsr/dealers/:id/pnl` (27 Aug), image export from the browser 31 Aug (memory `fuel-pnl-screen`). Code `mdg-backend/src/services/dsr-report/pnl.ts` (litres only; a test asserts no rupee word), `mdg-admin/src/lib/{fuelPnl,pnlCard,pnlCardImage}.ts`, `pages/dsr/DsrPnlView.tsx`.
- **Dealer-facing: NO.** Fact file: "an admin tool, not an app feature… produces a single image an admin can hand to a dealer." The dealer never sees the screen. The image is drawn in the admin's browser (canvas, English only) because the rates are typed by hand and never leave that machine. Nothing in the dealer's chat posts it (no share route). So the answer to "is that image dealer-facing?": **only if a person hands it over; not a product surface.**
- **What the image holds:** both testing answers side by side (`Testing fuel poured back in` / `Testing fuel sold`), profit, `Fuel sold`, `Margin on sales`, `Fuel lost/gained`, measured vs assumed lists, per-grade rate table, variation per grade, footer caveats.
- **Recommendation: do NOT make a public video from it.** Reasons: (1) it is an admin screen (§9); (2) it needs hand-typed rates, so any ₹/L margin on screen is an invented margin; fact file: "do not publish a petrol margin" (the one real data point implied a margin far thinner than the ₹2.50–3.00 usually quoted and was never confirmed); (3) it prints both answers to an open question whose "sold" branch can flip a shortage into a **surplus beyond band = immediate sales-suspension event** (5.1.11); (4) English-only, dense, caveat-laden: poor reel material; (5) real landed cost `₹97.76/L` from one real invoice appears in fact file §7 as published, but must not be generalised.
- **If the owner insists on a "what did I make on that load?" teaser:** use only the worked example (all invented, verified): 10,000 L bought at ₹90, pump price ₹95, 100 L vanish → profit **₹40,500** either way (at cost: 9,900 × 5 − 100 × 90 = 40,500; at retail: 10,000 × 5 − 100 × 95 = 40,500; mixing the two gives the wrong ₹41,000). Warn: the ₹5/L margin is unrealistic and may be read as the dealer's commission; use a non-margin framing (litres only) or no rupee-per-litre figure.
- **Video potential 3.** Single best motion moment (if ever): the two ways of explaining one profit converging on the same ₹40,500.
- Method-leak traps: "per tanker priced from your invoice", "rates typed by hand", "testing assumption", "the server refuses to return rupees".

---

## 7. Feature 7 — Pump-slip photo reader

- **Status:** LIVE since 2 Sep for one hand-entered outlet (16E), off by default (`SLIP_READ_ENABLED=true` in the box's `.env`); ADR 0012, memory `slip-reader`, code `shared/src/iras/slip.ts`, `mdg-backend/ocr/read_slip.py`, `mdg-admin/.../SlipPanel.tsx`.
- **Dealer-facing: NO.** Grep of `mdg-client/` and `mdg-app/` finds no slip UI. ADR 0012: "a request an admin makes, not a job on a schedule"; somebody at MDG photographs the outlet's printed slip and the admin screen shows `Readings from a slip`. The dealer sees nothing; the only outcome he receives is an ordinary DSR for an outlet that has no automation.
- **Why it must never appear:** it uses an on-box OCR reader and a vision model (the only genuine AI in this topic, and "AI" is a banned word), a measured failure mode (a blurred slip read as 54,979.890 against a true 48,615.550), and an admin screen. Rule §9: "anything the company does on a dealer's behalf" is not described, only its outcome.
- **The trade idea that IS public:** "proving the meter with the slip" (the litre counter and the rupee counter on the same slip prove each other) is an existing public explainer (`mdg-demo/src/beats/social/proveTheMeter.ts`). A real public example: meter 330.33 L vs money-implied 329.98 L, 0.35 L apart (fact file §7). Reuse the explainer's wording; **never mention reading a photo**.
- **Video potential 1** for this tool. Not a reel.

---

## 8. Existing samples, and how to render fresh ones locally (no prod)

### 8.1 Existing images/videos
| Path | What | Use? |
|---|---|---|
| `mdg-app/store-assets/capture/demo/dsr-2026-10-14-{sales,variation}.png`, `dsr-2026-10-15-{sales,variation}.png` | LIVE-design DSR cards, fictional outlet `99Z` (public store listing precedent) | **Yes** (reference) |
| `mdg-app/store-assets/captures/02-report.png` (+ `screenshots/screenshot-02-report.png`, 1080×1920) | Real app chat showing the two-up DSR bubble | **Yes** (chat chrome) |
| `mdg-app/store-assets/capture/{digest.mjs under demo/, render-cards.mts, stack.sh, capture.mjs}` | How the store pictures were made; fictional digest generator | **Yes** |
| `marketing/panels/p-dsr.png`, `p-credit.png` (+ `panels.html`, `render.mjs`) | Stylised marketing mock-ups, stale teal chrome | No (not faithful) |
| `marketing/films/graphics/clips/G-dsr.mp4`, `G-credit.mp4`, `thumbs/G-*.jpg`, `films/graphics-kavach/*` | Existing motion graphics built on those panels | Style reference only |
| `marketing/refs/product/real-sales.png`, `real-variation.png` | REAL outlet `1E`, real figures | **Forbidden** |
| `mdg-demo/public/credit-card/{due,advance}.jpg` | Photos of the old seven-row credit card | Forbidden until checked |
| `mdg-demo/public/stock-variation/sheet.jpg` | Photo of the old hand-typed sheet, code masked | Maybe (masked) |
| `mdg-demo/public/broll/*.png` (ledger-night, tanker-delivery, tank-dip, pump-night, phone-morning…; prompts in `broll/prompts.json`) | Generated b-roll stills | Yes |
| `mdg-demo/out/credit-monitor.mp4`, `stock-variation-sheet.mp4`, `gen-*-{hi,en}.mp4` | Existing course/explainer videos (credit card walkthrough = dealer part 7) | Reference for approved wording |
| `mdg-demo/src/marketing/dsr.tsx` | Remotion replica of the DSR table + paper register with the fact-file figures | Reusable pattern |
| `mdg-demo/src/screens/CreditCard.tsx`, `lib/creditCard.ts` | Remotion replica of the new credit hero/tiles layout (uses real-looking `DUE_CARD`; swap the numbers) | Pattern only |
| My renders (ephemeral): `/private/tmp/claude-502/-Users-dissu-Documents-PP-mdg-service/236ce7c5-ac26-4498-9e9b-332a87c88170/scratchpad/render/` — `credit-{due-3days,due-5days,due-today,hot-90,lag,overdue,locked,advance,settled,diwali,independence}.png`, `dsr-new-{sales-ok,var-ok,var-breach}.png`, `dsr-head-{var-breach,sales-marked}.png`, `ledger-sample.png`, `loadplan-sample.png` | Fresh, fictional (`99Z`) | Reference now; may vanish with the session |

### 8.2 Recipe (safe, local, ~1 minute; this is how I produced mine)
The card builders are **pure functions returning self-contained HTML/CSS strings**: `cardHtml(buildCreditCard(input), festival?)` (`automation/sdms/report/renderCard.ts`), `buildSalesCardHtml(digest)` / `buildVariationCardHtml(digest)` (`services/dsr-report/cards.ts`), `ledgerWatchCardHtml(data)` (`services/ledgerWatch/card.ts`), `loadPlanCardHtml(plan)` (`services/loadPlanner/card.ts`). A video agent can embed or restyle this HTML directly.
1. Run a throwaway script from a scratch directory, never from `mdg-backend/` (the builders import `config/env.ts`, which loads the laptop `.env` = **production**; `env -i` with dummy values keeps that from being read, and nothing connects to a database anyway):
   `env -i PATH="$PATH" HOME="$HOME" MONGODB_URI='mongodb://127.0.0.1:1/none' JWT_SECRET='dummy-dummy-dummy-dummy' NODE_ENV=test LOG_LEVEL=silent /Users/dissu/Documents/PP/mdg-service/node_modules/.bin/tsx ./build.ts`
   with `import … from '/Users/dissu/Documents/PP/mdg-service/mdg-backend/src/…'` absolute paths, `writeFileSync('x.html', …)`, and a symlink `node_modules -> /Users/dissu/Documents/PP/mdg-service/node_modules` next to the script so `@dk/shared` resolves.
2. Shoot with **plain node** (never under tsx: memory `tsx-breaks-page-evaluate`): `chromium.launch({channel:'chrome'})` from `/Users/dissu/Documents/PP/mdg-service/node_modules/playwright`, viewport width = card width + 120, `locator('#frame').screenshot()`, deviceScaleFactor 2 for the stored size.
3. Fictional digest for the DSR pair: `import { demoDigest } from '…/mdg-app/store-assets/capture/demo/digest.mjs'` (outlet `99Z`, MS + HSD). To force a breach, set `variation.variation`, `permissibleVariation` and `variationNotWithinLimit = |v|≤band ? 0 : v>0 ? v−band : band+v`; the redesign reads only `variationNotWithinLimit` for tone.
4. Repo's own one-liners: credit card `npx tsx scripts/preview-festival-card.ts out.png diwali` (in `mdg-backend/`; it renders with Chromium, no DB); DSR pair `mdg-app/store-assets/capture/render-cards.mts <cards.ts> 2026-10-15`.
5. Fonts: Noto Sans Devanagari must be present on the machine that renders video frames; Devanagari silently renders as empty boxes otherwise (marketing README: `vendor-fonts.mjs`).

---

## 9. Questions only the owner can answer (give as pick-lists)

| # | Question | Options I would offer | My pick |
|---|---|---|---|
| Q1 | Which DSR design do the reels depict? | (a) the live bilingual workbook-shaped cards; (b) the Hindi-only redesign if the owner approves it first | (a) unless he approves (b) before filming; the "copy into your register" story needs yesterday's full row |
| Q2 | May the Load Planner be shown as a feature, given only drafts exist? | show it as "next tanker plan" without claiming adoption / hold until the first real send | show, no adoption claims |
| Q3 | May the two "fix the stock" advice lines and the "sales can be stopped immediately" wording appear in public creative? | crop the advice lines, keep the verdict + `नियम 5.1.11` risk line / show both / show neither | crop advice lines, keep the verdict |
| Q4 | Scale claims on the end card (about 1,700 dealers, 250+ people, since 2021): ruled in only for the four Kavach films (fact file §6) | allow on reels / keep to "MDG Services · Fueling Success" and the phone / ask per reel | keep off the reels unless he says so |
| Q5 | Phone number on reels? Toll-free 1800-891-3496 is published again (9 Oct), written never spoken on the full film's end card | written only / none | written only, end card |
| Q6 | Is "owners only" for credit and ledger cards a promise we may state? Shipped 16 Oct, enforced by the server, no real send seen yet | state it / leave it out | leave out until one real send is seen |
| Q7 | Fictional outlet code on the card chip (`99Z`, used in Play graphics) or hide the chip? | keep `99Z` / hide | keep `99Z` |

---

## 10. Cross-feature SAFE / FORBIDDEN checklist (this topic)

**Spoken-line vocabulary:** use DSR, डिप, स्टॉक, वेरिएशन, टेस्टिंग, मीटर रीडिंग, टैंकर, डिपो, DOD, क्रेडिट, कैश एंड कैरी, इंडियन ऑयल, नोटिस. Avoid app, dashboard, portal, software, system, data, automatic, AI, digital, online, "WhatsApp" (fact file §6). `Dealer Kavach` is the app, `MDG Services` the company; tagline `Fueling Success` stays English.
**Numbers that may be stated:** 4% band; 0.75% / 0.25% evaporation; 3 days to repay credit past zero (holiday roll-forward); 9 services; 7 days to go live; 9am–9pm support; ₹3,000 a month + 18% GST (the short says "with GST"); the two published DSR rows; the published credit figures.
**Never state:** `1,400+ pumps / 14 states`, `536/557`, `~11 hours a week`, `22 windows`, `0 missed`, `9 portals`, `22 minutes / 9 days early / before 11 am`, "10 videos, 25 minutes", any density value, any real dealer's figure, any consequence of a missed credit deadline, anything about how a report is produced.
**Observable and safe consequence:** miss the quarterly mock drill and the next fuel order can be held (not in this topic).
**Marketing film conflict to fix in new reels:** it says reports arrive on WhatsApp every morning. They arrive in the Dealer Kavach chat, sent by a person; "after a person at MDG checks" is allowed (fact file §5); "automatically" is not.

**Unverified items (collected):** live = HEAD DSR design (not seen on the box); whether any Load Plan or Ledger card has reached a real dealer; Hindi chat header strings; whether `04-staff-hi`-style Hindi capture of a report exists (the only report capture is English); Diwali 2026 window dates (admin types them; check the calendar before showing a Diwali band); the Ledger "twelve vs thirteen kinds" count; production actually sending the 16 Oct per-sheet audience in practice.
