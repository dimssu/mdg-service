import type { SocialVideo } from '../types';

/**
 * "The quarterly mock drill" — the small job that decides whether the next load
 * moves.
 *
 * ── WHY THIS ONE IS SAFE TO STATE PLAINLY ──────────────────────────────────
 *
 * Two independent sources agree, which is what lifts this above operator
 * folklore. The supply portal itself carries a condition against an outlet in
 * the words "Quaterly Mock Drill Not Conducted" — misspelling and all — and a
 * dealer's own pump assessment sheet lists the same obligation in its own words,
 * on a quarterly cadence, and states the consequence in the task's own title:
 * filling the mock drill in the web portal is what unlocks the indent of load.
 * So the cadence and the consequence are both attested, from two directions, and
 * the video says them without hedging.
 *
 * The one thing worth teaching beyond that is the seam between the two: the
 * drill and the declaration are separate acts, and a drill nobody filed clears
 * nothing. That is the whole video.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * WHO MUST ATTEND, AND WHAT THE DRILL MUST CONTAIN. Nothing we hold specifies
 * either. What the list beat describes is ordinary practice at a forecourt, and
 * it is voiced as such — "आम तौर पर", usually — because a dealer who treats our
 * four bullets as the required contents of a drill would be treating a
 * reasonable guess as a standard.
 *
 * THE PENALTY BEYOND THE HELD INDENT. A blocked indent is attested. Everything
 * past it — what a sales officer does, what happens if it stays unfiled — is
 * not, so the video stops at the load that will not open.
 *
 * THE PORTAL PATH. The screen names and menus have already moved once this year,
 * and a video outlives them. The obligation is named; the click path is not, and
 * nothing here describes how MDG comes to know the drill is due.
 */
