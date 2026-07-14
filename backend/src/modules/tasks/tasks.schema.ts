/**
 * modules/tasks/tasks.schema.ts
 * --------------------------------------------------------------------------
 * Zod validation for task creation. operationType is constrained to exactly
 * the four operations the Python worker supports.
 */
import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  inputText: z.string().min(1, 'Input text is required').max(20000),
  operationType: z.enum(['UPPERCASE', 'LOWERCASE', 'REVERSE', 'WORD_COUNT']),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const listTasksQuerySchema = z.object({
  status: z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
