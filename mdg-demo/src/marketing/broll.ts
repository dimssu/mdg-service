/**
 * The film's B-roll: one generated photograph per beat.
 *
 * WHY THESE EXIST. The first cut was fifteen diagrams on a navy field. It read
 * as a slide deck — correct, legible, and completely inert, with a third of
 * every frame empty. A dealer scrolling past does not stop for a diagram. He
 * stops for his own forecourt. So every scene now has a photograph behind it,
 * moving slowly, with the diagram floating on top.
 *
 * HOW THEY ARE MADE. `npm run broll` renders each prompt below through Vertex AI
 * (`gemini-2.5-flash-image`) into `public/broll/<id>.png`, skipping any that
 * already exist — same contract as `npm run voice`, so adding a scene costs one
 * image and not fourteen. Veo is not available on this project, so there is no
 * generated video; the motion comes from the camera moves in `kenBurns` below,
 * which is what B-roll under a caption needs anyway.
 *
 * THE RULES EVERY PROMPT FOLLOWS, and why:
 *   - **No readable text, no logos, no brand marks.** The outlets in this film
 *     belong to nobody. A legible OMC mark would be someone else's trademark on
 *     our advertising, and a legible outlet code would be a real dealer's.
 *   - **No recognisable faces.** Silhouettes, backs, hands. A generated face
 *     that resembles a real person is a problem we have no way to detect.
 *   - **Deep blue and amber grade, always.** It is the brand's navy and gold
 *     arriving as light rather than as paint, which is what lets a photograph
 *     sit under a gold card without the frame falling apart.
 *   - **Documentary, not advertising.** Wet concrete and worn edges read as a
 *     real pump. Glossy stock photography reads as a lie, to this audience
 *     especially.
 */

export interface BRollShot {
  /** File name under `public/broll/`, and the key a scene refers to. */
  id: string;
  /** The full text sent to the image model. */
  prompt: string;
  /**
   * Where the interesting part of the frame sits, as fractions of width and
   * height. The camera move eases toward this point, so a shot whose subject is
   * low in frame does not drift off the top behind the caption band.
   */
  focus: { x: number; y: number };
}

/** Appended to every prompt. Kept in one place so a rule cannot drift per shot. */
const HOUSE_STYLE = [
  'Cinematic photograph, vertical 9:16 composition.',
  'Muted deep-blue and warm-amber colour grade, shallow depth of field, 35mm, fine film grain.',
  'Documentary photography, not advertising — real wear, real surfaces, nothing glossy.',
  'ABSOLUTELY NO readable text, NO signage, NO logos, NO brand marks, NO number plates anywhere in frame.',
  'No recognisable faces — people appear only as silhouettes, backs, or hands.',
].join(' ');

function shot(id: string, scene: string, focus: { x: number; y: number }): BRollShot {
  return { id, prompt: `${scene} ${HOUSE_STYLE}`, focus };
}

export const BROLL: BRollShot[] = [
  shot(
    'gate-arrival',
    'A white SUV pulling in through the open gate of a small Indian petrol pump early in the morning, seen from inside the forecourt. Long shadows on wet concrete. A figure in silhouette stands waiting near the office door.',
    { x: 0.5, y: 0.45 },
  ),
  shot(
    'ledger-night',
    'Close on a pair of hands writing figures into a wide ruled paper register on a wooden desk, late at night, lit by a single warm desk lamp. A calculator and a chipped glass of tea beside it. Deep shadow all around.',
    { x: 0.45, y: 0.55 },
  ),
  shot(
    'phone-morning',
    'A smartphone lying face up on the counter of a petrol pump office in the early morning, screen glowing softly and out of focus, warm light from a window falling across the counter. A ledger and a pen beside it.',
    { x: 0.5, y: 0.6 },
  ),
  shot(
    'attendant-register',
    'A petrol pump attendant in uniform, seen from behind, writing into a large register resting on the top of a fuel dispenser. Morning light, the canopy overhead, a second attendant blurred in the background.',
    { x: 0.45, y: 0.5 },
  ),
  shot(
    'forecourt-wide',
    'Wide view of a small Indian petrol pump at golden hour, canopy lit from beneath, two unbranded dispensers, a motorcycle waiting, the road empty beyond. Calm and orderly.',
    { x: 0.5, y: 0.52 },
  ),
  shot(
    'paper-stack',
    'A tall stack of worn paper files and bound registers on a metal office desk, seen close and slightly from above, warm lamplight raking across the edges of the paper. Dust in the air.',
    { x: 0.5, y: 0.5 },
  ),
  shot(
    'file-shelf',
    'Rows of tied cloth-bound document bundles and lever-arch files packed onto steel shelves in a small back office, warm bulb overhead, deep blue shadow between the shelves.',
    { x: 0.5, y: 0.48 },
  ),
  shot(
    'tank-dip',
    'Close on a hand lowering a long brass dip rod into an underground fuel tank opening set into the concrete of a forecourt, early light, the metal lid resting to one side.',
    { x: 0.5, y: 0.55 },
  ),
  shot(
    'calendar-wall',
    'A paper wall calendar hanging on a pale office wall beside a hanging file rack, warm side light, a few dates circled in ink, the corner of a desk in the foreground out of focus.',
    { x: 0.48, y: 0.45 },
  ),
  shot(
    'pump-night',
    'A small Indian petrol pump on a district highway late at night. The canopy tube-lights are on but one dispenser stands dark and unlit; a stray dog on the concrete, a shuttered tea stall at the edge of the plot, palm trees against a deep blue sky. Wet ground reflecting the lights. Nobody working.',
    { x: 0.5, y: 0.5 },
  ),
  shot(
    'tanker-delivery',
    'An Indian fuel tanker lorry parked on a small petrol pump forecourt at dawn, decorated mudflaps and a chrome bumper, its discharge hose run out across the concrete to a tank point set in the ground. A figure in a shirt and lungi crouched in silhouette beside the connection. Dusty light, palm trees behind.',
    { x: 0.5, y: 0.55 },
  ),
  shot(
    'office-counter',
    'The counter of a small petrol pump office seen across it: a cash drawer partly open, a receipt spike, a bundle of paper slips under a stone paperweight, warm afternoon light through a grille window.',
    { x: 0.5, y: 0.55 },
  ),
  shot(
    'phone-call',
    'An Indian petrol pump owner in his fifties in a plain shirt, photographed from BEHIND so his face is completely unseen, standing at the edge of his forecourt with a phone held to his ear, one hand in his pocket, relaxed. Warm evening light, the canopy and a waiting motorcycle out of focus ahead of him.',
    { x: 0.45, y: 0.5 },
  ),
  shot(
    'sunrise-calm',
    'A petrol pump forecourt at sunrise seen from a distance across an empty road, the canopy silhouetted against a wide orange and blue sky, everything still.',
    { x: 0.5, y: 0.4 },
  ),
];

export const BROLL_BY_ID: Record<string, BRollShot> = Object.fromEntries(
  BROLL.map((b) => [b.id, b]),
);

/** Public path (for `staticFile`) of a generated shot. */
export function brollPath(id: string): string {
  return `broll/${id}.png`;
}
