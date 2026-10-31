import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

const mockExchangeCodeForSession = vi.fn();
const mockMiddlewareGetUser = vi.fn();

vi.mock('@/utils/supabase/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/supabase/server')>();
  return {
    ...actual,
    createClient: vi.fn(async () => ({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    })),
  };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockMiddlewareGetUser,
    },
  })),
}));

import { GET as authCallbackGet } from '@/app/api/auth/callback/route';
import {
  sanitizeNextPath,
  PKCE_MISMATCH_FRIENDLY_MESSAGE,
} from '@/lib/auth-redirect';
import { normalizeSupabaseCookieOptions } from '@/utils/supabase/server';
import { middleware } from '@/middleware';
import { deriveUserProfile, resolveAuthenticatedUser } from '@/hooks/use-auth';

describe('Authentication hardening: OAuth callback, cookie handling, middleware, and useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/auth/callback', () => {
    it('maps a missing PKCE code verifier error to the friendly message and sets no cookie', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExchangeCodeForSession.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: {
          message:
            'invalid request: both auth code and code verifier should be non-empty (PKCE code verifier not found in storage)',
        },
      });

      const req = new Request(
        'https://velora.example.com/api/auth/callback?code=bad-code&next=/dashboard'
      );
      const res = await authCallbackGet(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toBe(
        `https://velora.example.com/sign-in?error=${encodeURIComponent(
          PKCE_MISMATCH_FRIENDLY_MESSAGE
        )}`
      );
      expect(res.headers.get('set-cookie')).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('redirects to /sign-in?error=... and sets no cookie on other exchangeCodeForSession errors', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExchangeCodeForSession.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Flow state has expired' },
      });

      const req = new Request(
        'https://velora.example.com/api/auth/callback?code=expired-code&next=/dashboard'
      );
      const res = await authCallbackGet(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'https://velora.example.com/sign-in?error=Flow%20state%20has%20expired'
      );
      expect(res.headers.get('set-cookie')).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('redirects to /sign-in?error=... and sets no cookie when code is missing', async () => {
      const req = new Request('https://velora.example.com/api/auth/callback');
      const res = await authCallbackGet(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'https://velora.example.com/sign-in?error=Missing%20authorization%20code'
      );
      expect(res.headers.get('set-cookie')).toBeNull();
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('rejects external and protocol-relative next URLs (open-redirect protection)', async () => {
      expect(sanitizeNextPath('https://evil.com/phish')).toBe('/dashboard');
      expect(sanitizeNextPath('//evil.com/phish')).toBe('/dashboard');
      expect(sanitizeNextPath('/\\evil.com')).toBe('/dashboard');
      expect(sanitizeNextPath('javascript:alert(1)')).toBe('/dashboard');
      expect(sanitizeNextPath('/dashboard/resume-studio')).toBe(
        '/dashboard/resume-studio'
      );

      mockExchangeCodeForSession.mockResolvedValueOnce({
        data: { session: { access_token: 'tok' }, user: { id: 'u1' } },
        error: null,
      });

      const req = new Request(
        'https://velora.example.com/api/auth/callback?code=valid-code&next=https://evil.com'
      );
      const res = await authCallbackGet(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'https://velora.example.com/dashboard'
      );
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });

  describe('utils/supabase/server setAll cookie normalization', () => {
    it('preserves maxAge: 0 and past expires for cookie deletions (code_verifier & signOut)', () => {
      const deletedByMaxAge = normalizeSupabaseCookieOptions('', {
        maxAge: 0,
        httpOnly: true,
      });
      expect(deletedByMaxAge).toEqual({
        maxAge: 0,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });

      const pastDate = new Date(0);
      const deletedByExpires = normalizeSupabaseCookieOptions('', {
        expires: pastDate,
      });
      expect(deletedByExpires.expires).toBe(pastDate);
      expect(deletedByExpires.maxAge).toBeUndefined();
      expect(deletedByExpires.path).toBe('/');
      expect(deletedByExpires.sameSite).toBe('lax');
    });

    it('applies the 7-day maxAge default only when value is non-empty and no maxAge/expires was provided', () => {
      const defaultSessionCookie = normalizeSupabaseCookieOptions(
        'session-token-value',
        { httpOnly: true }
      );
      expect(defaultSessionCookie).toEqual({
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      });

      const customMaxAgeCookie = normalizeSupabaseCookieOptions(
        'pkce-verifier-value',
        { maxAge: 300 }
      );
      expect(customMaxAgeCookie).toEqual({
        maxAge: 300,
        path: '/',
        sameSite: 'lax',
      });
    });
  });

  describe('middleware', () => {
    it('ignores a bare velora_remember_user cookie and redirects unauthenticated /dashboard requests to /sign-in', async () => {
      mockMiddlewareGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const req = new NextRequest('https://velora.example.com/dashboard', {
        headers: {
          cookie: 'velora_remember_user=true',
        },
      });

      const res = await middleware(req);
      expect(res.status).toBe(307);

      const redirectUrl = new URL(res.headers.get('location')!);
      expect(redirectUrl.pathname).toBe('/sign-in');
      expect(redirectUrl.searchParams.get('next')).toBe('/dashboard');
    });

    it('does not redirect OAuth error query params to /dashboard', async () => {
      mockMiddlewareGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const req = new NextRequest(
        'https://velora.example.com/sign-in?error=access_denied'
      );
      const res = await middleware(req);

      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('useAuth user resolution & profile derivation', () => {
    it('never fabricates a demo user when Supabase returns null', () => {
      expect(resolveAuthenticatedUser(null)).toBeNull();
      expect(resolveAuthenticatedUser(undefined)).toBeNull();
      expect(deriveUserProfile(null)).toEqual({
        displayName: '',
        avatarUrl: null,
      });
    });

    it('derives displayName and avatarUrl from Google OAuth user_metadata', () => {
      const googleUser = {
        id: 'real-google-uuid',
        email: 'arush@example.com',
        user_metadata: {
          full_name: 'Arush Sharma',
          picture: 'https://lh3.googleusercontent.com/a/avatar-pic',
        },
      } as unknown as User;

      expect(resolveAuthenticatedUser(googleUser)).toBe(googleUser);
      expect(deriveUserProfile(googleUser)).toEqual({
        displayName: 'Arush Sharma',
        avatarUrl: 'https://lh3.googleusercontent.com/a/avatar-pic',
      });
    });

    it('falls back to email prefix when full_name and name are absent', () => {
      const emailOnlyUser = {
        id: 'real-email-uuid',
        email: 'arush.dev@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(deriveUserProfile(emailOnlyUser)).toEqual({
        displayName: 'arush.dev',
        avatarUrl: null,
      });
    });
  });
});
