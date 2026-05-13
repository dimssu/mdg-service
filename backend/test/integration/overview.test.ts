import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express } from 'express';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { DealerModel } from '../../src/models/Dealer.js';
import { DealerServiceModel } from '../../src/models/DealerService.js';
import { ServiceRunModel } from '../../src/models/ServiceRun.js';
import { registry } from '../../src/services/registry.js';

import {
  clearTestDb,
  signInAsAdmin,
  startTestDb,
  stopTestDb,
} from '../helpers/setup.js';

let app: Express;

const SERVICES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'services',
);

beforeAll(async () => {
  await startTestDb();
  await registry.load(SERVICES_DIR);
  app = createApp();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

describe('GET /overview', () => {
  it('returns the documented snapshot shape with non-negative counters', async () => {
    const auth = await signInAsAdmin(app);
    // Seed a sliver of data: 1 active dealer + 1 attached service + 1 run.
    const dealer = await DealerModel.create({
      name: 'Snapshot Dealer',
      phone: '+919000000000',
      status: 'ACTIVE',
      onboarding: {
        currentStepId: null,
        completedStepCount: 8,
        steps: [],
      },
    });
    const ds = await DealerServiceModel.create({
      dealerId: dealer._id,
      serviceId: 'daily-stock-check',
      config: { warehouseId: 'WH-OV', threshold: 5 },
      cadence: 'DAILY',
      schedule: '0 0 * * *',
      status: 'ACTIVE',
    });
    await ServiceRunModel.create({
      dealerId: dealer._id,
      serviceId: 'daily-stock-check',
      dealerServiceId: ds._id,
      startedAt: new Date(),
      status: 'SUCCESS',
      durationMs: 200,
    });
    await ServiceRunModel.create({
      dealerId: dealer._id,
      serviceId: 'daily-stock-check',
      dealerServiceId: ds._id,
      startedAt: new Date(),
      status: 'FAILED',
      durationMs: 50,
    });

    const res = await request(app)
      .get('/api/v1/overview')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(res.status).toBe(200);
    const body = res.body.data as {
      dealers: { total: number; byStatus: Record<string, number> };
      services: { pluginCount: number; attached: number; active: number };
      runs: {
        last24h: number;
        successRate24h: number;
        failedLast24h: number;
        avgDurationMs24h: number;
      };
      recentRuns: unknown[];
    };
    expect(body.dealers.total).toBeGreaterThanOrEqual(1);
    expect(body.dealers.byStatus.ACTIVE).toBeGreaterThanOrEqual(1);
    expect(body.services.pluginCount).toBeGreaterThan(0);
    expect(body.services.attached).toBeGreaterThanOrEqual(1);
    expect(body.services.active).toBeGreaterThanOrEqual(1);
    expect(body.runs.last24h).toBeGreaterThanOrEqual(2);
    expect(body.runs.failedLast24h).toBeGreaterThanOrEqual(1);
    expect(body.runs.successRate24h).toBeGreaterThanOrEqual(0);
    expect(body.runs.successRate24h).toBeLessThanOrEqual(1);
    expect(body.runs.avgDurationMs24h).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(body.recentRuns)).toBe(true);
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/v1/overview');
    expect(res.status).toBe(401);
  });
}, 60_000);
