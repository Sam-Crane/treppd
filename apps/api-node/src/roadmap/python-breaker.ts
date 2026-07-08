import CircuitBreaker from 'opossum';

/**
 * Circuit breaker for calls to the FastAPI intelligence service.
 *
 * State machine (opossum):
 *   CLOSED   → calls pass through; failures are counted in a 10-second window
 *   OPEN     → after 50% error rate, calls fail-fast for 15s (fire() throws)
 *   HALF     → one probe call is allowed; success closes, failure re-opens
 *
 * The action wraps a full `fetchWithRetry` cycle (retries + backoff live
 * inside), so one HTTP request = one breaker invocation. That way a briefly
 * flaky remote doesn't trip the breaker on transient jitter.
 *
 * The breaker is a MODULE-LEVEL singleton so state persists across requests
 * (PythonService itself is @Scope.REQUEST, which would reset per-request
 * state if the breaker lived there). All callers share the same rolling
 * window and the same open/closed decision.
 */

export interface PythonCallInput {
  path: string;
  body: Record<string, unknown>;
  timeoutMs: number;
  retries: number;
  baseUrl: string;
  apiKey: string;
  requestId?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The wrapped action: exactly the fetch + retry loop that used to live inside
 * PythonService. On terminal failure it throws (so opossum counts the error);
 * on success it resolves with the parsed JSON body. Consumers that want the
 * "null means degraded" shape catch downstream.
 */
async function doPythonCall(
  input: PythonCallInput,
): Promise<Record<string, unknown>> {
  const url = `${input.baseUrl}${input.path}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= input.retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Internal-Key': input.apiKey,
      };
      if (input.requestId) headers['X-Request-ID'] = input.requestId;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(input.body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        return (await response.json()) as Record<string, unknown>;
      }
      // 4xx: don't retry; throw so the breaker counts it.
      if (response.status < 500) {
        throw new Error(`Python ${response.status}`);
      }
      lastError = new Error(`Python ${response.status}`);
    } catch (err) {
      clearTimeout(timeout);
      lastError = err as Error;
      if (attempt === input.retries) break;
    }

    // Exponential backoff between attempts.
    await sleep(500 * Math.pow(2, attempt));
  }
  throw lastError ?? new Error('Python call failed');
}

export const pythonBreaker = new CircuitBreaker(doPythonCall, {
  timeout: 60_000, // hard cap per call (larger than typical action)
  errorThresholdPercentage: 50, // open at 50% error rate
  resetTimeout: 15_000, // half-open probe after 15s
  rollingCountTimeout: 10_000, // sample window
  rollingCountBuckets: 10,
  name: 'python-service',
});

// Do not fall back to a stale success — callers translate "breaker rejected"
// into null via catch.
pythonBreaker.on('open', () => {
  console.warn('[circuit] python-service OPEN — degrading to fallback');
});
pythonBreaker.on('halfOpen', () => {
  console.warn('[circuit] python-service HALF-OPEN — probing');
});
pythonBreaker.on('close', () => {
  console.warn('[circuit] python-service CLOSED — healthy');
});
