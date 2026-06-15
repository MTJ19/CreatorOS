'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>

      <div className="mx-auto max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Something went wrong!</h2>
        <p className="text-sm text-zinc-400">
          We experienced an unexpected error. Our team has been notified. Please try again or return
          to the dashboard.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row">
        <Button
          onClick={() => reset()}
          className="w-full bg-white text-black hover:bg-zinc-200 sm:w-auto"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="w-full border-white/10 hover:bg-white/5 sm:w-auto"
        >
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
