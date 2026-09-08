import type { SocialBlock, SocialVideo } from '../types';

/**
 * "Let the tank settle" — why a dip taken straight after a decant is not a dip.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * Two things, and they belong together. First, that a reading taken while the
 * fuel is still moving is not a measurement of the stock, it is a measurement of
 * the movement — and the proof is that it reverses itself the next morning.
 * Second, the identity that makes a dip worth taking at all: over a closed day,
 * the tank now equals the tank then, plus what was delivered, minus what was
 * dispensed. A dealer who holds that sentence in his head can prove a tanker
 * arrived from his own dip pair and his own meters, with nothing else in his
 * hand. That is real arithmetic, not a threshold, so it is safe to state.
 *
 * ── THE NUMBERS, AND WHY THEY ARE ROUNDED ──────────────────────────────────
 *
 * The unsettled-dip case is measured, at a real outlet, on real dates: petrol
 * read 2,571 L high one morning and 2,790 L low the next, netting to 219 L short
 * over the two days — which is to say, to nothing. It is the cleanest possible
 * demonstration that an unsettled dip is a reading problem and not a stock
 * problem, and it is the reason this video exists at all.
 *
 * But that outlet is identifiable from those figures and that date, so the video
 * carries the SHAPE of the case and not the case: about 2,500 over, about 2,800
 * short, and a two-day total of almost nothing. No outlet, no date, no code. The
 * lesson survives the rounding completely; the dealer does not.
 *
 * ── WHAT IT DELIBERATELY REFUSES TO SAY ────────────────────────────────────
 *
 * No settling time. Not one minute, not thirty. We have no measured figure for
 * how long a tank takes to settle and inventing one would be handing a dealer a
 * number to argue with, so the video says "until it has stopped moving" and
 * stops there.
 *
 * And none of our own engineering constants — not the litre floor below which an
 * unexplained gain is not treated as a delivery, not the fraction of a gain that
 * has to survive into the next day. Those are defensible choices made against our
 * own data and published nowhere. Said out loud in a video that gets forwarded,
 * they would read as industry rules, and the first dealer to quote one to an
 * inspector would find out they are not.
 *
 * MDG is named once, for what a dealer gets — never for how it is done.
 */

/**
 * The two mornings, and their total.
 *
 * Two beats share this stage: the second is marked `hold`, and the runtime draws
 * the block of the most recent beat that was NOT held. So this object is drawn
 * once and narrated twice — the second sentence lands the total while the picture
 * that earned it is still on screen. The held beat still needs a block to satisfy
 * the type, and pointing both at the same object is the only honest way to show
 * that only one of them is ever drawn.
 */
const twoMornings: SocialBlock = {
  kind: 'flow',
  steps: [
    {
      figure: { hi: 'पहली सुबह', en: 'Morning 1' },
      title: { hi: '+2,500 लीटर', en: '+2,500 L' },
      body: { hi: 'ज़्यादा दिखा', en: 'Showed over' },
      tone: 'risk',
    },
    {
      figure: { hi: 'अगली सुबह', en: 'Morning 2' },
      title: { hi: '−2,800 लीटर', en: '−2,800 L' },
      body: { hi: 'कम दिखा', en: 'Showed short' },
      tone: 'risk',
    },
    {
      figure: { hi: 'जोड़', en: 'Total' },
      title: { hi: 'लगभग शून्य', en: 'Almost nothing' },
      tone: 'good',
    },
  ],
};

/**
 * The closed-day identity, held for a second sentence.
 *
 * Same device as `twoMornings`, and for the same reason: the sum is the picture,
 * and what the sum PROVES is a separate thought that deserves its own breath
 * without the stage cutting underneath it.
 */
const closedDay: SocialBlock = {
  kind: 'list',
  title: { hi: 'एक बंद दिन का हिसाब', en: 'The arithmetic of one closed day' },
  items: [
    { text: { hi: 'कल की डिप', en: "Yesterday's dip" }, ok: true },
    { text: { hi: 'जमा — जो तेल आया', en: 'Plus the fuel that arrived' }, ok: true },
    { text: { hi: 'घटा — जो तेल बिका', en: 'Minus the fuel that was sold' }, ok: true },
    { text: { hi: 'बराबर — आज की डिप', en: "Equals today's dip" }, ok: true },
  ],
};

