import type { SocialVideo } from '../types';

/**
 * "Three books by ten" — the morning routine, and whose deadline it really is.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * The cheapest compliance a pump has: the DSR book filled, the density book
 * filled, and the stock board correct, all of it done before ten in the
 * morning. Three items, one deadline, every single day. The order is the only
 * mechanical part — the dip and the density come first because both books are
 * written from them, and the board is written last because it is written from
 * the books.
 *
 * ── WHERE THE TEN O'CLOCK COMES FROM, AND WHY THE VIDEO SAYS SO ────────────
 *
 * From one working dealer's own pump assessment sheet, where these are the
 * first three rows and each is marked daily. It is NOT an oil-company circular,
 * and this file will not let a viewer come away thinking it is: the claim beat
 * carries the provenance in its note and the beat held after it says the same
 * thing out loud in the narration, because the caption is what a sound-off
 * viewer reads. The point values on that sheet are deliberately absent — they
 * are one dealer's weighting, they would be read as an industry tariff, and
 * they add nothing a dealer can act on.
 *
 * The line about the density book being the first thing anyone asks for is
 * hedged to "in most cases". It matches what operators say and it is almost
 * certainly right, but no document in our hands states it, so it goes out as
 * practice rather than as a rule.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * Nothing about what an inspection does with a blank or a back-filled register.
 * The video shows four days with three of them empty and stops there. Saying
 * what follows would be inventing a consequence, and the empty row is already
 * the argument.
 */
