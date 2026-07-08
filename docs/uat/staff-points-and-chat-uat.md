# UAT — Staff points (draft → submit), chat capture & voice, admin controls

**Status:** v1 · **Owner:** UAT · **Last updated:** 2026-07-08
**Scope:** the large feature batch just shipped across the three surfaces —
`mdg-client` (dealer web app), `mdg-admin` (ops portal), and `mdg-app` (Expo
WebView shell). It covers:

- **Give points as a draft** that accumulates in a "Pending submission" panel and
  only reaches the leaderboard on a **final submit with a mandatory hardcopy
  photo** — with a draft that is **never lost** (reload / kill / offline).
- **HSD / XTRA GREEN ₹-amount** works (a rupee field, not a ± counter).
- **Editable roster** (rename / soft-remove / reactivate).
- **Chat camera capture** (the fixed Android-WebView bug) and **WhatsApp-style
  voice messages** (press-and-hold, slide-to-cancel, tap-to-lock, playback).
- **Tablet / wide responsiveness** and **low-end image handling** (compression).
- **Admin** full staff control (award / undo / view draft / reconcile hardcopy)
  and **per-dealer work list** overrides.
- **Super-admin** global work-list defaults page.
- **Android app** camera + mic permissions, camera capture in chat + Kavach, and
  offline/reconnect warmth.

This plan mirrors the structure of `docs/UAT_PLAN.md` and
`docs/specs/UAT_message-first-and-admin-management.md`: every scenario names the
**persona**, **preconditions**, **numbered plain-language steps**, an **expected
result**, and a **PASS / FAIL** box to tick during a session. It is a runbook —
it does not modify product code. Where a control's exact behaviour is grounded in
the code, the source is cited as `file:line` so a tester can read along.

The steps are written for a **non-technical, change-resistant fuel-dealer user**
on the client side, and for an **internal ops admin / super-admin** on the admin
side. Read the plain sentences; the `file:line` citations are for whoever wants to
verify, not something the dealer needs to touch.

---

## How to run locally (preamble)

From the repo README ("Quick start"). You need the meta repo plus the service
repos cloned side by side.

```bash
# From the mdg-service workspace root:
nvm use                      # Node 20 (.nvmrc)
npm install                  # npm workspaces resolves @dk/shared

# Backend env (MongoDB URI, JWT secret, S3, CORS). Mongo 7+ must be reachable.
cp mdg-backend/.env.example mdg-backend/.env
#   edit mdg-backend/.env  — S3/MinIO must be configured, because the hardcopy
#   photo and chat attachments use presigned uploads.

# Seed the admin + sample dealers/members/workers (idempotent; --reset wipes first):
npm run seed --workspace mdg-backend
#   or a clean slate:  npm run seed --workspace mdg-backend -- --reset

# Run everything: backend :4000, admin :5173, client :5174
npm run dev
```

Then open:

- **Admin portal:** http://localhost:5173 — `admin@dealerkavach.local` / `Admin@12345`
- **Dealer client:** http://localhost:5174 — `owner@<code>.test` / `password123`

Before starting, gate on the backend smoke check:
`bash mdg-backend/scripts/smoke.sh http://localhost:4000` (see `docs/UAT_PLAN.md`).

> **Storage matters here.** Unlike the message-first UAT, this batch exercises
> **file uploads** end to end (hardcopy photo, camera photo, voice note). If S3 /
> MinIO is not reachable, the presign step fails and the finalize / send is
> blocked — that is an environment problem, not a test failure. Confirm uploads
> work with C1-chat first.

### Where the client screens live (navigation map for the dealer)

The dealer client's **bottom bar has four tabs**: **Chat, Reports, Kavach,
Profile** (`mdg-client/src/AppShell.tsx:84-91`). There is **no "Staff" tab**. The
staff-points screen is reached from **Profile → "Manage staff"** and that row is
only shown to `dealer-owner` and `dealer-staff` roles
(`ProfilePage.tsx:380-381, 436-451`, route `App.tsx:80` `/staff`). Every client
scenario below that starts "open Staff points" means: **Profile tab → Manage
staff**.

---

## Personas under test

| Persona | Role                      | Identity used in steps                                        | Surface          |
| ------- | ------------------------- | ------------------------------------------------------------- | ---------------- |
| Ramesh  | `dealer-owner` (non-tech) | `owner@e02.test` / `password123` (Northern Lights Petrol E02) | mdg-client / app |
| Sunita  | `dealer-staff` "Manager"  | `manager@e02.test` / `password123` (Northern Lights Petrol)   | mdg-client / app |
| Arjun   | `admin` (regular ops)     | `admin@dealerkavach.local` / `Admin@12345`                    | mdg-admin (web)  |
| Meera   | `admin` + **super-admin** | a super-admin User (see `useIsSuperAdmin`)                    | mdg-admin (web)  |

Ramesh and Sunita belong to the **same** dealer (Northern Lights Petrol, E02) and
both can manage staff & points. Arjun is a plain admin (must **not** see the
Work-list defaults nav item). Meera is a super-admin (sees all nav, including
**Work list**).

> A "worker" / "warrior" in these steps is a pump employee on the dealer's roster
> (`Employee`), the person who earns reward points — not an app login.

---

## Cross-cutting checks (run opportunistically throughout)

### X1 — Bilingual (English / Hindi) — every dealer-facing screen

- **Persona:** Ramesh · **Where:** the language toggle in the client header
  (`AppShell.tsx:58`, `LanguageToggle`). `pick(lang, en, hi)` chooses the string
  (`i18n.ts:610`).
- **Do:** On each client screen you test below, tap the **language toggle** once
  to switch EN↔HI and confirm the labels, buttons, hints, and the work names
  translate (e.g. "Sell HSD / XTRA GREEN" ↔ "HSD / XTRA GREEN बेचना",
  `staffWorkCatalog.ts:293-294`). Point values, ₹ amounts and worker names stay
  as-is. Nothing should overflow or clip in Hindi (Devanagari is taller).
- **Pass:** both languages read naturally; no `staff.someKey` raw keys leak; no
  layout breakage. **PASS ☐ FAIL ☐**

### X2 — Wide / tablet responsiveness — the app is not a tiny centred column

