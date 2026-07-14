/**
 * components/StatusBadge.tsx
 * --------------------------------------------------------------------------
 * Small pill with a status dot. RUNNING pulses; SUCCESS/FAILED are solid.
 */
import type { TaskStatus } from '@/types/task';

type StatusConfig = { label: string; text: string; bg: string; ring: string; dot: string; pulse?: boolean };

const CONFIG: Record<TaskStatus, StatusConfig> = {
  PENDING: {
    label: 'Queued',
    text: 'text-gray-600 dark:text-gray-300',
    bg: 'bg-gray-100 dark:bg-gray-800',
    ring: 'ring-gray-200 dark:ring-gray-700',
    dot: 'bg-gray-400',
  },
  RUNNING: {
    label: 'Processing',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    ring: 'ring-blue-200 dark:ring-blue-900',
    dot: 'bg-blue-500',
    pulse: true,
  },
  SUCCESS: {
    label: 'Complete',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    ring: 'ring-emerald-200 dark:ring-emerald-900',
    dot: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Failed',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    ring: 'ring-red-200 dark:ring-red-900',
    dot: 'bg-red-500',
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const c = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ${c.bg} ${c.text} ${c.ring}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {c.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${c.dot}`} />
      </span>
      {c.label}
    </span>
  );
}