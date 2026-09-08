import type { SocialBlock, SocialVideo } from '../types';

/**
 * "Decanting a tanker" — the order of work from the moment the lorry stops to
 * the moment the papers are signed.
 *
 * ── WHERE THE FACTS COME FROM ──────────────────────────────────────────────
 *
 * Every step named here is a work that already exists by name in this
 * repository, in two places. The compliance template carries the obligation as
 * a dealer states it — "follow proper tanker lorry decantation and documentation
 * as per guideline", "make the sampling of product and storage properly as per
 * guideline", crocodile clip wires kept available for the tanker and with an
 * aluminium bucket. The staff catalogue carries the individual actions a
 * forecourt actually performs, and that catalogue is the shot list: take the
 * tanker dip and check the water dip too, do the tanker safety check, attach and
 * stow the crocodile clip while it empties, attach and stow the fencing chain,
 * take the density, take the underground tank's manual dip along with its water
 * dip, fill the sampling box, and do the paperwork.
 *
 * ── WHAT IT REFUSES TO SAY, AND WHY ────────────────────────────────────────
 *
 * NO CADENCES AND NO POINT VALUES. Both source lists carry them — a yearly
 * bucket on the clip rows, forty points on the decantation row — and both come
 * from ONE dealer's own assessment workbook, not from an oil-company circular.
 * The obligations are real; the schedule attached to them is that dealer's
 * house rule. Broadcasting "the clips are checked yearly" to strangers would be
 * inventing an industry standard out of one spreadsheet, so the video teaches
 * the order of work and never the calendar.
 *
 * NO CLAUSE NUMBERS. The only guideline clause quoted with its text anywhere in
 * this repository is 5.1.11, which is about stock variation and has nothing to
 * do with decanting. Citing any other number here would be a guess, and a dealer
 * finds out a guess was wrong months later, in front of an inspector.
 *
 * IT STOPS AT THE RECORD. The video says that a missed dip and a missed sample
 * leave nothing to prove what arrived. It does not say what an oil company then
 * does about it, because nothing in this repository knows.
 *
 * MDG is named once, on the outcome — the record of every tanker, and the step
 * that got missed reaching the owner while he can still do something about it.
 * How that happens is not in the script.
 */

/** Shared with the `hold` beat that follows it, so the two cannot drift apart. */
const beforeTheDrop: SocialBlock = {
  kind: 'list',
  title: { hi: 'एक बूँद गिरने से पहले', en: 'Before a single drop comes out' },
  items: [
    { text: { hi: 'टैंकर का डिप — वाटर डिप भी', en: 'Tanker dip, and the water dip' }, ok: true },
    { text: { hi: 'टैंकर का सेफ्टी चेक', en: 'Safety check on the tanker' }, ok: true },
    {
      text: { hi: 'अपनी टंकी का डिप और वाटर डिप', en: 'Your own tank dip and water dip' },
      ok: true,
    },
    { text: { hi: 'टैंकर की डेंसिटी', en: 'Density of the load' }, ok: true },
  ],
};

/** Same arrangement, same reason. */
const afterTheDrop: SocialBlock = {
  kind: 'flow',
  steps: [
    {
      figure: { hi: 'सैंपल', en: 'Sample' },
      title: { hi: 'सैंपल बॉक्स में', en: 'Into the sample box' },
      tone: 'neutral',
    },
    {
      figure: { hi: 'डिप', en: 'Dip' },
      title: { hi: 'टंकी का डिप दोबारा', en: 'Tank dip once more' },
      tone: 'neutral',
    },
    {
      figure: { hi: 'काग़ज़', en: 'Papers' },
      title: { hi: 'सब कुछ उसी वक़्त दर्ज', en: 'Written down then and there' },
      tone: 'good',
    },
  ],
};

