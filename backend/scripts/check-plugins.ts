/* eslint-disable no-console */
/**
 * Standalone smoke check: boots the service registry against
 * `backend/src/services/` and asserts that every expected plugin id is
 * present. No database, no HTTP server. Run with:
 *
 *   npx tsx backend/scripts/check-plugins.ts
 */

const EXPECTED = [
  'daily-stock-check',
  'weekly-compliance-report',
  'monthly-invoice-generation',
  'annual-license-renewal-reminder',
  'custom-request',
] as const;

async function main(): Promise<void> {
  // Stub the env vars the shared env module insists on, BEFORE we import
  // anything that pulls it in.
  process.env.MONGODB_URI ??= 'mongodb://localhost:27017/dk-smoke';
  process.env.JWT_SECRET ??= 'smoke-check-secret-min-16-chars';
  process.env.LOG_LEVEL ??= 'silent';
  process.env.NODE_ENV ??= 'test';

  const { registry, initRegistry } = await import(
    '../src/services/registry.js'
  );

  await initRegistry();
  const loaded = registry.list().map((p) => p.id);
  const missing = EXPECTED.filter((id) => !loaded.includes(id));
  if (missing.length > 0) {
    console.error(
      `check-plugins FAILED: missing plugin id(s): ${missing.join(', ')}`,
    );
    console.error(`loaded ids: ${loaded.join(', ')}`);
    process.exit(1);
  }
  console.log(
    `check-plugins OK — loaded ${loaded.length} plugin(s): ${loaded.join(', ')}`,
  );
}

main().catch((err) => {
  console.error('check-plugins crashed:', err);
  process.exit(1);
});
