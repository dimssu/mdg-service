import { cronForCadence, nextRunFor } from './cadence.js';

describe('nextRunFor', () => {
  const base = new Date('2024-06-15T12:00:00.000Z');

  it('DAILY adds 24 hours', () => {
    const next = nextRunFor('DAILY', base);
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe('2024-06-16T12:00:00.000Z');
  });

  it('WEEKLY adds 7 days', () => {
    const next = nextRunFor('WEEKLY', base);
    expect(next!.toISOString()).toBe('2024-06-22T12:00:00.000Z');
  });

  it('MONTHLY advances one month', () => {
    const next = nextRunFor('MONTHLY', base);
    expect(next!.toISOString()).toBe('2024-07-15T12:00:00.000Z');
  });

  it('YEARLY advances one year', () => {
    const next = nextRunFor('YEARLY', base);
    expect(next!.toISOString()).toBe('2025-06-15T12:00:00.000Z');
  });

  it('ON_DEMAND returns null', () => {
    expect(nextRunFor('ON_DEMAND', base)).toBeNull();
  });

  it('customCron overrides cadence', () => {
    // "every minute" from base -> base + 60s
    const next = nextRunFor('DAILY', base, '* * * * *');
    expect(next).not.toBeNull();
    expect(next!.getTime() - base.getTime()).toBe(60_000);
  });

  it('invalid customCron returns null', () => {
    expect(nextRunFor('DAILY', base, 'not a real cron')).toBeNull();
  });

  it('does not mutate the input date', () => {
    const before = base.getTime();
    nextRunFor('MONTHLY', base);
    expect(base.getTime()).toBe(before);
  });
});

describe('cronForCadence', () => {
  it('returns the customCron when provided', () => {
    expect(cronForCadence('DAILY', '*/5 * * * *')).toBe('*/5 * * * *');
  });

  it('returns documented expressions per cadence', () => {
    expect(cronForCadence('DAILY')).toBe('0 0 * * *');
    expect(cronForCadence('WEEKLY')).toBe('0 0 * * 0');
    expect(cronForCadence('MONTHLY')).toBe('0 0 1 * *');
    expect(cronForCadence('YEARLY')).toBe('0 0 1 1 *');
  });

  it('falls back to @on-demand sentinel for ON_DEMAND', () => {
    expect(cronForCadence('ON_DEMAND')).toBe('@on-demand');
  });
});
