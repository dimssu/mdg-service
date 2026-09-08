import type { SocialBlock, SocialVideo } from '../types';

/**
 * "Prove it with the slip" — the rupee counter checking the litre counter.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * Every nozzle prints two lifetime counters, one line apart: litres sold and
 * rupees taken. Subtract yesterday's pair from today's, divide the rupee
 * difference by that day's selling rate, and you have the same day's litres by a
 * completely independent route. The two figures must land on top of each other.
 * That is not a policy or a guideline — it is arithmetic the dealer's own paper
 * is already carrying, which is why it is the one thing in this series a viewer
 * can verify for himself in thirty seconds without owning any software.
 *
 * The worked example is real, taken whole from a slip this repository has
 * processed: 48,285.220 → 48,615.550 on the litre counter is 330.330 L, and
 * 5,287,999.480 → 5,325,771.850 on the rupee counter is ₹37,772.370, which at
 * ₹114.47 comes to 329.98 L. Nought point three five of a litre apart. The same
 * slip with one digit misread — 48,915.550 for 48,615.550 — comes out three
 * hundred litres apart, and the point of the video is that the money catches
 * that before the wrong figure is ever written into the register.
 *
 * ── WHAT IT DELIBERATELY REFUSES TO SAY ────────────────────────────────────
 *
 * IT NEVER STATES A TOLERANCE. Our own reader accepts a gap of max(0.5 L, 2%),
 * and 2% of 330 L is the 6.60 L this example was measured against — but that is
 * an engineering constant chosen against our own data and published nowhere.
 * Put a number on it in a video that gets forwarded and some dealer will one day
 * quote it back at an inspector as though it were a rule. So the video says what
 * the two example gaps ARE — a third of a litre, then three hundred litres — and
 * lets the difference between those two speak for itself.
 *
 * The scale beat is voiced as "we have seen", never as a fact about pumps in
 * general, because that is exactly what it is: two real outlets, one whose
 * nozzles read ten times high and one whose read a tenth, each carrying a
 * hand-written correction in the dealer's own workbook. Neither outlet is
 * identifiable here, and the rate and the figures carry no code, no nozzle
 * number and no date.
 *
 * Nothing describes how any of this is checked on our side. The MDG beat says
 * what a dealer gets — his readings proved against his own money — and stops.
 */

/**
 * The proof, held across two beats.
 *
 * Beat five is a `hold`, so the runtime keeps this exact stage up and only the
 * caption changes underneath it. Naming the block once rather than copying it is
 * the honest way to write that: there is one picture on screen, so there is one
 * object in the file.
 */
const proof: SocialBlock = {
  kind: 'compare',
  left: {
    head: { hi: 'मीटर से', en: 'By the meter' },
    tone: 'neutral',
    figure: { hi: '330.33 लीटर', en: '330.33 litres' },
    rows: [{ hi: '48,615.550 − 48,285.220', en: '48,615.550 − 48,285.220' }],
  },
  right: {
    head: { hi: 'पैसे से', en: 'By the money' },
    tone: 'neutral',
    figure: { hi: '329.98 लीटर', en: '329.98 litres' },
    rows: [{ hi: '₹37,772.37 ÷ 114.47', en: '₹37,772.37 ÷ 114.47' }],
    note: { hi: 'रेट उसी दिन का', en: "That day's own rate" },
  },
  join: 'rails',
  verdict: { hi: 'दोनों एक ही बात कह रहे हैं', en: 'Both are saying the same thing' },
};

