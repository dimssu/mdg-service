# MDG UX Flows

Annotated, engineer-actionable flows for the dealer app (`mdg-client`) and the
admin portal (`mdg-admin`). Each flow lists the screens/components involved and
the **anti-intimidation choices** that keep it feeling "just like a familiar
messaging app." Dealer support stays in the app. Owners have a 1:1 thread with
MDG; the manager's thread is a group with all the owners; reports are pictures
in the chat, and every request MDG makes of a dealer is asked in the chat too.

Conventions: `→` next step · `[Component]` code reference · `(copy)` exact microcopy.

---

## 1. First login & onboarding

Screens: `LoginPage.tsx` → `ChatListPage.tsx` (home) → `ChatPage.tsx`.

```
LoginPage                 ChatListPage ("/")               ChatPage (empty chat)
+------------------+      +---------------------------+    +---------------------------+
|   [ brand mark ] |      | Dealer Kavach     [🔍] [⋮] |    | ←  Support                |
|   Welcome back   | sign | [All] [Unread] [Groups]   |    +---------------------------+
|  Email  [______] | in   | (•) Support        10:24  |    |  (•) How can we help?     |
|  Pass   [______] | ───► |     last message…      2  | ─► |  [Report an issue]        |
|  [   Sign in   ] |      | (•) Manager chat   Mon    |    |  [Request a service]      |
|  [Register your  |      +---------------------------+    +---------------------------+
|   pump]          |       ⋮ → Settings                    [ Paperclip | Message | Mic ]
+------------------+
```

Steps:

0. Before first login, the member already has an **app login (email + password)**
   issued by staff during onboarding (the app-first 7-step flow ends in
   `issue-app-login`). There is no WhatsApp group; the dealer `code` (e.g. `15E`)
   identifies the organisation. Managers reuse `dealer-staff` with
   `title: "Manager"` and each get their own login.
1. Land on `/login`. Single card, one primary `Button` (Sign in). A dealer cannot
   make an account, so the card says `(No login yet?)`, explains that the MDG team will
   send an ID and password, and offers a secondary **Register your pump** button that
   opens `RegisterPage.tsx`, which sends an enrolment request to MDG.
2. On success `login()` stores token+user, `navigate('/chat')`. `/` and `/chat`
   both render the **chat list**, always, even for a member with one thread. There is
   **no separate onboarding wizard**, no bottom bar and no dashboard. An owner sees
   `Support` (their own chat with MDG), plus `Manager chat` (the group every owner
   joins) when the outlet has a manager; a manager sees `Manager chat`. The `Groups`
   chip appears only when a group chat exists.
3. Settings is behind the **⋮** menu on the list (`AppBar`), and nowhere else.
4. Tap a row. An empty chat shows `[EmptyState]` `(How can we help?)` with the helper line
   `(Send a message and the MDG team will answer you here.)` and two quick-action chips
   (`Report an issue`, `Request a service`). There is no "Talk to support" chip
   and no "Talk to a person" button: the AI raises a ticket for a person whenever
   it cannot settle a question (ADR 0017).
5. Tapping a chip calls `onQuickAction` → seeds the composer via `initialText`
   (`composerSeed`), so the dealer's first message is pre-written; they just hit Send.
   Once the chat has messages, two chips above the empty box (`Today's report?`,
   `What do I need to do?`) fill it the same way.

Anti-intimidation choices: chat is home (no dashboard, no tabs); quick chips remove
the blank-page problem; warm, human empty-state copy; the brand mark and "Welcome
back" for familiarity; the sign-in screen offers a way forward to someone with no
login, not a dead end.

---

## 2. Sending a query with a photo

Screens: `ChatPage.tsx`, `Composer.tsx`, `AttachSheet.tsx`, `MediaSendPreview.tsx` and
`MessageList.tsx`.

```
[ Paperclip ]  tap → AttachSheet:  [ Document ]  [ Camera ]  [ Gallery ]
      │ Camera / Gallery
      ▼
MediaSendPreview  (the picture large on black)
   strip of pictures: tap = switch · ✕ = drop this one · + = add more
   [ Add a caption…                                        (Send) ]
      │ Send
      ▼
MessageBubble (mine): picture(s) + caption, clock → ✓ sent → ✓✓ delivered → blue ✓✓ read
```

Steps:

1. Tap `Paperclip` → the attach sheet. A photo, from Camera or Gallery, goes through
   the **send preview** first; a PDF or other file from Document becomes a chip
   above the box. Up to 10 files per message.
2. In the preview the dealer can drop the current picture (✕), add more (+) or write a
   caption. Back throws everything away, and so does dropping the last picture.
   Nothing is uploaded until Send.
3. The Send button shows only when there is something to send. With an empty box it
   is the **mic**, for a voice note. An empty message cannot be sent.
