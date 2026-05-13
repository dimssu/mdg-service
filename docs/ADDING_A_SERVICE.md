# Adding a new service plugin

This walkthrough shows how to add a new recurring workflow ("service") to Dealer Kavach. The entire change is contained to one new folder under `backend/src/services/`. No central registry edits, no frontend changes.

Target time end to end: under 30 minutes.

## What a plugin is

A plugin is a folder named after its slug. It exports a default object satisfying the `ServicePlugin` contract from `@dk/shared`:

```ts
interface ServicePlugin {
  id: string;                                   // matches the folder name
  name: string;
  description: string;
  cadence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ON_DEMAND';
  defaultConfigSchema: object;                  // JSON Schema draft-07
  run(ctx: ServiceRunContext): Promise<ServiceRunResult>;
}
```

The backend auto-discovers plugins by globbing `backend/src/services/*/index.ts` at boot.

## Step 1 - Create the folder

Pick a kebab-case slug. We will use `sla-report` as the example.

```
backend/src/services/sla-report/
├── index.ts        plugin definition + run()
└── schema.ts       JSON Schema for config
```

## Step 2 - Write `schema.ts`

This is what RJSF will render as the config form on the frontend. Use draft-07 JSON Schema.

```ts
// backend/src/services/sla-report/schema.ts
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
// backend/src/services/sla-report/index.ts
import type { ServicePlugin } from '@dk/shared';

import { slaReportSchema } from './schema';

const plugin: ServicePlugin = {
  id: 'sla-report',
  name: 'SLA Report',
  description: 'Emails a weekly SLA summary to the dealer.',
  cadence: 'WEEKLY',
  defaultConfigSchema: slaReportSchema,

  async run(ctx) {
    const started = Date.now();
    const { reportEmail, includeIncidents, lookbackDays = 7 } = ctx.config as {
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

Rules for the `run` function:

- Pure-ish. Inputs: `ctx`. Outputs: `{ output, durationMs }`.
- Throw to fail the run. The runner catches, records `status='FAILED'`, and stores `error.message + error.stack`.
- Keep `output` JSON-serialisable - it is persisted on the `ServiceRun` record.
- Respect the timeout (default 60s; configurable via env). Long work should be chunked.
- Never read other dealers' data. The `ctx` is scoped to one dealer.

## Step 4 - Restart the backend

```
npm run dev
```

Boot logs should show the plugin being registered:

```
[plugin] loaded sla-report (SLA Report, cadence=WEEKLY)
```

If validation of the default export fails, the boot log prints the failing field and the process exits with code 1. Fix and restart.

In development, `tsx --watch` will pick up changes to the plugin file and restart the process; no extra wiring is needed.

## Step 5 - Verify it appears in the catalog

```
curl http://localhost:4000/api/v1/services
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

## Step 6 - Attach from the frontend

1. Log in to the admin portal.
2. Open a dealer with status `ACTIVE`.
3. Click **Attach service**. The new plugin will appear in the list.
4. Choose it. RJSF renders the config form from `defaultConfigSchema`. Fill it in and submit.
5. The dealer page now lists "SLA Report" with `status=ACTIVE` and a `nextRunAt`. Click **Run now** to trigger immediately and watch the `Runs` page.

## Optional: integration test

Drop a quick test in `backend/test/services/sla-report.spec.ts`. The runner exposes a `runPluginById(id, ctx)` helper used by the QA agent.

## Common gotchas

- **Folder name must equal `plugin.id`.** The loader enforces this.
- **`additionalProperties: false`** in your schema saves you from typoed config keys.
- **Throwing inside `run`** is the correct way to fail. Do not return a partial result.
- **Avoid module-level side effects.** Plugins are imported at boot; long IO at import time will slow the boot loop.
- **No frontend changes are needed.** If you find yourself adding to `frontend/`, ask first - the plugin contract should be enough.
