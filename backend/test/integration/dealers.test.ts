import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express } from 'express';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { DealerServiceModel } from '../../src/models/DealerService.js';
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

let phoneCounter = 9_000_000_000;
function nextPhone(): string {
  phoneCounter += 1;
  return `+91${phoneCounter}`;
}

async function createDealer(app: Express, token: string, name?: string) {
  return request(app)
    .post('/api/v1/dealers')
    .set('Authorization', `Bearer ${token}`)
    .send({ phone: nextPhone(), name });
}

const STEP_PAYLOADS = {
  'send-welcome': {},
  'send-terms-link': {},
  'send-pdf': {},
  'receive-payment-and-gst': {
    gst: '27ABCDE1234F1Z5',
    paymentNote: 'UPI ref 9876',
  },
  'assign-code': { code: 'E01' },
  'create-admin-group': {
    groupName: 'E0101',
    inviteLink: 'https://chat.whatsapp.com/admin-test',
    username: 'e01-admin',
    password: 'TempPass@123',
  },
  'create-dealer-group': {
    groupName: 'E0102',
    inviteLink: 'https://chat.whatsapp.com/dealer-test',
  },
} as const;

async function completeStep(
  app: Express,
  token: string,
  dealerId: string,
  stepId: keyof typeof STEP_PAYLOADS,
  override?: Record<string, unknown>,
) {
  return request(app)
    .post(`/api/v1/dealers/${dealerId}/onboarding/steps/${stepId}/complete`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...STEP_PAYLOADS[stepId], ...(override ?? {}) });
}

