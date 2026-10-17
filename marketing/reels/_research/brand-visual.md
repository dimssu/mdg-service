# Brand visual system, for the 15 motion videos

Research only. Nothing was run, edited, deployed or called. Everything below is read from source, from the existing rendered assets, and from the memory notes. I did not open the live website, the live app or production. Anything I could not confirm is tagged **UNVERIFIED**.

Reader: the prompt writer. File paths and exact strings are on purpose.

---

## 0. The seven findings that change how the prompts are written

1. **There is no single brand palette. There are four, and each belongs to a different surface.** The prompt must pick one and say why (section 2.1). My recommendation: the maroon / gold / cream family of the report cards and the Kavach films, with the app's black and white for the phone chrome (section 9).
2. **The app itself is black and warm grey. It is not navy, not maroon, not green.** Primary action `#18181b`. My bubble `#e7e5e4`. Wallpaper `#f3f2f0`. Source: `mdg-client/src/index.css`.
3. **The report cards the dealer receives are maroon header, gold strip, cream paper.** They are drawn by the backend (`mdg-backend/src/**/card*.ts`). A video that imitates "the card in the chat" must use these hexes, not the website's.
4. **The real logo is black ink, a ring with three people in an open hand. It is not a "DK" chip and not an "M" coin.** The Kavach films invented a maroon "DK" chip and a gold "M" coin. Neither exists in the product (section 4).
5. **The DSR cards have two designs.** The committed (probably live) one has a four-sided gold marquee and English plus Hindi. A Hindi-only redesign sits uncommitted in `mdg-backend`, awaiting owner review (section 6.2). The owner must say which one the video shows.
6. **None of the brand fonts is installed on this Mac.** Only the vendored copies in `marketing/pamphlet/fonts/` are reliable. The old film panels fetch Google Fonts at render time, which fails silently (section 3.3).
7. **Several existing devices are banned by the public rules or by the sample brief and must not be carried over**: WhatsApp-green mock phones, the tricolour festival band, the "portals flowing into the shield" hero, petrol-orange plus diesel-blue as a scheme, glow halos, bounce easing (section 9.4).

---

## 1. Which source wins when they disagree

| Rank | Source | Why it ranks here |
|---|---|---|
| 1 | `marketing/mdg-video-knowledge-pack.md` §9 and `marketing/README.md` "The one rule" | The authority on what may be shown. Last brought up to date 15 Oct 2026. |
| 2 | Code: `mdg-client/src/index.css`, `mdg-client/tailwind.config.ts`, the card renderers in `mdg-backend/src` | What the dealer actually sees. Code beats docs. |
| 3 | `docs/STYLE_GUIDE_V2.md` (Oct 2026) | Agrees with the client code. |
| 4 | Memory notes, newest first | Newer than some code comments. They point at decisions and at things not yet shipped. |
| 5 | Older films (`marketing/films/*`, `mdg-demo/src/marketing/*`) | Made before the chat became the whole app (13 Oct) and before the Play launch (22 Sep). Good for motion ideas, unreliable for what the app looks like now. |

**Doc versus code conflict, resolved in favour of code:** `docs/ADR/0018-the-chat-is-the-app.md` section 6 still says "green unread pill", "round green mic-or-send button". The code and `STYLE_GUIDE_V2.md` say every accent is the brand black (`--wa-accent: var(--color-brand)`), and the Play screenshots (15 Oct) show black. Black is right. The ADR text is stale.

---

## 2. Colour

### 2.1 The four palettes in use

| Family | Where it lives | Core hexes | Status |
|---|---|---|---|
| **A. App black and warm grey** | The dealer app (`mdg-client/src/index.css`), the app icon, the Play screenshots, `mdg-demo/src/theme.ts` | brand `#18181b`, bg `#fafaf9`, wallpaper `#f3f2f0`, my bubble `#e7e5e4`, text `#0f172a` | **Live. The product itself.** |
| **B. Card maroon, gold, cream** | Every report card the dealer receives (DSR, credit, load plan, ledger, supply, water, Kavach), plus the Kavach films and their end cards (`marketing/films/graphics-kavach`, `films/short`) | maroon `#7f1d1d` / `#5c1010`, gold `#f59e0b`, cream `#fffdf5`, page `#f4ede0`, ink `#1c1917` | **Live. The dealer's daily output.** |
| **C. Navy and gold** | The website (`mdg-landing/tailwind.config.js`), the pamphlet (`marketing/pamphlet/style.css`), the OG card, the Sep marketing film (`mdg-demo/src/marketing/brand.ts`), `mdg-landing/PRODUCT.md` | navy `#2C2E80` (brand), navy-950 `#101133`, gold `#F5A524`, paper `#FCFCFE`, ink `#15163A` | **Live on the web and on paper.** `PRODUCT.md` (9 Oct) calls this "the brand". |
| **D. Ink and teal** | Play Store graphics only (`mdg-app/store-assets/render-template.html`, `store-asset-studio.html`, `screenshots/*`) | ink `#0f172a`, teal `#0f766e` (sampled from the 15 Oct screenshots), bright teal `#14b8a6`, deep teal `#0b5c56` | Store listing only. In the app, teal exists as `--color-online #0f766e`, used for the text-selection tint and a message-jump pulse. |

The company logo is black (family A). The tagline gold sits in C and B. The dealer opens A, and every card he forwards is B. Nobody sees C inside the product.

### 2.2 Exact tokens, by surface

**App (family A)**, `mdg-client/src/index.css` `:root`:

| Token | Value | Used for |
|---|---|---|
| `--color-bg` | `#fafaf9` | page |
| `--color-surface` / `-2` | `#ffffff` / `#f5f5f4` | cards, input fill, chips |
| `--color-border` / `-strong` | `#e7e5e4` / `#d6d3d1` | hairlines |
| `--color-text` / `-muted` / `-subtle` | `#0f172a` / `#57534e` / `#78716c` | text |
| `--color-brand` | `#18181b` (hover `#27272a`, soft `#f4f4f5`) | primary button, send/mic, unread pill, tabs |
| `--wa-bar` / `--wa-bar-text` / `--wa-bar-icon` | `#ffffff` / `#111b21` / `#54656f` | top bar |
| `--wa-wallpaper` | `#f3f2f0` | chat background, with a doodle of `rgba(17,27,33,.045)` |
| `--wa-in` / `--wa-out` | `#ffffff` / `#e7e5e4` | their bubble / my bubble ("a warm grey, the brand's own neutral") |
| `--wa-bubble-text` / `--wa-meta` | `#111b21` / `#667781` | bubble text / time and previews |
| `--wa-tick-read` | `#53bdeb` | read ticks. **Blue on purpose**: two blue ticks mean "read" |
| `--wa-notice` | `#ffeecd` | the amber "sent back" reason on a request |
| `--wa-row-active` / `--wa-divider` | `#f0f2f5` / `#e9edef` | avatar tint, row hairline |
| `--wa-viewer` | `#000000` | full-screen picture viewer |
| Status (tailwind) | success `#16a34a` / soft `#dcfce7`; warning `#d97706` (strong `#92400e`, white-safe) / soft `#fef3c7`; danger `#dc2626` / soft `#fee2e2`; info `#2563eb` / soft `#dbeafe` | chips |
| Dark theme | defined (`#0a0a0a` bg, `#fafafa` brand) but **nothing sets it**. The chat is light only (ADR 0018) | do not show |

Radii: bubble 8px (first of a run squares its top corner and hangs an 8x10 tail), cards `rounded-2xl`, composer `rounded-3xl`, chips and buttons `rounded-full`, bottom sheets `rounded-t-2xl`. Shadows: sm `0 1px 2px rgba(15,23,42,.06)`, md `0 4px 12px rgba(15,23,42,.08)`, lg `0 16px 40px rgba(15,23,42,.16)`; a bubble uses `0 1px .5px rgba(11,20,26,.13)`.

