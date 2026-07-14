/**
 * components/TaskLogPanel.tsx
 * --------------------------------------------------------------------------
 * Dark terminal-style panel for execution logs.
 *
 * If the task has no `logs` from the backend yet and is RUNNING, this shows
 * a small set of generic "working on it" lines with a blinking cursor so the
 * async nature is visible immediately, rather than a blank box. Swap
 * `useSimulatedTicker` out once your API streams real log lines (SSE /
 * websocket / poll) — real logs always take priority when present.
 */
import { useEffect, useRef, useState } from 'react';
import type { TaskLogEntry, TaskStatus } from '@/types/task';

const LEVEL_COLOR: Record<TaskLogEntry['level'], string> = {
  info: 'text-[#9CA9C7]',
  warn: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
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

  const showCursor = status === 'RUNNING';
  const isEmpty = !hasRealLogs && simulated.length === 0 && status === 'PENDING';

  return (
    <div className="rounded-xl bg-[#120C1F] ring-1 ring-[#2A1F42] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#2A1F42]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3A2E58]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3A2E58]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3A2E58]" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wide text-[#6B6485]">execution log</span>
      </div>
      <div ref={scrollRef} className="px-3.5 py-3 max-h-48 overflow-y-auto font-mono text-[12px] leading-relaxed">
        {isEmpty && <p className="text-[#4E4670]">Waiting in queue — logs will appear once a worker picks this up.</p>}

        {hasRealLogs &&
          logs!.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-[#4E4670] shrink-0">{formatTime(log.timestamp)}</span>
              <span className={LEVEL_COLOR[log.level]}>{log.message}</span>
            </div>
          ))}

        {!hasRealLogs &&
          simulated.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[#4E4670] shrink-0">--:--:--</span>
              <span className="text-[#9CA9C7]">{line}</span>
            </div>
          ))}

        {showCursor && (
          <span className="inline-block w-1.5 h-3.5 bg-brand-400 ml-6 align-middle animate-pulse" />
        )}
      </div>
    </div>
  );
}