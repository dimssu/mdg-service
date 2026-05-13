import type { ServiceRunContext } from '@dk/shared';

import plugin from './index.js';

function makeCtx(overrides: Partial<ServiceRunContext> = {}): ServiceRunContext {
  return {
    dealerId: '507f1f77bcf86cd799439011',
    dealerServiceId: '507f1f77bcf86cd799439012',
    config: { warehouseId: 'WH-BLR-01', threshold: 100 },
    now: new Date('2024-06-15T12:00:00.000Z'),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

describe('daily-stock-check plugin', () => {
  it('exposes the documented contract', () => {
    expect(plugin.id).toBe('daily-stock-check');
    expect(plugin.cadence).toBe('DAILY');
    expect(plugin.defaultConfigSchema).toMatchObject({ type: 'object' });
  });

  it('produces a well-shaped output', async () => {
    const result = await plugin.run(makeCtx());
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    const out = result.output as {
      items: number;
      lowStockSkus: string[];
      pulledAt: string;
      warehouseId: string;
    };
    expect(out.items).toBeGreaterThanOrEqual(50);
    expect(out.items).toBeLessThanOrEqual(500);
    expect(Array.isArray(out.lowStockSkus)).toBe(true);
    expect(out.warehouseId).toBe('WH-BLR-01');
    expect(out.pulledAt).toBe('2024-06-15T12:00:00.000Z');
  });

  it('is deterministic for an identical (dealerId, dealerServiceId, now) seed', async () => {
    const a = await plugin.run(makeCtx());
    const b = await plugin.run(makeCtx());
    expect((a.output as { items: number }).items).toBe(
      (b.output as { items: number }).items,
    );
    expect((a.output as { lowStockSkus: string[] }).lowStockSkus).toEqual(
      (b.output as { lowStockSkus: string[] }).lowStockSkus,
    );
  });

  it('rejects invalid config', async () => {
    await expect(
      plugin.run(makeCtx({ config: { threshold: 10 } })),
    ).rejects.toThrow(/invalid config/i);
  });
}, 30_000);
