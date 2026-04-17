'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * BeforeInstallPromptEvent is a non-standard event exposed in Chromium-based
 * browsers. We type it locally so we don't depend on an ambient declaration.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'treppd-pwa-install-dismissed';
const DISMISS_DAYS = 14;
const SESSION_KEY = 'treppd-pwa-sessions';
const SESSION_THRESHOLD = 3;

/**
 * Install-to-home-screen prompt card.
 * - Listens for `beforeinstallprompt` on supported browsers
 * - Respects a 14-day dismissal (localStorage) so it doesn't nag
 * - Hidden entirely when already installed (display-mode: standalone)
 *
 * Designed to live at the bottom of the sidebar (desktop) or below the
 * sidebar's upgrade teaser. Compact enough to not disturb the layout.
 */
export function InstallPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already-installed check: no prompt needed
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // Safari stores this flag on the Navigator
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (inStandalone) return;

    // Session counter — only show after SESSION_THRESHOLD visits
    try {
      const count = parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10) + 1;
      localStorage.setItem(SESSION_KEY, String(count));
      if (count < SESSION_THRESHOLD) return;
    } catch {
      /* ignore */
    }

    // Respect user's past dismissal
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const until = parseInt(raw, 10);
        if (Number.isFinite(until) && Date.now() < until) return;
      }
    } catch {
      /* ignore */
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handler as EventListener,
      );
    };
  }, []);

  function dismiss() {
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferred(null);
    } else {
      dismiss();
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'relative rounded-xl border border-border-default bg-gradient-to-br from-emerald-50 via-surface to-surface p-3 dark:from-emerald-950/30',
            className,
          )}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="absolute right-1.5 top-1.5 rounded p-1 text-text-muted transition hover:bg-subtle hover:text-text-primary"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-success">
            <Download className="h-3 w-3" />
            Install app
          </div>
          <p className="mt-1 pr-4 text-xs text-text-secondary">
            Add Treppd to your home screen for faster access + push alerts.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={install}
            className="mt-2 w-full"
          >
            Install
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
