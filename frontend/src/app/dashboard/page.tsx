/**
 * app/dashboard/page.tsx
 * --------------------------------------------------------------------------
 * Task Management dashboard. Rows expand inline to reveal progress, and
 * the input text sits beside the result/log panel instead of stacked
 * below it.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTaskList, useRunTask, useDeleteTask } from '@/hooks/useTasks';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskProgress } from '@/components/TaskProgress';
import { TaskLogPanel } from '@/components/TaskLogPanel';
import { TaskResultPanel } from '@/components/TaskResultPanel';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { useToast } from '@/components/Toast';
import { OPERATION_LABELS, type Task, type TaskStatus } from '@/types/task';

const ROW_POLL_INTERVAL_MS = 1000;

function isTerminalStatus(status: TaskStatus) {
  return status === 'SUCCESS' || status === 'FAILED';
}

const FILTERS: { value: TaskStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Queued' },
  { value: 'RUNNING', label: 'Processing' },
  { value: 'SUCCESS', label: 'Complete' },
  { value: 'FAILED', label: 'Failed' },
];

function relativeTime(iso?: string) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data, isLoading: isLoadingTasks, isFetching } = useTaskList(statusFilter);
  // Stat cards always show counts across ALL statuses, independent of which
  // filter tab is selected for the list below - so this intentionally does
  // NOT pass statusFilter. When statusFilter is undefined this is the exact
  // same query as the one above (React Query dedupes it, no extra request).
  const { data: allTasksData } = useTaskList(undefined);
  const runTask = useRunTask();
  const deleteTask = useDeleteTask();
  const showToast = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  const tasks = data?.tasks ?? [];
  const allTasks = allTasksData?.tasks ?? [];
  const counts = {
    total: allTasksData?.total ?? 0,
    queued: allTasks.filter((t) => t.status === 'PENDING').length,
    running: allTasks.filter((t) => t.status === 'RUNNING').length,
    success: allTasks.filter((t) => t.status === 'SUCCESS').length,
  };

  return (
    <div className="min-h-screen bg-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Your tasks</h1>
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isFetching ? 'animate-ping' : ''}`} />
                live
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Signed in as {user?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                logout();
                showToast('info', 'Signed out');
              }}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              + New task
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Queued" value={counts.queued} dot="bg-gray-400" />
          <StatCard label="Processing" value={counts.running} dot="bg-blue-500" pulse />
          <StatCard label="Complete" value={counts.success} dot="bg-emerald-500" />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto">
          <div className="flex gap-1.5 bg-gray-50 rounded-lg p-1 ring-1 ring-gray-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
            {FILTERS.map((f) => {
              const active = (statusFilter ?? 'ALL') === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value === 'ALL' ? undefined : (f.value as TaskStatus))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-white'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task list */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_0.6fr] px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-gray-400 border-b border-gray-200">
            <span>Title</span>
            <span>Operation</span>
            <span>Status</span>
            <span></span>
          </div>

          {isLoadingTasks && (
            <div className="p-10 flex flex-col items-center gap-2 text-sm text-gray-400">
              <span className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
              Loading tasks…
            </div>
          )}

          {!isLoadingTasks && tasks.length === 0 && statusFilter && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-gray-900 mb-1">
                No {FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase()} tasks
              </p>
              <p className="text-sm text-gray-400">Nothing here right now — try a different filter.</p>
            </div>
          )}

          {!isLoadingTasks && tasks.length === 0 && !statusFilter && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-gray-900 mb-1">Start your first task</p>
              <p className="text-sm text-gray-400 mb-4">Create a task and run it through the queue.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Create task
              </button>
            </div>
          )}

          {tasks.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              onRun={() => {
                showToast('info', `Queuing "${task.title}"…`);
                runTask.mutate(task._id, {
                  onSuccess: () => showToast('success', `"${task.title}" queued — open it to watch progress`),
                  onError: () => showToast('error', `Could not queue "${task.title}"`),
                });
              }}
              onDelete={() => {
                deleteTask.mutate(task._id, {
                  onSuccess: () => showToast('success', `"${task.title}" deleted`),
                  onError: () => showToast('error', `Could not delete "${task.title}"`),
                });
              }}
            />
          ))}
        </div>
      </div>

      {showCreateModal && <CreateTaskModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

function TaskRow({ task, onRun, onDelete }: { task: Task; onRun: () => void; onDelete: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(!isTerminalStatus(task.status));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return;
    const id = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(id);
  }, [confirmingDelete]);

  const { data: liveTask } = useTaskPolling(task._id, {
    initialData: task,
    intervalMs: ROW_POLL_INTERVAL_MS,
    enabled: pollingEnabled,
  });
  const current = liveTask ?? task;
  const canRun = current.status === 'PENDING' || current.status === 'FAILED';
  const isTerminal = isTerminalStatus(current.status);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((cur) => !cur)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((cur) => !cur);
          }
        }}
        className="px-5 py-3.5 hover:bg-white cursor-pointer transition-colors group focus:outline-none"
      >
        <div className="flex sm:grid sm:grid-cols-[2fr_1fr_1fr_0.6fr] items-center text-sm mb-2 gap-2">
          <span className="text-gray-900 font-medium flex items-center gap-2 min-w-0 flex-1">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={`h-3.5 w-3.5 text-gray-500 shrink-0 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <path d="M7 5l6 5-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="truncate">{task.title}</span>
            {task.createdAt && (
              <span className="hidden sm:inline text-[10px] font-mono text-gray-300 shrink-0">{relativeTime(task.createdAt)}</span>
            )}
          </span>
          <span className="hidden sm:inline text-gray-500 font-mono text-xs">
            {OPERATION_LABELS[task.operationType] ?? task.operationType}
          </span>
          <span><StatusBadge status={current.status} /></span>
          <span className="text-right shrink-0 flex items-center justify-end gap-1.5">
            {canRun && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPollingEnabled(true);
                  onRun();
                }}
                className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md hover:bg-blue-100 transition-colors"
              >
                Run →
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                setConfirmingDelete(false);
                onDelete();
              }}
              aria-label={confirmingDelete ? 'Confirm delete task' : 'Delete task'}
              className={`rounded-md transition-colors ${
                confirmingDelete
                  ? 'text-red-700 bg-red-100 ring-1 ring-red-200 hover:bg-red-200 px-2.5 py-1'
                  : 'p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              {confirmingDelete ? (
                <span className="text-xs font-semibold">Confirm?</span>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M4 6h12M8 6V4.5a1 1 0 011-1h2a1 1 0 011 1V6m2 0-.6 9.4a1.5 1.5 0 01-1.5 1.4H7.1a1.5 1.5 0 01-1.5-1.4L5 6h10z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <TaskProgress status={current.status} progress={current.progress} compact />
          </div>
          {!isTerminal && (
            <span className="text-[10px] font-mono text-gray-300 tabular-nums shrink-0 w-8 text-right">
              {current.progress}%
            </span>
          )}
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 bg-gray-100/60 border-t border-gray-200 space-y-4">
            <div className="pt-3 px-1">
              <TaskProgress status={current.status} progress={current.progress} />
            </div>

            {/* Input + Result side by side */}
            <div className="grid md:grid-cols-2 gap-3 items-stretch">
              <div className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-1.5">Input</p>
                <div className="rounded-lg bg-white ring-1 ring-gray-200 px-3.5 py-2.5 flex-1">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{current.inputText}</p>
                </div>
              </div>

              <div className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-1.5">
                  {current.status === 'FAILED' ? 'Error' : 'Result'}
                </p>
                <TaskResultPanel status={current.status} result={current.result} errorMessage={current.errorMessage} />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-1.5">Execution log</p>
              <TaskLogPanel status={current.status} logs={current.logs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, dot, pulse }: { label: string; value: number; dot?: string; pulse?: boolean }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.12)] transition-shadow duration-200">
      <div className="flex items-center gap-1.5 mb-2">
        {dot && (
          <span className="relative flex h-1.5 w-1.5">
            {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
          </span>
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight tabular-nums">{value}</p>
    </div>
  );
}