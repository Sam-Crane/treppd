'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentRow } from './document-row';

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

interface DocumentGroupProps {
  group: DocumentGroup;
}

export function DocumentGroupCard({ group }: DocumentGroupProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            {group.step_title}
          </h3>
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {group.documents.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t divide-y divide-gray-100">
          {group.documents.map((doc, i) => (
            <DocumentRow key={i} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
