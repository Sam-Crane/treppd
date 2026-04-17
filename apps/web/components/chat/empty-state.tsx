'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  'How long does the Anmeldung take?',
  'What documents do I need for a residence permit?',
  'How do I open a Sperrkonto?',
  'When should I start renewing my visa?',
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center px-4 py-12 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle text-accent-hover dark:text-accent">
        <MessageCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-semibold text-text-primary">
        Ask about German bureaucracy
      </h2>
      <p className="mt-2 max-w-md text-sm text-text-secondary">
        I answer using verified sources (BAMF, Make-it-in-Germany, DAAD, plus
        11 city Ausländerbehörden) and tailor responses to your visa type and
        Bundesland.
      </p>

      <div className="mt-8 w-full max-w-md">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          <Sparkles className="h-3.5 w-3.5" />
          Try asking
        </p>
        <div className="grid gap-2">
          {suggestions.map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSuggestionClick(s)}
              className="rounded-xl border border-border-default bg-surface px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:border-accent/30 hover:bg-accent-subtle/50 hover:text-text-primary"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
