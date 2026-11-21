/**
 * Gemini Embeddings helper (`gemini-embedding-001`, 768 dimensions via MRL truncation + L2 normalization).
 *
 * Uses the existing `GEMINI_API_KEY`, supports single and batched calls (`batchEmbedContents`),
 * exponential backoff retry on HTTP 429/5xx (respecting `RetryInfo.retryDelay`), and a 25s per-call timeout.
 */

export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 768;
export const DEFAULT_EMBEDDING_TIMEOUT_MS = 25_000;
export const MAX_GEMINI_BATCH_SIZE = 100;

export type EmbeddingTaskType =
  | 'RETRIEVAL_DOCUMENT'
  | 'RETRIEVAL_QUERY'
  | 'SEMANTIC_SIMILARITY';

export interface EmbedOptions {
  apiKey?: string;
  model?: string;
  taskType?: EmbeddingTaskType;
  outputDimensionality?: number;
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
}

export interface EmbedBatchOptions extends EmbedOptions {
  batchSize?: number;
  /** Minimum delay in ms between sequential batch requests (for free-tier RPM pacing). */
  throttleDelayMs?: number;
  onBatchComplete?: (info: {
    batchIndex: number;
    totalBatches: number;
    processedCount: number;
    totalCount: number;
  }) => void;
}

/**
 * L2-normalizes a vector so cosine similarity equals inner product.
 * Recommended by Google AI docs when using Matryoshka truncated dimensions (< 3072) on gemini-embedding-001.
 */
export function normalizeVector(values: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < values.length; i++) {
    sumSq += values[i] * values[i];
  }
  const norm = Math.sqrt(sumSq);
  if (!Number.isFinite(norm) || norm === 0) {
    return values.slice();
  }
  return values.map((v) => v / norm);
}

/**
 * Formats a numeric vector for pgvector SQL / PostgREST RPC parameters (`[0.123456,...]`).
 */
export function toPgVector(values: number[]): string {
  return `[${values.map((v) => Number(v.toFixed(7))).join(',')}]`;
}

function resolveApiKey(explicitKey?: string): string {
  const key = explicitKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return key;
}

function parseRetryDelayMs(errorBody: any): number | null {
  const details = errorBody?.error?.details;
  if (!Array.isArray(details)) return null;
  for (const detail of details) {
    const raw = detail?.retryDelay;
    if (typeof raw === 'string') {
      const m = raw.match(/^(\d+(?:\.\d+)?)s$/);
      if (m) {
        return Math.ceil(Number(m[1]) * 1000);
      }
    }
  }
  return null;
}

function isDailyQuotaExhausted(errorBody: any): boolean {
  const msg = String(errorBody?.error?.message || '');
  const details = JSON.stringify(errorBody?.error?.details || '');
  return (
    /RequestsPerDay/i.test(msg) ||
    /RequestsPerDay/i.test(details) ||
    /PerDay/i.test(details)
  );
}

