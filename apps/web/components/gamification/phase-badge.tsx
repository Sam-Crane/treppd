'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export type Phase = 'arrival' | 'settling' | 'integrated';

const PHASES: Record<Phase, { label: string; emoji: string; description: string }> = {
  arrival: {
    label: 'Arrival',
    emoji: '🛬',
    description: 'Getting your bearings — Anmeldung, insurance, bank account.',
  },
  settling: {
    label: 'Settling',
    emoji: '🏡',
    description: 'Residence permit sorted, tax ID in hand, finding your rhythm.',
  },
  integrated: {
    label: 'Integrated',
    emoji: '✨',
    description: 'Eligible for permanent residence or citizenship pathways.',
  },
};

export function phaseFromProgress(pct: number): Phase {
  if (pct < 30) return 'arrival';
  if (pct < 70) return 'settling';
  return 'integrated';
}

export function PhaseBadgeLarge({ phase }: { phase: Phase }) {
  const meta = PHASES[phase];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border-default bg-surface p-4',
        phase === 'integrated' && 'bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/30',
        phase === 'settling' && 'bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/30',
        phase === 'arrival' && 'bg-gradient-to-br from-accent-subtle to-transparent',
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-lg shadow-sm"
      >
        {meta.emoji}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Current phase
        </p>
        <p className="mt-0.5 text-sm font-semibold text-text-primary">
          {meta.label}
        </p>
        <p className="text-xs text-text-muted">{meta.description}</p>
      </div>
    </motion.div>
  );
}
