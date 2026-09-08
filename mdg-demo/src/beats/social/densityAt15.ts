import type { SocialVideo } from '../types';

/**
 * "The density on the invoice" — the figure that sits between the tanker and
 * the register.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * One habit, in three moves: read the density printed on the tanker's invoice,
 * take your own reading when the load lands, and write both down the same day.
 * The teaching sits on top of a real IndianOil tax invoice we hold, which prints
 * a density per product line corrected to fifteen degrees — 727.300 against the
 * ethanol-blended petrol and 820.500 against the BS-VI diesel — along with the
 * tank, compartment and sample numbers for that line. Those two figures are
 * shown as WHAT ONE INVOICE SAID, not as what petrol and diesel "are": they are
 * one load on one day, and a dealer who learns them as constants would be
 * learning something false.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * THE UNIT. The invoice prints the number and no unit at all. Reading kg/m³ into
 * it is our inference from the magnitude and not the document's statement, so
 * the video says the number and stops — a dealer repeating a unit to an
 * inspector should be repeating the paper, not us.
 *
 * THE REGISTER'S STANDING. That the density register is the book an inspector
 * asks for, and that a real discrepancy is how a short delivery or a bad load
 * first shows itself, is operator practice as we understand it — it is not
 * quoted to us from any circular. So it is voiced as what usually happens
 * ("आम तौर पर"), never as a rule, and the video never says what an inspector
 * would then do about it.
 *
 * THE CALIBRATION INTERVAL. One dealer's own assessment sheet carries "keep
 * hydrometer/thermometer calibrated" on a yearly cadence. One dealer's sheet is
 * not a statutory interval, so the video makes the argument — a reading is only
 * as good as the instrument that took it — and names no period at all.
 *
 * The identifiers on that invoice (its number, the vehicle, the outlet) appear
 * nowhere here, and neither does anything about how MDG comes by the figure.
 */
