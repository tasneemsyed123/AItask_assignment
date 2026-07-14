/**
 * models/Task.model.ts
 * --------------------------------------------------------------------------
 * Task is the central domain entity. Execution logs are embedded
 * (append-only sub-array) rather than a separate collection: they are
 * always read together with the task, never queried independently, and
 * volume per task is small (a handful of entries) - so embedding avoids an
 * unnecessary join/lookup.
 *
 * Indexing strategy (see architecture doc for full rationale):
 *  - { userId: 1, createdAt: -1 } supports the dashboard's "my recent tasks"
 *    query with correct sort order for free.
 *  - { status: 1 } supports future ops/monitoring queries and the stale
 *    task reaper's scan for long-running tasks.
 */
import { Schema, model, Document, Types } from 'mongoose';

export type OperationType = 'UPPERCASE' | 'LOWERCASE' | 'REVERSE' | 'WORD_COUNT';
export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface TaskLogEntry {
  level: 'info' | 'error';
  message: string;
  timestamp: Date;
}

export interface TaskDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  inputText: string;
  operationType: OperationType;
  status: TaskStatus;
  progress: number;
  result: string | number | null;
  errorMessage: string | null;
  logs: TaskLogEntry[];
  queuedAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskLogSchema = new Schema<TaskLogEntry>(
  {
    level: { type: String, enum: ['info', 'error'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const taskSchema = new Schema<TaskDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    inputText: { type: String, required: true },
    operationType: {
      type: String,
      enum: ['UPPERCASE', 'LOWERCASE', 'REVERSE', 'WORD_COUNT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    result: { type: Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
    logs: { type: [taskLogSchema], default: [] },
    queuedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ status: 1 });

export const TaskModel = model<TaskDocument>('Task', taskSchema);
