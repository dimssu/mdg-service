# Dealer Kavach - 10-minute manual smoke test

Goal: in ten minutes, prove that a fresh checkout boots and the happy-path flows work end-to-end. This is the test a human runs before cutting a release; the automated suites under `backend/test` and `backend/src/**/*.test.ts` cover the corners.

## Pre-requisites

- Node 20+ and Docker installed
- Repo checked out and `npm install` has run from the repo root
- `backend/.env` exists (copy from `backend/.env.example`)
- Default admin credentials: `admin@dealerkavach.local` / `Admin@12345`

## 0. Start dependencies (≤1 min)

1. From repo root: `docker compose up -d mongo`
2. Confirm container is healthy: `docker ps | grep mongo`

Expected: a running `mongo` container with the host port mapped.

## 1. Seed the database (≤1 min)

```
npm --workspace @dk/backend run seed -- --reset
```

Expected: log lines `Seeded admin`, plugin registrations for the five plugins, and `Seed complete` with exit code 0.

## 2. Start the backend (≤1 min)

```
npm --workspace @dk/backend run dev
```

Expected: `API listening` on port 4000, `scheduler started (every minute)`.

In a separate terminal, sanity-check health:

```
curl -s http://localhost:4000/health
```

Expected response: `{"ok":true,"data":{"status":"ok"}}`.

## 3. Log in (≤1 min)

Either open `docs/rest.http` in VS Code and run the "Login" request, or curl directly:

```
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@dealerkavach.local","password":"Admin@12345"}'
```

Expected: `ok:true` with a `data.token` string and `data.admin` profile (no `passwordHash`).

## 4. Inspect the overview dashboard (≤1 min)

Using the token from step 3:

```
curl -s http://localhost:4000/api/v1/overview \
  -H "authorization: Bearer $TOKEN"
```

Expected: `dealers.total ≥ 5`, `services.pluginCount ≥ 5`, `services.attached ≥ 1`, `runs.last24h ≥ 1`, `recentRuns` non-empty.

## 5. Create a dealer (stage 1) (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealers \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Smoke Test Petrol","ownerContact":{"name":"Smoke Owner","phone":"+91-9000000123","email":"smoke@example.com"},"pumpLocation":{"address":"Test Road","lat":12.97,"lng":77.59},"gst":"29ZZTEST0099Z1Z9","pan":"ZTEST0099Z"}'
```

Expected: 201, `data.status='PENDING_DETAILS'`. Capture `data.id` as `DEALER_ID`.

## 6. Complete stage 2 (≤1 min)

```
curl -s -X PATCH http://localhost:4000/api/v1/dealers/$DEALER_ID \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"bankDetails":{"accountHolder":"Smoke Test Petrol","accountNumber":"123456789012","ifsc":"HDFC0000123","bankName":"HDFC Bank"},"complianceDocs":[{"label":"GST","url":"https://example.com/gst.pdf"}],"slaTier":"SILVER"}'
```

Expected: 200, `data.status='ACTIVE'` (auto-promotion).

## 7. Attach a service (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealers/$DEALER_ID/services \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"serviceId":"custom-request","config":{"requestType":"manual-audit","payload":{"ticketId":"T-SMOKE"}}}'
```

Expected: 201 with `cadence='ON_DEMAND'`, `schedule='@on-demand'`, `nextRunAt` null. Capture `data.id` as `DS_ID`.

## 8. Run now (≤1 min)

```
curl -s -X POST http://localhost:4000/api/v1/dealer-services/$DS_ID/run-now \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{}'
```

Expected: 202 with `data.runId`. Then `GET /api/v1/runs/$RUN_ID` should show `status='SUCCESS'` and a non-null `output`.

## 9. Verify in the run history (≤1 min)

```
curl -s "http://localhost:4000/api/v1/runs?dealerId=$DEALER_ID" \
  -H "authorization: Bearer $TOKEN"
```

Expected: `data.total ≥ 1`, with the run from step 8 at the top of `items`.

## 10. Cleanup (≤1 min)

```
curl -s -X DELETE http://localhost:4000/api/v1/dealers/$DEALER_ID \
  -H "authorization: Bearer $TOKEN"
```

Expected: 200. Then re-running `GET /dealers/$DEALER_ID` should return 404 and `GET /dealer-services` for the dealer should return zero rows (cascade deletion).

## Optional automated check

After completing the manual path above (or skipping straight to it on a freshly seeded server):

```
npx tsx scripts/verify-seed.ts
```

Expected: `[verify-seed] OK` and exit code 0.

## Sign-off checklist

- [ ] Mongo container is healthy
- [ ] Seed completes without errors and registers all five plugins
- [ ] Backend listens on port 4000 with a passing `/health`
- [ ] Login returns a JWT and admin profile (no password hash)
- [ ] Overview snapshot has the documented shape with non-negative counters
- [ ] Stage-1 dealer creation returns `PENDING_DETAILS`
- [ ] Stage-2 patch auto-promotes status to `ACTIVE`
- [ ] Service attachment computes `schedule` and `nextRunAt`
- [ ] `run-now` produces a `SUCCESS` `ServiceRun`
- [ ] Run history shows the new run at the top
- [ ] Dealer delete cascades to its `DealerService` rows
- [ ] `verify-seed.ts` exits 0
