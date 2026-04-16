'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { FadeIn } from '@/components/motion/fade-in';

interface Step {
  step: string;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    step: '1',
    title: 'Tell us your situation',
    body: 'Visa type, nationality, city, goal, dates. 2 minutes. Smart defaults skip what does not apply to you.',
  },
  {
    step: '2',
    title: 'Get your personalised roadmap',
    body: 'Verified steps from official sources, enriched by AI with tips and realistic wait times for your specific situation.',
  },
  {
    step: '3',
    title: 'Complete steps in the right order',
    body: 'Track progress, prepare documents, and never miss a deadline. Ask the AI anything along the way.',
  },
];

export function HowItWorksTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 70%', 'end 60%'],
  });

  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="bg-white px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-4xl mx-auto">
        <FadeIn className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From situation to first completed step, in three moves.
          </p>
        </FadeIn>

        <div ref={containerRef} className="relative">
          {/* Vertical connector line */}
          <div
            aria-hidden
            className="absolute left-5 sm:left-6 top-6 bottom-6 w-px bg-gray-200"
          />
          {!prefersReducedMotion && (
            <motion.div
              aria-hidden
              style={{ scaleY: lineScaleY, transformOrigin: 'top' }}
              className="absolute left-5 sm:left-6 top-6 bottom-6 w-px bg-gradient-to-b from-[#1a365d] via-[#2a4a75] to-[#4a73a9]"
            />
          )}
          {prefersReducedMotion && (
            <div
              aria-hidden
              className="absolute left-5 sm:left-6 top-6 bottom-6 w-px bg-gradient-to-b from-[#1a365d] via-[#2a4a75] to-[#4a73a9]"
            />
          )}

          <div className="relative space-y-10 sm:space-y-12">
            {steps.map((item, index) => (
              <FadeIn
                key={item.step}
                delay={index * 0.1}
                className="relative flex gap-5 sm:gap-6"
              >
                <div className="relative z-10 shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-bold shadow-lg shadow-[#1a365d]/20">
                  {item.step}
                </div>
                <div className="pt-1 sm:pt-1.5">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
