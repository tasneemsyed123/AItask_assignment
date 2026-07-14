/**
 * modules/auth/auth.routes.ts
 * --------------------------------------------------------------------------
 * Route wiring for /api/v1/auth/*. The strict `authRateLimiter` is applied
 * here specifically (not globally) to slow down credential brute-forcing
 * without penalizing normal authenticated traffic elsewhere in the API.
 */
import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/error.middleware';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

authRouter.post(
  '/reset-password',
  authRateLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
