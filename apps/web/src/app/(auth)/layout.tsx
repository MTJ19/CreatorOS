import type { Metadata } from 'next';
import { GlowBackground } from '@/components/ui/glow-background';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In — CreatorOS',
  description: 'Sign in to your CreatorOS account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <GlowBackground glowPosition="center" intensity="medium" animated />

      {/* Logo */}
      <Link
        href="/"
        className="group absolute left-6 top-6 flex items-center gap-2.5"
        aria-label="CreatorOS home"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-sm transition-all duration-300 group-hover:shadow-glow">
          <Zap className="h-4 w-4 text-white" fill="currentColor" aria-hidden />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          Creator<span className="gradient-text">OS</span>
        </span>
      </Link>

      {/* Main content */}
      <main className="w-full max-w-md px-4">{children}</main>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-xs text-foreground-subtle">
        © {new Date().getFullYear()} CreatorOS. All rights reserved.
      </footer>
    </div>
  );
}
