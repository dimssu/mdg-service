import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';

import { requireAuth, requireRoles } from './auth.js';

function mockReq(headers: Record<string, string> = {}): Request {
  return { headers, admin: undefined } as unknown as Request;
}
function mockRes(): Response {
  return {} as Response;
}
function makeNext(): NextFunction & { calls: unknown[] } {
  const calls: unknown[] = [];
  const fn = ((err?: unknown) => {
    calls.push(err);
  }) as NextFunction & { calls: unknown[] };
  fn.calls = calls;
  return fn;
}

describe('requireAuth', () => {
  it('rejects when Authorization header is missing', () => {
    const req = mockReq();
    const next = makeNext();
    requireAuth(req, mockRes(), next);
    expect(next.calls).toHaveLength(1);
    const err = next.calls[0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('rejects when the scheme is not Bearer', () => {
    const req = mockReq({ authorization: 'Basic abc' });
    const next = makeNext();
    requireAuth(req, mockRes(), next);
    expect((next.calls[0] as AppError).status).toBe(401);
  });

  it('rejects when the bearer token is empty', () => {
    const req = mockReq({ authorization: 'Bearer ' });
    const next = makeNext();
    requireAuth(req, mockRes(), next);
    expect((next.calls[0] as AppError).status).toBe(401);
  });

  it('rejects a malformed token', () => {
    const req = mockReq({ authorization: 'Bearer not-a-jwt' });
    const next = makeNext();
    requireAuth(req, mockRes(), next);
    expect((next.calls[0] as AppError).status).toBe(401);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(
      { sub: '507f1f77bcf86cd799439011', email: 'a@b.c', roles: ['admin'] },
      env.JWT_SECRET,
      { expiresIn: '-10s' },
    );
    const req = mockReq({ authorization: `Bearer ${expired}` });
    const next = makeNext();
    requireAuth(req, mockRes(), next);
    expect((next.calls[0] as AppError).status).toBe(401);
  });

  it('attaches req.admin on valid token', () => {
    const token = signToken({
      sub: '507f1f77bcf86cd799439011',
      email: 'a@b.c',
      roles: ['admin'],
    });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const next = makeNext();
    requireAuth(req, mockRes(), next);
    expect(next.calls).toEqual([undefined]);
    expect(req.admin).toEqual({
      id: '507f1f77bcf86cd799439011',
      email: 'a@b.c',
      roles: ['admin'],
    });
  });
});

describe('requireRoles', () => {
  function authedReq(roles: string[]): Request {
    return {
      admin: { id: 'x', email: 'a@b.c', roles },
    } as unknown as Request;
  }

  it('passes when the intersection is non-empty', () => {
    const next = makeNext();
    requireRoles('admin', 'ops')(authedReq(['admin']), mockRes(), next);
    expect(next.calls).toEqual([undefined]);
  });

  it('forbids when no overlap', () => {
    const next = makeNext();
    requireRoles('admin')(authedReq(['viewer']), mockRes(), next);
    expect(next.calls).toHaveLength(1);
    const err = next.calls[0] as AppError;
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('rejects unauthenticated requests with 401', () => {
    const next = makeNext();
    requireRoles('admin')(mockReq(), mockRes(), next);
    expect((next.calls[0] as AppError).status).toBe(401);
  });

  it('passes through when no roles configured', () => {
    const next = makeNext();
    requireRoles()(authedReq(['anything']), mockRes(), next);
    expect(next.calls).toEqual([undefined]);
  });
});
