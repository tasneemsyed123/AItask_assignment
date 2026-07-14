/**
 * hooks/useTasks.ts
 * --------------------------------------------------------------------------
 * React Query hooks for the task list and task mutations (create/run).
 * Query keys are centralized in `taskKeys` so cache invalidation after a
 * mutation stays in sync with what the list/detail views actually query.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Task, OperationType, TaskStatus } from '@/types/task';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (status?: TaskStatus) => [...taskKeys.all, 'list', status ?? 'ALL'] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export function useTaskList(status?: TaskStatus) {
  return useQuery({
    queryKey: taskKeys.list(status),
    queryFn: async () => {
      const { data } = await apiClient.get('/tasks', { params: status ? { status } : {} });
      return data.data as { tasks: Task[]; total: number };
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; inputText: string; operationType: OperationType }) => {
      const { data } = await apiClient.post('/tasks', input);
      return data.data.task as Task;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useRunTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.post(`/tasks/${taskId}/run`);
      return data.data.task as Task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task._id) });
    },
  });
}
