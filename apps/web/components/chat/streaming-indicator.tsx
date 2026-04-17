'use client';

import { motion } from 'framer-motion';

export function StreamingIndicator() {
  return (
    <div
      className="inline-flex items-center gap-1"
      aria-label="Assistant is thinking"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-accent/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