export const dipSettle: SocialVideo = {
  id: 'gen-dip-settle',
  compositionId: 'GenDipSettle',
  family: 'social',
  bilingual: true,
  title: { hi: 'टैंक को ठहरने दीजिए', en: 'Let the tank settle' },
  subtitle: {
    hi: 'टैंकर के तुरंत बाद ली गई डिप क्यों झूठ बोलती है',
    en: 'Why a dip taken straight after a decant lies to you',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'टैंकर खाली हुआ और आपने डिप लगा दी। वह नाप गलत है।',
        en: 'The tanker has just emptied and you dip the tank. That reading is wrong.',
      },
      broll: 'tanker-delivery',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'स्टॉक', en: 'Stock' },
        headline: { hi: 'टैंक को ठहरने दीजिए', en: 'Let the tank settle' },
        sub: {
          hi: 'डिप गलत हो तो किताब भी गलत',
          en: 'A wrong dip makes a wrong book',
        },
      },
    },
    {
      id: 'settled',
      say: {
        hi: 'तेल अभी ठहरा नहीं है। ठहरे टैंक की नाप ही सच बताती है।',
        en: 'The fuel has not settled yet. Only a settled tank tells you the truth.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'ठहरा हुआ टैंक', en: 'A settled tank' },
          tone: 'good',
          rows: [
            { hi: 'तेल एक जगह रुका है', en: 'The fuel has come to rest' },
            { hi: 'हर बार वही नाप', en: 'The same reading twice' },
          ],
        },
        right: {
          head: { hi: 'अभी-अभी भरा टैंक', en: 'A tank just filled' },
          tone: 'risk',
          rows: [
            { hi: 'तेल अभी हिल रहा है', en: 'The fuel is still moving' },
            { hi: 'नाप हर मिनट बदलेगी', en: 'The reading moves every minute' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'high',
      say: {
        hi: 'एक पंप पर उस सुबह पेट्रोल क़रीब 2,500 लीटर ज़्यादा निकला।',
        en: 'At one outlet the petrol read about 2,500 litres over that morning.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'claim',
        figure: { value: 2500, countUp: true, suffix: 'L' },
        label: { hi: 'ज़्यादा — एक ही सुबह में', en: 'over, in a single morning' },
        tone: 'warn',
        note: {
          hi: 'तेल आया नहीं था, सिर्फ़ नाप ऊपर थी',
          en: 'No fuel had arrived. Only the reading was high.',
        },
      },
    },
    {
      id: 'low',
      say: {
        hi: 'अगली सुबह वही टैंक क़रीब 2,800 लीटर कम निकला।',
        en: 'The next morning the same tank read about 2,800 litres short.',
      },
      broll: 'calendar-wall',
      block: twoMornings,
    },
    {
      id: 'nets',
      say: {
        hi: 'दोनों दिन जोड़िए तो लगभग शून्य। तेल न आया था, न गया।',
        en: 'Add the two days and it is almost nothing. No fuel came, none went.',
      },
      hold: true,
      broll: 'calendar-wall',
      block: twoMornings,
    },
    {
      id: 'identity',
      say: {
        hi: 'बंद दिन का हिसाब सीधा है — कल की डिप, जमा आया, घटा बिका।',
        en: "One closed day: yesterday's dip, plus what arrived, minus what was sold.",
      },
      broll: 'attendant-register',
      block: closedDay,
    },
    {
      id: 'proves',
      say: {
        hi: 'यही जोड़ बता देता है कि टैंकर सच में आया या नहीं।',
        en: 'That same sum tells you whether a tanker really arrived or not.',
      },
      hold: true,
      broll: 'attendant-register',
      block: closedDay,
    },
    {
      id: 'cost',
      say: {
        hi: 'वरना किताब में तेल एक दिन बढ़ता है, अगले दिन गायब हो जाता है।',
        en: 'Otherwise the book shows fuel appearing one day and gone the next.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'दो झूठी लाइनें', en: 'Two false lines' },
        body: {
          hi: 'और आप पूरा दिन वह चोरी ढूँढ़ते हैं जो कभी हुई ही नहीं।',
          en: 'And you spend the day hunting a theft that never happened.',
        },
        cost: {
          figure: { hi: '0 लीटर', en: '0 litres' },
          label: { hi: 'असल में कमी', en: 'the shortage, in truth' },
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ डिप और मीटर मिलाकर बताती है, कमी असली है या नहीं।',
        en: 'MDG Services matches your dip to your meters and says if a loss is real.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर दिन का हिसाब, आपके फ़ोन पर',
          en: "Every day's arithmetic, on your phone",
        },
        tone: 'brand',
        note: {
          hi: 'नाप की गड़बड़ और असली कमी, अलग-अलग',
          en: 'A reading problem and a real loss, kept apart',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — ठहरने दीजिए, फिर नापिए, अगली सुबह मिलाइए।',
        en: 'Remember: let it settle, then dip, and check again the next morning.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'टैंकर के तुरंत बाद डिप नहीं', en: 'No dip straight after a decant' },
          { hi: 'तेल ठहर जाए, तब नापिए', en: 'Dip once the fuel has come to rest' },
          { hi: 'अगली सुबह की डिप से मिलाइए', en: "Check it against the next morning's dip" },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
