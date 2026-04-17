import { cn } from '@/lib/utils';

/**
 * Animated placeholder used while data is loading.
 * Prefer over spinners for layout-accurate loading states.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-subtle',
        className,
      )}
      {...props}
    />
  );
}
