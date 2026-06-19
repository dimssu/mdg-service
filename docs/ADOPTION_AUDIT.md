# Dealer Client Adoption Audit

Audience: 40–60yo fuel-pump owner, low digital confidence, cheap Android, patchy
network, abandons at the first moment of confusion or embarrassment.

Goal of this document: list every place the dealer app can scare, confuse, or
dead-end this user; rate abandonment risk; give a concrete fix an engineer can
ship without a meeting. Fixes marked **[applied]** are live in `mdg-client`
already (surgical copy/affordance only). Everything else is a recommendation.

The guiding rule from `docs/PRD.md` §9: _chat is the whole product; speak human,
hide the machine; never show a dead end._

---

## Friction inventory by flow

### 1. Login (`mdg-client/src/pages/LoginPage.tsx`)

| Item                                                                                     | Risk | Fix                                                                                                                                                                                                        | Why                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Wrong password shows "That email or password didn't work. Try again or contact support." | Low  | Keep. Good — no jargon, offers an out.                                                                                                                                                                     | Never blame; always an escape hatch.                                                                                   |
| Generic network failure falls back to raw `err.message`                                  | Med  | Replace fallback with "Something went wrong. Please check your network and try again." (already does this) — but a server-thrown message could still leak. Wrap all non-401 errors in the friendly string. | A raw error string ("Network request failed", "500") reads as broken software.                                         |
| "Need access? Contact your MDG account manager."                                         | Low  | Keep; warm and clear.                                                                                                                                                                                      | Gives a human path.                                                                                                    |
| No "show password" toggle                                                                | Med  | Add an eye toggle on the password `Input`. This user mistypes hidden passwords and gives up.                                                                                                               | Hidden dots + cheap keyboard = repeated lockout = abandonment. (Not applied: needs new affordance/state, beyond copy.) |
| Email keyboard is correct (`inputMode="email"`); password is fine                        | Low  | None.                                                                                                                                                                                                      | Already thumb-friendly.                                                                                                |

### 2. First message / empty chat (`ChatPage.tsx`, `features/chat/MessageList.tsx`, `Composer.tsx`)

| Item                                                                            | Risk                 | Fix                                                                                                                                                                                  | Why                                                                                                                                                    |
| ------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Conversation is auto-loaded (`useMyConversation`); dealer never "starts" a chat | Low                  | Keep. This is exactly right.                                                                                                                                                         | Never make this user create/initiate anything.                                                                                                         |
| Empty state "How can we help?" + 3 quick-action chips                           | Low                  | Keep. Chips are the fast first win. Consider chips in the user's language at GA.                                                                                                     | No empty room; one-tap path for non-typers.                                                                                                            |
| Placeholder was "Message"                                                       | Med → **[applied]**  | Changed to "Type your message…".                                                                                                                                                     | A single word "Message" is ambiguous (is it a button? a label?); a sentence invites action.                                                            |
| Attach button `aria-label` was "Attach file"                                    | Low → **[applied]**  | Changed to "Add a photo or document".                                                                                                                                                | "File" is mild jargon; photo/document is how a pump owner thinks.                                                                                      |
| "Chat is not ready yet" toast when conversationId missing                       | Med → **[applied]**  | Changed to "Still connecting. Please wait a moment and try again."                                                                                                                   | "Not ready" sounds broken; "still connecting" sounds temporary and not their fault.                                                                    |
| Send failure dumped `ApiError.message` / "Could not send message."              | High → **[applied]** | Changed to "Your message didn't go through. Please check your network and try again."                                                                                                | Raw API errors on a patchy network are the #1 "the app is broken, back to WhatsApp" moment.                                                            |
| Only Cmd/Ctrl+Enter sends; Enter inserts newline                                | Low                  | Acceptable on mobile (Send button is the primary path). Leave.                                                                                                                       | Touch users tap Send; no change needed.                                                                                                                |
| No optimistic "sending…"/"failed, tap to retry" bubble                          | High                 | Add an optimistic message bubble with a retry affordance on failure instead of (only) a toast. On patchy networks the dealer needs to _see_ the message is stuck and retry in place. | A toast disappears; the dealer can't tell if the message sent. This is the highest-value non-copy fix. (Not applied: requires state/component change.) |

### 3. Attaching a photo (`Composer.tsx`, `AttachmentPreview.tsx`, `lib/uploadAttachment.ts`)

