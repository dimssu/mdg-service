# ADR 0002 - Service plugin contract

Status: Accepted. Paths and the contract updated 2026-10-15 (see "Update" at the end).
Date: 2026-05-13

## Context

The portal exists to orchestrate recurring workflows for dealers. The list of workflows is open-ended (SLA report, compliance check, billing run, statement generation, ...). We want a new workflow to be addable by dropping a folder, with **zero frontend changes**.

Constraints:

- Plugins must be discoverable without editing a registry list.
- Plugin config must be entered through a UI we did not write per-plugin.
- The contract must be type-checked at compile time and validated at runtime.
- Plugins are first-party code; we do not need sandboxing.

## Decision

Each plugin lives at `mdg-backend/src/services/<slug>/` (written `backend/` when the repo was one) and the folder's `index.ts` default-exports an object satisfying:

```ts
interface ServicePlugin {
  id: string; // matches folder name
  name: string;
  description: string;
  cadence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ON_DEMAND';
  defaultConfigSchema: object; // JSON Schema draft-07
  run(ctx: ServiceRunContext): Promise<ServiceRunResult>;
}
```

Discovery: at boot, the registry (`services/registry.ts`; this record first called it `plugin/loader.ts`, a file that never existed) reads `services/*/index.ts`, validates each default export, and registers it. No central registry edits.

Frontend: `GET /api/v1/services` returns the catalog including `defaultConfigSchema`. The attach-service modal renders the form with `@rjsf/core` driven by that schema. The frontend never imports plugin-specific code.

Validation: on attach, the backend uses Ajv to validate the submitted config against the plugin's `defaultConfigSchema`. On run, the same validator is re-run to guard against schema drift.

## Consequences

- **Pro:** Adding a workflow is a 30-minute task end to end (see `docs/ADDING_A_SERVICE.md`).
- **Pro:** The frontend stays plugin-agnostic forever.
- **Pro:** JSON Schema is portable - schemas can later drive non-React clients (CLI, mobile).
- **Con:** RJSF rendering quality is bounded by what JSON Schema can express. For very rich custom inputs, a plugin would need to extend the contract (out of scope for MVP).
- **Con:** Plugins share the Node process. A misbehaving plugin can block the event loop. We accept this for MVP because plugins are first-party; the per-run timeout in the scheduler limits the blast radius.
- **Con:** `defaultConfigSchema` is the contract surface. Changing it after dealers have attached the service requires a migration. Plugins should treat the schema as semver-able and avoid breaking edits.

## Update — 2026-10-15

The decision holds: nine services follow it. What changed since it was written:

- **Where it lives.** Plugins are `mdg-backend/src/services/<slug>/index.ts`; discovery is
  `mdg-backend/src/services/registry.ts`. It skips names that start with `_`, folders with no
  `index` file, and an `index` with no default export (that one with a warning). It stops the boot if
  an export breaks the contract (checked with zod), its `id` is not its folder name, its config schema
  will not compile, or its `defaultCustomCron` cannot run. Helper code sits in sibling folders. Most have no
  `index` (`waterIngress/` beside `water-ingress-testing/`). Four (`adminAlerts/`, `festival/`,
  `tickets/`, `websiteIntake/`) have an `index.ts` with no default export, so the registry logs a warning
  for each at every boot and moves on.
- **Three optional fields were added** to the interface (`shared/src/types/plugin.ts`):
  - `defaultCustomCron`: the schedule the service really needs, applied at attach time when the admin
    gives none. `cadence` alone cannot say "every two hours". Water ingress uses `0 1-23/2 * * *`, TT
    density `35 7 * * *`, the load planner `45 9 * * *`. The admin's own cron still wins.
  - `discoverScheduleOnAttach`: fires one side-effect-free run on attach so the service can learn the
    real timetable. Water ingress sets it.
  - `dependsOn`: ids that must already be attached to the dealer. The attach route refuses a new
    attach without them. The DSR report needs `inspection-reports` and `iras-shift-data`; the load
    planner needs `dsr-report`; RO supply status needs `water-ingress-testing`.
- **The nine plugins today:** `credit-dod-monitoring`, `custom-request`, `dsr-report`,
  `inspection-reports`, `iras-shift-data`, `load-planner`, `ro-supply-status`, `tt-density`,
  `water-ingress-testing`.
- **"Zero frontend changes" did not last.** Only the settings form is generic (RJSF, in
  `mdg-admin/src/pages/dealers/ServiceConfigFields.tsx`). What a service produces has its own
  screens: the DSR vault, the Data Vault and Ledger Watch are examples. So the Pro "the frontend
  stays plugin-agnostic forever" no longer holds for results, only for settings.
