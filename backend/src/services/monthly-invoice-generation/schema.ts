import { z } from 'zod';

export const monthlyInvoiceConfigZod = z.object({
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, 'currency must be a 3-letter ISO code')
    .default('INR'),
  taxPercent: z.number().min(0).max(100).default(18),
});

export type MonthlyInvoiceConfig = z.infer<typeof monthlyInvoiceConfigZod>;

export const monthlyInvoiceSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: false,
  properties: {
    currency: {
      type: 'string',
      title: 'Currency',
      description: '3-letter ISO 4217 currency code.',
      pattern: '^[A-Z]{3}$',
      default: 'INR',
    },
    taxPercent: {
      type: 'number',
      title: 'Tax %',
      description: 'Tax percentage applied to the generated subtotal.',
      minimum: 0,
      maximum: 100,
      default: 18,
    },
  },
} as const;
