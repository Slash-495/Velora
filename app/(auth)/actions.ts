'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

async function resolveOrigin(): Promise<string> {
  const headersList = await headers()
  const forwardedHost = headersList.get('x-forwarded-host')
  const host = forwardedHost || headersList.get('host')
  const forwardedProto = headersList.get('x-forwarded-proto')

  if (host) {
    const isLocalhost =
      host.startsWith('localhost') || host.startsWith('127.0.0.1')
    const protocol = forwardedProto || (isLocalhost ? 'http' : 'https')
    return `${protocol}://${host}`
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/+$/, '')
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  throw new Error(
    'Unable to determine site origin. Set NEXT_PUBLIC_SITE_URL in your environment.'
  )
}

export async function signIn(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() || ''
  const password = (formData.get('password') as string | null) || ''

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data?.session || !data?.user) {
      return {
        success: false,
        error: 'Unable to establish an authenticated session.',
      }
    }

    return {
      success: true,
      session: data.session,
      user: data.user,
      error: undefined,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sign-in failed.',
    }
  }
}

export async function signUp(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() || ''
  const password = (formData.get('password') as string | null) || ''

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  try {
    const supabase = await createClient()
    const origin = await resolveOrigin()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data?.user && !data?.session) {
      return {
        success: true,
        checkEmail: true,
        message:
          'Check your email to confirm your account before signing in.',
        error: undefined,
      }
    }

    if (!data?.session || !data?.user) {
      return {
        success: false,
        error: 'Sign-up failed to create an active session.',
      }
    }

    return {
      success: true,
      checkEmail: false,
      session: data.session,
      user: data.user,
      error: undefined,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Sign-up failed.',
    }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
