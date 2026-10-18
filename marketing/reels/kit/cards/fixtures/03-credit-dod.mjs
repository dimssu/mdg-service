// Reel 03 · Credit & DOD — INVENTED figures (CATALOG § 03, fact file §5). No real outlet; the
// code below is hidden on screen anyway. Checked:
//   current limit 25,00,000 − availed 18,42,650 = available 6,57,350 · 18,42,650 / 25,00,000 = 73.7% → prints 74%
//   hot-bar variant: availed 22,50,000 → available 2,50,000 · 90% (the bar turns red from 85%)
//   due ₹4,86,120 by 26-08-2026; the card counts days from preparedOn (the as-of date):
//     21-08 → "5 दिन बाक़ी हैं" · 23-08 → "3 दिन बाक़ी हैं" · 25-08 → "कल आख़िरी दिन" · 26-08 → "आज ही जमा करना है"
//   No purchase day is printed, so 26-08 (a Wednesday) needs no narrated purchase (it could only follow a
//   Sunday purchase under the 3-day rule; if a reel ever narrates one: bought Mon 24-08 → due Thu 27-08).
const base = {
  code: 'X0X',
  dueAmount: 486120,
  dueDate: '26-08-2026',
  currentLimit: 2500000,
  availedLimit: 1842650,
  availableLimit: 657350,
  formOfLimit: 'DOD',
  preparedAt: '',          // the footer's left side (DATA PREPARED AT + a time) is hidden on screen anyway
  overdue: null,
  creditReview: null,      // no lock band: the review date is not part of this story
};
if (base.currentLimit - base.availedLimit !== base.availableLimit) throw new Error('limits do not add up');
const asOf = (d) => ({ ...base, preparedOn: d });
// One card, as of 23-08 ("3 दिन बाक़ी हैं"). The prompt review (18 Oct) removed the others: a "5 days left"
// card for a 26-08 deadline describes a debt that does not exist yet on 21-08 (that deadline can only follow
// a 23-08 trigger), dated cards in sequence imply a delivery rhythm, and the 90% card's limits disagree with
// this one's. All five were drawn and checked on 18 Oct; the countdown lives on the reel's own board.
export const cards = [
  { name: 'due-3', builder: 'credit-dod', input: asOf('23-08-2026') },
];
