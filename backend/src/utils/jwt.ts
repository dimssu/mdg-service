import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Unexpected JWT payload (string)');
  }
  const sub = decoded.sub;
  const email = (decoded as Record<string, unknown>).email;
  const roles = (decoded as Record<string, unknown>).roles;
  if (typeof sub !== 'string' || typeof email !== 'string' || !Array.isArray(roles)) {
    throw new Error('Malformed JWT payload');
  }
  return {
    sub,
    email,
    roles: roles.filter((r): r is string => typeof r === 'string'),
  };
}
