import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_LOGIN_PER_MIN,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Try again later.',
      },
    });
  },
});
