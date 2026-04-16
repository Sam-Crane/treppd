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
      className="flex flex-col items-center text-center py-12 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a365d]/10 to-[#4a73a9]/10 text-[#1a365d] flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">
        Ask about German bureaucracy
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-md">
        I answer using verified sources (BAMF, Make-it-in-Germany, DAAD) and
        tailor responses to your visa type and Bundesland.
      </p>

      <div className="mt-8 w-full max-w-md">
        <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Try asking
        </p>
        <div className="grid gap-2">
          {suggestions.map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSuggestionClick(s)}
              className="text-left text-sm px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-[#1a365d]/30 hover:bg-blue-50/50 transition-colors text-gray-700"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