export const decantation: SocialVideo = {
  id: 'gen-decantation',
  compositionId: 'GenDecantation',
  family: 'social',
  bilingual: true,
  title: { hi: 'टैंकर सही तरीक़े से उतारिए', en: 'Decant a tanker properly' },
  subtitle: {
    hi: 'क्लिप, चेन, डिप, सैंपल और काग़ज़',
    en: 'The clip, the chain, the dip, the sample, the papers',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'टैंकर आ गया। जल्दबाज़ी में जो छूटता है, वही बाद में भारी पड़ता है।',
        en: 'The tanker is here. What gets skipped in a hurry is what costs you.',
      },
      broll: 'tanker-delivery',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'टैंकर', en: 'The tanker' },
        headline: { hi: 'तेल उतारने का सही तरीक़ा', en: 'Decanting, done properly' },
        sub: {
          hi: 'क्लिप, चेन, डिप, सैंपल, काग़ज़',
          en: 'Clip, chain, dip, sample, papers',
        },
      },
    },
    {
      id: 'three-parts',
      say: {
        hi: 'काम तीन हिस्सों में है — पहले, उतरते वक़्त, और उतर जाने के बाद।',
        en: 'The job is in three parts: before, while it empties, and after.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: 'पहले', en: 'Before' },
            title: { hi: 'डिप और चेक', en: 'Dip and check' },
            tone: 'neutral',
          },
          {
            figure: { hi: 'बीच में', en: 'During' },
            title: { hi: 'क्लिप और चेन', en: 'Clip and chain' },
            tone: 'warn',
          },
          {
            figure: { hi: 'बाद में', en: 'After' },
            title: { hi: 'सैंपल और काग़ज़', en: 'Sample and papers' },
            tone: 'good',
          },
        ],
      },
    },
    {
      id: 'before',
      say: {
        hi: 'पहले टैंकर का डिप और वाटर डिप, सेफ्टी चेक, फिर डेंसिटी।',
        en: 'First the tanker dip with the water dip, the safety check, the density.',
      },
      broll: 'tank-dip',
      block: beforeTheDrop,
    },
    {
      id: 'water-dip',
      hold: true,
      say: {
        hi: 'वाटर डिप छूट गया तो पानी आपकी अपनी टंकी में उतर सकता है।',
        en: 'Miss the water dip and the water can end up in your own tank.',
      },
      broll: 'tank-dip',
      block: beforeTheDrop,
    },
    {
      id: 'clip-chain',
      say: {
        hi: 'तेल उतरते वक़्त क्रोकोडाइल क्लिप और फ़ेंसिंग चेन, दोनों लगाइए।',
        en: 'While it empties, the crocodile clip and the fencing chain both go on.',
      },
      broll: 'tanker-delivery',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'क्लिप और चेन लगी है', en: 'Clip and chain on' },
          tone: 'good',
          rows: [
            { hi: 'क्रोकोडाइल क्लिप जुड़ी हुई', en: 'Crocodile clip attached' },
            { hi: 'फ़ेंसिंग चेन घेरे में', en: 'Fencing chain around it' },
          ],
        },
        right: {
          head: { hi: 'नहीं लगी है', en: 'Neither one on' },
          tone: 'risk',
          rows: [
            { hi: 'क्लिप डिब्बे में ही पड़ी', en: 'Clip still in the box' },
            { hi: 'लोग गाड़ी के पास से गुज़र रहे', en: 'People walking past the lorry' },
          ],
        },
        join: 'none',
        verdict: {
          hi: 'काम ख़त्म होते ही दोनों समेटकर अपनी जगह रखिए',
          en: 'The moment it is done, stow both back where they belong',
        },
      },
    },
    {
      id: 'after',
      say: {
        hi: 'उतर जाने के बाद — सैंपल बॉक्स में, टंकी का डिप, और काग़ज़।',
        en: 'Once it is empty: the sample into the box, the tank dip, the papers.',
      },
      broll: 'attendant-register',
      block: afterTheDrop,
    },
    {
      id: 'sample-storage',
      hold: true,
      say: {
        hi: 'सैंपल लेना जितना ज़रूरी है, उसे सही जगह रखना भी उतना ही।',
        en: 'Taking the sample matters. Storing it in the right place matters as much.',
      },
      broll: 'attendant-register',
      block: afterTheDrop,
    },
    {
      id: 'wrong',
      say: {
        hi: 'डिप और सैंपल छूट गए तो बाद में साबित करने को कुछ नहीं बचता।',
        en: 'Skip the dip and the sample and later there is nothing left to prove.',
      },
      broll: 'pump-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'खाली टैंकर, आधा हिसाब', en: 'Empty tanker, half a record' },
        body: {
          hi: 'डिप नहीं लिया, सैंपल नहीं रखा, काग़ज़ बाद में भरे — फिर सवाल आने पर हाथ में कुछ नहीं।',
          en: 'No dip, no sample, papers filled in later — and nothing in hand when it is asked for.',
        },
        slots: [
          { label: { hi: 'टैंकर का डिप', en: 'Tanker dip' }, missing: true },
          { label: { hi: 'सैंपल', en: 'Sample' }, missing: true },
          { label: { hi: 'काग़ज़', en: 'Papers' } },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर टैंकर का हिसाब रखती है और छूटा काम बताती है।',
        en: 'MDG Services keeps the record of every tanker and flags what got missed.',
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर टैंकर का हिसाब, पीछे भागे बिना',
          en: 'Every tanker on record, without chasing anyone',
        },
        tone: 'brand',
        note: {
          hi: 'और जो रह गया, वह उसी दिन आपके सामने',
          en: 'And a missed step reaches you the same day',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'पहले डिप, उतरते वक़्त क्लिप और चेन, बाद में सैंपल और काग़ज़।',
        en: 'Dip first, clip and chain while it empties, sample and papers after.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'पहले — डिप, वाटर डिप, सेफ्टी चेक', en: 'Before — dip, water dip, safety check' },
          { hi: 'उतरते वक़्त — क्लिप और चेन', en: 'During — clip on, chain on' },
          { hi: 'बाद में — सैंपल, डिप, काग़ज़', en: 'After — sample, dip, papers' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
