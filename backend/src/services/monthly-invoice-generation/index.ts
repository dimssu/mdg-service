import type { ServicePlugin } from '@dk/shared';

import { monthlyInvoiceConfigZod, monthlyInvoiceSchema } from './schema.js';

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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const plugin: ServicePlugin = {
  id: 'monthly-invoice-generation',
  name: 'Monthly Invoice Generation',
  description:
    'Generates a deterministic monthly invoice with a 15-day due date in the configured currency.',
  cadence: 'MONTHLY',
  defaultConfigSchema: monthlyInvoiceSchema as unknown as Record<string, unknown>,

  async run(ctx) {
    const startedAt = Date.now();
    const parsed = monthlyInvoiceConfigZod.safeParse(ctx.config);
    if (!parsed.success) {
      throw new Error(
        `monthly-invoice-generation: invalid config — ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    const { currency, taxPercent } = parsed.data;

    const seedString = `${ctx.dealerId}:${ctx.dealerServiceId}:${ctx.now.getTime()}`;
    const seedInt = hashSeed(seedString);
    const rand = mulberry32(seedInt);

    const delay = 50 + Math.floor(rand() * 151);
    await new Promise((r) => setTimeout(r, delay));

    // Subtotal between 1,000.00 and 50,000.00 in the configured currency.
    const subtotal = round2(1000 + rand() * 49000);
    const tax = round2((subtotal * taxPercent) / 100);
    const total = round2(subtotal + tax);

    const dueDate = new Date(ctx.now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const invoiceNumber = `INV-${ctx.now.getUTCFullYear()}${String(
      ctx.now.getUTCMonth() + 1,
    ).padStart(2, '0')}-${(seedInt % 1_000_000).toString().padStart(6, '0')}`;

    ctx.logger.info('monthly-invoice-generation completed', {
      dealerId: ctx.dealerId,
      invoiceNumber,
      total,
      currency,
    });

    return {
      output: {
        invoiceNumber,
        subtotal,
        tax,
        total,
        currency,
        dueDate: dueDate.toISOString(),
      },
      durationMs: Date.now() - startedAt,
    };
  },
};

export default plugin;
