'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getApiErrorMessage } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      login(data.data.accessToken, data.data.user);
      showToast('success', `Welcome back, ${data.data.user.name}`);
      router.push('/dashboard');
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
            Task Management  | by Tasneem Syed
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_8px_30px_rgba(30,64,175,0.08)] border border-[#E7ECF6] dark:border-gray-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

          <div className="px-6 pt-7 pb-7 sm:px-8 sm:pt-8 sm:pb-8 md:px-10 md:pt-10 md:pb-10">
            <h2 className="text-lg md:text-xl font-semibold text-[#111827] dark:text-gray-100 tracking-tight leading-tight mb-1">Welcome back</h2>
            <p className="text-xs md:text-sm text-[#6B7280] dark:text-gray-400 mb-6 md:mb-7">Sign in to your dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-medium text-[#374151] dark:text-gray-300 mb-1.5">Email address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-gray-500">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>
                      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round"/>
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs md:text-sm font-medium text-[#374151] dark:text-gray-300">Password</label>
                  <Link href="/forgot-password" className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-gray-500">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="4" y="10" width="16" height="10" rx="2"/>
                      <path d="M8 10V7a4 4 0 1 1 8 0v3" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 md:py-3 rounded-lg border border-[#E5E9F2] dark:border-gray-700 bg-[#FAFBFF] dark:bg-gray-800 text-sm md:text-[15px] text-[#111827] dark:text-gray-100 placeholder:text-[#9CA3AF] dark:placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/12 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-gray-500 hover:text-[#6B7280] dark:text-gray-400 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.5A9.4 9.4 0 0 1 12 5c5 0 9 4 10 7-.5 1.4-1.4 2.9-2.6 4.1M6.6 6.6C4.6 8 3.2 9.9 2 12c1.4 3.5 5.5 7 10 7 1.3 0 2.5-.2 3.7-.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs md:text-sm text-[#6B7280] dark:text-gray-400 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D1D5DB] dark:border-gray-600 dark:bg-gray-800 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />
                Remember me on this device
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg py-2.5 md:py-3.5 text-sm md:text-[15px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-xs md:text-sm text-[#6B7280] dark:text-gray-400 text-center mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}