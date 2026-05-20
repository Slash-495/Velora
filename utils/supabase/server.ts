import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          const cookie = cookieStore.get(key)
          return cookie?.value ?? null
        },
        set(name, value, options) {
          cookieStore.set(name, value, {
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name, options) {
          cookieStore.delete(name, options)
        },
      },
    }
  )
}