- **Persona:** any · **Where:** the whole client shell.
- **Do:** Open the client on a tablet or a wide desktop browser (≥ 1024 px).
- **Expected:** the content column widens in steps — `max-w-md` on a phone,
  `md:max-w-2xl`, `lg:max-w-3xl` on wider screens (`AppShell.tsx:48, 64, 83`). It
  is a comfortably wider column, **not** a phone-width sliver stranded in the
  middle of a huge blank page, and **not** edge-to-edge full-bleed. Header, main,
  and the bottom nav all share the same max-width so they line up. Covered in
  depth by **C7**. **PASS ☐ FAIL ☐**

---

## Scenario index

| #   | Scenario                                                                  | Persona       | Feature |
| --- | ------------------------------------------------------------------------- | ------------- | ------- |
| C1  | Give points → "Add to submission" (draft, not leaderboard)                | Ramesh        | 1       |
| C2  | Draft is never lost — reload / kill app / offline mid-edit                | Ramesh        | 2       |
| C3  | Final submit needs a hardcopy photo; leaderboard updates; draft clears    | Ramesh        | 3       |
| C4  | Editable roster — rename, soft-remove, show removed, reactivate           | Sunita        | 4       |
| C5  | HSD / XTRA GREEN — mandatory ₹ amount, ₹2500 → correct points             | Ramesh        | 5       |
| C6  | Voice message — hold-to-record, slide-to-cancel, lock, playback           | Ramesh        | 6       |
| C7  | Responsive on a tablet / wide browser                                     | Ramesh        | 7       |
| C8  | Camera capture in chat (Android app path — the fixed bug)                 | Ramesh (app)  | 8       |
| C9  | Low-end feel — big photo compresses; image-heavy chat scrolls             | Ramesh        | 9       |
| A1  | Admin DealerStaffTab — full control + hardcopy reconciliation             | Arjun         | 10      |
| A2  | Admin per-dealer Work list — hide default, add custom, dealer sees it     | Arjun         | 11      |
| S1  | Super-admin Work-list defaults page + plain-admin cannot see it           | Meera / Arjun | 12      |
| N1  | Android app — permissions, camera in chat + Kavach, voice, warm reconnect | Ramesh (app)  | 13      |
| R1  | Regression smoke — login, chat send/receive, existing flows               | all           | —       |

---

# CLIENT (dealer) — mdg-client

## C1 — Give points → "Add to submission" (draft, NOT the leaderboard) — `dealer-owner` (Ramesh)

Maps to `StaffPage.tsx` → `GivePointsFlow.tsx` (append to draft store) →
`PendingSubmissionPanel.tsx`. The core behaviour: awarding **does not** hit the
leaderboard immediately; it accumulates in a pending draft.

**Preconditions**

- Ramesh signed in on the client. **Profile → Manage staff** open (the Staff
  points screen). The dealer has at least 2 active workers on the roster (add
  them with **Add worker** if empty — `StaffPage.tsx:360-367`).
- Note each worker's current points number shown in the leaderboard rows for
  "Today" (`LeaderboardRow`, the big number, `StaffPage.tsx:106-113`).

**Steps**

1. Tap the big **Give points** button (`StaffPage.tsx:351-359`). A bottom sheet
   opens titled "Who did the work?" (step 1).
2. **Pick one worker** by tapping their row (`WorkerPicker`,
   `GivePointsFlow.tsx:236-237`). The sheet advances to step 2 "What did they
   do?".
3. In step 2, **tick one or more works** (multi-select — each row gets a check and
   turns blue; `WorkPicker`, `GivePointsFlow.tsx:430-463`). Use the search box to
   find a work if the list is long. Confirm the footer shows a running
   "N selected · X points" line and the **Continue** button enables
   (`GivePointsFlow.tsx:272-290`).
4. Tap **Continue** → step 3 "Confirm". Confirm the chosen work(s) each show a
   "per worker" points badge, the **date** defaults to **today**
   (`GivePointsFlow.tsx:607-618`), and for a per-unit work a **– / +** counter is
   present.
5. **(Multiple workers)** If the dealer has more than one worker, confirm a "Who
   did it together?" checklist appears so you can add co-workers
   (`GivePointsFlow.tsx:519-559`). Tick a second worker.
6. Tap the footer button **"Add to submission · <points>"**
   (`GivePointsFlow.tsx:291-301`). Confirm a toast "Added to submission" and the
   sheet closes.
7. **Critical check:** look at the leaderboard rows — the worker's big points
   number has **NOT changed**. The award did **not** post to the leaderboard.
8. Confirm a **"Pending submission"** panel is now visible above the leaderboard
   (`PendingSubmissionPanel.tsx:97`). It lists the worker(s), each work with its
   computed points, and a **running total** (`staff.pendingTotal`,
   `PendingSubmissionPanel.tsx:152-155`).
9. Open **Give points** again, pick a **different** worker + work, add to
   submission. Confirm the pending panel now shows **two** worker groups and the
   running total **increased** — entries accumulate, they don't replace.

**Expected result**

Points chosen via "Give points" land in a **draft** ("Pending submission") with an
accumulating list and a running total. The leaderboard is **unchanged** until a
final submit (C3). Nothing was posted to any worker's public total yet.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C2 — Draft is "never lost" — reload / kill the app / go offline mid-edit — `dealer-owner` (Ramesh)

Maps to the persisted local draft store (`staffDraft` store) + debounced autosave
to the server (`useStaffDraftSync.ts`), and the "saving / saved / offline" chip
(`PendingSubmissionPanel.tsx:202-238`).

**Preconditions**

- Ramesh on the Staff points screen with a **non-empty** pending submission from
  C1 (at least two entries).

**Steps**

1. **Watch the sync chip** next to the "Pending submission" title after an edit.
   Add or remove an entry and confirm it briefly shows **"Saving…"** then
   **"Saved"** (`SyncChip`, states `saving`→`saved`,
   `useStaffDraftSync.ts:62-70`). The autosave is debounced ~0.6 s, so a quick
   burst of edits collapses into one save.
2. **Reload the page** (browser refresh, or pull-to-refresh in the app). After it
   reloads and you return to **Profile → Manage staff**, confirm the **pending
   submission is still there** with the same entries and total (it rehydrates from
   the server draft, `useStaffDraftSync.ts:42-46`).
