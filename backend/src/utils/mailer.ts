/**
 * utils/mailer.ts
 * --------------------------------------------------------------------------
 * Sends real emails via Gmail SMTP using nodemailer. Requires YOUR OWN
 * Gmail account + an "App Password" (NOT your regular Gmail password -
 * Gmail blocks plain-password SMTP once 2-Step Verification is on, which is
 * effectively mandatory now):
 *
 *   1. Turn on 2-Step Verification: https://myaccount.google.com/security
 *   2. Create an App Password: https://myaccount.google.com/apppasswords
 *      (choose "Mail" as the app) - copy the 16-character password shown
 *   3. Put your Gmail address in GMAIL_USER and that 16-char password in
 *      GMAIL_APP_PASSWORD in backend/.env
 *
 * If these are blank, sendPasswordResetEmail logs a warning and returns
 * without throwing - so the app still runs/builds fine before you've set
 * up Gmail, it just can't actually deliver the email yet.
 */
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

function isMailerConfigured(): boolean {
  return !!(env.gmailUser && env.gmailAppPassword);
}

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.gmailUser, pass: env.gmailAppPassword },
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<void> {
  if (!isMailerConfigured()) {
    logger.warn('Password reset email NOT sent - GMAIL_USER/GMAIL_APP_PASSWORD not configured', {
      toEmail,
    });
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"AI Task Platform" <${env.gmailUser}>`,
    to: toEmail,
    subject: 'Reset your password - AI Task Platform',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1A1325;">Reset your password</h2>
        <p style="color: #444;">We received a request to reset the password for your AI Task Platform account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            Reset password
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
  logger.info('Password reset email sent', { toEmail });
}
