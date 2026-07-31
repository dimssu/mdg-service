import { colors } from '../../theme';

/**
 * The ADMIN portal's palette.
 *
 * `theme.ts` mirrors the CLIENT app (warm stone greys, near-black brand) because
 * every tutorial so far mocked the dealer's phone. The admin portal is a
 * different product surface — slate greys, a blue brand — so a mocked admin
 * screen painted in the client tokens would not look like the thing the admin
 * actually opens.
 *
 * Values below are mirrored 1:1 from `mdg-admin/src/index.css` (`:root`, light
 * theme) and the intent colours in `mdg-admin/tailwind.config.ts`. Where a
 * shared token in `theme.ts` is already byte-identical to the admin's, it is
 * reused rather than re-declared, so the two stay linked.
 */
export const admin = {
  /** --color-bg */
  bg: '#f8fafc',
  surface: colors.surface,
  /** --color-surface-2 */
  surface2: '#f1f5f9',
  /** --color-border */
  border: '#e2e8f0',
  /** --color-border-strong */
  borderStrong: '#cbd5e1',

  text: colors.text,
  /** --color-text-muted */
  textMuted: '#475569',
  /** --color-text-subtle */
  textSubtle: '#64748b',
  textInverse: colors.textInverse,

  /** --color-brand (blue-600) */
  brand: '#2563eb',
  /** --color-brand-hover (blue-700) */
  brandHover: '#1d4ed8',
  /** --color-brand-soft (blue-100) */
  brandSoft: '#dbeafe',

  /** tailwind.config.ts → success */
  success: '#16a34a',
  successSoft: '#dcfce7',
  /** tailwind.config.ts → warning */
  warning: '#d97706',
  warningSoft: '#fef3c7',
  danger: colors.danger,
  dangerSoft: '#fee2e2',
  /** tailwind.config.ts → info (same hue as brand, by design) */
  info: '#2563eb',
  infoSoft: '#dbeafe',
  /** tailwind.config.ts → neutral */
  neutral: '#475569',
  neutralSoft: '#e2e8f0',
} as const;

/**
 * The document palette of the rendered Credit & DOD card (maroon + gold). Kept
 * here so the mini stand-in in `ReportDetail` reads as the same artefact as the
 * full card in `screens/CreditCard.tsx`, which owns the real recreation.
 */
export const cardBrand = {
  maroon: '#7f1d1d',
  maroonDeep: '#991b1b',
  gold: '#f59e0b',
  cream: '#fffdf5',
  ink: '#1c1917',
  grid: '#e7d9bf',
} as const;

/** The sample dealer every admin tutorial uses. */
export const SAMPLE = {
  dealerName: 'SA Fuel Point',
  dealerCode: '5E01',
  dealerPhone: '98250 41127',
  dueAmount: '₹8,03,960.60',
  dueDate: '16-07-2026',
  currentLimit: '₹60,00,000.00',
  availedLimit: '₹35,46,192.60',
  availableLimit: '₹24,53,807.40',
  formOfLimit: 'DOD',
  receivable: '₹35,46,192.60',
  capturedAt: '30 Jul 2026, 10:12 AM',
} as const;
