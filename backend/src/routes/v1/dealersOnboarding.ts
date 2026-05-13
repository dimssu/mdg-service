import { ONBOARDING_STEP_IDS, type OnboardingStepId } from '@dk/shared';
import { STEP_PAYLOAD_SCHEMAS, stepReopenSchema } from '@dk/shared/schemas';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { DealerModel } from '../../models/Dealer.js';
import {
  applyStepCompletion,
  applyStepReopen,
} from '../../services/dealerService.js';
import { AppError } from '../../utils/AppError.js';
import { writeAudit } from '../../utils/audit.js';
import { nextDealerCode } from '../../utils/codeGenerator.js';

import { serializeDealer } from './serializers.js';

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});
const stepParamSchema = idParamSchema.extend({
  stepId: z.enum(ONBOARDING_STEP_IDS),
});

export const dealersOnboardingRouter = Router({ mergeParams: true });

dealersOnboardingRouter.use(requireAuth);

dealersOnboardingRouter.get(
  '/dealers/:id/onboarding',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const dealer = await DealerModel.findById(req.params.id).lean();
    if (!dealer) throw AppError.notFound('Dealer not found');
    const serialized = serializeDealer(
      dealer as unknown as Parameters<typeof serializeDealer>[0],
    );
    res.json({ ok: true, data: serialized.onboarding });
  }),
);

dealersOnboardingRouter.get(
  '/dealers/:id/onboarding/next-code',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const dealer = await DealerModel.findById(req.params.id).lean();
    if (!dealer) throw AppError.notFound('Dealer not found');
    const suggestion = await nextDealerCode();
    res.json({ ok: true, data: { suggestion } });
  }),
);

dealersOnboardingRouter.post(
  '/dealers/:id/onboarding/steps/:stepId/complete',
  validate({ params: stepParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const { id, stepId } = req.params as unknown as {
      id: string;
      stepId: OnboardingStepId;
    };
    const schema = STEP_PAYLOAD_SCHEMAS[stepId];
    const payload = schema.parse(req.body);

    let attempt = 0;
    const maxAttempts = stepId === 'assign-code' ? 3 : 1;
    let lastErr: unknown;
    while (attempt < maxAttempts) {
      const dealer = await DealerModel.findById(id);
      if (!dealer) throw AppError.notFound('Dealer not found');
      const before = serializeDealer(
        dealer.toObject() as unknown as Parameters<typeof serializeDealer>[0],
      );
      const result = await applyStepCompletion(dealer, stepId, payload, req.admin.id);
      try {
        await dealer.save();
      } catch (err) {
        const e = err as { code?: number };
        if (e?.code === 11000 && stepId === 'assign-code') {
          attempt += 1;
          lastErr = err;
          const fresh = await nextDealerCode();
          // Override the suggestion the admin picked with a fresh one.
          (payload as { code: string }).code = fresh;
          continue;
        }
        if (e?.code === 11000) {
          throw AppError.conflict('Duplicate key', (err as { keyValue?: unknown }).keyValue);
        }
        throw err;
      }
      const after = serializeDealer(
        dealer.toObject() as unknown as Parameters<typeof serializeDealer>[0],
      );
      await writeAudit({
        entity: 'Dealer',
        entityId: String(dealer._id),
        actorId: req.admin.id,
        action: 'STEP_COMPLETE',
        before,
        after: { stepId, statusFlippedToActive: result.statusFlippedToActive },
      });
      if (result.statusFlippedToActive) {
        await writeAudit({
          entity: 'Dealer',
          entityId: String(dealer._id),
          actorId: req.admin.id,
          action: 'STATUS_CHANGE',
          before: { status: before.status },
          after: { status: 'ACTIVE' },
        });
      }
      res.json({ ok: true, data: after });
      return;
    }
    throw AppError.conflict(
      `Could not allocate a unique dealer code after ${maxAttempts} attempts`,
      { lastError: String(lastErr) },
    );
  }),
);

dealersOnboardingRouter.post(
  '/dealers/:id/onboarding/steps/:stepId/reopen',
  validate({ params: stepParamSchema, body: stepReopenSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const { id, stepId } = req.params as unknown as {
      id: string;
      stepId: OnboardingStepId;
    };
    const body = req.body as z.infer<typeof stepReopenSchema>;
    const dealer = await DealerModel.findById(id);
    if (!dealer) throw AppError.notFound('Dealer not found');
    const before = serializeDealer(
      dealer.toObject() as unknown as Parameters<typeof serializeDealer>[0],
    );
    const result = applyStepReopen(dealer, stepId, body, req.admin.id);
    await dealer.save();
    const after = serializeDealer(
      dealer.toObject() as unknown as Parameters<typeof serializeDealer>[0],
    );
    await writeAudit({
      entity: 'Dealer',
      entityId: String(dealer._id),
      actorId: req.admin.id,
      action: body.force ? 'STEP_REOPEN_FORCED' : 'STEP_REOPEN',
      before: { stepId, status: before.status, wasActive: result.wasActive },
      after: { stepId, status: after.status },
    });
    res.json({ ok: true, data: after });
  }),
);
