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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Something went wrong!</h2>
        <p className="text-zinc-400 text-sm">
          We experienced an unexpected error. Our team has been notified. 
          Please try again or return to the dashboard.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
        <Button 
          onClick={() => reset()}
          className="bg-white text-black hover:bg-zinc-200 w-full sm:w-auto"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try again
        </Button>
        <Button 
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="w-full sm:w-auto border-white/10 hover:bg-white/5"
        >
          <Home className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
