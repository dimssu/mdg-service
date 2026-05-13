# ADR 0002 - Service plugin contract

Status: Accepted
Date: 2026-05-13

## Context

The portal exists to orchestrate recurring workflows for dealers. The list of workflows is open-ended (SLA report, compliance check, billing run, statement generation, ...). We want a new workflow to be addable by dropping a folder, with **zero frontend changes**.

Constraints:

- Plugins must be discoverable without editing a registry list.
- Plugin config must be entered through a UI we did not write per-plugin.
- The contract must be type-checked at compile time and validated at runtime.
- Plugins are first-party code; we do not need sandboxing.

## Decision

Each plugin lives at `backend/src/services/<slug>/` and the folder's `index.ts` default-exports an object satisfying:

```ts
interface ServicePlugin {
  id: string;                                   // matches folder name
  name: string;
  description: string;
  cadence: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ON_DEMAND';
  defaultConfigSchema: object;                  // JSON Schema draft-07
  run(ctx: ServiceRunContext): Promise<ServiceRunResult>;
}
```

Discovery: at boot, `plugin/loader.ts` globs `backend/src/services/*/index.ts`, validates each default export, and registers it. No central registry edits.

Frontend: `GET /api/v1/services` returns the catalog including `defaultConfigSchema`. The attach-service modal renders the form with `@rjsf/core` driven by that schema. The frontend never imports plugin-specific code.

Validation: on attach, the backend uses Ajv to validate the submitted config against the plugin's `defaultConfigSchema`. On run, the same validator is re-run to guard against schema drift.

## Consequences

- **Pro:** Adding a workflow is a 30-minute task end to end (see `docs/ADDING_A_SERVICE.md`).
- **Pro:** The frontend stays plugin-agnostic forever.
- **Pro:** JSON Schema is portable - schemas can later drive non-React clients (CLI, mobile).
- **Con:** RJSF rendering quality is bounded by what JSON Schema can express. For very rich custom inputs, a plugin would need to extend the contract (out of scope for MVP).
- **Con:** Plugins share the Node process. A misbehaving plugin can block the event loop. We accept this for MVP because plugins are first-party; the per-run timeout in the scheduler limits the blast radius.
- **Con:** `defaultConfigSchema` is the contract surface. Changing it after dealers have attached the service requires a migration. Plugins should treat the schema as semver-able and avoid breaking edits.
