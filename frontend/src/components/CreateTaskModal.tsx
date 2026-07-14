/**
 * components/CreateTaskModal.tsx
 * --------------------------------------------------------------------------
 * Task Title, Input Text, Operation Type -> creates + queues a task.
 */
'use client';

import { useState } from 'react';
import { useCreateTask } from '@/hooks/useTasks';
import { useToast } from '@/components/Toast';
import { OPERATION_LABELS, OPERATION_DESCRIPTIONS, type OperationType } from '@/types/task';

const OPERATIONS = Object.entries(OPERATION_LABELS) as [OperationType, string][];

export function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [operationType, setOperationType] = useState<OperationType>('UPPERCASE');
  const createTask = useCreateTask();
  const showToast = useToast();

  const isValid = title.trim().length > 0 && inputText.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid || createTask.isPending) return;
    createTask.mutate(
      { title: title.trim(), inputText: inputText.trim(), operationType },
      {
        onSuccess: () => {
          showToast('success', `"${title.trim()}" queued`);
          onClose();
        },
        onError: () => showToast('error', 'Could not create task — try again'),
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white ring-1 ring-gray-200 shadow-xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">New task</h2>
            <p className="text-xs text-gray-400 mt-0.5">Runs asynchronously — you can watch it move through the queue.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <span className="w-1 h-4 rounded-full bg-blue-500" />
              Task title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Task 1"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <span className="w-1 h-4 rounded-full bg-blue-500" />
              Operation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OPERATIONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOperationType(value)}
                  className={`px-3.5 py-2.5 rounded-lg border transition-all duration-150 text-left ${
                    operationType === value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`block text-xs font-medium ${
                      operationType === value ? 'text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="block text-[11px] text-gray-400 mt-0.5">{OPERATION_DESCRIPTIONS[value]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="w-1 h-4 rounded-full bg-blue-500" />
                Input text
              </label>
              <span className="text-[10px] font-mono text-gray-400">{inputText.length.toLocaleString()} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              placeholder="Paste or type the content this task should operate on…"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-colors resize-none font-mono"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || createTask.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium transition-all duration-200 hover:bg-blue-700 disabled:opacity-40"
          >
            {createTask.isPending ? 'Queuing…' : 'Create & run'}
          </button>
        </div>
      </div>
    </div>
  );
}