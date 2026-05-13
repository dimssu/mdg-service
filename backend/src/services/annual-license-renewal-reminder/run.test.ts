import type { ServiceRunContext } from '@dk/shared';

import plugin from './index.js';

function makeCtx(overrides: Partial<ServiceRunContext> = {}): ServiceRunContext {
  return {
    dealerId: '507f1f77bcf86cd799439041',
    dealerServiceId: '507f1f77bcf86cd799439042',
    config: { licenseNumber: 'KA-FUEL-2025-0042', daysBefore: 45 },
    now: new Date('2024-06-15T12:00:00.000Z'),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

describe('annual-license-renewal-reminder plugin', () => {
  it('exposes the documented contract', () => {
    expect(plugin.id).toBe('annual-license-renewal-reminder');
    expect(plugin.cadence).toBe('YEARLY');
  });

  it('produces a reminder date offset by (365 - daysBefore) days', async () => {
    const result = await plugin.run(makeCtx());
    const out = result.output as {
      licenseNumber: string;
      reminderAt: string;
      message: string;
    };
    expect(out.licenseNumber).toBe('KA-FUEL-2025-0042');
    const reminderMs = new Date(out.reminderAt).getTime();
    const nowMs = new Date('2024-06-15T12:00:00.000Z').getTime();
    expect(reminderMs - nowMs).toBe((365 - 45) * 24 * 60 * 60 * 1000);
    expect(out.message).toContain('45 days');
  });

  it('singular "day" when daysBefore=1', async () => {
    const result = await plugin.run(
      makeCtx({ config: { licenseNumber: 'X', daysBefore: 1 } }),
    );
    expect((result.output as { message: string }).message).toContain(
      '1 day; reminder',
    );
  });

  it('is deterministic', async () => {
    const a = await plugin.run(makeCtx());
    const b = await plugin.run(makeCtx());
    expect(a.output).toEqual(b.output);
  });

  it('rejects invalid config', async () => {
    await expect(
      plugin.run(makeCtx({ config: { licenseNumber: 'x', daysBefore: 500 } })),
    ).rejects.toThrow(/invalid config/i);
  });
}, 30_000);
