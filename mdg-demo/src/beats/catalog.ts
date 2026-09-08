import { brokenDip } from './social/brokenDip';
import { costOfALitre } from './social/costOfALitre';
import { cumulativeColumn } from './social/cumulativeColumn';
import { dailyBooks } from './social/dailyBooks';
import { decantation } from './social/decantation';
import { declarations } from './social/declarations';
import { densityAt15 } from './social/densityAt15';
import { dipSettle } from './social/dipSettle';
import { dodClock } from './social/dodClock';
import { duSeals } from './social/duSeals';
import { equipmentAudit } from './social/equipmentAudit';
import { inspectionWindow } from './social/inspectionWindow';
import { invoiceVsDecant } from './social/invoiceVsDecant';
import { ledgerLines } from './social/ledgerLines';
import { mockDrill } from './social/mockDrill';
import { plusVsMinus } from './social/plusVsMinus';
import { proveTheMeter } from './social/proveTheMeter';
import { shiftClose } from './social/shiftClose';
import { staffRewards } from './social/staffRewards';
import { stockVariation } from './social/stockVariation';
import { supplyConditions } from './social/supplyConditions';
import { tankerDay } from './social/tankerDay';
import { testingLitres } from './social/testingLitres';
import { wallPapers } from './social/wallPapers';
import { waterDip } from './social/waterDip';
import { waterIngress } from './social/waterIngress';
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
export const DECLARED: Video[] = [
  dodClock,
  supplyConditions,
  decantation,
  proveTheMeter,
  declarations,
  dipSettle,
  wallPapers,
  stockVariation,
  brokenDip,
  waterDip,
  densityAt15,
  mockDrill,
  shiftClose,
  testingLitres,
  costOfALitre,
  invoiceVsDecant,
  plusVsMinus,
  cumulativeColumn,
  dailyBooks,
  staffRewards,
  waterIngress,
  ledgerLines,
  inspectionWindow,
  tankerDay,
  equipmentAudit,
  duSeals,
];

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
