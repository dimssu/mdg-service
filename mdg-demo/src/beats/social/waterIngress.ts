import type { SocialVideo } from '../types';

/**
 * "The two-hour window" — the water-ingress check, and why it cannot be caught up.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * One idea, held for nine beats: the water check is recorded against a fixed
 * two-hour window, and the window is the record. A round-the-clock outlet's day
 * is divided into twelve of them, running from midnight through to half past
 * eleven at night; an outlet that does not trade all day gets fewer, matching
 * the operating timings it has declared. Each window asks four things — was it
 * checked, was water found, what was done, and any remark — and a saved entry
 * stands, because there is no unmark. All of that is observed behaviour, not
 * inference, so it is stated plainly.
 *
 * The one piece of domain knowledge, taken from the service's own README, is
 * what "checked = yes" actually asserts: that somebody dipped the tanks with
 * water-finding paste and looked at the dispenser nozzles DURING that window.
 * It is voiced as what the row means rather than as a written rule, because
 * that is exactly the standing it has.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * It never says what happens to a dealer who misses a window or fills one
 * falsely. Nothing available to us shows that, and a guess forwarded on
 * WhatsApp is how you do real damage to somebody who acts on it. The video
 * stops at "there is no undo", which is a fact, and lets the viewer draw the
 * rest themselves.
 *
 * It also never names a screen, a menu or a login. Portal wording drifts — the
 * login was rebuilt as e-Mitra mid-2026 — so a video that taught a screen path
 * would be teaching something with a shelf life, and worse, it would be
 * describing how we work rather than what a dealer owes. The obligation is the
 * durable half, so the obligation is what is taught.
 *
 * Beats 2 and 3 are one stage: the twelve-dot grid arrives once, and the second
 * sentence — that a part-day outlet has fewer windows — lands under a picture
 * already on screen instead of on a second card.
 */
