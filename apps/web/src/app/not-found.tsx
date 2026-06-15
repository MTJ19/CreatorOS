import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center">
        <FileQuestion className="w-8 h-8 text-purple-400" />
      </div>
      
      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Page Not Found</h2>
        <p className="text-zinc-400 text-sm">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed in the first place.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
        <Button asChild className="bg-white text-black hover:bg-zinc-200 w-full sm:w-auto">
          <Link href="/dashboard">
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
