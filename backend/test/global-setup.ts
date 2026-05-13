import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Spin up a single mongodb-memory-server for the whole Jest run and
 * expose its URI via `process.env.MONGODB_URI`. This avoids the cost of
 * starting a fresh Mongo for every test file and keeps tests offline-safe.
 *
 * The instance handle is stashed on `globalThis` so the matching teardown
 * can stop it cleanly.
 */
export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'test-secret-please-32-bytes-padding';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'silent';
  process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? 'http://localhost:5173';
  process.env.RATE_LIMIT_LOGIN_PER_MIN =
    process.env.RATE_LIMIT_LOGIN_PER_MIN ?? '1000';

  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'dealer_kavach_test' },
  });
  process.env.MONGODB_URI = mongod.getUri();
  (globalThis as unknown as { __MONGOD__: MongoMemoryServer }).__MONGOD__ = mongod;
}
