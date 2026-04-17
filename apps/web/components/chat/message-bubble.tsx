'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  children?: ReactNode;
  content?: string;
  /** Render markdown body content (assistant messages). User text is plain. */
  asMarkdown?: boolean;
}

/**
 * Chat message bubble. Uses semantic design tokens so both light and dark
 * modes work without per-component overrides. The assistant bubble also
 * ships a slightly smaller rounded corner on the left (`rounded-bl-md`)
 * and the user bubble does the same on the right for a classic chat look.
 */
export function MessageBubble({
  role,
  children,
  content,
  asMarkdown = false,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs sm:max-w-[75%]',
          isUser
            ? 'rounded-br-md bg-accent text-accent-foreground'
            : 'rounded-bl-md border border-border-default bg-surface text-text-primary',
        )}
      >
        {asMarkdown && content ? (
          <div
            className={cn(
              'prose prose-sm max-w-none',
              // Rhythm tweaks
              'prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5',
              'prose-headings:mb-1 prose-headings:mt-2',
              // Color semantics — follow tokens rather than hard-coded greys
              'prose-headings:text-text-primary',
              'prose-p:text-text-primary',
              'prose-strong:text-text-primary prose-strong:font-semibold',
              'prose-a:text-accent hover:prose-a:text-accent-hover',
              'prose-code:text-text-primary prose-code:bg-subtle prose-code:rounded prose-code:px-1 prose-code:py-0.5',
              'prose-pre:bg-subtle prose-pre:text-text-primary',
              'prose-blockquote:border-l-accent prose-blockquote:text-text-secondary',
              'prose-li:text-text-primary',
              'prose-hr:border-border-default',
              // Dark-mode prose inversion via the `prose-invert` modifier
              'dark:prose-invert',
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : content ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}
