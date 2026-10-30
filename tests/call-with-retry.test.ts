import { describe, expect, it, vi, beforeEach } from 'vitest';
import { callWithRetry } from '@/lib/ai-retry-cache';

describe('callWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Make Math.random deterministic (0 jitter) so backoff intervals can be asserted accurately
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  it('retries on 429 errors with exponential backoff and resolves when a retry succeeds', async () => {
    let attempts = 0;
    const timestamps: number[] = [];

    const fn = vi.fn(async () => {
      attempts++;
      timestamps.push(Date.now());
      if (attempts <= 2) {
        const err = new Error('429 Too Many Requests: rate limit exceeded') as Error & {
          status?: number;
        };
        err.status = 429;
        throw err;
      }
      return 'ok-on-third-try';
    });

    const result = await callWithRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 25,
      backoffFactor: 2,
      timeoutMs: 1000,
    });

    expect(result).toBe('ok-on-third-try');
    expect(fn).toHaveBeenCalledTimes(3);

    const firstDelay = timestamps[1] - timestamps[0];
    const secondDelay = timestamps[2] - timestamps[1];
    // Second backoff delay (~50ms) should be greater than the first (~25ms)
    expect(firstDelay).toBeGreaterThanOrEqual(15);
    expect(secondDelay).toBeGreaterThanOrEqual(firstDelay);
  });

  it('gives up and rethrows the 429 error after maxRetries is exhausted', async () => {
    const rateLimitError = Object.assign(
      new Error('Resource exhausted (429)'),
      { status: 429 }
    );
    const fn = vi.fn().mockRejectedValue(rateLimitError);

    await expect(
      callWithRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
        backoffFactor: 2,
        timeoutMs: 1000,
      })
    ).rejects.toThrow('Resource exhausted (429)');

    // 1 initial attempt + 2 retries = 3 total invocations
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-429 errors', async () => {
    const fatalError = Object.assign(new Error('Invalid API key'), {
      status: 400,
    });
    const fn = vi.fn().mockRejectedValue(fatalError);

    await expect(
      callWithRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 2,
        timeoutMs: 1000,
      })
    ).rejects.toThrow('Invalid API key');

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
