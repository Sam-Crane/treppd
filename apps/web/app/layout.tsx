import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider, TooltipProvider } from '@/components/ui';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';

// Inter is the primary UI face. Variable weight so we don't need to
// specify a static weight per element.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// JetBrains Mono for code, IDs, dates and anywhere fixed-width reads better.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// Retained: Geist is still referenced in some existing components during
// the redesign transition; we keep it loaded so those don't break.
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Treppd - Navigate Germany. Step by step.',
  description:
    'AI-powered bureaucracy co-pilot for immigrants in Germany. Personalised roadmaps, form guides, and document checklists.',
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Treppd',
    capable: true,
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafc' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes swaps the `class` attribute on
    // <html> before React hydrates, which React would otherwise flag.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            <ToastProvider>
              <QueryProvider>{children}</QueryProvider>
            </ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
