import type { SocialVideo } from '../types';

/**
 * "The lines that are not fuel" — how to read an oil-company statement.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * A dealer carries one mental model of the account he holds with his oil
 * company: he buys fuel and it goes out, he deposits money and it comes in, and
 * the balance is the difference between the two. That model is wrong in a way
 * that costs him an argument every month, because a real statement carries ten
 * other kinds of line — interest, licence fee recovery, a participation fee,
 * machinery rent, EMI recoveries, card settlements, and his own commission paid
 * back to him — and every one of them moves the balance he is trying to tie out.
 *
 * The teaching is therefore not a number, it is a habit: separate the fuel
 * invoices, separate your own deposits, and then ask what every remaining line
 * actually is. The video ends there because that is where a dealer can act.
 *
 * ── WHERE THE FACTS COME FROM ──────────────────────────────────────────────
 *
 * Measured, not guessed: 3,163 live ledger rows across eleven outlets between
 * April and September 2026, classified into twelve repeating patterns. The two
 * figures the script actually speaks are the count of patterns (twelve, of which
 * only two are the fuel-and-money pair) and the spread on one nominally fixed
 * charge, which ran from ₹63.10 to ₹9,443.12 on the same name — a hundred and
 * fifty fold apart. That spread is the whole reason the closing advice is "read
 * the amount, not the name".
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * It never says what the oil company will do about an unpaid balance, in any
 * form. It never claims any of these charges is wrongly levied — the point is
 * that a dealer should know what each one is, not that any of them is a fraud,
 * and a video that hinted otherwise would be forwarded to ten thousand people as
 * an accusation. It names no outlet and no amount that could identify one; the
 * two rupee figures it quotes are a charge's floor and ceiling across eleven
 * accounts, which belongs to no single dealer.
 *
 * And it never describes how any statement is read on our side. It says what a
 * dealer gets and stops.
 */
