import type { ServiceRunContext } from '@dk/shared';

import plugin from './index.js';

function makeCtx(overrides: Partial<ServiceRunContext> = {}): ServiceRunContext {
  return {
    dealerId: '507f1f77bcf86cd799439031',
    dealerServiceId: '507f1f77bcf86cd799439032',
    config: { currency: 'INR', taxPercent: 18 },
    now: new Date('2024-06-15T12:00:00.000Z'),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

describe('monthly-invoice-generation plugin', () => {
  it('exposes the documented contract', () => {
    expect(plugin.id).toBe('monthly-invoice-generation');
    expect(plugin.cadence).toBe('MONTHLY');
  });

  it('produces a well-shaped invoice and a 15-day due date', async () => {
    const result = await plugin.run(makeCtx());
    const out = result.output as {
      invoiceNumber: string;
      subtotal: number;
      tax: number;
      total: number;
      currency: string;
      dueDate: string;
    };
    expect(out.invoiceNumber).toMatch(/^INV-202406-\d{6}$/);
    expect(out.currency).toBe('INR');
    expect(out.subtotal).toBeGreaterThan(0);
    expect(out.tax).toBeCloseTo((out.subtotal * 18) / 100, 1);
    expect(out.total).toBeCloseTo(out.subtotal + out.tax, 1);
    const due = new Date(out.dueDate).getTime();
    const ran = new Date('2024-06-15T12:00:00.000Z').getTime();
    expect(due - ran).toBe(15 * 24 * 60 * 60 * 1000);
  });

  it('is deterministic for an identical seed', async () => {
    const a = await plugin.run(makeCtx());
    const b = await plugin.run(makeCtx());
    expect(a.output).toEqual(b.output);
  });

  it('rejects invalid currency', async () => {
    await expect(
      plugin.run(makeCtx({ config: { currency: 'rupees', taxPercent: 5 } })),
    ).rejects.toThrow(/invalid config/i);
  });
}, 30_000);
