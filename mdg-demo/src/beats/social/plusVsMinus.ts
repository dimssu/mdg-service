import type { SocialVideo } from '../types';

/**
 * "Over and short" — why a surplus and a shortage are not two sides of one coin.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * One fork, and the whole video is that fork. Stock variation is allowed up to
 * four percent on a product. Past that limit the two directions stop being
 * mirror images of each other: on a POSITIVE variation samples are drawn and
 * sales and supplies of every product are suspended immediately, while on a
 * NEGATIVE variation samples are drawn too but selling carries on, a written
 * explanation is called for, and supply stops only if that explanation is not
 * found satisfactory.
 *
 * Getting that fork backwards is the specific error this video exists to
 * prevent, and it is an error in both directions. Telling a dealer his shortage
 * will stop his pump today is crying wolf; telling him his surplus will merely
 * attract a letter badly understates a stop-selling event. So the two paths are
 * drawn as two paths, and the video never blends them into one warning.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * It stops at the guideline. It does not say what happens after the explanation
 * is filed, how long an investigation takes, what a lab test costs, or what any
 * of it means for a licence — none of that is in anything we can source, and a
 * video that gets forwarded on WhatsApp is exactly the wrong place to guess.
 * The four percent band and the two consequence paths are the guideline's own
 * words as condensed in this repository; everything past them is left out.
 *
 * It also never says how any of this is watched. The MDG beat is about what a
 * dealer receives — which way his variation is running, and how far — and not a
 * word about where the figure comes from.
 */