| Item                                                          | Risk                 | Fix                                                                                                                                                      | Why                                                                                |
| ------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Per-file upload error was "Couldn't upload {name}: {raw msg}" | High → **[applied]** | Changed to "We couldn't send {name}. Please check your network and try again." Dropped the raw `Upload failed: 500` tail.                                | "Upload failed" + status code is exactly the jargon this user fears.               |
| `accept` includes camera-capable `image/*`                    | Low                  | On the WebView shell, add `capture="environment"` consideration or a "Take photo" vs "Choose" choice. Camera is the most natural input for a pump owner. | One-tap camera = fast win. (Not applied: behavior/markup change.)                  |
| Staged chip shows raw filename + byte size                    | Low                  | Acceptable. Size in KB/MB is fine.                                                                                                                       | Minor; not intimidating.                                                           |
| 10-file cap is silent                                         | Low                  | If a pick exceeds 10, show "You can send up to 10 at a time." Currently extra files are silently dropped.                                                | Silent loss feels like a bug. (Not applied: needs a toast call + threshold check.) |
| No upload progress on large photos over slow network          | Med                  | Show a progress/spinner state on the staged chip during PUT. Right now the dealer sees nothing for several seconds and may tap Send again.               | Perceived hang = abandonment. (Not applied: needs progress state.)                 |

### 4. Receiving a DSR / record card (`MessageBubble.tsx` → `CardMessage`, `RecordCard.tsx`)

| Item                                                                                                         | Risk | Fix                                                                                                                       | Why                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card shows type chip + title + "Tap to view" / "Preparing…"                                                  | Low  | Keep. "Tap to view" is a clear, warm CTA; "Preparing…" is honest.                                                         | Good affordance, big touch target (min-h-44).                                                                                                                                               |
| Type chip uses `RECORD_TYPE_LABELS` ("Daily Sales Report", "Invoice", "Compliance", "Statement", "Document") | Low  | Mostly good. "Compliance" and "Statement" are bank/legal words; consider "Compliance papers" / "Account statement" at GA. | Label lives in `shared/src/types/record.ts`; changing it touches the shared contract, so left as a recommendation per scope.                                                                |
| Chip text is `text-[10px]` uppercase                                                                         | Med  | Bump to `text-[11px]` and drop `uppercase` for readability by a slow reader.                                              | 10px uppercase is the hardest thing on the screen to read. (Not applied: borderline; the chip is decorative and consistent with admin — flagged, not changed, to avoid visual regressions.) |
| Tapping opens signed URL in a new tab/WebView                                                                | Low  | Acceptable. Ensure the WebView shell handles `window.open` (PDF viewer).                                                  | Out of client scope.                                                                                                                                                                        |

### 5. Finding reports (`RecordsPage.tsx`)

| Item                                                                        | Risk                | Fix                                                                                                                                                      | Why                                                                      |
| --------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Tab + page titled "Reports" (not "Records")                                 | Low                 | Keep. Plain word, matches tab.                                                                                                                           | "Report" is dealer-friendly; "record" is not.                            |
| Empty state "No reports yet" + "We'll message you when a new one is ready." | Low                 | Keep. Reassuring, sets expectation.                                                                                                                      | No empty room; promises a human nudge.                                   |
| Error state was "Couldn't load your reports / check your connection"        | Med → **[applied]** | Changed to "We couldn't show your reports just now / check your network and try again. If it keeps happening, send us a message in Chat and we'll help." | Adds the escape hatch (message us) and softer framing; never a dead end. |
| Grouped by type with uppercase section headers                              | Low                 | Acceptable. Newest-first sort within group is sensible.                                                                                                  | Fine.                                                                    |

### 6. Services (`ServicesPage.tsx`)

| Item                                                                    | Risk                 | Fix                                                                                                                                                  | Why                                                                                                                                     |
| ----------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Status pill rendered raw enum "ACTIVE" / "INACTIVE"                     | High → **[applied]** | Changed to "Active" / "Paused".                                                                                                                      | ALL-CAPS enum values are the clearest "this is software, not a person" signal.                                                          |
| "{cadence} cadence" (e.g. "weekly cadence")                             | Med → **[applied]**  | Changed to "Runs weekly".                                                                                                                            | "Cadence" is jargon; "Runs weekly" is plain.                                                                                            |
| Shows raw `svc.serviceId` as the title                                  | High                 | Map service IDs to human names (e.g. "Daily Sales Report service"). Showing a slug/ID as the headline is intimidating and meaningless to the dealer. | A code where a name should be reads as broken. (Not applied: needs a label map / API field; no safe client-only mapping exists.)        |
| Error state was "Couldn't load services / contact your account manager" | Med → **[applied]**  | Changed to "We couldn't show your services just now… send us a message in Chat and we'll help."                                                      | Escape hatch is Chat (in-app), not a phone call that pulls them off the app.                                                            |
| "Last:" / "Next:" with em-dash fallback                                 | Low                  | Acceptable.                                                                                                                                          | Clear enough.                                                                                                                           |
| Whole Services tab may be overkill for this user                        | Med                  | Consider hiding Services from dealer-owner-only or folding key info into chat at GA. It is a near-empty, settings-like screen for many dealers.      | PRD §9 rejects dashboards/tabs as landing surfaces; this tab risks being an empty room. (Not applied: routing/nav change out of scope.) |

### 7. Profile & team (`ProfilePage.tsx`)