export const proveTheMeter: SocialVideo = {
  id: 'gen-prove-the-meter',
  compositionId: 'GenProveTheMeter',
  family: 'social',
  bilingual: true,
  title: { hi: 'पर्ची से जाँच', en: 'Prove it with the slip' },
  subtitle: {
    hi: 'मीटर सही पढ़ा या नहीं — पैसा खुद बता देता है',
    en: 'The rupee counter tells you whether the litre counter was read right',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'पर्ची खुद बता देती है कि मीटर सही पढ़ा गया या नहीं।',
        en: 'The slip itself tells you whether the meter was read right.',
      },
      broll: 'office-counter',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'मीटर की पढ़ाई', en: 'Meter readings' },
        headline: { hi: 'पर्ची से जाँच', en: 'Prove it with the slip' },
        sub: {
          hi: 'बिना किसी सॉफ़्टवेयर के, तीस सेकंड में',
          en: 'Thirty seconds, no software needed',
        },
      },
    },
    {
      id: 'counters',
      say: {
        hi: 'हर नोज़ल दो काउंटर छापता है — लीटर का और रुपये का।',
        en: 'Every nozzle prints two counters: one for litres, one for rupees.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'list',
        title: { hi: 'पर्ची पर दो नंबर', en: 'Two numbers on the slip' },
        items: [
          {
            text: { hi: 'लीटर का काउंटर', en: 'The litre counter' },
            sub: { hi: 'अब तक कुल कितना तेल गया', en: 'Total litres ever sold' },
          },
          {
            text: { hi: 'रुपये का काउंटर', en: 'The rupee counter' },
            sub: { hi: 'अब तक कुल कितना पैसा बना', en: 'Total rupees ever taken' },
          },
        ],
      },
    },
    {
      id: 'method',
      say: {
        hi: 'आज में से कल घटाइए, रुपये को रेट से भाग दीजिए, फिर मिलाइए।',
        en: 'Subtract yesterday from today, divide the rupees by the rate, compare.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'आज − कल', en: 'Today − yesterday' },
            body: { hi: 'दोनों काउंटर पर', en: 'On both counters' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'रुपये ÷ रेट', en: 'Rupees ÷ rate' },
            body: { hi: 'लीटर निकल आए', en: 'That gives litres' },
            tone: 'brand',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'दोनों मिलाइए', en: 'Compare the two' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'worked',
      say: {
        hi: 'मीटर कहता है 330.33 लीटर, और पैसा कहता है 329.98 लीटर।',
        en: 'The meter says 330.33 litres. The money says 329.98 litres.',
      },
      broll: 'paper-stack',
      block: proof,
    },
    {
      id: 'gap',
      say: {
        hi: 'फ़र्क़ सिर्फ़ 0.35 लीटर — यानी पढ़ाई सही उतरी।',
        en: 'Just 0.35 litres apart, so the reading holds up.',
      },
      hold: true,
      broll: 'paper-stack',
      block: proof,
    },
    {
      id: 'misread',
      say: {
        hi: 'एक अंक गलत लिखा, तो दोनों जवाब 300 लीटर दूर हो जाते हैं।',
        en: 'Write one digit wrong and the two answers land 300 litres apart.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'एक अंक की गलती', en: 'One digit, misread' },
        body: {
          hi: '48,615 की जगह 48,915 पढ़ लिया गया।',
          en: '48,915 was written down where the slip said 48,615.',
        },
        slots: [
          { label: { hi: 'मीटर से 630 लीटर', en: '630 L by the meter' } },
          { label: { hi: 'पैसे से 330 लीटर', en: '330 L by the money' } },
          { label: { hi: 'मेल नहीं खाया', en: 'They do not meet' }, missing: true },
        ],
        cost: {
          figure: { hi: '300 लीटर', en: '300 litres' },
          label: { hi: 'का फ़र्क़ — एक ही अंक से', en: 'apart, from one digit' },
        },
      },
    },
    {
      id: 'conditions',
      say: {
        hi: 'तीन छोटी बातें, वरना यह जाँच काम नहीं करेगी।',
        en: 'Three small things, or the check will not work.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'list',
        title: { hi: 'इतना ध्यान रखिए', en: 'Keep these three in mind' },
        items: [
          {
            text: { hi: 'दोनों नंबर एक ही पर्ची से', en: 'Both figures off the same print' },
            sub: { hi: 'वे एक लाइन नीचे-ऊपर छपते हैं', en: 'They print one line apart' },
          },
          {
            text: {
              hi: 'कल का वही नंबर, जो आपने माना था',
              en: "Yesterday's figure as you accepted it",
            },
          },
          {
            text: { hi: 'रेट उसी दिन का लीजिए', en: "Use that day's own selling rate" },
          },
        ],
      },
    },
    {
      id: 'scale',
      say: {
        hi: 'हमने देखा है — कुछ नोज़ल दस गुना बड़ा या दस गुना छोटा गिनते हैं।',
        en: 'We have seen nozzles counting ten times too big, and some a tenth.',
      },
      broll: 'pump-night',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'दस गुना बड़ा', en: 'Ten times too big' },
          tone: 'risk',
          rows: [
            { hi: 'उस नोज़ल का दिन बाकी सबसे बहुत बड़ा', en: 'That nozzle dwarfs every other' },
          ],
        },
        right: {
          head: { hi: 'दस गुना छोटा', en: 'A tenth of the truth' },
          tone: 'risk',
          rows: [{ hi: 'उस नोज़ल का दिन बहुत छोटा लगे', en: 'That nozzle looks far too small' }],
        },
        join: 'none',
        verdict: {
          hi: 'और आज का नंबर कल से कम कभी नहीं हो सकता',
          en: 'And today can never read lower than yesterday',
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर पढ़ाई को उसी पर्ची के पैसे से मिलाकर देती है।',
        en: 'MDG Services matches every reading against the money on the slip.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'गलत अंक, कागज़ पर चढ़ने से पहले',
          en: 'A wrong digit caught before it is written down',
        },
        tone: 'brand',
        note: {
          hi: 'हर नोज़ल, हर दिन — आपकी अपनी भाषा में',
          en: 'Every nozzle, every day, in your own language',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — दो काउंटर, एक भाग, और दोनों जवाब बराबर।',
        en: 'Remember: two counters, one division, and the answers must agree.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'दोनों काउंटर में से कल का घटाइए', en: 'Take yesterday off both counters' },
          { hi: 'रुपये को उस दिन के रेट से भाग दीजिए', en: "Divide the rupees by that day's rate" },
          {
            hi: 'दोनों लीटर पास-पास न हों तो दोबारा पढ़िए',
            en: 'If the two litres differ, read again',
          },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
