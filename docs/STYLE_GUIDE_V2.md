# MDG Style Guide V2 — Design Language (As Built + The Bar)

This documents the **client** design system as it ships today (`mdg-client`, the
dealer app), the **admin** system (`mdg-admin`) with its own tokens and component
sizes, and the canonical bar to hold. North star: a fuel dealer who distrusts
technology should feel the app is "just like the messaging apps they already use" —
calm, familiar, never intimidating.

Source of truth in code:

- Client tokens: `mdg-client/src/index.css`, `mdg-client/tailwind.config.ts`
- Client primitives: `mdg-client/src/components/ui/*`, `mdg-client/src/components/AppBar.tsx`
- Client chat: `mdg-client/src/features/chat/*` (`MessageBubble`, `Composer`, `MediaViewer`, `ChatBars`) and the pages `ChatListPage`, `ChatPage`, `ChatInfoPage`, `ChatMediaPage`
- Admin tokens: `mdg-admin/src/index.css`, `mdg-admin/tailwind.config.ts`
- Admin primitives: `mdg-admin/src/components/ui/*`; status colours: `mdg-admin/src/lib/statusIntent.ts`
- Admin inbox and chat: `mdg-admin/src/pages/InboxPage.tsx`, `mdg-admin/src/features/chat/*`

---

## 1. Principles

- **The chat list is home** (ADR 0018). `/` and `/chat` open it, even with one chat. There is no bottom tab bar and no app-wide header: each screen draws its own top bar, and Settings (with Services and Staff behind it) sits in the ⋮ menu on the chat list.
- **The chat is laid out like WhatsApp on Android, in the brand's black.** A dealer already knows how to read that screen. What carries over is where things are and how they behave, never WhatsApp's green. A report is a picture in the chat, and a tap opens it full-screen with a swipe to the next one. MDG's requests arrive as chat messages (ADR 0019).
- **One primary action per screen.** Client screens carry a single dominant action (send, tap-to-view). No dense dashboards on the dealer side.
- **Recognition over recall.** Tap targets ≥44px, plain language, a label (or an `aria-label` on an icon-only control), no jargon, no error codes.
- **Premium minimalism.** Warm neutrals + one near-black accent, soft shadows, `rounded-2xl` cards, system font.
- **Mobile-first.** The shell is `max-w-md` and widens to `md:max-w-2xl lg:max-w-3xl`. It must work in an Expo WebView with safe-area insets.
- **Light theme only for the chat** (ADR 0018).

---

## 2. Color tokens (CSS variables)

Tokens live on `:root` and `.dark`; Tailwind reads them via `theme.extend.colors`.
Always use the **semantic token**, never a raw hex, in components.

### Client — light (canonical for the dealer app)

```css
--color-bg: #fafaf9; /* page background (warm stone-50) */
--color-surface: #ffffff; /* cards, composer */
--color-surface-2: #f5f5f4; /* nested surfaces, input fill, chips */
--color-border: #e7e5e4;
--color-border-strong: #d6d3d1;

--color-text: #0f172a;
--color-text-muted: #57534e;
--color-text-subtle: #78716c;
--color-text-inverse: #ffffff;

--color-brand: #18181b; /* near-black (zinc-900) primary action */
--color-brand-hover: #27272a;
--color-brand-soft: #f4f4f5;

--color-focus-ring: #a8a29e;
--color-online: #0f766e; /* deep teal: text selection, the jump-to-message pulse */
```

### Client — chat tokens (`--wa-*`)

The chat is laid out the way WhatsApp lays it out, in Dealer Kavach's own colours.
**These are the only chat colours: no bubble, bar, badge or wallpaper hard-codes a
hex of its own.** Tailwind reads them as `wa-*` (`bg-wa-out`, `text-wa-meta`).

```css
--wa-accent: var(--color-brand); /* send / mic / scroll button / active chip */
--wa-accent-strong: var(--color-brand); /* links, selected text, the home title */
--wa-badge: var(--color-brand); /* unread count pill, unread time */
--wa-bar: #ffffff; /* every top bar */
--wa-bar-text: #111b21;
--wa-bar-icon: #54656f;
--wa-wallpaper: #f3f2f0;
--wa-doodle: rgba(17, 27, 33, 0.045);
--wa-in: #ffffff; /* their bubble */
--wa-out: #e7e5e4; /* my bubble — a warm grey, the brand's own neutral */
--wa-bubble-text: #111b21;
--wa-meta: #667781; /* time inside a bubble, previews */
--wa-tick-read: #53bdeb; /* kept WhatsApp blue on purpose */
--wa-chip: #ffffff; /* date chip, unread divider */
--wa-chip-text: #54656f;
--wa-notice: #ffeecd; /* the amber "sent back" reason on a request */
--wa-select: rgba(24, 24, 27, 0.08); /* a selected message row */
--wa-search-hit: #fff59d;
--wa-row-active: #f0f2f5;
--wa-divider: #e9edef;
--wa-viewer: #000000; /* the full-screen picture viewer */
```

