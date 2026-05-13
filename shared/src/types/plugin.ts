import type { Cadence } from './enums';

/**
 * The runtime context handed to a plugin's `run` function.
 * Plugins receive a scoped logger and the validated config; they should
 * never reach into framework globals.
 */
export interface ServiceRunContext {
  dealerId: string;
  dealerServiceId: string;
  config: Record<string, unknown>;
  now: Date;
  logger: {
    info: (...a: unknown[]) => void;
    warn: (...a: unknown[]) => void;
    error: (...a: unknown[]) => void;
  };
}

export interface ServiceRunResult {
  /** Arbitrary JSON output persisted with the ServiceRun record. */
  output: unknown;
  /** Wall-clock duration in ms; the runner will compute one if omitted. */
  durationMs: number;
}

/**
 * Contract every plugin must satisfy. Discovered by globbing
 * `backend/src/services/*\/index.ts` at boot; no central registry edits.
 */
export interface ServicePlugin {
  /** Stable slug, kebab-case. Used as the folder name and serviceId. */
  id: string;
  /** Human-readable name shown in the catalog. */
  name: string;
  description: string;
  /** Default cadence; admins may override per-attachment. */
  cadence: Cadence;
  /** JSON Schema (draft-07) used to validate config and drive RJSF. */
  defaultConfigSchema: Record<string, unknown>;
  run(ctx: ServiceRunContext): Promise<ServiceRunResult>;
}

/** Read-only projection sent to the frontend in the catalog endpoint. */
export interface ServicePluginCatalogEntry {
  id: string;
  name: string;
  description: string;
  cadence: Cadence;
  defaultConfigSchema: Record<string, unknown>;
}
