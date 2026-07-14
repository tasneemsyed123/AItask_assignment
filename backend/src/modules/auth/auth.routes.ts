/**
 * modules/auth/auth.routes.ts
 * --------------------------------------------------------------------------
 * Route wiring for /api/v1/auth/*. Each route gets its own Redis-backed
 * limiter (see rateLimit.middleware.ts for why they're no longer shared).
 *
 * /login runs a coarse per-IP limiter BEFORE validation (cheap first line of
 * defense against raw flooding), then the strict per-IP+email limiter AFTER
 * validation, since it needs the parsed/normalized email from the body.
 */
import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/error.middleware';
import {
  registerRateLimiter,
  loginIpRateLimiter,
  loginAccountRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
} from '../../middlewares/rateLimit.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post(
  '/register',
  registerRateLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

authRouter.post(
  '/login',
  loginIpRateLimiter,
  validateBody(loginSchema),
  loginAccountRateLimiter,
  asyncHandler(authController.login),
);

authRouter.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

authRouter.post(
  '/reset-password',
  resetPasswordRateLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
