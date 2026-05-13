import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { requestLog } from './middleware/requestLog.js';
import { v1Router } from './routes/v1/index.js';

export function createApp(): Express {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGINS_LIST.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLog);

  app.get('/health', (_req, res) => {
    res.json({ ok: true, data: { status: 'ok' } });
  });

  app.use('/api/v1', v1Router);

  app.use((_req, res) => {
    res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use(errorHandler);
  return app;
}
