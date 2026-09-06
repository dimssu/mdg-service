# Stock-variation sheet sample (for the `StockVariationSheet` explainer)

`sheet.jpg` is the OLD, hand-typed **STOCK VARIATION** sheet — the format MDG used
to send on WhatsApp before the DSR service started generating the card. Dealers
onboarded early still receive it, which is why it gets its own explainer.

**The dealer code is masked.** The original centre-header code was painted over
and replaced with `XXXXX`, matching the convention used for the credit-card
samples in `../credit-card/`. Never commit a copy that still carries a real code.

## If you replace this image

The video draws highlight rings on the sheet from pixel coordinates measured off
this exact file, and re-typesets the figures printed on it. Both live in
`src/lib/stockSheet.ts`. Swapping the JPEG without updating that file will point
dealers at the wrong rows and quote numbers the picture does not show.

So, in order:

1. Mask the dealer code.
2. Re-measure the grid lines and update `ROWS` (and `TABLE`, if the table's left
   or right edge moved). `SHEET` must match the new pixel dimensions.
3. Re-transcribe `FIGURES`. `assertSheetIsConsistent()` will fail the render if
   variation − permissible no longer equals the printed "not within limit".
4. Re-record the narration in `src/narration.ts` — it says every figure out loud,
   so new numbers mean new voiceover (`npm run voice -- --force`).

Grid lines are easiest to re-measure by scanning the JPEG for rows that are dark
across the table's width; the current values came from a scan at x = 45…930.