export const densityAt15: SocialVideo = {
  id: 'gen-density-15',
  compositionId: 'GenDensity15',
  family: 'social',
  bilingual: true,
  title: { hi: 'इनवॉइस पर लिखी डेंसिटी', en: 'The density on the invoice' },
  subtitle: {
    hi: 'जो मँगाया था, वही उतरा — इसका सबूत',
    en: 'Your proof that what you ordered is what arrived',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'हर टैंकर के इनवॉइस पर एक नंबर छपा होता है — डेंसिटी।',
        en: 'Every tanker invoice carries one number for each product: its density.',
      },
      broll: 'tanker-delivery',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'क्वालिटी', en: 'Quality' },
        headline: { hi: 'इनवॉइस पर लिखी डेंसिटी', en: 'The density on the invoice' },
        sub: {
          hi: 'जिसे ज़्यादातर लोग पढ़े बिना फ़ाइल कर देते हैं',
          en: 'The one most people file without reading',
        },
      },
    },
    {
      id: 'two-products',
      say: {
        hi: 'एक इनवॉइस पर पेट्रोल 727.300, डीज़ल 820.500 — दोनों अलग।',
        en: 'On one invoice, petrol read 727.300 and diesel 820.500 — never the same.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'पेट्रोल', en: 'Petrol' },
          tone: 'neutral',
          figure: { hi: '727.300', en: '727.300' },
          note: { hi: 'उस टैंकर की एक लाइन', en: 'One line on that tanker' },
        },
        right: {
          head: { hi: 'डीज़ल', en: 'Diesel' },
          tone: 'neutral',
          figure: { hi: '820.500', en: '820.500' },
          note: { hi: 'उसी इनवॉइस की दूसरी लाइन', en: 'The next line on the same invoice' },
        },
        join: 'none',
        verdict: {
          hi: 'हर प्रोडक्ट का अपना नंबर, हर लोड का अपना',
          en: 'Every product its own figure, every load its own',
        },
      },
    },
    {
      id: 'fifteen',
      say: {
        hi: 'यह नंबर पंद्रह डिग्री पर सुधारकर लिखा जाता है।',
        en: 'The figure is corrected to fifteen degrees before it is printed.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'claim',
        figure: { value: 15, suffix: '°' },
        label: { hi: 'डिग्री — सबके लिए एक पैमाना', en: 'degrees — one yardstick for all' },
        tone: 'brand',
        note: {
          hi: 'ताकि जून की नाप और दिसंबर की नाप मिलाई जा सकें',
          en: 'So a June reading and a December one can be compared',
        },
      },
    },
    {
      /* `hold` — the fifteen-degree card stays put while the reason for it
         arrives underneath. Two sentences, one thought, one stage. */
      id: 'why-fifteen',
      hold: true,
      say: {
        hi: 'तेल गर्मी में फैलता है, ठंड में सिकुड़ता है — इसीलिए।',
        en: 'Fuel swells in the heat and shrinks in the cold. That is why.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'claim',
        figure: { value: 15, suffix: '°' },
        label: { hi: 'डिग्री — सबके लिए एक पैमाना', en: 'degrees — one yardstick for all' },
        tone: 'brand',
      },
    },
    {
      id: 'three-moves',
      say: {
        hi: 'टैंकर आए तो इनवॉइस पढ़िए, ख़ुद नापिए, दोनों लिख लीजिए।',
        en: 'When the tanker lands: read the invoice, take your reading, write both.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'इनवॉइस का नंबर', en: 'The invoice figure' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'अपनी नाप', en: 'Your own reading' },
            body: { hi: 'लोड उतरते वक़्त', en: 'While the load is coming off' },
            tone: 'neutral',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'रजिस्टर में दोनों', en: 'Both, in the register' },
            body: { hi: 'उसी दिन', en: 'The same day' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'same-line',
      say: {
        hi: 'उसी लाइन पर टैंक, कंपार्टमेंट और सैंपल नंबर भी होता है।',
        en: 'The same line also carries the tank, compartment and sample number.',
      },
      broll: 'office-counter',
      block: {
        kind: 'list',
        title: { hi: 'एक प्रोडक्ट की लाइन पर', en: 'On one product line' },
        items: [
          { text: { hi: 'डेंसिटी', en: 'The density' }, ok: true },
          { text: { hi: 'टैंक नंबर', en: 'The tank number' }, ok: true },
          { text: { hi: 'कंपार्टमेंट नंबर', en: 'The compartment numbers' }, ok: true },
          { text: { hi: 'सैंपल नंबर', en: 'The sample number' }, ok: true },
        ],
      },
    },
    {
      id: 'instrument',
      say: {
        hi: 'और नाप उतनी ही सही है जितना आपका हाइड्रोमीटर सही है।',
        en: 'And your reading is only as good as the hydrometer that took it.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'कैलिब्रेटेड औज़ार', en: 'Calibrated instruments' },
          tone: 'good',
          rows: [
            { hi: 'हाइड्रोमीटर और थर्मामीटर', en: 'Hydrometer and thermometer' },
            { hi: 'नाप पर भरोसा', en: 'A reading you can stand behind' },
          ],
        },
        right: {
          head: { hi: 'बिना कैलिब्रेशन', en: 'Out of calibration' },
          tone: 'risk',
          rows: [
            { hi: 'नंबर तो आ जाएगा', en: 'You still get a number' },
            { hi: 'साबित कुछ नहीं होगा', en: 'It proves nothing' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'later',
      say: {
        hi: 'रजिस्टर बाद में याद से भरा जाए, तो वह सिर्फ़ कागज़ है।',
        en: 'A register filled in later, from memory, is just paper.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'बाद में भरा हुआ रजिस्टर', en: 'Written up afterwards' },
        body: {
          hi: 'कमी या ख़राब लोड आम तौर पर उसी दिन पकड़ में आता है — इनवॉइस के बग़ल में।',
          en: 'A short load or a bad one usually shows up on the day, right beside the invoice.',
        },
        slots: [
          { label: { hi: 'इनवॉइस का नंबर', en: 'Invoice figure' } },
          { label: { hi: 'अपनी नाप', en: 'Your reading' } },
          { label: { hi: 'उसी दिन की तारीख़', en: 'Same-day date' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर टैंकर की डेंसिटी आपके रजिस्टर से मिलाती है।',
        en: "MDG Services keeps every tanker's density next to your own reading.",
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'इनवॉइस का नंबर और आपकी नाप, साथ-साथ',
          en: 'The invoice figure and your reading, side by side',
        },
        tone: 'brand',
        note: {
          hi: 'फ़र्क़ दिखे तो आपको उसी दिन पता चल जाता है',
          en: 'If the two disagree, you hear about it the same day',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'इनवॉइस पढ़िए, ख़ुद नापिए, और उसी दिन रजिस्टर में लिखिए।',
        en: 'Read the invoice, take your own reading, write it the same day.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर टैंकर पर डेंसिटी पढ़िए', en: 'Read the density on every tanker' },
          { hi: 'अपने औज़ार से ख़ुद नापिए', en: 'Take your own reading, with your own kit' },
          { hi: 'उसी दिन रजिस्टर में लिखिए', en: 'Write both into the register that day' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