The read ticks stay blue because two blue ticks _mean_ "read" to anyone who uses
WhatsApp. That meaning is the experience, not a colour scheme.

### Client — dark

Defined, but nothing in the app sets the `dark` class today, and the `--wa-*` block
has no dark values (the chat is light-only).

```css
--color-bg: #0a0a0a;
--color-surface: #111111;
--color-surface-2: #1a1a1a;
--color-border: #1f1f1f;
--color-border-strong: #2a2a2a;
--color-text: #f5f5f4;
--color-text-muted: #a8a29e;
--color-text-subtle: #78716c;
--color-text-inverse: #0a0a0a;
--color-brand: #fafafa;
--color-brand-hover: #e7e5e4;
--color-brand-soft: #1f1f1f;
--color-focus-ring: #57534e;
--color-online: #14b8a6;
```

### Status / semantic colors (Tailwind `extend.colors`, client)

| Token     | DEFAULT   | soft      | Used for                             |
| --------- | --------- | --------- | ------------------------------------ |
| `success` | `#16a34a` | `#dcfce7` | Done, delivered                      |
| `warning` | `#d97706` | `#fef3c7` | Needs attention (`strong` `#92400e`) |
| `danger`  | `#dc2626` | `#fee2e2` | Urgent, destructive, a failed send   |
| `info`    | `#2563eb` | `#dbeafe` | Informational                        |
| `neutral` | `#475569` | `#e2e8f0` | Default / normal                     |

`warning.strong` is the only amber white may sit on: white on `#d97706` measures
2.15:1 and fails AA at every size, white on `#92400e` measures 7.09:1. The reader is
often 55, outdoors, under a canopy, on a cheap screen.

### Admin tokens — **divergent** (`mdg-admin/src/index.css`)

Admin keeps the **blue/slate** palette. It has no `--color-online` and no `.animate-in`
or `.fade-in`; it does have `.safe-bottom`. Tailwind reads the same token names.

```css
:root {
  --color-bg: #f8fafc; /* page background */
  --color-surface: #ffffff; /* cards, modals */
  --color-surface-2: #f1f5f9; /* nested surfaces */
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  --color-text: #0f172a;
  --color-text-muted: #475569;
  --color-text-subtle: #64748b;
  --color-text-inverse: #ffffff;

  --color-brand: #2563eb;
  --color-brand-hover: #1d4ed8;
  --color-brand-soft: #dbeafe;

  --color-focus-ring: #60a5fa;
}

.dark {
  --color-bg: #0b1220;
  --color-surface: #111827;
  --color-surface-2: #1f2937;
  --color-border: #1f2937;
  --color-border-strong: #334155;

  --color-text: #e5e7eb;
  --color-text-muted: #94a3b8;
  --color-text-subtle: #64748b;
  --color-text-inverse: #0f172a;

  --color-brand: #3b82f6;
  --color-brand-hover: #2563eb;
  --color-brand-soft: #1e3a8a;

  --color-focus-ring: #60a5fa;
}
```

The admin also publishes layout tokens on `:root`:

- `--app-gutter`: the page padding around every page, **12px below `md`, 24px from `md`**. Sticky bars and edge-to-edge strips cancel it by this token, never by a hard-coded `-mx-4`.
- `--safe-top`, `--safe-bottom`, and `--tab-bar-h` (written by `AppShell`: 3.5rem on a phone list screen, 0 on a drill-in and from `md`).
- A stacking ladder: `--z-sticky` 10, `--z-page-bar` 30, `--z-scrim` 40, `--z-overlay` 50 (Dialog, Drawer, Sheet, Menu), `--z-nested-overlay` 60, `--z-toast` 70.

The admin's status colours add `strong` shades (`success` `#166534`, `warning` `#92400e`,
`danger` `#991b1b`, `info` `#1e40af`). See §8.

> **Still open — admin unchanged as of Oct 2026.** The client palette is the V2 standard.
> Admin should adopt the same variable block and add `--color-online`. Keep
> `--color-brand` blue in admin **only** if a deliberate "internal tool" distinction is
> wanted. See §10.

