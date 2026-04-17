import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
  {
    variants: {
      variant: {
        neutral:
          'bg-subtle text-text-secondary',
        info: 'bg-accent/10 text-accent-hover dark:text-accent',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        error: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
        outline:
          'border border-border-default bg-transparent text-text-secondary',
      },
      size: {
        sm: 'px-1.5 text-[9px]',
        md: 'px-2 text-[10px]',
        lg: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
