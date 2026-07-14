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
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTaskList, useRunTask, useDeleteTask, useBulkDeleteTasks } from '@/hooks/useTasks';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskProgress } from '@/components/TaskProgress';
import { TaskPipelineAnimation } from '@/components/TaskPipelineAnimation';
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
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDeleteSelected, setConfirmingDeleteSelected] = useState(false);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const { data, isLoading: isLoadingTasks, isFetching } = useTaskList(statusFilter);
  // Stat cards always show counts across ALL statuses, independent of which
  // filter tab is selected for the list below - so this intentionally does
  // NOT pass statusFilter. When statusFilter is undefined this is the exact
  // same query as the one above (React Query dedupes it, no extra request).
  const { data: allTasksData } = useTaskList(undefined);
  const runTask = useRunTask();
  const deleteTask = useDeleteTask();
  const bulkDeleteTasks = useBulkDeleteTasks();
  const showToast = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    setSelectedIds(new Set());
    setConfirmingDeleteSelected(false);
  }, [statusFilter, selectMode]);

  useEffect(() => {
    if (!confirmingDeleteSelected) return;
    const id = setTimeout(() => setConfirmingDeleteSelected(false), 3000);
    return () => clearTimeout(id);
  }, [confirmingDeleteSelected]);

  useEffect(() => {
    if (!confirmingDeleteAll) return;
    const id = setTimeout(() => setConfirmingDeleteAll(false), 3000);
    return () => clearTimeout(id);
  }, [confirmingDeleteAll]);

  if (isLoading || !isAuthenticated) return null;

  const tasks = data?.tasks ?? [];
  const allTasks = allTasksData?.tasks ?? [];
  const counts = {
    total: allTasksData?.total ?? 0,
    queued: allTasks.filter((t) => t.status === 'PENDING').length,
    running: allTasks.filter((t) => t.status === 'RUNNING').length,
    success: allTasks.filter((t) => t.status === 'SUCCESS').length,
  };
  const deletableTotal = data?.total ?? 0;
  const deleteAllLabel = statusFilter
    ? `Delete all ${FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase()}`
    : 'Delete all';

  const toggleSelectId = (id: string) => {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (!confirmingDeleteSelected) {
      setConfirmingDeleteSelected(true);
      return;
    }
    setConfirmingDeleteSelected(false);
    const ids = Array.from(selectedIds);
    bulkDeleteTasks.mutate(
      { ids },
      {
        onSuccess: ({ deletedCount }) => {
          showToast('success', `Deleted ${deletedCount} task${deletedCount === 1 ? '' : 's'}`);
          setSelectedIds(new Set());
          setSelectMode(false);
        },
        onError: () => showToast('error', 'Could not delete selected tasks'),
      }
    );
  };

  const handleDeleteAll = () => {
    if (!confirmingDeleteAll) {
      setConfirmingDeleteAll(true);
      return;
    }
    setConfirmingDeleteAll(false);
    bulkDeleteTasks.mutate(
      { status: statusFilter },
      {
        onSuccess: ({ deletedCount }) => {
          showToast('success', `Deleted ${deletedCount} task${deletedCount === 1 ? '' : 's'}`);
          setSelectedIds(new Set());
        },
        onError: () => showToast('error', 'Could not delete tasks'),
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Your tasks</h1>
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isFetching ? 'animate-ping' : ''}`} />
                live
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Signed in as {user?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                logout();
                showToast('info', 'Signed out');
              }}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
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

        {/* Filters + bulk actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex gap-1.5 overflow-x-auto">
            <div className="flex gap-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 ring-1 ring-gray-200 dark:ring-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
              {FILTERS.map((f) => {
                const active = (statusFilter ?? 'ALL') === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value === 'ALL' ? undefined : (f.value as TaskStatus))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      active ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {tasks.length > 0 && (
            <div className="flex items-center gap-1.5">
              {selectMode ? (
                <>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mr-0.5">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set(tasks.map((t) => t._id)))}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    disabled={selectedIds.size === 0}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedIds.size === 0}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-40 ${
                      confirmingDeleteSelected
                        ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 ring-1 ring-red-200 dark:ring-red-900 hover:bg-red-200 dark:hover:bg-red-950'
                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                    }`}
                  >
                    {confirmingDeleteSelected ? 'Confirm?' : `Delete selected${selectedIds.size ? ` (${selectedIds.size})` : ''}`}
                  </button>
                  <button
                    onClick={() => setSelectMode(false)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectMode(true)}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    Select
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      confirmingDeleteAll
                        ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 ring-1 ring-red-200 dark:ring-red-900 hover:bg-red-200 dark:hover:bg-red-950'
                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                    }`}
                  >
                    {confirmingDeleteAll ? 'Confirm?' : `${deleteAllLabel} (${deletableTotal})`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Task list */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_0.6fr] px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <span>Title</span>
            <span>Operation</span>
            <span>Status</span>
            <span></span>
          </div>

          {isLoadingTasks && (
            <div className="p-10 flex flex-col items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <span className="h-5 w-5 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 animate-spin" />
              Loading tasks…
            </div>
          )}

          {!isLoadingTasks && tasks.length === 0 && statusFilter && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                No {FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase()} tasks
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Nothing here right now — try a different filter.</p>
            </div>
          )}

          {!isLoadingTasks && tasks.length === 0 && !statusFilter && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Start your first task</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Create a task and run it through the queue.</p>
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
              justCreated={task._id === newTaskId}
              onCollapseJustCreated={() => setNewTaskId((cur) => (cur === task._id ? null : cur))}
              selectMode={selectMode}
              selected={selectedIds.has(task._id)}
              onToggleSelect={() => toggleSelectId(task._id)}
              onRun={() => {
                showToast('info', `Retrying "${task.title}"…`);
                runTask.mutate(task._id, {
                  onSuccess: () => showToast('success', `"${task.title}" queued — open it to watch progress`),
                  onError: () => showToast('error', `Could not retry "${task.title}"`),
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

      {showCreateModal && (
        <CreateTaskModal onClose={() => setShowCreateModal(false)} onCreated={(task) => setNewTaskId(task._id)} />
      )}
    </div>
  );
}

function TaskRow({
  task,
  onRun,
  onDelete,
  justCreated = false,
  onCollapseJustCreated,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  task: Task;
  onRun: () => void;
  onDelete: () => void;
  justCreated?: boolean;
  onCollapseJustCreated?: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(justCreated);
  const [pollingEnabled, setPollingEnabled] = useState(!isTerminalStatus(task.status));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // `useState(justCreated)` only reads justCreated once, at mount - it
  // doesn't react to it changing later. Without this, creating task B while
  // task A's row (auto-expanded when IT was the new one) is still mounted
  // leaves task A's drawer open too, since nothing ever tells it to close.
  // Collapse this row when it stops being "the just-created one" (a newer
  // task took over) - manual expand/collapse by the user elsewhere is
  // unaffected since this only fires on the justCreated transition.
  useEffect(() => {
    if (!justCreated) setIsExpanded((cur) => (cur ? false : cur));
  }, [justCreated]);

  const toggleExpanded = () => {
    if (selectMode) {
      onToggleSelect?.();
      return;
    }
    setIsExpanded((cur) => {
      const next = !cur;
      if (!next) onCollapseJustCreated?.();
      return next;
    });
  };

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
  // PENDING always means "already auto-queued, worker hasn't picked it up
  // yet" (create() always auto-runs - see tasks.controller.ts), never
  // "hasn't been run." A PENDING task that's genuinely stuck (never reached
  // the queue) gets converted to FAILED by the backend's stale task reaper,
  // so FAILED is the only state that actually needs a manual retry.
  const canRun = current.status === 'FAILED';
  const isTerminal = isTerminalStatus(current.status);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        className="px-5 py-3.5 hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors group focus:outline-none"
      >
        <div className="flex sm:grid sm:grid-cols-[2fr_1fr_1fr_0.6fr] items-center text-sm mb-2 gap-2">
          <span className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-2 min-w-0 flex-1">
            {selectMode ? (
              <span
                aria-hidden="true"
                className={`h-3.5 w-3.5 rounded shrink-0 flex items-center justify-center ring-1 transition-colors ${
                  selected ? 'bg-blue-600 ring-blue-600' : 'ring-gray-300 dark:ring-gray-600'
                }`}
              >
                {selected && (
                  <svg viewBox="0 0 20 20" fill="none" className="h-2.5 w-2.5">
                    <path d="M4.5 10.5l3.5 3.5 7-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className={`h-3.5 w-3.5 text-gray-500 dark:text-gray-400 shrink-0 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              >
                <path d="M7 5l6 5-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span className="truncate">{task.title}</span>
            {task.createdAt && (
              <span className="hidden sm:inline text-[10px] font-mono text-gray-300 dark:text-gray-600 shrink-0">{relativeTime(task.createdAt)}</span>
            )}
          </span>
          <span className="hidden sm:inline text-gray-500 dark:text-gray-400 font-mono text-xs">
            {OPERATION_LABELS[task.operationType] ?? task.operationType}
          </span>
          <span><StatusBadge status={current.status} /></span>
          <span className="text-right shrink-0 flex items-center justify-end gap-1.5">
            {!selectMode && (
              <>
                {canRun && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPollingEnabled(true);
                      onRun();
                    }}
                    className="text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
                  >
                    Retry →
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
                      ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 ring-1 ring-red-200 dark:ring-red-900 hover:bg-red-200 dark:hover:bg-red-950 px-2.5 py-1'
                      : 'p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
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
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <TaskProgress status={current.status} progress={current.progress} compact />
          </div>
          {!isTerminal && (
            <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600 tabular-nums shrink-0 w-8 text-right">
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
          <div className="px-5 pb-5 pt-1 bg-gray-100/60 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div className="pt-3 px-1 flex items-start justify-between gap-3">
              <div className="flex-1">
                {justCreated ? (
                  <TaskPipelineAnimation status={current.status} progress={current.progress} />
                ) : (
                  <TaskProgress status={current.status} progress={current.progress} />
                )}
              </div>
              <Link
                href={`/tasks/${task._id}`}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap"
              >
                View full page →
              </Link>
            </div>

            {/* Input + Result side by side */}
            <div className="grid md:grid-cols-2 gap-3 items-stretch">
              <div className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Input</p>
                <div className="rounded-lg bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 px-3.5 py-2.5 flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{current.inputText}</p>
                </div>
              </div>

              <div className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
                  {current.status === 'FAILED' ? 'Error' : 'Result'}
                </p>
                <TaskResultPanel status={current.status} result={current.result} errorMessage={current.errorMessage} />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Execution log</p>
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
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.12)] transition-shadow duration-200">
      <div className="flex items-center gap-1.5 mb-2">
        {dot && (
          <span className="relative flex h-1.5 w-1.5">
            {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
          </span>
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">{value}</p>
    </div>
  );
}