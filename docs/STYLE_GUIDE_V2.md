# MDG Style Guide V2 — Design Language (As Built + The Bar)

This documents the **client** design system as it ships today (`mdg-client`), the
**admin** system where it differs (`mdg-admin`), and the canonical bar to hold.
North star: a fuel dealer who distrusts technology should feel the app is "just
like WhatsApp" — calm, familiar, never intimidating.

Source of truth in code:

- Tokens: `mdg-client/src/index.css`, `mdg-client/tailwind.config.ts`
- Primitives: `mdg-client/src/components/ui/*`
- Chat: `mdg-client/src/features/chat/*`
- Records: `mdg-client/src/features/records/RecordCard.tsx`, `mdg-client/src/pages/RecordsPage.tsx`
- Admin inbox: `mdg-admin/src/pages/InboxPage.tsx`

---

## 1. Principles

- **Chat is home.** Default route is `/chat` (`App.tsx`). Everything else is one tap away on the bottom tab bar — never required.
- **One primary action per screen.** Client screens carry a single dominant action (send, tap-to-view). No dense dashboards on the dealer side.
- **Recognition over recall.** Tap targets ≥44px, plain language, icon **and** label, no jargon, no error codes.
- **Premium minimalism.** Warm neutrals + one near-black accent, soft shadows, `rounded-2xl` cards, `rounded-3xl` bubbles, Inter.
- **Records as cards, never spreadsheets.** DSR/invoices render as friendly cards in chat and in the Reports shelf grouped by type.
- **Mobile-first, ≤420px** (`max-w-md` shell). Must work in Expo WebView with safe-area insets.

---

## 2. Color tokens (CSS variables)

Tokens live on `:root` and `.dark`; Tailwind reads them via `theme.extend.colors`.
Always use the **semantic token**, never a raw hex, in components.

### Client — light (canonical for the dealer app)

```css
--color-bg: #fafaf9; /* page background (warm stone-50) */
--color-surface: #ffffff; /* cards, received bubbles, composer */
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
--color-online: #0f766e; /* deep teal "online" / read-receipt */
```

### Client — dark

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

| Token     | DEFAULT   | soft      | Used for                  |
| --------- | --------- | --------- | ------------------------- |
| `success` | `#16a34a` | `#dcfce7` | Resolved, delivered       |
| `warning` | `#d97706` | `#fef3c7` | Open / needs attention    |
| `danger`  | `#dc2626` | `#fee2e2` | Urgent, destructive       |
| `info`    | `#2563eb` | `#dbeafe` | Assigned, DSR record type |
| `neutral` | `#475569` | `#e2e8f0` | Default / normal priority |

### Admin tokens — **divergent** (`mdg-admin/src/index.css`)

Admin still uses the older **blue/slate** palette: `--color-bg #f8fafc`,
`--color-brand #2563eb` (blue), slate neutrals. It also **lacks** `--color-online`
and the V2 utilities (`safe-bottom`, `animate-in`, `fade-in`).

> **Canonical:** the warm-neutral, near-black client palette is the V2 standard.
> Admin should adopt the same `:root`/`.dark` variable block and add `--color-online`.
> Keep `--color-brand` blue in admin **only** if a deliberate "internal tool"
> distinction is wanted; otherwise unify on near-black. See §10.

---

## 3. Type scale

Font: **Inter** → `system-ui` fallback, with `font-feature-settings: 'cv11','ss01'`.
Headings get `letter-spacing: -0.01em`.

| Role                  | Size / classes                                    | Notes                                 |
| --------------------- | ------------------------------------------------- | ------------------------------------- |
| Screen title          | `text-lg font-semibold tracking-tight`            | e.g. "Reports", "Welcome back"        |
| Section header        | `text-base font-semibold`                         | chat header dealer name               |
| **Chat bubble body**  | `text-[15px] leading-snug`                        | matches messaging apps; not `text-sm` |
| Body / list           | `text-sm`                                         | previews, descriptions                |
| Record card title     | `text-[15px] font-semibold leading-snug`          |                                       |
| Caption / meta        | `text-xs` (`12px`)                                | timestamps row, period label          |
| Micro / timestamp     | `text-[11px]`                                     | bubble time, read receipt             |
| Eyebrow / shelf group | `text-xs font-semibold uppercase tracking-wide`   | Reports section labels                |
| Pill / chip label     | `text-[10px] font-medium uppercase tracking-wide` | record-type chip                      |

`15px` for primary reading text is intentional and load-bearing for the
WhatsApp feel — do not collapse it to the `14px` `text-sm` default.

---

## 4. Spacing

Tailwind 4px base scale. House rhythm:

- Screen padding: `p-4` (16px); chat scroll area `px-3 py-4`.
- Card inner padding: `p-4` (record card), `p-5` (`CardContent`), `p-3` compact.
- Inter-message gap: `gap-2`; bubble→meta gap: `gap-1.5`.
- Composer: `px-3 py-3`, controls `gap-2`.
- Reports shelf: section `gap-6`, within section `gap-2`.
- Bottom tab bar leaves `pb-20` on `<main>` so content never hides behind it.

---

