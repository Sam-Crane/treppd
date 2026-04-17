'use client';

import { createContext, forwardRef, useCallback, useContext, useMemo, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Toast primitive built on Radix. We expose an imperative `useToast()` hook
 * rather than requiring consumers to manage open-state — that's the 95% use
 * case (fire-and-forget toasts from async handlers).
 *
 * Wrap the app in <ToastProvider /> at the root (done in providers).
 */

type Variant = 'info' | 'success' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: Variant;
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

const toastVariants = cva(
  [
    'pointer-events-auto flex items-start gap-2 rounded-xl border px-3.5 py-3 shadow-md backdrop-blur',
    'data-[state=open]:animate-slide-up data-[swipe=end]:animate-out',
  ].join(' '),
  {
    variants: {
      variant: {
        info: 'bg-surface border-border-default text-text-primary',
        success: 'bg-surface border-emerald-200 text-text-primary dark:border-emerald-800',
        error: 'bg-surface border-red-200 text-text-primary dark:border-red-800',
        warning: 'bg-surface border-amber-200 text-text-primary dark:border-amber-800',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

function VariantIcon({ variant }: { variant: Variant }) {
  const classes = 'mt-0.5 h-4 w-4 flex-shrink-0';
  if (variant === 'success')
    return <CheckCircle2 className={cn(classes, 'text-emerald-600 dark:text-emerald-400')} />;
  if (variant === 'error')
    return <AlertCircle className={cn(classes, 'text-error')} />;
  if (variant === 'warning')
    return <AlertCircle className={cn(classes, 'text-amber-600 dark:text-amber-400')} />;
  return <Info className={cn(classes, 'text-accent')} />;
}

export const ToastRoot = forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
ToastRoot.displayName = ToastPrimitive.Root.displayName;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, ...t }]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((t) => (
          <ToastRoot
            key={t.id}
            variant={t.variant ?? 'info'}
            duration={t.duration ?? 5000}
            onOpenChange={(open) => {
              if (!open) remove(t.id);
            }}
          >
            <VariantIcon variant={t.variant ?? 'info'} />
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-0.5 text-xs text-text-secondary">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className="rounded p-0.5 text-text-muted transition hover:bg-subtle hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastRoot>
        ))}
        <ToastPrimitive.Viewport
          className={cn(
            'fixed bottom-0 right-0 z-[100] m-4 flex w-full max-w-sm flex-col gap-2',
            'outline-none',
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
