/**
 * components/TaskPipelineAnimation.tsx
 * --------------------------------------------------------------------------
 * Richer 5-node pipeline view shown for a task right after it's created:
 * Submitted -> Redis (queue) -> Worker -> MongoDB (persist) -> Complete.
 * "Connected" badges fade in on the Redis/MongoDB nodes once the task's
 * status implies that hop actually happened, and a small dot travels along
 * whichever segment is currently in flight.
 */
import type { TaskStatus } from '@/types/task';

type NodeState = 'done' | 'active' | 'pending' | 'error';

function computeStates(status: TaskStatus): NodeState[] {
  switch (status) {
    case 'PENDING':
      return ['done', 'active', 'pending', 'pending', 'pending'];
    case 'RUNNING':
      return ['done', 'done', 'active', 'active', 'pending'];
    case 'SUCCESS':
      return ['done', 'done', 'done', 'done', 'done'];
    case 'FAILED':
      return ['done', 'done', 'error', 'pending', 'error'];
  }
}

const NODES: { key: string; label: string; sublabel?: string }[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'redis', label: 'Queued', sublabel: 'Redis' },
  { key: 'worker', label: 'Processing', sublabel: 'Worker' },
  { key: 'mongo', label: 'Persisted', sublabel: 'MongoDB' },
  { key: 'complete', label: 'Complete' },
];

const STATE_RING: Record<NodeState, string> = {
  done: 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/40 text-white',
  active: 'bg-blue-600 ring-blue-100 dark:ring-blue-900/40 text-white',
  pending: 'bg-white dark:bg-gray-800 ring-gray-200 dark:ring-gray-700 text-gray-400 dark:text-gray-500',
  error: 'bg-red-500 ring-red-100 dark:ring-red-900/40 text-white',
};

function NodeIcon({ nodeKey, state }: { nodeKey: string; state: NodeState }) {
  if (state === 'error') return <span className="text-[11px] font-bold leading-none">!</span>;

  if (state === 'done' && nodeKey !== 'worker') {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
        <path d="M4.5 10.5l3.5 3.5 7-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  switch (nodeKey) {
    case 'submitted':
      return (
        <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'redis':
      return (
        <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
          <path d="M3 6.5l7-3 7 3-7 3-7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M3 10.5l7 3 7-3M3 8.5l7 3 7-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'worker':
      return (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-3 w-3 ${state === 'active' ? 'animate-spin' : ''}`}
          style={{ animationDuration: '1.6s' }}
        >
          <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M10 3.5v2M10 14.5v2M16.5 10h-2M5.5 10h-2M14.6 5.4l-1.4 1.4M6.8 13.2l-1.4 1.4M14.6 14.6l-1.4-1.4M6.8 6.8L5.4 5.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'mongo':
      return (
        <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
          <path
            d="M10 2.5c2.2 2.4 3.4 5 3.4 7.4 0 2.9-1.5 5.2-3.4 6.6-1.9-1.4-3.4-3.7-3.4-6.6 0-2.4 1.2-5 3.4-7.4z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M10 12.5V17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'complete':
      return <span className="h-1.5 w-1.5 rounded-full bg-current" />;
    default:
      return null;
  }
}

export function TaskPipelineAnimation({ status, progress = 0 }: { status: TaskStatus; progress?: number }) {
  const states = computeStates(status);
  const failed = status === 'FAILED';

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 px-4 py-4 animate-scaleIn">
      <div className="flex items-center w-full">
        {NODES.map((node, i) => {
          const state = states[i];
          const showConnected = (node.key === 'redis' || node.key === 'mongo') && (state === 'done' || state === 'active');

          return (
            <div key={node.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`relative h-7 w-7 rounded-full flex items-center justify-center ring-2 transition-colors duration-500 ${STATE_RING[state]}`}
                >
                  {state === 'active' && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40 animate-ping" />
                  )}
                  <NodeIcon nodeKey={node.key} state={state} />
                </div>
                <div className="flex flex-col items-center h-7">
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap ${
                      state === 'pending' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {failed && node.key === 'worker' ? 'Failed' : node.label}
                  </span>
                  {node.sublabel && (
                    <span
                      className={`text-[9px] font-mono flex items-center gap-1 transition-opacity duration-500 ${
                        showConnected ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <span className={`h-1 w-1 rounded-full ${state === 'active' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
                      <span className="text-gray-400 dark:text-gray-500">
                        {state === 'active' ? `${node.sublabel} · syncing` : `${node.sublabel} · connected`}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {i < NODES.length - 1 && (
                <div className="relative flex-1 h-[2px] mx-1.5 mb-6 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${
                      state === 'error'
                        ? 'bg-red-400 w-full'
                        : state === 'done'
                        ? 'bg-emerald-400 w-full'
                        : state === 'active'
                        ? 'bg-blue-400 w-1/2'
                        : 'w-0'
                    }`}
                  />
                  {state === 'active' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_2px_rgba(59,130,246,0.5)] animate-flowDot" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {status === 'RUNNING' && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-center font-mono">
          worker processing… {Math.min(100, Math.max(0, progress))}%
        </p>
      )}
    </div>
  );
}
