import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

const mockExchangeCodeForSession = vi.fn();
const mockMiddlewareGetUser = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockMiddlewareGetUser,
    },
  })),
}));

import { GET as authCallbackGet } from '@/app/api/auth/callback/route';
import { sanitizeNextPath } from '@/lib/auth-redirect';
import { middleware } from '@/middleware';
import { deriveUserProfile, resolveAuthenticatedUser } from '@/hooks/use-auth';

describe('Authentication hardening: OAuth callback, middleware, and useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/auth/callback', () => {
    it('redirects to /sign-in?error=... and sets no cookie when exchangeCodeForSession fails', async () => {
      mockExchangeCodeForSession.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid PKCE code verifier' },
      });

      const req = new Request(
        'https://velora.example.com/api/auth/callback?code=bad-code&next=/dashboard'
      );
      const res = await authCallbackGet(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toBe(
        'https://velora.example.com/sign-in?error=Invalid%20PKCE%20code%20verifier'
      );
      expect(res.headers.get('set-cookie')).toBeNull();
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

      // Should pass through to /sign-in rather than redirecting to /dashboard
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
