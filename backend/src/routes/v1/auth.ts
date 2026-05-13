import { loginSchema } from '@dk/shared/schemas';
import { Router } from 'express';


import { asyncHandler } from '../../middleware/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginRateLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { AdminModel } from '../../models/Admin.js';
import { AppError } from '../../utils/AppError.js';
import { writeAudit } from '../../utils/audit.js';
import { signToken } from '../../utils/jwt.js';
import { comparePassword } from '../../utils/password.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const admin = await AdminModel.findOne({ email }).lean();
    if (!admin) throw AppError.unauthorized('Invalid credentials');
    const ok = await comparePassword(password, admin.passwordHash);
    if (!ok) throw AppError.unauthorized('Invalid credentials');

    const id = String(admin._id);
    const roles = admin.roles ?? ['admin'];
    const token = signToken({ sub: id, email: admin.email, roles });
    await AdminModel.updateOne({ _id: admin._id }, { lastLoginAt: new Date() });
    await writeAudit({
      entity: 'Admin',
      entityId: id,
      actorId: id,
      action: 'LOGIN',
    });

    res.status(200).json({
      ok: true,
      data: {
        token,
        admin: {
          id,
          email: admin.email,
          name: admin.name,
          roles,
          lastLoginAt: admin.lastLoginAt
            ? new Date(admin.lastLoginAt).toISOString()
            : undefined,
          createdAt:
            (admin as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? '',
          updatedAt:
            (admin as unknown as { updatedAt?: Date }).updatedAt?.toISOString() ?? '',
        },
      },
    });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.admin) throw AppError.unauthorized();
    const admin = await AdminModel.findById(req.admin.id).lean();
    if (!admin) throw AppError.unauthorized();
    res.json({
      ok: true,
      data: {
        id: String(admin._id),
        email: admin.email,
        name: admin.name,
        roles: admin.roles ?? ['admin'],
        lastLoginAt: admin.lastLoginAt
          ? new Date(admin.lastLoginAt).toISOString()
          : undefined,
        createdAt:
          (admin as unknown as { createdAt?: Date }).createdAt?.toISOString() ?? '',
        updatedAt:
          (admin as unknown as { updatedAt?: Date }).updatedAt?.toISOString() ?? '',
      },
    });
  }),
);
