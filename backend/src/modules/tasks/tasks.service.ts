/**
 * modules/tasks/tasks.service.ts
 * --------------------------------------------------------------------------
 * Business rules for task creation/execution/listing:
 *  - a user may only see/run their own tasks (ownership check)
 *  - a task can only be (re-)run from PENDING or FAILED (never while already
 *    RUNNING, and re-running a SUCCESS requires creating a new task instead -
 *    keeps task history immutable once it succeeds)
 */
import { TasksRepository } from './tasks.repository';
import { enqueueTask } from '../../queue/redisQueue';
import { NotFoundError, ConflictError } from '../../exceptions/AppError';
import type { CreateTaskInput, ListTasksQuery } from './tasks.schema';
import type { TaskDocument } from '../../models/Task.model';

export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async createTask(userId: string, input: CreateTaskInput): Promise<TaskDocument> {
    return this.tasksRepository.create({ userId, ...input });
  }

  async runTask(userId: string, taskId: string): Promise<TaskDocument> {
    const task = await this.tasksRepository.findByIdAndUser(taskId, userId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    if (task.status === 'RUNNING') {
      throw new ConflictError('Task is already running');
    }

    const updated = await this.tasksRepository.markQueued(task);
    await enqueueTask(updated._id.toString());
    return updated;
  }

  async getTask(userId: string, taskId: string): Promise<TaskDocument> {
    const task = await this.tasksRepository.findByIdAndUser(taskId, userId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  }

  async listTasks(userId: string, query: ListTasksQuery) {
    return this.tasksRepository.listByUser(userId, query);
  }
}
