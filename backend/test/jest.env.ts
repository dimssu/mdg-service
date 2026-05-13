/**
 * Loaded via Jest's `setupFiles`. Runs once per test file before the test
 * framework or any user module executes, so this is the only place we can
 * inject env vars that `src/config/env.ts` depends on at import time.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-please-32-bytes-padding';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:0/dealer_kavach_test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'silent';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? 'http://localhost:5173';
process.env.RATE_LIMIT_LOGIN_PER_MIN =
  process.env.RATE_LIMIT_LOGIN_PER_MIN ?? '1000';
