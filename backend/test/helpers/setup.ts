import type { Express } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';

import { AdminModel } from '../../src/models/Admin.js';
import {
  AuditLogModel,
  DealerModel,
  DealerServiceModel,
  ServiceRunModel,
} from '../../src/models/index.js';
import { hashPassword } from '../../src/utils/password.js';

/**
 * Connect to the in-memory Mongo started by global-setup. Safe to call
 * multiple times; only connects once. We deliberately keep the model layer
 * in charge of its own connection state so the production code remains
 * unaware of the test harness.
 */
export async function startTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set; globalSetup did not run?');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export async function stopTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Wipe every collection touched by the suite. Cheaper and more reliable
 * than restarting mongodb-memory-server between tests.
 */
export async function clearTestDb(): Promise<void> {
  await Promise.all([
    AdminModel.deleteMany({}),
    DealerModel.deleteMany({}),
    DealerServiceModel.deleteMany({}),
    ServiceRunModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
  ]);
}

export interface SeededAdmin {
  id: string;
  email: string;
  password: string;
  token: string;
}

const DEFAULT_PASSWORD = 'Admin@12345';
const DEFAULT_EMAIL = 'admin@test.local';

/**
 * Create an admin (idempotent on email) and return a fresh JWT obtained by
 * actually hitting `POST /auth/login`. This exercises the full happy path
 * so we never trust hand-rolled tokens in integration tests.
 */
export async function signInAsAdmin(
  app: Express,
  overrides: { email?: string; password?: string; roles?: string[] } = {},
): Promise<SeededAdmin> {
  const email = overrides.email ?? DEFAULT_EMAIL;
  const password = overrides.password ?? DEFAULT_PASSWORD;
  const roles = overrides.roles ?? ['admin'];

  let existing = await AdminModel.findOne({ email });
  if (!existing) {
    existing = await AdminModel.create({
      email,
      name: 'Test Admin',
      passwordHash: await hashPassword(password),
      roles,
    });
  }

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(
      `signInAsAdmin failed (status=${res.status}): ${JSON.stringify(res.body)}`,
    );
  }
  return {
    id: String(existing._id),
    email,
    password,
    token: res.body.data.token as string,
  };
}

export const TEST_DEFAULTS = {
  EMAIL: DEFAULT_EMAIL,
  PASSWORD: DEFAULT_PASSWORD,
};
