import type { Metadata } from 'next';
import Image from 'next/image';
import { StickyNav } from '@/components/landing/sticky-nav';
import { AnimatedHero } from '@/components/landing/animated-hero';
import { StatsTicker } from '@/components/landing/stats-ticker';
import { ProblemSolution } from '@/components/landing/problem-solution';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { HowItWorksTimeline } from '@/components/landing/how-it-works-timeline';
import { FinalCTA } from '@/components/landing/final-cta';

export const metadata: Metadata = {
  title: 'Treppd — Navigate Germany. Step by step.',
  description:
    'AI-powered bureaucracy co-pilot for immigrants in Germany. Personalised roadmaps, form-filling guides, and document checklists — all in plain English, tailored to your visa type and city.',
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
    description:
      'AI-powered bureaucracy co-pilot for immigrants in Germany.',
    images: ['/treppd-logo-vertical.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Subtle SVG noise texture applied as a fixed overlay for added depth
const NOISE_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.035 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white text-gray-900">
      {/* Subtle noise overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-60 mix-blend-multiply"
        style={{ backgroundImage: NOISE_SVG }}
      />

      <div className="relative z-10">
        <StickyNav />

        <main>
          <AnimatedHero />
          <StatsTicker />
          <ProblemSolution />
          <FeatureGrid />
          <HowItWorksTimeline />
          <FinalCTA />
        </main>

        {/* Footer */}
        <footer className="border-t bg-white px-4 sm:px-6 py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Image
                src="/treppd-logo-horizontal.png"
                alt="Treppd"
                width={100}
                height={28}
                className="h-6 w-auto opacity-60"
              />
              <span>&copy; 2026 Treppd</span>
            </div>
            <p className="text-xs text-gray-500 text-center sm:text-right max-w-lg">
              Educational guidance, not legal advice. Always verify details with
              your local Ausländerbehörde.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
