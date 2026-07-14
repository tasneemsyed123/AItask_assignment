/**
 * hooks/useTaskPolling.ts
 * --------------------------------------------------------------------------
 * Polls GET /tasks/:id every `intervalMs` WHILE the task is PENDING or
 * RUNNING, and automatically stops (React Query's `refetchInterval`
 * returning `false`) once the task reaches a terminal state (SUCCESS/
 * FAILED). This is the "Polling" requirement from the assignment -
 * deliberately not WebSockets, per Phase 1 scope.
 *
 * `initialData` lets a caller seed this from data it already has (e.g. a
 * task list row) so there's no loading flash, and `enabled` lets a caller
 * avoid ever issuing a request for a task it already knows is terminal -
 * flip it back to `true` (e.g. after a re-run) to resume polling.
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { taskKeys } from './useTasks';
import type { Task } from '@/types/task';

const POLL_INTERVAL_MS = 2000;

export function useTaskPolling(
  taskId: string,
  options?: { initialData?: Task; intervalMs?: number; enabled?: boolean },
) {
  const intervalMs = options?.intervalMs ?? POLL_INTERVAL_MS;
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/${taskId}`);
      return data.data.task as Task;
    },
    initialData: options?.initialData,
    enabled: options?.enabled ?? true,
    refetchInterval: (query) => {
      const task = query.state.data as Task | undefined;
      if (!task) return intervalMs;
      const isTerminal = task.status === 'SUCCESS' || task.status === 'FAILED';
      return isTerminal ? false : intervalMs;
    },
  });
}
