'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Sparkles } from 'lucide-react';

import { api } from '@/lib/api';
import { streamChat, type RetrievedChunk } from '@/lib/sse';
import { ChatInput } from './chat-input';
import { EmptyState } from './empty-state';
import { MessageList, type ChatMessage } from './message-list';

interface HistoryResponse {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function ChatWindow({ embedded = false }: { embedded?: boolean } = {}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [streamingSources, setStreamingSources] = useState<
    RetrievedChunk[] | null
  >(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const historyQuery = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => api.get<HistoryResponse>('/chat/history'),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.delete('/chat/history'),
    onSuccess: () => {
      setOptimisticMessages([]);
      queryClient.setQueryData(['chat-history'], { messages: [] });
    },
  });

  // Cancel any in-flight stream when the page unmounts
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const persistedMessages: ChatMessage[] = (
    historyQuery.data?.messages ?? []
  ).map((m) => ({ role: m.role, content: m.content }));

  const allMessages = [...persistedMessages, ...optimisticMessages];

  const handleSend = useCallback(
    async (overrideMessage?: string) => {
      const message = (overrideMessage ?? input).trim();
      if (!message || isStreaming) return;

      // Cancel any prior stream
      abortRef.current?.abort();

      setStreamError(null);
      setInput('');
      setOptimisticMessages((prev) => [
        ...prev,
        { role: 'user', content: message },
      ]);
      setStreamingText(''); // marks "streaming started"
      setStreamingSources(null);
      setIsStreaming(true);

      let assembled = '';
      let collectedSources: RetrievedChunk[] = [];

      const ctrl = await streamChat(message, 'general', {
        onRetrieved(chunks) {
          collectedSources = chunks;
          setStreamingSources(chunks);
        },
        onChunk(text) {
          assembled += text;
          setStreamingText(assembled);
        },
        onDone() {
          // Move the streaming message into the persisted (optimistic) list
          setOptimisticMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: assembled,
              sources: collectedSources,
            },
          ]);
          setStreamingText(null);
          setStreamingSources(null);
          setIsStreaming(false);
          // Refetch history from server so the persisted state is canonical
          queryClient.invalidateQueries({ queryKey: ['chat-history'] });
        },
        onError(message) {
          setStreamError(message);
          setStreamingText(null);
          setStreamingSources(null);
          setIsStreaming(false);
        },
      });

      abortRef.current = ctrl;
    },
    [input, isStreaming, queryClient],
  );

  const showEmpty = !historyQuery.isLoading && allMessages.length === 0;

  return (
    <div
      className={
        embedded
          ? 'flex h-full flex-col'
          : 'flex h-[calc(100vh-4rem)] flex-col'
      }
    >
      {/* Header — rendered only when NOT embedded (modal already has a header) */}
      {!embedded && (
        <div className="flex items-center justify-between border-b border-border-default bg-surface px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-hover text-accent-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary">
                AI Assistant
              </h1>
              <p className="text-xs text-text-muted">
                Grounded in BAMF, Make-it-in-Germany, DAAD
              </p>
            </div>
          </div>
          {allMessages.length > 0 && (
            <button
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || isStreaming}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-subtle hover:text-error disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* In-modal clear button */}
      {embedded && allMessages.length > 0 && (
        <div className="flex items-center justify-end border-b border-border-default bg-surface px-3 py-1.5">
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || isStreaming}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-text-muted transition-colors hover:bg-subtle hover:text-error disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-subtle dark:bg-base">
        {showEmpty ? (
          <EmptyState onSuggestionClick={(s) => handleSend(s)} />
        ) : (
          <MessageList
            messages={allMessages}
            streamingText={streamingText}
            streamingSources={streamingSources}
            isStreaming={isStreaming}
          />
        )}

        {streamError && (
          <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-error dark:border-red-900 dark:bg-red-950/40 sm:mx-6">
            {streamError}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border-default bg-surface px-4 py-3 sm:px-6">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => handleSend()}
          isStreaming={isStreaming}
        />
        <p className="mt-2 text-center text-[10px] text-text-muted">
          Treppd is educational guidance, not legal advice. Always verify with
          your local Auslaenderbehoerde.
        </p>
      </div>
    </div>
  );
}
