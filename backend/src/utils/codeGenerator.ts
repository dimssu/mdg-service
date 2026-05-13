import { DealerModel } from '../models/Dealer.js';

const PREFIX = (process.env.DEALER_CODE_PREFIX ?? 'E').toUpperCase();
const PAD = Math.max(1, Math.min(6, Number(process.env.DEALER_CODE_PAD ?? 2)));

function pad(n: number): string {
  return String(n).padStart(PAD, '0');
}

/**
 * Compute the next free dealer code by scanning existing `dealer.code` values
 * that match the configured prefix. Returns e.g. `E03` when `E01`, `E02` exist.
 *
 * Race-safe pairing: a unique sparse index on `dealer.code` is the source of
 * truth. This function is a *suggestion* — the caller should commit and retry
 * on E11000 (duplicate key).
 */
export async function nextDealerCode(): Promise<string> {
  const escape = PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escape}(\\d+)$`);
  const rows = await DealerModel.find(
    { code: { $regex: re } },
    { code: 1 },
  ).lean();
  let max = 0;
  for (const row of rows) {
    const c = row.code;
    if (!c) continue;
    const m = re.exec(c);
    if (!m || !m[1]) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${PREFIX}${pad(max + 1)}`;
}

export const DEALER_CODE_PREFIX = PREFIX;
export const DEALER_CODE_PAD = PAD;
