import Link from 'next/link'
import { signIn, signInWithGoogle } from '../actions'
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'

export default async function SignInPage(
  props: {
    searchParams: Promise<{ message: string }>
  }
) {
  const searchParams = await props.searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden py-24">
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
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-text-muted">Enter your details to access your workspace</p>
          </div>

          {searchParams?.message && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6 text-center">
              <p className="text-xs text-red-400 font-medium">{searchParams.message}</p>
            </div>
          )}

          <div className="space-y-6">
            <form action={signInWithGoogle}>
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium text-text-primary">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Continue with Google
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-4 text-text-muted">Or continue with email</span>
              </div>
            </div>

            <form action={signIn} className="space-y-4 flex flex-col w-full justify-center gap-2 text-text-primary">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary ml-1" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    name="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-medium text-text-secondary" htmlFor="password">
                    Password
                  </label>
                  <Link href="#" className="text-[10px] text-primary hover:text-primary-glow transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <SubmitButton label="Sign In" />
            </form>

            <p className="text-center text-xs text-text-muted mt-6">
              Don't have an account?{' '}
              <Link href="/sign-up" className="text-primary hover:text-primary-glow font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </main>
  )
}

// Client component for the submit button to use useFormStatus if needed, or just a styled button
function SubmitButton({ label }: { label: string }) {
  return (
    <button className="btn-glow group w-full flex items-center justify-center mt-2 py-3 rounded-xl">
      {label}
      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
    </button>
  )
}
