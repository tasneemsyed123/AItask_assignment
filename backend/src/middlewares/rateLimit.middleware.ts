/**
 * middlewares/rateLimit.middleware.ts
 * --------------------------------------------------------------------------
 * All limiters are backed by Redis (see utils/redisRateLimit.ts) so limits
 * survive a restart and stay correct if this backend ever runs as more than
 * one instance behind a load balancer.
 *
 * Each auth endpoint gets its OWN limiter instance/key-prefix - they used to
 * share a single `authRateLimiter`, which meant hammering /register also ate
 * into /login's budget (and vice versa). Splitting them means a burst on one
 * endpoint can't lock out a legitimate user trying a different one.
 *
 *  - `apiRateLimiter`      generous, mounted on the whole /api/v1/* surface,
 *                          baseline guard against generic abuse/scraping.
 *  - `registerRateLimiter` moderate, per-IP - slows mass account creation.
 *  - `loginIpRateLimiter`  coarse per-IP guard on /auth/login, applied
 *                          before body validation.
 *  - `loginAccountRateLimiter` strict, keyed on IP+email together, applied
 *                          after body validation (needs the parsed email).
 *                          This is what item 2 in the audit calls for:
 *                          5 attempts / 15 min per IP+email combo. Rotating
 *                          IPs against one fixed email is separately caught
 *                          by the email-only account lockout in
 *                          utils/accountLockout.ts, since that isn't
 *                          IP-scoped at all.
 *  - `forgotPasswordRateLimiter` / `resetPasswordRateLimiter` each get their
 *                          own per-IP budget, independent of login/register.
 */
import { redisRateLimiter, ipKey, ipAndEmailKey } from '../utils/redisRateLimit';

export const apiRateLimiter = redisRateLimiter({
  keyPrefix: 'api',
  windowSeconds: 15 * 60,
  max: 300,
  keyGenerator: ipKey,
  message: 'Too many requests. Please slow down.',
});

export const registerRateLimiter = redisRateLimiter({
  keyPrefix: 'register',
  windowSeconds: 60 * 60,
  max: 10,
  keyGenerator: ipKey,
  message: 'Too many accounts created from this address. Please try again later.',
});

export const loginIpRateLimiter = redisRateLimiter({
  keyPrefix: 'login-ip',
  windowSeconds: 15 * 60,
  max: 20,
  keyGenerator: ipKey,
  message: 'Too many login attempts. Please try again later.',
});

export const loginAccountRateLimiter = redisRateLimiter({
  keyPrefix: 'login-ip-email',
  windowSeconds: 15 * 60,
  max: 5,
  keyGenerator: ipAndEmailKey,
  message: 'Too many login attempts for this account. Please try again later.',
});

export const forgotPasswordRateLimiter = redisRateLimiter({
  keyPrefix: 'forgot-password',
  windowSeconds: 15 * 60,
  max: 5,
  keyGenerator: ipKey,
  message: 'Too many password reset requests. Please try again later.',
});

export const resetPasswordRateLimiter = redisRateLimiter({
  keyPrefix: 'reset-password',
  windowSeconds: 15 * 60,
  max: 10,
  keyGenerator: ipKey,
  message: 'Too many attempts. Please try again later.',
});
