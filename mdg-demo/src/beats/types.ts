import type { Lang } from '../marketing/film';

import type { Family } from './layout';

export type { Family };

/**
 * A video described as DATA — the shape that lets seventy videos exist.
 *
 * ── THE PROBLEM ────────────────────────────────────────────────────────────
 *
 * Each of the twelve videos shipped so far is a bespoke React component. That is
 * why there are twelve. `PointsSystemVideo` is 1,100 lines; `AdminDsrReceipts`
 * is 700. Writing sixty more the same way is months of work, and the quality
 * would fall over long before the count did.
 *
 * The obvious fix — a fully general layout language — is worse. A DSL flexible
 * enough to express anything produces sixty different-looking videos with no
 * family resemblance, and a DSL rigid enough to be consistent produces sixty
 * identical slide decks. A slide deck is the worse failure: a dealer scrolling
 * past does not stop for a slide.
 *
 * ── THE RESOLUTION ─────────────────────────────────────────────────────────
 *
 * A CLOSED set of twelve block kinds. Not a layout language — a vocabulary of
 * twelve genuinely different shapes, each of which knows one job. An author
 * chooses the SEQUENCE, which is the real creative act, and cannot draw. Variety
 * comes from four places, none of them decorative:
 *
 *   · the blocks being different shapes rather than one shape recoloured
 *   · pacing, which is already unfakeable — every beat is exactly as long as its
 *     own voiceover, so a video breathes the way its narrator does
 *   · `hold`, which lets consecutive beats share a stage so a run of them reads
 *     as continuous action rather than as four unrelated cards
 *   · one photograph per beat on the social family, from its own prompt
 *
 * ── THE PART THAT STAYS HAND-WRITTEN ───────────────────────────────────────
 *
 * The mock product screens. A mock screen's whole job is to be mistaken for a
 * screenshot, which is a fidelity claim about a real UI, and the only way to
 * keep that claim true is for a person to look at the real app and copy it. A
 * language general enough to express the seven-day DSR ledger would be a UI
 * framework.
 *
 * A VISIT to a screen has no fidelity claim at all — ring this, type that, tap
 * there — so the visit is declared and the screen is not. That seam is where
 * this system earns its keep.
 */

/** A string that may differ per language. Only the social family uses the object form. */
export type Bi = string | { hi: string; en: string };

export function pick(b: Bi, lang: Lang): string {
  return typeof b === 'string' ? b : b[lang];
}

/**
 * Meaning, not decoration.
 *
 * Colour is bound to what a beat MEANS — a warning is always `risk`, a measured
 * figure always `good`, a typed one always `brand` — so colour varies across a
 * video because the meaning does, which reads as intentional. The rejected
 * alternative was a per-video accent picked by hashing its id, which gives six
 * arbitrary colourways and no reasons, and silently repaints every unrendered
 * video the day somebody edits the ramp.
 */
export type Tone = 'neutral' | 'good' | 'risk' | 'warn' | 'brand';

/** Everything a block is given. Deliberately no `children`, no `style`, no frame. */
export interface BeatArgs {
  /** Frame within this beat. */
  local: number;
  /** Length of this beat, in frames. */
  length: number;
  /** local / length, clamped to 0..1. */
  t: number;
  index: number;
  family: Family;
  lang: Lang;
  tone: Tone;
}

/* ── The twelve ─────────────────────────────────────────────────────────── */

export interface Side {
  head: Bi;
  tone?: Tone;
  rows?: Bi[];
  figure?: Bi;
  note?: Bi;
}

export interface Figure {
  value: number | string;
  prefix?: string;
  suffix?: string;
  /** Count up to the value rather than cutting to it. Numbers only. */
  countUp?: boolean;
}

export type CommonBlock =
  /** Says what this video is, once, at four times the size — then gone.
   *  Mandatory first beat. It is what replaces the old persistent header bar,
   *  and it is the frame the guide site uses as the poster. */
  | { kind: 'title'; role?: 'open' | 'chapter' | 'end'; eyebrow?: Bi; headline: Bi; sub?: Bi }
  /** A number and a few words on a flooded field. Banned under 8 beats, where
   *  it reads as padding rather than as structure. */
  | { kind: 'chapter'; n: number; label: Bi }
  /** ONE figure. Two figures is a `compare`. A figure the narration does not
   *  also speak is forbidden, because the sound-off and sound-on viewers must
   *  receive the same fact. */
  | {
      kind: 'claim';
      figure: Figure;
      label: Bi;
      note?: Bi;
      tone?: Tone;
      viz?: 'none' | 'dots' | 'bar' | 'calendar';
      vizProps?: { total?: number; filled?: number; limit?: number; value?: number; mark?: number };
    }
  /** Two sides. Never three columns — at this width a third column puts the
   *  type under 20px. Never a screen on one side. */
  | { kind: 'compare'; left: Side; right: Side; join?: 'arrow' | 'rails' | 'none'; verdict?: Bi }
  /** A checklist. Max seven, which is the marketing film's own written rule.
   *  Not for prose, and not for causal order — that is `flow`. */
  | {
      kind: 'list';
      title?: Bi;
      items: { text: Bi; sub?: Bi; ok?: boolean; tone?: Tone }[];
      layout?: 'stack' | 'grid';
      hero?: number;
    }
  /** Two to four nodes where the arrows mean "then". If they do not mean
   *  "then", it is a `list`. */
  | {
      kind: 'flow';
      steps: { title?: Bi; body?: Bi; figure?: Bi; tone?: Tone }[];
      arrows?: Bi[];
      direction?: 'row' | 'column';
    }
  /** A real document with its own measured bands, everything but the marked
   *  rows dimmed, and the figures re-typeset below. Never for our own screens. */
  | {
      kind: 'document';
      doc: string;
      marks?: string[];
      callout?: 'rows' | 'advice' | 'note' | 'whole';
    }
  /** The cost of not doing it, in a different register. Exactly one per video,
   *  never the last content beat. Never a real failure of ours. */
  | {
      kind: 'wrong';
      headline?: Bi;
      body?: Bi;
      slots?: { label: Bi; missing?: boolean }[];
      cost?: { figure: Bi; label: Bi };
    }
  /** The whole video at once, as numbered chips — the frame a viewer is meant
   *  to photograph. Mandatory last beat. Introduces nothing new. */
  | { kind: 'recap'; steps: Bi[]; closing?: Bi }
  /** The escape hatch. A REGISTRY REFERENCE, never an inline render function:
   *  a live component inside a data file is exactly how sixty data files turn
   *  back into sixty components. `why` is required and printed by the lint, so
   *  "I could not be bothered" has to be typed out. A second one in the same
   *  video is the signal to promote a thirteenth block, not to raise the cap. */
  | { kind: 'custom'; stage: string; why: string };

