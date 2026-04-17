'use client';

import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { ThemeToggle } from '@/components/ui';

interface AuthSplitPanelProps {
  children: ReactNode;
  /** Illustration panel content (defaults to the marketing block) */
  illustration?: ReactNode;
}

const defaultIllustration = (
  <div className="relative z-10 max-w-md text-accent-foreground">
    <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
      Navigate Germany.
      <br />
      <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
        Step by step.
      </span>
    </h2>
    <p className="mt-5 text-base leading-relaxed text-white/80">
      AI-powered roadmaps, form guides, appointment emails, and document
      checklists — tailored to your visa type and Bundesland.
    </p>
    <ul className="mt-8 space-y-3 text-sm text-white/90">
      {[
        'Personalised for your situation in under 2 minutes',
        'Free to start — no credit card required',
        'Every answer cites a verified official source',
      ].map((text) => (
        <li key={text} className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/80" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
    <p className="mt-8 text-xs text-white/60">
      Educational guidance. Not legal advice.
    </p>
  </div>
);

export function AuthSplitPanel({
  children,
  illustration = defaultIllustration,
}: AuthSplitPanelProps) {
  return (
    <div className="flex min-h-screen flex-col bg-base text-text-primary transition-colors lg:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border-default bg-surface px-4 py-3 sm:px-6 lg:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
            <Logo />
        </Link>
        <ThemeToggle />
      </header>

      {/* Form panel (left on desktop, full on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:py-0"
      >
        <div className="w-full max-w-md">
          <div className="mb-8 hidden items-center justify-between lg:flex">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
            <Logo />
            </Link>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </motion.div>

      {/* Illustration panel (right on desktop) */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a365d] via-[#2a4a75] to-[#4a73a9] p-12 lg:flex lg:w-[44%]">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-0"
        >
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10"
        >
          {illustration}
        </motion.div>
      </div>
    </div>
  );
}
