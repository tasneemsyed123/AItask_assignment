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

// A short/weak JWT_SECRET is crackable by brute force and would let an
// attacker forge access tokens for any user - fail fast at boot rather than
// let the server run with one. 32 chars is a floor, not a target; the
// README's generation command produces a much longer random value.
const MIN_JWT_SECRET_LENGTH = 32;

function requiredJwtSecret(): string {
  const value = required('JWT_SECRET');
  if (value.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is too short (${value.length} chars, minimum ${MIN_JWT_SECRET_LENGTH}). ` +
        'Generate a strong one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
    );
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

// A wildcard origin with credentials:true (see app.ts) is a browser-enforced
// no-op at best and a misconfiguration risk at worst - refuse to boot in
// production with one rather than silently allow any site to call the API
// with cookies/auth headers.
if (isProduction && corsOrigin === '*') {
  throw new Error('CORS_ORIGIN must not be "*" in production - set it to the exact frontend origin.');
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  mongoUri: required('MONGO_URI'),
  redisUrl: required('REDIS_URL'),
  jwtSecret: requiredJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  corsOrigin,
  staleTaskTimeoutMinutes: Number(process.env.STALE_TASK_TIMEOUT_MINUTES ?? 5),
  isProduction,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  gmailUser: process.env.GMAIL_USER ?? '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? '',
};
