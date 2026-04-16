'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'h1' | 'h2' | 'p' | 'span';
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  y = 20,
  once = true,
  className,
  as = 'div',
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-50px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
