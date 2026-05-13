import pino from 'pino';

import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'dk-backend' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'password',
      'passwordHash',
    ],
    censor: '[redacted]',
  },
});

export type Logger = typeof logger;
