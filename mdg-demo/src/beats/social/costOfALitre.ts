import type { SocialVideo } from '../types';

/**
 * "What one litre costs" — the arithmetic a dealer has almost never done.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A method, in three steps: take the total on the tanker invoice, divide it by
 * the litres on that same invoice, and you have what one litre of your own fuel
 * actually cost you, landed. Then the multiplication nobody does — a small
 * percentage of a month's throughput is a large number of litres, and litres
 * priced at your own landed cost turn into a rupee figure that is impossible to
 * shrug at. A shortage read in litres sounds like rounding. The same shortage
 * read in rupees is a month's wages.
 *
 * ── THE ONE REAL FIGURE, AND WHY IT IS FENCED ──────────────────────────────
 *
 * ₹97.76 a litre is a genuine landed cost off a genuine tax invoice — the total
 * divides by the litres to the paisa. It is also ONE invoice, on ONE day, in ONE
 * state, for a product whose pump price moves daily and whose tax differs the
 * moment you cross a border; the week it was read, diesel in that town swung
 * three rupees. So the video shows it once, immediately says it is not the
 * viewer's number, and spends a whole held beat telling him to fetch his own
 * invoice. The figure is there to make the method concrete, not to be quoted.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * NO MARGIN. Not a rupee of it. We hold both the landed cost and that day's pump
 * price and could put them side by side in one honest-looking card — and the
 * source file itself flags that the petrol pair implies a margin thinner than
 * what is usually quoted, which means our own numbers are either unusual or
 * incomplete. Publishing a margin a dealer would measure his own business
 * against, on that basis, would be actively misleading. The video therefore
 * names the two losses in a missing litre without pricing the second one.
 *
 * The lakh-litres example is openly hypothetical and said so in words — it is a
 * round number chosen to make one percent legible, not a claim about anybody's
 * throughput.
 */
