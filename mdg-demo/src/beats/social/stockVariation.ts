import type { SocialVideo } from '../types';

/**
 * "Two allowances, not one" — what the permissible stock variation is made of.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A dealer measures the same fuel twice by two completely different means. The
 * dispenser meters count what went out of the nozzle; a brass rod dropped into
 * the tank measures what is still in it. The two never agree exactly, and the
 * gap between them is the stock variation. Every dealer knows there is an
 * allowed band around that gap. Almost nobody knows it is built out of two
 * separate pieces, added together, and that the second piece is granted only in
 * one direction.
 *
 * The two pieces: four percent of the stock the dip shows, plus an
 * evaporation-and-handling allowance on the quantity SOLD — 0.75% on petrol,
 * 0.25% on diesel. Both come from the marketing discipline guideline this
 * repository condenses in `guideline.ts`, and the four percent has been
 * separately confirmed by the founder as a real rule that may be stated flatly.
 *
 * The one idea worth the whole video is the asymmetry, which the repository
 * records as the single most-asked question it has ever had put to it: an excess
 * cannot be explained away by evaporation. Fuel can boil off; it cannot arrive.
 * So on a day the stock reads OVER, the evaporation half is simply not there and
 * the band you are allowed shrinks to the four percent alone. A dealer working
 * with one combined number will therefore call a bad day fine.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * It never says what happens if the band is breached. The repository has no
 * sourced answer to that and inventing one for a video that gets forwarded on
 * WhatsApp would be doing real harm to whoever acts on it.
 *
 * It never says that four percent is the same for every grade at every outlet.
 * `products.ts` is honest that this is a default we have seen hold in every
 * workbook so far rather than a per-grade fact we can vouch for, so the video
 * states the number and stops.
 *
 * It leaves out the reduced evaporation rates that apply beyond a 600 KL annual
 * average. They are real, but a second tier in a sixty-second video buys
 * confusion rather than accuracy, and the direction of the error is safe: a
 * high-volume dealer who assumes the standard rate assumes a band slightly
 * wider than his own, and will investigate a day he did not strictly have to.
 * That is the harmless way to be wrong.
 *
 * And it never describes how any of this gets watched. It names MDG and says
 * what a dealer receives; never a screen, never a method.
 */
