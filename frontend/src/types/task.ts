/**
 * types/task.ts
 * --------------------------------------------------------------------------
 * NOTE: TaskStatus is unchanged from your existing enum so this doesn't
 * break your backend contract. "Queued" / "Processing" labels in the UI
 * map onto PENDING / RUNNING — see StatusBadge + TaskProgress.
 */

export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type OperationType = 'UPPERCASE' | 'LOWERCASE' | 'REVERSE_STRING' | 'WORD_COUNT';

export const OPERATION_LABELS: Record<OperationType, string> = {
  UPPERCASE: 'Uppercase',
  LOWERCASE: 'Lowercase',
  REVERSE_STRING: 'Reverse string',
  WORD_COUNT: 'Word count',
};

export const OPERATION_DESCRIPTIONS: Record<OperationType, string> = {
  UPPERCASE: 'Convert all characters to uppercase',
  LOWERCASE: 'Convert all characters to lowercase',
  REVERSE_STRING: 'Reverse the input string',
  WORD_COUNT: 'Return the total number of words',
};

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface TaskLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  level: LogLevel;
  message: string;
}

export interface Task {
  _id: string;
  title: string;
  operationType: OperationType;
  inputText: string;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  /** Populated by your backend as the task runs — via polling or a socket push. */
  logs?: TaskLogEntry[];
  /** Final output once status is SUCCESS. Can be plain text or a JSON string. */
  result?: string;
  /** Populated when status is FAILED. */
  errorMessage?: string;
}