export const ledgerLines: SocialVideo = {
  id: 'gen-ledger-lines',
  compositionId: 'GenLedgerLines',
  family: 'social',
  bilingual: true,
  title: { hi: 'तेल के अलावा की लाइनें', en: 'The lines that are not fuel' },
  subtitle: {
    hi: 'कंपनी के खाते में जो चुपचाप पैसा हिलाता है',
    en: 'What quietly moves money on your oil-company account',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'कंपनी का खाता सिर्फ़ तेल और जमा का नहीं होता।',
        en: 'Your oil company account is not just fuel and deposits.',
      },
      broll: 'ledger-night',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'पैसे का हिसाब', en: 'Money' },
        headline: { hi: 'तेल के अलावा की लाइनें', en: 'The lines that are not fuel' },
        sub: {
          hi: 'जो आपका बकाया चुपचाप बदल देती हैं',
          en: 'The ones that quietly change what you owe',
        },
      },
    },
    {
      id: 'twothings',
      say: {
        hi: 'आप मानते हैं दो ही चीज़ें हैं — तेल लिया, पैसा जमा किया।',
        en: 'You assume there are two things: fuel taken, money deposited.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'जो आप मानते हैं', en: 'What you assume' },
          tone: 'neutral',
          rows: [
            { hi: 'तेल का बिल', en: 'The fuel invoice' },
            { hi: 'आपकी जमा रकम', en: 'Your deposit' },
          ],
        },
        right: {
          head: { hi: 'जो सच में लिखा है', en: 'What is actually on it' },
          tone: 'warn',
          rows: [
            { hi: 'ब्याज, फ़ीस, किराया', en: 'Interest, fees, rent' },
            { hi: 'EMI और कार्ड सेटलमेंट', en: 'EMIs and card settlements' },
          ],
        },
        join: 'arrow',
      },
    },
    {
      id: 'twelve',
      say: {
        hi: 'ग्यारह पंपों के खातों में बारह तरह की लाइनें मिलीं।',
        en: 'Across eleven pumps’ accounts we found twelve kinds of line.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'claim',
        figure: { value: 12, countUp: false },
        label: { hi: 'तरह की लाइनें, एक ही खाते पर', en: 'kinds of line on one account' },
        tone: 'warn',
        viz: 'dots',
        vizProps: { total: 12, filled: 10 },
        note: {
          hi: 'छह महीने के खाते, अप्रैल से सितंबर तक',
          en: 'Six months of statements, April to September',
        },
      },
    },
    {
      id: 'onlytwo',
      hold: true,
      say: {
        hi: 'इनमें से सिर्फ़ दो तेल और पैसा हैं। बाक़ी दस बकाया बदलती हैं।',
        en: 'Only two are fuel and money. The other ten change your balance.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'claim',
        figure: { value: 12, countUp: false },
        label: { hi: 'तरह की लाइनें, एक ही खाते पर', en: 'kinds of line on one account' },
        tone: 'warn',
        viz: 'dots',
        vizProps: { total: 12, filled: 10 },
        note: {
          hi: 'छह महीने के खाते, अप्रैल से सितंबर तक',
          en: 'Six months of statements, April to September',
        },
      },
    },
    {
      id: 'whatthey',
      say: {
        hi: 'ब्याज, लाइसेंस फ़ीस, किराया, EMI, कार्ड सेटलमेंट, कमीशन।',
        en: 'Interest, licence fee, rent, EMIs, card settlements, commission.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'list',
        title: { hi: 'तेल नहीं — फिर भी खाते पर', en: 'Not fuel, still on the account' },
        items: [
          { text: { hi: 'ब्याज', en: 'Interest' }, ok: false },
          { text: { hi: 'लाइसेंस फ़ीस की वसूली', en: 'Licence fee recovery' }, ok: false },
          { text: { hi: 'पार्टिसिपेशन फ़ीस', en: 'Participation fee' }, ok: false },
          { text: { hi: 'मशीनरी का किराया', en: 'Machinery rent' }, ok: false },
          { text: { hi: 'साइट मॉडर्नाइज़ेशन की EMI', en: 'Site modernisation EMI' }, ok: false },
          { text: { hi: 'फ़्लीट कार्ड सेटलमेंट', en: 'Fleet card settlement' }, ok: true },
          { text: { hi: 'आपका अपना कमीशन', en: 'Your own commission' }, ok: true },
        ],
      },
    },
    {
      id: 'samename',
      say: {
        hi: 'एक ही नाम की फ़ीस ₹63 भी दिखी है और ₹9,443 भी।',
        en: 'A charge with one name showed up as ₹63, and as ₹9,443.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'एक नाम की फ़ीस', en: 'A charge, by name' },
          figure: { hi: '₹63', en: '₹63' },
          tone: 'good',
          note: { hi: 'एक खाते पर', en: 'On one account' },
        },
        right: {
          head: { hi: 'वही नाम, दूसरा खाता', en: 'Same name, another account' },
          figure: { hi: '₹9,443', en: '₹9,443' },
          tone: 'risk',
          note: { hi: 'उन्हीं छह महीनों में', en: 'In the same six months' },
        },
        join: 'rails',
        verdict: {
          hi: 'नाम एक, रकम में डेढ़ सौ गुना फ़र्क़',
          en: 'One name, a hundred and fifty fold difference',
        },
      },
    },
    {
      id: 'howtoread',
      say: {
        hi: 'तेल के बिल छाँटिए, जमा छाँटिए — जो बचा वही जवाब है।',
        en: 'Mark the fuel bills, mark your deposits. What is left is the answer.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'तेल के बिल छाँटिए', en: 'Mark the fuel bills' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'अपनी जमा छाँटिए', en: 'Mark your deposits' },
            tone: 'neutral',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'जो बचा', en: 'What is left' },
            body: { hi: 'यही बकाया हिला रहा है', en: 'This is what moved the balance' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'trap',
      say: {
        hi: 'हिसाब न मिले तो लगता है कंपनी ने ग़लती की है।',
        en: 'When it does not tie, it looks like the company made a mistake.',
      },
      broll: 'pump-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'सिर्फ़ दो चीज़ें मिलाईं', en: 'You matched only two things' },
        body: {
          hi: 'बाक़ी लाइनें छूट गईं, इसलिए जोड़ कभी मिलता ही नहीं।',
          en: 'The rest were skipped, so the total never comes out right.',
        },
        slots: [
          { label: { hi: 'तेल का बिल', en: 'Fuel invoice' } },
          { label: { hi: 'जमा रकम', en: 'Deposit' } },
          { label: { hi: 'ब्याज और फ़ीस?', en: 'Interest and fees?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर लाइन को नाम देकर आपको बता देती है।',
        en: 'MDG Services names every line on that account for you.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर लाइन का नाम, आपकी अपनी भाषा में',
          en: 'Every line named, in your own language',
        },
        tone: 'brand',
        note: {
          hi: 'कौन-सा तेल है, कौन-सी जमा, और बाक़ी क्या',
          en: 'Which is fuel, which is a deposit, and what the rest are',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'तेल और जमा अलग कीजिए, बाक़ी हर लाइन का नाम पूछिए।',
        en: 'Separate fuel and deposits, then ask what every other line is.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'तेल के बिल अलग कीजिए', en: 'Separate the fuel invoices' },
          { hi: 'अपनी जमा अलग कीजिए', en: 'Separate your own deposits' },
          { hi: 'बाक़ी में नाम नहीं, रकम देखिए', en: 'On the rest, read the amount' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
