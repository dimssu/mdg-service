# ADR 0008 — Bilingual app i18n: a Hindi/English toggle for the dealer app

- Status: Accepted
- Date: 2026-07-03
- Related: ADR 0007 (Staff Points ships the first fully-bilingual surface), `docs/STYLE_GUIDE_V2.md`, `docs/ADOPTION_AUDIT.md`
- Scope: `mdg-client` (the dealer app, wrapped by the `mdg-app` WebView shell). `mdg-admin` (internal MDG tool) stays English.

## Context

The dealer audience reads Hindi more comfortably than English (personas, PRD). Today the
dealer app has **no i18n**: ~85–90% of user-visible strings are hardcoded English, and the
only bilingual surface (Kavach) shows **both** languages at once (`{labelEn} / {labelHi}`)
with no way to choose. There is no framework, no string catalog, no persisted language
choice, no switcher. A single owner staring at English chrome ("Welcome back", "Reports",
"Sign in") is exactly the "software I can't read" intimidation the adoption audit forbids.

We need a real **language toggle** that flips the _entire_ dealer app — chrome and content —
between Hindi and English, defaulting to Hindi.

Two kinds of translatable text exist and must be handled differently:

- **UI strings** (buttons, nav, headings, toasts): authored by us, one message per concept.
- **Bilingual DATA** (Kavach labels, the Staff work catalog): already shipped as parallel
  `labelEn`/`labelHi` sibling fields on the shared contracts.

## Decision

1. **No i18n framework — a tiny zustand slice + typed catalog.** The app already uses
   `zustand` + `persist` (auth store) and only needs **two** languages. We add
   `store/lang.ts` (`lang: 'en' | 'hi'`, persisted under `mdg.client.lang`, default `hi`)
   and `lib/i18n.ts` exporting a typed message catalog plus a `useT()` hook returning
   `t(key, vars?)`. react-i18next is deliberately avoided as overkill. **Locked:** keys are
   dot-namespaced (`nav.chat`, `staff.award.cta`), values are `{ en: string; hi: string }`,
   and the catalog is one typed object so a missing key is a compile error.

2. **A `pick(lang, en, hi)` helper for bilingual DATA.** Every existing "show both" render
   site (`{a.labelEn} / {a.labelHi}`, stacked `<p>` pairs, dual toasts, Kavach status
   labels, the pump-health verdict) converts to `pick(lang, a.labelEn, a.labelHi)` — one
   language at a time. The shared contracts are unchanged; the toggle only selects which
   sibling field to show.

3. **The whole dealer app is retrofitted, not just the new feature.** Every user-facing
   string in `mdg-client` — Login, Chat, Reports, Kavach, Profile, the new Staff surface,
   and shared `components/ui` copy — is extracted into the catalog. Interpolation
   (`"You have {n} things to do today"`) is supported via `t(key, { n })`. This is what
   "make the entire app language-configurable" requires; a half-retrofit that leaves Chat in
   English fails the ask.

4. **The switcher lives in Profile, with an optional header affordance.** A clear
   **हिंदी / English** control on the Profile screen (Profile is already the settings-ish
   home). Tapping flips `lang` instantly across every screen (reactive store read).

5. **Persist locally first, sync to the account best-effort.** The persisted zustand slice
   is the source of truth (survives Expo WebView cold starts — localStorage persists). We
   also add an optional `User.lang` and a self-serve `PATCH /v1/me` (`updateMyPreferences`)
   so the choice follows the member across devices and seeds the initial value on login
   (`user.lang ?? deviceDefault ?? 'hi'`). The PATCH is best-effort; a failure never blocks
   the UI toggle. **Locked:** `lang` is self-settable by the owning member only.

6. **No native Expo work.** `mdg-app` is a thin WebView over `mdg-client`; a web-side
   persisted choice already survives cold starts. Only the 4 native fallback strings
   (offline/error screens) are made bilingual for polish — no locale plumbing.

## Rationale

- **Smallest correct surface.** Two languages, a store the app already has, and a typed
  catalog give a compile-checked toggle with zero new dependencies and no provider ceremony.
- **One convention, two mechanisms.** UI strings via `t()`, data via `pick()` — matching the
  existing split (we author UI copy; the server ships bilingual data). Nothing about the
  shared contracts changes.
- **Adoption-first.** Hindi default, instant flip, a switcher where the owner already looks
  for settings. The retrofit also _fixes_ today's inconsistent "show both" sites (some drop
  Hindi entirely) into one deliberate choice.

## Consequences

- **Locked choices:** custom zustand catalog (no framework); `{ en, hi }` typed messages
  with dot keys; `pick()` for data; full `mdg-client` retrofit (not feature-only); switcher
  in Profile; default Hindi; local-persist source of truth with best-effort `User.lang`
  sync; no native Expo i18n; `mdg-admin` stays English.
- Every new dealer-facing string from now on must be added to the catalog (a lint-review
  checklist item), never hardcoded — the same discipline the bilingual-data convention
  already imposes on the server.
- Adding a third language later is a catalog widening (`{ en, hi, xx }`) + a switcher option;
  the `pick()`/`t()` seams already localise the change.
- RTL, pluralization rules, and number/date localisation are out of scope (Hindi/English
  share LTR and Arabic numerals); revisit only if a genuinely different locale is added.
