import type { SocialBlock, SocialVideo } from '../types';

/**
 * "The seven conditions" — the short list that is checked against an outlet
 * before a load is released.
 *
 * ── WHERE THE FACTS COME FROM ──────────────────────────────────────────────
 *
 * The seven condition names are the portal's own strings, attested on a live
 * screen on 5 September 2026 for two outlets, and they live in this repository
 * as `shared/src/data/roSupplyConditions.ts` with the Hindi for each one and the
 * one thing that clears it. The video says them in that same Hindi, because a
 * dealer who has seen the card on his phone and then sees this reel should be
 * hearing one voice, not two.
 *
 * The clipped English the portal uses — "Pending OTP", "RO not in Auto" — is
 * kept on the English track deliberately. It is what the dealer will actually be
 * shown, typos and all, and translating it into better English would leave him
 * hunting for a phrase that does not exist on any screen he can reach.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * IT NEVER SAYS THE SUPPLY *WILL* STOP. The list is what gets checked; how hard
 * a given condition bites, and whether a load moves anyway, is not something
 * this repository can see. So every sentence about the consequence is hedged to
 * "can" and "usually", which is the honest shape of what we know.
 *
 * IT HEDGES THE SDMS-DAR LINE. `roSupplyConditions.ts` carries "take this up
 * with your Sales Officer — the block is set on their side", and that sentence
 * is operator knowledge rather than anything the portal publishes. On a video
 * that gets forwarded to strangers it is voiced as what usually happens, not as
 * the rule. The same file deliberately omits an action wherever we cannot say
 * one honestly, and this script inherits that restraint.
 *
 * IT NAMES NO OUTLET. Two real RO codes sit in the capture these strings came
 * from. Neither appears here, and neither ever should.
 *
 * And it never describes how any of this is watched. It names MDG once and says
 * what a dealer gets out of it — which the founder asked for — but the method
 * is not in the script and the `SocialBlock` union keeps it out of the pictures.
 */

/**
 * Declared once and pointed at twice.
 *
 * The beat that follows is `hold`, so the runtime draws THIS block underneath it
 * and only the caption changes. Sharing the object rather than copying it means
 * the two beats cannot quietly drift into showing different lists.
 */
const sevenConditions: SocialBlock = {
  kind: 'list',
  title: { hi: 'ये सात', en: 'The seven' },
  items: [
    { text: { hi: 'ऑटोमेशन का डेटा नहीं पहुँचा', en: 'Automation data not received' }, ok: false },
    { text: { hi: 'OTP मंज़ूरी बाक़ी', en: 'Pending OTP' }, ok: false },
    { text: { hi: 'SDMS-DAR में रोक', en: 'Blocked in SDMS-DAR' }, ok: false },
    { text: { hi: '24 घंटे से मशीन-टंकी चुप', en: 'DU/tank not communicated, 24 hrs' }, ok: false },
    { text: { hi: 'तिमाही मॉक ड्रिल नहीं हुई', en: 'Quarterly mock drill not done' }, ok: false },
    { text: { hi: 'बिजली ऑडिट की कमियाँ', en: 'Electrical audit non-compliance' }, ok: false },
    { text: { hi: 'पंप ऑटोमेशन पर नहीं', en: 'RO not in auto' }, ok: false },
  ],
};

