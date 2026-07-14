/**
 * modules/auth/auth.schema.ts
 * --------------------------------------------------------------------------
 * Zod request-validation schemas for the auth module. Kept separate from the
 * Mongoose model schema deliberately: this validates the SHAPE OF INCOMING
 * REQUESTS (e.g. password confirmation rules), the Mongoose schema validates
 * what's allowed to be PERSISTED - different concerns, different rules.
 */
import { z } from 'zod';

// Small blocklist of the most common breached/default passwords - not a
// substitute for a full corpus (e.g. zxcvbn / HaveIBeenPwned), but catches
// the trivial cases without pulling in a new dependency. Checked
// case-insensitively so "Password1" is caught too.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123',
  '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', 'letmein123',
  'welcome123', 'admin1234', 'iloveyou1',
  'abc123456', 'passw0rd', 'p@ssw0rd',
  'football1', 'baseball1', 'dragon123',
  'monkey123', 'sunshine1', 'princess1',
  'trustno1', 'superman1', 'starwars1',
  'changeme1', '11111111', '00000000',
]);

// Shared by registration and password reset - the same minimum bar should
// apply to both, since a weak reset password is just as exploitable as a
// weak registration password.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: 'This password is too common. Please choose a stronger one.',
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Must be a valid email'),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email'),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
