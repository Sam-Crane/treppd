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

export function ChatWindow() {
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-white px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a365d] to-[#4a73a9] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              AI Assistant
            </h1>
            <p className="text-xs text-gray-500">
              Grounded in BAMF, Make-it-in-Germany, DAAD
            </p>
          </div>
        </div>
        {allMessages.length > 0 && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || isStreaming}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 disabled:opacity-50 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
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
          <div className="mx-4 sm:mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {streamError}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t bg-white px-4 sm:px-6 py-3">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => handleSend()}
          isStreaming={isStreaming}
        />
        <p className="mt-2 text-[10px] text-gray-400 text-center">
          Treppd is educational guidance, not legal advice. Always verify with
          your local Auslaenderbehoerde.
        </p>
      </div>
    </div>
  );
}
