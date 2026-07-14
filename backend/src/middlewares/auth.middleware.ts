/**
 * middlewares/auth.middleware.ts
 * --------------------------------------------------------------------------
 * Verifies the `Authorization: Bearer <token>` header on protected routes
 * and attaches the decoded user identity to `req.user` for downstream
 * controllers/services to use (e.g. to scope task queries to the owner).
 */
import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../exceptions/AppError';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
