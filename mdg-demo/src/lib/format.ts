/** Round to 2 dp (points can be fractional, e.g. a 40 ÷ 3 split). Mirrors the app. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Points as a clean string: integers plain, fractions trimmed (13.30 → 13.3). */
export function fmtPoints(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/** Per-person points for a SPLIT task shared by `count` people. */
export function splitPer(total: number, count: number): number {
  return round2(total / Math.max(1, count));
}
