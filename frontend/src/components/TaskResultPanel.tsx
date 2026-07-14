/**
 * components/TaskResultPanel.tsx
 * --------------------------------------------------------------------------
 * Renders a SUCCESS result (pretty-printed if it parses as JSON) or a
 * FAILED error message. Includes copy-to-clipboard.
 */
'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';
import type { TaskStatus } from '@/types/task';

function tryPrettyJson(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return null;
  }
}

export function TaskResultPanel({
  status,
  result,
  errorMessage,
}: {
  status: TaskStatus;
  result?: string;
  errorMessage?: string;
}) {
  const [copied, setCopied] = useState(false);
  const showToast = useToast();

  if (status === 'FAILED') {
    return (
      <div className="rounded-lg bg-red-50 ring-1 ring-red-100 px-4 py-3 h-full">
        <p className="text-[11px] font-medium uppercase tracking-wide text-red-500 mb-1">Error</p>
        <p className="text-sm text-red-700">{errorMessage ?? 'The task failed and did not return a reason.'}</p>
      </div>
    );
  }

  if (status !== 'SUCCESS' || !result) {
    return (
      <div className="rounded-lg bg-gray-50 ring-1 ring-gray-200 h-full flex items-center justify-center px-4 py-3">
        <p className="text-sm text-gray-400">Result will appear here once the task completes</p>
      </div>
    );
  }

  const pretty = tryPrettyJson(result);
  const display = pretty ?? result;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    showToast('success', 'Result copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-lg bg-emerald-50/60 ring-1 ring-emerald-100 overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-100">
        <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">
          Result{pretty ? ' · json' : ''}
        </span>
        <button
          onClick={handleCopy}
          className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-[12.5px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words flex-1 overflow-y-auto font-mono">
        {display}
      </pre>
    </div>
  );
}