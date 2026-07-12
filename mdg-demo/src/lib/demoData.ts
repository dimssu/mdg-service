/**
 * Sample roster + work items used to populate the mock screens. Names are in
 * Hindi to match the narration; the work items are taken from the real 66-item
 * staff catalog (`shared/src/data/staffWorkCatalog.ts`) so the points and the
 * split/each behaviour are authentic.
 */

export interface Warrior {
  id: string;
  name: string;
  designation?: string;
  points: number;
}

export type Distribution = 'EACH' | 'SPLIT' | 'PER_UNIT' | 'FLAT';

export interface WorkItem {
  code: string;
  labelHi: string;
  points: number;
  distribution: Distribution;
  /** Hindi domain header the picker groups by. */
  domainHi: string;
  /** A catch-all work — the app demands a written description of what was done. */
  needsNote?: boolean;
}

/** The roster shown on the leaderboard (give-points / split-points videos). */
export const ROSTER: Warrior[] = [
  { id: 'ramesh', name: 'रमेश', designation: 'पंप ऑपरेटर', points: 62 },
  { id: 'suresh', name: 'सुरेश', designation: 'सेल्समैन', points: 48 },
  { id: 'vikram', name: 'विक्रम', designation: 'सफाई कर्मचारी', points: 30 },
];

/** The single warrior added during the add-warrior video. */
export const NEW_WARRIOR: Warrior = {
  id: 'ramesh',
  name: 'रमेश',
  designation: 'पंप ऑपरेटर',
  points: 0,
};

/** Hero task for the give-points video (every doer gets the full points). */
export const WORK_EACH: WorkItem = {
  code: 'du-island-clean',
  labelHi: 'DU आईलैंड की सफाई',
  points: 4,
  distribution: 'EACH',
  domainHi: 'मशीन (DU)',
};

/** Hero task for the split-points video (40 points shared by the doers). */
export const WORK_SPLIT: WorkItem = {
  code: 'sales-building-clean',
  labelHi: 'सेल्स बिल्डिंग और ड्राइव-वे की सफाई',
  points: 40,
  distribution: 'SPLIT',
  domainHi: 'सफ़ाई',
};

/**
 * The catch-all work. Its label says nothing about what was actually done, so the
 * app makes the description mandatory before it can be added to the submission —
 * the one work in the catalog that asks a question back.
 */
export const WORK_OTHER: WorkItem = {
  code: 'other-cleaning-work',
  labelHi: 'अन्य सफाई से जुड़ा काम',
  points: 4.5,
  distribution: 'EACH',
  domainHi: 'सफ़ाई',
  needsNote: true,
};

/** A small, realistic catalog for the work-picker step (step 2). */
export const WORK_CATALOG: WorkItem[] = [
  WORK_SPLIT,
  {
    code: 'toilet-clean',
    labelHi: 'शौचालय की सफाई',
    points: 10,
    distribution: 'SPLIT',
    domainHi: 'सफ़ाई',
  },
  WORK_OTHER,
  WORK_EACH,
  {
    code: 'nozzle-clean',
    labelHi: 'नोज़ल की सफाई',
    points: 2,
    distribution: 'EACH',
    domainHi: 'मशीन (DU)',
  },
  {
    code: 'greet-customer',
    labelHi: 'ग्राहक का स्वागत',
    points: 1,
    distribution: 'EACH',
    domainHi: 'ग्राहक',
  },
];

/** One line of the pending submission panel (warrior + work + points). */
export interface DraftLine {
  warriorId: string;
  warriorName: string;
  labelHi: string;
  /** Shown under the label for an "Other" work — what was actually done. */
  note?: string;
  points: number;
}

/** What the dealer typed to describe the catch-all work. */
export const OTHER_NOTE = 'छत की सफाई की';

/** The draft after one work is added (give-points video). */
export const DRAFT_ONE: DraftLine[] = [
  { warriorId: 'ramesh', warriorName: 'रमेश', labelHi: WORK_EACH.labelHi, points: 4 },
];

/** …and after a second, described, catch-all work joins it. */
export const DRAFT_TWO: DraftLine[] = [
  ...DRAFT_ONE,
  {
    warriorId: 'ramesh',
    warriorName: 'रमेश',
    labelHi: WORK_OTHER.labelHi,
    note: OTHER_NOTE,
    points: 4.5,
  },
];

/** A SPLIT work shared by two warriors — 40 points, 20 each (split-points video). */
export const DRAFT_SPLIT: DraftLine[] = [
  { warriorId: 'ramesh', warriorName: 'रमेश', labelHi: WORK_SPLIT.labelHi, points: 20 },
  { warriorId: 'suresh', warriorName: 'सुरेश', labelHi: WORK_SPLIT.labelHi, points: 20 },
];

/** A full day's draft, ready to be finalised (submit-points video). */
export const DRAFT_FULL: DraftLine[] = [
  ...DRAFT_TWO,
  { warriorId: 'suresh', warriorName: 'सुरेश', labelHi: WORK_SPLIT.labelHi, points: 20 },
];

export const DRAFT_FULL_TOTAL = DRAFT_FULL.reduce((s, l) => s + l.points, 0);

export const DAILY_TARGET = 100;
