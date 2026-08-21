# ADR 0009 — The landing-page assistant (voice + chat + live call)

Status: accepted, 2026-08-21

## 1. What it is, in one paragraph

A visitor on `mdgservices.in` can ask a question — by typing, by sending a voice
note, or by tapping **Call** and simply talking — and gets a spoken and written
answer in their own language. The answers come only from a fixed library of
documents we control: the Marketing Discipline Guidelines 2024 and its
advisories, plus a written description of what MDG Services does. Every call is
recorded, transcribed, scored for spam, and visible to super-admins, who also get
the visitor's name, place and mobile number as a lead.

The assistant is a **front door**, not a support agent. It answers the question,
says plainly how MDG handles that exact problem, and then hands the person to a
human. It never quotes a price and never describes how any of our work is done.

## 2. Where each piece lives, and why

| Piece                    | Home                                                     | Why there                                                                                                               |
| ------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Knowledge-base ingestion | `~/Documents/PP/mdg-rag-ingest` (**outside every repo**) | Run once per document revision, on a laptop, against a GCP account. Nothing about it belongs in a deployed artifact.    |
| Packed knowledge base    | S3 `assist/kb/<version>/`                                | Built rarely, read at boot. Keeps a 3 MB binary out of git and lets the KB be replaced without a deploy.                |
| Assistant runtime        | `mdg-backend/src/assist/**`                              | Needs WebSockets, Mongo, S3, a super-admin surface and a long-lived in-process cache. All of that already exists there. |
| Admin surface            | `mdg-admin` → `/assist` (super-admin only)               | Same auth, same nav, same primitives.                                                                                   |
| Widget                   | `mdg-landing/src/components/assist/**`                   | Lazy-loaded so the 2G visitor pays nothing until they tap it.                                                           |

The landing site's serverless functions (`api/enroll`, `api/callback`) stay as
they are. They mail; they do not talk to the backend. The assistant is the first
thing on that site that calls `api.mdgservices.in`, so `CORS_ORIGINS` must list
`https://mdgservices.in`.

## 3. The knowledge base

### 3.1 Sources

| Document                            | Pages | Text layer? | Handling                                                                                            |
| ----------------------------------- | ----- | ----------- | --------------------------------------------------------------------------------------------------- |
| MDG 2024 (effective 24.10.2024)     | 70    | yes         | `pdftotext -layout`                                                                                 |
| Display boards                      | 15    | page 1 only | page 1 text, pages 2–15 transcribed from images                                                     |
| First aid Kit                       | 2     | no          | transcribed from images                                                                             |
| Toilet Cleanliness Advisory (Hindi) | 2     | no          | transcribed from images, Devanagari preserved                                                       |
| What MDG Services does              | —     | —           | authored from `mdg-landing/src/i18n/en/*` — the nine services, the four extras, hours, process, FAQ |

Scanned pages are rasterised with `pdftoppm` and transcribed by a Gemini
multimodal call. That is a one-time laptop step; the server never sees a PDF.

### 3.2 Chunking

Structure-aware, not fixed-window. The MDG document is numbered (`1.1`, `2.4`,
…) and those numbers are how a dealer is told what they broke, so a chunk never
straddles a clause boundary. Target 700 tokens, 120-token overlap, hard ceiling
1,200. Every chunk carries `docId`, `section`, `sectionTitle`, `pageFrom`,
`pageTo`, `lang`, `visibility`.

### 3.3 Embeddings

`text-multilingual-embedding-002` on Vertex AI, 768 dimensions, **asymmetric
task types**: documents embedded as `RETRIEVAL_DOCUMENT`, queries as
`RETRIEVAL_QUERY`. Questions arrive in Hindi against English source text, so a
multilingual model is not optional.

Batched: up to 250 texts per `:predict` call. A `--mode=batch-job` path exists
for a corpus large enough to want an async `batchPredictionJob`, but at ~900
chunks the online path finishes in under a minute and the job path would take
hours, so it is not the default.

