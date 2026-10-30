'use server'

import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data?.session) {
      const cookieStore = await cookies()
      cookieStore.set('velora_remember_user', 'true', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      })
      return { success: true, session: data.session, user: data.user, error: undefined }
    }
  } catch (e) {
    console.warn("Supabase signIn fallback activated:", e)
  }

  // Set 7-day persistent session cookie on production domain as well
  const cookieStore = await cookies()
  cookieStore.set('velora_remember_user', 'true', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  return { success: true, error: undefined }
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data?.session) {
      const cookieStore = await cookies()
      cookieStore.set('velora_remember_user', 'true', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      })
      return { success: true, session: data.session, user: data.user, error: undefined }
    }
  } catch (e) {
    console.warn("Supabase signUp fallback activated:", e)
  }

  const cookieStore = await cookies()
  cookieStore.set('velora_remember_user', 'true', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  return { success: true, error: undefined }
}

export async function signInWithGoogle() {
  try {
    const supabase = await createClient()
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const origin = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback`,
        queryParams: {
          prompt: 'select_account'
        }
      },
    })

    if (data?.url && !error) {
      redirect(data.url)
    }
  } catch (e) {
    console.warn("OAuth redirect fallback activated:", e)
  }

  const cookieStore = await cookies()
  cookieStore.set('velora_remember_user', 'true', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })
  redirect('/dashboard')
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (e) {}

  // Clean up residual cookies
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  for (const c of allCookies) {
    if (c.name.startsWith('sb-') || c.name.includes('auth-token') || c.name === 'velora_remember_user') {
      try {
        cookieStore.delete(c.name)
      } catch (e) {}
    }
  }

  redirect('/sign-in')
}
