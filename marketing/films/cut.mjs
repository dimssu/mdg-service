/**
 * Cuts one of the new films from a mix of sources.
 *
 *   node films/cut.mjs teaser
 *   node films/cut.mjs explainer
 *
 * ── WHY THIS IS SEPARATE FROM build.mjs ────────────────────────────────────
 * The first film rendered every shot itself, so one shot answered to one beat
 * and the filename carried the link. These two films are assembled instead:
 * most of the picture already exists as a Vertex render from the first film,
 * and only the genuinely new material was bought from Google Flow. So the link
 * between a spoken line and the picture over it is a decision, and decisions
 * belong in a file you can read — films/<slug>.edit.json — not in a naming
 * convention.
 *
 * ── THE ONE RULE THE EDIT MUST NEVER BREAK ─────────────────────────────────
 * Every segment is cut to EXACTLY the length of its own spoken line plus a
 * breath. The voice was recorded first and measured, so picture and words
 * cannot drift apart however long the source clip happened to be. `tpad` holds
 * the last frame if a source comes up a frame or two short; a held frame for a
 * twentieth of a second is invisible, a film sliding out of sync with its own
 * narration is not.
 *
 * Flow returns 720p with its own audio. Both are dealt with here: the picture
 * is scaled up to match the 1080p Vertex clips so the cut does not change
 * resolution mid-film, and the audio is dropped because the film carries a
 * recorded Hindi voice.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILMS = path.join(ROOT, 'films');
const CLIPS = path.join(ROOT, 'clips');
const FLOW = path.join(FILMS, 'flow', 'clips');

const GAP = 0.35;
const END_HOLD = 2;
const FPS = 24;
const W = 1080;
const H = 1920;

/* ── REPAIRS APPLIED TO GOOGLE FLOW CLIPS ──────────────────────────────────
 * Two things come back on every Flow render that must not reach a customer.
 *
 * THE MARK. Flow stamps a small grey "Veo" bottom-right of every clip; the
 * setting is locked on in this region. Measured at x 682-705, y 1254-1264 in
 * the 720x1280 source, identical in every clip. `delogo` paints it out by
 * interpolating from the pixels around the box, which on ground, concrete and
 * dark sky leaves nothing visible. This runs BEFORE the upscale, in source
 * coordinates.
 *
 * THE LIVERY. Veo knows what an Indian forecourt looks like and keeps putting
 * an oil company's colours on the canopy — a saturated red-orange band. That
 * breaks the no-other-company's-mark rule. Re-generating did not reliably stop
 * it and the credits ran out, so the band is desaturated in place: the strip is
 * cut out, its colour pulled almost to grey, lifted a little to match the white
 * canopy around it, and laid back. It reads as a shadow line on plain metal.
 * Positions are per clip because the canopy sits in a different place in each. */
const VEO_MARK = 'delogo=x=676:y=1248:w=36:h=24';
/* Flow changed its mark on 22 Sep 2026. Everything generated from then on
   carries a translucent four-point sparkle, larger and further in from the
   corner, instead of the word "Veo". The old delogo box missed it entirely,
   so for a delivery the films went out with the sparkle showing. Each Flow
   clip is listed by which mark it actually carries — checked frame by frame. */
const SPARKLE_MARK = 'delogo=x=572:y=1132:w=56:h=60';
const SPARKLE = new Set(['C02r', 'H1', 'H1n', 'H2', 'H3', 'N12r', 'N2', 'S09r']);
/* The Kavach film animates a Nano Banana still in Frames mode, and the still
   arrives with its own sparkle baked into the pixels. Veo carries it through
   as part of the picture — measured fixed at x 604-648, y 1167-1212 across all
   8 s even under a push-in — and then adds its own "Veo" word at the old spot.
   So every kflow clip loses both. */
const STILL_SPARKLE = 'delogo=x=598:y=1161:w=57:h=58';
/* Every Nano Banana still carries its star at the bottom right (centre 626,1188
   in 720x1280) and Veo adds its word below it. Painting them out left star-
   shaped smudges on sand and blocks on edges (re-check, 29 Sep), so the Kavach
   shots are cropped instead: a 1.1x zoom that keeps the top and the centre and
   loses the bottom 117 px and 33 px each side. The unsparkle pass then only
   paints a star that has wandered into this kept area. */
const KFLOW_CROP = 'crop=654:1163:33:0,';
const markFor = (ref) => {
  /* Kavach Flow shots are cropped (KFLOW_CROP) past the corner where every
     still put the star and Veo puts its word, so neither needs painting. */
  if (ref.startsWith('kflow:')) return [];
  if (!ref.startsWith('flow:')) return [];
  return [SPARKLE.has(ref.slice(5)) ? SPARKLE_MARK : VEO_MARK];
};
/* Signs and marks that have to be painted out rather than merely drained of
   colour, because a desaturated logo is still a logo. delogo fills the box from
   the pixels around it, which works cleanly against sky, concrete or plaster. */
