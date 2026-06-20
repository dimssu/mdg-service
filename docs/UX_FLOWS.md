# MDG UX Flows

Annotated, engineer-actionable flows for the dealer app (`mdg-client`) and the
admin portal (`mdg-admin`). Each flow lists the screens/components involved and
the **anti-intimidation choices** that keep it feeling "just like a familiar
messaging app." All dealer communication is in-app — there is no WhatsApp
channel; each member has their own private chat with support, while the pump's
records are shared across the team.

Conventions: `→` next step · `[Component]` code reference · `(copy)` exact microcopy.

---

## 1. First login & onboarding

Screens: `LoginPage.tsx` → `App.tsx` shell → `ChatPage.tsx`.

```
LoginPage                          ChatPage (default route)
+------------------+               +-----------------------------+
|     [ MDG ]      |               | Support      ● Online       |  <- header
|  Welcome back    |   sign in     +-----------------------------+
|  Email  [______] | ───────────►  |                             |
|  Pass   [______] |               |   (•) MessageCircleHeart    |  <- EmptyState
|  [   Sign in   ] |               |     How can we help?        |
|  Need access?... |               |  [Report an issue] [Request |  <- quick-action chips
+------------------+               |   a service] [Talk to..]    |
                                   +-----------------------------+
                                   [ Paperclip | Message | Send ]
```

Steps:

0. Before first login, the member already has an **app login (email + password)**
   issued by staff during onboarding (the app-first 7-step flow ends in
   `issue-app-login`). There is no WhatsApp group; the dealer `code` (e.g. `E01`)
   identifies the organisation. Managers reuse `dealer-staff` with
   `title: "Manager"` and each get their own login.
1. Land on `/login`. Single card, one primary `Button` (Sign in). No signup —
   `(Need access? Contact your MDG account manager.)`.
2. On success `login()` stores token+user, `navigate('/chat')`. There is **no
   separate onboarding wizard**: the home screen _is_ the member's **own private
   chat** (each member has their own thread; records/reports are shared across the pump).
3. Empty chat shows `[EmptyState]` `(How can we help?)` / `(Send a message and a
real person from our support team will reply.)` plus three quick-action chips
   (`Report an issue`, `Request a service`, `Talk to support`).
4. Tapping a chip calls `onQuickAction` → seeds the composer via `initialText`
   (`composerSeed`), so the dealer's first message is pre-written; they just hit Send.

Anti-intimidation choices: chat is home (no dashboard); quick chips remove the
blank-page problem; warm, human empty-state copy; "Online" + teal dot signals a
real person is there; logo + "Welcome back" for familiarity.

---

## 2. Sending a query with a photo

Screens: `ChatPage.tsx` + `Composer.tsx` + `AttachmentPreview.tsx` + `MessageList.tsx`.

```
[ Paperclip ]  tap → OS file/camera picker (accept image/*,.pdf,.doc,…)
      │
      ▼ staged
[ (thumb) report.jpg  12 KB  (x) ]   <- StagedAttachmentChip, horizontal scroll
[ Paperclip | "Message" textarea  | (Send ● lit) ]
      │ type caption + Send (or Cmd/Ctrl+Enter)
      ▼
ChatPage.handleSend(text, files):
   for each file → uploadAttachment(file, conversationId)  (toast per failure)
   sendMutation.mutateAsync({ conversationId, body, attachments })
      ▼
MessageBubble (mine): image (rounded-xl, tap = lightbox) above brand bubble,
   time + single Check → CheckCheck (teal) when admin reads it.
```

Steps:

1. Tap `Paperclip` → picker. Selected files become `StagedFile[]`; images get an
   object-URL thumbnail, others a `FileText` tile + filename + size.
2. Each chip has an `(x)` to remove (object URLs revoked). Up to 10 staged.
3. Send button is greyed (`bg-surface-2`) until there is text **or** an attachment,
   then lights to `bg-brand` — the dealer can _see_ when sending is possible.
