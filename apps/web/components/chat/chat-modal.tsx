'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ChatWindow } from './chat-window';
import { cn } from '@/lib/utils';

/**
 * Chat launcher — renders a compact header button (Ask AI) and opens the
 * full chat experience as a right-docked panel on desktop, bottom-sheet on
 * mobile. The underlying <ChatWindow /> is reused as-is so SSE streaming,
 * history persistence, markdown, and source citations all keep working.
 */
export function ChatModalTrigger({
  className,
  label = 'Assistant',
  iconOnly = false,
}: {
  className?: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="secondary"
          size={iconOnly ? 'icon-sm' : 'sm'}
          className={cn('gap-1.5', className)}
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {!iconOnly && <span className="hidden sm:inline">{label}</span>}
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            // Mobile: full bottom sheet sliding up
            'fixed bottom-0 left-0 right-0 z-50 flex h-[88vh] flex-col bg-surface shadow-lg',
            'rounded-t-3xl border-t border-border-default',
            'data-[state=open]:animate-slide-up',
            // Desktop: right-docked panel
            'sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:h-auto sm:w-[440px] sm:rounded-3xl sm:border',
            'focus:outline-none',
          )}
          aria-describedby={undefined}
        >
          <header className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-subtle">
                <MessageCircle className="h-4 w-4 text-accent-hover dark:text-accent" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-sm font-semibold text-text-primary">
                  AI Assistant
                </DialogPrimitive.Title>
                <p className="text-[11px] text-text-muted">
                  Grounded in BAMF, DAAD, Make-it-in-Germany + city sources
                </p>
              </div>
            </div>
            <DialogPrimitive.Close
              className="rounded-md p-1.5 text-text-muted transition hover:bg-subtle hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1">
            <ChatWindow embedded />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
