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
import type { TaskDocument, TaskStatus } from '../../models/Task.model';

export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async createTask(userId: string, input: CreateTaskInput): Promise<TaskDocument> {
    const title = await this.resolveUniqueTitle(userId, input.title);
    return this.tasksRepository.create({ userId, ...input, title });
  }

  /** If `baseTitle` is already taken by this user, appends " (1)", " (2)", etc. - the first free one. */
  private async resolveUniqueTitle(userId: string, baseTitle: string): Promise<string> {
    const taken = new Set(await this.tasksRepository.findTitlesLike(userId, baseTitle));
    if (!taken.has(baseTitle)) return baseTitle;

    let n = 1;
    while (taken.has(`${baseTitle} (${n})`)) n++;
    return `${baseTitle} (${n})`;
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

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const deleted = await this.tasksRepository.deleteByIdAndUser(taskId, userId);
    if (!deleted) {
      throw new NotFoundError('Task not found');
    }
  }

  async deleteTasks(userId: string, input: { ids?: string[]; status?: TaskStatus }): Promise<number> {
    if (input.ids && input.ids.length > 0) {
      return this.tasksRepository.deleteManyByIdsAndUser(input.ids, userId);
    }
    return this.tasksRepository.deleteAllByUser(userId, input.status);
  }
}