## 5. Radius

| Element                               | Radius                                                                                    | Class                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Chat bubble**                       | `rounded-3xl` + one squared "tail" corner (`rounded-br-md` mine / `rounded-bl-md` theirs) | bubble                                    |
| **Cards / record card**               | `rounded-2xl`                                                                             | `Card`, `RecordCard`                      |
| Composer input                        | `rounded-2xl`                                                                             | textarea                                  |
| Avatar / icon buttons / chips / pills | `rounded-full`                                                                            | buttons, day pills, type chip, system msg |
| Inline icon wrap inside card          | `rounded-xl`                                                                              | record-type icon tile                     |
| Inputs (forms)                        | `rounded-xl`                                                                              | `Input`                                   |
| Image / attachment thumb              | `rounded-xl` / `rounded-lg`                                                               | attachment, staged chip                   |

Note the `tailwind.config` `borderRadius` overrides (`sm 4px / md 8px / lg 12px`)
exist but most house components reach for `rounded-2xl`/`rounded-3xl`/`rounded-full`
directly. The squared tail corner is what makes a bubble read as a bubble — keep it.

---

## 6. Shadow tiers

```
shadow-sm: 0 1px 2px  rgba(15,23,42,0.06)   /* cards, bubbles, chips — default */
shadow-md: 0 4px 12px rgba(15,23,42,0.08)   /* raised / hover, popovers */
shadow-lg: 0 16px 40px rgba(15,23,42,0.16)  /* dialogs, lightbox */
```

Shadows are soft and low-contrast on purpose. Bubbles and record cards use
`shadow-sm`; borders do the rest of the separation work.

---

## 7. Iconography (Lucide)

- Library: **lucide-react**, default `strokeWidth={1.75}` (1.5 for large empty-state glyphs, 2 for tiny check marks).
- Common sizes: 22 (tab bar), 20 (composer/card), 18 (inline), 14 (admin buttons), 13 (read ticks).
- Always pair an icon with a text label in navigation and actions.

Canonical icon mapping:

| Meaning            | Icon                                             |
| ------------------ | ------------------------------------------------ |
| Chat / home        | `MessageCircle`                                  |
| Reports / records  | `FileText`                                       |
| Services           | `Wrench`                                         |
| Profile            | `User`                                           |
| Send               | `SendHorizonal`                                  |
| Attach             | `Paperclip`                                      |
| Upload report      | `FileUp`                                         |
| Sent / read        | `Check` / `CheckCheck` (read = `--color-online`) |
| Empty chat         | `MessageCircleHeart`                             |
| Record: DSR        | `FileBarChart` (info/blue)                       |
| Record: Invoice    | `Receipt` (amber)                                |
| Record: Compliance | `FileCheck2` (emerald)                           |
| Record: Statement  | `Wallet` (violet)                                |
| Record: Other      | `FileText` (neutral)                             |

---

## 8. Status & priority semantics

### Record-type color (`RecordCard.tsx`, canonical)

dsr → info-soft/info · invoice → amber-100/amber-700 · compliance →
emerald-100/emerald-700 · statement → violet-100/violet-700 · other →
surface-2/text-muted. These drive **both** the type chip and the icon tile.

> Inconsistency: dsr uses the semantic `info-soft` token while the other four
> use raw Tailwind palette classes (`amber-100`, etc.). Canonicalize by adding
> soft tokens (`invoice`, `compliance`, `statement`) or by making all five raw —
> pick one. Recommendation: add semantic tokens so dark mode can be tuned.

### Conversation status (admin, `InboxPage.tsx` `statusBadge`)

OPEN → `warning` (Open) · ASSIGNED → `info` (Assigned) · RESOLVED → `success` (Resolved).

### Ticket priority → intent (`PRIORITY_INTENT`)

urgent → `danger` · high → `warning` · normal → `neutral` · low → `info`.
The priority pill is **suppressed when `normal`** (the common case) to reduce noise —
only abnormal priorities draw a chip. Keep this.

---

## 9. Component anatomy

### 9.1 Chat bubble (`MessageBubble.tsx`)

```
[ optional attachment(s): rounded-xl image/file, stacked, gap-1.5 ]
[ bubble: rounded-3xl + tail corner, px-4 py-2.5, text-[15px], shadow-sm ]
[ meta row: time text-[11px]  (+ Check/CheckCheck if mine & last) ]
```

- **Mine:** `bg-brand text-text-inverse`, right-aligned, `rounded-br-md` tail, max-w-78%.
- **Theirs:** `bg-surface border border-border`, left-aligned, `rounded-bl-md` tail.
- Read tick turns teal (`--color-online`) once read by the other party.
- Animates in with `.animate-in` (4px rise + fade, 180ms).

### 9.2 System message (`SystemMessage`)

Centered pill: `rounded-full bg-surface-2 px-3 py-1 text-[12px] text-text-muted`,
max-w-85%. Used for status/automated notices. Day separators reuse the same pill
in `text-[11px] uppercase`.

### 9.3 Record card (`RecordCard.tsx`) — full + compact

