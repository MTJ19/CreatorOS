import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
        <FileQuestion className="h-8 w-8 text-purple-400" />
      </div>

      <div className="mx-auto max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Page Not Found</h2>
        <p className="text-sm text-zinc-400">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted,
          or never existed in the first place.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row">
        <Button asChild className="w-full bg-white text-black hover:bg-zinc-200 sm:w-auto">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
