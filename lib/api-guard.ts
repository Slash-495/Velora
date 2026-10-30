import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export const INPUT_LIMITS = {
  MAX_SHORT_TEXT_CHARS: 500,
  MAX_TEXT_CHARS: 15_000,
  MAX_JSON_CHARS: 100_000,
  MAX_BASE64_CHARS: 7_000_000, // ~5MB binary file encoded as base64
} as const;

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit
) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers }
  );
}

export async function requireUser(): Promise<
  | { user: User; supabase: SupabaseClient; errorResponse: null }
  | { user: null; supabase: SupabaseClient; errorResponse: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      supabase,
      errorResponse: apiError(
        'UNAUTHORIZED',
        'Authentication required. Please sign in to use AI features.',
        401
      ),
    };
  }

  return { user, supabase, errorResponse: null };
}

export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
}

/**
 * Per-user fixed-window rate limiter backed by the `ai_usage` Supabase table.
 * Uses the atomic `increment_ai_usage` Postgres RPC (`INSERT ... ON CONFLICT DO UPDATE ... RETURNING count`)
 * so concurrent requests cannot race past the limit.
 * Returns a 429 NextResponse with a `Retry-After` header when limited, or null if allowed.
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  route: string,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const limit = options.limit ?? 10;
  const windowSeconds = options.windowSeconds ?? 60;
  const windowMs = windowSeconds * 1000;

  const nowMs = Date.now();
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const windowStartIso = new Date(windowStartMs).toISOString();
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStartMs + windowMs - nowMs) / 1000)
  );

  const { data: newCount, error: rpcError } = await supabase.rpc(
    'increment_ai_usage',
    {
      p_route: route,
      p_window_start: windowStartIso,
    }
  );

  if (rpcError || typeof newCount !== 'number') {
    console.error(
      `[RateLimiter] Atomic increment_ai_usage RPC failed for ${route} (user ${userId}):`,
      rpcError?.message
    );
    return apiError(
      'RATE_LIMIT_CHECK_FAILED',
      'Unable to verify rate limit status.',
      500
    );
  }

  if (newCount > limit) {
    return apiError(
      'RATE_LIMITED',
      `Rate limit exceeded for ${route}. Try again in ${retryAfterSeconds}s.`,
      429,
      { 'Retry-After': String(retryAfterSeconds) }
    );
  }

  return null;
}

export function validateStringLength(
  value: unknown,
  fieldName: string,
  maxLength: number = INPUT_LIMITS.MAX_TEXT_CHARS
): NextResponse | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    return apiError('BAD_REQUEST', `${fieldName} must be a string.`, 400);
  }
  if (value.length > maxLength) {
    return apiError(
      'PAYLOAD_TOO_LARGE',
      `${fieldName} exceeds maximum length of ${maxLength} characters.`,
      413
    );
  }
  return null;
}

export function validateJsonSize(
  value: unknown,
  fieldName: string,
  maxChars: number = INPUT_LIMITS.MAX_JSON_CHARS
): NextResponse | null {
  if (value === undefined || value === null) return null;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return apiError('BAD_REQUEST', `${fieldName} is not valid JSON.`, 400);
  }
  if (serialized.length > maxChars) {
    return apiError(
      'PAYLOAD_TOO_LARGE',
      `${fieldName} exceeds maximum serialized size of ${maxChars} characters.`,
      413
    );
  }
  return null;
}

export function handleAIError(error: any, context: string): NextResponse {
  console.error(`[AI Route Error] ${context}:`, error);

  if (error?.code === 'ETIMEDOUT' || error?.status === 504) {
    return apiError(
      'AI_TIMEOUT',
      'The AI service took too long to respond. Please try again.',
      504
    );
  }

  const isUpstreamRateLimit =
    error?.status === 429 ||
    error?.statusCode === 429 ||
    error?.message?.includes('429') ||
    error?.message?.toLowerCase().includes('rate limit') ||
    error?.message?.toLowerCase().includes('resource exhausted');

  if (isUpstreamRateLimit) {
    return apiError(
      'UPSTREAM_RATE_LIMITED',
      'AI provider quota temporarily exhausted. Please try again shortly.',
      503,
      { 'Retry-After': '30' }
    );
  }

  return apiError(
    'AI_GENERATION_FAILED',
    `Failed to ${context}. Please try again.`,
    502
  );
}