export const stockVariation: SocialVideo = {
  id: 'gen-stock-variation',
  compositionId: 'GenStockVariation',
  family: 'social',
  bilingual: true,
  title: { hi: 'छूट एक नहीं, दो हैं', en: 'Two allowances, not one' },
  subtitle: {
    hi: 'स्टॉक वेरिएशन की असली गिनती',
    en: 'What the permissible stock variation is actually made of',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'मीटर कुछ कहता है, डिप कुछ और। यही फ़र्क़ वेरिएशन है।',
        en: 'The meter says one thing, the dip says another. That gap is the variation.',
      },
      broll: 'tank-dip',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'स्टॉक', en: 'Stock' },
        headline: { hi: 'छूट एक नहीं, दो हैं', en: 'Two allowances, not one' },
        sub: {
          hi: 'और दूसरी हमेशा नहीं मिलती',
          en: 'And the second one is not always granted',
        },
      },
    },
    {
      id: 'gap',
      say: {
        hi: 'बिक्री मीटर से गिनी जाती है, बचा हुआ तेल डिप से।',
        en: 'Sales are counted off the meter. What is left is measured by the dip.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'मीटर', en: 'The meter' },
          tone: 'neutral',
          rows: [
            { hi: 'कितना बेचा', en: 'How much went out' },
            { hi: 'नोज़ल की रीडिंग', en: 'Read off the nozzle' },
          ],
        },
        right: {
          head: { hi: 'डिप', en: 'The dip' },
          tone: 'neutral',
          rows: [
            { hi: 'टैंक में कितना बचा', en: 'How much is left in the tank' },
            { hi: 'रॉड से नापा हुआ', en: 'Measured with the rod' },
          ],
        },
        join: 'rails',
        verdict: { hi: 'दोनों का फ़र्क़ = वेरिएशन', en: 'The gap between them is the variation' },
      },
    },
    {
      id: 'four',
      say: {
        hi: 'पहली छूट — टैंक में बचे स्टॉक का चार प्रतिशत।',
        en: 'The first allowance: four percent of the stock sitting in the tank.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'claim',
        figure: { value: 4, suffix: '%' },
        label: { hi: 'टैंक के स्टॉक पर छूट', en: 'allowed on the stock in the tank' },
        tone: 'warn',
        note: {
          hi: 'बेचे हुए तेल पर नहीं — जो टैंक में खड़ा है उस पर',
          en: 'Not on what you sold — on what is standing in the tank',
        },
      },
    },
    {
      id: 'evap',
      say: {
        hi: 'दूसरी छूट बेचे गए तेल पर — पेट्रोल पर ज़्यादा, डीज़ल पर कम।',
        en: 'The second is on what you sold: more on petrol, less on diesel.',
      },
      broll: 'pump-night',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'पेट्रोल', en: 'Petrol' },
          tone: 'warn',
          figure: { hi: '0.75%', en: '0.75%' },
          note: { hi: 'जितना बेचा, उस पर', en: 'of the quantity sold' },
        },
        right: {
          head: { hi: 'डीज़ल', en: 'Diesel' },
          tone: 'warn',
          figure: { hi: '0.25%', en: '0.25%' },
          note: { hi: 'जितना बेचा, उस पर', en: 'of the quantity sold' },
        },
        join: 'none',
        verdict: {
          hi: 'भाप बनने और हैंडलिंग की छूट',
          en: 'The evaporation and handling allowance',
        },
      },
    },
    {
      id: 'onlyshort',
      say: {
        hi: 'पर यह दूसरी छूट सिर्फ़ तब, जब तेल कम निकले।',
        en: 'But that second allowance only applies when the stock comes up short.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'list',
        title: { hi: 'दूसरी छूट कब मिलती है', en: 'When the second one applies' },
        items: [
          {
            text: { hi: 'तेल कम निकला', en: 'Stock reads short' },
            sub: { hi: 'दोनों छूट जुड़ती हैं', en: 'Both allowances add up' },
            ok: true,
          },
          {
            text: { hi: 'तेल ज़्यादा निकला', en: 'Stock reads over' },
            sub: { hi: 'सिर्फ़ चार प्रतिशत', en: 'Only the four percent' },
            ok: false,
          },
        ],
      },
    },
    {
      id: 'why',
      say: {
        hi: 'तेल भाप बनकर उड़ सकता है। हवा से आ नहीं सकता।',
        en: 'Fuel can evaporate away. It cannot arrive out of thin air.',
      },
      broll: 'ledger-night',
      hold: true,
      block: {
        kind: 'list',
        title: { hi: 'दूसरी छूट कब मिलती है', en: 'When the second one applies' },
        items: [
          {
            text: { hi: 'तेल कम निकला', en: 'Stock reads short' },
            sub: { hi: 'दोनों छूट जुड़ती हैं', en: 'Both allowances add up' },
            ok: true,
          },
          {
            text: { hi: 'तेल ज़्यादा निकला', en: 'Stock reads over' },
            sub: { hi: 'सिर्फ़ चार प्रतिशत', en: 'Only the four percent' },
            ok: false,
          },
        ],
      },
    },
    {
      id: 'worked',
      say: {
        hi: 'दस हज़ार टैंक में, बीस हज़ार बिका — छूट बनी 450 लीटर।',
        en: 'Ten thousand in the tank, twenty thousand sold: the band is 450 litres.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '400', en: '400' },
            title: { hi: 'स्टॉक का 4%', en: '4% of stock' },
            body: { hi: '10,000 लीटर पर', en: 'on 10,000 L' },
            tone: 'neutral',
          },
          {
            figure: { hi: '50', en: '50' },
            title: { hi: 'बिक्री का 0.25%', en: '0.25% of sales' },
            body: { hi: '20,000 लीटर डीज़ल', en: 'on 20,000 L of diesel' },
            tone: 'neutral',
          },
          {
            figure: { hi: '450', en: '450' },
            title: { hi: 'कुल छूट', en: 'The whole band' },
            body: { hi: 'लीटर', en: 'litres' },
            tone: 'good',
          },
        ],
        arrows: [
          { hi: '+', en: '+' },
          { hi: '=', en: '=' },
        ],
      },
    },
    {
      id: 'trap',
      say: {
        hi: 'ज़्यादातर लोग दोनों जोड़ लेते हैं — तेल बढ़ा हो तब भी।',
        en: 'Most people add both up, even on a day the stock reads over.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'गिनती दोनों तरफ़ एक जैसी नहीं', en: 'The band is not the same both ways' },
        body: {
          hi: 'तेल ज़्यादा निकले तो भाप वाली छूट हटा दीजिए। बैंड अपने आप छोटा हो जाता है।',
          en: 'On an excess the evaporation half drops out, and the band gets smaller on its own.',
        },
        slots: [
          { label: { hi: 'स्टॉक का 4%', en: '4% of stock' } },
          { label: { hi: 'बिक्री की छूट', en: 'Sales allowance' }, missing: true },
        ],
        cost: {
          figure: { hi: '450 → 400', en: '450 → 400' },
          label: { hi: 'लीटर की छूट', en: 'litres of allowance' },
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ यह हिसाब रोज़ लगाकर आपको बता देती है।',
        en: 'MDG Services works this out every day and tells you where you stand.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'रोज़ का वेरिएशन, छूट पहले से जुड़ी हुई',
          en: 'Your daily variation, with the band already worked out',
        },
        tone: 'brand',
        note: {
          hi: 'हर टैंक अलग, आपकी अपनी भाषा में',
          en: 'Tank by tank, in your own language',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — स्टॉक पर चार प्रतिशत, बिक्री पर भाप की छूट।',
        en: 'Remember: four percent on stock, the evaporation allowance on sales.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'टैंक के स्टॉक का चार प्रतिशत', en: 'Four percent of the stock in the tank' },
          {
            hi: 'बेचे गए तेल पर भाप की छूट',
            en: 'Plus the evaporation allowance on what you sold',
          },
          { hi: 'तेल ज़्यादा निकले तो सिर्फ़ पहली', en: 'On an excess, only the first one counts' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