### 3.4 The packed format

```
assist/kb/<version>/
  manifest.json   { version, model, dims, count, builtAt, sha256: {chunks, vectors} }
  chunks.json     [{ id, docId, section, sectionTitle, pageFrom, pageTo, lang, text }]
  vectors.f32     count × dims little-endian float32, L2-normalised, row-major
```

Vectors are pre-normalised so search is a dot product. The measured corpus is
**~100 chunks / ~32,000 tokens**, not the ~900 first estimated — the MDG document
is 70 pages but they are sparse pages. That is 300 KB resident and a full scan is
microseconds: an exact answer, with no index to maintain, no vector database, and
no recall cliff. If the corpus ever passes ~50,000 chunks this stops being the
right call; it is three orders of magnitude away.

The small corpus moves the risk. With 100 chunks the danger is not search speed,
it is a chunk being too coarse to retrieve precisely — so the chunker supports a
350-token target (97 chunks, median 328) to fall back on if the golden-question
eval shows weak recall.

Loaded lazily on the first assist request (never at boot — a failed S3 read must
not stop the API starting), verified against the manifest checksums, cached on
local disk at `var/assist/kb/<version>/`, and hot-reloadable from the admin UI.

## 4. Answering a question

```
question
  └─► rules pre-guard  ── blocked ──►  templated refusal
  └─► intent classifier (gemini-2.5-flash-lite, JSON)
        └─ pricing / internal / off-topic / abusive / injection ──► templated refusal
  └─► embed query ─► dot-product top-8 ─► MMR to 5
        └─ best score < 0.62 ──► "I don't have that written down" + offer a callback
  └─► generate (gemini-2.5-flash) with ONLY those 5 chunks + a company-facts block
  └─► output guard  ── leak / price / prompt-echo / no citation ──► safe fallback
  └─► answer (+ TTS if the turn was spoken)
```

The classifier and the answerer are deliberately **two different calls**. The
model that reads hostile text is not the model that also holds the retrieved
context and writes the reply, so a successful injection has nothing to steal.

### 4.1 What the assistant must never say

Enforced three times over — in the rules pre-guard on input, in the system
prompt, and in the regex scan on output:

- Any price, fee, rate, discount or figure in rupees.
- Any description of how we work: portals we log into, tools, models, schedules,
  data sources, pipelines, "we scrape", "we use AI", vendor names.
- Anything about its own construction: which model, what prompt, what documents.
- Anything about a named dealer, or any data belonging to one.
- Anything outside the guidelines and our own services.

This is [[no-internal-detail-on-public-sites]] made executable. The public site
rule is "outcomes only, never method"; the assistant is a public surface and gets
the same rule with a scanner behind it.

### 4.2 Tone

Acknowledge the worry, answer the question from the guidelines, say in one
sentence how MDG carries that load, offer the next step. Warm, plain, short
sentences, the visitor's language. Never pushy; a visitor who only wants to know
what MDG is gets a straight answer and an invitation, not a pitch.

## 5. The call

Browser microphone over a Socket.IO namespace `/assist-call`. No telephony
provider, no phone number, no per-minute cost.

| Guard             | Value                                | Why                                                                                                                   |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Concurrent calls  | 3 globally                           | The box has ~450 MB free and ElevenLabs concurrency is finite. A 4th caller is offered a callback, not a dead button. |
| Inactivity        | 60 s                                 | As specified. A single nudge at 40 s first.                                                                           |
| Total duration    | 15 min                               | As specified. Warning at 13 min.                                                                                      |
| Turns             | 40                                   | Stops a feedback loop burning credit.                                                                                 |
| One utterance     | 30 s                                 | Also the STT request cap.                                                                                             |
| Speech per call   | 8 min                                | The cost ceiling that actually binds.                                                                                 |
| Silent start      | prompt at 20 s, drop at 60 s         | Dead tabs release the slot.                                                                                           |
| Reconnect grace   | 20 s                                 | A network blip should not lose the conversation.                                                                      |
| Recording consent | spoken first line + a visible notice | Recording someone without telling them is not acceptable.                                                             |
| Abuse             | one warning, then end                |                                                                                                                       |
| Daily spend       | env cap in paise                     | When hit, calls are off and chat offers a callback.                                                                   |
| Kill switch       | `ASSIST_ENABLED=false`               |                                                                                                                       |

