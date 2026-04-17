'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentRow } from './document-row';
import type { ChecklistGroup } from '@/lib/documents-api';

export function DocumentGroupCard({ group }: { group: ChecklistGroup }) {
  const [expanded, setExpanded] = useState(true);

  const uploadedCount = group.documents.filter(
    (d) => d.uploaded_count > 0,
  ).length;
  const total = group.documents.length;
  const allUploaded = total > 0 && uploadedCount === total;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
            {group.step_title}
          </h3>
          <span
            className={[
              'inline-flex items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              allUploaded
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            ].join(' ')}
          >
            {allUploaded && <CheckCircle2 className="h-3 w-3" />}
            {uploadedCount} / {total}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
          {group.documents.map((doc, i) => (
            <DocumentRow key={i} document={doc} stepSlug={group.step_slug} />
          ))}
        </div>
      )}
    </div>
  );
}
