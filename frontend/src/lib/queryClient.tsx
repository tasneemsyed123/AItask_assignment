/**
 * lib/queryClient.tsx
 * --------------------------------------------------------------------------
 * React Query provider + Toast provider, both wrapped here since every page
 * needs both. `refetchOnWindowFocus: false` avoids surprise re-fetches while
 * reading task logs; polling for in-progress tasks is handled explicitly by
 * useTaskPolling instead.
 */
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { ToastProvider } from '@/components/Toast';

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
