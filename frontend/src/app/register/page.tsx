/**
 * app/register/page.tsx
 * --------------------------------------------------------------------------
 * Registration screen, matching the login page's purple/glow design exactly.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getApiErrorMessage } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const showToast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    showToast('info', 'Creating your account…');
    try {
      const { data } = await apiClient.post('/auth/register', { name, email, password });
      login(data.data.accessToken, data.data.user);
      showToast('success', `Account created. Welcome, ${data.data.user.name}`);
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
            Four operations,<br />one queue, full visibility.
          </h2>
          <p className="text-[#A79BC9] text-sm max-w-sm mb-10 leading-relaxed">
            Create an account and start running text-processing tasks through
            a real async pipeline - not a spinner that hides what's happening.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden max-w-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <span className="text-[11px] font-mono tracking-wide text-[#A79BC9]">OPERATIONS</span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                4 available
              </span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#C9C2E8]">UPPERCASE</span>
                <span className="text-[11px] font-mono text-[#786F98]">abc → ABC</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#C9C2E8]">LOWERCASE</span>
                <span className="text-[11px] font-mono text-[#786F98]">ABC → abc</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#C9C2E8]">REVERSE</span>
                <span className="text-[11px] font-mono text-[#786F98]">abc → cba</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-mono text-[#C9C2E8]">WORD_COUNT</span>
                <span className="text-[11px] font-mono text-[#786F98]">"a b c" → 3</span>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-[#786F98]">© 2026 AI Task Platform</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-[26px] font-semibold text-[#1A1325] tracking-tight mb-1.5">Create your account</h1>
          <p className="text-sm text-[#6B7280] mb-8">Start running AI processing tasks</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1325] mb-1.5">Name</label>
              <input
                required
                className="w-full border border-[#E6E1F5] rounded-lg px-3.5 py-2.5 text-sm text-[#1A1325] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all duration-200"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
              <label className="block text-sm font-medium text-[#1A1325] mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full border border-[#E6E1F5] rounded-lg px-3.5 py-2.5 text-sm text-[#1A1325] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 transition-all duration-200"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-[#6B7280] text-center mt-6">
            Already have an account? <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
