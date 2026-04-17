import type { Metadata } from 'next';

import { TopNav } from '@/components/landing/top-nav';
import { Footer } from '@/components/landing/footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { FileCheck2, Heart, Languages, Shield, type LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About — Treppd',
  description:
    'Treppd is built by a small team in Deggendorf to help non-EU immigrants navigate German bureaucracy without losing weekends.',
};

interface Principle {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

const PRINCIPLES: Principle[] = [
  {
    icon: Shield,
    title: 'Verified over generated',
    description:
      'Every answer cites a BAMF, city-service, or official source. The AI can only reword the sources — never invent form names, fees, or deadlines.',
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: Heart,
    title: 'Treat bureaucracy with dignity',
    description:
      'No condescending tooltips, no gamified distractions. Just clean steps, honest timelines, and gentle nudges when a deadline is close.',
    accent: 'from-rose-500/20 to-rose-500/5',
  },
  {
    icon: Languages,
    title: 'Plain English, German when it matters',
    description:
      "You shouldn't need B2 German to navigate a visa appointment. We translate — and when the form demands it, we'll draft the formal German for you.",
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: FileCheck2,
    title: 'Not legal advice',
    description:
      'For contested decisions, deportation risk, asylum, or legal strategy: see a Rechtsanwalt für Ausländerrecht. We tell you so every time it matters.',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-base text-text-primary transition-colors">
      <TopNav />
      <main>
        <section className="border-b border-border-default bg-base pb-16 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              About
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
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
            <h2 className="text-center text-2xl font-bold text-text-primary">
              Our principles
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div
                  key={p.title}
                  className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${p.accent}`}
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:scale-110">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
