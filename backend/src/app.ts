/**
 * app.ts
 * --------------------------------------------------------------------------
 * Express application wiring: security middleware, routes, error handling.
 * Kept separate from server.ts so tests can import the app (e.g. with
 * supertest) without actually binding a port or connecting to Mongo/Redis.
 */
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { redisClient } from './config/redis';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';

export function createApp(): Application {
  const app = express();

  // Security middleware - applied first, before any route logic runs.
  //
  // This API only ever serves JSON (no HTML/scripts/styles), so CSP is
  // locked down to default-src 'none' rather than helmet's browser-app
  // defaults - there is nothing on this origin that should ever load a
  // script, stylesheet, or frame. HSTS is set explicitly (1 year +
  // includeSubDomains) rather than relying on helmet's default, since that's
  // the value we actually want enforced in production. crossOriginResourcePolicy
  // is set to 'cross-origin' - the frontend runs on a different origin
  // (env.corsOrigin) and needs to read these JSON responses; CORS above is
  // what actually restricts who that is, so CORP here doesn't need to be
  // 'same-origin' as well.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  // Kubernetes-style split health checks, registered ahead of the rate
  // limiter since a probe fires every few seconds per pod and shouldn't
  // compete with real traffic for that budget.
  //
  // Liveness: only answers "is the process itself still responding" - no
  // dependency checks. If this checked Mongo/Redis too, a transient outage
  // in either would make Kubernetes kill and restart an otherwise-healthy
  // backend pod, which doesn't fix anything and just adds churn.
  app.get('/api/health/live', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'alive' } });
  });

  // Readiness: "can this pod actually serve a request right now" - checks
  // both dependencies the backend can't function without. Kubernetes stops
  // routing traffic to a pod that fails this (without restarting it), which
  // is exactly right for "Mongo/Redis is still connecting at startup" or a
  // brief reconnect blip, as opposed to liveness's "kill and restart."
  app.get('/api/health/ready', (_req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;
    const redisReady = redisClient.isReady;

    if (mongoReady && redisReady) {
      res.status(200).json({ success: true, data: { status: 'ready', mongo: true, redis: true } });
      return;
    }

    res.status(503).json({
      success: false,
      error: { code: 'NOT_READY', message: 'One or more dependencies are not ready' },
      data: { mongo: mongoReady, redis: redisReady },
    });
  });

  // Baseline abuse guard for the whole API surface; individual auth routes
  // layer stricter, Redis-backed limits on top of this (see auth.routes.ts).
  app.use('/api/v1', apiRateLimiter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/tasks', tasksRouter);

  // Must be registered LAST - Express identifies error middleware by its
  // 4-argument signature.
  app.use(errorMiddleware);

  return app;
}
