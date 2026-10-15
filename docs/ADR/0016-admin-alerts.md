# ADR 0016 — Admin alerts: what needs a person, on every admin's phone

Status: accepted, 2026-10-05. The owner approved the list of alerts and chose
"everything instantly" for delivery, and asked that the same alerts be listed in
the admin app so it is clear what still needs acting on. Extended by the
WhatsApp reply alert (2026-10-10), ADR 0017 (tickets, 2026-10-12) and website
intake (2026-10-14): 18 kinds now, see §2.

## 1. What it is

The server checks every two minutes for anything that needs a person at MDG. A
new problem goes onto the **Alerts** list in the admin app and is pushed to
every active admin's phone. The list item clears itself when the problem is
fixed. A bell in the header shows how many are waiting, on every screen.

## 2. The alerts

| Alert               | Fires when                                                                                                                                                                                                                                 | Clears when                                   | Who    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------ |
| Portal login        | A run was refused by SDMS/IRAS, or no password is saved. One per outlet and portal                                                                                                                                                         | The outlet signs in again                     | Admins |
| Service failed      | A permanent failure, or a temporary one after its 2 automatic retries                                                                                                                                                                      | A run works, or the service is paused         | Admins |
| Service late        | 45 min past due and not running                                                                                                                                                                                                            | It runs                                       | Admins |
| Service stopped     | On a timer but with no next run                                                                                                                                                                                                            | It has a next run                             | Admins |
| Waiting for a reply | A dealer has had no reply for 30 min                                                                                                                                                                                                       | Someone (or the AI first line) replies        | Admins |
| Paper to review     | A dealer sent a paper we asked for                                                                                                                                                                                                         | Accepted or sent back                         | Admins |
| Paper running out   | The newest filed copy runs out by tomorrow (or ran out in the last 90 days) and no renewal is in                                                                                                                                           | A renewal is sent in or filed                 | Admins |
| Kavach proof        | Proof is waiting for verification. One per outlet, with a count                                                                                                                                                                            | Every submitted task is verified or sent back | Admins |
| Report held back    | The correctness check is withholding a report from the last 3 days (ENFORCE mode only)                                                                                                                                                     | It passes, is released, or is sent            | Admins |
| Supply blocked      | The RO supply status reads blocked. The all-clear is pushed too                                                                                                                                                                            | It is no longer blocked                       | Admins |
| Ledger charge       | A charge to the dealer, first seen in the last 14 days, that Ledger Watch can name and grades unusual or worse (NOTICE/ALERT) — interest, licence-fee recoveries. Not monthly rentals (INFO), commission (money in) or lines no rule names | It is marked as read in Ledger watch          | Admins |
| Outdated copy       | A dealer holds a report or credit card we have since corrected                                                                                                                                                                             | The corrected copy is sent                    | Admins |
| Ticket              | The AI handed a dealer's question to a person and the ticket is still open (ADR 0017). One per ticket; urgent ones say so                                                                                                                  | Someone resolves the ticket with a note       | Admins |
| WhatsApp reply      | Somebody wrote back to our WhatsApp number and nobody has read it. One per person, not per message                                                                                                                                         | The reply is marked as read                   | Super  |
| Grievance           | A grievance from the website (the form, or the site's assistant in chat or on a call) that nobody has resolved                                                                                                                             | Someone resolves it with a note               | Super  |
| New registration    | "Register your pump" was filled in and nobody has been in touch yet                                                                                                                                                                        | It is marked as contacted                     | Super  |
| Server              | The last process died without shutting down, or the server was off >10 min                                                                                                                                                                 | Marked as seen, or after a day                | Super  |
| Server start-up     | A boot step failed                                                                                                                                                                                                                         | The step succeeds on a later start            | Super  |

The two website kinds, and the WhatsApp one, are super-admin only because the
people writing in are members of the public, not outlets on an account manager's
book. Their alerts never carry a phone number, an email address or a word of
what the person wrote. A name or pump name they typed appears only if it does not read
as contact details or a link, and is cut short. Above 50 open rows of one website kind, one summary alert
replaces the per-row ones.

Since ADR 0019 (2026-10-13), "Paper to review" and "Kavach proof" link to the
inbox thread that holds the answer when the dealer answered in the chat.

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

- `mdg-backend/src/services/adminAlerts/` has six checks (`services`,
  `people`, `reports`, `tickets`, `whatsapp`, `websiteIntake`) that each return
  the problems true right now. `sweep.ts`
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

Ledger charges were first raised on Ledger Watch's `ALERT` grade, which turned
out to mean "a line no rule can name". The first production pass raised 58 of
those (about six identical lines per outlet) and buried the list, so the same
day the check moved to named charges graded `NOTICE` or worse. The 58 were
closed automatically.

## 5. What it cannot do

- **A dead box cannot report itself.** The server-down alert arrives when the
  server comes back. Hearing about it while it is still down needs an outside
  monitor that checks the API from elsewhere. That has not been set up.
- **Pushes need the admin app installed and signed in.** Pushes go to the
  "Admin Dealer Kavach" app. The list in the browser works without it.
