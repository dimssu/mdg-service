import { z } from 'zod';

export const weeklyComplianceConfigZod = z.object({
  region: z.string().min(1),
  includeDocs: z.boolean().default(false),
});

export type WeeklyComplianceConfig = z.infer<typeof weeklyComplianceConfigZod>;

export const weeklyComplianceSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['region'],
  additionalProperties: false,
  properties: {
    region: {
      type: 'string',
      title: 'Region',
      description: 'Compliance jurisdiction to evaluate (e.g. KA, MH, EU-DE).',
      minLength: 1,
    },
    includeDocs: {
      type: 'boolean',
      title: 'Include document audit',
      description: 'When true the report counts attached compliance docs.',
      default: false,
    },
  },
} as const;
