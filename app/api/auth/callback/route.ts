import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'
    const targetPath = next.startsWith('/') ? next : '/' + next

    if (code) {
      try {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)
      } catch (e) {
        console.warn("[Auth Callback Exchange Warning]:", e)
      }
    }

    const response = NextResponse.redirect(`${origin}${targetPath}`)
    response.cookies.set('velora_remember_user', 'true', {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
    return response
  } catch (err: any) {
    console.error("[Auth Callback Exception]:", err)
    const { origin } = new URL(request.url)
    const response = NextResponse.redirect(`${origin}/dashboard`)
    response.cookies.set('velora_remember_user', 'true', {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
    return response
  }
}
