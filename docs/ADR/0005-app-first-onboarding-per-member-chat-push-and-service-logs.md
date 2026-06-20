# ADR 0005 — App-first onboarding, per-member chat, push delivery, and service logs

- Status: Accepted
- Date: 2026-06-20
- Supersedes/extends: ADR 0004; context in ARCHITECTURE_V2.md

## Context

The V2 MVP shipped a chat-first dealer portal with one conversation per dealer, records, and a chat-native CRM (ADR 0004). Early use surfaced four things that needed deciding:

1. **WhatsApp was still the entry point.** Onboarding created WhatsApp groups and depended on a "WhatsApp number"; communication straddled WhatsApp and the app, which split context and undercut the "the app is the product" thesis.
2. **A dealer is an organisation, not a person.** A petrol pump has an owner and often one or more managers, but the model gave the whole org a single shared conversation — so support couldn't tell who they were talking to, and members shared one thread.
3. **Push was stubbed.** `mdg-app` captured an Expo token but the backend never sent anything, so dealers only saw updates while the app was open.
4. **Services had no record.** Services are delivered by hand, but nothing captured that a service was provided, so there was no per-dealer "what have we done for them" history.

## Decision

### 1. Drop WhatsApp; issue an app login at onboarding

WhatsApp is **fully removed**. Dealer communication is app-native via `mdg-client` (wrapped by `mdg-app`). Onboarding is now a **7-step, app-first flow**: `collect-phone`, `send-welcome`, `send-terms-link`, `send-pdf`, `receive-payment-and-gst`, `assign-code`, `issue-app-login`. The two former WhatsApp group-creation steps are replaced by a single **issue-app-login** step where the admin creates the dealer owner's app login and shares the credentials. The dealer `code` (e.g. `E01`) remains the friendly organisation identifier. **Logins are email + password.**

### 2. Per-member private conversations; org-shared records and service history

A dealer (= organisation / petrol pump) can have multiple members: the owner and one or more managers (managers reuse the **`dealer-staff` role with `title: "Manager"`**). The `Conversation` model gains a **`userId`** field and is **unique per member** — each member has their own private thread with support. It is no longer one-per-dealer. The admin inbox lists conversations per member, **grouped by organisation**. **Records and service history stay shared at the organisation (dealer) level** — only the chat thread is private.

### 3. Implement Expo push delivery

Push notification **delivery** is now implemented (not just token capture). A new `Device` model stores Expo tokens, registered/unregistered via `POST/DELETE /api/v1/devices`. An Expo push sender (`lib/push/expoPush.ts`, gated by `PUSH_ENABLED`) fires on: **admin replies** (to that member), **new records** (to all org members), and **request resolved** (to that member). `mdg-client` registers/unregisters its token and handles deep-link taps via the existing native bridge.

### 4. Require a manual service log at resolution

A new `ServiceLog` model captures hand-delivered services, exposed via `GET/POST /api/v1/service-logs`. **Resolving a conversation (`POST /api/v1/conversations/:id/resolve`) now requires a service log**: a `serviceId` chosen from the existing service catalog (`GET /services`) — or `'other'` plus a free-text `serviceName` — together with required `notes`. This builds a per-dealer "services provided" history shown on the admin dealer detail page.

## Rationale

- **One surface, real adoption.** Removing WhatsApp eliminates the split-context problem and makes the app the single front door, which is the whole product thesis.
- **Accountable conversations.** Per-member threads tell support exactly who they're helping and keep one member's chat private from another, while keeping records/history shared where sharing is genuinely wanted (the org's documents).
- **Reach off-screen.** Real push means dealers learn about replies, records, and resolutions without the app open — the missing half of a chat product.
- **Accurate service history.** Forcing a service log at resolution means the "what have we done for this dealer" history is a byproduct of closing work, not a separate chore that gets skipped.
- **Minimal new surface.** Managers reuse `dealer-staff` (a `title`, not a new role); the resolve flow reuses the existing service catalog; push is gated so non-app environments are unaffected.

## Consequences

- **Locked choices:** logins are **email + password**; managers are **`dealer-staff` with a `title`** (e.g. `"Manager"`), not a distinct role.
- Conversation `userId` is unique; conversation-scoped realtime events target the member's `user:<userId>` room, while org-wide events (`record:new`) use `dealer:<dealerId>`.
- Admins cannot resolve a conversation without choosing a service (or `'other'`) and writing notes — by design.
- Push depends on `PUSH_ENABLED` and a valid Expo project; with it off, triggers no-op cleanly.
- Onboarding docs, UX flows, UAT, and the landing roadmap drop all WhatsApp references and describe the app-first 7-step flow.
- RBAC stays route-level; member-level conversation scoping is enforced by server-side `userId` constraints, org scoping by `dealerId`.
