/* eslint-disable no-console */
import { ONBOARDING_STEP_IDS, type OnboardingStepId } from '@dk/shared';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb, disconnectDb } from './db/connect.js';
import {
  AdminModel,
  AuditLogModel,
  DealerModel,
  DealerServiceModel,
  ServiceRunModel,
} from './models/index.js';
import { initRegistry, registry } from './services/registry.js';
import { cronForCadence, nextRunFor } from './utils/cadence.js';
import { hashPassword } from './utils/password.js';

const SEED_ADMIN = {
  email: 'admin@dealerkavach.local',
  name: 'Default Admin',
  password: 'Admin@12345',
};

function isoDays(daysFromNow: number): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

/**
 * Build an onboarding sub-doc with the first N steps marked DONE. `data` is
 * a minimal record of what would have been captured at each step.
 */
function buildOnboarding(
  stepsCompleted: number,
  artifacts: {
    phone: string;
    name?: string;
    gst?: string;
    paymentNote?: string;
    code?: string;
    adminGroupName?: string;
    portalUsername?: string;
    dealerGroupName?: string;
  },
): {
  currentStepId: OnboardingStepId | null;
  completedStepCount: number;
  steps: Array<{
    id: OnboardingStepId;
    status: 'PENDING' | 'DONE';
    completedAt?: Date;
    completedBy?: string;
    data?: Record<string, unknown>;
  }>;
} {
  const stepDataAt: Partial<Record<OnboardingStepId, Record<string, unknown>>> = {
    'collect-phone': { phone: artifacts.phone, name: artifacts.name },
    'send-welcome': { sentAt: new Date().toISOString() },
    'send-terms-link': { sentAt: new Date().toISOString() },
    'send-pdf': { sentAt: new Date().toISOString() },
    'receive-payment-and-gst': artifacts.gst
      ? { gst: artifacts.gst, paymentNote: artifacts.paymentNote }
      : undefined,
    'assign-code': artifacts.code ? { code: artifacts.code } : undefined,
    'create-admin-group': artifacts.adminGroupName
      ? { groupName: artifacts.adminGroupName, username: artifacts.portalUsername }
      : undefined,
    'create-dealer-group': artifacts.dealerGroupName
      ? { groupName: artifacts.dealerGroupName }
      : undefined,
  };
  const steps = ONBOARDING_STEP_IDS.map((id, idx) => {
    const done = idx < stepsCompleted;
    return {
      id,
      status: done ? ('DONE' as const) : ('PENDING' as const),
      completedAt: done ? new Date() : undefined,
      completedBy: done ? 'seed' : undefined,
      data: done ? stepDataAt[id] : undefined,
    };
  });
  const currentStepId =
    stepsCompleted >= ONBOARDING_STEP_IDS.length
      ? null
      : (ONBOARDING_STEP_IDS[stepsCompleted] ?? null);
  return { currentStepId, completedStepCount: stepsCompleted, steps };
}

