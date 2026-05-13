import type { ServicePlugin } from '@dk/shared';

import { weeklyComplianceConfigZod, weeklyComplianceSchema } from './schema.js';

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

type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
const SEVERITIES: Severity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH'];
const CODE_BOOK = [
  { code: 'C-101', note: 'Calibration record older than 90 days' },
  { code: 'C-204', note: 'Operator training certificate missing' },
  { code: 'C-310', note: 'Fire-safety audit overdue' },
  { code: 'C-422', note: 'Underground tank pressure log gap detected' },
  { code: 'C-509', note: 'POS reconciliation variance outside tolerance' },
  { code: 'C-611', note: 'Environmental discharge report pending' },
] as const;

const plugin: ServicePlugin = {
  id: 'weekly-compliance-report',
  name: 'Weekly Compliance Report',
  description:
    'Produces a regional compliance summary with a score, findings list, and optional document audit.',
  cadence: 'WEEKLY',
  defaultConfigSchema:
    weeklyComplianceSchema as unknown as Record<string, unknown>,

  async run(ctx) {
    const startedAt = Date.now();
    const parsed = weeklyComplianceConfigZod.safeParse(ctx.config);
    if (!parsed.success) {
      throw new Error(
        `weekly-compliance-report: invalid config — ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    const { region, includeDocs } = parsed.data;

    const seedString = `${ctx.dealerId}:${ctx.dealerServiceId}:${ctx.now.getTime()}`;
    const rand = mulberry32(hashSeed(seedString));

    const delay = 50 + Math.floor(rand() * 151);
    await new Promise((r) => setTimeout(r, delay));

    const score = Math.floor(rand() * 101); // 0..100
    const findingsCount = Math.floor(rand() * 5); // 0..4
    const findings: Array<{ code: string; severity: Severity; note: string }> = [];
    for (let i = 0; i < findingsCount; i++) {
      const entry = CODE_BOOK[Math.floor(rand() * CODE_BOOK.length)];
      const severity = SEVERITIES[Math.floor(rand() * SEVERITIES.length)];
      if (!entry || !severity) continue;
      findings.push({ code: entry.code, severity, note: entry.note });
    }

    const output: Record<string, unknown> = {
      region,
      score,
      findings,
      generatedAt: ctx.now.toISOString(),
    };
    if (includeDocs) {
      output.docCount = 3 + Math.floor(rand() * 18); // 3..20
    }

    ctx.logger.info('weekly-compliance-report completed', {
      dealerId: ctx.dealerId,
      region,
      score,
      findings: findings.length,
    });

    return {
      output,
      durationMs: Date.now() - startedAt,
    };
  },
};

export default plugin;
