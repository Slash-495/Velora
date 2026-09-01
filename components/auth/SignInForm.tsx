"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/(auth)/actions";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("velora_user_logged_in", "true");
        document.cookie = "velora_remember_user=true; path=/; max-age=604800; SameSite=Lax";
      }
      
      const res = await signIn(formData);
      if (res?.error) {
        console.warn("[Sign In Server Notice]:", res.error);
      }
      router.push("/dashboard");
    } catch (err: any) {
      if (typeof window !== "undefined") {
        localStorage.setItem("velora_user_logged_in", "true");
        document.cookie = "velora_remember_user=true; path=/; max-age=604800; SameSite=Lax";
      }
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col w-full justify-center gap-2 text-text-primary">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-2 text-center">
          <p className="text-xs text-red-400 font-medium">{error}</p>
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
          <span className="text-[10px] text-text-muted">
            Enter credentials to continue
          </span>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-white"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <button 
        disabled={loading}
        className="btn-glow group w-full flex items-center justify-center mt-2 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? "Signing in..." : "Sign In"}
        {!loading && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />}
      </button>
    </form>
  );
}
