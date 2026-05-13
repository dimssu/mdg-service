import { runsListQuerySchema } from '@dk/shared/schemas';
import { Router } from 'express';
import { z } from 'zod';


import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ServiceRunModel } from '../../models/ServiceRun.js';
import { AppError } from '../../utils/AppError.js';

import { serializeServiceRun } from './serializers.js';

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});

export const runsRouter = Router();

runsRouter.use(requireAuth);

runsRouter.get(
  '/',
  validate({ query: runsListQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof runsListQuerySchema>;
    const filter: Record<string, unknown> = {};
    if (q.dealerId) filter.dealerId = q.dealerId;
    if (q.serviceId) filter.serviceId = q.serviceId;
    if (q.status) filter.status = q.status;
    if (q.from || q.to) {
      const r: Record<string, Date> = {};
      if (q.from) r.$gte = new Date(q.from);
      if (q.to) r.$lte = new Date(q.to);
      filter.startedAt = r;
    }
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const [items, total] = await Promise.all([
      ServiceRunModel.find(filter)
        .sort({ startedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ServiceRunModel.countDocuments(filter),
    ]);
    res.json({
      ok: true,
      data: {
        items: items.map((r) =>
          serializeServiceRun(
            r as unknown as Parameters<typeof serializeServiceRun>[0],
          ),
        ),
        total,
        page,
        pageSize,
      },
    });
  }),
);

runsRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const run = await ServiceRunModel.findById(req.params.id).lean();
    if (!run) throw AppError.notFound('Run not found');
    res.json({
      ok: true,
      data: serializeServiceRun(
        run as unknown as Parameters<typeof serializeServiceRun>[0],
      ),
    });
  }),
);
