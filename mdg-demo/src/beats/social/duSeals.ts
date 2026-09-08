import type { SocialVideo } from '../types';

/**
 * "Two pieces of paper" — DU seals and the weights & measures certificate.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * When a customer says he was given less fuel than he paid for, the argument
 * does not end at the nozzle. It ends at two things: the seals on the dispensing
 * unit, and the certificate that says your measures are honest. A stock
 * variation argument ends at the same two things. That is the whole idea — one
 * cheap pair of habits settles two completely different kinds of trouble.
 *
 * The second half is the part dealers get wrong, and it is worth the video on
 * its own: HAVING a valid certificate and DISPLAYING a copy of it are two
 * separate obligations. A certificate that is current but locked in a drawer
 * satisfies one of them and not the other.
 *
 * ── WHERE THE FACTS COME FROM, AND HOW THEY ARE ATTRIBUTED ─────────────────
 *
 * From a working dealer's own forty-five item assessment sheet, and from the
 * staff work catalogue. On that sheet, keeping the weights & measures
 * certificate valid is one of only two items weighted at 260 points, yearly;
 * displaying a copy is a separate half-yearly item at 80. Checking the seals on
 * every dispensing unit is its own named recurring job.
 *
 * Those weights and cadences are attributed IN THE SCRIPT to that dealer's own
 * sheet, never to Legal Metrology and never to an oil-company circular, because
 * RISKS.md says plainly that the sheet is one dealer's and that dressing its
 * numbers up as an industry standard is a fabrication. The underlying
 * obligations are real; their timings and their point values, as stated here,
 * are one pump's practice.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * It quotes no rule, no clause and no statute. It does not say who may break a
 * seal, what an inspector may do about a broken one, or what a quantity
 * complaint leads to — none of that is evidenced anywhere we can point at, and a
 * dealer acting on a guess would find out he was wrong at the worst possible
 * moment. It teaches the two papers and the habit of keeping them ready.
 */