---

## 3. Type scale

**Client font:** the native system stack (`system-ui`, `-apple-system`, Segoe UI,
Roboto, …). It costs no webfont download; on the target low-end Android phones it
resolves to Roboto, and Devanagari falls through to the on-device Noto. Headings get
`letter-spacing: -0.01em`.

**Admin font:** Inter → `system-ui`, with `font-feature-settings: 'cv11','ss01'`;
`JetBrains Mono` for mono.

| Role (client)        | Size / classes                             | Notes                                                |
| -------------------- | ------------------------------------------ | ---------------------------------------------------- |
| Home title           | `text-[22px] font-semibold tracking-tight` | the chat list's top bar                              |
| Top-bar title        | `text-[17px] font-medium`                  | every other bar; subtitle `text-[13px] text-wa-meta` |
| **Chat bubble body** | `text-[15px] leading-[1.35]`               | matches messaging apps; not `text-sm`                |
| List row title       | `text-base font-medium`                    | chat list; preview `text-sm text-wa-meta`            |
| Body / list          | `text-sm`                                  | descriptions, secondary lines                        |
| Sender name, quote   | `text-[13px] font-medium`                  | in a group bubble, the reply quote                   |
| Caption / meta       | `text-xs` (`12px`)                         | list time, count pill                                |
| Day chip             | `text-[12.5px]`                            | date separator, unread divider                       |
| Micro / timestamp    | `text-[11px]`                              | time inside a bubble                                 |
| Form field           | `text-base` (16px)                         | never below 16px: iOS zooms a smaller focused field  |

`15px` for primary reading text is intentional and load-bearing for the
familiar-messaging-app feel — do not collapse it to the `14px` `text-sm` default.

Admin uses Tailwind's default scale: `xs` 12/16, `sm` 14/20 (table cells, secondary
text), `base` 16/24 (body), `lg` 18/28 (section headings in cards), `xl` 20/28 (page
subtitles), `2xl` 24/32 (page titles), `3xl` 30/36 (dashboard hero number). Weights:
400 body, 500 emphasis, 600 headings and button labels. Avoid 700+.

---

## 4. Spacing

Tailwind 4px base scale. House rhythm:

- Client message rows: `px-3`, `pt-2` between runs from one sender, `pt-0.5` inside a run. Bubble padding `px-[9px] pb-[7px] pt-[6px]` (`p-[3px]` around a picture).
- Card inner padding: `p-5` (`CardContent`).
- The composer floats on the wallpaper with no bar of its own (see 9.5).
- Admin: `--app-gutter` around pages (§2); card padding `p-3` below `md`, `p-4` from `md`. The guideline is to stay inside a small subset of the scale: `1` tight inline gaps, `2` field and chip padding, `3` and `4` card padding, `6` section gaps, `8` separation between page sections.

---

## 5. Radius

| Element (client)                      | Radius                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| **Chat bubble**                       | `rounded-md` (8px); the first bubble of a run squares its top corner and draws a tail |
| Date chip                             | `rounded-lg`                                                                          |
| **Cards**                             | `rounded-2xl` (`Card`)                                                                |
| Composer box                          | `rounded-3xl`                                                                         |
| Inputs (forms)                        | `rounded-xl` (`Input`)                                                                |
| Avatar / icon buttons / chips / pills | `rounded-full`                                                                        |
| Bottom sheets                         | `rounded-t-2xl`                                                                       |

Admin follows the `tailwind.config` `borderRadius` closely: `sm` 4px (inputs),
`md` 8px (buttons, cards), `lg` 12px (desktop dialogs; phone dialogs are bottom sheets
with `rounded-t-2xl`), `full` (avatars, status dots, badges).

The client's `borderRadius` config (4/8/12) is largely bypassed by direct
`rounded-2xl/3xl/full` in cards and the composer; this guide is the real contract.

---

## 6. Shadow tiers

```
shadow-sm: 0 1px 2px  rgba(15,23,42,0.06)   /* resting cards, chips — default */
shadow-md: 0 4px 12px rgba(15,23,42,0.08)   /* raised / hover, menus, popovers */
shadow-lg: 0 16px 40px rgba(15,23,42,0.16)  /* dialogs, lightbox */
```

Shadows are soft and low-contrast on purpose; borders do the rest of the separation
work. A chat bubble uses its own hairline, `0 1px 0.5px rgba(11,20,26,0.13)`, as
WhatsApp's does.

