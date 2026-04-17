'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Button — design-system primitive used everywhere.
 *
 * Variant-based API via class-variance-authority (CVA):
 *   <Button variant="primary" size="sm">Save</Button>
 *
 * `asChild` forwards the styling onto a child (e.g. a Next.js Link) so we
 * don't produce an invalid `<a><button></button></a>` tree.
 *
 * `loading` disables the button and shows a spinner while keeping width
 * stable (icon replaces leading content rather than stacking).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] transition-transform',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-foreground hover:bg-accent-hover shadow-xs',
        secondary:
          'bg-surface border border-border-default text-text-primary hover:bg-subtle',
        ghost:
          'bg-transparent text-text-secondary hover:bg-subtle hover:text-text-primary',
        outline:
          'border border-border-strong bg-transparent text-text-primary hover:bg-subtle',
        destructive:
          'bg-error text-white hover:bg-red-600 dark:hover:bg-red-500 shadow-xs',
        link: 'bg-transparent text-accent underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
