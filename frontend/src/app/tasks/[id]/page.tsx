/**
 * app/tasks/[id]/page.tsx
 * --------------------------------------------------------------------------
 * Task detail page - purple/glow design, live-polling indicator, and the
 * lifecycle progress bar.
 */
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { useRunTask } from '@/hooks/useTasks';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskProgress } from '@/components/TaskProgress';
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
      <div className="min-h-screen bg-[#FAFAFE] flex items-center justify-center">
        <p className="text-sm text-[#9CA3AF]">Loading task…</p>
      </div>
    );
  }

  const isTerminal = task.status === 'SUCCESS' || task.status === 'FAILED';

  return (
    <div className="min-h-screen bg-[#FAFAFE]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-[#6B7280] hover:text-[#1A1325] mb-6 transition-colors"
        >
          ← Back to dashboard
        </button>

        <div className="bg-white border border-[#E6E1F5] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-lg font-semibold text-[#1A1325] tracking-tight">{task.title}</h1>
              <p className="text-sm text-[#9CA3AF] font-mono mt-0.5">{task.operationType.toLowerCase()}</p>
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
                  onSuccess: () => showToast('success', 'Task queued - watching for updates every 2s'),
                  onError: () => showToast('error', 'Could not queue task'),
                });
              }}
              disabled={runTask.isPending}
              className="mb-5 px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all duration-200 hover:shadow-glow disabled:opacity-50"
            >
              {runTask.isPending ? 'Starting…' : 'Run task'}
            </button>
          )}

          <div className="border-t border-[#F1F0F5] pt-4 mb-4">
            <p className="text-[11px] font-mono uppercase tracking-wide text-[#9CA3AF] mb-2">Input text</p>
            <p className="text-sm text-[#1A1325] bg-[#FAFAFE] rounded-lg p-3 whitespace-pre-wrap">{task.inputText}</p>
          </div>

          <div className="border-t border-[#F1F0F5] pt-4 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[11px] font-mono uppercase tracking-wide text-[#9CA3AF]">Execution logs</p>
              {!isTerminal && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-brand-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  live
                </span>
              )}
            </div>
            <div className="font-mono text-xs space-y-1.5 bg-[#150F27] text-[#C9C2E8] rounded-lg p-4 max-h-48 overflow-y-auto">
              {task.logs.map((log, i) => (
                <div key={i} className={log.level === 'error' ? 'text-red-400' : ''}>
                  <span className="text-[#786F98]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  {'  '}
                  {log.message}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#F1F0F5] pt-4">
            <p className="text-[11px] font-mono uppercase tracking-wide text-[#9CA3AF] mb-2">Result</p>
            {task.status === 'SUCCESS' && (
              <p className="text-sm bg-emerald-50 text-emerald-700 rounded-lg p-3 whitespace-pre-wrap font-medium">
                {String(task.result)}
              </p>
            )}
            {task.status === 'FAILED' && (
              <p className="text-sm bg-red-50 text-red-700 rounded-lg p-3">{task.errorMessage}</p>
            )}
            {!isTerminal && <p className="text-sm text-[#9CA3AF]">Waiting for task to complete…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
