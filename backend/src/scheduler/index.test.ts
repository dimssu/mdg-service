import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  clearTestDb,
  startTestDb,
  stopTestDb,
} from '../../test/helpers/setup.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { DealerServiceModel } from '../models/DealerService.js';
import { ServiceRunModel } from '../models/ServiceRun.js';
import { registry } from '../services/registry.js';

import { startScheduler, stopScheduler, tick } from './index.js';

const SERVICES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'services',
);

beforeAll(async () => {
  await startTestDb();
  await registry.load(SERVICES_DIR);
});

afterEach(async () => {
  stopScheduler();
  await clearTestDb();
});

afterAll(async () => {
  await stopTestDb();
});

describe('scheduler', () => {
  it('startScheduler / stopScheduler are idempotent', () => {
    startScheduler();
    // second call should be a no-op
    startScheduler();
    stopScheduler();
    stopScheduler();
  });

  it('tick() claims a due DealerService, runs the plugin, and persists SUCCESS', async () => {
    const past = new Date(Date.now() - 60_000);
    const dealerId = '507f1f77bcf86cd799439111';
    const ds = await DealerServiceModel.create({
      dealerId,
      serviceId: 'daily-stock-check',
      config: { warehouseId: 'WH-TEST-1', threshold: 100 },
      cadence: 'DAILY',
      schedule: '0 0 * * *',
      status: 'ACTIVE',
      nextRunAt: past,
    });

    await tick();

    const runs = await ServiceRunModel.find({ dealerServiceId: ds._id }).lean();
    expect(runs).toHaveLength(1);
    expect(runs[0]!.status).toBe('SUCCESS');
    expect(runs[0]!.output).toBeDefined();
    const reloaded = await DealerServiceModel.findById(ds._id).lean();
    expect(reloaded?.lastRunAt).toBeTruthy();
    expect(reloaded?.nextRunAt).toBeTruthy();
    const audit = await AuditLogModel.find({
      entity: 'DealerService',
      entityId: String(ds._id),
    }).lean();
    expect(audit.length).toBeGreaterThan(0);
  });

  it('tick() records FAILED runs when the plugin throws', async () => {
    const past = new Date(Date.now() - 60_000);
    const dealerId = '507f1f77bcf86cd799439112';
    const ds = await DealerServiceModel.create({
      dealerId,
      serviceId: 'daily-stock-check',
      // Intentionally missing warehouseId -> plugin throws.
      config: {},
      cadence: 'DAILY',
      schedule: '0 0 * * *',
      status: 'ACTIVE',
      nextRunAt: past,
    });

    await tick();

    const runs = await ServiceRunModel.find({ dealerServiceId: ds._id }).lean();
    expect(runs).toHaveLength(1);
    expect(runs[0]!.status).toBe('FAILED');
    expect(runs[0]!.error?.message).toMatch(/invalid config/i);
  });

  it('tick() skips rows whose plugin is unknown and recomputes nextRunAt', async () => {
    const past = new Date(Date.now() - 60_000);
    const dealerId = '507f1f77bcf86cd799439113';
    const ds = await DealerServiceModel.create({
      dealerId,
      serviceId: 'this-plugin-does-not-exist',
      config: {},
      cadence: 'DAILY',
      schedule: '0 0 * * *',
      status: 'ACTIVE',
      nextRunAt: past,
    });
    await tick();
    const reloaded = await DealerServiceModel.findById(ds._id).lean();
    expect(reloaded?.nextRunAt).toBeTruthy();
    const runs = await ServiceRunModel.find({ dealerServiceId: ds._id }).lean();
    expect(runs).toHaveLength(0);
  });

  it('tick() is a no-op when nothing is due', async () => {
    await tick();
    expect(await ServiceRunModel.countDocuments({})).toBe(0);
  });
}, 60_000);
