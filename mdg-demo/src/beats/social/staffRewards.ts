import type { SocialVideo } from '../types';

/**
 * "A value for every job" — writing the forecourt down so a reward can be fair.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * Not a scheme. A method, in three parts, and each part is the answer to a
 * question every owner already argues about at the counter:
 *
 *   1. WHAT counts as work — eighty-five named jobs in seven groups, from
 *      washing the dispenser island to riding with a tanker to the refinery.
 *      Naming them is the whole trick: an unnamed job cannot be rewarded and
 *      cannot be refused, which is how rewards end up feeling arbitrary.
 *   2. WHAT a job is worth — derived from four things (time taken, skill
 *      needed, physical effort, responsibility carried) rather than from
 *      whoever is standing there when it gets decided.
 *   3. WHO gets it when three men did one job — split among them, or paid in
 *      full to each, or per unit (per vehicle, per tank, per ₹1,000 of sales),
 *      or a flat one-off. The mistake is not picking the wrong one; it is not
 *      picking before the work starts.
 *
 * And the small trap that eats the whole system: the catch-all "other work"
 * row. Without a line of description per entry, three months later nobody can
 * say what the money was for, and a system nobody can audit stops being trusted.
 *
 * ── WHERE IT COMES FROM, AND HOW IT IS VOICED ──────────────────────────────
 *
 * The catalogue is OURS. It was built from a real Hindi staff-management
 * assessment sheet at one pump, and it is one way of doing this — not a
 * standard, not anybody's circular. The claim beat says so in its note and the
 * title's sub-line says so again, because a viewer who forwards this must not
 * be able to tell someone it is a rule. No point values or rupee figures appear
 * anywhere: what a job is worth is the owner's decision, and printing our
 * numbers would turn a method into a tariff somebody argues with.
 *
 * The compare beat quotes a cost of "three times" for paying each doer in full.
 * That is arithmetic about three people, not a claim about anybody's wage bill.
 */
