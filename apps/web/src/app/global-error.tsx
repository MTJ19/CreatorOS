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
        <div className="flex min-h-screen flex-col items-center justify-center space-y-6 p-6 text-center">
          <div className="mx-auto max-w-md space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Critical Application Error</h2>
            <p className="text-sm text-zinc-400">
              We experienced a critical error that prevented the application from loading.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="rounded-md bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
