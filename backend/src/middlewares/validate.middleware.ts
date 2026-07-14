/**
 * middlewares/validate.middleware.ts
 * --------------------------------------------------------------------------
 * Generic Zod-schema-driven request validator. Each route supplies its own
 * Zod schema (see each module's own ".schema.ts" file); this middleware runs it against
 * req.body and throws a ValidationError with a readable message on failure,
 * keeping validation logic out of controllers entirely.
 */
import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../exceptions/AppError';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new ValidationError(`${firstIssue.path.join('.')}: ${firstIssue.message}`);
    }
    req.body = result.data;
    next();
  };
}