async function seed({ reset }: { reset: boolean }): Promise<void> {
  await connectDb(env.MONGODB_URI);
  await initRegistry();

  if (reset) {
    logger.warn('Dropping seeded collections');
    await Promise.all([
      AdminModel.deleteMany({}),
      DealerModel.deleteMany({}),
      DealerServiceModel.deleteMany({}),
      ServiceRunModel.deleteMany({}),
      AuditLogModel.deleteMany({}),
    ]);
    // Drop any legacy indexes (e.g. non-sparse unique on gst from before the
    // onboarding redesign) and rebuild from the current Mongoose schema.
    await DealerModel.syncIndexes();
  }

  // Admin (idempotent)
  const existingAdmin = await AdminModel.findOne({ email: SEED_ADMIN.email });
  if (!existingAdmin) {
    const passwordHash = await hashPassword(SEED_ADMIN.password);
    await AdminModel.create({
      email: SEED_ADMIN.email,
      name: SEED_ADMIN.name,
      passwordHash,
      roles: ['admin'],
    });
    logger.info({ email: SEED_ADMIN.email }, 'Seeded admin');
  } else {
    logger.info('Admin already exists; skipping');
  }

  const dealerSpecs = [
    // One dealer at step 2 (welcome sent, T&C pending)
    {
      name: 'Sunrise Petroleum',
      phone: '+919000000001',
      stepsCompleted: 2,
      status: 'ONBOARDING' as const,
      code: undefined,
    },
    // One dealer at step 4 (PDF sent, awaiting payment + GST)
    {
      name: 'Highway Fuels',
      phone: '+919000000002',
      stepsCompleted: 4,
      status: 'ONBOARDING' as const,
      code: undefined,
    },
    // One dealer at step 6 (code assigned, awaiting groups)
    {
      name: 'Coastal Energy',
      phone: '+919000000003',
      stepsCompleted: 6,
      status: 'ONBOARDING' as const,
      code: 'E01',
      gst: '29ABCDE1236F1Z7',
    },
    // Two ACTIVE dealers (all 8 steps done)
    {
      name: 'Northern Lights Petrol',
      phone: '+919000000004',
      stepsCompleted: 8,
      status: 'ACTIVE' as const,
      code: 'E02',
      gst: '24ABCDE1237F1Z8',
    },
    {
      name: 'Riverside Refuel',
      phone: '+919000000005',
      stepsCompleted: 8,
      status: 'ACTIVE' as const,
      code: 'E03',
      gst: '06ABCDE1238F1Z9',
    },
  ];

  const activeDealerIds: string[] = [];
  for (const spec of dealerSpecs) {
    const exists = await DealerModel.findOne({ phone: spec.phone });
    if (exists) {
      if (spec.status === 'ACTIVE') activeDealerIds.push(String(exists._id));
      continue;
    }
    const onboarding = buildOnboarding(spec.stepsCompleted, {
      phone: spec.phone,
      name: spec.name,
      gst: spec.gst,
      paymentNote: spec.stepsCompleted >= 5 ? 'UPI ref 12345' : undefined,
      code: spec.code,
      adminGroupName: spec.code && spec.stepsCompleted >= 7 ? `${spec.code}01` : undefined,
      portalUsername:
        spec.code && spec.stepsCompleted >= 7 ? `${spec.code.toLowerCase()}-admin` : undefined,
      dealerGroupName: spec.code && spec.stepsCompleted >= 8 ? `${spec.code}02` : undefined,
    });

    const portalCredentials =
      spec.code && spec.stepsCompleted >= 7
        ? {
            username: `${spec.code.toLowerCase()}-admin`,
            passwordHash: await hashPassword('ChangeMe@123'),
            setAt: new Date(),
            issuedBy: 'seed',
            mustChangeOnFirstLogin: true,
          }
        : undefined;

    const whatsappGroups =
      spec.code && spec.stepsCompleted >= 7
        ? {
            adminGroupName: `${spec.code}01`,
            adminGroupCreatedAt: new Date(),
            ...(spec.stepsCompleted >= 8
              ? {
                  dealerGroupName: `${spec.code}02`,
                  dealerGroupCreatedAt: new Date(),
                }
              : {}),
          }
        : undefined;

    const doc = await DealerModel.create({
      name: spec.name,
      phone: spec.phone,
      code: spec.code,
      gst: spec.gst,
      status: spec.status,
      onboardingDate: new Date(),
      paymentNote: spec.stepsCompleted >= 5 ? 'UPI ref 12345' : undefined,
      paymentReceivedAt: spec.stepsCompleted >= 5 ? new Date() : undefined,
      portalCredentials,
      whatsappGroups,
      onboarding,
      audit: [{ at: new Date(), actorId: 'seed', action: 'CREATE' }],
    });
    if (spec.status === 'ACTIVE') activeDealerIds.push(String(doc._id));
  }

  // Attach services for active dealers (unchanged from before).
  const allPlugins = registry.list();
  const ATTACH_PLAN: Array<{
    serviceId: string;
    config: Record<string, unknown>;
  }>[] = [
    [
      {
        serviceId: 'daily-stock-check',
        config: { warehouseId: 'WH-BLR-01', threshold: 120 },
      },
      {
        serviceId: 'weekly-compliance-report',
        config: { region: 'KA', includeDocs: true },
      },
      {
        serviceId: 'custom-request',
        config: { requestType: 'manual-audit', payload: { ticketId: 'T-1001' } },
      },
    ],
    [
      {
        serviceId: 'monthly-invoice-generation',
        config: { currency: 'INR', taxPercent: 18 },
      },
      {
        serviceId: 'annual-license-renewal-reminder',
        config: { licenseNumber: 'KA-FUEL-2025-0042', daysBefore: 45 },
      },
      {
        serviceId: 'daily-stock-check',
        config: { warehouseId: 'WH-MAA-02', threshold: 75 },
      },
    ],
  ];

  const plugins = allPlugins.filter((p) => p.id !== '_example');
  if (plugins.length === 0) {
    logger.warn('No plugins registered; skipping attach + run seeding');
  } else {
    for (const [dealerIdx, dealerId] of activeDealerIds.entries()) {
      const plan = ATTACH_PLAN[dealerIdx % ATTACH_PLAN.length] ?? [];
      for (const [i, attach] of plan.entries()) {
        const plugin = plugins.find((p) => p.id === attach.serviceId);
        if (!plugin) continue;
        const cadence = plugin.cadence;
        const existing = await DealerServiceModel.findOne({
          dealerId,
          serviceId: plugin.id,
        });
        const ds =
          existing ??
          (await DealerServiceModel.create({
            dealerId,
            serviceId: plugin.id,
            config: attach.config,
            cadence,
            schedule: cronForCadence(cadence),
            status: 'ACTIVE',
            nextRunAt: nextRunFor(cadence, isoDays(i * 0.5)) ?? undefined,
          }));

        const runCount = 3 + (i % 3);
        for (let r = 0; r < runCount; r++) {
          const startedAt = isoDays(-1 - r);
          const status: 'SUCCESS' | 'FAILED' = r % 4 === 0 ? 'FAILED' : 'SUCCESS';
          await ServiceRunModel.create({
            dealerId,
            serviceId: plugin.id,
            dealerServiceId: ds._id,
            startedAt,
            finishedAt: new Date(startedAt.getTime() + 1000 * (5 + r)),
            status,
            durationMs: 1000 * (5 + r),
            output:
              status === 'SUCCESS'
                ? { ok: true, summary: 'seeded run' }
                : undefined,
            error:
              status === 'FAILED'
                ? { message: 'Seeded failure for demo purposes' }
                : undefined,
          });
        }
      }
    }
  }

  logger.info('Seed complete');
  await disconnectDb();
}

const reset = process.argv.includes('--reset');
seed({ reset })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
