import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Building2, GraduationCap, Zap } from 'lucide-react';

import { TopNav } from '@/components/landing/top-nav';
import { Footer } from '@/components/landing/footer';
import { FinalCTA } from '@/components/landing/final-cta';
import { Button, Card, Badge } from '@/components/ui';
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
    name: 'Starter',
    price: '€0',
    period: 'forever',
    headline: 'For students figuring it out solo.',
    features: [
      'Personalised roadmap',
      'AI assistant (30 messages / day)',
      '3 form guides (Anmeldung + residence permit + health insurance)',
      'Basic deadline alerts',
      'Community support',
    ],
    cta: { label: 'Start free', href: '/register' },
    icon: GraduationCap,
  },
  {
    name: 'Pro',
    price: '€9.99',
    period: '/ month',
    headline: 'For workers and families who want the full toolkit.',
    features: [
      'Everything in Starter',
      'Unlimited AI assistant',
      'All form guides + city-specific variants',
      'Appointment email generator',
      'Document upload & checklist',
      'Priority push notifications',
      'Email support (24h response)',
    ],
    cta: { label: 'Start Pro trial', href: '/register?plan=pro' },
    highlight: true,
    icon: Zap,
  },
  {
    name: 'For organisations',
    price: '€2–25',
    period: '/ person / year',
    headline: 'For universities + employers bringing international talent.',
    features: [
      'Managed Treppd for every hire / student',
      'Central dashboard for HR / international office',
      'Custom Bundesland + office coverage',
      'SAML SSO + audit logs',
      'Dedicated success manager',
      'Quarterly content reviews',
    ],
    cta: { label: 'Contact sales', href: 'mailto:hello@treppd.de' },
    icon: Building2,
  },
];

function TierCard({ tier }: { tier: Tier }) {
  return (
    <Card
      variant={tier.highlight ? 'elevated' : 'bordered'}
      padding="lg"
      className={cn(
        'relative flex h-full flex-col',
        tier.highlight && 'ring-2 ring-accent',
      )}
    >
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
    </Card>
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
              Free for students figuring it out alone. Pro when you need the
              whole toolkit. Org plans for universities + employers.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-3">
            {TIERS.map((t) => (
              <TierCard key={t.name} tier={t} />
            ))}
          </div>
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
