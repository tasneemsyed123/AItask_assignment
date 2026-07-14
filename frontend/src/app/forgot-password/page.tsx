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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#EEF3FC] via-[#F5F8FE] to-[#FAFBFF] dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-[420px] md:max-w-[460px]">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-blue-600 tracking-tight leading-none">
            AI TASK MANAGER
          </h1>
          <p className="text-sm md:text-base text-[#6B7280] dark:text-gray-400 mt-2.5">
            Task Management | by Tasneem Syed
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] border border-[#E7ECF6] dark:border-gray-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

          <div className="px-6 pt-7 pb-7 sm:px-8 sm:pt-8 sm:pb-8 md:px-10 md:pt-10 md:pb-10">
            {sent ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16v12H4z"/>
                    <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base md:text-lg font-semibold text-[#111827] dark:text-gray-100 mb-1.5">Check your inbox</p>
                <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-6">
                  If an account exists for <span className="font-medium text-[#374151] dark:text-gray-300">{email}</span>, a reset link has been sent.
                </p>
                <Link href="/login" className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors inline-flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-xl font-semibold text-[#111827] dark:text-gray-100 tracking-tight leading-tight mb-1">Reset your password</h2>
                <p className="text-xs md:text-sm text-[#6B7280] dark:text-gray-400 mb-6 md:mb-7">
                  Enter your account email and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">Email address</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-gray-500">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 6h16v12H4z"/>
                          <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-3.5 py-2.5 md:py-3 rounded-lg border border-[#E5E9F2] dark:border-gray-700 bg-[#FAFBFF] dark:bg-gray-800 text-sm md:text-[15px] text-[#111827] dark:text-gray-100 placeholder:text-[#9CA3AF] dark:placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/12 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg py-2.5 md:py-3.5 text-sm md:text-[15px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        Sending…
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </button>

                  <p className="text-xs md:text-sm text-[#6B7280] dark:text-gray-400 text-center">
                    <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors inline-flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back to sign in
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}