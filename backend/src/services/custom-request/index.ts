import type { ServicePlugin } from '@dk/shared';

import { customRequestConfigZod, customRequestSchema } from './schema.js';

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
  id: 'custom-request',
  name: 'Custom Request',
  description:
    'On-demand passthrough that echoes the configured payload after a simulated processing delay.',
  cadence: 'ON_DEMAND',
  defaultConfigSchema: customRequestSchema as unknown as Record<string, unknown>,

  async run(ctx) {
    const startedAt = Date.now();
    const parsed = customRequestConfigZod.safeParse(ctx.config);
    if (!parsed.success) {
      throw new Error(
        `custom-request: invalid config — ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    const { requestType, payload } = parsed.data;

    const seedString = `${ctx.dealerId}:${ctx.dealerServiceId}:${ctx.now.getTime()}`;
    const rand = mulberry32(hashSeed(seedString));

    // Slightly larger simulated delay than the scheduled plugins: 100-250ms.
    const delay = 100 + Math.floor(rand() * 151);
    await new Promise((r) => setTimeout(r, delay));

    ctx.logger.info('custom-request completed', {
      dealerId: ctx.dealerId,
      requestType,
    });

    return {
      output: {
        requestType,
        echo: payload,
        processedAt: new Date(ctx.now.getTime() + delay).toISOString(),
      },
      durationMs: Date.now() - startedAt,
    };
  },
};

export default plugin;
