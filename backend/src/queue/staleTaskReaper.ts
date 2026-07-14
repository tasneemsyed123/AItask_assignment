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
 * marks any task that has been RUNNING for longer than
 * STALE_TASK_TIMEOUT_MINUTES as FAILED, so it never silently hangs forever
 * in the UI.
 */
import { TaskModel } from '../models/Task.model';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const CHECK_INTERVAL_MS = 60 * 1000;

export function startStaleTaskReaper(): NodeJS.Timeout {
  return setInterval(async () => {
    const cutoff = new Date(Date.now() - env.staleTaskTimeoutMinutes * 60 * 1000);
    const staleTasks = await TaskModel.find({ status: 'RUNNING', startedAt: { $lte: cutoff } });

    for (const task of staleTasks) {
      task.status = 'FAILED';
      task.errorMessage = 'Worker timeout: task did not complete in time';
      task.finishedAt = new Date();
      task.logs.push({
        level: 'error',
        message: 'Marked as failed by stale task reaper (worker likely crashed)',
        timestamp: new Date(),
      });
      await task.save();
      logger.warn('Reaped stale task', { taskId: task._id.toString() });
    }
  }, CHECK_INTERVAL_MS);
}
