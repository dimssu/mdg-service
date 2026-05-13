import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express } from 'express';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { AdminModel } from '../../src/models/Admin.js';
import { registry } from '../../src/services/registry.js';
import { hashPassword } from '../../src/utils/password.js';

import {
  clearTestDb,
  signInAsAdmin,
  startTestDb,
  stopTestDb,
  TEST_DEFAULTS,
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

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await AdminModel.create({
      email: TEST_DEFAULTS.EMAIL,
      name: 'Test Admin',
      passwordHash: await hashPassword(TEST_DEFAULTS.PASSWORD),
      roles: ['admin'],
    });
  });

  it('returns a token + admin profile for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_DEFAULTS.EMAIL, password: TEST_DEFAULTS.PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.admin.email).toBe(TEST_DEFAULTS.EMAIL);
    expect(res.body.data.admin).not.toHaveProperty('passwordHash');
  });

  it('rejects bad password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_DEFAULTS.EMAIL, password: 'wrong-password-X' });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever-long-enough' });
    expect(res.status).toBe(401);
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /auth/me', () => {
  it('returns the admin profile for a valid token', async () => {
    const seeded = await signInAsAdmin(app);
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${seeded.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(seeded.email);
    expect(res.body.data.roles).toEqual(['admin']);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects malformed tokens', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });
});
