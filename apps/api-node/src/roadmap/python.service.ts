import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { REQUEST } from '@nestjs/core';
import { Inject, Scope } from '@nestjs/common';
import type { Request } from 'express';

interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  timeoutMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 2,
  baseDelayMs: 500,
  timeoutMs: 30_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable({ scope: Scope.REQUEST })
export class PythonService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.baseUrl = this.config.getOrThrow('PYTHON_SERVICE_URL');
    this.apiKey = this.config.getOrThrow('INTERNAL_API_KEY');
  }

  private getRequestId(): string | undefined {
    const id = this.request?.headers['x-request-id'];
    return typeof id === 'string' ? id : undefined;
  }

  private async fetchWithRetry(
    path: string,
    body: Record<string, unknown>,
    opts: RetryOptions = DEFAULT_RETRY_OPTIONS,
  ): Promise<Record<string, unknown> | null> {
    const url = `${this.baseUrl}${path}`;
    const requestId = this.getRequestId();

    for (let attempt = 0; attempt <= opts.retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Internal-Key': this.apiKey,
        };
        if (requestId) headers['X-Request-ID'] = requestId;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          return (await response.json()) as Record<string, unknown>;
        }

        // Retry on 5xx, don't retry on 4xx
        if (response.status < 500 || attempt === opts.retries) {
          this.logger.warn(
            { path, status: response.status, attempt, requestId },
            'Python service returned non-retryable error',
          );
          return null;
        }

        this.logger.warn(
          { path, status: response.status, attempt, requestId },
          'Python service 5xx, retrying',
        );
      } catch (error) {
        clearTimeout(timeout);
        const message = (error as Error).message;

        if (attempt === opts.retries) {
          this.logger.warn(
            { path, attempt, error: message, requestId },
            'Python service unavailable after retries, falling back',
          );
          return null;
        }

        this.logger.warn(
          { path, attempt, error: message, requestId },
          'Python service error, retrying',
        );
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const delay = opts.baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }

    return null;
  }

  async generateRoadmap(
    profile: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    return this.fetchWithRetry('/roadmap/generate', profile);
  }

  async chat(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    return this.fetchWithRetry('/ai/chat', payload);
  }

  async explainField(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    return this.fetchWithRetry('/ai/explain-field', payload);
  }

  /**
   * Open a streaming connection to the FastAPI /ai/chat/stream endpoint
   * and return the raw SSE body as a ReadableStream. The caller is
   * responsible for parsing the `data:` frames and forwarding them.
   *
   * Unlike fetchWithRetry, we do NOT retry once the stream is open —
   * partial output reset would break the user-visible UX. We do retry
   * the initial connection on network errors.
   */
  async chatStream(
    payload: Record<string, unknown>,
  ): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.baseUrl}/ai/chat/stream`;
    const requestId = this.getRequestId();
    const maxAttempts = 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'X-Internal-Key': this.apiKey,
        };
        if (requestId) headers['X-Request-ID'] = requestId;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          this.logger.warn(
            {
              path: '/ai/chat/stream',
              status: response.status,
              attempt,
              requestId,
            },
            'Python streaming endpoint returned non-OK status',
          );
          if (response.status < 500 || attempt === maxAttempts - 1) {
            return null;
          }
          continue;
        }

        if (!response.body) {
          this.logger.warn('Python streaming response had no body');
          return null;
        }

        return response.body;
      } catch (error) {
        const message = (error as Error).message;
        this.logger.warn(
          {
            path: '/ai/chat/stream',
            attempt,
            error: message,
            requestId,
          },
          'Failed to open Python streaming connection',
        );
        if (attempt === maxAttempts - 1) return null;
        await sleep(500);
      }
    }

    return null;
  }
}
