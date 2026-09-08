import type { SocialVideo } from '../types';

/**
 * "Which day does the tanker belong to?" — pick one rule and never move it.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A tanker that reaches the pump at eleven at night and gets written into the
 * book at seven the next morning has two honest dates attached to it: the night
 * it was emptied into the tank, and the morning somebody typed it. Both are
 * true. Only one of them can be the one the book counts on, and a pump that
 * quietly uses whichever is convenient will find its month refusing to add up —
 * because the same tanker can then appear on two consecutive days, or fall into
 * the gap between a shift close and the next entry and appear on neither.
 *
 * So the video is not really about tankers. It is about the discipline of having
 * ONE rule for a boundary and never changing it.
 *
 * ── WHERE THE FACTS COME FROM ──────────────────────────────────────────────
 *
 * The hard, observed half is that a delivery record answers on the moment it was
 * ENTERED at the outlet rather than the moment it was decanted, which is exactly
 * why one tanker routinely turns up in two consecutive days of data and a
 * late-entered tanker turns up days after the day it belongs to. A dealer can
 * see this himself on his own paperwork, which is why it is safe to teach.
 *
 * The rule the video recommends — count the delivery on the day it was decanted,
 * meaning the twenty-four hours ending at that day's shift close, using the
 * decant END time if the record has one, else the start time, else the entry
 * stamp — is OUR engineering choice and nothing more. The script says so, in
 * those words: "यह कोई क़ानून नहीं" / "This is not a law". That hedge is not
 * decoration; RISKS.md is explicit that our internal constants must never be
 * voiced as industry rules, and this is one of them.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * It does not say what a mismatched month costs a dealer with his oil company,
 * because we do not know. It stops at "your totals will not add up", which is
 * arithmetic and is enough. It names no outlet, no vehicle, no invoice, and it
 * never describes where the delivery data is read from or how.
 */
