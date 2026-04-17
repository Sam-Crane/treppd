'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-default bg-base">
      {/* Decorative gradient blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,theme(colors.accent.DEFAULT/0.16),transparent)]" />
        <div className="absolute right-0 top-20 h-[300px] w-[300px] bg-[radial-gradient(closest-side,theme(colors.accent.DEFAULT/0.2),transparent)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface/60 px-3 py-1 text-xs font-medium text-text-secondary backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent" />
            Built for non-EU immigrants in Germany
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Navigate Germany.{' '}
            <span className="bg-gradient-to-r from-accent via-accent-hover to-accent bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
              Step by step.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-text-secondary sm:text-lg">
            Personalised roadmap, field-by-field form guides, and an AI
            assistant grounded in verified official sources. In plain English,
            tailored to your visa type and Bundesland.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                Get started — free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-text-muted">
            Educational guidance. Not legal advice.
          </p>
        </motion.div>

        {/* Sources strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider">
            Grounded in
          </span>
          <span className="font-medium text-text-secondary">BAMF</span>
          <span className="font-medium text-text-secondary">
            Make-it-in-Germany
          </span>
          <span className="font-medium text-text-secondary">DAAD</span>
          <span className="font-medium text-text-secondary">
            HandbookGermany
          </span>
          <span className="font-medium text-text-secondary">11 city Ausländerbehörden</span>
        </motion.div>
      </div>
    </section>
  );
}
