/**
 * app/tasks/[id]/page.tsx
 * --------------------------------------------------------------------------
 * Task detail page — clean modern layout. Input text and Result/Logs sit
 * side by side in a two-column grid on desktop (stacked on mobile).
 */
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { useRunTask } from '@/hooks/useTasks';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskProgress } from '@/components/TaskProgress';
import { TaskLogPanel } from '@/components/TaskLogPanel';
import { TaskResultPanel } from '@/components/TaskResultPanel';
import { useToast } from '@/components/Toast';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: task, isLoading } = useTaskPolling(params.id);
  const runTask = useRunTask();
  const showToast = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) return null;
  if (isLoading || !task) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] dark:bg-gray-950 flex items-center justify-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading task…</p>
      </div>
    );
  }

  const isTerminal = task.status === 'SUCCESS' || task.status === 'FAILED';

  return (
    <div className="min-h-screen bg-[#FAFBFF] dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors inline-flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to dashboard
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between mb-5 gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight truncate">{task.title}</h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-mono mt-0.5">{task.operationType.toLowerCase()}</p>
            </div>
            <StatusBadge status={task.status} />
          </div>

          <div className="mb-5">
            <TaskProgress status={task.status} />
          </div>

          {(task.status === 'PENDING' || task.status === 'FAILED') && (
            <button
              onClick={() => {
                showToast('info', 'Queuing task…');
                runTask.mutate(task._id, {
                  onSuccess: () => showToast('success', 'Task queued — watching for updates'),
                  onError: () => showToast('error', 'Could not queue task'),
                });
              }}
              disabled={runTask.isPending}
              className="mb-5 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 disabled:opacity-50"
            >
              {runTask.isPending ? 'Starting…' : 'Run task'}
            </button>
          )}

          {/* Input + Result side by side */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="grid md:grid-cols-2 gap-4 items-stretch">
              <div className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Input text</p>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 p-3.5 flex-1 overflow-y-auto">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{task.inputText}</p>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {task.status === 'FAILED' ? 'Error' : 'Result'}
                  </p>
                  {!isTerminal && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      live
                    </span>
                  )}
                </div>
                <TaskResultPanel status={task.status} result={task.result} errorMessage={task.errorMessage} />
              </div>
            </div>
          </div>

          {/* Logs below, full width */}
          <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Execution logs</p>
            <TaskLogPanel status={task.status} logs={task.logs} />
          </div>
        </div>
      </div>
    </div>
  );
}