```
[ icon tile rounded-xl (type color) ] [ type chip (uppercase) ]
                                       [ title text-[15px] font-semibold ]
                                       [ periodLabel text-xs muted ]
                                       [ "Tap to view" / "Preparing…" text-xs brand ]
```

- Whole card is a `<button>`, `rounded-2xl border bg-surface shadow-sm`, min-h-44px.
- `url` present → tappable, opens signed file in new tab, hover `bg-surface-2`,
  footer reads **"Tap to view"**. Absent → disabled, footer **"Preparing…"**.
- `compact` (used inside chat, `CardMessage`): `p-3`, 40px tile, 18px icon. Full
  (Reports shelf): `p-4`, 44px tile, 20px icon.
- In chat the card is centered, max-w-88%, with optional caption above and
  timestamp below — it reads as a delivered document, not a table row.

### 9.4 Reports shelf row (`RecordsPage.tsx`) — canonical

The shelf is the full-width **RecordCard stacked under uppercase type headers**,
newest-first within each group; groups ordered by `RECORD_TYPES`. Empty state:
"No reports yet… We'll message you when a new one is ready." There is **no
spreadsheet/table** anywhere on the dealer side — this is the whole point.

> Inconsistency: the **admin** "Reports" panel (`InboxPage.tsx` context sidebar)
> renders a bare `FileText` + title/period list, NOT `RecordCard`. Canonical is
> the friendly card. Either reuse a compact `RecordCard` in admin, or accept the
> denser list as an intentional internal-tool affordance — but document it.

### 9.5 Composer (`Composer.tsx`)

```
[ staged attachment chips row (horizontal scroll, only if staged) ]
[ (Paperclip 40x40 round) (auto-grow textarea rounded-2xl bg-surface-2) (Send 40x40 round) ]
```

- `border-t border-border bg-surface safe-bottom` (respects WebView inset).
- Textarea: `min-h-40px max-h-140px`, placeholder "Message", auto-resizes.
- Send button is `bg-brand` only when sendable, else `bg-surface-2 text-text-subtle`
  (the button visibly "lights up" — recognition over recall).
- Cmd/Ctrl+Enter sends. Spinner replaces the send glyph while sending.

> Inconsistency: **two Composers with different contracts.** Client
> `onSend(text, files)` uploads inside `ChatPage`; admin
> `onSend({ body, attachments })` + a `conversationId` prop and uploads itself.
> Canonical: one shared `Composer` taking `onSend(text, files[])`, with upload
> owned by the caller. Until merged, treat the client signature as the reference.

### 9.6 Ticket priority pill (`InboxPage.tsx` `priorityPill` + `Badge`)

`Badge`: `inline-flex h-[22px] rounded-full px-2 text-xs font-medium`, colored by
`INTENT_CLASSES[intent]`. Hidden for `normal`. Labels: Urgent/High/Low.
Conversation status reuses `Badge` with OPEN/ASSIGNED/RESOLVED intents.

### 9.7 Conversation list row (`InboxPage.tsx`)

```
[ dealerName (truncate, medium) ........... relative time (text-xs subtle) ]
[ priority pill? · last message preview (truncate, muted) ]   [ unread dot ]
```

Selected row: `bg-surface-2`. Unread: 2px brand dot, right-aligned. Relative time
collapses now/m/h/d then falls back to "MMM dd".

### 9.8 Other primitives

- **Button** (`Button.tsx`): `rounded-full`, variants primary/secondary/ghost/danger,
  sizes sm(32)/md(40)/lg(48)/icon, built-in `loading` spinner + left/right icon slots.
- **Input** (`Input.tsx`): `h-11 rounded-xl border-border-strong`, `invalid` → danger border.
- **Card** (`Card.tsx`): `rounded-2xl border bg-surface shadow-sm`; `CardContent` `p-5`.
- **EmptyState** (`EmptyState.tsx`): 64px round icon halo + title + description + optional CTA, centered. Used everywhere a list can be empty.
- **Avatar / Spinner / Toast** complete the set (`components/ui/index.ts`).

---

## 10. Top consistency issues (ranked) + canonical call

1. **Token palettes diverge.** Client = warm neutral + near-black brand + `--color-online`; admin = blue/slate, no online token, no V2 utilities. **Canonical = client palette.** Port the client `:root`/`.dark` block (and `safe-bottom`/`animate-in`) into `mdg-admin/src/index.css`.
2. **Two `Composer` contracts.** Client `onSend(text, files)` vs admin `onSend({ body, attachments })` + `conversationId`. **Canonical = client signature** in a shared component; caller owns upload.
3. **Reports shelf rendered two ways.** Dealer uses friendly `RecordCard`; admin uses a bare `FileText` list. **Canonical = `RecordCard`** (compact) — reuse it in admin or explicitly document the list as an internal-density exception.
4. **Record-type color: mixed token vs raw.** `dsr` uses `info-soft`; the rest use raw `amber/emerald/violet`. Add semantic soft tokens for invoice/compliance/statement.
5. **Radius config vs usage.** `borderRadius` config (4/8/12) is largely bypassed by direct `rounded-2xl/3xl/full`. Document the house radii (this guide) as the real contract; the config values are for legacy admin form controls only.