export const waterIngress: SocialVideo = {
  id: 'gen-water-ingress',
  compositionId: 'GenWaterIngress',
  family: 'social',
  bilingual: true,
  title: { hi: 'दो घंटे की खिड़की', en: 'The two-hour window' },
  subtitle: {
    hi: 'पानी की जाँच — जो बाद में नहीं भरी जा सकती',
    en: 'The water check, and why it cannot be filled in later',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'पानी की जाँच का समय दो घंटे का होता है। निकल गया तो निकल गया।',
        en: 'The water check has a two-hour window. Once it passes, it is gone.',
      },
      broll: 'tank-dip',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'रोज़ का काम', en: 'Daily' },
        headline: { hi: 'दो घंटे की खिड़की', en: 'The two-hour window' },
        sub: {
          hi: 'जो बाद में नहीं भरी जा सकती',
          en: 'The one you cannot fill in later',
        },
      },
    },
    {
      id: 'twelve',
      say: {
        hi: 'चौबीसों घंटे चलने वाले पंप का दिन बारह खिड़कियों में बँटा है।',
        en: "A round-the-clock outlet's day is split into twelve windows.",
      },
      broll: 'calendar-wall',
      block: {
        kind: 'claim',
        figure: { value: 12, countUp: true },
        label: { hi: 'दो-दो घंटे की खिड़कियाँ', en: 'windows of two hours each' },
        tone: 'neutral',
        viz: 'dots',
        vizProps: { total: 12, filled: 12 },
        note: {
          hi: 'रात बारह बजे से लेकर रात साढ़े ग्यारह तक',
          en: 'From midnight through to half past eleven at night',
        },
      },
    },
    {
      id: 'fewer',
      hold: true,
      say: {
        hi: 'जो पंप पूरे दिन नहीं चलता, उसकी खिड़कियाँ उतनी ही कम होती हैं।',
        en: 'An outlet that does not trade all day simply gets fewer windows.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'claim',
        figure: { value: 12, countUp: true },
        label: { hi: 'दो-दो घंटे की खिड़कियाँ', en: 'windows of two hours each' },
        tone: 'neutral',
        viz: 'dots',
        vizProps: { total: 12, filled: 12 },
        note: {
          hi: 'रात बारह बजे से लेकर रात साढ़े ग्यारह तक',
          en: 'From midnight through to half past eleven at night',
        },
      },
    },
    {
      id: 'row',
      say: {
        hi: 'हर खिड़की में चार बातें पूछी जाती हैं। दो का जवाब हाँ या ना है।',
        en: 'Each window asks four things. Two of them are just yes or no.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'list',
        title: { hi: 'एक खिड़की में क्या दर्ज होता है', en: 'What one window records' },
        items: [
          { text: { hi: 'जाँच की? — हाँ या ना', en: 'Checked? — Yes or No' } },
          { text: { hi: 'पानी मिला? — हाँ या ना', en: 'Water found? — Yes or No' } },
          { text: { hi: 'क्या कार्रवाई की', en: 'Action taken' } },
          { text: { hi: 'टिप्पणी', en: 'Remarks' } },
        ],
      },
    },
    {
      id: 'means',
      say: {
        hi: 'हाँ का मतलब है — उन्हीं दो घंटों में किसी ने जाकर जाँच की।',
        en: 'Yes means somebody actually went and checked, inside those two hours.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'flow',
        steps: [
          {
            title: { hi: 'पानी पकड़ने वाला पेस्ट', en: 'Water-finding paste' },
            body: { hi: 'छड़ी पर लगाइए', en: 'On the dip rod' },
            tone: 'neutral',
          },
          {
            title: { hi: 'हर टंकी में डिप', en: 'Dip every tank' },
            body: { hi: 'पानी दिखता है या नहीं', en: 'Water shows, or it does not' },
            tone: 'neutral',
          },
          {
            title: { hi: 'नोज़ल देखिए', en: 'Look at the nozzles' },
            body: { hi: 'आँख से जाँच', en: 'A visual check' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'timing',
      say: {
        hi: 'उसी खिड़की में भरा रिकॉर्ड सच है। सुबह भरा हुआ सच नहीं है।',
        en: 'Filled inside the window, the record is true. Filled next morning, no.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'खिड़की के अंदर', en: 'Inside the window' },
          tone: 'good',
          rows: [
            { hi: 'जाँच सचमुच हुई', en: 'The check really happened' },
            { hi: 'रिकॉर्ड सही', en: 'The record is true' },
          ],
        },
        right: {
          head: { hi: 'नौ बजे भरा', en: 'Filled at nine' },
          tone: 'risk',
          rows: [
            { hi: 'उस वक़्त कोई गया ही नहीं', en: 'Nobody went at that hour' },
            { hi: 'यह देरी नहीं, झूठ है', en: 'Not a late entry — a false one' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'nofix',
      say: {
        hi: 'और एक बार दर्ज हो जाए, तो उसे हटाने का कोई रास्ता नहीं है।',
        en: 'And once an entry is saved, there is no way to take it back.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'मिटाने का बटन नहीं है', en: 'There is no undo' },
        body: {
          hi: 'छूटी हुई खिड़की छूटी ही रहती है, और ग़लत भरी हुई खिड़की वैसी ही खड़ी रहती है।',
          en: 'A missed window stays missed, and a wrongly filled one stays wrong.',
        },
        slots: [
          { label: { hi: '12–2', en: '12–2' } },
          { label: { hi: '2–4', en: '2–4' }, missing: true },
          { label: { hi: '4–6', en: '4–6' } },
        ],
        cost: {
          figure: { hi: '0', en: '0' },
          label: { hi: 'सुधारने का मौका', en: 'chances to correct it' },
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ इसे रोज़ की आदत बना देती है, ताकि कोई खिड़की न छूटे।',
        en: 'MDG Services turns this into a daily habit, so no window goes missing.',
      },
      broll: 'phone-morning',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर खिड़की, अपने ही समय पर',
          en: 'Every window, in its own time',
        },
        tone: 'brand',
        note: {
          hi: 'जाँच आप कीजिए — गिनती रखना हमारा काम',
          en: 'You do the check; keeping count is our job',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — समय पर जाँच, समय पर रिकॉर्ड, बाद में सुधार नहीं।',
        en: 'Remember: check on time, record on time, no fixing it afterwards.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'अपने पंप की खिड़कियाँ जान लीजिए', en: "Know your outlet's own windows" },
          { hi: 'जाँच उन्हीं दो घंटों में', en: 'Check inside those two hours' },
          { hi: 'दर्ज भी उसी वक़्त', en: 'Record it at the same time' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
