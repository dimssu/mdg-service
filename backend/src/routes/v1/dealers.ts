import {
  dealerCreateSchema,
  dealerListQuerySchema,
  dealerUpdateSchema,
} from '@dk/shared/schemas';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { DealerModel } from '../../models/Dealer.js';
import { DealerServiceModel } from '../../models/DealerService.js';
import { seedOnboardingSteps } from '../../services/dealerService.js';
import { AppError } from '../../utils/AppError.js';
import { writeAudit } from '../../utils/audit.js';
import { parseSort } from '../../utils/pagination.js';

import { serializeDealer } from './serializers.js';

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});

export const dealersRouter = Router();

dealersRouter.use(requireAuth);

dealersRouter.get(
  '/',
  validate({ query: dealerListQuerySchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof dealerListQuerySchema>;
    const filter: Record<string, unknown> = {};
    if (q.status) filter.status = q.status;
    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search), 'i');
      filter.$or = [
        { name: rx },
        { phone: rx },
        { code: rx },
        { gst: rx },
        { pan: rx },
        { 'ownerContact.name': rx },
        { 'ownerContact.email': rx },
        { 'ownerContact.phone': rx },
      ];
    }
    const sort = parseSort(q.sort);
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const [items, total] = await Promise.all([
      DealerModel.find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      DealerModel.countDocuments(filter),
    ]);
    res.json({
      ok: true,
      data: {
        items: items.map((d) =>
          serializeDealer(d as unknown as Parameters<typeof serializeDealer>[0]),
        ),
        total,
        page,
        pageSize,
      },
    });
  }),
);

dealersRouter.post(
  '/',
  validate({ body: dealerCreateSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const body = req.body as z.infer<typeof dealerCreateSchema>;
    const onboarding = seedOnboardingSteps();
    // The phone collected at creation = step 1 already complete.
    const firstStep = onboarding.steps[0]!;
    let created;
    try {
      created = await DealerModel.create({
        phone: body.phone,
        name: body.name,
        onboardingDate: new Date(),
        status: 'ONBOARDING',
        onboarding: {
          currentStepId: onboarding.steps[1]?.id ?? null,
          completedStepCount: 1,
          steps: onboarding.steps.map((s, i) =>
            i === 0
              ? {
                  ...s,
                  status: 'DONE' as const,
                  completedAt: new Date(),
                  completedBy: req.admin!.id,
                  data: { phone: body.phone, name: body.name } as Record<string, unknown>,
                }
              : s,
          ),
        },
        audit: [
          {
            at: new Date(),
            actorId: req.admin.id,
            action: 'CREATE',
          },
          {
            at: new Date(),
            actorId: req.admin.id,
            action: 'STEP_COMPLETE',
            note: firstStep.id,
          },
        ],
      });
    } catch (err) {
      handlePossibleDup(err);
      throw err;
    }
    await writeAudit({
      entity: 'Dealer',
      entityId: String(created._id),
      actorId: req.admin.id,
      action: 'CREATE',
      after: serializeDealer(
        created.toObject() as unknown as Parameters<typeof serializeDealer>[0],
      ),
    });
    res.status(201).json({
      ok: true,
      data: serializeDealer(
        created.toObject() as unknown as Parameters<typeof serializeDealer>[0],
      ),
    });
  }),
);

dealersRouter.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const dealer = await DealerModel.findById(req.params.id).lean();
    if (!dealer) throw AppError.notFound('Dealer not found');
    res.json({
      ok: true,
      data: serializeDealer(
        dealer as unknown as Parameters<typeof serializeDealer>[0],
      ),
    });
  }),
);

dealersRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: dealerUpdateSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const body = req.body as z.infer<typeof dealerUpdateSchema>;
    const dealer = await DealerModel.findById(req.params.id);
    if (!dealer) throw AppError.notFound('Dealer not found');
    const before = serializeDealer(
      dealer.toObject() as unknown as Parameters<typeof serializeDealer>[0],
    );

    if (body.name !== undefined) dealer.name = body.name;
    if (body.phone !== undefined) dealer.phone = body.phone;
    if (body.ownerContact) {
      const existing = dealer.ownerContact ?? { name: '', phone: '', email: '' };
      dealer.ownerContact = {
        name: body.ownerContact.name ?? existing.name,
        phone: body.ownerContact.phone ?? existing.phone,
        email: body.ownerContact.email ?? existing.email,
      } as typeof dealer.ownerContact;
    }
    if (body.pumpLocation) {
      const existing =
        dealer.pumpLocation ?? { address: '', lat: 0, lng: 0 };
      dealer.pumpLocation = {
        ...existing,
        ...body.pumpLocation,
      } as typeof dealer.pumpLocation;
    }
    if (body.gst !== undefined) dealer.gst = body.gst;
    if (body.pan !== undefined) dealer.pan = body.pan;
    if (body.bankDetails !== undefined) {
      (dealer as unknown as { bankDetails: unknown }).bankDetails = body.bankDetails;
    }
    if (body.complianceDocs !== undefined) {
      (dealer as unknown as { complianceDocs: unknown }).complianceDocs =
        body.complianceDocs;
    }
    if (body.slaTier !== undefined) dealer.slaTier = body.slaTier;
    if (body.status !== undefined) dealer.status = body.status;

    dealer.audit.push({
      at: new Date(),
      actorId: req.admin.id,
      action: 'UPDATE',
    } as (typeof dealer.audit)[number]);

    try {
      await dealer.save();
    } catch (err) {
      handlePossibleDup(err);
      throw err;
    }
    const after = serializeDealer(
      dealer.toObject() as unknown as Parameters<typeof serializeDealer>[0],
    );
    await writeAudit({
      entity: 'Dealer',
      entityId: String(dealer._id),
      actorId: req.admin.id,
      action: before.status !== after.status ? 'STATUS_CHANGE' : 'UPDATE',
      before,
      after,
    });
    res.json({ ok: true, data: after });
  }),
);

dealersRouter.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const dealer = await DealerModel.findById(req.params.id);
    if (!dealer) throw AppError.notFound('Dealer not found');
    const before = serializeDealer(
      dealer.toObject() as unknown as Parameters<typeof serializeDealer>[0],
    );
    await DealerServiceModel.deleteMany({ dealerId: dealer._id });
    await dealer.deleteOne();
    await writeAudit({
      entity: 'Dealer',
      entityId: String(dealer._id),
      actorId: req.admin.id,
      action: 'DELETE',
      before,
    });
    res.json({ ok: true, data: { id: String(dealer._id) } });
  }),
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function handlePossibleDup(err: unknown): void {
  const e = err as { code?: number; keyValue?: Record<string, unknown> };
  if (e && e.code === 11000) {
    throw AppError.conflict('Duplicate key', e.keyValue);
  }
}
