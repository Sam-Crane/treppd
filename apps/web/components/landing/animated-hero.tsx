'use client';

import Link from 'next/link';
import { ArrowRight, Globe } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { HeroBlurBlob } from '@/components/motion/hero-blur-blob';

const line1 = 'Navigate Germany.';
const line2 = 'Step by step.';

const wordVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function AnimatedWords({
  text,
  delay = 0,
  gradient = false,
}: {
  text: string;
  delay?: number;
  gradient?: boolean;
}) {
  const words = text.split(' ');
  return (
    <motion.span
      className={
        gradient
          ? 'bg-gradient-to-br from-[#1a365d] to-[#4a73a9] bg-clip-text text-transparent inline-block'
          : 'inline-block'
      }
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.08, delayChildren: delay },
        },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={wordVariants}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function AnimatedHero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-4 sm:px-6">
      {/* Background blobs */}
      <HeroBlurBlob
        className="-top-24 -left-32 opacity-60"
        color="#4a73a9"
        size={520}
        duration={14}
      />
      <HeroBlurBlob
        className="top-20 -right-40 opacity-50"
        color="#1a365d"
        size={600}
        duration={18}
      />

      <div className="relative max-w-4xl mx-auto text-center py-24 sm:py-32">
        {/* Pill badge */}
        <motion.div
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 backdrop-blur-xl bg-white/70 border border-white/40 shadow-sm text-[#1a365d] text-sm font-medium px-3 py-1.5 rounded-full mb-7"
        >
          <Globe className="w-4 h-4" />
          Built for non-EU immigrants in Germany
        </motion.div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
          {prefersReducedMotion ? (
            <>
              {line1}
              <br />
              <span className="bg-gradient-to-br from-[#1a365d] to-[#4a73a9] bg-clip-text text-transparent">
                {line2}
              </span>
            </>
          ) : (
            <>
              <AnimatedWords text={line1} delay={0.2} />
              <br />
              <AnimatedWords text={line2} delay={0.7} gradient />
            </>
          )}
        </h1>

        {/* Subhead */}
        <motion.p
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: prefersReducedMotion ? 0 : 1.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
        >
          Treppd is your AI-powered bureaucracy co-pilot. Personalised roadmaps,
          form-filling guides, and document checklists — all in plain English,
          tailored to your visa type and city.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: prefersReducedMotion ? 0 : 1.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-gradient-to-br from-[#1a365d] via-[#2a4a75] to-[#4a73a9] text-white text-base font-medium px-6 py-3 rounded-lg shadow-lg shadow-[#1a365d]/20 hover:shadow-xl hover:shadow-[#1a365d]/30 transition-all w-full sm:w-auto justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d] focus-visible:ring-offset-2"
          >
            Start your roadmap
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 backdrop-blur-xl bg-white/70 border border-white/40 text-gray-700 text-base font-medium px-6 py-3 rounded-lg hover:bg-white/90 transition-colors w-full sm:w-auto justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d] focus-visible:ring-offset-2"
          >
            I already have an account
          </Link>
        </motion.div>

        {/* Fine print */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            delay: prefersReducedMotion ? 0 : 1.5,
          }}
          className="mt-6 text-sm text-gray-500"
        >
          Free to start · No credit card required
        </motion.p>
      </div>
    </section>
  );
}
