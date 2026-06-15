'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { TopNav } from '@/components/ui/top-nav';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith('/portal');

  if (isPortal) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen w-full">
        {children}
      </main>
    );
  }

  return (
    <>
      {/* Top Navigation */}
      <TopNav />

      {/* Main content — offset for fixed TopNav */}
      <main
        className="mx-auto max-w-screen-2xl px-4 pb-8 pt-24 lg:px-6 lg:pt-24"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
    </>
  );
}
