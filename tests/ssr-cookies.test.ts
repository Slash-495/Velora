import { describe, expect, it, vi } from 'vitest';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

describe('@supabase/ssr getAll/setAll cookie contract regression test', () => {
  it('writes session cookies via setAll() on signIn and reads them via getAll() on the next request (middleware)', async () => {
    const cookieJar = new Map<string, string>();
    const getAllSpy = vi.fn(() =>
      Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value }))
    );
    const setAllSpy = vi.fn(
      (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        for (const { name, value, options } of cookiesToSet) {
          if (!value || options?.maxAge === 0) {
            cookieJar.delete(name);
          } else {
            cookieJar.set(name, value);
          }
        }
      }
    );

    const fakeJwtPayload = Buffer.from(
      JSON.stringify({
        sub: '11111111-1111-4111-8111-111111111111',
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64url');
    const fakeAccessToken = `eyJhbGciOiJIUzI1NiJ9.${fakeJwtPayload}.sig`;

    const fakeUser = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'tester@example.com',
      aud: 'authenticated',
      role: 'authenticated',
    };

    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify(fakeUser), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          access_token: fakeAccessToken,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'refresh-tok-123',
          user: fakeUser,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    // Request 1: Server action signs in and persists session cookies via setAll()
    const signInClient = createServerClient(
      'https://testref.supabase.co',
      'test-anon-key',
      {
        cookies: {
          getAll: getAllSpy,
          setAll: setAllSpy,
        },
        global: {
          fetch: mockFetch as unknown as typeof fetch,
        },
      }
    );

    const { data, error } = await signInClient.auth.signInWithPassword({
      email: 'tester@example.com',
      password: 'Password123!',
    });

    expect(error).toBeNull();
    expect(data.session?.access_token).toBe(fakeAccessToken);
    expect(setAllSpy).toHaveBeenCalled();
    expect(cookieJar.size).toBeGreaterThan(0);

    // Request 2: Fresh server/middleware client reads cookies via getAll() and authenticates user
    getAllSpy.mockClear();
    const middlewareClient = createServerClient(
      'https://testref.supabase.co',
      'test-anon-key',
      {
        cookies: {
          getAll: getAllSpy,
          setAll: setAllSpy,
        },
        global: {
          fetch: mockFetch as unknown as typeof fetch,
        },
      }
    );

    const { data: userData, error: userErr } = await middlewareClient.auth.getUser();
    expect(userErr).toBeNull();
    expect(getAllSpy).toHaveBeenCalled();
    expect(userData.user?.id).toBe(fakeUser.id);
    expect(userData.user?.email).toBe('tester@example.com');
  });
});
