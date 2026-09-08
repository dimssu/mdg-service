import type { SocialVideo } from '../types';

/**
 * "The water dip" — the reading everybody takes and nobody reads.
 *
 * ── WHAT IT TEACHES ────────────────────────────────────────────────────────
 *
 * Every manual dip is really two dips. The rod comes out telling you where the
 * fuel stands, and — if it has been prepared with water-finding paste — where
 * the water underneath it stands. Most forecourts take both and then look at
 * only the first one, because the first one is the number the day's arithmetic
 * needs and the second one is usually zero.
 *
 * The second one is the cheap early warning. Water is heavier than fuel, so it
 * settles on the floor of the tank; the suction line also sits near the floor of
 * the tank; so the one thing that will ruin a customer's vehicle is sitting
 * exactly where the nozzle draws from. A number that is usually zero is worth
 * taking daily precisely because the day it stops being zero is the only day it
 * matters, and by then the fuel is already going out.
 *
 * The video also teaches the shape of the check as this repository's own service
 * documentation describes it: a tank dip with water-finding paste PLUS a visual
 * look at a sample drawn from the dispenser nozzles. Two halves, not one — the
 * tank tells you what has collected, the nozzle tells you what is leaving.
 *
 * ── WHY THE THREE-NUMBER FRAMING ───────────────────────────────────────────
 *
 * Because it is how every part of this system already models a tank, and it is
 * the framing that makes the water dip stop being an afterthought. A tank
 * reading is product dip, water dip, and the stock the two of them imply; the
 * printed daily report gives each tank its own DIP / WATER DIP / STOCK column
 * group for exactly this reason. Said out loud to a dealer, "a tank reading is
 * three numbers, not one" is a small idea that reorganises the job.
 *
 * ── WHAT IT REFUSES TO SAY ─────────────────────────────────────────────────
 *
 * It does not call the register a statutory book, and it does not claim that an
 * empty or back-filled register is a finding in its own right. Both are very
 * likely true and both match operator practice, but neither is evidenced by a
 * cited clause anywhere in this repository, and the standing rule here is that a
 * compliance claim a dealer will act on must be sourced or not made. So the
 * video says the reading is written down, dated, on the day — as practice worth
 * keeping — and stops.
 *
 * For the same reason the monthly cleaning of the tank chamber is voiced as what
 * is usually done rather than as a rule. That cadence comes from one dealer's
 * own assessment sheet, not from an oil-company circular, and presenting one
 * pump's schedule as an industry standard would be a fabrication.
 *
 * Nothing here describes how any of it is watched. MDG is named once, for what a
 * dealer ends up holding.
 */
