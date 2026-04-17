import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = {
  sm: { width: 110, height: 36, cls: 'h-6 w-auto' },
  md: { width: 120, height: 40, cls: 'h-7 w-auto' },
};

/**
 * Centralized Treppd logo.
 *
 * Uses a raw <img> instead of Next.js <Image> because the Image component
 * optimizes PNGs into JPEGs — adding a white background that destroys
 * transparency. When the dark-mode CSS filter (`brightness(0) invert(1)`)
 * runs on a JPEG with a white background, the entire rectangle becomes
 * solid white and the logo is invisible.
 *
 * A raw <img> serves the original transparent PNG, so the filter correctly
 * produces white text on a transparent background.
 */
export function Logo({ size = 'md', className }: LogoProps) {
  const { width, height, cls } = SIZES[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/treppd-logo-horizontal.png"
      alt="Treppd"
      width={width}
      height={height}
      className={cn(cls, 'dark-logo-invert', className)}
    />
  );
}
