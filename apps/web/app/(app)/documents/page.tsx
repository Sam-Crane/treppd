'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

import { documentsApi } from '@/lib/documents-api';
import { DocumentGroupCard } from '@/components/documents/document-group';

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
        />
      ))}
    </div>
  );
}

export default function DocumentsPage() {
  const {
    data: groups,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.checklist(),
  });

  const totalDocuments =
    groups?.reduce((sum, g) => sum + g.documents.length, 0) ?? 0;
  const uploadedDocuments =
    groups?.reduce(
      (sum, g) =>
        sum + g.documents.filter((d) => d.uploaded_count > 0).length,
      0,
    ) ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
          Document Checklist
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Upload the documents required for each step of your immigration
          process. Files are stored securely and only you can read them.
        </p>
      </header>

      {isLoading && <LoadingSkeleton />}

      {!isLoading && (error || !groups || groups.length === 0) && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            No Documents Yet
          </h2>
          <p className="mx-auto max-w-md text-sm text-slate-500 dark:text-slate-400">
            Complete onboarding to see your document checklist. Your required
            documents will appear here once your roadmap is generated.
          </p>
        </div>
      )}

      {!isLoading && groups && groups.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {uploadedDocuments}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {totalDocuments}
              </span>{' '}
              documents uploaded across{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {groups.length}
              </span>{' '}
              steps
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${
                    totalDocuments
                      ? Math.round(
                          (uploadedDocuments / totalDocuments) * 100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <DocumentGroupCard key={group.step_slug} group={group} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
