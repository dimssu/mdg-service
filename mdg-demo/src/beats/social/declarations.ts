import type { SocialBlock, SocialVideo } from '../types';

/**
 * "Six declarations, six different clocks."
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A running outlet owes a handful of standing declarations on the portal — a
 * safety one, a cleanliness one, wages paid, staff evaluated, the TDS
 * certificate, and the annual report — and each runs on its own clock. Nothing
 * about the set is difficult. What makes it a real problem is the spread of the
 * intervals: the daily one becomes muscle memory within a week, and the one that
 * comes round every three months or every year is the one nobody has ever built
 * a habit for, so it is always the long-interval filing that goes missing. That
 * inversion — the rarest job is the likeliest to be forgotten — is the whole
 * insight of the video, and the fix it offers is a piece of paper with a date
 * against each line and one person's name on it.
 *
 * ── WHAT IT DELIBERATELY REFUSES TO SAY ────────────────────────────────────
 *
 * THE CADENCES ARE VOICED AS TYPICAL, NEVER AS A CIRCULAR. Our list of six and
 * the intervals against them come from ONE dealer's own assessment sheet, not
 * from anything an oil company published. The obligations are real; the exact
 * set and the exact timings are that dealer's, and a video watched by a stranger
 * in another state must not turn one outlet's sheet into a national standard. So
 * a beat of its own says, in the caption where nobody can miss it, that the list
 * and its dates are not the same at every pump and the viewer should check his
 * own.
 *
 * NO POINT VALUES. The same sheet carries a score against every line — the
 * annual report alone is worth more than any other item on it — and those
 * weights are even more specific to that one dealer than the cadences are.
 * Quoting a score would invite a viewer to plan his year around a number we
 * cannot source, so every point value is left out.
 *
 * NO CADENCE ON THE ANNUAL REPORT. Its row is internally inconsistent in our own
 * seed data — the name says annual and the tag says every two years — and the
 * repo's own note flags it for confirmation. Rather than guess, the video names
 * the filing, marks its date as the one to go and confirm, and moves on. That is
 * also the most useful thing it could say about it.
 *
 * AND NO PENALTY, ANYWHERE. What actually follows a missed declaration is not
 * visible in anything we can read, so the `wrong` beat shows the gap in the
 * record and stops there. It never says what it costs, because we do not know.
 */

/**
 * The six, held across two beats.
 *
 * The second beat is a `hold`, so this stage stays up while the caption adds the
 * caveat that matters more than the list itself. One picture, one object.
 */
const six: SocialBlock = {
  kind: 'list',
  title: { hi: 'छह घोषणाएँ, छह रफ़्तार', en: 'Six filings, six clocks' },
  items: [
    {
      text: { hi: 'सुरक्षा की घोषणा', en: 'Safety declaration' },
      sub: { hi: 'अक्सर रोज़', en: 'Usually daily' },
    },
    {
      text: { hi: 'सफ़ाई की घोषणा', en: 'Cleanliness declaration' },
      sub: { hi: 'अक्सर हफ़्ते में', en: 'Usually weekly' },
    },
    {
      text: { hi: 'मज़दूरी दी गई — घोषणा', en: 'Wages paid, declared' },
      sub: { hi: 'अक्सर महीने में', en: 'Usually monthly' },
    },
    {
      text: { hi: 'स्टाफ़ का मूल्यांकन', en: 'Staff evaluation' },
      sub: { hi: 'अक्सर महीने में', en: 'Usually monthly' },
    },
    {
      text: { hi: 'TDS सर्टिफ़िकेट', en: 'TDS certificate' },
      sub: { hi: 'अक्सर तिमाही', en: 'Usually quarterly' },
    },
    {
      text: { hi: 'सालाना रिपोर्ट (DAR)', en: "Dealer's Annual Report" },
      sub: { hi: 'तारीख़ पक्की कर लीजिए', en: 'Confirm its due date' },
      tone: 'warn',
    },
  ],
};