export const mockDrill: SocialVideo = {
  id: 'gen-mock-drill',
  compositionId: 'GenMockDrill',
  family: 'social',
  bilingual: true,
  title: { hi: 'तिमाही मॉक ड्रिल', en: 'The quarterly mock drill' },
  subtitle: {
    hi: 'एक अभ्यास, एक घोषणा — और इंडेंट खुल जाता है',
    en: 'One drill, one declaration, and the indent opens',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'तिमाही मॉक ड्रिल भूल गए, तो अगला इंडेंट रुक जाता है।',
        en: 'Forget the quarterly mock drill and your next indent is held.',
      },
      broll: 'forecourt-wide',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'सुरक्षा', en: 'Safety' },
        headline: { hi: 'तिमाही मॉक ड्रिल', en: 'The quarterly mock drill' },
        sub: {
          hi: 'छोटा काम, जो लोड रोक देता है',
          en: 'A small job that stops a tanker',
        },
      },
    },
    {
      id: 'four',
      say: {
        hi: 'साल में चार बार — हर तीन महीने में एक बार।',
        en: 'Four times a year. Once every three months.',
      },
      broll: 'calendar-wall',
      block: {
        kind: 'claim',
        figure: { value: 4, countUp: false },
        label: { hi: 'बार साल में', en: 'times a year' },
        tone: 'warn',
        viz: 'dots',
        vizProps: { total: 12, filled: 4 },
        note: { hi: 'बारह महीने, चार ड्रिल', en: 'Twelve months, four drills' },
      },
    },
    {
      id: 'two-acts',
      say: {
        hi: 'ड्रिल कीजिए, पोर्टल पर घोषणा भरिए — तब इंडेंट खुलता है।',
        en: 'Do the drill, file the declaration on the portal, and the indent opens.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'ड्रिल कीजिए', en: 'Run the drill' },
            body: { hi: 'पंप पर, सचमुच', en: 'At the pump, for real' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'पोर्टल पर भरिए', en: 'File it on the portal' },
            body: { hi: 'उसी दिन', en: 'The same day' },
            tone: 'warn',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'इंडेंट खुला', en: 'The indent opens' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'filed-or-not',
      say: {
        hi: 'सिर्फ़ ड्रिल कर लेना काफ़ी नहीं — दर्ज नहीं, तो कुछ नहीं।',
        en: 'Doing the drill is not enough. If it is not filed, it did not happen.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'ड्रिल हुई, दर्ज नहीं', en: 'Drill done, not filed' },
          tone: 'risk',
          rows: [
            { hi: 'पोर्टल पर कुछ नहीं', en: 'Nothing on the portal' },
            { hi: 'इंडेंट वहीं रुका', en: 'The indent stays shut' },
          ],
        },
        right: {
          head: { hi: 'ड्रिल हुई और दर्ज', en: 'Drill done and filed' },
          tone: 'good',
          rows: [
            { hi: 'पोर्टल पर दिख गई', en: 'It shows on the portal' },
            { hi: 'इंडेंट खुल गया', en: 'The indent opens' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'what-drill',
      say: {
        hi: 'ड्रिल में आम तौर पर पूरा स्टाफ़ शामिल होता है — कागज़ पर नहीं।',
        en: 'A drill usually means the whole staff, doing it for real, not on paper.',
      },
      broll: 'gate-arrival',
      block: {
        kind: 'list',
        title: { hi: 'आम तौर पर ड्रिल में', en: 'A drill usually means' },
        items: [
          {
            text: { hi: 'हर आदमी को अपनी जगह पता हो', en: 'Everyone knows their place' },
            ok: true,
          },
          {
            text: { hi: 'आग बुझाने के उपकरण चलाकर देखना', en: 'The extinguishers actually used' },
            ok: true,
          },
          {
            text: { hi: 'तेल बंद करने का स्विच कौन दबाएगा', en: 'Who hits the emergency stop' },
            ok: true,
          },
          { text: { hi: 'बाहर निकलने का रास्ता खुला हो', en: 'The way out is clear' }, ok: true },
        ],
      },
    },
    {
      /* `hold` — the same four bullets stay on screen while the narration
         changes register from what to do, to why it keeps being skipped. */
      id: 'small-job',
      hold: true,
      say: {
        hi: 'यह काम बड़ा नहीं है। भूल जाना ही महँगा पड़ता है।',
        en: 'None of this is a big job. Only forgetting it is expensive.',
      },
      broll: 'gate-arrival',
      block: {
        kind: 'list',
        title: { hi: 'आम तौर पर ड्रिल में', en: 'A drill usually means' },
        items: [
          {
            text: { hi: 'हर आदमी को अपनी जगह पता हो', en: 'Everyone knows their place' },
            ok: true,
          },
          {
            text: { hi: 'आग बुझाने के उपकरण चलाकर देखना', en: 'The extinguishers actually used' },
            ok: true,
          },
          {
            text: { hi: 'तेल बंद करने का स्विच कौन दबाएगा', en: 'Who hits the emergency stop' },
            ok: true,
          },
          { text: { hi: 'बाहर निकलने का रास्ता खुला हो', en: 'The way out is clear' }, ok: true },
        ],
      },
    },
    {
      id: 'found-out-late',
      say: {
        hi: 'जिस दिन लोड चाहिए, उसी दिन पता चलता है कि ड्रिल बाक़ी है।',
        en: 'You find out the drill is pending on the day you need the load.',
      },
      broll: 'pump-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'इंडेंट नहीं खुलेगा', en: 'The indent will not open' },
        body: {
          hi: 'तीन महीने में एक बार का काम, और याद तब आता है जब टैंकर चाहिए।',
          en: 'A once-in-three-months job, remembered on the day the tanker is needed.',
        },
        slots: [
          { label: { hi: 'ड्रिल', en: 'Drill' } },
          { label: { hi: 'पोर्टल पर घोषणा', en: 'Declaration' }, missing: true },
        ],
        cost: {
          figure: { hi: 'रुका', en: 'Held' },
          label: { hi: 'आपका अगला इंडेंट', en: 'Your next indent' },
        },
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ पहले ही बता देती है कि ड्रिल कब देनी है।',
        en: 'MDG Services tells you the drill is due before it holds anything up.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'तारीख़ आने से पहले, आपके फ़ोन पर',
          en: 'On your phone, before the date arrives',
        },
        tone: 'brand',
        note: {
          hi: 'और अगर लोड कहीं अटका है, तो वह भी',
          en: 'And if a load is being held up, that too',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'हर तिमाही ड्रिल कीजिए, उसी दिन दर्ज कीजिए, फिर इंडेंट।',
        en: 'Drill every quarter, file it the same day, then place the indent.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर तीन महीने में ड्रिल', en: 'A drill every three months' },
          { hi: 'पोर्टल पर घोषणा भरिए', en: 'File the declaration on the portal' },
          { hi: 'तभी अगला इंडेंट खुलेगा', en: 'Only then does the next indent open' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
