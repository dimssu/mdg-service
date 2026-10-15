# Adding a new service plugin

This walkthrough shows how to add a new recurring workflow ("service") to Dealer Kavach. The plugin is one new folder under `mdg-backend/src/services/`, with no central registry edit. That is all it takes to attach it to a dealer and run it. Showing what it collected to admins is extra work (Step 7).

Target time to a first run: under 30 minutes. A service that drives an IndianOil portal takes much longer; read "If your service drives an IndianOil portal" before you start.

## What a plugin is

A plugin is a folder named after its slug. It exports a default object satisfying the `ServicePlugin` contract from `@dk/shared` (`shared/src/types/plugin.ts`):

```ts
interface ServicePlugin {
  id: string; // matches the folder name
  name: string;
  description: string;
  cadence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ON_DEMAND';
  defaultCustomCron?: string; // optional; see "Schedules the enum cannot name"
  discoverScheduleOnAttach?: boolean; // optional; run once on attach to go and look
  defaultConfigSchema: object; // JSON Schema draft-07
  dependsOn?: string[]; // service ids that must be attached first
  run(ctx: ServiceRunContext): Promise<ServiceRunResult>;
}
```

### How the backend finds it

At boot, `mdg-backend/src/services/registry.ts` lists the folders next to it (`dist/services` in production) and loads each folder's `index.ts`:

- A folder whose name starts with `_` is skipped. So is a folder with no `index` file: most folders here are helpers for a plugin, not plugins.
- An `index` with no default export is skipped with a warning (`Plugin has no default export`).
- Otherwise the default export must pass the contract check, its `id` must equal the folder name (lower-case letters, digits, `-` and `_`, up to 61 characters), its `defaultCustomCron` must be a cron that can run, and its `defaultConfigSchema` must compile. Any failure throws, and **the backend does not start**.

Nothing else needs editing. The registry is read once at boot, so a new plugin needs a restart or a deploy.

### Schedules the enum cannot name

`Cadence` covers daily/weekly/monthly/yearly. If your service needs something the enum has no word for — twelve times a day, only in market hours, only on the outlet's own timetable — do **not** add a member to the enum. Three optional hooks cover it, and they are meant to be used together:

- **`ServicePlugin.defaultCustomCron`** — a cron expression (read in **IST**) applied at attach time when the admin does not supply one. It is validated at registry load, so an unrunnable expression fails the boot rather than silently producing attachments that never run. This is your **floor**: it stays correct even when the plugin crashes.
- **`ServiceRunResult.nextRunAt`** — returned by `run()` to steer the _next_ cycle only. Honoured on **scheduled runs that completed** and on the one-off attach run below; ignored for a manual "Run now" (which is not a cadence event) and for failures (which fall through to the normal transient-retry logic). The runner bounds it: a past moment is nudged to `now + 1 min`, and one more than 7 days ahead is discarded in favour of the cron.
- **`ServicePlugin.discoverScheduleOnAttach`** — fires one run the moment the service is attached, purely so the plugin can go and look before the first cron interval elapses. It arrives as a normal `ServiceRun` with `trigger: 'attach'` (visible, auditable, diagnosable) and is dispatched after the HTTP response, so the admin never waits on it. A plugin that sets this **must** make `ctx.trigger === 'attach'` side-effect-free — the run is there to read, not to act. If it fails, the cron floor stays.

`ServiceRunContext.trigger` tells the plugin which of these it is in.

Use `nextRunAt` when the right time is only knowable after doing the work — `water-ingress-testing` reads the outlet's slot grid off the portal and aims at the middle of the next window it lists. Always pair it with a `defaultCustomCron` floor; never rely on it alone.

### Cadence in practice

- `ON_DEMAND` stops the timer but keeps the service `ACTIVE`, so "Run now" still works. `PAUSED` stops the service altogether. Do not pause a service another one reads from: the DSR looks up the IRAS attachment by `status: 'ACTIVE'` and ignores its cadence.
- **A leftover `customCron` outranks the cadence.** A row set to `ON_DEMAND` that still carries a cron keeps firing on it.
- To change a cadence for every dealer at once, build, then run `npm run set:cadence -- --service <id> --cadence <C> [--cron "0 6 * * *"]` from `mdg-backend`. It is dry by default; `--commit` writes. It runs the compiled file, and a move to `ON_DEMAND` always clears the cron. Your laptop `.env` may name the production database, so `--commit` there is live.
- A plain `DAILY` with no cron is a rolling 24 hours from when the row was last touched, not a clock time. Pin a time with a cron when "ready before the office opens" matters.