4. Upload happens per-file in `ChatPage`; a failed upload shows a plain toast
   `(Couldn't upload <name>: <reason>)` and the rest still send.
5. Sent image renders in the bubble; tap opens a full-screen lightbox (tap to dismiss).
6. Delivery feedback: `Check` (sent) → `CheckCheck` in teal (read) — the familiar
   sent/read pattern from everyday messaging apps.

Anti-intimidation choices: camera/gallery via native picker (no custom uploader);
big 40px round tap targets; staged previews so they see what they're sending; the
button visibly enabling; no jargon, no error codes — just "Couldn't upload."

---

## 3. Receiving a DSR (in-chat card → Reports shelf)

Screens: admin uploads (flow 5) → `MessageBubble.tsx` `CardMessage` → `RecordsPage.tsx`.
Realtime: `useRecordsSocket.ts` (refresh + toast), `useConversationSocket.ts` (new message).

```
In chat (CardMessage, centered):
        (optional caption text, muted)
   +------------------------------------------+
   | [▥ FileBarChart]  DSR                     |   <- compact RecordCard
   |                   Daily Sales Report      |
   |                   14 Mar 2026             |
   |                   Tap to view ▸           |
   +------------------------------------------+
                    10:24 AM
            tap → opens signed file in new tab

Reports tab (RecordsPage), grouped + newest-first:
   DSR
   [ ▥ DSR · Daily Sales Report · 14 Mar 2026 · Tap to view ]
   INVOICE
   [ ◳ Invoice · March Invoice · Tap to view ]
```

Steps:

1. Admin upload emits `record:new`. `useRecordsSocket` invalidates the records
   query and fires a toast so the dealer notices even off the Reports tab.
2. In chat the record arrives as a **compact `RecordCard`** (`message.card`), not a
   raw link — colored icon tile + type chip + title + period + `(Tap to view)`.
   `useRecord(recordId)` resolves the signed URL; until then footer reads `(Preparing…)`.
3. The same record also appears under the **Reports** tab, grouped by type with
   uppercase headers, newest first, as full-width `RecordCard`s.

Anti-intimidation choices: a financial document shows up as a friendly card with a
human title, not a filename or a row in a grid; one obvious action (`Tap to view`);
`(Preparing…)` instead of a broken/disabled-looking link; proactive toast so they
never have to hunt; Reports shelf is a calm stack, never a spreadsheet.

---

## 4. Browsing reports

Screen: `RecordsPage.tsx` (bottom tab "Reports", `App.tsx`).

Steps:

1. Tap **Reports** in the bottom tab bar (`FileText` icon + label).
2. `useRecords()` loads all of the dealer's records; grouped into a `Map<RecordType, []>`,
   each group sorted newest-first, rendered in `RECORD_TYPES` order.
3. Each group: uppercase section header (`text-xs uppercase tracking-wide`) + a
   stack of full `RecordCard`s. Tap any card → signed file opens.
4. States: loading → `Spinner`; error → `[EmptyState]` `(Couldn't load your
reports / Please check your connection and try again.)`; empty → `(No reports
yet / Your reports will appear here. We'll message you when a new one is ready.)`.

Anti-intimidation choices: zero filters, search, or columns — just labelled stacks
of cards; reassuring empty state that tells them what will happen next; identical
card to the in-chat one (recognition).

---

## 5. Admin uploading a record

Screens: `InboxPage.tsx` (Upload report button / Reports panel `FileUp`) → `UploadRecordDialog.tsx`.

```
Inbox header:            ... [ Reassign ] [ Resolve ] [ ⤒ Upload report ]
                                                          │ open dialog
                                                          ▼
UploadRecordDialog
  File   [  ⤒ Choose a file (max 25 MB)  ]   → picked: [ 📎 name.pdf (x) ]
  Type*  [ Daily Sales Report  ▾ ]   (auto-fills Title until edited)
  Title* [ Daily Sales Report      ]
  Period [ 14 Mar 2026             ]  (optional)
  Note   [ Anything the dealer...  ]  (optional)
  [✓] Announce in chat
                                   [ Cancel ]  [ ⤒ Upload ]
```

