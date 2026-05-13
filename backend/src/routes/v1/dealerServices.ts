import {
  attachServiceSchema,
  runNowSchema,
  updateDealerServiceSchema,
} from '@dk/shared/schemas';
import { Router } from 'express';
import { z } from 'zod';


import { logger } from '../../config/logger.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { DealerModel } from '../../models/Dealer.js';
import { DealerServiceModel } from '../../models/DealerService.js';
import { ServiceRunModel } from '../../models/ServiceRun.js';
import { registry } from '../../services/registry.js';
import { AppError } from '../../utils/AppError.js';
import { writeAudit } from '../../utils/audit.js';
import { cronForCadence, nextRunFor } from '../../utils/cadence.js';

import { serializeDealerService } from './serializers.js';

const dealerIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});
const dsIdParamSchema = z.object({
  dsId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});

/**
 * Routes nested under /dealers/:id/services.
 */
export const dealerNestedServicesRouter = Router({ mergeParams: true });
dealerNestedServicesRouter.use(requireAuth);

dealerNestedServicesRouter.get(
  '/',
  validate({ params: dealerIdParamSchema }),
  asyncHandler(async (req, res) => {
    const items = await DealerServiceModel.find({ dealerId: req.params.id }).lean();
    res.json({
      ok: true,
      data: items.map((d) =>
        serializeDealerService(
          d as unknown as Parameters<typeof serializeDealerService>[0],
        ),
      ),
    });
  }),
);

dealerNestedServicesRouter.post(
  '/',
  validate({ params: dealerIdParamSchema, body: attachServiceSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const body = req.body as z.infer<typeof attachServiceSchema>;
    const dealer = await DealerModel.findById(req.params.id).lean();
    if (!dealer) throw AppError.notFound('Dealer not found');
    const reg = registry.getOrThrow(body.serviceId);
    if (!reg.validateConfig(body.config)) {
      throw AppError.pluginConfigInvalid(reg.validateConfig.errors ?? undefined);
    }
    const cadence = body.cadence ?? reg.plugin.cadence;
    const customCron = body.customCron;
    const now = new Date();
    const nextRunAt = nextRunFor(cadence, now, customCron) ?? undefined;
    try {
      const created = await DealerServiceModel.create({
        dealerId: dealer._id,
        serviceId: body.serviceId,
        config: body.config,
        cadence,
        schedule: cronForCadence(cadence, customCron),
        customCron,
        status: 'ACTIVE',
        nextRunAt,
      });
      const after = serializeDealerService(
        created.toObject() as unknown as Parameters<typeof serializeDealerService>[0],
      );
      await writeAudit({
        entity: 'DealerService',
        entityId: String(created._id),
        actorId: req.admin.id,
        action: 'SERVICE_ATTACH',
        after,
      });
      res.status(201).json({ ok: true, data: after });
    } catch (err) {
      const e = err as { code?: number };
      if (e && e.code === 11000) {
        throw AppError.conflict('Service already attached to dealer');
      }
      throw err;
    }
  }),
);

/**
 * Flat routes that operate on a DealerService by its id.
 */
export const dealerServicesRouter = Router();
dealerServicesRouter.use(requireAuth);

