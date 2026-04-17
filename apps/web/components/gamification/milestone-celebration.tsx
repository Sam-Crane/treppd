'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui';

interface CelebrationProps {
  open: boolean;
  title: string;
  body?: string;
  actionLabel?: string;
  onDismiss: () => void;
}

/**
 * Full-screen milestone celebration. Fires a confetti burst on mount
 * (respecting prefers-reduced-motion by skipping the effect) and shows a
 * dismissable card. Called from the roadmap completion flow and phase
 * transitions.
 *
 * We lazy-import `canvas-confetti` on click rather than at module scope
 * because the module eagerly patches `window` — importing on the server
 * breaks SSR.
 */
export function MilestoneCelebration({
  open,
  title,
  body,
  actionLabel = 'Nice',
  onDismiss,
}: CelebrationProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    // Dynamic import so SSR stays clean
    void import('canvas-confetti').then(({ default: confetti }) => {
      // Two-burst pattern — left and right sides
      const defaults = {
        spread: 100,
        startVelocity: 35,
        scalar: 0.9,
        gravity: 0.9,
        ticks: 200,
        colors: ['#3b82f6', '#60a5fa', '#a5b4fc', '#fcd34d', '#f472b6'],
      };
      confetti({
        ...defaults,
        particleCount: 70,
        origin: { x: 0.15, y: 0.5 },
        angle: 60,
      });
      confetti({
        ...defaults,
        particleCount: 70,
        origin: { x: 0.85, y: 0.5 },
        angle: 120,
      });
    });
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onDismiss}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="celebration-title"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="relative w-full max-w-sm rounded-3xl border border-border-default bg-surface p-8 text-center shadow-lg"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h2
              id="celebration-title"
              className="mt-4 text-xl font-semibold text-text-primary"
            >
              {title}
            </h2>
            {body && (
              <p className="mt-2 text-sm text-text-secondary">{body}</p>
            )}
            <Button onClick={onDismiss} size="lg" className="mt-6 w-full">
              {actionLabel}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