**Report cards (family B)**, shared across all card renderers. The file `renderCard.ts` (credit), `waterIngress/card.ts`, `roSupplyStatus/card.ts`, `ledgerWatch/card.ts` and `loadPlanner/card.ts` all carry this same `C` object:

| Token | Value | Role |
|---|---|---|
| maroon / maroonDeep | `#7f1d1d` / `#5c1010` | header gradient, frame border, eyebrow labels, active chip |
| maroonSoft | `#fef2f2` | hero background when money is owed |
| red / redDeep | `#b91c1c` / `#8b1414` | shortage / **excess** (the severe case: stops sales) |
| redSoft / redDeepSoft | `#fef2f2` / `#fde8e8` | |
| green / greenSoft | `#15803d` / `#f0fdf4` | within limit, advance, done |
| amber | `#b45309` (soft `#fffbeb`) | **pending only, never severity** (comment in code) |
| orange (credit) | `#c2410c` on `#fff7ed` | "payment may be lagging" |
| gold / strip | `#f59e0b`; strip is `linear-gradient(90deg,#f59e0b,#fbbf24 50%,#f59e0b)` | brand strip, code chip, hot pill |
| goldSoft | `#fffaf0` (DSR redesign `#fff7e6`) | footers |
| cream / page | `#fffdf5` (DSR `#fbf7ef`) / `#f4ede0` | card paper / the sheet behind it |
| grid | `#e7d9bf` (DSR `#eadfc8`) | tile borders and rules |
| ink / inkSoft | `#1c1917` / `#57534e` | text |
| Kavach card only | blue `#1d4ed8` on `#eff6ff` | the "we need from you" box |
| DSR product bars | diesel `#2f5fa8`, petrol `#b4632b`, other `#4b5563` | **see 9.4: livery risk** |
| DSR gauge | track `#f6d6d6`, safe zone `#7fcf95` | |

Verdict logic to copy exactly: green means within limit or settled. Red means short. Deep red means excess. Amber means "not yet checked", never "bad". A day still running is never painted green (water card comment).

**Kavach film kit (family B, film variant)**, `marketing/films/graphics-kavach/kit-base.css`: maroon `#6B1616`, maroonDeep `#4E0F0F`, maroonSoft `#8A2B2B`, amber `#E9A23B` (soft `#F6DCA8`, deep `#C77C1B`), cream `#FDF7EE`, ink `#2A1A16`, good `#1E7A4A`, bad `#C0392B`. The short's word overlays use cream `#FFF3E2` and gold `#E9A23B` (`films/short/overlays/render-overlays.mjs`). The old brand outro is a maroon radial gradient. I sampled `marketing/panels/outro-brand.png`: centre-top `#791B1B`, edge `#5E1414`, middle `#490E0E`, floor `#2E0808`. Its tagline and rule are `#E9A23B`.

**Website and paper (family C)**, `mdg-landing/tailwind.config.js` (the pamphlet and `mdg-demo/src/marketing/brand.ts` mirror it 1:1):
navy 50 `#F1F2FB` / 100 `#E3E4F6` / 200 `#C5C7ED` / 300 `#9EA1E0` / 400 `#6E72CC` / 500 `#4A4EB4` / 600 `#393C9A` / **700 `#2C2E80` (brand)** / 800 `#222466` / 900 `#1A1B4B` / 950 `#101133`; gold 50 `#FEF7E7` / 100 `#FDECC4` / 200 `#FBD888` / 300 `#F8C24B` / **400 `#F5A524` (accent)** / 500 `#E0860A` / 600 `#B96807` / 700 `#92500A`; paper `#FCFCFE` / warm `#F5F6FB` / sunk `#EDEFF7`; ink `#15163A` / soft `#3D3F66` / muted `#6B6D93` / faint `#9B9DBE` / hairline `#E4E6F1`; ok `#12A87B` (tint `#E4F6EF`); film-only risk `#D2544B` (tint `#FBE9E8`). Gold diamond: a 6px square rotated 45 degrees in `#F5A524` before every mono-caps "eyebrow" label (`.eyebrow::before`).

### 2.3 Status colours: the spread you must not mix

| Meaning | Values in use |
|---|---|
| Green | `#15803d` (cards, `mdg-demo/src/theme.ts`) · `#16a34a` (client Tailwind `success`) · `#12A87B` (website, Sep film) · `#1E7A4A` (Kavach film) · `#7fcf95` (DSR gauge) |
| Red | `#b91c1c` (cards) · `#dc2626` (client `danger`) · `#D2544B` (Sep film) · `#C0392B` (Kavach film) · `#8b1414` (DSR excess) |
| Amber | `#b45309` (cards) · `#d97706` / `#92400e` (client) · `#c2410c` (credit lag) |
| Blue | `#2563eb` (client info) · `#1d4ed8` (Kavach card) · `#2f5fa8` (diesel bar) · `#53bdeb` (read ticks) |

Rule for the prompts: **inside a recreated screen or card, use that surface's own values; outside, use one set** (section 9.1).

### 2.4 Banned or risky colours

| Colour | Why | Source |
|---|---|---|
| WhatsApp green (`#075E54` header, `#D9FDD3` my bubble, `#ECE5DD` wall) | The dealer app is black, "never WhatsApp's green". The old film panels (`.wa-top`, `.bub.me` in `kit-base.css`) draw a green WhatsApp phone from when reports were thought to arrive there. Today a person forwards them by hand. | `index.css` comment; fact file §6 "WhatsApp delivery" |
| Oil-company livery (orange and blue, saffron, canopy colours) | "No oil company logo, canopy livery, tanker branding." The S57 grade note in `films/short/plan.md` desaturates orange (hue 10-45) and blue (200-240) for exactly this reason. | fact file §9 |
| Saffron-white-green stripes, Ashoka Chakra | "No national flag or Ashoka Chakra in commercial creative." The festival band (`shared/src/data/festivals.ts`, `festivalBand.ts`) is a tricolour with a chakra emblem. It is wired to the credit card only. Never show it. | fact file §9, §6 |
| Navy `#2C2E80` inside the dealer app or a card | It appears nowhere in the product. The dealer has never seen it in a screen. | whole survey |
| Teal `#0f766e` as a brand colour | Store graphics only. | |
| Purple gradients, glassmorphism, neon on black | Named anti-references in `mdg-landing/PRODUCT.md`. Matches the sample brief's bans. | |

---

## 3. Typography

### 3.1 By surface

