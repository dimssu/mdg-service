# Credit-card sample photos (for the marked-up-photo variant)

The `CreditMonitorPhoto` composition draws highlight boxes over the dealer's
actual "CREDIT & DOD MONITORING" screenshots. Drop the two samples here:

| File          | Which sample                                     |
| ------------- | ------------------------------------------------ |
| `due.jpg`     | the **amount-due** card (header code `5E01`)     |
| `advance.jpg` | the **credit/advance** card (header code `1E01`) |

- `.png` also works — change the extension in `PHOTO` inside
  `src/videos/CreditMonitorPhotoVideo.tsx`.
- Until both files exist, the composition falls back to the clean recreation, so
  it still previews and renders (with a small "add photo" note).
- The highlight boxes are measured from the current template's grid lines. If the
  card layout changes, re-measure and update `ROW_BANDS` / `H_SPAN` in that file.
