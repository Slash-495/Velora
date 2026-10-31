import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

/**
 * Normalizes cookie options for Supabase server cookies.
 * - Preserves `maxAge: 0` or past `expires` so Supabase can delete cookies (e.g. PKCE code_verifier, signOut).
 * - Only applies the 7-day default `maxAge` when the cookie has a non-empty value and no `maxAge`/`expires` was provided.
 * - Keeps `path: '/'` and `sameSite: 'lax'`.
 */
export function normalizeSupabaseCookieOptions(
  value: string,
  options?: CookieOptions
): CookieOptions {
  const expiresDate =
    options?.expires instanceof Date
      ? options.expires
      : typeof options?.expires === 'string' || typeof options?.expires === 'number'
        ? new Date(options.expires)
        : undefined

  const isExpiredInPast =
    expiresDate instanceof Date &&
    !Number.isNaN(expiresDate.getTime()) &&
    expiresDate.getTime() <= Date.now()

  const isDeletion =
    !value || options?.maxAge === 0 || (typeof options?.maxAge === 'number' && options.maxAge <= 0) || isExpiredInPast

  const normalized: CookieOptions = {
    ...options,
    path: '/',
    sameSite: 'lax',
  }

  if (isDeletion) {
    if (options?.maxAge === undefined && !isExpiredInPast) {
      normalized.maxAge = 0
    }
    return normalized
  }

  if (normalized.maxAge === undefined && normalized.expires === undefined) {
    normalized.maxAge = DEFAULT_MAX_AGE_SECONDS
  }

  return normalized
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                normalizeSupabaseCookieOptions(value, options)
              )
            )
          } catch {
            // Server Component ignore
          }
        },
      },
    }
  )
}
