/**
 * app/layout.tsx
 * --------------------------------------------------------------------------
 * Root layout: wraps the whole app in the React Query provider so any page
 * or component can use useQuery/useMutation without extra setup.
 */
import type { Metadata } from 'next';
import { AppQueryProvider } from '@/lib/queryClient';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Task Processing Platform',
  description: 'Create, run, and monitor asynchronous AI processing tasks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppQueryProvider>{children}</AppQueryProvider>
      </body>
    </html>
  );
}
