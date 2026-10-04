# ADR 0015 — The film pages, and how a view is counted

Status: accepted, 2026-10-04. Build contract: `docs/films/FILM_PAGES_SPEC.md`.

## 1. What it is, in one paragraph

Two Dealer Kavach films go on `mdgservices.in` as links that start playing the
moment they open: the full film (`/film`, 26 min 29 s) and a 35-second short
(`/film/short`). Every view is measured — views, unique viewers, watch time,
second-by-second retention, where people leave (named by the line being spoken),
how many turn the sound on, start-up time, buffering, and which share link,
state, city, device, network and app the view came from. A super-admin reads it
all on the admin's **Films** page and makes the share links there.

## 2. Where each piece lives

| Piece                  | Home                                                     | Why there                                                              |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Video files            | S3 bucket `mdg-films` (ap-south-1), public read          | Immutable version folders, served straight to the phone (§3)           |
| Packaging              | `marketing/films/web/package.mjs`                        | Run on a laptop per cut; HLS ladder, captions, timeline, poster        |
| Watch pages            | `mdg-landing/public/film/**`                             | Static HTML, no framework; ships with the site                         |
| City / state           | `mdg-landing` routing middleware → cookie `mdg_geo`      | The CDN already knows it; the backend never sees the visitor's address |
| Beacon + stats + links | `mdg-backend/src/films/**`, `routes/v1/films.ts`         | Mongo, the super-admin gate and the audit log already exist there      |
| Shapes                 | `shared/src/types/film.ts`, `shared/src/schemas/film.ts` | Page, server and admin agree on one definition                         |
| Films page             | `mdg-admin` → `/films`                                   | Same auth, same nav, phone-usable                                      |

## 3. Hosting: a public S3 bucket, not the website host

The films are streamed from `https://mdg-films.s3.ap-south-1.amazonaws.com`, not
from Vercel with the rest of the site.

- **Size.** One full watch at the 720p rung (1.3 Mbit/s video + 64 kbit/s audio)
  is about 270 MB; at 540p about 160 MB. Vercel's Hobby plan includes on the order
  of 100 GB of transfer a month, which is a few hundred full watches — one good
  WhatsApp group could spend it in a week, and the site would go down with it.
  (Hobby is also written for non-commercial use. Both points are from Vercel's
  published plan terms; re-check them if the plan changes.)
- **Cost on S3** is transfer only: roughly $0.11 per GB out of ap-south-1, so a
  full 720p watch costs about 3 cents and most views — which stop well short of
  the end — cost a fraction of that. No minimum, no plan cliff.
- **Immutability.** Each cut is a content-hashed folder (`/kavach/v-e0cddd2b72/`).
  A re-cut is a new folder and a new `film.json` pasted into the landing repo;
  nothing is ever overwritten, so no cache can serve a stale half of a film.
- **CORS** on the bucket allows only the site's own origins (spec §1).

CloudFront in front of the bucket is the obvious next step if transfer grows; it
is a base-URL change in `film.json`, nothing else.

## 4. "Starts immediately" means starts muted

Browsers refuse to play sound before the visitor taps. So the page autoplays
**muted with Hindi captions showing**, and puts a large "आवाज़ चालू करें" button
over the video. The first tap turns the sound on and, if the film is less than
15 s in, restarts it from 0 so the opening line is heard. If even muted autoplay
is refused (some in-app browsers, data-saver modes), the poster shows with a big
play button and the beacon records `autoplay: 'blocked'`.

The data-saving rules: start at 240p on 2G or data-saver, 360p on 3G, 540p
otherwise, then adapt; phones are capped at 720p.

## 5. The beacon

### 5.1 Transport

`navigator.sendBeacon` with a `text/plain` body; `fetch(..., { keepalive, mode:
'no-cors' })` where that is missing. `text/plain` is a "simple" request — no
preflight, so a beacon fired as the page closes still leaves. The cost is that
the page never reads the answer, so the server has to **store a beacon whatever
CORS would have said**:

- `POST /api/v1/films/beacon` reads its own body as text (16 kB cap) and parses
  it; the app-wide JSON parser skips this one path.
- CORS on this path never refuses. A known origin (`FILM_ALLOWED_ORIGINS`) gets
  the headers back; any other gets none, and the view is still stored.
- Success is always `204`, no body.

### 5.2 Brakes