3. **Kill & reopen (app path).** In the Android app, fully close the app (swipe it
   away from recents) and relaunch. Sign back in if needed. Confirm the pending
   submission is **still present** — nothing was lost.
4. **Offline mid-edit.** Turn on airplane mode (or DevTools → Network → Offline).
   Change a quantity or add an entry. Confirm the chip flips to **"Offline"**
   (`CloudOff`, state `offline`, `useStaffDraftSync.ts:68`) and the entry still
   shows locally (the local store keeps it).
5. **Reconnect.** Turn the network back on. Within a moment the pending edit
   **auto-saves** (the chip returns to "Saving…" → "Saved" on the `online` event,
   `useStaffDraftSync.ts:49-53`). Reload once more to prove the server accepted
   the previously-offline edit.

**Expected result**

The draft survives a page reload, an app kill/relaunch, and an offline period. The
status chip honestly reflects saving / saved / offline, and a queued offline edit
reconciles automatically on reconnect. No entry is ever silently dropped.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C3 — Final submit requires a hardcopy photo; leaderboard updates; draft clears — `dealer-owner` (Ramesh)

Maps to `PendingSubmissionPanel` **Final submit** → `FinalizeSubmitSheet.tsx`
(mandatory photo → compress → presign `scope:'staff'` → PUT → finalize) → the
leaderboard refetch + `PastSubmissions`.

**Preconditions**

- Ramesh on the Staff points screen with a non-empty pending submission (C1).
- Have a **paper hardcopy** (any sheet of paper) handy to photograph, or an image
  in the gallery to pick.

**Steps**

1. In the "Pending submission" panel, tap **"Final submit · <total>"**
   (`PendingSubmissionPanel.tsx:184-186`). The finalize sheet opens showing the
   big total and a **"Hardcopy photo"** section.
2. **Try to submit with NO photo.** Confirm the submit button is **disabled** and
   a helper line reads "A photo of the hardcopy is required" (or similar)
   (`FinalizeSubmitSheet.tsx:219-227`, the button is `disabled={!file}`). You
   cannot finalize without a photo.
3. Tap **"Take photo"** (`FinalizeSubmitSheet.tsx:171-179`). On a phone/app the
   **camera opens** (rear camera — `capture="environment"`,
   `FinalizeSubmitSheet.tsx:136-143`). Photograph the paper hardcopy. Confirm a
   **preview** appears with an **X** to remove/retake
   (`FinalizeSubmitSheet.tsx:152-168`); the button now reads "Retake photo".
4. **(Alternative)** Tap **"Choose from gallery"** and pick an existing image
   instead (`galleryRef`, no `capture`, `FinalizeSubmitSheet.tsx:180-188`).
   Either path is acceptable; the photo is mandatory, the source is not.
