import type { Metadata } from 'next';

import { TopNav } from '@/components/landing/top-nav';
import { Footer } from '@/components/landing/footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Card } from '@/components/ui';
import { FileCheck2, Heart, Languages, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About — Treppd',
  description:
    'Treppd is built by a small team in Deggendorf to help non-EU immigrants navigate German bureaucracy without losing weekends.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-base text-text-primary transition-colors">
      <TopNav />
      <main>
        <section className="border-b border-border-default bg-base pb-16 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              About
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              Built by people who&apos;ve been through it.
            </h1>
            <p className="mt-4 text-text-secondary sm:text-lg">
              Treppd started as a course project at TH Deggendorf by a team of
              non-EU students who&apos;d spent too many Saturdays in front of
              the Ausländerbehörde website. We built what we wish had existed
              when we landed.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold text-text-primary">
              Our principles
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <Card padding="lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  Verified over generated
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Every answer cites a BAMF, city-service, or official source.
                  The AI can only reword the sources — never invent form
                  names, fees, or deadlines.
                </p>
              </Card>
              <Card padding="lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                  <Heart className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  Treat bureaucracy with dignity
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  No condescending tooltips, no gamified distractions. Just
                  clean steps, honest timelines, and gentle nudges when a
                  deadline is close.
                </p>
              </Card>
              <Card padding="lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                  <Languages className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  Plain English, German when it matters
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  You shouldn&apos;t need B2 German to navigate a visa
                  appointment. We translate — and when the form demands it,
                  we&apos;ll draft the formal German for you.
                </p>
              </Card>
              <Card padding="lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  Not legal advice
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  For contested decisions, deportation risk, asylum, or legal
                  strategy: see a Rechtsanwalt für Ausländerrecht. We tell
                  you so every time it matters.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
