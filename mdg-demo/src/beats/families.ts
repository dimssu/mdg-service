import { brand, FONT_DISPLAY, FONT_SANS, PHOTOGRAPHS } from '../marketing/brand';
import { admin as adminTokens } from '../screens/admin/tokens';
import { colors, FONT_FAMILY } from '../theme';

import type { Family } from './layout';
import type { Tone } from './types';

/**
 * PHOTOGRAPHS ARE OFF.
 *
 * The social videos were first built the way the marketing film is built: a
 * generated photograph behind every beat, under a four-stop scrim, with a slow
 * camera push over it. The founder's instruction after seeing the first one was
 * "remove the background images from the videos, keep it plain like it was
 * before" — before meaning the rest of the library, which is flat light paper
 * with the content on it and nothing behind.
 *
 * They were right, and the reason is worth writing down: the tutorials and the
 * social videos are now one library on one page, and a viewer scrolling it
 * should see one series rather than two products. A photograph also fights the
 * thing it sits behind — a white card on a moving picture is legible, but it is
 * never as legible as the same card on paper, and this audience is reading on a
 * cheap phone in daylight.
 *
 * Flipping `PHOTOGRAPHS` back to true restores them everywhere, and the prompts,
 * the images and the camera-move code are all still here — nothing was deleted.
 * Every social video would need re-rendering, which is about a minute each.
 */
export { PHOTOGRAPHS } from '../marketing/brand';

/**
 * What each family looks like — and why they are three deliberate products
 * rather than one product with the logo swapped.
 *
 * All three palettes already exist and each mirrors something real: the dealer
 * one copies the client app, because those videos draw the client app; the admin
 * one copies the ops portal for the same reason; the social one copies the
 * printed brochure and the marketing site, because that film is the brochure in
 * motion. Nothing here is invented. What changes is that "which palette" stops
 * being a decision an author makes per video.
 *
 * ── THE GROUND IS INVERTED ON PURPOSE ──────────────────────────────────────
 *
 * Dealer and admin are dark type on light paper: they show a light application
 * and the eye should go to the screen, not to the frame around it. Social is
 * white type on navy over a photograph, and `marketing/chrome.tsx` already
 * argues the reason — a dealer watches that film outdoors, on a phone, at low
 * brightness, and white on navy survives sunlight far better than the reverse.
 *
 * Two grounds, not one. That single inversion does more to make the families
 * read as distinct than any amount of accent colour would.
 */

export interface FamilyTokens {
  bg: string;
  /** Page ink and its two quieter steps. */
  ink: string;
  inkSoft: string;
  inkFaint: string;
  /** Surface a card sits on, and its hairline. */
  surface: string;
  hairline: string;
  /** Type. `display` carries headlines and figures; `body` carries everything else. */
  display: string;
  body: string;
  /** Caption ink — differs from `ink` on social, which prints on navy. */
  captionInk: string;
  /** Meaning colours. See the note on `Tone` in types.ts: colour follows meaning. */
  tone: Record<Tone, { fg: string; bg: string }>;
  /**
   * The family's accent, in two weights.
   *
   * `accent` is for FILLS — a progress bar, a rule, a numbered chip — where the
   * colour is the shape and contrast against the paper does not have to carry
   * meaning. `accentInk` is for TYPE, and on the social family the two differ:
   * the brand's gold (#F5A524) on near-white paper is about 1.9:1, which is not
   * a contrast ratio, it is a suggestion. Its darker step reads properly and is
   * the same colour family.
   */
  accent: string;
  accentInk: string;
  /** The corner mark's opacity in the top strip. */
  markOpacity: number;
  /** Whether a photograph sits behind every beat. */
  broll: boolean;
  /** Whether this family ships a second language. */
  bilingual: boolean;
}

