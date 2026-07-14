/**
 * components/TaskProgress.tsx
 * --------------------------------------------------------------------------
 * Simple horizontal progress bar (compact) or a clean 3-step tracker (full).
 */
import type { TaskStatus } from '@/types/task';

const STEP_ORDER: TaskStatus[] = ['PENDING', 'RUNNING', 'SUCCESS'];

function stepIndex(status: TaskStatus) {
  if (status === 'FAILED') return STEP_ORDER.indexOf('RUNNING');
  return STEP_ORDER.indexOf(status);
}

export function TaskProgress({
  status,
  progress = 0,
  compact = false,
}: {
  status: TaskStatus;
  progress?: number;
  compact?: boolean;
}) {
  const current = stepIndex(status);
  const failed = status === 'FAILED';

  if (compact) {
    const pct = status === 'SUCCESS' ? 100 : Math.min(100, Math.max(0, progress));
    return (
      <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            failed ? 'bg-red-400' : status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Queued' },
    { key: 'RUNNING', label: failed ? 'Failed' : 'Processing' },
    { key: 'SUCCESS', label: 'Done' },
  ];

  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const isDone = i < current || (i === current && status === 'SUCCESS');
        const isActive = i === current && status !== 'SUCCESS';
        const isFailedStep = failed && step.key === 'RUNNING';
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold ring-2 transition-colors duration-500 ${
                  isFailedStep
                    ? 'bg-red-500 ring-red-100 text-white'
                    : isDone
                    ? 'bg-emerald-500 ring-emerald-100 text-white'
                    : isActive
                    ? 'bg-blue-600 ring-blue-100 text-white'
                    : 'bg-white dark:bg-gray-800 ring-gray-200 dark:ring-gray-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isFailedStep ? '!' : isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isFailedStep
                    ? 'text-red-600 dark:text-red-400'
                    : isDone || isActive
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 mb-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    isFailedStep ? 'bg-red-400 w-full' : i < current ? 'bg-emerald-400 w-full' : 'w-0 bg-blue-400'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}