export const costOfALitre: SocialVideo = {
  id: 'gen-cost-of-a-litre',
  compositionId: 'GenCostOfALitre',
  family: 'social',
  bilingual: true,
  title: { hi: 'एक लीटर की क़ीमत', en: 'What one litre costs' },
  subtitle: {
    hi: 'गायब तेल को लीटर में नहीं, रुपये में देखिए',
    en: 'Read missing fuel in rupees, not in litres',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'एक लीटर गायब हुआ — आपकी जेब से कितना गया, कभी जोड़ा है?',
        en: 'A litre goes missing. Have you ever worked out what it cost you?',
      },
      broll: 'ledger-night',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'हिसाब', en: 'Arithmetic' },
        headline: { hi: 'एक लीटर की क़ीमत', en: 'What one litre costs' },
        sub: {
          hi: 'बिल से निकालिए, अंदाज़े से नहीं',
          en: 'Take it off the invoice, not off a guess',
        },
      },
    },
    {
      id: 'method',
      say: {
        hi: 'तरीक़ा सीधा है — बिल का कुल पैसा, बिल के लीटर से भाग दीजिए।',
        en: 'The method is simple: take the invoice total, divide by its litres.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '₹', en: '₹' },
            title: { hi: 'बिल का कुल पैसा', en: 'The invoice total' },
            tone: 'neutral',
          },
          {
            figure: { hi: '÷', en: '÷' },
            title: { hi: 'बिल के लीटर', en: 'The litres on it' },
            tone: 'neutral',
          },
          {
            figure: { hi: '=', en: '=' },
            title: { hi: 'आपका एक लीटर', en: 'Your cost per litre' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'worked',
      say: {
        hi: 'एक असली बिल में डीज़ल पड़ा 97 रुपये 76 पैसे प्रति लीटर।',
        en: 'On one real invoice, diesel landed at 97 rupees 76 paise a litre.',
      },
      broll: 'office-counter',
      block: {
        kind: 'claim',
        figure: { value: 97.76, prefix: '₹' },
        label: { hi: 'एक लीटर डीज़ल की लागत', en: 'the landed cost of one litre' },
        tone: 'neutral',
        note: {
          hi: 'एक बिल, एक दिन, एक राज्य',
          en: 'One invoice, one day, one state',
        },
      },
    },
    {
      id: 'not-yours',
      hold: true,
      say: {
        hi: 'यह आँकड़ा आपका नहीं है — अपना बिल उठाइए, अपना निकालिए।',
        en: 'That number is not yours. Take your own invoice and work out yours.',
      },
      broll: 'office-counter',
      block: {
        kind: 'claim',
        figure: { value: 97.76, prefix: '₹' },
        label: { hi: 'एक लीटर डीज़ल की लागत', en: 'the landed cost of one litre' },
        tone: 'neutral',
        note: {
          hi: 'एक बिल, एक दिन, एक राज्य',
          en: 'One invoice, one day, one state',
        },
      },
    },
    {
      id: 'twice',
      say: {
        hi: 'गायब लीटर दो बार मारता है — पैसा भी गया, बिक्री भी गई।',
        en: 'A missing litre hits you twice: the money is gone, and so is the sale.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'पैसा जा चुका', en: 'Money already spent' },
          tone: 'risk',
          rows: [
            { hi: 'तेल का बिल भर दिया', en: 'The invoice was paid' },
            { hi: 'वो लीटर टंकी में नहीं', en: 'That litre is not in the tank' },
          ],
        },
        right: {
          head: { hi: 'बिक्री हुई नहीं', en: 'The sale never happened' },
          tone: 'warn',
          rows: [
            { hi: 'ग्राहक तक पहुँचा नहीं', en: 'It never reached a customer' },
            { hi: 'उसका मुनाफ़ा भी गया', en: 'Its profit went with it' },
          ],
        },
        join: 'none',
        verdict: { hi: 'एक लीटर, दो नुक़सान', en: 'One litre, two losses' },
      },
    },
    {
      id: 'scale',
      say: {
        hi: 'महीने में एक लाख लीटर पर एक प्रतिशत मतलब पूरे हज़ार लीटर।',
        en: 'On a lakh litres a month, one percent is a full thousand litres.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'claim',
        figure: { value: 1000, countUp: true, suffix: 'L' },
        label: { hi: 'सिर्फ़ एक प्रतिशत, लीटर में', en: 'just one percent, in litres' },
        tone: 'warn',
        viz: 'dots',
        vizProps: { total: 100, filled: 1 },
        note: {
          hi: 'मान लीजिए महीने में एक लाख लीटर बिका',
          en: 'Suppose a lakh litres go out in the month',
        },
      },
    },
    {
      id: 'rupees',
      say: {
        hi: 'उसी भाव से हज़ार लीटर मतलब क़रीब सत्तानवे हज़ार रुपये।',
        en: 'At that rate a thousand litres is about ninety-seven thousand rupees.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'एक प्रतिशत छोटा नहीं होता', en: 'One percent is not small' },
        body: {
          hi: 'हज़ार लीटर को अपनी लागत से गुणा कीजिए — रक़म ख़ुद सामने आ जाएगी।',
          en: 'Multiply a thousand litres by your own cost and the number shows itself.',
        },
        cost: {
          figure: { hi: '₹97,760', en: '₹97,760' },
          label: { hi: 'उसी एक बिल के भाव से', en: 'at that one invoice rate' },
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ यही हिसाब हर महीने आपके लिए निकालकर रखती है।',
        en: 'MDG Services works this same arithmetic out for you every month.',
      },
      broll: 'phone-call',
      block: {
        kind: 'list',
        title: { hi: 'MDG सर्विसेज़ के साथ', en: 'With MDG Services' },
        items: [
          {
            text: { hi: 'महीने का फ़र्क़, लीटर में', en: 'Your monthly gap, in litres' },
            ok: true,
          },
          { text: { hi: 'और वही फ़र्क़, रुपये में', en: 'And the same gap, in rupees' }, ok: true },
          {
            text: { hi: 'आपके अपने बिल के भाव से', en: 'At the rate on your own invoice' },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — कमी को लीटर में नहीं, रुपये में देखिए।',
        en: 'Remember: read a shortage in rupees, not in litres.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'बिल का पैसा, बिल के लीटर से भाग', en: 'Invoice total, divided by its litres' },
          { hi: 'यही आपके एक लीटर की लागत है', en: 'That is your own cost per litre' },
          { hi: 'कमी को उसी भाव से गुणा कीजिए', en: 'Multiply any shortage by that rate' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
