'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * next-themes wrapper.
 *
 * - `attribute="class"` applies `html.dark` which our Tailwind config keys on
 * - `defaultTheme="system"` respects the user's OS preference on first visit
 * - `disableTransitionOnChange` prevents the flash of transitioning colors
 *   across the whole page when they toggle
 * - `enableSystem` lets the user pick a persistent "system" option
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
