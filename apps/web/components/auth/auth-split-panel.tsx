'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { HeroBlurBlob } from '@/components/motion/hero-blur-blob';

interface AuthSplitPanelProps {
  children: ReactNode;
  /** Illustration panel content (defaults to the marketing block) */
  illustration?: ReactNode;
}

const defaultIllustration = (
  <div className="relative z-10 text-white max-w-md">
    <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
      Navigate Germany.
      <br />
      <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
        Step by step.
      </span>
    </h2>
    <p className="mt-6 text-white/80 text-base leading-relaxed">
      AI-powered roadmaps, form guides, and document checklists —
      tailored to your visa type and Bundesland.
    </p>
    <div className="mt-8 flex flex-col gap-3 text-sm text-white/80">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">
          ✓
        </span>
        <span>Personalised for your situation in under 2 minutes</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">
          ✓
        </span>
        <span>Free to start — no credit card required</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">
          ✓
        </span>
        <span>Verified steps from official German sources</span>
      </div>
    </div>
  </div>
);

export function AuthSplitPanel({
  children,
  illustration = defaultIllustration,
}: AuthSplitPanelProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Mobile top bar */}
      <header className="lg:hidden px-4 sm:px-6 py-4 border-b bg-white">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/treppd-logo-horizontal.png"
            alt="Treppd"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </header>

      {/* Form panel (left on desktop, full on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 lg:py-0"
      >
        <div className="w-full max-w-md">
          {/* Desktop logo above form */}
          <div className="hidden lg:block mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/treppd-logo-horizontal.png"
                alt="Treppd"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>
          {children}
        </div>
      </motion.div>

      {/* Illustration panel (right on desktop, hidden on mobile) */}
      <div className="hidden lg:flex relative overflow-hidden lg:w-[40%] bg-gradient-to-br from-[#1a365d] via-[#2a4a75] to-[#4a73a9] items-center justify-center p-12">
        <HeroBlurBlob
          className="-top-32 -right-32"
          color="#ffffff"
          size={500}
          duration={15}
        />
        <HeroBlurBlob
          className="-bottom-32 -left-32"
          color="#4a73a9"
          size={400}
          duration={18}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10"
        >
          {illustration}
        </motion.div>
      </div>
    </div>
  );
}
