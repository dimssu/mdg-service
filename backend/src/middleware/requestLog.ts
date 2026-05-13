import type { IncomingMessage, ServerResponse } from 'node:http';

import { pinoHttp } from 'pino-http';

import { logger } from '../config/logger.js';

export const requestLog = pinoHttp({
  logger,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
    ],
    censor: '[redacted]',
  },
  customLogLevel: (
    _req: IncomingMessage,
    res: ServerResponse,
    err?: Error,
  ): 'info' | 'warn' | 'error' => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