export const tankerDay: SocialVideo = {
  id: 'gen-tanker-day',
  compositionId: 'GenTankerDay',
  family: 'social',
  bilingual: true,
  title: { hi: 'टैंकर किस दिन का है?', en: 'Which day does the tanker belong to?' },
  subtitle: {
    hi: 'रात का टैंकर, सुबह की एंट्री — गिनती किस दिन',
    en: 'A night delivery, a morning entry, and the day it counts on',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'रात ग्यारह बजे का टैंकर सुबह सात बजे चढ़ता है।',
        en: 'A tanker at eleven at night gets written up at seven next morning.',
      },
      broll: 'tanker-delivery',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'रोज़ का हिसाब', en: 'Daily books' },
        headline: { hi: 'टैंकर किस दिन का है?', en: 'Which day is the tanker?' },
        sub: {
          hi: 'दो तारीख़ें सही हैं — गिनना एक को ही है',
          en: 'Two dates are true. Only one can be counted',
        },
      },
    },
    {
      id: 'twodates',
      say: {
        hi: 'एक तारीख़ तेल उतरने की है, दूसरी लिखने की। दोनों सही हैं।',
        en: 'One date is when it was emptied, one is when it was written up.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'तेल कब उतरा', en: 'When it was emptied' },
          figure: { hi: 'रात 11', en: '11 pm' },
          tone: 'neutral',
          note: { hi: 'टैंक में तेल उसी रात गया', en: 'The fuel went in that night' },
        },
        right: {
          head: { hi: 'किताब में कब चढ़ा', en: 'When it was written up' },
          figure: { hi: 'सुबह 7', en: '7 am' },
          tone: 'warn',
          note: { hi: 'एंट्री अगले दिन की है', en: 'The entry carries the next day' },
        },
        join: 'rails',
        verdict: { hi: 'एक ही टैंकर, दो तारीख़ें', en: 'One tanker, two dates' },
      },
    },
    {
      id: 'thenight',
      say: {
        hi: 'बीच में शिफ़्ट बंद हो जाती है — और टैंकर उसी खाई में गिरता है।',
        en: 'The shift closes in between, and the tanker falls into that gap.',
      },
      broll: 'pump-night',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '11', en: '11' },
            title: { hi: 'टैंकर खाली हुआ', en: 'Tanker emptied' },
            tone: 'neutral',
          },
          {
            figure: { hi: '12', en: '12' },
            title: { hi: 'शिफ़्ट बंद', en: 'Shift closes' },
            tone: 'risk',
          },
          {
            figure: { hi: '7', en: '7' },
            title: { hi: 'एंट्री हुई', en: 'Entry made' },
            body: { hi: 'अगले दिन की किताब पर', en: 'On the next day’s page' },
            tone: 'warn',
          },
        ],
      },
    },
    {
      id: 'twice',
      say: {
        hi: 'इसीलिए एक ही टैंकर लगातार दो दिनों में दिख जाता है।',
        en: 'That is why one tanker shows up on two consecutive days.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'claim',
        figure: { value: 2, countUp: false },
        label: { hi: 'दिन, और टैंकर सिर्फ़ एक', en: 'days, for a single tanker' },
        tone: 'warn',
        note: {
          hi: 'देर से चढ़ा टैंकर कई दिन बाद भी आ सकता है',
          en: 'A late entry can surface days after the day it belongs to',
        },
      },
    },
    {
      id: 'either',
      hold: true,
      say: {
        hi: 'दो बार गिन लिया, या किसी दिन गिना ही नहीं — दोनों होते हैं।',
        en: 'Counted twice, or counted on no day at all. Both happen.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'claim',
        figure: { value: 2, countUp: false },
        label: { hi: 'दिन, और टैंकर सिर्फ़ एक', en: 'days, for a single tanker' },
        tone: 'warn',
        note: {
          hi: 'देर से चढ़ा टैंकर कई दिन बाद भी आ सकता है',
          en: 'A late entry can surface days after the day it belongs to',
        },
      },
    },
    {
      id: 'rule',
      say: {
        hi: 'यह क़ानून नहीं — बस एक तरीक़ा, जो हर बार एक जैसा चले।',
        en: 'This is not a law. It is one rule, applied the same way every time.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'list',
        title: { hi: 'जिस दिन तेल उतरा, उसी दिन गिनिए', en: 'Count it on the day it was emptied' },
        items: [
          {
            text: { hi: 'उतरना ख़त्म होने का समय', en: 'The time the decant finished' },
            sub: { hi: 'सबसे पहले यही देखिए', en: 'Look for this first' },
            ok: true,
          },
          {
            text: { hi: 'न मिले तो शुरू होने का समय', en: 'If not, the time it started' },
            ok: true,
          },
          {
            text: { hi: 'वो भी नहीं तो एंट्री का समय', en: 'If not that, the entry time' },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'cost',
      say: {
        hi: 'नियम बदलते रहे तो महीने का जोड़ कभी नहीं मिलेगा।',
        en: 'Keep changing the rule and the monthly total will never tie.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'हर बार अलग तारीख़', en: 'A different date each time' },
        body: {
          hi: 'कभी उतरने का दिन, कभी लिखने का — और महीना अपने आप बिगड़ जाता है।',
          en: 'Sometimes the decant day, sometimes the entry day, and the month breaks.',
        },
        slots: [
          { label: { hi: 'तेल उतरा', en: 'Fuel decanted' } },
          { label: { hi: 'शिफ़्ट बंद', en: 'Shift closed' } },
          { label: { hi: 'किस दिन गिना?', en: 'Counted on which day?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर टैंकर को एक ही नियम से एक ही दिन पर रखती है।',
        en: 'MDG Services puts every tanker on one day, by one unchanging rule.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर डिलीवरी, हर बार एक ही नियम से',
          en: 'Every delivery, the same rule every time',
        },
        tone: 'brand',
        note: {
          hi: 'रात का टैंकर भी अपने ही दिन पर गिना जाता है',
          en: 'Even a midnight tanker lands on the day it belongs to',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'एक नियम बनाइए, लिख लीजिए, और उसे कभी मत बदलिए।',
        en: 'Pick one rule, write it down, and never change it.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'तेल उतरने का समय नोट कीजिए', en: 'Note the time the fuel went in' },
          { hi: 'उसी दिन की किताब पर चढ़ाइए', en: 'Book it on that day’s page' },
          { hi: 'नियम एक ही रखिए, हमेशा', en: 'Keep one rule, always' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