5. Confirm the **date** field (defaults to the draft's work date / today) and the
   optional **note** field. Adjust the date if needed (max = today).
6. Tap **"Confirm & submit · <points>"**. Confirm a brief "Submitting…" state,
   then a success toast "Submitted — <points> points added" (or similar,
   `staff.finalizeSuccess`, `FinalizeSubmitSheet.tsx:76-81`).
7. **Leaderboard now reflects the points.** Confirm each worker's leaderboard
   number **increased** by their share of the submission, and any worker who
   crossed the daily target shows the **"target reached"** badge
   (`STAFF_DAILY_POINT_TARGET = 100`, `StaffPage.tsx:87, 100-104`).
8. **Draft clears.** Confirm the "Pending submission" panel is **gone** (empty
   draft renders nothing, `PendingSubmissionPanel.tsx:93`).
9. **Appears in past submissions.** Tap **"Past submissions"** at the bottom
   (`PastSubmissions`, `StaffPage.tsx:181-244`). Confirm the batch you just
   submitted is listed with its date, "<points> · <workers>" summary, and a
   **"View hardcopy"** link that opens the photo you took
   (`StaffPage.tsx:226-236`).
10. **Failure-safety (optional):** If a submit ever errors (e.g. drop the network
    right at confirm), confirm the toast reports a failure and the **draft is
    still intact** for a retry — it is NOT cleared on failure
    (`FinalizeSubmitSheet.tsx:83-90`; clearDraft only runs after success).

**Expected result**

Final submit is **blocked without a photo**; the camera captures a paper hardcopy
(gallery works too); on confirm the points post to the leaderboard, the draft
clears, and the batch (with its hardcopy) shows in Past submissions. A failed
submit loses nothing.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C4 — Editable roster — rename, soft-remove, show removed, reactivate — `dealer-staff` (Sunita)

Maps to `EditWorkerDialog.tsx` (rename + soft-remove) and `RemovedRoster` in
`StaffPage.tsx` (show removed + reactivate).

**Preconditions**

- Sunita signed in on the client, Staff points screen open, with at least one
  active worker who has some point history.

**Steps**

1. On a leaderboard row, tap the **pencil** icon (`StaffPage.tsx:114-121`). The
   **Edit worker** dialog opens.
2. **Rename:** change the **Name** (and optionally designation / phone), tap
   **Save changes** (`EditWorkerDialog.tsx:139-147`). Confirm a "Worker updated"
   toast and the leaderboard row now shows the **new name**.
3. **Soft-remove:** open the same worker's edit dialog, tap **Remove worker**
   (red), then confirm on the second prompt "Remove <name>?"
   (`EditWorkerDialog.tsx:150-188`). Confirm a "Worker removed" toast.
4. Confirm the worker is **gone from the active leaderboard** but their point
   history is **not** deleted (removal sets status INACTIVE, not a hard delete —
   `EditWorkerDialog.tsx:69-79`).
5. **Show removed:** below the leaderboard, tap **"Show removed (N)"**
   (`RemovedRoster`, `StaffPage.tsx:141-152`). Confirm the removed worker is
   listed under it.
6. **Reactivate:** tap **Reactivate** on that removed worker
   (`StaffPage.tsx:164-172`). Confirm a "Reactivated" toast and that the worker
   **returns to the active leaderboard** with their prior history intact.

**Expected result**

A worker can be renamed in place; removal is a **soft** hide (history kept, worker
disappears from the active list); "Show removed" reveals them and Reactivate
restores them. No point history is lost across remove→reactivate.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C5 — HSD / XTRA GREEN: mandatory ₹ amount (not a ± counter); ₹2500 → correct points — `dealer-owner` (Ramesh)

Maps to the `rupee-1000` unit work rendering a **₹ amount field** in
`GivePointsFlow.tsx` (`isRupee` branch, `WorkRow`, `GivePointsFlow.tsx:693-716`)
and its validation (`rupeeInvalid`, blocks confirm, `GivePointsFlow.tsx:36-38,
167-172`).

**Background (for the tester):** the work **"Sell HSD / XTRA GREEN"** is worth
**0.5 points per ₹1000** (`staffWorkCatalog.ts:289-300`). So **₹2500 → 2.5 ×
0.5 = 1.25 points** for one worker.

**Preconditions**

- Ramesh on Staff points; the dealer's effective work list includes "Sell HSD /
  XTRA GREEN" (it is a default; it shows unless an admin hid it — see A2).

**Steps**

1. **Give points** → pick a worker → in step 2 search "HSD" and tick **"Sell HSD /
   XTRA GREEN"** → **Continue**.
2. On the confirm step, confirm this work shows a **₹ field** with a leading "₹"
   symbol — **not** a – / + counter (`GivePointsFlow.tsx:693-710`; contrast with
   the per-unit ± branch at `717-742`).
3. **Try to add with the ₹ field empty.** Tap **"Add to submission"**. Confirm it
   is **blocked**: the ₹ field shows a red border and an "Amount required" error
   (`GivePointsFlow.tsx:169-172, 711-715`), and the sheet does **not** close.
4. Type **2500** into the ₹ field. Confirm the "Add to submission" points figure
   computes to **1.25** points (0.5 × 2500/1000). Tap **Add to submission** — it
   now succeeds.
5. In the "Pending submission" panel, confirm the HSD line shows a **₹ amount
   input** (still editable inline, `PendingSubmissionPanel.tsx:283-293`) and
   **1.25** points. Change it to **₹4000** inline and confirm the line updates to
   **2.0** points and the running total follows.
6. **(Contrast)** Add a plain per-unit work (e.g. a "per vehicle" work) and
   confirm it uses the **– / +** counter, proving the ₹ treatment is specific to
   rupee works.

**Expected result**

Rupee works (HSD / XTRA GREEN, MS / XP-95) present a **mandatory ₹ amount** field;
an empty amount blocks the add; ₹2500 yields 1.25 points; editing the amount
re-computes points live. Non-rupee works keep the counter.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C6 — Voice message (WhatsApp-style) — hold to record, slide to cancel, tap to lock, playback — `dealer-owner` (Ramesh)

Maps to `Composer.tsx` (press-and-hold mic gesture, `LiveWaveform`, slide-cancel,
tap-to-lock) and `AttachmentPreview.tsx` `VoiceMessage` (playback with waveform +
progress + seek).

**Preconditions**

- Ramesh on the **Chat** tab, in a conversation. The composer is **empty** (the
  mic button only shows when there is no typed text and no staged file —
  `Composer.tsx:539-580`). On the web, grant the browser mic permission; in the
  Android app the mic grant is handled up front (see N1).

**Steps**

1. **Press and hold** the mic button. Confirm recording starts: the input row is
   replaced by a **live waveform** that reacts to your voice, an **elapsed timer**,
   and a **"‹ slide to cancel"** hint (`Composer.tsx:585-618`,
   `LiveWaveform:81`).
2. **Slide to cancel:** while holding, drag your finger **left** past ~80 px. The
   hint flips to **"release to cancel"** and the mic turns red
   (`CANCEL_DX = 80`, `cancelArmed`, `Composer.tsx:368-372, 574-578`). **Release**
   — the recording is **discarded**, nothing is sent, and the composer returns to
   normal.
3. **Hold → release to send:** press and hold again, speak ~2 seconds, then
   **release without sliding**. Confirm the voice note is **sent immediately** and
   appears as your own bubble (`stopAndSend`, `Composer.tsx:308-311`).
4. **Tap to lock (hands-free):** **quickly tap** the mic (a press shorter than
   ~350 ms, `TAP_MS = 350`, `Composer.tsx:301-306`). Confirm it enters a **locked
   recording bar** with a **trash** (cancel), a **live waveform + timer**, and a
   **send** button (`recMode === 'locked'`, `Composer.tsx:452-482`). You can now
   lift your finger and keep talking. Tap **send** to send, or **trash** to
   discard.
   - **(Alternative lock path)** while holding, **slide up** past ~72 px
     (`LOCK_DY = 72`, `Composer.tsx:374-384`) to lock hands-free without lifting.
5. **Playback:** on a received/sent voice bubble, tap **play** (`VoiceMessage`,
   `AttachmentPreview.tsx:209-223`). Confirm the **waveform fills with progress**
   as it plays, the timer counts up, and **play flips to pause**. **Tap on the
   waveform** to seek to a different point (`onSeek`,
   `AttachmentPreview.tsx:193-198, 225`).
6. **Permission-denied fallback (optional):** deny mic permission and try to
   record. Confirm it **falls back to the file picker** so an audio file can still
   be attached, instead of getting stuck (`beginRecorder` fallback,
   `Composer.tsx:318-326`).

**Expected result**

Press-and-hold records with a live waveform; slide-left cancels; release sends;
a quick tap (or slide-up) locks hands-free with explicit send/cancel; playback
shows a filling waveform, progress, and seek. A denied mic degrades to the file
picker.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C7 — Responsive on a tablet / wide browser — uses the width, nothing overflows — `dealer-owner` (Ramesh)

Maps to the shell's stepped max-width (`AppShell.tsx:48, 64, 83`) and the sheets'
`max-w-md` centring.

**Preconditions**

- Ramesh signed in. Open on an actual tablet in landscape, or a desktop browser
  widened to ≥ 1024 px (or DevTools device toolbar → iPad).

**Steps**

1. On **Chat**, **Reports**, **Kavach**, **Profile**, and **Staff points**,
   confirm the content column is a **comfortable wide column** (up to `max-w-3xl`
   at ≥ 1024 px), **not** a narrow phone strip lost in a sea of blank space, and
   **not** stretched edge-to-edge. Header, content, and bottom bar align to the
   same width.
2. Open the **Give points** sheet and the **Finalize** sheet on the wide screen.
   Confirm they present as a **centred card** (`max-w-md`,
   `GivePointsFlow.tsx:208`, `FinalizeSubmitSheet.tsx:102`) over a dim backdrop —
   readable, not stretched across the whole tablet.
3. Open a chat with several image attachments. Confirm images, bubbles, and the
   composer **do not overflow** horizontally (no sideways scrollbar on the page)
   and the layout reflows cleanly.
4. Rotate the tablet portrait↔landscape. Confirm nothing clips, the bottom nav
   stays reachable, and the pending-submission panel + leaderboard remain fully
   visible.

**Expected result**

On wide screens the app uses the extra width up to a sensible reading measure and
stays centred; sheets remain tidy centred cards; nothing overflows or clips in
either orientation.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C8 — Camera capture in chat (the fixed Android-WebView bug) — `dealer-owner` (Ramesh, in the app)

Maps to the chat `Composer` **camera** button (`capture="environment"`,
`fromCamera` → `assumeImage`, `Composer.tsx:485-520`) and the app-side CAMERA
runtime grant that makes the WebView actually open the camera
(`mdg-app/lib/permissions.ts`). **This is the bug that was fixed** — call the
Android app path out explicitly.

**Preconditions**

- **Android app build** (dev-client or production build, NOT Expo Go — the camera
  intent needs the native permission path). Ramesh signed in, on a chat thread.
- On first launch you should have been asked for **Camera** permission (see N1); it
  must be **granted**.

**Steps**

1. In the chat composer, tap the **camera** icon (the left-most icon,
   `Composer.tsx:485-493`) — distinct from the paperclip (gallery/files,
   `494-502`).
2. Confirm the **device camera opens** (rear-facing). Before the fix, on Android
   this silently did nothing (the WebView left the camera intent null because
   CAMERA was declared but not granted at runtime —
   `mdg-app/lib/permissions.ts:9-33`). It must now open.
3. Take a photo. Confirm it returns to chat with a **thumbnail preview chip**
   staged in the composer (`StagedAttachmentChip`,
   `AttachmentPreview.tsx:123-155`). Even if Android hands back an **empty MIME
   type**, the photo is still classified as an image (`fromCamera` →
   `assumeImage`, `Composer.tsx:196-217`).
4. Tap **Send**. Confirm the photo uploads and appears as an image bubble, and
   tapping it opens the full image (`MessageAttachment`,
   `AttachmentPreview.tsx:268-286`).
5. **Contrast — gallery:** tap the **paperclip** and confirm it opens the
   **gallery / file picker** (not the camera), and that path also attaches and
   sends (`fileRef`, `ACCEPT` images+docs, `Composer.tsx:503-510`).

**Expected result**

In the Android app, the chat **camera** button opens the real camera and the
captured photo stages, previews, uploads, and sends — even when the OS returns an
empty MIME. The paperclip still opens the gallery/files. (On iOS the camera has
always worked; verify it still does.)

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## C9 — Low-end feel — a big photo attaches/uploads without hanging; image-heavy chat scrolls — `dealer-owner` (Ramesh)

Maps to `compressImage.ts` (downscale to ≤ 1600 px longest edge, JPEG q0.7, skip
< 300 KB) used by both chat attachments (`uploadAttachment.ts:94-104`) and the
hardcopy (`uploadStaffHardcopy.ts:25-29`); plus lazy/async image decode in the
thread (`MessageAttachment`, `AttachmentPreview.tsx:278-284`).

**Preconditions**

- Ramesh in a chat, ideally on a mid/low-end Android or with the browser throttled
  to a slow network (DevTools → Network → Slow 3G) to feel the difference.

**Steps**

1. Attach a **large photo** (a multi-megabyte camera shot, ≥ 2-3 MB). Confirm the
   preview appears quickly and **Send** completes without the app hanging or
   freezing. Under the hood the image is **downscaled to ≤ 1600 px and
   recompressed to ~q0.7** before upload, so a 6 MB photo uploads as a few hundred
   KB (`compressImage.ts:24-28`). A small photo (< 300 KB) is sent as-is
   (compression is skipped, `compressImage.ts:41`).
2. Attach the **same large photo as the hardcopy** in the Finalize sheet (C3) and
   confirm the same fast behaviour (same compression path).
3. Scroll a thread with **many images** up and down repeatedly. Confirm it scrolls
   **smoothly** — images load lazily and reserve their space so late-loading
   images don't cause the list to jump/shift under your finger
   (`loading="lazy" decoding="async"` + `min-h`, `AttachmentPreview.tsx:278-284`).
4. (Optional) Confirm an **animated GIF** attaches without being flattened to one
   frame (GIFs skip compression, `compressImage.ts:40`).

**Expected result**

Large photos are compressed client-side so uploads are quick even on 2G and the UI
never hangs; small photos are left alone; image-heavy threads scroll smoothly
without layout jumps.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

# ADMIN (ops) — mdg-admin

## A1 — DealerStaffTab: full staff control + hardcopy reconciliation — `admin` (Arjun)

Maps to `mdg-admin/src/pages/dealers/DealerStaffTab.tsx` (+ `AwardPointsDialog`,
`WorkerFormDialog`). One admin scenario covering add / rename / remove /
reactivate a worker, award (incl. ₹-amount), undo (single + batch), view the
dealer's live draft, and reconcile finalized submissions against the hardcopy
photo.

**Preconditions**

- Arjun signed in to the admin portal. Open **Dealers → Northern Lights Petrol →
  Staff & points** tab.

**Steps**

1. **Window presets:** toggle **Today / Last 7 days / This month**
   (`DealerStaffTab.tsx:59-63, 188-204`) and **Include inactive**
   (`326-334`). Confirm the Leaderboard / Roster / Award-history tables refresh
   for the window.
2. **Add a worker:** in the Roster card tap **Add worker**
   (`335-341`) → fill the WorkerFormDialog → save. Confirm the new worker appears
   in the roster as **Active**.
3. **Rename:** on a roster row tap **Edit** (`412-421`), change the name, save;
   confirm the row updates.
4. **Soft-remove / reactivate:** tap **Remove** on an Active worker
   (`422-429`); confirm the toast "<name> removed" and the row flips to
   **Inactive** (kept in the list because it toggles status, not delete —
   `156-166`). Tap **Reactivate**; confirm it returns to Active.
5. **Award points (including a ₹ work):** tap **Award points**
   (`219-225`) → in the dialog tick one or more **workers**, click **Add work**,
   choose **"Sell HSD / XTRA GREEN"**, and confirm the row shows a **₹ amount**
   field (not a quantity) (`AwardPointsDialog.tsx:293-341`). Enter **2500**;
   confirm the **Estimated total** reads **1.25 pts** (`estimateWorkTotal` rupee
   path, `AwardPointsDialog.tsx:57-64`). Also add a FLAT work. Submit **Award
   points**; confirm the success toast and that the **Leaderboard + Award history**
   now include these entries (this is a direct admin award — it posts immediately,
   unlike the dealer draft flow).
6. **Undo a single entry:** in **Award history**, click **Undo** on one row
   (`674-683`) → in the dialog choose **"Undo this entry"** (`729-735`). Confirm a
   "Award reversed" toast and that the worker's total dropped by that entry.
7. **Undo a whole batch:** award again (creates a batch of several entries), then
   **Undo** any entry in that batch and choose **"Undo whole batch"**
   (`720-728`). Confirm **every** entry from that award is reversed together.
8. **View the dealer's in-progress draft:** have Ramesh (client) build a pending
   submission (C1) but **not** submit it. In the **In-progress draft** card,
   confirm you see the dealer's unsubmitted entries **read-only**, with a "Pending
   submission" badge, entry count, total, work date, and "last updated by"
   (`441-519`). Confirm you **cannot** edit it here (it becomes an award only when
   the dealer finalizes).
9. **Reconcile hardcopy:** after Ramesh finalizes (C3), open the **Finalized
   submissions** card. Confirm the batch appears with a **hardcopy photo
   thumbnail** (`582-595`); **click the thumbnail** to enlarge it in a dialog
   (`748-761`) and eyeball it against the soft-copy numbers (workers / entries /
   points columns). A batch with no photo shows "Not available" (`596-601`).

**Expected result**

An admin has full control of a dealer's staff from this tab: add/rename/
remove/reactivate workers; award points (₹ works compute correctly); undo a single
entry or a whole batch; watch the dealer's live draft read-only; and reconcile
each finalized batch against its hardcopy photo.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## A2 — Per-dealer Work list: hide a default, add a custom, dealer's client reflects it — `admin` (Arjun)

Maps to `mdg-admin/src/pages/dealers/DealerWorkListTab.tsx` (hide/show defaults +
custom items + Save) and the dealer's effective list on the client.

**Preconditions**

- Arjun on **Dealers → Northern Lights Petrol → Work list** tab. Ramesh available
  on the client to verify the dealer-side effect.

**Steps**

1. In **Default works**, pick a work the dealer currently sees (e.g. a cleaning
   task). Click its visibility toggle so it reads **"Hidden"** (`Eye`→`EyeOff`,
   `DealerWorkListTab.tsx:371-386`). Confirm the row dims and an **"Unsaved
   changes"** badge appears (`291`).
2. In **Custom works**, click **Add custom work** (`408-414`), fill the dialog
   (label EN/HI, points, distribution, domain), and add it. Confirm it lists under
   Custom works as **Active**.
3. Confirm the summary line updates: "This dealer will see N works"
   (`285-290`) reflecting −1 default +1 custom.
4. Click **Save changes** (`306-314`). Confirm a "Work list saved" toast and the
   "Unsaved changes" badge clears.
5. **Dealer-side check:** as Ramesh, open **Give points → step 2 (works)**.
   Confirm the **hidden default no longer appears** and the **new custom work
   does** (the client reads the dealer's effective list,
   `mdg-client` `useDealerWorkItems`). Award the custom work into a submission to
   prove it is fully usable.
6. **Discard path:** back in the admin tab, make another change and click
   **Discard** (`298-305`); confirm it reverts to the last saved state.

> **Note for the tester:** hidden **default** works may show only their code
> instead of a friendly label unless you are a super-admin — the full default
> catalog is only readable by super-admins (`DealerWorkListTab.tsx:105, 329-332`).
> Hiding still works by code; a plain admin just sees less-pretty labels for the
> hidden rows.

**Expected result**

An admin can hide a default work for one dealer and add a dealer-specific custom
work; after Save the dealer's client immediately reflects both changes (hidden
work gone, custom work usable). Discard reverts unsaved edits.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

