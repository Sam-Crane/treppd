'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { SourceCitation } from './source-citation';
import { FeedbackButtons } from './feedback-buttons';
import { StreamingIndicator } from './streaming-indicator';
import type { RetrievedChunk } from '@/lib/sse';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  message_id?: string;
  log_id?: string;
  sources?: RetrievedChunk[];
}

interface MessageListProps {
  messages: ChatMessage[];
  /** Currently-streaming assistant text (rendered after the persisted list) */
  streamingText?: string | null;
  streamingSources?: RetrievedChunk[] | null;
  isStreaming?: boolean;
}

export function MessageList({
  messages,
  streamingText,
  streamingSources,
  isStreaming,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content. Streaming triggers this every chunk, which
  // can fight with manual scrolling — that's the cost of "always at bottom"
  // in a chat. Acceptable for MVP.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, streamingText]);

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 py-6">
      {messages.map((m, i) => (
        <div key={`${m.role}-${i}`} className="space-y-1">
          <MessageBubble
            role={m.role}
            content={m.content}
            asMarkdown={m.role === 'assistant'}
          />
          {m.role === 'assistant' && (
            <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
              <div className="flex-1">
                {m.sources && m.sources.length > 0 && (
                  <SourceCitation chunks={m.sources} />
                )}
              </div>
              {m.log_id && <FeedbackButtons logId={m.log_id} />}
            </div>
          )}
        </div>
      ))}

      {isStreaming && (
        <div className="space-y-1">
          {streamingText ? (
            <MessageBubble
              role="assistant"
              content={streamingText}
              asMarkdown
            />
          ) : (
            <MessageBubble role="assistant">
              <StreamingIndicator />
            </MessageBubble>
          )}
          {streamingSources && streamingSources.length > 0 && (
            <div className="max-w-[85%] sm:max-w-[75%]">
              <SourceCitation chunks={streamingSources} />
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