/** A photograph carrying one line. Never a number — a figure over a moving
 *  photograph at this size is unreadable on a cheap phone in sunlight. */
export type PhotoBlock = {
  kind: 'photo';
  headline?: Bi;
  chips?: Bi[];
  anchor?: 'top' | 'centre' | 'bottom';
};

/**
 * A visit to a mock screen.
 *
 * NO COORDINATES. `LoginVideo` currently holds `SIGNIN = { x: 195, y: 533 }`,
 * measured by hand against a component that lives in another file, and
 * `Ring.tsx`'s own docblock admits the two drift apart. Here a screen exports
 * the anchors beside the JSX that produces them, and a beat names one — so a
 * renamed anchor is a compile error rather than a pulse hovering over
 * background.
 */
export interface Visit {
  props?: Record<string, unknown>;
  ring?: string;
  tap?: { at: string; pressFrac?: number };
  type?: { anchor: string; text: string };
  scrollY?: number;
  /** Swap the screen partway through the beat — the "and now it has saved"
   *  move that three shipped videos each hand-rolled with a magic frame. */
  cut?: { atFrac: number; screen: string; props?: Record<string, unknown> };
  tone?: Tone;
}

export type AppScreenBlock = { kind: 'appScreen'; screen: string } & Visit;
export type PortalScreenBlock = { kind: 'portalScreen'; screen: string; url?: string } & Visit;

/**
 * WHAT EACH FAMILY MAY CONTAIN — and the commercial rule turned into a type.
 *
 * A social video cannot contain a `portalScreen`. Not "should not": cannot, at
 * compile time. The rule that public material never shows the internal portal is
 * currently a paragraph of prose in `marketing/script.ts`, and prose does not
 * survive a new author in month four. The type does.
 */
export type DealerBlock = CommonBlock | AppScreenBlock;
export type AdminBlock = CommonBlock | PortalScreenBlock;
export type SocialBlock = CommonBlock | PhotoBlock;
export type AnyBlock = CommonBlock | PhotoBlock | AppScreenBlock | PortalScreenBlock;

export interface Beat<B = AnyBlock> {
  /** Unique within the video. Also the audio filename — an unchanged contract. */
  id: string;
  /** The narration. Spoken by ElevenLabs AND burned in as the caption; one
   *  string, so the two can never disagree. */
  say: Bi;
  block: B;
  /** Social only, and required there: the photograph behind this beat. */
  broll?: string;
  brollWeight?: number;
  /**
   * Keep the previous beat's stage and change only what this beat adds.
   *
   * THE SINGLE MOST IMPORTANT FIELD HERE. Without it, twelve beats are twelve
   * unrelated cards and the result is a slide deck no matter how good each card
   * is. With it, a run of screen beats becomes continuous action and a claim
   * that stays put while the narration adds a second sentence reads as thought.
   */
  hold?: boolean;
  emphasis?: 'calm' | 'normal' | 'punch';
  /** Escape hatch for a beat that must hold longer than its voiceover. Normally
   *  derived — see `project.ts`. */
  seconds?: number;
}

interface VideoBase {
  id: string;
  compositionId: string;
  title: Bi;
  subtitle: Bi;
  /**
   * A video that predates this system and keeps its own hand-written stages.
   * Exempt from the vocabulary lints. The eight bespoke videos are never
   * rewritten — rewriting 1,517 lines of good marketing artwork into blocks
   * would take weeks and make the film worse.
   */
  legacy?: boolean;
}

export type DealerVideo = VideoBase & { family: 'dealer'; beats: Beat<DealerBlock>[] };
export type AdminVideo = VideoBase & { family: 'admin'; beats: Beat<AdminBlock>[] };
export type SocialVideo = VideoBase & {
  family: 'social';
  bilingual: true;
  beats: Beat<SocialBlock>[];
};
export type Video = DealerVideo | AdminVideo | SocialVideo;

/** Every block kind, for the lint and the Studio's step labels. */
export const BLOCK_KINDS = [
  'title',
  'chapter',
  'claim',
  'compare',
  'list',
  'flow',
  'photo',
  'document',
  'appScreen',
  'portalScreen',
  'wrong',
  'recap',
  'custom',
] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];
