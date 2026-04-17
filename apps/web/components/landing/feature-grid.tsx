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

import { Card } from '@/components/ui';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Map,
    title: 'Personalised roadmap',
    description:
      'A step-by-step immigration plan tailored to your visa type, Bundesland, and goal — built from verified official sources, never invented.',
  },
  {
    icon: Sparkles,
    title: 'AI assistant',
    description:
      'Ask any immigration question in plain English. Answers cite the exact BAMF, DAAD, or city-service sources they drew from.',
  },
  {
    icon: FileCheck2,
    title: 'Form guides',
    description:
      'Anmeldung, residence permit, student health insurance — field-by-field with common mistakes, examples, and per-field "Ask AI" explanations.',
  },
  {
    icon: Mail,
    title: 'Appointment emails',
    description:
      'Generate formal German emails to request an Ausländerbehörde appointment, tailored to your profile and preferred dates.',
  },
  {
    icon: Bell,
    title: 'Deadline alerts',
    description:
      'Push notifications at 90, 30, 7 days before visa expiry, plus the 14-day Anmeldung deadline. Never miss a date again.',
  },
  {
    icon: FileText,
    title: 'Document checklist',
    description:
      'Upload scans of your passport, Meldebescheinigung, transcripts. The checklist ticks itself off as you go.',
  },
];

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="border-b border-border-default bg-subtle/40 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-3 text-text-secondary">
            Six focused tools. No bloat, no gamified distractions, no email
            spam — just the bureaucratic muscle you need to settle in Germany.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Card variant="bordered" padding="lg" className="h-full">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
