import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'neutral' | 'error';
  className?: string;
}

/**
 * Empty state / error state — centered icon + copy + optional CTA.
 * Used on list pages when there's nothing to show yet, or on network errors.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'neutral',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed px-6 py-10 text-center',
        variant === 'error'
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
          : 'border-border-default bg-surface',
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
            variant === 'error'
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
              : 'bg-subtle text-text-muted',
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3
        className={cn(
          'text-base font-semibold',
          variant === 'error'
            ? 'text-red-900 dark:text-red-200'
            : 'text-text-primary',
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-1 max-w-md text-sm',
            variant === 'error'
              ? 'text-red-700 dark:text-red-300'
              : 'text-text-secondary',
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
