# ADR 0018 — The chat is the app

Status: accepted, 2026-10-12. **Supersedes the Records parts of ADR 0004** — §1 (manual
upload of records) and the "Records shelf" half of §2. The other half of ADR 0004 §2, _the
Conversation is the ticket_, stands (see ADR 0017). Extends ADR 0011 (the Kavach page keeps
its job and changes its door) and ADR 0008 (every new word is written in Hindi and English).

- Contracts: `shared/src/types/conversation.ts` (`Conversation.unreadCount`,
  `MessageSearchHit`), `shared/src/types/enums.ts` (`RECORD_MIGRATED`). Removed from all four
  copies of `@dk/shared`: `types/record.ts`, `Message.card`, `MessageReplyContext.card` and
  `cardTitle`, `createRecordSchema`, the `record:new` socket event.
- Migration: `mdg-backend/src/scripts/migrateRecordsIntoChat.ts`

## What the owner asked for

A dealer should open the app and not feel they are inside some other app. The chat should look
and behave like WhatsApp. The owner's example: a shared report is a picture in the middle of the screen
with grey text under it. It should be an ordinary WhatsApp picture, and a tap should open it
full-screen with a swipe to the next and the last one.

And: one screen. No Reports tab, no Kavach tab. "Reports" should stop being a thing at all —
a report is a picture someone shared in the chat, and the admin side already knows what was
shared, when, and to whom. Clean up the code and the database, and lose nothing we need.

## Context — what was there

The dealer app was a chat with a header and a bottom bar of four tabs: Chat, Reports, Kavach,
Profile. A dealer could receive a report in three different ways, and they looked different:

| Way it arrived                                                                    | How the dealer saw it                                                         |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A **record card**: an admin uploaded a file; a card in the chat said "X is ready" | A grey centred line. The file was on the Reports tab, not in the chat         |
| A **shared report**: DSR, Credit & DOD, Kavach card, load plan, ledger card       | A `system: true` message, drawn centred: the picture, then grey text under it |
| The **Reports shelf**                                                             | A list of every record ever uploaded, for everyone in the outlet              |

Three facts decided the shape of the change.

**Only the first row is the `Record` model.** The pictures the owner dislikes are the second
row. They never touched `Record` — they are plain messages with the picture attached, written
by `postToDealer`. Deleting the Record model alone would not have changed what he sees.

**A record card carried no file.** It held a pointer to the `Record` document, and only that
document knew the file's storage key. Some records were never announced in the chat at all.
Dropping the `records` collection with no move first would have left every one of those files
in storage with nothing pointing at it.

**The shelf was shared; the chat is not.** The shelf showed every record to every member of
the outlet. A support thread is private to its owner. Only the manager group is seen by the
manager and all owners. So "just show it in the chat" would have quietly taken every report
away from the manager and from the second owner.

## Decision

### 1. The chat list is home — always

Even with one chat, as WhatsApp does. The single-thread auto-forward is gone. There is no
bottom bar and no app-wide header; each screen draws one top bar of its own. Settings is
reached from the ⋮ menu on the chat list.

### 2. "Reports" is removed everywhere

The `Record` model, `POST/GET /v1/records`, the `record:new` event, the Reports tab, the record
card in the chat, the admin's "Upload report" (all three buttons: the Details card, the thread
header and the phone's action sheet) and its Reports card, the AI's `records_recent` lookup. A report reaches a dealer only as a **picture (or file) message in the chat**.

The admin files a report the way anyone sends a file: the chat composer, which already attaches
files and a caption in one message, marks the thread unread, clears the reply clock, pushes to
the phone and reaches the screen live. It does not carry a report _type_, a _period_ or a
_note_ — the caption is free text. On its own a chat reaches only its own people, where the shelf
reached the whole outlet, so the composer gained a **"Send to"** choice: This chat (the default,
and what it returns to after every send), Owners, Manager or Both — the same three every report's
Share button offers. Anything but "This chat" goes through `POST
/conversations/:id/messages/share`, which posts one copy per chat through `postToDealer`, as the
admin and not as a notice, with the usual unread marks and one push per person. It stops the
reply clock only in the chat the admin wrote from: a file to the whole outlet answers nobody's
question. Voice notes and replies stay in this chat.

