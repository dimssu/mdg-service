import * as React from 'react';

import type { Lang } from '../marketing/film';

import {
  ChapterBlock,
  ClaimBlock,
  CompareBlock,
  FlowBlock,
  ListBlock,
  MissingBlock,
  PhotoBlockView,
  RecapBlock,
  TitleBlock,
  WrongBlock,
} from './blocks';
import type { AnyBlock, BeatArgs } from './types';

/**
 * The ONLY `switch (block.kind)` in the project.
 *
 * Everything else — the driver, the chrome, the audio, the projection to
 * `Tutorial` — is written against the union without caring which member it
 * holds. Keeping the dispatch in one place is what makes adding a thirteenth
 * block a change to two files rather than a search across seventy video
 * definitions.
 *
 * ── THE FOUR THAT DO NOT RENDER YET ────────────────────────────────────────
 *
 * `document`, `appScreen`, `portalScreen` and `custom` each need a REGISTRY
 * behind them — of measured document bands, of mock phone screens with their own
 * exported anchors, of mock portal screens, of retired hand-written stages. Each
 * of those registries is real work and none of it is needed by the social
 * family, which is the family being authored first precisely because it needs no
 * mock screens at all.
 *
 * So they render a visible placeholder rather than throwing or rendering
 * nothing. A missing screen must be impossible to ship by accident: an author
 * who writes an `appScreen` beat today sees a dashed red panel in the Studio the
 * moment they look, and the lint refuses the video. Rendering nothing would let
 * a silent gap reach a voiceover, and throwing would stop the Studio from
 * previewing the eleven beats that ARE finished.
 */
export function BeatBody({ block, args }: { block: AnyBlock; args: BeatArgs & { lang: Lang } }) {
  switch (block.kind) {
    case 'title':
      return <TitleBlock a={args} b={block} />;
    case 'chapter':
      return <ChapterBlock a={args} b={block} />;
    case 'claim':
      return <ClaimBlock a={args} b={block} />;
    case 'compare':
      return <CompareBlock a={args} b={block} />;
    case 'list':
      return <ListBlock a={args} b={block} />;
    case 'flow':
      return <FlowBlock a={args} b={block} />;
    case 'photo':
      return <PhotoBlockView a={args} b={block} />;
    case 'wrong':
      return <WrongBlock a={args} b={block} />;
    case 'recap':
      return <RecapBlock a={args} b={block} />;
    case 'document':
      return <MissingBlock a={args} what={`No document registry entry for “${block.doc}”.`} />;
    case 'appScreen':
      return <MissingBlock a={args} what={`No phone screen registered as “${block.screen}”.`} />;
    case 'portalScreen':
      return <MissingBlock a={args} what={`No portal screen registered as “${block.screen}”.`} />;
    case 'custom':
      return <MissingBlock a={args} what={`No stage registered as “${block.stage}”.`} />;
    default: {
      // Exhaustiveness: adding a block kind without a case here is a compile
      // error, not a blank frame discovered in a render three days later.
      const never: never = block;
      return <MissingBlock a={args} what={`Unhandled block ${JSON.stringify(never)}`} />;
    }
  }
}
