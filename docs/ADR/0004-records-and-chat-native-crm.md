# ADR 0004 — Records subsystem and chat-native CRM

- Status: Accepted
- Date: 2026-06-19
- Supersedes/extends: context in ARCHITECTURE_V2.md

## Context

Dealers need to receive periodic artifacts (Daily Sales Reports, invoices, compliance docs, statements) and need a lightweight way for the support team to triage and own dealer conversations. We already run a chat-first dealer portal with one Socket.IO-backed conversation per dealer.

Two questions had to be decided for the MVP:

1. How are records produced and delivered?
2. Do we build a traditional CRM, or reuse the conversation as the unit of work?

## Decision

### 1. Manual upload now, automate later

Records are created by an **admin manually**: presign + PUT the file to S3, then `POST /api/v1/records`. Optionally (`announceInChat`, default true) the backend posts a system chat message carrying a `RecordCard` and emits `record:new`. There is **no automated generation pipeline** in the MVP.

The data model (`DealerRecord` with `type`, `attachment`, `uploadedByAdminId`, provenance) is designed so that an automated producer can later create the same records by calling the same internal path — the manual admin is simply the first "producer." No client or schema changes will be needed when automation lands.

### 2. Chat-first records + chat-native CRM

- Records are delivered **into the conversation** as cards and also listed in a dedicated **Records shelf**. Chat remains the default landing surface for dealers.
- The **`Conversation` is the ticket**: `status` (OPEN/ASSIGNED/RESOLVED), `assignedAdminId`, plus admin-only `priority` and `category`, with changes audited. We do **not** introduce a separate ticket entity or a third-party CRM.

## Rationale

- **Time to value.** Manual upload ships immediately and validates demand before investing in per-document automation pipelines, which differ widely by record type.
- **No dual sources of truth.** A separate ticket object would have to stay in sync with the chat thread; making the conversation the ticket removes that entire class of bugs.
- **Invisible complexity.** Triage fields are stripped from dealer responses, so the CRM adds zero dealer-facing surface area.
- **Forward compatible.** The model already carries the seams (record `type`/provenance; ticket `status`/`priority`/`category`/assignment/audit) needed to grow into automation or a dedicated CRM service if scale demands it.

## Consequences

- Admin effort scales linearly with record volume until automation is built — acceptable at MVP dealer counts.
- One conversation per dealer means no parallel threads; revisit if dealers need concurrent independent tickets.
- `attachment.url` must be signed on every read; storage keys are never returned directly.
- RBAC stays route-level; dealer scoping is enforced by server-side `dealerId` constraints, not a policy engine.
