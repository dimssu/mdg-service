# UAT — Dealer Kavach, admin- and automation-verified (ADR 0011)

**What changed, in one line:** the dealer no longer marks anything done. An MDG admin or an
automation certifies every task, and nothing reaches the dealer until an admin switches that dealer
on.

**Who should run this:** one admin (a super-admin for §3) and one dealer login on a real phone.
**How long:** about 45 minutes.
**Before you start:** deploy, then run the migration —
`MONGODB_URI="…" npx tsx scripts/migrate-kavach-overlay.ts --dry` first, read the counts it prints,
then run it for real.

> **Expect every live dealer to read 0% immediately after the migration.** That is the intended
> outcome, not a fault: old ticks were the dealer's own word, and this model only counts what MDG has
> checked. Nothing is sent to any dealer until you turn them on in §4, so the figure stays internal
> while you work through it.

---

## 1. The dealer cannot certify anything

| #   | Do this                                      | Expect                                                                                                                          |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Log in as a dealer. Open the कवच tab.        | The page leads with **"आपसे चाहिए / We need from you"** if anything is being asked of them, then the ring.                      |
| 1.2 | Look for any control that marks a task done. | **There is none.** The only buttons are "send a photo" on an asked task, and "मैंने कर दिया / I've done this" on a pending one. |
| 1.3 | Tap "मैंने कर दिया" on a pending task.       | The card changes to a _waiting on MDG_ state. **The percentage does not move.**                                                 |
| 1.4 | Pull to refresh.                             | Still waiting. Still the same percentage. A claim is not a completion.                                                          |

**Fail if:** the score moves on 1.3, or the task shows as done.

---

## 2. Ask → send → verify, the main loop

| #   | Do this                                                                                        | Expect                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2.1 | As admin, open **Kavach → work queue**. Filter to one task (e.g. the toilet inspection sheet). | Every dealer's copy of that one task, in one list, sorted by how overdue it is.                                                |
| 2.2 | On one row, **Ask for photo**, with a short message.                                           | The row shows _asked_. On the dealer's phone the task appears at the top under "We need from you".                             |
| 2.3 | On the dealer's phone, send a photo.                                                           | Card flips to _sent, waiting on MDG_. Score still unchanged.                                                                   |
| 2.4 | Back in the admin queue, switch to **Needs review**.                                           | The row is there, with the dealer's photo big enough to actually judge.                                                        |
| 2.5 | Press **Verify** with no photo attached on a task that requires one.                           | Refused, with a plain reason — never a silent failure.                                                                         |
| 2.6 | Attach the photo (or reuse theirs), set **doneOn** to _yesterday_, add a note, save.           | Accepted. The task leaves the queue.                                                                                           |
| 2.7 | Check the dealer's phone.                                                                      | Under "Recently checked": **"MDG टीम ने जाँचा — <date>"**. Never an individual admin's name.                                   |
| 2.8 | Press **Save & next** on the following row.                                                    | The drawer stays open and moves on. This is the throughput test — verifying ten tasks should be one pass, not ten round-trips. |
| 2.9 | Send back a submission with a reason.                                                          | The dealer sees **your reason, word for word**, and can send again.                                                            |

**Fail if:** 2.5 succeeds, or 2.7 names a person.

---

## 3. Editing points for all dealers (super-admin) — requirement 4

| #   | Do this                                                                                    | Expect                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Note dealer A's and dealer B's current points total.                                       | —                                                                                                                                  |
| 3.2 | Open **Kavach defaults**. Change one task from 260 → 500 points. Read the line above Save. | It states plainly that this changes every dealer without an override, and that past records keep the points they were scored with. |
| 3.3 | Save. Re-open both dealers' Kavach tabs.                                                   | **Both totals moved by 240.** This is the whole point of the tab — under the old system it saved and moved nobody.                 |
| 3.4 | On dealer A's **work list** tab, override that task to 100 points. Save.                   | Dealer A now scores it at 100; dealer B is still at 500.                                                                           |
| 3.5 | Hide a task for dealer A.                                                                  | It disappears from their list and their denominator drops by its points.                                                           |
| 3.6 | Add a custom task for dealer A.                                                            | It appears with a `custom-…` code, and starts as **not yet checked** — never as compliant.                                         |
| 3.7 | Open an old completion record for the task you re-priced.                                  | It still shows **260**, the value it was scored with.                                                                              |
| 3.8 | Try to create a global task with a code starting `custom-`.                                | Refused.                                                                                                                           |
| 3.9 | Log in as a plain (non-super) admin and try to reach the defaults page.                    | Blocked — both the link and the URL.                                                                                               |

