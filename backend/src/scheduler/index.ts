import cron, { type ScheduledTask } from 'node-cron';

import { logger } from '../config/logger.js';
import { DealerServiceModel } from '../models/DealerService.js';
import { ServiceRunModel } from '../models/ServiceRun.js';
import { registry } from '../services/registry.js';
import { writeAudit } from '../utils/audit.js';
import { nextRunFor } from '../utils/cadence.js';

let task: ScheduledTask | null = null;

export async function tick(): Promise<void> {
  const now = new Date();
  logger.debug({ now: now.toISOString() }, 'scheduler tick');

  while (true) {
    const claim = await DealerServiceModel.findOneAndUpdate(
      {
        status: 'ACTIVE',
        nextRunAt: { $lte: now, $ne: null },
      },
      { $set: { nextRunAt: null } },
      { sort: { nextRunAt: 1 }, new: true },
    );
    if (!claim) break;

    const reg = registry.get(claim.serviceId);
    if (!reg) {
      logger.warn(
        { serviceId: claim.serviceId, dealerServiceId: String(claim._id) },
        'No plugin registered for service; skipping',
      );
      // Recompute next run so we don't tight-loop on the same record.
      claim.nextRunAt =
        nextRunFor(claim.cadence, now, claim.customCron ?? undefined) ?? undefined;
      await claim.save();
      continue;
    }

    const startedAt = new Date();
    const run = await ServiceRunModel.create({
      dealerId: claim.dealerId,
      serviceId: claim.serviceId,
      dealerServiceId: claim._id,
      startedAt,
      status: 'RUNNING',
    });
    logger.info(
      {
        runId: String(run._id),
        dealerServiceId: String(claim._id),
        plugin: claim.serviceId,
      },
      'plugin run start',
    );
    try {
      const result = await reg.plugin.run({
        dealerId: String(claim.dealerId),
        dealerServiceId: String(claim._id),
        config: (claim.config ?? {}) as Record<string, unknown>,
        now: startedAt,
        logger: {
          info: (...a: unknown[]) =>
            logger.info({ plugin: claim.serviceId }, ...(a as [string])),
          warn: (...a: unknown[]) =>
            logger.warn({ plugin: claim.serviceId }, ...(a as [string])),
          error: (...a: unknown[]) =>
            logger.error({ plugin: claim.serviceId }, ...(a as [string])),
        },
      });
      const finishedAt = new Date();
      run.status = 'SUCCESS';
      run.finishedAt = finishedAt;
      run.durationMs =
        result.durationMs ?? finishedAt.getTime() - startedAt.getTime();
      run.output = result.output;
      await run.save();
      logger.info(
        {
          runId: String(run._id),
          durationMs: run.durationMs,
          plugin: claim.serviceId,
        },
        'plugin run success',
      );
    } catch (err) {
      const e = err as Error;
      const finishedAt = new Date();
      run.status = 'FAILED';
      run.finishedAt = finishedAt;
      run.durationMs = finishedAt.getTime() - startedAt.getTime();
      run.error = {
        message: e.message ?? String(err),
        stack: e.stack?.split('\n').slice(0, 10).join('\n'),
      };
      await run.save();
      logger.error(
        { runId: String(run._id), err: e.message, plugin: claim.serviceId },
        'plugin run failed',
      );
    }

    // Recompute next run and persist lastRunAt.
    claim.lastRunAt = startedAt;
    claim.nextRunAt =
      nextRunFor(claim.cadence, new Date(), claim.customCron ?? undefined) ??
      undefined;
    await claim.save();

    await writeAudit({
      entity: 'DealerService',
      entityId: String(claim._id),
      actorId: 'scheduler',
      action: 'SERVICE_RUN',
      after: { runId: String(run._id), status: run.status },
    });
  }
}

export function startScheduler(): void {
  if (task) return;
  task = cron.schedule('* * * * *', () => {
    tick().catch((err) => {
      logger.error({ err: (err as Error).message }, 'scheduler tick failed');
    });
  });
  logger.info('scheduler started (every minute)');
}

export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
