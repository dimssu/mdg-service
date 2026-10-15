# Audit logging — user activity trail

How the platform records **who did what, when, and from where**, and how admins read it.
See ADR 0020 for the rationale.

## The record

Every audit row (`AuditLog`, `mdg-backend/src/models/AuditLog.ts`) captures:

| Field                      | Meaning                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `entity` / `entityId`      | What was acted on (e.g. `Dealer`/`<id>`, `Auth`/`<email>`).       |
| `action`                   | A verb from `AUDIT_ACTIONS` (e.g. `CREATE`, `LOGIN_FAILED`).      |
| `actorId`                  | The acting `User`/`Admin` id, or `anonymous` / `system`.          |
| `actorRole` / `actorEmail` | Snapshotted from the JWT at write time (self-describing forever). |
| `ip` / `userAgent`         | Request origin. **Personal data.** Null for background actions.   |
| `method` / `path`          | HTTP method + path (query string stripped).                       |
| `before` / `after`         | State snapshots / summaries (secrets & PII redacted — see below). |
| `at`                       | Timestamp.                                                        |

`actorName` is **not stored** — it is resolved at read time from the `User`/`Admin` stores,
so a later rename is reflected retroactively and there is no extra write per action.

## How actions are recorded

- **Route handlers** call `auditFromReq(req, { entity, entityId, action, before?, after?,
actorId? })` (`mdg-backend/src/utils/audit.ts`). It auto-fills actor + IP/UA/method/path.
  `req.ip` is trustworthy because `app.set('trust proxy', env.TRUST_PROXY)` is set.
- **Background jobs** call the lower-level `writeAudit({ ... actorId })` — no request,
  so no IP/UA. The writers today: the reply-SLA sweep, `executeRun`, the AI first line,
  ticket raise and merge, the Kavach automation mark, and the nightly document reminders.
  The actor is `system` or `scheduler` where no person acted.
- **Best-effort:** `writeAudit` never throws. A failed audit insert is logged, not
  propagated, so it can't break the user action it records. It is still awaited.

## What is covered

The named list is `AUDIT_ACTIONS` in `shared/src/types/enums.ts` — 135 actions on 15 Oct 2026.
`action` is a plain string in the model, and the code writes 15 more names the list does not
carry (see "Other" below). To see what has really been written, read the `AuditLog`
collection, not the list. By area:

- **Sign-in:** login and `LOGIN_FAILED` (invalid password / suspended / unknown email).
  `LOGOUT` is in the list but nothing writes it.
- **Admins and dealers:** admin create/update/password-reset; dealer create/update/delete,
  archive/restore; the outlet profile (`DEALER_PROFILE_UPDATE`); dealer users
  create/update/suspend.
- **Portal passwords:** IRAS and SDMS set, clear and reveal.
- **Services and runs:** attach/update/detach/run-now and `SERVICE_LOGGED`.
- **Onboarding:** step complete/reopen.
- **Chat:** started, assigned, reassigned, ticket-updated, resolved, reopened (incl. the
  client-message reopen), the auto-unassign sweep, a file sent to the whole outlet
  (`CHAT_MESSAGE_SHARED`), and chat asks marked received or sent back.
- **Tickets:** raise, merge, seen, resolve, reopen, urgency.
- **AI first line:** answer, hand-off, re-share, review, kill switch, per-dealer mode.
- **Kavach:** admin verify, automation mark, evidence request/submit/reject, catalog
  edits, a dealer's work list, digest share.
- **Staff points:** worker add/update, award/undo, draft finalize and clear, work lists
  and catalog edits, leave set/clear.
- **Shares and collections:** DSR, Credit & DOD and load-plan shares; inspection-report
  and RO supply status collection; Ledger Watch findings, rules and cards.
- **IRAS shift data:** corrections, reverts, day verify/unverify.
- **Papers (document asks):** every state change, reminders and catalog edits.
- **Other:** preferences, festival band, bank and depot holidays, admin alerts,
  grievances and registrations, the landing assistant's block list. Written but not in the
  named list: correctness-gate overrides and remarks (`ASSURANCE_*`), film links
  (`FILM_LINK_*`), `IRAS_DAY_CREATED`, `DSR_REBASELINE`, `WHATSAPP_REPLY_SEEN`, and five more
  AI first line actions (writer switch, photo filed, guard block and clear, document send).

**Sensitive reads** are logged as data-access events, not mutations:
`ARTIFACT_DOWNLOAD` (run artifacts), `ATTACHMENT_DOWNLOAD` (staff hardcopy photos, and chat
files on an explicit download), `TT_INVOICE_PDF_VIEW`, `TT_REGISTER_PHOTO_VIEW`,
`DOCUMENT_ASK_FILE_VIEW`, `RO_SUPPLY_STATUS_CARD_VIEW`, `LEDGER_WATCH_CARD_VIEW`,
`WATER_INGRESS_CARD_VIEW`, `IRAS_SLIP_PHOTO_VIEW`, and the two password reveals
(`IRAS_CREDENTIALS_REVEAL`, `SDMS_CREDENTIALS_REVEAL`).

`RECORD_VIEWED` is no longer written: the Reports shelf was retired on 13 Oct 2026. The
`RECORD_MIGRATED` rows hold each report that was moved into the dealer's chat.

## Secrets & PII hygiene

`before`/`after` never contain: passwords or hashes (recorded as `{ passwordChanged: true }`),
portal credentials, IRAS and SDMS (only `{ username, setAt }` — never plaintext or ciphertext), bank account
details (stripped; `bankDetailsChanged` boolean instead), or push tokens. IP + user-agent
are retained deliberately as forensic context.

## Reading the trail

| Endpoint                 | Who         | Purpose                                                                                                                            |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GET /audit`             | super-admin | Paginated feed. Filters: `actorId`, `entity`, `entityId`, `action`, `from`, `to`. Newest first, actor names resolved in one batch. |
| `GET /audit/actors`      | super-admin | Distinct actors + activity counts (powers the actor filter).                                                                       |
| `GET /dealers/:id/audit` | admin       | Pre-existing per-dealer view (unchanged).                                                                                          |

Both new endpoints are gated by `requireAuth` + `requireSuperAdmin` — only the
**super-admin** tier can read the activity trail (regular admins get 403).

### Admin UI

The **Activity** page (`/activity`, `mdg-admin/src/pages/ActivityPage.tsx`) is shown only to
super-admins (nav link hidden + `RequireSuperAdmin` route guard for everyone else). It mirrors
the standard list-page pattern: a filter bar (actor / entity / action / from / to, persisted in
the URL) over a table (Time, Actor + role, Action, Entity, Target, IP). Clicking a row opens
a detail dialog with the actor, full request context (method/path, IP, user-agent), and the
`before`/`after` JSON.

## Config

| Env           | Default    | Effect                                                                                                                                                  |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRUST_PROXY` | `loopback` | Express `trust proxy`; governs how `req.ip` is derived from XFF. Set to the proxy hop-count (e.g. `1`) in production so the real client IP is recorded. |

## Known gaps

See `LIMITATIONS.md` → "Audit logging": no retention/TTL policy (IP/UA kept indefinitely),
not tamper-proof (same DB), best-effort (not guaranteed), and service-layer actions
(Kavach) carry `actorId` but not IP/UA.
