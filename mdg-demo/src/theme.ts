/**
 * Design tokens mirrored 1:1 from the MDG client (`mdg-client/src/index.css`,
 * light theme) so the mock screens in these tutorials look exactly like the real
 * app the dealer sees on their phone.
 */
export const colors = {
  bg: '#fafaf9',
  surface: '#ffffff',
  surface2: '#f5f5f4',
  border: '#e7e5e4',
  borderStrong: '#d6d3d1',

  text: '#0f172a',
  textMuted: '#57534e',
  textSubtle: '#78716c',
  textInverse: '#ffffff',

  brand: '#18181b',
  brandHover: '#27272a',
  brandSoft: '#f4f4f5',

  focusRing: '#a8a29e',
  online: '#0f766e',

  // success/danger aren't in the CSS :root (they live in the Tailwind config);
  // these match the app's green/red usage.
  success: '#15803d',
  successSoft: '#dcfce7',
  danger: '#dc2626',
} as const;

/** Font stack: Inter for Latin/numerals, Noto Sans Devanagari for Hindi. */
export const FONT_FAMILY = 'Inter, "Noto Sans Devanagari", system-ui, sans-serif';

/** Canvas + timing constants shared by every tutorial. */
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Logical size of the phone screen the mock app is drawn in (iPhone-ish). */
export const SCREEN = {
  width: 390,
  height: 844,
} as const;
