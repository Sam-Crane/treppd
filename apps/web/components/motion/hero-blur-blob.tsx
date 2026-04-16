'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface HeroBlurBlobProps {
  className?: string;
  color?: string;
  size?: number;
  duration?: number;
}

export function HeroBlurBlob({
  className = '',
  color = '#1a365d',
  size = 500,
  duration = 12,
}: HeroBlurBlobProps) {
  const prefersReducedMotion = useReducedMotion();

  const style = {
    width: size,
    height: size,
    background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
  };

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden
        className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
        style={style}
      />
    );
  }

  return (
    <motion.div
      aria-hidden
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -20, 30, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
