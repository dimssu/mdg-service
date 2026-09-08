import type { SocialVideo } from '../types';

/**
 * "Sales this month" — the column that quietly counts the same fuel twice.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * The cumulative column on a dealer's own sheet is a CALENDAR-MONTH running
 * total. It starts again at zero on the 1st, so the last row of a month is that
 * month's sales and nothing else. Two things break it, and both are silent:
 * starting the count from some day other than the 1st, and letting the previous
 * month's closing figure walk into the new month. Neither produces an error
 * anywhere. The column simply reads high, every day, until somebody adds the
 * days up by hand.
 *
 * ── THE FAILURE IS REAL, AND DELIBERATELY ANONYMOUS ────────────────────────
 *
 * It happened. One outlet's diesel cumulative printed roughly 51,150 litres on
 * a mid-August day while the dealer's own sheet carried roughly 47,950 for the
 * same day, and every following day was over by that same ~3,200 litres,
 * because a month-opening figure had been added on top of days that already
 * contained it. The figures here are ROUNDED and the outlet, the month's exact
 * dates and the grade's finer detail are gone, because the vivid version of
 * this story identifies a specific dealer. The shape of the failure is the
 * lesson; the identifiers add nothing and cost somebody their privacy.
 *
 * ── THE PART THAT MATTERS MOST ─────────────────────────────────────────────
 *
 * The check a dealer can do tonight with nothing but a calculator: the printed
 * cumulative on any day must equal the daily sales above it added up, plus
 * whatever the month opened with. If it does not, one half of the month is
 * wrong. That is the only beat here a viewer is meant to photograph, and it is
 * why the list sits late, right before the recap.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * That the calendar-month convention is a RULE. It is what every dealer's own
 * workbook we have seen does — common practice, and voiced as such ("आम तौर पर").
 * No circular in our hands says it, and a dealer whose books are kept another
 * way is not doing anything wrong; he just needs the same arithmetic to close.
 */
