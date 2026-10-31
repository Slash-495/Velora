import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sanitizeNextPath } from '@/lib/auth-redirect'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const oauthError =
    searchParams.get('error_description') || searchParams.get('error')
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(oauthError)}`
    )
  }

  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent('Missing authorization code')}`
    )
  }

  const targetPath = sanitizeNextPath(searchParams.get('next'))

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(error.message || 'Authentication failed')}`
      )
    }

    return NextResponse.redirect(`${origin}${targetPath}`)
  } catch (err: any) {
    const message =
      err instanceof Error ? err.message : 'Authentication failed'
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(message)}`
    )
  }
}