const dealer: FamilyTokens = {
  bg: `radial-gradient(120% 80% at 50% 0%, #ffffff 0%, ${colors.bg} 45%, #eef0f4 100%)`,
  ink: colors.text,
  inkSoft: colors.textMuted,
  inkFaint: colors.textSubtle,
  surface: colors.surface,
  hairline: colors.border,
  display: FONT_FAMILY,
  body: FONT_FAMILY,
  captionInk: colors.text,
  accent: colors.brand,
  accentInk: colors.brand,
  tone: {
    neutral: { fg: colors.textMuted, bg: colors.surface2 },
    good: { fg: colors.success, bg: colors.successSoft },
    risk: { fg: colors.danger, bg: '#fee2e2' },
    warn: { fg: '#b45309', bg: '#fef3c7' },
    brand: { fg: colors.brand, bg: colors.brandSoft },
  },
  markOpacity: 0.55,
  broll: false,
  bilingual: false,
};

const admin: FamilyTokens = {
  bg: `radial-gradient(110% 90% at 50% 0%, #ffffff 0%, ${colors.bg} 45%, #eef0f4 100%)`,
  ink: adminTokens.text,
  inkSoft: adminTokens.textMuted,
  inkFaint: adminTokens.textSubtle,
  surface: adminTokens.surface,
  hairline: adminTokens.border,
  display: FONT_FAMILY,
  body: FONT_FAMILY,
  captionInk: colors.text,
  accent: adminTokens.brand,
  accentInk: adminTokens.brand,
  // The portal already ships every one of these as a semantic pair, so the
  // admin videos borrow the real thing rather than approximating it — a chip in
  // a walkthrough is the same green as the chip on the screen it is explaining.
  tone: {
    neutral: { fg: adminTokens.neutral, bg: adminTokens.neutralSoft },
    good: { fg: adminTokens.success, bg: adminTokens.successSoft },
    risk: { fg: adminTokens.danger, bg: adminTokens.dangerSoft },
    warn: { fg: adminTokens.warning, bg: adminTokens.warningSoft },
    brand: { fg: adminTokens.brand, bg: adminTokens.brandSoft },
  },
  markOpacity: 0.5,
  broll: false,
  bilingual: false,
};

/**
 * Social: portrait, plain, light — the same paper the rest of the library is on.
 *
 * It keeps two things of its own so it is not simply the dealer family with
 * different words: the display face (Space Grotesk, the brand's) for headlines
 * and figures, and gold as its accent. That is enough to read as its own thing
 * beside a phone tutorial without becoming a second visual language.
 */
const social: FamilyTokens = {
  bg: `radial-gradient(120% 80% at 50% 0%, #ffffff 0%, ${brand.paper} 42%, ${brand.paperSunk} 100%)`,
  ink: brand.ink,
  inkSoft: brand.inkSoft,
  inkFaint: brand.inkMuted,
  surface: '#FFFFFF',
  hairline: brand.hairline,
  display: FONT_DISPLAY,
  body: FONT_SANS,
  captionInk: brand.ink,
  accent: brand.gold400,
  accentInk: brand.gold600,
  tone: {
    neutral: { fg: brand.inkMuted, bg: brand.paperWarm },
    good: { fg: brand.ok, bg: brand.okTint },
    risk: { fg: brand.risk, bg: brand.riskTint },
    warn: { fg: brand.gold600, bg: brand.gold50 },
    brand: { fg: brand.navy700, bg: brand.navy50 },
  },
  markOpacity: 0.6,
  broll: PHOTOGRAPHS,
  bilingual: true,
};

export const FAMILY: Record<Family, FamilyTokens> = { dealer, admin, social };

/**
 * The one place a block asks "what colour is this meaning?".
 *
 * A block never picks a hex. It says `tone: 'risk'` and this decides what risk
 * looks like in the family it happens to be drawn in — which is how one `Card`
 * component ends up with three appearances instead of three components.
 */
export function toneOf(family: Family, tone: Tone = 'neutral') {
  return FAMILY[family].tone[tone];
}
