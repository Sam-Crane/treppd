'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';

type ThemeKey = 'light' | 'dark' | 'system';

const OPTIONS: Array<{ key: ThemeKey; label: string; Icon: typeof Sun }> = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'System', Icon: Monitor },
];

/**
 * Tri-state theme toggle (Light / Dark / System).
 *
 * Renders a compact segmented control on desktop and a dropdown on mobile.
 * Guards against hydration mismatch by only rendering the active indicator
 * after the component has mounted.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active: ThemeKey = mounted ? ((theme as ThemeKey) ?? 'system') : 'system';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-0.5 text-slate-600 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
        className,
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ key, label, Icon }) => {
        const selected = mounted && active === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => setTheme(key)}
            className={cn(
              'relative flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              selected
                ? 'text-slate-900 dark:text-slate-100'
                : 'hover:text-slate-900 dark:hover:text-slate-100',
            )}
          >
            <AnimatePresence>
              {selected && (
                <motion.span
                  layoutId="theme-toggle-active"
                  className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-800"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </AnimatePresence>
            <Icon className="relative z-10 h-3.5 w-3.5" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
