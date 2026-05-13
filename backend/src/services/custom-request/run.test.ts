import type { ServiceRunContext } from '@dk/shared';

import plugin from './index.js';

function makeCtx(overrides: Partial<ServiceRunContext> = {}): ServiceRunContext {
  return {
    dealerId: '507f1f77bcf86cd799439051',
    dealerServiceId: '507f1f77bcf86cd799439052',
    config: { requestType: 'manual-audit', payload: { ticketId: 'T-1001' } },
    now: new Date('2024-06-15T12:00:00.000Z'),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

describe('custom-request plugin', () => {
  it('exposes the documented contract', () => {
    expect(plugin.id).toBe('custom-request');
    expect(plugin.cadence).toBe('ON_DEMAND');
  });

  it('echoes the configured payload', async () => {
    const result = await plugin.run(makeCtx());
    const out = result.output as {
      requestType: string;
      echo: Record<string, unknown>;
      processedAt: string;
    };
    expect(out.requestType).toBe('manual-audit');
    expect(out.echo).toEqual({ ticketId: 'T-1001' });
    expect(out.processedAt).toMatch(/^2024-06-15T12:00:00\.\d{3}Z$/);
  });

  it('is deterministic', async () => {
    const a = await plugin.run(makeCtx());
    const b = await plugin.run(makeCtx());
    expect(a.output).toEqual(b.output);
  });

  it('rejects empty requestType', async () => {
    await expect(
      plugin.run(makeCtx({ config: { requestType: '', payload: {} } })),
    ).rejects.toThrow(/invalid config/i);
  });
}, 30_000);
