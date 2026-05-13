import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { registry } from './registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REAL_SERVICES_DIR = __dirname;

const REAL_PLUGINS = [
  '_example',
  'daily-stock-check',
  'weekly-compliance-report',
  'monthly-invoice-generation',
  'annual-license-renewal-reminder',
  'custom-request',
];

describe('ServiceRegistry.load', () => {
  it('auto-discovers all five plugins plus the _example placeholder', async () => {
    await registry.load(REAL_SERVICES_DIR);
    const ids = registry.list().map((p) => p.id);
    for (const expected of REAL_PLUGINS) {
      expect(ids).toContain(expected);
    }
    expect(registry.size()).toBeGreaterThanOrEqual(REAL_PLUGINS.length);
  });

  it('list() returns catalog projections (no run function exposed)', async () => {
    await registry.load(REAL_SERVICES_DIR);
    const entry = registry.list().find((e) => e.id === 'daily-stock-check');
    expect(entry).toBeDefined();
    expect(entry).toHaveProperty('name');
    expect(entry).toHaveProperty('cadence', 'DAILY');
    expect(entry).toHaveProperty('defaultConfigSchema');
    expect(entry).not.toHaveProperty('run');
  });

  it('getOrThrow returns a registered plugin', async () => {
    await registry.load(REAL_SERVICES_DIR);
    const reg = registry.getOrThrow('custom-request');
    expect(reg.plugin.id).toBe('custom-request');
    expect(typeof reg.validateConfig).toBe('function');
  });

  it('getOrThrow throws PLUGIN_NOT_FOUND for unknown ids', async () => {
    await registry.load(REAL_SERVICES_DIR);
    expect(() => registry.getOrThrow('not-a-real-plugin')).toThrow(
      /Plugin not found: not-a-real-plugin/,
    );
  });

  it('validateConfig accepts valid input and rejects invalid input', async () => {
    await registry.load(REAL_SERVICES_DIR);
    expect(() =>
      registry.validateConfig('daily-stock-check', {
        warehouseId: 'WH-01',
        threshold: 50,
      }),
    ).not.toThrow();
    expect(() =>
      registry.validateConfig('daily-stock-check', { threshold: 50 }),
    ).toThrow(/Plugin config invalid/);
  });

  it('returns empty when servicesDir is missing', async () => {
    await registry.load(path.join(__dirname, 'does-not-exist-xyz'));
    // registry.list() is global mutable state; after a missing-dir load
    // the registry is reset to empty.
    expect(registry.size()).toBe(0);
    // restore real state so other tests can run in any order
    await registry.load(REAL_SERVICES_DIR);
  });
});

describe('ServiceRegistry.load — programmatic plugin folders', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(tmpdir(), 'dk-registry-test-'));
  });
  afterEach(async () => {
    if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
    // Reset registry state back to the real plugins so other suites stay
    // independent of execution order.
    await registry.load(REAL_SERVICES_DIR);
  });

  async function writePlugin(slug: string, body: string): Promise<void> {
    const dir = path.join(tempRoot, slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.mjs'), body, 'utf8');
  }

  it('rejects a plugin whose contract is malformed (missing fields)', async () => {
    await writePlugin(
      'bad-plugin',
      `export default { id: 'bad-plugin', name: 'x' };`,
    );
    await expect(registry.load(tempRoot)).rejects.toThrow(
      /Invalid plugin contract/,
    );
  });

  it("rejects a plugin whose id doesn't match its folder name", async () => {
    await writePlugin(
      'folder-name',
      `export default {
        id: 'different-id',
        name: 'X',
        description: 'X',
        cadence: 'ON_DEMAND',
        defaultConfigSchema: { type: 'object' },
        run: async () => ({ output: {}, durationMs: 0 }),
      };`,
    );
    await expect(registry.load(tempRoot)).rejects.toThrow(
      /does not match folder name/,
    );
  });

  it('silently skips folders without an index file', async () => {
    await mkdir(path.join(tempRoot, 'empty-folder'), { recursive: true });
    // a single valid plugin so we have something to load successfully
    await writePlugin(
      'good',
      `export default {
        id: 'good',
        name: 'Good',
        description: 'good',
        cadence: 'ON_DEMAND',
        defaultConfigSchema: { type: 'object' },
        run: async () => ({ output: {}, durationMs: 0 }),
      };`,
    );
    await registry.load(tempRoot);
    expect(registry.list().map((p) => p.id)).toEqual(['good']);
  });

  it('ignores leading-underscore folders other than _example', async () => {
    await writePlugin(
      '_hidden',
      `export default {
        id: '_hidden',
        name: 'hidden',
        description: 'hidden',
        cadence: 'ON_DEMAND',
        defaultConfigSchema: { type: 'object' },
        run: async () => ({ output: {}, durationMs: 0 }),
      };`,
    );
    await registry.load(tempRoot);
    expect(registry.list()).toHaveLength(0);
  });

  it('skips plugin modules with no default export', async () => {
    await writePlugin('no-default', `export const notDefault = 1;`);
    // Should not throw, just be skipped.
    await registry.load(tempRoot);
    expect(registry.list()).toHaveLength(0);
  });
});
