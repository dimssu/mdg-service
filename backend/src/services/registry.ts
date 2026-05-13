import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  CADENCES,
  type ServicePlugin,
  type ServicePluginCatalogEntry,
  type ServiceRunContext,
  type ServiceRunResult,
} from '@dk/shared';
import { Ajv as AjvCtor, type ValidateFunction } from 'ajv';
import addFormatsImport from 'ajv-formats';
import { z } from 'zod';

type AjvInstance = InstanceType<typeof AjvCtor>;

import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

const pluginContractSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_][a-z0-9-_]{0,60}$/, 'plugin id must be a kebab/underscore slug'),
  name: z.string().min(1),
  description: z.string().min(1),
  cadence: z.enum(CADENCES),
  defaultConfigSchema: z.record(z.string(), z.unknown()),
  run: z
    .function()
    .args(z.unknown() as unknown as z.ZodType<ServiceRunContext>)
    .returns(z.unknown() as unknown as z.ZodType<Promise<ServiceRunResult>>),
});

// ESM/CJS interop: ajv-formats ships as CommonJS with default export.
const addFormats = ((addFormatsImport as unknown as { default?: typeof addFormatsImport })
  .default ?? addFormatsImport) as unknown as (ajv: AjvInstance) => void;

interface RegisteredPlugin {
  plugin: ServicePlugin;
  validateConfig: ValidateFunction;
}

class ServiceRegistry {
  private readonly plugins = new Map<string, RegisteredPlugin>();
  private readonly ajv: AjvInstance;

  constructor() {
    this.ajv = new AjvCtor({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  async load(servicesDir: string): Promise<void> {
    this.plugins.clear();
    let entries: string[];
    try {
      entries = await readdir(servicesDir);
    } catch (err) {
      logger.warn(
        { err: (err as Error).message, servicesDir },
        'Services directory missing; registry empty',
      );
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith('_') && entry !== '_example') continue;
      const folder = path.join(servicesDir, entry);
      let folderStat;
      try {
        folderStat = await stat(folder);
      } catch {
        continue;
      }
      if (!folderStat.isDirectory()) continue;
      const indexCandidates = ['index.ts', 'index.js', 'index.mjs'];
      let indexPath: string | undefined;
      for (const candidate of indexCandidates) {
        const tentative = path.join(folder, candidate);
        try {
          const s = await stat(tentative);
          if (s.isFile()) {
            indexPath = tentative;
            break;
          }
        } catch {
          /* try next */
        }
      }
      if (!indexPath) continue;
      try {
        const mod = (await import(pathToFileURL(indexPath).href)) as {
          default?: ServicePlugin;
        };
        const plugin = mod.default;
        if (!plugin) {
          logger.warn({ folder }, 'Plugin has no default export; skipping');
          continue;
        }
        const parsed = pluginContractSchema.safeParse(plugin);
        if (!parsed.success) {
          throw new Error(
            `Invalid plugin contract for "${entry}": ${JSON.stringify(parsed.error.issues)}`,
          );
        }
        if (plugin.id !== entry) {
          throw new Error(
            `Plugin id "${plugin.id}" does not match folder name "${entry}"`,
          );
        }
        const validateConfig = this.ajv.compile(plugin.defaultConfigSchema);
        this.plugins.set(plugin.id, { plugin, validateConfig });
        logger.info({ id: plugin.id }, 'Plugin registered');
      } catch (err) {
        logger.error(
          { err: (err as Error).message, folder },
          'Failed to load plugin',
        );
        throw err;
      }
    }
  }

  list(): ServicePluginCatalogEntry[] {
    return Array.from(this.plugins.values()).map(({ plugin }) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      cadence: plugin.cadence,
      defaultConfigSchema: plugin.defaultConfigSchema,
    }));
  }

  get(id: string): RegisteredPlugin | undefined {
    return this.plugins.get(id);
  }

  getOrThrow(id: string): RegisteredPlugin {
    const r = this.plugins.get(id);
    if (!r) throw AppError.pluginNotFound(id);
    return r;
  }

  size(): number {
    return this.plugins.size;
  }

  validateConfig(id: string, config: Record<string, unknown>): void {
    const reg = this.getOrThrow(id);
    const ok = reg.validateConfig(config);
    if (!ok) {
      throw AppError.pluginConfigInvalid(reg.validateConfig.errors ?? undefined);
    }
  }

  async runOne(
    plugin: ServicePlugin,
    ctx: ServiceRunContext,
  ): Promise<ServiceRunResult> {
    return plugin.run(ctx);
  }
}

export const registry = new ServiceRegistry();

/**
 * Initialise the registry by pointing it at the services directory that
 * lives next to this file. Resolved at runtime to work with both tsx (src)
 * and compiled dist layouts.
 */
export async function initRegistry(): Promise<void> {
  const servicesDir = path.dirname(fileURLToPath(import.meta.url));
  await registry.load(servicesDir);
  logger.info({ count: registry.size() }, 'Service registry initialised');
}