## Step 1 - Create the folder

Pick a kebab-case slug. We will use `sla-report` as the example.

```
mdg-backend/src/services/sla-report/
├── index.ts        plugin definition + run()
├── schema.ts       JSON Schema for config
└── index.test.ts   tests, beside the code
```

## Step 2 - Write `schema.ts`

This is what RJSF renders as the config form in the admin. Use draft-07 JSON Schema. The config is checked against it with Ajv (non-strict) on attach and on edit.

```ts
// mdg-backend/src/services/sla-report/schema.ts
export const slaReportSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['reportEmail', 'includeIncidents'],
  properties: {
    reportEmail: {
      type: 'string',
      format: 'email',
      title: 'Send report to',
    },
    includeIncidents: {
      type: 'boolean',
      title: 'Include incident summary',
      default: true,
    },
    lookbackDays: {
      type: 'integer',
      title: 'Lookback window (days)',
      minimum: 1,
      maximum: 90,
      default: 7,
    },
  },
  additionalProperties: false,
} as const;
```

Tips:

- Add `title` to every property - it becomes the form label.
- Add `description` for helper text under the field.
- Use `enum` + `enumNames` for dropdowns.
- Use `additionalProperties: false` so typos in the config object are caught.

## Step 3 - Write `index.ts`

```ts
// mdg-backend/src/services/sla-report/index.ts
import type { ServicePlugin } from '@dk/shared';

import { slaReportSchema } from './schema.js';

const plugin: ServicePlugin = {
  id: 'sla-report',
  name: 'SLA Report',
  description: 'Emails a weekly SLA summary to the dealer.',
  cadence: 'WEEKLY',
  defaultConfigSchema: slaReportSchema,

  async run(ctx) {
    const started = Date.now();
    const {
      reportEmail,
      includeIncidents,
      lookbackDays = 7,
    } = ctx.config as {
      reportEmail: string;
      includeIncidents: boolean;
      lookbackDays?: number;
    };

    ctx.logger.info('Generating SLA report', {
      dealerId: ctx.dealerId,
      lookbackDays,
    });

    // ... do the work. Make network/db calls as needed.
    const summary = {
      reportEmail,
      includeIncidents,
      lookbackDays,
      generatedAt: ctx.now.toISOString(),
    };

    return {
      output: summary,
      durationMs: Date.now() - started,
    };
  },
};

export default plugin;
```

Imports inside the backend end in `.js` (it builds as ESM), even though the file is `.ts`.

Rules for the `run` function:

- Inputs: `ctx`. Outputs: `{ output, durationMs }` (plus an optional `nextRunAt`).
- Throw to fail the run. The runner catches, records `status='FAILED'`, and stores `error.message + error.stack`. Do not return a partial result.
- To say _why_ it failed and whether trying again could help, throw `new RunFailure(code, phase, message, transient, retryBy?)` from `lib/runs/RunFailure.ts`. A transient failure on a scheduled run is re-armed 20-40 minutes out, up to twice; a permanent one waits for its normal slot. Never mark a refused login or a wrong password transient: retrying walks a dealer's account toward a lockout.
- Keep `output` JSON-serialisable - it is persisted on the `ServiceRun` record.
- **There is no generic plugin timeout.** A plugin that waits on anything slow sets its own deadline. Portal runs use `runWithDeadline` (`lib/runs/withDeadline.ts`) against `IRAS_RUN_TIMEOUT_MS` (300 s) or `SDMS_RUN_TIMEOUT_MS` (420 s). The scheduler's lease on a due service is `2 x SDMS_RUN_TIMEOUT_MS + 15 min` (29 minutes by default); a run still going past it is treated as dead and its `RUNNING` row is closed out.
- Long work should call `await ctx.recordStep({ name, status: 'start' | 'ok' | 'error', ... })` as it goes, so admins see live progress in the run detail. It is one cheap write and it tolerates errors.
- To keep a file, put it in storage yourself, then record it: `getStorage().put(key, buffer, { contentType, size })` (from `lib/storage/index.js`), then `await ctx.recordArtifact({ filename, storageKey: key, size, contentType, kind })`. The usual key is `dealers/<dealerId>/runs/<runId>/<filename>`. **Always pass `kind`.** `'output'` is a deliverable that any admin may download. `'diagnostic'` is evidence of how the run went (failure screenshots, DOM dumps, raw portal responses) and is super-admin only. Leave it out and the API guesses from the filename.
- Never read other dealers' data. The `ctx` is scoped to one dealer.

