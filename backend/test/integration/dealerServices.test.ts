import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express } from 'express';
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

let phoneCounter = 9_500_000_000;
function nextPhone(): string {
  phoneCounter += 1;
  return `+91${phoneCounter}`;
}

async function createDealer(token: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/dealers')
    .set('Authorization', `Bearer ${token}`)
    .send({ phone: nextPhone(), name: 'DS Test Dealer' });
  return res.body.data.id as string;
}

describe('dealer-service attach/manage', () => {
  it('attaches a plugin with valid config and computes schedule + nextRunAt', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);

    const res = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        serviceId: 'daily-stock-check',
        config: { warehouseId: 'WH-BLR-1', threshold: 50 },
      });
    expect(res.status).toBe(201);
    expect(res.body.data.serviceId).toBe('daily-stock-check');
    expect(res.body.data.cadence).toBe('DAILY');
    expect(res.body.data.schedule).toBe('0 0 * * *');
    expect(res.body.data.nextRunAt).toBeTruthy();
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('rejects invalid plugin config with 422', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);

    const res = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        serviceId: 'daily-stock-check',
        // missing warehouseId
        config: { threshold: 50 },
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PLUGIN_CONFIG_INVALID');
  });

  it('rejects an unknown plugin with PLUGIN_NOT_FOUND', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);
    const res = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ serviceId: 'no-such-plugin', config: {} });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PLUGIN_NOT_FOUND');
  });

  it('disallows attaching the same plugin twice (CONFLICT)', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);
    const body = {
      serviceId: 'daily-stock-check',
      config: { warehouseId: 'WH-X', threshold: 10 },
    };
    const first = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send(body);
    expect(first.status).toBe(201);
    const second = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send(body);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CONFLICT');
  });

  it('runNow creates a ServiceRun and returns 202', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);
    const attached = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        serviceId: 'custom-request',
        config: { requestType: 'manual', payload: { foo: 'bar' } },
      });
    const dsId = attached.body.data.id;

    const runRes = await request(app)
      .post(`/api/v1/dealer-services/${dsId}/run-now`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({});
    expect(runRes.status).toBe(202);
    const runId = runRes.body.data.runId;
    expect(typeof runId).toBe('string');

    const stored = await ServiceRunModel.findById(runId).lean();
    expect(stored?.status).toMatch(/^(SUCCESS|RUNNING|FAILED)$/);
  });

  it('PATCH /dealer-services updates config (validated), cadence, status', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);
    const attached = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        serviceId: 'daily-stock-check',
        config: { warehouseId: 'WH-X', threshold: 10 },
      });
    const dsId = attached.body.data.id;

    const pauseRes = await request(app)
      .patch(`/api/v1/dealer-services/${dsId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ status: 'PAUSED' });
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.data.status).toBe('PAUSED');
    expect(pauseRes.body.data.nextRunAt).toBeUndefined();

    const resumeRes = await request(app)
      .patch(`/api/v1/dealer-services/${dsId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ status: 'ACTIVE' });
    expect(resumeRes.body.data.nextRunAt).toBeTruthy();

    const badConfig = await request(app)
      .patch(`/api/v1/dealer-services/${dsId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ config: { threshold: 1 } }); // missing warehouseId
    expect(badConfig.status).toBe(422);
  });

  it('GET /dealers/:id/services lists attached services', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);
    await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        serviceId: 'daily-stock-check',
        config: { warehouseId: 'WH-X', threshold: 10 },
      });
    const list = await request(app)
      .get(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
  });

  it('DELETE /dealer-services detaches the service', async () => {
    const auth = await signInAsAdmin(app);
    const dealerId = await createDealer(auth.token);
    const attached = await request(app)
      .post(`/api/v1/dealers/${dealerId}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        serviceId: 'custom-request',
        config: { requestType: 'manual', payload: {} },
      });
    const dsId = attached.body.data.id;
    const del = await request(app)
      .delete(`/api/v1/dealer-services/${dsId}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(del.status).toBe(200);
    expect(del.body.data.id).toBe(dsId);
  });
}, 60_000);