export const plusVsMinus: SocialVideo = {
  id: 'gen-plus-vs-minus',
  compositionId: 'GenPlusVsMinus',
  family: 'social',
  bilingual: true,
  title: { hi: 'ज़्यादा और कम', en: 'Over and short' },
  subtitle: {
    hi: 'स्टॉक का फ़र्क़ — किस तरफ़ है, यह मायने रखता है',
    en: 'Which way your stock variation runs, and why it matters',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'स्टॉक ज़्यादा निकला या कम — नतीजा दोनों का अलग है।',
        en: 'Stock over, or stock short — the two do not end the same way.',
      },
      broll: 'tank-dip',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'स्टॉक का हिसाब', en: 'Stock' },
        headline: { hi: 'ज़्यादा और कम', en: 'Over and short' },
        sub: {
          hi: 'दो अलग-अलग मुसीबतें',
          en: 'Two completely different problems',
        },
      },
    },
    {
      id: 'band',
      say: {
        hi: 'हर प्रोडक्ट पर चार प्रतिशत तक का फ़र्क़ चल जाता है।',
        en: 'A variation of up to four percent is permitted on each product.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'claim',
        figure: { value: 4, suffix: '%' },
        label: { hi: 'तक का फ़र्क़ मान्य है', en: 'variation is permitted' },
        tone: 'good',
        viz: 'bar',
        vizProps: { value: 4, limit: 4 },
        note: {
          hi: 'इसके बाद वाली बात दोनों तरफ़ अलग है',
          en: 'What happens past it depends on which way it runs',
        },
      },
    },
    {
      id: 'fork',
      say: {
        hi: 'सीमा पार हुई तो सैंपल दोनों में जाता है — रास्ता अलग है।',
        en: 'Past the limit samples are drawn either way. The paths differ.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'स्टॉक ज़्यादा', en: 'Stock over' },
          tone: 'risk',
          rows: [
            { hi: 'सैंपल जाँच को जाता है', en: 'Samples go for testing' },
            { hi: 'बिक्री तुरंत रुक जाती है', en: 'Selling stops at once' },
          ],
        },
        right: {
          head: { hi: 'स्टॉक कम', en: 'Stock short' },
          tone: 'warn',
          rows: [
            { hi: 'सैंपल जाँच को जाता है', en: 'Samples go for testing' },
            { hi: 'बिक्री चलती रहती है', en: 'Selling carries on' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'fork-plus',
      hold: true,
      say: {
        hi: 'ज़्यादा निकला तो सब प्रोडक्ट की बिक्री उसी वक़्त रुकती है।',
        en: 'On a surplus, sales and supplies of every product stop at once.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'स्टॉक ज़्यादा', en: 'Stock over' },
          tone: 'risk',
          rows: [
            { hi: 'सैंपल जाँच को जाता है', en: 'Samples go for testing' },
            { hi: 'बिक्री तुरंत रुक जाती है', en: 'Selling stops at once' },
          ],
        },
        right: {
          head: { hi: 'स्टॉक कम', en: 'Stock short' },
          tone: 'warn',
          rows: [
            { hi: 'सैंपल जाँच को जाता है', en: 'Samples go for testing' },
            { hi: 'बिक्री चलती रहती है', en: 'Selling carries on' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'minus',
      say: {
        hi: 'कम निकला तो आपसे लिखित जवाब माँगा जाता है।',
        en: 'On a shortage, a written explanation is called for from you.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'list',
        title: { hi: 'कम निकलने पर', en: 'When the stock is short' },
        items: [
          { text: { hi: 'सैंपल जाँच को जाता है', en: 'Samples go for testing' }, ok: true },
          { text: { hi: 'बिक्री चलती रहती है', en: 'Selling carries on' }, ok: true },
          { text: { hi: 'लिखित सफ़ाई माँगी जाती है', en: 'A written explanation is called for' } },
          {
            text: {
              hi: 'जवाब न जँचे तो सप्लाई रुके',
              en: 'Supply stops if that answer is not accepted',
            },
            ok: false,
          },
        ],
      },
    },
    {
      id: 'daily',
      say: {
        hi: 'बचाव एक ही है — फ़र्क़ महीने में नहीं, रोज़ देखिए।',
        en: 'There is one defence: read the gap daily, not once a month.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'डिप', en: 'Dip' },
            title: { hi: 'टंकी नापिए', en: 'Measure the tank' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'मीटर', en: 'Meter' },
            title: { hi: 'बिक्री घटाइए', en: 'Take off the sales' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'फ़र्क़', en: 'Gap' },
            title: { hi: 'रोज़ लिखिए', en: 'Write it down daily' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'late',
      say: {
        hi: 'महीने में एक बार देखा, तो फ़र्क़ बढ़ चुका होता है।',
        en: 'Look at it once a month and the gap has already grown.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'पता तब चला, जब देर हो गई', en: 'Found out far too late' },
        body: {
          hi: 'रोज़ का छोटा फ़र्क़ चुपचाप जुड़ता रहता है और सीमा पार कर जाता है।',
          en: 'A small daily gap adds up quietly until it has crossed the limit.',
        },
        slots: [
          { label: { hi: 'रोज़ का डिप', en: 'The daily dip' }, missing: true },
          { label: { hi: 'मीटर की बिक्री', en: 'Meter sales' } },
          { label: { hi: 'फ़र्क़ किस तरफ़?', en: 'Which way?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ रोज़ बताती है — फ़र्क़ किस तरफ़ है, कितना है।',
        en: 'MDG Services tells you daily which way the gap runs, and how far.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'रोज़ का फ़र्क़, आपके फ़ोन पर',
          en: 'Your daily variation, on your phone',
        },
        tone: 'brand',
        note: {
          hi: 'सीमा के पास पहुँचने से पहले',
          en: 'Before it gets anywhere near the limit',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — ज़्यादा में बिक्री रुकती है, कम में जवाब माँगा जाता है।',
        en: 'Remember: a surplus stops selling, a shortage calls for an answer.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'चार प्रतिशत तक का फ़र्क़ चलता है', en: 'Up to four percent is permitted' },
          { hi: 'ज़्यादा निकला — बिक्री तुरंत बंद', en: 'Stock over: selling stops at once' },
          { hi: 'कम निकला — लिखित जवाब देना है', en: 'Stock short: a written answer is due' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
