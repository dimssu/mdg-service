/* eslint-disable no-console */
/**
 * Verifies that the running backend has been seeded as documented:
 *
 *   - at least 5 dealers
 *   - at least 5 registered plugins
 *   - at least 1 dealer with attached services
 *   - at least 1 historical run
 *
 * Usage:
 *   npx tsx scripts/verify-seed.ts
 *
 * Optional env vars:
 *   API_BASE        - defaults to http://localhost:4000/api/v1
 *   ADMIN_EMAIL     - defaults to admin@dealerkavach.local
 *   ADMIN_PASSWORD  - defaults to Admin@12345
 *
 * Exits 0 on success, 1 with a printed reason on any failed assertion or
 * network problem.
 */

const API_BASE = process.env.API_BASE ?? 'http://localhost:4000/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@dealerkavach.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@12345';

interface ApiSuccess<T> {
  ok: true;
  data: T;
}
interface ApiError {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}
type ApiResponse<T> = ApiSuccess<T> | ApiError;

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

async function api<T>(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!json) {
    throw new Error(`${method} ${path} returned non-JSON (status=${res.status})`);
  }
  if (!json.ok) {
    throw new Error(
      `${method} ${path} failed (status=${res.status}, code=${json.error.code}): ${json.error.message}`,
    );
  }
  return json.data;
}

function fail(msg: string): never {
  console.error(`[verify-seed] FAIL: ${msg}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log(`[verify-seed] target ${API_BASE}`);

  // 1. login
  let token: string;
  try {
    const login = await api<{ token: string }>('POST', '/auth/login', {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    token = login.token;
    console.log('[verify-seed] login ok');
  } catch (err) {
    fail(
      `login failed: ${(err as Error).message}. Did you run \`npm --workspace @dk/backend run seed\`?`,
    );
  }

  // 2. plugins ≥ 5
  const plugins = await api<Array<{ id: string }>>('GET', '/services', { token });
  if (plugins.length < 5) {
    fail(`expected ≥5 plugins registered, got ${plugins.length}`);
  }
  console.log(`[verify-seed] plugins: ${plugins.length}`);

  // 3. dealers ≥ 5
  const dealers = await api<Paginated<{ id: string; name: string }>>(
    'GET',
    '/dealers?page=1&pageSize=50',
    { token },
  );
  if (dealers.total < 5) {
    fail(`expected ≥5 dealers, got ${dealers.total}`);
  }
  console.log(`[verify-seed] dealers: ${dealers.total}`);

  // 4. ≥1 dealer with attached services
  let dealerWithServices = 0;
  for (const dealer of dealers.items) {
    const ds = await api<Array<{ id: string }>>(
      'GET',
      `/dealers/${dealer.id}/services`,
      { token },
    );
    if (ds.length > 0) dealerWithServices++;
  }
  if (dealerWithServices < 1) {
    fail('no dealer has any attached services');
  }
  console.log(`[verify-seed] dealers with services: ${dealerWithServices}`);

  // 5. ≥1 historical run
  const runs = await api<Paginated<{ id: string }>>(
    'GET',
    '/runs?page=1&pageSize=1',
    { token },
  );
  if (runs.total < 1) {
    fail('no service runs found');
  }
  console.log(`[verify-seed] runs (total): ${runs.total}`);

  console.log('[verify-seed] OK');
  process.exit(0);
}

main().catch((err) => {
  fail((err as Error).message);
});
