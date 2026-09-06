import type { Film } from './film';

/**
 * The marketing film's script — the single source of truth for both cuts.
 *
 * Each scene carries the Hindi and the English narration. That text is BOTH the
 * spoken voiceover (`npm run voice`) AND the on-screen caption, exactly as in
 * the tutorials, because a forwarded video is watched with the sound off at
 * least as often as with it on.
 *
 * ── WHAT THIS FILM MAY AND MAY NOT SAY ────────────────────────────────────
 * It says what the dealer RECEIVES. It never says how any of it is produced —
 * no portals signed into, no credentials, no data collection, no schedules, no
 * "AI". That is not squeamishness: the same rule governs the website and the
 * pamphlet (see `mdg-landing/src/data/content.ts`), because method is the one
 * thing on a marketing surface that helps a competitor and helps no customer.
 * If a line here ever needs to explain HOW, the line is wrong.
 *
 * Every figure is one we can produce on request:
 *   45         compliance items on the clock, per outlet
 *   22         deadline windows tracked
 *   11 hrs     what the work costs a dealer doing it himself, per week
 *   9          services; 7 days to go live; 9am–9pm support
 * Nothing else is claimed. In particular no outlet count and no state count.
 *
 * ── ON THE HINDI ──────────────────────────────────────────────────────────
 * Spoken Hindi, not written Hindi, and matched to the vetted voice in
 * `mdg-landing/src/i18n/hi`: nuqta kept (तारीख़, फ़ोन, ग़लत), इतवार rather than
 * रविवार, and portal names left in Latin because that is how a dealer sees them
 * on his own screens. The English cut is a rewrite, not a translation — same
 * beats, same length, natural for an Indian dealer reading English.
 */