dealerServicesRouter.patch(
  '/:dsId',
  validate({ params: dsIdParamSchema, body: updateDealerServiceSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const body = req.body as z.infer<typeof updateDealerServiceSchema>;
    const ds = await DealerServiceModel.findById(req.params.dsId);
    if (!ds) throw AppError.notFound('Dealer service not found');
    const before = serializeDealerService(
      ds.toObject() as unknown as Parameters<typeof serializeDealerService>[0],
    );

    if (body.config !== undefined) {
      registry.validateConfig(ds.serviceId, body.config);
      ds.config = body.config;
    }
    let scheduleNeedsRecompute = false;
    if (body.cadence !== undefined) {
      ds.cadence = body.cadence;
      scheduleNeedsRecompute = true;
    }
    if (body.customCron !== undefined) {
      ds.customCron = body.customCron;
      scheduleNeedsRecompute = true;
    }
    if (scheduleNeedsRecompute) {
      ds.schedule = cronForCadence(ds.cadence, ds.customCron ?? undefined);
      const next = nextRunFor(ds.cadence, new Date(), ds.customCron ?? undefined);
      ds.nextRunAt = next ?? undefined;
    }
    if (body.status !== undefined) {
      const previousStatus = ds.status;
      ds.status = body.status;
      if (body.status === 'PAUSED') {
        ds.nextRunAt = undefined;
      } else if (body.status === 'ACTIVE' && previousStatus !== 'ACTIVE') {
        const next = nextRunFor(ds.cadence, new Date(), ds.customCron ?? undefined);
        ds.nextRunAt = next ?? undefined;
      }
    }
    await ds.save();
    const after = serializeDealerService(
      ds.toObject() as unknown as Parameters<typeof serializeDealerService>[0],
    );
    await writeAudit({
      entity: 'DealerService',
      entityId: String(ds._id),
      actorId: req.admin.id,
      action: 'UPDATE',
      before,
      after,
    });
    res.json({ ok: true, data: after });
  }),
);

dealerServicesRouter.delete(
  '/:dsId',
  validate({ params: dsIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const ds = await DealerServiceModel.findById(req.params.dsId);
    if (!ds) throw AppError.notFound('Dealer service not found');
    const before = serializeDealerService(
      ds.toObject() as unknown as Parameters<typeof serializeDealerService>[0],
    );
    await ds.deleteOne();
    await writeAudit({
      entity: 'DealerService',
      entityId: String(ds._id),
      actorId: req.admin.id,
      action: 'SERVICE_DETACH',
      before,
    });
    res.json({ ok: true, data: { id: String(ds._id) } });
  }),
);

dealerServicesRouter.post(
  '/:dsId/run-now',
  validate({ params: dsIdParamSchema, body: runNowSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const body = req.body as z.infer<typeof runNowSchema>;
    const ds = await DealerServiceModel.findById(req.params.dsId);
    if (!ds) throw AppError.notFound('Dealer service not found');
    const reg = registry.getOrThrow(ds.serviceId);

    const startedAt = new Date();
    const run = await ServiceRunModel.create({
      dealerId: ds.dealerId,
      serviceId: ds.serviceId,
      dealerServiceId: ds._id,
      startedAt,
      status: 'RUNNING',
    });

    const config = {
      ...((ds.config ?? {}) as Record<string, unknown>),
      ...(body.configOverride ?? {}),
    };

    try {
      const result = await reg.plugin.run({
        dealerId: String(ds.dealerId),
        dealerServiceId: String(ds._id),
        config,
        now: startedAt,
        logger: {
          info: (...a: unknown[]) => logger.info({ plugin: ds.serviceId }, ...(a as [string])),
          warn: (...a: unknown[]) => logger.warn({ plugin: ds.serviceId }, ...(a as [string])),
          error: (...a: unknown[]) => logger.error({ plugin: ds.serviceId }, ...(a as [string])),
        },
      });
      const finishedAt = new Date();
      run.status = 'SUCCESS';
      run.finishedAt = finishedAt;
      run.durationMs = result.durationMs ?? finishedAt.getTime() - startedAt.getTime();
      run.output = result.output;
      await run.save();
      ds.lastRunAt = finishedAt;
      await ds.save();
    } catch (err) {
      const finishedAt = new Date();
      run.status = 'FAILED';
      run.finishedAt = finishedAt;
      run.durationMs = finishedAt.getTime() - startedAt.getTime();
      const e = err as Error;
      run.error = {
        message: e.message ?? String(err),
        stack: e.stack?.split('\n').slice(0, 10).join('\n'),
      };
      await run.save();
    }

    await writeAudit({
      entity: 'DealerService',
      entityId: String(ds._id),
      actorId: req.admin.id,
      action: 'SERVICE_RUN',
      after: { runId: String(run._id), status: run.status },
    });

    res.status(202).json({ ok: true, data: { runId: String(run._id) } });
  }),
);
