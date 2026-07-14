/**
 * components/TaskProgress.tsx
 * --------------------------------------------------------------------------
 * Step pipeline: Queued -> Processing -> Done (or Failed).
 * `compact` renders a thin inline strip for the collapsed row.
 * Full mode renders labeled steps for the expanded detail panel.
 */
import type { TaskStatus } from '@/types/task';

const STEP_ORDER: TaskStatus[] = ['PENDING', 'RUNNING', 'SUCCESS'];

function stepIndex(status: TaskStatus) {
  if (status === 'FAILED') return STEP_ORDER.indexOf('RUNNING'); // failed while processing
  return STEP_ORDER.indexOf(status);
}

export function TaskProgress({ status, compact = false }: { status: TaskStatus; compact?: boolean }) {
  const current = stepIndex(status);
  const failed = status === 'FAILED';

  if (compact) {
    const pct = status === 'PENDING' ? 8 : status === 'RUNNING' ? 55 : 100;
    return (
      <div className="h-1 w-full rounded-full bg-[#F1EFFA] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            failed ? 'bg-red-400' : status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-brand-500'
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
                    ? 'bg-brand-600 ring-brand-100 text-white animate-pulse'
                    : 'bg-white ring-[#E6E1F5] text-[#B3ADC9]'
                }`}
              >
                {isFailedStep ? '!' : isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isFailedStep ? 'text-red-600' : isDone || isActive ? 'text-[#1A1325]' : 'text-[#B3ADC9]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 mb-4 rounded-full overflow-hidden bg-[#EDE9F7]">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    isFailedStep ? 'bg-red-400 w-full' : i < current ? 'bg-emerald-400 w-full' : 'w-0 bg-brand-400'
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