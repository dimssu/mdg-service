/**
 * Brand tokens for the MDG Services marketing film.
 *
 * Mirrored 1:1 from `mdg-landing/tailwind.config.js` so the video, the website
 * and the printed pamphlet are visibly the same brand. The tutorial videos use
 * `src/theme.ts` instead — that palette copies the *client app*, because those
 * videos draw the app. This one is not an app walkthrough; it is the brochure
 * in motion, so it takes the brochure's navy and gold.
 */

export const brand = {
  /* ── Brand indigo / navy (primary). Brand mark = navy700 ── */
  navy50: '#F1F2FB',
  navy100: '#E3E4F6',
  navy200: '#C5C7ED',
  navy300: '#9EA1E0',
  navy400: '#6E72CC',
  navy500: '#4A4EB4',
  navy600: '#393C9A',
  navy700: '#2C2E80',
  navy800: '#222466',
  navy900: '#1A1B4B',
  navy950: '#101133',

  /* ── Energy accent (gold / amber). "Fueling Success" ── */
  gold50: '#FEF7E7',
  gold100: '#FDECC4',
  gold200: '#FBD888',
  gold300: '#F8C24B',
  gold400: '#F5A524',
  gold500: '#E0860A',
  gold600: '#B96807',

  /* ── Neutrals — cool slate, biased toward the navy ── */
  paper: '#FCFCFE',
  paperWarm: '#F5F6FB',
  paperSunk: '#EDEFF7',

  ink: '#15163A',
  inkSoft: '#3D3F66',
  inkMuted: '#6B6D93',
  inkFaint: '#9B9DBE',
  hairline: '#E4E6F1',

  /* ── "Handled / done". Used only inside diagrams, never as chrome. ── */
  ok: '#12A87B',
  okTint: '#E4F6EF',

  /* ── "Still on you / at risk". The counterweight to `ok` in the
        before/after diagrams. Not in the Tailwind config, because the site has
        no failure state to draw; the film does. ── */
  risk: '#D2544B',
  riskTint: '#FBE9E8',
} as const;

/**
 * Font stacks.
 *
 * `display` is Space Grotesk, the site's display face, for headlines and
 * figures. `sans` is Inter for body. Devanagari sits behind both, so a Hindi
 * caption falls through to Noto Sans Devanagari without the layout shifting.
 * `deva` is the brand's own Devanagari face and is used for the कवच mark alone.
 */
export const FONT_DISPLAY = '"Space Grotesk", Inter, "Noto Sans Devanagari", system-ui, sans-serif';
export const FONT_SANS = 'Inter, "Noto Sans Devanagari", system-ui, sans-serif';
export const FONT_DEVA = '"Tiro Devanagari Hindi", "Noto Sans Devanagari", "Space Grotesk", serif';

/** The marketing film is portrait, for a phone. Same fps as the tutorials. */
export const FILM = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Vertical layout of the frame, in pixels from the top.
 *
 * The caption band is fixed rather than flowing, because the caption is read
 * while the stage above it is moving — a band that resized per scene would make
 * the viewer's eye chase it. Two lines of 44px Devanagari fit in the band; the
 * script is written to that limit.
 */
export const LAYOUT = {
  progressTop: 46,
  headerTop: 104,
  stageTop: 300,
  stageBottom: 1560,
  captionTop: 1600,
} as const;

export const STAGE_H = LAYOUT.stageBottom - LAYOUT.stageTop;

/** Page background: a light sheet with the navy bleeding in at the edges. */
export const FILM_BG = `radial-gradient(115% 75% at 50% 0%, #FFFFFF 0%, ${brand.paper} 38%, ${brand.paperSunk} 100%)`;

/** The inverted background, for the scenes that carry the brand promise. */
export const FILM_BG_DARK = `radial-gradient(120% 80% at 50% 0%, ${brand.navy800} 0%, ${brand.navy900} 45%, ${brand.navy950} 100%)`;

/** Elevation, matched to the site's `shadow-card` / `shadow-lift`. */
export const SHADOW_CARD = '0 1px 2px rgba(16,17,51,.04), 0 8px 24px -12px rgba(16,17,51,.12)';
export const SHADOW_LIFT = '0 2px 4px rgba(16,17,51,.06), 0 24px 48px -20px rgba(16,17,51,.28)';
export const SHADOW_GOLD = '0 0 0 1px rgba(245,165,36,.35), 0 18px 50px -16px rgba(245,165,36,.45)';
