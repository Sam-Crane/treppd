'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassmorphicCardProps {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
}

export function GlassmorphicCard({
  children,
  className = '',
  hoverLift = true,
}: GlassmorphicCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const baseClasses =
    'backdrop-blur-xl bg-white/70 border border-white/40 shadow-sm rounded-2xl p-6';

  if (prefersReducedMotion || !hoverLift) {
    return <div className={`${baseClasses} ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
}
