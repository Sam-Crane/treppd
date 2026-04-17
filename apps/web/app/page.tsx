import type { Metadata } from 'next';

import { TopNav } from '@/components/landing/top-nav';
import { Hero } from '@/components/landing/hero';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Treppd — Navigate Germany. Step by step.',
  description:
    'AI-powered bureaucracy co-pilot for non-EU immigrants in Germany. Personalised roadmaps, form guides, appointment emails, deadline alerts, and document uploads — grounded in verified official sources.',
  keywords: [
    'Germany immigration',
    'visa guide',
    'Anmeldung',
    'Aufenthaltserlaubnis',
    'Auslaenderbehoerde',
    'residence permit',
    'international students Germany',
    'skilled worker visa',
  ],
  openGraph: {
    title: 'Treppd — Navigate Germany. Step by step.',
    description:
      'Personalised roadmaps, form guides, and document checklists for non-EU immigrants in Germany.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Treppd',
    images: [
      {
        url: '/treppd-logo-vertical.png',
        width: 283,
        height: 357,
        alt: 'Treppd logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Treppd — Navigate Germany. Step by step.',
    description: 'AI-powered bureaucracy co-pilot for immigrants in Germany.',
    images: ['/treppd-logo-vertical.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-text-primary transition-colors">
      <TopNav />
      <main>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