const PATCH = {
  /* H1 is the opening shot of both films, so it gets the closest look. Veo
     dressed its tanker the way real tankers are dressed: a company name in
     Devanagari on the tank, a hazard plate, and two number plates. All of that
     is another company's mark and a real vehicle's registration, neither of
     which may be published. Six boxes, all against sky, steel or dark ground,
     where the interpolation leaves nothing to see. */
  /* The character-locked re-renders put the man in real forecourts, and Veo
     dresses a real forecourt with its real signs. C02r had an oil company's
     name across the background in full; S09r had a Devanagari board and the
     same company's orange-and-blue band. Painted out against defocused
     background, where nothing shows. */
  'flow:C02r': ['delogo=x=248:y=388:w=194:h=146', 'delogo=x=618:y=388:w=100:h=146'],
  'flow:S09r': ['delogo=x=588:y=556:w=130:h=124'],
  // original Vertex renders — 1080x1920
  'clip:S08-alwayson': ['delogo=x=90:y=18:w=330:h=300'],   // a shop sign with a logo and lettering

  /* The replacement opening. The first one showed an attendant holding a
     nozzle with fuel arcing onto wet concrete — the one image a pump owner
     must never see in his own advertisement. This one is dry ground and a
     sealed coupling; its tanker still arrived dressed like a real one. */
  'flow:H1n': [
    'delogo=x=417:y=592:w=42:h=36',    // Devanagari plate on the tank rear
    'delogo=x=556:y=592:w=54:h=58',    // hazard diamond and second plate
    'delogo=x=443:y=711:w=41:h=28',    // number plate
    'delogo=x=541:y=685:w=24:h=28',    // round emblem on the bumper
  ],
  'flow:H1': [
    'delogo=x=652:y=336:w=66:h=132',   // branded signboard over the dispensers
    'delogo=x=1:y=478:w=36:h=50',      // Devanagari on the tank shoulder
    'delogo=x=1:y=592:w=60:h=66',      // hazard plate
    'delogo=x=168:y=542:w=64:h=58',    // company name along the tank
    'delogo=x=6:y=796:w=86:h=52',      // tanker number plate
    'delogo=x=252:y=728:w=40:h=26',    // car number plate behind
  ],
};
/* One clip can carry the colour in more than one place — N1r had it on the
   dispenser flanks AND along the canopy edge, and killing only the first made
   the second obvious. Regions are in the 720x1280 source frame. */
/* Where in a clip to start. Veo puts its worst frames at the END — a hand that
 * drifts wrong at 6s, birds that merge at 7s — and because every segment is cut
 * to the length of its own spoken line, most of those never reach the film
 * anyway. S10r is the exception: its one flaw sits at 3 seconds and the slot
 * needs 4, so that clip starts late instead. Seeking is free; re-generating is
 * not, and the credits are gone. */
const SEEK = { 'flow:S10r': 3.9 };

/* S57's head, measured at the band's height (source rows 478-506) every
   quarter second: [second, left edge, right edge], each the outermost value
   over that quarter second and 0.05 s either side, so a slice never reaches
   his hair or forehead. */
const S57_HEAD = [[0, 310, 423], [0.25, 310, 423], [0.5, 309, 423], [0.75, 309, 424], [1, 309, 429],
  [1.25, 313, 431], [1.5, 320, 431], [1.75, 333, 429], [2, 326, 443], [2.25, 315, 440], [2.5, 293, 407],
  [2.75, 290, 405], [3, 290, 411], [3.25, 300, 416], [3.5, 301, 416], [3.75, 288, 408], [4, 281, 395],
  [4.25, 277, 385], [4.5, 277, 379], [4.75, 278, 383], [5, 282, 387], [5.25, 286, 391], [5.5, 287, 393],
  [5.75, 288, 395], [6, 290, 402], [6.25, 294, 412], [6.5, 305, 415], [6.75, 309, 420], [7, 311, 428],
  [7.25, 318, 433], [7.5, 326, 433], [7.75, 323, 432]];
/* paint boxes over a band from `left` to `right`, either side of a moving head:
   one pair per slice of the track, 5 px clear of it. The track is the widest
   the head gets in each slice, so in most frames a sliver of band shows
   between his hair and the box; a 'warmedge' strip over his hair's outer
   20 px takes that (hair is dark, so it is left alone). Kept to the edges and
   above row 500: over his forehead it would grey the sunlit skin there. */
