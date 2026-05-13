import type { Cadence } from '@dk/shared';
import parser from 'cron-parser';


/**
 * Compute the next run date for a given cadence.
 * - DAILY = +24h
 * - WEEKLY = +7d
 * - MONTHLY = +1 month
 * - YEARLY = +1 year
 * - ON_DEMAND = null
 * If customCron is provided, it overrides the cadence calculation.
 */
export function nextRunFor(
  cadence: Cadence,
  from: Date,
  customCron?: string,
): Date | null {
  if (customCron) {
    try {
      const it = parser.parseExpression(customCron, { currentDate: from });
      return it.next().toDate();
    } catch {
      return null;
    }
  }
  switch (cadence) {
    case 'DAILY': {
      const d = new Date(from);
      d.setUTCHours(d.getUTCHours() + 24);
      return d;
    }
    case 'WEEKLY': {
      const d = new Date(from);
      d.setUTCDate(d.getUTCDate() + 7);
      return d;
    }
    case 'MONTHLY': {
      const d = new Date(from);
      d.setUTCMonth(d.getUTCMonth() + 1);
      return d;
    }
    case 'YEARLY': {
      const d = new Date(from);
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      return d;
    }
    case 'ON_DEMAND':
    default:
      return null;
  }
}

/**
 * Translate a cadence into a representative cron expression used to
 * persist in DealerService.schedule for display purposes.
 */
export function cronForCadence(cadence: Cadence, customCron?: string): string {
  if (customCron) return customCron;
  switch (cadence) {
    case 'DAILY':
      return '0 0 * * *';
    case 'WEEKLY':
      return '0 0 * * 0';
    case 'MONTHLY':
      return '0 0 1 * *';
    case 'YEARLY':
      return '0 0 1 1 *';
    case 'ON_DEMAND':
    default:
      return '@on-demand';
  }
}
