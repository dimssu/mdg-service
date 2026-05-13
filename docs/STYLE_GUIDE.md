# Dealer Kavach - Visual Style Guide

A short, opinionated style guide for the admin portal. Drop-in for Tailwind. The frontend agent should wire these tokens into `tailwind.config.ts` and a global `styles/tokens.css`.

## 1. Design principles

- **Calm, dense, fast.** This is an internal tool used 8 hours a day. No marketing flourishes.
- **One accent.** A single brand colour. Status colours speak for everything else.
- **Plain text wins.** Buttons and chips use words first, icons second.
- **Always show state.** Loading, empty, error, and success states are first-class.

## 2. Colour tokens

Tokens are defined as CSS variables on `:root` and overridden under `.dark`. Tailwind reads them through `theme.extend.colors`.

### Light

```css
:root {
  --color-bg:           #f8fafc;   /* page background */
  --color-surface:      #ffffff;   /* cards, modals */
  --color-surface-2:    #f1f5f9;   /* nested surfaces */
  --color-border:       #e2e8f0;
  --color-border-strong:#cbd5e1;

  --color-text:         #0f172a;
  --color-text-muted:   #475569;
  --color-text-subtle:  #64748b;
  --color-text-inverse: #ffffff;

  --color-brand:        #2563eb;
  --color-brand-hover:  #1d4ed8;
  --color-brand-soft:   #dbeafe;

  --color-focus-ring:   #60a5fa;
}
```

### Dark

```css
.dark {
  --color-bg:           #0b1220;
  --color-surface:      #111827;
  --color-surface-2:    #1f2937;
  --color-border:       #1f2937;
  --color-border-strong:#334155;

  --color-text:         #e5e7eb;
  --color-text-muted:   #94a3b8;
  --color-text-subtle:  #64748b;
  --color-text-inverse: #0f172a;

  --color-brand:        #3b82f6;
  --color-brand-hover:  #2563eb;
  --color-brand-soft:   #1e3a8a;

  --color-focus-ring:   #60a5fa;
}
```

### Status semantics

Use these for chips, badges, and toasts. Pair the foreground with the matching `-soft` background.

| Intent   | Fg        | Soft bg   |
|----------|-----------|-----------|
| success  | `#16a34a` | `#dcfce7` |
| warning  | `#d97706` | `#fef3c7` |
| danger   | `#dc2626` | `#fee2e2` |
| info     | `#2563eb` | `#dbeafe` |
| neutral  | `#475569` | `#e2e8f0` |

Domain-to-intent mapping:

| Domain                         | Intent  |
|--------------------------------|---------|
| `Dealer.status = ACTIVE`       | success |
| `Dealer.status = PENDING_DETAILS` | warning |
| `Dealer.status = SUSPENDED`    | danger  |
| `DealerService.status = ACTIVE`| success |
| `DealerService.status = PAUSED`| neutral |
| `ServiceRun.status = PENDING`  | neutral |
| `ServiceRun.status = RUNNING`  | info    |
| `ServiceRun.status = SUCCESS`  | success |
| `ServiceRun.status = FAILED`   | danger  |
| SLA tier `BRONZE`              | neutral |
| SLA tier `SILVER`              | info    |
| SLA tier `GOLD`                | warning |

## 3. Type scale

Use Inter as the UI font (system-ui fallback).

| Token | Size (rem) | Line height | Use                              |
|-------|-----------:|------------:|----------------------------------|
| xs    | 0.75       | 1rem        | meta, footnotes                  |
| sm    | 0.875      | 1.25rem     | secondary text, table cells      |
| base  | 1.0        | 1.5rem      | body                             |
| lg    | 1.125      | 1.75rem     | section headings inside cards    |
| xl    | 1.25       | 1.75rem     | page subtitles                   |
| 2xl   | 1.5        | 2rem        | page titles                      |
| 3xl   | 1.875      | 2.25rem     | dashboard hero number            |

