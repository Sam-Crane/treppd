'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { DocumentGroupCard } from '@/components/documents/document-group';

interface DocumentRequirement {
  document_name_en: string;
  document_name_de: string;
  specifications: Record<string, unknown>;
  needs_certified_copy: boolean;
  needs_translation: boolean;
  needs_apostille: boolean;
  where_to_get: string;
  estimated_cost_eur: number | null;
}

interface DocumentGroup {
  step_slug: string;
  step_title: string;
  documents: DocumentRequirement[];
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-5 bg-gray-100 rounded-full w-6" />
            </div>
            <div className="w-5 h-5 bg-gray-100 rounded" />
          </div>
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
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
    queryFn: () => api.get<DocumentGroup[]>('/documents/checklist'),
  });

  const totalDocuments =
    groups?.reduce((sum, g) => sum + g.documents.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Document Checklist
        </h1>
        <p className="text-gray-500 mt-1">
          All documents required for your immigration process.
        </p>
      </div>

      {isLoading && <LoadingSkeleton />}

      {!isLoading && (error || !groups || groups.length === 0) && (
        <div className="bg-white rounded-xl border p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[#1a365d]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Documents Yet
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Complete onboarding to see your document checklist. Your required
            documents will appear here once your roadmap is generated.
          </p>
        </div>
      )}

      {!isLoading && groups && groups.length > 0 && (
        <>
          <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {totalDocuments}
              </span>{' '}
              documents across{' '}
              <span className="font-semibold text-gray-900">
                {groups.length}
              </span>{' '}
              steps
            </span>
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
