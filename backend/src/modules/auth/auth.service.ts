/**
 * modules/auth/auth.service.ts
 * --------------------------------------------------------------------------
 * Business rules for authentication:
 *  - registration: email uniqueness, password hashing
 *  - login: credential verification, access token issuance
 *
 * Depends on AuthRepository via constructor injection (manual DI - no
 * framework needed at this scale) so it can be unit tested with a mock
 * repository with zero database involved.
 */
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import { sendPasswordResetEmail } from '../../utils/mailer';
import { isAccountLocked, recordFailedLogin, clearFailedLogins } from '../../utils/accountLockout';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError } from '../../exceptions/AppError';
import type { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export interface AuthResult {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.authRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
    return {
      accessToken,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    // Account lockout is keyed purely on email (not IP), so an attacker
    // rotating source IPs against one fixed victim account still gets
    // locked out - unlike the IP/IP+email rate limiters in
    // rateLimit.middleware.ts, which rotating IPs can dodge on their own.
    // Same generic message as any other failed login - a locked account is
    // never distinguishable from a wrong password.
    if (await isAccountLocked(input.email)) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = await this.authRepository.findByEmail(input.email);
    // Deliberately identical error message for "no such user" and "wrong
    // password" - never reveal which one it was, to avoid user enumeration.
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      await recordFailedLogin(input.email);
      throw new UnauthorizedError('Invalid email or password');
    }

    await clearFailedLogins(input.email);

    const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
    return {
      accessToken,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    };
  }

  /**
   * Always returns successfully regardless of whether the email exists -
   * never reveal account existence through this endpoint (a classic user-
   * enumeration vector). If the account exists, generates a random raw
   * token, stores only its hash + a 1-hour expiry, and emails the raw token
   * as a link. The raw token itself is NEVER persisted anywhere.
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user) return; // silently succeed - don't reveal account existence

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.authRepository.setResetToken(user._id.toString(), tokenHash, expires);

    const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const user = await this.authRepository.findByEmailWithValidResetToken(input.email, tokenHash);
    if (!user) {
      throw new UnauthorizedError('This reset link is invalid or has expired');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await this.authRepository.updatePasswordAndClearResetToken(user._id.toString(), passwordHash);
  }
}