# SUPER-ADMIN — mdg-admin

## S1 — Work-list defaults page (`/work-list`, super-admin only) + plain-admin cannot see it — `super-admin` (Meera) / `admin` (Arjun)

Maps to `WorkListDefaultsPage.tsx` (global default catalog CRUD + soft-delete),
the route guard (`App.tsx:58-63` `RequireSuperAdmin`), and the nav gate
(`AppShell.tsx:44` `superAdminOnly: true`, filtered at `:110`).

**Preconditions**

- Meera (super-admin) and Arjun (plain admin) each able to sign in to the admin
  portal.

**Steps (as Meera, super-admin)**

1. In the left nav confirm a **"Work list"** item exists (list-checks icon,
   `AppShell.tsx:44`). Click it → URL `/work-list`, page title **"Work list
   defaults"** (`WorkListDefaultsPage.tsx:106`).
2. Confirm work items are **grouped by domain**, each row showing Sr, label
   EN/HI + code, distribution (+ unit), points, and status
   (`163-247`).
3. **Create:** click **Add work item** (`109-114`) → fill code (slug), Sr No,
   sheet titles EN/HI, labels EN/HI, points, distribution, domain (and, for
   PER_UNIT, unit + unit labels) → **Create** (`311-364`). Confirm a "Work item
   created" toast and the new row appears in its domain group.
