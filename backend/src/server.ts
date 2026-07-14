/**
 * server.ts
 * --------------------------------------------------------------------------
 * Process entry point: connects to MongoDB + Redis, starts the stale task
 * reaper, then binds the HTTP server. Order matters - we don't want to start
 * accepting HTTP traffic before the database/queue are reachable.
 */
import { createApp } from './app';
import { env } from './config/env';
import { connectToDatabase } from './config/db';
import { connectToRedis } from './config/redis';
import { startStaleTaskReaper } from './queue/staleTaskReaper';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectToDatabase();
  await connectToRedis();
  startStaleTaskReaper();

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port}`, { env: env.nodeEnv });
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap', { message: err.message, stack: err.stack });
  process.exit(1);
});
