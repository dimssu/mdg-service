import { Router } from 'express';

import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { DealerModel } from '../../models/Dealer.js';
import { DealerServiceModel } from '../../models/DealerService.js';
import { ServiceRunModel } from '../../models/ServiceRun.js';
import { registry } from '../../services/registry.js';

import { serializeServiceRun } from './serializers.js';

interface OverviewCache {
  expiresAt: number;
  data: unknown;
}
let cache: OverviewCache | null = null;
const TTL_MS = 30_000;

export const overviewRouter = Router();

overviewRouter.use(requireAuth);

overviewRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    if (cache && cache.expiresAt > Date.now()) {
      res.json({ ok: true, data: cache.data });
      return;
    }
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      dealerTotal,
      onboarding,
      active,
      suspended,
      attached,
      activeServices,
      runsLast24h,
      failedLast24h,
      successfulLast24h,
      durationAgg,
      recentRunsRaw,
    ] = await Promise.all([
      DealerModel.countDocuments({}),
      DealerModel.countDocuments({ status: 'ONBOARDING' }),
      DealerModel.countDocuments({ status: 'ACTIVE' }),
      DealerModel.countDocuments({ status: 'SUSPENDED' }),
      DealerServiceModel.countDocuments({}),
      DealerServiceModel.countDocuments({ status: 'ACTIVE' }),
      ServiceRunModel.countDocuments({ startedAt: { $gte: dayAgo } }),
      ServiceRunModel.countDocuments({
        startedAt: { $gte: dayAgo },
        status: 'FAILED',
      }),
      ServiceRunModel.countDocuments({
        startedAt: { $gte: dayAgo },
        status: 'SUCCESS',
      }),
      ServiceRunModel.aggregate([
        { $match: { startedAt: { $gte: dayAgo }, durationMs: { $type: 'number' } } },
        { $group: { _id: null, avg: { $avg: '$durationMs' } } },
      ]),
      ServiceRunModel.find({}).sort({ startedAt: -1 }).limit(10).lean(),
    ]);

    const successRate24h =
      runsLast24h > 0 ? successfulLast24h / runsLast24h : 0;
    const avgDurationMs24h =
      Array.isArray(durationAgg) && durationAgg.length > 0
        ? Math.round(((durationAgg[0] as { avg?: number }).avg ?? 0))
        : 0;

    const data = {
      dealers: {
        total: dealerTotal,
        byStatus: {
          ONBOARDING: onboarding,
          ACTIVE: active,
          SUSPENDED: suspended,
        },
      },
      services: {
        pluginCount: registry.size(),
        attached,
        active: activeServices,
      },
      runs: {
        last24h: runsLast24h,
        successRate24h,
        failedLast24h,
        avgDurationMs24h,
      },
      recentRuns: recentRunsRaw.map((r) =>
        serializeServiceRun(
          r as unknown as Parameters<typeof serializeServiceRun>[0],
        ),
      ),
    };
    cache = { expiresAt: Date.now() + TTL_MS, data };
    res.json({ ok: true, data });
  }),
);
