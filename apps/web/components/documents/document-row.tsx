'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Euro,
  ExternalLink,
  Languages,
  MapPin,
  Stamp,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import {
  documentsApi,
  type DocumentRequirementWithUploads,
} from '@/lib/documents-api';
import { DocumentUploader } from './document-uploader';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentRow({
  document: doc,
  stepSlug,
}: {
  document: DocumentRequirementWithUploads;
  stepSlug: string;
}) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const isUploaded = doc.uploaded_count > 0;

  async function handleOpen(id: string) {
    setPreviewing(id);
    try {
      const { url } = await documentsApi.downloadUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setPreviewing(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await documentsApi.delete(id);
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
    } finally {
      setDeletingId(null);
    }
  }

  const refreshChecklist = () =>
    queryClient.invalidateQueries({ queryKey: ['documents'] });

  return (
    <div className="px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {doc.document_name_en}
            </p>
            {isUploaded && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Uploaded
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {doc.document_name_de}
          </p>
        </div>
        {doc.estimated_cost_eur !== null && (
          <span className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
            <Euro className="h-3 w-3" />~{doc.estimated_cost_eur}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {doc.needs_certified_copy && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Copy className="h-3 w-3" />
            Certified Copy
          </span>
        )}
        {doc.needs_translation && (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            <Languages className="h-3 w-3" />
            Translation Required
          </span>
        )}
        {doc.needs_apostille && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
            <Stamp className="h-3 w-3" />
            Apostille Required
          </span>
        )}
      </div>

      {doc.where_to_get && (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {doc.where_to_get}
        </p>
      )}

      {/* Uploaded files */}
      {isUploaded && (
        <ul className="mt-3 space-y-1.5">
          {doc.uploads.map((upload) => (
            <li
              key={upload.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-800"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                  {upload.display_name ?? 'Document'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {formatFileSize(upload.file_size_bytes)} ·{' '}
                  {new Date(upload.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpen(upload.id)}
                  disabled={previewing === upload.id}
                  className="rounded p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(upload.id)}
                  disabled={deletingId === upload.id}
                  className="rounded p-1 text-slate-500 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Uploader — always visible, allows adding more even when one is uploaded */}
      <div className="mt-2">
        <DocumentUploader
          documentNameEn={doc.document_name_en}
          stepSlug={stepSlug}
          onUploaded={refreshChecklist}
        />
      </div>

      {doc.specifications && Object.keys(doc.specifications).length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            Specifications
          </summary>
          <div className="mt-1.5 space-y-1 rounded bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {Object.entries(doc.specifications).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                {String(value)}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