4. Send: the bubble appears at once with a clock (`useSendMessage` adds a `temp-`
   bubble) and a spinner veil on each picture. Files upload per file; a failed one
   shows `(We couldn't send <name>. Please check your network and try again.)` and
   the rest still send. If nothing goes, the words or photos come back into the box.
5. Tap a sent picture to open the viewer (flow 3). Swipe a bubble to reply to it;
   long-press for reactions, copy and download.
6. Delivery feedback: clock → `Check` (sent) → `CheckCheck` (delivered) → blue
   `CheckCheck` (read), the sent/read pattern from everyday messaging apps.

Anti-intimidation choices: camera and gallery are one tap in the sheet; big round tap
targets; the picture is shown large before it goes; the Send button appears exactly
when sending is possible; no jargon, no error codes, just "We couldn't send <name>."

> Gap: a failed send has no in-place retry bubble (see PRD §9, Fixes still open).

---

## 3. A report picture arrives

Screens: `MessageBubble.tsx` → `MediaViewer.tsx` → `ChatInfoPage.tsx` →
`ChatMediaPage.tsx`. Realtime: `useConversationSocket.ts` (new message).

```
In chat (ordinary incoming bubble from MDG, left):
   +------------------------------+
   | [        DSR picture       ] |
   | Short caption in my language |
   |                    10:24 am  |
   +------------------------------+
        tap → MediaViewer (black): pinch / double-tap to zoom
              swipe → next / last picture in the chat · [Download]

Chat name → Chat info → "Media, links and docs":  [ Media ] [ Docs ] [ Links ]
```

Steps:

1. A report (the DSR, Credit & DOD, a Kavach card, the load plan, a ledger card) is
   posted by a service, or sent by an admin from the composer (flow 5). It arrives
   live as a `message:new`, and a push opens that exact chat (`/chat/<id>`).
2. Every `system: true` message draws as an **ordinary incoming bubble from MDG**:
   left, white, with swipe-to-reply, long-press, reactions, copy and download. The
   client does not tell a report from a message (ADR 0018). There is no record card
   and no Reports tab.
3. Tap the picture → `MediaViewer` full-screen. Zoom with a pinch; swipe to the
   next or the last picture; download.
4. An older report is found by scrolling the chat, or on the media page: tap the chat's
   name → `Chat info` → `Media, links and docs`, tabs `Media` / `Docs` / `Links`.

Anti-intimidation choices: a financial report is a picture like any other, so there
is nothing new to learn and no place to hunt; one obvious action (tap); the viewer
works like the phone's own gallery.

---

## 4. MDG asks for something

Screens: `MessageBubble.tsx` (the ask bubble) → `Composer.tsx` → `MediaSendPreview.tsx`.
Data: `Message.ask`, `Message.answersAsk`, `GET /asks/me/states?refs=…` (ADR 0019).

```
In chat (MDG bubble with an ask):
   +-----------------------------------+
   | Density register page · 12 Oct    |
   | Please send a photo of the page…  |
   | [ 📷 फ़ोटो भेजें ]  (Send photo)   |   <- opens the camera inside the tap
   | [ Choose from gallery ]           |   <- or "Choose file" for a paper
   +-----------------------------------+
        │ camera → MediaSendPreview → Send
        ▼
My picture, sent as a reply quoting the ask (answersAsk = reg:2026-10-12)
        ▼
The ask reads:  Sent — MDG is checking  →  Received
                or  MDG sent it back: <reason>  + the buttons again
```

Steps:

1. MDG's request arrives as a message in the chat; a push opens the chat. The ask names
   what is wanted and for which day, in the member's language, and ends by saying to
   tap **Send photo**. Three kinds: a paper (`doc:`), yesterday's density register
   page (`reg:`, asked each morning at 09:00 IST) and a Kavach photo (`kv:`).
2. Tap **Send photo**. The camera opens inside the tap (the Android WebView drops a
   picker opened later). **Choose from gallery** (or **Choose file** when the paper
   may be a PDF) covers a picture already taken.
3. The picture goes through the ordinary send preview and is sent as a reply to the
   ask. A plain swipe-reply with a picture on an ask message counts too.
4. The bubble reads where the request stands: `Sent — MDG is checking`, `Received`,
   or, if MDG sent it back, `MDG sent it back:` and the reason word for word, with the
   buttons again. If the state cannot be loaded, the bubble offers Retry.
5. The register page is received on its own and MDG replies "✓ Received". A paper or a
   Kavach photo waits until a person at MDG marks it received (flow 6).
6. A voice note or plain words are never an answer; they are an ordinary message and a
   person reads them.

Anti-intimidation choices: the request and its answer sit in one place; one big
button with the verb on it; no screen to find, no list of "things to send"; the dealer
never certifies anything, so there is no form to get wrong.

---

## 5. Admin sends to the outlet

