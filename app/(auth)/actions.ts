'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data?.session) {
    return { error: 'Unable to sign in. Please check your credentials and try again.' }
  }

  return { success: true, session: data.session, user: data.user }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data?.session) {
    return {
      success: false,
      message: 'Account created. Please check your email to confirm your account before signing in.',
    }
  }

  return { success: true, session: data.session, user: data.user }
}

export async function signInWithGoogle() {
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
        prompt: 'select_account' // Forces Google account chooser on re-login
      }
    },
  })

  if (error) {
    redirect(`/sign-in?message=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Clean up residual cookies to prevent auth token mismatch
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  for (const c of allCookies) {
    if (c.name.startsWith('sb-') || c.name.includes('auth-token')) {
      try {
        cookieStore.delete(c.name)
      } catch (e) {}
    }
  }

  redirect('/sign-in')
}
