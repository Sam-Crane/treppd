import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles, GraduationCap, Zap } from 'lucide-react';

import { TopNav } from '@/components/landing/top-nav';
import { Footer } from '@/components/landing/footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Pricing — Treppd',
  description:
    'Simple pricing for Treppd. Free tier for students. Pro for power users. B2B for universities and employers bringing international talent to Germany.',
};

interface Tier {
  name: string;
  price: string;
  period: string;
  headline: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
  icon: typeof Zap;
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    headline: 'Get started and see your first steps.',
    features: [
      'Personalised roadmap preview',
      'Basic document checklist',
      'Community support',
    ],
    cta: { label: 'Start free', href: '/register' },
    icon: GraduationCap,
  },
  {
    name: 'Basic',
    price: '€49',
    period: 'one-time · 6 months',
    headline: 'Everything you need to settle in.',
    features: [
      'Full personalised roadmap (any visa type)',
      'All document checklists',
      'Progress tracker',
      'Deadline alerts (90 / 30 / 7 days)',
    ],
    cta: { label: 'Get Basic', href: '/register?plan=basic' },
    icon: Zap,
  },
  {
    name: 'Pro',
    price: '€99',
    period: 'one-time · 6 months',
    headline: 'The full co-pilot — AI and form help included.',
    features: [
      'Everything in Basic',
      'AI assistant — ask anything, at any step',
      'Field-by-field guides for the official forms',
      'Document completeness check',
      'Ausländerbehörde appointment-email generator',
    ],
    cta: { label: 'Get Pro', href: '/register?plan=pro' },
    highlight: true,
    icon: Sparkles,
  },
];

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-default bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-lg',
        tier.highlight && 'ring-2 ring-accent',
      )}
    >
      {/* Accent stripe */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/30 to-accent/5" />
      {tier.highlight && (
        <Badge variant="info" className="absolute -top-2 right-4">
          Most popular
        </Badge>
      )}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle text-accent-hover dark:text-accent">
          <tier.icon className="h-4 w-4" />
        </div>
        <h3 className="text-base font-semibold text-text-primary">
          {tier.name}
        </h3>
      </div>
      <p className="mt-2 text-sm text-text-secondary">{tier.headline}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-4xl font-semibold text-text-primary">
          {tier.price}
        </span>
        <span className="text-sm text-text-muted">{tier.period}</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-text-secondary">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        size="lg"
        variant={tier.highlight ? 'primary' : 'secondary'}
        className="mt-8 w-full"
      >
        <Link href={tier.cta.href}>{tier.cta.label}</Link>
      </Button>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-base text-text-primary transition-colors">
      <TopNav />
      <main>
        <section className="border-b border-border-default bg-base pb-16 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              Pricing
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              Simple, honest pricing.
            </h1>
            <p className="mt-4 text-text-secondary sm:text-lg">
              Free to start. One simple price for the whole toolkit — paid once
              for 6 months of access, not a monthly subscription.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-3">
            {TIERS.map((t) => (
              <TierCard key={t.name} tier={t} />
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl px-4 text-center text-sm text-text-muted">
            Bringing a cohort?{' '}
            <span className="font-medium text-text-secondary">
              Treppd is free for partner universities&rsquo; students
            </span>{' '}
            —{' '}
            <a
              href="mailto:hello@treppd.de"
              className="text-accent hover:underline"
            >
              partner with us
            </a>
            .
          </p>
        </section>

        <section className="bg-subtle/40 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Every tier is grounded in the same verified sources
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              BAMF · Make-it-in-Germany · DAAD · HandbookGermany · 11 city
              Ausländerbehörden. Claude never invents form names, fees, or
              deadlines — it can only restate what the sources say.
            </p>
          </div>
        </section>

        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