Barge-in is supported: speech from the visitor cancels playback of the answer.

### 5.1 Recording

There is **no ffmpeg on the server** (verified), and the box cannot afford a
transcoder anyway. So each utterance — visitor and assistant alike — is written
to S3 as its own object the moment it exists, and a manifest orders them:

```
assist/calls/<sessionId>/00001-user.webm
assist/calls/<sessionId>/00002-bot.mp3
assist/calls/<sessionId>/manifest.json
```

The admin player walks the manifest and plays the segments in order, which is
the whole recording. Nothing is ever held in memory waiting to be joined.

### 5.2 Lead capture

The assistant asks for name, place and mobile once, early, conversationally, and
does not nag. The mobile is validated (`^[6-9]\d{9}$`) and read back for
confirmation before an escalation is accepted.

## 6. Spam and repeat callers

At the end of every session a fingerprint is computed — `sha256(mobile)` when
there is one, else `sha256(ip + userAgent)`. A session is flagged when any of:

- 4+ sessions from one fingerprint in 24 h
- 3+ sessions that captured no lead and ran under 2 turns
- the same normalised opening message seen across sessions
- 2+ turns classified abusive
- 3+ mobile numbers that fail the sanity check

Flags are advisory. A super-admin blocks a fingerprint explicitly; nothing
blocks itself.

## 7. Rate limiting

One reusable token-bucket keyed by `(scope, key)`, in a bounded LRU with lazy
expiry — O(1), no timers. **In-process is safe only because pm2 runs
`instances: 1`** (`ecosystem.config.cjs` pins it, deliberately). If that ever
changes, this and the scheduler both break.

| Scope             | Key     | Limit             |
| ----------------- | ------- | ----------------- |
| `session:create`  | IP      | 5 / 10 min        |
| `session:create`  | IP /24  | 30 / h            |
| `turn:text`       | session | 20 total, 6 / min |
| `turn:voice`      | session | 12 total, 3 / min |
| `call:start`      | IP      | 3 / h             |
| `call:concurrent` | global  | 3                 |
| `llm:global`      | global  | 120 / min         |
| `spend:day`       | global  | env cap           |

## 8. Data kept

`AssistSession` holds the transcript, the lead, the flags, the recording
manifest, the cost and (while tracing is on) a per-turn trace. `AssistBlock`
holds blocked fingerprints. `AssistUsageDay` holds the daily counters the budget
cap reads.

Audio is deleted after `ASSIST_AUDIO_RETENTION_DAYS` (default 90) by a nightly
sweep; the transcript stays. Mobile numbers are stored (a callback needs one)
and redacted in every log line.

## 9. Tracing — REMOVE WHEN STABLE

`ASSIST_TRACE=true` records, per turn: retrieved chunk ids and scores, guard
verdicts, stage timings, model, token counts, and a **hash** of the prompt (never
the prompt). Capped at 60 entries per session. This exists to debug the first
weeks and is expected to be turned off; see the memory note
[[assist-heavy-tracing]].

## 10. What is deliberately not built

- No telephony. Decided with the founder: browser mic only.
- No vector database. See §3.4.
- No ffmpeg / no merged recording file. See §5.1.
- No answer cache in v1. Questions are long-tail and a wrong cache hit on a
  compliance answer is worse than the saved rupee.
- No widget on `vruoom.com` or `guide.mdgservices.in`. Decided with the founder.