---

## 7. Iconography (Lucide)

- Library: **lucide-react**, default `strokeWidth={1.75}` (1.5 for large empty-state glyphs, 2 for tiny check marks and read ticks).
- Client sizes: 22 (composer), 28 (empty-state glyph), 15 (read ticks).
- Admin sizes: 14 (buttons), 16 (tables and chips), 28 (empty states).
- Pair an icon with a text label except for unambiguous standalone actions (close, edit row, attach, send). Icon-only buttons need an `aria-label`.

Canonical icon mapping:

| Meaning          | Icon                                                 |
| ---------------- | ---------------------------------------------------- |
| Chat             | `MessageCircle`                                      |
| Services         | `Wrench` (client), `Plug` (admin: attach a service)  |
| Send             | `SendHorizonal`                                      |
| Attach           | `Paperclip`                                          |
| Camera, voice    | `Camera`, `Mic`                                      |
| Sent / read      | `Check` / `CheckCheck` (read = `text-wa-tick-read`)  |
| Empty chat       | `MessageCircleHeart`                                 |
| Dealer (admin)   | `Building2`                                          |
| Activity (admin) | `Activity`                                           |
| Status (admin)   | `CheckCircle2` / `AlertCircle` / `XCircle` / `Clock` |
| Search, row menu | `Search`, `MoreVertical`                             |

---

## 8. Status & priority semantics

### Domain status → intent (admin, `statusIntent.ts`, canonical)

Components never branch on a raw status string: they call `statusIntent(kind, value)`
and pass the intent to `<StatusChip />` or `<Badge />`. Pair the foreground with the
matching `-soft` background.

| Domain                                          | Intent                     |
| ----------------------------------------------- | -------------------------- |
| `Dealer.status = ACTIVE`                        | success                    |
| `Dealer.status = ONBOARDING`                    | warning                    |
| `Dealer.status = SUSPENDED` (also archived)     | danger                     |
| `DealerService.status = ACTIVE`                 | success                    |
| `DealerService.status = PAUSED`                 | neutral                    |
| `ServiceRun.status = PENDING`                   | neutral                    |
| `ServiceRun.status = RUNNING`                   | info                       |
| `ServiceRun.status = SUCCESS`                   | success                    |
| `ServiceRun.status = FAILED`                    | danger                     |
| SLA tier `BRONZE`                               | neutral                    |
| SLA tier `SILVER`                               | info                       |
| SLA tier `GOLD`                                 | warning                    |
| Cadence `ON_DEMAND` (others: neutral)           | info                       |
| IRAS snapshot `COMPLETE` / `PARTIAL` / `FAILED` | success / warning / danger |

An IRAS day in the Data Vault is `OK` success, `PARTIAL` or `MISMATCH` warning,
`MISSING` or `FAILED` danger, `MISMATCH_OK` (a gap someone accepted) info, and `OPEN`
(today, nothing wrong) neutral.

**Foreground shade.** `INTENT_CLASSES` pairs `bg-*-soft` with the `strong` text shade
below `md` and the base shade from `md`. The base pairing measures 2.9:1 (amber), 3.0:1
(green), 3.95:1 (red) and 4.24:1 (blue) on a 12px label, against the 4.5:1 it needs,
and the phone is the device read outdoors. The `strong` shades measure 6.4 to 7.2:1.
`neutral` already measures 6.15:1 and has none.

### Conversation status (admin, `InboxPage.tsx` `statusBadge`)

OPEN → `warning` (Open) · ASSIGNED → `info` (Assigned) · RESOLVED → `success` (Resolved).

### Ticket priority → intent (`PRIORITY_INTENT`)

urgent → `danger` · high → `warning` · normal → `neutral` · low → `info`.
The priority pill is **suppressed when `normal`** (the common case) to reduce noise —
only abnormal priorities draw a chip. Keep this.

---

## 9. Component anatomy

### 9.1 Chat bubble (client `MessageBubble.tsx`)

```
[ optional sender name: text-[13px] font-medium — group chats, first bubble of a run ]
[ optional picture(s) or file: 3px inside the bubble; several pictures become an album ]
[ body: text-[15px] leading-[1.35], whitespace-pre-wrap ]
[ time text-[11px] text-wa-meta  (+ Check / CheckCheck if mine) — bottom right ]
```

