# Credit-card sample photos (for the marked-up-photo variant)

**RETIRED.** These photos show the old seven-row card, so the video that uses them
(`CreditMonitorPhoto`) is not rendered or published. The shared narration now
describes the new card, and a video whose picture contradicts its own voice is
worse than none.

To bring it back:

1. Re-shoot both photos from the current card, with the dealer code masked.
2. Re-measure `ROW_BANDS` and `H_SPAN` in `src/videos/CreditMonitorPhotoVideo.tsx`
   against the new photos.
3. Put the composition back into `EXTRA` in `scripts/render-all.mts`.

## The two photos here

The `CreditMonitorPhoto` composition draws highlight boxes over the dealer's
actual "CREDIT & DOD MONITORING" screenshots. The two samples here are:

| File          | Which sample                                           |
| ------------- | ------------------------------------------------------ |
| `due.jpg`     | the **amount-due** card (FORM OF LIMIT = `DOD`)        |
| `advance.jpg` | the **credit/advance** card (FORM OF LIMIT = `CREDIT`) |

Both samples have the dealer code redacted to `XXXXX`. Keep it that way in any
re-shoot. FORM OF LIMIT holds exactly one of DOD / CREDIT / CASH & CARRY, never a
combination.

- `.png` also works: change the extension in `PHOTO` inside
  `src/videos/CreditMonitorPhotoVideo.tsx`.
- If a photo fails to load, the composition falls back to the clean recreation, so
  it still previews and renders (with a small "add photo" note).
- The highlight boxes are measured from the card's grid lines. If the card layout
  changes, re-measure and update `ROW_BANDS` / `H_SPAN` in that file.
