import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const mockGetUser = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import { enforceRateLimit, requireUser } from '@/lib/api-guard';

describe('api-guard: requireUser & atomic enforceRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 UNAUTHORIZED when request is unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Auth session missing!' },
    });

    const result = await requireUser();
    expect(result.user).toBeNull();
    expect(result.errorResponse).not.toBeNull();
    expect(result.errorResponse!.status).toBe(401);

    const payload = await result.errorResponse!.json();
    expect(payload).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to use AI features.',
      },
    });
  });

  it('returns 429 RATE_LIMITED with Retry-After header when atomic increment_ai_usage exceeds limit', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: 11, // 11th request in a 10-request window
      error: null,
    });

    const mockSupabase = {
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    const response = await enforceRateLimit(
      mockSupabase,
      '11111111-1111-4111-8111-111111111111',
      'analyze-resume',
      { limit: 10, windowSeconds: 60 }
    );

    expect(rpcMock).toHaveBeenCalledWith(
      'increment_ai_usage',
      expect.objectContaining({
        p_route: 'analyze-resume',
        p_window_start: expect.any(String),
      })
    );
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    const retryAfter = Number(response!.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);

    const payload = await response!.json();
    expect(payload.error.code).toBe('RATE_LIMITED');
    expect(payload.error.message).toContain('analyze-resume');
  });

  it('allows under-limit requests when atomic increment_ai_usage returns count <= limit', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: 4,
      error: null,
    });

    const mockSupabase = {
      rpc: rpcMock,
    } as unknown as SupabaseClient;

    const response = await enforceRateLimit(
      mockSupabase,
      '11111111-1111-4111-8111-111111111111',
      'analyze-resume',
      { limit: 10, windowSeconds: 60 }
    );

    expect(response).toBeNull();
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });
});
