/**
 * app/dashboard/page.tsx
 * --------------------------------------------------------------------------
 * Task Management dashboard. Rows expand inline (accordion, keyboard
 * accessible) to reveal the execution pipeline, log stream, and result.
 *
 * NOTE: OperationType values in types/task.ts are still a placeholder
 * (UPPERCASE / LOWERCASE / REVERSE_STRING / WORD_COUNT) pending confirmation
 * against your backend's actual enum/validator — see prior discussion.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTaskList, useRunTask } from '@/hooks/useTasks';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskProgress } from '@/components/TaskProgress';
import { TaskLogPanel } from '@/components/TaskLogPanel';
import { TaskResultPanel } from '@/components/TaskResultPanel';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { useToast } from '@/components/Toast';
import { OPERATION_LABELS, type Task, type TaskStatus } from '@/types/task';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading: isLoadingTasks, isFetching } = useTaskList(statusFilter);
  const runTask = useRunTask();
  const showToast = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  const tasks = data?.tasks ?? [];
  const counts = {
    total: data?.total ?? 0,
    queued: tasks.filter((t) => t.status === 'PENDING').length,
    running: tasks.filter((t) => t.status === 'RUNNING').length,
    success: tasks.filter((t) => t.status === 'SUCCESS').length,
  };

  const toggleExpanded = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F8F6FD] to-[#F5F3FC] relative overflow-hidden">
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* ambient glow, purely decorative */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-brand-400/5 blur-3xl" />

      <div className="max-w-5xl mx-auto px-6 py-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-[#1A1325] tracking-tight">Your tasks</h1>
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-[#9CA3AF]">
                <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isFetching ? 'animate-ping' : ''}`} />
                live
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">Signed in as {user?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                logout();
                showToast('info', 'Signed out');
              }}
              className="px-4 py-2 text-sm rounded-lg border border-[#E6E1F5] text-[#1A1325] hover:bg-white transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all duration-200 hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0"
            >
              + New task
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Queued" value={counts.queued} dot="bg-[#8B7FD4]" />
          <StatCard label="Processing" value={counts.running} dot="bg-brand-500" pulse />
          <StatCard label="Complete" value={counts.success} dot="bg-emerald-500" />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-4 sticky top-4 z-10">
          <div className="flex gap-1.5 bg-white/70 backdrop-blur-md rounded-lg p-1 ring-1 ring-[#E6E1F5]/70">
            {FILTERS.map((f) => {
              const active = (statusFilter ?? 'ALL') === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value === 'ALL' ? undefined : (f.value as TaskStatus))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    active ? 'bg-brand-600 text-white shadow-glow' : 'text-[#6B7280] hover:bg-white'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task list */}
        <div className="bg-white border border-[#E6E1F5] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(26,19,37,0.04)]">
          <div className="grid grid-cols-[2fr_1fr_1fr_0.6fr] px-5 py-3 text-[11px] font-mono uppercase tracking-wide text-[#9CA3AF] border-b border-[#E6E1F5]">
            <span>Title</span>
            <span>Operation</span>
            <span>Status</span>
            <span></span>
          </div>

          {isLoadingTasks && (
            <div className="p-10 flex flex-col items-center gap-2 text-sm text-[#9CA3AF]">
              <span className="h-5 w-5 rounded-full border-2 border-[#E6E1F5] border-t-brand-500 animate-spin" />
              Loading tasks…
            </div>
          )}

          {!isLoadingTasks && tasks.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-[#1A1325] mb-1">Start your first task</p>
              <p className="text-sm text-[#9CA3AF] mb-4">Create a task and run it through the queue.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-all duration-200 hover:shadow-glow"
              >
                Create task
              </button>
            </div>
          )}

          {tasks.map((task, i) => (
            <TaskRow
              key={task._id}
              task={task}
              index={i}
              isExpanded={expandedId === task._id}
              onToggle={() => toggleExpanded(task._id)}
              onRun={() => {
                showToast('info', `Queuing "${task.title}"…`);
                runTask.mutate(task._id, {
                  onSuccess: () => showToast('success', `"${task.title}" queued — open it to watch progress`),
                  onError: () => showToast('error', `Could not queue "${task.title}"`),
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

function TaskRow({
  task,
  index,
  isExpanded,
  onToggle,
  onRun,
}: {
  task: Task;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRun: () => void;
}) {
  const canRun = task.status === 'PENDING' || task.status === 'FAILED';

  return (
    <div
      className="border-b border-[#F1F0F5] last:border-b-0 animate-[fadeInUp_0.35s_ease-out_backwards]"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="px-5 py-3.5 hover:bg-[#FAFAFE] cursor-pointer transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-inset"
      >
        <div className="grid grid-cols-[2fr_1fr_1fr_0.6fr] items-center text-sm mb-2">
          <span className="text-[#1A1325] font-medium flex items-center gap-2 min-w-0">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={`h-3.5 w-3.5 text-[#B3ADC9] shrink-0 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <path d="M7 5l6 5-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="truncate">{task.title}</span>
            {task.createdAt && (
              <span className="text-[10px] font-mono text-[#B3ADC9] shrink-0">{relativeTime(task.createdAt)}</span>
            )}
          </span>
          <span className="text-[#6B7280] font-mono text-xs">
            {OPERATION_LABELS[task.operationType] ?? task.operationType}
          </span>
          <span><StatusBadge status={task.status} /></span>
          <span className="text-right">
            {canRun && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRun();
                }}
                className="text-xs font-medium text-brand-700 bg-brand-500/10 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-500/20"
              >
                Run →
              </button>
            )}
          </span>
        </div>
        <TaskProgress status={task.status} compact />
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 bg-[#FCFBFF] border-t border-[#F1F0F5] space-y-4">
            <div className="pt-3 px-1">
              <TaskProgress status={task.status} />
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase tracking-wide text-[#9CA3AF] mb-1.5">Input</p>
              <p className="text-sm text-[#4B4560] bg-white rounded-lg ring-1 ring-[#E6E1F5] px-3.5 py-2.5 line-clamp-3">
                {task.inputText}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase tracking-wide text-[#9CA3AF] mb-1.5">Execution log</p>
              <TaskLogPanel status={task.status} logs={task.logs} />
            </div>

            {(task.status === 'SUCCESS' || task.status === 'FAILED') && (
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wide text-[#9CA3AF] mb-1.5">
                  {task.status === 'SUCCESS' ? 'Result' : 'Error'}
                </p>
                <TaskResultPanel status={task.status} result={task.result} errorMessage={task.errorMessage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, dot, pulse }: { label: string; value: number; dot?: string; pulse?: boolean }) {
  return (
    <div className="bg-white border border-[#E6E1F5] rounded-xl p-4 transition-all duration-200 hover:shadow-[0_4px_20px_-8px_rgba(107,60,200,0.25)] hover:-translate-y-0.5">
      <div className="flex items-center gap-1.5 mb-2">
        {dot && (
          <span className="relative flex h-1.5 w-1.5">
            {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
          </span>
        )}
        <p className="text-xs font-mono uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-[#1A1325] tracking-tight tabular-nums">{value}</p>
    </div>
  );
}