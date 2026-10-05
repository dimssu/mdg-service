# ADR 0016 — Admin alerts: what needs a person, on every admin's phone

Status: accepted, 2026-10-05. The owner approved the list of alerts and chose
"everything instantly" for delivery, and asked that the same alerts be listed in
the admin app so it is clear what still needs acting on.

## 1. What it is

The server checks every two minutes for anything that needs a person at MDG. A
new problem goes onto the **Alerts** list in the admin app and is pushed to
every active admin's phone. The list item clears itself when the problem is
fixed. A bell in the header shows how many are waiting, on every screen.

## 2. The alerts

| Alert               | Fires when                                                                                       | Clears when                                   | Who    |
| ------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------ |
| Portal login        | A run was refused by SDMS/IRAS, or no password is saved. One per outlet and portal               | The outlet signs in again                     | Admins |
| Service failed      | A permanent failure, or a temporary one after its 2 automatic retries                            | A run works, or the service is paused         | Admins |
| Service late        | 45 min past due and not running                                                                  | It runs                                       | Admins |
| Service stopped     | On a timer but with no next run                                                                  | It has a next run                             | Admins |
| Waiting for a reply | A dealer has had no reply for 30 min                                                             | Someone (or the AI first line) replies        | Admins |
| Paper to review     | A dealer sent a paper we asked for                                                               | Accepted or sent back                         | Admins |
| Paper running out   | The newest filed copy runs out by tomorrow (or ran out in the last 90 days) and no renewal is in | A renewal is sent in or filed                 | Admins |
| Kavach proof        | Proof is waiting for verification. One per outlet, with a count                                  | Every submitted task is verified or sent back | Admins |
| Report held back    | The correctness check is withholding a report from the last 3 days (ENFORCE mode only)           | It passes, is released, or is sent            | Admins |
| Supply blocked      | The RO supply status reads blocked. The all-clear is pushed too                                  | It is no longer blocked                       | Admins |
| Ledger charge       | Ledger Watch found a non-routine charge in the last 14 days                                      | It is marked as read in Ledger watch          | Admins |
| Outdated copy       | A dealer holds a report or credit card we have since corrected                                   | The corrected copy is sent                    | Admins |
| Server              | The last process died without shutting down, or the server was off >10 min                       | Marked as seen, or after a day                | Super  |
| Server start-up     | A boot step failed                                                                               | The step succeeds on a later start            | Super  |

## 3. How it stays quiet

The owner asked for every alert, instantly, to every admin. That only works if
each alert is worth reading, so these rules apply:

1. **One alert per problem, not per event.** Each alert has a key that names the
   problem (`service:<dealer>:<service>`, `login:<dealer>:<portal>`). A unique
   partial index allows only one live alert per key, so a problem is pushed
   once, however many times it fails. Before this existed, 64 of the 102 failed
   runs in a month were a single outlet with no password saved.
2. **Nothing the machine is still fixing.** A temporary failure re-arms its own
   retry twice. It is only raised once those retries are spent.
3. **A burst becomes one push.** More than three new alerts in one pass are sent
   as a single notification ("10 new alerts") that opens the list.
4. **A failed check clears nothing.** If one check's database read fails, its
   alerts are left exactly as they were. Otherwise one hiccup would clear them
   all, and the next pass would raise and push them all again.
5. **Hiding is not closing.** An admin can hide an alert they cannot act on
   today. It stays live, so it is not raised again, and it clears on its own
   once fixed.

## 4. How it works

- `mdg-backend/src/services/adminAlerts/` has three checks (`services`,
  `people`, `reports`) that each return the problems true right now. `sweep.ts`
  compares them with the live alerts:
  - a new key is created and pushed;
  - a known key has its wording refreshed, silently;
  - a live alert whose key has gone is resolved.
- The sweep runs every two minutes (`ADMIN_ALERT_SWEEP_CRON`). It also runs
  three seconds after any of these, via `nudgeAdminAlerts`:
  - a run finishes;
  - a paper changes state;
  - Kavach proof is sent, verified or sent back;
  - an admin replies in chat.
- It starts only where the scheduler starts. A laptop on the real database never
  pushes and never writes the heartbeat.
- The server's own health uses a one-row heartbeat (`ServerHeartbeat`):
  - it is stamped every minute;
  - the SIGINT/SIGTERM handler marks it `cleanStop`;
  - a boot that finds no clean stop raises "stopped without warning".
- `GET /admin-alerts?view=open|dismissed|cleared`, `POST /:id/dismiss`,
  `POST /:id/restore`. Super-admin-only kinds are filtered out for everyone
  else, including the counts.
- The admin app gets `alerts:changed` over the socket and refetches. The bell and
  the sidebar badge read the same query.

## 5. What it cannot do

- **A dead box cannot report itself.** The server-down alert arrives when the
  server comes back. Hearing about it while it is still down needs an outside
  monitor that checks the API from elsewhere. That has not been set up.
- **Pushes need the admin app installed and signed in.** Pushes go to the
  "Admin Dealer Kavach" app. The list in the browser works without it.