export const waterDip: SocialVideo = {
  id: 'gen-water-dip',
  compositionId: 'GenWaterDip',
  family: 'social',
  bilingual: true,
  title: { hi: 'पानी का डिप', en: 'The water dip' },
  subtitle: {
    hi: 'सब लेते हैं, पढ़ता कोई नहीं',
    en: 'The reading everyone takes and nobody reads',
  },

  beats: [
    {
      id: 'hook',
      say: {
        hi: 'हर डिप असल में दो डिप हैं — तेल का, और पानी का।',
        en: 'Every dip is really two dips: one for the product, one for the water.',
      },
      broll: 'tank-dip',
      brollWeight: 0.55,
      block: {
        kind: 'title',
        eyebrow: { hi: 'टैंक', en: 'Tanks' },
        headline: { hi: 'पानी का डिप', en: 'The water dip' },
        sub: { hi: 'सब लेते हैं, पढ़ता कोई नहीं', en: 'Everyone takes it. Nobody reads it.' },
      },
    },
    {
      id: 'three',
      say: {
        hi: 'एक टैंक की रीडिंग तीन नंबर की होती है, एक की नहीं।',
        en: 'A tank reading is three numbers, not one.',
      },
      broll: 'attendant-register',
      block: {
        kind: 'list',
        title: { hi: 'हर टैंक, हर दिन', en: 'Every tank, every day' },
        items: [
          {
            text: { hi: 'तेल का डिप', en: 'Product dip' },
            sub: { hi: 'रॉड पर तेल कहाँ तक चढ़ा', en: 'How high the fuel stands on the rod' },
          },
          {
            text: { hi: 'पानी का डिप', en: 'Water dip' },
            sub: { hi: 'उसके नीचे पानी कितना', en: 'How much water sits below it' },
          },
          {
            text: { hi: 'बचा हुआ स्टॉक', en: 'Stock in the tank' },
            sub: { hi: 'ऊपर के दोनों से निकलता है', en: 'Worked out from the two above' },
          },
        ],
      },
    },
    {
      id: 'paste',
      say: {
        hi: 'रॉड पर पानी वाला पेस्ट लगाइए। पानी हुआ तो रंग बदलेगा।',
        en: 'Put water-finding paste on the rod. If there is water, the colour changes.',
      },
      broll: 'tank-dip',
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'रॉड पर पेस्ट', en: 'Paste on the rod' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'टैंक में डालिए', en: 'Dip the tank' },
            tone: 'neutral',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'रंग बदला?', en: 'Colour changed?' },
            body: { hi: 'जहाँ तक बदला, वही निशान', en: 'The height it changed to is the mark' },
            tone: 'warn',
          },
        ],
      },
    },
    {
      id: 'read',
      say: {
        hi: 'रंग जहाँ तक बदला, टैंक में उतना ही पानी खड़ा है।',
        en: 'The height the colour changed to is how much water is standing there.',
      },
      broll: 'tank-dip',
      hold: true,
      block: {
        kind: 'flow',
        steps: [
          {
            figure: { hi: '1', en: '1' },
            title: { hi: 'रॉड पर पेस्ट', en: 'Paste on the rod' },
            tone: 'neutral',
          },
          {
            figure: { hi: '2', en: '2' },
            title: { hi: 'टैंक में डालिए', en: 'Dip the tank' },
            tone: 'neutral',
          },
          {
            figure: { hi: '3', en: '3' },
            title: { hi: 'रंग बदला?', en: 'Colour changed?' },
            body: { hi: 'जहाँ तक बदला, वही निशान', en: 'The height it changed to is the mark' },
            tone: 'warn',
          },
        ],
      },
    },
    {
      id: 'halves',
      say: {
        hi: 'जाँच दो हिस्सों की है — टैंक का डिप, और नोज़ल का नमूना।',
        en: 'The check has two halves: the dip in the tank, a sample from the nozzle.',
      },
      broll: 'forecourt-wide',
      block: {
        kind: 'compare',
        left: {
          head: { hi: 'टैंक का डिप', en: 'The tank dip' },
          tone: 'neutral',
          rows: [
            { hi: 'पेस्ट से पानी की ऊँचाई', en: 'Paste shows the water height' },
            { hi: 'जो जमा हो गया', en: 'What has collected' },
          ],
        },
        right: {
          head: { hi: 'नोज़ल का नमूना', en: 'The nozzle sample' },
          tone: 'neutral',
          rows: [
            { hi: 'साफ़ है या धुंधला', en: 'Clear, or cloudy' },
            { hi: 'जो बाहर जा रहा है', en: 'What is going out' },
          ],
        },
        join: 'rails',
      },
    },
    {
      id: 'settles',
      say: {
        hi: 'पानी भारी है — नीचे बैठता है। नोज़ल भी नीचे से ही खींचता है।',
        en: 'Water is heavier, so it settles low. The nozzle draws from low down too.',
      },
      broll: 'pump-night',
      block: {
        kind: 'wrong',
        headline: { hi: 'दिखेगा नहीं, चला जाएगा', en: 'You will not see it. It goes out anyway.' },
        body: {
          hi: 'तेल का डिप बिल्कुल ठीक आ सकता है और नीचे पानी फिर भी खड़ा हो सकता है।',
          en: 'The product dip can read perfectly fine while water is standing underneath it.',
        },
        slots: [
          { label: { hi: 'तेल का डिप', en: 'Product dip' } },
          { label: { hi: 'पानी का डिप', en: 'Water dip' }, missing: true },
        ],
      },
    },
    {
      id: 'record',
      say: {
        hi: 'और यह उसी दिन रजिस्टर में लिखिए। बाद में भरा हुआ बेकार है।',
        en: 'Write it in the register the same day. A back-filled register helps nobody.',
      },
      broll: 'ledger-night',
      block: {
        kind: 'list',
        title: { hi: 'रजिस्टर में क्या जाता है', en: 'What goes into the register' },
        items: [
          { text: { hi: 'तारीख़ और समय', en: 'Date and time' }, ok: true },
          { text: { hi: 'हर टैंक का पानी का डिप', en: "Each tank's water dip" }, ok: true },
          { text: { hi: 'उसी दिन, बाद में नहीं', en: 'The same day, not later' }, ok: true },
          {
            text: { hi: 'चैंबर की सफ़ाई', en: 'Cleaning the tank chamber' },
            sub: { hi: 'आम तौर पर महीने में एक बार', en: 'Usually once a month' },
            tone: 'neutral',
          },
        ],
      },
    },
    {
      id: 'mdg',
      say: {
        hi: 'MDG सर्विसेज़ हर टैंक का पानी का डिप रोज़ सामने रखती है।',
        en: "MDG Services puts every tank's water dip in front of you, every day.",
      },
      broll: 'phone-call',
      block: {
        kind: 'claim',
        figure: { value: 'MDG' },
        label: {
          hi: 'हर टैंक का पानी का डिप, हर दिन',
          en: "Every tank's water dip, every single day",
        },
        tone: 'brand',
        note: {
          hi: 'लिखा हुआ, तारीख़ के साथ, संभला हुआ',
          en: 'Written down, dated, and kept',
        },
      },
    },
    {
      id: 'recap',
      say: {
        hi: 'याद रखिए — पेस्ट लगाइए, नमूना देखिए, उसी दिन लिख दीजिए।',
        en: 'Remember: paste on the rod, look at a sample, write it the same day.',
      },
      broll: 'sunrise-calm',
      brollWeight: 0.5,
      block: {
        kind: 'recap',
        steps: [
          { hi: 'हर टैंक का पानी का डिप, रोज़', en: 'A water dip on every tank, every day' },
          { hi: 'हर नोज़ल का नमूना आँख से देखिए', en: 'Look at a sample from every nozzle' },
          { hi: 'उसी दिन रजिस्टर में लिख दीजिए', en: 'Into the register the same day' },
        ],
        closing: { hi: 'mdgservices.in', en: 'mdgservices.in' },
      },
    },
  ],
};
