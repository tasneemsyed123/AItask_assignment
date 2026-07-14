/**
 * utils/logger.ts
 * --------------------------------------------------------------------------
 * Centralized structured logger (Winston). Logs go to BOTH the console
 * (for the terminal you're watching) AND a file at <project-root>/logs/
 * backend.log, so you can debug from one place instead of scrolling
 * terminal history. See scripts/merge-logs.js at the project root for a
 * tool that combines this with worker.log into one live interleaved view.
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// Resolves to <project-root>/logs regardless of whether this runs from
// src/ (tsx) or dist/ (compiled) - both are two directories under backend/,
// which is one directory under the project root.
const LOGS_DIR = path.resolve(__dirname, '../../../logs');
fs.mkdirSync(LOGS_DIR, { recursive: true });

export const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'ai-task-platform-backend' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(LOGS_DIR, 'backend.log') }),
  ],
});
