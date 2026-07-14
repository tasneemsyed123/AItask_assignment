/**
 * utils/jwt.ts
 * --------------------------------------------------------------------------
 * Thin wrapper around jsonwebtoken so the rest of the app never imports the
 * library directly (single point of change if we swap algorithms/libraries).
 *
 * Phase 1 decision: ACCESS TOKEN ONLY (no refresh token), per project scope.
 * The token carries the minimum claims needed to identify the user - never
 * put sensitive data (password hash, etc.) in a JWT payload since it's only
 * base64-encoded, not encrypted.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  // Throws JsonWebTokenError / TokenExpiredError on invalid/expired tokens -
  // caught by the auth middleware and converted into an UnauthorizedError.
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