export const dailyBooks: SocialVideo = {
  id: 'gen-daily-books',
  compositionId: 'GenDailyBooks',
  family: 'social',
  bilingual: true,
  title: { hi: 'दस बजे तक तीन किताबें', en: 'Three books by 10 am' },
  subtitle: {
    hi: 'सुबह का वो काम जो सबसे सस्ता है',
    en: 'The cheapest work on the whole board',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'सुबह दस बजे तक तीन किताबें तैयार होनी चाहिए। रोज़।',
        en: 'Three books have to be right by ten in the morning. Every day.',
      },
      broll: 'attendant-register',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'सुबह का काम', en: 'The morning' },
        headline: { hi: 'दस बजे तक तीन किताबें', en: 'Three books by 10 am' },
        sub: {
          hi: 'सबसे सस्ता काम, सबसे पहले माँगा जाने वाला',
          en: 'The cheapest job, and the first one anyone asks for',
        },
      },
    },
    {
      id: 'three',
      say: {
        hi: 'डीएसआर बुक, डेंसिटी बुक, और स्टॉक बोर्ड। बस यही तीन।',
        en: 'The DSR book, the density book, and the stock board. Just those.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'list',
        title: { hi: 'दस बजे तक', en: 'By 10 am' },
        items: [
          { text: { hi: 'डीएसआर बुक भरी हुई', en: 'DSR book filled' }, ok: true },
          { text: { hi: 'डेंसिटी बुक भरी हुई', en: 'Density book filled' }, ok: true },
          { text: { hi: 'स्टॉक बोर्ड सही लिखा', en: 'Stock board correct' }, ok: true },
        ],
      },
    },
    {
      id: 'ten',
      say: {
        hi: 'दस बजे — यही वो समय है जब कोई भी आकर पूछ सकता है।',
        en: 'Ten o’clock — that is when anyone can walk in and ask.',
      },
      broll: 'office-counter',
      block: {
        kind: 'claim',
        figure: { value: 10 },
        label: { hi: 'बजे तक तीनों तैयार', en: "o'clock, and all three are ready" },
        tone: 'warn',
        note: {
          hi: 'यह समय एक चलते पंप की अपनी चेकलिस्ट से आया है',
          en: "This deadline comes from a working dealer's own checklist",
        },
      },
    },
    {
      id: 'whose',
      hold: true,
      say: {
        hi: 'यह समय किसी सर्कुलर का नहीं — एक चलते पंप की अपनी चेकलिस्ट का है।',
        en: 'It is not from a circular. It is a working pump’s own house rule.',
      },
      broll: 'office-counter',
      block: {
        kind: 'claim',
        figure: { value: 10 },
        label: { hi: 'बजे तक तीनों तैयार', en: "o'clock, and all three are ready" },
        tone: 'warn',
        note: {
          hi: 'यह समय एक चलते पंप की अपनी चेकलिस्ट से आया है',
          en: "This deadline comes from a working dealer's own checklist",
        },
      },
    },
    {
      id: 'order',
      say: {
        hi: 'क्रम आसान है — पहले डिप, फिर दोनों किताबें, फिर बोर्ड।',
        en: 'The order is simple: the dip, then both books, then the board.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'पहले', en: 'First' },
            title: { hi: 'डिप और डेंसिटी', en: 'Dip and density' },
            body: { hi: 'टंकी पर', en: 'At the tank' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'फिर', en: 'Then' },
            title: { hi: 'दोनों किताबें', en: 'Both books' },
            body: { hi: 'उन्हीं आँकड़ों से', en: 'From those figures' },
            tone: 'neutral',
          },
          {
            figure: { hi: '10', en: '10' },
            title: { hi: 'बोर्ड पर लिख दीजिए', en: 'Put it on the board' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'daily',
      say: {
        hi: 'रोज़ दस मिनट, या महीने के आख़िर में दो दिन। चुनाव आपका है।',
        en: 'Ten minutes a day, or two days at month end. That is the choice.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'रोज़ दस मिनट', en: 'Ten minutes daily' },
          tone: 'good',
          rows: [
            { hi: 'आँकड़े ताज़ा रहते हैं', en: 'The figures stay fresh' },
            { hi: 'ग़लती उसी दिन पकड़ी जाती है', en: 'A mistake is caught that day' },
          ],
        },
        right: {
          head: { hi: 'बाद में एक साथ', en: 'All at once, later' },
          tone: 'risk',
          rows: [
            { hi: 'याद के भरोसे लिखना', en: 'Written from memory' },
            { hi: 'ग़लती महीनों बाद मिलती है', en: 'The mistake shows months later' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'backfill',
      say: {
        hi: 'सबसे आम ग़लती — डेंसिटी बुक हफ़्ते बाद पीछे की तारीख़ों में भरना।',
        en: 'The commonest mistake: back-filling the density book a week later.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'एक ही कलम, एक ही बैठक', en: 'One pen, one sitting' },
        body: {
          hi: 'आम तौर पर सबसे पहले यही किताब माँगी जाती है, और एक साथ भरी हुई किताब देखने में साफ़ पता चल जाती है।',
          en: 'In most cases this is the first book anyone asks for, and a book filled in one sitting is obvious to look at.',
        },
        slots: [
          { label: { hi: 'सोम', en: 'Mon' } },
          { label: { hi: 'मंगल', en: 'Tue' }, missing: true },
          { label: { hi: 'बुध', en: 'Wed' }, missing: true },
          { label: { hi: 'गुरु', en: 'Thu' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ रोज़ बता देती है कि इनमें से क्या बाक़ी रह गया है।',
        en: 'MDG Services tells you each day which of these is still not done.',
      },
      broll: 'phone-morning',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: { hi: 'दिन की सूची, आपके फ़ोन पर', en: "The day's list, on your phone" },
        tone: 'brand',
        note: {
          hi: 'किसने किया और कब किया — सब लिखा हुआ',
          en: 'Who did it and when, all written down',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'तीन किताबें, दस बजे, और हर दिन का काम उसी दिन। बस इतना।',
        en: 'Three books, ten o’clock, each day’s work on the day. That is all.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'डीएसआर बुक भरिए', en: 'Fill the DSR book' },
          { hi: 'डेंसिटी बुक भरिए', en: 'Fill the density book' },
          { hi: 'स्टॉक बोर्ड मिलाइए', en: 'Match the stock board' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
