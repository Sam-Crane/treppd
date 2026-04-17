'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui';

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-base py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,theme(colors.accent.DEFAULT/0.18),transparent)]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Stop losing weekends to paperwork.
        </h2>
        <p className="mt-3 text-text-secondary sm:text-lg">
          Get your personalised roadmap in under a minute. Free to start, no
          credit card required.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
