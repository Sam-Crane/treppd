'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function StickyNav() {
  const { scrollY } = useScroll();

  // Interpolate opacity and blur from 0 -> 1 as user scrolls past 50px
  const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.8]);
  const borderOpacity = useTransform(scrollY, [0, 50], [0, 1]);
  const backdropBlur = useTransform(
    scrollY,
    [0, 50],
    ['blur(0px)', 'blur(16px)']
  );

  return (
    <motion.nav
      className="sticky top-0 z-50"
      style={{ backdropFilter: backdropBlur }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-white"
        style={{ opacity: bgOpacity }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gray-200"
        style={{ opacity: borderOpacity }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d] focus-visible:ring-offset-2 rounded-md"
          >
            <Image
              src="/treppd-logo-horizontal.png"
              alt="Treppd"
              width={140}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d] focus-visible:ring-offset-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 bg-[#1a365d] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2a4a75] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a365d] focus-visible:ring-offset-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
