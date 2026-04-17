'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';

import type { RetrievedChunk } from '@/lib/sse';
import { cn } from '@/lib/utils';

interface SourceCitationProps {
  chunks: RetrievedChunk[];
}

const sourceTypeLabels: Record<string, string> = {
  bamf: 'BAMF',
  make_it_in_germany: 'Make it in Germany',
  daad: 'DAAD',
  handbook_germany: 'HandbookGermany',
  berlin_service: 'service.berlin.de',
  berlin_labo: 'Berlin LABO',
  muenchen_kvr: 'München KVR',
  hamburg_ausl: 'Hamburg Ausländerbehörde',
  frankfurt_amka: 'Frankfurt AmkA',
  koeln_ausl: 'Köln Ausländeramt',
  stuttgart_ausl: 'Stuttgart Ausländerbehörde',
  duesseldorf_ausl: 'Düsseldorf Ausländeramt',
  leipzig_ausl: 'Leipzig Ausländerbehörde',
  dortmund_ausl: 'Dortmund Ausländerwesen',
  bremen_service: 'service.bremen.de',
  hannover_ausl: 'Hannover Ausländerbehörde',
  nuernberg_ausl: 'Nürnberg Migration & Integration',
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
    <div className="mt-3 border-t border-border-default pt-3">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
      >
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            expanded && 'rotate-180',
          )}
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
            className="mt-2 space-y-1 overflow-hidden"
          >
            {unique.map((c, idx) => (
              <li key={`${c.source}-${idx}`} className="text-xs">
                <a
                  href={c.source ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1 text-accent hover:underline"
                >
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
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