Steps:

1. From a selected conversation, click **Upload report** (header) or the `FileUp`
   icon on the Reports context card — both open `UploadRecordDialog` scoped to the dealer.
2. Choose file (≤25 MB enforced client-side; over-limit → inline `(<name> exceeds
25 MB limit)`). Picked file shows as a removable chip.
3. Pick **Type** → Title auto-suggests from `RECORD_TYPE_LABELS` until the admin
   edits it (`titleEdited` flag). Period/Note optional.
4. **Announce in chat** checkbox (default on) → posts the in-chat `CardMessage` to the dealer.
5. Submit: `uploadAttachment` then `createRecord.mutateAsync`. Success → toast
   `(Report uploaded)` + `(Sent to <dealer>)`, dialog resets and closes.

Anti-intimidation note: this screen is admin-facing, so density is acceptable, but
the **dealer-visible output** (title, period, in-chat card) is the friendly part —
the admin writes plain titles, not file paths.

> Gap: this is the only multi-field form in the system; keep all dealer-facing
> labels (title/period) human since they surface verbatim on the card.

---

## 6. Admin handling a ticket (pick up → priority/category → reply → resolve)

Screen: `InboxPage.tsx` (3-pane: filter rail · conversation list · chat + context).

```
Rail            List                     Chat                         Context (lg)
Unassigned 4   Dealer A   2m            Dealer A   [Assigned]         Ticket
Mine       7   ● preview…               Assigned to You              Priority [Normal▾]
All open  12   Dealer B   1h            ─────────────────────        Category [General▾]
Resolved   3   preview…                 ...messages...               Dealer (name/code/phone)
                                        [ Composer ]                 Reports [ FileUp ]
                          actions: [Pick up] | [Reassign][Resolve] | [Reopen]
```

Steps:

1. **Triage:** pick a filter in the rail (Unassigned / Mine / All open / Resolved),
   each with a live count badge. List rows show dealer, relative time, priority pill
   (only if not normal), last-message preview, unread dot. First row auto-selects.
2. **Pick up:** OPEN conversations show one primary **Pick up** (`UserPlus`) →
   `assignConv` assigns to self → status becomes ASSIGNED, badge flips to `info`.
3. **Classify:** in the Ticket context card set **Priority** and **Category**
   (`Select` → `updateTicket.mutate`). Priority drives the list pill color
   (urgent=danger, high=warning, low=info; normal shows none).
4. **Reply:** type in the `[Composer]` (admin variant, `onSend({ body, attachments })`).
   Realtime via `useInboxSocket` (list) + `useConversationSocket` (thread); typing
   indicator + read receipts mirror the dealer side. A reply also pushes a
   notification to that member's registered device(s).
5. **Resolve:** ASSIGNED shows **Resolve** (`CheckCircle2`) → opens a **service-log
   dialog** (resolution requires logging the service): pick a service from the
   catalog (`GET /services`) or **Other** + a free-text service name, plus required
   **notes**. `resolveConv` posts the service log and sets status RESOLVED
   (`success` badge); composer disables; the member gets a "resolved" push. The
   logged service appears in the dealer's **services-provided** history on the
   dealer detail page. **Reopen** (`RotateCcw`) brings it back.
6. Throughout, **Upload report** stays available in the header (flow 5). A new
   report pushes to **all** members of the organisation.

Note: the inbox lists one conversation **per member**, grouped by organisation —
resolving one member's thread does not touch another member's chat, but records
and service history are shared across the pump.

Anti-intimidation note (admin side = efficiency, not calm): the action set is
**state-driven** — only the legal next action shows per status (Pick up / Resolve /
Reopen), so admins never guess. Single source of truth for status→color is
`statusIntent.ts` / `INTENT_CLASSES`.

> Gap: **Reassign currently re-assigns to self** (no admin picker yet —
> `handleReassign` calls the same `assignConv`). Document until a picker ships.
