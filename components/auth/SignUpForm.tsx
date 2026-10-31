"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/(auth)/actions";
import { Mail, Lock, ArrowRight } from "lucide-react";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const res = await signUp(formData);
      if (!res?.success || res?.error) {
        setError(res?.error || "Unable to create account.");
        setLoading(false);
        return;
      }

      if (res.checkEmail) {
        setInfoMessage(
          res.message || "Check your email to confirm your account before signing in."
        );
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to sign up.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col w-full justify-center gap-2 text-text-primary">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-2 text-center">
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      {infoMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-2 text-center">
          <p className="text-xs text-emerald-400 font-medium">{infoMessage}</p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary ml-1" htmlFor="email">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-white"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary ml-1" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-white"
            type="password"
            name="password"
            placeholder="Create a password"
            required
          />
        </div>
      </div>

      <button
        disabled={loading}
        className="btn-glow group w-full flex items-center justify-center mt-2 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? "Creating account..." : "Sign Up"}
        {!loading && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />}
      </button>
    </form>
  );
}
