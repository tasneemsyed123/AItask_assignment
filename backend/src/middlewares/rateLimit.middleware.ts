/**
 * middlewares/rateLimit.middleware.ts
 * --------------------------------------------------------------------------
 * Two limiters:
 *  - `globalRateLimiter`: generous, applied to the whole API, guards against
 *    generic abuse/scraping.
 *  - `authRateLimiter`: strict, applied only to /auth/login and
 *    /auth/register, specifically to slow down credential brute-forcing.
 */
import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts. Try again later.' } },
});
