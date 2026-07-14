/**
 * types/task.ts
 * --------------------------------------------------------------------------
 * NOTE: TaskStatus is unchanged from your existing enum so this doesn't
 * break your backend contract. "Queued" / "Processing" labels in the UI
 * map onto PENDING / RUNNING — see StatusBadge + TaskProgress.
 *
 * OperationType now matches the backend's actual enum (tasks.schema.ts /
 * worker/app/operations) — it's 'REVERSE', not 'REVERSE_STRING'.
 */

export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type OperationType = 'UPPERCASE' | 'LOWERCASE' | 'REVERSE' | 'WORD_COUNT';

export const OPERATION_LABELS: Record<OperationType, string> = {
  UPPERCASE: 'Uppercase',
  LOWERCASE: 'Lowercase',
  REVERSE: 'Reverse string',
  WORD_COUNT: 'Word count',
};

export const OPERATION_DESCRIPTIONS: Record<OperationType, string> = {
  UPPERCASE: 'Convert all characters to uppercase',
  LOWERCASE: 'Convert all characters to lowercase',
  REVERSE: 'Reverse the input string',
  WORD_COUNT: 'Return the total number of words',
};

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface TaskLogEntry {
  // Log entries are embedded subdocuments on the backend ({ _id: false }),
  // so they never carry an id — index-based keys are used when rendering.
  id?: string;
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
  /** 0-100, updated by the worker as it processes chunks of inputText. */
  progress: number;
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