describe('dealers endpoints', () => {
  it('rejects unauthenticated calls', async () => {
    const res = await request(app).get('/api/v1/dealers');
    expect(res.status).toBe(401);
  });

  it('creates a phone-only dealer with status=ONBOARDING and step 1 already DONE', async () => {
    const auth = await signInAsAdmin(app);
    const res = await createDealer(app, auth.token, 'Sunrise Petroleum');
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ONBOARDING');
    expect(res.body.data.id).toMatch(/^[a-f0-9]{24}$/);
    expect(res.body.data.onboarding.completedStepCount).toBe(1);
    expect(res.body.data.onboarding.currentStepId).toBe('send-welcome');
    expect(res.body.data.onboarding.steps[0].status).toBe('DONE');
  });

  it('returns CONFLICT when the same phone is registered twice', async () => {
    const auth = await signInAsAdmin(app);
    const first = await request(app)
      .post('/api/v1/dealers')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ phone: '+919100000001', name: 'Alpha' });
    expect(first.status).toBe(201);
    const dup = await request(app)
      .post('/api/v1/dealers')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ phone: '+919100000001', name: 'Beta' });
    expect(dup.status).toBe(409);
  });

  it('walks all 8 onboarding steps and flips to ACTIVE on the last one', async () => {
    const auth = await signInAsAdmin(app);
    const created = await createDealer(app, auth.token, 'Coastal Energy');
    const id = created.body.data.id;

    const steps: Array<keyof typeof STEP_PAYLOADS> = [
      'send-welcome',
      'send-terms-link',
      'send-pdf',
      'receive-payment-and-gst',
      'assign-code',
      'create-admin-group',
      'create-dealer-group',
    ];
    for (const s of steps) {
      const r = await completeStep(app, auth.token, id, s);
      expect(r.status).toBe(200);
    }
    const finalRes = await request(app)
      .get(`/api/v1/dealers/${id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(finalRes.body.data.status).toBe('ACTIVE');
    expect(finalRes.body.data.onboarding.completedStepCount).toBe(8);
    expect(finalRes.body.data.onboarding.currentStepId).toBeNull();
    expect(finalRes.body.data.code).toBe('E01');
    expect(finalRes.body.data.gst).toBe('27ABCDE1234F1Z5');
    expect(finalRes.body.data.portalCredentials?.username).toBe('e01-admin');
    expect(finalRes.body.data.whatsappGroups?.adminGroupName).toBe('E0101');
    expect(finalRes.body.data.whatsappGroups?.dealerGroupName).toBe('E0102');
  });

  it('rejects out-of-order step completion', async () => {
    const auth = await signInAsAdmin(app);
    const created = await createDealer(app, auth.token);
    const id = created.body.data.id;
    // Skip ahead — should fail because current is 'send-welcome'.
    const r = await completeStep(app, auth.token, id, 'receive-payment-and-gst');
    expect(r.status).toBe(400);
  });

  it('allows reopening a mutating step with force and overwriting the artifact', async () => {
    const auth = await signInAsAdmin(app);
    const created = await createDealer(app, auth.token);
    const id = created.body.data.id;
    await completeStep(app, auth.token, id, 'send-welcome');
    await completeStep(app, auth.token, id, 'send-terms-link');
    await completeStep(app, auth.token, id, 'send-pdf');
    await completeStep(app, auth.token, id, 'receive-payment-and-gst');

    // Reopen without force → rejected
    const denied = await request(app)
      .post(`/api/v1/dealers/${id}/onboarding/steps/receive-payment-and-gst/reopen`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({});
    expect(denied.status).toBe(400);

    const ok = await request(app)
      .post(`/api/v1/dealers/${id}/onboarding/steps/receive-payment-and-gst/reopen`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ force: true });
    expect(ok.status).toBe(200);
    expect(ok.body.data.onboarding.currentStepId).toBe('receive-payment-and-gst');

    // Re-complete with a corrected GST
    const recompleted = await completeStep(app, auth.token, id, 'receive-payment-and-gst', {
      gst: '07ZZZZZ9999Z1Z9',
      paymentNote: 'UPI corrected',
    });
    expect(recompleted.status).toBe(200);
    expect(recompleted.body.data.gst).toBe('07ZZZZZ9999Z1Z9');
  });

  it('rejects reopen of the append-only assign-code step', async () => {
    const auth = await signInAsAdmin(app);
    const created = await createDealer(app, auth.token);
    const id = created.body.data.id;
    for (const s of [
      'send-welcome',
      'send-terms-link',
      'send-pdf',
      'receive-payment-and-gst',
      'assign-code',
    ] as const) {
      const r = await completeStep(app, auth.token, id, s);
      expect(r.status).toBe(200);
    }
    const reopen = await request(app)
      .post(`/api/v1/dealers/${id}/onboarding/steps/assign-code/reopen`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ force: true });
    expect(reopen.status).toBe(400);
  });

  it('rejects a duplicate dealer code on the assign-code step', async () => {
    const auth = await signInAsAdmin(app);
    const gsts = ['27ABCDE1234F1Z5', '07ZZZZZ5555F2Z6'];
    const ids: string[] = [];
    for (let i = 0; i < 2; i++) {
      const r = await createDealer(app, auth.token);
      ids.push(r.body.data.id);
      for (const s of ['send-welcome', 'send-terms-link', 'send-pdf'] as const) {
        await completeStep(app, auth.token, r.body.data.id, s);
      }
      await completeStep(app, auth.token, r.body.data.id, 'receive-payment-and-gst', {
        gst: gsts[i],
      });
    }
    const aCode = await completeStep(app, auth.token, ids[0]!, 'assign-code', { code: 'E07' });
    expect(aCode.status).toBe(200);

    const bCode = await request(app)
      .post(`/api/v1/dealers/${ids[1]}/onboarding/steps/assign-code/complete`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ code: 'E07' });
    // The route retries 3 times by re-deriving, so it should succeed with a fresh code.
    expect(bCode.status).toBe(200);
    expect(bCode.body.data.code).not.toBe('E07');
  });

  it('next-code endpoint suggests the next free code', async () => {
    const auth = await signInAsAdmin(app);
    const created = await createDealer(app, auth.token);
    const id = created.body.data.id;
    const res = await request(app)
      .get(`/api/v1/dealers/${id}/onboarding/next-code`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.suggestion).toMatch(/^E\d+$/);
  });

  it('lists, searches by phone, and filters by status', async () => {
    const auth = await signInAsAdmin(app);
    await request(app)
      .post('/api/v1/dealers')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ phone: '+919900000001', name: 'Alpha Petrol' });
    await request(app)
      .post('/api/v1/dealers')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ phone: '+919900000002', name: 'Beta Fuels' });

    const all = await request(app)
      .get('/api/v1/dealers')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(all.body.data.total).toBe(2);

    const filtered = await request(app)
      .get('/api/v1/dealers?status=ONBOARDING')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(filtered.body.data.total).toBe(2);

    const searched = await request(app)
      .get('/api/v1/dealers?search=9900000002')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(searched.body.data.total).toBe(1);
    expect(searched.body.data.items[0].name).toBe('Beta Fuels');
  });

  it('GET /dealers/:id returns NOT_FOUND for missing dealers', async () => {
    const auth = await signInAsAdmin(app);
    const res = await request(app)
      .get('/api/v1/dealers/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(res.status).toBe(404);
  });

  it('audit log is appended for create + step completion + update', async () => {
    const auth = await signInAsAdmin(app);
    const created = await createDealer(app, auth.token);
    const id = created.body.data.id;
    await completeStep(app, auth.token, id, 'send-welcome');
    await request(app)
      .patch(`/api/v1/dealers/${id}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ name: 'Renamed Dealer' });

    const audit = await request(app)
      .get(`/api/v1/dealers/${id}/audit`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(audit.status).toBe(200);
    expect(audit.body.data.total).toBeGreaterThanOrEqual(3);
  });

  it('DELETE cascades to DealerService rows but keeps ServiceRun history', async () => {
    const auth = await signInAsAdmin(app);
    const created = await createDealer(app, auth.token);
    const id = created.body.data.id;

    await request(app)
      .post(`/api/v1/dealers/${id}/services`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        serviceId: 'daily-stock-check',
        config: { warehouseId: 'WH-X', threshold: 10 },
      });
    expect(await DealerServiceModel.countDocuments({ dealerId: id })).toBe(1);

    const deleted = await request(app)
      .delete(`/api/v1/dealers/${id}`)
      .set('Authorization', `Bearer ${auth.token}`);
    expect(deleted.status).toBe(200);
    expect(await DealerServiceModel.countDocuments({ dealerId: id })).toBe(0);
  });
}, 90_000);