| Surface | Latin | Devanagari | Notes |
|---|---|---|---|
| **App** (`tailwind.config.ts`) | native stack: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`. Resolves to **Roboto on the target Android phones**. No webfont. | the phone's own Noto | Headings `letter-spacing:-0.01em`. Bubble text **15px / 1.35**. Never below 16px in a form field. Home title 22px / 600. Top-bar title 17px / 500. List row 16px / 500, preview 14px. Meta 12px and 11px. |
| **Tutorial videos** (`mdg-demo/src/theme.ts`) | **Inter** as the stand-in for the system font | Noto Sans Devanagari | Closest reference for faking the app on a machine without Roboto. |
| **Report cards** | `FONT_STACK = 'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN',system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif` | same stack, Noto first | Weights 600-800. Figures `tabular-nums`, `letter-spacing:-0.02em`. Server note: Linux needs `fonts-noto`. |
| **Website** (`mdg-landing/src/fonts/en.ts`, `hi.ts`) | body **Inter**; headings **Space Grotesk** (600, `-0.03em`); eyebrow labels **Space Mono** 11px caps, tracking `.22em` | body **Noto Sans Devanagari** (Hindi pages). **Tiro Devanagari Hindi** (400, one weight) **for the कवच marks only** | Hindi pages: line-height 1.7 body, 1.28 headings, tracking forced to `normal`. |
| **Pamphlet** (`marketing/pamphlet/style.css`) | Space Grotesk display, Inter body | Noto Sans Devanagari leads on the Hindi sheet, Inter behind for Latin words | `--font-deva: 'Tiro Devanagari Hindi', 'Noto Sans Devanagari', serif`. |
| **Sep marketing film** (`brand.ts`) | `FONT_DISPLAY` Space Grotesk, `FONT_SANS` Inter | `FONT_DEVA` Tiro for the कवच mark only; Noto for captions | Captions 43px (Hindi) / 45px (English), weight 600, line-height 1.46 / 1.36, `text-wrap:balance`. |
| **Kavach films** (`kit-base.css`) | `.dis` Space Grotesk (figures), Inter | **Tiro Devanagari Hindi throughout** (`.hi`, `letter-spacing:0!important`) | Hindi headlines 54-92px maroon or cream. Hairline text-stroke 1.4px on Tiro in the overlays so one weight holds on a phone. |
| **Play graphics** | system sans, very bold caps | Noto | Headline ink `#0f172a` plus teal `#0f766e`. |

Parent-company site `vruoom-landing` uses **Geist**. That is not an MDG face. Do not use it.

### 3.2 The Devanagari traps (all from the repo, each cost someone an afternoon)

1. **Never letter-space Devanagari.** Tracking breaks the bar that joins a word. Every Hindi run gets `letter-spacing:0 !important` (`kit-base.css .hi`, landing `html[data-lang=hi] … letter-spacing: normal !important`). Hindi labels that are tracked mono capitals in English are set in the body face, untracked.
2. **Never split Devanagari into letters for a kinetic reveal.** Splitting by code point breaks conjuncts and matras (`kit-doc.css`: "never space Devanagari: it breaks the conjuncts"). Animate by **word**, or by grapheme cluster with `Intl.Segmenter`. The short's overlays animate whole blocks.
3. **Line-height must stay at 1.28 or more** (the site uses 1.28 / 1.45 / 1.7 by role). A display line-height of 1.02 crops the marks above the headline bar (`.deva` comment in `index.css`).
4. **Tiro sets the danda `।` a full space clear of its word.** The overlays pull it back with `margin-left:-.13em`.
5. **Small Devanagari reads worse than Latin at the same size.** The site bumps Hindi small text a size up. The DSR redesign sets almost nothing below 20px on a 960px card (its code comment says 22px is the floor, about 9pt on a phone; a few labels sit at 18-20px).
6. **Tiro has one weight (400).** Noto Sans Devanagari is vendored only at 400-700. The cards ask for 800, so Chromium clamps to 700. The vendor script requests `Noto+Sans+Devanagari:wght@400;500;600;700` only; Google serves the family as a wider range, but fetching 800 or 900 needs a script change. **UNVERIFIED.**
7. **The Latin brand words inside Hindi copy stay Latin** (DSR, SDMS, MDG, Dhruva, MDT, QRC, AAC, Fire NOC, Weights & Measures). Tagline **Fueling Success stays in English** in Hindi copy.
8. Hindi spoken forms are hyphenated for the voice: एम-डी-जी सर्विसेज़, डी-एस-आर, जी-एस-टी. The real cards print DSR and MDG in Latin. The short's own cards (I76, I49, C2) print the hyphenated form on screen too ("एम-डी-जी सर्विसेज़", "+ 18% जी-एस-टी", "डी-एस-आर"), so both are in use; recreated real cards keep Latin.

### 3.3 Where the font files are, and the silent-failure risk

- **Vendored, offline-safe:** `marketing/pamphlet/fonts/` (31 `.woff2`, 1.4 MB) and `marketing/pamphlet/fonts.css` (generated by `marketing/vendor-fonts.mjs`). Contents: Inter 400/500/600/700, Space Grotesk 400/500/600/700, Noto Sans Devanagari 400/500/600/700, Tiro Devanagari Hindi 400. Each in `latin`, `latin-ext` and (Devanagari faces) `devanagari` subsets. Not vendored: Space Mono, Kalam, Roboto.
- `mdg-landing` self-hosts through `next/font` (hashed files in `.next/static/media`, not a stable source).
- `mdg-demo` loads through `@remotion/google-fonts` (network).
- **The Kavach-film panels (`films/graphics-kavach/panels/*.html`, `_template.html`) pull Space Grotesk, Inter, Tiro and Kalam from `fonts.googleapis.com` at render time.** A render offline or behind a block falls back silently.
- **On this machine none of Noto Sans Devanagari, Inter, Roboto, Space Grotesk or Tiro is installed** (checked with `fc-list`). macOS ships only Kohinoor Devanagari and Devanagari Sangam MN. So an unvendored render here will not show tofu, but it will quietly draw Kohinoor and Helvetica, and the video will look wrong. On a Linux render box the Hindi would be empty boxes (`marketing/README.md`).
- **For the build prompts:** load the vendored `fonts.css` by relative or file URL, `await document.fonts.ready`, then assert `document.fonts.check('700 40px "Noto Sans Devanagari"')`, and the same for Space Grotesk and Tiro, before any frame is shot. Run Playwright under plain `node`, **never `tsx`** (memory: `tsx-breaks-page-evaluate`).

### 3.4 Numerals

- **Latin digits in both languages.** "Numbers in digits on screen" (`mdg-landing/PRODUCT.md`). The site's step markers have Devanagari numerals (`०१`) but cards, films and the app use 0-9.
- **Indian lakh grouping.** Cards use `toLocaleString('en-IN')`: `4,12,000 L`, `1.78 lakh`. The credit card's `inr()` writes `60,00,000.00` and `-29,670.10`. The Sep film shows `₹4,86,120` and `₹25,00,000`. Prompts must say "lakh grouping" explicitly, or a model will write `486,120`.
- **Litres whole.** Unit `L` at roughly 45% of the figure size, in `inkSoft`.
- **Variation is signed with a true minus** `−` (U+2212), a plus `+`, and `0` bare (`signedLitres` in the DSR cards; the code comment: "a hyphen is easy to miss").
- **Meter readings are 7-digit serials and are not grouped** (`meter()` in the cards). Grouping them would mislead.
- `font-variant-numeric: tabular-nums` on every figure. Big figures 46-88px, weight 800, tracking `-0.02em`.
- Dates: cards print `सोमवार, 12 अक्टूबर` (Hindi long day) and `सुबह 6:00` (part of day plus 12-hour clock). Chat captions print `15 October`. Chat times print `9:05 am`.

---

## 4. Logo and marks

### 4.1 What is official