## Step 4 - Restart the backend

```
cd mdg-backend && SCHEDULER_ENABLED=false npm run dev
```

**Set `SCHEDULER_ENABLED=false` on a laptop.** A laptop `.env` usually names the production database, and with the scheduler on, `npm run dev` starts firing every service's real runs against live dealers, yours included. With it off the process still serves every route.

The boot log (pino JSON) should show one line per plugin, including yours:

```
"msg":"Plugin registered","id":"sla-report"
"msg":"Service registry initialised","count":10
```

If the contract check fails, the folder name differs from the `id`, the `defaultCustomCron` cannot run or the schema does not compile, the log prints `Failed to load plugin` with the reason and the backend does not start. Fix and restart.

In development, `tsx watch` picks up changes to the plugin file and restarts the process; no extra wiring is needed.

`npm run check:plugins` (in `mdg-backend`) boots only the registry, with no database, and checks a hand-kept `EXPECTED` list in `scripts/check-plugins.ts`. Add your id there. The list has drifted before, and `load-planner` is not on it today.

## Step 5 - Verify it appears in the catalog

The catalog needs an admin token. Log in with `POST /api/v1/auth/login` (see `docs/rest.http`) and send the `token` from the response:

```
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/v1/services
```

Response:

```json
{
  "ok": true,
  "data": [
    {
      "id": "sla-report",
      "name": "SLA Report",
      "description": "Emails a weekly SLA summary to the dealer.",
      "cadence": "WEEKLY",
      "defaultConfigSchema": { ... }
    }
  ]
}
```

`defaultCustomCron`, `discoverScheduleOnAttach` and `dependsOn` appear too when the plugin sets them.

## Step 6 - Attach from the admin

1. Log in to the admin portal.
2. Open a dealer. An archived dealer cannot take a new service.
3. Click **Attach service**. The new plugin appears in the list. If it has `dependsOn`, every prerequisite must already be attached to this dealer; the attach is refused with a plain message naming the missing one.
4. Choose it. RJSF renders the config form from `defaultConfigSchema`. Fill it in and submit.
5. The dealer page now lists "SLA Report" with `status=ACTIVE` and a `nextRunAt`. Click **Run now** to trigger immediately and watch the dealer's **Run history** tab.

## Step 7 - Show the results to admins (extra work)

Attach, config and run history work from the schema alone: the admin renders the config form with RJSF (`mdg-admin/src/pages/dealers/ServiceConfigFields.tsx`, `rjsfTheme.tsx`) and lists runs, steps and artifacts generically. But most of the real services have also needed their own view of what they collected, such as `DealerCreditDodTab.tsx`, `DealerDsrTab.tsx` and the Data Vault tabs in the same folder. Plan for that work, and ask first if you are tempted to put plugin-specific code anywhere else in the admin.

If it needs a new type in `@dk/shared`, remember there are four copies of it to keep identical (ADR 0021).

## Tests

Put tests beside the code as `*.test.ts`, as the existing services do (for example `services/water-ingress-testing/retryBy.test.ts`). `npm test` in `mdg-backend` runs them under Jest with an in-memory Mongo. `mdg-backend/test/integration/` holds the ones that boot the app and call routes. To test `run()` on its own, call `plugin.run(ctx)` with a hand-built context (see `services/custom-request/run.test.ts`; add stub `recordStep` and `recordArtifact` functions if your plugin calls them). There is no `runPluginById` helper.

