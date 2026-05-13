import type { ServiceRunContext } from '@dk/shared';

import plugin from './index.js';

function makeCtx(overrides: Partial<ServiceRunContext> = {}): ServiceRunContext {
  return {
    dealerId: '507f1f77bcf86cd799439021',
    dealerServiceId: '507f1f77bcf86cd799439022',
    config: { region: 'KA', includeDocs: true },
    now: new Date('2024-06-15T12:00:00.000Z'),
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

describe('weekly-compliance-report plugin', () => {
  it('exposes the documented contract', () => {
    expect(plugin.id).toBe('weekly-compliance-report');
    expect(plugin.cadence).toBe('WEEKLY');
  });

  it('produces a well-shaped output', async () => {
    const result = await plugin.run(makeCtx());
    const out = result.output as {
      region: string;
      score: number;
      findings: Array<{ code: string; severity: string; note: string }>;
      generatedAt: string;
      docCount?: number;
    };
    expect(out.region).toBe('KA');
    expect(out.score).toBeGreaterThanOrEqual(0);
    expect(out.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(out.findings)).toBe(true);
    expect(out.findings.length).toBeLessThanOrEqual(4);
    expect(out.docCount).toBeGreaterThanOrEqual(3);
    expect(out.docCount).toBeLessThanOrEqual(20);
  });

  it('omits docCount when includeDocs=false', async () => {
    const result = await plugin.run(
      makeCtx({ config: { region: 'KA', includeDocs: false } }),
    );
    expect(result.output as Record<string, unknown>).not.toHaveProperty(
      'docCount',
    );
  });

  it('is deterministic for an identical seed', async () => {
    const a = await plugin.run(makeCtx());
    const b = await plugin.run(makeCtx());
    expect((a.output as { score: number }).score).toBe(
      (b.output as { score: number }).score,
    );
    expect((a.output as { findings: unknown[] }).findings).toEqual(
      (b.output as { findings: unknown[] }).findings,
    );
  });

  it('rejects invalid config', async () => {
    await expect(plugin.run(makeCtx({ config: {} }))).rejects.toThrow(
      /invalid config/i,
    );
  });
}, 30_000);
