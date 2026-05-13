# ADR 0003 - Scheduler choice

Status: Accepted
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
- **Migration path:** When we outgrow this, swap the runner for BullMQ. The plugin contract and the `ServiceRun` model do not change; only `plugin/runner.ts` and `plugin/scheduler.ts` are replaced.
