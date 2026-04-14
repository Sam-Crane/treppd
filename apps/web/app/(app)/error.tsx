'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error-boundary]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Couldn&apos;t load this section
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {error.message || 'Something went wrong fetching your data.'}
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-2 bg-[#1a365d] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2a4a75] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
