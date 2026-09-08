import type { SocialVideo } from '../types';

/**
 * "When your day closes" — the clock that decides which day a tanker belongs to.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A pump's day does not end at midnight; it ends when the closing shift is
 * taken. Everything after that hour — a tanker that came late, a nozzle read
 * after the shift was written up — lands on tomorrow instead. So today reads low
 * and tomorrow reads high, and neither is a sales problem.
 *
 * This is the third-commonest reason we see a day's figures come out wrong, and
 * the observation that matters most is that it CLUSTERS: when it happens to an
 * outlet it goes on happening, every day, until the closing hour itself is
 * moved. That is why the video spends its `wrong` beat not on the bad day but on
 * the bad response — correcting eight days by hand fixes eight days and leaves
 * the ninth to go wrong the same way. The fix is one decision, taken once.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * ANY OF OUR OWN CONSTANTS. There is an hour of grace we allow for a late
 * receipt, and there are thresholds at which a day is flagged. Every one of them
 * is an engineering choice defensible against our own data and published
 * nowhere, and a dealer who quoted one back to an inspector would be quoting us
 * as if we were the rule book. The video therefore contains no tolerance, no
 * window and no threshold — only the arithmetic of which day a delivery lands
 * on, which is the dealer's own and true everywhere.
 *
 * NO OUTLET, NO FIGURES FROM ONE. The ten o'clock and eleven o'clock in the
 * worked example are illustrative hours, chosen because they are ordinary, and
 * they are spoken as a supposition rather than as a case.
 *
 * And nothing about how any of this is watched from our side — only what a
 * dealer sees, which is several days in a row that look low for no reason.
 */
