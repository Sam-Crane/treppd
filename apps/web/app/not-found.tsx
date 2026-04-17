import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle text-accent-hover dark:text-accent">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
