// Reel 02 · Stock check — INVENTED figures (CATALOG § 02). No real outlet; the code is hidden on screen.
// The fact file's worked example, one diesel tank:
//   tank now (dip) 10,000 L · sold since the inspection 20,000 L (meters 20,072 − testing 72)
//   shortage band = 4% × 10,000 (400) + 0.25% × 20,000 (50) = 450 · excess band = 400 (evaporation is a shortage allowance)
//   A  book 10,430 (inspection stock 6,430 + receipts 24,000 − 20,000) vs dip 10,000 → −430: inside by 20
//   B  book  9,570 (inspection stock 5,570 + receipts 24,000 − 20,000) vs dip 10,000 → +430: beyond by 30
// Yesterday's sales row closes on today's opening: 7,720 + 6,000 = 13,720 − 10,000 = 3,720 − 12 testing = 3,708.
const NOZZLES = [1, 2, 3, 4];
const BASE = [1842210, 1596480, 1730940, 1488650];     // readings at the 7-Sep opening
const STEP_07 = [930, 925, 935, 930];                   // 7 → 8 Sep (sum 3,720 = 3,708 + 12)
const sum = (a) => a.reduce((x, y) => x + y, 0);
const plus = (base, step) => base.map((b, i) => b + step[i]);
if (sum(STEP_07) !== 3708 + 12) throw new Error('meter steps must sum to sales + testing');
if (7720 + 6000 - 10000 - 12 !== 3708) throw new Error('row does not close');

function row(date, { dip, opening, receipt, testing, sales, cum, closed, pumps }) {
  return {
    businessDate: date, dip, waterDip: 0, openingStock: opening,
    tanks: [{ tankNo: 1, dip, waterDip: 0, stock: opening, stockSource: 'reported' }],
    receipt, receiptSource: 'iras', irasReceipt: receipt, totalStock: opening + receipt,
    pumps: NOZZLES.map((n, i) => ({ nozzleNo: n, reading: pumps[i] })),
    testing, sales: closed ? sales : null, cumulativeSales: closed ? cum : null, remarks: null, closed,
  };
}
const r07 = row('2026-09-07', { dip: 112, opening: 7720, receipt: 6000, testing: 12, sales: 3708, cum: 25960, closed: true, pumps: BASE });
const r08 = row('2026-09-08', { dip: 131, opening: 10000, receipt: 0, testing: 12, closed: false, pumps: plus(BASE, STEP_07) });

const variation = (v, notWithin, permissible) => ({
  productKey: 'HSD', productLabel: 'HIGH SPEED DIESEL', currentDate: '2026-09-08', shiftTime: '',
  variation: v, permissibleVariation: permissible, variationNotWithinLimit: notWithin,
  totalReceiptSinceInspection: 24000, totalTestSinceInspection: 72, sinceDate: '2026-09-02',
  advisory: notWithin === 0 ? { kind: 'WITHIN_LIMIT', messageHi: 'सही', messageEn: 'ok' } : { kind: 'EXCESS', messageHi: 'ज़्यादा', messageEn: 'excess' },
  breakdown: { meterSalesSinceInspection: 20072, afterTesting: 20000, totalStockSinceInspection: 0, actualDipStock: 10000, dipSales: 0, leakage: 50, permissible: 400 },
});
const digest = (v) => ({
  outletCode: 'X0X', dealerId: 'reel-demo', roCode: null, businessDate: '2026-09-08', shiftTime: '',
  generatedAt: '2026-09-08T01:05:00.000Z', warnings: [],
  products: [{ productKey: 'HSD', productLabelEn: 'HIGH SPEED DIESEL', productLabelHi: 'डीज़ल', tankLabel: 'TANK -1', tankNos: [1],
    rows: [r07, r08], ledger: [r07, r08], variation: v }],
});
export const cards = [
  { name: 'var-short', builder: 'dsr-variation', input: digest(variation(-430, 0, 450)) },
  { name: 'var-excess', builder: 'dsr-variation', input: digest(variation(430, 30, 400)) },
  { name: 'sales', builder: 'dsr-sales', input: digest(variation(-430, 0, 450)) },
];
