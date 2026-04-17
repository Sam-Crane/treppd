'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  children?: ReactNode;
  content?: string;
  /** Render markdown body content (assistant messages). User text is plain. */
  asMarkdown?: boolean;
}

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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#1a365d] text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {asMarkdown && content ? (
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:mt-2 prose-headings:mb-1 prose-strong:text-gray-900 prose-a:text-[#1a365d]">
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
