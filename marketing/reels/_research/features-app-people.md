# Research: the app itself, the people side, and the human-only service lines

Prepared 17 Oct 2026, read-only. Reader: the prompt writer. Sources read: `marketing/mdg-video-knowledge-pack.md` (the fact file, authority on claims), the memory index and ~40 memory files, `docs/ADR` 0008/0013/0017/0018/0019, `mdg-client/src` (live dealer app, last commit 96650e5), `shared/src`, `mdg-backend/src/{assist,services/chatAsks,services/dsr-report}`, `mdg-landing/src/i18n`, `mdg-demo`, `mdg-app/store-assets`, `marketing/`.
Nothing was run, rendered, sent or deployed. No `--commit`, no prod call.
Flag convention: **UNVERIFIED** = could not be confirmed from code or the fact file.

---

## 0. Read this first (the twelve things that change how you write prompts)

1. **The live app is brand-black and warm-grey, WhatsApp in layout only.** Since 13 Oct there is no tab bar, no "MDG" chip, no green, no maroon, no "online" dot. Home is the chat list; Settings is behind the three-dot menu. Light theme only (no dark mode exists). Exact tokens in section 2.
2. **Four sets of existing visuals are STALE against the live app. Do not copy them:** (a) `mdg-demo/src/screens/ChatScreen.tsx` and `LoginScreen.tsx` (12 Jul: "MDG" chip, "ऑनलाइन" dot, black outgoing bubbles); (b) every Kavach-film panel `marketing/films/graphics-kavach/panels/P0x` and `kit-base.css` (Sep: maroon header, "DK" badge, cream chat, maroon mic); (c) `marketing/panels/outro-app.png` (maroon end card; also says "ऐप"); (d) the Settings "Your services" screen (see rule 7).
3. **The ONLY current, real renders of the live app are `mdg-app/store-assets/captures/01..04-*.png` (15 Oct, 1170x2433, invented outlet "99Z").** A safe, documented local stack re-renders any state with invented data (section 2.6). Use these as the pixel reference.
4. **DO NOT USE `marketing/refs/product/real-sales.png` and `real-variation.png`.** I opened one: it is a real card with a real outlet code (1E), real litres and real meter readings (14 Sep). Public rule: no real dealer data.
5. **First reply in chat: the old "no LLM anywhere" memory is out of date.** Since Sep a language model writes the first reply (live for all dealers; "briefing" engine since 12 Oct). The app labels those replies "Instant reply / तुरंत जवाब". The system's own instruction forbids it to call itself a bot or AI, and says that if asked it answers "MDG's desk answers first and a person from the team is right behind you". So: never say "AI", "bot", "assistant", "automatic", "smart" in a video; never say "a real person replies first" either (that is false for chat). Say what the dealer sees: a quick first reply, and anything it cannot settle goes to the team under a number he can see (`#42 · MDG team is looking at it`), closed only by a person. Founder should confirm this framing (section 8, Q1).
6. **"A person, not a menu / आदमी उठाएगा, मशीन नहीं" is the PHONE line (toll-free, callback).** Never transplant it onto the chat. The website's "Talk live" is the in-page voice assistant, not a person; the site itself labels it "our assistant / हमारे सहायक".
7. **Method-leak traps that live inside dealer screens:** Settings > "Your services" prints "Runs daily", "Last: / Next:" run times and status pills (a schedule = method). Never recreate it. Also never show the admin inbox, Tickets page, Today board, alerts, Data Vault, or the guide site's "एडमिन के लिए" section (4 admin-portal walkthroughs are publicly listed there).
8. **Delivery wording:** reports land **in the app chat**. The pamphlet's "reaches you on WhatsApp or in the app" is wrong per the fact file (nothing sends reports over WhatsApp; a person forwards by hand). A person at MDG checks each report before it is sent. Do not promise a time of day.
9. **Push notifications are not a safe feature to show or promise** (never measured as working on dealers' phones; no web push). No "you will get a notification".
10. **Price rule:** the only publishable figures are 3,000 / 15,000 / 18% (the assistant's guard allows exactly those). The website pricing band prints no figure; pamphlet and marketing film print none; the four Kavach films say "₹3,000 a month + GST". Never an outlet-specific figure. Recommend no price in feature videos (section 3, F10).
11. **Six "human-only" lines:** all six have no dealer screen, but only 05, 06, 07, 09 have no software at all. 01 and 03 have admin-only back-office tooling and reach the dealer only as chat answers and the Kavach card. Treat the nine as "nine jobs taken off your desk", never "nine app features". (The DSR is inside 02, not a tenth.)
12. **Palettes in circulation: five.** App black/grey; website+pamphlet navy `#2C2E80` + gold `#F5A524`; Kavach films maroon+amber+cream; Play feature graphic near-black + teal; DSR cards maroon+amber with blue/orange product bars. The video needs a decision (section 2.5, Q2). My recommendation: phone screens in the live app's tokens exactly; the surrounding video brand in navy+gold.

---

## 1. Contradictions found, and the current truth

| # | Source A says | Source B says | Current truth (verified how) |
|---|---|---|---|
| 1 | Memory `ai-inventory-honest` (21 Aug): "There is no LLM anywhere" | Memory `ai-firstline-live-state` (5 Sep), `ai-tickets-and-briefing-engine` (12 Oct); `mdg-backend/src/assist/firstline/brief/prompt.ts` | A model call writes the first reply in the dealer chat. Live; writer on for all dealers; `AI_FIRSTLINE_ENGINE=brief`; density and shared-DSR figure gates ON, credit gate OFF. The honest-inventory memory is internal and stale on this point. |
| 2 | Fact file §6: "a real person replies first" wording not re-checked | Pamphlet/website: "A person, not a menu", "A real person picks up" | True for the phone line and callback. False for in-app chat (automated first reply, person behind). Play listing deliberately omits any mention of AI. |
| 3 | Memory: header chip reads "DK" | Live `AppBar`, `BrandMark.tsx`, `LoginPage.tsx` | The app now shows the traced logo ring (three people in an open hand). "DK" survives only as a 28px black rounded-square chip in the guide site header (`mdg-demo/site/scripts/build.mjs:190`) and as a maroon badge in the Sep film panels. |
| 4 | Memory `staff-points-scoring-model`: 66-item catalog, total 503.5 | `shared/src/data/staffWorkCatalog.ts` | 85 rows, 11 groups (counted: 10 cleaning, 5 DU, 8 equipment, 5 automation, 15 tanker, 7 mobile dispenser, 7 sales, 10 office, 7 customer, 8 kitchen, 3 other). Fact file is right. Do not quote 503.5/506. |
| 5 | Memory `asks-live-in-chat` (13 Oct) "IN PROGRESS" | ADR 0019, `services/chatAsks/*`, captures | Shipped 13 Oct. Papers, Density register and Pump health screens are gone. |
| 6 | Memory `site-calls-not-phone-number`: toll-free removed 23 Aug | Same file's header, fact file §9 | Back since 9 Oct inside a call sheet (toll-free or in-page assistant). Written `1800-891-3496`, `tel:18008913496`. |
| 7 | Pamphlet/website: "Nine portals", "22 deadline windows", "~11 hrs a week", "0 missed", "1,400+ pumps / 14 states / 9 portals", "Back online in 22 minutes", "Inspection-ready, always", "Nothing left unfiled" | Fact file §6 | Numbers unverified. Do not state "9 portals", "22", "11 hours", "0 missed". The sentences "Nine portals. Dozens of deadlines. One of you." is the company's published framing (§8) but the numeral is not a countable claim; prefer "dozens of deadlines". |
| 8 | Memory `mdg-guide-site` (Jul): 6 videos, 8 MB | `mdg-demo/site/data/videos.json` | 66 videos today: 62 portrait + 4 landscape (admin). Total runtime 4,755 s (79 min). README: about 37 MB at 240p, 58 MB at 360p, 149 MB at 720p. 8 dealer-course, 52 explainer cuts (26 x hi/en), 2 marketing films, 4 admin. |
| 9 | Full Kavach film: team there 24 hours | Website, FAQ, pamphlets: 9am-9pm | Open (fact file §6). Use 9am-9pm, every day incl. Sunday. Never "24x7". |
| 10 | Play listing category "Free" | Signed agreement is a paid subscription | Never say "free" / "completely free" in a video. |
| 11 | Website assistant greeting: "Ask me anything about the marketing guidelines..." | Same widget elsewhere says "what MDG Services does" | Odd copy; I would not show the greeting text. |
| 12 | mdg-demo README says dealer course 8 videos; guide site UI numbers "भाग 1..6" | `content.mjs` | 8 hand-written dealer videos exist (login, add warrior, give points, split points, submit points, points system, credit monitor, stock variation sheet). Do not quote a part count. |

---

## 2. The live app's visual system (for faithful recreation)

Authority: `mdg-client/src/index.css`, `tailwind.config.ts`, `components/AppBar.tsx`, `pages/ChatListPage.tsx`, `features/chat/MessageBubble.tsx`, `MessageList.tsx`, `Composer.tsx`, `MediaViewer.tsx`, `pages/SettingsPage.tsx`, `pages/StaffPage.tsx`. Confirmed against the real captures.

### 2.1 Colour tokens (hex)

| Role | Hex | Note |
|---|---|---|
| brand / every chat accent (send, mic, links, active chip text, unread pill, "Send photo" button) | `#18181b` | hover `#27272a`, soft `#f4f4f5` |
| page bg (non-chat screens) | `#fafaf9` | surface `#ffffff`, surface-2 `#f5f5f4` |
| border / strong | `#e7e5e4` / `#d6d3d1` | |
| text / muted / subtle | `#0f172a` / `#57534e` / `#78716c` | |
| chat top bar bg | `#ffffff` | text `#111b21`, icons `#54656f` |
| **chat wallpaper** | `#f3f2f0` | faint doodle layer, ink `rgba(17,27,33,0.045)` |
| their bubble | `#ffffff` | |
| **my bubble** | `#e7e5e4` (warm grey) | |
| bubble text | `#111b21` | |
| time / previews / meta | `#667781` | |
| read ticks | `#53bdeb` | blue kept on purpose (two blue ticks mean "read") |
| date chip, unread band, quick chips | bg `#ffffff`, text `#54656f` | |
| the rare centred notice, and "MDG sent it back" block | `#ffeecd` | |
| pressed row | `#f0f2f5` | selected message `rgba(24,24,27,0.08)`, search hit `#fff59d`, divider `#e9edef` |
| full-screen picture viewer | `#000000` | |
| success / warning / danger / info | `#16a34a`/`#dcfce7`; `#d97706`/`#fef3c7` (strong `#92400e`); `#dc2626`/`#fee2e2`; `#2563eb`/`#dbeafe` | used by the staff screens ("100 पूरे", "छुट्टी पर") |
| theme-color meta | `#0f172a` | not visible in app |

Radii: sm 4, md 8 (bubbles, `rounded-md`), lg 12 (ask buttons), composer pill `rounded-3xl` (24), staff cards `rounded-2xl` (16). Bubble shadow `0 1px 0.5px rgba(11,20,26,0.13)`.

### 2.2 Type

System stack, **zero webfonts**: on the target Android phones that is Roboto for Latin and the device's Noto Sans Devanagari for Hindi (the Play captures were taken on macOS Chrome so they look SF-like). The demo videos used Inter + Noto Sans Devanagari: acceptable stand-in. Headings letter-spacing -0.01em. Hindi default, all Hindi UI words are pump-speak loanwords (डिप, रिपोर्ट, पॉइंट, चैट, फ़ोटो).

| Element | Size / weight |
|---|---|
| Home title ("Dealer Kavach" / "डीलर कवच") | 22 semibold, tight, `#18181b` |
| Top bar height | 56 (h-14), border-bottom `#e9edef` |
| Thread title / subtitle | 17 medium / 13 meta |
| Chat row (72px high): title / time / preview | 16 medium / 12 (unread: medium, black) / 14 meta, one line, truncated |
| Filter chips (All, Unread, Groups) | 14 medium, 32px high, pill, active = bg `#e7e5e4` with black text |
| Bubble body | 15 / line-height 1.35; time inside bubble 11 |
| Group sender name | 13 medium, colour `hsl(<hash of user id> 55% 40%)` |
| Date chip | 12.5 on white pill, radius 8 |
| Quote block in reply | 13 (name medium black, text meta) on `rgba(0,0,0,0.06)` with 4px black left bar |
| Settings rows | title 16, subtitle 14 meta, icon 24 stroke 1.75 `#54656f`, min-height 64 |

### 2.3 Chat anatomy

- **Chat list (home).** Bar: title left, search icon (22) and three-dot menu on the right. Under the bar: chips `All / Unread / Groups` (Hindi `सभी / बिना पढ़े / ग्रुप`); Groups chip appears only if a group thread exists. Rows 72px: 48px avatar (support = `#e7e5e4` circle with the logo ring 32px in `#18181b`; manager group = `#f0f2f5` circle with a two-people outline icon in `#54656f`), divider starts after the avatar. Unread = black count pill (20px, white 12 medium) and the time turns black/medium. Time format `9:05 am` (always am/pm, even in Hindi); older: `Yesterday/कल`, weekday, then `dd/mm/yy`.
- **Titles.** Support thread: `Support / सहायता`, subtitle `MDG team / MDG टीम`. Group: `Manager chat / मैनेजर चैट`, subtitle = the other members' names; "typing…" replaces the subtitle (`typing… / लिख रहे हैं…`).
- **Thread.** Wallpaper `#f3f2f0` with the tiled doodle (84px tile, 1.6px strokes: small circle, an X, a wavy line, a triangle, a rounded square, a short arc). Centred date chips `Today/आज`, `Yesterday/कल`. Unread band: `1 unread message/1 नया संदेश`, `{n} unread messages/{n} नए संदेश`. First bubble of a run has the small tail (8x10 wedge, top corner; left for theirs, right for mine). Bubbles max 80% wide; picture or ask bubbles `min(80%, 330px)`; time bottom-right inside the bubble; on a bare picture the time sits on the picture over a bottom black gradient (`from-black/45`), in white.
- **Ticks** (my messages only): clock while sending, one grey check sent, two grey delivered, two `#53bdeb` read.
- **Report as a picture.** A left bubble from MDG (sender label `MDG` in groups), one or two pictures with 3px padding, caption under, time bottom-right. Caption strings (exact, `services/dsr-report/share.ts`): `📊 DSR · 15 October — stock variation within limit.` / `📊 DSR · 15 अक्टूबर — स्टॉक वेरिएशन सीमा में है।`; over limit: `...stock variation over limit. Please check.` / `...सीमा से बाहर है, कृपया देखें।`; sales-only copy: `📊 DSR · {day} — दैनिक बिक्री।` / `Daily sales.`. Days are words ("15 October"), never raw dates.
- **Composer.** Sits on the wallpaper colour with no seam. White pill (min-height 48, radius 24, placeholder `Message / मैसेज`, paperclip 22 and camera 22 icons in `#54656f` at the right end) plus a separate 48px black circle outside it (mic when empty, send arrow when there is text). Above it, two quick-reply chips (white, 1px `#e9edef`, 14px): `Today's report? / आज की रिपोर्ट?` and `What do I need to do? / अब क्या करना है?`. Recording: hold the mic; `Slide to cancel / रद्द करने के लिए खिसकाएं`; lock icon; live waveform (22 bars) and mm:ss; `Release to cancel`. Limit ten minutes.
- **Voice note bubble.** Width `min(68vw, 264px)`, 36px play button, waveform, duration; while playing the avatar slot becomes a grey speed pill `1x / 1.5x / 2x` (`रफ़्तार`).
- **Reactions.** Six: thumbs-up, red heart, laughing, surprised, crying, folded hands. Chips hang half over the bubble's bottom edge, white pill; my own has a black border. Long-press opens a bar of the six above the message.
- **Reply.** Swipe right or menu. Quote block at the top of the bubble; a reply to a photo shows a 40px thumbnail on the right and a camera icon with `Photo/फोटो`.
- **Full-screen viewer.** Black. Top: back arrow, sender (`MDG`/`You`) 17 medium white, time 13 white/70, download icon, three-dot menu with `Show in chat / चैट में दिखाएं`. Pinch/double-tap zoom, **swipe left/right through every picture in the chat (oldest first, neighbours preloaded)**, swipe down to dismiss, tap toggles bars, caption bottom (15, 3 lines, expandable). Spinner on slow load; `This picture didn't open... / यह तस्वीर नहीं खुली...` with a retry button.
- **Settings** (three-dot menu on the chat list). White screen. Profile block (64px initials avatar, name 19 medium, role, phone or email), then one row per thing: `Account / खाता` ("Change your password / अपना पासवर्ड बदलें"), `Language / भाषा` (shows `हिंदी` or `English`), `Your team / आपकी टीम` (owner only: "Add or pause your manager / मैनेजर जोड़ें या रोकें"), `Your services / आपकी सेवाएं` (DO NOT RECREATE, rule 7), `Warriors & points / योद्धा और पॉइंट` (owner and manager: "Reward your warriors for their work / अपने योद्धाओं को उनके काम के लिए इनाम दें"), `Help / मदद` ("Learn the app with short videos / छोटे वीडियो से ऐप चलाना सीखिए", opens guide.mdgservices.in with `?lang=`), `Log out / लॉग आउट` in `#dc2626` with a confirm dialog `Log out? / लॉग आउट करें?`.
- **Sign-in.** Logo ring 48px, `Welcome back / फिर से स्वागत है`, `Sign in to chat with the MDG team. / MDG टीम से बात करने के लिए साइन इन करें।`, Email, Password, `Sign in / साइन इन करें`; footer `No login yet? Register your pump and the MDG team will send you your ID and password. / अभी लॉगिन नहीं है? अपना पंप रजिस्टर कीजिए, MDG टीम आपको ID और पासवर्ड भेज देगी।` and a `Register your pump / अपना पंप रजिस्टर करें` button. Never film a real password or the "temporary password" field being filled.
- **Slow network strings:** `Still loading — the connection is slow. / अभी लोड हो रहा है — नेटवर्क धीमा है।`; list failure `Your chats are safe. Check your connection and try again. / आपकी चैट सुरक्षित हैं। कनेक्शन जांचें और फिर कोशिश करें।`
- **Known gaps (do not imply otherwise):** no offline mode; photos sent in chat are not queued offline; no star/forward/delete; no emoji panel; no link previews.

### 2.4 Logo and brand assets

- **The mark:** black line art, three people held in an open hand inside an open ring (ring gap at the upper right). The wordmark: thin "MDG" above heavy "services" with the mark at left. Tagline **Fueling Success** (stays English even in Hindi copy; the site footer extends it: "Fueling Success. Your satisfaction fuels our energy.").
- **Vector for animation:** `mdg-client/src/components/BrandMark.tsx` holds the full traced outline as one even-odd path (`MARK_PATH`, viewBox `-11.5 0 1024 1024`, paints in `currentColor`). Ring, sleeve and finger gaps are holes, so a draw-on stroke animation needs a stroke version; a fill-reveal or mask wipe works directly. At 32px it needs a `+4` stroke to read; at 48px `+2`; above 64px none.
- **Rasters:** `mdg-app/assets/icon.png` (1024, black on white), `logo-source.png` (1536x1024), `mdg-demo/public/brand/{logo-mark,logo-mark-white,logo-full,logo-full-white}.png`, `marketing/panels/{icon-512,logo-full-white}.png`.
- **Wordmark lockups:** the product is **Dealer's कवच** (Latin plus Devanagari, कवच in Tiro Devanagari Hindi, gold on dark) in print and on the website; the app and Play call it **Dealer Kavach / डीलर कवच**. Company = **MDG Services**. Do not blanket-swap the two.
- **Legal footer name (when a card needs it):** VRUOOM PRIVATE LIMITED. Never "Vroom Drive India Private Limited". Not needed in a 30 s reel.
- **Google Play badge:** use Google's official badge artwork per Google's rules, or no badge. Do not redraw it. Android only; no App Store.
- **Website brand system** (`mdg-landing/tailwind.config.js`, pamphlet `style.css`): navy 700 `#2C2E80` (the "brand mark" colour), 800 `#222466`, 900 `#1A1B4B`, 950 `#101133`; gold 400 `#F5A524` (accent), 300 `#F8C24B`; paper `#FCFCFE`, ink `#15163A`, hairline `#E4E6F1`, ok `#12A87B`, risk `#D2544B`. Fonts: Space Grotesk (display), Inter, Noto Sans Devanagari, Tiro Devanagari Hindi (कवच marks only), Space Mono.

### 2.5 The palette decision

| Surface | Palette |
|---|---|
| Live app screens | `#18181b` black, `#e7e5e4` warm grey, `#f3f2f0` wallpaper, white |
| Website, pamphlet | navy `#2C2E80`/`#101133`, gold `#F5A524`, paper `#FCFCFE` |
| Kavach films, outro panel (Sep) | maroon `#6B1616`/`#4E0F0F`, amber `#E9A23B`, cream `#FDF7EE` |
| Play feature graphic (15 Oct) | near-black navy background, teal accent on "Kavach" |
| DSR/credit report pictures | maroon header, amber border, product bars (blue diesel, orange-brown petrol, slate premium) |

Recommendation: the phone screen inside every video is the live app, pixel-exact (black/grey). The video's own world (backgrounds, big type, end card) uses the website system: navy + gold, Space Grotesk numerals, Tiro Devanagari for कवच. The report pictures keep their own maroon/amber because that is the product. Do not reuse maroon as the video's brand colour: it would clash with the card and with the live app. If the founder wants continuity with the Sep films instead, say so (Q2).

### 2.6 Existing rendered samples, and how to render more safely

**Real captures of the live app (invented data), reuse these:**

| Path | What it shows |
|---|---|
| `mdg-app/store-assets/captures/01-chats.png` | Chat list: Support (9:05 am, 2 unread, last line the DSR caption) and Manager chat (8:52 am, 1 unread, "Nozzle 3 is working again."), All/Unread/Groups chips |
| `.../02-report.png` | Thread: two report pictures per day (variation + sales card), caption line, my "Thank you" with a folded-hands emoji and one grey tick, Yesterday/Today chips, quick chips, composer |
| `.../03-papers.png` | A sent licence photo with time on the picture, MDG's reply `Received — Weights & Measures licence` quoting the photo, an OPEN ask for "Fire NOC" with the black `Send photo` and white `Choose file` buttons, chips, composer |
| `.../04-staff-hi.png` | Warriors screen in Hindi: Today/This month toggle, Give points + Add warrior, 7 invented people with points 104.5 / 76 / 61.5 / 30.5 / 11.5 / 7 / 3.5, one "100 पूरे" chip |
| `mdg-app/store-assets/screenshots/screenshot-01..04-*.png` | the same four inside a phone frame, 1080x1920 |
| `.../feature-graphic.png` | Play feature graphic 1024x500 |
| `mdg-app/store-assets/capture/demo/dsr-2026-10-{14,15}-{sales,variation}.png`, `licence-photo.jpg` | the invented report cards and a 1280x960 "SPECIMEN" Weights & Measures licence (invented number, sample seal) |

Visible defects in the real captures that you should NOT reproduce literally: Hindi initials avatar shows "दव" for "दीपक वर्मा" (it takes the first letter of each word, so matras make odd pairs); "योद्धा जोड़ें" wraps to two lines in its narrow button. Recreate cleanly (one initial, one-line button) or say so.

**Other reference renders:** `mdg-demo/src/screens/{StaffScreen,GivePointsSheet,PendingSubmission,FinalizeSheet}.tsx` are good pixel references for the warriors flow (last real update July; they lack the 16 Jul "छुट्टी" leave chip and the new top bar). `mdg-demo/site/public/media/<id>/{poster,thumb,og}` are frames of the guide videos. The public guide's course videos use an iPhone frame (the app is Android).

**How to render a new state safely (no prod, no creds):** the stack at `mdg-app/store-assets/capture/` is built for it.
1. `./stack.sh up` starts in-memory Mongo (27099), a stand-in file store (9100), the API (4100) and a production build of the client (5198). Every outside service is switched off (scheduler, push, assistant, first line, WhatsApp, SDMS/IRAS, Vertex, ElevenLabs). It proves it is local by reading the API's environment (`MONGODB_URI=mongodb://127.0.0.1:27099/dk_local`, `AWS_ENDPOINT_URL_S3=http://localhost:9100`) and refuses otherwise. `mdg-backend/.env` and the laptop shell point at PRODUCTION; only this script's overrides make it safe. Never run seed or capture against anything else (both refuse any DB but the local one).
2. `node pictures.mjs`, `node seed.mjs` (fictional outlet "99Z", owner "Prakash", manager "Mahesh", seven invented staff), `node capture.mjs`. Logins are test-only values in `seed.mjs`; do not repeat them anywhere public.
3. **`capture.mjs` writes into `store-assets/captures/` and overwrites the Play assets.** Set `RAW_DIR=<scratch dir>` to write elsewhere.
4. Viewport 390x811 CSS px at 3x (the WebView area), headless Chrome via Playwright (`channel: 'chrome'`).
5. First-line replies are OFF in that stack (`AI_FIRSTLINE_ENABLED=false`), so any reply, `Instant reply` footnote or ticket line must be seeded as messages by hand in `seed.mjs` (or drawn in HTML). The ask flow (ask, photo reply, "Received", sent-back) works through the real API.
6. The Play review demo outlet ("DEMO") exists in production with published review credentials. Do not log into it for footage.
7. A faster route for hero shots is HTML built from the section 2.1-2.3 tokens (what the Sep film kit did, in the wrong colours).

---

## 3. Feature cards

Slugs: `one-chat`, `report-picture`, `talk-dont-type`, `send-photo-ask`, `first-reply`, `warriors-points`, `owner-manager`, `hindi-english-2g`, `video-guide`, `support-9-to-9`, `front-door`. Cards F01-F11. Human lines and anthem follow in sections 4-5.

Cross-reference: the DSR card, credit card, ledger card, Kavach card, load plan and tanker density are other researchers' topics. I only describe how they arrive.

---

### F01 · One chat is the whole app — `one-chat`

1. **Name.** "Dealer Kavach" chat list and thread / `डीलर कवच` चैट.
2. **Status.** Live, dealer-facing: yes. Shipped 13 Oct (ADR 0018; root dcc1cd6, client 9370d36, backend 15b8da3); on Google Play since 22 Sep (package `in.mdgservices.dealerkavach`, Android only). Prod migration of old "Reports" into chat done 13 Oct.
3. **What the dealer receives.** An app that opens on a chat list. An owner has two chats: his private `Support / सहायता` thread and (if there is a manager) the `Manager chat / मैनेजर चैट` group that the manager and every owner can read. A manager has only the group. Chats are never started by the dealer (already open). Reports, asks, daily lines, replies all arrive as ordinary messages. No tab bar.
4. **Visual anatomy.** Section 2.3. States to show: normal, unread (count pill + black bold time), searching (bar turns into a field with back arrow and clear X), empty ("No chats yet / अभी कोई चैट नहीं"; shown only if the list could not load, the server guarantees every member a thread), failed ("We couldn't load your chats / अभी आपकी चैट लोड नहीं हो पाईं" with a "Try again / फिर कोशिश करें" button), slow ("Still loading..."). Source files: `ChatListPage.tsx`, `AppBar.tsx`, `ChatPage.tsx`, `MessageList.tsx`, `MessageBubble.tsx`, `Composer.tsx`, `conversationLabel.ts`.
5. **Illustrative figures.** Reuse the capture's: Support 9:05 am with 2 unread, Manager chat 8:52 am with 1 unread; DSR figures from the fact file (opening 12,480 + receipt 6,000 = 18,480; dip 160; stock 14,246; 18,480 - 14,246 = 4,234 gross, less 12 testing = 4,222 sold).
6. **Pain.** He is frustrated by menus, logins, jargon and English-heavy screens, abandons at the first confusion, and above all does not want to feel stupid (fact file §2). The app answers with one familiar screen.
   **Hooks (first 1.5 s):**
   - [visual contradiction] A grid of many app icons and a tab bar collapses into one chat row. Text: `कोई मेन्यू नहीं। बस चैट।` / `No menus. Just a chat.`
   - [question] `आपकी रिपोर्ट कहाँ आती है?` / `Where does your report reach you?` (answer card: `इसी चैट में।` / `Right here.`)
   - [fear] `चलाना नहीं आता? यह स्क्रीन तो आप रोज़ देखते हैं।` / `Can't work it? You already know this screen.`
7. **Outcome line.** `रिपोर्ट, काग़ज़ और टीम — एक ही चैट में।` / `Reports, papers and your team, in one chat.` (matches the published Play feature-graphic line "Reports, papers and your team — in one chat").
8. **Safe / forbidden.**
   - Safe: "one chat", "looks like the chat you already use", Hindi and English, Android, Google Play. The Play short description is approved public copy: "Daily reports, papers and team chat for petrol pump dealers, in one chat" (72 chars).
   - Forbidden / traps: the word "WhatsApp" as a product claim (README: WhatsApp is the one allowed everyday word, but do not imply integration or delivery over it); "free"; "online" status dot; the "DK" chip; maroon header; the Settings "Your services" screen; `app`, `software`, `system`, `digital`, `dashboard` in spoken lines.
9. **Potential 8/10.** Motion moment: the tab bar and icon grid slide away and leave one row; the unread pill counts 0 to 2 as a picture drops in.

---

### F02 · A report is a picture, and a tap opens it full-screen — `report-picture`

1. **Name.** "Report as a picture / रिपोर्ट, तस्वीर बनकर". (Viewer is part of F01; carded separately because it is a strong 30 s idea.)
2. **Status.** Live, dealer-facing: yes. Reports reach the chat as ordinary picture messages written as MDG (`system:true`, drawn as a normal incoming bubble). A person at MDG checks each report before it is sent (fact file §5). Credit & DOD and Ledger Watch cards go to owners only; the DSR's stock-variation sheet is owner-only by a saved per-outlet rule, the sales sheet can go to owner and manager (16 Oct, backend 7c4d878).
3. **Receives.** Left-hand bubble with one or two pictures and one caption line (strings in 2.3), time on the bubble, optional reactions. Tap: black full-screen viewer, swipe to the previous/next picture in the chat, pinch to zoom, download icon.
4. **Anatomy.** 2.3 (bubble, viewer). DSR picture content belongs to the DSR card researcher (two phone-sized pictures: the sheet and the stock check).
5. **Figures.** As F01.
6. **Pain / hooks.** Pain 1 in the fact file: the late night, half past eleven, one figure out and the whole page again. He copies rows into his own register and anyone at the pump can do it.
   - [fear/time] `रात के साढ़े ग्यारह। रिपोर्ट अब भी नहीं मिल रही।` / `11:30 pm. The report still won't tally.`
   - [number] `4,222 लीटर। कल की बिक्री — एक नज़र में।` / `4,222 L sold yesterday, at a glance.`
   - [contradiction] His paper register page flips to the phone picture: same rows. `वही रजिस्टर। कोई जोड़-घटाव नहीं।` / `Same register. No sums.`
7. **Outcome line.** `आपकी रिपोर्ट, आपके रजिस्टर के हिसाब से — तस्वीर बनकर।` / `Your report, in your register's own format, as a picture.` (adapted from the pamphlet's published line)
8. **Safe / forbidden.**
   - Safe: "arrives in your chat as a picture", "anyone at the pump can copy it", "a person at MDG checks before it is sent" (fact file §5/§6; use lightly), "tap to open, swipe to the day before, zoom".
   - Forbidden: "on WhatsApp", "every morning at 6:00/6:30" or any time promise; showing or naming a real outlet code (the real card in `refs/product/` is real; the captured cards print the invented "99Z"; blank or keep "99Z", decide); oil-company product names inside cards (a real card prints "XTRAPREMIUM" in a product bar; use petrol/diesel only); "reconciled", "audited", "guaranteed".
9. **Potential 8/10.** Motion moment: pinch-zoom into the SALES cell, then a swipe to the previous day with the picture sliding like a page.

---

### F03 · Say it, don't type it: voice notes, replies, reactions, search — `talk-dont-type`

1. **Name.** `वॉइस मैसेज, जवाब, रिएक्शन, खोज`.
2. **Status.** Live, dealer-facing: yes. Voice notes have a long fix history (four rounds; structural rebuild 12 Sep, client live; the native shell needed a rebuild, status on dealers' phones **UNVERIFIED**). Treat as a 3-second beat inside F01, not a standalone.
3. **Receives/does.** Hold the mic to record, slide left to cancel, slide up to lock, ten-minute limit, waveform; photos (camera icon, gallery, multiple with a caption screen "Add a caption… / कैप्शन लिखें…", up to a stated limit); documents; swipe-right reply; long-press for six reactions; copy; message info (delivered/read); in-chat search (type 2 letters, up/down through hits, hits highlighted `#fff59d`); media/docs/links gallery ("Media, links and docs / मीडिया, लिंक और दस्तावेज़").
4. **Anatomy.** 2.3. Mic problems have their own honest messages ("Can't access the microphone / माइक्रोफ़ोन एक्सेस नहीं हो पा रहा" and four more); do not film them.
5. **Figures.** A 0:11 note; a hand-folded reaction under a report; search "2 letters" with "3 of 12".
6. **Pain / hooks.** Typing Hindi on a small keyboard is a nuisance (the code says so about the quick chips).
   - [question] `हिंदी टाइप करना मुश्किल लगता है? बोलकर भेजिए।` / `Typing Hindi hard? Just say it.`
   - [number] `दस मिनट तक बोलिए।` / `Up to ten minutes.`
   - [contradiction] A folded-hands reaction lands on a report picture. `एक उँगली में जवाब।` / `One tap to answer.`
7. **Outcome line.** `बोलिए, भेजिए — टाइप करने की ज़रूरत नहीं।` / `Say it and send it. No typing needed.`
8. **Safe / forbidden.** Safe: voice notes, photos, reply, six reactions, search by words. Forbidden: any claim that voice notes are transcribed or understood (they are recorded audio; a voice note raises a numbered follow-up and a line, ADR 0017); "works on every phone"; mic-error screens; the word "AI".
9. **Potential 6/10.** Motion moment: hold-slide-lock gesture with the waveform bars growing, then the note landing as a bubble.

---

### F04 · MDG asks, you send a photo — `send-photo-ask`

1. **Name.** `MDG ने माँगा, आपने फ़ोटो भेजी` / "Send photo". (Ask messages, ADR 0019.)
2. **Status.** Live since 13 Oct 07:45 IST, dealer-facing: yes. Kinds: a paper or renewal (`doc:<id>`), the density register page for yesterday (`reg:<date>`, only for outlets with the TT Density service, asked each morning at 9:00), a Kavach task photo (`kv:<id>`).
3. **What the dealer receives and does.**
   - MDG posts a message in the chat. Inset light block with the title (and day), then two short lines, then a full-width black `Send photo / फ़ोटो भेजें` button (44px, radius 12, camera icon) and a white `Choose file / फ़ाइल चुनें` (papers; a photo or PDF) or `Choose from gallery / गैलरी से चुनें` (photo-only asks).
   - Exact message text (one language per reader, built in `services/chatAsks/text.ts`): `MDG needs this from you: Fire NOC.` newline `Tap “Send photo” below, or choose a file.` Hindi: `MDG को यह चाहिए: फायर एनओसी।` newline `नीचे “फ़ोटो भेजें” दबाइए, या फ़ाइल चुनिए।` Photo-only ask drops "or choose a file". Kavach photo: `MDG needs a photo for: {task}.` / `MDG को इसकी फ़ोटो चाहिए: {task}।` Density page: title `Density register page / डेंसिटी रजिस्टर का पन्ना` with day `(12 Oct) / (12 अक्टूबर)`.
   - He taps; camera opens inside the tap; a full-screen preview with a caption box; he sends. The photo goes back as a reply quoting the ask.
   - State line under the ask, replaces the buttons: `Sent — MDG is checking / भेज दिया — MDG टीम देख रही है` (clock icon, grey 13) then `Received / मिल गया` (check, black medium). MDG also posts a message: `✓ Received — Fire NOC (12 Oct)` / `✓ मिल गया — फायर एनओसी (12 अक्टूबर)`.
   - If MDG sends it back: the ask reopens with a `#ffeecd` block `MDG sent it back: {reason} / MDG ने वापस भेजा है: {reason}` and a message `↩ Please send this again — Fire NOC. {reason}` / `↩ फिर से भेजिए — ...`.
   - A second photo for something MDG already holds: `MDG already has one for this and is checking it. / यह पहले से MDG के पास है — जाँच हो रही है।`
   - Wrong file type: `We could not open that file. Please send a photo or PDF. / यह फ़ाइल हम नहीं खोल पाए। कृपया फ़ोटो या PDF भेजिए।`
   - Expiry reminders as messages: `Fire NOC: 3 days left. Please send the new one.` / `फायर एनओसी — 3 दिन बाकी। नया वाला भेज दीजिए।`; `Reminder — we are still waiting for: ...` / `याद दिला रहे हैं — अभी तक नहीं मिला: ...`. Default ladder 15/3/2/1 days before expiry; PESO licence 60/30/15/7/3/1; DTO trade licence and Weights & Measures licence 30/15/7/3/1. Count labels: `8 days left / 8 दिन बाकी`, `Expires today / आज ख़त्म`, `Expired 3 days ago / 3 दिन पहले ख़त्म`. Never a raw date, never "yesterday".
   - Who marks it received: the density register page automatically on arrival; a paper or a Kavach photo by **a person at MDG, never the dealer**. There is deliberately no "mark done" button.
4. **Anatomy.** Bubble width `min(80%, 330px)`; light inset `#f0f2f5` with title 14 medium and day 13 meta; body 15; the black button `#18181b` white 15 medium; second button white with 1px `#e9edef`; state lines 13. List preview of an ask reads `📷 Fire NOC (12 Oct)`. Source: `MessageBubble.tsx` (`AskFooter`), `askView.ts`, `services/chatAsks/{text,titles,morning}.ts`, `shared/src/types/chatAsk.ts`, `shared/src/data/documentKinds.ts`.
5. **Figures.** Use the capture's timeline: ask at 8:30 am, photo at 10:18 am, MDG "Received" at 10:41 am. Fire NOC ladder: 3 days left. Paper names from the catalog: Fire NOC / फायर एनओसी; Weights & Measures licence / नाप-तौल लाइसेंस; Explosive (PESO) licence / विस्फोटक (PESO) लाइसेंस; DTO trade licence / DTO ट्रेड लाइसेंस; Density register page.
6. **Pain.** Pain 2 and 5 in the fact file: the date that went past; the gate. A renewal expired and nobody remembered; and "doing a mock drill is not enough, if it is not filed, it did not happen" (safe line, fact file §3).
   - [number] `फायर एनओसी — 3 दिन बाकी।` / `Fire NOC: 3 days left.`
   - [question] `आपके फायर एनओसी की आख़िरी तारीख़ याद है?` / `Do you know the day your Fire NOC runs out?`
   - [fear word] `तारीख़ निकल गई। फिर नोटिस।` / `The date passed. Then the notice.` (do not add what the oil company does)
7. **Outcome line.** `MDG चैट में माँगता है, आप फ़ोटो भेजते हैं — बस।` / `MDG asks in the chat. You send a photo. That's it.`
8. **Safe / forbidden.**
   - Safe: everything above as dealer-seen UI; "Received" (never "verified", "approved", "certified": ADR 0011); the mock-drill observable: miss it and the next fuel order can be held.
   - Forbidden: the admin "Mark received" / "Send back" dialogs; any claim MDG "checks authenticity"; promising how fast MDG marks it; "your documents are encrypted / stored securely" (privacy promise is only "encrypted in transit"); real licence images (use invented sample documents with no real emblem or number; the capture's "SPECIMEN" W&M licence is already built); oil-company stamps; consequences of an expired paper beyond the mock drill.
9. **Potential 9/10, the flagship of this topic.** Motion moment: the black Send-photo button is pressed, shrinks into a photo bubble in the thread, and the state line under the ask morphs button, then `Sent — MDG is checking` with a clock, then `Received` with a check that draws on, as MDG's `✓ Received` message lands. One continuous state machine.

---

### F05 · A first reply right away, and a number you can follow — `first-reply`

1. **Name.** `तुरंत जवाब` ("Instant reply") and `#N · MDG टीम देख रही है`. Slug `first-reply`.
2. **Status.** Live for every dealer since Sep; tickets live since 12 Oct (ADR 0017). **Founder decision needed before any script (Q1).** Dealer-facing: yes.
3. **What he sees.**
   - He types or taps a chip (`Today's report? / आज की रिपोर्ट?`, `What do I need to do? / अब क्या करना है?`). A reply appears as a normal MDG bubble. When written by the first line it carries a footnote left of the time: lightning icon + `Instant reply / तुरंत जवाब` (not on a handoff).
   - Illustrative live-style replies (the engine writes its own short pump-speak prose; the fallback templates are in `assist/firstline/templates.ts`):
     `15 अक्टूबर की रिपोर्ट बन गई है, MDG में एक बार देखी जा रही है। जाँच के बाद यहीं भेज दी जाएगी।` / `The report for 15 October is ready and MDG is checking it. It comes to you here once that is done.`
     `15 अक्टूबर की रोज़ की बिक्री रिपोर्ट भेज दी गई है — इसी चैट में ऊपर मिलेगी।` / `The Daily Sales Report for 15 October has been sent. It's above in this chat.`
     Handoff: `यह मैं ख़ुद नहीं देख पाया। MDG की टीम को भेज दिया है — कोई देखकर यहीं जवाब देगा।` / `I couldn't check this one myself. I've passed it to the MDG team — someone will look and reply right here.`
   - Under his own question bubble, one quiet 11px grey line, no button: `#42 · Sent to the MDG team / MDG टीम को भेजा गया`, then `#42 · MDG team is looking at it / MDG टीम देख रही है`, then `#42 · Closed by the MDG team / MDG टीम ने बंद किया`. Only a person closes it, with a written reply in the thread. One open number per thread.
   - Replies are one language (the reader's), stay one line in the chat list, never use figures not looked up for that outlet, and in a manager group the first line stays silent unless the message is for MDG.
4. **Anatomy.** Bubble as 2.3; footnote 11px `#667781`; ticket line 11px `#667781` under the bubble (not green, not a control). Files: `MessageBubble.tsx`, `ticketLine.ts`, `shared/src/lib/ticketView.ts`, `assist/firstline/*`.
5. **Figures.** Ticket `#42` (invented); report date 15 Oct.
6. **Pain / hooks.** A question that disappears is worse than a slow answer; he fears being handed something he cannot ask about.
   - [fear] `भेजा तो था — किसी ने देखा?` / `You sent it. Did anyone see it?`
   - [number] `#42 — आपके सवाल का अपना नंबर।` / `#42: your question's own number.`
   - [question] `सवाल का जवाब कहाँ आएगा?` / `Where does the answer come?` (answer: the same chat)
7. **Outcome line.** `पहला जवाब यहीं, बाक़ी का पीछा टीम करती है।` / `A first answer right here; the team follows up the rest.` (outcome only; no speed promise)
8. **Safe / forbidden.**
   - Safe: the exact UI strings above; "a person at MDG closes every number"; "the MDG team answers your messages here" (the app's own line).
   - Forbidden: **"AI", "bot", "assistant", "automatic", "smart", "model", "instant answers 24x7"**; "a real person replies first / every message is read by a person"; any reply-time promise (internal 20/90/180-minute flags are not promises and no grievance officer or reply time exists); the word "ticket" on screen (PRD principle: dealers see a conversation, a number and a quiet line); "Talk to a person" button (removed); admin Tickets, Today board, alerts; the old v1 "pick from fixed sentences" description.
9. **Potential 6/10.** Motion moment: the grey line under his question morphs through the three states with the number steady. Risk: any narration invites "who is answering?". Visual-only is safest.

---

### F06 · Warriors and points — `warriors-points`

1. **Name.** `योद्धा और पॉइंट` / "Warriors & points".
2. **Status.** Live, dealer-facing: yes, but only for **owner and manager**. Warriors (anyone who works at the pump) have **no login and never open the app**. Draft then Final submit with a hardcopy photo shipped 8 Jul; leave marking and kitchen/tanker works 16 Jul; spec `docs/specs/staff-points.md`, ADR 0007.
3. **What the dealer does.**
   - Staff page: `Today / आज` and `This month / इस महीने` toggle; black full-width `+ Give points / + पॉइंट दें`; outline `Add warrior / योद्धा जोड़ें`; legend `Each warrior aims for 100 points / हर योद्धा को 100 पॉइंट चाहिए`; cards sorted by points, each with initials avatar (44), name (14 semibold), role (12 muted), big points (24 bold) over `points / पॉइंट`, pencil icon; chips: `Reached 100 / 100 पूरे` (green `#dcfce7`/`#16a34a`), `On leave / छुट्टी पर` and `{n} days leave / {n} दिन छुट्टी` (amber `#fef3c7`/`#d97706`).
   - Give points (bottom sheet, rounded top 16, max-height 88%): step 1 `Who did the work? / काम किसने किया?` (pick people); step 2 `What did they do? / उन्होंने क्या किया?` (search `Search work… / काम खोजें…`, jobs grouped under small uppercase headings, each row ends with a points chip); step 3 `Confirm / पक्का करें` (day, how many with minus/plus, `Shared among the warriors / सबके बीच बँटेगा` or `Each warrior gets it / हर योद्धा को मिलेगा`, `Total {points} / कुल {points}`); `Continue / आगे बढ़ें`, `Add to submission / सूची में जोड़ें`.
   - Pending panel (brand-tinted border): `Pending submission / जमा करना बाकी`, `Review the work, then submit with a hardcopy photo. / काम जाँच लें, फिर हार्डकॉपी फोटो के साथ जमा करें।`, draft autosave pill (`Saving… / सेव हो रहा है…`, `Saved / सेव हो गया`, `Offline — will sync / ऑफलाइन — बाद में सिंक होगा`), line items with minus/plus, `Final submit · {points} / फ़ाइनल जमा करें · {points}`.
   - Final submit sheet: `Submit points / पॉइंट जमा करें`; `Hardcopy photo / हार्डकॉपी फोटो` with `Take a photo of the paper record at the pump so hard and soft copies match. / पंप पर रखे कागज़ी रिकॉर्ड की फोटो लें ताकि हार्ड और सॉफ्ट कॉपी मेल खाएं।`; `Take photo / फोटो खींचें`, `Choose photo / फोटो चुनें`; button `Submit {points} points / {points} पॉइंट जमा करें`; toast `{points} points submitted / {points} पॉइंट जमा हो गए`. Past submissions: date, `{points} points · {workers} warriors`, `View hardcopy / हार्डकॉपी देखें`.
   - The catalog: **85 named jobs in 11 groups**, group names (`Cleaning / सफ़ाई`, `Dispensing units / मशीन (DU)`, `Equipment / उपकरण`, `Automation / ऑटोमेशन`, `Tanker / टैंकर`, `Mobile dispenser / मोबाइल डिस्पेंसर`, `Sales / बिक्री`, `Office / ऑफिस`, `Customer / ग्राहक`, `Kitchen / रसोई`, `Other / अन्य`). Each job has a worked-out value from time, skill, effort and responsibility (the same four words the public guide video "How points are decided" uses). Four jobs count only if done before 10 am. Jobs have a distribution: shared among doers, each gets all, per unit, or flat. "Other ..." jobs need a written line of what was done.
4. **Anatomy.** These screens use the non-chat tokens: `#fafaf9` page, white cards with 1px `#e7e5e4` border and radius 16, brand-black primary button, tabular numerals. Files: `StaffPage.tsx`, `features/staff/{GivePointsFlow,PendingSubmissionPanel,FinalizeSubmitSheet,EditWorkerDialog,AddEmployeeForm}.tsx`, `lib/staff.ts`, `shared/src/data/staffWorkCatalog.ts`. Reference mocks: `mdg-demo/src/screens/*` (July) and the real capture `04-staff-hi.png`.
5. **Invented consistent figures.**
   - Roster from the capture (Hindi names are invented; use first names only if you re-seed): दीपक वर्मा (पंप अटेंडेंट) 104.5, मनोज राणा (कैशियर) 76, सुनील चौहान 61.5, अजय तोमर 30.5, विकास पाल 11.5, नरेश पटेल 7, कमल नेगी 3.5. Team total 294.5 (104.5+76+61.5+30.5+11.5+7+3.5).
   - One day that lands on exactly 100.0 (catalog values): Write account book 18 + Deposit cash in bank 19 + Fill DSR book 6 + Fill density book 6.5 + Update stock board 2.5 + Fill toilet inspection sheet 2.5 + Tanker paperwork 9.5 + Take tanker density 4 + Take tanker dip (water + product) 6 + Tanker safety check 5.5 + Crocodile clip on/off 3 + Fencing chain on/off 2.5 + Electric work 15 = **100**. (Running total 18, 37, 43, 49.5, 52, 54.5, 64, 68, 74, 79.5, 82.5, 85, 100.) Unrealistic for one person; split across two names for narrative if needed.
   - The three books by ten: DSR 6 + density 6.5 + stock board 2.5 = 15, with the toilet sheet 17.5 (all four are "before 10 am" jobs, the guide has an explainer "three books by ten").
   - Shared job: Clean the toilets 17 shared by two warriors = 8.5 each.
6. **Pain (inferred, not in the fact file) / hooks.** The staff who do the quiet work are not counted; the owner has no fair, written way to reward them.
   - [number] `100 पॉइंट — हर योद्धा का रोज़ का लक्ष्य।` / `100 points: each warrior's daily target.`
   - [question] `आज पंप पर सबसे ज़्यादा काम किसने किया?` / `Who did the most work at your pump today?`
   - [contradiction] The paper register on the counter flips to the phone photo, matching: `काग़ज़ वही। फ़ोटो से मिलान।` / `Same paper. Photo to match.`
7. **Outcome line.** `जिसने काम किया, उसका हिसाब रहता है।` / `Whoever did the work gets counted.`
8. **Safe / forbidden.**
   - Safe: roster, jobs, points, 100 a day target, final submit with a photo of the paper record, warriors do not log in.
   - Forbidden: any rupee value for points, bonus/salary/prize promises (none exist in code; **UNVERIFIED whether owners tie pay to it**); a leaderboard of real staff or a real person's name; job rows that carry oil-company product names (Sell HSD / XTRA GREEN, Sell MS / XP-95, Display/Sell Servo mobil; use neutral jobs); the 503.5 total; the scoring factors per job; "AI scores the work"; "warriors open the app".
9. **Potential 8/10.** Motion moment: job chips (+6, +6.5, +2.5, +2.5...) fly into a daily bar that fills to 100 and a green `100 पूरे` chip pops; then the camera frames the paper register and the sheet closes on `{points} पॉइंट जमा हो गए`.

---

### F07 · Owner and manager: who sees what — `owner-manager`

1. **Name.** `मालिक और मैनेजर` / "Your team".
2. **Status.** Live, dealer-facing: yes.
3. **What exists.** Roles at the dealer: **Owner** (`Owner / मालिक`, everything incl. adding and suspending the manager) and **Manager** (`Manager / मैनेजर`, everything except the team). Admin (MDG) is separate and never shown. Warriors have no login. One manager per pump (a second is refused: `Your pump already has a manager. Pause them first, or ask the MDG team. / आपके पंप पर पहले से मैनेजर है। पहले उन्हें रोकें, या MDG टीम से कहें।`). An owner can invite a manager for his own outlet; he cannot touch a co-owner. Settings > `Your team / आपकी टीम`: heading `Team / टीम`, member rows with a role chip, a green or amber status dot, `Suspend / रोकें` or `Activate / चालू करें`, an `Invite / जोड़ें` form (name, email, temporary password; never film it).
   Who receives what (set by MDG when sharing, **not by a dealer toggle**): each owner gets a copy in his own chat; the manager gets the group chat; Credit & DOD and Ledger Watch cards go to **owners only**; the DSR sales sheet can go to owner and manager while the stock-variation sheet is owner-only; if a manager asks about an owners-only sheet he gets one line: it goes to the owner.
4. **Anatomy.** Settings row and Team card in the staff-page card style (2.3); group chat title and member subtitle; sender names coloured per person inside the group.
5. **Figures.** Two phones, one report picture duplicated to both; credit card on the owner's phone only with a small lock.
6. **Pain / hooks.** The fact file's most valuable idea: the work can be done by his manager without him. His fear: handing over control of things he holds personally.
   - [contradiction] One report picture splits onto two phones. `एक रिपोर्ट, दो फ़ोन।` / `One report. Two phones.`
   - [question] `मैनेजर को क्या दिखे, और क्या सिर्फ़ आपको?` / `What should your manager see, and what only you?`
   - [number] `आपके फ़ोन में दो चैट: सहायता और मैनेजर चैट।` / `Two chats on your phone: Support and Manager chat.`
7. **Outcome line.** `हर किसी को वही दिखता है जो उसके काम का है।` / `Everyone sees what belongs to them.`
8. **Safe / forbidden.** Safe: the roles above, group chat that owners can open, owners-only credit card. Forbidden: "you decide who sees what" (MDG decides the audience at send, per the founder's 16 Oct rule; whether the owner can ask is **UNVERIFIED**); any figure from the credit or variation sheets shown on a manager's phone; suspend/permissions language beyond "add or pause your manager".
9. **Potential 5/10.** Motion moment: one picture duplicates to two phones, the credit card stays on one phone and a lock closes on the other.

---

### F08 · Hindi and English, on a cheap phone — `hindi-english-2g`

1. **Name.** `हिंदी + English, हर बटन` / "Hindi and English, built for a cheap phone".
2. **Status.** Live. Hindi default. Every key has both languages (a missing translation is a build failure; ADR 0008).
3. **What is true.** Settings > `Language / भाषा` > a small sheet with `हिंदी` and `English`, one tap. The account remembers it; an explicit pick on a device is never overridden. Notices are one language per reader. Hindi uses the dealer's own words (`बिना पढ़े` for unread, not the textbook word). Cheap phone: system fonts only (no webfont download), route-level code splitting, a "still loading" line, failure screens that keep the chat safe, photos shrunk before upload, the video guide opens on 2G. **No offline mode.**
4. **Anatomy.** Language sheet; chat list in both languages side by side; the 2G message.
5. **Figures.** Two languages. (Do not state KB sizes: login chunk was ~103 KB gz in July, unmeasured since.)
6. **Pain / hooks.**
   - [contradiction] The same chat list flips between English and Hindi in place, layout unchanged. `अंग्रेज़ी में बटन? यहाँ नहीं।` / `English-only buttons? Not here.`
   - [number] `2 भाषाएँ। हर बटन, हर मैसेज।` / `2 languages. Every button, every message.`
   - [fear] `फ़ोन पुराना है? नेटवर्क कमज़ोर?` / `Old phone? Weak network?` then the "still loading" strip resolving into the screen.
7. **Outcome line.** `हिंदी या English — एक टैप में बदलिए।` / `Hindi or English, one tap.` (the Play listing says "Switch with one tap")
8. **Safe / forbidden.** Safe: "full English and full Hindi", "built for low-cost Android phones and slow 2G networks" (Play listing, checked 15 Oct). Forbidden: "works offline", "eight languages" (that is the founder-ruled claim for two films only, not the app), voice in Hindi, KB or speed numbers, "any phone".
9. **Potential 6/10.** Motion moment: every word on the chat list flips language in the same instant, rows not moving a pixel; then a 2G signal icon with the slow strip resolving.

---

### F09 · The video guide — `video-guide`

1. **Name.** `सीखें` (guide.mdgservices.in), opened from Settings > `Help / मदद`.
2. **Status.** Live, public, no login, bilingual. **66 videos** as of 17 Oct (counts will drift; say "60 से ज़्यादा" / "over 60"). Dealer course 8 videos in a "भाग" order; 26 trade explainers each in Hindi and English (36-60 s); the marketing film; a labelled team section.
3. **What he sees.** Header: the **DK chip** (28px black rounded square, "DK" 11px bold white) + `Dealer Kavach`; title `सीखें`; tagline `छोटे-छोटे वीडियो — अपनी भाषा में, आराम से देखिए।`; language toggle; sections `डीलर के लिए` ("ऐप चलाना सीखिए — क्रम से देखिए।") and `पंप की जानकारी` ("पंप चलाने की बातें — ऐप से अलग। किसी को भी भेज सकते हैं।"); a ranked search (`क्या सीखना है? जैसे — फोटो, पॉइंट…`; romanised Hindi and old words work; chapter hits jump to the second); watch pages with chapters (`वीडियो में क्या-क्या है`), `Share`/`Copy link`, `फ़ोन में सेव करें` (`एक बार सेव कर लीजिए — फिर बिना इंटरनेट के भी देख सकते हैं।`), and a note `वीडियो तभी चलेगा जब आप दबाएँगे — तब तक डेटा नहीं लगेगा।` Video quality picks itself (240p/360p/720p), there is deliberately no quality picker.
4. **Anatomy.** Tokens mirror the app (`#fafaf9`, white cards radius 14, text `#0f172a`, accent teal `#0f766e` for "watched", ok green `#15803d`); one-column 720px max; system fonts. Portrait 1080x1920 videos with a phone mock and a burned-in Hindi caption line. Source: `mdg-demo/site/{content.mjs,src/styles.css,scripts/build.mjs}`; poster/thumb/og under `mdg-demo/site/public/media/<id>/`.
5. **Figures.** 36-60 s explainers; "over 60 videos"; two languages. Explainer topics (real): three-day credit clock, seven supply conditions, decantation, proving the meter with the slip, six declarations, a dip that has not settled, wall papers, stock variation, broken dip, water dip, density at 15, quarterly mock drill, shift close, testing litres, cost of a litre, invoice vs measured litres, over vs short, the cumulative column, three books by ten, staff rewards, water ingress, non-fuel ledger lines, inspection window, which day a tanker belongs to, electrical audit list, dispenser seals.
6. **Pain / hooks.** He does not learn from menus; he is embarrassed to ask.
   - [question] `डिप सेटल होने से पहले ले लिया तो क्या होगा?` / `Take the dip before it settles. What then?` (a real explainer)
   - [number] `60 सेकंड का वीडियो, फ़ॉर्म नहीं।` / `A 60-second video, not a form.`
   - [contradiction] A thumbnail grid with one tick appearing on each watched card.
7. **Outcome line.** `छोटे वीडियो, अपनी भाषा में।` / `Short videos, in your language.`
8. **Safe / forbidden.** Safe: explainers teach the trade, never an MDG screen; the "Share" to WhatsApp use is fine as a pointer. Forbidden: the `एडमिन के लिए` section and its 4 admin-portal videos (they ARE internal screens); "10 videos, 25 minutes, 112 chapters" (website training band, contradicted); "the full film is 26 min" is accurate (26:29) but keep it out of 30 s videos.
9. **Potential 5/10.** Best used as the end-card pointer ("सीखें · guide.mdgservices.in"). Motion moment: a search box typing `फोटो` and the grid re-ranking.

---

### F10 · The promise: 9 to 9, in your language, live in 7 days — `support-9-to-9`

1. **Name.** `सुबह 9 से रात 9, हर दिन` and onboarding. Pricing is included here because it is part of the same close.
2. **Status.** Published everywhere; dealer-facing: indirect (it is the service wrapper).
3. **What is promised.**
   - **Support:** 9am to 9pm, every day including Sunday, Hindi or English, the same team each time ("A person, not a menu. The same team each time."). Outside those hours a message waits for the desk and is picked up first thing. A callback within the hour. It is a staffing commitment; nothing enforces hours (fact file §5).
   - **Toll-free `1800-891-3496`** (website label `Free call / नि:शुल्क`; sheet text `Reaches our team · 9am to 9pm, every day / हमारी टीम से बात · सुबह 9 से रात 9, हर दिन`). Back since 9 Oct. The full film's end card prints it written, never spoken; the pamphlet and the marketing film print no number.
   - **Onboarding, 7 days:** Day 1 one call, plain talk, no forms; Day 2-3 he picks the modules and the price is locked in writing; Day 4-7 the outlet is live. First full inspection and filing cycle usually clears inside two weeks. Needs from him: his existing workbook and one shift export (an outlet with no automation can be set up; figures typed by hand). NDA signed before any document is seen.
   - **Pricing, published:** standard MDG service **₹3,000 a month + 18% GST** (₹540 GST, ₹3,540 with GST; arithmetic checked), one charge across India; premium services priced on the work; four promises `Modular · Locked · Checked · Lifted` ("no surprise fees, no mid-year escalation"). The assistant's approved answer adds a free first month and about ₹15,000 + GST for everything; the first-month line exists **only in the assistant's prompt, UNVERIFIED as a general offer**. The website band prints no figure; pamphlets and the marketing film print none.
   - **Contract facts that must not be contradicted:** one-year auto-renewing, 30 days' notice; payment within 10 days; 18% p.a. interest on delay; provider is not liable for penalties under safety, oil-company or government rules.
4. **Anatomy.** The call sheet on the site (title `Call us / कॉल कीजिए`, lead `Two ways, both free. / दो तरीके, दोनों मुफ़्त।`, `Call toll-free`, `Talk on this page`); the register form; a clock dial.
5. **Figures.** 9am to 9pm = 12 hours a day, 84 hours a week; 7 days; "within the hour"; 3,000 + 540 = 3,540.
6. **Pain / hooks.** The Sunday-night fear: "automation down on a Sunday night, whom do you call?" (the pamphlet's own line).
   - [number] `सुबह 9 से रात 9 — इतवार को भी।` / `9 to 9. Sundays too.`
   - [question] `इतवार की रात कुछ बैठ जाए — फ़ोन किसे करेंगे?` / `Sunday night, something goes down. Who do you call?`
   - [number] `7 दिन में आपका पंप चालू।` / `Live in 7 days.`
7. **Outcome line.** `आदमी से बात — सुबह 9 से रात 9, हर दिन।` / `A person to talk to, 9 to 9, every day.` (phone and callback only; see rule 6)
8. **Safe / forbidden.**
   - Safe: 9-9, Sunday included, Hindi or English, 7 days, callback within the hour, toll-free number written, ₹3,000 + GST only if the founder OKs it for that video.
   - Forbidden: "24x7"/"24 hours"; "within 22 minutes"; "never a missed deadline" as a guarantee; "free"; any figure for a specific outlet; the WhatsApp Business number (+91 94702 93427) or the Play developer phone; saying the toll-free line is "answered by AI" or that the in-page "Talk live" is a person.
9. **Potential 7/10.** Motion moment: a clock dial sweeping 12 hours with Sunday highlighted in a week strip; then the seven-day bar filling.

---

### F11 · The front door: register, callback, grievance, Ask MDG — `front-door`

1. **Name.** `अपना पंप रजिस्टर करें`, `कॉल-बैक`, `शिकायत`, "Ask MDG".
2. **Status.** All live. `/register` and the in-app sign-in form post to the same enrolment endpoint; grievance and enrolment go on to the admin as numbered rows (14 Oct). The assistant also files grievances (15 Oct).
3. **What the visitor sees.**
   - Register: fields `Your Name`, `Your Mobile`, `Your Email` (optional), `Pump Name` (optional), `SAP Code`, `Site type` Type A / Type B, a Terms tick (Hindi shows a convenience translation, English is binding), `Submit`. Success: `Registration received / नामांकन मिल गया`; "usually within the hour (9am to 9pm, every day)"; then ID and password by the team. Sign-in footer in the app: `No login yet? Register your pump...`.
   - Callback: Name, Pump / outlet, Phone, `Request callback`; "A team member calls back within the hour, 9am to 9pm, every day."; success `Received`.
   - Grievance (`/grievance`): `Something gone wrong? Tell us. / कुछ गड़बड़ हुई? हमें बताइए।`; categories Our service, The Dealer Kavach app, Billing or payment, Our staff, Privacy or your data, Something else; success `Grievance received / शिकायत मिल गई` with a number like `G-0007` and an emailed copy; "A person from our team will look into it and get back to you." No time or officer is promised.
   - Ask MDG: a floating launcher (`Ask us anything / कुछ भी पूछिए`), type, tap the mic, or `Talk live`; it answers in Hindi or English. It is the site assistant, **not a person**; the call sheet itself says "our assistant".
4. **Anatomy.** Website system (2.4): navy/gold, rounded cards, a gold asterisk for required fields. Files: `mdg-landing/src/i18n/{en,hi}/{register,grievance,contact,assist,ui}.ts`, `components/{RegisterForm,GrievanceForm,CallSheet}.tsx`.
5. **Figures.** G-0007 (invented), "within the hour", 7 days.
6. **Pain / hooks.**
   - [fear-removal] `लॉगिन नहीं है? पंप रजिस्टर कीजिए।` / `No login yet? Register your pump.` (real string)
   - [number] `एक घंटे में कॉल।` / `A call within the hour.`
   - [question] `कुछ गड़बड़ हुई? हमें बताइए — नंबर मिलेगा।` / `Something wrong? Tell us. You get a number.`
7. **Outcome line.** `रजिस्टर कीजिए — टीम आपको कॉल करेगी।` / `Register. The team calls you.`
8. **Safe / forbidden.** Safe: the form fields, "within the hour", the grievance number, the toll-free as a written number. Forbidden: showing a real SAP code, mobile or email; the site assistant as "a person"; "your grievance is resolved in N days" (none promised); the 1,400+ pumps chip; Hindi copy never had a native read (UNVERIFIED quality).
9. **Potential 4/10 standalone.** Fold into the closing card of other videos. Motion moment: a form field filling, then a number stamp `G-0007` landing.

---

## 4. The human-only service lines (six)

Common facts (fact file §5 and website copy): the dealer gets outcomes, never a screen. Public names (EN / HI as the dealer sees them on the site):

| # | Line | Hindi | Software behind it? | What reaches the dealer |
|---|---|---|---|---|
| 01 | SDMS Compliance | SDMS का सारा काम | Back-office tooling exists (admin-only); none dealer-facing | Nothing screen-wise; the outcome is "nothing left unfiled". Water testing record and supply status reach him only as chat answers or cards (other researchers). |
| 03 | Inspection Compliance | इंस्पेक्शन की तैयारी | Admin-only inspection-report tooling; dealer sees none of it | The pump's Kavach standing card (MDG's written statement, never a certification) and asks for photos in chat |
| 05 | Automation Support | ऑटोमेशन सपोर्ट | None | Fault flagged and chased; he is told in the chat |
| 06 | Web Portal Support | वेब पोर्टल सपोर्ट | None | Complaints raised and chased; mock drills and fillups logged |
| 07 | XTRA Campaign Support | XTRA कैंपेन सपोर्ट | None | Enrolment and campaign progress "in one place" (**UNVERIFIED where**, no screen exists) |
| 09 | Prepare Pro Manager | Prepare Pro Manager | None | "Industry expertise built into the team" (**UNVERIFIED what is delivered**, nothing in code or ADRs) |

Hindi-spoken rule for all six: trade words in (SDMS, Fire NOC, Dhruva, DAR, mock drill, नोज़ल, टैंक), but not "portal", "automation as a feature", "system", "data", "app" in spoken lines. The names of the *services* can appear on a card.

### 4.1 SDMS Compliance — `sdms-filed`
- **Status/evidence.** Live as a service; dealer-facing indirect. Website `services.items.sdms`; pamphlet 01. Back-office pipelines (credit-dod, water-ingress, RO supply status, inspection reports) are admin-only; the dealer-facing parts are other features.
- **Receives.** Subsidy, work permit, safety and Swachhta, monthly wages, declarations, DAR "filed, updated and followed up".
- **Visual metaphor.** Six paper tags on a hanging rail carrying only the six trade words; each flips from a pale "due" tint to ink with a rubber-stamp `filed`; the last frame is an empty tray, `कुछ बाक़ी नहीं` / `Nothing pending`. No portal UI, no URL bar, no logo of the oil company's system.
- **Figures.** Six words only; no counts.
- **Pain / hooks.** `सब्सिडी एंट्री की तारीख़ निकल गई।` / `The subsidy entry date has passed.` (pamphlet's own scene); `छह डिक्लेरेशन — कितने भरे?` / `Six declarations. How many are filed?` (a real explainer topic); the word `DAR` as a small tag.
- **Outcome line.** `SDMS का हर काम भरा हुआ।` / `Every SDMS filing, done and followed up.`
- **Safe / forbidden.** Safe: the six names, "filed and followed up". Forbidden: "we log in to SDMS/e-Mitra", credentials, OTP, the "DAR automation" chip wording (method), screen captures of any oil-company system, what happens on a miss, "nothing left unfiled" as an absolute guarantee.
- **Potential 4/10; best motion moment:** tags flipping to stamped, the stamp thump. **Group** with 03 and 04 into one "nothing missing when they arrive" video.

### 4.2 Inspection Compliance — `inspection-ready`
- **Status.** Live; indirect. The Sep short already covers the "manager on leave, inspection walks in" scene with shot footage (S60 etc.); do not repeat that.
- **Receives.** "Records, logs and samples kept inspection-ready year-round." Programmes named in Latin script: Dhruva, MDT, QRC, AAC, Mobile lab, DO team.
- **Metaphor.** A gate or a door in a canopy shadow; six name tags arrive at the gate one by one and each finds its slot in a shelf of files; the shelf is complete; the door closes without a sound. Officials, if shown, wear plain shirts with no livery, ID card art or logo.
- **Figures.** Six names. 45 compliance items on the clock at an outlet and 9 repeat cycles are verified fact-file numbers; the Kavach "score" is MDG's written statement.
- **Pain / hooks.** `इंस्पेक्शन टीम गेट पर। फ़ाइल पूरी?` / `The team is at the gate. Is the file complete?`; the 45-item number; `Dhruva, MDT, QRC, AAC...` as a stamp rail.
- **Outcome line.** `रिकॉर्ड हर वक़्त तैयार।` / `Records kept ready, all year.`
- **Safe / forbidden.** Forbidden: "you will pass the inspection", "inspection-ready, always" (website metric), what an inspection finds, any uniform or ID resembling an oil company's, the word "audit".
- **Potential 5/10; motion moment:** the file shelf filling slot by slot as each name tag lands. **Group** with 01.

### 4.3 Automation Support — `sunday-night`
- **Status.** Live; indirect (no dealer screen). Pamphlet/website scene: "Automation goes down on a Sunday night. Whom do you call?"
- **Receives.** "Flagged straight away and tracked until it is back up" (fault diagnosis, vendor coordination).
- **Metaphor.** A night forecourt, one dispenser console display going dark, a small status lamp turning red, a Sunday cell lit in a week strip; the lamp turns green and the display lights. No clock numbers.
- **Figures.** None. The website's "22 minutes" is flagged illustrative and must never appear.
- **Pain / hooks.** `इतवार की रात। ऑटोमेशन बंद।` / `Sunday night. Automation down.`; `अब फ़ोन किसको करें?` / `Now who do you call?` (both are the pamphlet's own lines); the dark display contradicted by a green lamp.
- **Outcome line.** `ख़राबी ख़ुद ढूँढनी नहीं पड़ती।` / `You don't have to find the fault yourself.` (the website's published metric, Hindi side)
- **Safe / forbidden.** Safe: Sunday, "flagged straight away", "tracked until it is back". Forbidden: durations, the word "uptime watch" or "monitoring your equipment remotely" (method), vendor names, IRAS (an internal system name), an image of a branded console.
- **Potential 7/10 (the strongest of the six because the Sunday-night scene is emotionally clear); motion moment:** red lamp to green with the display lighting up. **Group** with 06: "whatever breaks, someone chases it".

### 4.4 Web Portal Support — `complaint-chased`
- **Status.** Live; indirect.
- **Receives.** Complaints "raised and chased on the right portal, nozzle, tank or pipeline"; mock drills and fillups logged.
- **Metaphor.** A complaint slip enters one of three lanes labelled Nozzle, Tank, Pipeline and travels until it is stamped `closed`; a calendar cell marks `mock drill` done. No portal UI.
- **Figures.** Three lane labels only.
- **Pain / hooks.** `नोज़ल ख़राब। शिकायत कहाँ दर्ज करें?` / `A nozzle is faulty. Where do you even complain?`; `शिकायत दर्ज हुई। फिर?` / `Complaint raised. Then?`; the safe mock-drill line `ड्रिल की, पर फ़ाइल नहीं की? तो हुई ही नहीं।` / `Did the drill, didn't file it? Then it didn't happen.` (fact file §3; the observable consequence "next fuel order can be held" is also safe).
- **Outcome line.** `शिकायत दर्ज से हल होने तक — पीछा हमारा।` / `From raised to resolved, we follow it up.` (website metric)
- **Safe / forbidden.** Forbidden: "portal" in spoken lines (the service's card name can say "Web Portal Support"), logging into anything on his behalf, ATR fillups as jargon, any statement of what the oil company does with a complaint or a missed drill beyond the one safe consequence.
- **Potential 4/10; motion moment:** the slip travelling a lane and thumping `closed`. **Group** with 05.

### 4.5 XTRA Campaign Support — `xtra-target`
- **Status.** Live as a service per website/pamphlet; **evidence thin**: it appears only in website, pamphlet, one marketing-film stage; no code, ADR or screen.
- **Receives.** XTRA Rewards enrolment and the oil company's promotional drives, "enrolment and campaign progress visible in one place".
- **Metaphor.** Customer enrolment cards stacking toward a target ring that fills; no card art with any oil-company mark; "XTRA" appears only in type.
- **Figures.** None invented beyond a generic target ring (do not state a real target number).
- **Pain / hooks.** `इस महीने का एनरोलमेंट टारगेट — कितना बाक़ी?` / `This month's enrolment target — how far to go?`; `प्रमोशन चलाना है, और पंप भी।` / `Promotions to run, and a pump to run.`
- **Outcome line.** `एनरोलमेंट और प्रोग्रेस, एक ही जगह।` / `Enrolment and progress in one place.` (website metric; ask where "one place" is before using it, Q5)
- **Safe / forbidden.** Forbidden: the real loyalty scheme's logo or card design, reward amounts, a customer's name or phone, any claim about incentive money.
- **Potential 3/10; do not make a standalone.** Use one 2.4-second beat in the anthem. Motion moment: the ring closing.

### 4.6 Prepare Pro Manager — `prepare-pro`
- **Status.** Live as a service per website/pamphlet; **what is delivered is UNVERIFIED** (no code, no ADR). It reads like training/mentoring ("leadership, management, decision-making").
- **Receives.** "Industry expertise built into your team: leadership development, team management and the calls that run a pump well."
- **Metaphor.** The manager's empty cabin chair and a notebook of decisions filling with ticks; or a whiteboard where a half-drawn flowchart completes itself. It ties to the fact file's best idea: "anyone, even the manager, can do it without him" (and the Sep short's "manager on leave").
- **Figures.** None.
- **Pain / hooks.** `मैनेजर छुट्टी पर। फ़ैसला कौन लेगा?` / `The manager is on leave. Who makes the call?` (do not copy the short's exact title)
- **Outcome line.** `आपकी टीम ख़ुद तैयार हो जाती है।` / `Your team becomes ready on its own.` (website metric)
- **Safe / forbidden.** Forbidden until the founder says what it is: duration, certificates, trainer names, results, "guaranteed better manager".
- **Potential 3/10; one beat in the anthem only.**

### 4.7 Grouping recommendation

| Video | Lines | Why |
|---|---|---|
| "Sunday night" (30 s) | 05 + 06 | one human image: "something breaks, someone chases it" |
| "At the gate" (30 s) | 01 + 03 (+ papers from F04) | "nothing is missing when they arrive" |
| Anthem beat only | 07, 09 | too thin to carry 30 s honestly |

Do not make six standalone videos.

---

## 5. Brand anthem idea — "Nine jobs, one hand" (30 s)

**Concept.** The hand in the logo takes nine jobs off a dealer's desk, one per beat, and the ring closes at the end. The honest line is "nine jobs", never "nine features of the app" (4 of 9 have no software at all).

**Structure (30.0 s):** 3.0 s hook + nine beats of 2.4 s (21.6) + 5.4 s close.

| t (s) | Beat | On-screen (EN / HI) | Visual | Motion |
|---|---|---|---|---|
| 0.0-3.0 | Hook | `Nine jobs. One desk.` / `नौ काम। एक मेज़।` | a desk buried in nine paper stacks, a dealer's silhouette at the edge | stacks lift off one by one as the hand mark enters |
| 3.0-5.4 | 01 | SDMS | six tags stamped | stamp thump |
| 5.4-7.8 | 02 | DSR · स्टॉक | the report picture lands in a chat bubble | picture slides in, tick |
| 7.8-10.2 | 03 | Inspection | file shelf completes | slot snap |
| 10.2-12.6 | 04 | Fire NOC | the ask card: `3 days left`, black Send photo | button press to Received |
| 12.6-15.0 | 05 | Automation | red lamp to green | lamp flip |
| 15.0-17.4 | 06 | Complaint | slip stamped closed | stamp |
| 17.4-19.8 | 07 | XTRA | ring fills | ring closes |
| 19.8-22.2 | 08 | DOD | the due amount and date | digits roll (credit researcher supplies the card) |
| 22.2-24.6 | 09 | Prepare Pro | chair + notebook ticks | tick cascade |
| 24.6-30.0 | Close | `Fueling Success` + `mdgservices.in` + `1800-891-3496` | the ring finishes drawing around the three people | mark draw-on; number is written, not spoken |

Voice: ElevenLabs Hindi (eleven_multilingual_v2, mp3_44100_128; Hindi runs about 35% longer than English, so keep the spoken lines to short nouns: nine job names plus hook and close, roughly 25-30 words). Music-only is a good variant: the nine-beat grid fits a 4/4 pulse.
Founder-ruled claims (20 Sep, for the Kavach films only): "since 2021", "250+ people", "about 1,700 dealers". Do not carry them into this reel unless the founder says so (Q4).

---

## 6. Suggested slate from this topic (ranked by what the product can honestly carry)

| Rank | Slug | Potential | Notes |
|---|---|---|---|
| 1 | `send-photo-ask` (F04) | 9 | strongest, one clear state machine; needs invented documents |
| 2 | brand anthem (section 5) | 9 | all nine; depends on other researchers' cards |
| 3 | `one-chat` + `report-picture` + `talk-dont-type` (F01-F03) | 8 | one video with three beats; use the real captures |
| 4 | `warriors-points` (F06) | 8 | needs a neutral job list; check no real names |
| 5 | `support-9-to-9` (F10) | 7 | clock dial; price only if the founder agrees |
| 6 | "Sunday night" (05+06) | 7 | human-only; strongest emotional scene |
| 7 | `first-reply` (F05) | 6 | founder decision first (Q1) |
| 8 | `hindi-english-2g` (F08) | 6 | can be a 3-second beat inside the chat video |
| 9 | "At the gate" (01+03) | 5-6 | overlaps the Sep short's scene |
| 10 | `owner-manager` (F07) | 5 | thin visually |
| 11 | `video-guide` (F09) | 5 | better as an end-card pointer |
| 12 | `front-door` (F11) | 4 | fold into closing cards |

---

## 7. Asset inventory (absolute paths)

Real or invented-data renders of the live app:
- `/Users/dissu/Documents/PP/mdg-service/mdg-app/store-assets/captures/{01-chats,02-report,03-papers,04-staff-hi}.png`
- `/Users/dissu/Documents/PP/mdg-service/mdg-app/store-assets/screenshots/{screenshot-01..04,feature-graphic}.png`
- `/Users/dissu/Documents/PP/mdg-service/mdg-app/store-assets/capture/{stack.sh,seed.mjs,capture.mjs,render-cards.mts,pictures.mjs,demo/}`
- `/Users/dissu/Documents/PP/mdg-service/mdg-app/store-assets/PLAY-LISTING.md` (approved public copy)

Logos: `/Users/dissu/Documents/PP/mdg-service/mdg-app/assets/{icon,logo-source}.png`; `.../mdg-demo/public/brand/*.png`; `.../mdg-client/src/components/BrandMark.tsx` (vector path); `.../marketing/panels/{icon-512,logo-full-white}.png`.

Stale or restricted:
- `/Users/dissu/Documents/PP/mdg-service/marketing/refs/product/real-{sales,variation}.png` (REAL data, do not use)
- `/Users/dissu/Documents/PP/mdg-service/mdg-demo/src/screens/{ChatScreen,LoginScreen}.tsx` (stale)
- `/Users/dissu/Documents/PP/mdg-service/marketing/films/graphics-kavach/` and `marketing/panels/` (maroon-era)

Copy sources: `/Users/dissu/Documents/PP/mdg-service/mdg-client/src/lib/i18n.ts` (every app string, EN+HI); `.../shared/src/lib/ticketView.ts`; `.../shared/src/data/{documentKinds,staffWorkCatalog}.ts`; `.../mdg-backend/src/services/chatAsks/text.ts`; `.../mdg-backend/src/assist/firstline/templates.ts`; `.../mdg-landing/src/i18n/{en,hi}/*.ts`; `.../mdg-demo/site/content.mjs`.

Docs: `docs/ADR/0008, 0013, 0017, 0018, 0019`; `docs/specs/{staff-points,ticket-lifecycle-and-reply-sla}.md`.

---

## 8. UNVERIFIED items, and what I need from the owner

**UNVERIFIED (could not confirm):**
1. Whether voice notes work on every dealer's phone (several fix rounds; field status unmeasured).
2. Whether push notifications reach dealers' phones.
3. What XTRA Campaign Support and Prepare Pro Manager actually deliver and where a dealer sees it.
4. Whether owners can ask MDG to change who receives which sheet.
5. Whether the "first month free" offer is a general commercial promise (only in the assistant's prompt).
6. Whether paying staff or any bonus is tied to warriors' points.
7. Hindi quality of the website's Hindi (never had a native read, per memory).
8. How `hi-IN` formats times inside bubbles on Android (the chat list forces `am/pm`).
9. Whether the Hindi "ऐप" inside dealer UI strings (several) is acceptable on screen; it is the real UI, but spoken lines must avoid it.
10. Real prod counts: 10 dealer records, all test users (fact file §6); no testimonials exist.

**Questions for the owner (each changes what gets built; my pick first):**

| Q | Decision | Options | My pick |
|---|---|---|---|
| Q1 | How to show the quick first reply (F05) | (a) show the UI only, no narration, no "AI"; (b) skip it; (c) say "MDG's desk answers first, a person right behind" | (a): matches the app's own label and the system's own instruction; (c) is the engine's own answer if asked |
| Q2 | Video brand palette | (a) navy + gold frame, live-app black/grey screens; (b) maroon + amber like the Sep films; (c) teal/black like the Play graphic | (a) |
| Q3 | Show price in any video? | (a) no price in feature videos, only in one close video; (b) "₹3,000 a month + GST" in every close; (c) none anywhere | (a); first-month-free only if you confirm it |
| Q4 | Carry "since 2021 / 250+ people / about 1,700 dealers" into the 30 s reels? | yes / only anthem / no | only in the anthem, if at all |
| Q5 | What do XTRA Campaign Support and Prepare Pro Manager hand the dealer, concretely? | one sentence each | needed before any prompt names them beyond a beat |
| Q6 | The invented outlet code "99Z" on report pictures: keep or blank? | keep / blank | blank (public rule says no outlet codes, even invented) |
| Q7 | Hindi voice: use the same ElevenLabs voice as the films (and an English voice), or music only? | voice / music / both | both, Hindi voice, English cut optional |
| Q8 | Support hours wording | 9-9 only | 9-9 (the "24 hours" film line is still open) |
| Q9 | May videos show the Google Play badge? | official badge / none | official badge in one close only |
