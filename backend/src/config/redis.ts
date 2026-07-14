/**
 * config/redis.ts
 * --------------------------------------------------------------------------
 * The backend only ever needs a non-blocking client because it is the
 * PRODUCER (LPUSH). The BRPOP (blocking consume) happens in the Python
 * worker process, on its own dedicated connection - never here.
 */
import { createClient, RedisClientType } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redisClient: RedisClientType = createClient({ url: env.redisUrl });

redisClient.on('error', (err) => logger.error('Redis client error', { error: err.message }));

export async function connectToRedis(): Promise<void> {
  await redisClient.connect();
  logger.info('Redis connected');
}
