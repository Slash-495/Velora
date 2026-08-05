import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("[Auth Callback Code Exchange Error]:", error)
    }
  }

  // Always redirect to /dashboard (or target next URL) after processing OAuth
  const destination = `${origin}${next.startsWith('/') ? next : '/' + next}`
  return NextResponse.redirect(destination)
}
