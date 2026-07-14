/**
 * components/Toast.tsx
 * --------------------------------------------------------------------------
 * Lightweight toast/notification system - dependency-free. Every important
 * action shows a visible toast, matching the app's dark purple design.
 */
'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; message: string; }

const ToastContext = createContext<{ show: (type: ToastType, message: string) => void } | null>(null);

const DOT: Record<ToastType, string> = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  info: 'bg-brand-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slideIn flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-glow border border-white/10 bg-[#150F27] text-sm font-medium text-[#E4DFF7]"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[t.type]}`} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.show;
}
