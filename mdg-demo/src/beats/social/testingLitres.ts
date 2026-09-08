import type { SocialVideo } from '../types';

/**
 * "The testing litres" — the fuel that counts only if you put it back.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * Fuel drawn into the measure for a test passes through the meter exactly like a
 * sale, and then does one of two completely different things. Poured back down
 * the fill point, it was never a sale and never a loss, and it has to come off
 * the meter before the meter is compared with the dip. Not poured back, it left
 * the tank for good — and subtracting it is then simply wrong, because you are
 * telling the book that fuel is still in a tank it has left.
 *
 * The direction of that error is the whole reason to make the video. Subtract
 * litres that never came back and the book expects more stock than the dip
 * finds, so the difference surfaces at month end wearing the costume of a
 * shortage. A dealer then goes looking for a thief who does not exist, or worse,
 * writes an explanation about a loss that was really a record-keeping choice.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * NO NUMBERS AT ALL. Not how many litres a test takes, not how many tests a day,
 * not per pump, not per shift. We hold a working default for that and it is an
 * engineering assumption justified against our own data, published nowhere and
 * owed to nobody — a dealer who quotes it to an inspector is quoting us and will
 * find that out at the worst possible moment. The honest position is the one the
 * source states plainly: nobody measures testing. So the video teaches recording
 * rather than quantity, and the register it describes is four columns a dealer
 * can rule on paper this afternoon.
 *
 * It also does not say what the correct treatment IS in anyone's book but the
 * viewer's own, because that genuinely varies. It says: find out which way your
 * book treats it, and make the register match.
 */
export const testingLitres: SocialVideo = {
  id: 'gen-testing-litres',
  compositionId: 'GenTestingLitres',
  family: 'social',
  bilingual: true,
  title: { hi: 'जाँच का तेल', en: 'The testing litres' },
  subtitle: {
    hi: 'मीटर में चढ़ा, बिका नहीं — गिनती तभी, जब वापस डाला हो',
    en: 'Through the meter but never sold — and only if it goes back',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'जाँच के लिए निकाला तेल मीटर में चढ़ता है, बिकता नहीं।',
        en: 'Fuel drawn for a test goes through the meter, but it is not a sale.',
      },
      broll: 'attendant-register',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'रोज़ का काम', en: 'Daily practice' },
        headline: { hi: 'जाँच का तेल', en: 'The testing litres' },
        sub: {
          hi: 'गिनिए तभी, जब वापस डाला हो',
          en: 'They count only if you put them back',
        },
      },
    },
    {
      id: 'loop',
      say: {
        hi: 'माप में तेल निकला, मीटर ने गिना, और वापस टंकी में गया।',
        en: 'Fuel goes into the measure, the meter counts it, it goes back in.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'माप में निकाला', en: 'Drawn into the measure' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'मीटर ने गिन लिया', en: 'The meter counted it' },
            tone: 'warn',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'वापस टंकी में', en: 'Poured back in' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'loop-closed',
      hold: true,
      say: {
        hi: 'वापस डाल दिया — तो न बिक्री हुई, न कोई नुक़सान हुआ।',
        en: 'Once it is back in the tank, it is neither a sale nor a loss.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'माप में निकाला', en: 'Drawn into the measure' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'मीटर ने गिन लिया', en: 'The meter counted it' },
            tone: 'warn',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'वापस टंकी में', en: 'Poured back in' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'two-ways',
      say: {
        hi: 'वापस नहीं गया, तो वो तेल गया — और घटाना ग़लत हो जाता है।',
        en: 'If it did not go back, that fuel is gone, and subtracting it is wrong.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'वापस डाला', en: 'Put back' },
          tone: 'good',
          rows: [
            { hi: 'मीटर से घटा दीजिए', en: 'Take it off the meter' },
            { hi: 'टंकी में तेल पूरा है', en: 'The tank still holds it' },
          ],
        },
        right: {
          head: { hi: 'वापस नहीं डाला', en: 'Not put back' },
          tone: 'risk',
          rows: [
            { hi: 'वो तेल टंकी से गया', en: 'That fuel has left the tank' },
            { hi: 'घटाया तो हिसाब ग़लत', en: 'Subtract it and the book is wrong' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'two-ways-meter',
      hold: true,
      say: {
        hi: 'मीटर दोनों हालत में चढ़ चुका है — फ़र्क़ बाद में पड़ता है।',
        en: 'The meter has moved either way. The difference comes after that.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'वापस डाला', en: 'Put back' },
          tone: 'good',
          rows: [
            { hi: 'मीटर से घटा दीजिए', en: 'Take it off the meter' },
            { hi: 'टंकी में तेल पूरा है', en: 'The tank still holds it' },
          ],
        },
        right: {
          head: { hi: 'वापस नहीं डाला', en: 'Not put back' },
          tone: 'risk',
          rows: [
            { hi: 'वो तेल टंकी से गया', en: 'That fuel has left the tank' },
            { hi: 'घटाया तो हिसाब ग़लत', en: 'Subtract it and the book is wrong' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'register',
      say: {
        hi: 'इसलिए जाँच का तेल रोज़ लिखिए — और सच लिखिए।',
        en: 'So write the testing fuel down every day, and write it honestly.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'list',
        title: { hi: 'रजिस्टर में चार ख़ाने', en: 'Four columns in the register' },
        items: [
          { text: { hi: 'तारीख़ और नोज़ल', en: 'Date and nozzle' }, ok: true },
          { text: { hi: 'कितने लीटर निकाले', en: 'Litres drawn' }, ok: true },
          { text: { hi: 'वापस डाला या नहीं', en: 'Put back, or not' }, ok: true },
          { text: { hi: 'किसने किया', en: 'Who did it' }, ok: true },
        ],
      },
    },
    {
      id: 'phantom',
      say: {
        hi: 'बिना लिखे, यही लीटर महीने के आख़िर में कमी बन जाते हैं।',
        en: 'Unrecorded, these same litres turn into a shortage at month end.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'कमी, जो जाँच का तेल थी', en: 'A shortage that was only test fuel' },
        body: {
          hi: 'जो लीटर वापस नहीं गए, वही महीने भर जुड़कर कमी बनकर सामने आते हैं।',
          en: 'The litres that never went back pile up and surface as a shortage.',
        },
        slots: [
          { label: { hi: 'निकाले गए लीटर', en: 'Litres drawn' } },
          { label: { hi: 'वापस डाले?', en: 'Put back?' }, missing: true },
          { label: { hi: 'महीने का जोड़', en: 'The month’s total' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ जाँच के लीटर आपके हिसाब में अलग रखती है।',
        en: 'MDG Services keeps your testing litres in a column of their own.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'जाँच का तेल, अलग ख़ाने में',
          en: 'Test fuel, kept in its own column',
        },
        tone: 'brand',
        note: {
          hi: 'ताकि जाँच और कमी आपस में न उलझें',
          en: 'So a test is never mistaken for a shortage',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — वापस डाला हो, तभी वो लीटर मीटर से घटाइए।',
        en: 'Remember: take those litres off the meter only if they went back.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर जाँच रोज़ रजिस्टर में लिखिए', en: 'Record every test, the same day' },
          { hi: 'वापस डाला या नहीं — साफ़ लिखिए', en: 'Say clearly whether it went back' },
          { hi: 'वापस गया हो, तभी घटाइए', en: 'Subtract it only if it did' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
