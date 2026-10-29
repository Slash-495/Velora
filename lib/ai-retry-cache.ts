/**
 * Utility for AI API Call Resilience:
 * 1. Exponential backoff retry logic for HTTP 429 / Rate Limit errors
 * 2. In-memory response caching for repeated prompts
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class AICacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTLMs = 60 * 60 * 1000; // 1 hour TTL

  private generateKey(prefix: string, payload: any): string {
    try {
      return `${prefix}:${JSON.stringify(payload)}`;
    } catch {
      return `${prefix}:${String(payload)}`;
    }
  }

  public get<T>(prefix: string, payload: any): T | null {
    const key = this.generateKey(prefix, payload);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() - entry.timestamp > this.defaultTTLMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public set<T>(prefix: string, payload: any, data: T): void {
    const key = this.generateKey(prefix, payload);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export const aiCache = new AICacheManager();

/**
 * Executes an async function (e.g. Gemini AI generation) with HTTP 429 retry, exponential backoff, and request timeout.
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 800;
  const backoffFactor = options.backoffFactor ?? 2;
  const timeoutMs = options.timeoutMs ?? 25000;

  let attempt = 0;

  while (attempt <= maxRetries) {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          const timeoutError = new Error(`AI request timed out after ${timeoutMs}ms`);
          (timeoutError as any).code = "ETIMEDOUT";
          (timeoutError as any).status = 504;
          reject(timeoutError);
        }, timeoutMs);
      });

      return await Promise.race([fn(), timeoutPromise]);
    } catch (err: any) {
      attempt++;

      const isRateLimit = 
        err?.status === 429 || 
        err?.statusCode === 429 || 
        err?.message?.includes("429") || 
        err?.message?.toLowerCase().includes("rate limit") || 
        err?.message?.toLowerCase().includes("resource exhausted");

      if (!isRateLimit || attempt > maxRetries) {
        throw err;
      }

      // Calculate exponential backoff delay with jitter
      const delay = Math.round(initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 200);
      console.warn(`[AI Rate Limit 429] Retrying request (Attempt ${attempt}/${maxRetries}) after ${delay}ms delay...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  throw new Error("Maximum AI API retry attempts reached.");
}
