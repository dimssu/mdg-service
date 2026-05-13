import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDb(uri: string = env.MONGODB_URI): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      logger.info({ attempt, uri: redactUri(uri) }, 'Connecting to MongoDB');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      lastErr = err;
      logger.warn(
        { attempt, err: (err as Error).message },
        'MongoDB connection failed',
      );
      if (attempt < MAX_ATTEMPTS) {
        const backoffMs = 1000 * attempt;
        await sleep(backoffMs);
      }
    }
  }
  logger.error({ err: (lastErr as Error)?.message }, 'MongoDB connection exhausted');
  throw lastErr instanceof Error
    ? lastErr
    : new Error('Failed to connect to MongoDB');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

function redactUri(uri: string): string {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:[redacted]@');
}