| Item                                                                            | Risk                | Fix                                                                                                                                         | Why                                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Password success was "Password updated"                                         | Low → **[applied]** | "Your password has been changed".                                                                                                           | Warmer, full sentence.                                                                                                       |
| Password error dumped raw `err.message` / "Could not update"                    | Med → **[applied]** | "We couldn't change your password. Please try again, or message us in Chat."                                                                | No raw errors; escape hatch.                                                                                                 |
| Change-password card always visible on Profile                                  | Med                 | Acceptable but it is a 3-field form — the kind this user avoids. Consider collapsing behind a "Change password" row at GA.                  | Forms with many fields scare this user. (Not applied: layout change.)                                                        |
| Team invite/suspend (owner only): errors were "Invite failed" / "Action failed" | Med → **[applied]** | "We couldn't add your teammate…" / "That didn't work…", both with "message us in Chat". Success copy softened to "Teammate added" / "Done". | Terse failure words read as scolding/broken.                                                                                 |
| Suspend/Activate is a one-tap text link with no undo or confirm                 | Med                 | Prefer **undo over confirm**: apply immediately, show "Teammate paused — Undo" toast. Currently it's instant with no recovery.              | Owner-only, but an accidental tap that suspends a teammate with no undo is a trust-killer. (Not applied: needs undo wiring.) |
| Invite form requires a "Temporary password" the owner must invent               | Med                 | Auto-generate the temp password (or email an invite link) instead of asking the owner to type one.                                          | Inventing a password is a confusing required field. (Not applied: API/flow change.)                                          |

### 8. Navigation / app shell (`App.tsx`)

| Item                                                                              | Risk | Fix                                                                                                                                                                        | Why                                                                              |
| --------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Landing route is `/chat`                                                          | Low  | Keep. Chat-first is exactly right.                                                                                                                                         | PRD §9: chat is the whole product.                                               |
| 4 bottom tabs: Chat, Reports, Services, Profile                                   | Med  | Tabs are big (min-44) and labeled — good. But 4 tabs where 2 (Chat, Reports) matter risks looking like "software with settings". Consider demoting Services/Profile at GA. | Fewer choices = less intimidation. (Not applied: nav change out of scope.)       |
| Header brand says "Dealer Kavach" while logo says "MDG" and login says "MDG team" | Low  | Pick one name surface-wide to avoid "am I in the right app?" confusion.                                                                                                    | Naming mismatch is a small trust wobble. (Not applied: product naming decision.) |
| Tab labels are `text-[11px]`                                                      | Low  | Acceptable with the icon; could bump to `text-xs` for slow readers at GA.                                                                                                  | Minor legibility.                                                                |
| Inactive tab is `text-text-subtle` (low contrast)                                 | Low  | Keep; active tab is clearly darker.                                                                                                                                        | Fine.                                                                            |

---

## "Do-not" list — patterns that scare this user

1. **Do not show raw errors or codes** — never `Upload failed: 500`, `Network
request failed`, stack-ish strings, or HTTP status numbers. Always one warm
   sentence + what to do next.
2. **Do not use machine words** — no _ticket, record, sync, upload, queue, SLA,
   priority, category, resolved, cadence, asset, status: ACTIVE_. Say _report,
   document, message, send, runs weekly, Active/Paused_.
3. **Do not show ALL-CAPS enum values** — "ACTIVE"/"INACTIVE"/"SUSPENDED" leak
   the database. Map to friendly words.
4. **Do not show a slug/ID where a name belongs** — `svc.serviceId` as a
   headline reads as broken.
5. **Do not make the dealer "start" anything** — conversation is auto-created;
   never a "New chat" / "Create conversation" button.
6. **Do not present empty rooms** — every screen offers a next action or a warm
   "we'll message you" + a way to reach a human.
7. **Do not dead-end** — every error offers "message us in Chat" (in-app, not a
   phone call that pulls them out of the app).
8. **Do not stack modals or use confirm dialogs for reversible actions** —
   prefer immediate action + "Undo" toast over "Are you sure?".
9. **Do not rely only on disappearing toasts to report message/upload state** —
   the dealer must be able to _see_ a stuck message and retry it in place.
10. **Do not pile on required fields the dealer doesn't understand** — e.g. don't
    ask an owner to invent a "Temporary password".
11. **Do not blame the user** — "That email or password didn't work" not "Invalid
    credentials"; "didn't go through" not "you failed to send".
12. **Do not make them type when a tap will do** — keep quick-action chips and a
    one-tap camera/gallery path.

---

## Top non-copy recommendations (ranked, for a follow-up engineering pass)

1. **Optimistic message bubble + tap-to-retry** in chat (highest value on patchy
   networks). `ChatPage.tsx` / `MessageList.tsx`.
2. **Friendly service names** instead of `serviceId` (label map or API field).
3. **Show-password toggle** on Login and Profile password fields.
4. **Upload progress** on staged attachment chips; surface the silent 10-file cap.
5. **Undo (not confirm)** for suspend/activate; auto-generate temp passwords.
6. **Collapse the 3-field change-password form** behind a single row.
7. **Reconcile the app name** (MDG vs Dealer Kavach) across login/header.