Screens: `InboxPage.tsx` → `features/chat/Composer.tsx` (admin).

```
Composer (admin), a file staged:
   Send to  [ This chat ▾ ]      ← This chat · Owners · Manager · Both
   [ 📎 dsr-14-mar.pdf (x) ]
   [ Daily Sales Report — 14 Mar 2026 ............ ]  [ Send ]
```

Steps:

1. In a thread, attach a file and type a caption. There is no "Upload report" button,
   no type, period or announce field: a report is a file sent in the chat.
2. While there is something to send, **Send to** sits above the box. **This chat** is
   the default (`Only the people in this chat`). The other choices are **Owners**
   (`Every owner, in their own chat`), **Manager** (`The manager, in the group chat`)
   and **Both** (`Every owner and the manager`).
3. Anything but This chat calls `POST /conversations/:id/messages/share`: one copy per
   chat, as the admin, with the usual unread marks and one push per person. A one-line
   confirmation names who was reached ("Sent to 2 owners and the manager."). The
   choice goes back to **This chat** after every send.
4. Voice notes and replies stay in this chat. A share stops the reply clock only in the
   chat written from.

Anti-intimidation note: admin-facing, so one small choice is acceptable; the
dealer-visible result is the friendly part, an ordinary picture with a plain caption.

---

## 6. Admin handling a ticket (pick up → priority/category → reply → resolve)

Screen: `InboxPage.tsx` (3-pane: filter rail · conversation list · chat + details).

```
Rail             List                  Chat                          Details (lg)
Unassigned  4   Dealer A   2m         Dealer A   [Assigned]         Triage
Mine        7   ● preview…             Assigned to You               Priority [Normal▾]
All open   12   Dealer B   1h          ───────────────────           Category [General▾]
Resolved    3   preview…               ...messages...                Open requests
Dropped     1                          [ ticket strip ] [ AI strip ] Dealer (code/phone)
Tickets     2                          [ Composer · Send to ]        Media, links, docs
⚡ AI       5                          actions: [Pick up] | [Resolve] | [Reopen]
🛡 AI guard 0
```

Steps:

1. **Triage:** pick a filter in the rail, each with a live count badge: Unassigned,
   Mine, All open, Resolved, Dropped (taken back by the 20-minute sweep), Tickets (an
   open `Ticket` record), ⚡ AI (the AI first line has answered or handed off) and
   🛡 AI guard (someone tried to plant a figure or read the instructions back). The
   last three are lenses over the same threads; nothing moves into them. List rows
   show dealer, relative time, priority pill (only if not normal), last-message
   preview, unread dot. First row auto-selects.
2. **Pick up:** OPEN conversations show one primary **Pick up** (`UserPlus`) →
   `assignConv` assigns to self → status becomes ASSIGNED, badge flips to `info`.
3. **Classify:** in the **Triage** card set **Priority** and **Category**
   (`Select` → `updateTicket.mutate`). Priority drives the list pill color
   (urgent=danger, high=warning, low=info; normal shows none).
4. **Reply:** type in the `[Composer]` (admin variant). Realtime via `useInboxSocket`
   (list) + `useConversationSocket` (thread); typing indicator + read receipts mirror
   the dealer side. A reply also pushes a notification to that chat's members, and
   marks the thread's open tickets seen.
5. **Tickets:** when the AI hands a question over, a strip above the composer shows the
   ticket with **Resolve**. Resolving takes a written note and is the only thing that
   closes it. The same tickets are on the Tickets page.
6. **Open requests:** the details card lists what MDG is waiting on and what the dealer
   sent that needs checking. **Show message** scrolls to the dealer's photo; **Mark
   received** and **Send back** (with a reason) close it (flow 4). The same two
   actions are in the message menu on a dealer's picture, and an "Answer to: …" chip
   sits under the photo. On a phone the Details row reads `Details · 2 to check`.
7. **Resolve:** ASSIGNED shows **Resolve** (`CheckCircle2`) → opens a **service-log
   dialog** (resolution requires logging the service): pick a service from the
   catalog (`GET /services`) or **Other** + a free-text service name, plus required
   **notes**. `resolveConv` posts the service log and sets status RESOLVED
   (`success` badge); composer disables; the members get a "resolved" push. The
   logged service appears in the dealer's **services-provided** history on the
   dealer detail page. **Reopen** (`RotateCcw`) brings it back.
8. Sending a report to the outlet is part of the composer (flow 5).

Note: the inbox lists one conversation per owner and one manager group per outlet,
grouped by organisation. Resolving one thread does not touch another, but service
history is shared across the pump.

Anti-intimidation note (admin side = efficiency, not calm): the action set is
**state-driven**: only the legal next action shows per status (Pick up / Resolve /
Reopen), so admins never guess. Single source of truth for status→color is
`statusIntent.ts` / `INTENT_CLASSES`.
