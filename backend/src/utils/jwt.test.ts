import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

import { signToken, verifyToken } from './jwt.js';

describe('jwt utils', () => {
  it('round-trips sign/verify', () => {
    const token = signToken({
      sub: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      roles: ['admin'],
    });
    expect(typeof token).toBe('string');
    const payload = verifyToken(token);
    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
    expect(payload.email).toBe('admin@example.com');
    expect(payload.roles).toEqual(['admin']);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(
      { sub: 'x', email: 'a@b.c', roles: ['admin'] },
      env.JWT_SECRET,
      { expiresIn: '-1s' },
    );
    expect(() => verifyToken(expired)).toThrow();
  });

  it('rejects tokens signed with the wrong secret', () => {
    const bad = jwt.sign(
      { sub: 'x', email: 'a@b.c', roles: ['admin'] },
      'wrong-secret-please-32-bytes-padd',
    );
    expect(() => verifyToken(bad)).toThrow();
  });

  it('rejects malformed payloads', () => {
    const garbage = jwt.sign({ no: 'sub' }, env.JWT_SECRET);
    expect(() => verifyToken(garbage)).toThrow(/Malformed/);
  });

  it('strips non-string roles', () => {
    const odd = jwt.sign(
      { sub: 'x', email: 'a@b.c', roles: ['admin', 42, null, 'ops'] },
      env.JWT_SECRET,
    );
    const payload = verifyToken(odd);
    expect(payload.roles).toEqual(['admin', 'ops']);
  });

  it('throws on string-shaped payloads (jwt corner case)', () => {
    const stringPayload = jwt.sign('hello', env.JWT_SECRET);
    expect(() => verifyToken(stringPayload)).toThrow();
  });
});