### 3. The Kavach page stays; only its door moves

The Kavach page is the dealer's only way to answer MDG's "send us a photo" requests. Nothing
else in the app can send that proof, and a photo sent in chat is not linked to the request. So
it is **kept**, moved from the tab bar to a row in Settings called "Pump health", shown only
when the dealer has a Kavach programme. The route `/kavach` is unchanged.

The Kavach card and the daily Kavach line used to push with `deeplink: 'kavach'`. The card is a
chat picture now, so both use the ordinary `/chat/<id>` push. An app installed earlier still
has the old token map in its binary, but a push `path` wins over a `deeplink`, so no new app
release is needed.

### 4. A report picture is a picture message — drawn by the client, not rewritten in the data

Every `system: true` message now draws as an **ordinary incoming bubble from MDG**: left side,
white. That covers every report sender, the daily Kavach text line and the "Resolved —" notice.
The client cannot tell a notice from a message without a new field, and a plain bubble from MDG
is right for all of them. They become fully interactive: swipe to reply, long-press, react,
copy, download. "Info" stays for the sender's own messages.

The senders keep writing `system: true`, and the admin app keeps drawing those messages its own
way. The alternative was to flip the senders to `system: false`. Rejected:

- Every report ever shared is `system: true` in the database. The client would still need the
  old path for all of it, unless the database were rewritten — and the text-only system
  messages cannot be told apart from the pictured ones reliably.
- The AI's briefing labels a `system` message "a notice" and a non-system admin message "a
  person from the team". Flipping would have written the wrong label into every prompt.
- The admin would redraw every share as an admin bubble. A visible change nobody asked for.

A change in the client alone works on every old message at once, with nothing to migrate.

### 5. Pictures: one bubble, one album grid, one viewer

- The caption sits **inside the same bubble**, under the picture. With no caption, the time (and
  the ticks, on my own messages) sit on the picture, bottom right, over a soft dark gradient.
- Several pictures in one message become an album: 2 side by side; 3 as one tall on the left and
  two stacked on the right; 4 or more as a 2×2 with "+N" over the fourth. The DSR share already
  sends two pictures in one message, so this is not a rare case.
- A tap opens a **full-screen viewer**. Swipe left and right through _every_ picture in the
  conversation, in time order, not only the message's own. Pinch and double-tap zoom; swipe down
  to close; a tap hides the bars. The top bar shows who sent it and the date and time; the
  caption is at the bottom; the download arrow is in the bar. The phone's Back closes it.

### 6. The rest of the thread behaves like WhatsApp

Chat list: green unread pill with the count, the time turning green, filter chips (All, Unread,
Groups), search. Open chat: wallpaper, bubbles with a tail on the first of a run, time and ticks
inside the bubble, date chips and a floating date while scrolling, an "N unread messages"
divider that the thread opens on, a scroll-to-bottom button with a count, older history that
loads by itself, a long-press that selects (reply, copy, download, info, with the six quick
reactions above the message), voice notes with speed and scrub, document bubbles with a file-type
badge, a chat info page, and a media gallery with Media, Docs and Links. Composer: a white pill
with a paperclip and a camera, and a round green mic-or-send button beside it; an attach sheet;
and a full-screen preview with a caption when photos are picked.

Colours come only from a `wa-*` token set. Light theme only.

### 7. What the server had to learn

| Needed                                                                                | Why                                                                                   |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `unreadCount` on each thread in `GET /conversations/mine`, for the member who asked   | The pill on the chat list. Before, a thread had only a yes/no per member              |
| `GET /conversations/:id/messages/search?q=`                                           | Search inside a chat. Body text only, newest first, 50 at most, participants only     |
| `postToDealer` signs picture addresses before it emits on the socket                  | A report that arrived live had no address, so it drew as a file row until a refetch   |
| Every push that carried only a `conversationId` now also carries `path: '/chat/<id>'` | The chat list used to ignore `/chat?c=<id>`. The client now forwards the old form too |

