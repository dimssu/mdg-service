import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express } from 'express';
import request from 'supertest';

import { createApp } from '../../src/app.js';
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

const REQUIRED_PLUGIN_IDS = [
  'daily-stock-check',
  'weekly-compliance-report',
  'monthly-invoice-generation',
  'annual-license-renewal-reminder',
  'custom-request',
];

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

describe('GET /services', () => {
  it('lists the five plugin IDs', async () => {
    const auth = await signInAsAdmin(app);
    const res = await request(app)
      .get('/api/v1/services')
      .set('Authorization', `Bearer ${auth.token}`);
    expect(res.status).toBe(200);
    const ids = (res.body.data as Array<{ id: string }>).map((p) => p.id);
    for (const required of REQUIRED_PLUGIN_IDS) {
      expect(ids).toContain(required);
    }
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/v1/services');
    expect(res.status).toBe(401);
  });
}, 60_000);
