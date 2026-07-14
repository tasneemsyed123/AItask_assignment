/**
 * modules/tasks/tasks.controller.ts
 * --------------------------------------------------------------------------
 * Thin HTTP layer for /api/v1/tasks. `req.user` is guaranteed present here
 * because authMiddleware runs before every route in tasks.routes.ts.
 */
import { Response } from 'express';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { listTasksQuerySchema, bulkDeleteTasksSchema, deleteTasksQuerySchema } from './tasks.schema';
import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';

const tasksService = new TasksService(new TasksRepository());

export const tasksController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const created = await tasksService.createTask(req.user!.userId, req.body);
    // Auto-run on creation: skip the old "create, then click Run" two-step
    // flow. The separate POST /:id/run route stays in place for re-running
    // a task from FAILED.
    const task = await tasksService.runTask(req.user!.userId, created._id.toString());
    res.status(201).json({ success: true, data: { task } });
  },

  async run(req: AuthenticatedRequest, res: Response) {
    const task = await tasksService.runTask(req.user!.userId, req.params.id);
    res.status(200).json({ success: true, data: { task } });
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    const task = await tasksService.getTask(req.user!.userId, req.params.id);
    res.status(200).json({ success: true, data: { task } });
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const query = listTasksQuerySchema.parse(req.query);
    const { tasks, total } = await tasksService.listTasks(req.user!.userId, query);
    res.status(200).json({ success: true, data: { tasks, total, page: query.page, limit: query.limit } });
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await tasksService.deleteTask(req.user!.userId, req.params.id);
    res.status(204).send();
  },

  async removeMany(req: AuthenticatedRequest, res: Response) {
    const { ids } = bulkDeleteTasksSchema.parse(req.body ?? {});
    const { status } = deleteTasksQuerySchema.parse(req.query);
    const deletedCount = await tasksService.deleteTasks(req.user!.userId, { ids, status });
    res.status(200).json({ success: true, data: { deletedCount } });
  },
};
