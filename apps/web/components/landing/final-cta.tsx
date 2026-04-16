'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { FadeIn } from '@/components/motion/fade-in';
import { HeroBlurBlob } from '@/components/motion/hero-blur-blob';

export function FinalCTA() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a365d] via-[#2a4a75] to-[#4a73a9] px-4 sm:px-6 py-20 sm:py-24">
      {/* Subtle animated blob overlays */}
      <HeroBlurBlob
        className="-top-32 -left-20 opacity-40"
        color="#ffffff"
        size={420}
        duration={16}
      />
      <HeroBlurBlob
        className="-bottom-32 -right-20 opacity-30"
        color="#ffffff"
        size={520}
        duration={20}
      />

      <FadeIn className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
          Save your first 40 hours in Germany
        </h2>
        <p className="mt-5 text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
          Join the beta. Free for early users. Your roadmap in minutes.
        </p>

        <motion.div
          className="mt-10 inline-block"
          whileHover={
            prefersReducedMotion ? undefined : { scale: 1.03, y: -2 }
          }
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-white text-[#1a365d] text-base font-semibold px-8 py-3.5 rounded-lg shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a365d]"
          >
            Start your roadmap
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </FadeIn>
    </section>
  );
}