- **Mine:** `bg-wa-out`, right-aligned. **Theirs:** `bg-wa-in`, left-aligned. `rounded-md` with the hairline shadow, `max-w-[80%]`; a picture or a request is `w-[min(80%,330px)]`.
- **Tail:** the first bubble of a run from one sender squares its top corner (`rounded-tr-none` mine, `rounded-tl-none` theirs) and hangs an 8×10 SVG wedge off that corner in the bubble's own colour.
- **Ticks (mine only):** a small clock while it sends, one `Check` sent, two `CheckCheck` delivered, the same two in `--wa-tick-read` blue once read. Sent and delivered ticks take the colour of the line they sit in, so over a picture they are white.
- A caption sits **inside the same bubble** under the picture. With no caption, the time and ticks sit on the picture over a soft dark gradient.
- Swipe to reply, long-press to select (reply, copy, download, info) with the quick reactions above the message.

### 9.2 MDG notices, date chips and the amber callout

- **An MDG notice is an ordinary received bubble signed "MDG"** (ADR 0018 §4). A shared report, the daily line and the "Resolved —" note are all `system: true` messages, drawn as incoming bubbles that can be replied to, reacted to, copied and downloaded. There is no centred system pill in the dealer app.
- **Date chip:** centred, `rounded-lg bg-wa-chip px-3 py-1 text-[12.5px] text-wa-chip-text`. The "N unread messages" divider is a full-width `bg-wa-chip` band in the same text.
- **`--wa-notice` (amber)** appears in one place: the reason line on a request the admin sent back, `rounded-md bg-wa-notice px-2.5 py-1.5 text-[13px]`, inside the request's bubble.
- The admin draws its own system message differently: a centred `rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-text-muted` chip, `max-w-[85%]`, left-aligned text (a pill cuts a long bilingual notice through its own lines).

### 9.3 Pictures and the viewer (`AttachmentPreview.tsx`, `MediaViewer.tsx`)

- One picture sizes itself; several are an album: 2 side by side, 3 as one tall and two stacked, 4 or more as a 2×2 with "+N" over the last tile.
- A tap opens the **full-screen viewer** on a `--wa-viewer` black backdrop. Swipe left and right through _every_ picture in the conversation in time order, not only the message's own; pinch and double-tap zoom; swipe down to close; a tap hides the bars; the phone's Back closes it. The top bar shows who sent it and when, the caption is at the bottom, and the download arrow is in the bar.
- There is no spreadsheet or table anywhere on the dealer side.

### 9.4 Chat list row (client `ChatListPage.tsx`)

```
[ avatar 48px round ] [ name text-base font-medium ........ time text-xs ]
                      [ preview text-sm text-wa-meta .......... [count] ]
```

Unread: the time turns `text-wa-badge` and `font-medium`, and a `bg-wa-badge` count pill (`h-5 min-w-[20px] rounded-full`, `text-xs font-medium`) sits right. Filter chips are `h-8 rounded-full` at `text-[14px] font-medium`. Search replaces the top bar in place; so does the selection bar.

### 9.5 Composer — two contracts (`Composer.tsx`)

**Client:**

```
[ staged document chips (horizontal scroll, only if staged) ]
[ ( box rounded-3xl bg-wa-chip: textarea · Paperclip · Camera ) ( 48px round send / mic ) ]
```

- The composer has **no bar of its own**: it floats on the wallpaper (`bg-wa-wallpaper safe-bottom`).
- Textarea `min-h-[48px] max-h-[140px]`, auto-grows, `text-base`. The camera button goes once there is text.
- The 48px round `bg-wa-accent` button is **send** when there is something to send and **mic** when there is not. A WebView with no recorder always shows send.
- Photos open their own full-screen preview with a caption; documents stay as chips above the box. The attach sheet offers Document, Camera and Gallery.
- Contract: `onSend(text, attachments: OutgoingAttachment[])`. The caller (`ChatPage.handleSend`) owns the upload.

**Admin:** `border-t border-border bg-surface px-3 py-2` with 44px square icon buttons (36px from `md`), a `min-h-11 md:min-h-[36px]` textarea, and `onSend({ body, attachments })` plus a `conversationId` prop. It uploads itself (`uploadAttachment(file, conversationId)`).

> Inconsistency, still open (re-checked against both files, Oct 2026): **two Composers with different contracts.** Canonical: one shared `Composer` taking `onSend(text, files[])`, with upload owned by the caller. Until merged, treat the client signature as the reference.

### 9.6 Ticket priority pill (`InboxPage.tsx` `priorityPill` + `Badge`)

