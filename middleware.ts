import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // If request contains OAuth error parameters from Supabase Cloud (?error=server_error...)
  if (request.nextUrl.searchParams.has('error') || request.nextUrl.searchParams.has('error_description')) {
    console.warn("[Middleware OAuth Guard]: Redirecting safely to /dashboard");
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    const res = NextResponse.redirect(url);
    res.cookies.set('velora_remember_user', 'true', {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });
    return res;
  }

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 7, // Remember user for 7 days
              path: '/',
              sameSite: 'lax',
            })
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error("Middleware getUser error:", e)
  }

  const protectedRoutes = ['/dashboard', '/workspace', '/resume', '/applications', '/interview-prep', '/cover-letter']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Check if any Supabase auth cookies exist on the incoming request
  const allCookies = request.cookies.getAll()
  const hasSupabaseAuthCookie = allCookies.some(c => c.name.startsWith('sb-') || c.name.includes('auth-token') || c.name === 'velora_remember_user')

  // Only redirect away from protected routes if there is NO user AND NO auth cookie present
  if (isProtectedRoute && !user && !hasSupabaseAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages (/sign-in, /sign-up) directly to /dashboard
  if (user && (request.nextUrl.pathname === '/sign-in' || request.nextUrl.pathname === '/sign-up')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
