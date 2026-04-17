'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

const MAX_LENGTH = 2000;

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isStreaming = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const next = Math.min(ta.scrollHeight, 5 * 24 + 24);
    ta.style.height = `${next}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  const remaining = MAX_LENGTH - value.length;
  const overLimit = remaining < 0;

  return (
    <div
      className={cn(
        'relative flex items-end gap-2 rounded-2xl border bg-surface p-2 transition-all',
        isFocused
          ? 'border-accent shadow-focus'
          : 'border-border-default',
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={
          isStreaming ? 'Generating answer…' : 'Ask about German bureaucracy…'
        }
        disabled={disabled}
        rows={1}
        maxLength={MAX_LENGTH + 100}
        className="flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-end gap-1 self-end pb-0.5">
        {value.length > MAX_LENGTH * 0.8 && (
          <span
            className={cn(
              'text-[10px] tabular-nums',
              overLimit ? 'text-error' : 'text-text-muted',
            )}
          >
            {remaining}
          </span>
        )}
        <motion.button
          whileHover={!disabled ? { scale: 1.05 } : undefined}
          whileTap={!disabled ? { scale: 0.95 } : undefined}
          onClick={onSubmit}
          disabled={disabled || !value.trim() || overLimit}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
            'bg-accent text-accent-foreground hover:bg-accent-hover',
            'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-text-muted',
          )}
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