export const declarations: SocialVideo = {
  id: 'gen-declarations',
  compositionId: 'GenDeclarations',
  family: 'social',
  bilingual: true,
  title: { hi: 'छह घोषणाएँ', en: 'Six declarations' },
  subtitle: {
    hi: 'हर एक की अपनी तारीख़ — और याद कोई नहीं दिलाता',
    en: 'Each one on its own clock, and nobody sends a reminder',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'छह घोषणाएँ, छह अलग तारीख़ें — और याद कोई नहीं दिलाता।',
        en: 'Six filings, six different clocks, and nobody sends a reminder.',
      },
      broll: 'file-shelf',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'कागज़ी काम', en: 'Paperwork' },
        headline: { hi: 'छह घोषणाएँ', en: 'Six declarations' },
        sub: {
          hi: 'जो पोर्टल पर आपसे माँगी जाती हैं',
          en: 'The ones the portal keeps asking you for',
        },
      },
    },
    {
      id: 'count',
      say: {
        hi: 'रोज़ की, हफ़्ते की, महीने की, तिमाही की — और एक सालाना।',
        en: 'One daily, one weekly, two monthly, one quarterly, one yearly.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'claim',
        figure: { value: 6, countUp: true },
        label: { hi: 'घोषणाएँ, छह अलग रफ़्तार पर', en: 'filings, on six separate clocks' },
        tone: 'warn',
        viz: 'dots',
        vizProps: { total: 6, filled: 6 },
      },
    },
    {
      id: 'thesix',
      say: {
        hi: 'सुरक्षा, सफ़ाई, मज़दूरी, स्टाफ़, TDS और सालाना रिपोर्ट।',
        en: 'Safety, cleanliness, wages, staff, TDS, and the annual report.',
      },
      broll: 'paper-stack',
      block: six,
    },
    {
      id: 'caveat',
      say: {
        hi: 'यह सूची और तारीख़ें हर पंप पर एक जैसी नहीं होतीं।',
        en: 'This list and these dates are not the same at every pump.',
      },
      hold: true,
      broll: 'paper-stack',
      block: six,
    },
    {
      id: 'inversion',
      say: {
        hi: 'जो काम जितना कम आता है, वही सबसे ज़्यादा छूटता है।',
        en: 'The job that comes round least often is the one that goes missing.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'रोज़ वाली', en: 'The daily one' },
          tone: 'good',
          rows: [{ hi: 'हफ़्ते भर में आदत बन जाती है', en: 'It becomes habit within a week' }],
        },
        right: {
          head: { hi: 'साल में एक बार वाली', en: 'The once-a-year one' },
          tone: 'risk',
          rows: [{ hi: 'कभी आदत बनती ही नहीं', en: 'It never becomes a habit at all' }],
        },
        join: 'none',
        verdict: {
          hi: 'इसलिए तिमाही और सालाना वाली पर नज़र रखिए',
          en: 'So watch the quarterly and yearly ones hardest',
        },
      },
    },
    {
      id: 'gap',
      say: {
        hi: 'छूटी हुई घोषणा का पता अक्सर बहुत बाद में चलता है।',
        en: 'A missed filing usually comes to light much later.',
      },
      broll: 'office-counter',
      block: {
        kind: 'wrong',
        headline: { hi: 'रिकॉर्ड में खाली जगह', en: 'A hole in the record' },
        body: {
          hi: 'रोज़ वाली भरती रही, और तिमाही वाली रह गई।',
          en: 'The daily one kept getting filed. The quarterly one did not.',
        },
        slots: [
          { label: { hi: 'रोज़', en: 'Daily' } },
          { label: { hi: 'हफ़्ता', en: 'Weekly' } },
          { label: { hi: 'महीना', en: 'Monthly' } },
          { label: { hi: 'तिमाही', en: 'Quarterly' }, missing: true },
        ],
      },
    },
    {
      id: 'fix',
      say: {
        hi: 'इसका इलाज़ आसान है — एक कागज़, तारीख़ें, और एक ज़िम्मेदार आदमी।',
        en: 'The fix is simple: one sheet, the dates on it, and one person.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'पूरी सूची एक कागज़ पर', en: 'The whole list, one sheet' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'हर लाइन के आगे तारीख़', en: 'A date against every line' },
            tone: 'brand',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'एक ही आदमी ज़िम्मेदार', en: 'One person answerable' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर घोषणा की तारीख़ पहले ही याद दिला देती है।',
        en: 'MDG Services reminds you of each filing before its date arrives.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'आपके पंप की अपनी सूची, अपनी तारीख़ों के साथ',
          en: "Your outlet's own list, with your own dates on it",
        },
        tone: 'brand',
        note: {
          hi: 'रोज़ वाली भी, और साल में एक बार वाली भी',
          en: 'The daily ones and the yearly one alike',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — सूची बनाइए, तारीख़ लिखिए, एक आदमी को सौंपिए।',
        en: 'Remember: write the list, put dates on it, hand it to one person.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'अपने पंप की अपनी सूची लिखिए', en: "Write your own outlet's list" },
          { hi: 'हर घोषणा के आगे उसकी तारीख़', en: 'Put its date against each filing' },
          { hi: 'सालाना रिपोर्ट की तारीख़ पक्की कीजिए', en: "Confirm the annual report's date" },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