Anyone on the internet can send one, so: a per-IP rate limit (300 per 5 min,
`FILM_BEACON_RATE_LIMIT`; a viewer sends about 30), the 16 kB cap, a zod schema,
unknown films refused, every second clamped to the film's length, and session
and viewer ids that must be uuids. Identity fields are strict; descriptive ones
are forgiving — a hand-edited `?r=` or a strange user agent loses the view its
label, never the view.

A film with no duration yet (the short, until it is packaged) is answered
`409 FILM_NOT_READY` and nothing is stored.

### 5.3 What a beacon carries

`start` once (who, from where, on what — no personal data), a `beat` every 10 s
of playback with the ranges watched since the last one, and an `end` on finish,
page hide or tab hide, flushing whatever is pending. Watched ranges are built on
the page from `timeupdate`; paused and buffering time is never counted, and a
seek starts a new range.

## 6. Storage

One `FilmView` row per page load, keyed by its session id. The watched seconds
are a **bitset, one bit per whole second** of the film (a second counts when its
middle was watched, so back-to-back ranges never double-count the seam and a
full watch sets every bit), held as 32-bit words — 50 words for the full film.

Every beacon is folded in by three atomic writes, never a read-modify-write of
the row:

1. an upsert of the order-free fields — counters by `$inc`, high-water marks by
   `$max`/`$min`, flags only ever set to true — whose filter refuses a `seq`
   already applied, so a beacon delivered twice counts once;
2. `$bit: { or }` of this beacon's seconds into the bitset, which merges two
   beacons that crossed on the network to the same answer in either order;
3. `$max` of the watched-second count read back after step 2, and `completed`
   set once it qualifies (≥ 95 % watched, or the end reached with ≥ 80 %).

Writes use the native driver so a word is always an int32, which `$bit` needs.
Indexes: `{ film, startedAt }`, `{ sid }` unique, `{ vid }`, `{ tag }`.

`FilmShareLink` holds a 7-character code (no 0/o/1/l/i), the film, a label of
who it was sent to, who made it and when. Links are archived, never deleted, so
old views keep their attribution. Creating and archiving are audited.

The narration timeline (every line with its start and end, and the chapters) is
vendored from the packaging output into `mdg-backend/src/films/data/`. That is
what lets the admin say "people left during _this_ line".

## 7. The numbers

Worked out in Node over the matching rows (thousands, not millions), cached 60 s
per (film, window, link). An **open** is a page load; a **view** is an open with
at least 3 s watched; everything "per view" is over views only. Retention at
second _s_ is the share of views that watched _s_. Drop-offs are the eight
steepest 5-second falls, never overlapping. A chapter is reached by 3 s watched
inside it. Days are Indian calendar days. The definitions live, with tests on a
20-second synthetic film, in `mdg-backend/src/films/stats.ts`.

## 8. Privacy

- **Nothing personal is collected.** No name, phone number, account or email.
  The viewer id is a random uuid the visitor's own browser generates and keeps
  in its local storage; clearing it makes them a new viewer.
- **No IP address is stored** — not in the view row, not hashed. The beacon path
  is also left out of the server's access log, which otherwise records the
  caller's address on every request. It is used only, in memory, by the rate
  limiter.
- **Place is coarse and comes from the CDN**: country, state and city as the
  network guesses them, never finer, and the page works with none at all.
- No cookies of our own beyond the middleware's `mdg_geo` (a day long, scoped to
  `/film`). The site's privacy page says, in one line, that it measures how its
  films are watched, anonymously.
- The stats are super-admin only, for the same reason the assistant's console
  is: they describe members of the public, not dealers.

## 9. Not built, on purpose

- No per-viewer journey across visits beyond "returning viewer" — a random id is
  enough to count people, and not enough to follow one, which is the point.
- No deletion or expiry of view rows yet. At ~1 kB a row the collection is small
  for years; add a TTL index if it ever is not.
- No live dashboard. Sixty-second-old numbers are fresh enough for a film.

## 10. Deploy notes

- New env keys (both optional, defaults shown in `.env.example`):
  `FILM_ALLOWED_ORIGINS`, `FILM_BEACON_RATE_LIMIT`.
- Two new collections, `filmviews` and `filmsharelinks`; their indexes are built
  by Mongoose on boot like every other model's.
- Updating a film: package the new cut, copy its `timeline.json` over
  `mdg-backend/src/films/data/<film>.timeline.json`, set its `version` in
  `src/films/catalog.ts`, deploy. The short starts counting once its timeline is
  vendored and imported there (or just a `duration` is set); until then its
  beacons are answered `409` and nothing is stored.
