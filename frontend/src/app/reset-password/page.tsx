/**
 * app/reset-password/page.tsx
 * --------------------------------------------------------------------------
 * Landing page for the link emailed by forgot-password. Reads `token` and
 * `email` from the query string (put there by the backend's reset URL -
 * see backend/src/modules/auth/auth.service.ts) and submits a new password
 * against POST /auth/reset-password.
 */
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getApiErrorMessage } from '@/lib/apiClient';
import { useToast } from '@/components/Toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !email) {
      showToast('error', 'This reset link is missing required information.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, email, newPassword });
      showToast('success', 'Password reset. Please sign in.');
      router.push('/login');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFE] px-6">
        <div className="w-full max-w-sm bg-white border border-[#E6E1F5] rounded-2xl p-6 text-center">
          <p className="text-sm text-[#1A1325] font-medium mb-2">Invalid reset link</p>
          <p className="text-sm text-[#6B7280] mb-4">This link is missing required information. Request a new one below.</p>
          <Link href="/forgot-password" className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFE] px-6">
      <div className="w-full max-w-sm bg-white border border-[#E6E1F5] rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[#1A1325] tracking-tight mb-1.5">Set a new password</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Resetting password for <span className="font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1325] mb-1.5">New password</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full border border-[#E6E1F5] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all duration-200"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-glow disabled:opacity-50"
          >
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
