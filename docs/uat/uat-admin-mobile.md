# MDG Admin — Mobile UAT Plan (375 px phone)

**Status:** v1 · **Owner:** UAT · **Surface:** `mdg-admin` (React + Vite + Tailwind, web) · **Last updated:** 2026-07-07

The admin portal was just made mobile-responsive. This plan verifies that **every**
feature enumerated from `src/App.tsx` routes, `src/pages/**`, and `src/features/**`
is **reachable and usable on a ~375 px viewport** (iPhone SE / small Android in
portrait). Each case carries a **mobile-reachable verdict** backed by the exact
component + Tailwind class logic that was read, cited as `file:line`.

## How to use this document

1. Open the deployed admin in a phone-sized viewport: real phone, or Chrome
   DevTools device toolbar set to **375 × 667** (iPhone SE). The app declares
   `width=device-width, initial-scale=1.0` (`mdg-admin/index.html:5`), so DevTools
   emulation is faithful.
2. Sign in (see M-AUTH-01). Super-admin-only cases are marked **[SA]** — run them
   signed in as a super-admin (`isSuperAdmin` from `/auth/me`,
   `src/hooks/useIsSuperAdmin.ts:9`).
3. Run top to bottom; some cases depend on earlier ones (e.g. open a dealer before
   testing its tabs). Tick **PASS / FAIL**. On FAIL, note what you saw.
4. The breakpoint that matters: Tailwind `md` = 768 px and `lg` = 1024 px. A 375 px
   phone is **below both**, so every `md:` / `lg:` prefixed rule is **off**, and the
   mobile branch (hamburger nav, master/detail inbox, slide-over context) is active.

## Verdict legend

- **YES** — reachable and comfortable at 375 px.
- **AT-RISK** — reachable, but awkward (usually a wide table that only scrolls
  horizontally, or a crowded button row). Works, but rough. See the Gaps section.
- **NO** — the control/feature is not reachable at 375 px, or does not exist on the
  surface where a tester would look for it.

## Personas

| Persona | Role                  | Notes                                             |
| ------- | --------------------- | ------------------------------------------------- |
| Arjun   | `admin` (regular)     | Sees 6 nav items; no All Users / Activity / Team. |
| Meera   | `admin` + super-admin | Sees all 9 nav items.                             |

---

## A. Global navigation & shell (`src/components/layout/AppShell.tsx`)

Desktop sidebar is `hidden … md:flex` (`AppShell.tsx:119`) — it is **not** rendered on
a phone. Mobile navigation is a hamburger that opens a slide-in drawer.

### M-NAV-01 — Hamburger opens/closes the nav drawer

- **Persona:** Arjun · **Precondition:** signed in, on any page.
- **Steps:**
  1. Confirm no left sidebar is visible (it is `hidden md:flex`).
  2. Tap the hamburger (top-left, the `Menu` icon).
  3. Observe the drawer slide in from the left over a dark scrim.
  4. Tap the **X** in the drawer header, then reopen and tap the dark scrim area to
     the right of the drawer.
- **Expected:** Hamburger is a 36 px target (`h-9 w-9`, `AppShell.tsx:165-172`). Drawer
  is `fixed inset-0 z-50 md:hidden`, panel `w-64 max-w-[80%]` (`AppShell.tsx:131-136`).
  Both the X (`AppShell.tsx:139-146`) and the scrim `onClick` (`AppShell.tsx:132-135`)
  close it.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-NAV-02 — Reach every nav destination from the drawer

- **Persona:** Meera **[SA]** (to see all items) · **Precondition:** signed in.
- **Steps:** Open the drawer; tap each entry in turn and confirm the page loads and
  the drawer auto-closes after each tap.
- **Expected:** `NAV_ITEMS` renders **9** destinations — Inbox, Overview, Dealers,
  Kavach, Service Catalog, Run History, All Users, Activity, Team
  (`AppShell.tsx:36-45`). Each `NavLink` calls `onNavigate` which runs
  `setMobileNavOpen(false)` (`AppShell.tsx:64-65`, `152`), so the drawer closes on
  selection. The account/logout menu (M-NAV-04) is the 10th reachable surface.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-NAV-03 — Super-admin items appear only for super-admins

- **Steps:** (a) As Arjun (regular admin) open the drawer — count items. (b) As Meera
  **[SA]** open the drawer — count items.
