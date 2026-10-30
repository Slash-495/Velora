import { createServerClient, type CookieOptions } from '@supabase/ssr'
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

  // Check if any Supabase auth cookies exist on the incoming request
  const allCookies = request.cookies.getAll()
  const hasSupabaseAuthCookie = allCookies.some(c => c.name.startsWith('sb-') || c.name.includes('auth-token') || c.name === 'velora_remember_user')

  const protectedRoutes = ['/dashboard', '/workspace', '/resume', '/applications', '/interview-prep', '/cover-letter']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  let user = null
  if (hasSupabaseAuthCookie) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, {
                  ...options,
                  maxAge: 60 * 60 * 24 * 7,
                  path: '/',
                  sameSite: 'lax',
                })
              )
            },
          },
        }
      )

      // Add a 2s timeout guard to prevent network stalls from hanging middleware
      const userPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) => 
        setTimeout(() => resolve({ data: { user: null } }), 2000)
      )
      const res = await Promise.race([userPromise, timeoutPromise])
      user = res.data.user
    } catch (e) {
      console.error("Middleware getUser error:", e)
    }
  }

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
    '/((?!_next/static|_next/image|favicon.ico|api/ping|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
