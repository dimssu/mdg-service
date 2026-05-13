import type { ServicePlugin } from '@dk/shared';

import { annualLicenseConfigZod, annualLicenseSchema } from './schema.js';

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
  id: 'annual-license-renewal-reminder',
  name: 'Annual License Renewal Reminder',
  description:
    'Schedules a renewal reminder for a license, configurable number of days before its annual expiry.',
  cadence: 'YEARLY',
  defaultConfigSchema: annualLicenseSchema as unknown as Record<string, unknown>,

  async run(ctx) {
    const startedAt = Date.now();
    const parsed = annualLicenseConfigZod.safeParse(ctx.config);
    if (!parsed.success) {
      throw new Error(
        `annual-license-renewal-reminder: invalid config — ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    const { licenseNumber, daysBefore } = parsed.data;

    const seedString = `${ctx.dealerId}:${ctx.dealerServiceId}:${ctx.now.getTime()}`;
    const rand = mulberry32(hashSeed(seedString));

    const delay = 50 + Math.floor(rand() * 151);
    await new Promise((r) => setTimeout(r, delay));

    const reminderOffsetDays = 365 - daysBefore;
    const reminderAt = new Date(
      ctx.now.getTime() + reminderOffsetDays * 24 * 60 * 60 * 1000,
    );
    const message = `License ${licenseNumber} renewal due in ${daysBefore} day${daysBefore === 1 ? '' : 's'}; reminder scheduled for ${reminderAt.toISOString()}.`;

    ctx.logger.info('annual-license-renewal-reminder completed', {
      dealerId: ctx.dealerId,
      licenseNumber,
      reminderAt: reminderAt.toISOString(),
    });

    return {
      output: {
        licenseNumber,
        reminderAt: reminderAt.toISOString(),
        message,
      },
      durationMs: Date.now() - startedAt,
    };
  },
};

export default plugin;
