import type { SocialVideo } from '../types';

/**
 * "The electrical audit list" — cheap work that somebody else is counting.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * Earthing pits with their numbers painted on, an authorised insulation mat kept
 * in the panel room, safety signage actually displayed, the air compressor
 * serviced, and — day to day — the electrical panel wiped down, the cameras
 * cleaned, the inverter looked at and its battery water topped up. Not one item
 * on that list costs real money. Every item on it is on somebody's sheet, and
 * the thing that gets recorded against an outlet is not the work, it is the
 * proof that the work happened.
 *
 * ── WHERE THE FACTS COME FROM, AND HOW CAREFULLY THEY ARE PHRASED ──────────
 *
 * Two independent sources, which is what made this worth a video. First, an
 * outlet can carry an "Electrical Audit Non-Compliance" condition against it,
 * and the stated way out of it is to close the audit points and upload the
 * proof. That is a real string a dealer may see and a real remedy, so the video
 * names it once.
 *
 * Second, a WORKING DEALER'S OWN assessment sheet, which is where every cadence
 * in this script comes from — earthing pits and the insulation mat half-yearly,
 * signage quarterly, the compressor fortnightly. RISKS.md is blunt about this:
 * that sheet is one dealer's, not an oil-company circular, and presenting its
 * cadences as an industry standard would be a fabrication. So the video says so
 * out loud, in its own third beat, and attributes the whole list to "एक चालू पंप
 * की अपनी लिस्ट" — one working pump's own list. A viewer is told exactly how much
 * weight to put on the timings.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * It hedges the supply consequence to "can" rather than "will", because what
 * actually follows a condition, and how fast, is operator judgement that this
 * repository cannot source. It does not tell a dealer to call his sales officer,
 * for the same reason. It gives no point values here — those belong to the video
 * about the sheet itself — and it never mentions where any of this is seen from
 * on our side.
 */
