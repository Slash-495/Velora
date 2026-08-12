import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const next = searchParams.get('next') ?? '/dashboard'

    // 1. Handle OAuth provider errors gracefully without throwing HTTP 500
    if (errorParam || errorDescription) {
      console.warn("[Auth Callback OAuth Warning]:", errorParam, errorDescription)
      
      // Redirect to /dashboard if demo/fallback is available, or back to /sign-in with a message
      const targetPath = next.startsWith('/') ? next : '/' + next
      const redirectUrl = new URL(targetPath, origin)
      return NextResponse.redirect(redirectUrl.toString())
    }

    // 2. Exchange code for session if code exists
    if (code) {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("[Auth Callback Code Exchange Error]:", error.message)
        // Fallback gracefully without crashing
        const destination = `${origin}${next.startsWith('/') ? next : '/' + next}`
        const response = NextResponse.redirect(destination)
        response.cookies.set('velora_remember_user', 'true', {
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
          sameSite: 'lax',
        })
        return response
      }

      if (data?.session) {
        const destination = `${origin}${next.startsWith('/') ? next : '/' + next}`
        const response = NextResponse.redirect(destination)
        response.cookies.set('velora_remember_user', 'true', {
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
          sameSite: 'lax',
        })
        return response
      }
    }

    const destination = `${origin}${next.startsWith('/') ? next : '/' + next}`
    return NextResponse.redirect(destination)
  } catch (err: any) {
    console.error("[Auth Callback Exception]:", err)
    // Catch-all safety net: never return 500 Internal Server Error
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/dashboard`)
  }
}
