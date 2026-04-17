import type { Metadata } from 'next';

import { TopNav } from '@/components/landing/top-nav';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Features — Treppd',
  description:
    'The six tools that make up Treppd: personalised roadmap, AI assistant, form guides, appointment emails, deadline alerts, and document uploads.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-base text-text-primary transition-colors">
      <TopNav />
      <main>
        <section className="border-b border-border-default bg-base pb-12 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              Features
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              Six tools, one co-pilot.
            </h1>
            <p className="mt-4 text-text-secondary sm:text-lg">
              Everything you need to settle in Germany without losing weekends
              to paperwork. Every answer cites a verified official source.
            </p>
          </div>
        </section>
        <FeatureGrid />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
