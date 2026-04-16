import { fetchEventSource } from '@microsoft/fetch-event-source';
import { createClient } from './supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RetrievedChunk {
  source: string | null;
  source_type: string | null;
  section: string | null;
  similarity: number | null;
}

export interface ChatStreamCallbacks {
  onRetrieved?: (chunks: RetrievedChunk[]) => void;
  onChunk?: (text: string) => void;
  onDone?: (meta: {
    message_id: string;
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
  }) => void;
  onError?: (message: string) => void;
}

/**
 * Open an SSE stream against the NestJS /chat/stream proxy.
 *
 * Uses Microsoft's fetch-event-source so we can send a POST body and
 * Authorization header — the native EventSource API only supports GET
 * requests with no custom headers.
 *
 * Returns an AbortController so the caller can cancel mid-stream when
 * the user navigates away or sends a new message.
 */
export async function streamChat(
  message: string,
  contextType: string | undefined,
  callbacks: ChatStreamCallbacks,
): Promise<AbortController> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const ctrl = new AbortController();

  fetchEventSource(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    },
    body: JSON.stringify({ message, context_type: contextType }),
    signal: ctrl.signal,
    openWhenHidden: true,

    onmessage(event) {
      if (!event.data) return;
      try {
        const parsed = JSON.parse(event.data) as
          | { type: 'retrieved'; chunks: RetrievedChunk[] }
          | { type: 'chunk'; text: string }
          | {
              type: 'done';
              message_id: string;
              input_tokens: number;
              output_tokens: number;
              latency_ms: number;
            }
          | { type: 'error'; message: string };

        switch (parsed.type) {
          case 'retrieved':
            callbacks.onRetrieved?.(parsed.chunks);
            break;
          case 'chunk':
            callbacks.onChunk?.(parsed.text);
            break;
          case 'done':
            callbacks.onDone?.({
              message_id: parsed.message_id,
              input_tokens: parsed.input_tokens,
              output_tokens: parsed.output_tokens,
              latency_ms: parsed.latency_ms,
            });
            ctrl.abort(); // close the connection cleanly
            break;
          case 'error':
            callbacks.onError?.(parsed.message);
            ctrl.abort();
            break;
        }
      } catch (err) {
        callbacks.onError?.(`Malformed SSE frame: ${(err as Error).message}`);
        ctrl.abort();
      }
    },

    onerror(err) {
      callbacks.onError?.(
        err instanceof Error ? err.message : 'Connection error',
      );
      // Returning nothing causes fetchEventSource to retry; throw to stop.
      throw err;
    },
  }).catch(() => {
    // Errors already surfaced via onError; swallow to avoid unhandled rejection
  });

  return ctrl;
}