| Mark | Files | Colours | Notes |
|---|---|---|---|
| **MDG Services full logo** (ring + three people + open hand, "MDG" light, "services" heavy) | `mdg-landing/public/logo-full.png` (black, 640x214 RGBA), `logo-full-white.png` (white, same size). Byte-identical copies (checked with `cmp`) at `marketing/panels/logo-full-white.png`, `marketing/pamphlet/assets/logo-full-white.png`, `mdg-demo/public/brand/logo-full-white.png`; the black one is also in `mdg-demo/public/brand/`. | transparent, black or white ink | **PNG only. No SVG of the lockup exists.** The generator `mdg-landing/scripts/gen-logos.mjs` recolours the black original (source lives outside the repo). |
| **The mark alone** | `mdg-landing/public/logo-mark.png` and `logo-mark-white.png` (384x392 RGBA); copies in `marketing/pamphlet/assets/`, `mdg-app/store-assets/brand/logo-mark.png`, `mdg-demo/public/brand/` | black or white on transparent | |
| **The mark as vector, drawn from primitives** | `mdg-app/assets/icon-src.svg` (1024 viewBox, white square plus ink `#111111`): 3 circles and 3 rounded bodies, an open ring (path `M654 122 A415 415 0 1 0 872 305`, 30px stroke, gap upper right), the cupped hand, a rounded sleeve cuff, one button dot. `mdg-app/assets/icon-notification.svg` is the same without the background. | `#111111` | Clean SVG. The best source for animating the mark drawing itself. |
| **The mark as vector, traced** | `mdg-client/src/components/BrandMark.tsx`: one even-odd filled path in a `viewBox="-11.5 0 1024 1024"`, painted in `currentColor`. | any | The in-app version. It thickens its ink at small sizes (`inkGrowthFor`: +4 at 36px or less, +2 up to 64px). |
| **App icon (PNG)** | `mdg-app/assets/icon.png` (1024), `adaptive-icon.png` (1024), `store-assets/icon-512.png`, `marketing/panels/icon-512.png` | black mark, **white** `#ffffff` background (`app.json` adaptive background `#ffffff`) | Measured: in `icon.png` the ink fills 840x857 of 1024 (about 83%); in `adaptive-icon.png` 632x645 (about 62%, inside Android's safe zone). |
| **Splash** | `mdg-app/assets/splash.png` (1284x2778) | mark centred on white | |
| **Android notification icon** | `mdg-app/assets/notification-icon.png` (96x96, white on transparent, thickened) | tinted `#0f172a` by Android | Fixed 12 Oct (it was an opaque square). Dealer v6 built, Play upload was waiting on the owner. **Whether that build is live is UNVERIFIED.** |
| **Chat avatar for the support chat** | drawn by `ChatAvatar.tsx`: the mark at 62% of a circle tinted `#f0f2f5`, ink `#18181b` | | Manager chat uses a lucide `Users` glyph in the same circle. |

### 4.2 Things that look like logos but are not

| Device | Where | Verdict |
|---|---|---|
| **"DK" chip** (maroon rounded square, gold or white "DK") | `kit-base.css .app-top .logo`, panels P10, P13-P15, P18, P20b, P22, P23, P26-P29 (the phones in the full Kavach film) | **Not the product.** The real app header shows the people-hand mark. A memory note says the header "now reads DK"; the current code (`AppShell`, `LoginPage`, `ChatAvatar`) uses `BrandMark`, and no "DK" string exists in `mdg-client/src`. Treat it as obsolete. |
| **Gold "M" coin** | `I76`, `QE1` (end cards of the full film and the short) | A film device. Not in the app, site or cards. |
| **"MDG" white rounded tile with maroon text** | header of every card (`.logo` 62-70px) | Exists, but only inside the cards. Fine when recreating a card. |
| **Gold diamond ◆** | site eyebrows, OG card (`public/og.png`), parent site favicon (`#080A1C` square, gold diamond) | A recurring site device, not a logo. Good small bullet for motion. |
| **Shield** | Site only: a thin gold outline `M12 2.5 4 5.6v6.2c0 4.6 3.4 8 8 9.7 4.6-1.7 8-5.1 8-9.7V5.6l-8-3.1z` drawn behind the white mark, with a gold "कवच" pill under it (`mdg-landing/src/components/Hero.tsx`, `ShieldDiagram`). A check-in-shield glyph in `Icon.tsx` (`M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3z` and `M9 12l2 2 4-4`). The Play "Compliance checks" tile shows a shield-with-check outline glyph (lucide style; read from the screenshot, not the source). | **No shield logo file exists.** "कवच" is a typographic mark (see 4.3). The hero's portals-flow-into-the-shield diagram must not be copied (it draws portals, which the public rule forbids raising). |

### 4.3 The wordmarks and the exact naming

- **MDG Services** = the company. Hindi on screen and in voice: एम-डी-जी सर्विसेज़.
- **Dealer Kavach** = the app (Play name, `app.brand`: `en: 'Dealer Kavach'`, `hi: 'डीलर कवच'`).
- **Dealer's कवच** = the product / programme (fact file §1; site, pamphlet, cards).
- The **product wordmark** is typographic: "Dealer's" in Space Grotesk 600, and "कवच" in Tiro Devanagari Hindi 400, in gold, never translated, never tracked (`KavachMark` in `mdg-demo/src/marketing/chrome.tsx`; `.kavach em` in the pamphlet).
- **Spellings in the repo that disagree.** Cards: `Dealer's कवच · @MDG Services` (credit, water, supply, ledger, load plan) and `Dealer's कवच Programme · MDG Services` (DSR redesign, film rail). Kavach card: `कवच / Kavach`. Old outro: `Dealer कवच` (no apostrophe). Play listing: `Dealer Kavach` with Kavach in teal. For the new videos use **Dealer Kavach** for the app, and `Dealer's कवच` only when quoting the programme strip of a card.
- **Tagline: "Fueling Success".** It appears on the pamphlet masthead (right, gold, Space Grotesk 600 11pt, over the Hindi line "पेट्रोल पंप डीलरों के लिए बनी सदस्यता") and on the old Veo film's outro (`marketing/panels/panels.html .tag`). It is **not** on the website, in the app, or in the Kavach films.
- Brand rule on whose face: no oil-company mark, ever. Indian Oil may be named in words.

---

## 5. What the real app screens look like (for faithful recreation)

Source: `mdg-client` code plus the four real captures at `mdg-app/store-assets/captures/*.png` (1170x2433 = 390x811 CSS px at 3x, **the current chat-first app**, fictional outlet "99Z", made-up people) and the framed `screenshots/*.png` (1080x1920).

**There is no bottom tab bar and no app-wide header any more** (`AppShell.tsx` comment, ADR 0018, shipped 13 Oct). Do not draw the Aug-Sep tab bar (चैट · रिपोर्ट · कवच · प्रोफ़ाइल) from panels P26-P29, nor the old `mdg-demo/src/screens/ChatScreen.tsx` (black outgoing bubbles, 16px radius, "ऑनलाइन" dot, a "MDG" circle). Both are outdated.

**Chat list (home)**, `ChatListPage.tsx`, capture 01: white top bar, title "Dealer Kavach" 22px / 600 at left, search and ⋮ at right. Filter chips All / Unread / Groups, 32px tall, `rounded-full`, 14px / 500, active chip grey fill. Rows: 48px round avatar (mark on `#f0f2f5`), name 16px / 500 with time 12px at right, preview 14px `#667781`, unread pill `#18181b` h20 min-w20 white 12px / 500 (the time also turns black and medium when unread). Hairline `#e9edef`. Rows seen: "Support", preview "📊 DSR · 15 October — stock variation …", "Manager chat", preview "Nozzle 3 is working again.".

**A report in the chat**, `MessageBubble.tsx`, capture 02: bar with back arrow, 40px avatar, "Support" 17px / 500, "MDG team" 13px `#667781`, ⋮. Wallpaper `#f3f2f0` with the faint doodle (84px tile of a circle, a cross, a wave, a triangle, a square, in `rgba(17,27,33,.045)`, 1.6px stroke). Date chip "Yesterday" / "Today": white, 12.5px, `rounded-lg`. A **two-image album in one white incoming bubble** (variation card and sales card side by side) plus the caption line `📊 DSR · 14 October — stock variation within limit.` and the time `9:00 am` at 11px. My reply "Thank you 🙏" in `#e7e5e4` with a single tick. Quick-reply chips above the composer: "Today's report?" and "What do I need to do?". Composer: white pill (`rounded-3xl`), "Message" placeholder, paperclip and camera (lucide, stroke 1.75), and a **48px round black mic**. The caption in Hindi is `📊 DSR · {दिन} — स्टॉक वेरिएशन सीमा में है।` (`share.ts buildDsrShareLine`). Out of limit: `… सीमा से बाहर है, कृपया देखें।`. Revised: `♻️ संशोधित DSR · … — पहले भेजी गई की जगह यही मान्य है।`.

**Tap a picture, then the viewer:** full-screen on `#000`, swipe through every picture in the chat in time order, pinch and double-tap zoom, swipe down to close, download arrow in the bar. This is the natural "zoom into the figure" gesture for a 30-second video.

**A paper request**, capture 03: an incoming bubble with a title strip ("Fire NOC", `#f0f2f5`), the text "MDG needs this from you: Fire NOC. The old one runs out this month. Please send the renewed copy. Tap "Send photo" below, or choose a file.", a full-width **black** "Send photo" button (camera icon, h44, `rounded-lg`, white 15px / 500) and an outlined "Choose file". The dealer's reply is a photo bubble, then a quoting reply "✓ Received — Weights & Measures licence". The licence image is an invented specimen with a "SPECIMEN" watermark (`capture/demo/licence-photo.jpg`).

**Warriors and points**, capture 04, in Hindi: bar "योद्धा और पॉइंट"; a segmented "आज" (black pill) / "इस महीने"; black pill button "+ पॉइंट दें", outlined "योद्धा जोड़ें"; helper "हर योद्धा को 100 पॉइंट चाहिए"; rows are white `rounded-2xl` cards with a `#e7e5e4` border: initials circle, name, role, points figure (`text-2xl font-bold tabular-nums` = 24px / 700, e.g. 104.5) over "पॉइंट" (11px `#78716c`), a pencil; chip "100 पूरे" in `#dcfce7` / `#16a34a`, 11px / 500. Other chips: "on leave" in `#fef3c7` / `#d97706`.

**Re-takeable for real:** `mdg-app/store-assets/capture/` (`stack.sh`, `seed.mjs`, `capture.mjs`, `render-cards.mts`) runs a throwaway local stack (in-memory Mongo on 27099, API on 4100, app on 5198; refuses any other database) and writes real screenshots from invented data. It is local-only and is the safe route to "actual screenshots". Its card PNGs (`capture/demo/dsr-2026-10-1{4,5}-{variation,sales}.png`) are the **old marquee design**. Redraw with `render-cards.mts` if the live card design changes.

---

## 6. The report cards, shared grammar

### 6.1 The skeleton every card follows

1. **Parchment page** `#f4ede0` behind a **cream card** `#fffdf5`, framed by a heavy maroon (6px) or gold (4px) border, radius 22-30px, soft shadow `0 24px 60px rgba(24,24,27,.16)`. Rendered 2x by Chromium (`mdg-backend/src/automation/cardRenderer.ts`, crop on `#frame`).
2. **Gold brand strip**, 34-40px, repeated text `Dealer's कवच · @MDG Services` in maroon 800, top and bottom (the DSR HEAD design repeats it down both sides as well).
3. **Maroon header**, `linear-gradient(180deg,#7f1d1d,#5c1010)`, 124px: a **white 70px rounded "MDG" tile at the left**, a centred title (English caps 38px / 800 white) over a **Hindi subtitle in gold** (21px / 600), and the **outlet code chip on the right** (gold fill, maroon text, 25px / 800).
4. **One hero figure**, the biggest thing on the card, 46-88px / 800, tabular, with a one-word verdict next to it.
5. **White tiles** with `#e7d9bf` borders, radius 14-16, 3 across, big number plus a tiny label.
6. **Maroon eyebrow labels**, 20px / 800, tracking `.06em`, Latin only, with the Hindi meaning in `inkSoft` beside them. Every English trade term carries its Hindi gloss ("the dealer hears the English words from Indian Oil but reasons in Hindi").
7. **Chips and bars for state**: pills with ✓ or ! icons; the credit utilisation bar runs gold to `#ea580c`, red when hot; a gauge in the DSR.
8. **A footer in `goldSoft`** with the date and time stamp. A hedge line ("data up to this time"; "stock variation within limit") rather than an absolute.
9. **Caveats are written, never hidden**: "not checked by us yet", "today's sales close on tomorrow's reading", "(हाथ से भरी)" for a hand-typed figure, "उदाहरण" on an illustrative card in the films.

### 6.2 Card by card

| Card | Title (English / Hindi) | Size | Hero and verdict | Source |
|---|---|---|---|---|
| **Credit & DOD** | CREDIT & DOD MONITORING / रोज़ का उधार-हिसाब | 1000px (+40 frame) | DUE AMOUNT 88px red on `#fef2f2`; green on `#f0fdf4` when in advance; `#fee2e2` when past the deadline; `#fff7ed` orange when payment may be lagging. Right panel: DUE DATE 46px. Then 3 limit tiles, utilisation bar, FORM OF LIMIT chips **DOD · CREDIT · CASH & CARRY** (active = maroon fill). Footer "DATA PREPARED AT". A festival band can replace the top strip: never show it. | `automation/sdms/report/renderCard.ts` |
| **DSR variation** | स्टॉक वेरिएशन (redesign) / STOCK VARIATION + स्टॉक की जाँच — क्या करना है (HEAD) | redesign 960px; HEAD width UNVERIFIED (its sales card was 1,360px+ wide, per memory) | A banner "स्टॉक सही है" (green) or "ध्यान दें" (red). Per product: a coloured product bar, big signed variation 64px, verdict chip, the gauge (track `#f6d6d6`, safe zone `#7fcf95`, 40px white-rimmed pin, zero line), and only when out of band a "क्या करें" box with an 8px left rule. | `services/dsr-report/cards.ts` |
| **DSR sales** | बिक्री रिपोर्ट (DSR) / DAILY SALES REPORT | same | Three tiles: yesterday's sales (green accent), "स्टॉक अभी", the month so far. Pills for delivery and testing. A readings block: per-tank dip, water, stock, and numbered meters. | same |
| **Load planner** | अगला टैंकर · Next tanker | 1000px | A coloured headline (red, amber, green, 27px), a truck block with per-fuel tiles, a fuel table, a 4-day projection with a maroon title bar, a credit line ok or warn. | `services/loadPlanner/card.ts` |
| **Ledger Watch** | OTHER MOVEMENTS / तेल-भुगतान से अलग की एंट्री | 1000px | Same skeleton. | `services/ledgerWatch/card.ts` |
| **RO supply status** | RO SUPPLY STATUS / पंप को तेल मिलने की स्थिति | 1000px | Same skeleton. | `services/roSupplyStatus/card.ts` |
| **Water ingress** | WATER INGRESS TESTING / टंकी में पानी की जाँच | 1000px | Hero COMPLIANCE % over "अनुपालन", tiles, a per-window grid. "Nothing missed" appears only against windows the service itself wrote. | `services/waterIngress/card.ts` |
| **Kavach compliance** | कवच / Kavach | 720px, cream, 1px border, radius 18 | Hero % banded: 90 and up and 75 and up green, 50 and up amber, below red; words बहुत बढ़िया / ठीक है / ध्यान दें / काम बाकी है. A blue "📷 आपसे चाहिए / We need from you" box leads. Amber "अभी N चीज़ें जाँची नहीं गई हैं". Footer "MDG टीम द्वारा जाँचा / verified by MDG". | `services/kavach/card.ts` |
| **Density** | **no card.** One chat text message with the figures. | | The new tanker's Density@15 in the reader's language. No image to imitate. | `services/ttDensity/notify.ts` |
| **Inspection reports** | **no dealer artefact.** | | The data pipeline only moves the DSR window. Nothing visual is sent. | `services/inspection-reports/README.md` |

**Which DSR design is live is UNVERIFIED.** `git status` in `mdg-backend` (17 Oct) shows `cards.ts`, `cards.test.ts` and `lib/dealerText.ts` modified and uncommitted. A memory note (12 Oct) says the redesign was "AWAITING USER REVIEW, do NOT commit, push or deploy". The Play screenshots and the capture demo PNGs, both dated 15 Oct, show the old marquee design. Most likely the old design is what dealers have today. **The owner must say which to show** (open question Q2).

Product tones on the DSR (diesel blue, petrol orange) copy the dealer's own macro workbook: "the dealer navigates by that colour before reading a word". They are accurate inside the card and a livery risk outside it (9.4).

### 6.3 What a thumbnail teaches

In the chat a card is about 330px wide (`w-[min(80%,330px)]`). The DSR redesign's own comment says 22px on a 960px card, shown about 390pt wide, is meant to be "the smallest size anything is set at" (a few labels are 18-20px). So in a video, **never show a whole card at phone width and expect it to be read**. Show the card arriving, then punch in to one tile or the verdict banner.

---

## 7. Existing motion and graphic language in the films

### 7.1 Inventory

| Piece | Format | Look | Keep or drop |
|---|---|---|---|
| **Sep marketing film** (`mdg-demo/out/marketing-{hi,en}.mp4`, `mdg-demo/src/marketing/*`) | 1080x1920 at 30 fps (Remotion), `--crf=28` | Navy field, white cards floating on it (`SHADOW_CARD`), a **segmented gold progress bar at the top** (y 46), a header lockup at y 104 (white mark 52px, hairline, "Dealer's कवच"), the stage at y 300-1560, and a **fixed caption band from y 1600**: the narration verbatim, 43-45px / 600 white, `text-wrap:balance`, 2 lines max, text-shadow. Gold chips. A tick that draws itself. Number counters (`CountUp`). Photographs turned **off** (`PHOTOGRAPHS = false`) on the founder's instruction: "keep it plain". | Keep the caption-equals-narration rule and the progress bar idea. Drop the navy. |
| **Kavach film panels** (`films/graphics-kavach`) | 1080x1920, a paused CSS clock `--T` seeked frame by frame at 24 fps, JPEG q94 | Cream or dusk plates blurred behind a maroon, amber and cream sheet; dot-grid texture `rgba(107,22,22,.13)` 6px; a phone object (716x1180, radius 76, glass glare); cards with a maroon gradient head and a 4px amber underline; **odometer** number rolls; ink **stamp** that slams down; hand-drawn **pen circle** and **tick** (SVG `pathLength=1`); **highlighter** pass; typewriter reveal by `clip-path` steps; a `rail` footer line "Dealer's कवच Programme · MDG Services" at the bottom (26px). | **The method is the same as the sample brief's `window.seek(t)`.** Keep stamp, pen-draw, highlighter, odometer. Drop plates, glow halo, overshoot easing. |
| **The short** (`films/mdg-kavach-short.mp4`, 38.6 s, 24 fps) | 1080x1920 | Live action plus **word overlays in the upper third only** (block centred at y 400, nothing below y 1344, bottom 30% left clear for the site's captions and sound button): Tiro, cream `#FFF3E2` with the first line small in gold `#E9A23B`, on a soft dark radial wash, never a box. Each fades in 0.12 s and out 0.10 s. **Frame 0 is the thumbnail and already carries the words.** | Keep the zones, the fade times, and "frame 0 carries the message". |
| **Short end card E1 / QE1** | | Cream paper, a gold word-by-word line, a flat maroon pill label, a gold chip, the **URL as the biggest line** (Space Grotesk 700, maroonDeep, gold underline), the brand lockup at the foot. **Fully static from 1.4 s** so the last frame of a forwarded mp4 carries the whole call to action. | Keep the idea. Swap the "M" coin for the real mark. |
| **Full-film contact card I74** | | Maroon-headed card, three rows: toll-free `1800-891-3496` (typed on), `mdgservices.in`, Google Play "डीलर कवच". The number is **written and never spoken** (fact file §9). | Optional for one video. See Q4. |
| **Old Veo film outro** (`marketing/panels/outro-brand.png`, `outro-app.png`) | 2160x3840 PNG | **Maroon radial wash** (`#791B1B` centre-top to `#2E0808` floor). Card 1: white full logo about 55% of the frame width at y 40%, a 120px gold rule `#E9A23B`, "Fueling Success" in gold Space Grotesk, then the Hindi tagline in cream. Card 2: a white rounded-square **app icon** tile (radius about 22%), "Dealer कवच" in white plus gold कवच, the line "ऐप आपके फ़ोन पर हम ही लगा देंगे।" (says "ऐप"; against the trade-words rule), a `mdgservices.in` outline pill, the white logo small at the foot. | The best ready-made brand end card. Reuse the layout, correct the wording. |
| **Pamphlet** (`marketing/out/*.pdf`) | A4 | Navy masthead bands, gold diamond eyebrows, numbered blocks 01-09, red-cross "what it costs you" against green-tick "with Dealer's कवच" lists, a dark "mini register" mock. | Not a motion reference. Use only for the problem and solution split device. |
| **Site** (`mdg-landing`) | web | Eases: `--ease-out-expo cubic-bezier(.16,1,.3,1)`, `--ease-out-quart (.25,1,.5,1)`, `--ease-drawer (.32,.72,0,1)`; durations press 130ms, hover 220ms, pop 280ms. **`--ease-spring (.34,1.56,.64,1)` overshoots.** | Keep the expo and quart curves. Drop the spring. |

### 7.2 Motion vocabulary already approved by the founder

- Entrances: a critically damped spring (`damping 200, mass .6, stiffness 110`, no wobble) rising 26px (`useRise`); caption rises 14px over 9 frames; `cubic-bezier(.16,.9,.24,1)` (expo-out) on the film panels.
- State changes that mean something: a tick that draws, a bar that empties toward a date, a lock that shuts, an ink stamp, a figure that rolls. The site's principle: "motion explains or confirms; it never decorates" (`PRODUCT.md` principle 5). This is in tension with a fast-paced brief; the way through is that every beat should change a fact on screen.
- Sound: UI tick on a card landing, whoosh on a cut, stamp, a deep brand hit on the reveal, a single sting on the end card. Voice leads, music ducked about 12 dB, loudness -16 LUFS, true peak -2 dB (`films/short/finish.mjs`).

### 7.3 House rules about captions and the first and last frames

- Sound-off is the majority case in forwarded video, so **the on-screen caption is the narration verbatim** (`marketing/README.md`).
- Frame 0 must carry the hook (it is the thumbnail). The last frame must carry the whole call to action.
- Logo: **not over a scene of pain.** `brandpass.mjs`: "branding a man's worst week with your own logo reads as gloating". The logo arrives with the relief.
- WhatsApp will not send a video over **16 MB** (`marketing/README.md`). The 7 Sep masters are 16.3 and 16.9 MB. The short is 18.9 MB, with separate `-whatsapp` phone copies (the full film's phone copy is 480x854). Film grain is what costs the bitrate. So: no grain, no photographic backgrounds, a master plus a phone copy at 720x1280 or less.

---

## 8. Format facts to pass on

| | Value | Source |
|---|---|---|
| Canvas | 1080x1920 portrait | every film |
| Frame rate in use | 30 (Remotion), 24 (panels and short). 60 fps with sub-frame blending has no precedent here, but seek-driven Playwright rendering does (`films/graphics-kavach/render.mjs`, 3 browsers x 3 pages, JPEG q94) | |
| Zones | top of frame y 0-640: words. Bottom 30% (from y 1344): leave clear. Side margin 70-76px (MAXW 940). Sound-button corner is bottom-right on the site | `render-overlays.mjs`, `brand.ts LAYOUT` |
| Phone logical size | 390x844 (`theme.ts SCREEN`); captures are 390x811 CSS px at 3x | |
| Device frame drawn | 716x1180, radius 76, 15px bezel `#2A2523 -> #0B0A09`, glass glare at 118 degrees (`kit-base.css .phone`); store frames use a simple black bezel and notch pill | |
| Tooling | Playwright plain `node` (not `tsx`), `ffmpeg`, `pdftoppm` all present on this Mac | |

Instagram and Shorts interface safe zones are not in the repo: **UNVERIFIED**. The repo's own rule is bottom 30% clear and words in the upper third.

---

## 9. DRAFT brand-for-motion spec

### 9.1 Palette: three colours plus black and white

Decision: **maroon / gold / cream** (family B), carried by **black and white** (family A), with one exemption.

| Role | Token | Hex | Why this value |
|---|---|---|---|
| **Maroon** (the world) | `--maroon` | `#7F1D1D` | The card header and frame the dealer receives every morning. Ladder: deep `#5C1010`, night `#2E0808`. The three steps are **one colour**. Lift `#8A2B2B` for a lit edge. |
| **Gold** (the one thing that matters) | `--gold` | `#F5A524` | The documented site "energy accent", it carries the tagline, and sits within a few points of the card gold `#f59e0b` and film amber `#E9A23B`. Pale step `#FDE68A` (the card's own subtitle gold on maroon). One gold element competes per beat. |
| **Cream** (paper) | `--cream` | `#FFFDF5` | The card paper. Page behind a card: parchment `#F4EDE0`. |
| **Black** | `--black` | `#18181B` | The app's brand token: primary button, send, unread pill, the logo's ink. The logo mark itself is `#111111`. |
| **White** | `--white` | `#FFFFFF` | App bars, incoming bubbles, tiles, type on maroon. |

**Neutral helpers (not palette, only for imitating the app):** wallpaper `#F3F2F0`, my bubble `#E7E5E4`, hairline `#E9EDEF`, meta `#667781`, bar icon `#54656F`, bubble text `#111B21`, read ticks `#53BDEB`.

**Artwork exemption.** Anything that is a faithful imitation of a real screen or card keeps its own true hexes (all of section 2.2). Verdict green `#15803D`, red `#B91C1C`, deep red `#8B1414`, amber `#B45309` exist **only** inside that artwork or as a tick or exclamation that mirrors a verdict on the real card. Do not tint the video's own backgrounds, headlines or shapes with them. This is how fidelity and a three-colour palette coexist.

**Stages (backgrounds).** Flat planes first. (1) **Maroon night**: flat `#5C1010`, or the proven three-stop wash `#791B1B -> #490E0E -> #2E0808` from the old outro if a gradient is wanted. (2) **Parchment** `#F4EDE0` behind a cream card. (3) **App white** for the inside of a phone. No navy, no photograph, no grain.

**Type colours.** On maroon: white and gold. On parchment: maroon `#7F1D1D` for the headline and black `#18181B` for body. Inside cards: ink `#1C1917` (cards only).

**Contrast, outdoors.** The audience reads in sun under a canopy on a cheap screen (`tailwind.config.ts` comment). White on `#92400E` is the only amber a white label may sit on (7.09:1). Gold `#F5A524` on maroon `#5C1010` is for large display type only.

### 9.2 Type

| Role | Face | Weights | Fallback chain |
|---|---|---|---|
| Latin display, figures, URL | **Space Grotesk** | 600, 700 | `'Space Grotesk', Inter, 'Noto Sans Devanagari', system-ui, sans-serif` |
| Latin UI imitation (app screens) | **Inter** (stand-in for Roboto) | 400, 500, 600 | `Inter, 'Noto Sans Devanagari', system-ui, sans-serif` |
| Devanagari, everywhere legibility matters (captions, kinetic words, UI) | **Noto Sans Devanagari** | 600, 700 | `'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN',system-ui,sans-serif` |
| Devanagari brand accent: the कवच mark and at most one hero word | **Tiro Devanagari Hindi** | 400 only, add a 1.4px stroke in its own colour for phone legibility | `'Tiro Devanagari Hindi','Noto Sans Devanagari','Space Grotesk',serif` |
| Card imitation | the card stack from section 3.1 verbatim | 600-800 | `'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN',system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif` |

One Latin and one Devanagari face for the video's own type: **Space Grotesk + Noto Sans Devanagari**. Tiro is the single deliberate accent, as on the site. All four are vendored in `marketing/pamphlet/fonts/` with `fonts.css`. Rules from 3.2 apply: no tracking on Devanagari, word-level kinetic reveals, line-height 1.28 or more, Indian grouping, true minus.

### 9.3 Lockups

1. **End lockup, on maroon night:** `logo-full-white.png` (640x214) at about 55% frame width, vertically near 40%; a 120px gold rule `#E9A23B`; **"Fueling Success"** in gold Space Grotesk 600, about 56px (estimated from the outro PNG, where the line spans about 45% of the frame width); optionally the Hindi tagline from the site headline, `काग़ज़ी काम, हमारे ज़िम्मे। पंप आप चलाइए।` (fact file §1), cream, Noto Sans Devanagari 500; then **`mdgservices.in` as the largest line** (Space Grotesk 700, with a gold underline), static for the last 1.4 s or more.
2. **App lockup:** a white rounded-square tile (radius about 22%) holding the black mark at about 80% of the tile (as in `icon.png`), then **"Dealer Kavach"** (Space Grotesk 700; add "कवच" in gold Tiro if the Hindi form is wanted), with a plain text line "Google Play पर · Dealer Kavach". No Play badge (see Q5).
3. **Persistent in-frame mark, only after the relief beat:** the white mark at 52px, hairline, "Dealer's कवच" (Space Grotesk 600 white, कवच in gold Tiro), centred at the top (the Sep film's header, y 104). Not over a scene of pain.
4. **Inside recreated cards only:** the white "MDG" tile and the gold strip text `Dealer's कवच · @MDG Services`.
5. **Mark animation (optional):** draw `icon-src.svg` as strokes (ring, then three people, then hand), `#111111` on white, or white on maroon. Do not stylise or recolour it into gold.

### 9.4 DOs and DON'Ts

**DO**
- Recreate the **current** app: chat-first, white bars, black send button, grey `#e7e5e4` outgoing bubble, `#f3f2f0` doodle wallpaper. The four captures in `mdg-app/store-assets/captures/` are the reference. Use the four-beat gesture: chat list row, open the chat, a card arrives as a two-image bubble, tap to zoom on one figure.
- Recreate the **card** with its true maroon header, gold strip and cream paper. Invented figures only. Mark illustrative cards "उदाहरण" as the Kavach film does.
- Say numbers in the dealer's grouping: `4,12,000 L`, `₹4,86,120`.
- Write the Hindi in the dealer's trade words, and keep the Latin trade terms Latin: DSR, SDMS, Fire NOC, Weights & Measures.
- Make the caption the narration, word for word.
- Put the hook in frame 0 and the whole call to action in the last frame; keep words in the upper third and the bottom 30% clear.
- Use expo-out or critically damped motion, and let every beat change one fact (a figure, a verdict, a date, a tick).
- Vendor the fonts and verify them before shooting a frame.
- Keep the logo off the pain beats.

**DON'T**
- Do not use navy `#2C2E80` anywhere in a recreated screen. It is the brochure's colour.
- Do not draw a green WhatsApp, a bottom tab bar, a "DK" chip, an "M" coin, or the old `ChatScreen` look.
- Do not use petrol-orange plus diesel-blue (the DSR product bars) as a scheme, saffron, a tricolour, the festival band, a canopy, a pump uniform, a tanker livery or a vehicle plate.
- Do not copy the site hero's "portals flowing into the shield". It draws portals, which the public rule forbids raising. Nor name SDMS, Dhruva and the rest as portals the work happens inside.
- Do not show an admin or internal screen, an outlet code, a SAP code, an invoice number, or a real figure. The fictional outlet "99Z" from `seed.mjs` is invented; check that it matches no real outlet (Q6).
- Do not carry over claims from the artwork: `og.png` and both pamphlets print "536 / 557", "22 windows", "about 11 hours" (all **unverified**, fact file §6).
- Do not use glow halos (`halo` keyframes in `I74`), overshoot easing (`.3,1.3,.5,1`, `.2,.9,.3,1.2`, `--ease-spring`), crossfades, grain, or a photograph behind a scene.
- Do not letter-space, uppercase-track or per-letter-animate Devanagari.
- Do not set the dark theme; it is defined and unused.
- Keep these words out of every spoken line: app, dashboard, portal, software, system, data, automatic, AI, digital, online. (The old outro card's "ऐप आपके फ़ोन पर हम ही लगा देंगे" breaks this; do not copy its wording.)

---

## 10. Choices I made between conflicting sources, and why

| # | Conflict | Choice | Why |
|---|---|---|---|
| 1 | Navy and gold (site, pamphlet, Sep film, `PRODUCT.md` "brand") against maroon, gold, cream (cards, Kavach films, end cards) against black (app) | Maroon / gold / cream plus black and white | The videos recreate the **dealer's own** screens and cards, which are black and maroon. The founder-approved Kavach films (late Sep and Oct) moved to maroon and cream. The site's navy is seen only on the web. **This overrides `PRODUCT.md`'s stated brand; confirm with the owner (Q1).** |
| 2 | Three golds: `#F5A524` (site), `#F59E0B` (cards), `#E9A23B` (films) | `#F5A524` for the video's own graphics; the card's `#f59e0b` stays inside card artwork | Documented brand token, nearest the middle. A sub-4% difference is invisible at video size. |
| 3 | ADR 0018 says green, code says black | Black | Code, `STYLE_GUIDE_V2.md` and the Play screenshots agree. |
| 4 | App font is `system-ui` (Roboto), the demo uses Inter, the site uses Space Grotesk | Inter for imitated UI, Space Grotesk for the video's own display | Roboto is not vendored; Inter is, and the tutorial videos already made the same trade. |
| 5 | Five logo-like devices: people-hand logo, "MDG" tile, "M" coin, "DK" chip, gold diamond | The people-hand logo is the only logo | It is the icon, the splash, the favicon, the pamphlet and the in-app avatar. The others are film or card devices. |
| 6 | DSR card: old marquee design against uncommitted redesign | Ask the owner; default to the old design | Old design is what the 15 Oct screenshots show; the redesign is uncommitted and unreviewed. |
| 7 | Hindi face: Tiro (Kavach films throughout) against Noto (app, cards, captions) | Noto for everything legible; Tiro for the कवच mark and at most one hero word | Matches the site's rule (Tiro for the कवच marks only) and the audience note "older eyes in sunlight, large Devanagari". |
| 8 | Brand-strip text: `…· @MDG Services` against `…Programme · MDG Services` | Use whichever the recreated card carries | Fidelity. |
| 9 | Five greens, five reds | Per-surface values inside artwork; card values for the video's own accents | Cards are the dominant artwork. |
| 10 | Site principle "calm motion" against a fast-paced brief | Expo-out and critically damped springs, every beat changes a fact | Keeps the brand's restraint without making the video slow. |

### Open questions for the owner (the prompt writer should surface these)

- **Q1.** Videos in maroon, gold and cream with black app chrome (my recommendation), or in the website's navy and gold?
- **Q2.** Which DSR card design do dealers receive today: the old gold-marquee one, or the new Hindi-only one?
- **Q3.** Is the dealer v6 build (fixed notification icon) now live on Play, so a notification frame may show the real mark?
- **Q4.** May the toll-free `1800-891-3496` appear written (never spoken) on the end card of every video, or only on some?
- **Q5.** May a Google Play badge be shown? The old note against it said "the listing returns 404". The listing has been live since 22 Sep. No badge is used anywhere today; whether Google's badge rules allow it here is **UNVERIFIED**.
- **Q6.** Is the invented outlet code "99Z" safe to show on card chips, or should the chip be hidden or replaced?
- **Q7.** Hindi only, or a Hindi and an English cut of each video? (The marketing film shipped both; the Kavach films are Hindi only.)

---

## 11. Not verified

- Which DSR card is live in dealers' chats (6.2).
- Whether the v6 app build with the fixed notification icon is live.
- Whether Noto Sans Devanagari's own Latin glyphs draw the digits when Noto leads the stack on the render box (the cards put Noto first). Not measured.
- Whether weights 800 and 900 of Noto Sans Devanagari can be vendored without changing `vendor-fonts.mjs`.
- Whether Google's Play badge may be used.
- Social-platform interface safe zones.
- Whether `99Z` collides with a real outlet code.
- The live website and the live app on a real phone: I read source and the existing assets only. I did not open either, and I did not compare Inter against Roboto pixel for pixel.
- That the hero's shield diagram is still the one on the live homepage (read from source).

## 12. Quick-reference CSS block for the build prompt

```css
:root {
  /* palette: 3 colours + black + white */
  --maroon:#7F1D1D; --maroon-deep:#5C1010; --maroon-night:#2E0808;
  --gold:#F5A524;   --gold-pale:#FDE68A;
  --cream:#FFFDF5;  --parchment:#F4EDE0;
  --black:#18181B;  --white:#FFFFFF;
  /* app imitation helpers */
  --wallpaper:#F3F2F0; --bubble-out:#E7E5E4; --hairline:#E9EDEF;
  --meta:#667781; --bar-icon:#54656F; --bubble-text:#111B21; --tick-read:#53BDEB;
  /* verdicts: only inside recreated artwork */
  --ok:#15803D; --ok-soft:#F0FDF4; --short:#B91C1C; --short-soft:#FEF2F2;
  --excess:#8B1414; --pending:#B45309; --pending-soft:#FFFBEB;
  /* type */
  --f-display:'Space Grotesk',Inter,'Noto Sans Devanagari',system-ui,sans-serif;
  --f-ui:Inter,'Noto Sans Devanagari',system-ui,sans-serif;
  --f-deva:'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN',system-ui,sans-serif;
  --f-kavach:'Tiro Devanagari Hindi','Noto Sans Devanagari','Space Grotesk',serif;
  --f-card:'Noto Sans Devanagari','Kohinoor Devanagari','Devanagari Sangam MN',system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  /* motion */
  --ease-out-expo:cubic-bezier(.16,1,.3,1); --ease-out-quart:cubic-bezier(.25,1,.5,1);
}
/* @import url('<repo>/marketing/pamphlet/fonts.css'); then await document.fonts.ready */
.hi, [lang=hi] { letter-spacing:0 !important; line-height:1.3; }
.num { font-variant-numeric:tabular-nums; }
/* en-IN grouping: n.toLocaleString('en-IN');  true minus: '−' */
```
