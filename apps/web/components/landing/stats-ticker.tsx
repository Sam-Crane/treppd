'use client';

import { useEffect, useRef, useState } from 'react';
import {
  animate,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { StaggerContainer } from '@/components/motion/stagger-container';
import { StaggerItem } from '@/components/motion/stagger-item';

interface Stat {
  /** Numeric portion to animate (null means display as-is, no count-up) */
  target: number | null;
  /** Suffix after the number, e.g. "K+" or "" */
  suffix: string;
  /** Prefix before the number (for static display) */
  display: string;
  label: string;
}

const stats: Stat[] = [
  {
    target: 400,
    suffix: 'K+',
    display: '400K+',
    label: 'International students in Germany',
  },
  {
    target: 300,
    suffix: 'K+',
    display: '300K+',
    label: 'Skilled workers on non-EU visas',
  },
  {
    target: null,
    suffix: '',
    display: '15–40h',
    label: 'Lost per person in first 3 months',
  },
  {
    target: 16,
    suffix: '',
    display: '16',
    label: 'Bundesländer with different rules',
  },
];

function CountUp({
  target,
  suffix,
  display,
  inView,
}: {
  target: number | null;
  suffix: string;
  display: string;
  inView: boolean;
}) {
  const [value, setValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (target === null) return;
    if (!inView) return;
    if (hasAnimatedRef.current) return;
    if (prefersReducedMotion) {
      setValue(target);
      hasAnimatedRef.current = true;
      return;
    }

    hasAnimatedRef.current = true;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [inView, target, prefersReducedMotion]);

  if (target === null) {
    return <>{display}</>;
  }

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

export function StatsTicker() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="border-y border-gray-100 bg-white px-4 sm:px-6 py-16"
    >
      <StaggerContainer
        className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
        staggerChildren={0.12}
      >
        {stats.map((stat) => (
          <StaggerItem key={stat.label} className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-[#1a365d] tabular-nums">
              <CountUp
                target={stat.target}
                suffix={stat.suffix}
                display={stat.display}
                inView={inView}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
