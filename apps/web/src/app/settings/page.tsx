'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowBackground } from '@/components/ui/glow-background';

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="relative animate-fade-in space-y-8 pb-16">
      <GlowBackground glowPosition="top-left" intensity="subtle" animated={false} />
      <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-white">
            <span className="inline-flex rounded-xl bg-primary-muted p-2 shadow-glow-sm">
              <Settings className="h-6 w-6 text-primary" />
            </span>
            Settings
          </h1>
          <p className="mt-2 text-foreground-muted">Manage your account preferences.</p>
        </div>
      </div>
      <Card variant="glass" className="border-border/40">
        <CardHeader>
          <CardTitle className="text-white">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground-muted">
          <div className="flex justify-between border-b border-border/20 pb-3">
            <span>Name</span>
            <span className="text-white">{user?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between border-b border-border/20 pb-3">
            <span>Email</span>
            <span className="text-white">{user?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span>Role</span>
            <span className="text-white capitalize">{(user as any)?.role?.toLowerCase() ?? 'creator'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
