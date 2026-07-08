/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import CircuitBreaker from 'opossum';

/**
 * We test a FRESH breaker with the same config as the singleton, wrapping a
 * controllable stub. Sharing the module-level singleton across tests would
 * leak state; opossum has no "reset" API that guarantees clean stats.
 */
function buildBreaker(action: (arg: any) => Promise<any>) {
  return new CircuitBreaker(action, {
    timeout: 100,
    errorThresholdPercentage: 50,
    resetTimeout: 60,
    rollingCountTimeout: 1_000,
    rollingCountBuckets: 10,
    // Volume threshold of 1 so a single failure can trip the breaker in tests.
    volumeThreshold: 1,
  });
}

describe('python-service circuit breaker', () => {
  afterEach(() => jest.useRealTimers());

  it('passes through when the action succeeds (CLOSED)', async () => {
    const breaker = buildBreaker(() => Promise.resolve({ ok: 1 }));
    const res = await breaker.fire({} as any);
    expect(res).toEqual({ ok: 1 });
    expect(breaker.opened).toBe(false);
  });

  it('opens after crossing the failure threshold and fails fast', async () => {
    const breaker = buildBreaker(() =>
      Promise.reject(new Error('remote is down')),
    );
    // First call: fails through, but trips the breaker (threshold=50%,
    // volumeThreshold=1, so one failure is enough).
    await expect(breaker.fire({} as any)).rejects.toThrow('remote is down');
    expect(breaker.opened).toBe(true);

    // Second call: fails FAST via EOPENBREAKER; the action never runs.
    let ran = false;
    const spyBreaker = buildBreaker(() => {
      ran = true;
      return Promise.resolve('should not run');
    });
    // Force the spy breaker into open state by tripping it first.
    spyBreaker.fallback(() => 'fell-back');
    (spyBreaker as any).open();
    const res = await spyBreaker.fire({} as any);
    expect(ran).toBe(false);
    expect(res).toBe('fell-back');
  });

  it('half-opens after resetTimeout and closes on a successful probe', async () => {
    let mode: 'fail' | 'ok' = 'fail';
    const breaker = buildBreaker(() =>
      mode === 'fail'
        ? Promise.reject(new Error('down'))
        : Promise.resolve('healthy'),
    );

    await expect(breaker.fire({} as any)).rejects.toThrow('down');
    expect(breaker.opened).toBe(true);

    // Wait past resetTimeout so opossum transitions to half-open.
    await new Promise((r) => setTimeout(r, 80));

    // Flip the remote to healthy; the probe call should close the breaker.
    mode = 'ok';
    const res = await breaker.fire({} as any);
    expect(res).toBe('healthy');
    expect(breaker.opened).toBe(false);
    expect(breaker.closed).toBe(true);
  });
});