---

## 4. Nothing reaches a dealer until you say so

| #   | Do this                                                                               | Expect                                                                                                                       |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Pick a dealer whose switch is off. Wait past their digest hour (or trigger the pass). | **No chat message. No push.** Their standing is internal.                                                                    |
| 4.2 | Try to share the card for that day.                                                   | Refused, with a reason naming the switch.                                                                                    |
| 4.3 | Verify a few of their tasks so the figure means something.                            | Score rises.                                                                                                                 |
| 4.4 | Turn on **"Send Kavach messages to this dealer"**.                                    | Confirmation makes it feel deliberate.                                                                                       |
| 4.5 | Wait for their hour.                                                                  | **One** message: Hindi first, what we need from them at the top, the points line, and "the rest are with our team".          |
| 4.6 | Trigger the pass again the same day.                                                  | Still one message. Once per dealer per day, whatever happens.                                                                |
| 4.7 | Press **Share** on today's card.                                                      | A PNG lands in the thread: their outlet code, the number, what is pending, and when the figures were frozen.                 |
| 4.8 | Press **Share** again.                                                                | Nothing new posts. One card per day.                                                                                         |
| 4.9 | Verify another task, then look at the card already sent.                              | **It still shows the old figure.** The dealer keeps what we sent them; a card that silently re-reads itself is not a record. |

---

## 5. Automation, and the part that protects the dealer

| #   | Do this                                                                                                                | Expect                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | For a dealer with **tt-density** attached, make sure yesterday's density-register photo is marked. Run the daily pass. | "Update density book" is certified automatically.                                                                                       |
| 5.2 | Open that task's history.                                                                                              | It says **AUTOMATION**, and names what proved it — the register photo, with the date. Not a bare "auto-marked" badge.                   |
| 5.3 | Run the pass again.                                                                                                    | No second completion row.                                                                                                               |
| 5.4 | For a dealer with **no** density collection for yesterday, run the pass.                                               | The task reads **HELD — "we could not check this yet"**, counts as compliant, and is off both the dealer's pending list and your queue. |
| 5.5 | Check that dealer's score.                                                                                             | **Unchanged.** Our collection failing must never cost a dealer points.                                                                  |
| 5.6 | For a dealer WITHOUT tt-density attached, run the pass.                                                                | The task is untouched and still _not yet checked_ — never held, never failed. "Not attached" is not "not done".                         |
| 5.7 | Check "Update today's DSR".                                                                                            | Still admin-verified. Our DSR shows as supporting evidence in the drawer, but does not close it.                                        |

---

## 6. The old machinery is gone

| #   | Do this                                                                                       | Expect                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Look for Kavach escalation tickets in the Inbox.                                              | None are created any more. Existing threads are ordinary conversations.                                                                 |
| 6.2 | Resolve a chat thread that used to carry escalations.                                         | The thread closes. **No Kavach task is marked done by it**, no clock moves, and the service log records the service you actually chose. |
| 6.3 | Look for the per-item escalate arrow, the reminder ladder, "Marked done on behalf of dealer". | All gone from the UI.                                                                                                                   |
| 6.4 | Watch a dealer's phone for a day.                                                             | At most one Kavach message. No per-task nagging.                                                                                        |

---

## 7. The arithmetic that used to be wrong

| #   | Do this                                                              | Expect                                                                                                                                 |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Verify all ten daily tasks for one dealer today.                     | Their daily bucket reads 100%.                                                                                                         |
| 7.2 | Look again tomorrow morning at 08:00 IST, before verifying anything. | They are **not** all EXPIRED. One grace day covers the morning queue. Before this fix, a perfect dealer read 84% every single morning. |
| 7.3 | Leave them unverified through tomorrow evening.                      | They expire normally. The grace runs out; it does not accumulate.                                                                      |

---

## Sign-off

| Section                          | Pass / Fail | Notes |
| -------------------------------- | ----------- | ----- |
| 1 Dealer cannot certify          |             |       |
| 2 Ask → send → verify            |             |       |
| 3 Points for all dealers         |             |       |
| 4 Nothing sent until switched on |             |       |
| 5 Automation and HELD            |             |       |
| 6 Old machinery gone             |             |       |
| 7 Daily grace day                |             |       |

**Watch for, in the first week:** how many minutes a full queue pass actually takes, and whether any
dealer's `days since anyone verified` on the dashboard starts climbing. That figure is the only alarm
for the new failure mode, which is MDG's own backlog rather than the dealer's.
