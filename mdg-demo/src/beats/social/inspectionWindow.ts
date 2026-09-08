import type { SocialVideo } from '../types';

/**
 * "The day the count starts again" — an inspection resets the window.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * Every dealer knows the permissible band on stock variation. Almost none of
 * them think about the second half of that sentence, which is the period the
 * variation is measured over. That period begins on the day of the last physical
 * inspection, and the instant a new inspection happens the old period is closed:
 * a new dip stock and a new set of meter readings become the opening figures,
 * and every receipt and every litre sold before that day belongs to a window
 * that is finished.
 *
 * A book that does not move its starting date on that day keeps adding new
 * months onto an old baseline. The number it prints is not slightly wrong, it is
 * measuring something else entirely.
 *
 * ── WHERE THE FACTS COME FROM ──────────────────────────────────────────────
 *
 * Hard, from real inspection paperwork. IndianOil's inspection report is Form
 * SL.5(R), and it carries exactly the three things that fix the new window: the
 * report's own date; the actual stock as per dip, per product; and the current
 * meter reading for every nozzle, written as e.g. MS DU-5 NZL-7. The form also
 * prints the reading each nozzle carried at the PREVIOUS inspection, which is a
 * genuinely useful thing a dealer can act on and which nobody ever seems to look
 * at — the difference is that pump's throughput across one whole period.
 *
 * The cost beat is measured rather than imagined: one outlet was inspected, its
 * book carried on measuring from a baseline four months older, and roughly 1.78
 * lakh litres of diesel receipts from that dead window were still sitting inside
 * the total. The outlet is not named, the dates are rounded to "four months",
 * and no figure here can be traced to a dealer.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * It does not say what happens to a dealer whose variation reads badly. That
 * consequence is not evidenced anywhere we can point to, and a guess about it,
 * forwarded on WhatsApp, would be acted on by somebody. The video teaches the
 * date and the arithmetic and stops. It also states only the 4% band, which the
 * founder has confirmed is a real rule, and deliberately leaves the evaporation
 * half of the calculation to the video that is about that.
 */