const aroundHead = (track, { y, h, edgeH, left, right }) => track.flatMap(([t, l, r], i) => {
  const to = track[i + 1]?.[0] ?? 99;
  const edge = (a, b) => ({ x: Math.max(left, a), y, w: Math.min(right, b) - Math.max(left, a), h: edgeH, paint: true, strong: 'warmedge', from: t, to });
  return [
    ...(right > r + 10 ? [{ x: r + 5, y, w: right - r - 5, h, paint: true, strong: 'warm', from: t, to }] : []),
    ...(l - 10 > left ? [{ x: left, y, w: l - 5 - left, h, paint: true, strong: 'warm', from: t, to }] : []),
    edge(r - 20, r + 6),
    ...(l - 6 > left ? [edge(l - 6, l + 20)] : []),
    // the band's soft bottom edge right against his hair, rows below edgeH: outside the hair line only, clear of his temples
    { ...edge(r - 2, r + 6), y: y + edgeH, h: h - edgeH },
    ...(l - 6 > left ? [{ ...edge(l - 6, l + 2), y: y + edgeH, h: h - edgeH }] : []),
  ];
});

const LIVERY = {
  /* Act 1 originals, found by the Gemini watch pass: a wall lettered "Dealer
     Office" behind him in P05, and in P06 the same words on a board plus a
     canopy in an oil company's blue with an orange stripe. The lettering is
     blurred rather than painted out because his shoulder and hair pass right
     beside it during the shot. */
  'clip:P05-density-book': [{ x: 945, y: 488, w: 133, h: 236, lift: 0, blur: 14 }],
  'clip:P06-supply-blocked': [
    { x: 0, y: 0, w: 900, h: 450, paint: true },
    { x: 524, y: 650, w: 182, h: 50, lift: 0, blur: 10 },
  ],
  'flow:H1n': [{ x: 400, y: 420, w: 250, h: 262, lift: 0 }],   // tank-rear outline; tail lights left red
  /* The shots brought in on 24 Sep to replace a dealer who swayed, stared or
     walked off for no reason. Each arrived with the same blue-and-red canopy
     fascia. S03 also stands him in front of a board reading "Dealer Office";
     it is left as it is — a generic label, not anyone's mark — because his
     head crosses it from 1.5 s and a fixed blur would sit on his hair, and a
     blur that switches off mid-shot is worse than the words. S05 swings a
     blue pillar sign into frame at 3.8 s. P03 had its fascia in the delivered teaser
     all along; nobody had boxed it. */
  'clip:C02-managers-pump': [{ x: 0, y: 16, w: 1080, h: 362, paint: true }],
  'clip:S03-stock': [{ x: 0, y: 0, w: 1080, h: 260, paint: true }],
  'clip:S05-supply': [
    { x: 0, y: 0, w: 1080, h: 200, paint: true },
    { x: 860, y: 590, w: 220, h: 300, paint: true },
  ],
  'clip:P03-stock-plus-minus': [{ x: 600, y: 0, w: 480, h: 200, paint: true }],
  // original Vertex renders — 1080x1920; the blue-and-red fascia across the top
  'clip:S01-dates':    [{ x: 0,   y: 0, w: 1080, h: 392, lift: 0.06 }],
  'clip:S08-alwayson': [{ x: 800, y: 0, w: 280,  h: 150, paint: true }],
  'clip:S09-mdg-turn': [{ x: 0,   y: 0, w: 1080, h: 150, lift: 0.06 }],
  'flow:S10r': [{ x: 0, y: 566, w: 720, h: 50, lift: 0.04 }],
  'flow:C02r': [{ x: 0, y: 490, w: 340, h: 96, lift: 0.03 }],   // canopy band beside the painted-out sign
  /* Kavach dealer shots, 29 Sep, found by the still reviewers. S33's window
     shows an orange fascia and two small blue boards on the buildings behind
     the pump; S32 a blue band on a board behind the pillar. Paint mode greys
     only the coloured pixels, so the boxes can be generous. S20 has a near-
     legible label on a register spine just above his hand — blurred, not
     painted, because it is cream, not a brand colour. */
  'kflow:S33': [
    { x: 500, y: 450, w: 100, h: 60, paint: true },
    { x: 236, y: 455, w: 54, h: 40, paint: true },
  ],
  'kflow:S32': [
    { x: 200, y: 600, w: 80, h: 60, paint: true },
    { x: 0, y: 440, w: 80, h: 170, paint: true },     // blue sign with a red emblem on the left pillar (final watch)
  ],
  /* Through the cabin window: S28 has a teal round badge on the canopy corner
     and a red-white-blue block at a dispenser base; S06 a red crescent on the
     canopy fascia. Paint mode greys only those colours, so the boxes cover the
     whole window view and stop short of the faces. */
  'kflow:S28': [
    // stops at x 280 / y 668: his hair reaches x 282 early on, and his elbow
    // sits at y 700-840, where the old 345x760 box greyed his skin
    { x: 0, y: 80, w: 280, h: 668, paint: true },
    /* The badge and the dispenser-base block are pale enough that paint mode
       only half-greyed them, and plain grey boxes there (the 29 Sep fix) left
       two grey rectangles on the cream window frame. `strong` paint takes the
       paler teal too and still leaves cream alone. The badge only shows once
       he has turned away (4.5 s on); before that his head is where it would
       be, so its box is limited to those seconds. */
    { x: 284, y: 262, w: 28, h: 66, paint: true, strong: 'blue', from: 4.3 },
    { x: 262, y: 596, w: 44, h: 62, paint: true, strong: 'blue' },
  ],
  'kflow:S06': [
    { x: 470, y: 0, w: 250, h: 370, paint: true },
    /* the pale pink crescent at the window's right edge. It was a plain grey
       box, which left a grey strip on the canopy; this one stays on the glass
       (x < 680, the frame starts there) and drains only the pink */
    { x: 654, y: 112, w: 26, h: 64, paint: true, strong: 'red' },
  ],
  'kflow:S20': [{ x: 140, y: 770, w: 104, h: 24, lift: 0, blur: 4 }],
  // S69 (v2): small blue and orange stickers on the dispensers behind the attendant
  'kflow:S69': [{ x: 400, y: 640, w: 287, h: 130, paint: true }],
  /* S57 (v2 final watch): through the window behind his head, an orange band
     (with a thin navy line on top) on the forecourt building, and orange/navy
     kerb blocks below. His whole face scores on the red test here (warm,
     backlit skin) and his forehead sits at the band's height, so the band is
     drained only either side of his head, in quarter-second slices that follow
     it (see S57_HEAD). */
  'kflow:S57': [
    ...aroundHead(S57_HEAD, { y: 472, h: 36, edgeH: 28, left: 298, right: 466 }),
    ...S57_HEAD.map(([t, , r], i) => ({ x: Math.max(r + 5, 412), y: 566, w: 575 - Math.max(r + 5, 412), h: 36,
      paint: true, strong: 'warm', from: t, to: S57_HEAD[i + 1]?.[0] ?? 99 })),     // kerb right of him (rows 566-602: below that is his shirt's shoulder, which the warm test greys); his hand at his chin reaches x 405
    { x: 175, y: 562, w: 100, h: 48, paint: true, strong: 'warm' },                 // kerb left of him
  ],
  /* S59 (v2): the dispenser in the right-hand window has blue swooshes, an
     orange panel and a red block, under a red canopy band. From 4.95 s his
     forearm hangs down through the window's left part, so there only blue is
     drained and the band above his hand keeps full paint. */
  'kflow:S59': [
    { x: 575, y: 440, w: 115, h: 180, paint: true, to: 4.95 },
    { x: 628, y: 440, w: 62, h: 180, paint: true, from: 4.95 },
    // the band above his hand: full paint only once his forearm has swung down past it (its tip is still here at 5.17 s); blue only before
    { x: 575, y: 440, w: 53, h: 62, paint: true, from: 5.2 },
    { x: 575, y: 440, w: 53, h: 62, paint: true, strong: 'blueonly', from: 4.95, to: 5.2 },
    { x: 575, y: 502, w: 53, h: 118, paint: true, strong: 'blueonly', from: 4.95 },
    /* re-check: the dispenser's pale salmon panel (red test only 0.09-0.17, too
       pale for plain paint) and a pink mark beside it; his arm covers them from 4.95 s */
    { x: 586, y: 578, w: 44, h: 35, paint: true, strong: 'red', to: 5.25 },
    // from 5.3 s his forearm is in that box; the panel (luminance 190+) still shows beside it, his skin is under 175
    { x: 586, y: 578, w: 44, h: 35, paint: true, strong: 'redbright', from: 5.25 },
    // the blue canopy band's end just right of his shoulder, and the swoosh's left tip; blue only, so his arm is safe
    { x: 532, y: 455, w: 43, h: 25, paint: true, strong: 'blueonly' },
    { x: 560, y: 480, w: 15, h: 140, paint: true, strong: 'blueonly' },
  ],
  /* S62 (v2): a maroon patch at the right end of the canopy fascia, in a navy
     night sky. Red test only, so the sky stays blue; on from 4.6 s, when his
     head has left the spot (before that it covers the patch). */
  'kflow:S62': [{ x: 365, y: 400, w: 30, h: 55, paint: true, strong: 'redonly', from: 4.6 }],
  'flow:N1r': [
    { x: 100, y: 600, w: 560, h: 340, lift: 0 },     // dispenser flanks
    { x: 0, y: 272, w: 720, h: 46, lift: 0.02 },     // canopy edge
  ],
};

