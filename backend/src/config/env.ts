/**
 * config/env.ts
 * --------------------------------------------------------------------------
 * Single source of truth for environment configuration. Every other module
 * imports `env` from here instead of calling `process.env` directly, so:
 *  - we fail fast (at boot) if a required variable is missing
 *  - types are known everywhere (no `string | undefined` leaking into code)
 *  - there is exactly one place to look when adding a new config value
 */
import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: required('MONGO_URI'),
  redisUrl: required('REDIS_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  staleTaskTimeoutMinutes: Number(process.env.STALE_TASK_TIMEOUT_MINUTES ?? 5),
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  gmailUser: process.env.GMAIL_USER ?? '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? '',
};