export const equipmentAudit: SocialVideo = {
  id: 'gen-equipment-audit',
  compositionId: 'GenEquipmentAudit',
  family: 'social',
  bilingual: true,
  title: { hi: 'बिजली के ऑडिट की लिस्ट', en: 'The electrical audit list' },
  subtitle: {
    hi: 'सस्ता काम, जो किसी न किसी की लिस्ट में लिखा है',
    en: 'Cheap work that sits on somebody else’s list',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'इनमें कुछ भी महँगा नहीं। पर सब किसी की लिस्ट में है।',
        en: 'None of this is expensive. All of it is on somebody’s list.',
      },
      broll: 'forecourt-wide',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'रखरखाव', en: 'Upkeep' },
        headline: { hi: 'बिजली के ऑडिट की लिस्ट', en: 'The electrical audit list' },
        sub: {
          hi: 'जो चीज़ें पूछी जाती हैं, गिनकर',
          en: 'The things that actually get asked for',
        },
      },
    },
    {
      id: 'sheet',
      say: {
        hi: 'अर्थिंग पिट, इंसुलेशन मैट, साइनेज, और कंप्रेसर की सर्विस।',
        en: 'Earthing pits, insulation mat, signage, and the compressor service.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'list',
        title: { hi: 'एक चालू पंप की अपनी लिस्ट से', en: 'From one working pump’s own sheet' },
        items: [
          {
            text: { hi: 'अर्थिंग पिट, नंबर लगे हुए', en: 'Earthing pits, properly numbered' },
            sub: { hi: 'छह महीने में', en: 'Half-yearly' },
            ok: true,
          },
          {
            text: { hi: 'पैनल रूम में इंसुलेशन मैट', en: 'Insulation mat in the panel room' },
            sub: { hi: 'छह महीने में', en: 'Half-yearly' },
            ok: true,
          },
          {
            text: { hi: 'सेफ़्टी साइनेज लगा हुआ', en: 'Safety signage displayed' },
            sub: { hi: 'तीन महीने में', en: 'Quarterly' },
            ok: true,
          },
          {
            text: { hi: 'एयर कंप्रेसर की सर्विस', en: 'Air compressor serviced' },
            sub: { hi: 'पंद्रह दिन में', en: 'Fortnightly' },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'whose',
      hold: true,
      say: {
        hi: 'ये समय किसी सर्कुलर के नहीं — एक चालू पंप की अपनी लिस्ट के हैं।',
        en: 'These timings are one working pump’s own, not from any circular.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'list',
        title: { hi: 'एक चालू पंप की अपनी लिस्ट से', en: 'From one working pump’s own sheet' },
        items: [
          {
            text: { hi: 'अर्थिंग पिट, नंबर लगे हुए', en: 'Earthing pits, properly numbered' },
            sub: { hi: 'छह महीने में', en: 'Half-yearly' },
            ok: true,
          },
          {
            text: { hi: 'पैनल रूम में इंसुलेशन मैट', en: 'Insulation mat in the panel room' },
            sub: { hi: 'छह महीने में', en: 'Half-yearly' },
            ok: true,
          },
          {
            text: { hi: 'सेफ़्टी साइनेज लगा हुआ', en: 'Safety signage displayed' },
            sub: { hi: 'तीन महीने में', en: 'Quarterly' },
            ok: true,
          },
          {
            text: { hi: 'एयर कंप्रेसर की सर्विस', en: 'Air compressor serviced' },
            sub: { hi: 'पंद्रह दिन में', en: 'Fortnightly' },
            ok: true,
          },
        ],
      },
    },
    {
      id: 'daily',
      say: {
        hi: 'रोज़ के काम अलग हैं — पैनल, कैमरे, इन्वर्टर और बैटरी का पानी।',
        en: 'The daily jobs are separate: panel, cameras, inverter, battery water.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'पैनल', en: 'Panel' },
            title: { hi: 'बिजली का पैनल साफ़', en: 'Wipe the electrical panel' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'कैमरा', en: 'CCTV' },
            title: { hi: 'CCTV के लेंस साफ़', en: 'Clean the camera lenses' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'बैटरी', en: 'Battery' },
            title: { hi: 'इन्वर्टर और पानी', en: 'Inverter and its water' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'cheap',
      say: {
        hi: 'लगत लगभग शून्य है। न करने की क़ीमत उससे कहीं बड़ी।',
        en: 'The cost is close to nothing. Skipping it costs far more.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'करने में', en: 'To do it' },
          tone: 'good',
          rows: [
            { hi: 'पंद्रह मिनट का काम', en: 'Fifteen minutes of work' },
            { hi: 'पैसा लगभग नहीं', en: 'Almost no money' },
          ],
        },
        right: {
          head: { hi: 'न करने पर', en: 'To skip it' },
          tone: 'risk',
          rows: [
            { hi: 'आउटलेट पर शर्त लग सकती है', en: 'A condition can be raised' },
            { hi: 'फिर सबूत माँगा जाता है', en: 'Then the proof is asked for' },
          ],
        },
        join: 'arrow',
      },
    },
    {
      id: 'condition',
      say: {
        hi: 'बिजली के ऑडिट की एक शर्त आपकी सप्लाई तक रोक सकती है।',
        en: 'An electrical audit condition can even hold up your supply.',
      },
      broll: 'pump-night',
      block: {
        kind: 'claim',
        figure: { value: 1 },
        label: { hi: 'शर्त, जो सप्लाई रोक सकती है', en: 'condition that can stop supply' },
        tone: 'risk',
        note: {
          hi: 'नाम: Electrical Audit Non-Compliance',
          en: 'It is called Electrical Audit Non-Compliance',
        },
      },
    },
    {
      id: 'proof',
      say: {
        hi: 'काम हो गया पर सबूत नहीं — तो माना जाता है हुआ ही नहीं।',
        en: 'Work done but no proof kept counts as work never done.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'wrong',
        headline: { hi: 'सबूत रखा ही नहीं', en: 'The proof was never kept' },
        body: {
          // "Points closed" and "proof uploaded" are the language of a system a
          // dealer watching this has never seen. Said in his own terms: the work
          // is done, and there is a dated paper to show for it.
          hi: 'काम पूरा हो और उसका तारीख़ वाला काग़ज़ हो — तभी शर्त हटती है।',
          en: 'The work has to be done and a dated paper kept — then it clears.',
        },
        slots: [
          { label: { hi: 'काम हुआ', en: 'Work done' } },
          { label: { hi: 'तारीख़ लिखी', en: 'Date noted' } },
          { label: { hi: 'फ़ोटो या कागज़?', en: 'Photo or paper?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर काम की तारीख़ और सबूत साथ रखकर चलती है।',
        en: 'MDG Services keeps each job’s date and its proof together for you.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'कब हुआ, किसने किया, सबूत कहाँ है',
          en: 'When it was done, by whom, and where the proof is',
        },
        tone: 'brand',
        note: {
          hi: 'और अगली बार कब करना है, यह भी',
          en: 'And when each one is due again',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'काम कीजिए, तारीख़ लिखिए, और फ़ोटो साथ रख लीजिए।',
        en: 'Do the job, write the date, and keep a photo with it.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'अर्थिंग, मैट, साइनेज देख लीजिए', en: 'Check earthing, mat and signage' },
          { hi: 'पैनल, कैमरा, इन्वर्टर रोज़ के हैं', en: 'Panel, camera, inverter are daily' },
          { hi: 'हर काम का सबूत रखिए', en: 'Keep proof for every job' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
