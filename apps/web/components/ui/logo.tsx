import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Treppd logo — dual-render approach for dark mode.
 *
 * The logo PNG has a solid background (not transparent), so CSS filter
 * tricks (brightness + invert) produce a solid white rectangle instead
 * of a visible logo. The only reliable fix is:
 *   - Light mode: show the original PNG image
 *   - Dark mode: show an SVG icon + styled text that inherits text color
 *
 * The SVG icon is a simplified version of the circuit-step icon from the
 * brand assets (treppd.jpeg). The text uses the same weight and tracking.
 */
export function Logo({ size = 'md', className }: LogoProps) {
  const isSmall = size === 'sm';
  const textSize = isSmall ? 'text-base' : 'text-lg';
  const iconSize = isSmall ? 'h-5 w-5' : 'h-6 w-6';
  const imgHeight = isSmall ? 'h-6' : 'h-7';

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {/* Light mode: show the PNG */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/treppd-logo-horizontal.png"
        alt="Treppd"
        className={cn(imgHeight, 'w-auto dark:hidden')}
      />

      {/* Dark mode: SVG icon + text that inherits color */}
      <span className="hidden items-center gap-1.5 dark:inline-flex">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(iconSize, 'text-accent')}
          aria-hidden="true"
        >
          {/* Simplified circuit/step icon matching the brand */}
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4 12h4" />
          <path d="M16 12h4" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          <circle cx="6" cy="12" r="1.5" fill="currentColor" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" />
        </svg>
        <span
          className={cn(
            textSize,
            'font-bold tracking-wider text-text-primary',
          )}
        >
          TREPPD
        </span>
      </span>
    </span>
  );
}
