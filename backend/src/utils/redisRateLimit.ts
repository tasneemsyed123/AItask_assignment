/**
 * utils/redisRateLimit.ts
 * --------------------------------------------------------------------------
 * Fixed-window rate limiter backed by the Redis connection we already hold
 * (config/redis.ts), rather than express-rate-limit's default in-memory
 * store. In-memory counters reset on every deploy/restart and don't share
 * state across multiple backend instances behind a load balancer - Redis
 * fixes both.
 *
 * Implementation: INCR + EXPIRE-on-first-hit per key. There's a tiny race
 * between the INCR and the EXPIRE (a crash in between leaves a key with no
 * TTL), but the failure mode is "this key stays rate-limited a bit longer
 * than intended", never "the limit is bypassed" - acceptable for this use
 * case without pulling in a Lua-script-based library.
 */
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { logger } from './logger';

export interface RateLimitOptions {
  /** Redis key namespace for this limiter, e.g. 'login-ip', 'register'. */
  keyPrefix: string;
  /** Rolling window size. */
  windowSeconds: number;
  /** Max requests allowed per key within the window. */
  max: number;
  /** Derives the identity being limited (IP, email, IP+email, ...) from the request. */
  keyGenerator: (req: Request) => string;
  message: string;
}

export function redisRateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identity = options.keyGenerator(req);
    const key = `ratelimit:${options.keyPrefix}:${identity}`;

    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, options.windowSeconds);
      }

      const remaining = Math.max(0, options.max - count);
      res.setHeader('RateLimit-Limit', String(options.max));
      res.setHeader('RateLimit-Remaining', String(remaining));

      if (count > options.max) {
        const ttl = await redisClient.ttl(key);
        res.setHeader('Retry-After', String(ttl > 0 ? ttl : options.windowSeconds));
        res.status(429).json({
          success: false,
          error: { code: 'RATE_LIMITED', message: options.message },
        });
        return;
      }

      next();
    } catch (err) {
      // Redis is already a hard boot dependency (connectToRedis in
      // server.ts) - if it's unreachable mid-request the whole platform is
      // already degraded. Fail OPEN here (let the request through) rather
      // than turning a Redis blip into a full API outage; log loudly so
      // it's visible.
      logger.error('Rate limiter Redis error - failing open', {
        keyPrefix: options.keyPrefix,
        message: (err as Error).message,
      });
      next();
    }
  };
}

export function ipKey(req: Request): string {
  return req.ip ?? 'unknown-ip';
}

export function ipAndEmailKey(req: Request): string {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'unknown-email';
  return `${req.ip ?? 'unknown-ip'}:${email}`;
}
