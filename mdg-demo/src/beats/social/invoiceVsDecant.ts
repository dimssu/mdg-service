import type { SocialVideo } from '../types';

/**
 * "Invoice litres and dip litres" — two right answers to two different questions.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A tanker is invoiced as a round load and what reaches the tank is a little
 * less, every single time. The point of the video is not the size of that gap —
 * it is that the gap runs ONE WAY only, and that a dealer's book has to pick one
 * of the two numbers and stay with it. Mixing them is what manufactures a
 * shortage nobody actually lost: write the invoice figure into the book, check
 * the book against the dip, and every load reads short by a percent or two for
 * a reason that has nothing to do with anyone stealing anything.
 *
 * The worked pair — an 8,000 litre load reported at 7,858 — is a real one out of
 * eight outlets' full delivery history, and 142 litres is simply the subtraction.
 * It is shown as one example, never as the size to expect.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * It never explains WHY the gap exists. Temperature, the hose, what stays in the
 * chamber — all plausible, none of it evidenced by anything we have measured, and
 * a confident wrong reason is worse than no reason to a man who will repeat it
 * to his sales officer. So the video says the gap is real and one-directional
 * and stops.
 *
 * It also states none of our engineering constants. The round-up we apply to a
 * reported receipt, the floor under an inferred one, the tolerances — every one
 * of those is a defensible internal choice justified against our own data and
 * published nowhere, and a dealer who quotes one at an inspection is quoting us,
 * not a rule. That every one of the eight books we have seen keeps the invoice
 * figure is said as what is usual, because eight books is a pattern and not a
 * regulation.
 */
