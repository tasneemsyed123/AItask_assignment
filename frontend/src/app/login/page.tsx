/**
 * app/login/page.tsx
 * --------------------------------------------------------------------------
 * Login screen. Includes a "Forgot password?" link wired to the real
 * forgot-password flow (email sent via Gmail SMTP - see
 * backend/src/utils/mailer.ts). No OAuth buttons - the assignment only
 * requires JWT-based auth.
 */
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    showToast('info', 'Signing in…');
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FAFAFE]">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#150F27] text-[#E4DFF7] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle, #E4DFF7 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-600 opacity-30 blur-[100px] animate-pulseGlow pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-brand-500 opacity-20 blur-[110px] pointer-events-none" />

        <div className="relative flex items-center gap-2.5 font-semibold text-base tracking-tight">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-glow">AI</div>
          Task Platform
        </div>

        <div className="relative">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight mb-4 max-w-md">
            Async work,<br />watched in real time.
          </h2>
          <p className="text-[#A79BC9] text-sm max-w-sm mb-10 leading-relaxed">
            Queue text-processing jobs, hand them to background workers, and follow
            every status change as it happens.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden max-w-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <span className="text-[11px] font-mono tracking-wide text-[#A79BC9]">TASK QUEUE</span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-brand-300">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                live
              </span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#C9C2E8]">TASK-2291</span>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-brand-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  queued
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#C9C2E8]">TASK-2287</span>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  processing
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#786F98]">TASK-2280</span>
                <span className="text-[11px] font-mono text-[#786F98]">done</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#786F98]">TASK-2276</span>
                <span className="text-[11px] font-mono text-[#786F98]">done</span>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-[#786F98]">© 2026 AI Task Platform</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-[26px] font-semibold text-[#1A1325] tracking-tight mb-1.5">Welcome back</h1>
          <p className="text-sm text-[#6B7280] mb-8">Sign in to manage your tasks</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1325] mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full border border-[#E6E1F5] rounded-lg px-3.5 py-2.5 text-sm text-[#1A1325] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all duration-200"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1A1325]">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                className="w-full border border-[#E6E1F5] rounded-lg px-3.5 py-2.5 text-sm text-[#1A1325] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-[#6B7280] text-center mt-6">
            No account? <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
