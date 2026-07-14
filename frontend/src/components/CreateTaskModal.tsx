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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1325]/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white ring-1 ring-[#E6E1F5] shadow-[0_20px_60px_-15px_rgba(107,60,200,0.35)] overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-[#F1F0F5]">
          <h2 className="text-base font-semibold text-[#1A1325] tracking-tight">New AI task</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Runs asynchronously — you can watch it move through the queue.</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Task title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summarize Q3 support tickets"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E6E1F5] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Operation</label>
            <div className="space-y-1.5">
              {OPERATIONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOperationType(value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border transition-all duration-150 text-left flex items-center justify-between gap-3 ${
                    operationType === value
                      ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/20'
                      : 'border-[#E6E1F5] hover:bg-[#FAFAFE]'
                  }`}
                >
                  <span>
                    <span
                      className={`block text-xs font-medium ${
                        operationType === value ? 'text-brand-700' : 'text-[#1A1325]'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="block text-[11px] text-[#9CA3AF] mt-0.5">{OPERATION_DESCRIPTIONS[value]}</span>
                  </span>
                  <span
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      operationType === value ? 'border-brand-500' : 'border-[#D9D4EC]'
                    }`}
                  >
                    {operationType === value && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#6B7280]">Input text</label>
              <span className="text-[10px] font-mono text-[#B3ADC9]">{inputText.length.toLocaleString()} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              placeholder="Paste or type the content this task should operate on…"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#E6E1F5] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors resize-none font-mono"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#F1F0F5] flex justify-end gap-2 bg-[#FAFAFE]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-[#6B7280] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || createTask.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white font-medium transition-all duration-200 hover:bg-brand-700 hover:shadow-glow disabled:opacity-40 disabled:hover:shadow-none disabled:hover:bg-brand-600"
          >
            {createTask.isPending ? 'Queuing…' : 'Create & run'}
          </button>
        </div>
      </div>
    </div>
  );
}