/* PAINT: grey out only oil-company paint — blue, and the red stripe under it —
   pixel by pixel, and leave every neutral pixel untouched. A plain box drains
   the sky inside it as well, and a grey rectangle of sky beside a warm one is a
   seam the eye finds at once. Measured on the four clips that needed it:
     blue fascia   (b-r)/b  0.37-0.63      red stripe  (r-g)/r  0.38-0.42
     sky, canopy   (b-r)/b  <0.05          underside   (r-g)/r  0.14-0.18
   so each test ramps in over a gap no neutral surface reaches. Skin scores 0.26
   on the red test, so a paint box must still stay off his face. */
const PX = (c) => `${c}(X\\,Y)`;
const PAINT_W = `max(clip(((${PX('b')}-${PX('r')})/(${PX('b')}+1)-0.12)/0.10\\,0\\,1)\\,` +
                `clip(((${PX('r')}-${PX('g')})/(${PX('r')}+1)-0.25)/0.08\\,0\\,1))`;
const PAINT_L = `(0.299*${PX('r')}+0.587*${PX('g')}+0.114*${PX('b')}+12)`;
const PAINT = 'format=gbrp,geq=' + ['r', 'g', 'b']
  .map((c) => `${c}=${PX(c)}+(${PAINT_L}-${PX(c)})*${PAINT_W}`).join(':');
