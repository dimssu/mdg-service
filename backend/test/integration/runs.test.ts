import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';

import { createApp } from '../../src/app.js';
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

async function seedRun(overrides: Record<string, unknown> = {}): Promise<string> {
  const doc = await ServiceRunModel.create({
    dealerId: new mongoose.Types.ObjectId(),
    serviceId: 'daily-stock-check',
    dealerServiceId: new mongoose.Types.ObjectId(),
    startedAt: new Date(),
    status: 'SUCCESS',
    durationMs: 100,
    output: { ok: true },
    ...overrides,
  });
  return String(doc._id);
}

describe('runs endpoints', () => {
  it('lists runs with filters', async () => {
    const auth = await signInAsAdmin(app);
    await seedRun({ status: 'SUCCESS' });
    await seedRun({ status: 'FAILED' });

    const all = await request(app)
      .get('/api/v1/runs')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(all.status).toBe(200);
    expect(all.body.data.total).toBe(2);

    const failed = await request(app)
      .get('/api/v1/runs?status=FAILED')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(failed.body.data.total).toBe(1);
    expect(failed.body.data.items[0].status).toBe('FAILED');
  });

  it('GET /runs/:id returns a single run, or 404 when missing', async () => {
    const auth = await signInAsAdmin(app);
    const runId = await seedRun();
    const ok = await request(app)
      .get(`/api/v1/runs/${runId}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.id).toBe(runId);

    const missing = await request(app)
      .get('/api/v1/runs/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(missing.status).toBe(404);
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/v1/runs');
    expect(res.status).toBe(401);
  });
}, 60_000);
