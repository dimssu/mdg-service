# mdg-guide — the Dealer Kavach video guide

The tutorial videos from `mdg-demo` published for dealers at **guide.mdgservices.in**.
Public, no login. Hindi and English side by side; the videos themselves are narrated
in Hindi.

## Why it is built this way

The audience is fuel-pump dealers on cheap Android phones, often on 2G/3G. Every
decision below follows from that:

- **No framework, no build step worth the name.** Pages are generated as plain HTML
  by `scripts/build.mjs`. There is no React, no router, no client-side rendering.
- **CSS and JS are inlined into every page.** ~6 kB gzipped per page, so a page
  renders in a single round-trip. On a slow link, saving two round-trips beats
  sharing a cached stylesheet across pages.
- **No webfonts.** Devanagari comes from the phone's own font, so text paints
  immediately and costs nothing.
- **Nothing downloads until you press play.** `preload="none"` plus a poster image
  means a watch page costs ~25 kB total. The video is only fetched on tap.
- **Two renditions, not adaptive streaming.** The source is synthetic UI — flat
  colour, mostly static — so 360x640 keeps the Hindi captions legible at ~90 kbps.
  The whole library is 6 MB at data-saver quality, which makes HLS's complexity
  (and hls.js's 30 kB) a bad trade. Quality is picked from `navigator.connection`
  and can be overridden; the choice sticks.
- **Media filenames are content-hashed**, so they are served `immutable` — a video
  you have already watched is never re-downloaded, and a re-render can never be
  served stale.
- **Save to phone.** Every video can be downloaded and watched with no internet.

## Layout

```
content.mjs          all bilingual copy — titles, descriptions, chapter labels
data/videos.json     generated: durations, byte sizes, hashed URLs, chapter offsets
public/media/        generated: low.mp4, high.mp4, poster.webp, thumb.webp, og.jpg
src/styles.css       inlined into every page
src/app.js           inlined into every page — language, quality, chapters
scripts/build.mjs    generates dist/
scripts/serve.mjs    local preview (mirrors Vercel's cleanUrls + byte ranges)
```

## Working on it

```bash
npm run dev        # build + preview on http://localhost:4321
npm run build      # -> dist/
vercel --prod      # deploy
```

The videos and posters in `public/media/` are committed, so a deploy needs no ffmpeg
and no Remotion. To regenerate them after re-rendering the videos:

```bash
cd ..              # mdg-demo
npm run render     # re-render out/*.mp4 (needs the voiceovers)
npm run guide:media
```

`guide:media` re-encodes the ladder, cuts the posters, and measures each scene's
voiceover to place the chapter timestamps exactly on the video's scene cuts.

## Adding a video

1. Add the tutorial to `../src/narration.ts` and render it.
2. Run `npm run guide:media` in `mdg-demo`.
3. Add a bilingual entry to `content.mjs` (the `chapters` keys must match the scene
   ids in `narration.ts` — any that don't match are dropped).
4. `npm run build && vercel --prod`.
