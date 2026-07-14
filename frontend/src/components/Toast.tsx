/**
 * components/Toast.tsx
 * --------------------------------------------------------------------------
 * Lightweight toast/notification system — clean white card, blue accent.
 */
'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastAction { label: string; onClick: () => void; }
interface ToastItem { id: number; type: ToastType; message: string; action?: ToastAction; }

const ToastContext = createContext<{ show: (type: ToastType, message: string, action?: ToastAction) => void } | null>(null);

const DOT: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((type: ToastType, message: string, action?: ToastAction) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slideIn flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-800 dark:text-gray-100"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[t.type]}`} />
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
                }}
                className="ml-1 shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline underline-offset-2"
              >
                {t.action.label}
              </button>
            )}
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