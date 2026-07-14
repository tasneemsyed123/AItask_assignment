/**
 * utils/accountLockout.ts
 * --------------------------------------------------------------------------
 * Per-account (email-keyed, IP-independent) brute-force guard. This is
 * deliberately separate from the IP-based/composite rate limiters in
 * rateLimit.middleware.ts: those key on IP (or IP+email), so an attacker who
 * rotates source IPs against one fixed victim email resets that budget on
 * every request. This module keys purely on email, so rotating IPs doesn't
 * help - after MAX_FAILED_ATTEMPTS failures on one account inside the
 * window, that account is locked regardless of where the requests come from.
 */
import { redisClient } from '../config/redis';

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

function lockoutKey(email: string): string {
  return `login-fail:${email.toLowerCase()}`;
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const count = await redisClient.get(lockoutKey(email));
  return count !== null && Number(count) >= MAX_FAILED_ATTEMPTS;
}

export async function recordFailedLogin(email: string): Promise<void> {
  const key = lockoutKey(email);
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }
}

export async function clearFailedLogins(email: string): Promise<void> {
  await redisClient.del(lockoutKey(email));
}