export const film: Film = {
  id: 'marketing',

  titleHi: 'आपका DSR, पहले से भरा हुआ',
  titleEn: 'Your DSR, already filled in',
  subtitleHi: "Dealer's कवच — पंप की सारी तारीख़ें और सारे काग़ज़, हमारे ज़िम्मे।",
  subtitleEn: "Dealer's Kavach — every date and every paper at your pump, handled.",

  scenes: [
    /* ── The hook. Four seconds to name the worst morning a dealer has, before
       the film has earned anything at all. No logo, no welcome. ── */
    {
      id: 'gate-not-ready',
      step: 'gate',
      hi: 'टीम गेट पर आ गई है। और आपकी फ़ाइल पूरी नहीं है।',
      en: 'The team is at your gate. And your file is not ready.',
      estSecondsHi: 4,
      estSecondsEn: 4,
      broll: 'gate-arrival',
      brollWeight: 0.72,
    },

    /* The nightly job the dealer actually recognises: adding the register up,
       doubting it, adding it again. */
    {
      id: 'one-wrong-figure',
      step: 'register',
      hi: 'एक नंबर ग़लत, तो पूरा पन्ना दोबारा। रोज़ रात यही चलता है।',
      en: 'One wrong figure and the whole page again. That is every night.',
      estSecondsHi: 5.5,
      estSecondsEn: 5,
      broll: 'ledger-night',
    },

    /* The turn. The picture arrives, already worked out. */
    {
      id: 'photo-on-whatsapp',
      step: 'arrives',
      hi: 'अब हर सुबह आपके WhatsApp पर एक फ़ोटो आती है — DSR, पहले से भरा हुआ।',
      en: 'Now every morning a picture lands on your WhatsApp — the DSR, already filled in.',
      estSecondsHi: 6,
      estSecondsEn: 6,
      broll: 'phone-morning',
    },

    /* The proof that it is usable: same rows, and it does not have to be him. */
    {
      id: 'anyone-can-copy',
      step: 'same-format',
      hi: 'वही लाइनें, वही तरतीब, वही नंबर। पंप का कोई भी आदमी देखकर उतार दे।',
      en: 'Same rows, same order, same figures. Anyone at the pump can just copy it across.',
      estSecondsHi: 6.5,
      estSecondsEn: 6,
      broll: 'attendant-register',
    },

    /* Only now is the company named — after it has given him something. */
    {
      id: 'this-is-kavach',
      step: 'nine-reveal',
      hi: "ये है Dealer's कवच। DSR तो बस शुरुआत है — पूरे नौ काम हमारे ज़िम्मे।",
      en: "This is Dealer's Kavach. The DSR is only the start — nine kinds of work, off your hands.",
      estSecondsHi: 6.5,
      estSecondsEn: 6.5,
      broll: 'forecourt-wide',
    },

    /* The size of the load, and what carrying it costs him. */
    {
      id: 'forty-five-items',
      step: 'load',
      hi: 'एक पंप पर 45 काम, हर एक की अपनी तारीख़। ख़ुद करें तो हफ़्ते में क़रीब ग्यारह घंटे।',
      en: 'Forty-five things run on the clock at one pump. Doing it yourself costs about eleven hours a week.',
      estSecondsHi: 7.5,
      estSecondsEn: 7.5,
      broll: 'paper-stack',
    },

    /**
     * Callback to the opening gate: this time the file is full.
     *
     * The inspection bodies are NOT spoken. They are already on screen as five
     * labelled folders, and reading a list aloud that the eye is reading anyway
     * costs three seconds and adds nothing.
     */
    {
      id: 'records-ready',
      step: 'records',
      hi: 'SDMS का हर काम समय पर पूरा। जो भी टीम आए — रिकॉर्ड तैयार।',
      en: 'Every SDMS item done on time and closed. Whichever team comes, the records are ready.',
      estSecondsHi: 5.5,
      estSecondsEn: 5.5,
      broll: 'file-shelf',
    },

    {
      id: 'stock-and-density',
      step: 'variation',
      hi: 'स्टॉक और डेंसिटी पर रोज़ नज़र। गड़बड़ी नोटिस बनने से पहले पकड़ी जाती है।',
      en: 'Stock and density watched every day. Trouble is caught before it becomes a notice.',
      estSecondsHi: 6,
      estSecondsEn: 5.5,
      broll: 'tank-dip',
    },

    /* Fire NOC and Weights & Measures are on the card, so the line does not
       spend its seconds saying them again. */
    {
      id: 'twenty-two-dates',
      step: 'deadlines',
      hi: 'तारीख़ कब निकल गई, पता ही नहीं चलता। 22 तारीख़ें हमारी नज़र में रहती हैं।',
      en: 'A date slips past and nobody notices. Twenty-two of them stay on our watch.',
      estSecondsHi: 6,
      estSecondsEn: 6,
      broll: 'calendar-wall',
    },

    {
      id: 'sunday-night',
      step: 'night',
      hi: 'इतवार की रात ऑटोमेशन बंद — अब किसको फ़ोन करें? उसी वक़्त पकड़ में आ जाता है।',
      en: 'Sunday night, automation is down. Who do you call? It is caught the same moment.',
      estSecondsHi: 6.5,
      estSecondsEn: 6,
      broll: 'pump-night',
    },

    {
      id: 'dod-by-morning',
      step: 'dod',
      hi: 'DOD, स्टॉक, डिलीवरी की तारीख़ — कल का हिसाब सुबह तक मिला हुआ।',
      en: "DOD, stock on hand, delivery dates — yesterday's account tallied by morning.",
      estSecondsHi: 6,
      estSecondsEn: 5.5,
      broll: 'tanker-delivery',
    },

    /**
     * Credit & DOD monitoring.
     *
     * The one beat about money the dealer owes rather than paper he files, and
     * the card he receives says it in two figures: how much, and by when. The
     * line names Indian Oil because "कितना जमा करना है" on its own does not say
     * to whom, and a dealer pays more than one person.
     */
    {
      id: 'credit-and-dod',
      step: 'credit',
      hi: 'इंडियन ऑयल को कितना जमा करना है, और कब तक — साफ़ लिखा हुआ आपके पास।',
      en: 'What you owe Indian Oil, and the last date to pay it — written out plainly, and sent to you.',
      estSecondsHi: 7,
      estSecondsEn: 7,
      broll: 'office-counter',
    },

    /* The ask, made small: one call, and he chooses what is switched on. */
    {
      id: 'one-phone-call',
      step: 'pick',
      hi: 'शुरुआत एक फ़ोन से। जो काम चाहिए वही चालू कराइए — रेट पहले लिखकर।',
      en: 'It starts with one phone call. You pick what to switch on, and the price is in writing first.',
      estSecondsHi: 6.5,
      estSecondsEn: 6.5,
      broll: 'phone-call',
    },

    /* The line the whole film exists to land. */
    {
      id: 'not-a-minute',
      step: 'promise',
      hi: 'उसी हफ़्ते सब चालू। उसके बाद आपका एक मिनट भी नहीं लगता।',
      en: 'Live the same week. After that, you do not spend a single minute on it.',
      estSecondsHi: 5,
      estSecondsEn: 5,
      broll: 'sunrise-calm',
      brollWeight: 0.84,
    },

    /* "हिंदी या English" is a chip on the closing card, so the line leaves it
       to the screen and spends its last seconds on the ask instead. */
    {
      id: 'nine-to-nine',
      step: 'close',
      hi: 'सुबह 9 से रात 9, हर दिन, वही टीम। एक बार बात कर लीजिए।',
      en: 'Nine to nine, every day, the same team. Just have one conversation with us.',
      estSecondsHi: 6.5,
      estSecondsEn: 6,
      broll: 'forecourt-wide',
      brollWeight: 0.9,
    },
  ],
};
