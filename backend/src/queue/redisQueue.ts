/**
 * queue/redisQueue.ts
 * --------------------------------------------------------------------------
 * PRODUCER side of the task queue. The backend never processes tasks itself
 * - it only pushes a small pointer payload onto a Redis LIST, which the
 * Python worker consumes via a blocking BRPOP on the other side.
 *
 * Contract (must stay in sync with worker/app/queue_consumer.py):
 *   LPUSH task_queue '{"taskId": "<mongo id>", "enqueuedAt": "<iso date>"}'
 *
 * We deliberately do NOT put the full task payload (inputText, operationType)
 * in the queue message - only an id pointer. The worker re-fetches the task
 * from MongoDB by id. This avoids a whole class of bugs where the queued
 * payload and the database state disagree (e.g. if a task were ever edited
 * after being queued).
 */
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export const TASK_QUEUE_KEY = 'task_queue';

export async function enqueueTask(taskId: string): Promise<void> {
  const payload = JSON.stringify({ taskId, enqueuedAt: new Date().toISOString() });
  await redisClient.lPush(TASK_QUEUE_KEY, payload);
  logger.info('Task enqueued', { taskId });
}