4. **Edit:** click **Edit** on a row (`209-217`), change points or a label, **Save
   changes** (`424-483`). Confirm the update; note the **code is read-only** on
   edit (`445-452`).
5. **Soft-delete:** click **Deactivate** on an active item (`219-227`). Confirm a
   "<label> deactivated" toast and the row goes to **Inactive** (dimmed) — it is
   **not** hard-deleted (it can be reactivated, `86-101, 228-241`).
6. **Reactivate:** click **Reactivate** on the inactive item; confirm it returns
   to Active.

**Steps (as Arjun, plain admin — negative)**

7. Sign in as Arjun. Confirm the left nav has **no "Work list"** item (it is
   `superAdminOnly` and filtered out, `AppShell.tsx:110`).
8. **Direct-URL guard:** manually navigate to `/work-list`. Confirm you are
   **redirected away** (not shown the page) by `RequireSuperAdmin`
   (`App.tsx:58-63`). The page and its API are not reachable to a plain admin.

**Expected result**

A super-admin can create / edit / soft-delete / reactivate global default work
items on `/work-list`; new defaults flow to new dealers. A plain admin sees
neither the nav item nor the route (redirected on direct access).

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

# ANDROID APP — mdg-app (Expo WebView shell)

## N1 — Permissions, camera in chat + Kavach, voice, warm reconnect — `dealer-owner` (Ramesh, in the app)