The count is deliberately not "every message without my read mark". Months of history were
never marked read one by one, and a literal count would have put "138" on threads with one new
message the day this shipped. So a thread counts only while it is flagged unread for that
member, and only the messages after the newest one they have read or sent — not counting an old
report moved in by the migration, which is written already read and backdated.

### 8. Settings

WhatsApp's layout: a profile row on top, then rows each with an icon, a title and a grey line —
Account, Language, Your team (owner only), Your services, Warriors & points, Your papers,
Density register (when attached), Pump health (when a programme exists), Help, Log out. The five
feature pages keep their routes and gain a top bar with a back arrow.

## How the old reports were moved into the chat

Nothing is deleted until it has been copied somewhere safe and then moved. The script is
`node dist/scripts/migrateRecordsIntoChat.js` on the server. It uses the database driver
directly, because the `Record` model and `Message.card` no longer exist in the code.

**Dry by default.** With no flag it prints exactly what it would do and writes nothing — it does
not even upload a backup. `--commit` does the work. `--drop-records` is allowed only with
`--commit`, and only drops the `records` collection at the very end of a run whose verification
passed.

**Backup first.** Before the first write: every `records` document, every message holding a
`card` or a reply to one, and every audit row about a record, written as canonical extended JSON
(ids stay `{"$oid": …}`, times `{"$date": …}`, so `mongoimport --jsonArray` puts them straight
back with their types) to
`var/backups/records-<time>/` on the machine **and** to storage under `backups/records-<time>/`
— a prefix no download route will sign — with a manifest of counts and checksums. If the upload
fails, the script stops before it changes anything. The server's own disk is not a safe only copy.

**An announced record** (a chat message whose card names it): that message is converted in place
into the picture message — it gets the file attached, a caption of the title (plus " — " and the
period, if there was one), `system: false`, and no card. It keeps its id, its time and who has
read it. No push, no socket event, no unread change, no change to the thread's last-message time.
So an old report does not light up a badge.

**The whole outlet still sees it.** For each record, every owner's support thread and the manager
group (if there is one) must end up with a copy. The converted announcement counts as its own
thread's copy; the missing ones are inserted **backdated** to the record's original time, sent by
the admin who uploaded it, already marked as read and delivered to the dealer members. Only the
people who could see the record on the shelf can see it in the chat. A thread that does not exist
is never created in a dry run; in a real run it is created only by the same function the app uses
to make a thread, and given its newest report's time and words so it does not sit at the bottom
of the list reading "No messages yet".

**The note is not shown.** The old upload form had a Note box labelled for the dealer, but the
dealer app never displayed it and the AI treats it as internal. Putting it into a caption would
have shown the dealer text nobody meant them to read. It is kept in the backup and in the audit
row.

**Replies and orphans.** A reply that quoted a card is rewritten from the converted original —
including one sent after the new server went out but before the script ran, which quotes the card
without saying so. A
card whose record is gone is rebuilt from the audit row that recorded the upload, if the file is
still in storage; if not, its text is left as it was and it is listed for a person to look at.
Nothing is deleted.

**The trail.** One audit row per record: entity `Record`, action `RECORD_MIGRATED`, `before` = the
whole record including the note, `after` = the message and conversation ids it became. The old
`CREATE` and `RECORD_VIEWED` rows are untouched. Then the empty `card` field is removed from every
message that still has one (the old schema wrote `card: null` on all of them) — a couple of
thousand messages per write, so the live app is never held behind one long write.

**Safe to run twice.** Converted messages carry a marker, so a second run finds them and does
nothing new. Last, it checks that no message still holds a card, that every record has at least one
message with its marker, and that the counts match the backup manifest, and prints a short summary.

**The files stay.** No object in storage is deleted — messages point at them now.

## What was kept