export const duSeals: SocialVideo = {
  id: 'gen-du-seals',
  compositionId: 'GenDuSeals',
  family: 'social',
  bilingual: true,
  title: { hi: 'सील और सर्टिफ़िकेट', en: 'Seals and the certificate' },
  subtitle: {
    hi: 'नाप की हर शिकायत इन्हीं दो कागज़ों पर आकर रुकती है',
    en: 'Every quantity argument ends at these two pieces of paper',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'ग्राहक कहे तेल कम दिया — तो जवाब दो कागज़ों में है।',
        en: 'A customer says he got less fuel. The answer is two papers.',
      },
      broll: 'forecourt-wide',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'नाप-तौल', en: 'Weights & measures' },
        headline: { hi: 'सील और सर्टिफ़िकेट', en: 'Seals and the certificate' },
        sub: {
          hi: 'दो कागज़, जो हर झगड़ा ख़त्म करते हैं',
          en: 'The two papers that settle every argument',
        },
      },
    },
    {
      id: 'twoends',
      say: {
        hi: 'स्टॉक का फ़र्क़ हो या नाप की शिकायत — रास्ता एक ही है।',
        en: 'A stock variation or a quantity complaint both end in one place.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'स्टॉक का फ़र्क़', en: 'A stock variation' },
          tone: 'warn',
          rows: [
            { hi: 'मीटर सही चल रहा है?', en: 'Is the meter honest?' },
            { hi: 'सील सही है?', en: 'Are the seals intact?' },
          ],
        },
        right: {
          head: { hi: 'नाप की शिकायत', en: 'A quantity complaint' },
          tone: 'warn',
          rows: [
            { hi: 'सर्टिफ़िकेट चालू है?', en: 'Is the certificate current?' },
            { hi: 'कॉपी लगी हुई है?', en: 'Is a copy on display?' },
          ],
        },
        join: 'rails',
        verdict: { hi: 'दोनों झगड़े यहीं आकर रुकते हैं', en: 'Both arguments stop right here' },
      },
    },
    {
      id: 'weight',
      say: {
        hi: 'एक पंप की अपनी लिस्ट में यह काम सबसे भारी है — दो सौ साठ नंबर।',
        en: 'On one pump’s own sheet this job is the heaviest: 260 points.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'claim',
        figure: { value: 260, countUp: true },
        label: { hi: 'नंबर, सिर्फ़ इस एक काम के', en: 'points, for this one job' },
        tone: 'warn',
        note: {
          hi: 'एक चालू पंप की अपनी 45 कामों की लिस्ट से',
          en: 'From one working pump’s own 45-item sheet',
        },
      },
    },
    {
      id: 'onlytwo',
      hold: true,
      say: {
        hi: 'पैंतालीस कामों में से सिर्फ़ दो को इतने नंबर मिले हैं।',
        en: 'Out of forty-five jobs, only two carry that many points.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'claim',
        figure: { value: 260, countUp: true },
        label: { hi: 'नंबर, सिर्फ़ इस एक काम के', en: 'points, for this one job' },
        tone: 'warn',
        note: {
          hi: 'एक चालू पंप की अपनी 45 कामों की लिस्ट से',
          en: 'From one working pump’s own 45-item sheet',
        },
      },
    },
    {
      id: 'separate',
      say: {
        hi: 'सर्टिफ़िकेट होना और उसे लगाना — ये दो अलग-अलग काम हैं।',
        en: 'Having the certificate and displaying it are two different jobs.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'list',
        title: { hi: 'तीन काम, एक ही कागज़ के', en: 'Three jobs, one piece of paper' },
        items: [
          {
            text: { hi: 'सर्टिफ़िकेट चालू हो', en: 'Keep the certificate valid' },
            sub: { hi: 'साल में एक बार, 260 नंबर', en: 'Yearly, 260 points' },
            ok: true,
          },
          {
            text: { hi: 'उसकी कॉपी लगी हो', en: 'Keep a copy on display' },
            sub: { hi: 'छह महीने में, 80 नंबर', en: 'Half-yearly, 80 points' },
            ok: true,
          },
          {
            text: { hi: 'हर DU की सील देखी जाए', en: 'Check the seals on every DU' },
            sub: { hi: 'रोज़ के कामों में', en: 'Part of the daily round' },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'ready',
      say: {
        hi: 'तीनों ठीक हों तो शिकायत का जवाब पहले से तैयार रहता है।',
        en: 'Get all three right and the answer is ready before the complaint.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'सील', en: 'Seal' },
            title: { hi: 'हर DU पर सही', en: 'Intact on every DU' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'तारीख़', en: 'Date' },
            title: { hi: 'सर्टिफ़िकेट चालू', en: 'Certificate current' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'कॉपी', en: 'Copy' },
            title: { hi: 'दीवार पर लगी', en: 'Displayed on the wall' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'drawer',
      say: {
        hi: 'सर्टिफ़िकेट दराज़ में पड़ा है तो शिकायत के वक़्त दिखेगा क्या?',
        en: 'If the certificate sits in a drawer, what do you point at?',
      },
      broll: 'ledger-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'है, पर दिख नहीं रहा', en: 'You have it, but it is not shown' },
        body: {
          hi: 'चालू सर्टिफ़िकेट दराज़ में रखने से आधा काम ही पूरा होता है।',
          en: 'A valid certificate in a drawer only does half of the job.',
        },
        slots: [
          { label: { hi: 'सर्टिफ़िकेट चालू', en: 'Certificate valid' } },
          { label: { hi: 'सील सही', en: 'Seals intact' } },
          { label: { hi: 'कॉपी लगी है?', en: 'Copy on display?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ सर्टिफ़िकेट की तारीख़ पहले से याद दिला देती है।',
        en: 'MDG Services reminds you of the certificate date well before it lapses.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'तारीख़, सील की जाँच और कागज़ का सबूत',
          en: 'The date, the seal check, and the proof',
        },
        tone: 'brand',
        note: {
          hi: 'ताकि शिकायत आए तो जवाब पहले से तैयार हो',
          en: 'So the answer is ready before the complaint is',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'सील देखिए, तारीख़ देखिए, और कॉपी दीवार पर लगाइए।',
        en: 'Check the seals, check the date, and put the copy on the wall.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर DU की सील देख लीजिए', en: 'Check the seal on every DU' },
          { hi: 'सर्टिफ़िकेट की तारीख़ देखिए', en: 'Check the certificate’s date' },
          { hi: 'कॉपी लगाकर रखिए', en: 'Keep a copy on display' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
