# UAT — WebView touch hardening (Dealer Kavach)

**Status:** v1 · **Owner:** UAT · **Last updated:** 2026-07-09
**Scope:** the touch-hardening release shipped across the two layers that make up
the **Dealer Kavach** app:

- **WEB** — `mdg-client` (the React dealer app). It ships the CSS + JS guards
  (`src/index.css`, `src/lib/touchGuards.ts`, `src/lib/useScrollLock.ts`,
  `tailwind.config.ts`) and the per-screen fixes (draggable images, 16 px inputs,
  keyboard hints, in-app lightboxes).
- **SHELL** — `mdg-app` (the Expo `react-native-webview` shell that wraps the web
  app and is what users actually install). It ships the native mirror of the same
  guards (`app/index.tsx`: `HARDENING_JS` injected at document-start, plus WebView
  props like `allowsLinkPreview`, `dataDetectorTypes`, the navigation gate, and
  the keyboard-avoidance frame).

The app is a **WebView shell, touch-only**, used by non-technical fuel-dealer
staff on **Android System WebView** and **iOS WKWebView**. This release removes
the browser affordances that read as "this is a web page" or actively broke the
shell — the headline being an image **press-and-hold-drag that started a native
drag ghost and hung the app on a tablet** — while **preserving** every gesture a
dealer actually relies on (copy a message, type/paste, the voice-note mic gesture,
lightbox, scrolling, pull-to-refresh, camera/gallery attach, keyboard avoidance).

> **Two-layer defence — why this matters for testing.** The same guards live in
> BOTH layers on purpose: the shell injects `HARDENING_JS` at document-start on
> every route, so the hardening holds **even against a stale cached web bundle**
> (`app/index.tsx:51-72, 473`). Practically, that means a passing web build is
> not proof the shipped app is hardened, and vice-versa — **these tests must be
> run inside the installed app on real devices**, not in a desktop browser.

This plan mirrors the structure of `docs/uat/staff-points-and-chat-uat.md` and
`docs/uat/uat-admin-mobile.md`: every item names a **persona**, a plain-language
**Do**, the **exact expected result**, and a **PASS ☐ FAIL ☐** box to tick. Where
a behaviour is grounded in code, the source is cited as `file:line` for whoever
wants to read along — the tester does not need to touch it.

---

## Why you cannot do this in a browser (read first)

Most of these behaviours **only reproduce inside the WebView on a real device**.
A laptop with Chrome DevTools will give you the wrong answer for almost every
item here:

- The **drag-hang** (A1/A2) is an Android **System WebView** drag-and-drop
  behaviour. It does not happen in desktop Chrome.
- The **iOS callout / link-peek / focus-zoom / AirPlay** items (A4, A5, A10, A14)
  are **WKWebView / iOS** behaviours — only a **physical iPhone/iPad** shows them.
- The **keyboard-avoidance** (B12) depends on the native shell measuring the
  on-screen keyboard — there is no keyboard in a desktop browser.

So: **install the app on real phones and tablets and run it there.** A tester with
no coding background can do every step below.

### What a non-technical tester needs

1. The **Dealer Kavach** app installed on the test device (a preview/dev build,
   TestFlight on iOS, or Expo Go pointed at the deployed client —
   `https://mdg-client-rho.vercel.app`, `app/index.tsx:62`). Ask the engineer for
   the build; you do not build it yourself.
2. A **dealer login** (see Personas). Owner and staff logins both work for the
   dealer-side tests.
3. **At least one chat that already has a photo and a voice note in it** (send one
   first if not — A1/A2/B5 need existing media to press on).
4. This document, and a pen (or tick the boxes on screen). On any **FAIL**, write
   down **which device + OS version** and **exactly what you saw** (a photo/screen
   recording is gold).

---

## Device & coverage matrix

Run the plan as **passes**, one per device. The minimum bar is one Android phone
**and** one Android tablet. Add iPhone + iPad wherever available — several items
(🍎) are **only** verifiable on physical Apple hardware.

