/**
 * hooks/useTaskPolling.ts
 * --------------------------------------------------------------------------
 * Polls GET /tasks/:id every 2s WHILE the task is PENDING or RUNNING, and
 * automatically stops (React Query's `refetchInterval` returning `false`)
 * once the task reaches a terminal state (SUCCESS/FAILED). This is the
 * "Polling" requirement from the assignment - deliberately not WebSockets,
 * per Phase 1 scope.
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { taskKeys } from './useTasks';
import type { Task } from '@/types/task';

const POLL_INTERVAL_MS = 2000;

export function useTaskPolling(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/${taskId}`);
      return data.data.task as Task;
    },
    refetchInterval: (query) => {
      const task = query.state.data as Task | undefined;
      if (!task) return POLL_INTERVAL_MS;
      const isTerminal = task.status === 'SUCCESS' || task.status === 'FAILED';
      return isTerminal ? false : POLL_INTERVAL_MS;
    },
  });
}