## If your service drives an IndianOil portal

Most of the real services do (`custom-request` and `load-planner` do not). The failure modes are unusual and mostly silent; read `LIMITATIONS.md` "Portal scraping (SDMS / IRAS)" before you write a line. The rules that decide the design:

- **One Chromium at a time.** Take a slot before you start a browser: `withBrowserSlot` for work that begins and ends inside one function, or `sdmsBrowserSemaphore.acquire()` for a capture (both in `automation/browserBudget.ts` and `automation/sdms/sharedGate.ts`, one counter). Start the browser with `launchChromium`, not `chromium.launch`. `BROWSER_MAX_CONCURRENCY` (default 1) caps SDMS captures, IRAS collections and report-card renders together, so expect to queue.
- **SDMS logins queue on the account gate.** Use `sdmsAccountGate` and `sdmsBrowserSemaphore` from `automation/sdms/sharedGate.ts`. The gate is keyed on the portal _username_, because several dealer records share one IndianOil login. Never build a gate of your own: two gates cannot see each other.
- **Every login is a real credential submission.** Do not wrap a submitted login in your own retry; the only retry that is safe is the one before anything is submitted (`automation/openLoginPage.ts`).
- **A refused password holds the outlet.** Read the SDMS ID and password with `sdmsCredentialsFromDealer` (`automation/sdms/credentials.ts`). If your service signs in to SDMS, add its id to `SDMS_FAMILY_SERVICE_IDS` in `automation/sdms/credentialHold.ts`; a test fails when a service calls `sdmsCredentialsFromDealer(` and is not on that list. The scheduler then starts no run for an outlet whose password is refused or missing, and a manual run fails at once as `SDMS_PASSWORD_REFUSED`.
- **Run under a deadline** (`runWithDeadline`), throw typed failures (`RunFailure`), and save raw captures as `diagnostic` artifacts.
- **Test against the mock portal** in `automation/sdms/__testing__/mockPortal.ts`, which serves both generations of the SDMS login page. A green suite built on only one shape hid the August redesign for 33 hours.

## Existing plugins to copy from

| Plugin                  | Default cadence                | Read it for                                                                                                                                  |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `custom-request`        | `ON_DEMAND`                    | The smallest plugin: no portal, no schedule.                                                                                                 |
| `water-ingress-testing` | `DAILY`, cron `0 1-23/2 * * *` | Self-scheduling: `defaultCustomCron`, `discoverScheduleOnAttach`, `nextRunAt`, a side-effect-free attach run.                                |
| `tt-density`            | `DAILY`, cron `35 7 * * *`     | A full portal service that keeps files as artifacts. Has its own README.                                                                     |
| `credit-dod-monitoring` | `DAILY`                        | SDMS login with the captcha, a ledger parse and a rendered report card.                                                                      |
| `inspection-reports`    | `WEEKLY`                       | A small SDMS capture: the total plus the latest few reports.                                                                                 |
| `iras-shift-data`       | `DAILY`                        | The other portal (IRAS), with its own saved login.                                                                                           |
| `ro-supply-status`      | `ON_DEMAND`                    | `dependsOn: ['water-ingress-testing']`, and a read that rides that service's login.                                                          |
| `dsr-report`            | `DAILY`                        | `dependsOn` two services. It builds from what they stored, and runs an IRAS collection inline (a nested `executeRun`) when a day is missing. |
| `load-planner`          | `DAILY`, cron `45 9 * * *`     | `dependsOn: ['dsr-report']`; plans from stored figures, no portal.                                                                           |

## Common gotchas

- **Folder name must equal `plugin.id`.** The loader enforces this.
- **`additionalProperties: false`** in your schema saves you from typoed config keys.
- **Throwing inside `run`** is the correct way to fail. Do not return a partial result.
- **Avoid module-level side effects.** Plugins are imported at boot; long IO at import time slows the boot, and a throw stops it.
- **A leftover `customCron` beats the cadence.** If you change a service to `ON_DEMAND` by hand, clear the cron too, or use `set:cadence`.
