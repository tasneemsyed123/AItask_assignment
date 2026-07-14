/**
 * modules/tasks/tasks.repository.ts
 * --------------------------------------------------------------------------
 * All Mongoose access for Task documents lives here. tasks.service.ts never
 * imports TaskModel directly - it depends on this repository, keeping the
 * service testable and the persistence layer swappable.
 */
import { TaskModel, TaskDocument, OperationType, TaskStatus } from '../../models/Task.model';

export class TasksRepository {
  async create(data: { userId: string; title: string; inputText: string; operationType: OperationType }): Promise<TaskDocument> {
    return TaskModel.create({
      ...data,
      status: 'PENDING',
      logs: [{ level: 'info', message: 'Task created', timestamp: new Date() }],
    });
  }

  async findById(id: string): Promise<TaskDocument | null> {
    return TaskModel.findById(id);
  }

  /** Titles equal to `baseTitle` or matching its "`baseTitle` (n)" duplicate-suffix form, for this user. */
  async findTitlesLike(userId: string, baseTitle: string): Promise<string[]> {
    const escaped = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escaped}(?: \\(\\d+\\))?$`);
    const tasks = await TaskModel.find({ userId, title: pattern }, { title: 1 });
    return tasks.map((t) => t.title);
  }

  async findByIdAndUser(id: string, userId: string): Promise<TaskDocument | null> {
    return TaskModel.findOne({ _id: id, userId });
  }

  async listByUser(
    userId: string,
    filters: { status?: TaskStatus; page: number; limit: number },
  ): Promise<{ tasks: TaskDocument[]; total: number }> {
    const query: Record<string, unknown> = { userId };
    if (filters.status) query.status = filters.status;

    const [tasks, total] = await Promise.all([
      TaskModel.find(query)
        .sort({ createdAt: -1 })
        .skip((filters.page - 1) * filters.limit)
        .limit(filters.limit),
      TaskModel.countDocuments(query),
    ]);

    return { tasks, total };
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<TaskDocument | null> {
    return TaskModel.findOneAndDelete({ _id: id, userId });
  }

  async deleteManyByIdsAndUser(ids: string[], userId: string): Promise<number> {
    const result = await TaskModel.deleteMany({ _id: { $in: ids }, userId });
    return result.deletedCount ?? 0;
  }

  async deleteAllByUser(userId: string, status?: TaskStatus): Promise<number> {
    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    const result = await TaskModel.deleteMany(query);
    return result.deletedCount ?? 0;
  }

  async markQueued(task: TaskDocument): Promise<TaskDocument> {
    task.status = 'PENDING';
    task.progress = 0;
    task.queuedAt = new Date();
    task.logs.push({ level: 'info', message: 'Task queued for execution', timestamp: new Date() });
    return task.save();
  }
}
