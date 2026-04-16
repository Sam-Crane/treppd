'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

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

  // Auto-resize textarea up to 5 rows
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const next = Math.min(ta.scrollHeight, 5 * 24 + 24); // ~5 lines
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
      className={`relative flex items-end gap-2 rounded-2xl border bg-white p-2 transition-all ${
        isFocused
          ? 'border-[#1a365d] shadow-sm'
          : 'border-gray-200'
      }`}
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
        className="flex-1 resize-none bg-transparent border-0 outline-none px-2 py-1.5 text-sm placeholder:text-gray-400 disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-end gap-1 self-end pb-0.5">
        {value.length > MAX_LENGTH * 0.8 && (
          <span
            className={`text-[10px] tabular-nums ${
              overLimit ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {remaining}
          </span>
        )}
        <motion.button
          whileHover={!disabled ? { scale: 1.05 } : undefined}
          whileTap={!disabled ? { scale: 0.95 } : undefined}
          onClick={onSubmit}
          disabled={disabled || !value.trim() || overLimit}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#1a365d] text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