| Device (example)            | Class    | OS            | Required? | Notes                                                                                   |
| --------------------------- | -------- | ------------- | --------- | --------------------------------------------------------------------------------------- |
| Android phone (~6", 1080p)  | 📱 small | Android 11–14 | **Yes**   | Everyday dealer device. Run the whole plan.                                             |
| **Android tablet (~10")**   | 🖥️ large | Android 12–14 | **Yes**   | **Where the drag-hang was first seen — A1 & A2 MUST run here.** Run the whole plan.     |
| Android phone, Android 15   | 📱 small | Android 15    | If avail. | Edge-to-edge keyboard case — B12 is most likely to regress here (`app/index.tsx` note). |
| iPhone (physical)           | 📱 small | iOS 16+       | Strongly  | Only place to verify 🍎 items: A4, A5, A10, A14, and iOS pinch (A8).                    |
| iPad (physical)             | 🖥️ large | iPadOS 16+    | If avail. | iOS large-screen; re-run A1/A2 and the 🍎 items on a big screen.                        |
| Low-end Android (<2 GB RAM) | 📱 small | Android 9–11  | If avail. | Confirms nothing hangs/janks on the slow devices dealers actually own.                  |

**Legend used throughout**

- 🔴 **Headline / zero-regression** — a FAIL here blocks the release.
- 🍎 **iOS-only** — needs a **physical** iPhone/iPad; not reproducible on Android or in a browser.
- 🤖 **Android-only** behaviour.
- 🖥️ **Run on the tablet** (large screen) specifically.
- 📱 **Phone** is sufficient (but no harm running on tablet too).

---

## Personas under test

| Persona | Role                      | Login (adjust to your env)         | Surface       |
| ------- | ------------------------- | ---------------------------------- | ------------- |
| Ramesh  | `dealer-owner` (non-tech) | `owner@e02.test` / `password123`   | Dealer Kavach |
| Sunita  | `dealer-staff` "Manager"  | `manager@e02.test` / `password123` | Dealer Kavach |

Ramesh and Sunita belong to the **same** dealer, so either can drive the chat and
staff-points tests. The client's bottom bar has four tabs — **Chat, Reports,
Kavach, Profile**; staff-points lives under **Profile → Manage staff**
(`mdg-client/src/AppShell.tsx:84-91`, `ProfilePage.tsx` route `App.tsx:80`).

---

## Section A — Bugs that should now be FIXED

Each of these was a browser affordance leaking into the app. The expected result
is always "the browser behaviour **does not happen** any more."

### A1 — 🔴🖥️ Press-and-hold-drag an INLINE chat image does NOT hang the app (TABLET)

- **Persona:** Ramesh · **Device:** **Android tablet** (the device the bug was
  first seen on). Repeat on iPad if available.
- **Do:**
  1. Open a chat that has a **photo** in the message list (don't open it full-
     screen yet — leave it as the thumbnail inside a bubble).
  2. **Press and hold** your finger on the image for ~1 second, then **drag** your
     finger slowly across the screen and around, as if trying to fling it. Try it
     2–3 times.
  3. Lift your finger. Now scroll the chat, tap the composer, send a message.
- **Expected:** **No ghost/translucent copy of the image follows your finger.**
  The app does **not** freeze — after you lift, scrolling and typing work
  immediately. (Before this release, a ghost image followed the finger and the
  app locked up.)
- **Grounded in:** capture-phase `dragstart`/`drop`/`dragover` preventers in both
  layers (`mdg-client/src/lib/touchGuards.ts:26-29`, `app/index.tsx:61-63`), CSS
  `-webkit-user-drag:none` on `img` (`index.css:80-82`), and per-image
  `draggable={false}` (`AttachmentPreview.tsx:297`).
- **PASS ☐ FAIL ☐**

### A2 — 🔴🖥️ Press-and-hold-drag the FULLSCREEN lightbox image does NOT hang the app (TABLET)

- **Persona:** Ramesh · **Device:** **Android tablet** (repeat on iPad if avail).
- **Do:**
  1. In the chat, **tap the photo** so it opens full-screen (the lightbox, black
     backdrop).
  2. **Press and hold** on the big image and **drag** your finger around for a few
     seconds, 2–3 times.
  3. Lift, then **tap the backdrop (or the X)** to close.
- **Expected:** No ghost image follows the finger; the app stays responsive; the
  lightbox still closes normally on backdrop/X. (This is the same headline bug on
  the other surface where an image appears large.)
- **Grounded in:** `MessageList.tsx:240` lightbox `<img draggable={false}
onDragStart={preventDefault}>` plus the document-level guards above.
- **PASS ☐ FAIL ☐**

### A3 — Avatars and staged-attachment thumbnails can't be dragged either

- **Persona:** Ramesh · **Device:** any.
- **Do:** Press-and-hold-drag (a) a user **avatar** in the chat header/list, and
  (b) a **photo you've attached but not yet sent** (the little thumbnail chip in
  the composer).
- **Expected:** Neither produces a drag ghost; nothing hangs.
- **Grounded in:** `Avatar.tsx` (`draggable={false}`), `AttachmentPreview.tsx:131`
  (staged chip).
- **PASS ☐ FAIL ☐**

### A4 — 🍎 iOS long-press on an image shows NO "Save Image / Copy" callout

- **Persona:** Ramesh · **Device:** **physical iPhone/iPad**.
- **Do:** Long-press (hold ~1s) on a chat photo (inline and in the lightbox).
- **Expected:** **No** iOS grey "Save Image / Copy / Share…" popup appears. The
  image just sits there.
- **Grounded in:** `-webkit-touch-callout:none` on `html` and media
  (`index.css:73, 82`); shell `allowsLinkPreview={false}` (`app/index.tsx:476`).
- **PASS ☐ FAIL ☐**

### A5 — 🍎 iOS long-press on a link shows NO preview "peek/pop"

- **Persona:** Ramesh · **Device:** **physical iPhone/iPad**.
- **Do:** Find any link/tappable text in the app (e.g. a document link on a record
  card). Long-press it.
- **Expected:** **No** floating link-preview card ("peek") appears; nothing pops
  up. A normal tap still activates it (see B13).
- **Grounded in:** `allowsLinkPreview={false}` (`app/index.tsx:476`), callout
  suppression on `a` (`index.css:80-82`).
- **PASS ☐ FAIL ☐**

### A6 — 🤖 Android long-press on an image shows NO "Save image / Copy link" menu

- **Persona:** Ramesh · **Device:** **Android** phone and tablet.
- **Do:** Long-press a chat photo and a link.
- **Expected:** **No** Android context menu ("Save image", "Copy link address",
  "Open in new tab") appears.
- **Grounded in:** capture-phase `contextmenu` preventer that **exempts editable
  fields only** (`touchGuards.ts:33-42`, `app/index.tsx:65-70`).
- **PASS ☐ FAIL ☐**

### A7 — Tapping buttons shows NO grey/blue highlight flash

- **Persona:** Ramesh · **Device:** any.
- **Do:** Tap around — nav tabs, Send, the mic, list rows.
- **Expected:** No square grey/blue rectangle flashes behind your finger on tap.
  Buttons still give a **deliberate colour press** (a brief darker shade) so a tap
  clearly registers — that is intended feedback, not the old flash.
- **Grounded in:** `-webkit-tap-highlight-color:transparent` (`index.css:72`);
  intentional `active:` press states per button variant (`Button.tsx` VARIANTS).
- **PASS ☐ FAIL ☐**

### A8 — Pinch-to-zoom does NOT zoom the page

- **Persona:** Ramesh · **Device:** phone + tablet; **also a physical iPhone** for the iOS path.
- **Do:** Put two fingers on the chat and pinch out / pinch in.
- **Expected:** The whole app does **not** zoom in/out like a web page; layout
  stays put. (On iOS this is the `gesturestart` guard; on Android the viewport /
  `touch-action` handles it — verify on both.)
- **Grounded in:** `gesturestart` preventer (`touchGuards.ts:31`,
  `app/index.tsx:64`), `touch-action:manipulation` (`index.css:105`).
- **PASS ☐ FAIL ☐**

### A9 — Double-tap does NOT zoom (and taps feel instant)

- **Persona:** Ramesh · **Device:** any.
- **Do:** Double-tap quickly on a message bubble / a button.
- **Expected:** No zoom-in on double-tap. Single taps on buttons feel immediate
  (no ~300 ms delay).
- **Grounded in:** `touch-action:manipulation` on interactive controls
  (`index.css:99-105`).
- **PASS ☐ FAIL ☐**

### A10 — 🍎 Tapping a text field does NOT zoom the screen in (inputs ≥ 16 px)

- **Persona:** Ramesh · **Device:** **physical iPhone**.
- **Do:** Tap into: the **chat composer**, the **login email/password**, the
  **Add worker → name** field, and the **Give points → search work** / **₹ amount**
  fields.
- **Expected:** The screen does **not** auto-zoom when the field focuses. Text in
  the field is comfortably readable (iOS only auto-zooms when a field's font is
  under 16 px; every field here is now ≥ 16 px).
- **Grounded in:** global `input,textarea,select{font-size:16px}` backstop
  (`index.css:107-113`) plus per-field `text-base` (`Input.tsx:16`,
  `Composer.tsx:533`, `GivePointsFlow.tsx` amount field).
- **PASS ☐ FAIL ☐**

### A11 — Scrolling the chat does NOT rubber-band the whole app / bounce a screen behind it

- **Persona:** Ramesh · **Device:** any.
- **Do:**
  1. In the chat, scroll the message list hard past the **top** and past the
     **bottom**.
  2. Open **Give points** (Profile → Manage staff → Give points) and, inside that
     full-screen sheet, scroll its body past the ends.
- **Expected:** The inner list bounces/stops on its own; the **page behind it does
  not scroll or bounce** with it (no "scroll chaining"). Note this is _inner_
  overscroll only — the top-of-app pull-to-refresh (B9) is deliberately still on.
- **Grounded in:** `overscroll-contain` on inner scrollers (`MessageList.tsx:186`,
  `Composer.tsx:441`, `GivePointsFlow.tsx:238`, `FinalizeSubmitSheet.tsx`), plus
  `useScrollLock` pinning the page behind full-screen staff sheets
  (`useScrollLock.ts`, used in `GivePointsFlow.tsx:63`, `FinalizeSubmitSheet.tsx`,
  `EditWorkerDialog.tsx`).
- **PASS ☐ FAIL ☐**

### A12 — Keyboard behaves right in each field (no wrong auto-capitalise / auto-correct / spell squiggle)

- **Persona:** Ramesh · **Device:** any (best felt on a phone keyboard).
- **Do:** Tap into each field and start typing one character:
  1. **Login → email** — type `abc`.
  2. **Give points → search work** — type a work name.
  3. **Add worker → name** and **designation** — type a name.
- **Expected:**
  - **Email:** keyboard does **not** capitalise the first letter, no auto-correct,
    no red spell-squiggle (`LoginPage.tsx:92-94`).
  - **Search work:** no auto-correct/capitalise; the keyboard's return key reads
    **Search** (`GivePointsFlow.tsx:409-414`).
  - **Name / designation:** capitalises **Each Word** (name-style), no spell
    squiggle (`AddEmployeeForm.tsx`, `EditWorkerDialog.tsx`).
- **PASS ☐ FAIL ☐**

### A13 — Opening a file / external link goes to the OS, and the app stays loaded (does NOT dump you on a blank page)

- **Persona:** Ramesh · **Device:** any.
- **Do:**
  1. In chat, find a **record/report card** and tap **view/download the file**
     (or, on Profile → Manage staff → Past submissions, tap **View hardcopy** —
     note that one opens an _in-app_ lightbox, see B6).
  2. If any card exposes a raw document/PDF/signed-file link, tap it.
- **Expected:** The file/PDF opens in the **OS** (browser / PDF viewer) or an
  in-app viewer — and when you come **back**, the Dealer Kavach app is **still on
  the same screen**, still logged in. You are **never** left staring at a blank
  white page or a raw file that replaced the whole app.
- **Grounded in:** navigation gate keeps client-origin/blob/data in the WebView
  and hands everything else to the OS (`onShouldStartLoad`, `app/index.tsx:268-283`);
  `window.open`/`target=_blank` routed to the OS (`onOpenWindow`,
  `app/index.tsx:287-290`, with `setSupportMultipleWindows={false}`); iOS
  downloads handed off (`onFileDownload`, `app/index.tsx:294-297`).
- **PASS ☐ FAIL ☐**

### A14 — 🍎 A voice note does NOT offer to cast / AirPlay and shows no lock-screen "Now Playing" tile

- **Persona:** Ramesh · **Device:** **physical iPhone** (AirPlay needs a real
  receiver, e.g. Apple TV / HomePod / AirPlay speaker on the same network).
- **Do:**
  1. Play a received **voice note** in the chat.
  2. While it plays, open **Control Center** and look at the audio/AirPlay tile;
     also glance at the **lock screen**.
- **Expected:** There is **no** "Now Playing" media tile for the voice note, and
  **no** AirPlay route offering to send it to nearby devices. (A private voice note
  must not leak to a room speaker.) Playback itself still works locally (B5).
- **Grounded in:** `disableRemotePlayback`, `x-webkit-airplay="deny"`, and
  `mediaSession.metadata=null` on the voice `<audio>` (`AttachmentPreview.tsx:186-195`).
- **PASS ☐ FAIL ☐**

### A15 — A tapped button does NOT stay stuck in a highlighted state

- **Persona:** Ramesh · **Device:** any.
- **Do:** Tap a button (e.g. a nav tab or Send), then move your finger away and
  look at it.
- **Expected:** The button returns to normal — it does **not** stay stuck looking
  "hovered"/highlighted after the tap (a classic touch bug where `:hover` latches).
- **Grounded in:** Tailwind `future.hoverOnlyWhenSupported` gates `hover:` to real
  pointers (`tailwind.config.ts:8`); touch feedback comes from `active:` states
  instead (`Button.tsx`).
- **PASS ☐ FAIL ☐**

---

## Section B — Things that must STILL WORK (must-preserve)

A FAIL in this section is a **regression** and is unacceptable — these are the
gestures dealers depend on every day. The whole point of the release is to remove
the bad affordances **without** breaking any of these.

### B1 — 🔴 Copy a chat message's text (long-press → Copy) — BOTH platforms

- **Persona:** Ramesh · **Device:** **Android phone, Android tablet, AND a
  physical iPhone** (this is the highest-risk item — the context-menu guard could
  interfere with selection on some Android builds, so test widely).
- **Do:**
  1. Long-press on the **text of a message bubble** (a text message, not an image).
  2. Use the popup/handles to select the text and tap **Copy**.
  3. Tap the composer and **paste**.
- **Expected:**
  - **iOS:** long-press shows the **Copy** callout on the bubble text → Copy works.
  - **Android:** long-press **selects** the text and the selection toolbar (with
    **Copy**) appears → Copy works.
  - The pasted text matches the message. (Note: the message _body_ re-enables
    selection + callout on purpose, even though the rest of the app chrome does
    not — verify you cannot select random UI labels, only message text and inputs.)
- **Grounded in:** message body carries `select-text [-webkit-touch-callout:default]`
  (`MessageBubble.tsx:126`); chrome is `user-select:none` scoped to `#root`
  (`index.css:84-87`); the `contextmenu` guard covers everything except editable
  fields, so selection on the body is the one surface to confirm survives.
- **PASS ☐ FAIL ☐**

### B2 — Type AND paste in the chat composer

- **Persona:** Ramesh · **Device:** any.
- **Do:** In the composer, type a sentence. Then long-press in the composer and use
  the **Paste** / **Select All** popup; paste the text you copied in B1.
- **Expected:** Typing works; the long-press **Paste/Select** menu **does** appear
  in the composer (editable fields are exempted from the guards); paste inserts the
  text.
- **Grounded in:** `input,textarea,[contenteditable]{user-select:text;
-webkit-touch-callout:default}` (`index.css:89-95`); `contextmenu` guard exempts
  editable fields (`touchGuards.ts:37-39`).
- **PASS ☐ FAIL ☐**

### B3 — Type AND paste in login + forms

- **Persona:** Ramesh · **Device:** any.
- **Do:** On the **login** screen paste an email into the email field and type the
  password. Then on **Profile → Team** (owner adds a teammate) type name/email and
  confirm the temp-password field does not silently autofill your own password.
- **Expected:** Typing and paste work in every field; the login email field does
  not auto-capitalise (A12); the teammate temp-password field is treated as a new
  credential (no autofill of the owner's own login).
- **Grounded in:** `LoginPage.tsx:89-95`; `ProfilePage.tsx` Team form
  (`autoComplete="new-password"` on temp password).
- **PASS ☐ FAIL ☐**

### B4 — 🔴 The press-and-hold voice-note MIC gesture (hold, slide-up-to-lock, slide-left-to-cancel)

- **Persona:** Sunita · **Device:** any (grant mic permission when asked).
- **Do:** With the composer empty:
  1. **Press and hold** the **mic** button and speak — a recording UI should
     appear with a timer.
  2. While still holding, **slide your finger UP** to the lock indicator and lift —
     recording should **lock** (keeps recording hands-free).
  3. Record again; this time **slide your finger LEFT** to the cancel/trash target
     and lift — recording should **cancel** (nothing sent).
  4. Record once more, then **Send**.
- **Expected:** All three gestures behave exactly as before. Critically, the
  slide-up and slide-left **do not** trigger any drag ghost, text selection, or
  context menu, and the app does not hang. (The mic gesture uses touch/pointer
  moves, which the drag guards do **not** touch — only HTML5 drag-and-drop is
  cancelled — so it must be unaffected.)
- **PASS ☐ FAIL ☐**

### B5 — Play a received voice note and scrub its waveform

- **Persona:** Ramesh · **Device:** any.
- **Do:** Tap **play** on a received voice note; let it play; **drag along the
  waveform** to scrub to a different point; play again.
- **Expected:** It plays audibly; scrubbing moves the playback position; no
  browser media controls, download menu, or context menu appears on the waveform.
  (Cast/AirPlay is suppressed per A14 but **local playback is untouched**.)
- **Grounded in:** `AttachmentPreview.tsx` `VoiceMessage` (playback + scrub logic
  intact; only the remote-playback route stripped, `:186-195`).
- **PASS ☐ FAIL ☐**

### B6 — Open the image lightbox and close it (tap backdrop / X)

- **Persona:** Ramesh · **Device:** any.
- **Do:**
  1. Tap a chat photo → it opens full-screen.
  2. Close it by **tapping the dark backdrop**; open again and close with the **X**.
  3. Also open **Profile → Manage staff → Past submissions → View hardcopy** and
     confirm it opens an **in-app** full-screen viewer (not the OS browser) and
     closes on backdrop/X.
- **Expected:** Lightbox opens on tap and closes both ways, on both the chat image
  and the hardcopy viewer. The hardcopy specifically opens **inside the app** (it
  used to open a new browser tab).
- **Grounded in:** chat lightbox (`MessageList.tsx:237-244`); hardcopy in-app
  lightbox that replaced a `target=_blank` link (`StaffPage.tsx:187, 233, 246-260`).
- **PASS ☐ FAIL ☐**

### B7 — Scroll the message list smoothly

- **Persona:** Ramesh · **Device:** any (feel it on the tablet too).
- **Do:** Fling-scroll up and down through a long chat; scroll to the top to load
  older messages.
- **Expected:** Smooth momentum scrolling; older messages load; no jank, no stuck
  scroll, no accidental zoom.
- **Grounded in:** `MessageList.tsx:186` (scroll container; `overscroll-contain`
  added but vertical scrolling preserved).
- **PASS ☐ FAIL ☐**

### B8 — Scroll the staff sheets (Give points, Finalize, Edit worker)

- **Persona:** Sunita · **Device:** any.
- **Do:** Open **Give points** and scroll through the worker/work lists; open the
  **Finalize submit** sheet and scroll its body; open **Edit worker**.
- **Expected:** Each sheet's body scrolls normally; the page behind does not scroll
  or peek through (A11); nothing hangs; forms are usable.
- **Grounded in:** `overscroll-contain` + `useScrollLock` on these sheets
  (`GivePointsFlow.tsx:63, 238`, `FinalizeSubmitSheet.tsx`, `EditWorkerDialog.tsx`).
- **PASS ☐ FAIL ☐**

### B9 — 🔴 Native pull-to-refresh still works

- **Persona:** Ramesh · **Device:** **Android** phone + tablet (native
  pull-to-refresh is the shell's Android feature).
- **Do:** From the **top** of a scrollable screen, pull down and release.
- **Expected:** The native pull-to-refresh spinner appears and the content
  reloads. (This is why overscroll was deliberately NOT locked on the whole page —
  only on inner scrollers.)
- **Grounded in:** `pullToRefreshEnabled` on the WebView (`app/index.tsx:501`);
  overscroll left off `html/body` on purpose (`index.css:62-67` comment).
- **PASS ☐ FAIL ☐**

### B10 — Attach a photo via the CAMERA

- **Persona:** Ramesh · **Device:** any (grant camera permission).
- **Do:** In the composer tap the attach/camera control → choose **Camera** →
  take a photo → confirm the thumbnail appears staged → **Send**.
- **Expected:** The OS camera opens, the photo comes back as a staged thumbnail,
  and sends. The staged thumbnail can't be drag-ghosted (A3) but is otherwise fine.
- **Grounded in:** file-picker/camera bridge in the shell (`app/index.tsx`
  `onFileDownload`/file-input handling; camera permission ensured on mount).
- **PASS ☐ FAIL ☐**

### B11 — Attach a photo via the GALLERY

- **Persona:** Ramesh · **Device:** any.
- **Do:** Same as B10 but choose **Gallery/Photos**; pick an existing image
  (try picking two if the picker allows) → **Send**.
- **Expected:** The OS gallery opens, the selected photo(s) stage and send.
- **PASS ☐ FAIL ☐**

### B12 — 🔴 The on-screen keyboard does NOT cover the chat composer

- **Persona:** Ramesh · **Device:** **Android phone + tablet, an Android 15 phone
  if available, and a physical iPhone.**
- **Do:** Open a chat and **tap the composer** so the keyboard comes up. Type a few
  lines so the composer grows.
- **Expected:** The composer (text box + Send) stays **visible directly above the
  keyboard** — it is never hidden behind it. When you dismiss the keyboard the
  layout settles back with no gap or overlap. Test in **portrait and landscape**.
- **Grounded in:** native keyboard-avoidance frame that measures the keyboard
  overlap and shrinks the WebView above it (`app/index.tsx` `kbOverlap` +
  `paddingBottom`, `:124, 441`) working with the web `--vvh` frame
  (`AppShell.tsx:64`, `useKeyboardViewport.ts`). **Android 15 edge-to-edge is the
  highest-risk case** — verify there specifically if you can.
- **PASS ☐ FAIL ☐**

### B13 — A record-card / document link actually OPENS (window.open path)

- **Persona:** Ramesh · **Device:** any.
- **Do:** Tap a control that opens a document/report file (a record card's
  view/download, or any link that would open a new tab on the web).
- **Expected:** The file/link **opens** (in the OS browser/viewer) — it does **not**
  silently do nothing, and it does **not** replace the app. (This is the positive
  side of A13: `window.open`/`target=_blank` are routed to the OS instead of being
  swallowed by Android System WebView.)
- **Grounded in:** `onOpenWindow` + `setSupportMultipleWindows={false}`
  (`app/index.tsx:287-290, 494`).
- **PASS ☐ FAIL ☐**

### B14 — 🤖 Android hardware BACK still walks chat history, then exits

- **Persona:** Ramesh · **Device:** **Android** phone/tablet.
- **Do:** Navigate a few screens deep (e.g. Chat list → a chat → open a photo).
  Press the **hardware/gesture Back** button repeatedly.
- **Expected:** Back steps you back through the in-app screens/history in order,
  and only exits the app once there's nowhere left to go back to — it does **not**
  drop straight out of the app on the first press.
- **Grounded in:** `BackHandler` walking WebView history (`app/index.tsx`
  "Android hardware back" effect).
- **PASS ☐ FAIL ☐**

---

## Section C — Suggested run order (fast path for a tester)

If you only have limited time on each device, run this order — it front-loads the
release-blockers:

1. **A1, A2** on the **tablet** (headline drag-hang — do these first).
2. **B1** copy-a-message on **every** device (highest regression risk).
3. **B4** the voice-note mic gesture; **B12** keyboard doesn't cover composer.
4. **B9** pull-to-refresh; **B10/B11** camera + gallery attach.
5. The rest of A (fixed bugs) top-to-bottom.
6. The rest of B (still-works) top-to-bottom.
7. On a **physical iPhone**: A4, A5, A8 (iOS pinch), A10, A14.

---

## Appendix — Static smoke check (done while writing this plan)

These were verified by reading the code, not by running the app. They confirm the
release is actually wired up and the labels the changed screens reference exist —
they are **not** a substitute for the device runs above.

**Both change sets are applied to their working trees**

- `mdg-client`: new files present — `src/lib/touchGuards.ts`,
  `src/lib/useScrollLock.ts`; guards installed before first paint
  (`src/main.tsx:18`); hardening CSS block present (`src/index.css:62+`); Tailwind
  `future.hoverOnlyWhenSupported:true` (`tailwind.config.ts:8`).
- `mdg-app`: `HARDENING_JS` present and injected at document-start
  (`app/index.tsx:77, 473`); `allowsLinkPreview={false}` (`:476`),
  `dataDetectorTypes="none"` (`:477`); navigation gate + external-open handlers
  wired (`onShouldStartLoad :268`, `onOpenWindow :287`, `onFileDownload :294`);
  keyboard-avoidance (`kbOverlap :124`, `paddingBottom :441`); `pullToRefreshEnabled`
  (`:501`). App identity confirms this is **Dealer Kavach** (`app.json`
  name/scheme/package `in.mdgservices.dealerkavach`).

**Every i18n label referenced by the changed screens exists — with English AND
Hindi** (checked in `mdg-client/src/lib/i18n.ts`):

| Key                                 | Used by (changed screen)                   | Line |
| ----------------------------------- | ------------------------------------------ | ---- |
| `common.cancel`                     | Hardcopy lightbox X aria-label (StaffPage) | 26   |
| `auth.email`                        | Profile → Team email field                 | 51   |
| `auth.emailPlaceholder`             | Login email field                          | 52   |
| `profile.fullName`                  | Profile → Team name field                  | 323  |
| `profile.tempPassword`              | Profile → Team temp-password field         | 324  |
| `staff.form.namePlaceholder`        | Add/Edit worker name                       | 411  |
| `staff.form.designationPlaceholder` | Add/Edit worker designation                | 416  |
| `staff.give.searchWork`             | Give points → search work                  | 432  |
| `staff.amountRupees`                | Give points → ₹ amount (aria-label)        | 488  |
| `staff.enterAmount`                 | Give points → ₹ amount placeholder         | 489  |
| `staff.hardcopyPhoto`               | Finalize sheet hardcopy preview            | 528  |
| `staff.viewHardcopy`                | Past submissions "View hardcopy" button    | 592  |
| `chat.placeholder`                  | Composer                                   | 80   |

No changed screen references a missing/undefined i18n key. (Cross-cutting: switch
the client language toggle to Hindi on any screen you test and confirm nothing
overflows in Devanagari — same X1 check as `staff-points-and-chat-uat.md`.)

**Not verifiable statically (must be device-run):** every Section A/B behaviour
above — they are WebView/OS runtime behaviours with no meaningful desktop-browser
or unit-test proxy.
