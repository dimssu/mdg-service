import type { ServicePlugin } from '@dk/shared';

/**
 * PLACEHOLDER PLUGIN.
 *
 * This exists only so the auto-discovery registry has something to load
 * during MVP wiring. The Service Workflow Engineer will replace this with
 * real plugins. Folder name (_example) intentionally starts with an
 * underscore to mark it as non-production; the registry treats it as a
 * special case during MVP.
 */
const examplePlugin: ServicePlugin = {
  id: '_example',
  name: 'Example placeholder',
  description:
    'Placeholder plugin used to validate plugin auto-discovery wiring. Safe to remove once real plugins land.',
  cadence: 'ON_DEMAND',
  defaultConfigSchema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    additionalProperties: false,
    properties: {
      note: {
        type: 'string',
        description: 'Optional free-text note included in the run output.',
      },
    },
  },
  async run(ctx) {
    const startedAt = Date.now();
    ctx.logger.info('example plugin run', {
      dealerId: ctx.dealerId,
      dealerServiceId: ctx.dealerServiceId,
    });
    return {
      output: {
        message: 'Example plugin executed successfully',
        echoedConfig: ctx.config,
        ranAt: ctx.now.toISOString(),
      },
      durationMs: Date.now() - startedAt,
    };
  },
};

export default examplePlugin;
