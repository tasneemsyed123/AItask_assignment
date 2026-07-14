/**
 * modules/tasks/tasks.routes.ts
 * --------------------------------------------------------------------------
 * All routes here require authentication (authMiddleware runs first).
 */
import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../middlewares/error.middleware';
import { createTaskSchema } from './tasks.schema';

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);

tasksRouter.post('/', validateBody(createTaskSchema), asyncHandler(tasksController.create));
tasksRouter.post('/:id/run', asyncHandler(tasksController.run));
tasksRouter.get('/:id', asyncHandler(tasksController.getOne));
tasksRouter.get('/', asyncHandler(tasksController.list));
tasksRouter.delete('/:id', asyncHandler(tasksController.remove));