export const invoiceVsDecant: SocialVideo = {
  id: 'gen-invoice-vs-decant',
  compositionId: 'GenInvoiceVsDecant',
  family: 'social',
  bilingual: true,
  title: { hi: 'बिल के लीटर, डिप के लीटर', en: 'Invoice litres, dip litres' },
  subtitle: {
    hi: 'दोनों सही हैं — और दोनों कभी नहीं मिलते',
    en: 'Both numbers are right, and they never agree',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'टैंकर के बिल पर जो लीटर हैं, टंकी में उससे कम उतरते हैं।',
        en: 'The litres on the tanker invoice are more than what reaches the tank.',
      },
      broll: 'tanker-delivery',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'तेल की आवक', en: 'Deliveries' },
        headline: { hi: 'बिल बनाम डिप', en: 'Invoice vs dip' },
        sub: {
          hi: 'दोनों आँकड़े सही हैं',
          en: 'Both of those numbers are right',
        },
      },
    },
    {
      id: 'pair',
      say: {
        hi: 'एक असली लोड — बिल पर 8,000 लीटर, नाप में 7,858 लीटर।',
        en: 'One real load: the invoice said 8,000 litres, the measure said 7,858.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'बिल पर', en: 'On the invoice' },
          tone: 'neutral',
          figure: { hi: '8,000 L', en: '8,000 L' },
          rows: [
            { hi: 'पूरा गोल लोड', en: 'A round load' },
            { hi: 'पैसा इसी का लगा', en: 'This is what you paid for' },
          ],
        },
        right: {
          head: { hi: 'नाप में', en: 'In the measure' },
          tone: 'warn',
          figure: { hi: '7,858 L', en: '7,858 L' },
          rows: [
            { hi: 'नापकर मिला', en: 'What was measured in' },
            { hi: 'हमेशा थोड़ा कम', en: 'Always a little less' },
          ],
        },
        join: 'arrow',
      },
    },
    {
      id: 'pair-both',
      hold: true,
      say: {
        hi: 'दोनों आँकड़े सही हैं — बस सवाल अलग-अलग हैं।',
        en: 'Both figures are correct. They answer two different questions.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'बिल पर', en: 'On the invoice' },
          tone: 'neutral',
          figure: { hi: '8,000 L', en: '8,000 L' },
          rows: [
            { hi: 'पूरा गोल लोड', en: 'A round load' },
            { hi: 'पैसा इसी का लगा', en: 'This is what you paid for' },
          ],
        },
        right: {
          head: { hi: 'नाप में', en: 'In the measure' },
          tone: 'warn',
          figure: { hi: '7,858 L', en: '7,858 L' },
          rows: [
            { hi: 'नापकर मिला', en: 'What was measured in' },
            { hi: 'हमेशा थोड़ा कम', en: 'Always a little less' },
          ],
        },
        join: 'arrow',
      },
    },
    {
      id: 'one-way',
      say: {
        hi: 'फ़र्क़ रहा 142 लीटर — और फ़र्क़ हमेशा कम की तरफ़ जाता है।',
        en: 'The gap was 142 litres, and the gap always runs short, never over.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'claim',
        figure: { value: 142, countUp: true, suffix: 'L' },
        label: { hi: 'उस एक लोड का फ़र्क़', en: 'the gap on that one load' },
        tone: 'warn',
        note: {
          hi: 'यह एक मिसाल है, नाप नहीं — आपका फ़र्क़ अलग होगा',
          en: 'One example, not a size to expect — yours will differ',
        },
      },
    },
    {
      id: 'pick-one',
      say: {
        hi: 'आम तौर पर दुकान की किताब बिल वाला लीटर ही लिखती है।',
        en: 'In most books we have seen, it is the invoice figure that is written.',
      },
      broll: 'office-counter',
      block: {
        kind: 'list',
        title: { hi: 'एक ही तरीक़ा चलाइए', en: 'Pick one basis and keep it' },
        items: [
          { text: { hi: 'या तो बिल का लीटर', en: 'Either the invoice litres' }, ok: true },
          { text: { hi: 'या नापा हुआ लीटर', en: 'Or the measured litres' }, ok: true },
          {
            text: { hi: 'जो चुना, हर लोड पर वही', en: 'Whichever you pick, use it on every load' },
          },
          { text: { hi: 'बीच महीने बदलिए मत', en: 'Never switch part way through' }, ok: false },
        ],
      },
    },
    {
      id: 'mixed',
      say: {
        hi: 'बिल का लीटर लिखकर डिप से मिलाएँगे, तो हर लोड कम दिखेगा।',
        en: 'Write invoice litres and check them against the dip: every load looks short.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'बिल', en: 'Bill' },
            title: { hi: 'किताब में बिल का लीटर', en: 'Invoice litres in the book' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'डिप', en: 'Dip' },
            title: { hi: 'मिलान डिप से', en: 'Checked against the dip' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'कमी', en: 'Short' },
            title: { hi: 'हर बार कमी दिखी', en: 'Short every single time' },
            tone: 'risk',
          },
        ],
      },
    },
    {
      id: 'phantom',
      say: {
        hi: 'महीने के आख़िर में यह झूठी कमी आपके सिर पड़ती है।',
        en: 'By month end that false shortage is sitting on your head.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'कमी, जो असल में थी ही नहीं', en: 'A shortage that was never there' },
        body: {
          hi: 'दो तरीक़े आपस में मिला दिए, तो हर लोड का फ़र्क़ जुड़कर कमी बन जाता है।',
          en: 'Mix the two bases and every load’s gap piles up into a shortage.',
        },
        slots: [
          { label: { hi: 'बिल का लीटर', en: 'Invoice litres' } },
          { label: { hi: 'डिप का लीटर', en: 'Dip litres' } },
          {
            label: { hi: 'किताब कौन-सा रखे?', en: 'Which one does the book keep?' },
            missing: true,
          },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर टैंकर को एक ही तरीक़े से लिखकर रखती है।',
        en: 'MDG Services records every tanker on one consistent basis.',
      },
      broll: 'phone-morning',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर लोड, एक ही हिसाब',
          en: 'Every load, one consistent basis',
        },
        tone: 'brand',
        note: {
          hi: 'आपकी अपनी किताब से मिलता हुआ',
          en: 'Matching the book you already keep',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — बिल अलग, डिप अलग, और किताब में तरीक़ा एक।',
        en: 'Remember: invoice is one number, dip another, and the book keeps one.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'बिल का लीटर — जिसका पैसा लगा', en: 'Invoice litres: what you paid for' },
          { hi: 'डिप का लीटर — जो टंकी में उतरा', en: 'Dip litres: what reached the tank' },
          { hi: 'किताब में हमेशा एक ही तरीक़ा', en: 'One basis in the book, always' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
