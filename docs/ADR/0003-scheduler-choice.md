# ADR 0003 - Scheduler choice

Status: Accepted. Files, queue and job list updated 2026-10-15 (see "Update" at the end).
Date: 2026-05-13

## Context

We need to run dealer-service workflows on a recurring cadence (daily/weekly/monthly/yearly) and on-demand. At MVP scale we expect <1000 dealers and a handful of services per dealer - well within a single node's capacity.

Options considered:

1. **External cron + HTTP triggers.** Simple, but adds an extra moving part and a deploy story for crontab.
2. **BullMQ + Redis.** Battle-tested, durable, supports retries and rate limits. Adds Redis.
3. **Agenda / Bree / node-cron.** In-process schedulers. Agenda persists in Mongo, Bree uses worker threads, node-cron is the lightest.
4. **MongoDB change-streams + a polling loop.** Built only on Mongo.

## Decision

Use **in-process `node-cron`** running a single tick every minute. The tick queries Mongo for `DealerService` records where `status='ACTIVE'` and `nextRunAt <= now`, atomically advances `nextRunAt` for each due record, and enqueues a runner job. A small in-process queue with bounded concurrency executes the `plugin.run` calls with a per-run timeout.

`nextRunAt` is computed from the cron expression derived from `cadence` (or `customCron` if set) using `cron-parser`.

## Consequences

- **Pro:** One Node process, one Mongo - no Redis, no external cron, no extra deploy targets.
- **Pro:** Survives restarts: due work is recomputed from `nextRunAt` on the next tick.
- **Pro:** The tick is observable in Pino logs; failures persist as `ServiceRun` records with `status='FAILED'`.
- **Con:** Single-instance only. Running two backends will double-fire unless we add a distributed lock. The atomic `nextRunAt` advance gives us most of the way there, but we are explicit that MVP runs one instance.
- **Con:** Long-running plugins compete for the event loop. We mitigate with the bounded queue and a per-run timeout, and call out plugin authors should keep `run` work bounded.
- **Migration path:** When we outgrow this, swap the runner for BullMQ. The plugin contract and the `ServiceRun` model do not change; only `plugin/runner.ts` and `plugin/scheduler.ts` (today `mdg-backend/src/lib/runs/executeRun.ts` and `mdg-backend/src/scheduler/index.ts`) are replaced.

## Update — 2026-10-15

The decision holds: `node-cron`, one process, no Redis. What changed:

- **Runs are one after another, not a bounded queue.** A tick (`mdg-backend/src/scheduler/index.ts`)
  takes the due services in turn and awaits each. A tick that is still running makes the next
  minute's tick skip, unless it has outlasted the lease.
- **Each service is claimed with a database lease** on its `DealerService` row, so a second claimer
  is refused. The lease is twice the 7-minute run cap (`SDMS_RUN_TIMEOUT_MS`, 420,000 ms) plus 15
  minutes, which is 29 minutes. A crashed process costs a dealer one cycle, not the whole cadence.
- **One Chromium at a time, process-wide.** `BROWSER_MAX_CONCURRENCY` defaults to 1 and covers portal
  runs, IRAS collection and report-card renders. The older `SDMS_MAX_CONCURRENCY` is retired and only
  logs a warning.
- **A refused or missing portal password holds the outlet.** The scheduler does not run it and looks
  again every 15 minutes (`CREDENTIAL_HOLD_RECHECK_MS`).
- **The same process runs six other timed jobs** (times are IST, the cron defaults in `config/env.ts`):

  | Job                                                                                         | When            |
  | ------------------------------------------------------------------------------------------- | --------------- |
  | Kavach status refresh (document-ask expiry and paper-validity reminders ride the same pass) | daily, 00:20    |
  | Kavach digest pass                                                                          | hourly          |
  | Density register ask in the chat (ADR 0019)                                                 | daily, 09:00    |
  | Reply-time sweep for assigned tickets                                                       | every minute    |
  | Assistant housekeeping (ADR 0009): close abandoned conversations, delete old call audio     | every 5 minutes |
  | Admin alert sweep (ADR 0016)                                                                | every 2 minutes |

- **Single instance is enforced by pm2.** `ecosystem.config.cjs` sets `instances: 1` in `fork` mode.
  Two backends would run two schedulers against the same portal accounts. The box is now a t3.small
  (1,905 MB RAM, 2 GB swap).
