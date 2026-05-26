'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, Circle } from 'lucide-react';

import { documentsApi } from '@/lib/documents-api';

function prettyTag(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CompletenessPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['documents', 'completeness'],
    queryFn: () => documentsApi.completeness(),
  });

  if (isLoading || !data) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Completeness review
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {data.summary_en}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.satisfied.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
          >
            <CheckCircle2 className="h-3 w-3" />
            {prettyTag(tag)}
          </span>
        ))}
        {data.missing.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <Circle className="h-3 w-3" />
            {prettyTag(tag)}
          </span>
        ))}
      </div>

      {data.warnings.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {data.warnings.map((w, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                <strong>{w.document_name}</strong> —{' '}
                {w.issue.replace(/_/g, ' ')}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-slate-400">
        Educational guidance, not legal advice. Always verify with your local
        Ausländerbehörde.
      </p>
    </section>
  );
}
