'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const pct = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: i <= currentStep ? 1 : 0.2 }}
            transition={{ duration: 0.3 }}
            className={cn('h-1.5 flex-1 rounded-full bg-accent')}
          />
        ))}
      </div>
    </div>
  );
}
