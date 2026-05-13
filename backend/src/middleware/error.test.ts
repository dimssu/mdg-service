import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../utils/AppError.js';

import { errorHandler, notFoundHandler } from './error.js';

function mockRes(): {
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json } as unknown as { status: jest.Mock; json: jest.Mock };
}
const noopNext: NextFunction = () => {};

describe('errorHandler', () => {
  it('serialises ZodError as 400 VALIDATION_ERROR', () => {
    const issue = new ZodError([
      {
        code: 'custom',
        path: ['email'],
        message: 'bad',
      },
    ]);
    const res = mockRes();
    errorHandler(issue, {} as Request, res as unknown as Response, noopNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect((res.json.mock.calls[0] as unknown[])[0]).toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('serialises AppError with its status + code', () => {
    const err = AppError.notFound('nope');
    const res = mockRes();
    errorHandler(err, {} as Request, res as unknown as Response, noopNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect((res.json.mock.calls[0] as unknown[])[0]).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'nope' },
    });
  });

  it('includes optional details when AppError carries them', () => {
    const err = AppError.pluginConfigInvalid([{ message: 'oops' }]);
    const res = mockRes();
    errorHandler(err, {} as Request, res as unknown as Response, noopNext);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(
      ((res.json.mock.calls[0] as unknown[])[0] as { error: { details: unknown } })
        .error.details,
    ).toBeDefined();
  });

  it('maps Mongo dup-key (11000) to 409 CONFLICT', () => {
    const dup = Object.assign(new Error('dup'), {
      code: 11000,
      keyValue: { gst: 'X' },
    });
    const res = mockRes();
    errorHandler(dup, {} as Request, res as unknown as Response, noopNext);
    expect(res.status).toHaveBeenCalledWith(409);
    expect((res.json.mock.calls[0] as unknown[])[0]).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT', details: { gst: 'X' } },
    });
  });

  it('falls back to 500 INTERNAL for unknown errors', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), {} as Request, res as unknown as Response, noopNext);
    expect(res.status).toHaveBeenCalledWith(500);
    expect((res.json.mock.calls[0] as unknown[])[0]).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL' },
    });
  });
});

describe('notFoundHandler', () => {
  it('returns 404 NOT_FOUND', () => {
    const res = mockRes();
    notFoundHandler(
      new Error('no'),
      {} as Request,
      res as unknown as Response,
      noopNext,
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect((res.json.mock.calls[0] as unknown[])[0]).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});
