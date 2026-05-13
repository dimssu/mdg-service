import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../utils/AppError.js';
import { verifyToken, type JwtPayload } from '../utils/jwt.js';

export interface AuthedAdmin {
  id: string;
  email: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthedAdmin;
    }
  }
}

export const requireAuth: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw AppError.unauthorized('Empty bearer token');
    }
    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
    req.admin = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export function requireRoles(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.admin) return next(AppError.unauthorized());
    if (roles.length === 0) return next();
    const intersection = req.admin.roles.filter((r) => roles.includes(r));
    if (intersection.length === 0) {
      return next(AppError.forbidden('Insufficient role'));
    }
    next();
  };
}
