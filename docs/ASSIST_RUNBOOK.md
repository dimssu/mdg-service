# The landing assistant — turning it on, and running it

Plain steps, in order. Design lives in `docs/ADR/0009-landing-assistant.md`.

Nothing in this feature does anything until `ASSIST_ENABLED=true` **and** a
knowledge base has been published. Both are one line each, so the safe order is:
ship the code switched off, publish the knowledge base, look at it yourself,
then switch it on.

---

## Step 1 — Google Cloud (about ten minutes, once)

**This is the only part somebody has to do by hand.** The rest is scripted.

The ₹28,693 credit lives on **aryanmarxx@gmail.com**, and the credit only pays
for Gemini through **Vertex AI** — an AI Studio key is billed separately and
would not touch it (see the note in memory).

```bash
gcloud auth login                    # sign in as aryanmarxx@gmail.com
gcloud projects list                 # note the PROJECT_ID for project number 36022121864
gcloud config set project <PROJECT_ID>
gcloud services enable aiplatform.googleapis.com
```

Then make a service account, because the server has no browser to log in with:

```bash
gcloud iam service-accounts create mdg-assist --display-name="MDG landing assistant"
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:mdg-assist@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
gcloud iam service-accounts keys create ~/mdg-assist-key.json \
  --iam-account=mdg-assist@<PROJECT_ID>.iam.gserviceaccount.com
```

`~/mdg-assist-key.json` is a password. Do not commit it, do not email it.

**Region matters and the choice is not free.** Measured 2026-08-22:

|                     | asia-south1 (Mumbai) | global        |
| ------------------- | -------------------- | ------------- |
| Answer a question   | 751 ms               | 1,177 ms      |
| Look up a guideline | **419 ms**           | **11,853 ms** |

Use `asia-south1`. And note `gemini-2.5-flash-lite` **does not exist there** — it
404s. Both models are set to `gemini-2.5-flash` for that reason; changing them
back would silently disable the safety classifier, because it is written never to
throw.

## Step 2 — Build and publish the knowledge base

```bash
cd ~/Documents/PP/mdg-rag-ingest
cp .env.example .env      # VERTEX_PROJECT_ID + the three S3 values from mdg-backend/.env
npm install
npm run doctor            # says exactly what is still missing, and exits non-zero
npm run all               # extract → chunk → embed → pack
npm run eval              # refuses to pass under 80% recall. READ THIS OUTPUT.
npm run publish           # uploads to s3://<bucket>/assist/kb/<KB_VERSION>/
```

`npm run eval` is the step that tells you whether the assistant will be any good.
It asks ~52 real questions in Hindi and English and reports which guideline
clause came back for each. If recall is poor, re-chunk smaller
(`npm run chunk -- --target=350`) and re-run from `embed`.

Roughly 100 chunks, ~32,000 tokens. Embedding the whole corpus costs a few
rupees, once.

## Step 3 — Server configuration

Over SSH (`ssh -i "~/Downloads/mdg aws.pem" ubuntu@35.154.6.55`), copy the key up
and add to `/home/ubuntu/mdg-backend/.env`:

```
ASSIST_ENABLED=false                 # leave OFF until step 5
ASSIST_ALLOWED_ORIGINS=https://mdgservices.in,http://localhost:5180
VERTEX_PROJECT_ID=<PROJECT_ID>
VERTEX_LOCATION=asia-south1
VERTEX_SA_KEY_FILE=/home/ubuntu/mdg-assist-key.json
ELEVENLABS_API_KEY=<the key from mdg-demo/.env>
ELEVENLABS_VOICE_ID=<the voice id from mdg-demo/.env>
ASSIST_KB_VERSION=<whatever publish printed>
ASSIST_DAILY_BUDGET_PAISE=200000     # ₹2,000/day
```

`CORS_ORIGINS` already lists `https://mdgservices.in`, so it needs no change.

One nginx line, because voice notes are up to 900 KB and the default cap is 1 MB
with no headroom:

```bash
sudo sed -i '/^http {/a \    client_max_body_size 4m;' /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

Then deploy and check:

```bash
ssh -i "~/Downloads/mdg aws.pem" ubuntu@35.154.6.55 \
  'export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; cd /home/ubuntu/mdg-backend && bash deploy.sh'
```

`npm ci` breaks whenever a dependency changes — this feature added none, so it
should be clean. If it complains about the lock file, run `npm install
--no-audit --no-fund` once on the box and deploy again.

## Step 4 — Prove it works before anyone sees it

```bash
cd /home/ubuntu/mdg-backend && npm run assist:probe
```

Prints a table: Vertex authentication, each model answering, ElevenLabs
answering, and whether the knowledge base loads. **Every row must be green
before step 5.** Anything red is named with what to fix.

## Step 5 — Switch it on

Set `ASSIST_ENABLED=true` and `pm2 restart mdg-backend --update-env`. No deploy
needed. Then deploy the two front ends:

```bash
cd mdg-landing && npm run build && vercel deploy --prebuilt --prod
cd ../mdg-admin && vercel --prod --yes --force
```

Confirm the served `/assets/index-*.js` filename actually changed — Vercel has
reused a cached build before and reported success.

**Turning it off is the same one line in reverse.** `ASSIST_ENABLED=false` plus a
restart takes it off the site immediately, without a deploy.

---

## Watching it

Everything is in the admin portal under **Assistant** (super-admins only):
conversations with full transcripts and recordings, leads, flagged visitors,
blocks, and daily spend against the budget.

**Watch the spend meter in the first week.** Speech is the whole bill: about
**2 paise a character**, so one 450-character spoken reply is roughly **₹8**,
against 17 paise for the same answer typed. The ₹2,000/day cap is about 240
spoken replies. When it trips, calls switch off and the widget offers a callback
— the site never goes silent.

The cost table in `mdg-backend/src/assist/cost.ts` is an estimate from list
prices. **Check it against a real ElevenLabs and Google invoice after the first
month** and correct it.

## When something is wrong

| Symptom                             | Where to look                                                                                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "We could not answer" on everything | Assistant → knowledge base card. If it says an error, S3 or `ASSIST_KB_VERSION` is wrong. Reload from that card.                                                                             |
| Answers are vague or wrong          | Open the conversation, read the Trace section: it shows which guideline passages were retrieved and their scores. Low scores mean the knowledge base needs re-chunking, not a prompt change. |
| Calls all say "lines are busy"      | Three at once is the cap. Check whether slots are stuck: restart clears them.                                                                                                                |
| Nothing works from the website      | Browser console will say CORS. Check `ASSIST_ALLOWED_ORIGINS`.                                                                                                                               |
| Spend looks wrong                   | Assistant → Usage. Compare against the real invoice before believing the estimate.                                                                                                           |

Tracing is deliberately heavy for launch and is meant to be switched off once
this is boring. The exact list of what to remove is in the memory note
`assist-heavy-tracing`.
