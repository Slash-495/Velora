import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthRedirectHandler } from '@/components/auth/AuthRedirectHandler'

export default async function SignUpPage(
  props: {
    searchParams: Promise<{ message: string }>
  }
) {
  const searchParams = await props.searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden py-24">
      <AuthRedirectHandler />
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -z-10" />

      <Container className="max-w-md relative z-10">
        <div className="card-premium p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Subtle inner top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-6 h-6 text-primary-glow" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Create an account</h1>
            <p className="text-sm text-text-muted">Start organizing your career journey today</p>
          </div>

          {searchParams?.message && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6 text-center">
              <p className="text-xs text-red-400 font-medium">{searchParams.message}</p>
            </div>
          )}

          <div className="space-y-6">
            <GoogleSignInButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-4 text-text-muted">Or continue with email</span>
              </div>
            </div>

            <SignUpForm />

            <p className="text-center text-xs text-text-muted mt-6">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary hover:text-primary-glow font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </main>
  )
}