async function fetchJsonWithTimeoutAndRetry(
  url: string,
  payload: unknown,
  options: {
    maxRetries: number;
    initialDelayMs: number;
    backoffFactor: number;
    timeoutMs: number;
  }
): Promise<any> {
  let attempt = 0;

  while (attempt <= options.maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        return body;
      }

      const errMsg =
        body?.error?.message || `Gemini embedding HTTP ${res.status}`;
      const err: any = new Error(errMsg);
      err.status = res.status;
      err.body = body;

      // Do not waste retries when daily free-tier RPD quota is exhausted
      if (res.status === 429 && isDailyQuotaExhausted(body)) {
        err.code = 'DAILY_QUOTA_EXHAUSTED';
        throw err;
      }

      const retryable =
        res.status === 429 || (res.status >= 500 && res.status < 600);
      attempt++;

      if (!retryable || attempt > options.maxRetries) {
        throw err;
      }

      const serverDelay = parseRetryDelayMs(body);
      const expDelay = Math.round(
        options.initialDelayMs * Math.pow(options.backoffFactor, attempt - 1) +
          Math.random() * 250
      );
      const delayMs = serverDelay !== null ? Math.max(serverDelay + 500, expDelay) : expDelay;
      console.warn(
        `[Embeddings HTTP ${res.status}] Retrying (attempt ${attempt}/${options.maxRetries}) after ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const timeoutErr: any = new Error(
          `Embedding request timed out after ${options.timeoutMs}ms`
        );
        timeoutErr.code = 'ETIMEDOUT';
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      if (err?.status !== undefined || err?.code === 'DAILY_QUOTA_EXHAUSTED') {
        throw err;
      }
      attempt++;
      if (attempt > options.maxRetries) {
        throw err;
      }
      const delayMs = Math.round(
        options.initialDelayMs * Math.pow(options.backoffFactor, attempt - 1) +
          Math.random() * 250
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('Maximum embedding retry attempts reached.');
}

/**
 * Generates a single normalized 768-d embedding using Gemini `gemini-embedding-001`.
 */
export async function embedText(
  text: string,
  options: EmbedOptions = {}
): Promise<number[]> {
  const cleaned = text.trim();
  if (!cleaned) {
    throw new Error('Cannot embed empty text.');
  }

  const apiKey = resolveApiKey(options.apiKey);
  const model = options.model || EMBEDDING_MODEL;
  const dims = options.outputDimensionality ?? EMBEDDING_DIMENSIONS;
  const taskType = options.taskType ?? 'RETRIEVAL_QUERY';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:embedContent?key=${encodeURIComponent(apiKey)}`;

  const body = await fetchJsonWithTimeoutAndRetry(
    url,
    {
      model: `models/${model}`,
      content: { parts: [{ text: cleaned }] },
      outputDimensionality: dims,
      taskType,
    },
    {
      maxRetries: options.maxRetries ?? 3,
      initialDelayMs: options.initialDelayMs ?? 1000,
      backoffFactor: options.backoffFactor ?? 2,
      timeoutMs: options.timeoutMs ?? DEFAULT_EMBEDDING_TIMEOUT_MS,
    }
  );

  const values = body?.embedding?.values;
  if (!Array.isArray(values) || values.length !== dims) {
    throw new Error(
      `Unexpected embedding response length: expected ${dims}, got ${
        Array.isArray(values) ? values.length : 'non-array'
      }`
    );
  }

  return normalizeVector(values);
}

/**
 * Generates normalized 768-d embeddings in batches using `batchEmbedContents`.
 * Respects `batchSize` (<= 100), optional `throttleDelayMs`, exponential backoff, and 25s timeouts.
 */
export async function embedBatch(
  texts: string[],
  options: EmbedBatchOptions = {}
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = resolveApiKey(options.apiKey);
  const model = options.model || EMBEDDING_MODEL;
  const dims = options.outputDimensionality ?? EMBEDDING_DIMENSIONS;
  const taskType = options.taskType ?? 'RETRIEVAL_DOCUMENT';
  const batchSize = Math.min(
    Math.max(options.batchSize ?? 50, 1),
    MAX_GEMINI_BATCH_SIZE
  );
  const throttleDelayMs = Math.max(options.throttleDelayMs ?? 0, 0);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`;

  const totalBatches = Math.ceil(texts.length / batchSize);
  const allEmbeddings: number[][] = [];

  for (let b = 0; b < totalBatches; b++) {
    const start = b * batchSize;
    const chunk = texts.slice(start, start + batchSize);
    const batchStart = Date.now();

    const body = await fetchJsonWithTimeoutAndRetry(
      url,
      {
        requests: chunk.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text: text.trim() || ' ' }] },
          outputDimensionality: dims,
          taskType,
        })),
      },
      {
        maxRetries: options.maxRetries ?? 4,
        initialDelayMs: options.initialDelayMs ?? 1500,
        backoffFactor: options.backoffFactor ?? 2,
        timeoutMs: options.timeoutMs ?? DEFAULT_EMBEDDING_TIMEOUT_MS,
      }
    );

    const embeddings = body?.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== chunk.length) {
      throw new Error(
        `Unexpected batchEmbedContents count: expected ${chunk.length}, got ${
          Array.isArray(embeddings) ? embeddings.length : 'non-array'
        }`
      );
    }

    for (const item of embeddings) {
      const vals = item?.values;
      if (!Array.isArray(vals) || vals.length !== dims) {
        throw new Error(
          `Unexpected vector dimension in batch: expected ${dims}, got ${
            Array.isArray(vals) ? vals.length : 'non-array'
          }`
        );
      }
      allEmbeddings.push(normalizeVector(vals));
    }

    options.onBatchComplete?.({
      batchIndex: b + 1,
      totalBatches,
      processedCount: allEmbeddings.length,
      totalCount: texts.length,
    });

    if (throttleDelayMs > 0 && b < totalBatches - 1) {
      const elapsed = Date.now() - batchStart;
      const waitMs = throttleDelayMs - elapsed;
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  return allEmbeddings;
}
