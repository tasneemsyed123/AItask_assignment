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
import { env } from './config/env';
import { globalRateLimiter } from './middlewares/rateLimit.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';

export function createApp(): Application {
  const app = express();

  // Security middleware - applied first, before any route logic runs.
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(globalRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/tasks', tasksRouter);

  // Must be registered LAST - Express identifies error middleware by its
  // 4-argument signature.
  app.use(errorMiddleware);

  return app;
}