export const inspectionWindow: SocialVideo = {
  id: 'gen-inspection-window',
  compositionId: 'GenInspectionWindow',
  family: 'social',
  bilingual: true,
  title: { hi: 'गिनती फिर से शुरू', en: 'The count starts again' },
  subtitle: {
    hi: 'इंस्पेक्शन के दिन आपका पुराना हिसाब बंद हो जाता है',
    en: 'The day of an inspection, your old measuring period closes',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'जिस दिन इंस्पेक्शन हुआ, उस दिन पुरानी गिनती ख़त्म।',
        en: 'The day an inspection happens, the old count is finished.',
      },
      broll: 'gate-arrival',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'स्टॉक का फ़र्क़', en: 'Stock variation' },
        headline: { hi: 'गिनती फिर से शुरू', en: 'The count starts again' },
        sub: {
          hi: 'और पुरानी तारीख़ से नापना बंद',
          en: 'And the old date stops being the baseline',
        },
      },
    },
    {
      id: 'band',
      say: {
        hi: 'चार परसेंट की छूट सब जानते हैं। सवाल है — किस दिन से?',
        en: 'Everyone knows the four percent band. The question is: from when?',
      },
      broll: 'tank-dip',
      block: {
        kind: 'claim',
        figure: { value: 4, suffix: '%', countUp: false },
        label: { hi: 'टैंक के स्टॉक पर मंज़ूर फ़र्क़', en: 'permissible on tank stock' },
        tone: 'neutral',
        note: {
          hi: 'हर परसेंट के पीछे एक अवधि होती है',
          en: 'Every percentage is measured over some period',
        },
      },
    },
    {
      id: 'twowindows',
      say: {
        hi: 'पुरानी तारीख़ से नापेंगे तो चार महीने एक ही जोड़ में आ जाते हैं।',
        en: 'Measure from the old date and four months land in one total.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'पुरानी तारीख़ से', en: 'From the old date' },
          tone: 'risk',
          rows: [
            { hi: 'महीनों की रसीदें साथ', en: 'Months of receipts still inside' },
            { hi: 'फ़र्क़ बढ़ता ही जाता है', en: 'The gap only grows' },
          ],
        },
        right: {
          head: { hi: 'नई तारीख़ से', en: 'From the new date' },
          tone: 'good',
          rows: [
            { hi: 'नई डिप से शुरुआत', en: 'Starts at the new dip' },
            { hi: 'साफ़ और छोटा हिसाब', en: 'A short, clean period' },
          ],
        },
        join: 'arrow',
      },
    },
    {
      id: 'form',
      say: {
        hi: 'इंस्पेक्शन का फ़ॉर्म SL.5(R) आपको नई शुरुआत दे देता है।',
        en: 'The inspection form, SL.5(R), hands you that new starting point.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'list',
        title: { hi: 'फ़ॉर्म SL.5(R) में क्या लिखा होता है', en: 'What Form SL.5(R) carries' },
        items: [
          { text: { hi: 'रिपोर्ट की अपनी तारीख़', en: 'The report’s own date' }, ok: true },
          {
            text: { hi: 'हर प्रोडक्ट का डिप स्टॉक', en: 'Dip stock for each product' },
            ok: true,
          },
          {
            text: { hi: 'हर नोज़ल की टोटलाइज़र रीडिंग', en: 'Each nozzle’s totaliser reading' },
            ok: true,
          },
          {
            text: {
              hi: 'पिछले इंस्पेक्शन की रीडिंग भी',
              en: 'The previous inspection’s reading too',
            },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'previous',
      hold: true,
      say: {
        hi: 'पिछली रीडिंग भी छपी होती है — पूरे दौर की बिक्री उसी में है।',
        en: 'The previous reading is printed too: that is a whole period of sales.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'list',
        title: { hi: 'फ़ॉर्म SL.5(R) में क्या लिखा होता है', en: 'What Form SL.5(R) carries' },
        items: [
          { text: { hi: 'रिपोर्ट की अपनी तारीख़', en: 'The report’s own date' }, ok: true },
          {
            text: { hi: 'हर प्रोडक्ट का डिप स्टॉक', en: 'Dip stock for each product' },
            ok: true,
          },
          {
            text: { hi: 'हर नोज़ल की टोटलाइज़र रीडिंग', en: 'Each nozzle’s totaliser reading' },
            ok: true,
          },
          {
            text: {
              hi: 'पिछले इंस्पेक्शन की रीडिंग भी',
              en: 'The previous inspection’s reading too',
            },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'reset',
      say: {
        hi: 'नई तारीख़, नई डिप, नई मीटर रीडिंग — और खाता नया।',
        en: 'New date, new dip, new meter readings, and the book starts over.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'तारीख़', en: 'Date' },
            title: { hi: 'रिपोर्ट का दिन', en: 'The report’s day' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'डिप', en: 'Dip' },
            title: { hi: 'नया खुलता स्टॉक', en: 'The new opening stock' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'मीटर', en: 'Meter' },
            title: { hi: 'नई शुरुआती रीडिंग', en: 'The new opening reading' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'cost',
      say: {
        hi: 'एक पंप पर किताब पुरानी तारीख़ से ही चलती रह गई।',
        en: 'At one pump the book simply carried on from the old date.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'तारीख़ नहीं बदली', en: 'The date was never moved' },
        body: {
          hi: 'चार महीने पुरानी रसीदें अब भी उसी जोड़ में गिनी जा रही थीं।',
          en: 'Four months of old receipts were still being counted in the same total.',
        },
        cost: {
          figure: { hi: '1.78 लाख लीटर', en: '1.78 lakh litres' },
          label: { hi: 'पुरानी रसीदें, अब भी हिसाब में', en: 'old receipts, still in the sum' },
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ नई रिपोर्ट आते ही गिनती की तारीख़ बदल देती है।',
        en: 'MDG Services moves your starting date the moment a new report lands.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'नई तारीख़, नई डिप, नई रीडिंग — अपने आप',
          en: 'New date, new dip, new readings — done for you',
        },
        tone: 'brand',
        note: {
          hi: 'ताकि आपका फ़र्क़ सही अवधि पर नापा जाए',
          en: 'So your variation is measured over the right period',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'नई रिपोर्ट मिले तो तारीख़, डिप और रीडिंग — तीनों बदलिए।',
        en: 'When a new report arrives, move the date, the dip and the readings.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'रिपोर्ट की तारीख़ नोट कीजिए', en: 'Note the date on the report' },
          { hi: 'उसी दिन की डिप से शुरू कीजिए', en: 'Start from that day’s dip stock' },
          { hi: 'हर नोज़ल की रीडिंग उतार लीजिए', en: 'Copy every nozzle’s reading across' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