export const shiftClose: SocialVideo = {
  id: 'gen-shift-close',
  compositionId: 'GenShiftClose',
  family: 'social',
  bilingual: true,
  title: { hi: 'शिफ़्ट बंद करने का समय', en: 'When your day closes' },
  subtitle: {
    hi: 'यह तय करना पड़ता है — अपने आप नहीं होता',
    en: 'A decision you make, not a detail that decides itself',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'आपका दिन कब बंद होता है — यह आपको तय करना पड़ता है।',
        en: 'The hour your day closes is a decision, not a detail.',
      },
      broll: 'office-counter',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'रोज़ का हिसाब', en: 'Daily figures' },
        headline: { hi: 'शिफ़्ट बंद करने का समय', en: 'When your day closes' },
        sub: {
          hi: 'एक घंटा इधर-उधर, और पूरा दिन गलत',
          en: 'An hour out, and the whole day reads wrong',
        },
      },
    },
    {
      id: 'whose-day',
      say: {
        hi: 'शिफ़्ट दस बजे बंद, टैंकर ग्यारह बजे — वह किस दिन का हुआ?',
        en: 'Shift closed at ten, the tanker landed at eleven. Whose day is that?',
      },
      broll: 'tanker-delivery',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'शिफ़्ट पहले बंद', en: 'Shift closed first' },
          tone: 'risk',
          rows: [
            { hi: 'टैंकर बाद में उतरा', en: 'The tanker came after' },
            { hi: 'आज के हिसाब से बाहर', en: 'Outside today altogether' },
          ],
        },
        right: {
          head: { hi: 'शिफ़्ट टैंकर के बाद', en: 'Shift closed after it' },
          tone: 'good',
          rows: [
            { hi: 'सब उसी दिन में', en: 'Everything in one day' },
            { hi: 'हिसाब पूरा', en: 'The day adds up' },
          ],
        },
        join: 'none',
      },
    },
    {
      id: 'drift',
      say: {
        hi: 'नतीजा — आज का दिन कम दिखता है, कल का बेवजह बड़ा।',
        en: 'So today reads low, and tomorrow reads high for no reason at all.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '10', en: '10' },
            title: { hi: 'शिफ़्ट बंद', en: 'Shift closed' },
            tone: 'neutral',
          },
          {
            figure: { hi: '11', en: '11' },
            title: { hi: 'टैंकर उतरा', en: 'Tanker landed' },
            body: { hi: 'हिसाब बंद हो चुका', en: 'The day is already shut' },
            tone: 'risk',
          },
          {
            figure: { hi: 'कल', en: 'Tomorrow' },
            title: { hi: 'कल के खाते में', en: 'Booked to the next day' },
            tone: 'warn',
          },
        ],
      },
    },
    {
      /* `hold` — the three-step drift stays on screen while the narration lands
         the point it exists for. This is the sentence the whole video is about. */
      id: 'not-sales',
      hold: true,
      say: {
        hi: 'गड़बड़ बिक्री में नहीं है। गड़बड़ घड़ी में है।',
        en: 'Nothing is wrong with the sales. The clock is wrong.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '10', en: '10' },
            title: { hi: 'शिफ़्ट बंद', en: 'Shift closed' },
            tone: 'neutral',
          },
          {
            figure: { hi: '11', en: '11' },
            title: { hi: 'टैंकर उतरा', en: 'Tanker landed' },
            body: { hi: 'हिसाब बंद हो चुका', en: 'The day is already shut' },
            tone: 'risk',
          },
          {
            figure: { hi: 'कल', en: 'Tomorrow' },
            title: { hi: 'कल के खाते में', en: 'Booked to the next day' },
            tone: 'warn',
          },
        ],
      },
    },
    {
      id: 'signs',
      say: {
        hi: 'शक कीजिए अगर लगातार कई दिन ऐसा ही चलता रहे।',
        en: 'Suspect the clock when several days in a row look the same way.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'list',
        title: { hi: 'ये निशानियाँ देखिए', en: 'The signs to look for' },
        items: [
          { text: { hi: 'कई दिन लगातार कम', en: 'Days on end reading low' }, ok: false },
          {
            text: { hi: 'टैंकर वाले दिन उलटा दिखता है', en: 'Delivery days read backwards' },
            ok: false,
          },
          {
            text: { hi: 'पूरे महीने का जोड़ फिर भी सही', en: 'Yet the month still adds up' },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'patching',
      say: {
        hi: 'एक-एक दिन हाथ से सुधारेंगे, तो असली वजह छुपी रहेगी।',
        en: 'Patch each day by hand and the real cause stays hidden.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'wrong',
        headline: { hi: 'रोज़ हाथ से सुधार', en: 'Correcting it day by day' },
        body: {
          hi: 'आठ दिन ठीक कर लेने से घड़ी नहीं बदलती — अगले महीने वही होगा।',
          en: 'Correcting eight days does not move the clock. Next month does the same thing.',
        },
        slots: [
          { label: { hi: 'दिन 1 सुधारा', en: 'Day 1 patched' } },
          { label: { hi: 'दिन 2 सुधारा', en: 'Day 2 patched' } },
          { label: { hi: 'समय वही', en: 'Clock untouched' }, missing: true },
        ],
      },
    },
    {
      id: 'set-once',
      say: {
        hi: 'समय एक बार ठीक कीजिए — आख़िरी डिलीवरी के बाद का।',
        en: 'Set the time once, to an hour after your last delivery.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'रोज़ का सुधार', en: 'Patched every day' },
          tone: 'risk',
          rows: [
            { hi: 'वजह जस की तस', en: 'The cause sits untouched' },
            { hi: 'अगले महीने फिर वही', en: 'Same thing next month' },
          ],
        },
        right: {
          head: { hi: 'समय एक बार तय', en: 'Time set once' },
          tone: 'good',
          rows: [
            { hi: 'आख़िरी टैंकर के बाद', en: 'After the last tanker' },
            { hi: 'हर दिन वही समय', en: 'The same hour every day' },
          ],
        },
        join: 'arrow',
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ बताती है कि दिन कम क्यों दिख रहा है।',
        en: 'MDG Services tells you why a day looks low — the sales, or the clock.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'रोज़ का हिसाब, और कमी की वजह',
          en: 'The daily figures, and the reason one looks wrong',
        },
        tone: 'brand',
        note: {
          hi: 'एक ही गड़बड़ बार-बार दिखे, तो आपको बता दिया जाता है',
          en: 'When the same fault keeps repeating, you are told to look at the clock',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'आख़िरी डिलीवरी के बाद का समय चुनिए, और रोज़ वही रखिए।',
        en: 'Pick a close time after your last delivery, and keep it the same.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          {
            hi: 'शिफ़्ट आख़िरी डिलीवरी के बाद बंद हो',
            en: 'Close the shift after the last delivery',
          },
          { hi: 'हर दिन वही समय रखिए', en: 'Keep the same hour every day' },
          { hi: 'कई दिन कम दिखें तो घड़ी देखिए', en: 'Days on end low? Check the clock first' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
