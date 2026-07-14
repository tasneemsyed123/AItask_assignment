/**
 * components/TaskLogPanel.tsx
 * --------------------------------------------------------------------------
 * Clean, light execution-log panel (monospace lines on a soft gray card,
 * not a dark terminal). Falls back to generic "working on it" lines while
 * RUNNING if the backend hasn't sent real logs yet.
 */
import { useEffect, useRef, useState } from 'react';
import type { TaskLogEntry, TaskStatus } from '@/types/task';

const LEVEL_COLOR: Record<TaskLogEntry['level'], string> = {
  info: 'text-gray-600 dark:text-gray-400',
  warn: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  success: 'text-emerald-600 dark:text-emerald-400',
};

const FALLBACK_LINES = [
  'Connecting to task queue…',
  'Worker acquired lock on task',
  'Loading input payload',
  'Applying operation to input',
  'Finalizing output',
];

function useSimulatedTicker(active: boolean) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    if (!active) return;
    setLines([]);
    let i = 0;
    const id = setInterval(() => {
      setLines((prev) => (i < FALLBACK_LINES.length ? [...prev, FALLBACK_LINES[i++]] : prev));
      if (i >= FALLBACK_LINES.length) clearInterval(id);
    }, 900);
    return () => clearInterval(id);
  }, [active]);
  return lines;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return iso;
  }
}

export function TaskLogPanel({ status, logs }: { status: TaskStatus; logs?: TaskLogEntry[] }) {
  const hasRealLogs = !!logs && logs.length > 0;
  const simulated = useSimulatedTicker(!hasRealLogs && status === 'RUNNING');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs, simulated]);

  const isEmpty = !hasRealLogs && simulated.length === 0 && status === 'PENDING';

  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden h-full flex flex-col">
      <div className="px-3.5 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Execution log</span>
      </div>
      <div ref={scrollRef} className="px-3.5 py-3 flex-1 overflow-y-auto font-mono text-[12px] leading-relaxed space-y-1">
        {isEmpty && <p className="text-gray-400 dark:text-gray-500">Waiting in queue — logs appear once a worker picks this up.</p>}

        {hasRealLogs &&
          logs!.map((log, i) => (
            <div key={log.id ?? i} className="flex gap-2">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">{formatTime(log.timestamp)}</span>
              <span className={LEVEL_COLOR[log.level]}>{log.message}</span>
            </div>
          ))}

        {!hasRealLogs &&
          simulated.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">--:--:--</span>
              <span className="text-gray-600 dark:text-gray-400">{line}</span>
            </div>
          ))}
      </div>
    </div>
  );
}