export const staffRewards: SocialVideo = {
  id: 'gen-staff-rewards',
  compositionId: 'GenStaffRewards',
  family: 'social',
  bilingual: true,
  title: { hi: 'हर काम की एक क़ीमत', en: 'A value for every job' },
  subtitle: {
    hi: 'स्टाफ़ का इनाम अंदाज़े से नहीं, हिसाब से',
    en: 'Staff rewards worked out, not guessed at',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'पंप का हर काम लिखा जा सकता है — और हर काम की एक क़ीमत।',
        en: 'Every job on a pump can be written down, and each one given a value.',
      },
      broll: 'forecourt-wide',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'स्टाफ़', en: 'Staff' },
        headline: { hi: 'हर काम की एक क़ीमत', en: 'A value for every job' },
        sub: {
          hi: 'यह हमारा तरीक़ा है, कोई नियम नहीं',
          en: 'One way of doing it — not a rule',
        },
      },
    },
    {
      id: 'eightyfive',
      say: {
        hi: 'एक असली शीट से हमने पिचासी काम नाम लेकर लिख लिए।',
        en: 'From one real sheet we wrote down eighty-five jobs, each by name.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'claim',
        figure: { value: 85, countUp: true },
        label: { hi: 'काम, नाम लेकर लिखे हुए', en: 'jobs, each written down by name' },
        tone: 'brand',
        viz: 'dots',
        vizProps: { total: 85, filled: 85 },
        note: {
          hi: 'यह हमारा अपना तरीक़ा है — उद्योग का कोई नियम नहीं',
          en: 'This is our own way of doing it, not an industry rule',
        },
      },
    },
    {
      id: 'range',
      hold: true,
      say: {
        hi: 'डीयू की सफ़ाई से लेकर टैंकर के साथ रिफ़ाइनरी जाने तक।',
        en: 'From washing the dispenser island to riding a tanker to the refinery.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'claim',
        figure: { value: 85, countUp: true },
        label: { hi: 'काम, नाम लेकर लिखे हुए', en: 'jobs, each written down by name' },
        tone: 'brand',
        viz: 'dots',
        vizProps: { total: 85, filled: 85 },
        note: {
          hi: 'यह हमारा अपना तरीक़ा है — उद्योग का कोई नियम नहीं',
          en: 'This is our own way of doing it, not an industry rule',
        },
      },
    },
    {
      id: 'groups',
      say: {
        hi: 'ये काम सात हिस्सों में बँट जाते हैं। हर पंप पर यही सात।',
        en: 'The jobs fall into seven groups. Every pump has the same seven.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'list',
        title: { hi: 'सात हिस्से', en: 'Seven groups' },
        layout: 'grid',
        items: [
          { text: { hi: 'सफ़ाई', en: 'Cleaning' } },
          { text: { hi: 'डिस्पेंसर', en: 'Dispensers' } },
          { text: { hi: 'दफ़्तर', en: 'Office' } },
          { text: { hi: 'टैंकर', en: 'Tanker' } },
          { text: { hi: 'रसोई', en: 'Kitchen' } },
          { text: { hi: 'रिफ़ाइनरी का चक्कर', en: 'Refinery run' } },
          { text: { hi: 'मोबाइल डिस्पेंसर', en: 'Mobile dispenser' } },
        ],
      },
    },
    {
      id: 'chain',
      say: {
        hi: 'काम हुआ, क़ीमत तय हुई, बँटवारा तय हुआ, महीने में हिसाब।',
        en: 'The job is done, valued, split by a rule, and settled at month end.',
      },
      broll: 'office-counter',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'काम हुआ', en: 'Job done' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'क़ीमत तय', en: 'Valued' },
            tone: 'neutral',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'बँटवारा तय', en: 'Split decided' },
            tone: 'neutral',
          },
          {
            figure: { hi: '4', en: '4' },
            title: { hi: 'महीने का हिसाब', en: 'Settled' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'four',
      say: {
        hi: 'क़ीमत चार बातों से निकलती है, किसी के मूड से नहीं।',
        en: 'The value comes from four things, and not from anybody’s mood.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'list',
        title: { hi: 'क़ीमत किन बातों से', en: 'What sets the value' },
        items: [
          { text: { hi: 'समय कितना लगा', en: 'Time it takes' }, ok: true },
          { text: { hi: 'हुनर कितना चाहिए', en: 'Skill it needs' }, ok: true },
          { text: { hi: 'मेहनत कितनी लगी', en: 'Physical effort' }, ok: true },
          { text: { hi: 'ज़िम्मेदारी कितनी', en: 'Responsibility carried' }, ok: true },
        ],
      },
    },
    {
      id: 'split',
      say: {
        hi: 'एक काम तीन लोगों ने किया — बाँटेंगे, या हर एक को पूरा?',
        en: 'Three men did one job. Split the reward, or pay each of them in full?',
      },
      broll: 'tanker-delivery',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'बाँट दीजिए', en: 'Split it' },
          tone: 'neutral',
          rows: [
            { hi: 'तीनों में बराबर', en: 'Equally among the three' },
            { hi: 'कुल ख़र्च वही रहता है', en: 'The total stays the same' },
          ],
        },
        right: {
          head: { hi: 'हर एक को पूरा', en: 'Full to each' },
          tone: 'good',
          rows: [
            { hi: 'हर आदमी को पूरी क़ीमत', en: 'Each man gets the whole value' },
            { hi: 'ख़र्च तीन गुना', en: 'The cost is three times over' },
          ],
        },
        join: 'none',
        verdict: {
          hi: 'तीसरा तरीक़ा — प्रति गाड़ी, प्रति टंकी, या प्रति हज़ार रुपये की बिक्री',
          en: 'A third way: per vehicle, per tank, or per ₹1,000 of sales',
        },
      },
    },
    {
      id: 'other',
      say: {
        hi: 'एक ही जगह सब फँसते हैं — बाक़ी काम लिखकर छोड़ देना।',
        en: 'Everyone trips on one row: writing “other work” and leaving it there.',
      },
      broll: 'paper-stack',
      block: {
        kind: 'wrong',
        headline: { hi: 'बाक़ी काम — कौन सा काम?', en: '“Other work” — which work?' },
        body: {
          hi: 'हर ऐसी पंक्ति के साथ एक लाइन का ब्यौरा चाहिए, वरना तीन महीने बाद कोई नहीं बता पाएगा कि पैसा किस काम का था।',
          en: 'Every such row needs one line of description, or three months later nobody can say what the money was for.',
        },
        slots: [
          { label: { hi: 'काम', en: 'The job' } },
          { label: { hi: 'किसने किया', en: 'Who did it' } },
          { label: { hi: 'क्या किया?', en: 'What exactly?' }, missing: true },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ में यह पूरी सूची तैयार मिलती है, आपके पंप के हिसाब से।',
        en: 'MDG Services hands you this whole list ready, shaped to your own pump.',
      },
      broll: 'phone-morning',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: { hi: 'तैयार सूची, आपके हिसाब से', en: 'The list, ready and yours to change' },
        tone: 'brand',
        note: {
          hi: 'किसने क्या किया — पूरे महीने का हिसाब एक जगह',
          en: 'Who did what, a whole month of it in one place',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'काम लिखिए, चार बातों से क़ीमत तय कीजिए, बँटवारा पहले तय कीजिए।',
        en: 'Write the jobs down, value them on four things, fix the split first.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर काम का नाम लिखिए', en: 'Name every job' },
          { hi: 'समय, हुनर, मेहनत, ज़िम्मेदारी', en: 'Time, skill, effort, responsibility' },
          { hi: 'बँटवारा काम से पहले तय हो', en: 'Decide the split before the work' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
