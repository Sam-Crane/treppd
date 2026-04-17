'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Map,
  MessageCircle,
  Shield,
} from 'lucide-react';

import { Button } from '@/components/ui';

const TRUST_ITEMS = [
  { icon: Shield, text: 'Grounded in verified official sources only' },
  { icon: Map, text: 'Personalised for your visa type + Bundesland' },
  { icon: MessageCircle, text: 'AI assistant that cites every source' },
  { icon: FileCheck2, text: '84 form fields with common-mistake warnings' },
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

          {/* Right: trust indicators as a visual stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="space-y-3">
              {TRUST_ITEMS.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.3 + i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border-default bg-surface/80 p-4 shadow-xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Floating stat badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -left-4 -top-4 hidden rounded-full border border-border-default bg-surface px-3 py-1.5 shadow-md lg:block"
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