/* `strong` paint, for a small box over a PALE mark that the tests above only
   half-catch. 'blue' ramps the blue test in from 0.03 (S28's teal badge);
   'red' ramps the red test in from 0.06 (S06's pink crescent). Only safe in a
   box that holds nothing neutral but sky or white canopy: the cream window
   frame scores 0.09-0.21 on the red test, sand and skin higher. */
/* 'blueonly' and 'redonly' run just one of the two tests: 'blueonly' for a
   box his forearm passes through (skin never scores on the blue test),
   'redonly' for a red patch in a navy night sky, which the blue test would
   grey into a rectangle. */
const BLUE_T = `clip(((${PX('b')}-${PX('r')})/(${PX('b')}+1)-0.12)/0.10\\,0\\,1)`;
const WARM_T = `clip(((${PX('r')}-${PX('g')})/(${PX('r')}+1)-0.09)/0.06\\,0\\,1)`;
const PAINT_ONE = (test) => 'format=gbrp,geq=' + ['r', 'g', 'b']
  .map((c) => `${c}=${PX(c)}+(${PAINT_L}-${PX(c)})*${test}`).join(':');
const PAINT_STRONG = {
  blue: PAINT.replace('-0.12)/0.10', '-0.03)/0.06'),
  red: PAINT.replace('-0.25)/0.08', '-0.06)/0.06'),
  blueonly: PAINT_ONE(`clip(((${PX('b')}-${PX('r')})/(${PX('b')}+1)-0.12)/0.10\\,0\\,1)`),
  redonly: PAINT_ONE(`clip(((${PX('r')}-${PX('g')})/(${PX('r')}+1)-0.25)/0.08\\,0\\,1)`),
  /* 'warm' and 'warmedge', for S57's fascia band and planters. The plain red
     test starts at 0.25 and leaves the band's soft rim (0.11-0.14) orange; these
     start at 0.09, above the cream wall (0.02-0.08) and pale ground (0.02-0.07),
     and add the blue test for the thin navy line on the band. 'warmedge' also
     needs the pixel to be bright (luminance 140+): it runs along his hair, which
     is dark, and must never take the skin at his hairline. */
  redbright: PAINT_ONE(`clip(((${PX('r')}-${PX('g')})/(${PX('r')}+1)-0.06)/0.06\\,0\\,1)*clip((${PAINT_L}-185)/10\\,0\\,1)`),
  warm: PAINT_ONE(`max(${BLUE_T}\\,${WARM_T})`),
  warmedge: PAINT_ONE(`max(${BLUE_T}\\,${WARM_T}*clip((${PAINT_L}-140)/15\\,0\\,1))`),
};

