/**
 * app/layout.tsx
 * --------------------------------------------------------------------------
 * Root layout: wraps the whole app in the React Query provider so any page
 * or component can use useQuery/useMutation without extra setup.
 */
import type { Metadata } from 'next';
import Script from 'next/script';
import { AppQueryProvider } from '@/lib/queryClient';
import { ThemeProvider } from '@/lib/theme';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Task Processing Platform',
  description: 'Create, run, and monitor asynchronous AI processing tasks.',
};

// Sets the `dark` class on <html> before first paint, so there's no flash of
// the wrong theme while React hydrates. Must run before anything else -
// `beforeInteractive` is the only next/script strategy that guarantees that.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <AppQueryProvider>
          <ThemeProvider>
            <ThemeToggle />
            {children}
          </ThemeProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