Maps to `mdg-app/app/index.tsx` (WebView shell, permissions, warm overlays,
hardware back, push) and `mdg-app/lib/permissions.ts`. **Use a real dev-client or
production build on a physical Android device**, not Expo Go (push + the camera
intent path are no-ops in Expo Go — `app/index.tsx:88-90`,
`lib/permissions.ts`).

**Preconditions**

- A fresh install of the Android app on a physical device (uninstall first to get
  a true first-launch permission prompt). Ramesh's client credentials ready.

**Steps**

1. **First-launch permissions:** launch the app. Confirm a **Camera** (and
   **Microphone / Record audio**) permission dialog appears once, up front
   (`ensureCameraPermissionsAsync` requests CAMERA + RECORD_AUDIO on mount,
   `app/index.tsx:120-122`, `permissions.ts:48-71`). **Grant** both.
2. **Camera capture in chat:** sign in, open a chat, tap the composer **camera**
   icon → confirm the camera opens and the photo attaches (this is C8; the runtime
   CAMERA grant from step 1 is what makes the native `<input capture>` intent fire
   — `permissions.ts:9-33`).
3. **Camera capture in Kavach:** open **Kavach**, find a compliance task with a
   photo-proof capture (`ComplianceTaskCard.tsx` uses the same
   `capture="environment"` input) and confirm the camera opens and the proof photo
   attaches there too.
4. **Voice works:** back in chat, record and send a voice note (C6). Confirm it
   works **without** a mid-recording permission prompt — RECORD_AUDIO was granted
   in step 1, and the WebView auto-grants the getUserMedia mic
   (`mediaCapturePermissionGrantType="grant"`, `app/index.tsx:329`).
5. **Push registration:** confirm that after login the app registers a push token
   (the web signals `auth:login`, native mints an Expo push token and hands it
   back, `app/index.tsx:143-154`). If a test push is available, tapping it should
   deep-link into the right chat (`resolveDeepLinkPath`, `95-104`).
6. **Offline / reconnect keeps the page warm (no reload):** turn on airplane mode
   while on a chat with scroll position and a half-typed draft. Confirm an
   **Offline** overlay appears **on top of** the still-mounted WebView
   (`app/index.tsx:355-359`, overlay-not-replace). Turn the network back on:
   confirm the overlay clears and the **page is exactly as you left it** —
   scroll position, typed text, and SPA state preserved (the WebView was never
   reloaded for a transient blip; only a truly failed load reloads,
   `app/index.tsx:248-261, 283-289`).
7. **Android hardware back:** navigate a couple of screens (e.g. chat → open an
   image → back), then press the **hardware/gesture Back**. Confirm it walks the
   WebView history first and only exits the app when there's nowhere to go back to
   (`onBack`, `app/index.tsx:125-136`).

**Expected result**

First launch prompts once for Camera + Mic; camera capture works in both chat and
Kavach; voice records without a fresh prompt; push registers (and deep-links);
a network blip shows an offline overlay without reloading (page stays warm); and
hardware Back navigates WebView history before exiting.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

# Regression smoke — existing flows still work

## R1 — Login, chat send/receive, no duplicate messages, records — `all`

A fast pass to confirm the batch did not regress the core product.

**Steps**

1. **Login (each role):** sign in as Ramesh (owner), Sunita (staff), Arjun
   (admin). Each lands on their expected home (client → Chat; admin → Inbox). Sign
   out works.
2. **Chat send / receive (realtime):** with Ramesh on the client and Arjun on the
   admin inbox in the same thread, send a message each way. Confirm each arrives
   **within a second or two without a manual refresh**, and delivery/read ticks
   update.
3. **No duplicate-message bug:** send a message from Ramesh; confirm it appears
   **exactly once** on his own screen (the optimistic bubble is reconciled with
   the server echo — dedupe by message id + stripping `temp-*` placeholders,
   `useConversationSocket.ts:79-86`). Send several quickly; none double up. The
   admin side also shows each once.
4. **Typing + read:** while one side types, the other sees a typing indicator;
   opening the thread marks messages read on the sender's side.
5. **Records / DSR (admin → dealer):** as Arjun, upload a report to Ramesh's
   thread (Upload report). As Ramesh, confirm an **in-chat card** appears and the
   file also shows in the **Reports** tab, and the **download / view** (signed URL)
   opens.
6. **Existing staff leaderboard:** confirm the leaderboard, window toggle (Today /
   This month), and target badge still render for a dealer with historical points.
7. **Kavach:** confirm the Kavach tab still loads its checklist and a task can be
   marked done.

**Expected result**

All three roles log in; realtime chat sends/receives with no duplicates; typing/
read work; a DSR upload reaches the dealer in-chat + in Reports with a working
download; leaderboard and Kavach are intact.

**PASS ☐ FAIL ☐** Notes: ********\*\*********\_\_********\*\*********

---

## Static smoke checks performed (2026-07-08)

Verified against the committed code (read-only; no product code modified). Live
runs (login, sockets, real uploads/push, camera on a device) are covered by the
numbered scenarios above and require a running backend + Mongo + S3 and a physical
device.

