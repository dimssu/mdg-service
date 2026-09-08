import type { SocialBlock, SocialVideo } from '../types';

/**
 * "The wall before the books" — the papers that hang, and the sheets that fill.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * The cheapest compliance a dealer owns, and the most visible. Five things that
 * hang on a wall — the PESO licence number inside the sales building, the
 * emergency number outside it, and copies of the trade licence, the GST
 * certificate and the weights-and-measures certificate. Then the distinction the
 * whole video turns on: a copy on the wall and a licence that is still valid are
 * two different obligations, listed separately, and the second is the one that
 * lapses in silence. Then the housekeeping — the toilet sheet, the bathroom
 * maintenance sheet, the first-aid box, the complaint book, the water cooler and
 * the tank chamber — which is the part a dealer can genuinely fix this week for
 * almost nothing.
 *
 * ── WHERE THE FACTS COME FROM, AND HOW THEY ARE VOICED ─────────────────────
 *
 * From one working dealer's own PUMP ASSESSMENT SHEET. Not from an oil-company
 * circular. The obligations on it are real and universal — every outlet displays
 * a PESO number, every outlet keeps its weights-and-measures certificate valid —
 * but the SHEET's cadences and its point weights are that dealer's own, and
 * dressing them up as an industry standard would be a fabrication a viewer could
 * be penalised for repeating.
 *
 * So the video attributes out loud: "एक चलते पंप की अपनी लिस्ट" — a working
 * dealer's own list — and says "अक्सर" where it is describing practice rather
 * than quoting a rule. The two heaviest recurring items on that sheet are the DTO
 * trade licence and the weights-and-measures certificate, and that ranking IS the
 * story worth telling; the raw point value behind it is not spoken, because a
 * number read aloud in a forwarded video stops being one dealer's weighting and
 * starts being a scoring system somebody thinks they are being marked against.
 *
 * ── WHAT IT DELIBERATELY REFUSES TO SAY ────────────────────────────────────
 *
 * No consequence. Not what an inspector does about a lapsed licence, not what the
 * oil company does about a missing sheet. We can source the obligation and we
 * cannot source the penalty, and a guessed penalty in a WhatsApp forward is how
 * you frighten somebody into the wrong action. The `wrong` beat here costs a
 * dealer exactly what we can prove it costs: the date went past and nobody rang.
 *
 * No portal filing either. The weekly cleanliness declaration lives on the same
 * sheet but belongs with the other declarations, which have their own video, and
 * splitting it across two would teach it half as well in both.
 *
 * MDG is named once, for the outcome — the dates kept and the reminder before the
 * renewal, never a word about how that is done.
 */

/**
 * The wall.
 *
 * Two beats share this stage — the second is marked `hold`, so the runtime
 * redraws the last block that was not held and finds this one. Five items is too
 * many to speak in a single 76-character Hindi caption, and cutting to a fresh
 * card halfway through a list is exactly the slide-deck stutter `hold` exists to
 * remove. So the list appears once and is read out over two breaths.
 */
const theWall: SocialBlock = {
  kind: 'list',
  title: { hi: 'दीवार पर क्या दिखना चाहिए', en: 'What has to be on show' },
  items: [
    {
      text: { hi: 'PESO लाइसेंस नंबर', en: 'The PESO licence number' },
      sub: { hi: 'दुकान के अंदर', en: 'inside the sales building' },
      ok: true,
    },
    {
      text: { hi: 'इमरजेंसी नंबर', en: 'The emergency number' },
      sub: { hi: 'दुकान के बाहर', en: 'outside it' },
      ok: true,
    },
    { text: { hi: 'ट्रेड लाइसेंस की कॉपी', en: 'A copy of the trade licence' }, ok: true },
    { text: { hi: 'GST सर्टिफ़िकेट की कॉपी', en: 'A copy of the GST certificate' }, ok: true },
    {
      text: {
        hi: 'नाप-तौल सर्टिफ़िकेट की कॉपी',
        en: 'A copy of the weights & measures certificate',
      },
      ok: true,
    },
  ],
};

