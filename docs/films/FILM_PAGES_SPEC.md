# Film pages + film analytics — build spec (4 Oct 2026)

Two Dealer Kavach films go on **mdgservices.in** as shareable links that start playing the
moment they open, and every view is measured: views, unique viewers, watch time, retention
second by second, where people drop off (mapped to the spoken line), sound-on rate, start-up
time, buffering, and which share link / city / device / network the view came from.

| film id        | what                               | duration         | public URL                          |
| -------------- | ---------------------------------- | ---------------- | ----------------------------------- |
| `kavach`       | the full film (v2)                 | 1589.7 s (26:29) | `https://mdgservices.in/film`       |
| `kavach-short` | the 30–40 s short (being made now) | ~35 s            | `https://mdgservices.in/film/short` |

Query params on both URLs: `?r=<code>` share-link code (attribution), `?from=short` (set by
the short's end button), `#t=<seconds>` deep-link into the film.

## 1. Media (already decided and live — do not change)

Public bucket `mdg-films` (ap-south-1), base `https://mdg-films.s3.ap-south-1.amazonaws.com`.
Each film version is an immutable folder `/<film>/<version>/` produced by
`marketing/films/web/package.mjs`:

| file                             | what                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `master.m3u8`                    | HLS master; 5 renditions 1920/1280/960/640/426 tall (9:16), 4 s TS segments, muxed mono AAC          |
| `r0..r4/index.m3u8`, `s0000.ts…` | renditions, `r0` = 1080x1920 … `r4` = 240x426                                                        |
| `film-540.mp4`                   | fast-start 540p mp4: fallback for browsers with neither native HLS nor MSE                           |
| `poster.jpg`                     | 540x960 first-frame poster                                                                           |
| `captions.hi.vtt`                | Hindi WebVTT, one cue per phrase, timed to the narration                                             |
| `chapters.json`                  | `[{ t, title }]` (full film only; `[]` for the short)                                                |
| `timeline.json`                  | `{ film, duration, lines: [{ id, t, end, hi }], chapters }` — every narrated line with its start/end |
| `film.json`                      | `{ film, title, version, duration, base, hls, mp4, poster, captions, chapters, ladder }`             |

CORS on the bucket allows `https://mdgservices.in`, `https://www.mdgservices.in`,
`https://mdg-landing.vercel.app`, `http://localhost:5173`, `http://localhost:4173`.
The current `film.json` for each film is copied into the landing repo at build time (see §2).

## 2. Watch pages — `mdg-landing` (Vercel project `mdg-landing`, deployed by CLI, not git)

**Not part of the React SPA.** Two standalone static pages, as light as the guide site
(`mdg-demo/site`, zero framework, inline CSS/JS, device fonts — read its README for the
2G reasoning): `public/film/index.html` → `/film`, `public/film/short/index.html` →
`/film/short` (or generated into `dist/` by a small build step — your call, but the output
must be plain static HTML). Add explicit `vercel.json` rewrites for `/film` and `/film/short`
BEFORE the SPA catch-all. Target: HTML + inline CSS/JS ≤ 15 kB gzipped; nothing else
blocks first paint; the poster is the LCP image.

Config: `src/film/films.json` (or similar) holds the two `film.json` objects (base URL,
version, duration, chapters). Updating a film = new version folder + paste its film.json +
redeploy. A film whose version is not yet known (the short, today) must render a tasteful
"जल्द आ रहा है" state instead of a broken player.

**Playback — "starts immediately":** browsers forbid sound before a tap, so:

- `<video playsinline muted autoplay preload="auto" poster=…>`; HLS natively where
  `canPlayType('application/vnd.apple.mpegurl')` says yes (iOS/Safari; Android Chrome), else
  **hls.js** (`hls.js/dist/hls.light.min.js`, self-hosted under `/film/`, loaded only when
  needed), else `film-540.mp4`.
- hls.js: `capLevelToPlayerSize: true`; start level from `navigator.connection` —
  `saveData` or `effectiveType` 2g/slow-2g → r4, 3g → r3, else r2 — then ABR; cap phones
  (`(pointer: coarse)`) at r1 (720p) to save the dealer's data.
- Hindi captions (`<track kind="captions" srclang="hi" default>`) **showing while muted**;
  styled large and legible (`::cue`), positioned above the controls.
- A big, obvious **"🔊 आवाज़ चालू करें"** button over the video while muted. First tap:
  unmute, and if the playhead is < 15 s, restart from 0 (so the viewer hears the opening).
  After sound is on, captions switch off (a CC toggle brings them back).
- If even muted autoplay is blocked, show the poster with a large play button.
- Native controls (`controls`), plus speed chips **1x · 1.2x · 1.5x** under the player
  (the founder already makes 1.2x versions; this replaces separate files).
- Full film: chapter list under the player (title + time), tap seeks; highlight current.
- **End screen.** Short: a large "पूरी फ़िल्म देखें (26 मिनट) →" button to
  `/film?from=short&r=<same code>` + replay. Full film: "डीलर कवच से जुड़ें" to `/register`
  (the site's existing enrolment page) + replay. Both: a WhatsApp share button
  (`https://wa.me/?text=<encoded title + URL with the same ?r>`).
- Page chrome: MDG logo mark (existing `/logo-mark.png`), title, one line of description,
  nothing else above the fold — the video fills a phone screen width in 9:16.
- Meta: `<title>`, description, Open Graph + Twitter card (`og:type=video.other`,
  `og:image` = a 1200x630 JPEG served from mdgservices.in itself — build it like
  `scripts/og.mjs` builds `og.png`; frames to use are in
  `marketing/.work/web/<film>/<version>/poster.jpg` or pull a frame from the film).
  WhatsApp shows the og:image as the link preview, so it must be ≤ 300 kB and absolute https.
- `<link rel=preconnect>` to the media host; `<link rel=preload as=image>` the poster.

**Geo for analytics:** Vercel Routing Middleware (`middleware.ts` at the project root,
matcher `/film` and `/film/:path*`) reads `x-vercel-ip-country`, `x-vercel-ip-country-region`,
`x-vercel-ip-city` and sets cookie `mdg_geo=<country>|<region>|<city>` (URL-encoded,
`Path=/film; Max-Age=86400; SameSite=Lax; Secure`). Verify with `vercel build` that the
middleware is emitted for this Vite project; if Routing Middleware is not available,
fall back to a tiny `api/geo.ts` function the page calls once. The page must work with no
geo at all.

**Analytics client** (inline, small): sends beacons to the backend (§3) with
`navigator.sendBeacon(url, new Blob([json], { type: 'text/plain' }))`; fallback
`fetch(url, { method: 'POST', body: json, keepalive: true, mode: 'no-cors' })`.

- `vid` viewer id: uuid in `localStorage['mdg_vid']` (try/catch; generate per page if blocked).
- `sid` session id: fresh uuid per page load. `seq` increments per beacon.
- Track watched ranges from `timeupdate` (merge consecutive positions ≤ 1.5 s apart; a seek
  starts a new range; never count time while paused/buffering). Send a `beat` every 10 s of
  playback with the ranges since the last beacon, and an `end` on `ended`, `pagehide`, and
  `visibilitychange → hidden` (flush whatever is pending).
- Measure `startupMs` = navigation start → first `playing`/first frame; rebuffers =
  `waiting` events after first frame (+ duration); current rendition height.
- Never sends personal data. No cookies of our own besides `mdg_vid` (localStorage) and the
  middleware's `mdg_geo`.
- Add one short neutral line to `public/privacy.html` saying the site measures how its films
  are watched, anonymously (no name, number or account). Keep the page's existing tone.

## 3. Backend — `mdg-backend` (Express + Mongo, pm2 on EC2, api.mdgservices.in)

### 3.1 Public beacon

`POST /api/v1/films/beacon` — public, no auth, `204` always on success.

- Accept `text/plain` AND `application/json` bodies (sendBeacon sends text/plain, no
  preflight). Mount an `express.text({ type: ['text/plain', 'application/json'], limit: '16kb' })`
  (or equivalent) on this route only; the global JSON parser must not break it.
- CORS: the landing origin is already allowed (`ASSIST_ALLOWED_ORIGINS`); confirm
  `https://mdgservices.in` and `https://www.mdgservices.in` pass. sendBeacon is no-cors
  anyway — the request must succeed server-side even if CORS headers were missing.
- Rate limit per IP (e.g. 300 / 5 min); body ≤ 16 kB; reject unknown films; clamp ranges to
  `[0, duration]`; drop beacons whose `sid` is not a uuid.
- Beacon payload (validate with zod):

```ts
type FilmId = 'kavach' | 'kavach-short';
type FilmBeacon = {
  v: 1;
  film: FilmId;
  sid: string; // uuid per page load
  vid: string; // uuid per browser
  seq: number; // 0,1,2… per session
  kind: 'start' | 'beat' | 'end';
  at: number; // client epoch ms
  ctx?: {
    // only on kind 'start'
    tag?: string; // ?r=, /^[A-Za-z0-9_-]{1,32}$/
    from?: string; // ?from=, /^[a-z-]{1,16}$/
    ref?: string; // document.referrer HOST only
    lang?: string;
    os?: string;
    browser?: string;
    mobile?: boolean;
    inApp?: string; // 'whatsapp' | 'facebook' | 'instagram' | ... from UA
    screen?: [number, number];
    net?: { type?: string; saveData?: boolean; downlink?: number };
    geo?: { country?: string; region?: string; city?: string };
    autoplay: 'muted' | 'blocked';
  };
  ranges?: Array<[number, number]>; // watched [from, to] seconds since last beacon
  pos?: number;
  muted?: boolean;
  unmutedAt?: number; // playhead when sound first turned on (sent once)
  restarted?: boolean; // the sound-on tap restarted from 0
  startupMs?: number; // sent once
  rebuffers?: number;
  rebufferMs?: number; // since last beacon
  level?: number; // rendition height now
  ended?: boolean;
  cta?: Array<'full' | 'register' | 'share' | 'replay' | 'chapter' | 'speed'>; // since last beacon
  rate?: number; // playbackRate when not 1
};
```

### 3.2 Storage

`FilmView` — one document per session (`sid` unique), upserted by each beacon:
film, sid, vid, tag, from, ref, lang, device {os, browser, mobile, inApp, screen},
net {type, saveData, downlink}, geo {country, region, city}, autoplay, startedAt (server
time of first beacon), lastSeenAt, beacons (count), startupMs, unmuted (bool), unmutedAt,
restarted, **watched** (per-second bitset of the film, 1 bit per whole second the viewer
saw, stored compactly, e.g. base64 or Binary), watchedSeconds, maxPos, ended, completed
(watched ≥ 95% of the film OR ended with ≥ 80%), rebuffers, rebufferMs, maxLevel, cta
counts, rates used. Indexes: `{ film: 1, startedAt: -1 }`, `{ sid: 1 }` unique, `{ vid: 1 }`,
`{ tag: 1 }`. No IP stored (not even hashed). Concurrent beacons for one sid must not lose
bits (use an atomic update or a short read-modify-write with a retry on version conflict).

`FilmShareLink` — code (6–8 chars, unambiguous alphabet), film, label (who/where it was
sent, free text ≤ 80), createdBy (admin id), createdAt, archived.

Film metadata (duration, timeline lines, chapters) comes from each film's `timeline.json`
(§1) — vendor the current ones into the backend (e.g. `src/films/data/<film>.timeline.json`),
plus a small `films` config (id, title, public URL, duration). A film with no timeline yet
(the short, today) must still accept beacons once it has a duration configured; until then
reject its beacons gracefully.

### 3.3 Admin API (super-admin only — same gate as the assist console)

- `GET /api/v1/admin/films` → the films with title, URL, duration, version, total views.
- `GET /api/v1/admin/films/:film/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&tag=<code>` →

```ts
type FilmStats = {
  film: FilmId;
  title: string;
  duration: number;
  range: { from: string; to: string };
  totals: {
    opens: number; // sessions (page opened, player loaded)
    views: number; // sessions with ≥ 3 s watched
    viewers: number; // distinct vid among views
    returning: number; // viewers with > 1 view
    watchSeconds: number;
    avgWatchSeconds: number; // per view
    avgPercent: number; // per view, 0..1
    completionRate: number; // completed / views
    soundOnRate: number; // unmuted / views
    startupMedianMs: number | null;
    startupP90Ms: number | null;
    rebufferRatio: number; // rebufferMs / (watchMs + rebufferMs)
  };
  quartiles: { p25: number; p50: number; p75: number; p100: number }; // share of views reaching
  retention: number[]; // one per second: share of views that watched that second (0..1)
  retentionSoundOn: number[]; // same, among views that turned sound on
  dropoffs: Array<{ t: number; lost: number; line: { id: string; hi: string; t: number } | null }>; // 8 steepest 5-s falls, with the line being spoken
  chapters: Array<{ t: number; title: string; reach: number }>;
  daily: Array<{
    day: string;
    opens: number;
    views: number;
    viewers: number;
    watchSeconds: number;
  }>; // IST days
  breakdowns: Record<
    'tag' | 'region' | 'city' | 'device' | 'network' | 'referrer' | 'inApp',
    Array<{
      key: string;
      label?: string;
      views: number;
      viewers: number;
      avgPercent: number;
      completionRate: number;
      soundOnRate: number;
    }>
  >;
  shortToFull: null | {
    shortViews: number;
    fullClicks: number;
    viewersWhoStartedFull: number;
    rate: number;
  }; // only for kavach-short
};
```

Compute with an aggregation or in Node over the matching sessions (expect thousands, not
millions); cache per (film, range, tag) for 60 s. IST day boundaries.

- `GET /api/v1/admin/films/:film/sessions?limit=50&before=<iso>` → recent views for a
  drill-down table (time, tag+label, city/region, device, network, watched s, %, sound on,
  completed, startup ms).
- `GET /api/v1/admin/films/links?film=` → share links with per-link views/viewers/avgPercent.
- `POST /api/v1/admin/films/links` `{ film, label }` → `{ code, url }` (url = the public URL
  with `?r=code`). `DELETE /api/v1/admin/films/links/:code` → archive.
- Write audit entries for link create/archive like other admin writes.

### 3.4 Shared types

Put `FilmId`, `FilmBeacon` (+ zod schema), `FilmStats`, the session row, and the share-link
types in the canonical `shared/` package and **mirror byte-identically into the three
vendored copies** (`mdg-backend/shared`, `mdg-client/shared`, `mdg-admin/shared`), then
md5-verify all four. (Memory: the parent repo's pre-commit prettier hook can reformat
`shared/` and desync the copies — re-verify md5 after any formatting.)

## 4. Admin — `mdg-admin` (super-admin page "Films")

Route `/films`, sidebar entry with the other super-admin tools. Phone-usable (the admin is
used on phones — follow the existing admin mobile patterns). No chart library exists:
draw charts as inline SVG, theme-aware, following the house look. Keep the computations
(retention smoothing, formatting, axis ticks) in pure functions in a `lib/` file — the admin
has no test runner, so keep decidable logic pure and small.

Contents:

1. Film switcher (Full film / 35-s short) + date range (7 days / 30 days / all) + share-link filter.
2. KPI tiles: Page opens · Views · Unique viewers · Avg watch time · Avg % watched ·
   Completed · Turned sound on · Start time (median).
3. **Retention curve** (the centrepiece): % of views still watching at each second, chapter
   bands behind it, hover/tap shows the time, the % and the Hindi line being spoken; a
   second faint line for sound-on views.
4. Biggest drop-offs: time · line being spoken · % lost — tap seeks nothing, just reads.
5. Quartile bars (reached 25/50/75/100%) and per-chapter reach (full film).
6. Views per day (bars).
7. Breakdowns as compact tables: share link (label), state, city, device, network, source app.
8. Short → full film conversion card (on the short).
9. **Share links**: create a link with a label ("Ramesh ji, Kanpur" / "Rajasthan WhatsApp
   group") → shows the URL with copy + "WhatsApp पर भेजें" buttons; list with per-link stats.
10. Recent views table (drill-down).
    Empty states that explain what will appear once the film is shared.

## 5. Rules for every builder

- Do **not** commit, push or deploy. The orchestrator ships.
- Public pages follow the standing rule: outcomes only, no internal method, no internal
  screens, no mention of AI. Never mention Claude or Anthropic anywhere.
- Hindi strings: natural spoken Hindi, the site's existing spellings (एम-डी-जी, डीलर कवच).
- Run each repo's typecheck/lint/tests and report the results honestly.