- **The Kavach page**, as above.
- **The admin's own record of every share.** `DsrReport.shared`, `CreditDodSnapshot.shared`, the
  Kavach digest's sent fields, `LoadPlan.shared`, `LedgerWatchCard.shared`, and the audit row each
  of them writes. The Overview "sent" and "done" counts read them. None of it was touched. That
  record is thinner in places — the daily Kavach text line and the AI's re-sends leave only an
  audit row, and a regenerated DSR keeps the old send's time but not its audience — and this
  change neither fixes nor worsens that.
- **The audit words.** The `Record` entity and `RECORD_VIEWED` stay in the shared vocabulary so
  the Activity page can still filter and label the old rows. `RECORD_MIGRATED` is new, and the
  Activity page shows it in the same tone as a view: it is history being read back, not news.
- **The document cabinet** ("Your papers") and the AI's `records_list` and `record_send` intents.
  Those were always about the cabinet, not the `Record` model. Only the one lookup that read the
  `Record` collection went, so an outlet with an empty cabinet is now told plainly that nothing is
  on file, instead of being pointed at a Reports tab that no longer exists. The AI's guide to the
  app was rewritten for the new screens.
- **Old installs.** The phone app is a shell around the web app, and the web app is always the
  newest. A tap on an old `/records` push lands on the chat list.

## Left out, on purpose

- **Star, forward, delete.** The thread is a business record. MDG must be able to see what was
  said and asked, and a delete would take part of that record away.
- **Dark mode.** Light theme only this round.
- **An emoji panel** in the composer. The six quick reactions on a message stay.
- **Link previews.** Links stay tappable; no card is fetched.
- **Rewriting the senders.** They still write `system: true` (decision 4).
- **A picture's size in the data.** Attachments carry no width or height, so a picture takes a
  sensible box and gets its real shape when it loads. Stamping the size when a card is drawn is a
  later job.
- **Searching file names or pictures.** Search reads the words of a message and nothing else.

## Costs, stated

- **A migration on live messages.** This is the part that can hurt. It is covered by the backup,
  the dry run, the in-place conversion that keeps ids, the marker that makes it repeatable, and a
  verification step. It is still the one piece to watch the first time it runs.
- **One window of plain text.** The script ships inside the backend build, so the new server goes
  out first. Until the migration has run, an old announcement reads as one line, "X is ready",
  with no file. Run it straight after the deploy.
- **The admin and the dealer now draw the same message differently** — a shared report is a
  centred notice in the admin and a left-hand bubble in the dealer app. That is deliberate: the
  admin inbox is a work screen, not a copy of WhatsApp. Because a dealer can now react to a
  report, the admin shows those reactions under the notice. An old report moved in by the
  migration is `system: false`, so the admin draws it as an ordinary admin bubble with its file.
- **A picture can change under an old message.** Ledger Watch saves its "other movements" card
  under one fixed name per dealer, so drawing it again replaces the file an older message points
  at. A WhatsApp picture never changes. Left as found; the fix, if it matters, is a fresh file
  name on each draw.
- **The admin lost a quick list.** The Reports card in the inbox's Details pane is gone. The
  Media card beside it still shows the pictures, including the converted ones.
- **Four copies of `@dk/shared`** had to change together. The two new shapes were added first, the
  record types removed last.

## Deploy

In one sitting, in this order — the same order the script's own header gives:

1. Deploy the **backend**. The script needs only its own build.
2. **Dry-run** the migration straight away: `node dist/scripts/migrateRecordsIntoChat.js`. Read
   the list. Look at any record with a note, and any dealer with no owner and no manager.
3. Run it with `--commit`. Check the printed summary and the backup folder.
4. Release the **admin** and the **dealer client**. Between steps 1 and 4 an old dealer app shows
   an empty Reports shelf and an old announcement as a plain line, and the AI's guide already
   describes the new screens — so keep that window to minutes.
5. Let it sit. When satisfied, run `--commit --drop-records` once more: it finds nothing new,
   checks again, and drops the `records` collection.

Check it yourself: open the dealer app — you land on the chat list with no bar underneath; a
report is a picture in the chat; tap it and swipe. In the admin, Activity filtered to
`RECORD_MIGRATED` lists one row per old report.
