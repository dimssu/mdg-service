import { Router } from 'express';

import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { registry } from '../../services/registry.js';

export const servicesRouter = Router();

servicesRouter.use(requireAuth);

servicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, data: registry.list() });
  }),
);
