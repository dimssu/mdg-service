import type { SocialVideo } from '../types';

/**
 * "A zero is a reading" — one dead tank gauge and what it does to a month.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A tank gauge that has stopped working does not report an error. It reports a
 * number, and the number it reports is zero. Nothing anywhere treats that as
 * suspicious, because zero is a perfectly ordinary thing for a tank to contain.
 * Meanwhile the nozzles fed by that tank keep selling, and every one of those
 * sales gets counted. So the arithmetic comes out saying the outlet sold fuel
 * it never had — which reads, at the far end, as fuel appearing from nowhere.
 *
 * The video's whole argument is that a blank and a zero are different things,
 * and that only a person standing on the forecourt can tell them apart. The
 * second half of the same lesson is nozzle-to-tank mapping: a nozzle attributed
 * to the wrong tank, or to none, drains one tank on paper and inflates another,
 * and looks exactly like the first fault.
 *
 * ── WHERE THE NUMBERS COME FROM, AND HOW THEY ARE HANDLED ──────────────────
 *
 * They are measured, at one real outlet, over a real collection window: roughly
 * 8,800 litres sold out of a tank that reported zero every single day; three
 * false "extra stock" alerts of roughly 2,900, 3,700 and 2,400 litres, each one
 * landing within a couple of hundred litres of that same tank's own sales for
 * the day; and one nozzle whose meter had frozen, whose baseline would have
 * injected around a lakh litres of sales that never happened.
 *
 * EVERY FIGURE IS ROUNDED AND NOTHING IDENTIFIES ANYBODY. The outlet is not
 * named, its code is not given, the tank and nozzle numbers are not given, and
 * the operator is not characterised. The lesson is in the shape of the failure,
 * not in whose forecourt it happened on, and a video that lets a viewer work out
 * whose pump this was would be a breach of the only real obligation we have to
 * the dealers who let us look at their data.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * Nothing about what an oil company does with a variation it cannot explain.
 * That consequence is not sourced anywhere in this repository and asserting it
 * would be worse than silence. Nothing about how any of this is watched either
 * — MDG is named for what a dealer gets out of it, never for the method.
 */
