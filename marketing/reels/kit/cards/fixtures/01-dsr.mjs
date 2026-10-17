// Reel 01 · DSR — an INVENTED daily sales report (CATALOG § 01). No real outlet;
// the code below is hidden on screen anyway. Figures are the fact file's
// published illustrative rows, checked:
//   20-Aug: 12,480 + 6,000 = 18,480; 18,480 − 14,246 = 4,234; − 12 testing = 4,222
//   meter steps 20→21 Aug: 1,060 + 1,050 + 1,070 + 1,054 = 4,234 (= sales + testing)
//   band: 4% × 14,246 = 569.84 → 570 L; 0.25% × 78,310 = 195.775 → 196 L; sum 766
const NOZZLES = [1, 2, 3, 4];
const BASE = [2210440, 1876500, 2031180, 1744900];      // readings at the 20-Aug opening
const STEP_20 = [1060, 1050, 1070, 1054];               // 20-Aug → 21-Aug (sum 4,234)
const STEP_19 = [1410, 1400, 1420, 1410];               // 19-Aug → 20-Aug (sum 5,640 = 5,630 + 10)
const STEP_18 = [1230, 1250, 1240, 1250];
const STEP_17 = [1180, 1170, 1190, 1170];

const sum = (a) => a.reduce((x, y) => x + y, 0);
const minus = (base, ...steps) => base.map((b, i) => b - steps.reduce((n, s) => n + s[i], 0));
const plus = (base, step) => base.map((b, i) => b + step[i]);

function row(date, { dip, opening, receipt, testing, sales, cum, closed, pumps }) {
  return {
    businessDate: date,
    dip,
    waterDip: 0,
    openingStock: opening,
    tanks: [{ tankNo: 1, dip, waterDip: 0, stock: opening, stockSource: 'reported' }],
    receipt,
    receiptSource: 'iras',
    irasReceipt: receipt,
    totalStock: opening + receipt,
    pumps: NOZZLES.map((n, i) => ({ nozzleNo: n, reading: pumps[i] })),
    testing,
    sales: closed ? sales : null,
    cumulativeSales: closed ? cum : null,
    remarks: null,
    closed,
  };
}

const r17 = row('2026-08-17', { dip: 120, opening: 10840, receipt: 9000, testing: 12, sales: 4708, cum: 64830, closed: true, pumps: minus(BASE, STEP_19, STEP_18, STEP_17) });
const r18 = row('2026-08-18', { dip: 130, opening: 15120, receipt: 0, testing: 12, sales: 4958, cum: 69788, closed: true, pumps: minus(BASE, STEP_19, STEP_18) });
const r19 = row('2026-08-19', { dip: 98, opening: 9120, receipt: 9000, testing: 10, sales: 5630, cum: 74088, closed: true, pumps: minus(BASE, STEP_19) });
const r20 = row('2026-08-20', { dip: 141, opening: 12480, receipt: 6000, testing: 12, sales: 4222, cum: 78310, closed: true, pumps: BASE });
const r21 = row('2026-08-21', { dip: 160, opening: 14246, receipt: 0, testing: 12, closed: false, pumps: plus(BASE, STEP_20) });

if (sum(STEP_20) !== 4222 + 12) throw new Error('meter steps must sum to sales + testing');
if (12480 + 6000 - 14246 - 12 !== 4222) throw new Error('row does not close');

const digest = {
  outletCode: 'X0X',
  dealerId: 'reel-demo',
  roCode: null,
  businessDate: '2026-08-21',
  shiftTime: '',                       // drops the clock time from the date strip and the footer
  generatedAt: '2026-08-21T01:05:00.000Z',
  warnings: [],
  products: [{
    productKey: 'HSD',
    productLabelEn: 'HIGH SPEED DIESEL',
    productLabelHi: 'डीज़ल',
    tankLabel: 'TANK -1',
    tankNos: [1],
    rows: [r20, r21],
    ledger: [r17, r18, r19, r20, r21],
    variation: {
      productKey: 'HSD',
      productLabel: 'HIGH SPEED DIESEL',
      currentDate: '2026-08-21',
      shiftTime: '',
      variation: -180,
      permissibleVariation: 765.615,
      variationNotWithinLimit: 0,
      totalReceiptSinceInspection: 84000,
      totalTestSinceInspection: 240,
      sinceDate: '2026-08-01',
      advisory: { kind: 'WITHIN_LIMIT', messageHi: 'सही', messageEn: 'ok' },
      breakdown: {
        meterSalesSinceInspection: 78550,
        afterTesting: 78310,
        totalStockSinceInspection: 0,
        actualDipStock: 14246,
        dipSales: 0,
        leakage: 195.775,
        permissible: 569.84,
      },
    },
  }],
};

export const cards = [
  { name: 'variation', builder: 'dsr-variation', input: digest },
  { name: 'sales', builder: 'dsr-sales', input: digest },
];