export const supplyConditions: SocialVideo = {
  id: 'gen-supply-conditions',
  compositionId: 'GenSupplyConditions',
  family: 'social',
  bilingual: true,
  title: { hi: 'सात शर्तें', en: 'Seven conditions' },
  subtitle: {
    hi: 'जो अगला लोड रोक सकती हैं',
    en: 'The short list checked before your next load',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'लोड निकलने से पहले आपके पंप पर सात बातें जाँची जाती हैं।',
        en: 'Before a load is released, seven things get checked against your pump.',
      },
      broll: 'pump-night',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'सप्लाई', en: 'Supply' },
        headline: { hi: 'सात शर्तें', en: 'Seven conditions' },
        sub: {
          hi: 'जो आपका अगला लोड रोक सकती हैं',
          en: 'that can hold up your next load',
        },
      },
    },
    {
      id: 'seven',
      say: {
        hi: 'सात। हर बार यही छोटी सूची आपके पंप पर देखी जाती है।',
        en: 'Seven. The same short list, checked against your pump every time.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'claim',
        figure: { value: 7, countUp: false },
        label: { hi: 'शर्तें — हर लोड से पहले', en: 'conditions, before every load' },
        tone: 'warn',
        viz: 'dots',
        vizProps: { total: 7, filled: 7 },
        note: {
          hi: 'एक भी खुली रही तो सप्लाई अटक सकती है',
          en: 'Even one left open can hold the supply',
        },
      },
    },
    {
      id: 'list',
      say: {
        hi: 'सूची यह रही। देखिए, इनमें से कोई आपके यहाँ खुली तो नहीं।',
        en: 'Here is the list. Look and see if any of them is open at your pump.',
      },
      broll: 'paper-stack',
      block: sevenConditions,
    },
    {
      id: 'list-easy',
      hold: true,
      say: {
        hi: 'ज़्यादातर एक-एक लाइन में बंद हो जाती हैं। पता होनी चाहिए।',
        en: 'Most of them close with one small step. The hard part is knowing.',
      },
      broll: 'paper-stack',
      block: sevenConditions,
    },
    {
      id: 'whose',
      say: {
        hi: 'कुछ आप ख़ुद बंद कर सकते हैं, कुछ के लिए एक फ़ोन करना पड़ता है।',
        en: 'Some you can close yourself. Some just need one phone call.',
      },
      broll: 'office-counter',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'आपके हाथ में', en: 'Yours to close' },
          tone: 'good',
          rows: [
            { hi: 'रुका OTP मंज़ूर करें', en: 'Approve the pending OTP' },
            { hi: 'मॉक ड्रिल कराकर दर्ज करें', en: 'Do the mock drill, file it' },
            { hi: 'पंप को ऑटोमेशन पर लाएँ', en: 'Put the pump back on auto' },
          ],
        },
        right: {
          head: { hi: 'किसी और के हाथ में', en: 'Somebody else closes' },
          tone: 'warn',
          rows: [
            { hi: 'ऑटोमेशन — आम तौर पर वेंडर', en: 'Automation — usually your vendor' },
            {
              hi: 'SDMS-DAR — आम तौर पर सेल्स ऑफ़िसर',
              en: 'SDMS-DAR — usually your Sales Officer',
            },
          ],
        },
        join: 'none',
        verdict: {
          hi: 'दोनों तरफ़ का काम आज ही शुरू हो सकता है',
          en: 'Either way, it starts with something you can do today',
        },
      },
    },
    {
      id: 'held',
      say: {
        hi: 'एक शर्त खुली रह जाए तो अक्सर लोड वहीं का वहीं रुक जाता है।',
        en: 'Leave one condition open and the load usually waits right there.',
      },
      broll: 'gate-arrival',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'खुली', en: 'Open' },
            title: { hi: 'एक शर्त खुली', en: 'One condition open' },
            tone: 'risk',
          },
          {
            figure: { hi: 'रुका', en: 'Held' },
            title: { hi: 'लोड इंतज़ार में', en: 'The load waits' },
            tone: 'warn',
          },
          {
            figure: { hi: 'बंद', en: 'Closed' },
            title: { hi: 'शर्त बंद हुई', en: 'Condition closed' },
            body: { hi: 'सप्लाई फिर चालू', en: 'Supply moves again' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'trap',
      say: {
        hi: 'दिक़्क़त यह है — कोई बताने नहीं आता कि कौन-सी शर्त खुली है।',
        en: 'The catch: nobody comes and tells you which condition is open.',
      },
      broll: 'file-shelf',
      block: {
        kind: 'wrong',
        headline: { hi: 'पता तब चलता है, जब देर हो चुकी है', en: 'You find out once it is late' },
        body: {
          hi: 'कोई चिट्ठी नहीं आती। मालूम अक्सर उसी दिन पड़ता है जिस दिन टैंकर आना था।',
          en: 'No letter comes. It usually shows up on the day the tanker was meant to.',
        },
        slots: [
          { label: { hi: 'शर्त खुली', en: 'Condition open' } },
          { label: { hi: 'किसी ने बताया?', en: 'Anyone told you?' }, missing: true },
          { label: { hi: 'टैंकर का दिन', en: 'Tanker day' } },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ बता देती है कि कौन-सी शर्त खुली पड़ी है।',
        en: 'MDG Services tells you which condition is sitting open at your pump.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'कौन-सी शर्त खुली है — सादे शब्दों में',
          en: 'Which condition is open, in plain words',
        },
        tone: 'brand',
        note: {
          hi: 'और उसे बंद कौन कर सकता है',
          en: 'And who can close it',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'सात शर्तें, ज़्यादातर आसान — टैंकर आने से पहले देख लीजिए।',
        en: 'Seven conditions, most of them easy — check before the tanker comes.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'सात शर्तें — सूची याद रखिए', en: 'Seven conditions — know the list' },
          { hi: 'ज़्यादातर एक लाइन में बंद', en: 'Most close with one small step' },
          { hi: 'बाक़ी के लिए एक फ़ोन', en: 'The rest need one phone call' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
