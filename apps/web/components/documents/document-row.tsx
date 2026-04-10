'use client';

import { Copy, Languages, Stamp, MapPin, Euro } from 'lucide-react';

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

interface DocumentRowProps {
  document: DocumentRequirement;
}

export function DocumentRow({ document: doc }: DocumentRowProps) {
  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm">
            {doc.document_name_en}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{doc.document_name_de}</p>
        </div>
        {doc.estimated_cost_eur !== null && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            <Euro className="w-3 h-3" />~{doc.estimated_cost_eur}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {doc.needs_certified_copy && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
            <Copy className="w-3 h-3" />
            Certified Copy
          </span>
        )}
        {doc.needs_translation && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            <Languages className="w-3 h-3" />
            Translation Required
          </span>
        )}
        {doc.needs_apostille && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <Stamp className="w-3 h-3" />
            Apostille Required
          </span>
        )}
      </div>

      {doc.where_to_get && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {doc.where_to_get}
        </p>
      )}

      {Object.keys(doc.specifications).length > 0 && (
        <details className="mt-2">
          <summary className="text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-600">
            Specifications
          </summary>
          <div className="mt-1.5 bg-gray-50 rounded p-2.5 text-xs text-gray-600 space-y-1">
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