Weights: 400 (body), 500 (emphasis), 600 (headings, button labels). Avoid 700+.

## 4. Spacing scale

Tailwind's default is fine; we use a subset to keep layouts disciplined.

| Token | px | Use                                        |
|-------|---:|--------------------------------------------|
| 1     | 4  | tight inline gaps, icon-label              |
| 2     | 8  | form field padding, chip padding           |
| 3     | 12 | card content padding (small)               |
| 4     | 16 | card content padding (default)             |
| 6     | 24 | section gaps                               |
| 8     | 32 | page section separation                    |
| 12    | 48 | page top padding, large breathing room     |

## 5. Radius

| Token | px  | Use                                  |
|-------|----:|--------------------------------------|
| sm    | 4   | inputs, small chips                  |
| md    | 8   | buttons, cards (default)             |
| lg    | 12  | modal, large card                    |
| full  | 9999 | avatars, status dots                |

## 6. Shadow tiers

Used sparingly. Cards rely on borders in light mode and elevation only when floating.

| Token | Definition                                                 | Use                  |
|-------|-------------------------------------------------------------|----------------------|
| sm    | `0 1px 2px rgba(15,23,42,0.06)`                             | resting cards        |
| md    | `0 4px 12px rgba(15,23,42,0.08)`                            | menus, popovers      |
| lg    | `0 16px 40px rgba(15,23,42,0.16)`                           | modals, dialogs      |

## 7. Iconography

- Library: **Lucide** (`lucide-react`).
- Default size: 16px in tables/chips, 18px in buttons, 20px in nav.
- Stroke width: 1.75.
- Always pair with a text label except for unambiguous standalone actions (close, edit row). Icon-only buttons need `aria-label`.

Common picks:
- `Building2` - dealer
- `Plug` - attach service
- `Activity` - runs
- `LayoutDashboard` - overview
- `Search` - search input
- `MoreVertical` - row menu
- `CheckCircle2 / AlertCircle / XCircle / Clock` - status

## 8. Component conventions

- **Buttons.** Three intents: `primary` (brand), `secondary` (border + surface), `ghost` (text only). Two sizes: `sm` (h-8), `md` (h-9). Destructive action uses danger intent.
- **Inputs.** 36px tall, 1px border `--color-border-strong`, focus ring 2px `--color-focus-ring`. Errors swap border to danger and show helper text below.
- **Tables.** Row height 44px, `text-sm`, sticky header, zebra optional. Column headers `text-xs uppercase tracking-wide`.
- **Chips/Badges.** 22px tall, `text-xs`, radius `full`, `intent.fg` on `intent.soft`.
- **Cards.** Surface, 1px border, radius `md`, padding `4`.
- **Empty states.** Centered, muted text, optional CTA. No spinners for "no rows".
- **Toasts.** Bottom-right, auto-dismiss 4s for success, sticky for errors.

## 9. Tailwind config sketch

```ts
// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-subtle': 'var(--color-text-subtle)',
        brand: {
          DEFAULT: 'var(--color-brand)',
          hover: 'var(--color-brand-hover)',
          soft: 'var(--color-brand-soft)',
        },
        success: { DEFAULT: '#16a34a', soft: '#dcfce7' },
        warning: { DEFAULT: '#d97706', soft: '#fef3c7' },
        danger:  { DEFAULT: '#dc2626', soft: '#fee2e2' },
        info:    { DEFAULT: '#2563eb', soft: '#dbeafe' },
      },
      borderRadius: { sm: '4px', md: '8px', lg: '12px' },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,0.06)',
        md: '0 4px 12px rgba(15,23,42,0.08)',
        lg: '0 16px 40px rgba(15,23,42,0.16)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## 10. Accessibility checklist

- Contrast: body text and `--color-text` on `--color-bg` must clear WCAG AA.
- Every interactive element has a visible focus state (the 2px ring above).
- Every icon-only button has an `aria-label`.
- Form errors are programmatically associated (`aria-describedby`).
- Modals trap focus and close on Esc.
