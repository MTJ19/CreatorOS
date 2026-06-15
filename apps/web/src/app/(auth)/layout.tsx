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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      <GlowBackground glowPosition="center" intensity="medium" animated />

      {/* Logo */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2.5 group"
        aria-label="CreatorOS home"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-sm group-hover:shadow-glow transition-all duration-300">
          <Zap className="h-4 w-4 text-white" fill="currentColor" aria-hidden />
        </div>
        <span className="font-bold text-lg tracking-tight text-foreground">
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
