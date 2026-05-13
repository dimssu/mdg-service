import type { ServicePlugin } from '@dk/shared';

import { dailyStockCheckConfigZod, dailyStockCheckSchema } from './schema.js';

/**
 * Tiny deterministic PRNG (mulberry32). Plain hash from the seed string so
 * tests can replay a run by feeding back the same (dealerId, dealerServiceId,
 * startedAt) tuple.
 */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const plugin: ServicePlugin = {
  id: 'daily-stock-check',
  name: 'Daily Stock Check',
  description:
    'Pulls a warehouse inventory snapshot and flags SKUs below a low-stock threshold.',
  cadence: 'DAILY',
  defaultConfigSchema: dailyStockCheckSchema as unknown as Record<string, unknown>,

  async run(ctx) {
    const startedAt = Date.now();
    const parsed = dailyStockCheckConfigZod.safeParse(ctx.config);
    if (!parsed.success) {
      throw new Error(
        `daily-stock-check: invalid config — ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    const { warehouseId, threshold } = parsed.data;

    const seedString = `${ctx.dealerId}:${ctx.dealerServiceId}:${ctx.now.getTime()}`;
    const rand = mulberry32(hashSeed(seedString));

    // Simulated IO latency between 50-200ms, deterministic.
    const delay = 50 + Math.floor(rand() * 151);
    await new Promise((r) => setTimeout(r, delay));

    const items = 50 + Math.floor(rand() * 451); // 50..500
    const lowStockSkus: string[] = [];
    for (let i = 0; i < items; i++) {
      const qty = Math.floor(rand() * 250);
      if (qty < threshold) {
        const sku = `SKU-${warehouseId}-${String(i).padStart(4, '0')}`;
        lowStockSkus.push(sku);
      }
    }

    ctx.logger.info('daily-stock-check completed', {
      dealerId: ctx.dealerId,
      warehouseId,
      items,
      lowStock: lowStockSkus.length,
    });

    return {
      output: {
        items,
        lowStockSkus,
        pulledAt: ctx.now.toISOString(),
        warehouseId,
      },
      durationMs: Date.now() - startedAt,
    };
  },
};

export default plugin;