export const brokenDip: SocialVideo = {
  id: 'gen-broken-dip',
  compositionId: 'GenBrokenDip',
  family: 'social',
  bilingual: true,
  title: { hi: 'ज़ीरो भी एक रीडिंग है', en: 'A zero is a reading' },
  subtitle: {
    hi: 'एक मरा हुआ गेज पूरा महीना बिगाड़ देता है',
    en: 'One dead tank gauge can wreck a whole month',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'एक टैंक का डिप ज़ीरो दिखा रहा है, और नोज़ल चल रहे हैं।',
        en: 'One tank reads zero on the gauge, and its nozzles are still selling.',
      },
      broll: 'pump-night',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'टैंक', en: 'Tanks' },
        headline: { hi: 'ज़ीरो भी एक रीडिंग है', en: 'A zero is a reading' },
        sub: { hi: 'खाली डिब्बा नहीं', en: 'Not a blank box' },
      },
    },
    {
      id: 'how',
      say: {
        hi: 'बिक्री गिन ली जाती है, पर तेल घटता हुआ दिखता ही नहीं।',
        en: 'The sale gets counted, but the fuel never shows up as going down.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'नोज़ल ने बेचा', en: 'The nozzle sells' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'डिप ज़ीरो', en: 'The dip reads zero' },
            body: { hi: 'रोज़, बिना बदले', en: 'Every day, unchanged' },
            tone: 'risk',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'तेल बढ़ा हुआ लगता है', en: 'The stock looks like a gain' },
            tone: 'risk',
          },
        ],
      },
    },
    {
      id: 'measured',
      say: {
        hi: 'एक पंप पर ऐसे टैंक से करीब 8,800 लीटर बिक गया।',
        en: 'At one pump, about 8,800 litres sold out of a tank reading zero.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'claim',
        figure: { value: 8800, countUp: true, suffix: 'L' },
        label: { hi: 'ज़ीरो बताते टैंक से बिका', en: 'sold from a tank that reported empty' },
        tone: 'risk',
        note: {
          hi: 'गेज हर एक दिन ज़ीरो लिख रहा था',
          en: 'The gauge reported zero every single day',
        },
      },
    },
    {
      id: 'novoice',
      say: {
        hi: 'कहीं कोई लाल बत्ती नहीं जली। ज़ीरो एक जायज़ नंबर है।',
        en: 'Nothing anywhere raised a flag. Zero is a perfectly valid number.',
      },
      broll: 'forecourt-wide',
      hold: true,
      block: {
        kind: 'claim',
        figure: { value: 8800, countUp: true, suffix: 'L' },
        label: { hi: 'ज़ीरो बताते टैंक से बिका', en: 'sold from a tank that reported empty' },
        tone: 'risk',
        note: {
          hi: 'गेज हर एक दिन ज़ीरो लिख रहा था',
          en: 'The gauge reported zero every single day',
        },
      },
    },
    {
      id: 'alerts',
      say: {
        hi: 'नतीजा — तीन बार झूठा अलर्ट कि तेल कहीं से आ गया।',
        en: 'The result: three false alerts saying fuel had appeared from nowhere.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'list',
        title: { hi: 'झूठे "तेल बढ़ गया" अलर्ट', en: 'False "extra stock" alerts' },
        items: [
          {
            text: { hi: 'करीब 2,900 लीटर', en: 'About 2,900 litres' },
            sub: { hi: 'उसी टैंक की उस दिन की बिक्री जितना', en: "Matching that tank's own sales" },
            ok: false,
          },
          {
            text: { hi: 'करीब 3,700 लीटर', en: 'About 3,700 litres' },
            sub: { hi: 'फिर वही, लीटर-दर-लीटर', en: 'The same again, litre for litre' },
            ok: false,
          },
          {
            text: { hi: 'करीब 2,400 लीटर', en: 'About 2,400 litres' },
            sub: { hi: 'तीसरी बार भी वही कहानी', en: 'And a third time, the same story' },
            ok: false,
          },
        ],
      },
    },
    {
      id: 'mapping',
      say: {
        hi: 'दूसरी बात — हर नोज़ल किस टैंक से खींचता है, सही लिखा हो।',
        en: 'The second half: every nozzle must be mapped to the tank it draws from.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'नोज़ल सही जुड़ा', en: 'Nozzle mapped right' },
          tone: 'good',
          rows: [
            { hi: 'बिक्री सही टैंक से घटी', en: 'The sale comes off the right tank' },
            { hi: 'दोनों टैंक साफ़ रहे', en: 'Both tanks stay clean' },
          ],
        },
        right: {
          head: { hi: 'नोज़ल छूटा या ग़लत', en: 'Nozzle missing or wrong' },
          tone: 'risk',
          rows: [
            { hi: 'एक टैंक में कमी', en: 'One tank shows short' },
            { hi: 'दूसरे में बढ़त', en: 'The other shows a gain' },
          ],
        },
        join: 'none',
      },
    },
    {
      id: 'frozen',
      say: {
        hi: 'एक जमा हुआ मीटर एक लाख लीटर की झूठी बिक्री खड़ी कर सकता है।',
        en: 'One frozen meter can invent a lakh litres of sales that never happened.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'मरा हुआ मीटर, ज़िंदा नोज़ल', en: 'Dead meter, live nozzle' },
        body: {
          hi: 'रीडिंग वहीं अटकी रहती है, और अगली गिनती पूरा फ़र्क़ एक ही दिन पर डाल देती है।',
          en: 'The reading sticks, and the next count dumps the whole gap onto a single day.',
        },
        slots: [
          { label: { hi: 'टैंक का गेज', en: 'Tank gauge' }, missing: true },
          { label: { hi: 'नोज़ल का मीटर', en: 'Nozzle meter' }, missing: true },
          { label: { hi: 'नोज़ल किस टैंक का', en: 'Nozzle to tank' } },
        ],
        cost: {
          figure: { hi: '~1,00,000', en: '~100,000' },
          label: { hi: 'लीटर की झूठी बिक्री', en: 'litres of sales that never were' },
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर टैंक और हर नोज़ल को अलग-अलग देखती है।',
        en: 'MDG Services looks at every tank and every nozzle separately.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'मरा हुआ गेज पहले ही दिन पकड़ में',
          en: 'A dead gauge shows up on day one',
        },
        tone: 'brand',
        note: {
          hi: 'रोज़ की रिपोर्ट, हर टैंक की अपनी लाइन',
          en: 'A daily report, one line per tank',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'महीने में एक बार खुद जाकर हर टैंक का गेज देख लीजिए।',
        en: 'Once a month, walk out and check every tank gauge yourself.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर टैंक का डिप रोज़ बदलना चाहिए', en: "Every tank's dip should change every day" },
          { hi: 'लगातार ज़ीरो? गेज मरा हुआ है', en: 'A steady zero means a dead gauge' },
          { hi: 'हर नोज़ल अपने ही टैंक से जुड़ा हो', en: 'Every nozzle mapped to its own tank' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