const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'pipe' });
const probe = (f) =>
  Number(String(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nk=1:nw=1', f])).trim());

/** "clip:S02-dsr" → clips/S02-dsr.mp4 ; "flow:N4" → films/flow/clips/N4.mp4 */
/**
 * Three kinds of source now.
 *   clip: a Vertex render from the first film
 *   flow: a Google Flow generation
 *   gfx:  a designed, animated panel — the answer for every beat that is
 *         really a fact rather than a human moment. A drawn card cannot look
 *         fake, because it is not pretending to be a photograph.
 */
export function resolve(ref) {
  const [kind, name] = ref.split(':');
  if (kind === 'clip') return path.join(CLIPS, `${name}.mp4`);
  if (kind === 'flow') return path.join(FLOW, `${name}.mp4`);
  if (kind === 'gfx') return path.join(FILMS, 'graphics', 'clips', `${name}.mp4`);
  /* the Kavach film keeps its own footage and panels apart from the first
     three films, so its asset ids (S01, D01…) never collide with theirs */
  if (kind === 'kflow') {
    /* flow-kavach/unsparkle.py writes a copy with the generator's star followed
       and painted out; prefer it when it exists */
    const clean = path.join(FILMS, 'flow-kavach', 'clips-clean', `${name}.mp4`);
    return existsSync(clean) ? clean : path.join(FILMS, 'flow-kavach', 'clips', `${name}.mp4`);
  }
  if (kind === 'kgfx') return path.join(FILMS, 'graphics-kavach', 'clips', `${name}.mp4`);
  throw new Error(`unknown source "${ref}" — use clip:, flow:, gfx:, kflow: or kgfx:`);
}

/**
 * One segment: a window of one source, repaired in its own pixel space, fitted
 * to exactly `slot` seconds.
 *
 * ── HOW A SHOT IS FITTED TO ITS LINE ──────────────────────────────────────
 * Veo fills every second it is given with SOME movement, and a viewer reads
 * every movement as meaning something. A dealer who flicks his hand at nothing,
 * or looks up from his phone to stare at no one, is the shot the eye remembers.
 * The fix is almost never a new clip: it is choosing which seconds play.
 *
 *   from       start this many seconds into the source (skip a bad opening)
 *   to         stop here, and STRETCH the window to fill the slot, so a
 *              calm 5.6 s of a clip can cover a 7 s line without reaching the
 *              stare at 5.8 s. Kept to at most ~1.3x: slower than that a
 *              person starts to look drugged.
 *   still/push a last resort — hold one frame and push in slowly. A frozen
 *              person looks like a photograph, so this only suits a beat that
 *              is a held look anyway.
 */
export function renderSegment({ ref, src, slot, out, from = 0, to, still, push = 1.06, label = ref, nframes, frame, blend }) {
  const have = probe(src);
  const start = from + (SEEK[ref] ?? 0);
  const span = to != null ? to - start : have - start;
  const stretch = to != null ? slot / span : 1;
  if (to == null && span + 0.05 < slot && still == null) {
    console.log(`  ! ${label} ${ref} has ${span.toFixed(1)}s for a ${slot.toFixed(1)}s slot — holding the last frame`);
  }
  if (stretch > 1.35) console.log(`  ! ${label} ${ref} stretched ${stretch.toFixed(2)}x — check it does not look slowed`);
  /* Every source is repaired in its OWN pixel space, then scaled to the
     frame. Flow clips are 720x1280 and carry the Veo mark; the original
     Vertex renders are 1080x1920 with no mark, but they were made before
     the livery rule was enforced and several carry an oil company's
     blue-and-red canopy band, or a real shop sign. Region coordinates in
     LIVERY and PATCH are therefore in each clip's own resolution. */
  const frames = nframes ?? Math.round(slot * FPS);
  const time = still != null
    /* one frame, pushed in on a 4x canvas so the zoom moves in sub-pixel steps
       rather than juddering a whole pixel at a time */
    ? `scale=${W * 4}:${H * 4},zoompan=z='1+(${push}-1)*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},`
    : stretch !== 1 ? `setpts=${stretch.toFixed(5)}*PTS,` : '';
  /* `frame` (w:h:x:y in the clip's own pixels, 9:16) replaces the standard
     crop for one use of a shot: to leave out something at the frame's edge
     (S05's torn hems) or to cut in closer on the same take so a join between
     two windows reads as a cut, not a jump (S49). */
  const reframe = frame ? `crop=${frame},` : ref.startsWith('kflow:') ? KFLOW_CROP : '';
  /* `blend`: a slowed window gets its in-between frames by motion
     interpolation instead of repeating every 8th-9th frame, which reads as a
     hitch on a moving hand (the short's hook, 1.13x). Off by default: on fast
     or busy motion it can warp, so it is switched on per shot after a look. */
  const rate = blend && still == null && stretch !== 1
    ? `minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1` : `fps=${FPS}`;
  const tail = `${reframe}scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},${time}` +
               `tpad=stop_mode=clone:stop_duration=3,${rate}`;
  const at = still != null ? still + (SEEK[ref] ?? 0) : start;
  const args = at ? ['-ss', String(at), '-i', src] : ['-i', src];
  const bands = LIVERY[ref];
  const marks = [...markFor(ref), ...(PATCH[ref] ?? [])];
  const pre = marks.length ? `${marks.join(',')},` : '';
  const head = still != null ? 'trim=end_frame=1,' : '';
  if (bands) {
    /* Each region is cut out, drained of colour and laid back, one after the
       other, before marks are painted out and the picture is scaled. */
    const steps = [`[0:v]${head}split=${bands.length + 1}[b0]${bands.map((_, i) => `[t${i}]`).join('')}`];
    bands.forEach((b, i) => {
      /* `soft` keeps the colours and only blurs: generated lettering on a book
         spine that has no colour to drain */
      const drain = b.paint ? (PAINT_STRONG[b.strong] ?? PAINT) : b.soft ? 'null' : `hue=s=0.10,eq=brightness=${b.lift}`;
      steps.push(`[t${i}]crop=${b.w}:${b.h}:${b.x}:${b.y},${drain}${b.blur ? `,boxblur=${b.blur}` : ''}[x${i}]`);
      /* `from`/`to` limit a region to the seconds it is needed, in the source
         clip's own time — a sign that is only readable until his head passes
         in front of it should not leave a blurred box over his hair after. */
      /* a held frame is one frame at t 0, taken at `at`, so it is measured from there */
      const base = still != null ? at : start;
      const when = b.from != null || b.to != null
        ? `:enable='between(t,${(b.from ?? 0) - base},${(b.to ?? 99) - base})'` : '';
      steps.push(`[b${i}][x${i}]overlay=${b.x}:${b.y}${when}[b${i + 1}]`);
    });
    steps.push(`[b${bands.length}]${pre}${tail}[v]`);
    args.push('-filter_complex', steps.join(';'), '-map', '[v]');
  } else {
    args.push('-vf', `${head}${pre}${tail}`);
  }
  ff([...args,
      '-frames:v', String(frames),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
      '-pix_fmt', 'yuv420p', '-an', out]);
  return { stretch, span };
}

function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error('usage: node films/cut.mjs <teaser|explainer>');
  /* DRAFT=1 cuts the film with whatever exists: a source not made yet becomes
     a plain grey card of the right length, so the timing of everything around
     it can be watched before the last shots arrive. Written to a separate
     -draft file so it is never mistaken for the film. */
  const draft = process.env.DRAFT === '1';

  const { beats } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.json`), 'utf8'));
  const voice = JSON.parse(readFileSync(path.join(ROOT, `voice-${slug}`, 'voice.json'), 'utf8'));
  const { map } = JSON.parse(readFileSync(path.join(FILMS, `${slug}.edit.json`), 'utf8'));

  const WORK = path.join(ROOT, '.work', slug);
  mkdirSync(WORK, { recursive: true });

  /* Build the row list first and report every hole before touching ffmpeg, so a
     missing Flow download is one clear message rather than a crash halfway in. */
  const rows = [];
  const missing = [];
  for (const b of beats) {
    const refs = [].concat(map[b.id] ?? []);
    if (!refs.length) { missing.push(`${b.id}: no source in the edit map`); continue; }
    /* the last line gets END_HOLD more picture (and silence), so the closing
       card with the website is not cut off 0.8 s after the last word */
    const whole = voice[b.id].seconds + GAP + (b === beats[beats.length - 1] ? END_HOLD : 0);
    /* A part may name its own length ("seconds") — 3 s of him, then 4 s of the
       paper he is reading. Parts that do not share what is left evenly, and
       the last part absorbs rounding so the picture never drifts off the voice. */
    const named = refs.reduce((t, e) => t + (typeof e === 'object' && e.seconds ? e.seconds : 0), 0);
    const open = refs.filter((e) => !(typeof e === 'object' && e.seconds)).length;
    let used = 0;
    for (const [i, entry] of refs.entries()) {
      /* an entry is either "clip:S08-alwayson" or
         { "ref": "clip:S08-alwayson", "from": 0, "to": 5.6, "seconds": 3 } — see renderSegment */
      const shot = typeof entry === 'string' ? { ref: entry } : entry;
      const last = i === refs.length - 1;
      const slot = last ? whole - used : shot.seconds ?? (whole - named) / open;
      used += slot;
      const src = resolve(shot.ref);
      const part = refs.length > 1 ? i + 1 : 0;
      if (!existsSync(src)) {
        missing.push(`${b.id}: ${shot.ref} not on disk`);
        if (draft) rows.push({ ref: shot.ref, beat: b.id, slot, part, pending: true });
        continue;
      }
      rows.push({ ...shot, beat: b.id, src, slot, part });
    }
  }
  if (missing.length && !draft) {
    console.log('\n  cannot cut yet:');
    for (const m of missing) console.log(`    · ${m}`);
    console.log('');
    process.exit(1);
  }
  if (missing.length) console.log(`\n  draft: ${missing.length} segment(s) shown as grey cards`);

  console.log(`\n  ${slug} · ${beats.length} beats · ${rows.length} segments\n`);

  const segs = [];
  /* A segment is re-cut only when what it is made from changed: its
     settings, its length, or the source file. A 20-minute film has ~200 of
     them, and most edits touch two or three. */
  /* Frames are counted off the running total, not per segment: 225 segments
     each rounded on their own came out 9 frames short over 20 minutes, and
     the voice ran 0.37 s late by the last chapter. Each cut now lands within
     half a frame of where the voice says it should. */
  let reused = 0;
  let clock = 0;
  for (const r of rows) {
    r.nframes = Math.round((clock + r.slot) * FPS) - Math.round(clock * FPS);
    clock += r.slot;
    const out = path.join(WORK, `v-${r.beat}${r.part ? `-${r.part}` : ''}.mp4`);
    const { src, beat, part, ...settings } = r;
    /* the clean-up boxes are part of the picture: a box moved in LIVERY or
       PATCH must rebuild that shot, not quietly reuse the old render */
    const boxes = { ...(LIVERY[r.ref] && { livery: LIVERY[r.ref] }), ...(PATCH[r.ref] && { patch: PATCH[r.ref] }) };
    const key = JSON.stringify({ ...settings, ...boxes, mark: r.pending ? 0 : statSync(src).mtimeMs, v: 2 });
    const keyFile = `${out}.key`;
    if (existsSync(out) && existsSync(keyFile) && readFileSync(keyFile, 'utf8') === key) {
      reused++;
    } else if (r.pending) {
      ff(['-f', 'lavfi', '-i', `color=c=0x2a2a2a:s=${W}x${H}:r=${FPS}`, '-frames:v', String(r.nframes),
          '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', out]);
      writeFileSync(keyFile, key);
    } else {
      renderSegment({ ...r, out, label: r.beat });
      writeFileSync(keyFile, key);
    }
    segs.push(out);
  }
  if (reused) console.log(`  ${reused} unchanged segment(s) reused`);

  writeFileSync(path.join(WORK, 'v.txt'), segs.map((f) => `file '${f}'`).join('\n') + '\n');

  /* Voice: the same slots in the same order, so the two cannot disagree.
     Each line is cleaned first. 107 of the 127 Kavach voice files end on a
     click: a 30-50 ms burst about 60 ms before the end of the file, alone after
     the last word (K903 and K908 peak at -10 dBFS — a tick on headphones before
     the next line). Reversed, `silenceremove` with start_duration 0.08 treats
     any sound shorter than 80 ms as silence, so it trims the burst and stops at
     the last real syllable; the line is then padded back to its exact decoded
     sample count, so no line gets shorter and the voice cannot drift off the
     picture. Measured over all 127 lines: at most 39 ms of sound removed from
     any one, never speech. A 10 ms fade-in covers the other end. */
  const silence = (name, secs) => ff(['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', String(secs),
    '-c:a', 'pcm_s16le', path.join(WORK, name)]);
  silence('gap.wav', GAP);
  silence('end.wav', END_HOLD);
  const VF = path.join(WORK, 'voice-faded');
  mkdirSync(VF, { recursive: true });
  const auds = [];
  for (const b of beats) {
    const raw = path.join(ROOT, `voice-${slug}`, `${b.id}.mp3`);
    const faded = path.join(VF, `${b.id}.wav`);
    if (!existsSync(faded) || statSync(faded).mtimeMs < statSync(raw).mtimeMs) {
      const samples = execFileSync('ffmpeg', ['-v', 'error', '-i', raw, '-ac', '1', '-ar', '44100', '-f', 's16le', '-'],
        { maxBuffer: 1 << 28 }).length / 2;
      ff(['-i', raw, '-af', 'aresample=44100,areverse,' +
          'silenceremove=start_periods=1:start_duration=0.08:start_threshold=-55dB:start_silence=0.05,' +
          `areverse,afade=t=in:d=0.01,apad=whole_len=${samples},atrim=end_sample=${samples}`,
          '-ac', '1', '-c:a', 'pcm_s16le', faded]);
    }
    auds.push(faded);
    auds.push(path.join(WORK, 'gap.wav'));
  }
  auds.push(path.join(WORK, 'end.wav'));
  writeFileSync(path.join(WORK, 'a.txt'), auds.map((f) => `file '${f}'`).join('\n') + '\n');

  const vcat = path.join(WORK, 'video.mp4');
  const acat = path.join(WORK, 'audio.mp3');
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'v.txt'), '-c', 'copy', vcat]);
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'a.txt'),
      '-ar', '44100', '-ac', '1', '-b:a', '128k', acat]);

  /* Loudness. The voice files sit around -23 LUFS, a broadcast level: on a
     phone speaker in a forecourt that is too quiet, and nothing on the way to
     a dealer's phone turns it up (WhatsApp plays files as they are). Two-pass
     loudnorm to -16 LUFS with the true peak kept under -2 dB (AAC then adds about 1.5 dB of overshoot: -1.5 measured -0.4 in the final file). The first pass
     measures; the second applies one steady gain when the peaks leave room for
     it, and otherwise (Kavach: -22.9 LUFS with peaks at -1.7 dB, so +6.9 dB
     would clip) loudnorm's own gentle levelling, which on a single narrator
     does not audibly pump. */
  const pass1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', acat, '-af',
    'loudnorm=I=-16:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const meas = JSON.parse(pass1.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
  const LOUD = `loudnorm=I=-16:TP=-2:LRA=11:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}` +
    `:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}:offset=${meas.target_offset}:linear=true,aresample=44100`;

  const out = path.join(FILMS, `mdg-${slug}${draft ? '-draft' : ''}.mp4`);
  ff(['-i', vcat, '-i', acat,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-af', LOUD,
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest',
      '-bsf:v', 'h264_metadata=sample_aspect_ratio=1/1', out]);

  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  console.log(`  picture ${mmss(probe(vcat))} · voice ${mmss(probe(acat))} · film ${mmss(probe(out))}` +
    ` · ${(statSync(out).size / 1e6).toFixed(1)} MB`);
  console.log(`  → ${path.relative(ROOT, out)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