- **Client staff flow wiring** — `StaffPage.tsx` renders `GivePointsFlow` (sheet),
  `PendingSubmissionPanel` (draft), `EditWorkerDialog`, `RemovedRoster`,
  `PastSubmissions`; draft persists via `useStaffDraft` + `useStaffDraftSync`.
  Give-points **appends to a draft** (`addEntries`, `GivePointsFlow.tsx:185`) —
  it does not award directly. PASS.
- **Mandatory hardcopy** — finalize button `disabled={!file}`
  (`FinalizeSubmitSheet.tsx:227`); camera input has `capture="environment"`
  (`:141`); on failure the draft is NOT cleared (`:83-90`). PASS.
- **Rupee work = ₹ field** — `isRupeeWork` (`unit === 'rupee-1000'`) drives the ₹
  input + `rupeeInvalid` block (`GivePointsFlow.tsx:36-38, 693-716`); HSD/XTRA
  GREEN = 0.5 pts / ₹1000 (`staffWorkCatalog.ts:289-300`). PASS.
- **Voice gesture constants** — `CANCEL_DX=80`, `LOCK_DY=72`, `TAP_MS=350`
  (`Composer.tsx:35-39`); locked bar + slide-cancel + tap-lock paths present. PASS.
- **Camera-capture bug fix** — app requests CAMERA + RECORD_AUDIO on mount
  (`app/index.tsx:120-122`, `permissions.ts:48-71`); WebView opens `<input
capture>` intent only when CAMERA is granted (documented at
  `permissions.ts:9-33`). PASS.
- **Compression** — `MAX_EDGE=1600`, `JPEG_QUALITY=0.7`, skip `< 300 KB`, skip
  GIF (`compressImage.ts:24-28, 40-41`); used by chat + hardcopy uploads. PASS.
- **Admin controls** — `DealerStaffTab` exposes add/edit/remove/reactivate, award,
  undo single/batch, read-only draft, and hardcopy thumbnail→dialog. `AwardPoints`
  ₹ path computes `amountRupees/1000` (`AwardPointsDialog.tsx:57-64`). PASS.
- **Per-dealer work list** — `DealerWorkListTab` hide/show defaults + custom items
  - Save/Discard; default-catalog labels gated to super-admin (`:105`). PASS.
- **Super-admin gate** — `/work-list` wrapped in `RequireSuperAdmin`
  (`App.tsx:58-63`); nav item `superAdminOnly` filtered (`AppShell.tsx:44, 110`).
  PASS.
- **Client typecheck** — `npm run typecheck` in `mdg-client`
  (`tsc -p tsconfig.json --noEmit`) ran clean, **exit code 0, no type errors**
  (2026-07-08). The staff/chat feature code under test compiles. PASS.

---

## Sign-off

| Scenario | Result | Tester | Date |
| -------- | ------ | ------ | ---- |
| X1       |        |        |      |
| X2       |        |        |      |
| C1       |        |        |      |
| C2       |        |        |      |
| C3       |        |        |      |
| C4       |        |        |      |
| C5       |        |        |      |
| C6       |        |        |      |
| C7       |        |        |      |
| C8       |        |        |      |
| C9       |        |        |      |
| A1       |        |        |      |
| A2       |        |        |      |
| S1       |        |        |      |
| N1       |        |        |      |
| R1       |        |        |      |

**Release recommendation:** ☐ Go ☐ Go with caveats ☐ No-go
Caveats / blockers: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

---

## Open questions (UI ambiguities the tester should confirm / product should decide)

These are points where the acceptance criterion could not be pinned down purely
from the code and needs a human call during the session:

1. **Client window toggle is Today / This month only (no "Last 7 days").** The
   client `WindowToggle` offers just **Today** and **This month**
   (`StaffPage.tsx:45-48`), whereas the admin tab offers **Today / Last 7 days /
   This month** (`DealerStaffTab.tsx:59-63`). Confirm this asymmetry is intended
   (dealers don't get a 7-day lens).
2. **Direct admin awards vs the dealer draft flow both exist.** The **dealer**
   flow forces a draft + hardcopy photo before points count (C1-C3), but an
   **admin** "Award points" (A1 step 5) posts **immediately with no hardcopy**.
   Confirm this is the intended reconciliation model (admin awards are trusted /
   out-of-band) and that it will not confuse the hard-vs-soft-copy audit.
3. **"Give points" always opens on the single-worker picker, then adds co-workers
   on step 3.** Step 1 picks exactly one worker (`pickWorker` sets `[id]`,
   `GivePointsFlow.tsx:106-109`); more workers are added only on the confirm step
   and only when the dealer has >1 worker. Confirm testers understand a
   multi-worker award is built on step 3, not step 1.
4. **Slide-to-cancel / tap-to-lock thresholds are gesture-feel judgements.** 80 px
   to cancel, 72 px up to lock, 350 ms tap. These read fine in code but "feels
   right" is subjective on real devices — confirm on a low-end Android that the
   cancel isn't too easy/hard to trigger accidentally.
5. **Hardcopy reconciliation is eyeball-only.** The admin Finalized-submissions
   card shows the photo next to the numbers but there is **no explicit
   "reconciled ✓ / mismatch ✗" control** — reconciliation is a human read
   (`DealerStaffTab.tsx:521-609`). Confirm no formal sign-off state is expected
   for this release.
6. **Empty-MIME camera classification relies on `fromCamera`.** The camera path
   assumes an image even with an empty MIME (`assumeImage`); if a device's camera
   ever returns a non-image via that input, it would still be treated as an image.
   Low risk, but worth a note if any odd device is in the test matrix.
7. **Voice note has no in-composer pre-send review/scrub.** A held/locked
   recording is **sent on release/tap** — there is no "review before send" step in
   the composer (playback exists only after it is sent, `AttachmentPreview.tsx`).
   Confirm that "release to send with no preview" is the accepted WhatsApp-like
   behaviour and not a gap.
8. **Super-admin identity for testing.** `useIsSuperAdmin` reads `isSuperAdmin`
   from `/auth/me`; the seed may not create a super-admin by default. Confirm how
   to obtain a super-admin login for S1 (seed flag / manual DB toggle) before the
   session.
   </content>
   </invoke>
