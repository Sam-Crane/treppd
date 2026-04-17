'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------- bar

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  label,
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const height = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
          <span>{label ?? 'Progress'}</span>
          <span className="font-mono tabular-nums">
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn(
          'w-full overflow-hidden rounded-full bg-subtle',
          height,
        )}
      >
        <motion.div
          className={cn('h-full rounded-full bg-accent', barClassName)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- ring

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}

/**
 * Animated SVG progress ring. Used on the dashboard for roadmap %, docs %,
 * forms %. Variable-stroke so it scales cleanly from 60px to 200px.
 */
export function ProgressRing({
  value,
  max = 100,
  size = 96,
  strokeWidth = 8,
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-subtle"
        />
        {/* Fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          className="text-accent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ?? (
          <span className="font-mono text-lg font-semibold tabular-nums text-text-primary">
            {Math.round(pct)}%
          </span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
