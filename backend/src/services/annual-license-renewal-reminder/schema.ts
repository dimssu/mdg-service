import { z } from 'zod';

export const annualLicenseConfigZod = z.object({
  licenseNumber: z.string().min(1),
  daysBefore: z.number().int().min(1).max(365).default(30),
});

export type AnnualLicenseConfig = z.infer<typeof annualLicenseConfigZod>;

export const annualLicenseSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['licenseNumber'],
  additionalProperties: false,
  properties: {
    licenseNumber: {
      type: 'string',
      title: 'License number',
      description: 'Government-issued operating license number.',
      minLength: 1,
    },
    daysBefore: {
      type: 'integer',
      title: 'Days before expiry to remind',
      description: 'Reminder fires this many days before the annual expiry.',
      minimum: 1,
      maximum: 365,
      default: 30,
    },
  },
} as const;
