import { dodClock } from './social/dodClock';
import type { Video } from './types';

/**
 * Every video described as data.
 *
 * `narration.ts` projects these into `Tutorial`s and appends them to `TUTORIALS`,
 * so `npm run voice`, `npm run render`, `npm run stills` and the guide site's
 * chapter labels all pick them up with no further wiring. The twelve
 * hand-written videos stay exactly where they are and are untouched by any of
 * this.
 */
export const DECLARED: Video[] = [dodClock];

/**
 * Videos by id, for the composition to resolve itself from.
 *
 * A composition receives a `videoId` string rather than the video object,
 * because `calculateMetadata` REPLACES a composition's props with what it
 * returns — so anything passed only through `defaultProps` is gone by the time
 * the component renders. The shipped videos already solve this by closing over
 * `TUTORIAL_BY_ID`; this is the same move, and it keeps a large object out of
 * the props Remotion has to serialise.
 */
export const VIDEO_BY_ID: Record<string, Video> = Object.fromEntries(
  DECLARED.map((v) => [v.id, v]),
);
