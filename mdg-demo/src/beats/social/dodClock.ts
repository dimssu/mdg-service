import type { SocialVideo } from '../types';

/**
 * "The three-day clock" — the first video authored as data.
 *
 * ── WHAT IT TEACHES, AND WHAT IT REFUSES TO ────────────────────────────────
 *
 * One hard rule, stated plainly: once a dealer's running balance with the oil
 * company crosses to zero or below, credit taken after that has to be repaid
 * within three days, and a third day landing on a bank holiday — a Sunday, or
 * the second or fourth Saturday — rolls forward to the next working day. That
 * rule is encoded in this repository as running code and is safe to state.
 *
 * IT DOES NOT SAY WHAT HAPPENS IF YOU MISS IT. The repo is explicit that what
 * IndianOil actually does on a missed deadline, and at what threshold, is not
 * visible in anything the portal gives us. Guessing at a consequence in a video
 * that gets forwarded on WhatsApp is exactly the way to do real harm to somebody
 * who acts on it, so the video stops at the deadline and the arithmetic.
 *
 * Nor does it describe how any of this is watched. It names MDG and says what a
 * dealer gets — that part is deliberate and encouraged — but never the ops
 * portal, never the method. The `SocialBlock` union enforces the picture half of
 * that rule at compile time; the words are on the author.
 */
export const dodClock: SocialVideo = {
  id: 'gen-dod-clock',
  compositionId: 'GenDodClock',
  family: 'social',
  bilingual: true,
  title: { hi: 'तीन दिन की गिनती', en: 'The three-day clock' },
  subtitle: {
    hi: 'उधार लिया तेल — कब तक जमा करना है',
    en: 'Fuel taken on credit, and the day it must be paid back',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'खाता शून्य से नीचे गया — तो गिनती शुरू हो चुकी है।',
        en: 'The moment your balance goes below zero, a clock starts.',
      },
      broll: 'ledger-night',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'पैसे का हिसाब', en: 'Money' },
        headline: { hi: 'तीन दिन की गिनती', en: 'The three-day clock' },
        sub: {
          hi: 'जो अक्सर किसी को दिखती नहीं',
          en: 'The one nobody sends you a reminder about',
        },
      },
    },
    {
      id: 'balance',
      say: {
        hi: 'जब तक खाते में पैसा है, आप तेल खरीदते हैं और पैसा कटता है।',
        en: 'While there is money in the account, you buy fuel and it is deducted.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'खाते में पैसा है', en: 'Money in the account' },
          tone: 'good',
          rows: [
            { hi: 'तेल लीजिए', en: 'Take the fuel' },
            { hi: 'पैसा कट जाता है', en: 'It is deducted' },
          ],
        },
        right: {
          head: { hi: 'खाता शून्य से नीचे', en: 'Balance below zero' },
          tone: 'risk',
          rows: [
            { hi: 'तेल अब उधार है', en: 'The fuel is now credit' },
            { hi: 'गिनती शुरू', en: 'The clock starts' },
          ],
        },
        join: 'arrow',
      },
    },
    {
      id: 'three',
      say: {
        hi: 'उसके बाद लिया गया उधार तीन दिन में जमा करना होता है।',
        en: 'Credit taken after that has to be repaid within three days.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'claim',
        figure: { value: 3, countUp: false },
        label: { hi: 'दिन — जमा करने के लिए', en: 'days to deposit' },
        tone: 'warn',
        note: {
          hi: 'गिनती उधार वाले दिन से',
          en: 'Counted from the day the credit was taken',
        },
      },
    },
    {
      id: 'holiday',
      say: {
        hi: 'तीसरा दिन बैंक की छुट्टी हो, तो तारीख़ आगे खिसक जाती है।',
        en: 'If the third day is a bank holiday, the date moves forward.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'list',
        title: { hi: 'ये दिन छुट्टी माने जाते हैं', en: 'These count as holidays' },
        items: [
          { text: { hi: 'हर रविवार', en: 'Every Sunday' }, ok: false },
          { text: { hi: 'महीने का दूसरा शनिवार', en: 'The 2nd Saturday' }, ok: false },
          { text: { hi: 'महीने का चौथा शनिवार', en: 'The 4th Saturday' }, ok: false },
        ],
      },
    },
    {
      id: 'worked',
      say: {
        hi: 'मान लीजिए शुक्रवार को उधार लिया। तीसरा दिन रविवार बनता है।',
        en: 'Say you took credit on a Friday. The third day lands on a Sunday.',
      },
      broll: 'phone-morning',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'शुक्र', en: 'Fri' },
            title: { hi: 'उधार लिया', en: 'Credit taken' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'रवि', en: 'Sun' },
            title: { hi: 'तीसरा दिन', en: 'Third day' },
            body: { hi: 'बैंक बंद', en: 'Bank closed' },
            tone: 'risk',
          },
          {
            figure: { hi: 'सोम', en: 'Mon' },
            title: { hi: 'असली तारीख़', en: 'The real deadline' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'trap',
      say: {
        hi: 'दिक़्क़त यह है — यह तारीख़ कहीं लिखकर नहीं आती।',
        en: 'The catch: nobody sends you this date in writing.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'कोई याद नहीं दिलाता', en: 'Nobody reminds you' },
        body: {
          hi: 'तारीख़ हर बार बदलती है — उधार के दिन और छुट्टियों के हिसाब से।',
          en: 'The date changes every time, with the day you took credit and the holidays after it.',
        },
        slots: [
          { label: { hi: 'उधार का दिन', en: 'Day taken' } },
          { label: { hi: 'तीन दिन', en: 'Three days' } },
          { label: { hi: 'छुट्टियाँ?', en: 'Holidays?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ यह तारीख़ रोज़ निकालकर आपको बता देती है।',
        en: 'MDG Services works this date out every day and tells you.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'रोज़ आपके फ़ोन पर — कितना और कब तक',
          en: 'On your phone daily: how much, and by when',
        },
        tone: 'brand',
        note: {
          hi: 'छुट्टियाँ जोड़कर, आपकी अपनी भाषा में',
          en: 'Holidays already counted, in your own language',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — शून्य के बाद उधार, तीन दिन, और छुट्टी हो तो आगे।',
        en: 'Remember: credit after zero, three days, and a holiday pushes it on.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'खाता शून्य से नीचे गया?', en: 'Balance gone below zero?' },
          { hi: 'उधार के तीन दिन गिनिए', en: 'Count three days from the credit' },
          {
            hi: 'छुट्टी पड़े तो अगला कामकाजी दिन',
            en: 'A holiday pushes it to the next working day',
          },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
