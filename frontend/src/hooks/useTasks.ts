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
    // Tasks move through PENDING -> RUNNING -> SUCCESS/FAILED on the backend
    // without the frontend making any request of its own, so this list (and
    // the dashboard's stat-card counts derived from it) would otherwise go
    // stale until the next create/run/delete mutation. Keep polling while
    // any fetched task is still non-terminal; stop once they've all settled.
    refetchInterval: (query) => {
      const result = query.state.data as { tasks: Task[] } | undefined;
      if (!result) return false;
      const hasActive = result.tasks.some((t) => t.status === 'PENDING' || t.status === 'RUNNING');
      return hasActive ? 2000 : false;
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

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/tasks/${taskId}`);
      return taskId;
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

/**
 * Bulk delete. Pass `ids` to delete exactly those tasks ("delete selected"),
 * or omit it to delete every task the user owns, optionally narrowed by
 * `status` ("delete all" / "delete all queued", matching the active filter tab).
 */
export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ids?: string[]; status?: TaskStatus }) => {
      const { data } = await apiClient.delete('/tasks', {
        params: input.status ? { status: input.status } : undefined,
        data: input.ids ? { ids: input.ids } : undefined,
      });
      return data.data as { deletedCount: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
