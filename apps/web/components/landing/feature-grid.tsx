'use client';

import { motion } from 'framer-motion';
import {
  Bell,
  FileCheck2,
  FileText,
  Mail,
  Map,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: Map,
    title: 'Personalised roadmap',
    description:
      'A step-by-step immigration plan tailored to your visa type, Bundesland, and goal — built from verified official sources in under 10 seconds.',
    stat: '12',
    statLabel: 'cities covered',
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: Sparkles,
    title: 'AI assistant',
    description:
      'Ask any immigration question in plain English. Every answer cites the exact BAMF, DAAD, or city-service source it drew from.',
    stat: '556',
    statLabel: 'verified chunks',
    accent: 'from-violet-500/20 to-violet-500/5',
  },
  {
    icon: FileCheck2,
    title: 'Form guides',
    description:
      'Anmeldung, residence permit, health insurance — field-by-field with common mistakes, examples, and "Ask AI" per field.',
    stat: '84',
    statLabel: 'curated fields',
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: Mail,
    title: 'Appointment emails',
    description:
      'Generate formal German emails to request Ausländerbehörde appointments. Sie-form, personalised, copy-and-send.',
    stat: '5',
    statLabel: 'process types',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: Bell,
    title: 'Deadline alerts',
    description:
      'Push notifications at 90, 30, and 7 days before visa expiry. Plus a 14-day Anmeldung nudge. Never miss a date.',
    stat: '3',
    statLabel: 'alert windows',
    accent: 'from-rose-500/20 to-rose-500/5',
  },
  {
    icon: FileText,
    title: 'Document uploads',
    description:
      'Upload passport, Meldebescheinigung, transcripts directly to your secure vault. The checklist ticks itself off.',
    stat: '10MB',
    statLabel: 'per upload',
    accent: 'from-cyan-500/20 to-cyan-500/5',
  },
];

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="border-b border-border-default bg-subtle/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Six tools. Zero guesswork.
          </h2>
          <p className="mt-3 text-text-secondary">
            Every answer is grounded in an official source. Every form field
            is hand-curated. Every deadline is tracked.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-border-default bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Gradient accent stripe at top */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.accent}`}
              />

              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:scale-110">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-text-primary">
                    {feature.stat}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    {feature.statLabel}
                  </p>
                </div>
              </div>

              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