export const cumulativeColumn: SocialVideo = {
  id: 'gen-cumulative-column',
  compositionId: 'GenCumulativeColumn',
  family: 'social',
  bilingual: true,
  title: { hi: 'महीने की बिक्री वाला कॉलम', en: 'Sales this month' },
  subtitle: {
    hi: 'जो चुपचाप एक ही तेल दो बार गिन लेता है',
    en: 'The column that quietly counts the same fuel twice',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'महीने की बिक्री वाला कॉलम चुपचाप दोगुना गिन सकता है।',
        en: 'The sales-this-month column can quietly count the same fuel twice.',
      },
      broll: 'ledger-night',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'महीने का हिसाब', en: 'The month' },
        headline: { hi: 'महीने की बिक्री', en: 'Sales this month' },
        sub: {
          hi: 'वो कॉलम जो दो बार गिन लेता है',
          en: 'The column that double-counts',
        },
      },
    },
    {
      id: 'first',
      say: {
        hi: 'यह कॉलम हर महीने की पहली तारीख़ को शून्य से शुरू होता है।',
        en: 'That column starts again from zero on the first of every month.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'claim',
        figure: { value: 1 },
        label: { hi: 'तारीख़ — यहीं से गिनती नई', en: 'the day the count starts again' },
        tone: 'neutral',
        viz: 'calendar',
        vizProps: { mark: 1 },
        note: {
          hi: 'आम तौर पर हर दुकान की अपनी शीट ऐसे ही चलती है',
          en: "That is how most dealers' own sheets are kept",
        },
      },
    },
    {
      id: 'shape',
      say: {
        hi: 'पहली को शून्य, रोज़ जुड़ता जाता है, आख़िरी दिन महीने की बिक्री।',
        en: "Zero on the 1st, adding daily, and the last row is the month's sales.",
      },
      broll: 'paper-stack',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1st' },
            title: { hi: 'शून्य से शुरू', en: 'Starts at zero' },
            tone: 'neutral',
          },
          {
            figure: { hi: '+', en: '+' },
            title: { hi: 'रोज़ की बिक्री जुड़ती है', en: "Each day's sales add on" },
            tone: 'neutral',
          },
          {
            figure: { hi: '31', en: '31st' },
            title: { hi: 'महीने की कुल बिक्री', en: "The month's total" },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'gap',
      say: {
        hi: 'एक शीट पर 51,150 लीटर लिखा था। किताब में उसी दिन 47,950 थे।',
        en: 'One sheet said 51,150 litres. His own book said 47,950 that same day.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'शीट पर', en: 'On the sheet' },
          tone: 'risk',
          figure: { hi: '51,150 ली', en: '51,150 L' },
          note: { hi: 'महीने की बिक्री', en: 'Sales this month' },
        },
        right: {
          head: { hi: 'अपनी किताब में', en: 'In his own book' },
          tone: 'good',
          figure: { hi: '47,950 ली', en: '47,950 L' },
          note: { hi: 'उसी दिन तक', en: 'To the same day' },
        },
        join: 'none',
        verdict: { hi: 'फ़र्क़ — करीब 3,200 लीटर', en: 'The gap: about 3,200 litres' },
      },
    },
    {
      id: 'everyday',
      hold: true,
      say: {
        hi: 'और यही फ़र्क़ उसके बाद हर दिन वैसा का वैसा बना रहा।',
        en: 'And that same gap sat on every single day that followed.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'शीट पर', en: 'On the sheet' },
          tone: 'risk',
          figure: { hi: '51,150 ली', en: '51,150 L' },
          note: { hi: 'महीने की बिक्री', en: 'Sales this month' },
        },
        right: {
          head: { hi: 'अपनी किताब में', en: 'In his own book' },
          tone: 'good',
          figure: { hi: '47,950 ली', en: '47,950 L' },
          note: { hi: 'उसी दिन तक', en: 'To the same day' },
        },
        join: 'none',
        verdict: { hi: 'फ़र्क़ — करीब 3,200 लीटर', en: 'The gap: about 3,200 litres' },
      },
    },
    {
      id: 'cause',
      say: {
        hi: 'वजह — महीने का खुला आँकड़ा उन्हीं दिनों के ऊपर दोबारा जुड़ गया।',
        en: 'The cause: an opening figure was added on top of days it already held.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'एक ही तेल, दो बार गिना', en: 'The same fuel, counted twice' },
        body: {
          hi: 'पिछले महीने का चलता हुआ जोड़ नए महीने में साथ चला गया, और उसके नीचे की हर पंक्ति उतनी ही ज़्यादा हो गई।',
          en: "Last month's running total walked into the new month, so every row below it was over by exactly that much.",
        },
        cost: {
          figure: { hi: '3,200 ली', en: '3,200 L' },
          label: { hi: 'हर दिन, महीने के आख़िर तक', en: 'every day, to the end of the month' },
        },
      },
    },
    {
      id: 'check',
      say: {
        hi: 'आज रात एक जाँच कीजिए। कैलकुलेटर के अलावा कुछ नहीं चाहिए।',
        en: 'Do one check tonight. You need nothing but a calculator.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'list',
        title: { hi: 'आज रात की जाँच', en: "Tonight's check" },
        items: [
          {
            text: {
              hi: '1 तारीख़ से आज तक की बिक्री जोड़िए',
              en: 'Add the daily sales, 1st to today',
            },
            ok: true,
          },
          {
            text: {
              hi: 'महीने के शुरू का आँकड़ा जोड़ दीजिए',
              en: 'Add whatever the month opened with',
            },
            ok: true,
          },
          {
            text: { hi: 'यही आज का कुल होना चाहिए', en: "That must equal today's printed total" },
            ok: true,
          },
          {
            text: {
              hi: 'नहीं मिला? आधा महीना दोबारा देखिए',
              en: 'It does not? Half the month needs a re-look',
            },
            ok: false,
          },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ यह जोड़ रोज़ मिलाती है, ताकि फ़र्क़ पहले दिन दिखे।',
        en: 'MDG Services checks this addition daily, so a gap shows on day one.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: { hi: 'हर दिन का जोड़, मिलाया हुआ', en: "Every day's total, reconciled" },
        tone: 'brand',
        note: {
          hi: 'महीना ख़त्म होने का इंतज़ार नहीं',
          en: 'No waiting for the month to end',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — पहली को शून्य, रोज़ जोड़, महीना पार मत कराइए।',
        en: 'Remember: zero on the 1st, add daily, never carry it past the month.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर 1 तारीख़ को शून्य से', en: 'Restart at zero on the 1st' },
          { hi: 'रोज़ की बिक्री ही जोड़िए', en: "Add only that day's sales" },
          { hi: 'आख़िरी पंक्ति ही महीने की बिक्री', en: "The last row is the month's sales" },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
