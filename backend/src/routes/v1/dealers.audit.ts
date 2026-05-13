import { paginationSchema } from '@dk/shared/schemas';
import { Router } from 'express';
import { z } from 'zod';


import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { AuditLogModel } from '../../models/AuditLog.js';

import { serializeAuditLog } from './serializers.js';

const paramsSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});

export const dealersAuditRouter = Router();

dealersAuditRouter.use(requireAuth);

dealersAuditRouter.get(
  '/:id/audit',
  validate({ params: paramsSchema, query: paginationSchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof paginationSchema>;
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const filter = { entity: 'Dealer', entityId: req.params.id };
    const [items, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ at: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      AuditLogModel.countDocuments(filter),
    ]);
    res.json({
      ok: true,
      data: {
        items: items.map((a) =>
          serializeAuditLog(a as unknown as Parameters<typeof serializeAuditLog>[0]),
        ),
        total,
        page,
        pageSize,
      },
    });
  }),
);
