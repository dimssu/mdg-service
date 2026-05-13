import { z } from 'zod';

/**
 * Runtime Zod twin used inside the plugin to coerce/validate config when
 * the registry hands it over as a plain Record<string, unknown>. The
 * JSON Schema below is what RJSF renders and what Ajv enforces at the
 * registry layer; the two must stay in lockstep.
 */
export const dailyStockCheckConfigZod = z.object({
  warehouseId: z.string().min(1).max(64),
  threshold: z.number().min(0).default(100),
});

export type DailyStockCheckConfig = z.infer<typeof dailyStockCheckConfigZod>;

export const dailyStockCheckSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['warehouseId'],
  additionalProperties: false,
  properties: {
    warehouseId: {
      type: 'string',
      title: 'Warehouse ID',
      description: 'Identifier of the warehouse to pull stock for.',
      minLength: 1,
      maxLength: 64,
    },
    threshold: {
      type: 'number',
      title: 'Low-stock threshold',
      description: 'SKUs with quantity below this are flagged as low stock.',
      minimum: 0,
      default: 100,
    },
  },
} as const;
