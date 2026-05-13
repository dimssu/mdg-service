import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb } from './db/connect.js';
import { startScheduler } from './scheduler/index.js';
import { initRegistry } from './services/registry.js';

async function bootstrap(): Promise<void> {
  await connectDb();
  await initRegistry();
  const app = createApp();
  startScheduler();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
  });
}

bootstrap().catch((err) => {
  logger.error({ err: (err as Error).message }, 'Failed to bootstrap');
  process.exit(1);
});
