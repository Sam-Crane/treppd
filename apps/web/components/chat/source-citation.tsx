'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import type { RetrievedChunk } from '@/lib/sse';

interface SourceCitationProps {
  chunks: RetrievedChunk[];
}

const sourceTypeLabels: Record<string, string> = {
  bamf: 'BAMF',
  make_it_in_germany: 'Make it in Germany',
  daad: 'DAAD',
  berlin_labo: 'Berlin LABO',
  munich_kvr: 'Munich KVR',
  rundfunkbeitrag: 'Rundfunkbeitrag',
  manual: 'Curated',
};

export function SourceCitation({ chunks }: SourceCitationProps) {
  const [expanded, setExpanded] = useState(false);

  if (!chunks || chunks.length === 0) return null;

  // Dedupe by source URL (multiple chunks from same page → one citation)
  const seen = new Set<string>();
  const unique = chunks.filter((c) => {
    if (!c.source || seen.has(c.source)) return false;
    seen.add(c.source);
    return true;
  });

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
        {unique.length} source{unique.length === 1 ? '' : 's'} consulted
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-2 space-y-1"
          >
            {unique.map((c, idx) => (
              <li key={`${c.source}-${idx}`} className="text-xs">
                <a
                  href={c.source ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1 text-[#1a365d] hover:underline"
                >
                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    <span className="font-medium">
                      {c.source_type
                        ? sourceTypeLabels[c.source_type] ?? c.source_type
                        : 'Source'}
                    </span>
                    {c.section ? ` — ${c.section}` : ''}
                  </span>
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
