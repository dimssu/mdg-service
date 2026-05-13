import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

interface MongooseDupKeyError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.issues,
      },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }
  const mongoDup = err as MongooseDupKeyError;
  if (mongoDup && mongoDup.code === 11000) {
    res.status(409).json({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: 'Duplicate key',
        details: mongoDup.keyValue,
      },
    });
    return;
  }
  logger.error({ err: (err as Error).message, stack: (err as Error).stack }, 'Unhandled error');
  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL',
      message: 'Internal server error',
    },
  });
};

export const notFoundHandler: ErrorRequestHandler = (_err, _req, res, _next) => {
  res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
};
