/**
 * queue/staleTaskReaper.ts
 * --------------------------------------------------------------------------
 * Redis failure-handling / recovery strategy (Phase 1 version):
 *
 * Plain Redis lists have no acknowledgement concept - if a worker process
 * crashes AFTER popping a task but BEFORE finishing it, that task is stuck
 * forever in RUNNING with no natural way to detect the failure (this is
 * exactly the problem Redis Streams + consumer groups solve, noted as a
 * Phase 2+ improvement in the architecture doc).
 *
 * As a pragmatic Phase 1 mitigation, this reaper runs on an interval and
 * catches two different stuck cases, both marked FAILED so they never
 * silently hang forever in the UI and both become retriable through the
 * same "Retry" action:
 *
 *  - RUNNING past STALE_TASK_TIMEOUT_MINUTES: the worker picked it up but
 *    crashed/hung before finishing.
 *  - PENDING past PENDING_STUCK_TIMEOUT_MS: the task was saved as "queued"
 *    (queuedAt set) but never actually reached Redis - e.g. a Redis blip in
 *    the instant between saving the record and pushing to the queue (see
 *    tasks.service.ts runTask). The worker will never see these on its own.
 *    A worker normally picks a task up within ~3.5s (see queue_consumer.py's
 *    QUEUE_DELAY_RANGE_SECONDS), so 2 minutes is a generous margin before
 *    treating it as genuinely stuck rather than just momentarily busy.
 */
import { TaskModel, TaskDocument } from '../models/Task.model';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const CHECK_INTERVAL_MS = 60 * 1000;
const PENDING_STUCK_TIMEOUT_MS = 2 * 60 * 1000;

export function startStaleTaskReaper(): NodeJS.Timeout {
  return setInterval(async () => {
    const runningCutoff = new Date(Date.now() - env.staleTaskTimeoutMinutes * 60 * 1000);
    const pendingCutoff = new Date(Date.now() - PENDING_STUCK_TIMEOUT_MS);

    const staleRunning = await TaskModel.find({ status: 'RUNNING', startedAt: { $lte: runningCutoff } });
    for (const task of staleRunning) {
      await failTask(task, 'Worker timeout: task did not complete in time', 'worker likely crashed');
    }

    const stuckPending = await TaskModel.find({ status: 'PENDING', queuedAt: { $lte: pendingCutoff } });
    for (const task of stuckPending) {
      await failTask(task, 'Task was queued but never picked up by a worker', 'never reached the queue - likely a Redis blip when it was enqueued');
    }
  }, CHECK_INTERVAL_MS);
}

async function failTask(task: TaskDocument, errorMessage: string, logReason: string): Promise<void> {
  task.status = 'FAILED';
  task.errorMessage = errorMessage;
  task.finishedAt = new Date();
  task.logs.push({
    level: 'error',
    message: `Marked as failed by stale task reaper (${logReason})`,
    timestamp: new Date(),
  });
  await task.save();
  logger.warn('Reaped stale task', { taskId: task._id.toString(), reason: logReason });
}
