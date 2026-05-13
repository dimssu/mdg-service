import { z } from 'zod';

export const customRequestConfigZod = z.object({
  requestType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type CustomRequestConfig = z.infer<typeof customRequestConfigZod>;

export const customRequestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['requestType'],
  additionalProperties: false,
  properties: {
    requestType: {
      type: 'string',
      title: 'Request type',
      description: 'Free-form label categorising the on-demand request.',
      minLength: 1,
    },
    payload: {
      type: 'object',
      title: 'Payload',
      description: 'Arbitrary JSON object passed through the run unchanged.',
      additionalProperties: true,
      default: {},
    },
  },
} as const;
