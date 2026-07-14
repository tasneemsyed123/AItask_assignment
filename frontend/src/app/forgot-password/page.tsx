/**
 * app/forgot-password/page.tsx
 * --------------------------------------------------------------------------
 * Requests a password reset email. The backend always responds with the
 * same success message regardless of whether the email exists (prevents
 * account enumeration), so this page shows one generic confirmation state
 * rather than branching on "found" vs "not found".
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient, getApiErrorMessage } from '@/lib/apiClient';
import { useToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
      showToast('success', 'If that email exists, a reset link is on its way');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFE] px-6">
      <div className="w-full max-w-sm bg-white border border-[#E6E1F5] rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[#1A1325] tracking-tight mb-1.5">Reset your password</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Enter your account email and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="text-center py-4">
            <p className="text-sm text-[#1A1325] font-medium mb-1">Check your inbox</p>
            <p className="text-sm text-[#6B7280] mb-6">
              If an account exists for <span className="font-medium">{email}</span>, a reset link has been sent.
            </p>
            <Link href="/login" className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1325] mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full border border-[#E6E1F5] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all duration-200"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-glow disabled:opacity-50"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-sm text-[#6B7280] text-center">
              <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
                ← Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
