'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global unhandled error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold tracking-tight">Critical Application Error</h2>
            <p className="text-zinc-400 text-sm">
              We experienced a critical error that prevented the application from loading.
            </p>
          </div>
          <button 
            onClick={() => reset()}
            className="px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-zinc-200 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
