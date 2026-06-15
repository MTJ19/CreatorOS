import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { SessionProvider } from 'next-auth/react';
import { AppLayoutWrapper } from './app-layout-wrapper';
import { GlowBackground } from '@/components/ui/glow-background';
import { ToastProvider } from '@/components/ui/toast';
import { auth } from '@/auth';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'CreatorOS — AI Creator Deal Management',
    template: '%s | CreatorOS',
  },
  description:
    'The AI-powered platform for creators to manage deals, analyze contracts, track performance, and handle invoicing — all in one place.',
  keywords: [
    'creator management',
    'influencer deals',
    'brand deals',
    'contract analysis',
    'creator invoicing',
    'rate intelligence',
  ],
  authors: [{ name: 'CreatorOS' }],
  creator: 'CreatorOS',
  // eslint-disable-next-line @typescript-eslint/dot-notation
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'CreatorOS — AI Creator Deal Management',
    description: 'AI-powered creator deal management platform',
    siteName: 'CreatorOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreatorOS',
    description: 'AI-powered creator deal management platform',
  },
  robots: { index: false, follow: false }, // Private app
};

export const viewport: Viewport = {
  themeColor: '#0D0F18',
  colorScheme: 'dark',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionProvider session={session}>
          <ToastProvider>
            <GlowBackground
              glowPosition="top-left"
              intensity="subtle"
              animated={false}
              className="min-h-screen"
            >
              <AppLayoutWrapper>{children}</AppLayoutWrapper>
            </GlowBackground>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
