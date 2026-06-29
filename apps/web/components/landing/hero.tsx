'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

import { Button } from '@/components/ui';

const STEPS = [
  { label: 'Register your address (Anmeldung)', state: 'done' as const },
  { label: 'Open a blocked account (Sperrkonto)', state: 'done' as const },
  { label: 'Apply for your residence permit', state: 'active' as const },
  { label: 'Enrol in health insurance', state: 'todo' as const },
  { label: 'Open a German bank account', state: 'todo' as const },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-base">
      {/* Background: brand image as faded watermark on right side */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* Gradient blobs */}
        <div className="absolute left-0 top-0 h-[600px] w-[800px] bg-[radial-gradient(closest-side,theme(colors.accent.DEFAULT/0.12),transparent)]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] bg-[radial-gradient(closest-side,theme(colors.accent.DEFAULT/0.08),transparent)]" />

        {/* Brand image as subtle watermark — visible on desktop only */}
        <div className="absolute -right-10 top-1/2 hidden -translate-y-1/2 opacity-[0.04] dark:opacity-[0.06] lg:block">
          <Image
            src="/treppd-brand.jpeg"
            alt=""
            width={481}
            height={481}
            className="h-[500px] w-[500px] object-contain"
            priority
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent dark:border-accent/30 dark:bg-accent/10">
              <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
              Built for non-EU immigrants in Germany
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Navigate Germany.
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
                Step by step.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-text-secondary sm:text-lg">
              Your AI-powered co-pilot for German bureaucracy. Personalised
              roadmap, form-filling guides, appointment emails — all grounded
              in BAMF, DAAD, and 11 city Ausländerbehörden. In plain English.
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
              Free tier available. No credit card required. Educational
              guidance, not legal advice.
            </p>
          </motion.div>

          {/* Right: product preview — a mini roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl border border-border-default bg-surface shadow-xl">
              {/* window chrome */}
              <div className="flex items-center gap-1.5 border-b border-border-default bg-subtle/60 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-error/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
                <span className="ml-2 truncate text-xs font-medium text-text-muted">
                  Your roadmap · Student visa · Bavaria
                </span>
              </div>

              {/* progress */}
              <div className="px-5 pt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">
                    2 of 5 steps done
                  </span>
                  <span className="text-text-muted">40%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                  <div className="h-full w-2/5 rounded-full bg-accent" />
                </div>
              </div>

              {/* steps */}
              <ul className="space-y-2 p-5">
                {STEPS.map((step) => (
                  <li
                    key={step.label}
                    className={
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ' +
                      (step.state === 'active'
                        ? 'border-accent/40 bg-accent/5 font-medium text-text-primary'
                        : 'border-transparent text-text-secondary')
                    }
                  >
                    {step.state === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                    ) : step.state === 'active' ? (
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                      </span>
                    ) : (
                      <Circle className="h-5 w-5 flex-shrink-0 text-border-strong" />
                    )}
                    <span className={step.state === 'done' ? 'opacity-60' : ''}>
                      {step.label}
                    </span>
                    {step.state === 'active' && (
                      <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                        Next
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Floating stat badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-3 -left-3 hidden rounded-full border border-border-default bg-surface px-3 py-1.5 shadow-md lg:block"
            >
              <span className="text-xs font-semibold text-text-primary">
                556 verified sources
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Source logos strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border-default pt-8"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Grounded in
          </span>
          {[
            'BAMF',
            'Make-it-in-Germany',
            'DAAD',
            'HandbookGermany',
            '11 city offices',
          ].map((src) => (
            <span
              key={src}
              className="flex items-center gap-1.5 text-sm font-medium text-text-secondary"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              {src}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
