/**
 * modules/auth/auth.controller.ts
 * --------------------------------------------------------------------------
 * Thin HTTP layer: parses req/res, delegates to the service, and returns the
 * standard success envelope `{ success: true, data: ... }`. Contains NO
 * business logic - that all lives in auth.service.ts.
 */
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

const authService = new AuthService(new AuthRepository());

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, data: result });
  },

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body);
    // Always the same response regardless of whether the email exists.
    res.status(200).json({
      success: true,
      data: { message: 'If an account with that email exists, a reset link has been sent.' },
    });
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body);
    res.status(200).json({ success: true, data: { message: 'Password has been reset. You can now sign in.' } });
  },
};