`Badge`: `inline-flex h-[22px] rounded-full px-2 text-xs font-medium`, coloured by
`INTENT_CLASSES[intent]`, and `shrink-0 whitespace-nowrap` (a squeezed badge must push
its neighbour, not clip its own label). Hidden for `normal`. Labels: Urgent/High/Low.
Conversation status reuses `Badge` with OPEN/ASSIGNED/RESOLVED intents.

### 9.7 Conversation list row (admin, `InboxPage.tsx`)

```
[ member label (truncate, medium) .......... relative time (text-xs subtle) ]
[ priority pill · reply-SLA flag · ticket chip · AI chip · preview (truncate, muted) ]   [ unread dot ]
```

The second line wraps (`flex-wrap`), with the preview asking for `10rem` on a phone so
three chips never squeeze it to nothing. Selected row: `bg-surface-2`. Unread: an 8px
brand dot, right-aligned. Relative time collapses now/m/h/d then falls back to "MMM dd".

### 9.8 Primitives

**Client** (`mdg-client/src/components/ui`):

- **Button**: `rounded-full`, variants primary/secondary/ghost/danger, sizes sm(32)/md(40)/lg(48)/icon(40), a `loading` spinner and left/right icon slots. `hover:` is gated to real pointers; each variant carries an `active:` state for the press flash on touch.
- **Input**: `h-11 rounded-xl border-border-strong`, `invalid` → danger border.
- **Card**: `rounded-2xl border bg-surface shadow-sm`; `CardContent` `p-5`.
- **EmptyState**: 64px round icon halo + title + description + optional CTA, centred. Used wherever a list can be empty.
- **Toast**: bottom, centred, `max-w-sm`; 3.5 s, errors 8 s. **Avatar / Spinner** complete the set.

**Admin** (`mdg-admin/src/components/ui`; sizes below `md` are the 44px phone floor):

- **Buttons.** Four variants: `primary` (brand), `secondary` (border + surface), `ghost` (text only), `danger`. Sizes `sm` h-8 and `md` h-9 on desktop, each with `min-h-11` below `md`. `rounded-md font-semibold`.
- **Inputs, Select.** `h-11 md:h-9` (36px on desktop), `rounded-sm`, 1px `border-strong`, focus ring 2px `--color-focus-ring`, `text-base md:text-sm`. An error swaps the border to danger and shows helper text below.
- **Tables.** Row `h-11` (44px), `text-sm`; header `bg-surface-2 text-xs uppercase tracking-wide text-text-muted`; a sticky header is opt-in (`stickyHeader`).
- **Badges / chips.** `h-[22px]`, `text-xs font-medium`, `rounded-full`, intent colours from §8.
- **Cards.** `rounded-md border bg-surface shadow-sm`, padding `p-3 md:p-4`.
- **Empty states.** Centred, a 28px icon, `text-base font-semibold` title, `text-sm text-text-muted` description, optional CTA. No spinners for "no rows".
- **Dialog.** `rounded-lg` from `md`; a bottom sheet (`rounded-t-2xl` with a grab handle) below it.
- **Toasts.** Bottom-right from `md` (`max-w-sm`); full width above the tab bar and any pinned bottom bar on a phone. Auto-dismiss after 4 s, **errors after 8 s** (they are no longer sticky; a caller that needs one passes `duration: 0`).

---

## 10. Accessibility checklist

- Contrast: body text and `--color-text` on `--color-bg` must clear WCAG AA. Put white only on `warning.strong`, and use the `strong` status shades on a phone (§8).
- Every interactive element has a visible focus state (the 2px `--color-focus-ring` outline).
- Every icon-only button has an `aria-label`.
- Form errors are programmatically associated (`aria-describedby`).
- Modals trap focus and close on Esc.
- Tap targets are at least 44px; a form field is never below 16px.

---

## 11. Top consistency issues (ranked) + canonical call

1. **Token palettes diverge — still open, admin unchanged as of Oct 2026.** Client = warm neutral + near-black brand + `--color-online` + the `--wa-*` chat set; admin = blue/slate, no online token, no `.animate-in`. **Canonical = client palette.** Port the client `:root`/`.dark` block into `mdg-admin/src/index.css`.
2. **Two `Composer` contracts — still open.** Client `onSend(text, files)` vs admin `onSend({ body, attachments })` + `conversationId`. **Canonical = client signature** in a shared component; caller owns upload.
3. **Radius config vs usage.** The client's `borderRadius` config (4/8/12) is largely bypassed by direct `rounded-2xl/3xl/full`. Document the house radii (§5) as the real contract; the config values are for legacy admin form controls only.