- **Expected:** Arjun sees **6** (All Users, Activity, Team hidden); Meera sees **9**.
  Filter logic: `navItems = NAV_ITEMS.filter(item => !item.superAdminOnly || isSuperAdmin)`
  (`AppShell.tsx:108`); `superAdminOnly` set on those three (`AppShell.tsx:42-44`).
  Direct-URL access is also route-guarded (`RequireSuperAdmin.tsx:12-18` → redirect to
  `/inbox`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-NAV-04 — Account menu + Logout

- **Steps:** Tap the avatar circle at the top-right; tap **Logout**.
- **Expected:** Avatar button is always rendered in the header (`ml-auto`,
  `AppShell.tsx:192-198`); the name label is `hidden md:inline` (`AppShell.tsx:249`) so
  only the avatar shows on a phone. Dropdown is `w-56`, anchored `right-0`
  (`AppShell.tsx:260`) — 224 px fits inside 375 px. Logout clears auth and routes to
  `/login` (`AppShell.tsx:111-114`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## B. Login (`src/pages/LoginPage.tsx`)

### M-AUTH-01 — Sign in on a phone

- **Precondition:** signed out.
- **Steps:** Load `/login`; enter email + password; tap **Sign in**.
- **Expected:** Card is `w-full max-w-sm` centered with `p-4` page padding
  (`LoginPage.tsx:45-46`); inputs are full-width `h-9` (`Input.tsx:16`). Submit button
  is `w-full` (`LoginPage.tsx:83`). On success routes to `/` → redirect to `/inbox`
  (`App.tsx:32`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## C. Overview (`src/pages/OverviewPage.tsx`)

### M-OVW-01 — KPI cards

- **Steps:** Open **Overview**; read the 5 KPI tiles.
- **Expected:** Grid is `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`
  (`OverviewPage.tsx:53`) → **2 columns** on a phone, all 5 tiles stacked in 3 rows.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-OVW-02 — Recent failures + Upcoming runs

- **Steps:** Scroll to the two panels below the KPIs.
- **Expected:** `grid-cols-1 lg:grid-cols-2` (`OverviewPage.tsx:83`) → panels stack.
  "Recent failures" is a 4-column table inside `overflow-x-auto` (`Table.tsx:11`);
  "Upcoming runs" is a `<ul>` list that reflows. The table needs a small horizontal
  swipe on a phone.
- **Mobile-reachable:** **AT-RISK** (failures table scrolls horizontally)
- **PASS / FAIL:** **\_\_**

---

## D. Dealers list (`src/pages/DealersPage.tsx`)

### M-DLR-01 — List renders; rows open a dealer

- **Steps:** Open **Dealers**; scroll the list; tap a row.
- **Expected:** Search+filter card is `flex-col gap-3 md:flex-row`
  (`DealersPage.tsx:108`) → stacks. The dealers table has **6 columns** (Name, Code,
  Phone, Status, Progress, Onboarded — `DealersPage.tsx:167-174`) inside
  `overflow-x-auto`; wider than 375 px, so it scrolls sideways. Rows are `clickable`
  (`TRow` → `navigate('/dealers/:id')`, `DealersPage.tsx:178-181`).
- **Mobile-reachable:** **AT-RISK** (6-col table, horizontal scroll to reach Status/Progress)
- **PASS / FAIL:** **\_\_**

### M-DLR-02 — Search

- **Steps:** Type a name/phone/code in the search box; wait ~300 ms.
- **Expected:** Full-width input with debounce (`DealersPage.tsx:55-66`); results refresh.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-DLR-03 — Status filter

- **Steps:** Open the status `Select` (Onboarding / Active / Suspended); pick one.
- **Expected:** Select is full-width in the stacked card (`md:w-56` only at ≥ md,
  `DealersPage.tsx:124`); `h-9` native select opens the OS picker.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-DLR-04 — Pagination

- **Steps:** With > 20 dealers, tap **Next** / **Prev**.
- **Expected:** `Pagination` is `flex justify-between` with Prev/Next `sm` buttons and a
  "page / total" label (`Pagination.tsx:22-53`); fits 375 px.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-DLR-05 — Add dealer (drawer)

- **Steps:** Tap **Add dealer** (header action); fill phone (+ optional name); tap
  **Start onboarding**.
- **Expected:** `PageHeader` stacks its action below the title on a phone
  (`flex-col … md:flex-row`, `PageHeader.tsx:19`). Drawer is `w-full md:w-[560px]`
  (`Drawer.tsx:18`) → full-width; body scrolls (`flex-1 overflow-y-auto`,
  `Drawer.tsx:74`). On success routes to the new dealer.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## E. Dealer Detail — all 9 tabs (`src/pages/DealerDetailPage.tsx` + `src/pages/dealers/*`)

### M-DD-00 — Tab strip is reachable across all 9 tabs

- **Precondition:** a dealer open.
- **Steps:** From the tab strip, swipe horizontally and tap through **Onboarding,
  Info, Team, Services, Kavach, Staff & points, Services provided, Run history, Custom
  requests**.
- **Expected:** `Tabs` is `flex … overflow-x-auto scrollbar-thin` with each tab
  `shrink-0 whitespace-nowrap` (`Tabs.tsx:18-22, 36`). 9 tabs (`DealerDetailPage.tsx:19-29`)
  exceed 375 px, so tabs 6–9 sit off-screen and require a left-swipe. There is **no
  chevron/gradient affordance** hinting that more tabs exist (discoverability risk —
  see Gaps G4).
- **Mobile-reachable:** **AT-RISK** (off-screen tabs have no visible cue)
- **PASS / FAIL:** **\_\_**

### M-DD-01 — Onboarding: advance a step

- **Steps:** On **Onboarding**, on the current step run its action (e.g. **Mark sent**
  for a send-message step; **Assign code**; **Issue login — activate dealer**). Then on
  a completed reopenable step tap **Reopen** and confirm the dialog.
- **Expected:** Progress card + step cards stack (`grid gap-3`,
  `OnboardingTab.tsx:124`). Inline forms are `md:grid-cols-2` → **single column** on a
  phone (`OnboardingTab.tsx:415, 682`). Copy/Generate buttons wrap
  (`flex flex-wrap items-center gap-2`, `OnboardingTab.tsx:713`). The Reopen confirm is
  a full-width `Dialog` (`OnboardingTab.tsx:822-841`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-DD-02 — Info: read record + edit IRAS credentials

- **Steps:** On **Info**, read Identity/Tax/Payment/App-login cards. In **IRAS portal
  credentials**, tap into the form, save; then expand the **Audit log** accordion.
- **Expected:** Info cards are `md:grid-cols-2` → 1 column (`DealerInfoTab.tsx:49`). The
  label/value `Row` uses `grid-cols-[140px_1fr]` (`DealerInfoTab.tsx:171`) — a fixed
  140 px label leaves ~180 px for the value at 375 px; long values wrap but stay in
  view. IRAS form is `grid gap-3 md:max-w-md` full-width (`PortalCredentialsSection.tsx:106`).
  Audit accordion toggles inline (`DealerInfoTab.tsx:187-209`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-DD-03 — Team tab: add a member (+ reset-password gap)

- **Steps:** On **Team**, tap **Add member**, choose Owner/Manager, fill name/email/
  password (use **Generate**), tap **Add member**. Then in a member row use **Message**
  and **Suspend / Reactivate**. Finally, **look for a "reset password" control on this
  tab.**
- **Expected:** Add-member button sits in the card header (`CardHeader` is
  `flex items-start justify-between`, `Card.tsx:31`). Dialog is full-width; role/title
  row is `sm:grid-cols-2` (`DealerMembersTab.tsx:328`). The members **table has 5
  columns** with a right-aligned Actions cell holding **Message + Suspend** ghost
  buttons (`DealerMembersTab.tsx:143-200`) inside `overflow-x-auto` — reaching the
  actions needs a horizontal swipe. **There is no reset-password control on this tab**
  — resetting a dealer member's password is only possible via **All Users → Edit**
  (super-admin only, M-USR-03). Call this out (Gaps G3).
- **Mobile-reachable:** Add member **YES**; member actions **AT-RISK**; reset member
  password on this tab **NO** (feature absent here)
- **PASS / FAIL:** **\_\_**

### M-DD-04 — Services: attach / run now / pause / detach

- **Steps:** On **Services**, tap **Attach service**, pick a plugin, set cadence, fill
  the generated config form, **Attach**. In a row use **Run now**, the **Pause/Play**
  toggle, and the **trash** (detach → native confirm).
- **Expected:** Header is `flex flex-wrap items-center justify-between`
  (`DealerServicesTab.tsx:95`). `AttachServiceDialog` is `size="lg"` full-width with an
  RJSF form whose inputs are normalised to `h-9 w-full` (`AttachServiceDialog.tsx:231`).
  The attached-services **table has 6 columns** with a 3-button Actions cell
  (`DealerServicesTab.tsx:118-207`) in `overflow-x-auto` — actions are far right and
  need a swipe. Detach uses `window.confirm` (native, works on mobile,
  `DealerServicesTab.tsx:82`).
- **Mobile-reachable:** Attach dialog **YES**; row actions **AT-RISK**
- **PASS / FAIL:** **\_\_**

### M-DD-05 — Kavach: initiate / manage items / add custom task

- **Steps:** If no programme, fill **Initiate Kavach programme** and submit. On an
  active programme: change **Digest time**, **Pause/Resume programme**, **Add custom
  task** (fill the dialog), and in an item row use **Mark done / Flag SOS**, **Escalate**,
  **Pause**, and **Delete** (custom).
- **Expected:** Initiate form is a Card with `md:grid-cols-2` fields → stacks
  (`InitiateKavachForm.tsx:76`). Score header is `flex-col md:flex-row`
  (`DealerKavachTab.tsx:147`); the controls sit in a `flex-wrap` group
  (`DealerKavachTab.tsx:170`). **Item rows are purpose-built for mobile**:
  `flex flex-col … md:flex-row` with the action cluster in `flex shrink-0 flex-wrap`
  (`KavachItemRow.tsx:39, 76`) — they stack cleanly, no horizontal table. `AddCustomItemDialog`
  is `size="lg"`, fields `md:grid-cols-2/3` → stack (`AddCustomItemDialog.tsx:97, 124`).
- **Mobile-reachable:** **YES** (best-adapted tab)
- **PASS / FAIL:** **\_\_**

### M-DD-06 — Staff & points: window presets + leaderboard/roster/awards

- **Steps:** On **Staff & points**, switch **Today / Last 7 days / This month**;
  toggle **Include inactive**; read the three tables.
- **Expected:** Preset toggle + label wrap (`flex flex-wrap items-center justify-between`,
  `DealerStaffTab.tsx:121`). Three tables — Leaderboard (5 col), Roster (5 col), Award
  history (6 col) — each in `overflow-x-auto`; all need horizontal scroll on a phone
  (`DealerStaffTab.tsx:188, 283, 355`).
- **Mobile-reachable:** **AT-RISK** (three wide tables)
- **PASS / FAIL:** **\_\_**

### M-DD-07 — Services provided (history)

- **Steps:** Open **Services provided**; read the log.
- **Expected:** 5-column table (Service, Notes, For, Provided by, When) in
  `overflow-x-auto` (`ServicesProvidedTab.tsx:54-81`); Notes cell is `max-w-xs` with
  `line-clamp-2`. Horizontal scroll needed.
- **Mobile-reachable:** **AT-RISK**
- **PASS / FAIL:** **\_\_**

### M-DD-08 — Run history (inline) + artifact download

- **Steps:** Open **Run history**; tap a run row; in the dialog read steps/output and
  tap **Download** on an artifact.
- **Expected:** 4-column table, clickable rows (`RunsListInline.tsx:64-88`) open a
  full-width `size="lg"` Dialog. Detail fields are `grid-cols-2`
  (`RunsListInline.tsx:135`). Download is an `<a target="_blank">` to the signed
  artifact URL (`RunsListInline.tsx:198-206`) — opens in a new tab on mobile.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-DD-09 — Custom requests

- **Steps:** Open **Custom requests**; type a JSON payload; **Submit request**; read
  the recent runs.
- **Expected:** JSON `Textarea` (`rows=8`, font-mono) + submit; recent runs use the same
  inline runs table (`CustomRequestTab.tsx:105-139`). Full-width and reachable. (If the
  `custom-request` plugin isn't attached, an EmptyState explains how to attach it.)
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## F. Inbox — mobile master/detail (`src/pages/InboxPage.tsx` + `src/features/chat/*`)

The inbox is the largest mobile refactor. Layout container is
`h-[calc(100dvh-3.5rem)]` (`InboxPage.tsx:344`). The filter rail is `hidden md:flex`
(`InboxPage.tsx:346`); the list is full-width and **hidden once a chat is open**
(`selectedId ? 'hidden' : 'flex'`, `InboxPage.tsx:392-396`); the thread is
`selectedId ? 'flex' : 'hidden'` (`InboxPage.tsx:506-510`).

### M-INB-01 — Filter with the mobile chips

- **Steps:** On **Inbox** (list view), tap the chip row: **Unassigned / Mine / All
  open / Resolved**.
- **Expected:** Desktop filter rail is hidden; chips are a `md:hidden` horizontally
  scrollable row (`InboxPage.tsx:415-438`). Selecting a filter clears the selection so
  the list stays the landing view.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-02 — Open a conversation (list → thread)

- **Steps:** Tap a conversation row.
- **Expected:** `setSelectedId(c.id)` (`InboxPage.tsx:462-464`) hides the list and shows
  the thread full-screen. Note the auto-select-first effect is **suppressed below lg**
  (`if (!isLg) return`, `InboxPage.tsx:299`), so the phone lands on the **list**, not a
  chat.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-03 — Back to list

- **Steps:** In a thread, tap the back chevron (top-left).
- **Expected:** Back button is `md:hidden`, `h-9 w-9`; clears `selectedId` and closes
  the context slide-over (`InboxPage.tsx:526-535`), returning to the full-width list.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-04 — Read a thread; open an image lightbox

- **Steps:** Scroll the messages; tap an image attachment.
- **Expected:** Bubbles are `max-w-[75%]` (`MessageBubble.tsx:120`); the list
  auto-scrolls to newest (`MessageList.tsx:36-47`). Image thumbnails are 160 px and open
  a full-width `size="lg"` Dialog with the image `max-h-[70vh]` (`AttachmentPreview.tsx:102-113`).
  Delivery ticks / read state render inline (`MessageBubble.tsx:15-32`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-05 — Composer: send text

- **Steps:** Type in the composer; tap **Send**.
- **Expected:** Composer row is `flex items-end gap-2` (`Composer.tsx:242`); textarea
  auto-grows to 6 rows; the **Send** button appears when there is content
  (`Composer.tsx:273-282`). Note the Cmd/Ctrl+Enter shortcut (`Composer.tsx:130-135`) is
  desktop-only — on a phone use the **Send** button (present, so this is fine).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-06 — Composer: attach a photo

- **Steps:** Tap the paperclip; choose a photo from the OS picker; confirm the thumbnail;
  tap **Send**.
- **Expected:** Hidden `<input type="file" accept="image/*,…" multiple>`
  (`Composer.tsx:243-250`, `ACCEPT` `Composer.tsx:38-39`) — on mobile the OS offers
  Camera/Gallery. Image files get an inline 64 px preview with a remove **X**
  (`Composer.tsx:172-191`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-07 — Composer: voice note

- **Steps:** With the composer empty, tap the mic; record; tap **Send** (or trash to
  cancel).
- **Expected:** Mic button shows when there is no content (`Composer.tsx:284-297`);
  recording UI replaces the row with elapsed time + Send (`Composer.tsx:215-240`). Button
  is disabled when `!recorder.supported`. (Mic permission is a browser prompt; if denied,
  an inline error shows — `Composer.tsx:141`.)
- **Mobile-reachable:** **YES** (subject to browser mic permission)
- **PASS / FAIL:** **\_\_**

### M-INB-08 — Pick up an unassigned ticket

- **Steps:** Open an **OPEN** conversation; tap **Pick up**.
- **Expected:** The **Pick up** button renders for `status === 'OPEN'` in a
  `flex flex-wrap items-center justify-end` action group (`InboxPage.tsx:553-566`) — it
  wraps under the header on a phone.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-09 — Take over an assigned ticket

- **Steps:** Open a conversation **assigned to another admin**; tap **Take over**.
- **Expected:** For `status === 'ASSIGNED'` with `assignedAdminId !== currentUserId`,
  both **Take over** and **Resolve** show (`InboxPage.tsx:567-598`). With **Upload
  report** + **Info** also in the row, this is the most crowded header on a phone — the
  buttons wrap onto 2–3 rows (Gaps G2).
- **Mobile-reachable:** **AT-RISK** (button crowding)
- **PASS / FAIL:** **\_\_**

### M-INB-10 — Resolve (dialog)

- **Steps:** On an assigned ticket tap **Resolve**; pick a service (or "Other"), add
  notes, tap **Resolve**.
- **Expected:** `ResolveConversationDialog` is a full-width Dialog with a service Select
  and notes Textarea (`ResolveConversationDialog.tsx:77-149`); "Other" reveals a name
  field.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-11 — Reopen a resolved ticket

- **Steps:** Open a **RESOLVED** conversation; tap **Reopen**.
- **Expected:** For `status === 'RESOLVED'` the **Reopen** button renders
  (`InboxPage.tsx:599-611`); composer is disabled while resolved
  (`disabled={conversation.status === 'RESOLVED'}`, `InboxPage.tsx:670`) and re-enables
  after reopen.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-12 — New conversation

- **Steps:** In the list view tap **New**; pick a dealer, then a member; tap **Open chat**.
- **Expected:** `NewConversationDialog` is a full-width Dialog with two dependent
  Selects (`NewConversationDialog.tsx:69-145`); suspended members are filtered out.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-13 — Upload report from the thread

- **Steps:** In a thread tap **Upload report**; choose a file, set type/title/period/
  note, keep **Announce in chat**, tap **Upload**.
- **Expected:** `UploadRecordDialog` is a full-width Dialog; the file drop is a full-width
  dashed button (`UploadRecordDialog.tsx:194-205`); type/title/period/note stack; the
  announce checkbox is a 16 px box (`UploadRecordDialog.tsx:268-276`). The card also
  appears in the thread (M-INB-04) and in the context Reports list (M-INB-15).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-14 — Context slide-over: change Priority & Category

- **Steps:** In a thread tap the **Info** (ⓘ) button; in the slide-over change
  **Priority** and **Category**.
- **Expected:** Below `lg` the context panel is a slide-over, not an inline column
  (`isLg = useMediaQuery('(min-width: 1024px)')`, `InboxPage.tsx:217`; render gate
  `(!isLg && mobileContextOpen)`, `InboxPage.tsx:674`). The Info trigger is `lg:hidden`
  (`InboxPage.tsx:622-629`); the panel is `fixed inset-y-0 right-0 z-50 w-80 max-w-[85%]`
  with a scrim + close X (`InboxPage.tsx:677-701`). The **Ticket** card (Priority +
  Category selects) renders because `isAdmin` is true in the admin portal
  (`isAdmin = !!admin`, `InboxPage.tsx:278`; card `InboxPage.tsx:703-751`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-INB-15 — Context slide-over: Dealer + Reports

- **Steps:** In the same slide-over, read the **Dealer** card and the **Reports** list;
  tap the upload (↥) icon in the Reports header.
- **Expected:** Dealer + Reports cards live in the same slide-over
  (`InboxPage.tsx:752-848`); the Reports header upload icon opens `UploadRecordDialog`
  (`InboxPage.tsx:802-809`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## G. Kavach dashboard (`src/pages/KavachDashboardPage.tsx`)

### M-KVD-01 — Book-wide compliance table

- **Steps:** Open **Kavach**; read the at-risk badge; scroll the table; tap a row.
- **Expected:** The at-risk `Badge` sits in the header and fits. The table has **8
  columns** (Dealer, Code, Operational, Expired, Expiring, Escalated, Worst priority,
  Last evaluated — `KavachDashboardPage.tsx:74-84`) in `overflow-x-auto`. This is the
  **widest table in the app**; on 375 px only ~2–3 columns are visible at once, so
  reading a full row means scrolling right and losing the dealer name (no sticky first
  column). Rows are clickable → `/dealers/:id?tab=kavach` (`KavachDashboardPage.tsx:88-91`).
- **Mobile-reachable:** **AT-RISK** (8-column table, heaviest horizontal scroll — Gaps G1)
- **PASS / FAIL:** **\_\_**

---

## H. Service Catalog (`src/pages/ServiceCatalogPage.tsx`)

### M-SVC-01 — Browse plugins; open detail drawer

- **Steps:** Open **Service Catalog**; tap a plugin card; read config schema; **Close**.
- **Expected:** Card grid is `md:grid-cols-2 lg:grid-cols-3` → **1 column** on a phone
  (`ServiceCatalogPage.tsx:50`). Tapping a card opens a `width="lg"` Drawer (full-width
  on mobile) with the JSON schema in a `<pre>` that has `overflow-auto`
  (`ServiceCatalogPage.tsx:116`) so long schemas scroll inside the drawer, not the page.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## I. Run History (`src/pages/RunHistoryPage.tsx`)

### M-RUN-01 — Filters

- **Steps:** Open **Run History**; set Dealer ID / Service ID / Status / From / To.
- **Expected:** Filter card is `grid gap-3 md:grid-cols-5` → **single column** stack on
  a phone (`RunHistoryPage.tsx:74`); `type="date"` fields open the native date picker.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-RUN-02 — Day-grouped list + run detail

- **Steps:** Scroll the day-grouped runs; tap a run.
- **Expected:** Runs are a reflowing list (not a wide table); the dealer-id column is
  `hidden md:inline` so it drops on a phone (`RunHistoryPage.tsx:175`). Tapping opens a
  full-width `size="lg"` Dialog with detail (`RunHistoryPage.tsx:205-217`).
- **Mobile-reachable:** **YES** (list intentionally sheds a column on mobile)
- **PASS / FAIL:** **\_\_**

---

## J. All Users **[SA]** (`src/pages/AllUsersPage.tsx`)

### M-USR-01 — Search

- **Steps:** Open **All Users**; type a name/email/dealer/code.
- **Expected:** Search input is `max-w-md` full-width (`AllUsersPage.tsx:96-110`); filters
  groups client-side.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-USR-02 — Dealer-grouped user tables

- **Steps:** Scroll the grouped cards; within a group read the users table.
- **Expected:** Each group is a Card whose header (`Building2`/`ShieldCheck` + name +
  count) reflows; the users table has **5 columns** (Name, Email, Role, Status, Actions)
  in `overflow-x-auto` (`AllUsersPage.tsx:178-227`). Horizontal scroll to reach the
  Actions/Edit cell.
- **Mobile-reachable:** **AT-RISK**
- **PASS / FAIL:** **\_\_**

### M-USR-03 — Edit email / reset password (dialog)

- **Steps:** Tap **Edit** on a user; change the email and/or **Generate** a new
  password, **Copy**, then **Save changes**.
- **Expected:** `EditUserDialog` is a full-width Dialog; the password row is
  `flex flex-wrap items-center gap-2` so the input + Generate + Copy buttons wrap
  (`AllUsersPage.tsx:339-374`). This is the **only** place to reset a dealer member's
  password (see Gaps G3).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## K. Team **[SA]** (`src/pages/AdminsPage.tsx`)

### M-TEAM-01 — Add admin

- **Steps:** Tap **Add admin**; fill name/email/password (**Generate** + **Copy**);
  **Add admin**.
- **Expected:** Header action stacks on a phone; `AddAdminDialog` is a full-width Dialog
  with the password controls wrapping (`AdminsPage.tsx:264-294`).
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-TEAM-02 — Reset an admin's password

- **Steps:** In an admin row tap **Reset password**; **Generate**/**Copy**; **Reset
  password**.
- **Expected:** `ResetPasswordDialog` is a full-width Dialog with the same wrapping
  password row (`AdminsPage.tsx:368-397`).
- **Mobile-reachable:** **YES** (dialog); reaching the row button is **AT-RISK** (wide table)
- **PASS / FAIL:** **\_\_**

### M-TEAM-03 — Suspend / reactivate an admin

- **Steps:** In an admin row tap **Suspend** (or **Reactivate**); confirm your own row's
  Suspend is disabled.
- **Expected:** The admins table has **5 columns** with a 2-button Actions cell in
  `overflow-x-auto` (`AdminsPage.tsx:95-162`); the self row's Suspend is `disabled`
  (`AdminsPage.tsx:142`). Reaching the actions needs a horizontal swipe.
- **Mobile-reachable:** **AT-RISK**
- **PASS / FAIL:** **\_\_**

---

## L. Activity **[SA]** (`src/pages/ActivityPage.tsx`)

### M-ACT-01 — Filters, audit table, detail dialog

- **Steps:** Open **Activity**; set Actor/Entity/Action/From/To; tap a row.
- **Expected:** Filters are `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5` → **1 column**
  on a phone (`ActivityPage.tsx:128`). The audit table has **6 columns** (Time, Actor,
  Action, Entity, Target, IP) in `overflow-x-auto` (`ActivityPage.tsx:215-260`) — wide,
  horizontal scroll. Rows are clickable → full-width `size="lg"` `AuditDetailDialog`
  whose fields are `sm:grid-cols-2` and JSON blocks are `overflow-auto`
  (`ActivityPage.tsx:288-321`).
- **Mobile-reachable:** Filters + detail dialog **YES**; audit table **AT-RISK**
- **PASS / FAIL:** **\_\_**

---

## M. Shared overlays — full-width + scroll on mobile

### M-UI-01 — Dialog is full-width and scrolls

- **Steps:** Open any Dialog (e.g. Add member, Resolve, Edit user). Rotate to portrait;
  add enough content to overflow.
- **Expected:** Overlay is `fixed inset-0 flex items-center justify-center … p-4`; the
  panel is `w-full` capped by size (`max-w-sm/lg/2xl`) so on a 375 px screen it fills
  the width minus 16 px gutters (`Dialog.tsx:42-54`). Body is `max-h-[70vh] overflow-y-auto`
  (`Dialog.tsx:74`) so tall forms scroll inside the dialog; the footer stays pinned.
  Tapping the scrim or **Esc** closes it.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

### M-UI-02 — Drawer is full-width and scrolls

- **Steps:** Open any Drawer (Add dealer, Service detail).
- **Expected:** Panel is `w-full md:w-[420/560/720px]` → full-width on a phone
  (`Drawer.tsx:16-20`); body is `flex-1 overflow-y-auto` (`Drawer.tsx:74`). Scrim/Esc
  close.
- **Mobile-reachable:** **YES**
- **PASS / FAIL:** **\_\_**

---

## Summary of verdicts

| Area                      | Cases  | YES    | AT-RISK | NO    |
| ------------------------- | ------ | ------ | ------- | ----- |
| A. Global nav             | 4      | 4      | 0       | 0     |
| B. Login                  | 1      | 1      | 0       | 0     |
| C. Overview               | 2      | 1      | 1       | 0     |
| D. Dealers list           | 5      | 4      | 1       | 0     |
| E. Dealer Detail (9 tabs) | 10     | 5      | 4       | 1     |
| F. Inbox                  | 15     | 14     | 1       | 0     |
| G. Kavach dashboard       | 1      | 0      | 1       | 0     |
| H. Service Catalog        | 1      | 1      | 0       | 0     |
| I. Run History            | 2      | 2      | 0       | 0     |
| J. All Users [SA]         | 3      | 2      | 1       | 0     |
| K. Team [SA]              | 3      | 1      | 2       | 0     |
| L. Activity [SA]          | 1      | 0      | 1       | 0     |
| M. Shared overlays        | 2      | 2      | 0       | 0     |
| **Total**                 | **50** | **37** | **12**  | **1** |

The single **NO** (M-DD-03) is a feature-placement gap, not an unreachable control:
resetting a dealer member's password does not exist on the Team tab; it lives on the
super-admin All Users page. No feature is blocked purely by the 375 px viewport.

---

## Mobile gaps / risks (prioritized)

**G1 — Wide data tables only scroll horizontally (highest impact, most widespread).**
Every list surface uses the same `Table` primitive wrapped in `overflow-x-auto`
(`Table.tsx:11`) with no card/stacked mobile layout. On 375 px the right-most columns —
which is where **action buttons** live (Edit, Suspend, Run now, Message, Reset) — are
off-screen and require a horizontal swipe, and there is no sticky first column so the row
identity scrolls away. Affected: Kavach dashboard (8 cols, worst — M-KVD-01), Activity
(6), Dealers (6), Dealer Services (6), Services provided (5), Staff & points (three
tables), Team members (5), All Users (5), Admins/Team (5), Overview failures (4).
Recommendation: below `md`, render these as stacked cards (label:value rows) with a full-
width primary action, or at minimum pin the first column and the Actions column.

**G2 — Inbox thread header button crowding (M-INB-09).** For an ASSIGNED-to-another
ticket the header carries back + title + status + flag + **Take over + Resolve + Upload
report + Info**. They wrap (`flex flex-wrap … justify-end`, `InboxPage.tsx:553`) but push
the message list down and read as a cluttered block on a phone. Consider collapsing
secondary actions (Upload report, Take over) into an overflow "⋯" menu below `md`.

**G3 — No way to reset a dealer member's password from the dealer page (M-DD-03).** The
Team tab exposes only **Message** and **Suspend/Reactivate** (`DealerMembersTab.tsx:165-197`).
Password reset for a `dealer-owner`/`dealer-staff` is only reachable via **All Users →
Edit**, which is **super-admin-only**. A regular admin cannot reset a dealer login at all.
This is a functional/permissions gap surfaced by the mobile pass, not a viewport bug — but
worth an explicit product decision.

**G4 — Dealer Detail tab strip has no "more tabs" affordance (M-DD-00).** The 9 tabs
scroll horizontally (`Tabs.tsx:22`) but tabs 6–9 (Staff & points, Services provided, Run
history, Custom requests) sit off the right edge with no chevron, arrow, or fade hint. A
first-time user on a phone may not discover them. Add an edge gradient or a scroll-hint
chevron below `md`.

**G5 — Header search is hidden on mobile (informational only).** The top-bar search is
`hidden … md:block` and is a disabled "coming soon" placeholder anyway
(`AppShell.tsx:178-191`), so nothing is lost — but note that global search is unavailable
on a phone by design.

**G6 — Native `window.confirm` for destructive actions.** Detach service
(`DealerServicesTab.tsx:82`), delete Kavach item (`DealerKavachTab.tsx:382`), and clear
IRAS credentials (`PortalCredentialsSection.tsx:70`) use the browser confirm dialog. It
works on mobile but is unstyled and easy to mis-tap; consider the in-app `Dialog` for
consistency.

**G7 — Voice note + file attach depend on browser permissions.** Mic recording
(`Composer.tsx:137-143`) and the file picker rely on WebView/browser permission grants. On
the admin web this is fine; if the admin portal is ever loaded inside a WebView, verify
mic and file-picker permissions are bridged.