export const wallPapers: SocialVideo = {
  id: 'gen-wall-papers',
  compositionId: 'GenWallPapers',
  family: 'social',
  bilingual: true,
  title: { hi: 'पहले दीवार, फिर किताब', en: 'The wall before the books' },
  subtitle: {
    hi: 'जो काग़ज़ टँगे रहने चाहिए, और जो शीटें रोज़ भरनी हैं',
    en: 'The papers that must hang, and the sheets that must be filled',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'कोई देखने आए तो अक्सर पहले दीवार देखी जाती है, किताब बाद में।',
        en: 'When somebody comes to look, the wall usually comes before the books.',
      },
      broll: 'forecourt-wide',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'काग़ज़ात', en: 'Paperwork' },
        headline: { hi: 'पहले दीवार, फिर किताब', en: 'The wall before the books' },
        sub: {
          hi: 'सबसे सस्ता काम, सबसे जल्दी दिखने वाला',
          en: 'The cheapest work you own, and the most visible',
        },
      },
    },
    {
      id: 'wall',
      say: {
        hi: 'PESO लाइसेंस का नंबर दुकान के अंदर, इमरजेंसी नंबर बाहर।',
        en: 'The PESO licence number goes inside the sales building. The emergency number outside.',
      },
      broll: 'office-counter',
      block: theWall,
    },
    {
      id: 'wall-two',
      say: {
        hi: 'साथ में ट्रेड लाइसेंस, GST और नाप-तौल की कॉपियाँ भी टँगी रहें।',
        en: 'Alongside them: copies of the trade licence, the GST and the weights certificate.',
      },
      hold: true,
      broll: 'office-counter',
      block: theWall,
    },
    {
      id: 'heaviest',
      say: {
        hi: 'उसी लिस्ट में सबसे भारी दो काम — यही दो काग़ज़ वैध रखना।',
        en: 'The two heaviest items on that same list are keeping two papers valid.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'claim',
        figure: { value: 2 },
        label: { hi: 'काग़ज़ जिन पर सबसे ज़्यादा भार', en: 'papers that carry the most weight' },
        tone: 'warn',
        note: {
          hi: 'DTO ट्रेड लाइसेंस और नाप-तौल सर्टिफ़िकेट — एक चलते पंप की अपनी लिस्ट से',
          en: "The DTO trade licence and the weights & measures certificate — from a working dealer's own list",
        },
      },
    },
    {
      id: 'copy-vs-valid',
      say: {
        hi: 'दीवार पर कॉपी टँगी होना और लाइसेंस वैध होना, दो अलग बातें हैं।',
        en: 'A copy on the wall and a licence still valid are two different things.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'कॉपी दीवार पर', en: 'A copy on the wall' },
          tone: 'neutral',
          rows: [
            { hi: 'दिख रही है', en: 'It is on show' },
            { hi: 'तारीख़ पुरानी हो सकती है', en: 'The date may have gone' },
          ],
        },
        right: {
          head: { hi: 'लाइसेंस वैध', en: 'The licence valid' },
          tone: 'good',
          rows: [
            { hi: 'तारीख़ चालू है', en: 'The date still runs' },
            { hi: 'रिन्यू हो चुका है', en: 'It has been renewed' },
          ],
        },
        join: 'rails',
        verdict: { hi: 'लिस्ट में दोनों अलग-अलग लिखे हैं', en: 'The list names both, separately' },
      },
    },
    {
      id: 'sheets',
      say: {
        hi: 'अब वह हिस्सा जो इसी हफ़्ते ठीक हो सकता है, लगभग मुफ़्त में।',
        en: 'Now the part you can put right this week, for almost nothing.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'list',
        title: { hi: 'शीटें और सफ़ाई', en: 'The sheets and the housekeeping' },
        items: [
          {
            text: { hi: 'टॉयलेट इंस्पेक्शन शीट', en: 'The toilet inspection sheet' },
            sub: { hi: 'रोज़', en: 'daily' },
            ok: true,
          },
          {
            text: { hi: 'बाथरूम मेंटेनेंस शीट', en: 'The bathroom maintenance sheet' },
            sub: { hi: 'रोज़', en: 'daily' },
            ok: true,
          },
          { text: { hi: 'फ़र्स्ट-एड बॉक्स भरा हुआ', en: 'A stocked first-aid box' }, ok: true },
          { text: { hi: 'शिकायत बुक मौजूद', en: 'The complaint book to hand' }, ok: true },
          {
            text: { hi: 'वॉटर कूलर की सफ़ाई', en: 'The water cooler cleaned' },
            sub: { hi: 'महीने में', en: 'monthly' },
            ok: true,
          },
          {
            text: { hi: 'टैंक चैंबर की सफ़ाई', en: 'The tank chamber cleaned' },
            sub: { hi: 'महीने में', en: 'monthly' },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'clocks',
      say: {
        hi: 'तीन घड़ियाँ चलती हैं — रोज़ वाली, महीने वाली, और साल वाली।',
        en: 'Three clocks are running: a daily one, a monthly one and a yearly one.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'रोज़', en: 'Daily' },
            title: { hi: 'शीटें भरना', en: 'Fill the sheets' },
            tone: 'good',
          },
          {
            figure: { hi: 'महीना', en: 'Monthly' },
            title: { hi: 'कूलर, टैंक चैंबर', en: 'Cooler, tank chamber' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'साल', en: 'Yearly' },
            title: { hi: 'लाइसेंस, सड़क NOC', en: 'Licences, the road NOC' },
            tone: 'warn',
          },
        ],
      },
    },
    {
      id: 'cost',
      say: {
        hi: 'सबसे बड़ी दिक़्क़त यही है — लाइसेंस चुपचाप एक्सपायर हो जाता है।',
        en: 'Here is the real trouble: a licence expires without making a sound.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'कोई फ़ोन नहीं आता', en: 'Nobody rings you' },
        body: {
          hi: 'कॉपी दीवार पर टँगी रहती है और तारीख़ कब की निकल चुकी होती है।',
          en: 'The copy stays on the wall long after the date on it has gone.',
        },
        slots: [
          { label: { hi: 'ट्रेड लाइसेंस', en: 'Trade licence' } },
          { label: { hi: 'नाप-तौल', en: 'Weights & measures' } },
          { label: { hi: 'रिन्यू की तारीख़?', en: 'Renewal date?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर काग़ज़ की तारीख़ रखती है और पहले ही याद दिला देती है।',
        en: 'MDG Services keeps every date and reminds you well before it runs out.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर लाइसेंस की तारीख़, एक जगह',
          en: 'Every licence date, in one place',
        },
        tone: 'brand',
        note: {
          hi: 'रिन्यू से पहले खबर, आपकी अपनी भाषा में',
          en: 'Word before the renewal, in your own language',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — दीवार देखिए, शीटें भरिए, तारीख़ें कैलेंडर पर लिखिए।',
        en: 'Remember: check the wall, fill the sheets, put the dates on a calendar.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'दीवार पर पाँचों काग़ज़ हैं?', en: 'All five papers on the wall?' },
          { hi: 'रोज़ वाली शीटें भर रही हैं?', en: 'Are the daily sheets being filled?' },
          { hi: 'दोनों लाइसेंस अभी वैध हैं?', en: 'Are both licences still valid?' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
